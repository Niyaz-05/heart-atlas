import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { productionLocales } from '../src/i18n/locales.ts';

for (const locale of Object.keys(productionLocales)) {
  test.describe(`home page (${locale})`, () => {
    test('opens under the base path', async ({ page }) => {
      const response = await page.goto(`${locale}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page).toHaveTitle(/\S/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('loads assets under the base path', async ({ page, request, baseURL }) => {
      await page.goto(`${locale}/`);
      const href = await page.locator('link[rel="icon"]').getAttribute('href');
      expect(href?.startsWith(new URL(baseURL ?? '').pathname)).toBe(true);
      const icon = await request.get(href ?? '');
      expect(icon.status()).toBe(200);
    });

    test('has no axe violations', async ({ page }) => {
      await page.goto(`${locale}/`);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
