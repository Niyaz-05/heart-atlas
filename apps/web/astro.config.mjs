// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

// SITE_URL and BASE_PATH come from the deploy workflow. Defaults match GitHub Pages.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://w3lld1.github.io',
  base: process.env.BASE_PATH ?? '/heart-atlas',
  integrations: [mdx(), react()],
});
