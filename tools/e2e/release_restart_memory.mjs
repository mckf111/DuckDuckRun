import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { attachPageErrors, browserExecutable, ensureEvidenceDir, sampleJsHeap, sleep, startStaticServer } from './release_support.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const out = join(ensureEvidenceDir(root), 'release-restart-memory.json');
let base;
const result = {
  schema:'duckduckrun-release-restart-memory/v1',
  capturedAt:new Date().toISOString(),
  environment:'Local headless Chromium touch simulation (390×844, DPR 2); CDP JavaScript heap only, not device or GPU memory.',
  cycles:20,
  errors:[],
};
let browser;
let server;
try{
  server = await startStaticServer({cwd:dist, port:8132, label:'内存检查'});
  base = server.base;
  browser = await chromium.launch({headless:true, executablePath:browserExecutable(), args:['--no-sandbox']});
  const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  attachPageErrors(page, result.errors);
  await page.goto(`${base}/?seed=20260903#lv0`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', undefined, {timeout:4000});
  await page.locator('#cv').click({position:{x:180,y:400}});
  result.audioUnlocked = await page.evaluate(async () => (await import('./src/audio.js')).ac()?.state === 'running');
  result.heapBefore = await sampleJsHeap(cdp);
  for(let index=1; index<=20; index++){
    await page.evaluate(async () => {
      const game = await import('./src/game.js');
      game.gameOver('full');
      for(let frame=0; frame<8; frame++) game.update(0.1);
    });
    await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'over', undefined, {timeout:1000});
    await page.locator('[data-action="retry"]').click();
    await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', undefined, {timeout:1000});
    await sleep(120);
    result[`restart${index}`] = await page.evaluate(async () => {
      const game = await import('./src/game.js');
      return {state:game.G.state,mode:game.G.mode,paused:game.G.paused};
    });
  }
  result.heapAfter = await sampleJsHeap(cdp);
  result.heapDeltaBytes = result.heapAfter.median - result.heapBefore.median;
  result.heapDeltaPct = Number(((result.heapDeltaBytes / Math.max(1, result.heapBefore.median)) * 100).toFixed(2));
  result.heapGrowthLimitBytes = Math.max(1536 * 1024, Math.round(result.heapBefore.median * 0.15));
  result.passed = result.errors.length === 0 && Object.values(Object.fromEntries(Object.entries(result).filter(([key]) => key.startsWith('restart')))).every(value => value.state==='play' && value.mode==='adv' && value.paused===false)
    && result.audioUnlocked && result.heapDeltaBytes <= result.heapGrowthLimitBytes;
  assert.equal(result.passed, true, `二十次重开内存检查不通过：${JSON.stringify(result)}`);
  await context.close();
} catch(error){
  result.passed = false;
  result.failure = error.stack || String(error);
  throw error;
} finally {
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  if(browser) await browser.close().catch(() => {});
  if(server) await server.stop();
}
console.log(`PASS | 二十次重开内存检查：堆变化 ${result.heapDeltaPct ?? 'N/A'}%，控制台和网络错误 0`);
