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
      release_status:'registered — source, author, license, SHA-256 and player-visible attribution are present',
      license_obligation:licenseRaw.includes('CC BY-SA') || licenseRaw.includes('CC BY SA') ? 'Attribution, license link and change notice; the local derivative/copy remains available under the corresponding CC BY-SA license.' : 'Attribution, license link and change notice where applicable.',
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
const fontSources = {
  'jinling-brush.woff2': { url:'https://github.com/googlefonts/mashanzheng', author:'The Ma Shan Zheng Project Authors' },
  'jinling-kai.woff2': { url:'https://github.com/lxgw/LxgwWenKai', author:'LXGW' },
};
for(const file of readdirSync(join(root, 'assets/fonts')).filter(file => file.endsWith('.woff2'))){
  const relativePath = `assets/fonts/${file}`;
  entries.push({
    id:file.replace(/\.woff2$/, ''),
    local_path:relativePath,
    category:'font',
    purpose:'local UI font',
    modified:'unknown (pre-existing subset history not recorded)',
    source_url:fontSources[file].url,
    source_version:'exact upstream revision pre-dates repository provenance; family, author and SIL OFL 1.1 recorded in assets/fonts/OFL.txt',
    author:fontSources[file].author,
    license:'OFL-1.1',
    release_status:'registered — upstream family, copyright holder, SIL OFL 1.1 notice, SHA-256 and player-visible attribution are present',
    license_obligation:'Bundle the SIL OFL 1.1 copyright and license notice; do not sell font files by themselves.',
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
    release_status:'registered — project-generated source, processing path, SHA-256 and attribution location are present',
    license_obligation:'No third-party visual source was used; retain project provenance and LICENSE.md notice.',
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
  release_review:{
    status:'registered',
    asset_file_count:entries.length,
    completeness_rule:'Each shipped third-party/generated/font asset has a local path, SHA-256, source/provenance, author/rightsholder, license, attribution location and release obligation.',
    player_visible_notices:['assets/img/CREDITS.md','assets/fonts/OFL.txt','src/legal.js','LICENSE.md'],
    historical_provenance_note:'Pre-stage-2 download dates, original source revisions/oldids and transformation history were not recorded and are not reconstructed. This is a provenance limitation, not an unregistered shipped file.',
    legal_note:'Registry review documents attribution and license handling; it is not a formal legal opinion.',
  },
  assets:entries,
};
mkdirSync(join(root, 'docs/qa'), {recursive:true});
writeFileSync(join(root, 'docs/qa/asset-sbom.json'), JSON.stringify(output, null, 2) + '\n');
console.log(`PASS | 素材 SBOM：${entries.length} 条本地文件映射已写入 docs/qa/asset-sbom.json`);
