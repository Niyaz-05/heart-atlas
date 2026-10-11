import { readdirSync, readFileSync } from 'node:fs';
import { sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  articleTypes,
  createArticleSchema,
  isSourcesCheckStale,
  parseTrustedSources,
  SOURCES_STALE_AFTER_YEARS,
} from '../src/lib/content';
import { productionLocales } from '../src/i18n/locales.ts';
import { readFrontmatter } from './frontmatter';

// Checks the real content/ tree. Astro validates frontmatter at build time too, but it does not
// see file paths, so the content/<locale>/<type>/<slug>.mdx layout is checked here.
const contentDir = fileURLToPath(new URL('../../../content/', import.meta.url));
const articleSchema = createArticleSchema(
  parseTrustedSources(readFileSync(`${contentDir}trusted-sources.yaml`, 'utf8')),
);
const files = readdirSync(contentDir, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => file.split(sep).join('/'));

describe.runIf(files.length > 0)('content/', () => {
  it.each(files)('%s is valid', (file) => {
    const parts = file.split('/');
    expect(parts, 'expected content/<locale>/<type>/<slug>.mdx').toHaveLength(3);
    const [locale = '', type, slug] = parts;
    expect(Object.keys(productionLocales), 'locale must be in the registry').toContain(locale);
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.mdx$/);

    const article = articleSchema.parse(readFrontmatter(`${contentDir}${file}`));
    expect(articleTypes).toContain(type);
    expect(article.type, 'type must match the folder').toBe(type);

    if (isSourcesCheckStale(article.sources_checked)) {
      // Vitest hides console output of passing tests, so write straight to stdout. GitHub
      // Actions turns the line into an annotation.
      process.stdout.write(
        `::warning file=content/${file}::sources_checked is older than ${SOURCES_STALE_AFTER_YEARS} years\n`,
      );
    }
  });
});
