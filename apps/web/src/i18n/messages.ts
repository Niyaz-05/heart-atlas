import type en from './messages/en.json';
import { fallbackChain } from './registry.ts';
import { locales } from './locales.ts';

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

type MessageFile = Partial<Record<string, string>>;

const files: Record<string, MessageFile> = {
  ...import.meta.glob<MessageFile>('../../test/fixtures/i18n/*.json', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob<MessageFile>('./messages/*.json', { eager: true, import: 'default' }),
};

function fileFor(code: string): MessageFile {
  const entry = Object.entries(files).find(([path]) => path.endsWith(`/${code}.json`));
  return entry?.[1] ?? {};
}

/** UI strings for a locale; missing keys come from its fallback chain (English last). */
export function getMessages(code: string): Messages {
  const merged: MessageFile = {};
  for (const locale of fallbackChain(locales, code).reverse()) {
    Object.assign(merged, fileFor(locale));
  }
  return merged as Messages;
}
