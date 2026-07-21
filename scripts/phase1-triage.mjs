// Daily RSS triage. Run by .github/workflows/phase1-triage.yml on a cron
// schedule; safe to run manually too (`npm run triage:sources`).
//
// What it does, per sources.config.json:
//   1. Fetches and parses every `active: true` source's RSS feed.
//   2. Dedupes against existing contentInboxItem docs by `guid` (one batch
//      query up front, not one query per feed item).
//   3. Per section, sorts the surviving new items newest-first and keeps
//      up to that section's `daily_quota`.
//   4. Creates a contentInboxItem for each with status: 'pending'.
//
// A feed that fails to fetch/parse is logged and skipped — it does not
// fail the run. sources.config.json itself being unreadable, or the
// Sanity client failing outright, are treated as real failures (those
// aren't "one bad source", they mean the whole run can't do anything).
//
// Required env vars: SANITY_API_TOKEN.
// Optional (defaults match the project's public Sanity config):
//   SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Parser from 'rss-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '..', 'sources.config.json');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const SANITY_API_TOKEN = requireEnv('SANITY_API_TOKEN');
const projectId = process.env.SANITY_PROJECT_ID || '2qrc7n7a';
const dataset = process.env.SANITY_DATASET || 'production';
const apiVersion = process.env.SANITY_API_VERSION || '2026-01-01';

const client = createClient({ projectId, dataset, apiVersion, token: SANITY_API_TOKEN, useCdn: false });
const rssParser = new Parser();

function loadConfig() {
  const raw = readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

// guid falls back to link when a feed omits <guid> — still a stable,
// unique-enough dedup key for that item.
function itemGuid(feedItem) {
  return feedItem.guid || feedItem.id || feedItem.link;
}

function itemPublishedDate(feedItem) {
  const raw = feedItem.isoDate || feedItem.pubDate;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function fetchSourceItems(source) {
  const feed = await rssParser.parseURL(source.feed);
  return (feed.items || []).map((feedItem) => {
    const publishedDate = itemPublishedDate(feedItem);
    return {
      source,
      title: feedItem.title || '(بلا عنوان)',
      sourceUrl: feedItem.link,
      guid: itemGuid(feedItem),
      excerpt: feedItem.contentSnippet || feedItem.summary || feedItem.content || '',
      publishedDate,
    };
  });
}

async function fetchAllSources(sources) {
  const allItems = [];
  const feedErrors = [];
  for (const source of sources) {
    try {
      const items = await fetchSourceItems(source);
      console.log(`  ${source.name}: ${items.length} items in feed`);
      allItems.push(...items);
    } catch (err) {
      console.error(`  ✗ ${source.name} (${source.feed}) failed to fetch/parse: ${err.message}`);
      feedErrors.push({ source, error: err });
    }
  }
  return { allItems, feedErrors };
}

async function findExistingGuids(guids) {
  if (guids.length === 0) return new Set();
  const existing = await client.fetch(
    `*[_type == "contentInboxItem" && guid in $guids].guid`,
    { guids }
  );
  return new Set(existing);
}

function selectPerSection(items, sections) {
  const bySection = new Map();
  for (const item of items) {
    const key = item.source.section;
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key).push(item);
  }

  const selected = [];
  for (const [sectionKey, sectionConfig] of Object.entries(sections)) {
    const candidates = (bySection.get(sectionKey) || []).sort(
      (a, b) => (b.publishedDate?.getTime() ?? 0) - (a.publishedDate?.getTime() ?? 0)
    );
    selected.push(...candidates.slice(0, sectionConfig.daily_quota));
  }
  return selected;
}

async function createInboxItem(item) {
  return client.create({
    _type: 'contentInboxItem',
    title: item.title,
    sourceName: item.source.name,
    sourceUrl: item.sourceUrl,
    section: item.source.section,
    excerpt: item.excerpt,
    guid: item.guid,
    originalPublishedAt: item.publishedDate ? item.publishedDate.toISOString() : null,
    fetchedAt: new Date().toISOString(),
    status: 'pending',
  });
}

async function run() {
  const config = loadConfig();
  const activeSources = config.sources.filter((s) => s.active);
  console.log(`Fetching ${activeSources.length} active source(s)...`);

  const { allItems, feedErrors } = await fetchAllSources(activeSources);
  console.log(`Fetched ${allItems.length} total items across all feeds (${feedErrors.length} feed(s) failed).`);

  const candidateItems = allItems.filter((i) => i.guid && i.sourceUrl);
  const existingGuids = await findExistingGuids(candidateItems.map((i) => i.guid));
  const newItems = candidateItems.filter((i) => !existingGuids.has(i.guid));
  console.log(`${candidateItems.length - newItems.length} already in the inbox, ${newItems.length} new candidate(s).`);

  const selected = selectPerSection(newItems, config.sections);

  const perSectionCounts = {};
  let created = 0;
  const createErrors = [];
  for (const item of selected) {
    try {
      const doc = await createInboxItem(item);
      created++;
      perSectionCounts[item.source.section] = (perSectionCounts[item.source.section] || 0) + 1;
      console.log(`  ✓ [${item.source.section}] "${item.title}" (${item.source.name}) -> ${doc._id}`);
    } catch (err) {
      console.error(`  ✗ [${item.source.section}] "${item.title}": ${err.message}`);
      createErrors.push({ item, error: err });
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Sources checked: ${activeSources.length} (${feedErrors.length} failed to fetch)`);
  console.log(`Items checked: ${allItems.length}`);
  console.log(`Items created: ${created}`);
  for (const [sectionKey, sectionConfig] of Object.entries(config.sections)) {
    console.log(`  ${sectionConfig.label} (${sectionKey}): ${perSectionCounts[sectionKey] || 0}/${sectionConfig.daily_quota}`);
  }
  if (feedErrors.length > 0) {
    console.log(`Feed failures (non-fatal): ${feedErrors.map((f) => f.source.name).join(', ')}`);
  }

  // Per the spec, a feed failing to fetch must not fail the whole run.
  // Failing to *create* a selected document is a different, more
  // actionable problem (bad Sanity connectivity/permissions), so that
  // still surfaces as a failed run.
  if (createErrors.length > 0) {
    console.error(`${createErrors.length} item(s) failed to create — see errors above.`);
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('Triage failed:', err.message);
  process.exitCode = 1;
});
