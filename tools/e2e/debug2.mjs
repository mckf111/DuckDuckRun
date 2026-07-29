// 调试 2:直接从游戏模块读状态
import { chromium } from 'playwright-core';
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
catch { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto('http://127.0.0.1:8123/#lv2');
await page.waitForTimeout(1500);
const s1 = await page.evaluate(async () => {
  const m = await import('./src/game.js');
  return { state: m.G.state, dist: Math.round(m.G.dist), mode: m.G.mode, lvIdx: m.G.lvIdx };
});
console.log('t=1.5s', JSON.stringify(s1));
await page.waitForTimeout(3000);
const s2 = await page.evaluate(async () => {
  const m = await import('./src/game.js');
  return { state: m.G.state, dist: Math.round(m.G.dist), mode: m.G.mode, lvIdx: m.G.lvIdx };
});
console.log('t=4.5s', JSON.stringify(s2));
await browser.close();
