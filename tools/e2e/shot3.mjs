// 验证相册界面:解锁部分图鉴后截屏
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
const BASE = 'http://127.0.0.1:8123/';
mkdirSync('tools/e2e/shots', { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
catch { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
await page.goto(BASE);
await page.waitForTimeout(1800);
await page.evaluate(async () => {
  const g = await import('./src/game.js');
  const s = await import('./src/save.js');
  // 解锁 4/6 件(含无照片的雨花茶),验证照片卡 + 手绘卡 + 相纸背面三种态
  s.save.album = { duck: true, fans: true, tea: true, plum: true };
  g.G.albumFrom = 'menu';
  g.G.state = 'album';
});
await page.waitForTimeout(400);
await page.screenshot({ path: 'tools/e2e/shots/album.png' });
console.log('album ok');
await browser.close();
