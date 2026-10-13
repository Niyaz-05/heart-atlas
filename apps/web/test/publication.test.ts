import { describe, expect, it } from 'vitest';
import { selectArticles } from '../src/lib/publication.ts';
import { articlePages } from '../src/lib/articles.ts';
import { locales } from '../src/i18n/locales.ts';
import { createArticleSchema } from '../src/lib/content.ts';
import { trustedSources } from '../src/lib/trusted-sources.ts';
import { readFrontmatter } from './frontmatter.ts';

describe('publication boundary', () => {
  const rows = [
    { id: 'ru/anatomy/demo', data: { publication: 'published' } },
    { id: 'en/anatomy/demo', data: { publication: 'draft' } },
    { id: 'ru/anatomy/removed', data: { publication: 'withdrawn' } },
  ];
  it('filters before language fallback and excludes withdrawn content', () => {
    const selected = selectArticles(rows);
    expect(selected).toEqual([rows[0]]);
    expect(
      articlePages(selected, {
        ...locales,
        ru: { name: 'Russian', dir: 'ltr', fallback: null },
        en: { name: 'English', dir: 'ltr', fallback: 'ru' },
      }).find((p) => p.locale === 'en')?.contentLocale,
    ).toBe('ru');
  });
  it('preview includes drafts, not withdrawn medical text', () => {
    expect(selectArticles(rows, 'preview')).toEqual(rows.slice(0, 2));
  });
  it('missing metadata defaults to draft, never published', () => {
    const data = readFrontmatter(new URL('fixtures/content/valid-anatomy.mdx', import.meta.url));
    expect(createArticleSchema(trustedSources).parse(data).publication).toBe('draft');
  });
});
