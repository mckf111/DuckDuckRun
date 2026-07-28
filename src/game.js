import { clamp, lerp, rnd, irnd, proj, LANEGAP, ZP, DRAWD } from './core.js';
import { LEVELS, ITEMS } from './config.js';
import { save, persist } from './save.js';
import { sfx } from './audio.js';

/* ================= 游戏状态 ================= */
export const G = {
  state:'menu',      // menu | levels | play | over | clear | album
  mode:'adv',        // adv | endless
  lvIdx:0, paused:false, t:0,
  dist:0, speed:0, items:0, newIds:[],
  obs:[], cols:[], parts:[],
  nextSpawn:0, shake:0,
  buttons:[], albumFrom:'menu',
  egg:null,            // 彩蛋文案 { text, ttl, dur }
};
export const pl = { lane:0, x:0, y:0, vy:0, sliding:0, jumps:0 };

export function startRun(mode, lvIdx){
  G.mode = mode; G.lvIdx = lvIdx;
  G.dist = 0; G.items = 0; G.newIds = []; G.t = 0;
  G.obs = []; G.cols = []; G.parts = [];
  G.speed = mode==='adv' ? LEVELS[lvIdx].speed : 9.5;
  G.nextSpawn = 40; G.paused = false; G.shake = 0; G.egg = null;
  pl.lane = 0; pl.x = 0; pl.y = 0; pl.vy = 0; pl.sliding = 0; pl.jumps = 0;
  G.state = 'play';
}
export const curLv = ()=> G.mode==='adv' ? LEVELS[G.lvIdx] : LEVELS[Math.floor(G.dist/600)%5];

/* ---- 操作回调 ---- */
export function onLeft(){ if(G.state==='play'&&!G.paused){ if(pl.lane>-1){ pl.lane--; sfx.lane(); } } }
export function onRight(){ if(G.state==='play'&&!G.paused){ if(pl.lane<1){ pl.lane++; sfx.lane(); } } }
export function onJump(){
  if(G.state!=='play'||G.paused) return;
  if(pl.y<=0.01){ pl.vy = 6.4; pl.jumps = 1; sfx.jump(); }
  else if(pl.jumps===1){ pl.vy = 5.6; pl.jumps = 2; sfx.jump(); }
  pl.sliding = 0;
}
export function onSlide(){
  if(G.state!=='play'||G.paused) return;
  if(pl.y>0.01){ pl.vy = Math.min(pl.vy, -7); } // 空中快降
  pl.sliding = 0.75; sfx.slide();
}
export function onPauseKey(){
  if(G.state==='play'){ G.paused = !G.paused; sfx.click(); }
  else if(G.state==='album'){ G.state = G.albumFrom; sfx.click(); }
  else if(G.state==='levels'){ G.state='menu'; sfx.click(); }
}
export function onEnter(){
  if(G.state==='over'){ startRun(G.mode, G.lvIdx); }
  else if(G.state==='clear'){ nextAfterClear(); }
}

/* ---- 生成器:障碍簇 + 收集品引导线 ---- */
export function spawnCluster(z){
  const lv = curLv();
  const diff = G.mode==='endless' ? clamp(G.dist/2500,0,1) : 0.25 + G.lvIdx*0.15;
  const lanes = [-1,0,1].sort(()=>Math.random()-0.5);
  const nBlock = Math.random() < 0.35 + diff*0.45 ? 2 : 1; // 堵 1~2 条道
  const freeLane = lanes[nBlock];                          // 必定留出的道
  for(let i=0;i<nBlock;i++){
    const r = Math.random(); const w = lv.weight;
    const type = r < w.low ? 'low' : r < w.low + w.high ? 'high' : 'full';
    G.obs.push({ lane:lanes[i], x:lanes[i]*LANEGAP, z, type });
    // 难度高时同簇追加前后错位障碍
    if(diff > 0.5 && Math.random() < 0.3){
      const l2 = irnd(-1,1);
      if(l2 !== lanes[i]) G.obs.push({ lane:l2, x:l2*LANEGAP, z:z+rnd(6,9), type: Math.random()<0.5?'low':'high' });
    }
  }
  // 收集品弧线:免费道上 4~6 个,若相邻道有 low 障碍则从其上方越过
  const itemId = ITEMS[irnd(0,ITEMS.length-1)].id;
  const n = irnd(4,6), overLow = G.obs.some(o=>o.z===z && o.type==='low' && Math.abs(o.lane-freeLane)===1);
  for(let i=0;i<n;i++){
    const hump = overLow ? Math.sin((i+1)/(n+1)*Math.PI)*1.35 : 0;
    G.cols.push({ x:freeLane*LANEGAP, z:z-2+i*1.8, y:0.55+hump, id:itemId, got:false });
  }
}

