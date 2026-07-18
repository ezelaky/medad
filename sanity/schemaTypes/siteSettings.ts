import { defineField, defineType } from 'sanity';

// Singleton — see sanity/structure.ts, which pins the desk tool to the single
// "siteSettings" document instead of offering a list/create flow.
export default defineType({
  name: 'siteSettings',
  title: 'إعدادات الموقع',
  type: 'document',
  fields: [
    defineField({
      name: 'bestsellersWeekOf',
      title: 'أسبوع قائمة الأكثر مبيعًا',
      type: 'string',
      description: 'مثال: ١٣ إلى ١٩ يوليو ٢٠٢٦ — يطبَّق على كل عناصر القائمة دفعة واحدة',
      validation: (r) => r.required(),
    }),
  ],
});
