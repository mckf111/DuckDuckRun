// 定点验证:传送距离后截穿越门/指定关卡状态
// 用法: node tools/e2e/shot2.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const BASE = 'http://127.0.0.1:8123/';
mkdirSync('tools/e2e/shots', { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
catch { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });

async function setDist(d){
  await page.evaluate(async dd => {
    const m = await import('./src/game.js');
    m.G.dist = dd;
  }, d);
}
async function shot(name){ await page.screenshot({ path: `tools/e2e/shots/${name}.png` }); console.log(name, 'ok'); }

// 1) 明城墙:传送到 118m,穿越门(130m)逼近
await page.goto(BASE + '#lv0');
await page.waitForTimeout(1800);
await setDist(118);
await page.waitForTimeout(500);
await shot('gate_zhonghua');
// 2) 中山陵:博爱坊门 + 台阶路面
await page.goto('about:blank');
await page.goto(BASE + '#lv2');
await page.waitForTimeout(1800);
await setDist(122);
await page.waitForTimeout(400);
await shot('gate_sunyard');
// 3) 夫子庙:天下文枢坊门 + 画舫障碍
await page.goto('about:blank');
await page.goto(BASE + '#lv3');
await page.waitForTimeout(1800);
await setDist(124);
await page.waitForTimeout(400);
await shot('gate_fuzimiao');
// 4) 玄武湖:存活态干净全景
await page.goto('about:blank');
await page.goto(BASE + '#lv1');
await page.waitForTimeout(1800);
await setDist(60);
await page.waitForTimeout(400);
await shot('lv1_clean');
// 5) 无尽模式:600m 边界叠化(传送到 575)
await page.goto('about:blank');
await page.goto(BASE + '#play');
await page.waitForTimeout(1800);
await setDist(575);
await page.waitForTimeout(600);
await shot('endless_mix');
await browser.close();
