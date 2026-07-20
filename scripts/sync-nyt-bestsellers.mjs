// Weekly NYT Books API -> Sanity sync. Run by .github/workflows/sync-bestsellers.yml
// on a cron schedule; safe to run manually too (`npm run sync:bestsellers`).
//
// What it does:
//   1. Fetches the overview endpoint (one request — covers all lists, well
//      under NYT's 1,000 requests/day limit).
//   2. Takes the top 5 of each of the three target lists, computes `trend`
//      from rank vs. rank_last_week.
//   3. Uploads each cover image into Sanity's own asset store (not linked
//      externally, so the site stays consistent with how every other image
//      is served).
//   4. Creates each entry as an UNPUBLISHED DRAFT with everything filled in
//      except titleArabic/description — those are deliberately left empty
//      for a human to translate in Studio before publishing.
//
// This script never touches, updates, or deletes existing documents — it
// only ever creates new drafts — so last week's published list keeps
// showing on the live site untouched until someone manually publishes
// this week's drafts. descriptionSource (NYT's original English text) is
// stored for the translator's reference only; src/lib/sanity.ts's public
// query deliberately excludes it from anything rendered on the site.
//
// Required env vars: NYT_API_KEY, SANITY_API_TOKEN.
// Optional (defaults match the project's public Sanity config):
//   SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION

import { createClient } from '@sanity/client';
import { randomUUID } from 'node:crypto';

const NYT_API_KEY = requireEnv('NYT_API_KEY');
const SANITY_API_TOKEN = requireEnv('SANITY_API_TOKEN');

const projectId = process.env.SANITY_PROJECT_ID || '2qrc7n7a';
const dataset = process.env.SANITY_DATASET || 'production';
const apiVersion = process.env.SANITY_API_VERSION || '2026-01-01';

// list_name_encoded -> Studio listCategory value. Confirmed against the
// live /lists/overview.json response on 2026-07-20 — the children's list
// NYT currently runs is "childrens-middle-grade-hardcover" (the old
// "chapter-books" list referenced in some docs was discontinued in 2012).
const TARGET_LISTS = {
  'combined-print-and-e-book-fiction': 'روايات',
  'combined-print-and-e-book-nonfiction': 'غير روائي',
  'childrens-middle-grade-hardcover': 'الأكثر مبيعًا للشباب',
};

const client = createClient({ projectId, dataset, apiVersion, token: SANITY_API_TOKEN, useCdn: false });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function computeTrend(rank, rankLastWeek) {
  if (rankLastWeek === 0 || rankLastWeek == null) return 'new';
  if (rank < rankLastWeek) return 'up';
  if (rank > rankLastWeek) return 'down';
  return 'same';
}

async function fetchOverview() {
  const res = await fetch(`https://api.nytimes.com/svc/books/v3/lists/overview.json?api-key=${NYT_API_KEY}`);
  if (!res.ok) throw new Error(`NYT API request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

function extractEntries(overview) {
  // Same published_date on every entry in this run — it's what distinguishes
  // one week's batch of 15 from the next in the Studio (see listPublishedDate
  // in bestsellerEntry.ts). NYT's docs put new lists live "Wednesday around
  // 7pm ET"; the workflow's cron is scheduled well after that, so this is
  // always that week's just-published date, not a stale one.
  const listPublishedDate = overview.results.published_date;
  if (!listPublishedDate) {
    throw new Error('NYT overview response is missing results.published_date — cannot label this batch.');
  }

  const entries = [];
  for (const [encoded, listCategory] of Object.entries(TARGET_LISTS)) {
    const list = overview.results.lists.find((l) => l.list_name_encoded === encoded);
    if (!list) {
      throw new Error(`List "${encoded}" not found in NYT overview response — list name may have changed. Check /lists/overview.json's list_name_encoded values.`);
    }
    for (const b of list.books.slice(0, 5)) {
      entries.push({
        listCategory,
        listPublishedDate,
        rank: b.rank,
        titleOriginal: b.title,
        author: b.author,
        publisher: b.publisher,
        book_image: b.book_image,
        weeksOnList: String(b.weeks_on_list),
        trend: computeTrend(b.rank, b.rank_last_week),
        descriptionSource: b.description,
      });
    }
  }
  return entries;
}

async function uploadCover(url, label) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`cover fetch failed (${res.status}) for ${label}: ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = url.split('/').pop() || `${label}.jpg`;
  return client.assets.upload('image', buffer, { filename });
}

async function createDraft(entry) {
  const asset = await uploadCover(entry.book_image, entry.titleOriginal);
  return client.create({
    _id: `drafts.${randomUUID()}`,
    _type: 'bestsellerEntry',
    listPublishedDate: entry.listPublishedDate,
    rank: entry.rank,
    titleOriginal: entry.titleOriginal,
    author: entry.author,
    publisher: entry.publisher,
    coverImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
    descriptionSource: entry.descriptionSource,
    trend: entry.trend,
    weeksOnList: entry.weeksOnList,
    listCategory: entry.listCategory,
  });
}

async function run() {
  const overview = await fetchOverview();
  const entries = extractEntries(overview);
  console.log(`Fetched ${entries.length} entries across ${Object.keys(TARGET_LISTS).length} lists.`);

  const failures = [];
  for (const entry of entries) {
    try {
      const doc = await createDraft(entry);
      console.log(`✓ ${entry.listCategory} #${entry.rank} "${entry.titleOriginal}" -> ${doc._id}`);
    } catch (err) {
      console.error(`✗ ${entry.listCategory} #${entry.rank} "${entry.titleOriginal}": ${err.message}`);
      failures.push(entry);
    }
  }

  console.log(`\nDone: ${entries.length - failures.length}/${entries.length} drafts created.`);
  if (failures.length > 0) {
    console.error(`${failures.length} entr${failures.length === 1 ? 'y' : 'ies'} failed — see errors above.`);
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('Sync failed:', err.message);
  process.exitCode = 1;
});
