import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, parse, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAssetSbom } from './generate_asset_sbom.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const preview=process.argv.includes('--preview');
const assetReview=buildAssetSbom(root);
const pendingAssets=assetReview.assets.filter(a=>a.review_status!=='approved');
if(!preview&&pendingAssets.length)throw new Error(`正式构建已阻止：${pendingAssets.length} 项素材尚未审核通过。内部试玩请用 npm run build（--preview）。`);
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.py', '.sh', '.txt', '.yaml', '.yml']);

function canonicalBytes(path){
  const bytes = readFileSync(path);
  if(!textExtensions.has(extname(path).toLowerCase())) return bytes;
  return Buffer.from(bytes.toString('utf8').replace(/\r\n?/g, '\n'), 'utf8');
}

function listSourceInputs(directory, prefix=''){
  return readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    const absolute = join(directory, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if(relativePath==='assets/img/src')return [];
    return entry.isDirectory() ? listSourceInputs(absolute, relativePath) : [relativePath];
  }).sort();
}

function normalizePublicSiteUrl(value){
  const raw = value.trim().replace(/\/+$/, '');
  if(!raw) return '';
  let parsed;
  try{ parsed = new URL(raw); }catch(error){ throw new Error('PUBLIC_SITE_URL 必须是 HTTPS 站点根地址'); }
  if(parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname && parsed.pathname !== '/')){
    throw new Error('PUBLIC_SITE_URL 必须是无路径、查询或凭证的 HTTPS 站点根地址；子路径请用 PUBLIC_BASE_PATH');
  }
  return parsed.origin;
}

const rawBase = (process.env.PUBLIC_BASE_PATH || '').trim();
if(rawBase && !/^\/?[0-9A-Za-z._~\/-]+$/.test(rawBase)) throw new Error('PUBLIC_BASE_PATH 只能包含 URL 路径字符');
const publicBasePath = rawBase ? '/' + rawBase.replace(/^\/+|\/+$/g, '') : '';
const publicSiteUrl = normalizePublicSiteUrl(process.env.PUBLIC_SITE_URL || '');
const publicConfig = {publicSiteUrl:publicSiteUrl || null, publicBasePath};

function runtimeInputBuildId(){
  const inputs = [
    'index.html',
    'LICENSE.md',
    'tools/build_static.mjs',
    ...listSourceInputs(join(root, 'src'), 'src'),
    ...listSourceInputs(join(root, 'assets'), 'assets'),
  ].sort();
  const hash = createHash('sha256');
  hash.update('duckduckrun-static-release/v3\0');
  hash.update(JSON.stringify(publicConfig)).update('\0');
  hash.update(JSON.stringify({distribution:preview?'internal-preview':'production',assetReview})).update('\0');
  for(const relativePath of inputs){
    hash.update(relativePath).update('\0').update(canonicalBytes(join(root, relativePath))).update('\0');
  }
  return hash.digest('hex').slice(0, 12);
}

const buildId = runtimeInputBuildId();
const requested = (process.env.BUILD_ID || '').trim();
if(requested && requested !== buildId){
  throw new Error(`BUILD_ID 不能覆盖内容地址；当前规范化输入对应 ${buildId}`);
}

function copyCanonicalDirectory(source, destination){
  mkdirSync(destination, {recursive:true});
  for(const entry of readdirSync(source, {withFileTypes:true})){
    const sourcePath = join(source, entry.name);
    if(relative(root,sourcePath).replaceAll('\\','/')==='assets/img/src')continue;
    const destinationPath = join(destination, entry.name);
    if(entry.isDirectory()) copyCanonicalDirectory(sourcePath, destinationPath);
    else if(entry.isFile()) writeFileSync(destinationPath, canonicalBytes(sourcePath));
    else throw new Error(`构建输入不支持符号链接或特殊文件：${relative(root, sourcePath)}`);
  }
}

if(resolve(dist)!==resolve(root)+sep+'dist')throw new Error('拒绝清理工作区之外的构建路径');
rmSync(dist, {recursive:true, force:true});
const release = join(dist, 'releases', buildId);
mkdirSync(release, {recursive:true});
copyCanonicalDirectory(join(root, 'src'), join(release, 'src'));
copyCanonicalDirectory(join(root, 'assets'), join(release, 'assets'));
const notices = {
  gameLicense:'legal/LICENSE.md',
  photoCredits:'legal/PHOTO-CREDITS.md',
  fontLicense:'legal/FONT-OFL.txt',
};
mkdirSync(join(release, 'legal'), {recursive:true});
writeFileSync(join(release, notices.gameLicense), canonicalBytes(join(root, 'LICENSE.md')));
writeFileSync(join(release, notices.photoCredits), canonicalBytes(join(root, 'assets', 'img', 'CREDITS.md')));
writeFileSync(join(release, notices.fontLicense), canonicalBytes(join(root, 'assets', 'fonts', 'OFL.txt')));

