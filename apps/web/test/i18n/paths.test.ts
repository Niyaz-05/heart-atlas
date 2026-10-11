import { describe, expect, it } from 'vitest';
import { localePath, switchLocalePath } from '../../src/i18n/paths.ts';

const codes = ['ru', 'en'];

describe('localePath', () => {
  it.each([
    ['/heart-atlas/', 'ru', '', '/heart-atlas/ru/'],
    ['/heart-atlas/', 'en', 'about/', '/heart-atlas/en/about/'],
    ['/heart-atlas/', 'en', '/about', '/heart-atlas/en/about'],
    ['/', 'ru', '', '/ru/'],
  ])('base %s, locale %s, path %s', (base, locale, path, expected) => {
    expect(localePath(base, locale, path)).toBe(expected);
  });
});

describe('switchLocalePath', () => {
  it.each([
    ['/heart-atlas/ru/', '/heart-atlas/', 'en', '/heart-atlas/en/'],
    ['/heart-atlas/ru', '/heart-atlas/', 'en', '/heart-atlas/en/'],
    ['/heart-atlas/ru/diseases/af/', '/heart-atlas/', 'en', '/heart-atlas/en/diseases/af/'],
    ['/heart-atlas/', '/heart-atlas/', 'en', '/heart-atlas/en/'],
    ['/en/anatomy/', '/', 'ru', '/ru/anatomy/'],
  ])('%s with base %s to %s', (pathname, base, target, expected) => {
    expect(switchLocalePath(pathname, base, target, codes)).toBe(expected);
  });
});
