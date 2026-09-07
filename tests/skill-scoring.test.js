import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSave} from '../src/rules.js';
import {journeyActions,driveJourney} from '../tools/e2e/journey_driver.mjs';
global.window={devicePixelRatio:1,innerWidth:390,innerHeight:844};
global.document={getElementById:()=>({getContext:()=>({})})};
global.localStorage={getItem:()=>null,setItem:()=>{}};
const game=await import('../src/game.js'),core=await import('../src/core.js'),{save,flushSave}=await import('../src/save.js'),{bgmStop}=await import('../src/audio.js');
const {G,pl}=game;
const move=lane=>{while(pl.lane<lane)game.onRight();while(pl.lane>lane)game.onLeft();};
function prepare(index,difficulty='standard',seed=1){
 Object.assign(save,normalizeSave({tutorialCompleted:true,difficulty,cleared:Array(10).fill(true)}));
 core.setRandomSeed(seed);game.startRun('adv',index);
}

test('按实时提示立即换道：前两关第一项挑战均逐步记账，不撞回上一堵墙',()=>{
 try{for(const index of [0,1])for(const difficulty of ['standard','easy'])for(const fps of [30,60])for(const seed of [1,2]){
  prepare(index,difficulty,seed);const skill=G.plan.skills[0],beat=G.plan.beats.find(b=>b.skill===skill.id);
  const actions=journeyActions(G.plan,true).filter(a=>!skill.steps.some(s=>s.z===a.z));let at=0,frames=0,last=0;
  while(G.state==='play'&&!G.skills.includes(skill.id)&&frames++<5000){
   while(actions[at]&&G.dist>=actions[at].z-G.speed*(actions[at].lead||0)){
    const a=actions[at++];if(a.lane!==undefined)move(a.lane);else game[a.action]();
   }
   if(G.dist>=beat.from&&G.dist<beat.to){const next=skill.steps[G.skillSteps[skill.id]||0];if(next)move(next.lane);}
   game.update(1/fps);
   const done=G.skillSteps[skill.id]||0;
   if(done>last){assert.equal(done,last+1);assert.ok(G.dist>skill.steps[last].z+.45,'提示下一步时已离开上一堵墙碰撞窗口');last=done;}
   assert.equal(!!G.skillFailed[skill.id],false,`${index}/${difficulty}/${fps}/${seed}/${G.dist}`);
  }
  assert.equal(G.state,'play');assert.equal(G.skills.filter(id=>id===skill.id).length,1);assert.equal(last,3);
  assert.equal(G.rescues,difficulty==='easy'?2:0,'不靠保护绕过错误的提示时机');
 }}finally{bgmStop();flushSave();core.clearRandomSeed();}
});

test('已经提前站在目标车道，无需隐形的22米内二次换道',()=>{
 try{
  prepare(1);const step=G.plan.skills[0].steps[0],id=G.plan.skills[0].id;
  // 聚焦一个检查点，验证判定本身不依赖近期输入日志。
  G.dist=step.z-30;G.obs=[];G.cols=G.cols.filter(c=>c.kind==='skillStep'&&c.skillId===id);
  pl.lane=step.lane;pl.x=step.lane*1.25;G.actionLog=[];
  while(G.dist<step.z+1)game.update(1/60);
  assert.equal(G.skillSteps[id],1);assert.equal(!!G.skillFailed[id],false);
 }finally{bgmStop();flushSave();}
});

test('跳得更高但实际越过矮障碍，仍计为跳跃，不受菱形拾取高度框误伤',()=>{
 try{for(const difficulty of ['standard','easy'])for(const fps of [30,60]){
  prepare(2,difficulty);const first=G.plan.skills[0],actions=journeyActions(G.plan,true).filter(a=>!(a.action==='onJump'&&first.steps.some(s=>s.z===a.z)));
  for(const step of first.steps)actions.push({z:step.z,action:'onJump',lead:.60},{z:step.z,action:'onJump',lead:.27});
  actions.sort((a,b)=>(a.z-G.plan.speed*a.lead)-(b.z-G.plan.speed*b.lead));
  driveJourney(game,actions,fps);assert.equal(G.state,'clear');assert.equal(G.skills.includes(first.id),true);
  assert.equal(G.runStars,3);
 }}finally{bgmStop();flushSave();}
});

test('漏步、错误车道或动作不能拿印章，菱形不增加鸭蛋或铜钱',()=>{
 try{for(const mistake of ['none','lane','jump']){
  prepare(0);const skill=G.plan.skills[0],first=G.cols.find(c=>c.skillId===skill.id&&c.step===0);
  G.dist=first.z-2;G.obs=[];G.powers=[];G.cols=[first];G.actionLog=[];
  pl.lane=mistake==='lane'?0:first.lane;pl.x=pl.lane*1.25;
  if(mistake==='jump'){first.action='jump';pl.y=0;}
  if(mistake==='none')first.step=1;
  for(let f=0;f<30;f++)game.update(1/60);
  assert.equal(G.skills.length,0);assert.equal(G.skillFailed[skill.id],true);assert.equal(G.runMarks,0);assert.equal(save.coins,0);
 }}finally{bgmStop();flushSave();}
});
