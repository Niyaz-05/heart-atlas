import { expect, test, type Page } from '@playwright/test';
import { paramRanges, defaultParams } from '@heart-atlas/heart-clock';
import { productionLocales } from '../src/i18n/locales.ts';
import en from '../src/i18n/messages/en.json' with { type: 'json' };
import { axe } from './axe.ts';

/** Checks what every embed page must have: no site chrome, noindex, canonical, credit, no worker. */
async function expectEmbedShell(page: Page, canonicalPath: RegExp) {
  await expect(page.locator('header')).toHaveCount(0);
  await expect(page.locator('form[role="search"]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonicalPath);
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
  await expect(page.locator('.update-region')).toHaveCount(0);
  const open = page.locator('footer a[target="_blank"]');
  await expect(open).toHaveAttribute('rel', 'noopener');
  await expect(open).toHaveAttribute('href', canonicalPath);
  await expect(page.locator('footer')).toContainText('CC BY-SA 4.0');
}

for (const locale of Object.keys(productionLocales)) {
  test.describe(`embed (${locale})`, () => {
    test('ECG module has the embed shell and no axe violations', async ({ page }) => {
      await page.goto(`${locale}/embed/ecg/`);
      await expect(page.getByRole('img').first()).toBeVisible();
      await expectEmbedShell(page, new RegExp(`/${locale}/heart-clock/$`));
      const results = await axe(page).analyze();
      expect(results.violations).toEqual([]);
    });

    test('disease module keeps the review notice and sources', async ({ page }) => {
      await page.goto(`${locale}/embed/`);
      const src = await page
        .locator('select[name="module"] option[value*="/embed/disease/"]')
        .first()
        .getAttribute('value');
      expect(src).not.toBeNull();
      const { pathname } = new URL(src ?? '');
      await page.goto(pathname);
      await expect(page.locator('.review-notice')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('section.sources li').first()).toBeVisible();
      const slug = pathname.split('/').filter(Boolean).at(-1) ?? '';
      await expectEmbedShell(page, new RegExp(`/disease/${slug}/$`));
      const results = await axe(page).analyze();
      expect(results.violations).toEqual([]);
    });

    test('builder is linked from the footer and has no axe violations', async ({ page }) => {
      await page.goto(`${locale}/`);
      await page.locator(`footer a[href$="/${locale}/embed/"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/embed/$`));
      await expect(page.locator('textarea[name="code"]')).toHaveValue(/<iframe /);
      const results = await axe(page).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test.describe('embed parameters', () => {
  const slider = (page: Page) => page.getByRole('slider', { name: en['heartClock.heartRate'] });

  test('applies a whitelisted parameter and ignores unknown ones', async ({ page }) => {
    await page.goto('en/embed/ecg/?rate=120&autoplay=1&locale=ru');
    await expect(slider(page)).toHaveValue('120');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('ignores an out-of-range value', async ({ page }) => {
    await page.goto(`en/embed/ecg/?rate=${paramRanges.heartRate[1] + 1}`);
    await expect(slider(page)).toHaveValue(String(defaultParams.heartRate));
  });
});

test.describe('embed builder', () => {
  test('builds code with title, lazy loading and the chosen parameters', async ({ page }) => {
    await page.goto('en/embed/');
    const code = page.locator('textarea[name="code"]');
    await expect(code).toHaveValue(/title="[^"]+"/);
    await expect(code).toHaveValue(/loading="lazy"/);
    await expect(code).toHaveValue(/src="[^"]*\/heart-atlas\/en\/embed\/ecg\/"/);

    await page.getByLabel(en['heartClock.heartRate']).fill('90');
    await expect(code).toHaveValue(/\/en\/embed\/ecg\/\?rate=90"/);

    const disease = page.locator('select[name="module"] option[value*="/embed/disease/"]').first();
    const value = await disease.getAttribute('value');
    await page.locator('select[name="module"]').selectOption(value ?? '');
    await expect(page.getByLabel(en['heartClock.heartRate'])).toBeHidden();
    await expect(code).not.toHaveValue(/rate=/);
    await expect(code).toHaveValue(/\/en\/embed\/disease\//);
  });
});
