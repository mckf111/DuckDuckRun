global.window = { devicePixelRatio: 1, innerWidth: 960, innerHeight: 540 };
global.document = { getElementById: () => ({ getContext: () => ({}) }) };
global.localStorage = { _s:{}, getItem(k){ return this._s[k] ?? null; }, setItem(k,v){ this._s[k]=v; } };
const { G, startRun, spawnCluster } = await import('../../src/game.js');
const { rnd } = await import('../../src/core.js');
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
let fails = [];
for(let lvIdx = 0; lvIdx < 10; lvIdx++){
  Math.random = mulberry32(100 + lvIdx);
  startRun('adv', lvIdx);
  G.dist = 0; G.nextSpawn = 40;
  while(G.nextSpawn < 2000){ spawnCluster(G.nextSpawn); G.nextSpawn += rnd(16,24)*(9.5/G.speed)+4; }
  const obs = G.obs.slice();
  for(let z0 = 0; z0 < 2000; z0 += 8){
    const blocked = [-1,0,1].every(l => obs.some(o=>o.type==='full' && o.z >= z0 && o.z <= z0+8 && o.lane === l));
    if(blocked){ fails.push('lv'+lvIdx+' @'+z0+'m 三道全堵'); break; }
  }
  const n = obs.length;
  console.log('lv'+lvIdx, '障碍数:', n, '修饰器:', G.lvIdx, obs.filter(o=>o.type==='full').length, 'full');
}
console.log(fails.length ? 'FAIL: '+fails.join(';') : 'PASS: 10 关 2000m 无三道全堵');
