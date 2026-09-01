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
const out = join(evidenceDir, 'release-wechat-ua-smoke.json');
const shot = join(evidenceDir, 'release-wechat-ua-share.png');
const base = 'http://127.0.0.1:8134';
const executable = process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const server = spawn('python3', ['-m', 'http.server', '8134', '--bind', '127.0.0.1'], {cwd:dist, stdio:'ignore'});
const result = {
  schema:'duckduckrun-release-wechat-ua-smoke/v1',
  capturedAt:new Date().toISOString(),
  environment:'Chromium with iPhone/MicroMessenger user-agent and touch viewport. This is a container-style simulation, not a real WeChat WebView or physical-phone result.',
  buildId:info.buildId,
  errors:[],
};
async function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitServer(){
  for(let i=0;i<50;i++){
    try{ if((await fetch(`${base}/build-info.json`)).ok) return; }catch(error){}
    await sleep(100);
  }
  throw new Error('微信冒烟静态服务未启动');
}
let browser;
try{
  await waitServer();
  browser = await chromium.launch({headless:true, executablePath:executable, args:['--no-sandbox']});
  const context = await browser.newContext({
    viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.40',
  });
  const page = await context.newPage();
  page.on('pageerror', error => result.errors.push(`pageerror:${error.message}`));
  page.on('console', message => { if(message.type()==='error') result.errors.push(`console:${message.text()}`); });
  page.on('requestfailed', request => result.errors.push(`request:${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => { if(response.status() >= 400) result.errors.push(`http:${response.status()} ${response.url()}`); });
  await page.goto(`${base}/?slice=1&demo&seed=20260903`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', {timeout:4000});
  await page.keyboard.press('ArrowRight');
  const audioUnlocked = await page.evaluate(async () => (await import('./src/audio.js')).ac()?.state === 'running');
  await page.evaluate(async () => {
    const game = await import('./src/game.js');
    game.gameOver('full');
    for(let frame=0; frame<8; frame++) game.update(0.1);
  });
  await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'over', {timeout:1000});
  await page.waitForTimeout(100); // 等待失败页至少完成一帧绘制并注册 Canvas 按钮。
  const target = await page.evaluate(async () => {
    const game = await import('./src/game.js');
    return game.G.buttons.find(button => button.id === 'share');
  });
  assert.ok(target, '失败页未注册分享按钮');
  const canvas = await page.locator('#cv').boundingBox();
  await page.mouse.click(canvas.x + (target.x + target.w / 2) * canvas.width / 960, canvas.y + (target.y + target.h / 2) * canvas.height / 540);
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#shareLayer')).display === 'flex', {timeout:3000});
  await page.locator('#copyBtn').click();
  await page.waitForFunction(() => document.querySelector('#shareToast').textContent.includes('复制'), {timeout:3000});
  await page.screenshot({path:shot});
  result.share = await page.evaluate(() => ({
    layerVisible:getComputedStyle(document.querySelector('#shareLayer')).display === 'flex',
    copyToast:document.querySelector('#shareToast').textContent,
    cleanShareLink:location.origin + location.pathname,
    versionedPath:location.pathname.includes(`/releases/${document.querySelector('meta[name="duckduckrun-build"]').content}/`),
  }));
  result.audioUnlocked = audioUnlocked;
  result.passed = result.errors.length === 0 && result.audioUnlocked && result.share.layerVisible && result.share.copyToast.includes('复制') && result.share.versionedPath;
  assert.equal(result.passed, true, `微信UA分享冒烟不通过：${JSON.stringify(result)}`);
  await context.close();
} catch(error){
  result.passed = false;
  result.failure = error.stack || String(error);
  throw error;
} finally {
  mkdirSync(evidenceDir, {recursive:true});
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  if(browser) await browser.close().catch(() => {});
  server.kill();
}
console.log(`PASS | 微信UA模拟冒烟：音频解锁、失败重开页、长按保存遮罩与复制链接均通过`);
