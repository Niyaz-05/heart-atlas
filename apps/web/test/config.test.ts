import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadConfig() {
  vi.resetModules();
  const { default: config } = await import('../astro.config.mjs');
  return config;
}

describe('astro config', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('defaults to the GitHub Pages address', async () => {
    vi.stubEnv('SITE_URL', undefined);
    vi.stubEnv('BASE_PATH', undefined);
    const config = await loadConfig();
    expect(config.site).toBe('https://w3lld1.github.io');
    expect(config.base).toBe('/heart-atlas/');
  });

  it('falls back to the default site when SITE_URL is empty', async () => {
    vi.stubEnv('SITE_URL', '');
    const config = await loadConfig();
    expect(config.site).toBe('https://w3lld1.github.io');
  });

  it.each([
    ['/heart-atlas', '/heart-atlas/'],
    ['/heart-atlas/', '/heart-atlas/'],
    ['/', '/'],
    ['', '/'],
  ])('normalizes BASE_PATH %j to %j', async (input, expected) => {
    vi.stubEnv('BASE_PATH', input);
    const config = await loadConfig();
    expect(config.base).toBe(expected);
  });

  it('takes the site from the environment', async () => {
    vi.stubEnv('SITE_URL', 'https://example.org');
    const config = await loadConfig();
    expect(config.site).toBe('https://example.org');
  });
});
