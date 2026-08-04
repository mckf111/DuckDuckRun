// 逻辑推演:mock 浏览器环境后直接 import 游戏模块,验证可疑 bug
// 用法: node tools/e2e/sim.mjs
global.window = { devicePixelRatio: 1, innerWidth: 960, innerHeight: 540 };
global.document = { getElementById: () => ({ getContext: () => ({}) }) };
global.localStorage = { _s:{}, getItem(k){ return this._s[k] ?? null; }, setItem(k,v){ this._s[k]=v; } };

const { G, pl, startRun, update, spawnCluster, onLeft, onRight, onJump, onSlide } = await import('../../src/game.js');
const { rnd } = await import('../../src/core.js');

// 可复现随机数
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

let pass=0, fail=0;
function report(name, ok, detail){ console.log((ok?'PASS':'FAIL')+' | '+name+(detail?' | '+detail:'')); ok?pass++:fail++; }

/* ---- T1: 高速+大 dt 碰撞穿透(无尽后段 speed=20, 一帧 50ms 步进 1.0 > 判定窗 0.9) ---- */
function testTunnel(){
  startRun('endless', 0);
  G.dist = 3000; G.nextSpawn = Infinity; G.nextGate = Infinity;
  G.obs.length = 0; G.cols.length = 0;
  // 障碍摆在窗口上沿之外一点点:rz = 3.46 (窗口 2.55~3.45)
  G.obs.push({ lane:0, x:0, z: G.dist + 0.46, type:'full' });
  pl.lane = 0; pl.x = 0; pl.y = 0; pl.vy = 0;
  update(0.05); // 50ms 一帧:dist += 20*0.05 = 1.0 -> rz 从 3.46 跳到 2.46, 穿过整个窗口
  return G.state === 'play' && !G.obs[0]?.hit; // 还活着且没标记命中 = 穿透
}
Math.random = mulberry32(1);
report('T1 高速不穿透: speed20 + dt0.05 扫掠判定生效(修复有效)', !testTunnel(), '穿透存在则 FAIL');

// 对照: 60fps 正常步进应当撞死
function testTunnelControl(){
  startRun('endless', 0);
  G.dist = 3000; G.nextSpawn = Infinity; G.nextGate = Infinity;
  G.obs.length = 0; G.cols.length = 0;
  G.obs.push({ lane:0, x:0, z: G.dist + 0.46, type:'full' });
  pl.lane = 0; pl.x = 0;
  update(1/60);
  return G.state === 'over';
}
Math.random = mulberry32(1);
report('T1b 对照: 同场景 60fps 应正常撞死', testTunnelControl());

/* ---- T2: 过终点线同帧不被撞死(终点线判定优先) ---- */
function testFinishLineDeath(){
  startRun('adv', 0); // len=520
  G.dist = 519.9; G.speed = 12; G.nextSpawn = Infinity; G.nextGate = Infinity;
  G.obs.length = 0; G.cols.length = 0;
  G.obs.push({ lane:0, x:0, z: G.dist + 0.2, type:'full' }); // 0.2m 前,本帧必撞
  pl.lane = 0; pl.x = 0;
  update(1/60); // dist 增加 0.2 -> 520.1 >= len, 先走碰撞则死
  return G.state === 'over'; // 过了 520m 却判负 = bug 仍在
}
Math.random = mulberry32(2);
report('T2 终点线优先: dist>=len 同帧不判负(修复有效)', !testFinishLineDeath());

/* ---- T3: 空中快降滑铲对 high 不免疫(贴地才算滑铲) ---- */
function testAirSlide(){
  startRun('adv', 0);
  G.nextSpawn = Infinity; G.nextGate = Infinity; G.obs.length = 0; G.cols.length = 0;
  pl.lane = 0; pl.x = 0;
  onJump(); // y 起来
  for(let i=0;i<20;i++) update(1/60); // 跳到约最高点 y≈1.1
  onSlide(); // 空中快降, sliding=0.75
  // 在 sliding 剩余且 y 仍 >0.9 时穿过 high 障碍
  G.obs.push({ lane:0, x:0, z: G.dist + 0.1, type:'high' });
  const yAt = pl.y;
  update(1/60);
  return { alive: G.state==='play', yAt: yAt.toFixed(2), sliding: pl.sliding.toFixed(2) };
}
Math.random = mulberry32(3);
const t3 = testAirSlide();
report('T3 空中快降不免疫 high: y='+t3.yAt+' 滑铲需贴地(修复有效)', !t3.alive, 'sliding='+t3.sliding);

