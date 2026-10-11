import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadConfig() {
  vi.resetModules();
  const { default: config } = await import('../astro.config.mjs');
  return config;
}

describe('astro config', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('defaults to the GitHub Pages address', async () => {
    const config = await loadConfig();
    expect(config.site).toBe('https://w3lld1.github.io');
    expect(config.base).toBe('/heart-atlas');
  });

  it('takes site and base from the environment', async () => {
    vi.stubEnv('SITE_URL', 'https://example.org');
    vi.stubEnv('BASE_PATH', '/');
    const config = await loadConfig();
    expect(config.site).toBe('https://example.org');
    expect(config.base).toBe('/');
  });
});
