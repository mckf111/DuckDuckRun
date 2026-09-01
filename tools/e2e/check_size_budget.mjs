import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(root, 'dist');
const info = JSON.parse(readFileSync(join(dist, 'build-info.json'), 'utf8'));
const release = join(dist, info.releasePath);
const firstScreenAssetKeys = [
  'assets/game/menu-background.webp',
  'assets/game/duck-atlas.webp',
  'assets/game/pickup-ring.webp',
  'assets/game/obstacles-crenel.webp',
  'assets/game/nanjing-slice/salted-duck-token.webp',
  'assets/game/nanjing-slice/qinhuai-lantern-marker.webp',
];
const firstScreen = new Set([
  'index.html',
  'asset-manifest.js',
  ...firstScreenAssetKeys.map(key => info.assets[key]),
  ...info.files.filter(path => path.startsWith('src/')),
  ...Object.entries(info.assets).filter(([path]) => path.startsWith('assets/fonts/')).map(([, path]) => path),
]);
assert.ok(![...firstScreen].some(path => !path), '首屏资源未全部写入指纹清单');
function compressedBytes(paths){
  return [...paths].reduce((total, path) => total + gzipSync(readFileSync(join(release, path)), { level:9 }).length, 0);
}
const firstScreenBytes = compressedBytes(firstScreen);
const fullSessionBytes = compressedBytes(info.files);
const firstScreenBudget = 6 * 1024 * 1024;
const fullSessionBudget = 20 * 1024 * 1024;
assert.ok(firstScreenBytes <= firstScreenBudget, `首屏压缩体积 ${(firstScreenBytes/1024/1024).toFixed(2)} MiB 超过 6 MiB 预算`);
assert.ok(fullSessionBytes <= fullSessionBudget, `首次会话压缩体积 ${(fullSessionBytes/1024/1024).toFixed(2)} MiB 超过 20 MiB 预算`);
console.log(`PASS | 体积预算：首屏 ${(firstScreenBytes/1024).toFixed(1)} KiB / 6 MiB；全会话 ${(fullSessionBytes/1024/1024).toFixed(2)} MiB / 20 MiB`);
