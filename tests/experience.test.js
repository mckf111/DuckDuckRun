import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSave,calculateMedals,getBridgeUnlockStatus} from '../src/rules.js';
import {ITEMS,EXPERIENCE} from '../src/config.js';
global.window={devicePixelRatio:1,innerWidth:960,innerHeight:540};
global.document={getElementById:()=>({getContext:()=>({})})};
global.localStorage={getItem:()=>null,setItem:()=>{}};
const game=await import('../src/game.js'),{save,flushSave}=await import('../src/save.js'),{bgmStop}=await import('../src/audio.js');
const {G,pl}=game;
function prepare(){
  Object.assign(save,normalizeSave({tutorialCompleted:true,cleared:Array(10).fill(true)}));
  game.startRun('adv',1);G.obs=[];G.cols=[];G.powers=[];G.gates=[];
}
const egg=(x,z,y=.55,extra={})=>({kind:'egg',id:'egg',x,z,y,got:false,arc:`${x}/${z}`,arcN:1,...extra});
function advance(seconds){for(let i=0;i<Math.round(seconds*60);i++)game.update(1/60);}

test('磁铁只吸近处普通蛋，原位置不变，换道飞行且暂停冻结',()=>{
  try{
    prepare();G.powerT.magnet=6;
    const near=egg(-1.25,12),far=egg(1.25,50),tutorial=egg(0,10,.55,{tutorialGoal:true}),skill=egg(1.25,8,1.6,{kind:'skillStep'}),relic=egg(0,9,.95,{kind:'relic',id:'duck'});
    G.cols=[near,far,tutorial,skill,relic];advance(.05);
    assert.ok(near.fly);for(const c of [far,tutorial,skill,relic])assert.equal(c.fly,undefined);
    assert.deepEqual([near.x,near.z,near.y],[-1.25,12,.55]);
    game.onRight();game.onJump();advance(.05);assert.ok(near.fly.x>near.x);
    game.pauseRun();const before=JSON.stringify(near.fly),dist=G.dist;advance(.5);
    assert.equal(JSON.stringify(near.fly),before);assert.equal(G.dist,dist);
    G.powerT.magnet=0;game.resumeRun(true);advance(.5);
    assert.equal(near.credited,true);assert.equal(G.runMarks,1);assert.equal(save.coins,1);
    assert.equal(far.x,1.25);assert.equal(far.fly,undefined);
  }finally{bgmStop();flushSave();}
});

test('吸附在低帧率到达、碰撞和通关时只入账一次，重开无残留',()=>{
  try{for(const finish of ['gameOver','levelClear']){
    prepare();G.powerT.magnet=6;G.cols=[egg(-1.25,14),egg(1.25,16)];advance(.05);
    assert.equal(G.cols.filter(c=>c.fly).length,2);game[finish]('full');
    assert.equal(G.runMarks,2);assert.equal(save.coins,2);const total=save.distTotal;
    game[finish]('full');assert.equal(save.coins,2);assert.equal(save.distTotal,total);
    game.startRun('adv',1);assert.equal(G.cols.some(c=>c.fly),false);
  }
  prepare();G.powerT.magnet=6;const c=egg(1.25,5);G.cols=[c];game.update(1/30);game.updateAttraction(1);
  assert.equal(c.credited,true);game.updateAttraction(1);assert.equal(save.coins,1);
  }finally{bgmStop();flushSave();}
});

test('撞击保留1.1秒表演，期间世界和重复奖励不前进',()=>{
  try{
    prepare();game.gameOver('full');const dist=G.dist,coins=save.coins;
    assert.equal(G.crashLen,1.1);advance(.6);assert.equal(G.state,'crashing');
    game.onRight();assert.equal(pl.lane,0);assert.equal(G.dist,dist);assert.equal(save.coins,coins);
    advance(.55);assert.equal(G.state,'over');
  }finally{bgmStop();flushSave();}
});

test('星数是当局通关加两项独立奖励，失败不覆盖最佳或累计拼星',()=>{
  try{
    assert.equal(calculateMedals(39,40,[]).stars,1);
    assert.equal(calculateMedals(40,40,[]).stars,2);
    assert.equal(calculateMedals(39,40,['a','b']).stars,2);
    assert.equal(calculateMedals(40,40,['a','b']).stars,3);
    assert.equal(calculateMedals(39,40,['a','a']).stars,1);
    prepare();G.runMarks=G.plan.collectTarget;game.levelClear();assert.equal(save.stars[1],2);
    game.startRun('adv',1);G.skills=['a','b'];game.levelClear();assert.equal(G.runStars,2);assert.equal(save.stars[1],2);
    game.startRun('adv',1);G.runMarks=999;G.skills=['a','b'];game.gameOver('full');assert.equal(save.stars[1],2);
  }finally{bgmStop();flushSave();}
});

test('大桥三项必须同时满足，普通风物不含隐藏且旧桥档保持开放',()=>{
  const ordinary=ITEMS.filter(i=>!i.secret).map(i=>i.id),secret=ITEMS.filter(i=>i.secret).map(i=>i.id);
  const candidate=normalizeSave({cleared:[true,true,true,true,true,true,true,true,true],stars:[3,3,3,3,3],album:Object.fromEntries(ordinary.slice(0,28).map(id=>[id,true]))});
  assert.equal(getBridgeUnlockStatus(candidate).unlocked,true);
  for(const change of [s=>s.cleared[8]=false,s=>s.stars[4]=2,s=>{delete s.album[ordinary[27]];for(const id of secret)s.album[id]=true;}]){
    const s=structuredClone(candidate);change(s);assert.equal(getBridgeUnlockStatus(s).unlocked,false);
  }
  assert.equal(getBridgeUnlockStatus(normalizeSave({cleared:Array(10).fill(true)})).unlocked,true);
});

test('速度按1.5秒过渡；轻松为九折且有两次救援',()=>{
 try{for(const difficulty of ['standard','easy']){
  prepare();save.difficulty=difficulty;game.startRun('adv',1);G.obs=[];G.cols=[];
  const base=EXPERIENCE.speeds[1]*(difficulty==='easy'?.9:1);
  assert.equal(G.rescues,difficulty==='easy'?2:0);assert.ok(Math.abs(G.speed-base*.95)<1e-8);
  G.dist=G.plan.beats[1].from;advance(.75);assert.ok(Math.abs(G.speed-base*.975)<.001);
  advance(.75);assert.ok(Math.abs(G.speed-base)<.001);
 }}finally{bgmStop();flushSave();}
});
