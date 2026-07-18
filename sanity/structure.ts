import type { StructureResolver } from 'sanity/structure';

// Pins siteSettings and homepage to single editable documents (no list, no
// create/delete) — bestsellersWeekOf must stay one site-wide value, and
// homepage.heroItems is one ordered list an editor curates, not a collection.
export const structure: StructureResolver = (S) =>
  S.list()
    .title('المحتوى')
    .items([
      S.documentTypeListItem('article').title('أخبار الكتب'),
      S.documentTypeListItem('interview').title('حوارات'),
      S.documentTypeListItem('longRead').title('ملفات'),
      S.documentTypeListItem('bestsellerEntry').title('الأكثر مبيعًا'),
      S.documentTypeListItem('bannedBookEntry').title('الكتب الممنوعة'),
      S.divider(),
      S.listItem()
        .title('عناصر الصفحة الرئيسية')
        .id('homepage')
        .child(
          S.document()
            .schemaType('homepage')
            .documentId('homepage')
        ),
      S.listItem()
        .title('إعدادات الموقع')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
    ]);
