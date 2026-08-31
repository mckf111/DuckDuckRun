import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const requested = process.env.BUILD_ID || process.env.GITHUB_SHA || '';
const buildId = (requested || execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd:root, encoding:'utf8' }).trim())
  .replace(/[^0-9A-Za-z._-]/g, '')
  .slice(0, 64);

if(!buildId) throw new Error('无法确定构建版本标识');
rmSync(dist, { recursive:true, force:true });
const release = join(dist, 'releases', buildId);
mkdirSync(release, { recursive:true });
for(const name of ['src', 'assets']) cpSync(join(root, name), join(release, name), { recursive:true });
const sourceHtml = readFileSync(join(root, 'index.html'), 'utf8');
if(!sourceHtml.includes('__BUILD_ID__')) throw new Error('index.html 缺少 __BUILD_ID__ 构建占位符');
writeFileSync(join(release, 'index.html'), sourceHtml.replaceAll('__BUILD_ID__', buildId));

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

const files = listFiles(release);
const manifest = {
  schema: 1,
  buildId,
  generatedAt: new Date().toISOString(),
  files,
};
writeFileSync(join(release, 'build-info.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(join(dist, 'build-info.json'), JSON.stringify({ ...manifest, releasePath:`releases/${buildId}/` }, null, 2) + '\n');
writeFileSync(join(dist, 'index.html'), `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./releases/${buildId}/"><title>冲鸭！金陵！</title><script>location.replace('./releases/${buildId}/')</script>\n`);
console.log(`PASS | 已生成原子静态制品 dist/releases/${buildId}/（${files.length} 个文件）`);
