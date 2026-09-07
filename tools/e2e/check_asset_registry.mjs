import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLAYER_VISIBLE_NOTICE_CONTRACT } from '../../src/legal.js';

const defaultRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const imagePattern = /\.(?:jpe?g|png|webp)$/i;

function filesUnder(root, relativeDirectory, accept){
  const directory = join(root, relativeDirectory);
  return readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    const relativePath = `${relativeDirectory}/${entry.name}`.replaceAll('\\', '/');
    if(relativePath==='assets/img/src')return [];
    return entry.isDirectory() ? filesUnder(root, relativePath, accept) : accept(entry.name) ? [relativePath] : [];
  });
}

/*
 * 受许可/来源登记约束的真实磁盘集合。它独立于 SBOM 内容，避免登记表漏项后仍自报 100%。
 * 图集、图标、照片、字体和音频源全部反查；候选原图不发布。登记不代表权利批准。
 */
export function collectGovernedAssetPaths(root=defaultRoot){
  const paths = [
    ...filesUnder(root, 'assets/img', name => imagePattern.test(name)),
    ...filesUnder(root, 'assets/album', name => imagePattern.test(name)),
    ...filesUnder(root, 'assets/fonts', name => /\.woff2$/i.test(name)),
    ...filesUnder(root, 'assets/game', name => imagePattern.test(name)),
    ...filesUnder(root, 'assets/icons', name => /\.(png|svg|ico|webp)$/i.test(name)),
    'src/audio.js',
  ];
  for(const relativePath of ['assets/game/bg-zhonghua.webp', 'assets/game/menu-background.webp']){
    if(existsSync(join(root, relativePath))) paths.push(relativePath);
  }
  return [...new Set(paths)].sort();
}

export function registryCoverage(expectedPaths, assets){
  const counts = new Map();
  for(const asset of assets) counts.set(asset.local_path, (counts.get(asset.local_path) || 0) + 1);
  const expected = new Set(expectedPaths);
  return {
    missing:expectedPaths.filter(path => !counts.has(path)),
    duplicate:[...counts].filter(([, count]) => count !== 1).map(([path, count]) => ({path, count})),
    unexpected:[...counts.keys()].filter(path => !expected.has(path)).sort(),
  };
}

export function checkAssetRegistry(root=defaultRoot, registryPath=join(root, 'docs/qa/asset-sbom.json')){
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  assert.equal(registry.release_review?.status, 'registered', '资产登记状态不是 registered');
  assert.equal(registry.release_review?.asset_file_count, registry.assets.length, '资产登记数量与实际数组不一致');
  assert.deepEqual(registry.release_review?.player_visible_notice_contract, PLAYER_VISIBLE_NOTICE_CONTRACT, '玩家可见声明合同与 src/legal.js 不一致');

  for(const {source} of Object.values(PLAYER_VISIBLE_NOTICE_CONTRACT.release_files)){
    assert.equal(existsSync(join(root, source)), true, `玩家可见声明源文件不存在：${source}`);
  }

  for(const asset of registry.assets){
    for(const field of ['local_path','sha256','source_url','author','license','release_status','license_obligation','attribution_location']){
      assert.ok(asset[field], `${asset.local_path || asset.id} 缺少授权登记字段：${field}`);
    }
    const absolute = join(root, asset.local_path);
    assert.equal(existsSync(absolute), true, `登记文件不存在：${asset.local_path}`);
    const actualHash = createHash('sha256').update(readFileSync(absolute)).digest('hex');
    assert.equal(asset.sha256, actualHash, `登记哈希与当前文件不一致：${asset.local_path}`);
  }

  const governed = collectGovernedAssetPaths(root);
  const coverage = registryCoverage(governed, registry.assets);
  assert.deepEqual(coverage.missing, [], `磁盘上有未登记的受管素材：${coverage.missing.join(', ')}`);
  assert.deepEqual(coverage.duplicate, [], `同一路径被重复登记：${coverage.duplicate.map(item => `${item.path}×${item.count}`).join(', ')}`);
  assert.deepEqual(coverage.unexpected, [], `SBOM 含不在受管集合内的路径：${coverage.unexpected.join(', ')}`);
  return {registry, governed, coverage};
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if(isMain){
  const {registry, governed} = checkAssetRegistry();
  console.log(`PASS | 素材工程登记：磁盘反查 ${governed.length}/${registry.assets.length} 条唯一登记且哈希一致；随包发布待审 ${registry.assets.filter(a=>a.release_included&&a.review_status!=='approved').length} 项；工程复核不替代法律意见`);
}
