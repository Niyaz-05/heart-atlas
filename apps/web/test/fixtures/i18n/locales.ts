import type { LocaleRegistry } from '../../../src/i18n/registry.ts';

/**
 * Pseudo-locale for right-to-left checks. qps-plocm is the standard mirrored pseudo-locale, so it
 * never clashes with a real language. Strings live in qps-plocm.json next to this file.
 */
export const testLocales = {
  'qps-plocm': { name: 'Test RTL', dir: 'rtl', fallback: 'en' },
} as const satisfies LocaleRegistry;
