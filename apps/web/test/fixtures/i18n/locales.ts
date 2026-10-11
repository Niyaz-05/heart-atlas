import type { LocaleRegistry } from '../../../src/i18n/registry.ts';

/**
 * Pseudo-locale for right-to-left checks. "qps" is a private-use language code, so it never
 * clashes with a real language. Strings live in qps-rtl.json next to this file.
 */
export const testLocales = {
  'qps-rtl': { name: 'Test RTL', dir: 'rtl', fallback: 'en' },
} as const satisfies LocaleRegistry;
