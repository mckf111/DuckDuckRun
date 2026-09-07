import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {chromium,webkit} from 'playwright-core';
import {ITEMS} from '../../src/config.js';
import {ALBUM_PHOTOS} from '../../src/album-photos.js';
import {browserExecutable,startStaticServer} from './release_support.mjs';

const root=fileURLToPath(new URL('../..',import.meta.url)),dist=process.argv.includes('--dist');
const shots=join(root,'tools/e2e/shots/album-photos',dist?'dist':'source');mkdirSync(shots,{recursive:true});
const server=await startStaticServer({cwd:dist?join(root,'dist'):root,port:8142,probePath:'/',label:'图鉴照片回归'});
const localWebkit=join(root,'docs/browser-runtime/webkit-2336/Playwright.exe'),reports=[];
try{
 for(const [name,engine,width,height,mobile] of [['desktop',chromium,1280,800,false],['portrait',chromium,390,844,true],['small',chromium,360,640,true],['landscape',chromium,844,390,true],['webkit',webkit,390,844,true]]){
  const executablePath=engine===webkit?(process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH||(existsSync(localWebkit)?localWebkit:undefined)):browserExecutable();
  const browser=await engine.launch({headless:true,executablePath,timeout:20000});
  try{
   const p=await browser.newPage({viewport:{width,height},hasTouch:mobile,isMobile:mobile});
   const errors=[],photos=[],external=[];p.on('pageerror',e=>errors.push(e.message));
   p.on('request',r=>{if(/\/assets\/album\//.test(r.url()))photos.push(r.url());if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==server.base)external.push(r.url());});
   const act=a=>mobile?p.locator(`[data-action="${a}"]`).tap():p.locator(`[data-action="${a}"]`).click();
   await p.goto(server.base);await p.locator('[data-action="start"]').waitFor();
   await p.evaluate(async()=>{window.store=await import(new URL('src/save.js',document.baseURI));window.game=await import(new URL('src/game.js',document.baseURI));window.ui=await import(new URL('src/dom-ui.js',document.baseURI));window.config=await import(new URL('src/config.js',document.baseURI));});
   assert.equal(photos.length,0,'首页不请求图鉴照片');
   await act('start');await act('pause');assert.equal(photos.length,0,'局内不请求图鉴照片');await act('quit');await act('album');
   await act('category:creature');await act('item:hufengdie');assert.equal(await p.locator('.item-photo').count(),0);assert.equal(photos.length,0,'隐藏条目未获得前不得请求照片');
   await p.evaluate(()=>{store.save.album=Object.fromEntries(config.ITEMS.map(it=>[it.id,true]));ui.renderDomUI();});
   const open=async id=>{await p.evaluate(id=>{game.G.state='album';game.G.albumZoom=id;ui.renderDomUI();},id);};
   const ready=()=>p.waitForFunction(()=>{const img=document.querySelector('.item-photo img');return img?.complete&&img.naturalWidth>0&&!document.querySelector('.photo-open')?.disabled;});
   for(const item of ITEMS){
    await open(item.id);const photo=ALBUM_PHOTOS[item.id];
    if(!photo.file){assert.equal(await p.locator('.item-photo img').count(),0);assert.match(await p.locator('.photo-missing').textContent(),/照片暂缺/);continue;}
    await ready();assert.equal(await p.locator('.item-photo img').getAttribute('alt'),photo.caption);
    assert.equal(await p.locator('.item-photo').getAttribute('data-photo'),item.id);
    assert.ok((await p.locator('.photo-credit').textContent()).includes(photo.author));
    assert.equal(await p.locator('.item-photo a').evaluateAll(as=>as.every(a=>a.rel.includes('noreferrer')&&a.referrerPolicy==='no-referrer')),true);
    if(['duck','cloud','baochuan'].includes(item.id)){
     await act('photo:'+item.id);assert.equal(await p.locator('.photo-dialog').evaluate(d=>d.open),true);
     assert.equal(await p.locator('.photo-dialog img').getAttribute('alt'),photo.caption);
     await p.screenshot({path:join(shots,name+'-'+item.id+'-zoom.png')});
     if(item.id==='cloud')await p.keyboard.press('Escape');else await act('closePhoto');
     await p.waitForFunction(()=>!document.querySelector('.photo-dialog'));
    }
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,item.id+' 横向溢出');
   }
   // 一次真实网络失败后，通过重试按钮重新请求同源照片。
   let fail=true;const duckRoute=/\/assets\/album\/duck(?:\.[a-f0-9]+)?\.jpg(?:\?.*)?$/;
   await p.route(duckRoute,route=>fail?route.abort():route.continue());
   await open('duck');
   // 已看过的图片可能仍在解码缓存；独立查询串保证这里确实发生网络失败。
   await p.locator('.item-photo img').evaluate(img=>{const url=new URL(img.src);url.searchParams.set('fault','1');img.src=url.href;});
   await p.waitForFunction(()=>document.querySelector('[data-photo-status]')?.textContent.includes('无法加载'));
   assert.equal(await p.locator('.photo-open').isDisabled(),true);fail=false;await act('retryPhoto:duck');await ready();
   await act('photo:duck');assert.match(await p.locator('.photo-dialog img').getAttribute('src'),/retry=1/);await act('closePhoto');
   await p.unroute(duckRoute);
   // 旧条目请求延迟到新条目之后返回，不得覆盖新照片、标题或状态。
   await open('fans');await ready();let held,signal;const intercepted=new Promise(resolve=>signal=resolve);
   const slowRoute=/\/assets\/album\/duck(?:\.[a-f0-9]+)?\.jpg\?slow=1$/;
   await p.route(slowRoute,route=>{held=route;signal();});await open('duck');
   await p.locator('.item-photo img').evaluate(img=>{const url=new URL(img.src);url.searchParams.set('slow','1');img.src=url.href;});
   let timer;try{await Promise.race([intercepted,new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('延迟请求未触发')),10000))]);}finally{clearTimeout(timer);}
   await open('fans');await ready();await held.fulfill({status:200,contentType:'image/jpeg',body:readFileSync(join(root,ALBUM_PHOTOS.duck.file))});
   assert.equal(await p.locator('.item-photo').getAttribute('data-photo'),'fans');await p.unroute(slowRoute);
   await p.screenshot({path:join(shots,name+'-detail.png')});
   await act('back');await act('back');await act('credits');
   assert.equal(await p.locator('.photo-license').count(),Object.values(ALBUM_PHOTOS).filter(r=>r.file).length);
   const notice=await p.getByRole('link',{name:'完整照片署名',exact:true}).getAttribute('href');assert.equal((await p.request.get(notice)).status(),200);
   assert.deepEqual(external,[],'游玩和查阅图鉴不得请求第三方图片或服务');assert.deepEqual(errors,[]);
   reports.push({name,items:ITEMS.length,photos:Object.values(ALBUM_PHOTOS).filter(r=>r.file).length,passed:true});
   console.log('PASS | '+name+' 图鉴照片与失败路径');
  }finally{await browser.close();}
 }
 writeFileSync(join(shots,'report.json'),JSON.stringify({scope:'local automated Chromium/WebKit; physical iPhone pending',dist,reports},null,2));
 console.log('PASS | 40 条目、照片同源按需加载、隐藏保护、放大关闭、失败重试、过期请求隔离、署名与横竖屏');
}finally{await server.stop();}
