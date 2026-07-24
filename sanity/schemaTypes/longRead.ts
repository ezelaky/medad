import { defineField, defineType } from 'sanity';
import { pullQuote } from './blocks/pullQuote';
import { inlineFigure } from './blocks/inlineFigure';

export default defineType({
  name: 'longRead',
  title: 'ملف (قراءة طويلة)',
  type: 'document',
  fieldsets: [
    {
      name: 'sourceReference',
      title: 'مرجع المصدر (لمسودات صندوق الوارد فقط)',
      description: 'تُملأ تلقائيًا بواسطة phase2-enrich عند إثراء عنصر من صندوق الوارد — مرجع للمحرر، لا تظهر في الموقع',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({ name: 'title', title: 'العنوان', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'الكاتب / المحرر', type: 'string', description: 'اسم الكاتب أو المحرر كما سيظهر في المقال', initialValue: 'فريق التحرير' }),
    defineField({ name: 'subtitle', title: 'العنوان الفرعي الأول', type: 'string' }),
    defineField({ name: 'subtitle2', title: 'العنوان الفرعي الثاني', type: 'string' }),
    defineField({ name: 'slug', title: 'الرابط', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'dek', title: 'العنوان الفرعي', type: 'text', rows: 2, validation: (r) => r.required() }),
    defineField({ name: 'coverImage', title: 'صورة الغلاف', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'body',
      title: 'المحتوى',
      type: 'array',
      of: [{ type: 'block' }, pullQuote, inlineFigure],
    }),
    defineField({ name: 'readingTime', title: 'مدة القراءة', type: 'string', description: 'مثال: ١٢ دقائق قراءة' }),
    defineField({ name: 'tags', title: 'وسوم', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'publishedAt', title: 'تاريخ النشر', type: 'datetime', validation: (r) => r.required() }),

    defineField({ name: 'titleOriginal', title: 'العنوان الأصلي (إنجليزي)', type: 'string', fieldset: 'sourceReference', readOnly: true }),
    defineField({ name: 'sourceName', title: 'اسم المصدر', type: 'string', fieldset: 'sourceReference', readOnly: true }),
    defineField({ name: 'sourceUrl', title: 'رابط المقال الأصلي', type: 'string', fieldset: 'sourceReference', readOnly: true }),
    defineField({ name: 'originalPublishedAt', title: 'تاريخ النشر الأصلي', type: 'datetime', fieldset: 'sourceReference', readOnly: true }),
    defineField({
      name: 'originalContent',
      title: 'النص الأصلي (مرجع للترجمة)',
      type: 'text',
      fieldset: 'sourceReference',
      readOnly: true,
      rows: 10,
      description: 'قد يكون المقتطف من RSS فقط إذا تعذّر جلب النص الكامل — راجع fetchBlocked',
    }),
    defineField({
      name: 'fetchBlocked',
      title: 'تعذّر جلب النص الكامل',
      type: 'boolean',
      fieldset: 'sourceReference',
      readOnly: true,
      initialValue: false,
      description: 'إذا كانت مفعّلة، فإن originalContent أعلاه هو مقتطف RSS فقط، وليس نص المقال الكامل — افتح رابط المصدر يدويًا',
    }),
  ],
  preview: {
    select: { title: 'title', titleOriginal: 'titleOriginal', subtitle: 'dek', media: 'coverImage' },
    prepare({ title, titleOriginal, subtitle, media }) {
      return { title: title || (titleOriginal ? `⏳ ${titleOriginal}` : 'بلا عنوان'), subtitle, media };
    },
  },
});
