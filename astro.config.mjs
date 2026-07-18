// @ts-check
import { defineConfig, envField } from 'astro/config';
import { loadEnv } from 'vite';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sanity from '@sanity/astro';

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET, PUBLIC_SANITY_API_VERSION } = loadEnv(
  process.env.NODE_ENV ?? 'development',
  process.cwd(),
  'PUBLIC_'
);

// The embedded Studio (/studio) only mounts once a real Sanity project exists —
// see .env.example. Until then, dev/build run against src/content/ untouched.
const sanityConfigured = Boolean(PUBLIC_SANITY_PROJECT_ID);

// https://astro.build/config
export default defineConfig({
  integrations: [
    mdx(),
    ...(sanityConfigured
      ? [
          react(),
          sanity({
            projectId: PUBLIC_SANITY_PROJECT_ID,
            dataset: PUBLIC_SANITY_DATASET || 'production',
            apiVersion: PUBLIC_SANITY_API_VERSION || '2026-01-01',
            studioBasePath: '/studio',
            useCdn: true,
          }),
        ]
      : []),
  ],
  env: {
    schema: {
      PUBLIC_SANITY_PROJECT_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_SANITY_DATASET: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_SANITY_API_VERSION: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});