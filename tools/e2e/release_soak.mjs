import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const out = join(root, 'docs', 'qa', 'evidence', 'release-soak.json');
const base = 'http://127.0.0.1:8131';
const durationMs = Number(process.env.SOAK_DURATION_MS || 20 * 60 * 1000);
const executable = process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const server = spawn('python3', ['-m', 'http.server', '8131', '--bind', '127.0.0.1'], {cwd:dist, stdio:'ignore'});

async function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitServer(){
  for(let i=0;i<50;i++){
    try{ if((await fetch(`${base}/build-info.json`)).ok) return; }catch(error){}
    await sleep(100);
  }
  throw new Error('浸泡测试静态服务未启动');
}

const result = {
  schema:'duckduckrun-release-soak/v1',
  startedAt:new Date().toISOString(),
  targetDurationMs:durationMs,
  environment:'Local headless Chromium touch simulation (844×390, DPR 2); actual runtime loop, not a physical-device conclusion.',
  lifecycle:{},
  errors:[],
};
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
  await page.addInitScript(() => {
    window.__releaseSoak = {longTaskMaxMs:0,longTaskCount:0,cycles:0};
    if(typeof PerformanceObserver === 'function'){
      try{
        new PerformanceObserver(list => list.getEntries().forEach(entry => {
          window.__releaseSoak.longTaskCount++;
          window.__releaseSoak.longTaskMaxMs = Math.max(window.__releaseSoak.longTaskMaxMs, entry.duration);
        })).observe({type:'longtask', buffered:true});
      }catch(error){}
    }
  });
  const start = Date.now();
  await page.goto(`${base}/?slice=1&demo&seed=20260903`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', {timeout:4000});
  await page.keyboard.press('ArrowRight'); // 真实用户手势语义，解锁音频。
  const heapBefore = await cdp.send('Runtime.getHeapUsage').catch(() => null);
  await page.evaluate(async () => {
    const game = await import('./src/game.js');
    window.__releaseSoak.restart = setInterval(() => {
      if(game.G.state === 'clear' || game.G.state === 'over'){
        game.onEnter();
        window.__releaseSoak.cycles++;
      }
    }, 100);
  });
  const checkpoints = [
    {at:Math.floor(durationMs * 0.25), name:'backgroundResume'},
    {at:Math.floor(durationMs * 0.50), name:'orientation'},
    {at:Math.floor(durationMs * 0.75), name:'deepLinkReload'},
  ];
  for(const checkpoint of checkpoints){
    const delay = Math.max(0, start + checkpoint.at - Date.now());
    await sleep(delay);
    if(checkpoint.name === 'backgroundResume'){
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      await sleep(250);
      result.lifecycle.backgroundPaused = await page.evaluate(async () => (await import('./src/game.js')).G.paused === true);
      await page.keyboard.press('p');
      await sleep(250);
      result.lifecycle.backgroundResumed = await page.evaluate(async () => (await import('./src/game.js')).G.paused === false);
    }else if(checkpoint.name === 'orientation'){
      await page.setViewportSize({width:390,height:844});
      await sleep(300);
      result.lifecycle.portraitBlocked = await page.locator('#rotate').evaluate(el => getComputedStyle(el).display === 'flex');
      await page.setViewportSize({width:844,height:390});
      await sleep(300);
      result.lifecycle.landscapeRestored = await page.locator('#rotate').evaluate(el => getComputedStyle(el).display === 'none');
    }else if(checkpoint.name === 'deepLinkReload'){
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', {timeout:4000});
      result.lifecycle.deepLinkReloaded = true;
      await page.evaluate(async () => {
        const game = await import('./src/game.js');
        window.__releaseSoak.restart = setInterval(() => {
          if(game.G.state === 'clear' || game.G.state === 'over'){
            game.onEnter();
            window.__releaseSoak.cycles++;
          }
        }, 100);
      });
    }
  }
  await sleep(Math.max(0, start + durationMs - Date.now()));
  const heapAfter = await cdp.send('Runtime.getHeapUsage').catch(() => null);
  const runtime = await page.evaluate(async () => {
    const game = await import('./src/game.js');
    clearInterval(window.__releaseSoak.restart);
    const audio = await import('./src/audio.js');
    return {
      state:game.G.state,
      mode:game.G.mode,
      paused:game.G.paused,
      cycles:window.__releaseSoak.cycles,
      longTaskCount:window.__releaseSoak.longTaskCount,
      longTaskMaxMs:Number(window.__releaseSoak.longTaskMaxMs.toFixed(2)),
      audioState:audio.ac()?.state || 'not-created',
    };
  });
  result.runtime = runtime;
  result.heap = heapBefore && heapAfter ? {
    before:heapBefore.usedSize,
    after:heapAfter.usedSize,
    delta:heapAfter.usedSize - heapBefore.usedSize,
    deltaPct:Number((((heapAfter.usedSize - heapBefore.usedSize) / Math.max(1, heapBefore.usedSize)) * 100).toFixed(2)),
  } : null;
  result.elapsedMs = Date.now() - start;
  result.passed = result.elapsedMs >= durationMs - 1000 && result.errors.length === 0
    && Object.values(result.lifecycle).every(Boolean) && runtime.mode === 'slice' && runtime.state === 'play';
  assert.equal(result.passed, true, `运行时浸泡不通过：${JSON.stringify(result)}`);
  await context.close();
} catch(error){
  result.passed = false;
  result.failure = error.stack || String(error);
  throw error;
} finally {
  result.finishedAt = new Date().toISOString();
  mkdirSync(dirname(out), {recursive:true});
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  if(browser) await browser.close().catch(() => {});
  server.kill();
}
console.log(`PASS | 真实运行时浸泡：${Math.round(result.elapsedMs / 1000)} 秒、${result.runtime.cycles} 次重开、堆变化 ${result.heap?.deltaPct ?? 'N/A'}%`);
