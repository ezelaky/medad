import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'bannedBookEntry',
  title: 'كتاب ممنوع',
  type: 'document',
  fields: [
    defineField({ name: 'bookTitle', title: 'عنوان الكتاب', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'الرابط', type: 'slug', options: { source: 'bookTitle' }, validation: (r) => r.required() }),
    defineField({ name: 'year', title: 'سنة المنع', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'country', title: 'البلد', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'coverImage', title: 'صورة الغلاف', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'summary', title: 'الملخص (الفقرة الظاهرة)', type: 'text', rows: 4, validation: (r) => r.required() }),
    defineField({ name: 'officialReason', title: 'السبب الرسمي للمنع (النص المُخفى)', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'featured', title: 'العرض الكامل في أعلى الصفحة', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'bookTitle', subtitle: 'country', media: 'coverImage' },
  },
});