function listFiles(directory){
  const result = [];
  const walk = current => {
    for(const entry of readdirSync(current, {withFileTypes:true})){
      const path = join(current, entry.name);
      if(entry.isDirectory()) walk(path);
      else if(entry.isFile()) result.push(relative(release, path).replaceAll('\\', '/'));
    }
  };
  walk(directory);
  return result.sort();
}

function fingerprintAssets(){
  const assetsDir = join(release, 'assets');
  const files = listFiles(assetsDir);
  const manifest = {};
  for(const relFromRelease of files){
    const absolute = join(release, relFromRelease);
    const hash = createHash('sha256').update(readFileSync(absolute)).digest('hex').slice(0, 12);
    const parsed = parse(absolute);
    const fingerprinted = join(parsed.dir, `${parsed.name}.${hash}${parsed.ext}`);
    renameSync(absolute, fingerprinted);
    manifest[relFromRelease] = relative(release, fingerprinted).replaceAll('\\', '/');
  }
  return manifest;
}

function escapeAttribute(value){
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

const assets = fingerprintAssets();
const releasePath = `releases/${buildId}/`;
const title = '冲鸭！金陵！· 南京城市跑酷';
const description = '南京城市主题跑酷 H5:逃出鸭店的白胖鸭,跑遍金陵十景,收集 40 件风物图鉴。';
const publicRootUrl = publicSiteUrl ? `${publicSiteUrl}${publicBasePath}/` : '';
const publicImageUrl = publicSiteUrl ? `${publicRootUrl}${releasePath}${assets['assets/icons/duck-512.png']}` : '';
const socialMeta = [
  '<meta property="og:type" content="website">',
  `<meta property="og:title" content="${escapeAttribute(title)}">`,
  `<meta property="og:description" content="${escapeAttribute(description)}">`,
  ...(publicRootUrl ? [`<meta property="og:url" content="${escapeAttribute(publicRootUrl)}">`] : []),
  ...(publicImageUrl ? [`<meta property="og:image" content="${escapeAttribute(publicImageUrl)}">`] : []),
].join('\n');

const sourceHtml = canonicalBytes(join(root, 'index.html')).toString('utf8');
if(!sourceHtml.includes('__BUILD_ID__') || !sourceHtml.includes('<!-- __SOCIAL_META__ -->')) throw new Error('index.html 缺少构建占位符');
let outputHtml = sourceHtml
  .replaceAll('__BUILD_ID__', buildId)
  .replace('<!-- __SOCIAL_META__ -->', socialMeta);
for(const [original, fingerprinted] of Object.entries(assets)) outputHtml = outputHtml.replaceAll(`./${original}`, `./${fingerprinted}`);
writeFileSync(join(release, 'index.html'), outputHtml);
writeFileSync(join(release, 'asset-manifest.js'), [
  '/* 由构建生成；不要手改。 */',
  `globalThis.__DUCKDUCKRUN_PUBLIC__ = Object.freeze(${JSON.stringify(publicConfig, null, 2)});`,
  `globalThis.__DUCKDUCKRUN_ASSETS__ = Object.freeze(${JSON.stringify(assets, null, 2)});`,
  '',
].join('\n'));

const files = listFiles(release);
const manifest = {
  schema:2,
  distribution:preview?'internal-preview':'production',
  pendingAssetReviews:pendingAssets.length,
  buildId,
  releasePath,
  publicBasePath,
  publicSiteUrl:publicSiteUrl || null,
  files,
  assets,
  notices,
};
const manifestJson = JSON.stringify(manifest, null, 2) + '\n';
writeFileSync(join(release, 'build-info.json'), manifestJson);
writeFileSync(join(dist, 'build-info.json'), manifestJson);
writeFileSync(join(dist, 'index.html'), [
  '<!doctype html>',
  '<html lang="zh-CN"><head>',
  '<meta charset="utf-8">',
  `<title>${title}</title>`,
  socialMeta,
  '</head><body>',
  '<p>正在打开游戏……</p>',
  `<script>location.replace('./${releasePath}'+location.search+location.hash)</script>`,
  `<noscript><a href="./${releasePath}">打开游戏</a></noscript>`,
  '</body></html>',
  '',
].join('\n'));

for(const required of ['index.html', 'asset-manifest.js', 'build-info.json']){
  if(!statSync(join(release, required)).isFile()) throw new Error(`版本制品缺少 ${required}`);
}
console.log(`PASS | 已生成可复现静态制品 dist/${releasePath}（${files.length} 个文件；${Object.keys(assets).length} 个内容指纹资产）`);
