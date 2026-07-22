import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'interview',
  title: 'حوار',
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
    defineField({ name: 'title', title: 'عنوان الحوار (الاقتباس الرئيسي)', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'الكاتب / المحرر', type: 'string', description: 'اسم الكاتب أو المحرر كما سيظهر في المقال' }),
    defineField({ name: 'subtitle', title: 'العنوان الفرعي الأول', type: 'string' }),
    defineField({ name: 'subtitle2', title: 'العنوان الفرعي الثاني', type: 'string' }),
    defineField({ name: 'slug', title: 'الرابط', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'guestName', title: 'اسم الضيف', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'guestRole', title: 'صفة الضيف', type: 'string', description: 'مثال: ناشر، روائية، مترجم', validation: (r) => r.required() }),
    defineField({ name: 'portraitImage', title: 'صورة الضيف', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'excerpt', title: 'مقتطف', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'body', title: 'نص الحوار', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'publishedAt', title: 'تاريخ النشر', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'featured', title: 'حوار رئيسي', type: 'boolean', initialValue: false }),

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
    select: { title: 'title', titleOriginal: 'titleOriginal', subtitle: 'guestRole', media: 'portraitImage' },
    prepare({ title, titleOriginal, subtitle, media }) {
      return { title: title || (titleOriginal ? `⏳ ${titleOriginal}` : 'بلا عنوان'), subtitle, media };
    },
  },
});
