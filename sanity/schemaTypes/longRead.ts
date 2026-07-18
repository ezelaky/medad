import { defineField, defineType } from 'sanity';

// Custom Portable Text blocks matching article.html's .pull-quote and
// .inline-figure patterns — rendered by the ptComponents map in src/lib/sanity.ts
const pullQuote = {
  name: 'pullQuote',
  title: 'اقتباس بارز',
  type: 'object',
  fields: [
    { name: 'quote', title: 'نص الاقتباس', type: 'text', rows: 3 },
    { name: 'attribution', title: 'المصدر', type: 'string' },
  ],
  preview: { select: { title: 'quote' } },
};

const inlineFigure = {
  name: 'inlineFigure',
  title: 'صورة داخل النص',
  type: 'object',
  fields: [
    { name: 'image', title: 'الصورة', type: 'image', options: { hotspot: true } },
    { name: 'caption', title: 'وصف الصورة', type: 'string' },
  ],
  preview: { select: { title: 'caption', media: 'image' } },
};

export default defineType({
  name: 'longRead',
  title: 'ملف (قراءة طويلة)',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'العنوان', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'الرابط', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'dek', title: 'العنوان الفرعي', type: 'text', rows: 2, validation: (r) => r.required() }),
    defineField({ name: 'coverImage', title: 'صورة الغلاف', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'body',
      title: 'المحتوى',
      type: 'array',
      of: [{ type: 'block' }, pullQuote, inlineFigure],
    }),
    defineField({ name: 'author', title: 'الكاتب', type: 'string', initialValue: 'فريق التحرير' }),
    defineField({ name: 'readingTime', title: 'مدة القراءة', type: 'string', description: 'مثال: ١٢ دقائق قراءة' }),
    defineField({ name: 'tags', title: 'وسوم', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'publishedAt', title: 'تاريخ النشر', type: 'datetime', validation: (r) => r.required() }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'dek', media: 'coverImage' },
  },
});
