import { defineField, defineType } from 'sanity';
import sourcesConfig from '../../sources.config.json';

// liveEdit: true — this type deliberately skips Sanity's normal
// draft/publish split. The whole Phase 1/Phase 2 pipeline hinges on a
// Sanity webhook firing the instant an editor flips `status` to
// 'approved' (see .github/workflows/phase2-enrich.yml's header comment
// for the webhook setup). Webhooks only fire on the *published* dataset
// by default; without liveEdit, editing `status` in Studio would first
// write to a hidden drafts.<id> copy and the webhook would never fire
// until the editor remembered to also click "Publish" — a footgun with
// no visible symptom until someone asks "why didn't Phase 2 run?". With
// liveEdit, every edit (including the status change) applies directly,
// so this class of bug can't happen.
export default defineType({
  name: 'contentInboxItem',
  title: 'عنصر في صندوق الوارد',
  type: 'document',
  liveEdit: true,
  fields: [
    // --- populated by phase1-triage.yml, not meant to be hand-edited ---
    defineField({ name: 'title', title: 'العنوان (كما ورد في RSS)', type: 'string', readOnly: true, validation: (r) => r.required() }),
    defineField({ name: 'sourceName', title: 'اسم المصدر', type: 'string', readOnly: true, validation: (r) => r.required() }),
    defineField({
      name: 'sourceUrl',
      title: 'رابط المقال الأصلي',
      type: 'string',
      readOnly: true,
      validation: (r) => r.required().uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'section',
      title: 'القسم',
      type: 'string',
      readOnly: true,
      // Options sourced from sources.config.json's `sections` map — the
      // single file the repo's README/inline comments call out as the one
      // place to add/remove sections, so this list never needs manual sync.
      options: {
        list: Object.entries(sourcesConfig.sections).map(([value, s]) => ({
          title: (s as { label: string }).label,
          value,
        })),
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'excerpt', title: 'مقتطف (من RSS)', type: 'text', rows: 3, readOnly: true }),
    // Hidden entirely (not just read-only) — internal dedup key only,
    // never something an editor needs to see or act on.
    defineField({ name: 'guid', title: 'معرّف RSS', type: 'string', hidden: true, validation: (r) => r.required() }),
    defineField({ name: 'originalPublishedAt', title: 'تاريخ النشر الأصلي', type: 'datetime', readOnly: true }),
    defineField({ name: 'fetchedAt', title: 'تاريخ الجلب', type: 'datetime', readOnly: true, validation: (r) => r.required() }),

    // --- the one field an editor actually changes ---
    defineField({
      name: 'status',
      title: 'الحالة',
      type: 'string',
      options: {
        list: [
          { title: 'قيد الانتظار', value: 'pending' },
          { title: 'مقبول', value: 'approved' },
          { title: 'مرفوض', value: 'dismissed' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (r) => r.required(),
    }),

    // --- written back by phase2-enrich.yml after it runs ---
    defineField({
      name: 'enrichedAt',
      title: 'تاريخ الإثراء (Phase 2)',
      type: 'datetime',
      readOnly: true,
      description: 'يُملأ تلقائيًا بعد نجاح استخراج المحتوى وإنشاء المسودة',
    }),
    defineField({
      name: 'enrichmentError',
      title: 'فشل الإثراء',
      type: 'boolean',
      readOnly: true,
      initialValue: false,
      description: 'يُفعَّل تلقائيًا إذا تعذّر جلب المقال الأصلي — راجع الرابط يدويًا',
    }),
  ],
  orderings: [
    { title: 'الأحدث أولاً', name: 'fetchedAtDesc', by: [{ field: 'fetchedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', sourceName: 'sourceName', section: 'section', excerpt: 'excerpt' },
    prepare({ title, sourceName, section, excerpt }) {
      const sections = sourcesConfig.sections as Record<string, { label: string }>;
      const sectionLabel = sections[section]?.label ?? section;
      const snippet = (excerpt || '').slice(0, 120);
      return {
        title,
        subtitle: [sourceName, sectionLabel, snippet].filter(Boolean).join(' · '),
      };
    },
  },
});
