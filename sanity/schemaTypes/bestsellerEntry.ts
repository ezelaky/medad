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
    { title: 'الترتيب', name: 'rankAsc', by: [{ field: 'rank', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'titleArabic', titleOriginal: 'titleOriginal', subtitle: 'author', media: 'coverImage' },
    prepare({ title, titleOriginal, subtitle, media }) {
      return { title: title || `⏳ ${titleOriginal}`, subtitle, media };
    },
  },
});
