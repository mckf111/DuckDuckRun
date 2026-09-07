import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {chromium} from 'playwright-core';
import {startStaticServer,browserExecutable} from './release_support.mjs';
const root=fileURLToPath(new URL('../..',import.meta.url)),shots=join(root,'tools/e2e/shots/skill-scoring');
mkdirSync(shots,{recursive:true});
const server=await startStaticServer({cwd:root,port:8150,probePath:'/',label:'技巧计分与文案一致性'});
const browser=await chromium.launch({headless:true,executablePath:browserExecutable()});
try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(server.base);await p.locator('[data-action="start"]').waitFor();
 await p.evaluate(async()=>{window.game=await import('/src/game.js');window.core=await import('/src/core.js');window.store=await import('/src/save.js');window.rules=await import('/src/rules.js');window.ui=await import('/src/dom-ui.js');window.cfg=await import('/src/config.js');window.driver=await import('/tools/e2e/journey_driver.mjs');window.G=game.G;Object.assign(store.save,rules.normalizeSave({tutorialCompleted:true,cleared:Array(10).fill(true)}));});
 const act=a=>p.locator(`[data-action="${a}"]`).click();
 await act('levels');
 const comparison=[];
 for(let i=0;i<10;i++){
  const card=p.locator('.level-card').nth(i),expected=await card.locator('.skill-actions').allTextContents();
  const names=await card.locator('[data-skill]>strong').allTextContents();
  if(i===1){await card.locator('summary').click();await card.scrollIntoViewIfNeeded();await p.screenshot({path:join(shots,'lake-level-description.png')});}
  for(const variant of i===0?[0]:[0,1]){
   await p.evaluate(({i,variant})=>{
    for(let seed=1;seed<=100;seed++){core.setRandomSeed(seed);game.startRun('adv',i);if(i===0||G.plan.variant===variant)break;}
    game.pauseRun();ui.renderDomUI();
   },{i,variant});
   const actual=await p.locator('.pause-dialog .skill-actions').allTextContents();
   assert.deepEqual(actual,expected,`关卡${i+1}镜像${variant}动作描述必须逐字一致`);
   assert.deepEqual(await p.locator('.pause-dialog [data-skill]>strong').allTextContents(),names);
   const actualLanes=await p.locator('.pause-dialog .skill-lanes').allTextContents();
   const planLanes=await p.evaluate(()=>G.plan.skills.map(s=>cfg.EXPERIENCE_COPY.skillRoute+'：'+s.steps.map((step,j)=>`${j+1}. ${cfg.EXPERIENCE_COPY.lanes[step.lane+1]}道`).join(' → ')));
   assert.deepEqual(actualLanes,planLanes,`第${i+1}关本局车道顺序必须一致`);
   if(i>0)assert.equal(await p.evaluate(()=>G.plan.variant),variant);
   if(i===1&&variant===1){await p.locator('.pause-dialog summary').click();await p.screenshot({path:join(shots,'lake-pause-description.png')});}
   comparison.push({level:i+1,variant,names,actions:actual,lanes:actualLanes});
  }
  await act('quit');await act('levels');
 }
 // 将前段按游戏输入/物理推进到技巧开始，之后只照界面进度立即按方向键。
 await p.evaluate(()=>{
  store.save.difficulty='standard';core.setRandomSeed(1);game.startRun('adv',1);
  const skill=G.plan.skills[0],beat=G.plan.beats.find(b=>b.skill===skill.id);
  const actions=driver.journeyActions(G.plan,true).filter(a=>!skill.steps.some(s=>s.z===a.z));let at=0;
  while(G.state==='play'&&G.dist<beat.from){
   while(actions[at]&&G.dist>=actions[at].z-G.speed*(actions[at].lead||0)){
    const a=actions[at++];if(a.lane!==undefined){while(game.pl.lane<a.lane)game.onRight();while(game.pl.lane>a.lane)game.onLeft();}else game[a.action]();
   }
   game.update(1/60);
  }
 });
 const progress=[];
 for(let step=0;step<3;step++){
  const data=await p.evaluate(step=>({current:game.pl.lane,target:G.plan.skills[0].steps[step].lane}),step);
  for(let lane=data.current;lane!==data.target;lane+=Math.sign(data.target-lane))await p.keyboard.press(lane<data.target?'ArrowRight':'ArrowLeft');
  await p.waitForFunction(step=>(G.skillSteps[G.plan.skills[0].id]||0)>step||G.state!=='play'||G.skillFailed[G.plan.skills[0].id],step,{timeout:10000});
  const observed=await p.evaluate(()=>({dist:G.dist,done:G.skillSteps[G.plan.skills[0].id]||0,state:G.state,failed:!!G.skillFailed[G.plan.skills[0].id],earned:G.skills.length}));
  assert.equal(observed.state,'play');assert.equal(observed.failed,false);assert.equal(observed.done,step+1);progress.push(observed);
 }
 assert.match(await p.locator('#run-skills').innerText(),/1\/2/);
 assert.match(await p.locator('#run-cue').innerText(),/已获得.*一线湖光/);
 await p.screenshot({path:join(shots,'lake-first-skill-counted.png')});
 assert.deepEqual(errors,[]);
 writeFileSync(join(shots,'report.json'),JSON.stringify({comparison,reactiveInput:progress,scope:'Local Chromium, runtime progress and actual keyboard input; no physical phone claim'},null,2));
 console.log('PASS | 十关选关/暂停动作逐字一致、镜像车道正确；玄武湖按提示立即换道，0→1→2→3步并取得1/2印章');
}finally{await browser.close();await server.stop();}
