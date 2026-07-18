import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'bestsellerEntry',
  title: 'كتاب في قائمة الأكثر مبيعًا',
  type: 'document',
  fields: [
    defineField({ name: 'rank', title: 'الترتيب', type: 'number', validation: (r) => r.required().integer().min(1) }),
    defineField({ name: 'bookTitle', title: 'عنوان الكتاب', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'المؤلف', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'publisher', title: 'دار النشر', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'coverImage', title: 'صورة الغلاف', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'trend',
      title: 'الاتجاه',
      type: 'string',
      options: { list: [{ title: 'صاعد ↑', value: 'up' }, { title: 'هابط ↓', value: 'down' }, { title: 'ثابت –', value: 'same' }] },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'weeksOnList', title: 'أسابيع في القائمة', type: 'string', description: 'رقم أو "جديد"', validation: (r) => r.required() }),
    defineField({
      name: 'listCategory',
      title: 'تصنيف القائمة',
      type: 'string',
      options: { list: ['روايات', 'غير روائي', 'الأكثر مبيعًا للشباب'] },
      validation: (r) => r.required(),
    }),
  ],
  orderings: [
    { title: 'الترتيب', name: 'rankAsc', by: [{ field: 'rank', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'bookTitle', subtitle: 'author', media: 'coverImage' },
  },
});
