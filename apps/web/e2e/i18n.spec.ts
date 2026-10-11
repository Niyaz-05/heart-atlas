import { expect, test } from '@playwright/test';
import { defaultLocale, productionLocales } from '../src/i18n/locales.ts';
import { testLocales } from '../test/fixtures/i18n/locales.ts';
import { axe } from './axe.ts';

const codes = Object.keys(productionLocales);
const testCodes = Object.keys(testLocales);
const withTestLocales = process.env['HA_TEST_LOCALES'] === '1';

test('root redirects to the default locale', async ({ page, baseURL }) => {
  await page.goto('');
  await expect(page).toHaveURL(`${baseURL}${defaultLocale}/`);
  await expect(page.locator('html')).toHaveAttribute('lang', defaultLocale);
});

test('language switcher opens the same page in every locale', async ({ page, baseURL }) => {
  for (const from of codes) {
    for (const to of codes.filter((code) => code !== from)) {
      await page.goto(`${from}/`);
      const nav = page.getByRole('navigation', { name: /./ });
      await expect(nav.locator('[aria-current="page"]')).toHaveAttribute('lang', from);
      await nav.locator(`a[lang="${to}"]`).click();
      await expect(page).toHaveURL(`${baseURL}${to}/`);
      await expect(page.locator('html')).toHaveAttribute('lang', to);
    }
  }
});

for (const locale of codes) {
  test(`footer shows the medical disclaimer (${locale})`, async ({ page }) => {
    await page.goto(`${locale}/`);
    const footer = page.getByRole('contentinfo');
    await expect(footer.locator('.disclaimer')).toBeVisible();
    await expect(footer.locator('.disclaimer')).toContainText(/112/);
    await expect(footer.getByRole('link', { name: /disclaimer|дисклеймер/i })).toBeVisible();
  });

  test(`skip link moves focus to the content (${locale})`, async ({ page }) => {
    await page.goto(`${locale}/`);
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#content')).toBeFocused();
  });
}

test.describe('test locales', () => {
  test.skip(withTestLocales, 'production build only');

  test('are not in the production build', async ({ request }) => {
    for (const code of testCodes) {
      const response = await request.get(`${code}/`);
      expect(response.status()).toBe(404);
    }
  });
});

test.describe('right-to-left test locale', () => {
  test.skip(!withTestLocales, 'needs a build with HA_TEST_LOCALES=1');

  for (const code of testCodes) {
    test(`renders right to left (${code})`, async ({ page }) => {
      await page.goto(`${code}/`);
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(page.locator('html')).toHaveAttribute('lang', code);
      const header = await page.locator('header').boundingBox();
      const name = await page.locator('.site-name').boundingBox();
      expect(header && name && name.x + name.width > header.x + header.width / 2).toBe(true);
      const results = await axe(page).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
