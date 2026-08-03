// HUD 交互冒烟:暂停按钮/静音按钮真实可点,教学飘字按设备出文案
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });

function assert(cond, msg){
  console.log((cond ? 'ok  ' : 'FAIL') + '  ' + msg);
  if(!cond) process.exitCode = 1;
}

// 桌面(键盘教学文案)
{
  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8123/#lv0');
  await page.waitForTimeout(800);
  const tut = await page.evaluate(async () => {
    const g = await import('./src/game.js');
    return g.G.tut.map(t => t.text).join(' | ');
  });
  assert(tut.includes('整墙:← → 换道') && tut.includes('↑ 跳过矮墩') && tut.includes('二段跳'),
    '键盘教学文案含整墙/矮墩/二段跳: ' + tut);
  // 暂停按钮(HUD 右上,逻辑坐标 W-42,34)
  const r = await page.locator('canvas').boundingBox();
  const clickL = async (lx, ly) => {
    const rr = await page.locator('canvas').boundingBox();
    await page.mouse.click(rr.x + lx*rr.width/960, rr.y + ly*rr.height/540);
  };
  await clickL(960-42, 34);
  await page.waitForTimeout(400);
  const paused = await page.evaluate(async () => (await import('./src/game.js')).G.paused);
  assert(paused === true, '点击右上角按钮可暂停');
  // 继续
  await clickL(960/2, 540*0.56);
  await page.waitForTimeout(300);
  const paused2 = await page.evaluate(async () => (await import('./src/game.js')).G.paused);
  assert(paused2 === false, '继续按钮恢复游戏');
  // 静音按钮
  await clickL(960-96, 34);
  await page.waitForTimeout(300);
  const muted = await page.evaluate(async () => (await import('./src/save.js')).save.muted);
  assert(muted === true, '静音按钮可切换');
  await clickL(960-96, 34);   // 恢复
  assert(errors.length === 0, '无 JS 错误' + (errors.length ? ': ' + errors.join(';') : ''));
  await page.close();
}

// 触屏(手势文案)
{
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8123/#lv0');
  await page.waitForTimeout(4000);   // 等前三簇全部生成(约 100m)
  const tut = await page.evaluate(async () => {
    const g = await import('./src/game.js');
    return g.G.tut.map(t => t.text).join(' | ');
  });
  assert(tut.includes('整墙:左右滑换道') && tut.includes('上滑跳过矮墩') && tut.includes('下滑滑铲钻高门'),
    '触屏教学文案用手势: ' + tut);
  await ctx.close();
}

await browser.close();
console.log(process.exitCode ? '== INTERACT CHECK FAILED' : '== INTERACT CHECK DONE');
