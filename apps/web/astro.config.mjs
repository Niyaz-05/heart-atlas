// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import { checkMdx } from '../../scripts/check-content-safety.mjs';
import { checkMedicalReviews } from '../../scripts/check-medical-review.mjs';
import { checkEditorialContent } from './scripts/check-editorial-content.ts';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import clientDirectives from './integrations/client-directives.ts';
import postBuild from './integrations/post-build.ts';

// SITE_URL and BASE_PATH come from the deploy workflow. Empty values fall back to the
// GitHub Pages defaults. base always ends with "/" so `${BASE_URL}path` joins correctly.
const site = process.env.SITE_URL || 'https://w3lld1.github.io';
const base = (process.env.BASE_PATH ?? '/heart-atlas').replace(/\/?$/, '/');

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  vite: {
    plugins: [
      {
        name: 'heart-atlas:mdx-safety',
        enforce: 'pre',
        transform(_source, id) {
          const path = id.split('?')[0];
          if (path?.endsWith('.mdx')) checkMdx(readFileSync(path, 'utf8'));
        },
      },
    ],
  },
  integrations: [
    {
      name: 'heart-atlas:editorial-validation',
      hooks: {
        'astro:config:setup': () => {
          // Runs before Astro's content loader and MDX compilation, including direct CLI builds.
          checkEditorialContent();
          checkMedicalReviews();
        },
      },
    },
    mdx(),
    react(),
    clientDirectives(),
    postBuild(),
  ],
});
