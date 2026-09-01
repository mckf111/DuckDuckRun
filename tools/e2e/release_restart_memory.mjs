import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const out = join(root, 'docs', 'qa', 'evidence', 'release-restart-memory.json');
const base = 'http://127.0.0.1:8132';
const executable = process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const server = spawn('python3', ['-m', 'http.server', '8132', '--bind', '127.0.0.1'], {cwd:dist, stdio:'ignore'});
const result = {
  schema:'duckduckrun-release-restart-memory/v1',
  capturedAt:new Date().toISOString(),
  environment:'Local headless Chromium touch simulation (844×390, DPR 2); CDP JavaScript heap only, not device or GPU memory.',
  cycles:10,
  errors:[],
};
async function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitServer(){
  for(let i=0;i<50;i++){
    try{ if((await fetch(`${base}/build-info.json`)).ok) return; }catch(error){}
    await sleep(100);
  }
  throw new Error('内存检查静态服务未启动');
}
let browser;
try{
  await waitServer();
  browser = await chromium.launch({headless:true, executablePath:executable, args:['--no-sandbox']});
  const context = await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  page.on('pageerror', error => result.errors.push(`pageerror:${error.message}`));
  page.on('console', message => { if(message.type()==='error') result.errors.push(`console:${message.text()}`); });
  page.on('requestfailed', request => result.errors.push(`request:${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => { if(response.status() >= 400) result.errors.push(`http:${response.status()} ${response.url()}`); });
  await page.goto(`${base}/?slice=1&demo&seed=20260903`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', {timeout:4000});
  await page.keyboard.press('ArrowRight');
  await cdp.send('HeapProfiler.enable').catch(() => {});
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
  result.heapBefore = await cdp.send('Runtime.getHeapUsage').catch(() => null);
  for(let index=1; index<=10; index++){
    await page.evaluate(async () => {
      const game = await import('./src/game.js');
      game.gameOver('full');
      for(let frame=0; frame<8; frame++) game.update(0.1);
    });
    await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'over', {timeout:1000});
    await page.keyboard.press('Enter');
    await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', {timeout:1000});
    await sleep(120);
    result[`restart${index}`] = await page.evaluate(async () => {
      const game = await import('./src/game.js');
      return {state:game.G.state,mode:game.G.mode,paused:game.G.paused};
    });
  }
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
  result.heapAfter = await cdp.send('Runtime.getHeapUsage').catch(() => null);
  result.heapDeltaPct = result.heapBefore && result.heapAfter
    ? Number((((result.heapAfter.usedSize - result.heapBefore.usedSize) / Math.max(1, result.heapBefore.usedSize)) * 100).toFixed(2)) : null;
  result.passed = result.errors.length === 0 && Object.values(Object.fromEntries(Object.entries(result).filter(([key]) => key.startsWith('restart')))).every(value => value.state==='play' && value.mode==='slice' && value.paused===false)
    && (result.heapDeltaPct === null || result.heapDeltaPct <= 15);
  assert.equal(result.passed, true, `十次重开内存检查不通过：${JSON.stringify(result)}`);
  await context.close();
} catch(error){
  result.passed = false;
  result.failure = error.stack || String(error);
  throw error;
} finally {
  mkdirSync(dirname(out), {recursive:true});
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  if(browser) await browser.close().catch(() => {});
  server.kill();
}
console.log(`PASS | 十次重开内存检查：堆变化 ${result.heapDeltaPct ?? 'N/A'}%，控制台和网络错误 0`);
