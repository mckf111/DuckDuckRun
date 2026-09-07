import test from 'node:test';import assert from 'node:assert/strict';import {mkdirSync,writeFileSync}from'node:fs';
import {journeyActions,driveJourney} from '../tools/e2e/journey_driver.mjs';
import {normalizeSave}from'../src/rules.js';import {JOURNEY_LEVELS,buildJourneyPlan}from'../src/config.js';
global.window={devicePixelRatio:1,innerWidth:960,innerHeight:540};global.document={getElementById:()=>({getContext:()=>({})})};global.localStorage={getItem:()=>null,setItem:()=>{}};
const game=await import('../src/game.js'),core=await import('../src/core.js'),{save}=await import('../src/save.js'),{bgmStop}=await import('../src/audio.js');const {G,pl}=game;
function prepare(index,seed,difficulty){Object.assign(save,normalizeSave({tutorialCompleted:true,difficulty,cleared:Array.from({length:10},(_,i)=>i===9),album:{jiangtun:true}}));core.setRandomSeed(seed);game.startRun('adv',index);}

test('九站的速度递进、动作间隔、压力恢复与镜像路线合同',()=>{
 for(let index=1;index<10;index++)for(let variant=0;variant<2;variant++){
  const p=buildJourneyPlan(index,variant),previous=buildJourneyPlan(index-1,variant);
  assert.ok(p.speed>previous.speed);assert.equal(p.beats.length,8);assert.equal(p.skills.length,2);
  assert.equal(new Set(p.skills.map(s=>s.id)).size,2);assert.ok(p.len/p.speed>=55&&p.len/p.speed<=75);
  for(let k=1;k<p.beats.length;k++)assert.equal(p.beats[k].from,p.beats[k-1].to);
  for(const beat of p.beats)if(beat.speedMul>1){
   assert.ok((beat.to-beat.from)/(p.speed*beat.speedMul)<=12);
   const next=p.beats[p.beats.indexOf(beat)+1];
   if(beat.to<p.len-p.speed*4)assert.ok(next.speedMul<1&&(next.to-next.from)/p.speed>=4);
  }
  assert.ok(p.skills.flatMap(s=>s.steps).every(s=>s.z<p.len&&s.lane!==p.safeLane));
  const minGap=index<3?1.8:index<6?1.5:1.3,points=[...new Set(p.basicSteps.map(s=>s.z))].sort((a,b)=>a-b);
  for(let j=1;j<points.length;j++)assert.ok((points[j]-points[j-1])/(p.speed*1.05)>=minGap-.05,`${index}: ${points[j-1]} to ${points[j]}`);
  for(const z of new Set(p.obstacles.map(o=>o.z)))assert.ok(p.obstacles.filter(o=>o.z===z&&o.type==='full').length<3);
 }
 assert.equal(JOURNEY_LEVELS.length,9);
});

test('九关两档各100种子、30/60FPS：基本路线两星与实际技巧三星',()=>{
 const evidence={runs:0,levels:{}};
 try{
  for(let index=1;index<10;index++)for(const difficulty of ['standard','easy'])for(const fps of [30,60])for(let seed=1;seed<=100;seed++)for(const skilled of [false,true]){
   prepare(index,seed,difficulty);const actions=journeyActions(G.plan,skilled),frames=driveJourney(game,actions,fps);
   const detail={index,seed,difficulty,fps,skilled,state:G.state,dist:G.dist,marks:G.runMarks,target:G.plan.collectTarget,stars:G.runStars,skills:G.skills,steps:G.skillSteps,failed:G.skillFailed};
   try{
    assert.ok(frames<10000);if(difficulty==='standard')assert.ok(frames/fps>=55&&frames/fps<=75);
    assert.equal(G.state,'clear');assert.ok(G.runMarks>=G.plan.collectTarget);assert.equal(G.skills.length,skilled?2:0);
    assert.equal(G.runStars,skilled?3:2);assert.equal(G.gatesPassed,6);
   }catch(error){mkdirSync('docs/mobile-upgrade',{recursive:true});writeFileSync('docs/mobile-upgrade/journey-failure.json',JSON.stringify({detail,actions},null,2));throw new Error(JSON.stringify(detail),{cause:error});}
   evidence.runs++;const key=String(index);evidence.levels[key]??={name:game.curLv().name,runs:0,minMarks:9999};
   evidence.levels[key].runs++;evidence.levels[key].minMarks=Math.min(evidence.levels[key].minMarks,G.runMarks);
  }
  mkdirSync('docs/mobile-upgrade',{recursive:true});writeFileSync('docs/mobile-upgrade/journey-simulation.json',JSON.stringify(evidence,null,2));
 }finally{bgmStop();core.clearRandomSeed();}
});


test('整段旅程无图鉴死锁：重复路线可开大桥，追踪到手即完成',()=>{
 try{
  Object.assign(save,normalizeSave({tutorialCompleted:true}));
  for(let pass=0;pass<5;pass++)for(let index=0;index<9;index++){
   core.setRandomSeed(pass*10+index);game.startRun('adv',index);driveJourney(game,journeyActions(G.plan),60);assert.equal(G.state,'clear');
  }
  assert.ok(save.cleared.slice(0,9).every(Boolean));
  game.startRun('adv',9);assert.equal(G.state,'play','桥的普通风物条件必须可达');driveJourney(game,journeyActions(G.plan),60);assert.equal(save.cleared[9],true);assert.equal(save.album.jiangtun,true);
  delete save.album.chengzhuan;save.trackedItem='chengzhuan';game.grantAlbumItem('chengzhuan');assert.equal(save.trackedItem,null);
 }finally{bgmStop();core.clearRandomSeed();}
});

 test('第二关起任意固定车道都不能通关，包括轻松模式救援',()=>{
 try{for(let index=1;index<10;index++)for(const difficulty of ['standard','easy'])for(let seed=1;seed<=2;seed++)for(const lane of [-1,0,1]){
  prepare(index,seed,difficulty);driveJourney(game,[{z:0,lane,lead:0}]);assert.equal(G.state,'crashing',`${index}/${difficulty}/${seed}/${lane}`);
 }}finally{bgmStop();core.clearRandomSeed();}
 });
