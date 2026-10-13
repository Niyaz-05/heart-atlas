import { expect, test } from '@playwright/test';
test('preview is versioned noindex and has no PWA registration', async ({ page }) => {
  test.skip(process.env['HA_CONTENT_MODE'] !== 'preview', 'Separate preview artifact');
  await page.goto('ru/anatomy/editorial-draft/');
  await expect(page.locator('[data-preview]')).toContainText(/Preview|Предпросмотр/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('body')).toContainText('HA_DRAFT_SECRET_48f6');
  expect(await page.locator('link[rel="manifest"]').count()).toBe(0);
  expect(
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
  ).toBe(0);
});
