import { readFileSync } from 'node:fs';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { createArticleSchema, parseTrustedSources } from './lib/content';

// content/ lives in the repository root so LICENSE-CONTENT covers it.
const contentDir = new URL('../../../content/', import.meta.url);

const trustedSources = parseTrustedSources(
  readFileSync(new URL('trusted-sources.yaml', contentDir), 'utf8'),
);

// Files live in content/<locale>/<type>/<slug>.mdx; test/content.test.ts checks that layout.
const articles = defineCollection({
  loader: glob({ base: contentDir, pattern: '**/*.mdx' }),
  schema: createArticleSchema(trustedSources),
});

export const collections = { articles };
