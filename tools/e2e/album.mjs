// 验证图鉴点击放大:播种图鉴 → 网格截图 → 点击卡片 → 放大层截图 → Esc 关闭
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
const BASE = 'http://127.0.0.1:8123/';
mkdirSync('tools/e2e/shots', { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
catch { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(BASE);
await page.waitForTimeout(1800);
await page.evaluate(async () => {
  const g = await import('./src/game.js');
  const s = await import('./src/save.js');
  s.save.album = { duck: true, fans: true, tea: true, plum: true, stone: true, taro: true };
  g.G.albumFrom = 'menu';
  g.G.state = 'album';
});
await page.waitForTimeout(400);
await page.screenshot({ path: 'tools/e2e/shots/album.png' });

// 点击第一张卡(duck):逻辑坐标 (150,140) → client 坐标
const box = await (await page.$('#cv')).boundingBox();
const cx = box.x + 150 / 960 * box.width, cy = box.y + 140 / 540 * box.height;
await page.mouse.click(cx, cy);
await page.waitForTimeout(300);
const zoomed = await page.evaluate(async () => (await import('./src/game.js')).G.albumZoom);
await page.screenshot({ path: 'tools/e2e/shots/album_zoom.png' });

// Esc 应先关放大层,再退图鉴
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const afterEsc = await page.evaluate(async () => {
  const g = await import('./src/game.js');
  return { zoom: g.G.albumZoom, state: g.G.state };
});
await page.screenshot({ path: 'tools/e2e/shots/album_back.png' });

console.log('zoomed:', zoomed, '| afterEsc:', JSON.stringify(afterEsc));
console.log(errors.length ? 'ERRORS:\n  ' + errors.join('\n  ') : 'no errors');
await browser.close();
if (errors.length || zoomed !== 'duck' || afterEsc.zoom !== null || afterEsc.state !== 'album') process.exit(1);
