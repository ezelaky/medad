// Shared inline Portable Text block, used inside the body/content array
// field of longRead and bannedBookEntry. Originally defined only inside
// longRead.ts; extracted here for the same reason pullQuote.ts was —
// so both document types use the exact same block instead of copy-pasted
// duplicates. Rendering is keyed on `_type: 'inlineFigure'` in
// src/lib/portableText.ts, matched by block name rather than which
// document type embeds it, so no renderer changes were needed for the
// new bannedBookEntry usage beyond adding the `alt` field below.
export const inlineFigure = {
  name: 'inlineFigure',
  title: 'صورة داخل النص',
  type: 'object',
  fields: [
    { name: 'image', title: 'الصورة', type: 'image', options: { hotspot: true } },
    { name: 'caption', title: 'وصف الصورة', type: 'string' },
    { name: 'alt', title: 'النص البديل (لإمكانية الوصول)', type: 'string' },
  ],
  preview: { select: { title: 'caption', media: 'image' } },
};
