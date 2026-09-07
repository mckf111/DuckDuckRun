import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {chromium} from 'playwright-core';
import {startStaticServer,browserExecutable} from './release_support.mjs';
const root=fileURLToPath(new URL('../..',import.meta.url)),shots=join(root,'tools/e2e/shots/tutorial-skills');
mkdirSync(shots,{recursive:true});
const server=await startStaticServer({cwd:root,port:8148,probePath:'/',label:'教学失败与技巧说明'});
const browser=await chromium.launch({headless:true,executablePath:browserExecutable()});
const report=[];
async function open(p){
 await p.goto(server.base);await p.locator('[data-action="start"]').waitFor();
 await p.evaluate(async()=>{window.game=await import('/src/game.js');window.store=await import('/src/save.js');window.rules=await import('/src/rules.js');window.ui=await import('/src/dom-ui.js');window.cfg=await import('/src/config.js');window.G=game.G;});
}
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 // 按钮走浏览器原生点击；跑酷动作走触控滑动，分别覆盖两个输入面。
 const act=a=>p.locator(`[data-action="${a}"]`).click();
 const cdp=await context.newCDPSession(p);
 async function swipe(dx,dy){
  const box=await p.locator('#cv').boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.65;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }


 await open(p);await act('start');
 await p.locator('[data-action="practice"]').waitFor({timeout:10000});
 assert.match(await p.locator('#run-mode').innerText(),/新手练习/);
 assert.match(await p.locator('.pause-dialog').innerText(),/练习已暂停.*再试这个动作.*跳过练习/s);
 const stopped=await p.evaluate(()=>G.dist);await p.waitForTimeout(1000);assert.equal(await p.evaluate(()=>G.dist),stopped);
 await p.screenshot({path:join(shots,'after-first-wall.png')});
 await act('practice');await p.waitForFunction(()=>!G.resumeIn&&!G.paused);
 for(const [step,dx,dy] of [[0,-70,0],[1,0,-70],[2,0,70]]){
  await p.waitForFunction(step=>G.tutorial?.step===step&&G.tutorial.targetZ-G.dist<=3,step);
  await swipe(dx,dy);await p.waitForFunction(step=>!G.tutorial||G.tutorial.step>step,step);
 }
 assert.equal(await p.evaluate(()=>store.save.tutorialCompleted),true);
 assert.ok(await p.evaluate(()=>G.cols.length>50&&G.obs.length>5&&G.powers.length>0));
 await p.screenshot({path:join(shots,'after-tutorial-real-level.png')});
 await swipe(70,0);await p.waitForFunction(()=>G.state==='over',{},{timeout:10000});
 assert.equal(await p.evaluate(()=>G.tutorial),null);await p.screenshot({path:join(shots,'real-level-crash-result.png')});
 await act('quit');await p.waitForFunction(()=>G.state==='menu',{},{timeout:2000});await act('settings');await act('tutorial');
 await p.locator('[data-action="practice"]').waitFor({timeout:10000});await act('skipTutorial');
 assert.equal(await p.evaluate(()=>G.tutorial),null);assert.ok(await p.evaluate(()=>G.cols.length>50));
 await act('pause');await act('retry');assert.equal(await p.evaluate(()=>G.tutorial),null);
 await act('pause');await act('quit');await act('levels');
 for(let i=0;i<10;i++){
  const card=p.locator('.level-card').nth(i);await card.locator('summary').click();
  const expected=await p.evaluate(i=>cfg.buildJourneyPlan(i).skills.map(s=>s.name),i);
  const text=await card.locator('.skill-guide').innerText();
  assert.ok(expected.every(name=>text.includes(name)));assert.match(text,/金色菱形.*数字顺序/s);
  assert.match(text,/漏掉一步.*失败/s);await card.locator('summary').click();
 }
 await p.evaluate(()=>{store.save.cleared[0]=true;store.save.lastLevel=1;ui.renderDomUI();});
 await act('back');await p.locator('.run-goals summary').click();
 assert.match(await p.locator('.run-goals').innerText(),/玄武湖.*一线湖光.*荷风连跃/s);
 assert.doesNotMatch(await p.locator('.run-goals').innerText(),/瓮城折返/);
 await p.screenshot({path:join(shots,'lake-skill-instructions.png')});
 await act('start');await act('pause');await p.locator('.pause-dialog summary').click();
 assert.match(await p.locator('.pause-dialog .skill-actions').first().innerText(),/换道/);assert.match(await p.locator('.pause-dialog .skill-lanes').first().innerText(),/本局路线.*[左右]道/s);
 await p.screenshot({path:join(shots,'lake-live-route.png')});
 // 固定在实际第一枚标记前，检查编号标记与下一步提示的绘制。
 await p.evaluate(()=>{
  G.paused=false;G.resumeIn=0;G.dist=G.plan.skills[0].steps[0].z-8;
  G.obs=G.obs.filter(o=>o.z>G.dist);G.cols=G.cols.filter(c=>c.z>G.dist);G.t=20;
 });
 await p.locator('#run-cue').filter({hasText:'已完成 0/3 步'}).waitFor();
 await p.screenshot({path:join(shots,'numbered-skill-marker.png')});
 assert.deepEqual(errors,[]);report.push({scenario:'Fresh first-wall collision, explicit retry, real touch completion, formal crash, skip, ten-level guides',passed:true});
 await context.close();
 // 小屏与横屏仍能在首屏看到难度、目标与开跑按钮。
 for(const [width,height] of [[360,640],[844,390]]){
  const p=await browser.newPage({viewport:{width,height}});await open(p);
  const b=await p.locator('[data-action="start"]').boundingBox();assert.ok(b.y+b.height<=height);
  await p.screenshot({path:join(shots,`home-${width}.png`)});await p.close();
 }
 writeFileSync(join(shots,'report.json'),JSON.stringify({scope:'Local Chromium: touch swipes for gameplay and native clicks for buttons; no physical phone claim',report},null,2));
 console.log('PASS | 首墙失败停住、真实触控重试三步、正式关卡生成与结算、主动跳过、十关专属挑战说明');
}catch(error){for(const c of browser.contexts())for(const p of c.pages()){await p.screenshot({path:join(shots,'failure.png')});console.log(await p.evaluate(()=>({state:window.G?.state,paused:window.G?.paused,buttons:[...document.querySelectorAll('[data-action]')].map(b=>b.dataset.action)})));}throw error;}finally{await browser.close();await server.stop();}
