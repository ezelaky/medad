import { defineField, defineType } from 'sanity';

// Singleton — see sanity/structure.ts, which pins the desk tool to the single
// "homepage" document instead of offering a list/create flow. Decouples the
// homepage hero from any one content type's `featured` flag: heroItems can
// mix أخبار الكتب, حوارات, ملفات, and الكتب الممنوعة in one editor-ordered list,
// which also drives the hero carousel's dot indicators (one dot per item).
//
// Each entry is an object wrapping the reference (not a bare reference)
// so it can carry its own scrimStrength — how dark the gradient behind the
// overlaid hero text is for that specific slide's image.
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
          type: 'object',
          name: 'heroItem',
          fields: [
            defineField({
              name: 'content',
              title: 'المحتوى',
              type: 'reference',
              to: [
                { type: 'article' },
                { type: 'interview' },
                { type: 'longRead' },
                { type: 'bannedBookEntry' },
              ],
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'scrimStrength',
              title: 'قوة التظليل',
              description: 'شدة التدرج الداكن خلف النص فوق صورة هذه الشريحة',
              type: 'string',
              options: {
                list: [
                  { title: 'خفيف', value: 'light' },
                  { title: 'متوسط', value: 'medium' },
                  { title: 'قوي', value: 'strong' },
                ],
                layout: 'radio',
              },
              initialValue: 'medium',
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { title: 'content.title', altTitle: 'content.bookTitle', strength: 'scrimStrength' },
            prepare({ title, altTitle, strength }) {
              return { title: title ?? altTitle ?? 'عنصر بدون عنوان', subtitle: `تظليل: ${strength}` };
            },
          },
        },
      ],
    }),
  ],
});
