import { readdirSync, readFileSync } from 'node:fs';
import { sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  articleTypes,
  createArticleSchema,
  isSourcesCheckStale,
  SOURCES_STALE_AFTER_YEARS,
} from '../src/lib/content.ts';
import { trustedSources } from '../src/lib/trusted-sources.ts';
import { productionLocales } from '../src/i18n/locales.ts';
import { readFrontmatter } from './frontmatter.ts';

// Checks the real content/ tree and the test articles for HA_TEST_CONTENT=1 builds. Astro
// validates frontmatter at build time too, but it does not see file paths, so the
// <locale>/<type>/<slug>.mdx layout is checked here.
const articleSchema = createArticleSchema(trustedSources);
const trees = [
  { name: 'content/', url: new URL('../../../content/', import.meta.url) },
  { name: 'test/fixtures/site-content/', url: new URL('fixtures/site-content/', import.meta.url) },
];

for (const tree of trees) {
  const dir = fileURLToPath(tree.url);
  const files = readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.split(sep).join('/'));

  describe.runIf(files.length > 0)(tree.name, () => {
    it.each(files)('%s is valid', (file) => {
      const parts = file.split('/');
      expect(parts, 'expected <locale>/<type>/<slug>.mdx').toHaveLength(3);
      const [locale = '', type, slug] = parts;
      expect(Object.keys(productionLocales), 'locale must be in the registry').toContain(locale);
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.mdx$/);

      const article = articleSchema.parse(readFrontmatter(`${dir}${file}`));
      expect(articleTypes).toContain(type);
      expect(article.type, 'type must match the folder').toBe(type);

      const cited = [...readFileSync(`${dir}${file}`, 'utf8').matchAll(/<Cite n=\{([^}]*)\}/g)]
        .flatMap((match) => (match[1] ?? '').replace(/[[\]\s]/g, '').split(','))
        .map(Number);
      for (const n of cited) {
        expect(n >= 1 && n <= article.sources.length, `<Cite n={${n}} /> has no source`).toBe(true);
      }

      if (isSourcesCheckStale(article.sources_checked)) {
        // Vitest hides console output of passing tests, so write straight to stdout. GitHub
        // Actions turns the line into an annotation.
        process.stdout.write(
          `::warning file=${tree.name}${file}::sources_checked is older than ${SOURCES_STALE_AFTER_YEARS} years\n`,
        );
      }
    });
  });
}
