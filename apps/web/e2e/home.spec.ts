import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page opens under the base path', async ({ page }) => {
  const response = await page.goto('./');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Heart Atlas');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Heart Atlas');
});

test('assets resolve under the base path', async ({ page, request, baseURL }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href?.startsWith(new URL(baseURL ?? '').pathname)).toBe(true);
  const icon = await request.get(href ?? '');
  expect(icon.status()).toBe(200);
});

test('home page has no axe violations', async ({ page }) => {
  await page.goto('./');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(results.violations).toEqual([]);
});
