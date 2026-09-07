import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSave, parseSaveImport, calculateMedals } from '../src/rules.js';

test('schema 5 保留旧进度而不伪造技巧成绩；导入仅接受合法存档',()=>{
  const old={schema:4,best:3200,coins:99,stars:Array(10).fill(3),cleared:Array(10).fill(true),album:{duck:true},ups:{magnet:2,gui:1,spawn:3}};
  const next=normalizeSave(old);
  assert.equal(next.schema,5);assert.equal(next.best,3200);assert.equal(next.coins,99);
  assert.equal(next.stars[9],3);assert.deepEqual(next.medals.standard[0],{clear:false,collect:false,skill:false});
  assert.deepEqual(normalizeSave(next),next);
  assert.deepEqual(parseSaveImport(JSON.stringify({format:'jinling-save',data:old})),next);
  for(const value of ['{}','[]','null','bad','a'.repeat(65537),JSON.stringify({...old,schema:99})])assert.throws(()=>parseSaveImport(value));
  const dirty=normalizeSave({...old,selectedSkin:'script',trackedItem:'jiangtun',volumes:{music:NaN,effects:9,voice:-5},medals:{standard:[{clear:true}]}});
  assert.equal(dirty.trackedItem,null);assert.equal(dirty.selectedSkin,'white');assert.deepEqual(dirty.volumes,{music:.65,effects:1,voice:0});
  assert.equal(calculateMedals(200,40,[]).stars,2);assert.equal(calculateMedals(40,40,['a','a']).stars,2);
});

test('标杆两档 × 100 种子 × 30/60 FPS：安全通关、技巧三星、救援不能代替技巧',async()=>{
  global.window={devicePixelRatio:1,innerWidth:960,innerHeight:540};
  global.document={getElementById:()=>({getContext:()=>({})})};
  global.localStorage={getItem:()=>null,setItem:()=>{}};
  const game=await import('../src/game.js'),core=await import('../src/core.js'),{save}=await import('../src/save.js'),{bgmStop}=await import('../src/audio.js');
  const {G}=game;
  const safe=[[1,'onLeft']];
  const skilled=[[1,'onLeft'],[208,'onRight'],[210,'onRight'],[225,'onLeft'],[237,'onRight'],[252,'onLeft'],[254,'onLeft'],[406,'onRight'],[408,'onRight'],[422,'onJump'],[442,'onSlide'],[452,'onLeft'],[454,'onLeft']];
  const simulate=(actions,fps)=>{let at=0,frames=0;while(G.state==='play'&&frames++<6000){while(actions[at]&&G.dist>=actions[at][0])game[actions[at++][1]]();game.update(1/fps);}assert.ok(frames<6000);};
  save.tutorialCompleted=true;
  try{
    for(const fps of [30,60])for(const difficulty of ['standard','easy'])for(let seed=1;seed<=100;seed++)for(const route of [safe,skilled]){
      Object.assign(save,normalizeSave({tutorialCompleted:true,difficulty}));core.setRandomSeed(seed);game.startRun('adv',0);simulate(route,fps);
      assert.equal(G.state,'clear',`${fps}/${difficulty}/${seed}`);assert.ok(G.runMarks>=40);
      assert.equal(G.runStars,route===safe?2:3);assert.equal(G.skills.length,route===safe?0:2);
    }
    game.startRun('adv',0);simulate(skilled.filter(x=>x[1]!=='onJump'),60);
    assert.equal(G.state,'clear');assert.equal(G.skills.includes('arch'),false);
    game.startRun('adv',0);game.update(.016);game.pauseRun();const dist=G.dist;
    game.resumeRun();game.onRight();game.update(1);assert.equal(G.dist,dist);game.resumeRun(true);game.update(.016);assert.ok(G.dist>dist);
    core.setRandomSeed(1);game.startRun('slice',0);G.dist=260;assert.match(game.currentSliceCue().cue,/右跳.*左侧/);
    core.setViewportSize(390,844);const before=G.dist;assert.equal(core.viewport.portrait,true);const portrait=core.proj(0,0,3);
    core.setViewportSize(844,390);assert.equal(G.dist,before);assert.equal(core.viewport.portrait,false);assert.notEqual(core.proj(0,0,3).y,portrait.y);
  }finally{bgmStop();core.clearRandomSeed();}
});
