import type en from './messages/en.json';
import { fallbackChain } from './registry.ts';
import { locales, productionLocales } from './locales.ts';

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

type MessageFile = Partial<Record<string, string>>;

const productionFiles = import.meta.glob<MessageFile>('./messages/*.json', {
  eager: true,
  import: 'default',
});
const testFiles = import.meta.glob<MessageFile>('../../test/fixtures/i18n/*.json', {
  eager: true,
  import: 'default',
});

// Production codes read only production files, so a fixture can never replace real strings.
// Test codes reach this point only when the registry includes them (HA_TEST_LOCALES=1).
function fileFor(code: string): MessageFile {
  const file =
    code in productionLocales
      ? productionFiles[`./messages/${code}.json`]
      : testFiles[`../../test/fixtures/i18n/${code}.json`];
  return file ?? {};
}

/** UI strings for a locale; missing keys come from its fallback chain (English last). */
export function getMessages(code: string): Messages {
  const merged: MessageFile = {};
  for (const locale of fallbackChain(locales, code).reverse()) {
    Object.assign(merged, fileFor(locale));
  }
  return merged as Messages;
}
