import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { productionLocales } from '../src/i18n/locales.ts';

const messages = (locale: string): Record<string, string> =>
  JSON.parse(
    readFileSync(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url), 'utf8'),
  ) as Record<string, string>;

const codes = Object.keys(productionLocales);

test.use({ serviceWorkers: 'allow' });

for (const locale of codes) {
  test(`manifest describes the app (${locale})`, async ({ page, request, baseURL }) => {
    const base = new URL(baseURL ?? '').pathname;
    await page.goto(`${locale}/`);
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const response = await request.get(href ?? '');
    expect(response.ok()).toBe(true);
    const manifest = (await response.json()) as Record<string, unknown> & {
      icons: { src: string; sizes: string; purpose?: string }[];
    };
    expect(manifest).toMatchObject({
      id: base,
      scope: base,
      start_url: `${base}${locale}/`,
      lang: locale,
      name: messages(locale)['site.name'],
    });
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    );
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) {
      expect((await request.get(icon.src)).ok()).toBe(true);
    }
  });
}

test('works offline after the first visit', async ({ page, context, baseURL }) => {
  const base = new URL(baseURL ?? '').pathname;
  const [locale = 'ru', other = 'en'] = codes;
  const t = messages(locale);

  await page.goto(`${locale}/`);
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(new URL(scope).pathname).toBe(base);
  await expect(page.locator('.update-notice')).toBeHidden();

  // setOffline does not cut requests to localhost, so the worker's own network requests are
  // aborted instead: everything the page gets must come from the worker's caches.
  await context.setOffline(true);
  await context.route('**/*', (route) =>
    route.request().serviceWorker() ? route.abort('internetdisconnected') : route.continue(),
  );

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.goto(`${other}/`);
  await expect(page.locator('html')).toHaveAttribute('lang', other);

  await page.goto(`${locale}/not-cached/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(t['offline.title'] ?? '');

  await page.goto(`${locale}/search/?q=${encodeURIComponent('анатомия')}`);
  await expect(page.locator('.pagefind-ui__result-link').first()).toBeVisible();

  await context.unrouteAll();
  await context.setOffline(false);
});
