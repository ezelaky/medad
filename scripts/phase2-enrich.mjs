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
// If the fetch/extraction fails, no draft is created — instead the inbox
// item gets enrichmentError: true so the editor can see it needs manual
// attention (open sourceUrl themselves) instead of the failure being
// silent. Unlike Phase 1 (many independent sources, one bad one is
// expected occasionally), this run *is* the one item it was asked to
// process, so a failure here means the run's whole purpose failed —
// it exits non-zero.
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

function extractArticleText(html) {
  const root = parseHtml(html);
  root.querySelectorAll(NOISE_SELECTORS).forEach((el) => el.remove());

  let contentEl = null;
  for (const selector of CONTENT_SELECTORS) {
    contentEl = root.querySelector(selector);
    if (contentEl) break;
  }
  if (!contentEl) contentEl = root;

  const blocks = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
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
  // indefinitely, so this needs its own explicit bound.
  const res = await fetch(inboxItem.sourceUrl, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`sourceUrl fetch failed: ${res.status} ${res.statusText}`);
  const html = await res.text();
  const originalContent = extractArticleText(html);

  const draft = await client.create({
    _id: `drafts.${randomUUID()}`,
    _type: sectionConfig.sanity_type,
    titleOriginal: inboxItem.title,
    sourceName: inboxItem.sourceName,
    sourceUrl: inboxItem.sourceUrl,
    originalPublishedAt: inboxItem.originalPublishedAt,
    originalContent,
    // All Arabic-facing fields (title, dek/excerpt, body, slug, etc.) are
    // intentionally left unset — the editor fills those in from
    // originalContent before publishing.
  });

  await client.patch(DOCUMENT_ID).set({ enrichedAt: new Date().toISOString() }).commit();

  console.log(`Created draft ${draft._id}`);
}

run().catch(async (err) => {
  console.error('Enrichment failed:', err.message);
  try {
    await client.patch(DOCUMENT_ID).set({ enrichmentError: true }).commit();
  } catch (patchErr) {
    console.error(`Additionally failed to flag enrichmentError on ${DOCUMENT_ID}: ${patchErr.message}`);
  }
  process.exitCode = 1;
});
