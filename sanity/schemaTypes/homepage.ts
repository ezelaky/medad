import { defineField, defineType } from 'sanity';

// Singleton — see sanity/structure.ts, which pins the desk tool to the single
// "homepage" document instead of offering a list/create flow. Decouples the
// homepage hero from any one content type's `featured` flag: heroItems can
// mix أخبار الكتب, حوارات, ملفات, and الكتب الممنوعة in one editor-ordered list,
// which also drives the hero carousel's dot indicators (one dot per item).
export default defineType({
  name: 'homepage',
  title: 'الصفحة الرئيسية',
  type: 'document',
  fields: [
    defineField({
      name: 'heroItems',
      title: 'عناصر البطل الرئيسي',
      description: 'الترتيب هنا يحدد ترتيب الشرائح في أعلى الصفحة الرئيسية',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'article' },
            { type: 'interview' },
            { type: 'longRead' },
            { type: 'bannedBookEntry' },
          ],
        },
      ],
    }),
  ],
});
