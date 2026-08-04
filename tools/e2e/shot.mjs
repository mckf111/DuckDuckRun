// 截图验证 + 冒烟测试:对各深链页面截屏,收集 pageerror/console error,有问题时非零退出
// 用法: node tools/e2e/shot.mjs [menu|lv0|lv1|lv2|lv3|lv4|play ...]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const BASE = 'http://127.0.0.1:8123/';
const ALL = {
  menu: [BASE, 2500],
  levels: [BASE, 2500, 'click'],   // 点「冒险模式」进选关页
  lv0: [BASE + '#lv0', 3900],
  lv1: [BASE + '#lv1', 3900],
  lv2: [BASE + '#lv2', 3900],
  lv3: [BASE + '#lv3', 3900],
  lv4: [BASE + '#lv4', 3900],
  lv5: [BASE + '#lv5', 3900],
  lv6: [BASE + '#lv6', 3900],
  lv7: [BASE + '#lv7', 3900],
  lv8: [BASE + '#lv8', 3900],
  lv9: [BASE + '#lv9', 3900],
  play: [BASE + '#play', 3900],
};
const picks = process.argv.slice(2);
const shots = picks.length ? picks.map(k => [k, ALL[k]]) : Object.entries(ALL);

mkdirSync('tools/e2e/shots', { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
catch { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });

const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

// 游戏画面截图期间随机输入,避免鸭子 39m 必撞、截图撞上死亡结算
async function playInputs(ms){
  const keys = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowDown'];
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await page.keyboard.press(keys[Math.floor(Math.random() * keys.length)]);
    await page.waitForTimeout(320);
  }
}

for (const [name, [url, wait, mode]] of shots) {
  errors.length = 0;
  await page.goto('about:blank');   // 强制整页重载,否则仅哈希变化不会重跑深链逻辑
  await page.goto(url);
  if (mode === 'click') {
    const box = await page.locator('canvas').boundingBox();
    const at = (x, y) => [box.x + x / 960 * box.width, box.y + y / 540 * box.height];
    await page.waitForTimeout(1200);
    const [ax, ay] = at(480, 540 * 0.62);   // 冒险模式按钮
    await page.mouse.click(ax, ay);
    await page.waitForTimeout(1500);
  } else if (name === 'menu') await page.waitForTimeout(wait);
  else await playInputs(wait);
  await page.screenshot({ path: `tools/e2e/shots/${name}.png` });
  console.log(name, errors.length ? 'ERRORS:\n  ' + errors.join('\n  ') : 'ok');
}
await browser.close();
