// 终验:选关界面 + 相册(修正后) + 全深链错误巡查
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
const BASE = 'http://127.0.0.1:8123/';
mkdirSync('tools/e2e/shots', { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
catch { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));

// 选关界面
await page.goto(BASE);
await page.waitForTimeout(1800);
await page.evaluate(async () => { (await import('./src/game.js')).G.state = 'levels'; });
await page.waitForTimeout(300);
await page.screenshot({ path: 'tools/e2e/shots/levels.png' });
console.log('levels ok');

// 相册(4/6 解锁)
await page.evaluate(async () => {
  const g = await import('./src/game.js');
  const s = await import('./src/save.js');
  s.save.album = { duck: true, fans: true, tea: true, plum: true };
  g.G.albumFrom = 'menu'; g.G.state = 'album';
});
await page.waitForTimeout(300);
await page.screenshot({ path: 'tools/e2e/shots/album.png' });
console.log('album ok');

// 全深链 pageerror 巡查
for (const h of ['#lv0', '#lv1', '#lv2', '#lv3', '#lv4', '#play']) {
  await page.goto('about:blank');
  await page.goto(BASE + h);
  await page.waitForTimeout(2500);
}
console.log('pageerrors:', errors.length ? errors : '(none)');
await browser.close();
