import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const registry = JSON.parse(readFileSync(join(root, 'docs/qa/asset-sbom.json'), 'utf8'));
assert.equal(registry.release_review?.status, 'registered', '资产登记状态不是 registered');
assert.equal(registry.release_review?.asset_file_count, registry.assets.length, '资产登记数量与实际数组不一致');
for(const asset of registry.assets){
  for(const field of ['local_path','sha256','source_url','author','license','release_status','license_obligation','attribution_location']){
    assert.ok(asset[field], `${asset.local_path || asset.id} 缺少授权登记字段：${field}`);
  }
}
console.log(`PASS | 发布授权登记：${registry.assets.length}/${registry.assets.length} 条均含来源、作者、许可、义务、归属入口与哈希`);
