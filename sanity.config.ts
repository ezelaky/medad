import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemaTypes';
import { structure } from './sanity/structure';
import { AddSourceStudioLayout } from './sanity/plugins/addSourceAction';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? '';
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production';

export default defineConfig({
  name: 'midad',
  title: 'مِداد',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema: { types: schemaTypes },
  // Wraps every Studio screen so addSourceAction.tsx's dialog is always
  // mounted and ready to open — see that file's top comment for why (the
  // "إضافة مصدر جديد" button lives inside structure.ts's menuItems, a
  // config-level callback with no React tree of its own to hold dialog state).
  studio: {
    components: {
      layout: AddSourceStudioLayout,
    },
  },
});