/* ---- T4: 无解死局搜索(beam search, 无尽最高速段) ---- */
// 快照用手动浅深拷贝(structuredClone 每帧数千次,开销大到跑不完)
function snap(){
  return { G:{ t:G.t, dist:G.dist, speed:G.speed, state:G.state,
    obs:G.obs.map(o=>({...o})), cols:G.cols.map(c=>({...c})),
    parts:G.parts.map(p=>({...p})), gates:G.gates.map(g=>({...g})),
    nextSpawn:G.nextSpawn, nextGate:G.nextGate, mode:G.mode, lvIdx:G.lvIdx,
    items:G.items, newIds:G.newIds.slice(), paused:G.paused, shake:G.shake,
    egg:G.egg?{...G.egg}:null, slowmo:G.slowmo, combo:G.combo, comboT:G.comboT,
    shield:G.shield, powerT:{...G.powerT}, powers:G.powers.map(p=>({...p})),
    arcGot:{...G.arcGot}, killedBy:G.killedBy, newItem:G.newItem?{...G.newItem}:null,
    secretUnlock:{...G.secretUnlock}, msIdx:G.msIdx, lmCyc:G.lmCyc, tutStage:G.tutStage,
    albumScroll:G.albumScroll, albumZoom:G.albumZoom, albumFrom:G.albumFrom,
    newBest:G.newBest, kbSel:G.kbSel, kbActive:G.kbActive },
    pl:{ ...pl } };
}
function restore(s){
  const g = s.G;
  G.t=g.t; G.dist=g.dist; G.speed=g.speed; G.state=g.state;
  G.obs=g.obs; G.cols=g.cols; G.parts=g.parts; G.gates=g.gates;
  G.nextSpawn=g.nextSpawn; G.nextGate=g.nextGate; G.mode=g.mode; G.lvIdx=g.lvIdx;
  G.items=g.items; G.newIds=g.newIds; G.paused=g.paused; G.shake=g.shake;
  G.egg=g.egg; G.slowmo=g.slowmo; G.combo=g.combo; G.comboT=g.comboT;
  G.shield=g.shield; G.powerT=g.powerT; G.powers=g.powers;
  G.arcGot=g.arcGot; G.killedBy=g.killedBy; G.newItem=g.newItem;
  G.secretUnlock=g.secretUnlock; G.msIdx=g.msIdx; G.lmCyc=g.lmCyc; G.tutStage=g.tutStage;
  const p = s.pl; pl.lane=p.lane; pl.x=p.x; pl.y=p.y; pl.vy=p.vy; pl.sliding=p.sliding; pl.jumps=p.jumps;
}
function keyOf(){ return pl.lane+'|'+Math.round(pl.x*10)+'|'+Math.round(pl.y*10)+'|'+Math.round(pl.vy*2)+'|'+Math.ceil(pl.sliding*10)+'|'+pl.jumps; }

function beamTrial(seed, worldLen){
  Math.random = mulberry32(seed);
  startRun('endless', 0);
  G.dist = 3000;
  G.nextSpawn = 3030;
  while(G.nextSpawn < 3000 + worldLen){ spawnCluster(G.nextSpawn); G.nextSpawn += rnd(16,24)*(9.5/20)+4; }
  G.nextSpawn = Infinity; G.nextGate = Infinity; G.cols.length = 0;
  pl.lane = 0; pl.x = 0; pl.y = 0; pl.vy = 0; pl.sliding = 0; pl.jumps = 0;
  const maxZ = Math.max(...G.obs.map(o=>o.z));
  Math.random = ()=>0.99; // 步进期间屏蔽随机(环境粒子), 障碍世界已固定
  const ACTIONS = [null, onLeft, onRight, onJump, onSlide];
  const CAP = 500, DT = 1/60;              // 搜索宽度收敛(原 2500 在 Node 24 上分钟级跑不完)
  let beam = [snap()];
  let frames = 0;
  while(beam.length && G.dist < maxZ + 5 && frames < 60*20){
    frames++;
    const next = [], seen = new Set();
    for(const s of beam){
      for(const a of ACTIONS){
        restore(s); if(a) a(); update(DT);
        if(G.state !== 'play') continue;
        const k = keyOf(); if(seen.has(k)) continue;
        seen.add(k); next.push(snap());
        if(next.length >= CAP) break;
      }
      if(next.length >= CAP) break;
    }
    beam = next;
  }
  const survivors = beam.length;
  return { survivors, frames, capped: survivors>=CAP };
}
const t0 = Date.now();
let deadSeeds = [];
for(const seed of [11,22,33,44,55]){
  const r = beamTrial(seed, 250);
  console.log('  seed '+seed+': survivors='+r.survivors+' frames='+r.frames+(r.capped?' (CAP)':''));
  if(r.survivors===0) deadSeeds.push(seed);
}
report('T4 beam search: 5 个种子在最高速段均存在生还路径', deadSeeds.length===0, deadSeeds.length?('团灭种子: '+deadSeeds.join(',')):'耗时 '+((Date.now()-t0)/1000).toFixed(1)+'s');

/* ---- T5: 10 关各 2000m 生成,断言无「三车道全堵」簇(二期 §8 回归) ---- */
function spawnWorld(lvIdx, meters, seed){
  Math.random = mulberry32(seed);
  startRun('adv', lvIdx);
  G.dist = 0; G.nextSpawn = 40;
  while(G.nextSpawn < meters){ spawnCluster(G.nextSpawn); G.nextSpawn += rnd(16,24)*(9.5/G.speed)+4; }
  return G.obs.slice();
}
function hasFullBlock(obs, z0, z1, lane){
  return obs.some(o=>o.type==='full' && o.z >= z0 && o.z <= z1 && o.lane === lane);
}
let t5Fails = [];
for(let lvIdx = 0; lvIdx < 10; lvIdx++){
  const obs = spawnWorld(lvIdx, 2000, 100 + lvIdx);
  // 8m 窗口内三道全有 full = 必死簇
  for(let z0 = 0; z0 < 2000; z0 += 8){
    if([-1,0,1].every(l=>hasFullBlock(obs, z0, z0+8, l))){
      t5Fails.push('lv'+lvIdx+' @'+z0+'m 三道全堵'); break;
    }
  }
  // 单簇内免费道破坏检查(逐簇看:簇中心 z 前后 12m 内的 full 覆盖三道)
  const clusters = [...new Set(obs.map(o=>Math.round(o.z/20)*20))];
  for(const cz of clusters){
    if([-1,0,1].every(l=>obs.some(o=>o.type==='full' && Math.abs(o.z-cz)<=6 && o.lane===l))){
      t5Fails.push('lv'+lvIdx+' 簇@'+cz+'m 三道全堵'); break;
    }
  }
}
report('T5 十关 2000m: 无三车道全堵簇', t5Fails.length===0, t5Fails.slice(0,3).join(';')||'10 关通过');

console.log('\n== '+pass+' passed, '+fail+' failed ==');
