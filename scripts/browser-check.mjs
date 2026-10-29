import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('evals/reports/screenshots', { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
for (const [width, height, name] of [[1440, 1000, 'desktop'], [768, 1024, 'tablet'], [390, 844, 'phone']]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `evals/reports/screenshots/${name}.png`, fullPage: true });
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
  results.push({name, size, errors, text: (await page.locator('body').innerText()).slice(0, 7000)});
  await page.close();
}
await browser.close();
writeFileSync('evals/reports/browser-layout.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
