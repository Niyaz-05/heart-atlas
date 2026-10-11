import { testLocales } from '../../test/fixtures/i18n/locales.ts';
import { validateRegistry, type LocaleRegistry } from './registry.ts';

/**
 * The single source of truth for site languages. To add a language, add an entry here and a
 * strings file `messages/<code>.json` (see CONTRIBUTING.md).
 */
export const productionLocales = {
  ru: { name: 'Русский', dir: 'ltr', fallback: 'en' },
  en: { name: 'English', dir: 'ltr', fallback: null },
} as const satisfies LocaleRegistry;

export const defaultLocale = 'ru';

/** Test-only locales (right-to-left) are built only with HA_TEST_LOCALES=1, never in production. */
export const includeTestLocales = process.env['HA_TEST_LOCALES'] === '1';

export const locales: LocaleRegistry = includeTestLocales
  ? { ...productionLocales, ...testLocales }
  : productionLocales;

const errors = validateRegistry(locales, defaultLocale);
if (errors.length > 0) throw new Error(`Invalid locale registry:\n${errors.join('\n')}`);

export const localeCodes = Object.keys(locales);
