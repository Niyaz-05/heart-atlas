import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadLocales() {
  vi.resetModules();
  return import('../../src/i18n/locales.ts');
}

describe('test locales flag', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('excludes test locales by default', async () => {
    vi.stubEnv('HA_TEST_LOCALES', undefined);
    const { localeCodes } = await loadLocales();
    expect(localeCodes).toEqual(['ru', 'en']);
  });

  it('includes test locales with HA_TEST_LOCALES=1', async () => {
    vi.stubEnv('HA_TEST_LOCALES', '1');
    const { localeCodes, locales } = await loadLocales();
    expect(localeCodes).toContain('qps-rtl');
    expect(locales['qps-rtl']?.dir).toBe('rtl');
  });
});
