import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {chromium} from 'playwright-core';
import {startStaticServer,browserExecutable} from './release_support.mjs';
const root=fileURLToPath(new URL('../..',import.meta.url));
const evidence=join(root,'tools/e2e/shots/mobile');mkdirSync(evidence,{recursive:true});
const server=await startStaticServer({cwd:root,port:8123,probePath:'/',label:'手机回归'});
const browser=await chromium.launch({headless:true,executablePath:browserExecutable(),args:['--no-sandbox']});
const reports=[];
async function open(page){
 await page.goto(server.base);await page.locator('[data-action="start"]').waitFor();
 await page.evaluate(async()=>{window.game=await import('/src/game.js');window.core=await import('/src/core.js');window.store=await import('/src/save.js');window.rules=await import('/src/rules.js');window.G=game.G;window.pl=game.pl;});
}
const action=(p,a)=>p.locator(`[data-action="${a}"]`).click();
async function resetRun(p){await p.evaluate(()=>{Object.assign(store.save,rules.normalizeSave({tutorialCompleted:true}));game.startRun('adv',0);});await p.locator('[data-action="pause"]').waitFor();}
try{
 for(const [name,width,height] of [['portrait',390,844],['small',360,640],['landscape',844,390],['desktop',1280,800]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:name!=='desktop',isMobile:name!=='desktop',deviceScaleFactor:2,userAgent:'Mozilla/5.0 Mobile MicroMessenger/8.0 (local automated test)'});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error(name,e.stack)});
  await open(p);await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:join(evidence,name+'-home.png')});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'horizontal overflow');
  const sizes=await p.locator('.home button').evaluateAll(bs=>bs.map(b=>b.getBoundingClientRect().height));assert.ok(sizes.every(h=>h>=44));
  for(const tab of ['levels','album','shop','settings','credits']){
   await action(p,tab);assert.equal(await p.locator('#app-ui h1').count(),1);await p.screenshot({path:join(evidence,name+'-'+tab+'.png')});
   if(tab==='album'){
    await p.locator('.item-tile').first().click();await action(p,await p.locator('[data-action^="track:"]').getAttribute('data-action'));
    assert.ok(await p.evaluate(()=>store.save.trackedItem));await action(p,'back');
    await action(p,'category:creature');await p.locator('.item-tile').last().scrollIntoViewIfNeeded();
   }
   if(tab==='settings'){
    await p.getByLabel('动态效果',{exact:true}).selectOption('reduced');assert.equal(await p.evaluate(()=>store.save.motion),'reduced');
    await p.getByLabel('音乐音量',{exact:true}).fill('23');assert.equal(await p.evaluate(()=>store.save.volumes.music),.23);
    const download=p.waitForEvent('download');await action(p,'export');assert.match((await download).suggestedFilename(),/json$/);
    await p.locator('#save-file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schema:4,coins:432,stars:Array(10).fill(3),cleared:Array(10).fill(true)}))});
    await p.locator('[data-action="confirmImport"]').waitFor();assert.notEqual(await p.evaluate(()=>store.save.coins),432);
    await action(p,'confirmImport');assert.equal(await p.evaluate(()=>store.save.coins),432);
    await p.locator('#save-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});await p.waitForTimeout(100);assert.equal(await p.locator('[data-action="confirmImport"]').count(),0);
   }
   if(tab==='shop'){
    await p.evaluate(()=>{store.save.coins=1000;store.save.stars=Array(10).fill(3);});
    await action(p,'buy:0');assert.equal(await p.evaluate(()=>store.save.ups.magnet),1);assert.ok(await p.evaluate(()=>store.save.coins<1000));
    await action(p,'skin:gold');assert.equal(await p.evaluate(()=>store.save.selectedSkin),'gold');
    await p.evaluate(()=>{store.save.ups={magnet:3,gui:3,spawn:3};});await p.waitForTimeout(60);assert.equal(await p.locator('[data-action^="buy:"]').count(),0);
   }
   if(tab==='credits'){const url=await p.getByRole('link',{name:'游戏许可',exact:true}).getAttribute('href');assert.equal((await p.request.get(url)).status(),200);}
   await action(p,'back');
  }
  await resetRun(p);await p.screenshot({path:join(evidence,name+'-play.png')});
  await action(p,'pause');const dist=await p.evaluate(()=>G.dist);await p.waitForTimeout(120);assert.equal(await p.evaluate(()=>G.dist),dist);
  await action(p,'resume');assert.ok(await p.evaluate(()=>G.resumeIn>0));await p.waitForTimeout(120);assert.equal(await p.evaluate(()=>G.dist),dist);await action(p,'skipResume');
  // Actual held mouse pointer crosses threshold before release; one gesture = one action.
  const box=await p.locator('#cv').boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.7;
  await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+22,y);assert.equal(await p.evaluate(()=>pl.lane),1);await p.mouse.move(x-45,y);assert.equal(await p.evaluate(()=>pl.lane),1);await p.mouse.up();assert.equal(await p.evaluate(()=>pl.lane),1);
  // Cancel, secondary pointer and ambiguous diagonal cannot leak into a new gesture.
  await p.evaluate(()=>{pl.lane=0;const cv=document.querySelector('#cv');const ev=(t,id,x,y,primary=true)=>cv.dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:x,clientY:y,isPrimary:primary,bubbles:true}));ev('pointerdown',88,100,100);ev('pointermove',88,125,125);ev('pointermove',89,150,100,false);ev('pointercancel',88,125,125);ev('pointermove',88,150,100);});assert.equal(await p.evaluate(()=>pl.lane),0);
  await p.setViewportSize({width:height,height:width});await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>G.paused),true);const rotated=await p.evaluate(()=>G.dist);await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>G.dist),rotated);await action(p,'resume');await action(p,'skipResume');
  await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.waitForTimeout(50);assert.equal(await p.evaluate(()=>G.paused),true);
  // All classic destinations and endless retain a working shared HUD.
  await p.evaluate(async()=>{store.save.cleared=Array(10).fill(true);store.save.stars=Array(10).fill(3);store.save.album=Object.fromEntries((await import('/src/config.js')).ITEMS.filter(i=>!i.secret).map(i=>[i.id,true]));});
  for(let level=1;level<10;level++){await p.evaluate(i=>{game.startRun('adv',i);game.pauseRun();},level);assert.equal(await p.evaluate(()=>G.lvIdx),level);await p.waitForTimeout(30);assert.ok(await p.locator('#run-place').textContent());}
  await p.evaluate(()=>{game.startRun('endless',0);game.pauseRun();});assert.equal(await p.evaluate(()=>G.mode),'endless');
  // Long rewards scroll without trapping the next action.
  await p.evaluate(async()=>{game.startRun('adv',0);G.state='clear';G.runStars=3;G.runMarks=87;G.skills=['weave','arch'];G.newIds=(await import('/src/config.js')).ITEMS.map(i=>i.id);});
  await p.locator('[data-action="share"]').waitFor();await p.locator('[data-action="share"]').scrollIntoViewIfNeeded();await action(p,'share');await p.locator('#shareLayer').waitFor({state:'visible'});await p.screenshot({path:join(evidence,name+'-share.png')});
  assert.deepEqual(errors,[]);reports.push({profile:name,passed:true});await context.close();
 }
 const p=await browser.newPage({viewport:{width:390,height:844}});await open(p);
 // Tutorial uses real key events with deterministic physics advance to each lesson gate.
 await action(p,'start');
 for(const [step,key]of [[0,'ArrowLeft'],[1,'ArrowUp'],[2,'ArrowDown']]){
  await p.evaluate(()=>{G.dist=G.tutorial.targetZ-3;pl.y=0;pl.vy=0;pl.jumps=0;pl.sliding=0;});await p.keyboard.press(key);
  await p.evaluate(()=>{for(let i=0;i<50;i++)game.update(1/60);});assert.equal(await p.evaluate(()=>G.tutorial?.step??3),step+1);
 }
 assert.equal(await p.evaluate(()=>store.save.tutorialCompleted),true);
 // Disposal is idempotent; remount does not duplicate actions/listeners.
 await p.evaluate(async()=>{const app=await import('/src/main.js');app.disposeApp();app.disposeApp();app.startApp();app.startApp();game.startRun('adv',0);});await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>pl.lane),1);
 await p.close();
 const fallback=await browser.newPage();const failures=[];fallback.on('pageerror',e=>failures.push(e.message));
 await fallback.route('**/assets/game/*.webp',r=>r.abort());await open(fallback);await action(fallback,'start');assert.equal(await fallback.evaluate(()=>G.state),'play');assert.deepEqual(failures,[]);await fallback.close();
 const blocked=await browser.newPage();await blocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('blocked','QuotaExceededError');};});await open(blocked);await action(blocked,'start');await blocked.waitForFunction(()=>!!store.saveError);assert.ok((await blocked.locator('#run-notice').textContent()).length>0);await blocked.close();
 writeFileSync(join(evidence,'browser-report.json'),JSON.stringify({scope:'local Chromium automation; no real-device claim',reports},null,2));
 console.log('PASS | DOM four viewports; native gestures, pause, rotation, tutorial, save import/export, 10 destinations, share, fallback and lifecycle');
}finally{await browser.close();await server.stop();}