/* ---- 粒子 ---- */
export function burst(x, y, color){
  for(let i=0;i<10;i++) G.parts.push({
    x, y, z:ZP, vx:rnd(-2,2), vy:rnd(1,4), life:rnd(0.4,0.8), color, size:rnd(2,5),
  });
}
export function ambient(lv){
  // 梅花瓣/灯火/星尘 环境粒子
  if(Math.random() > 0.25) return;
  const colors = { crenel:'#e8b04b', lotus:'#d98ba0', steps:'#ffffff', lantern:'#f0b64c', pine:'#c9a2ff' };
  G.parts.push({
    x:rnd(-6,6), y:rnd(2,5), z:rnd(4,30), vx:rnd(-0.5,0.1), vy:rnd(-0.8,-0.3),
    life:rnd(2,4), color:colors[lv.motif]||'#fff', size:rnd(1.5,3.5), ambient:true,
  });
}

/* ---- 主更新 ---- */
export function update(dt){
  G.t += dt;
  if(G.egg){ G.egg.ttl -= dt; if(G.egg.ttl<=0) G.egg = null; } // 彩蛋文案倒计时
  if(G.state!=='play' || G.paused) return;
  const lv = curLv();
  if(G.mode==='endless') G.speed = Math.min(20, 9.5 + G.dist/280);
  G.dist += G.speed * dt;
  G.shake = Math.max(0, G.shake - dt*3);

  // 生成
  while(G.nextSpawn < G.dist + DRAWD){
    spawnCluster(G.nextSpawn);
    G.nextSpawn += rnd(16,24) * (9.5/G.speed) + 4;
  }
  // 玩家物理
  pl.x = lerp(pl.x, pl.lane*LANEGAP, Math.min(1, dt*12));
  pl.vy -= 18*dt; pl.y += pl.vy*dt;
  if(pl.y<=0){ pl.y=0; pl.vy=0; pl.jumps=0; }
  pl.sliding = Math.max(0, pl.sliding - dt);

  // 障碍:更新相对深度 + 碰撞
  for(const o of G.obs){
    o.rz = o.z - G.dist + ZP;
    if(o.hit) continue;
    if(o.rz > ZP-0.45 && o.rz < ZP+0.45 && Math.abs(o.x - pl.x) < 0.55){
      const jumpClear = pl.y > 0.72;              // 跳起可通过 low
      const slideClear = pl.sliding > 0;          // 滑铲可通过 high
      const dead = o.type==='full' || (o.type==='low' && !jumpClear) || (o.type==='high' && !slideClear);
      if(dead){ o.hit = true; gameOver(); return; }
    }
  }
  G.obs = G.obs.filter(o=>o.rz > 1.2);
  // 收集品
  for(const c of G.cols){
    c.rz = c.z - G.dist + ZP;
    if(!c.got && c.rz > ZP-0.5 && c.rz < ZP+0.5 && Math.abs(c.x-pl.x)<0.6 && Math.abs(c.y-(pl.y+0.8))<0.95){
      c.got = true; G.items++; sfx.collect();
      const p = proj(c.x, c.y, ZP); burst(p.x, p.y, '#f0b64c');
      if(!save.album[c.id]){ save.album[c.id]=true; G.newIds.push(c.id); persist(); }
      // 鸭子主题彩蛋文案
      if(c.id==='fans') G.egg = { text:'……这碗里没有鸭,放心。', ttl:2.6, dur:2.6 };
      else if(c.id==='duck') G.egg = { text:'拒绝翻看。', ttl:2.6, dur:2.6 };
    }
  }
  G.cols = G.cols.filter(c=>!c.got && c.rz > 1.2);
  // 粒子
  ambient(lv);
  for(const p of G.parts){
    p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt;
    if(!p.ambient) p.vy -= 6*dt;
  }
  G.parts = G.parts.filter(p=>p.life>0);
  // 过关
  if(G.mode==='adv' && G.dist >= lv.len) levelClear();
}

export function gameOver(){
  sfx.hit(); G.shake = 1;
  if(G.mode==='endless'){
    const m = Math.floor(G.dist);
    if(m > save.best){ save.best = m; persist(); }
  }
  G.state = 'over';
}
export function levelClear(){
  sfx.clear();
  const need = [8,14,20]; let star = 0;
  for(let i=0;i<3;i++) if(G.items>=need[i]) star = i+1;
  if(star > save.stars[G.lvIdx]){ save.stars[G.lvIdx]=star; persist(); }
  else persist();
  G.state = 'clear';
}
export function nextAfterClear(){
  if(G.lvIdx < 4) startRun('adv', G.lvIdx+1);
  else G.state = 'menu';
}
