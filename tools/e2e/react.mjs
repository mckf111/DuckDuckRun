// 人类反应约束版:每 K 帧才允许改变操作(模拟 ~200ms 反应),看是否还能生还
global.document = { getElementById: () => ({ getContext: () => ({}) }) };
global.localStorage = { getItem: () => null, setItem: () => {} };
const { G, spawnCluster, startRun } = await import('../../src/game.js');
const { rnd, LANEGAP } = await import('../../src/core.js');
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const DT=1/60, SPEED=20, K=12; // K=12帧≈200ms 反应间隔
function step(st, win){
  st.x += (st.lane*LANEGAP - st.x)*Math.min(1,DT*12);
  st.vy -= 18*DT; st.y += st.vy*DT;
  if(st.y<=0){ st.y=0; st.vy=0; st.jumps=0; }
  st.sliding = Math.max(0, st.sliding-DT);
  for(const o of win){
    if(Math.abs(o.x-st.x)<0.55){
      const jc=st.y>0.72, sc=st.sliding>0;
      if(o.type==='full'||(o.type==='low'&&!jc)||(o.type==='high'&&!sc)) return false;
    }
  }
  return true;
}
const ACTS=[
  s=>{}, s=>{ if(s.lane>-1)s.lane--; }, s=>{ if(s.lane<1)s.lane++; },
  s=>{ if(s.y<=0.01){s.vy=6.4;s.jumps=1;} else if(s.jumps===1){s.vy=5.6;s.jumps=2;} s.sliding=0; },
  s=>{ if(s.y>0.01){s.vy=Math.min(s.vy,-7);} s.sliding=0.75; },
];
function trial(seed, worldLen){
  Math.random = mulberry32(seed);
  startRun('endless',0); G.dist=3000; G.nextSpawn=3030;
  while(G.nextSpawn<3000+worldLen){ spawnCluster(G.nextSpawn); G.nextSpawn += rnd(16,24)*(9.5/SPEED)+4; }
  const obs = G.obs.map(o=>({x:o.x,z:o.z,type:o.type})).sort((a,b)=>a.z-b.z);
  const maxZ = obs[obs.length-1].z;
  let dist=3000, beam=[{lane:0,x:0,y:0,vy:0,sliding:0,jumps:0,cd:0}];
  const CAP=1200; let frames=0, minW=1e9;
  while(dist<maxZ+5 && frames<60*30){
    frames++; dist += SPEED*DT;
    const win = obs.filter(o=>Math.abs(o.z-dist)<0.45);
    const next=[], seen=new Set();
    for(const s of beam){
      for(let a=0;a<ACTS.length;a++){
        if(a>0 && s.cd>0) continue; // 反应冷却中只能保持
        const c={...s}; ACTS[a](c);
        c.cd = a>0 ? K-1 : Math.max(0, c.cd-1);
        if(!step(c,win)) continue;
        const k=c.lane+'|'+Math.round(c.x*10)+'|'+Math.round(c.y*10)+'|'+Math.round(c.vy*2)+'|'+Math.ceil(c.sliding*10)+'|'+c.jumps+'|'+c.cd;
        if(seen.has(k)) continue; seen.add(k); next.push(c);
        if(next.length>=CAP) break;
      }
      if(next.length>=CAP) break;
    }
    beam=next;
    if(beam.length && beam.length<minW) minW=beam.length;
    if(!beam.length) return { ok:false, seed, at:(dist-3000).toFixed(0), frames };
  }
  return { ok:true, minW };
}
let fails=0, minWs=[];
const t0=Date.now();
for(let seed=1; seed<=60; seed++){
  const r=trial(seed,250);
  if(!r.ok){ fails++; if(fails<=5) console.log('人类反应团灭 seed='+seed+' 死在 '+(+r.at)+'m 处'); }
  else minWs.push(r.minW);
}
minWs.sort((a,b)=>a-b);
console.log('\n60 种子 x 250m @20m/s, 200ms 反应约束: 团灭 '+fails+' 次');
console.log('生还局的最窄生还状态数分布: min='+minWs[0]+' p25='+minWs[Math.floor(minWs.length*0.25)]+' 中位='+minWs[Math.floor(minWs.length/2)]+' (越小越接近必死)');
console.log('耗时 '+((Date.now()-t0)/1000).toFixed(1)+'s');
