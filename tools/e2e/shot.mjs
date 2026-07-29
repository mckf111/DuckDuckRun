// 截图验证:对各深链页面截屏,输出到 tools/e2e/shots/
// 用法: node tools/e2e/shot.mjs [menu|lv0|lv1|lv2|lv3|lv4|play ...]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const BASE = 'http://127.0.0.1:8123/';
const ALL = {
  menu: [BASE, 2500],
  lv0: [BASE + '#lv0', 3900],
  lv1: [BASE + '#lv1', 3900],
  lv2: [BASE + '#lv2', 3900],
  lv3: [BASE + '#lv3', 3900],
  lv4: [BASE + '#lv4', 3900],
  play: [BASE + '#play', 3900],
};
const picks = process.argv.slice(2);
const shots = picks.length ? picks.map(k => [k, ALL[k]]) : Object.entries(ALL);

mkdirSync('tools/e2e/shots', { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
catch { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
for (const [name, [url, wait]] of shots) {
  await page.goto('about:blank');   // 强制整页重载,否则仅哈希变化不会重跑深链逻辑
  await page.goto(url);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `tools/e2e/shots/${name}.png` });
  console.log(name, 'ok');
}
await browser.close();
