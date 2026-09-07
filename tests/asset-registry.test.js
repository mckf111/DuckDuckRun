import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { applyReleaseReview, buildAssetSbom, parseCreditLine } from '../tools/generate_asset_sbom.mjs';
import { includeReleaseAsset } from '../tools/release_assets.mjs';
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
    assert.ok(result.registry.assets.every(asset=>['pending','approved','rejected'].includes(asset.review_status)));
  }finally{
    rmSync(directory, {recursive:true, force:true});
  }
});

test('发布批准只对同一内容生效，缺记录或替换素材后必须重新审核',()=>{
  const path='assets/game/book-wall.webp',sha='a'.repeat(64);
  const records={[path]:{sha256:sha,status:'approved',reviewer:'review fixture',reviewed_at:'2026-09-07',decision:'fixture',evidence:['ASSETS.md']}};
  assert.equal(applyReleaseReview({local_path:path,sha256:sha},records).review_status,'approved');
  assert.equal(applyReleaseReview({local_path:path,sha256:'b'.repeat(64)},records).review_status,'pending');
  assert.equal(applyReleaseReview({local_path:path,sha256:sha}).review_status,'pending');
  assert.equal(applyReleaseReview({local_path:path,sha256:sha},{[path]:{...records[path],status:'rejected'}}).review_status,'rejected');
});

test('README 图片和内部发布审核不随游戏分发，运行素材仍保留',()=>{
  for(const path of ['assets/readme','assets/readme/hero.png','assets/readme/source/hero-layout.svg','assets/release-review.json'])assert.equal(includeReleaseAsset(path),false,path);
  for(const path of ['assets/game/book-wall.webp','assets/fonts/jinling-kai.woff2','assets/album/duck.jpg'])assert.equal(includeReleaseAsset(path),true,path);
});
