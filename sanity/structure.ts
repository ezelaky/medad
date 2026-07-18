import type { StructureResolver } from 'sanity/structure';

// Pins siteSettings to a single editable document (no list, no create/delete)
// since bestsellersWeekOf must stay one site-wide value, not a collection.
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
        .title('إعدادات الموقع')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
    ]);
