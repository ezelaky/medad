import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'bestsellerEntry',
  title: 'كتاب في قائمة الأكثر مبيعًا',
  type: 'document',
  fieldsets: [
    {
      name: 'translation',
      title: '🔴 بانتظار الترجمة — يملأها المحرر يدويًا',
      options: { collapsible: false },
    },
  ],
  fields: [
    defineField({
      name: 'listPublishedDate',
      title: 'تاريخ إصدار القائمة',
      type: 'date',
      description: 'published_date من واجهة نيويورك تايمز — يميّز كل دفعة أسبوعية عن سابقتها. يملؤه السكربت تلقائيًا',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'rank', title: 'الترتيب', type: 'number', validation: (r) => r.required().integer().min(1) }),
    defineField({ name: 'titleOriginal', title: 'العنوان الأصلي (إنجليزي)', type: 'string', description: 'كما نُشر — يملؤه السكربت تلقائيًا', validation: (r) => r.required() }),
    defineField({ name: 'titleArabic', title: 'العنوان بالعربية', type: 'string', fieldset: 'translation' }),
    defineField({ name: 'author', title: 'المؤلف', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'publisher', title: 'دار النشر', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'coverImage', title: 'صورة الغلاف', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'descriptionSource',
      title: 'الوصف الأصلي (إنجليزي، مرجعي)',
      type: 'text',
      description: 'وصف نيويورك تايمز الأصلي — مرجع للمترجم فقط، لا يظهر في الموقع',
      rows: 3,
    }),
    defineField({ name: 'description', title: 'الوصف بالعربية', type: 'text', rows: 3, fieldset: 'translation' }),
    defineField({
      name: 'trend',
      title: 'الاتجاه',
      type: 'string',
      options: {
        list: [
          { title: 'جديد ★', value: 'new' },
          { title: 'صاعد ↑', value: 'up' },
          { title: 'هابط ↓', value: 'down' },
          { title: 'ثابت –', value: 'same' },
        ],
      },
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
    {
      title: 'الأحدث أولاً',
      name: 'publishedDateDesc',
      by: [{ field: 'listPublishedDate', direction: 'desc' }, { field: 'rank', direction: 'asc' }],
    },
    { title: 'الترتيب', name: 'rankAsc', by: [{ field: 'rank', direction: 'asc' }] },
  ],
  preview: {
    select: {
      title: 'titleArabic',
      titleOriginal: 'titleOriginal',
      author: 'author',
      listPublishedDate: 'listPublishedDate',
      media: 'coverImage',
    },
    prepare({ title, titleOriginal, author, listPublishedDate, media }) {
      const dateLabel = listPublishedDate || 'بلا تاريخ';
      return {
        title: title || `⏳ ${titleOriginal}`,
        subtitle: `${dateLabel} · ${author}`,
        media,
      };
    },
  },
});
