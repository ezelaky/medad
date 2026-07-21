// Enriches one approved contentInboxItem into a real longRead/interview
// draft. Triggered by .github/workflows/phase2-enrich.yml's
// repository_dispatch, fired by a Sanity webhook — see that file's header
// comment for the manual webhook setup. Safe to run manually too
// (`DOCUMENT_ID=<id> npm run enrich:item`).
//
// What it does:
//   1. Fetches the contentInboxItem doc by ID.
//   2. Fetches sourceUrl's HTML and extracts the article body (headings +
//      paragraphs, from the first matching content selector), capped at
//      3000 words.
//   3. Creates a DRAFT of the type sources.config.json maps the item's
//      section to (longRead or interview) — titleOriginal/sourceUrl/
//      sourceName/originalPublishedAt/originalContent filled in, every
//      Arabic-facing field left empty for the editor to translate. This
//      draft is never published automatically.
//   4. Stamps enrichedAt on the inbox item to confirm this ran.
//
// If sourceUrl responds but blocks the fetch (403/401/etc — many sites
// reject Node's default fetch User-Agent, which is why a browser-like one
// is sent below), the run does NOT fail: it creates the draft anyway from
// whatever the inbox item already has (title, sourceUrl, sourceName,
// excerpt, originalPublishedAt), using the RSS excerpt as originalContent
// and flagging fetchBlocked: true so the editor knows to open sourceUrl
// themselves. A partial draft is more useful than no draft.
//
// A harder failure — the document not found, an unknown section, or the
// fetch throwing outright (DNS failure, timeout, etc., as opposed to a
// real-but-unhappy HTTP response) — still sets enrichmentError: true and
// exits non-zero, since those aren't something a partial draft can paper
// over.
//
// Required env vars: SANITY_API_TOKEN, DOCUMENT_ID.
// Optional (defaults match the project's public Sanity config):
//   SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION

import { createClient } from '@sanity/client';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseHtml } from 'node-html-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '..', 'sources.config.json');

const MAX_WORDS = 3000;
const CONTENT_SELECTORS = ['article', '[class*="content"]', '[class*="entry"]', 'main'];
const NOISE_SELECTORS = 'nav, header, footer, aside, script, style';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const SANITY_API_TOKEN = requireEnv('SANITY_API_TOKEN');
const DOCUMENT_ID = requireEnv('DOCUMENT_ID');
const projectId = process.env.SANITY_PROJECT_ID || '2qrc7n7a';
const dataset = process.env.SANITY_DATASET || 'production';
const apiVersion = process.env.SANITY_API_VERSION || '2026-01-01';

const client = createClient({ projectId, dataset, apiVersion, token: SANITY_API_TOKEN, useCdn: false });

function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

const CONTENT_BLOCKS_SELECTOR = 'h1, h2, h3, h4, h5, h6, p';

function countContentBlocks(el) {
  return el.querySelectorAll(CONTENT_BLOCKS_SELECTOR).length;
}

// Verified live against lithub.com: `[class*="content"]` alone matched 10
// different elements on the page (title-bar-wrapper.top-content,
// site-content, main-content-well, ...) — plain querySelector() just
// returns the first one in document order, which turned out to be a
// zero-paragraph header widget, not the 24-paragraph article body several
// levels deeper. So within each selector (tried in the given priority
// order), this picks whichever match actually has the most content
// blocks, instead of trusting DOM order to mean anything.
function extractArticleText(html) {
  const root = parseHtml(html);
  root.querySelectorAll(NOISE_SELECTORS).forEach((el) => el.remove());

  let contentEl = null;
  for (const selector of CONTENT_SELECTORS) {
    const candidates = root.querySelectorAll(selector);
    if (candidates.length === 0) continue;
    const best = candidates.reduce((a, b) => (countContentBlocks(b) > countContentBlocks(a) ? b : a));
    if (countContentBlocks(best) > 0) {
      contentEl = best;
      break;
    }
  }
  if (!contentEl) contentEl = root;

  const blocks = contentEl.querySelectorAll(CONTENT_BLOCKS_SELECTOR);
  const text = blocks
    .map((el) => el.text.trim())
    .filter(Boolean)
    .join('\n\n');

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= MAX_WORDS) return text;
  return words.slice(0, MAX_WORDS).join(' ') + '…';
}

async function run() {
  const config = loadConfig();

  const inboxItem = await client.getDocument(DOCUMENT_ID);
  if (!inboxItem) throw new Error(`contentInboxItem ${DOCUMENT_ID} not found`);

  const sectionConfig = config.sections[inboxItem.section];
  if (!sectionConfig) {
    throw new Error(`Unknown section "${inboxItem.section}" on ${DOCUMENT_ID} — not in sources.config.json`);
  }

  console.log(`Enriching "${inboxItem.title}" (${inboxItem.sourceName}) -> ${sectionConfig.sanity_type} draft`);

  // Node's fetch has no default timeout at all (unlike rss-parser's 60s
  // default, which already caused one workflow_dispatch run to sit for
  // several minutes fetching six feeds sequentially — see phase1-triage.mjs).
  // A source site that hangs here would otherwise block this run
  // indefinitely, so this needs its own explicit bound. The User-Agent is
  // set because several sites block Node's default fetch UA outright but
  // allow a browser-like one.
  const res = await fetch(inboxItem.sourceUrl, {
    signal: AbortSignal.timeout(20000),
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  let originalContent;
  let fetchBlocked = false;
  if (res.ok) {
    const html = await res.text();
    originalContent = extractArticleText(html);
  } else {
    console.warn(`Content fetch blocked for ${inboxItem.sourceName} (${res.status} ${res.statusText}), creating draft with excerpt only`);
    originalContent = inboxItem.excerpt || '';
    fetchBlocked = true;
  }

  const draft = await client.create({
    _id: `drafts.${randomUUID()}`,
    _type: sectionConfig.sanity_type,
    titleOriginal: inboxItem.title,
    sourceName: inboxItem.sourceName,
    sourceUrl: inboxItem.sourceUrl,
    originalPublishedAt: inboxItem.originalPublishedAt,
    originalContent,
    fetchBlocked,
    // All Arabic-facing fields (title, dek/excerpt, body, slug, etc.) are
    // intentionally left unset — the editor fills those in from
    // originalContent before publishing.
  });

  await client.patch(DOCUMENT_ID).set({ enrichedAt: new Date().toISOString() }).commit();

  console.log(`Created draft ${draft._id}${fetchBlocked ? ' (fetchBlocked — excerpt only)' : ''}`);
}

run()
  .catch(async (err) => {
    console.error('Enrichment failed:', err.message);
    try {
      await client.patch(DOCUMENT_ID).set({ enrichmentError: true }).commit();
    } catch (patchErr) {
      console.error(`Additionally failed to flag enrichmentError on ${DOCUMENT_ID}: ${patchErr.message}`);
    }
    process.exitCode = 1;
  })
  .finally(() => {
    // Same dangling-keep-alive-socket issue observed live in
    // phase1-triage.mjs — see its matching comment. Same fix here.
    process.exit(process.exitCode ?? 0);
  });
