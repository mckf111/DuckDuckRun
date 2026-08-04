global.window = { devicePixelRatio: 1, innerWidth: 960, innerHeight: 540 };
global.document = { getElementById: () => ({ getContext: () => ({}) }) };
global.localStorage = { _s:{}, getItem(k){ return this._s[k] ?? null; }, setItem(k,v){ this._s[k]=v; } };
const { G, startRun, spawnCluster } = await import('../../src/game.js');
const { save } = await import('../../src/save.js');
const { rnd } = await import('../../src/core.js');
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
let pass=0, fail=0;
function report(name, ok){ console.log((ok?'PASS':'FAIL')+' | '+name); ok?pass++:fail++; }
function sampleLv(lvIdx, dist, n, afterStart, mode){
  const seen = new Set();
  for(let k=0;k<n;k++){
    Math.random = mulberry32(9000 + k);
    startRun(mode||'adv', lvIdx);
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
resetSave({ album:{ plum:true, sakura:true, leaf:true, stone:true, guihua:true, baige:true, yinghuo:true } });
const sAll = sampleLv(0, 0, 30);
report('虎凤蝶 生之灵常见件集齐进池', sAll.has('hufengdie'));
resetSave({});
const sEnd = sampleLv(0, 3001, 40, ()=>{ G.secretUnlock.baochuan = true; }, 'endless');
report('宝船 无尽3000m+局内标记进池(endless)', sEnd.has('baochuan'));
const sEndNo = sampleLv(0, 3001, 40, ()=>{}, 'endless');
report('宝船 无尽3000m但无局内标记不进池', !sEndNo.has('baochuan'));
console.log('\n== '+pass+' passed, '+fail+' failed ==');
