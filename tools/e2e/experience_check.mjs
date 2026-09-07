import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {chromium} from 'playwright-core';
import {startStaticServer,browserExecutable} from './release_support.mjs';
const root=fileURLToPath(new URL('../..',import.meta.url)),shots=join(root,'tools/e2e/shots/experience');
mkdirSync(shots,{recursive:true});
const server=await startStaticServer({cwd:root,port:8144,probePath:'/',label:'体验回归'});
const browser=await chromium.launch({headless:true,executablePath:browserExecutable()});
const report=[];
async function open(page){
 await page.goto(server.base);await page.locator('[data-action="start"]').waitFor();
 await page.evaluate(async()=>{window.game=await import('/src/game.js');window.store=await import('/src/save.js');window.rules=await import('/src/rules.js');window.ui=await import('/src/dom-ui.js');window.cfg=await import('/src/config.js');window.G=game.G;window.pl=game.pl;});
 await page.evaluate(()=>document.fonts.ready);
}
async function outcome(page,clear=true){
 await page.evaluate(clear=>{
  Object.assign(store.save,rules.normalizeSave({tutorialCompleted:true,difficulty:'easy'}));game.startRun('adv',0);
  G.runMarks=40;G.skills=['weave','arch'];game.grantAlbumItem('duck');
  if(clear)game.levelClear();else{game.gameOver('full');for(let i=0;i<70;i++)game.update(1/60);}
  ui.renderDomUI();
 },clear);
 await page.locator('[data-action="reward:duck"]').waitFor();
}
try{
 for(const [name,width,height] of [['small',360,640],['portrait',390,844],['landscape',844,390],['desktop',1280,800]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:name!=='desktop',isMobile:name!=='desktop'});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const act=a=>p.locator(`[data-action="${a}"]`).click();
  await open(p);
  assert.equal(await p.locator('input[value="standard"]').isChecked(),true);
  assert.match(await p.locator('.run-goals').innerText(),/40.*2 枚/);
  const before=await p.locator('[data-action="start"]').boundingBox();
  assert.ok(before.y>=0&&before.y+before.height<=height,`${name}: start below first screen ${JSON.stringify(before)}`);
  await p.locator('input[value="easy"]').check();await p.locator('[data-action="start"]').filter({hasText:'轻松'}).waitFor();
  await p.screenshot({path:join(shots,name+'-home.png')});
  await p.locator('.run-goals summary').click();assert.match(await p.locator('.run-goals').innerText(),/瓮城折返.*换道/s);
  await act('levels');assert.equal(await p.locator('input[value="easy"]').isChecked(),true);
  assert.match(await p.locator('.bridge-progress').innerText(),/0／9.*0／15.*0／28/s);
  await act('earnStars');assert.equal(await p.locator('[data-action="level:0"]').evaluate(el=>document.activeElement===el),true);
  await act('missing');assert.equal(await p.locator('.item-tile').count(),34);await act('back');await act('back');
  await p.reload();await open(p);assert.equal(await p.locator('input[value="easy"]').isChecked(),true);
  await p.evaluate(()=>{store.save.tutorialCompleted=true;store.persist();});await act('start');
  assert.equal(await p.evaluate(()=>G.difficulty),'easy');assert.equal(await p.evaluate(()=>G.rescues),2);assert.equal(await p.evaluate(()=>G.speed),9);
  await act('pause');assert.match(await p.locator('.pause-dialog .run-goals').innerText(),/40/);
  await act('retry');assert.equal(await p.evaluate(()=>G.difficulty),'easy');
  for(const clear of [true,false]){
   await outcome(p,clear);await p.locator('[data-action="reward:duck"]').scrollIntoViewIfNeeded();
   const saved=await p.evaluate(()=>JSON.stringify(store.save)),stats=await p.evaluate(()=>[G.runMarks,G.runStars,G.lvIdx,G.state,G.newIds]);
   const scroll=await p.locator('#app-ui').evaluate(el=>el.scrollTop);
   await act('reward:duck');assert.equal(await p.locator('#app-ui h1').innerText(),'盐水鸭');
   assert.equal(await p.locator('[data-action="back"]').innerText(),'返回结算');
   await p.locator('[data-action="photo:duck"]:enabled').waitFor();await act('photo:duck');
   await p.keyboard.press('Escape');assert.equal(await p.locator('dialog[open]').count(),0);assert.equal(await p.evaluate(()=>G.state),'album');
   if(clear)await act('back');else await p.keyboard.press('Escape');
   await p.locator('[data-action="reward:duck"]').waitFor();
   assert.equal(await p.evaluate(()=>JSON.stringify(store.save)),saved);
   assert.deepEqual(await p.evaluate(()=>[G.runMarks,G.runStars,G.lvIdx,G.state,G.newIds]),stats);
   assert.ok(Math.abs(await p.locator('#app-ui').evaluate(el=>el.scrollTop)-scroll)<2);
   await p.screenshot({path:join(shots,name+(clear?'-clear':'-over')+'.png')});
   if(clear){await act('next');assert.equal(await p.evaluate(()=>G.lvIdx),1);assert.equal(await p.evaluate(()=>G.difficulty),'easy');assert.match(await p.locator('#run-cue').innerText(),/45.*2 枚/);}
   else{assert.match(await p.locator('.goal-list').innerText(),/未通关.*不计星/s);await act('retry');assert.equal(await p.evaluate(()=>G.lvIdx),0);}
  }
  await p.evaluate(()=>{store.save.cleared=Array(10).fill(true);game.startRun('adv',8);game.levelClear();ui.renderDomUI();});
  assert.match(await p.locator('.bridge-progress').innerText(),/前九关通关/);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);report.push({viewport:name,passed:true});await context.close();
 }
 // 录制实际 Canvas 动画，展示测试场景，不冒充完整真人通关。
 for(const kind of ['magnet','crash']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,recordVideo:{dir:shots,size:{width:390,height:844}}});
  const p=await context.newPage();await open(p);
  await p.evaluate(kind=>{
   store.save.tutorialCompleted=true;game.startRun('adv',1);G.obs=[];G.cols=[];G.powers=[];G.gates=[];
   if(kind==='magnet'){
    G.powerT.magnet=6;
    for(let row=0;row<8;row++)for(const lane of [-1,0,1])G.cols.push({x:lane*1.25,z:12+row*5,y:.55,kind:'egg',id:'egg',arc:row,arcN:3,got:false});
   }
  },kind);
  if(kind==='magnet'){
   await p.waitForTimeout(250);await p.screenshot({path:join(shots,'magnet-flight.png')});
   await p.keyboard.press('ArrowRight');await p.waitForTimeout(650);await p.keyboard.press('ArrowLeft');
   await p.waitForTimeout(350);await p.keyboard.press('ArrowLeft');await p.waitForTimeout(1200);
  }else{
   await p.waitForTimeout(300);await p.evaluate(()=>game.gameOver('full'));
   await p.waitForTimeout(200);await p.screenshot({path:join(shots,'crash-impact.png')});
   await p.waitForTimeout(350);await p.screenshot({path:join(shots,'crash-stars.png')});await p.waitForTimeout(700);
   await p.evaluate(()=>{store.save.stars=Array(10).fill(3);store.save.selectedSkin='gold';game.startRun('adv',1);G.obs=[];game.gameOver('full');});
   await p.waitForTimeout(550);await p.screenshot({path:join(shots,'crash-gold-stars.png')});await p.waitForTimeout(850);
  }
  const video=p.video();await context.close();renameSync(await video.path(),join(shots,kind+'-demo.webm'));
 }
 writeFileSync(join(shots,'report.json'),JSON.stringify({scope:'Local Chromium, real UI clicks and deterministic animation scenarios; no real-device or human playtest claim',report},null,2));
 console.log('PASS | 七项体验：四视口首页选择、目标、结算图鉴往返与存档；动画录像已生成');
}finally{await browser.close();await server.stop();}
