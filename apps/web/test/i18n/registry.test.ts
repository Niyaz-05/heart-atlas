import { describe, expect, it } from 'vitest';
import { defaultLocale, productionLocales } from '../../src/i18n/locales.ts';
import { fallbackChain, validateRegistry } from '../../src/i18n/registry.ts';
import { testLocales } from '../fixtures/i18n/locales.ts';

describe('locale registry', () => {
  it('production registry is valid', () => {
    expect(validateRegistry(productionLocales, defaultLocale)).toEqual([]);
  });

  it('registry with test locales is valid', () => {
    expect(validateRegistry({ ...productionLocales, ...testLocales }, defaultLocale)).toEqual([]);
  });

  it('test locales are right-to-left and never shadow production codes', () => {
    for (const [code, config] of Object.entries(testLocales)) {
      expect(config.dir).toBe('rtl');
      expect(productionLocales).not.toHaveProperty(code);
    }
  });

  it('builds the fallback chain', () => {
    expect(fallbackChain(productionLocales, 'ru')).toEqual(['ru', 'en']);
    expect(fallbackChain(productionLocales, 'en')).toEqual(['en']);
  });

  it('reports a missing default locale', () => {
    expect(validateRegistry(productionLocales, 'de')).toEqual([
      'defaultLocale "de" is not in the registry',
    ]);
  });

  it('reports a fallback to an unknown locale', () => {
    const errors = validateRegistry({ ru: { name: 'Русский', dir: 'ltr', fallback: 'xx' } }, 'ru');
    expect(errors).toEqual(['Unknown locale "xx" in the fallback chain of "ru"']);
  });

  it('reports fallback cycles', () => {
    const errors = validateRegistry(
      {
        a: { name: 'A', dir: 'ltr', fallback: 'b' },
        b: { name: 'B', dir: 'ltr', fallback: 'a' },
      },
      'a',
    );
    expect(errors).toEqual([
      'Locale fallback cycle: a -> b -> a',
      'Locale fallback cycle: b -> a -> b',
    ]);
  });
});
