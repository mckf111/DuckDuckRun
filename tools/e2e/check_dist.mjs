import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { get } from 'node:http';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { browserExecutable, startStaticServer } from './release_support.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const infoPath = join(dist, 'build-info.json');
assert.ok(existsSync(infoPath), '缺少 dist/build-info.json；请先运行 npm run build');

function readInfo(){ return JSON.parse(readFileSync(infoPath, 'utf8')); }
function treeDigest(directory){
  const files = [];
  const walk = current => {
    for(const entry of readdirSync(current, {withFileTypes:true})){
      const absolute = join(current, entry.name);
      if(entry.isDirectory()) walk(absolute);
      else if(entry.isFile()) files.push(absolute);
    }
  };
  walk(directory);
  const hash = createHash('sha256');
  for(const absolute of files.sort()){
    hash.update(relative(directory, absolute).replaceAll('\\', '/')).update('\0');
    hash.update(readFileSync(absolute)).update('\0');
  }
  return hash.digest('hex');
}

let info = readInfo();
assert.ok(['internal-preview','production'].includes(info.distribution), '未知制品发布模式');
if(info.distribution==='production') assert.equal(info.pendingAssetReviews,0,'正式包仍有待审素材');
assert.ok(!info.files.some(path=>path.startsWith('assets/readme/')||path==='assets/release-review.json'),'内部审核或 README 素材混入游戏包');
assert.match(info.buildId, /^[a-f0-9]{12}$/);
assert.equal(info.releasePath, `releases/${info.buildId}/`);
assert.equal(info.schema, 2, '制品未使用第二版发布清单');
assert.equal(Object.hasOwn(info, 'generatedAt'), false, '版本清单含非确定性 generatedAt');
assert.ok(Array.isArray(info.files) && info.files.length > 0, '制品清单为空');
assert.ok(info.assets && Object.keys(info.assets).length > 0, '制品缺少内容指纹资产清单');
assert.deepEqual(info.notices, {
  gameLicense:'legal/LICENSE.md',
  photoCredits:'legal/PHOTO-CREDITS.md',
  fontLicense:'legal/FONT-OFL.txt',
});

let release = join(dist, info.releasePath);
const firstBuildId = info.buildId;
const firstDigest = treeDigest(release);
const distribution = info.distribution;
const rebuild = spawnSync(process.execPath, [join(root, 'tools', 'build_static.mjs'), ...(distribution==='internal-preview'?['--preview']:[])], {
  cwd:root,
  env:{...process.env,PUBLIC_SITE_URL:info.publicSiteUrl||'',PUBLIC_BASE_PATH:info.publicBasePath||''},
  encoding:'utf8',
});
assert.equal(rebuild.status, 0, `第二次确定性构建失败：${rebuild.stderr || rebuild.stdout}`);
info = readInfo();
assert.equal(info.distribution,distribution,'制品检查改变了发布模式');
release = join(dist, info.releasePath);
assert.equal(info.buildId, firstBuildId, '相同规范化输入第二次构建得到不同 build ID');
assert.equal(treeDigest(release), firstDigest, '同一 build ID 的版本目录字节不稳定');

const index = readFileSync(join(release, 'index.html'), 'utf8');
const rootIndex = readFileSync(join(dist, 'index.html'), 'utf8');
const edgeConfig=JSON.parse(readFileSync(join(dist,'edgeone.json'),'utf8'));
assert.deepEqual(edgeConfig,JSON.parse(readFileSync(join(root,'edgeone.json'),'utf8')),'EdgeOne 配置未随制品同步');
for(const path of ['/','/index.html','/build-info.json'])assert.ok(edgeConfig.headers.some(rule=>rule.source===path&&rule.headers.some(h=>h.key==='Cache-Control'&&h.value.includes('no-store'))),'根入口必须可回滚：'+path);
assert.ok(edgeConfig.headers.some(rule=>rule.source==='/releases/*'&&rule.headers.some(h=>h.key==='Cache-Control'&&h.value.includes('immutable'))),'版本资源缺少不可变缓存配置');
const assetManifest = readFileSync(join(release, 'asset-manifest.js'), 'utf8');
assert.ok(index.includes(`name="duckduckrun-build" content="${info.buildId}"`), '版本标识未注入制品 HTML');
assert.ok(!index.includes('__BUILD_ID__') && !index.includes('__SOCIAL_META__'), '制品仍含未替换的构建占位符');
assert.ok(rootIndex.includes('property="og:title"') && rootIndex.includes('property="og:description"'), '根入口缺少稳定 OG 元数据');
assert.ok(assetManifest.indexOf('__DUCKDUCKRUN_PUBLIC__') < assetManifest.indexOf('__DUCKDUCKRUN_ASSETS__'), '公开站点配置必须先于资源映射注入');
assert.ok(assetManifest.includes('__DUCKDUCKRUN_ASSETS__'), '制品缺少运行时资源指纹映射');
for(const [original, fingerprinted] of Object.entries(info.assets)){
  assert.match(fingerprinted, /\.[a-f0-9]{12}\./, `资源未按内容指纹命名：${original}`);
  assert.ok(existsSync(join(release, fingerprinted)), `指纹资源缺失：${fingerprinted}`);
  assert.ok(!existsSync(join(release, original)), `稳定资源名仍被发布：${original}`);
}
for(const file of info.files) assert.ok(existsSync(join(release, file)), `清单文件缺失：${file}`);
for(const file of Object.values(info.notices)) assert.ok(existsSync(join(release, file)), `发布告知文件缺失：${file}`);

