import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {chromium,webkit} from 'playwright-core';
import {startStaticServer,browserExecutable} from './release_support.mjs';

const root=fileURLToPath(new URL('../..',import.meta.url)),shots=join(root,'tools/e2e/shots/skin-stars');
mkdirSync(shots,{recursive:true});
const server=await startStaticServer({cwd:root,port:8140,probePath:'/',label:'换鸭回归'});
const reports=[];
const localWebkit=join(root,'docs/browser-runtime/webkit-2336/Playwright.exe');
try{
 for(const [name,engine,mobile] of [['desktop',chromium,false],['touch-chromium',chromium,true],['touch-webkit',webkit,true]]){
  const executablePath=engine===webkit?(process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH||(existsSync(localWebkit)?localWebkit:undefined)):browserExecutable();
  const browser=await engine.launch({headless:true,executablePath,timeout:20000});
  try{
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});
   const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   const act=action=>mobile?p.locator(`[data-action="${action}"]`).tap():p.locator(`[data-action="${action}"]`).click();
   await p.goto(server.base);await p.locator('[data-action="shop"]').waitFor();
   await p.evaluate(async()=>{window.store=await import('/src/save.js');window.rules=await import('/src/rules.js');window.game=await import('/src/game.js');window.ui=await import('/src/dom-ui.js');Object.assign(store.save,rules.normalizeSave({stars:[3,3,3,3,2],tutorialCompleted:true}));});
   await act('shop');assert.equal(await p.locator('[data-action="skin:gold"]').isDisabled(),true);
   assert.match(await p.locator('#skin-progress').textContent(),/14\/15/);
   await p.evaluate(()=>{rules.recordBestStars(store.save,4,3);ui.renderDomUI();});
   assert.equal(await p.locator('[data-action="skin:gold"]').isEnabled(),true);
   await p.locator('[data-action="skin:gold"]').scrollIntoViewIfNeeded();
   await p.evaluate(()=>{window.originalCard=document.querySelector('[data-action="skin:gold"]');window.oldScroll=document.querySelector('#app-ui').scrollTop;});
   for(const skin of ['gold','white','gold']){
    await act('skin:'+skin);
    assert.equal(await p.evaluate(()=>store.save.selectedSkin),skin);
    assert.equal(await p.locator(`[data-action="skin:${skin}"]`).getAttribute('aria-pressed'),'true');
    assert.match(await p.locator(`[data-action="skin:${skin}"]`).textContent(),/使用中/);
   }
   assert.equal(await p.evaluate(()=>window.originalCard===document.querySelector('[data-action="skin:gold"]')),true,'切换保留按钮节点');
   assert.ok(await p.evaluate(()=>Math.abs(oldScroll-document.querySelector('#app-ui').scrollTop)<2),'切换保留滚动位置');
   assert.notEqual(await p.evaluate(()=>document.activeElement.tagName),'H1','不得把焦点抢到标题');
   await p.screenshot({path:join(shots,name+'-shop.png')});
   await p.reload();await act('shop');assert.equal(await p.locator('[data-action="skin:gold"]').getAttribute('aria-pressed'),'true');
   await act('back');await p.waitForFunction(()=>document.querySelector('[data-duck]')?.dataset.paint==='gold:true');
   const goldHome=await p.locator('[data-duck]').evaluate(c=>c.toDataURL());
   await act('shop');await act('skin:white');await act('back');
   const whiteHome=await p.locator('[data-duck]').evaluate(c=>c.toDataURL());assert.notEqual(goldHome,whiteHome,'首页实际像素随皮肤改变');
   const pixels=await p.evaluate(async()=>{
    const {drawBookDuck}=await import('/src/art/book.js');const {skinAtlas}=await import('/src/art/skin.js');const {getSprite}=await import('/src/art/sprites.js');
    const src=getSprite('bookDuck'),gold=skinAtlas(src,true),again=skinAtlas(src,true);
    const c=document.createElement('canvas');c.width=400;c.height=400;const ctx=c.getContext('2d');
    // 即使 filter 赋值报错也必须能绘制金鸭。
    Object.defineProperty(ctx,'filter',{set(){throw new Error('unsupported filter');}});
    drawBookDuck(ctx,200,300,100,{t:1,gold:false});const a=ctx.getImageData(0,0,400,400).data;ctx.clearRect(0,0,400,400);drawBookDuck(ctx,200,300,100,{t:1,gold:true});const b=ctx.getImageData(0,0,400,400).data;
    let different=0,alphaSame=true;for(let i=0;i<a.length;i+=4){if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])different++;if(a[i+3]!==b[i+3])alphaSame=false;}
    return {different,alphaSame,cached:gold===again};
   });assert.ok(pixels.different>1000);assert.ok(pixels.alphaSame);assert.ok(pixels.cached);
   await act('levels');assert.match(await p.locator('#app-ui').textContent(),/通关总星数 15\/30/);assert.match(await p.locator('.level-card').first().textContent(),/历史最佳 ★★★/);
   await act('back');await act('shop');
   await p.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('blocked','QuotaExceededError');};});
   await act('skin:gold');assert.match(await p.locator('#skin-feedback').textContent(),/保存失败/);assert.equal(await p.locator('[data-action="skin:gold"]').getAttribute('aria-pressed'),'true');
   assert.deepEqual(errors,[]);reports.push({name,pixels,passed:true});await context.close();
  }finally{await browser.close();}
 }
 writeFileSync(join(shots,'report.json'),JSON.stringify({scope:'local Chromium and WebKit; physical iPhone check pending',reports},null,2));
 console.log('PASS | 星数解锁、真实触控切换、节点/滚动保持、首页像素、无滤镜金色图集、刷新保存与失败反馈');
}finally{await server.stop();}
