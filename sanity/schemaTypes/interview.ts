import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'interview',
  title: 'حوار',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'عنوان الحوار (الاقتباس الرئيسي)', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'الرابط', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'guestName', title: 'اسم الضيف', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'guestRole', title: 'صفة الضيف', type: 'string', description: 'مثال: ناشر، روائية، مترجم', validation: (r) => r.required() }),
    defineField({ name: 'portraitImage', title: 'صورة الضيف', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'excerpt', title: 'مقتطف', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'body', title: 'نص الحوار', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'publishedAt', title: 'تاريخ النشر', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'featured', title: 'حوار رئيسي', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'guestRole', media: 'portraitImage' },
  },
});
