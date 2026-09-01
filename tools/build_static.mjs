import { cpSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, extname, join, parse, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
function listSourceInputs(directory, prefix=''){
  return readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    const absolute=join(directory, entry.name);
    const relativePath=prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listSourceInputs(absolute, relativePath) : [relativePath];
  }).sort();
}
function runtimeInputBuildId(){
  const inputs=[
    'index.html',
    ...listSourceInputs(join(root,'src'),'src'),
    ...listSourceInputs(join(root,'assets'),'assets'),
  ].sort();
  const hash=createHash('sha256');
  for(const relativePath of inputs){
    hash.update(relativePath).update('\0').update(readFileSync(join(root,relativePath))).update('\0');
  }
  return hash.digest('hex').slice(0,12);
}
const requested = process.env.BUILD_ID || '';
const buildId = (requested || runtimeInputBuildId())
  .replace(/[^0-9A-Za-z._-]/g, '')
  .slice(0, 64);
const rawBase = (process.env.PUBLIC_BASE_PATH || '').trim();
const publicBasePath = rawBase ? '/' + rawBase.replace(/^\/+|\/+$/g, '') : '';
const publicSiteUrl = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');

if(!buildId) throw new Error('无法确定构建版本标识');
if(publicSiteUrl && !/^https:\/\/[^\s/]+/i.test(publicSiteUrl)) throw new Error('PUBLIC_SITE_URL 必须是 HTTPS 站点根地址');
if(rawBase && !/^\/?[0-9A-Za-z._~\/-]+$/.test(rawBase)) throw new Error('PUBLIC_BASE_PATH 只能包含 URL 路径字符');

rmSync(dist, { recursive:true, force:true });
const release = join(dist, 'releases', buildId);
mkdirSync(release, { recursive:true });
cpSync(join(root, 'src'), join(release, 'src'), { recursive:true });
cpSync(join(root, 'assets'), join(release, 'assets'), { recursive:true });

function listFiles(directory){
  const result = [];
  const walk = current => {
    for(const entry of readdirSync(current, { withFileTypes:true })){
      const path = join(current, entry.name);
      if(entry.isDirectory()) walk(path);
      else result.push(relative(release, path).replaceAll('\\', '/'));
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

const assets = fingerprintAssets();
const releasePath = `releases/${buildId}/`;
const socialMeta = publicSiteUrl ? [
  '<meta property="og:type" content="website">',
  '<meta property="og:title" content="冲鸭！金陵！· 南京城市跑酷">',
  '<meta property="og:description" content="南京城市主题跑酷 H5:逃出鸭店的白胖鸭,跑遍金陵十景,收集 40 件风物图鉴。">',
  `<meta property="og:image" content="${publicSiteUrl}${publicBasePath}/${releasePath}${assets['assets/icons/duck-512.png']}">`,
].join('\n') : '';
const sourceHtml = readFileSync(join(root, 'index.html'), 'utf8');
if(!sourceHtml.includes('__BUILD_ID__') || !sourceHtml.includes('<!-- __SOCIAL_META__ -->')) throw new Error('index.html 缺少构建占位符');
let outputHtml = sourceHtml
  .replaceAll('__BUILD_ID__', buildId)
  .replace('<!-- __SOCIAL_META__ -->', socialMeta);
for(const [original, fingerprinted] of Object.entries(assets)) outputHtml = outputHtml.replaceAll(`./${original}`, `./${fingerprinted}`);
writeFileSync(join(release, 'index.html'), outputHtml);
writeFileSync(join(release, 'asset-manifest.js'), `/* 由构建生成；不要手改。 */\nglobalThis.__DUCKDUCKRUN_ASSETS__ = Object.freeze(${JSON.stringify(assets, null, 2)});\n`);

const files = listFiles(release);
const manifest = {
  schema: 2,
  buildId,
  generatedAt: new Date().toISOString(),
  releasePath,
  publicBasePath,
  publicSiteUrl: publicSiteUrl || null,
  files,
  assets,
};
writeFileSync(join(release, 'build-info.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(join(dist, 'build-info.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(join(dist, 'index.html'), `<!doctype html><meta charset="utf-8"><title>冲鸭！金陵！</title><p>正在打开游戏……</p><script>location.replace('./${releasePath}'+location.search+location.hash)</script><noscript><a href="./${releasePath}">打开游戏</a></noscript>\n`);
console.log(`PASS | 已生成原子静态制品 dist/${releasePath}（${files.length} 个文件；${Object.keys(assets).length} 个内容指纹资产）`);
