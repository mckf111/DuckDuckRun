// 分享链路与竖屏引导冒烟:微信 UA 走长按保存遮罩 / 复制链接 / 竖屏旋转层
// 用法: node tools/e2e/share_check.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const BASE = 'http://127.0.0.1:8123/';
mkdirSync('tools/e2e/shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });

function assert(cond, msg){
  console.log((cond ? 'ok  ' : 'FAIL') + '  ' + msg);
  if(!cond) process.exitCode = 1;
}

// --- 1. 竖屏 + 触屏:旋转引导层显示 ---
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true, isMobile: true,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE);
  await page.waitForTimeout(1500);
  const vis = await page.evaluate(() => document.getElementById('rotate').style.display);
  assert(vis === 'flex', '竖屏触屏显示旋转引导层 (display=' + vis + ')');
  await page.screenshot({ path: 'tools/e2e/shots/rotate.png' });
  assert(errors.length === 0, '竖屏页无 JS 错误' + (errors.length ? ': ' + errors.join(';') : ''));
  await ctx.close();
}

// --- 2. 微信 UA:跑一局 → 死亡 → 分享 → 长按保存遮罩 + 复制链接 ---
{
  const ctx = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true, isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.40',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(BASE + '#lv0');
  // 随机输入直到撞死(约 15~40s)
  const t0 = Date.now();
  let over = false;
  while (Date.now() - t0 < 45000){
    await page.keyboard.press(['Space','ArrowLeft','ArrowRight','ArrowDown'][Math.floor(Math.random()*4)]);
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => document.title);   // 无法直接读模块状态,用屏幕判断:等死因提示出现
    if (await page.evaluate(() => !!document.body.innerText)) { /* noop */ }
    if (await page.locator('canvas').count() > 0) {
      // 用截图差异粗略判断已死亡:检测 share 按钮文案(Canvas 内无法 DOM 判断)——
      // 干脆直接点击 canvas 中心下方"分享成绩"按钮位置,若已死则点中分享
    }
  }
  // 死亡页按钮(逻辑坐标):share 在 (CX-115, H*0.68);canvas 适配后需换算
  const box = await page.locator('canvas').boundingBox();
  async function clickLogical(lx, ly){
    const r = await page.locator('canvas').boundingBox();
    await page.mouse.click(r.x + lx * r.width / 960, r.y + ly * r.height / 540);
  }
  // 若还没死,继续撞:按左键不放一段时间必然撞墙
  for(let i=0;i<20;i++){ await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(200); }
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tools/e2e/shots/over_wx.png' });
  await clickLogical(960/2 - 115, 540*0.68);   // 分享成绩
  await page.waitForTimeout(1200);
  const layer = await page.evaluate(() => {
    const el = document.getElementById('shareLayer');
    return el.style.display;
  });
  assert(layer === 'flex', '微信内分享弹出长按保存遮罩 (display=' + layer + ')');
  await page.screenshot({ path: 'tools/e2e/shots/share_layer.png' });
  // 复制链接按钮
  const toast0 = await page.evaluate(() => document.getElementById('shareToast').style.opacity);
  await clickLogical(960/2 + 115, 540*0.68);   // 复制链接(若不在 over 页则点空)
  await page.waitForTimeout(600);
  const clip = await page.evaluate(() => {
    const el = document.getElementById('shareToast');
    return { opacity: el.style.opacity, text: el.textContent };
  });
  const layer2 = await page.evaluate(() => document.getElementById('shareLayer').style.display);
  const clickCopyOnLayer = layer2 === 'flex';
  if(clickCopyOnLayer){
    // 遮罩内复制按钮是 DOM 按钮
    await page.click('#copyBtn');
    await page.waitForTimeout(600);
  }
  const clip2 = await page.evaluate(() => ({
    opacity: document.getElementById('shareToast').style.opacity,
    text: document.getElementById('shareToast').textContent,
  }));
  const got = clickCopyOnLayer ? clip2 : clip;
  assert(got.opacity === '1' && got.text.includes('复制'), '复制链接出现提示 (' + got.text + ')');
  assert(errors.length === 0, '分享链路无 JS 错误' + (errors.length ? ': ' + errors.join(';') : ''));
  await ctx.close();
}

await browser.close();
console.log(process.exitCode ? '== SHARE CHECK FAILED' : '== SHARE CHECK DONE');
