// Shared inline Portable Text block, used inside the body/content array
// field of interview, longRead, and bannedBookEntry. Originally defined
// only inside longRead.ts; extracted here so all three document types use
// the exact same block definition instead of copy-pasted duplicates that
// could drift apart. Rendering is keyed on `_type: 'pullQuote'` in
// src/lib/portableText.ts and mirrored by src/components/PullQuote.astro
// — both match on this block's `name`, not on which document type embeds
// it, so no renderer changes are needed for the new usages.
export const pullQuote = {
  name: 'pullQuote',
  title: 'اقتباس بارز',
  type: 'object',
  fields: [
    { name: 'quote', title: 'نص الاقتباس', type: 'text', rows: 3 },
    { name: 'attribution', title: 'المصدر', type: 'string' },
  ],
  preview: { select: { title: 'quote' } },
};
