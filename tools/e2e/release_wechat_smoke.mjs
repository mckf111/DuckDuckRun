import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { assertBrowserGlyphCoverage, assertReleaseGlyphManifest, attachPageErrors, browserExecutable, ensureEvidenceDir, sleep, startStaticServer } from './release_support.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const info = JSON.parse(readFileSync(join(dist, 'build-info.json'), 'utf8'));
const evidenceDir = ensureEvidenceDir(root);
const out = join(evidenceDir, 'release-wechat-ua-smoke.json');
const shot = join(evidenceDir, 'release-wechat-ua-share.png');
let base;
const result = {
  schema:'duckduckrun-release-wechat-ua-smoke/v2',
  capturedAt:new Date().toISOString(),
  environment:'Chromium with iPhone/MicroMessenger user-agent and touch viewport. This is a container-style simulation, not a real WeChat WebView or physical-phone result.',
  buildId:info.buildId,
  errors:[],
};
let browser;
let server;
try{
  assertReleaseGlyphManifest(root, ['再跑一趟', '长按图片保存发送给好友', '复制链接发给朋友', '南京地标取景游戏美术化呈现']);
  server = await startStaticServer({cwd:dist, port:8134, label:'微信冒烟'});
  base = server.base;
  browser = await chromium.launch({headless:true, executablePath:browserExecutable(), args:['--no-sandbox']});
  const context = await browser.newContext({
    viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.40',
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(...args){
      window.__shareToBlobCalls = (window.__shareToBlobCalls || 0) + 1;
      return originalToBlob.apply(this, args);
    };
    Object.defineProperty(navigator, 'clipboard', {
      configurable:true,
      value:{writeText:async text => { window.__copiedShareText = text; }},
    });
  });
  attachPageErrors(page, result.errors);
  await page.goto(`${base}/?slice=1&demo&seed=20260903`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', undefined, {timeout:4000});
  await assertBrowserGlyphCoverage(page, ['再跑一趟', '长按图片保存发送给好友', '复制链接发给朋友', '南京地标取景游戏美术化呈现']);
  await page.keyboard.press('ArrowRight');
  const audioUnlocked = await page.evaluate(async () => (await import('./src/audio.js')).ac()?.state === 'running');
  await page.evaluate(async () => {
    const game = await import('./src/game.js');
    window.__releaseGame = game.G;
    game.gameOver('full');
  });
  // 让真实 requestAnimationFrame 主循环走完撞车动画；手工 update 会越过
  // main.js 的状态同步并制造一个“过场已结束”的竞态假象。
  await page.waitForFunction(() => window.__releaseGame.state === 'over', undefined, {timeout:2000});
  const target=page.locator('[data-action="share"]');
  await target.waitFor();
  await target.tap();
  await sleep(250);
  result.touchProbe = await page.evaluate(async () => {
    const game = await import('./src/game.js');
    const layer = document.querySelector('#shareLayer');
    const image = layer?.querySelector('.card');
    return {
      state:game.G.state,
      wipe:game.G.wipe,
      pressed:game.G.pressed?.id || null,
      layerDisplay:getComputedStyle(layer).display,
      imageComplete:image?.complete || false,
      imageNaturalWidth:image?.naturalWidth || 0,
      toBlobCalls:window.__shareToBlobCalls || 0,
      pointerEvents:window.__sharePointerEvents || [],
    };
  });
  await page.waitForFunction(() => {
    const layer = document.querySelector('#shareLayer');
    const image = layer?.querySelector('.card');
    return getComputedStyle(layer).display === 'flex' && image.complete && image.naturalWidth > 0;
  }, undefined, {timeout:5000});
  await page.locator('#copyBtn').click();
  await page.waitForFunction(() => document.querySelector('#shareToast').textContent.includes('复制'), undefined, {timeout:3000});
  await sleep(350); // 等待 toast 的 300ms 过渡结束，截图才是稳定态。
  await page.screenshot({path:shot});
  result.share = await page.evaluate(() => ({
    layerVisible:getComputedStyle(document.querySelector('#shareLayer')).display === 'flex',
    copyToast:document.querySelector('#shareToast').textContent,
    copiedText:window.__copiedShareText || '',
    loadedVersionedPath:location.pathname.includes(`/releases/${document.querySelector('meta[name="duckduckrun-build"]').content}/`),
  }));
  result.audioUnlocked = audioUnlocked;
  const stableRoot = (info.publicSiteUrl||base).replace(/\/+$/,'')+(info.publicBasePath||'')+'/';
  result.expectedShareRoot=stableRoot;
  result.passed = result.errors.length === 0 && result.audioUnlocked && result.share.layerVisible
    && result.share.copyToast.includes('复制') && result.share.loadedVersionedPath
    && result.share.copiedText.endsWith(stableRoot) && !result.share.copiedText.includes('/releases/');
  assert.equal(result.passed, true, `微信UA分享冒烟不通过：${JSON.stringify(result)}`);
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
console.log(`PASS | 微信UA模拟冒烟：原生分享按钮触控、音频解锁、长按保存遮罩与稳定根链接均通过`);
