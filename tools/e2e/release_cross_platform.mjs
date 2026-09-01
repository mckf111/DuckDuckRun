import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const info = JSON.parse(readFileSync(join(dist, 'build-info.json'), 'utf8'));
const evidenceDir = join(root, 'docs', 'qa', 'evidence');
const out = join(evidenceDir, 'release-cross-platform.json');
const base = 'http://127.0.0.1:8135';
const executable = process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const server = spawn('python3', ['-m', 'http.server', '8135', '--bind', '127.0.0.1'], {cwd:dist, stdio:'ignore'});
const profiles = [
  {
    id:'desktop_chromium', label:'桌面 Chromium（真实 Linux Chromium）', kind:'browser-binary',
    options:{viewport:{width:1440,height:900}}, mobile:false,
  },
  {
    id:'desktop_chrome_ua', label:'桌面 Chrome（Chromium 内核 + Chrome UA 模拟）', kind:'ua-simulation',
    options:{viewport:{width:1440,height:900},userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'}, mobile:false,
  },
  {
    id:'desktop_edge_ua', label:'桌面 Edge（Chromium 内核 + Edge UA 模拟）', kind:'ua-simulation',
    options:{viewport:{width:1440,height:900},userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0'}, mobile:false,
  },
  {
    id:'android_chrome_ua', label:'Android Chrome（触控/DPR/Chrome UA 模拟）', kind:'ua-viewport-simulation',
    options:{viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36'}, mobile:true,
  },
  {
    id:'ios_safari_ua', label:'iOS Safari（触控/DPR/Safari UA 模拟，非 WebKit）', kind:'ua-viewport-simulation',
    options:{viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1'}, mobile:true,
  },
];
const result = {
  schema:'duckduckrun-release-cross-platform/v1',
  capturedAt:new Date().toISOString(),
  buildId:info.buildId,
  binary:'Chromium 151 on Linux; Edge and WebKit binaries unavailable in this environment.',
  profiles:[],
};
async function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitServer(){
  for(let i=0;i<50;i++){
    try{ if((await fetch(`${base}/build-info.json`)).ok) return; }catch(error){}
    await sleep(100);
  }
  throw new Error('跨端验收静态服务未启动');
}
function attachWatchers(page, errors){
  page.on('pageerror', error => errors.push(`pageerror:${error.message}`));
  page.on('console', message => { if(message.type()==='error') errors.push(`console:${message.text()}`); });
  page.on('requestfailed', request => errors.push(`request:${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => { if(response.status() >= 400) errors.push(`http:${response.status()} ${response.url()}`); });
}
async function clickLogical(page, logicalX, logicalY){
  const box = await page.locator('#cv').boundingBox();
  await page.mouse.click(box.x + logicalX * box.width / 960, box.y + logicalY * box.height / 540);
}
async function runProfile(browser, profile){
  const context = await browser.newContext(profile.options);
  const page = await context.newPage();
  const errors = [];
  attachWatchers(page, errors);
  const started = Date.now();
  await page.goto(`${base}/`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(async () => {
    const game = await import('./src/game.js');
    return game.G.state === 'menu' && game.G.buttons.length >= 4;
  }, {timeout:4000});
  const menuMs = Date.now() - started;
  const firstAction = await page.evaluate(async () => {
    const game = await import('./src/game.js');
    return game.G.buttons.find(button => button.id === 'adv');
  });
  assert.ok(firstAction, `${profile.id} 菜单未注册开始按钮`);
  await clickLogical(page, firstAction.x + firstAction.w / 2, firstAction.y + firstAction.h / 2);
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'levels', {timeout:1500});
  await page.goto(`${base}/?slice=1&demo&seed=20260903`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', {timeout:4000});
  await clickLogical(page, 480, 300); // 用户手势：音频创建/恢复入口。
  const audioUnlocked = await page.evaluate(async () => (await import('./src/audio.js')).ac()?.state === 'running');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await sleep(120);
  const pausedOnBackground = await page.evaluate(async () => (await import('./src/game.js')).G.paused === true);
  await page.keyboard.press('p');
  await sleep(120);
  const resumed = await page.evaluate(async () => (await import('./src/game.js')).G.paused === false);
  await page.evaluate(async () => {
    const game = await import('./src/game.js');
    game.gameOver('full');
    for(let frame=0; frame<8; frame++) game.update(0.1);
  });
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'over', {timeout:1000});
  await sleep(80);
  const retry = await page.evaluate(async () => {
    const game = await import('./src/game.js');
    return game.G.buttons.find(button => button.id === 'retry');
  });
  assert.ok(retry, `${profile.id} 失败页未注册重开按钮`);
  await clickLogical(page, retry.x + retry.w / 2, retry.y + retry.h / 2);
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', {timeout:1500});
  let portraitBlocked = null;
  let landscapeRestored = null;
  if(profile.mobile){
    await page.setViewportSize({width:390,height:844});
    await sleep(200);
    portraitBlocked = await page.locator('#rotate').evaluate(el => getComputedStyle(el).display === 'flex');
    await page.setViewportSize({width:844,height:390});
    await sleep(200);
    landscapeRestored = await page.locator('#rotate').evaluate(el => getComputedStyle(el).display === 'none');
  }
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', {timeout:4000});
  const final = await page.evaluate(async () => {
    const game = await import('./src/game.js');
    const canvas = document.querySelector('#cv');
    return {
      buildId:document.querySelector('meta[name="duckduckrun-build"]')?.content,
      state:game.G.state,
      mode:game.G.mode,
      dprRatio:Number((canvas.width / canvas.getBoundingClientRect().width).toFixed(1)),
      fontsReady:document.fonts.status === 'loaded',
      accessibleCanvas:canvas.tabIndex === 0 && canvas.getAttribute('aria-describedby') === 'gameInstructions',
      errorBoundaryVisible:!document.querySelector('#appError').hidden,
      noExternalRuntime:performance.getEntriesByType('resource').every(entry => new URL(entry.name).origin === location.origin),
    };
  });
  const expectedRatio = profile.mobile ? 1.5 : 1;
  assert.deepEqual(final, {buildId:info.buildId,state:'play',mode:'slice',dprRatio:expectedRatio,fontsReady:true,accessibleCanvas:true,errorBoundaryVisible:false,noExternalRuntime:true});
  assert.ok(menuMs <= 4000, `${profile.id} 菜单首个可操作画面过慢：${menuMs}ms`);
  assert.equal(audioUnlocked, true, `${profile.id} 用户手势后音频未解锁`);
  assert.equal(pausedOnBackground, true, `${profile.id} 后台路径未暂停`);
  assert.equal(resumed, true, `${profile.id} 返回前台后未恢复为可继续状态`);
  assert.deepEqual(errors, [], `${profile.id} 出现控制台、网络或页面错误：${JSON.stringify(errors)}`);
  const screenshot = join(evidenceDir, `release-${profile.id}.png`);
  await page.screenshot({path:screenshot});
  await context.close();
  return {id:profile.id,label:profile.label,coverage:profile.kind,menuMs,audioUnlocked,pausedOnBackground,resumed,portraitBlocked,landscapeRestored,final,errors,screenshot:relativeToRoot(screenshot)};
}
function relativeToRoot(path){ return path.slice(root.length + 1).replaceAll('\\', '/'); }
let browser;
try{
  await waitServer();
  mkdirSync(evidenceDir, {recursive:true});
  browser = await chromium.launch({headless:true, executablePath:executable, args:['--no-sandbox']});
  for(const profile of profiles) result.profiles.push(await runProfile(browser, profile));
  result.passed = true;
} catch(error){
  result.passed = false;
  result.failure = error.stack || String(error);
  throw error;
} finally {
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  if(browser) await browser.close().catch(() => {});
  server.kill();
}
console.log(`PASS | 跨端候选验收：${result.profiles.length} 个浏览器/UA视口配置通过；仅 Chromium 为真实浏览器二进制结论`);
