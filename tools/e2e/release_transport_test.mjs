import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const out = join(root, 'docs', 'qa', 'evidence', 'release-transport.json');
const base = 'http://127.0.0.1:8133';
const info = JSON.parse(readFileSync(join(dist, 'build-info.json'), 'utf8'));
const executable = process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const server = spawn('python3', ['-m', 'http.server', '8133', '--bind', '127.0.0.1'], {cwd:dist, stdio:'ignore'});
const result = {
  schema:'duckduckrun-release-transport/v1',
  capturedAt:new Date().toISOString(),
  environment:'Local headless Chromium with CDP 4G emulation; mobile is viewport/touch simulation, not a physical-device conclusion.',
  buildId:info.buildId,
};
async function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitServer(){
  for(let i=0;i<50;i++){
    try{ if((await fetch(`${base}/build-info.json`)).ok) return; }catch(error){}
    await sleep(100);
  }
  throw new Error('传输测试静态服务未启动');
}
function watchErrors(page){
  const errors=[];
  page.on('pageerror', error => errors.push(`pageerror:${error.message}`));
  page.on('console', message => { if(message.type()==='error') errors.push(`console:${message.text()}`); });
  page.on('requestfailed', request => errors.push(`request:${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => { if(response.status() >= 400) errors.push(`http:${response.status()} ${response.url()}`); });
  return errors;
}
let browser;
try{
  await waitServer();
  browser = await chromium.launch({headless:true, executablePath:executable, args:['--no-sandbox']});
  {
    const context = await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline:false, latency:150, downloadThroughput:500 * 1024, uploadThroughput:125 * 1024, connectionType:'cellular4g',
    });
    const errors = watchErrors(page);
    const started = Date.now();
    await page.goto(`${base}/`, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(async () => {
      const game = await import('./src/game.js');
      return game.G.state === 'menu' && game.G.buttons.length >= 4;
    }, {timeout:8000});
    result.simulated4G = {
      firstPlayableMs:Date.now() - started,
      errors,
      releasePath:await page.evaluate(() => location.pathname),
      buildId:await page.evaluate(() => document.querySelector('meta[name="duckduckrun-build"]')?.content),
    };
    assert.ok(result.simulated4G.firstPlayableMs <= 8000, `模拟4G首个可玩画面超出8秒：${result.simulated4G.firstPlayableMs}ms`);
    assert.equal(result.simulated4G.buildId, info.buildId, '弱网测试进入的制品版本不正确');
    assert.deepEqual(errors, [], `弱网加载发生运行时错误：${JSON.stringify(errors)}`);
    await context.close();
  }
  {
    const context = await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
    const page = await context.newPage();
    const expectedFailures=[];
    await context.route('**/assets/game/menu-background.*.webp', route => {
      expectedFailures.push(route.request().url());
      return route.fulfill({status:404, body:''});
    });
    const errors = watchErrors(page);
    await page.goto(`${base}/`, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(async () => {
      const game = await import('./src/game.js');
      return game.G.state === 'menu' && game.G.buttons.length >= 4;
    }, {timeout:4000});
    result.asset404Fallback = {
      injectedFailures:expectedFailures.length,
      gameState:await page.evaluate(async () => (await import('./src/game.js')).G.state),
      boundaryVisible:await page.locator('#appError').evaluate(el => !el.hidden),
      // Chromium 对 route.fulfill(404) 只输出通用 console 文本而不附 URL；此处只豁免这一条受控演练日志。
      unexpectedErrors:errors.filter(error => error !== 'console:Failed to load resource: the server responded with a status of 404 (Not Found)' && !expectedFailures.some(url => error.includes(url))),
    };
    assert.ok(result.asset404Fallback.injectedFailures >= 1, '未注入菜单背景 404');
    assert.deepEqual(result.asset404Fallback, {injectedFailures:result.asset404Fallback.injectedFailures,gameState:'menu',boundaryVisible:false,unexpectedErrors:[]});
    await context.close();
  }
  result.passed = true;
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
console.log(`PASS | 生产传输回归：模拟4G首个可玩画面 ${result.simulated4G.firstPlayableMs}ms；资源404降级通过`);
