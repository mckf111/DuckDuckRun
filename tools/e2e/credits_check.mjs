import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {chromium} from 'playwright-core';
import {startStaticServer,browserExecutable} from './release_support.mjs';
import {AI_MODELS,AI_CREATION_LINE,AI_FINISH_LINE,BACKGROUND_CREDITS,PHOTO_SUMMARY} from '../../src/legal.js';
import {ITEMS} from '../../src/config.js';
import {ALBUM_PHOTOS} from '../../src/album-photos.js';
const root=fileURLToPath(new URL('../..',import.meta.url)),dist=process.argv.includes('--dist');
const shots=join(root,'tools/e2e/shots/credits',dist?'dist':'source');mkdirSync(shots,{recursive:true});
const server=await startStaticServer({cwd:dist?join(root,'dist'):root,port:8152,probePath:'/',label:'版权页核验'});
const browser=await chromium.launch({headless:true,executablePath:browserExecutable()});
const reports=[];
try{
 for(const [name,width,height] of [['small',360,640],['portrait',390,844],['landscape',844,390],['desktop',1280,800]]){
  const p=await browser.newPage({viewport:{width,height}}),requests=[],errors=[];
  p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
  await p.goto(server.base);await p.locator('[data-action="credits"]').waitFor();
  const save=await p.evaluate(()=>localStorage.getItem('jinling_run_v1'));
  await p.locator('[data-action="credits"]').click();
  const content=await p.locator('#app-ui').innerText();assert.ok(content.includes(AI_CREATION_LINE));assert.ok(content.includes(AI_FINISH_LINE));
  assert.match(content,/WebAudio/);assert.match(content,/系统字体/);
  assert.ok(content.includes(`${PHOTO_SUMMARY.available} 件附有照片`));
  for(const model of AI_MODELS){const link=p.getByRole('link',{name:model.name,exact:true});assert.equal(await link.getAttribute('href'),model.url);assert.match(await link.getAttribute('rel'),/noopener/);}
  const details=p.locator('#app-ui details');assert.equal(await details.count(),3);
  for(let i=0;i<3;i++)await details.nth(i).locator('summary').click();
  const ids=await p.locator('[data-credit-item]').evaluateAll(nodes=>nodes.map(n=>n.dataset.creditItem));assert.deepEqual(ids.sort(),ITEMS.map(i=>i.id).sort());
  for(const [id,photo] of Object.entries(ALBUM_PHOTOS)){
   const row=p.locator(`[data-credit-item="${id}"]`);
   if(photo.file){assert.ok((await row.innerText()).includes(photo.author));assert.equal(await row.getByRole('link',{name:'原始来源',exact:true}).getAttribute('href'),photo.sourceUrl);assert.equal(await row.getByRole('link',{name:photo.license,exact:true}).getAttribute('href'),photo.licenseUrl);assert.ok((await row.innerText()).includes(photo.changes));}
   else assert.match(await row.innerText(),/照片暂缺/);
  }
  for(const photo of BACKGROUND_CREDITS){const row=p.locator(`[data-credit-background="${photo.id}"]`);assert.ok((await row.innerText()).includes(photo.author));assert.equal(await row.getByRole('link',{name:'原始来源',exact:true}).getAttribute('href'),photo.sourceUrl);}
  for(const [label,word] of [['游戏许可','Kimi K3'],['完整照片署名','bg_zhonghua'],['字体许可原文','SIL OPEN FONT LICENSE']]){
   const href=await p.getByRole('link',{name:label,exact:true}).getAttribute('href'),response=await p.request.get(href);assert.equal(response.status(),200);assert.ok((await response.text()).includes(word));
  }
  assert.equal(requests.some(url=>url.includes('/assets/album/')),false,'版权页不预加载整套照片');
  assert.ok(requests.every(url=>url.startsWith(server.base)),'不主动请求外部服务');
  assert.equal(await p.evaluate(()=>localStorage.getItem('jinling_run_v1')),save);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  for(let i=0;i<3;i++)await details.nth(i).locator('summary').click();
  await p.locator('.settings-block').nth(1).scrollIntoViewIfNeeded();await p.screenshot({path:join(shots,name+'-ai-credit.png')});
  await p.locator('.settings-block').nth(3).scrollIntoViewIfNeeded();await p.screenshot({path:join(shots,name+'-audio-photo.png')});
  await p.locator('[data-action="back"]').click();await p.locator('[data-action="start"]').waitFor();
  assert.deepEqual(errors,[]);reports.push({viewport:name,passed:true});await p.close();
 }
 writeFileSync(join(shots,'report.json'),JSON.stringify({distribution:dist?JSON.parse(readFileSync(join(root,'dist/build-info.json'),'utf8')).buildId:'source',reports},null,2));
 console.log(`PASS | ${dist?'制品':'源码'}版权页：四视口，40项图鉴、11背景、模型与字体链接、许可文件及存档保持`);
}finally{await browser.close();await server.stop();}
