import { test } from '@playwright/test';
import fs from 'node:fs';

test.use({ channel: 'msedge' });

test('edge session smoke', async ({ page }) => {
  const session = fs.readFileSync(process.env.TEMP + '\\babel-edge-session.json', 'utf8');
  await page.goto('http://127.0.0.1:4173');
  await page.evaluate((value) => {
    localStorage.setItem('CapacitorStorage.sb-ulibmcqfuemefekyvrqj-auth-token', value);
  }, session);
  await page.reload({ waitUntil: 'networkidle' });
  console.log(await page.title());
  console.log((await page.locator('body').innerText()).slice(0, 2000));
});
