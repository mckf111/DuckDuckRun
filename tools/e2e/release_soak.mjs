import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { attachPageErrors, browserExecutable, ensureEvidenceDir, sampleJsHeap, sleep, startStaticServer } from './release_support.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const buildInfo=JSON.parse(readFileSync(join(dist,'build-info.json'),'utf8'));
const out = join(ensureEvidenceDir(root), 'release-soak.json');
const durationMs = Number(process.env.SOAK_DURATION_MS || 20 * 60 * 1000);
assert.ok(Number.isFinite(durationMs) && durationMs >= 4000, 'SOAK_DURATION_MS 必须是至少 4000ms 的有限数字');
const maxLongTaskMs = Number(process.env.SOAK_MAX_LONG_TASK_MS || 250);
const maxLongTaskRatio = Number(process.env.SOAK_MAX_LONG_TASK_RATIO || 0.02);
const heapFloorBytes = Number(process.env.SOAK_MAX_HEAP_GROWTH_BYTES || 1024 * 1024);
const heapGrowthRatio = Number(process.env.SOAK_MAX_HEAP_GROWTH_RATIO || 0.20);

const result = {
  schema:'duckduckrun-release-soak/v3',
  buildId:buildInfo.buildId,
  distribution:buildInfo.distribution,
  startedAt:new Date().toISOString(),
  targetDurationMs:durationMs,
  environment:'Local headless Chromium touch simulation (844×390, DPR 2); actual runtime loop and GC-stabilized JavaScript heap, not physical-device/GPU memory.',
  thresholds:{maxLongTaskMs,maxLongTaskRatio,heapFloorBytes,heapGrowthRatio},
  lifecycle:{},
  errors:[],
};

