import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { get } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const base = 'http://127.0.0.1:8125';
const infoPath = join(dist, 'build-info.json');
assert.ok(existsSync(infoPath), '缺少 dist/build-info.json；请先运行 npm run build');
const info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.match(info.buildId, /^[0-9A-Za-z._-]{1,64}$/);
assert.equal(info.releasePath, `releases/${info.buildId}/`);
assert.ok(Array.isArray(info.files) && info.files.length > 0, '制品清单为空');
assert.equal(info.schema, 2, '制品未使用第二版发布清单');
assert.ok(info.assets && Object.keys(info.assets).length > 0, '制品缺少内容指纹资产清单');
const release = join(dist, info.releasePath);
const index = readFileSync(join(release, 'index.html'), 'utf8');
const assetManifest = readFileSync(join(release, 'asset-manifest.js'), 'utf8');
assert.ok(index.includes(`name="duckduckrun-build" content="${info.buildId}"`), '版本标识未注入制品 HTML');
assert.ok(!index.includes('__BUILD_ID__') && !index.includes('__SOCIAL_META__'), '制品仍含未替换的构建占位符');
assert.ok(assetManifest.includes('__DUCKDUCKRUN_ASSETS__'), '制品缺少运行时资源指纹映射');
for(const [original, fingerprinted] of Object.entries(info.assets)){
  assert.match(fingerprinted, /\.[a-f0-9]{12}\./, `资源未按内容指纹命名：${original}`);
  assert.ok(existsSync(join(release, fingerprinted)), `指纹资源缺失：${fingerprinted}`);
  assert.ok(!existsSync(join(release, original)), `稳定资源名仍被发布：${original}`);
}
for(const file of info.files) assert.ok(existsSync(join(release, file)), `清单文件缺失：${file}`);

const server = spawn('python3', ['-m', 'http.server', '8125', '--bind', '127.0.0.1'], { cwd:dist, stdio:'ignore' });
function requestStatus(path){
  return new Promise((resolve, reject) => {
    const request = get(base + path, response => {
      const status = response.statusCode || 0;
      response.resume();
      response.once('end', () => resolve(status));
    });
    request.once('error', reject);
  });
}
async function waitServer(){
  for(let i=0;i<50;i++){
    try{ if((await requestStatus('/build-info.json'))<400) return; }catch(e){}
    await new Promise(resolve=>setTimeout(resolve, 100));
  }
  throw new Error('制品检查 HTTP 服务未启动');
}
async function verifyBrowserRelease(){
  const executable = process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser = await chromium.launch({headless:true, executablePath:executable, args:['--no-sandbox']});
  try{
    const context = await browser.newContext({viewport:{width:844,height:390}, hasTouch:true, isMobile:true, deviceScaleFactor:2});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(`pageerror:${error.message}`));
    page.on('console', message => { if(message.type()==='error') errors.push(`console:${message.text()}`); });
    page.on('response', response => { if(response.status() >= 400) errors.push(`http:${response.status()} ${response.url()}`); });
    await page.goto(`${base}/?slice=1&demo&seed=20260903`, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => document.querySelector('meta[name="duckduckrun-build"]')?.content && location.pathname.includes('/releases/'), {timeout:4000});
    await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', {timeout:4000});
    const initial = await page.evaluate(async buildId => {
      const game = await import('./src/game.js');
      const canvas = document.querySelector('#cv');
      return {
        buildId:document.querySelector('meta[name="duckduckrun-build"]')?.content,
        state:game.G.state,
        ratio:Number((canvas.width / canvas.getBoundingClientRect().width).toFixed(1)),
        fingerprinted:Array.from(performance.getEntriesByType('resource')).some(entry => /\.[a-f0-9]{12}\.(?:webp|png|woff2|jpg)$/.test(entry.name)),
      };
    }, info.buildId);
    assert.deepEqual(initial, {buildId:info.buildId,state:'play',ratio:1.5,fingerprinted:true});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', {timeout:4000});
    assert.deepEqual(errors, [], `制品深链接或刷新产生错误：${JSON.stringify(errors)}`);
    await context.close();
  } finally {
    await browser.close();
  }
}
try{
  await waitServer();
  const paths = ['/', '/build-info.json', ...info.files.map(file => `/${info.releasePath}${file}`)];
  // 原生 HTTP 客户端逐项消费响应，避开受限 CI 中 Undici 响应暂停断言，同时不缩小覆盖范围。
  const results = [];
  for(const path of paths) results.push({ path, status:await requestStatus(path) });
  const failed = results.filter(result => result.status >= 400);
  assert.deepEqual(failed, [], `制品资源 404/5xx：${JSON.stringify(failed)}`);
  await verifyBrowserRelease();
  console.log(`PASS | 制品完整性：${paths.length} 个入口/资源均可达，版本 ${info.buildId}；根跳转、深链接刷新与内容指纹资产通过`);
} finally {
  server.kill();
}
