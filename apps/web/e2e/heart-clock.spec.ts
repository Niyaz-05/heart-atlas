import { expect, test } from '@playwright/test';
import { productionLocales } from '../src/i18n/locales.ts';
import en from '../src/i18n/messages/en.json' with { type: 'json' };
import { axe } from './axe.ts';

for (const locale of Object.keys(productionLocales)) {
  test.describe(`heart clock page (${locale})`, () => {
    test('is linked from the home page', async ({ page }) => {
      await page.goto(`${locale}/`);
      await page.locator('main a[href$="/heart-clock/"]').click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/heart-clock/$`));
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('draws the ECG and has no axe violations', async ({ page }) => {
      await page.goto(`${locale}/heart-clock/`);
      const ecg = page.getByRole('img');
      await expect(ecg).toBeVisible();
      await expect(ecg).toHaveAttribute('width', /^[1-9]\d*$/);
      const results = await axe(page).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test.describe('heart clock controls', () => {
  test('plays by default, pauses and follows the heart rate', async ({ page }) => {
    await page.goto('en/heart-clock/');
    await page.getByRole('button', { name: en['heartClock.pause'] }).click();
    await expect(page.getByRole('button', { name: en['heartClock.play'] })).toBeVisible();

    const slider = page.getByRole('slider', { name: en['heartClock.heartRate'] });
    await slider.fill('120');
    await expect(page.getByText(/Sinus rhythm at 120 beats per minute/)).toBeVisible();
    await expect(page.getByRole('img')).toHaveAccessibleDescription(/120 beats per minute/);
  });

  test('starts paused when the reader prefers reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('en/heart-clock/');
    // Wait for hydration: the island renders the speed radios with formatted labels either way,
    // so check that the play button stays after the effects have run.
    await expect(page.getByRole('radio', { name: '×0.5' })).toBeVisible();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: en['heartClock.play'] })).toBeVisible();
  });

  test('shows a phase that changes while playing', async ({ page }) => {
    await page.goto('en/heart-clock/');
    // The pause button appears once the island has hydrated and started.
    await expect(page.getByRole('button', { name: en['heartClock.pause'] })).toBeVisible();
    const phase = page.locator('[data-phase]');
    const seen = new Set<string>();
    await expect
      .poll(
        async () => {
          seen.add((await phase.getAttribute('data-phase')) ?? '');
          return seen.size;
        },
        { timeout: 5000, intervals: [50] },
      )
      .toBeGreaterThanOrEqual(3);
  });
});
