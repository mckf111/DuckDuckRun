import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSave} from '../src/rules.js';
import {LEVELS,buildJourneyPlan} from '../src/config.js';
global.window={devicePixelRatio:1,innerWidth:390,innerHeight:844};
global.document={getElementById:()=>({getContext:()=>({})})};
global.localStorage={getItem:()=>null,setItem:()=>{}};
const game=await import('../src/game.js'),{save,flushSave}=await import('../src/save.js'),{bgmStop}=await import('../src/audio.js');
const {G,pl}=game;
function prepare(difficulty='standard'){
 Object.assign(save,normalizeSave({difficulty}));G.tutorialSkipped=false;game.startRun('adv',0);
}
function advance(seconds,fps){for(let i=0;i<seconds*fps;i++)game.update(1/fps);}
function passStep(fps){
 const step=G.tutorial.step;let acted=false,frames=0;
 while(G.tutorial?.step===step&&!G.paused&&frames++<fps*15){
  if(!acted&&G.tutorial.targetZ-G.dist<=3){
   if(step===0)(pl.lane===-1?game.onRight:game.onLeft)();
   else if(step===1)game.onJump();else game.onSlide();acted=true;
  }
  game.update(1/fps);
 }
 assert.ok(frames<fps*15);assert.equal(G.paused,false);assert.notEqual(G.tutorial?.step,step);
}

test('新档每个教学动作撞击后明确暂停；反复重试不空跑，完成后生成正式关卡',()=>{
 try{for(const difficulty of ['standard','easy'])for(const fps of [30,60]){
  prepare(difficulty);
  for(let step=0;step<3;step++){
   assert.equal(G.tutorial.step,step);
   for(let retry=0;retry<2;retry++){
    advance(10,fps);assert.equal(G.paused,true);assert.equal(G.tutorial.retryPending,true);
    const dist=G.dist;advance(120,fps);assert.equal(G.dist,dist,'失败后不能继续空跑');
    game.resumeRun(true);assert.equal(G.paused,true,'必须先重建本步练习');
    game.retryCurrentTutorial();game.resumeRun(true);assert.equal(G.paused,false);
    assert.ok(G.obs.some(o=>o.tutorialStep===step&&!o.hit&&o.z>G.dist));
   }
   passStep(fps);
  }
  assert.equal(G.tutorial,null);assert.equal(save.tutorialCompleted,true);assert.equal(G.dist,100);
  assert.ok(G.cols.length>50);assert.ok(G.obs.length>5);assert.ok(G.powers.length>0);
  // 正式第一站发生致命碰撞后必须结算，不能返回教学或永远奔跑。
  while(pl.lane<0)game.onRight();while(pl.lane>0)game.onLeft();G.rescues=0;
  advance(8,fps);assert.equal(G.state,'over');assert.equal(G.tutorial,null);
 }}finally{bgmStop();flushSave();}
});

test('跳过练习立即进入有内容的第一站，同页重试保留选择且可以主动重练',()=>{
 try{
  prepare('easy');advance(10,60);assert.equal(G.paused,true);
  assert.equal(game.skipTutorial(),true);assert.equal(G.tutorial,null);assert.equal(G.paused,false);
  assert.equal(G.difficulty,'easy');assert.equal(G.rescues,2);assert.ok(G.cols.length>50);assert.equal(G.dist,100);
  assert.equal(save.tutorialCompleted,false,'主动跳过不伪造学会记录');
  game.startRun('adv',0);assert.equal(G.tutorial,null);
  game.startRun('adv',0,true);assert.equal(G.tutorial.step,0);
 }finally{G.tutorialSkipped=false;bgmStop();flushSave();}
});

test('十关有二十项专属挑战；玄武湖两项不会冒用到其它关卡',()=>{
 const all=LEVELS.flatMap((_,index)=>buildJourneyPlan(index).skills);
 assert.equal(all.length,20);assert.equal(new Set(all.map(s=>s.id)).size,20);assert.equal(new Set(all.map(s=>s.name)).size,20);
 assert.deepEqual(buildJourneyPlan(0).skills.map(s=>s.name),['瓮城折返','灯影穿门']);
 assert.deepEqual(buildJourneyPlan(1).skills.map(s=>s.name),['一线湖光','荷风连跃']);
 for(let index=1;index<10;index++){
  const a=buildJourneyPlan(index,0),b=buildJourneyPlan(index,1);
  assert.deepEqual(a.skills.map(s=>s.name),b.skills.map(s=>s.name));
  assert.ok(a.skills.flatMap(s=>s.steps).every((s,i)=>s.lane===-b.skills.flatMap(s=>s.steps)[i].lane));
 }
});

test('挑战提示展示实际下一步、进度、失败和成功，不提前显示印章到手',()=>{
 try{
  prepare();save.tutorialCompleted=true;game.startRun('adv',1);
  const skill=G.plan.skills[0];G.dist=skill.steps[0].z-G.speed;
  assert.match(game.benchmarkBeat().cue,/已完成 0\/3 步.*下一步/);
  assert.doesNotMatch(game.benchmarkBeat().cue,/已获得/);
  G.skillSteps[skill.id]=1;assert.match(game.benchmarkBeat().cue,/已完成 1\/3 步/);
  G.obs=[];G.cols=[{...skill.steps[1],kind:'skillStep',x:1.25*skill.steps[1].lane,y:.7,skillId:skill.id,step:1,steps:3}];
  G.dist=skill.steps[1].z+.6;pl.x=G.plan.safeLane*1.25;pl.lane=G.plan.safeLane;game.update(1/60);
  assert.equal(G.skillFailed[skill.id],true);assert.match(game.benchmarkBeat().cue,/本次未完成/);
  G.skills=[skill.id];assert.match(game.benchmarkBeat().cue,/已获得/);
 }finally{bgmStop();flushSave();}
});
