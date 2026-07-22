import type { StructureResolver } from 'sanity/structure';
// @sanity/icons v5 dropped root-entry icon exports — each icon now needs
// its own subpath import (confirmed against the actually-installed
// version's package.json exports map after the root-import build failed).
import { AddIcon } from '@sanity/icons/Add';
import { openAddSourceDialog } from './plugins/addSourceAction';

// Pins siteSettings and homepage to single editable documents (no list, no
// create/delete) — bestsellersWeekOf must stay one site-wide value, and
// homepage.heroItems is one ordered list an editor curates, not a collection.
export const structure: StructureResolver = (S) =>
  S.list()
    .title('المحتوى')
    .items([
      // Triage queue for Phase 1's RSS pull — pinned first and separated by
      // a divider so it reads as a distinct workflow, not just another
      // content list. Only shows 'pending' items; once an editor sets
      // status to 'approved' or 'dismissed' it drops out of this view on
      // its own (see contentInboxItem.ts's liveEdit note for why status
      // changes apply immediately rather than needing a separate Publish).
      S.listItem()
        .title('صندوق الوارد')
        .id('contentInbox')
        .child(
          S.documentTypeList('contentInboxItem')
            .title('صندوق الوارد')
            .filter('status == "pending"')
            .defaultOrdering([{ field: 'fetchedAt', direction: 'desc' }])
            .menuItems([
              // action() takes a plain callback (verified against the
              // installed sanity package's types — MenuItemActionType is
              // `string | ((params, scope) => void)`), so this needs no
              // extra document-action wiring. showAsAction(true) renders
              // it as a visible toolbar button instead of tucking it into
              // the "..." overflow menu. See addSourceAction.tsx for what
              // it opens and why a plain pub-sub is what connects this
              // config-level callback to a React dialog.
              S.menuItem()
                .title('إضافة مصدر جديد')
                .icon(AddIcon)
                .showAsAction(true)
                .action(() => openAddSourceDialog()),
            ])
        ),
      S.divider(),
      S.documentTypeListItem('article').title('أخبار الكتب'),
      S.documentTypeListItem('interview').title('حوارات'),
      S.documentTypeListItem('longRead').title('ملفات'),
      // Default-sorted newest-batch-first (see bestsellerEntry.ts's
      // publishedDateDesc ordering) so this week's untranslated drafts sit
      // at the top instead of mixing in with older, already-published weeks.
      S.documentTypeListItem('bestsellerEntry')
        .title('الأكثر مبيعًا')
        .child(
          S.documentTypeList('bestsellerEntry')
            .title('الأكثر مبيعًا')
            .defaultOrdering([
              { field: 'listPublishedDate', direction: 'desc' },
              { field: 'rank', direction: 'asc' },
            ])
        ),
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
