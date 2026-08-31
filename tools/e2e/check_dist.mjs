import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const base = 'http://127.0.0.1:8125';
const infoPath = join(dist, 'build-info.json');
assert.ok(existsSync(infoPath), '缺少 dist/build-info.json；请先运行 npm run build');
const info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.match(info.buildId, /^[0-9A-Za-z._-]{1,64}$/);
assert.equal(info.releasePath, `releases/${info.buildId}/`);
assert.ok(Array.isArray(info.files) && info.files.length > 0, '制品清单为空');
const release = join(dist, info.releasePath);
const index = readFileSync(join(release, 'index.html'), 'utf8');
assert.ok(index.includes(`name="duckduckrun-build" content="${info.buildId}"`), '版本标识未注入制品 HTML');
assert.ok(!index.includes('__BUILD_ID__'), '制品仍含未替换的版本占位符');
for(const file of info.files) assert.ok(existsSync(join(release, file)), `清单文件缺失：${file}`);

const server = spawn('python3', ['-m', 'http.server', '8125', '--bind', '127.0.0.1'], { cwd:dist, stdio:'ignore' });
async function waitServer(){
  for(let i=0;i<50;i++){
    try{ if((await fetch(base + '/build-info.json')).ok) return; }catch(e){}
    await new Promise(resolve=>setTimeout(resolve, 100));
  }
  throw new Error('制品检查 HTTP 服务未启动');
}
try{
  await waitServer();
  const paths = ['/', '/build-info.json', ...info.files.map(file => `/${info.releasePath}${file}`)];
  const results = await Promise.all(paths.map(async path => ({ path, status:(await fetch(base + path)).status })));
  const failed = results.filter(result => result.status >= 400);
  assert.deepEqual(failed, [], `制品资源 404/5xx：${JSON.stringify(failed)}`);
  console.log(`PASS | 制品完整性：${paths.length} 个入口/资源均可达，版本 ${info.buildId}`);
} finally {
  server.kill();
}
