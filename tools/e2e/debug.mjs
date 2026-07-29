// 调试:打印浏览器控制台与页面错误
import { chromium } from 'playwright-core';
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
catch { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
const page = await browser.newPage();
page.on('console', m => console.log('CONSOLE', m.type(), m.text()));
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto('http://127.0.0.1:8123/#lv2');
await page.waitForTimeout(4000);
const info = await page.evaluate(() => ({
  hash: location.hash,
  state: window.__G ? window.__G.state : '(no __G)',
}));
console.log('INFO', JSON.stringify(info));
await browser.close();