const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.txt']);
for(const file of [...info.files, 'build-info.json']){
  if(textExtensions.has(extname(file).toLowerCase())){
    assert.equal(readFileSync(join(release, file), 'utf8').includes('\r'), false, `文本制品未规范化为 LF：${file}`);
  }
}

function requestStatus(base, path){
  return new Promise((resolveStatus, reject) => {
    const request = get(base + path, response => {
      const status = response.statusCode || 0;
      response.resume();
      response.once('end', () => resolveStatus(status));
    });
    request.once('error', reject);
  });
}

async function verifyBrowserRelease(base){
  const browser = await chromium.launch({headless:true, executablePath:browserExecutable(), args:['--no-sandbox']});
  try{
    const context = await browser.newContext({viewport:{width:844,height:390}, hasTouch:true, isMobile:true, deviceScaleFactor:2});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(`pageerror:${error.message}`));
    page.on('console', message => { if(message.type() === 'error') errors.push(`console:${message.text()}`); });
    page.on('response', response => { if(response.status() >= 400) errors.push(`http:${response.status()} ${response.url()}`); });
    await page.goto(`${base}/?slice=1&demo&seed=20260903`, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => document.querySelector('meta[name="duckduckrun-build"]')?.content && location.pathname.includes('/releases/'), undefined, {timeout:4000});
    await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', undefined, {timeout:4000});
    const initial = await page.evaluate(() => {
      const canvas = document.querySelector('#cv');
      return {
        buildId:document.querySelector('meta[name="duckduckrun-build"]')?.content,
        publicConfig:globalThis.__DUCKDUCKRUN_PUBLIC__,
        ratio:Number((canvas.width / canvas.getBoundingClientRect().width).toFixed(1)),
        fingerprinted:Array.from(performance.getEntriesByType('resource')).some(entry => /\.[a-f0-9]{12}\.(?:webp|png|woff2|jpg)$/.test(entry.name)),
      };
    });
    assert.deepEqual(initial, {
      buildId:info.buildId,
      publicConfig:{publicSiteUrl:info.publicSiteUrl, publicBasePath:info.publicBasePath},
      ratio:1.5,
      fingerprinted:true,
    });
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(async () => (await import('./src/game.js')).G.state === 'play', undefined, {timeout:4000});
    assert.deepEqual(errors, [], `制品深链接或刷新产生错误：${JSON.stringify(errors)}`);
    await context.close();
  } finally {
    await browser.close();
  }
}

const server = await startStaticServer({cwd:dist, port:8125, label:'制品检查'});
try{
  const paths = ['/', '/build-info.json', ...info.files.map(file => `/${info.releasePath}${file}`), ...Object.values(info.notices).map(file => `/${info.releasePath}${file}`)];
  const results = [];
  for(const path of [...new Set(paths)]) results.push({path, status:await requestStatus(server.base, path)});
  const failed = results.filter(result => result.status >= 400);
  assert.deepEqual(failed, [], `制品资源 404/5xx：${JSON.stringify(failed)}`);
  await verifyBrowserRelease(server.base);
  console.log(`PASS | 可复现制品：${results.length} 个入口/资源均可达，版本 ${info.buildId}；确定性重建、公开配置、法务告知与深链接通过`);
} finally {
  await server.stop();
}
