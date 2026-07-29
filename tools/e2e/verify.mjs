import { chromium } from 'playwright-core';
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
catch { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto('http://127.0.0.1:8123/');
await page.waitForTimeout(3500);
const canvas = await page.$('#cv');
const box = await canvas.boundingBox();
const cx = box.x + box.width / 2, by = box.y + box.height * 0.52;

// 微拖 30px 点击"冒险模式"按钮
await page.mouse.move(cx, by); await page.mouse.down();
await page.mouse.move(cx + 30, by + 5, { steps: 3 });
await page.mouse.up();
await page.waitForTimeout(400);
await page.screenshot({ path: 'tools/e2e/shots/v_dragclick.png' });

// 干净点击对照
await page.mouse.click(cx, by);
await page.waitForTimeout(400);
await page.screenshot({ path: 'tools/e2e/shots/v_cleanclick.png' });

// 深链 + 暂停
await page.goto('about:blank');
await page.goto('http://127.0.0.1:8123/#lv0');
await page.waitForTimeout(3800);
await page.keyboard.press('p');
await page.waitForTimeout(300);
await page.screenshot({ path: 'tools/e2e/shots/v_pause.png' });

console.log('errors:', errors.length ? errors : 'none');
await browser.close();
