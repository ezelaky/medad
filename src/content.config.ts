import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// These collections mirror the five Sanity document types (plus a siteSettings
// singleton) defined in the migration brief, field-for-field. Once the Sanity
// project exists, src/lib/sanity.ts's GROQ queries return data shaped the same
// way, so pages built against these collections swap over with minimal changes.
//
// Image fields are plain string paths into /public rather than Astro's image()
// helper: most cards in the current prototype are unfilled gradient placeholders
// (no real photo), so images stay optional and components fall back to the
// placeholder look when absent — matching the source HTML exactly.

const article = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/article' }),
  schema: z.object({
    title: z.string(),
    coverImage: z.string().optional(),
    excerpt: z.string(),
    category: z.string(),
    publishedAt: z.coerce.date(),
    featured: z.boolean().default(false),
  }),
});

const interview = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/interview' }),
  schema: z.object({
    title: z.string(),
    guestName: z.string(),
    guestRole: z.string(),
    portraitImage: z.string().optional(),
    excerpt: z.string(),
    publishedAt: z.coerce.date(),
    featured: z.boolean().default(false),
  }),
});

const longRead = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/longRead' }),
  schema: z.object({
    title: z.string(),
    dek: z.string(),
    coverImage: z.string().optional(),
    author: z.string().default('فريق التحرير'),
    readingTime: z.string(),
    tags: z.array(z.string()).default([]),
    publishedAt: z.coerce.date(),
  }),
});

const bestsellerEntry = defineCollection({
  loader: file('./src/content/bestsellerEntry.json'),
  schema: z.object({
    rank: z.number(),
    titleOriginal: z.string(),
    titleArabic: z.string().optional(),
    author: z.string(),
    publisher: z.string(),
    coverImage: z.string().optional(),
    descriptionSource: z.string().optional(),
    description: z.string().optional(),
    trend: z.enum(['new', 'up', 'down', 'same']),
    weeksOnList: z.string(),
    listCategory: z.enum(['روايات', 'غير روائي', 'الأكثر مبيعًا للشباب']),
  }),
});

const bannedBookEntry = defineCollection({
  loader: file('./src/content/bannedBookEntry.json'),
  schema: z.object({
    bookTitle: z.string(),
    year: z.string(),
    country: z.string(),
    coverImage: z.string().optional(),
    summary: z.string(),
    officialReason: z.string(),
    featured: z.boolean().default(false),
  }),
});

// site-wide setting, e.g. bestsellers' shared "weekOf" — a singleton rather
// than a per-entry field, so every entry in a week can't show conflicting dates
const siteSettings = defineCollection({
  loader: file('./src/content/siteSettings.json'),
  schema: z.object({
    id: z.literal('singleton'),
    bestsellersWeekOf: z.string(),
  }),
});

export const collections = { article, interview, longRead, bestsellerEntry, bannedBookEntry, siteSettings };
