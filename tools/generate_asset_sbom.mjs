import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLAYER_VISIBLE_NOTICE_CONTRACT } from '../src/legal.js';

const defaultRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export { PLAYER_VISIBLE_NOTICE_CONTRACT };

export function parseCreditLine(line){
  const idMatch = line.match(/^- `([^`]+)`\s+—\s+\[/);
  const authorMarker = '),作者:';
  const authorAt = line.lastIndexOf(authorMarker);
  const urlAt = line.lastIndexOf('](', authorAt);
  if(!idMatch || urlAt < idMatch[0].length || authorAt < urlAt) return null;
  const sourceUrl = line.slice(urlAt + 2, authorAt).trim();
  if(!/^https?:\/\//.test(sourceUrl)) return null;
  const licenseMarker = ',授权:';
  const markerAt = line.lastIndexOf(licenseMarker);
  const authorStart = authorAt + authorMarker.length;
  if(markerAt < authorStart) return null;
  const author = line.slice(authorStart, markerAt).trim();
  const license = line.slice(markerAt + licenseMarker.length).split(',')[0].trim();
  if(!author || !license) return null;
  return { id:idMatch[1], sourceUrl, author, license };
}

function sha256(root, relativePath){
  return createHash('sha256').update(readFileSync(join(root, relativePath))).digest('hex');
}

export function buildAssetSbom(root=defaultRoot){
  const credits = readFileSync(join(root, 'assets/img/CREDITS.md'), 'utf8').split(/\r?\n/);
  const entries = [];
  for(const line of credits){
    const credit = parseCreditLine(line);
    if(!credit) continue;
    const { id, sourceUrl, author, license:licenseRaw } = credit;
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
        author,
        license:licenseRaw.replace('CC BY SA', 'CC BY-SA'),
        release_status:'registered — source, author, license, SHA-256 and player-visible attribution are present',
        license_obligation:licenseRaw.includes('CC BY-SA') || licenseRaw.includes('CC BY SA') ? 'Attribution, license link and change notice; the local derivative/copy remains available under the corresponding CC BY-SA license.' : 'Attribution, license link and change notice where applicable.',
        downloaded_at:'not recorded in pre-stage-2 repository',
        sha256:sha256(root, relativePath),
        processing_record:'not recorded in pre-stage-2 repository',
        attribution_location:'menu:credits (src/legal.js); full record: assets/img/CREDITS.md',
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
    if(!source) throw new Error(`精选背景缺少来源登记：${id}`);
    entries.push({ ...source, local_path:relativePath, purpose:'featured Canvas backdrop', sha256:sha256(root, relativePath) });
  }

  const fontSources = {
    'jinling-brush.woff2': {
      url:'https://github.com/googlefonts/mashanzheng',
      author:'The Ma Shan Zheng Project Authors',
      version:'official repository master snapshot downloaded 2026-09-02; exact commit was not recorded',
      input:'MaShanZheng-Regular.ttf',
      chars:'assets/fonts/chars-brush.txt',
    },
    'jinling-kai.woff2': {
      url:'https://github.com/lxgw/LxgwWenKai',
      author:'LXGW',
      version:'LXGW WenKai Medium v1.522 release',
      input:'LXGWWenKai-Medium.ttf',
      chars:'assets/fonts/chars.txt',
    },
  };
  for(const file of readdirSync(join(root, 'assets/fonts')).filter(file => file.endsWith('.woff2'))){
    const relativePath = `assets/fonts/${file}`;
    const source = fontSources[file];
    if(!source) throw new Error(`字体缺少来源登记：${relativePath}`);
    entries.push({
      id:file.replace(/\.woff2$/, ''),
      local_path:relativePath,
      category:'font',
      purpose:'local UI font',
      modified:file==='jinling-kai.woff2'?'subset to the committed character manifest on 2026-09-06; source SHA-256 preserved in private evidence':'subset to the committed character manifest on 2026-09-02',
      source_url:source.url,
      source_version:source.version,
      author:source.author,
      license:'OFL-1.1',
      release_status:'registered — upstream family, copyright holder, SIL OFL 1.1 notice, SHA-256 and player-visible attribution are present',
      license_obligation:'Bundle the SIL OFL 1.1 copyright and license notice; do not sell font files by themselves.',
      downloaded_at:'2026-09-02',
      sha256:sha256(root, relativePath),
      processing_record:`fonttools pyftsubset ${source.input} --text-file=${source.chars} --flavor=woff2 --no-hinting --desubroutinize`,
      attribution_location:'menu:credits (src/legal.js); full notice: assets/fonts/OFL.txt',
      reviewer:'Codex independent remediation',
      reviewed_at:'2026-09-02',
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
      sha256:sha256(root, relativePath),
      processing_record:'tools/process_nanjing_slice_assets.py; original PNG intentionally not committed',
      attribution_location:'ASSETS.md (stage 3 generated-asset record)',
      reviewer:'Manus AI (stage 3 inventory)',
      reviewed_at:'2026-09-01',
    });
  }

  entries.sort((a,b) => a.local_path.localeCompare(b.local_path));
  const walk=(dir)=>readdirSync(join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):/\.(png|webp|jpg|jpeg|svg|ico|mp3|wav|ogg)$/i.test(e.name)?[`${dir}/${e.name}`]:[]);
  for(const path of [...walk('assets/game'),...walk('assets/icons'),'src/audio.js']){
    if(entries.some(e=>e.local_path===path))continue;
    const book=path.includes('/book-'),audio=path==='src/audio.js';
    entries.push({id:path,local_path:path,sha256:sha256(root,path),category:audio?'synthesized_audio_source':book?'generated_image':'legacy_art',
      source_url:book?'OpenAI image generation in Codex; project prompt without image references':audio?'project source src/audio.js':'legacy project asset; source evidence incomplete',
      author:book?'AI-assisted project creation; human authorship scope to be reviewed':audio?'project contributors':'unverified legacy attribution',
      license:book?'Platform terms apply; no guarantee of exclusive copyright':audio?'LICENSE.md subject to contributor review':'unverified; internal preview only',
      modified:book?'2026-09-06 PNG encoded to WebP; no pixel retouch':audio?'2026-09-06 three buses, voice cooldown and four music phrases':'historical transformations not reconstructed',
      release_status:'registered; NOT approved for public release',license_obligation:'Retain provenance and close rights review before publication',
      attribution_location:'ASSETS.md; player credits; LICENSE.md'});
  }
  for(const e of entries){
    e.review_status='pending';
    e.decision=e.category==='legacy_art'?'replace or obtain original provenance before public release':e.category==='font'?'retain after fixed upstream and subset evidence review':e.category==='photo'?'review original license and modifications; replace unresolved material':'internal preview; review provenance and rights before public release';
  }
  entries.sort((a,b)=>a.local_path.localeCompare(b.local_path));
  return {
    schema:'duckduckrun-asset-sbom/v1',
    generated_at:'2026-09-06',
    scope:'All runtime images, icons, fonts and synthesized audio source. Inventory is distinct from approval for publication.',
    release_review:{
      status:'registered',
      asset_file_count:entries.length,
      completeness_rule:'Each governed source/release asset must be discovered from disk and matched to exactly one registry entry; every entry includes SHA-256, source/provenance, author/rightsholder, license, attribution location and release obligation.',
      player_visible_notice_contract:PLAYER_VISIBLE_NOTICE_CONTRACT,
      historical_provenance_note:'Pre-stage-2 download dates, original source revisions/oldids and transformation history were not recorded and are not reconstructed. This is a provenance limitation, not an unregistered shipped file.',
      legal_note:'Registry review documents attribution and license handling; it is not a formal legal opinion.',
    },
    assets:entries,
  };
}

export function writeAssetSbom(root=defaultRoot, outputPath=join(root, 'docs/qa/asset-sbom.json')){
  const output = buildAssetSbom(root);
  mkdirSync(dirname(outputPath), {recursive:true});
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
  return output;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if(isMain){
  const output = writeAssetSbom();
  console.log(`PASS | 素材 SBOM：${output.assets.length} 条本地文件映射已写入 docs/qa/asset-sbom.json`);
}
