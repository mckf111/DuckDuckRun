// F1 存档标量白屏 + M3 album 白名单验证(临时)
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://127.0.0.1:8123/');
await page.evaluate(() => localStorage.setItem('jinling_run_v1', '123'));
await page.reload();
await page.waitForTimeout(2000);
const canvasOk = await page.evaluate(() => {
  const c = document.getElementById('cv');
  return c && c.width === 960;
});
console.log(canvasOk ? 'ok  scalar save -> game runs' : 'FAIL white screen');
console.log('errors:', errors.length ? errors.join('; ') : 'none');
const bad = { album: { fake: true, duck: true } };
await page.evaluate(b => localStorage.setItem('jinling_run_v1', JSON.stringify(b)), bad);
await page.reload();
await page.waitForTimeout(1500);
const album = await page.evaluate(async () => (await import('./src/save.js')).save.album);
console.log(JSON.stringify(album) === '{"duck":true}' ? 'ok  album whitelist filters fake keys' : 'FAIL album: ' + JSON.stringify(album));
// Infinity best
const bad2 = { best: Infinity };
await page.evaluate(b => localStorage.setItem('jinling_run_v1', JSON.stringify(b)), bad2);
await page.reload();
await page.waitForTimeout(1500);
const best = await page.evaluate(async () => (await import('./src/save.js')).save.best);
console.log(best === 0 ? 'ok  Infinity best -> 0' : 'FAIL best: ' + best);
// 旧 6 关存档:长度 6→10,桥进度(index5)迁移到 index9,index5 新关保持未玩
const old6 = { stars: [3,2,1,0,0,2], cleared: [true,true,true,false,false,true], album: { duck: true } };
await page.evaluate(b => localStorage.setItem('jinling_run_v1', JSON.stringify(b)), old6);
await page.reload();
await page.waitForTimeout(1500);
const mig = await page.evaluate(async () => (await import('./src/save.js')).save);
const lenOk = mig.stars.length === 10 && mig.cleared.length === 10;
const bridgeOk = mig.stars[9] === 2 && mig.cleared[9] === true;
const yiheOk = mig.stars[5] === 0 && mig.cleared[5] === false;
const keepOk = mig.stars[0] === 3 && mig.cleared[3] === false;
console.log(lenOk && bridgeOk && yiheOk && keepOk ? 'ok  6关旧档迁移: 长度10/桥进度迁9/颐和路未玩/旧值保留'
  : 'FAIL 迁移: len='+mig.stars.length+' stars9='+mig.stars[9]+' cleared9='+mig.cleared[9]+' stars5='+mig.stars[5]);
// 新 10 关格式直读
const fresh10 = { stars: [1,2,3,0,0,0,0,0,0,1], cleared: [true,true,true,false,false,false,false,false,false,true] };
await page.evaluate(b => localStorage.setItem('jinling_run_v1', JSON.stringify(b)), fresh10);
await page.reload();
await page.waitForTimeout(1500);
const fresh = await page.evaluate(async () => (await import('./src/save.js')).save);
console.log(fresh.stars[9] === 1 && fresh.stars[4] === 0 && !fresh.cleared[4] ? 'ok  新 10 关格式直读' : 'FAIL 新格式: stars9='+fresh.stars[9]);
await browser.close();
