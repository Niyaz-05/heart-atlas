import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/**
 * The right-to-left test locale uses the pseudo-locale code qps-plocm, which axe does not
 * recognise as a language. Language rules are checked in the production build instead.
 */
const pseudoLocaleRules =
  process.env['HA_TEST_LOCALES'] === '1' ? ['html-lang-valid', 'valid-lang'] : [];

export function axe(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .disableRules(pseudoLocaleRules);
}
