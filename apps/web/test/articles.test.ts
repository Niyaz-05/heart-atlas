import { describe, expect, it } from 'vitest';
import { articlePages, parseArticleId } from '../src/lib/articles.ts';
import type { LocaleRegistry } from '../src/i18n/registry.ts';

const registry: LocaleRegistry = {
  ru: { name: 'Русский', dir: 'ltr', fallback: 'en' },
  en: { name: 'English', dir: 'ltr', fallback: null },
  ar: { name: 'Test', dir: 'rtl', fallback: 'ru' },
};

describe('parseArticleId', () => {
  it('splits locale, type and slug', () => {
    expect(parseArticleId('ru/disease/atrial-fibrillation')).toEqual({
      locale: 'ru',
      type: 'disease',
      slug: 'atrial-fibrillation',
    });
  });

  it.each(['ru/disease', 'ru/disease/a/b', 'ru//a'])('rejects %s', (id) => {
    expect(() => parseArticleId(id)).toThrow();
  });
});

describe('articlePages', () => {
  const pages = (ids: string[]) =>
    articlePages(
      ids.map((id) => ({ id })),
      registry,
    ).map((page) => `${page.locale}/${page.type}/${page.slug} <- ${page.contentLocale}`);

  it('uses the page locale when the translation exists', () => {
    expect(pages(['ru/disease/a', 'en/disease/a'])).toEqual([
      'ru/disease/a <- ru',
      'en/disease/a <- en',
      'ar/disease/a <- ru',
    ]);
  });

  it('follows the fallback chain for missing translations', () => {
    expect(pages(['en/disease/a'])).toEqual([
      'ru/disease/a <- en',
      'en/disease/a <- en',
      'ar/disease/a <- en',
    ]);
  });

  it('skips locales whose fallback chain has no version', () => {
    expect(pages(['ru/disease/a'])).toEqual(['ru/disease/a <- ru', 'ar/disease/a <- ru']);
  });
});
