import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {AI_MODELS,AI_CREATION_LINE,AI_FINISH_LINE,GROK_ATTRIBUTION_LINE,BACKGROUND_CREDITS,CREDIT_SECTIONS,PHOTO_SUMMARY} from '../src/legal.js';
import {ALBUM_PHOTOS} from '../src/album-photos.js';
import {ITEMS} from '../src/config.js';
import {buildAssetSbom,parseCreditLine} from '../tools/generate_asset_sbom.mjs';

test('多模型协作署名在玩家页、README、LICENSE及台账一致',()=>{
 assert.deepEqual(AI_MODELS.map(m=>m.name),['Kimi K3','Qwen3.8-Max','Grok 4.6','GPT-6 Astra']);
 const visible=CREDIT_SECTIONS.flatMap(s=>s.lines).join('\n');
 assert.ok(visible.includes(AI_CREATION_LINE));assert.ok(visible.includes(AI_FINISH_LINE));assert.ok(visible.includes(GROK_ATTRIBUTION_LINE));
 for(const path of ['README.md','LICENSE.md','ASSETS.md']){
  const text=readFileSync(path,'utf8').replaceAll('**','');assert.ok(text.includes(AI_CREATION_LINE),path);assert.ok(text.includes(AI_FINISH_LINE),path);
 }
 assert.doesNotMatch(visible,/当前绘本角色与场景由 OpenAI|部分历史鸭子.*Created with Grok/);
 for(const m of AI_MODELS)assert.equal(new URL(m.url).protocol,'https:');
});

test('照片统计与40项图鉴、最终选图台账一致，不把暂缺项算成实拍',()=>{
 const review=JSON.parse(readFileSync('assets/album/REVIEW.json','utf8'));
 assert.deepEqual(Object.keys(ALBUM_PHOTOS).sort(),ITEMS.map(i=>i.id).sort());
 assert.equal(PHOTO_SUMMARY.total,ITEMS.length);
 assert.equal(PHOTO_SUMMARY.available,Object.values(review).filter(p=>p.file).length);
 assert.equal(PHOTO_SUMMARY.available+PHOTO_SUMMARY.missing,PHOTO_SUMMARY.total);
 assert.equal(Object.values(PHOTO_SUMMARY.kinds).reduce((a,b)=>a+b,0),PHOTO_SUMMARY.available);
 for(const [id,p] of Object.entries(ALBUM_PHOTOS))if(p.file){
  for(const field of ['file','author','sourceUrl','license','licenseUrl','changes'])assert.equal(p[field],review[id][field],`${id}/${field}`);
 }
});

test('11个背景原始来源和24个随包照片文件都有对应声明，采用最终选图而非候选池',()=>{
 const final=readFileSync('assets/img/CREDITS.md','utf8').split(/\r?\n/).map(parseCreditLine).filter(c=>c?.id.startsWith('bg_'));
 assert.equal(BACKGROUND_CREDITS.length,final.length);
 for(const source of final){
  const visible=BACKGROUND_CREDITS.find(c=>c.id===source.id);assert.ok(visible,source.id);
  for(const field of ['author','sourceUrl','license'])assert.equal(visible[field],source[field],`${source.id}/${field}`);
  assert.ok(visible.licenseUrl.startsWith('https://creativecommons.org/licenses/'));
  for(const file of visible.files)assert.ok(existsSync(file),file);
 }
 const sbom=buildAssetSbom(),paths=sbom.assets.filter(a=>a.release_included&&a.category==='landmark_background').map(a=>a.local_path).sort();
 assert.deepEqual(BACKGROUND_CREDITS.flatMap(p=>p.files).sort(),paths);
 const categories=new Set(['item_photo','font','landmark_background','generated_image','generated_game_sprite','design_reference','synthesized_audio_source']);
 for(const asset of sbom.assets.filter(a=>a.release_included))assert.ok(categories.has(asset.category),`新素材类别需补版权说明：${asset.local_path}`);
 const page=CREDIT_SECTIONS.map(s=>s.title).join(' ');assert.match(page,/AI.*字体.*音乐与音效.*实景照片/s);
});
