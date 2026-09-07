import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ITEMS} from '../src/config.js';

const root=fileURLToPath(new URL('..',import.meta.url));
const records=JSON.parse(readFileSync(join(root,'assets/album/REVIEW.json'),'utf8'));
assert.deepEqual(Object.keys(records).sort(),ITEMS.map(it=>it.id).sort(),'台账必须完整覆盖 40 件风物');
const labels={actual:'准确实拍',documentary:'现场纪实',reconstruction:'复原展示',related:'相关示意',missing:'照片暂缺'};
const catalog={};
const md=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ');
const credits=['# 照片来源与许可','',
 '本清单由 assets/album/REVIEW.json 生成。图鉴照片独立遵守下列许可；游戏本体保留权利的声明不覆盖这些照片。',
 'CC BY-SA 照片及本地处理后的版本继续按所列相同许可提供。摄影、人物和被摄作品等权利分别核验；此记录不表示作者、机构、演员或店铺为游戏背书。','',
 '## 当前图鉴照片',''];
const counts=Object.fromEntries(Object.keys(labels).map(k=>[k,0]));
const report=['# 全部 40 件风物照片核验','',
 '逐项检索、查看候选和原始许可；记录不等于公开发布批准。原始 API/下载证据保存在本地 docs/album-review，不进入网页制品。',
 '未找到照片表示本轮未找到准确且使用条件清楚的可用候选，不表示互联网上不存在照片。相关示意、纪实与复原不计入准确实拍。','',
 '| 风物 | 结果 | 图像说明或缺口 | 来源 |','|---|---|---|---|'];
for(const item of ITEMS){
 const r=records[item.id];assert.ok(labels[r.kind]);counts[r.kind]++;
 catalog[item.id]={file:r.file,kind:r.kind};
 if(r.file){
  assert.match(r.file,new RegExp('^assets/album/'+item.id+'\\.jpg$'));
  assert.equal(createHash('sha256').update(readFileSync(join(root,r.file))).digest('hex'),r.sha256,item.id+' 文件哈希');
  for(const key of ['sourceUrl','licenseUrl'])assert.equal(new URL(r[key]).protocol,'https:');
  for(const field of ['title','caption','author','license','licenseUrl','sourceUrl','width','height','changes']){
   assert.ok(r[field],item.id+' 缺少 '+field);catalog[item.id][field]=r[field];
  }
  credits.push(`### ${item.name} · ${labels[r.kind]}`,'',r.caption,'',
   `- 作品：${r.title}`,`- 作者：${r.author}`,`- 来源：[原始文件页](${r.sourceUrl})`,
   `- 许可：[${r.license}](${r.licenseUrl})`,`- 本地文件：${r.file}`,`- 处理：${r.changes}`,
   `- 原始文件版本：${r.sourceTimestamp}；Commons SHA-1 ${r.sourceSha1}`,
   `- 本地 SHA-256：${r.sha256}`,'');
 }
 report.push(`| ${item.name}${item.secret?'（隐藏）':''} | ${labels[r.kind]} | ${md(r.caption||r.reason)} | ${r.file?`[原始文件](${r.sourceUrl})`:r.additionalSources?.map(url=>`[查证来源](${url})`).join(' · ')||'见下方检索说明'} |`);
}
const summary=Object.entries(counts).map(([key,n])=>`${labels[key]} ${n}`).join('；');
report.splice(4,0,summary+'。','');
report.push('','## 逐项检索及取舍','');
for(const item of ITEMS){
 const r=records[item.id];
 report.push(`### ${item.name}`,'',`- 检索：${r.queries.join('；')}`,`- 核验：${r.visualReview||r.reason}`,
  ...(r.rejected?.length?[`- 排除：${r.rejected.join('；')}`]:[]),
  ...(r.additionalSources||[]).map(url=>`- 补充来源：[查看](${url})`),'');
}
credits.push('## 仍随包提供的历史背景素材','',
 '以下用于旧场景或照片后备；当前十站主视觉为绘本图像。其历史来源记录保留，未声明已补齐全部原始处理证据。','',
 ...readFileSync(join(root,'assets/img/CREDITS.md'),'utf8').split(/\r?\n/).filter(line=>line.startsWith('- `bg_')),'');

function output(path,text){
 const full=join(root,path),bytes=text.endsWith('\n')?text:text+'\n';
 if(process.argv.includes('--check'))assert.equal(readFileSync(full,'utf8').replaceAll('\r\n','\n'),bytes,path+' 与台账不同步');
 else writeFileSync(full,bytes);
}
output('src/album-photos.js','/* 由 tools/sync_album_catalog.mjs 从照片台账生成，请勿手改。 */\nexport const ALBUM_PHOTOS = '+JSON.stringify(catalog,null,2)+';\n');
output('assets/album/CREDITS.md',credits.join('\n'));
output('ALBUM-REVIEW.md',report.join('\n'));
const readme=readFileSync(join(root,'README.md'),'utf8').replaceAll('\r\n','\n');
const summaryBlock=/<!-- album-summary:start -->[\s\S]*?<!-- album-summary:end -->/;
assert.ok(summaryBlock.test(readme),'README 缺少照片统计同步标记');
output('README.md',readme.replace(summaryBlock,`<!-- album-summary:start -->\n全部 ${ITEMS.length} 件风物均有检索结论。当前采用 ${Object.values(records).filter(r=>r.file).length} 张：${summary}。\n<!-- album-summary:end -->`));
console.log('PASS | '+summary+'；图鉴、署名及 40 项核验报告同步');
