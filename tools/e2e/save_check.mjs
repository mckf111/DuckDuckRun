// F1 存档标量白屏 + M3 album 白名单验证(临时)
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://127.0.0.1:8123/');
await page.evaluate(() => localStorage.setItem('jinling_run_v1', '123'));
await page.reload();
await page.waitForTimeout(2000);
const canvasOk = await page.evaluate(() => {
  const c = document.getElementById('cv');
  return c && c.width === 960;
});
console.log(canvasOk ? 'ok  scalar save -> game runs' : 'FAIL white screen');
console.log('errors:', errors.length ? errors.join('; ') : 'none');
const bad = { album: { fake: true, duck: true } };
await page.evaluate(b => localStorage.setItem('jinling_run_v1', JSON.stringify(b)), bad);
await page.reload();
await page.waitForTimeout(1500);
const album = await page.evaluate(async () => (await import('./src/save.js')).save.album);
console.log(JSON.stringify(album) === '{"duck":true}' ? 'ok  album whitelist filters fake keys' : 'FAIL album: ' + JSON.stringify(album));
// Infinity best
const bad2 = { best: Infinity };
await page.evaluate(b => localStorage.setItem('jinling_run_v1', JSON.stringify(b)), bad2);
await page.reload();
await page.waitForTimeout(1500);
const best = await page.evaluate(async () => (await import('./src/save.js')).save.best);
console.log(best === 0 ? 'ok  Infinity best -> 0' : 'FAIL best: ' + best);
await browser.close();
