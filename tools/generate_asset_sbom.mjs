import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const credits = readFileSync(join(root, 'assets/img/CREDITS.md'), 'utf8').split('\n');
const entries = [];
for(const line of credits){
  const match = line.match(/^- `([^`]+)`\s+—\s+\[[^\]]+\]\((https?:[^)]+)\),作者:([^,]+),授权:([^,]+)/);
  if(!match) continue;
  const [, id, sourceUrl, author, licenseRaw] = match;
  const files = readdirSync(join(root, 'assets/img')).filter(file => file.startsWith(id + '.'));
  for(const file of files){
    const relativePath = `assets/img/${file}`;
    entries.push({
      id,
      local_path:relativePath,
      category:id.startsWith('bg_') ? 'landmark_background' : 'item_photo',
      purpose:id.startsWith('bg_') ? 'Canvas backdrop' : 'album reference photo',
      modified:'unknown (pre-existing crop/compression history not recorded)',
      source_url:sourceUrl,
      source_version:'not recorded in pre-stage-2 repository',
      author:author.trim(),
      license:licenseRaw.trim().replace('CC BY SA', 'CC BY-SA'),
      downloaded_at:'not recorded in pre-stage-2 repository',
      sha256:createHash('sha256').update(readFileSync(join(root, relativePath))).digest('hex'),
      processing_record:'not recorded in pre-stage-2 repository',
      attribution_location:'assets/img/CREDITS.md and src/legal.js',
      reviewer:'Manus AI (stage 2 inventory)',
      reviewed_at:'2026-09-01',
    });
  }
}
const featured = [
  ['bg_zhonghua', 'assets/game/bg-zhonghua.webp'],
  ['bg_menu', 'assets/game/menu-background.webp'],
];
for(const [id, relativePath] of featured){
  const source = entries.find(entry => entry.id === id);
  if(!source) continue;
  entries.push({ ...source, local_path:relativePath, purpose:'featured Canvas backdrop', sha256:createHash('sha256').update(readFileSync(join(root, relativePath))).digest('hex') });
}
for(const file of readdirSync(join(root, 'assets/fonts')).filter(file => file.endsWith('.woff2'))){
  const relativePath = `assets/fonts/${file}`;
  entries.push({
    id:file.replace(/\.woff2$/, ''),
    local_path:relativePath,
    category:'font',
    purpose:'local UI font',
    modified:'unknown (pre-existing subset history not recorded)',
    source_url:'not recorded in pre-stage-2 repository',
    source_version:'see assets/fonts/OFL.txt',
    author:'see assets/fonts/OFL.txt',
    license:'OFL-1.1',
    downloaded_at:'not recorded in pre-stage-2 repository',
    sha256:createHash('sha256').update(readFileSync(join(root, relativePath))).digest('hex'),
    processing_record:'not recorded in pre-stage-2 repository',
    attribution_location:'assets/fonts/OFL.txt and src/legal.js',
    reviewer:'Manus AI (stage 2 inventory)',
    reviewed_at:'2026-09-01',
  });
}
const generatedSliceAssets = [
  ['nanjing-slice-target-v1', 'assets/game/nanjing-slice/nanjing-vertical-slice-target.webp', 'design_reference', 'Nanjing vertical-slice visual target'],
  ['nanjing-slice-salted-duck-v1', 'assets/game/nanjing-slice/salted-duck-token.webp', 'generated_game_sprite', 'salted-duck pickup token'],
  ['nanjing-slice-lantern-marker-v1', 'assets/game/nanjing-slice/qinhuai-lantern-marker.webp', 'generated_game_sprite', 'Qinhuai route and reward marker'],
];
for(const [id, relativePath, category, purpose] of generatedSliceAssets){
  entries.push({
    id,
    local_path:relativePath,
    category,
    purpose,
    modified:'generated then resized/compressed for stage-3 vertical slice',
    source_url:'project-generated; no external visual source',
    source_version:'prompt, visual reference and cultural-fact boundaries recorded in ASSETS.md and docs/research/nanjing-source-notes.md',
    author:'Manus AI image generation for DuckDuckRun',
    license:'project-generated asset; game code/art governed by LICENSE.md',
    downloaded_at:'not applicable',
    sha256:createHash('sha256').update(readFileSync(join(root, relativePath))).digest('hex'),
    processing_record:'tools/process_nanjing_slice_assets.py; original PNG intentionally not committed',
    attribution_location:'ASSETS.md (stage 3 generated-asset record)',
    reviewer:'Manus AI (stage 3 inventory)',
    reviewed_at:'2026-09-01',
  });
}
entries.sort((a,b) => a.local_path.localeCompare(b.local_path));
const output = {
  schema:'duckduckrun-asset-sbom/v1',
  generated_at:'2026-09-01', // 阶段 2 基线日期；输入未变时生成结果必须稳定。
  scope:'Third-party photos, local fonts, and stage-3 project-generated slice assets shipped by the static runtime. Other original program/art assets remain governed by LICENSE.md.',
  known_gaps:[
    'Pre-stage-2 download dates, original source revision/oldid and processing history were not recorded and must not be inferred.',
    'CC BY-SA adaptation/share-alike treatment remains a release review item; this inventory is evidence, not a legal conclusion.',
  ],
  assets:entries,
};
mkdirSync(join(root, 'docs/qa'), {recursive:true});
writeFileSync(join(root, 'docs/qa/asset-sbom.json'), JSON.stringify(output, null, 2) + '\n');
console.log(`PASS | 素材 SBOM：${entries.length} 条本地文件映射已写入 docs/qa/asset-sbom.json`);
