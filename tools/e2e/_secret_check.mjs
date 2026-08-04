global.window = { devicePixelRatio: 1, innerWidth: 960, innerHeight: 540 };
global.document = { getElementById: () => ({ getContext: () => ({}) }) };
global.localStorage = { _s:{}, getItem(k){ return this._s[k] ?? null; }, setItem(k,v){ this._s[k]=v; } };
const { G, startRun, spawnCluster } = await import('../../src/game.js');
const { save } = await import('../../src/save.js');
const { rnd } = await import('../../src/core.js');
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

let pass=0, fail=0;
function report(name, ok, detail){ console.log((ok?'PASS':'FAIL')+' | '+name+(ok?'':(detail?' | '+detail:''))); ok?pass++:fail++; }

function sampleLv(lvIdx, dist, n, afterStart){
  const seen = new Set();
  for(let k=0;k<n;k++){
    Math.random = mulberry32(9000 + k);
    startRun('adv', lvIdx);
    if(afterStart) afterStart();
    G.dist = dist; G.nextSpawn = dist + 40;
    for(let i=0;i<20;i++){ spawnCluster(G.nextSpawn); G.nextSpawn += rnd(16,24)+4; }
    for(const c of G.cols) seen.add(c.id);
  }
  return seen;
}
function resetSave(o){
  for(const k of Object.keys(save)) delete save[k];
  Object.assign(save, { stars:[0,0,0,0,0,0,0,0,0,0], cleared:[false,false,false,false,false,false,false,false,false,false], album:{}, distTotal:0, best:0 });
  Object.assign(save, o||{});
}

// 1. 状元豆: 25 星门槛
resetSave({ stars:[3,3,3,3,3,3,0,0,0,0] });
const s18 = sampleLv(0, 0, 30);
report('状元豆 18星不进池', !s18.has('zhuangyuan'));
resetSave({ stars:[3,3,3,3,3,3,3,3,3,3] });
const s30 = sampleLv(0, 0, 30);
report('状元豆 30星进池', s30.has('zhuangyuan'));

// 2. 紫峰大厦: 累计里程
resetSave({ distTotal: 5000 });
const s5k = sampleLv(0, 0, 30);
report('紫峰 5000m 不进池', !s5k.has('zifeng'));
resetSave({ distTotal: 10000 });
const s10k = sampleLv(0, 0, 30);
report('紫峰 10000m 进池', s10k.has('zifeng'));

// 3. 江豚: 通关第10站
resetSave({});
const sNo = sampleLv(0, 0, 30);
report('江豚 未通大桥不进池', !sNo.has('jiangtun'));
resetSave({ cleared:[true,true,true,true,true,true,true,true,true,true] });
const sB = sampleLv(0, 0, 30);
report('江豚 通大桥进池', sB.has('jiangtun'));

// 4. 虎凤蝶: 集齐生之灵
resetSave({ album:{ plum:true, sakura:true, leaf:true } });
const sPart = sampleLv(0, 0, 30);
report('虎凤蝶 生之灵未齐不进池', !sPart.has('hufengdie'));
resetSave({ album:{ plum:true, sakura:true, leaf:true, stone:true, guihua:true, baige:true, yinghuo:true } });
const sAll = sampleLv(0, 0, 30);
report('虎凤蝶 生之灵集齐进池', sAll.has('hufengdie'));

// 5. 白局/宝船: 局内标记(无尽模式,startRun 后设置)
resetSave({});
const sEnd = sampleLv(0, 3001, 40, ()=>{ G.secretUnlock.baochuan = true; });
report('宝船 无尽3000m+局内标记进池', sEnd.has('baochuan'));
const sEnd2 = sampleLv(0, 900, 40, ()=>{ G.secretUnlock.baiju = true; });
report('白局 局内标记进池(无尽)', sEnd2.has('baiju'));

console.log('\n== '+pass+' passed, '+fail+' failed ==');
