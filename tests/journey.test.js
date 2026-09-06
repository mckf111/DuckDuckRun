import test from 'node:test';import assert from 'node:assert/strict';import {mkdirSync,writeFileSync}from'node:fs';
import {normalizeSave}from'../src/rules.js';import {JOURNEY_LEVELS,buildJourneyPlan}from'../src/config.js';
global.window={devicePixelRatio:1,innerWidth:960,innerHeight:540};global.document={getElementById:()=>({getContext:()=>({})})};global.localStorage={getItem:()=>null,setItem:()=>{}};
const game=await import('../src/game.js'),core=await import('../src/core.js'),{save}=await import('../src/save.js'),{bgmStop}=await import('../src/audio.js');const {G,pl}=game;
function move(lane){while(pl.lane<lane)game.onRight();while(pl.lane>lane)game.onLeft();}
function route(plan,speed){const actions=[{z:0,lane:plan.safeLane}];for(const skill of plan.skills){for(const step of skill.steps){actions.push({z:step.z-speed*.95,lane:step.lane});if(step.action==='jump')actions.push({z:step.z-speed*.30,action:'onJump'});else if(step.action==='slide')actions.push({z:step.z-speed*.30,action:'onSlide'});else if(step.action==='double'){actions.push({z:step.z-speed*.60,action:'onJump'},{z:step.z-speed*.27,action:'onJump'});}}actions.push({z:skill.steps.at(-1).z+8,lane:plan.safeLane});}return actions.sort((a,b)=>a.z-b.z);}
function prepare(index,seed,difficulty){Object.assign(save,normalizeSave({tutorialCompleted:true,difficulty,cleared:Array.from({length:10},(_,i)=>i===9),album:{jiangtun:true}}));core.setRandomSeed(seed);game.startRun('adv',index);}
function run(actions,fps){let at=0,frames=0;while(G.state==='play'&&frames++<9000){while(actions[at]&&G.dist>=actions[at].z){const a=actions[at++];if(a.lane!==undefined)move(a.lane);else game[a.action]();}game.update(1/fps);}assert.ok(frames<9000);}
test('九站各自六段、两枚不同印章、55至80秒；镜像方向来自路线数据',()=>{for(let i=1;i<=9;i++)for(let v=0;v<2;v++){const p=buildJourneyPlan(i,v);assert.equal(p.beats.length,6);assert.equal(p.skills.length,2);assert.equal(new Set(p.skills.map(s=>s.id)).size,2);assert.ok(p.len/p.speed>=55&&p.len/p.speed<=80);for(let k=1;k<6;k++)assert.equal(p.beats[k].from,p.beats[k-1].to);assert.ok(p.skills.flatMap(s=>s.steps).every(s=>s.z<p.len&&s.lane!==p.safeLane));}assert.equal(JOURNEY_LEVELS.length,9);});
test('九关两档各100种子、30/60FPS：安全达标与实际技巧三星',()=>{
 const evidence={runs:0,levels:{}};
 try{
 for(let index=1;index<=9;index++)for(const difficulty of ['standard','easy'])for(const fps of [30,60])for(let seed=1;seed<=100;seed++)for(const skilled of [false,true]){
  prepare(index,seed,difficulty);const actions=skilled?route(G.plan,G.speed):[{z:0,lane:G.plan.safeLane}];run(actions,fps);
  const detail={index,seed,difficulty,fps,skilled,state:G.state,dist:G.dist,marks:G.runMarks,target:G.plan.collectTarget,stars:G.runStars,skills:G.skills,steps:G.skillSteps,failed:G.skillFailed};
  try{assert.equal(G.state,'clear');assert.ok(G.runMarks>=G.plan.collectTarget);assert.equal(G.skills.length,skilled?2:0);assert.equal(G.runStars,skilled?3:2);assert.equal(G.gatesPassed,6);}catch(error){mkdirSync('docs/mobile-upgrade',{recursive:true});writeFileSync('docs/mobile-upgrade/journey-failure.json',JSON.stringify({detail,actions},null,2));throw new Error(JSON.stringify(detail),{cause:error});}
  evidence.runs++;const key=String(index);evidence.levels[key]??={name:game.curLv().name,runs:0,minMarks:9999};evidence.levels[key].runs++;evidence.levels[key].minMarks=Math.min(evidence.levels[key].minMarks,G.runMarks);
 }
 mkdirSync('docs/mobile-upgrade',{recursive:true});writeFileSync('docs/mobile-upgrade/journey-simulation.json',JSON.stringify(evidence,null,2));
 }finally{bgmStop();core.clearRandomSeed();}
});

test('整段旅程无图鉴死锁：重复路线可开大桥，追踪到手即完成',()=>{
 try{
  Object.assign(save,normalizeSave({tutorialCompleted:true}));
  for(let pass=0;pass<5;pass++)for(let index=0;index<9;index++){
   core.setRandomSeed(pass*10+index);game.startRun('adv',index);run([{z:0,lane:G.plan.safeLane}],60);assert.equal(G.state,'clear');
  }
  assert.ok(save.cleared.slice(0,9).every(Boolean));
  game.startRun('adv',9);assert.equal(G.state,'play','桥的普通风物条件必须可达');run([{z:0,lane:G.plan.safeLane}],60);assert.equal(save.cleared[9],true);assert.equal(save.album.jiangtun,true);
  delete save.album.chengzhuan;save.trackedItem='chengzhuan';game.grantAlbumItem('chengzhuan');assert.equal(save.trackedItem,null);
 }finally{bgmStop();core.clearRandomSeed();}
});
