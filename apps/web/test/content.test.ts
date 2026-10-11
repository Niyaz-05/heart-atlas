import { readdirSync, readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  articleTypes,
  createArticleSchema,
  isSourcesCheckStale,
  parseTrustedSources,
  SOURCES_STALE_AFTER_YEARS,
} from '../src/lib/content';
import { readFrontmatter } from './frontmatter';

// Checks the real content/ tree. Astro validates frontmatter at build time too, but it does not
// see file paths, so the content/<locale>/<type>/<slug>.mdx layout is checked here.
const contentDir = fileURLToPath(new URL('../../../content/', import.meta.url));
const articleSchema = createArticleSchema(
  parseTrustedSources(readFileSync(`${contentDir}trusted-sources.yaml`, 'utf8')),
);
const files = readdirSync(contentDir, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => relative(contentDir, `${contentDir}${file}`).split(sep).join('/'));

describe.runIf(files.length > 0)('content/', () => {
  // TODO(stage 0 PR 4): also check that <locale> is in the locale registry.
  it.each(files)('%s is valid', (file) => {
    const [, type, slug, ...rest] = file.split('/');
    expect(rest, 'expected content/<locale>/<type>/<slug>.mdx').toEqual([]);
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.mdx$/);

    const article = articleSchema.parse(readFrontmatter(`${contentDir}${file}`));
    expect(articleTypes).toContain(type);
    expect(article.type, 'type must match the folder').toBe(type);

    if (isSourcesCheckStale(article.sources_checked)) {
      console.warn(
        `::warning file=content/${file}::sources_checked is older than ${SOURCES_STALE_AFTER_YEARS} years`,
      );
    }
  });
});
