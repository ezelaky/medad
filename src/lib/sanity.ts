import { createClient, type SanityClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION || '2026-01-01';

export const sanityConfigured = Boolean(projectId);

// useCdn: false is deliberate — these queries only ever run at build time
// (static site, no client-side fetching), so there's no traffic volume to
// justify the CDN cache, and its ~couple-minute staleness window meant a
// fresh Cloudflare rebuild could still serve pre-publish data. The built
// HTML is the actual cache visitors hit; the build itself needs live data.
export const client: SanityClient | null = sanityConfigured
  ? createClient({ projectId, dataset, apiVersion, useCdn: false })
  : null;

const builder = client ? createImageUrlBuilder(client) : null;
export function urlFor(source: unknown) {
  if (!builder) throw new Error('Sanity is not configured — set PUBLIC_SANITY_PROJECT_ID in .env');
  return builder.image(source as never);
}

// Convenience wrapper for the common case: a possibly-empty Sanity image
// field (author hasn't uploaded one yet) resolved straight to a URL string.
export function imageUrl(source: unknown, width?: number): string | undefined {
  if (!source) return undefined;
  const b = width ? urlFor(source).width(width) : urlFor(source);
  return b.url();
}

// --- GROQ queries, one per content collection in src/content.config.ts ---

export const queries = {
  articles: /* groq */ `*[_type == "article"] | order(publishedAt desc){
    "id": slug.current, title, coverImage, excerpt, category, publishedAt
  }`,
  articleBySlug: /* groq */ `*[_type == "article" && slug.current == $slug][0]{
    "id": slug.current, title, coverImage, excerpt, body, category, publishedAt
  }`,

  interviews: /* groq */ `*[_type == "interview"] | order(publishedAt desc){
    "id": slug.current, title, guestName, guestRole, portraitImage, excerpt, publishedAt, featured
  }`,
  interviewBySlug: /* groq */ `*[_type == "interview" && slug.current == $slug][0]{
    "id": slug.current, title, guestName, guestRole, portraitImage, excerpt, body, publishedAt, featured
  }`,

  longReads: /* groq */ `*[_type == "longRead"] | order(publishedAt desc){
    "id": slug.current, title, dek, coverImage, author, readingTime, tags, publishedAt
  }`,
  longReadBySlug: /* groq */ `*[_type == "longRead" && slug.current == $slug][0]{
    "id": slug.current, title, dek, coverImage, body, author, readingTime, tags, publishedAt
  }`,

  // descriptionSource is deliberately excluded — it's NYT's original English
  // description, kept only as reference text for the translator inside the
  // Studio, never rendered on the live site.
  bestsellerEntries: /* groq */ `*[_type == "bestsellerEntry" && !(_id in path("drafts.**"))] | order(rank asc){
    rank, titleOriginal, titleArabic, author, publisher, coverImage, description, trend, weeksOnList, listCategory
  }`,

  bannedBookEntries: /* groq */ `*[_type == "bannedBookEntry"] | order(featured desc, year asc){
    "id": slug.current, bookTitle, year, country, coverImage, summary, officialReason, featured
  }`,
  bannedBookBySlug: /* groq */ `*[_type == "bannedBookEntry" && slug.current == $slug][0]{
    "id": slug.current, bookTitle, year, country, coverImage, summary, officialReason, featured
  }`,

  siteSettings: /* groq */ `*[_type == "siteSettings"][0]{ bestsellersWeekOf }`,

  // Each heroItems entry is {content, scrimStrength} — content resolves to
  // whichever of the 4 types it references; _type discriminates it in
  // index.astro, which maps each type to its own title/excerpt/image field
  // names and route prefix. scrimStrength stays alongside, per slide.
  homepage: /* groq */ `*[_type == "homepage"][0]{
    heroItems[]{
      scrimStrength,
      content->{
        _type,
        "id": slug.current,
        title,
        bookTitle,
        excerpt,
        dek,
        summary,
        coverImage,
        portraitImage,
        publishedAt
      }
    }
  }`,
};
