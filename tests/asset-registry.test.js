import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildAssetSbom, parseCreditLine } from '../tools/generate_asset_sbom.mjs';
import { checkAssetRegistry, collectGovernedAssetPaths, registryCoverage } from '../tools/e2e/check_asset_registry.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const historicalMisses = [
  'assets/img/bg_sunyard.jpg',
  'assets/img/bg_sunyard.webp',
  'assets/img/it_stone.jpg',
];

test('照片署名解析保留作者名中的逗号', () => {
  const sunyard = parseCreditLine('- `bg_sunyard` — [照片](https://example.test/a),作者:Jiong Sheng from London, United Kingdom,授权:CC BY-SA 2.0');
  const stone = parseCreditLine('- `it_stone` — [照片](https://example.test/b),作者:Caitriana Nicholson from 北京 ~ Beijing, 中国 ~ China,授权:CC BY-SA 2.0');
  assert.equal(sunyard.author, 'Jiong Sheng from London, United Kingdom');
  assert.equal(stone.author, 'Caitriana Nicholson from 北京 ~ Beijing, 中国 ~ China');
});

test('磁盘反查能准确抓出旧登记表漏掉的三个文件', () => {
  const sbom = buildAssetSbom(root);
  const governed = collectGovernedAssetPaths(root);
  const oldAssets = sbom.assets.filter(asset => !historicalMisses.includes(asset.local_path));
  assert.deepEqual(registryCoverage(governed, oldAssets).missing, historicalMisses);
  assert.deepEqual(registryCoverage(governed, sbom.assets), {missing:[], duplicate:[], unexpected:[]});
  for(const path of historicalMisses) assert.ok(sbom.assets.some(asset => asset.local_path === path), path);
  assert.equal(sbom.assets.find(asset => asset.local_path === 'assets/img/bg_sunyard.jpg').author, 'Jiong Sheng from London, United Kingdom');
  assert.equal(sbom.assets.find(asset => asset.local_path === 'assets/img/it_stone.jpg').author, 'Caitriana Nicholson from 北京 ~ Beijing, 中国 ~ China');
});

test('完整门禁从临时 SBOM 验证字段、哈希、声明合同和一一覆盖', () => {
  const sbom = buildAssetSbom(root);
  const directory = mkdtempSync(join(tmpdir(), 'duckduckrun-asset-registry-'));
  const registryPath = join(directory, 'asset-sbom.json');
  try{
    writeFileSync(registryPath, JSON.stringify(sbom));
    const result = checkAssetRegistry(root, registryPath);
    assert.equal(result.registry.assets.length, result.governed.length);
    for(const path of ['assets/game/book-duck.webp','assets/game/book-wall.webp','assets/icons/duck-512.png','src/audio.js'])assert.ok(result.governed.includes(path),path);
    assert.ok(result.registry.assets.every(asset=>asset.review_status==='pending'));
  }finally{
    rmSync(directory, {recursive:true, force:true});
  }
});
