# مِداد — Astro + Sanity + Cloudflare Pages

Migrated from the static HTML prototype in `Book_Site/`. Visual output matches
the original exactly; content now lives in Astro content collections
(`src/content/`) shaped to match the Sanity schema in `sanity/schemaTypes/`,
so switching a page from local content to live Sanity queries is a small,
mechanical change.

## Project structure

```
src/
  layouts/BaseLayout.astro     header, nav, search/menu panels, footer, tab-bar
  components/                  ArticleCard, InterviewCard, BookCoverCard,
                                RedactedVerdict, PullQuote, InlineFigure
  content.config.ts            collection schemas (mirror sanity/schemaTypes)
  content/                     seeded placeholder content (from the prototype)
  pages/                       index, news/, interviews/, reads/, bestsellers,
                                banned-books/, about/, contact/
  lib/sanity.ts                Sanity client + GROQ queries (dormant until configured)
  lib/portableText.ts          Portable Text → HTML renderer for longRead.body
sanity/
  schemaTypes/                 the 5 document types + siteSettings singleton
  structure.ts                 desk structure (pins siteSettings as a singleton)
sanity.config.ts                embedded Studio config, mounts at /studio
```

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | local dev server at `localhost:4321` |
| `npm run build` | production build to `./dist/` |
| `npm run preview` | preview the production build |

## What's done

- Full pixel-for-pixel port of all six original pages, plus the new individual
  entry pages the brief asked for (`news/[slug]`, `interviews/[slug]`,
  `reads/[slug]`, `banned-books/[slug]`), a `reads/` listing page, and simple
  `/about/` and `/contact/` pages.
- The RedactedVerdict click-to-reveal animation is ported exactly (same CSS
  transition, same class-toggle behavior).
- Content collections seeded with the prototype's placeholder content,
  field-for-field matching the Sanity schema.
- Sanity schema, embedded Studio config (`/studio`), desk structure, and a
  typed GROQ query layer are all written and ready — but **dormant**: without
  a real `PUBLIC_SANITY_PROJECT_ID`, `/studio` doesn't mount and pages keep
  reading from `src/content/`. This was a deliberate choice so the build never
  breaks waiting on credentials only you can create.

## What's left (needs your accounts — can't be done for you)

1. **Create the Sanity project.**
   ```
   npm run sanity:login   # opens a browser OAuth flow
   npm run sanity:init    # creates the project, writes PUBLIC_SANITY_* to .env
   ```
   Copy `.env.example` to `.env` first if `sanity:init` doesn't do it for you.
   Once `PUBLIC_SANITY_PROJECT_ID` is set, `npm run dev` will mount the Studio
   at `/studio` automatically (see the `sanityConfigured` check in
   `astro.config.mjs`).

2. **Migrate placeholder content into Sanity.** The content in `src/content/`
   is the same placeholder content that was in the six original HTML files
   (`عنوان الكتاب الأول`, `اسم الضيف`, etc.) — re-enter it as real Sanity
   documents through the Studio, replacing placeholders with real
   editorial content as it becomes available.

3. **Wire pages to Sanity.** Each page in `src/pages/` currently calls
   `getCollection(...)` from `astro:content`. Swap those calls for the
   matching query in `src/lib/sanity.ts` (`queries.articles`,
   `queries.interviewBySlug`, etc.) — field names match exactly, so this is
   mostly a search-and-replace per page, not a rewrite.

4. **Push to GitHub, connect to Cloudflare Pages** (Git integration, not
   Direct Upload — build command `astro build`, output `dist/`). Add a Sanity
   webhook → Cloudflare Pages Deploy Hook so publishing in Studio triggers a
   rebuild.

5. **Editor onboarding** for the two editors: create their Sanity Studio
   accounts, walk them through creating a خبر / حوار / entry and publishing.