let browser;
let server;
let base;
try{
  server = await startStaticServer({cwd:dist, port:8131, label:'浸泡测试'});
  base = server.base;
  browser = await chromium.launch({headless:true, executablePath:browserExecutable(), args:['--no-sandbox']});
  const context = await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  attachPageErrors(page, result.errors);
  await page.addInitScript(() => {
    window.__releaseSoak = {
      longTaskSupported:typeof PerformanceObserver === 'function' && PerformanceObserver.supportedEntryTypes?.includes('longtask'),
      longTaskMaxMs:0,
      longTaskTotalMs:0,
      longTaskCount:0,
      cycles:0,
    };
    if(window.__releaseSoak.longTaskSupported){
      new PerformanceObserver(list => list.getEntries().forEach(entry => {
        window.__releaseSoak.longTaskCount++;
        window.__releaseSoak.longTaskTotalMs += entry.duration;
        window.__releaseSoak.longTaskMaxMs = Math.max(window.__releaseSoak.longTaskMaxMs, entry.duration);
      })).observe({type:'longtask', buffered:true});
    }
  });

  const start = Date.now();
  await page.goto(`${base}/?slice=1&demo&seed=20260903`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', undefined, {timeout:4000});
  await page.locator('#cv').click({position:{x:420,y:195}});
  result.lifecycle.audioInitiallyUnlocked = await page.evaluate(async () => (await import('./src/audio.js')).ac()?.state === 'running');

  const installRestart = () => page.evaluate(async () => {
    const game = await import('./src/game.js');
    window.__releaseSoak.restart = setInterval(() => {
      if(game.G.state === 'clear' || game.G.state === 'over'){
        game.onEnter();
        window.__releaseSoak.cycles++;
      }
    }, 100);
  });
  await installRestart();

  await sleep(Math.min(2000, Math.max(400, Math.floor(durationMs * 0.08))));
  result.heapBefore = await sampleJsHeap(cdp);
  await page.evaluate(() => {
    window.__releaseSoak.longTaskMaxMs = 0;
    window.__releaseSoak.longTaskTotalMs = 0;
    window.__releaseSoak.longTaskCount = 0;
  });

  const performanceSegments = [];
  let completedCycles = 0;
  const collectSegment = async () => {
    const segment = await page.evaluate(() => ({
      supported:window.__releaseSoak.longTaskSupported,
      count:window.__releaseSoak.longTaskCount,
      totalMs:window.__releaseSoak.longTaskTotalMs,
      maxMs:window.__releaseSoak.longTaskMaxMs,
      cycles:window.__releaseSoak.cycles,
    }));
    completedCycles += segment.cycles;
    performanceSegments.push(segment);
  };

  const checkpoints = [
    {at:Math.floor(durationMs * 0.25), name:'backgroundResume'},
    {at:Math.floor(durationMs * 0.50), name:'orientation'},
    {at:Math.floor(durationMs * 0.75), name:'deepLinkReload'},
  ];
  for(const checkpoint of checkpoints){
    await sleep(Math.max(0, start + checkpoint.at - Date.now()));
    if(checkpoint.name === 'backgroundResume'){
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      await sleep(250);
      result.lifecycle.backgroundPaused = await page.evaluate(async () => (await import('./src/game.js')).G.paused === true);
      await page.keyboard.press('p');
      await sleep(250);
      result.lifecycle.backgroundResumed = await page.evaluate(async () => (await import('./src/game.js')).G.paused === false);
      await page.locator('#cv').click({position:{x:420,y:195}});
      result.lifecycle.audioAfterResume = await page.evaluate(async () => (await import('./src/audio.js')).ac()?.state === 'running');
    }else if(checkpoint.name === 'orientation'){
      await page.setViewportSize({width:390,height:844});
      await sleep(300);
      result.lifecycle.portraitPaused = await page.evaluate(async () => (await import('./src/game.js')).G.paused === true);
      result.lifecycle.portraitFits = await page.locator('#cv').evaluate(canvas=>{
        const rect=canvas.getBoundingClientRect();
        return rect.width>0&&rect.height>0&&rect.left>=-.5&&rect.right<=innerWidth+.5&&rect.bottom<=innerHeight+.5;
      });
      await page.locator('[data-action="resume"]').click();
      if(await page.locator('[data-action="skipResume"]').isVisible())await page.locator('[data-action="skipResume"]').click();
      const beforePortrait=await page.evaluate(async () => (await import('./src/game.js')).G.dist);
      await sleep(350);
      result.lifecycle.portraitPlayable=await page.evaluate(async before=>{
        const {G}=await import('./src/game.js');return !G.paused&&G.dist>before;
      },beforePortrait);
      await page.setViewportSize({width:844,height:390});
      await sleep(300);
      result.lifecycle.landscapePaused=await page.evaluate(async () => (await import('./src/game.js')).G.paused === true);
      await page.locator('[data-action="resume"]').click();
      if(await page.locator('[data-action="skipResume"]').isVisible())await page.locator('[data-action="skipResume"]').click();
      result.lifecycle.landscapeRestored=await page.evaluate(async () => !(await import('./src/game.js')).G.paused&&innerWidth>innerHeight);
    }else if(checkpoint.name === 'deepLinkReload'){
      await collectSegment();
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', undefined, {timeout:4000});
      result.lifecycle.deepLinkReloaded = true;
      await page.locator('#cv').click({position:{x:420,y:195}});
      result.lifecycle.audioAfterReloadUnlocked = await page.evaluate(async () => (await import('./src/audio.js')).ac()?.state === 'running');
      await installRestart();
    }
  }

  await sleep(Math.max(0, start + durationMs - Date.now()));
  await page.evaluate(() => clearInterval(window.__releaseSoak.restart));
  await collectSegment();
  result.heapAfter = await sampleJsHeap(cdp);
  const runtime = await page.evaluate(async () => {
    const game = await import('./src/game.js');
    const audio = await import('./src/audio.js');
    return {state:game.G.state,mode:game.G.mode,paused:game.G.paused,audioState:audio.ac()?.state || 'not-created'};
  });
  runtime.cycles = completedCycles;
  result.runtime = runtime;
  result.performance = {
    supported:performanceSegments.every(segment => segment.supported),
    segments:performanceSegments,
    count:performanceSegments.reduce((total, segment) => total + segment.count, 0),
    totalMs:Number(performanceSegments.reduce((total, segment) => total + segment.totalMs, 0).toFixed(2)),
    maxMs:Number(Math.max(0, ...performanceSegments.map(segment => segment.maxMs)).toFixed(2)),
  };
  result.elapsedMs = Date.now() - start;
  result.performance.blockingRatio = Number((result.performance.totalMs / Math.max(1, result.elapsedMs)).toFixed(5));
  result.heap = {
    before:result.heapBefore.median,
    after:result.heapAfter.median,
    delta:result.heapAfter.median - result.heapBefore.median,
  };
  result.heap.deltaPct = Number(((result.heap.delta / Math.max(1, result.heap.before)) * 100).toFixed(2));
  result.heap.growthLimitBytes = Math.max(heapFloorBytes, Math.round(result.heap.before * heapGrowthRatio));

  const lifecyclePassed = [
    'audioInitiallyUnlocked', 'backgroundPaused', 'backgroundResumed', 'audioAfterResume',
    'portraitPaused', 'portraitFits', 'portraitPlayable', 'landscapePaused', 'landscapeRestored', 'deepLinkReloaded', 'audioAfterReloadUnlocked',
  ].every(key => result.lifecycle[key] === true);
  result.passed = result.elapsedMs >= durationMs - 1000
    && result.errors.length === 0
    && lifecyclePassed
    && runtime.mode === 'slice' && runtime.state === 'play' && runtime.paused === false && runtime.audioState === 'running'
    && result.performance.supported && result.performance.maxMs <= maxLongTaskMs && result.performance.blockingRatio <= maxLongTaskRatio
    && result.heap.delta <= result.heap.growthLimitBytes;
  assert.equal(result.passed, true, `运行时浸泡不通过：${JSON.stringify(result)}`);
  await context.close();
} catch(error){
  result.passed = false;
  result.failure = error.stack || String(error);
  throw error;
} finally {
  result.finishedAt = new Date().toISOString();
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  if(browser) await browser.close().catch(() => {});
  if(server) await server.stop();
}
console.log(`PASS | 真实运行时浸泡：${Math.round(result.elapsedMs / 1000)} 秒、${result.runtime.cycles} 次重开、堆变化 ${result.heap.deltaPct}%、最长任务 ${result.performance.maxMs}ms`);
