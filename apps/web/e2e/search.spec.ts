import { expect, test } from '@playwright/test';
import { axe } from './axe.ts';

// A word from each locale's home page text (home.intro in messages/<locale>.json).
const queries: Record<string, string> = { ru: 'анатомия', en: 'anatomy' };

for (const [locale, query] of Object.entries(queries)) {
  test.describe(`search (${locale})`, () => {
    test('header form opens the search page with results', async ({ page, baseURL }) => {
      await page.goto(`${locale}/`);
      const form = page.getByRole('search');
      await form.getByRole('searchbox').fill(query);
      await form.getByRole('searchbox').press('Enter');
      await expect(page).toHaveURL(new RegExp(`/${locale}/search/\\?q=`));

      const result = page.locator('.pagefind-ui__result-link').first();
      await expect(result).toBeVisible();
      const href = await result.getAttribute('href');
      expect(href?.startsWith(`${new URL(baseURL ?? '').pathname}${locale}/`)).toBe(true);
    });

    test('indexes only pages of its own language', async ({ page }) => {
      const other = Object.entries(queries).find(([code]) => code !== locale)?.[1] ?? '';
      await page.goto(`${locale}/search/?q=${encodeURIComponent(other)}`);
      await expect(page.locator('.pagefind-ui__message')).toBeVisible();
      await expect(page.locator('.pagefind-ui__result')).toHaveCount(0);
    });

    test('search page has no axe violations', async ({ page }) => {
      await page.goto(`${locale}/search/?q=${encodeURIComponent(query)}`);
      await expect(page.locator('.pagefind-ui__result').first()).toBeVisible();
      const results = await axe(page).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
