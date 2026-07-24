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
    rank, titleOriginal, titleArabic, author, publisher, coverImage, description, trend, weeksOnList, listCategory, listPublishedDate
  }`,

  bannedBookEntries: /* groq */ `*[_type == "bannedBookEntry"] | order(featured desc, year asc){
    "id": slug.current, bookTitle, year, country, coverImage, summary, officialReason, featured
  }`,
  bannedBookBySlug: /* groq */ `*[_type == "bannedBookEntry" && slug.current == $slug][0]{
    "id": slug.current, bookTitle, author, year, country, coverImage, summary, officialReason, featured, body
  }`,

  // Dedicated to the redesigned /banned-books/ listing page — deliberately
  // separate from bannedBookEntries above rather than modifying it in
  // place, since that query is also relied on by [slug].astro (its
  // getStaticPaths and "others" sidebar), which expects a different field
  // shape (id aliased from slug.current, no author/subtitle). Changing it
  // in place would've silently broken that page.
  bannedBookArchive: /* groq */ `*[_type == "bannedBookEntry" && defined(slug.current)] | order(_createdAt desc){
    _id, bookTitle, slug, author, subtitle, country, year, summary, coverImage, _createdAt
  }`,

  siteSettings: /* groq */ `*[_type == "siteSettings"][0]{ bestsellersWeekOf }`,

  // Homepage section strips — latest 3 per type, newest-created first
  // (_createdAt, not publishedAt like the rest of the site's list queries:
  // this is meant to surface what an editor just added, which _createdAt
  // reflects immediately regardless of what publishedAt was backdated to).
  // coverImage is aliased per type so index.astro can treat all three
  // uniformly instead of branching on portraitImage vs coverImage.
  homeInterviews: /* groq */ `*[_type == "interview" && defined(slug.current)] | order(_createdAt desc)[0...3]{
    _id, title, slug, author, subtitle, "coverImage": portraitImage, guestRole, publishedAt
  }`,
  homeLongReads: /* groq */ `*[_type == "longRead" && defined(slug.current)] | order(_createdAt desc)[0...3]{
    _id, title, slug, author, subtitle, coverImage, dek, publishedAt
  }`,
  homeBannedBooks: /* groq */ `*[_type == "bannedBookEntry" && defined(slug.current)] | order(_createdAt desc)[0...3]{
    _id, bookTitle, slug, author, subtitle, coverImage, year, country
  }`,

  // Homepage-only "الأكثر مبيعًا" strip — curates nonfiction before fiction
  // (per section design), capped at 5, requiring titleArabic since an
  // untranslated entry (see bestsellerEntry's "بانتظار الترجمة" fieldset)
  // has no fallback title to show on a card this small. Deliberately a new
  // query rather than reusing bestsellerEntries (bestsellers.astro), which
  // needs every entry across all categories, unfiltered by translation
  // status, for its own tab-filtered full list.
  homeBestsellers: /* groq */ `*[_type == "bestsellerEntry" && defined(titleArabic)] | order(
    (listCategory == "غير روائي") desc,
    (listCategory == "روايات") desc,
    rank asc
  )[0...5]{
    _id, titleArabic, author, publisher, rank, listCategory, trend, coverImage
  }`,

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
