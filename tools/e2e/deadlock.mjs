// 生成器死局搜索:beam search 复刻 game.js 物理/碰撞( endless 最高速 20 m/s )
// 用法: node tools/e2e/deadlock.mjs [种子数]
global.document = { getElementById: () => ({ getContext: () => ({}) }) };
global.localStorage = { getItem: () => null, setItem: () => {} };
const { G, spawnCluster, startRun } = await import('../../src/game.js');
const { rnd, LANEGAP } = await import('../../src/core.js');

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

const DT = 1/60, SPEED = 20;
// 与 game.js update() 完全一致的 endless 物理/碰撞步进
function step(st, obsInWindow){
  // obsInWindow: |o.z - dist|<0.45 的障碍(基于步进后的 dist)
  st.x = st.x + (st.lane*LANEGAP - st.x) * Math.min(1, DT*12);
  st.vy -= 18*DT; st.y += st.vy*DT;
  if(st.y <= 0){ st.y=0; st.vy=0; st.jumps=0; }
  st.sliding = Math.max(0, st.sliding - DT);
  for(const o of obsInWindow){
    if(Math.abs(o.x - st.x) < 0.55){
      const jumpClear = st.y > 0.72, slideClear = st.sliding > 0;
      if(o.type==='full' || (o.type==='low' && !jumpClear) || (o.type==='high' && !slideClear)) return false;
    }
  }
  return true;
}
const ACTS = [
  ['.', s=>{}],
  ['L', s=>{ if(s.lane>-1) s.lane--; }],
  ['R', s=>{ if(s.lane<1) s.lane++; }],
  ['J', s=>{ if(s.y<=0.01){ s.vy=6.4; s.jumps=1; } else if(s.jumps===1){ s.vy=5.6; s.jumps=2; } s.sliding=0; }],
  ['S', s=>{ if(s.y>0.01){ s.vy=Math.min(s.vy,-7); } s.sliding=0.75; }],
];

function trial(seed, worldLen, findWitness){
  Math.random = mulberry32(seed);
  startRun('endless', 0);
  G.dist = 3000; G.nextSpawn = 3030;
  while(G.nextSpawn < 3000+worldLen){ spawnCluster(G.nextSpawn); G.nextSpawn += rnd(16,24)*(9.5/SPEED)+4; }
  const obs = G.obs.map(o=>({x:o.x, z:o.z, type:o.type})).sort((a,b)=>a.z-b.z);
  if(!obs.length) return { ok:true, note:'no obs' };
  const maxZ = obs[obs.length-1].z;
  let dist = 3000;
  let beam = [{ lane:0, x:0, y:0, vy:0, sliding:0, jumps:0 }];
  let parents = findWitness ? [] : null; // 每层: [{state, pi, ai}]
  const CAP = 1200;
  let frames = 0;
  while(dist < maxZ + 5 && frames < 60*30){
    frames++; dist += SPEED*DT;
    // 本帧判定窗内障碍
    const win = obs.filter(o=>Math.abs(o.z-dist)<0.45);
    const layer = [];
    const next = [], seen = new Set();
    for(let i=0;i<beam.length;i++){
      const s = beam[i];
      for(let a=0;a<ACTS.length;a++){
        const c = { lane:s.lane, x:s.x, y:s.y, vy:s.vy, sliding:s.sliding, jumps:s.jumps };
        ACTS[a][1](c);
        if(!step(c, win)) continue;
        const k = c.lane+'|'+Math.round(c.x*10)+'|'+Math.round(c.y*10)+'|'+Math.round(c.vy*2)+'|'+Math.ceil(c.sliding*10)+'|'+c.jumps;
        if(seen.has(k)) continue;
        seen.add(k); next.push(c);
        if(parents) layer.push({ pi:i, ai:a });
        if(next.length>=CAP) break;
      }
      if(next.length>=CAP) break;
    }
    if(parents) parents.push(layer);
    beam = next;
    if(!beam.length){
      return { ok:false, seed, atDist: dist.toFixed(1), frames };
    }
  }
  return { ok:true, survivors: beam.length, frames, capped: beam.length>=CAP };
}

const N = +(process.argv[2]||30);
let fails = [];
const t0 = Date.now();
for(let seed=1; seed<=N; seed++){
  const r = trial(seed, 250, false);
  if(!r.ok){ fails.push(r); console.log('DEADLOCK seed='+seed+' 死在 dist='+r.atDist+' (帧 '+r.frames+')'); }
}
console.log('\n'+N+' 个种子 x 250m 最高速段: '+(N-fails.length)+' 有生还路径, '+fails.length+' 个团灭(死局). 耗时 '+((Date.now()-t0)/1000).toFixed(1)+'s');
if(fails.length){
  // 输出第一个死局种子在死亡点附近的障碍布局
  const seed = fails[0].seed;
  Math.random = mulberry32(seed);
  startRun('endless', 0);
  G.dist = 3000; G.nextSpawn = 3030;
  while(G.nextSpawn < 3250){ spawnCluster(G.nextSpawn); G.nextSpawn += rnd(16,24)*(9.5/SPEED)+4; }
  const d0 = +fails[0].atDist;
  console.log('\n死局附近 (dist≈'+d0+') 障碍布局:');
  for(const o of G.obs.filter(o=>o.z>d0-25 && o.z<d0+5).sort((a,b)=>a.z-b.z))
    console.log('  z='+(o.z-d0).toFixed(1).padStart(6)+' lane='+(''+o.lane).padStart(2)+' '+o.type);
}
