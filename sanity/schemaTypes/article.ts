import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'article',
  title: 'خبر (أخبار الكتب)',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'العنوان', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'الكاتب / المحرر', type: 'string', description: 'اسم الكاتب أو المحرر كما سيظهر في المقال' }),
    defineField({ name: 'slug', title: 'الرابط', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'coverImage', title: 'صورة الغلاف', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'excerpt', title: 'مقتطف', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'body', title: 'المحتوى', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'category', title: 'التصنيف', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'publishedAt', title: 'تاريخ النشر', type: 'datetime', validation: (r) => r.required() }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', media: 'coverImage' },
  },
});
