import { describe, expect, it } from 'vitest';
import { compareKeys } from '../../src/i18n/check.ts';
import { getMessages } from '../../src/i18n/messages.ts';
import en from '../../src/i18n/messages/en.json';
import ru from '../../src/i18n/messages/ru.json';

describe('messages', () => {
  it('returns strings of the requested locale', () => {
    expect(getMessages('ru')['nav.language']).toBe(ru['nav.language']);
    expect(getMessages('en')['nav.language']).toBe(en['nav.language']);
  });

  it('every message key resolves for every production locale', () => {
    for (const code of ['ru', 'en']) {
      const messages = getMessages(code);
      for (const key of Object.keys(en)) expect(messages).toHaveProperty(key);
    }
  });

  it('throws for an unknown locale', () => {
    expect(() => getMessages('xx')).toThrow('Unknown locale "xx"');
  });
});

describe('compareKeys', () => {
  it('reports missing keys as errors and extra keys separately', () => {
    expect(compareKeys({ a: '', b: '' }, { b: '', c: '' })).toEqual({
      missing: ['a'],
      extra: ['c'],
    });
  });

  it('passes identical key sets', () => {
    expect(compareKeys(en, ru)).toEqual({ missing: [], extra: [] });
  });
});
