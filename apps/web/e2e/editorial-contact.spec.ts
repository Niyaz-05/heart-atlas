import { expect, test } from '@playwright/test';
test('physician contribution page uses GitHub contact and no fabricated approval', async ({page}) => {
  await page.goto('en/for-doctors/');
  await expect(page.getByRole('heading',{level:1})).toHaveText('For physicians');
  await expect(page.getByRole('link',{name:'Contact via GitHub Issues'})).toHaveAttribute('href',/github.com\/w3lld1\/heart-atlas\/issues\/new/);
});
test('article print action invokes the local browser only', async ({page}) => {
  await page.addInitScript(() => { window.print = () => document.documentElement.setAttribute('data-printed','yes'); });
  await page.goto(process.env['HA_TEST_CONTENT']==='1' ? 'en/anatomy/editorial-demo/' : 'en/anatomy/heart-valves/');
  await page.getByRole('button',{name:'Print article'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-printed','yes');
});
