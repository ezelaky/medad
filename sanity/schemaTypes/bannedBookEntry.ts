import { defineField, defineType } from 'sanity';
import { pullQuote } from './blocks/pullQuote';

export default defineType({
  name: 'bannedBookEntry',
  title: 'كتاب ممنوع',
  type: 'document',
  fields: [
    defineField({ name: 'bookTitle', title: 'عنوان الكتاب', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'الكاتب / المحرر', type: 'string', description: 'اسم الكاتب أو المحرر كما سيظهر في المقال' }),
    defineField({ name: 'subtitle', title: 'العنوان الفرعي الأول', type: 'string' }),
    defineField({ name: 'subtitle2', title: 'العنوان الفرعي الثاني', type: 'string' }),
    defineField({ name: 'slug', title: 'الرابط', type: 'slug', options: { source: 'bookTitle' }, validation: (r) => r.required() }),
    defineField({ name: 'year', title: 'سنة المنع', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'country', title: 'البلد', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'coverImage', title: 'صورة الغلاف', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'summary', title: 'الملخص (الفقرة الظاهرة)', type: 'text', rows: 4, validation: (r) => r.required() }),
    defineField({ name: 'officialReason', title: 'السبب الرسمي للمنع (النص المُخفى)', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({
      name: 'body',
      title: 'المحتوى الموسّع',
      type: 'array',
      of: [{ type: 'block' }, pullQuote],
      description: 'محتوى اختياري أطول من الملخص، يظهر أسفل قسم السبب الرسمي في صفحة الكتاب',
    }),
    defineField({ name: 'featured', title: 'العرض الكامل في أعلى الصفحة', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'bookTitle', subtitle: 'country', media: 'coverImage' },
  },
});
