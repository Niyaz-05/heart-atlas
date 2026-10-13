import { expect, test } from '@playwright/test';

test.describe('editorial technical fixtures', () => {
  test.skip(process.env['HA_TEST_CONTENT'] !== '1', 'Only the isolated fictional fixture build');
  test('guided blocks are isolated and keep diagram radio state in sync by keyboard', async ({page}) => {
    await page.goto('en/anatomy/editorial-demo/');
    const blocks = page.locator('[data-guided]');
    await expect(blocks).toHaveCount(2);
    await blocks.first().getByRole('button', {name: 'Next'}).focus();
    await page.keyboard.press('Enter');
    await expect(blocks.first().locator('input[value="systole"]')).toBeChecked();
    await expect(blocks.nth(1).locator('input[value="diastole"]')).toBeChecked();
    await expect(blocks.first().locator('[data-step="1"]')).toBeVisible();
    await blocks.first().getByRole('button', {name: 'Previous'}).click();
    await expect(blocks.first().locator('input[value="diastole"]')).toBeChecked();
  });
  test('report terms are semantic, local and printable on mobile', async ({page}) => {
    await page.setViewportSize({width:320,height:740});
    await page.goto('en/anatomy/editorial-demo/');
    const reports=page.locator('[data-report]');
    await expect(reports).toHaveCount(2);
    await reports.first().locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(reports.first().locator('details')).toHaveAttribute('open','');
    await expect(reports.nth(1).locator('details')).not.toHaveAttribute('open','');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.emulateMedia({media:'print'});
    await expect(reports.nth(1).locator('.term-explanation')).toBeVisible();
    await expect(page.locator('[data-guided]').first().locator('[data-step="1"]')).toBeVisible();
  });
  test('no-JS and reduced motion retain all explanation text', async ({browser}) => {
    const context=await browser.newContext({javaScriptEnabled:false,reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.goto('http://localhost:4321/heart-atlas/en/anatomy/editorial-demo/');
    await expect(page.locator('[data-guided]').first().locator('[data-step="1"]')).toBeVisible();
    await page.locator('[data-report]').first().locator('summary').click();
    await expect(page.locator('[data-report]').first().locator('.term-explanation')).toBeVisible();
    await context.close();
  });
});
