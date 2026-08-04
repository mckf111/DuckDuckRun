import { clamp, lerp, rnd, irnd, proj, LANEGAP, ZP, DRAWD, TAU } from './core.js';
import { LEVELS, ITEMS, LM_CYCLE, LM_NAME, MILESTONES } from './config.js';
import { save, persist } from './save.js';
import { sfx, bgm } from './audio.js';
import { track } from './track.js';

/* ================= 游戏状态 ================= */
export const G = {
  state:'menu',      // menu | levels | play | over | clear | album
  mode:'adv',        // adv | endless
  lvIdx:0, paused:false, t:0,
  dist:0, speed:0, items:0, newIds:[],
  obs:[], cols:[], parts:[], gates:[],
  nextSpawn:0, nextGate:0, shake:0,
  buttons:[], albumFrom:'menu', slowmo:0, wipe:0, pressed:null,
  albumZoom:null,    // 图鉴放大查看的风物 id(纯 UI 状态)
  egg:null,            // 彩蛋文案 { text, ttl, dur }
  newBest:false,       // 本局是否破了无尽纪录(结算页展示)
  kbSel:0, kbActive:false, // 菜单键盘导航焦点
  combo:0, comboT:0,   // 连击与剩余窗口
  tut:null,            // 首局教学飘字 [{z,text}]
  tutStage:0,          // 教学簇进度:0=整墙 1=矮墩 2=高门 3=结束
  arcGot:{},           // 每弧线已收计数(一串全收判定)
  killedBy:null,       // 致死障碍类型(结算页死因提示)
  newItem:null,        // 新图鉴即时横幅 { id, ttl }
  msIdx:0, lmCyc:-1,   // 无尽:里程碑进度 / 报站周期
};
export const pl = { lane:0, x:0, y:0, vy:0, sliding:0, jumps:0 };

export function startRun(mode, lvIdx){
  G.mode = mode; G.lvIdx = lvIdx;
  G.dist = 0; G.items = 0; G.newIds = []; G.t = 0;
  G.obs = []; G.cols = []; G.parts = []; G.gates = [];
  G.speed = mode==='adv' ? LEVELS[lvIdx].speed : 9.5;
  G.nextSpawn = 40; G.paused = false; G.shake = 0; G.egg = null;
  G.slowmo = 0; G.newBest = false; G.kbSel = 0; G.kbActive = false;
  G.combo = 0; G.comboT = 0; G.killedBy = null; G.newItem = null;
  G.msIdx = 0; G.lmCyc = -1; G.arcGot = {};
  // 首局教学(仅冒险第一关、第一次):前几簇按教案出障碍,飘字按设备出文案
  // 教学完成标记改为「首次跨过第一个障碍后」再落盘,秒退者不丢教学
  G.tut = null;
  if(mode==='adv' && lvIdx===0 && !save.tut){
    const touch = 'ontouchstart' in window;
    G.tut = [{ z:138, text: touch?'空中再上滑 = 二段跳':'空中再按 ↑ = 二段跳' }];
    G.tutStage = 0;
  } else G.tutStage = 3;
  G.nextGate = mode==='adv' ? 130 : 200;
  pl.lane = 0; pl.x = 0; pl.y = 0; pl.vy = 0; pl.sliding = 0; pl.jumps = 0;
  G.state = 'play';
  bgm(LEVELS[lvIdx].motif);
  track('start', { mode, lv:lvIdx });
}
export const curLv = ()=> G.mode==='adv' ? LEVELS[G.lvIdx] : LEVELS[Math.floor(G.dist/600)%LEVELS.length];

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
  else if(G.state==='album'){
    if(G.albumZoom) G.albumZoom = null;        // 放大查看时 Esc 先关放大层
    else G.state = G.albumFrom;
    sfx.click();
  }
  else if(G.state==='levels' || G.state==='over' || G.state==='clear'){ G.state='menu'; sfx.click(); }
}
export function onEnter(){
  if(G.state==='over'){ startRun(G.mode, G.lvIdx); }
  else if(G.state==='clear'){ nextAfterClear(); }
}

/* ---- 生成器:障碍簇 + 收集品引导线 ---- */
/* 教学簇:首关前几簇按教案出障碍(整墙→矮墩→高门),配对应飘字,保证新手每个机制都遇到 */
function spawnTutorial(z){
  const touch = 'ontouchstart' in window;
  const type = ['full','low','high'][G.tutStage]; G.tutStage++;
  const tip = type==='full' ? (touch?'整墙:左右滑换道!':'整墙:← → 换道!')
            : type==='low'  ? (touch?'上滑跳过矮墩':'↑ 跳过矮墩')
            : (touch?'下滑滑铲钻高门':'↓ 滑铲钻高门');
  G.tut.push({ z: z-14, text: tip });
  G.obs.push({ lane:0, x:0, z, type });
  if(type==='full'){
    // 整墙堵死玩家道:邻道随机一个障碍,逃生道留给弧线(避免免费道被墙封的教学死局)
    const freeLane = Math.random()<0.5 ? -1 : 1;
    G.obs.push({ lane:-freeLane, x:-freeLane*LANEGAP, z, type: Math.random()<0.5?'low':'high' });
    spawnArc(z, freeLane);
  } else spawnArc(z, 0);   // 跳/铲教学:障碍在玩家道,弧线同路引导动作
}
/* 收集品弧线:免费道上 4~6 个(玄武湖 longArc 修饰器加长到 5~7),若相邻道有 low 障碍则从其上方越过。
   栖霞山 arcDrift:弧线横向摆动,蛇形飘移 */
function spawnArc(z, freeLane){
  // 风物与关卡绑定:主场风物 3 倍权重;稀有款仅主场关或无尽 800m 后掉落
  const lvNow = G.mode==='adv' ? G.lvIdx : -1;
  const pool = [];
  for(const it of ITEMS){
    if(it.rare && !(it.home===lvNow || (G.mode==='endless' && G.dist>800))) continue;
    const w = it.home===lvNow ? 3 : 1;
    for(let k=0;k<w;k++) pool.push(it.id);
  }
  const itemId = pool[irnd(0,pool.length-1)];
  const mod = G.mode==='adv' ? LEVELS[G.lvIdx].mod : (LEVELS[Math.floor(G.dist/600)%LEVELS.length].mod||'');
  const n = irnd(4,6) + (mod==='longArc' ? 1 : 0);
  const drift = mod==='arcDrift';
  const overLow = G.obs.some(o=>o.z===z && o.type==='low' && Math.abs(o.lane-freeLane)===1);
  for(let i=0;i<n;i++){
    const hump = overLow ? Math.sin((i+1)/(n+1)*Math.PI)*1.35 : 0;
    const sway = drift ? Math.sin(i*0.9)*0.35 : 0;
    G.cols.push({ x:freeLane*LANEGAP+sway, z:z-2+i*1.8, y:0.55+hump, id:itemId, got:false, arc:z, arcN:n });
  }
}
export function spawnCluster(z){
  const lv = curLv();
  const diff = G.mode==='endless' ? clamp(G.dist/2500,0,1) : 0.25 + G.lvIdx*0.15;
  if(G.tutStage < 3){ spawnTutorial(z); return; }
  const lanes = [-1,0,1];
  for(let i=lanes.length-1;i>0;i--){ const j=irnd(0,i), t=lanes[i]; lanes[i]=lanes[j]; lanes[j]=t; } // L3:Fisher-Yates 均匀洗牌
  /* ---- 关内修饰器(二期 §C3):明城墙瓮城双墙,强制折返 ---- */
  if(lv.mod==='wallPair' && diff > 0.3 && Math.random() < 0.15){
    G.obs.push({ lane:lanes[0], x:lanes[0]*LANEGAP, z, type:'full' });
    G.obs.push({ lane:lanes[1], x:lanes[1]*LANEGAP, z:z+6, type:'full' });
    spawnArc(z, lanes[2]);
    return;
  }
  /* 中山陵台阶节奏:12% 同道连续 3 个 low,间距 4m(跳跳跳) */
  if(lv.mod==='stepRhythm' && Math.random() < 0.12){
    for(let k=0;k<3;k++) G.obs.push({ lane:lanes[0], x:lanes[0]*LANEGAP, z:z+k*4, type:'low' });
    spawnArc(z, lanes[1]);
    return;
  }
  const nBlock = Math.random() < 0.35 + diff*0.45 ? 2 : 1; // 堵 1~2 条道
  const freeLane = lanes[nBlock];                          // 必定留出的道
  // 修饰器微调权重:夫子庙高灯密(high↑)、老门东巷窄墙多(full↑)
  const w = { ...lv.weight };
  if(lv.mod==='lanternDense'){ w.low -= 0.1; w.high += 0.1; }
  if(lv.mod==='alleyNarrow'){ w.low -= 0.08; w.full += 0.08; }
  for(let i=0;i<nBlock;i++){
    const r = Math.random();
    const type = r < w.low ? 'low' : r < w.low + w.high ? 'high' : 'full';
    G.obs.push({ lane:lanes[i], x:lanes[i]*LANEGAP, z, type });
    // 颐和路:梧桐落枝成对出现(40% 同 lane z+4 再补一根)
    if(type==='low' && lv.mod==='planeFall' && Math.random() < 0.4)
      G.obs.push({ lane:lanes[i], x:lanes[i]*LANEGAP, z:z+4, type:'low' });
    // 难度高时同簇追加前后错位障碍;H1/H2 约束:禁止落免费道,偏移上限随速度收缩,
    // 与下一簇保持 >= 6m 反应余量(高速下自然少出,速度封顶时几乎不出)
    if(diff > 0.5 && Math.random() < 0.3){
      const maxOff = Math.min(9, 16*(9.5/G.speed) - 2);
      if(maxOff > 4){
        let l2 = irnd(-1,1);
        while(l2 === lanes[i] || l2 === freeLane) l2 = irnd(-1,1);
        G.obs.push({ lane:l2, x:l2*LANEGAP, z:z+rnd(4,maxOff), type: Math.random()<0.5?'low':'high' });
      }
    }
  }
  spawnArc(z, freeLane);
}

/* ---- 粒子 ---- */
export function burst(x, y, color){
  // 剪纸碎片:三角/菱形小纸片,旋转变速下落
  for(let i=0;i<12;i++) G.parts.push({
    x, y, z:ZP, vx:rnd(-2.5,2.5), vy:rnd(1,4.5), life:rnd(0.5,0.9), color, size:rnd(3,6),
    shard:true, dia:Math.random()<0.5, rot:rnd(0,TAU), vr:rnd(-8,8),
  });
}
export function ambient(lv){
  // 梅花瓣/灯火/星尘 环境粒子(大、淡、柔边,求"飘絮"不求"撒盐")
  if(Math.random() > 0.12) return;
  const colors = { crenel:'#e8b04b', lotus:'#d98ba0', steps:'#ffffff', lantern:'#f0b64c', pine:'#c9a2ff',
    plane:'#d8b04a', street:'#f0a04a', maple:'#e0783a', pagoda:'#e8c170', bridge:'#9fc0e8' };
  const windy = lv.mod==='riverWind';   // 大桥江风:粒子横向速度加大
  G.parts.push({
    x:rnd(-6,6), y:rnd(2,5), z:rnd(4,30), vx:windy?rnd(-1.4,0.4):rnd(-0.5,0.1), vy:rnd(-0.8,-0.3),
    life:rnd(2.5,4.5), color:colors[lv.motif]||'#ffffff', size:rnd(3,6.5), ambient:true,
  });
}

/* 穿门演出:头顶三簇纸屑雨 + 风铃音 */
function gateShower(lv){
  const colors = { crenel:'#e8b04b', lotus:'#d98ba0', steps:'#ffffff', lantern:'#f0b64c', pine:'#c9a2ff',
    plane:'#d8b04a', street:'#f0a04a', maple:'#e0783a', pagoda:'#e8c170', bridge:'#9fc0e8' };
  const c = colors[lv.motif] || '#f0b64c';
  for(let i=-1;i<=1;i++){
    const p = proj(i*LANEGAP, 2.2, ZP);
    burst(p.x, p.y, c);
  }
  sfx.gate();
}

/* ---- 主更新 ---- */
export function update(dt){
  if(G.egg){ G.egg.ttl -= dt; if(G.egg.ttl<=0) G.egg = null; } // 彩蛋文案倒计时
  G.shake = Math.max(0, G.shake - dt*3);                        // 震屏衰减(撞车后也能平息)
  if(G.state!=='play' || G.paused) return;
  G.t += dt;   // 世界时钟:暂停时冻结,画舫/粒子等不动
  const lv = curLv();
  if(G.mode==='endless') G.speed = Math.min(20, 9.5 + G.dist/280);
  G.dist += G.speed * dt;
  // 连击窗口衰减
  if(G.comboT > 0){ G.comboT -= dt; if(G.comboT <= 0) G.combo = 0; }
  if(G.newItem){ G.newItem.ttl -= dt; if(G.newItem.ttl <= 0) G.newItem = null; }
  if(G.mode==='endless'){
    // 里程碑勋章
    if(G.msIdx < MILESTONES.length && G.dist >= MILESTONES[G.msIdx][0]){
      G.egg = { text:'达成 · '+MILESTONES[G.msIdx][1]+'!', ttl:2.6, dur:2.6 };
      sfx.gate(); G.msIdx++;
    }
    // 600m 报站
    const cyc = Math.floor(G.dist/600);
    if(cyc !== G.lmCyc){
      if(G.lmCyc >= 0) G.egg = { text:'前方 · '+LM_NAME[LM_CYCLE[cyc%LM_CYCLE.length]], ttl:2.6, dur:2.6 };
      G.lmCyc = cyc;
    }
  }

  // 生成(老门东巷窄:簇间距 ×0.9)
  const gapMul = curLv().mod==='alleyNarrow' ? 0.9 : 1;
  while(G.nextSpawn < G.dist + DRAWD){
    spawnCluster(G.nextSpawn);
    G.nextSpawn += (rnd(16,24) * (9.5/G.speed) + 4) * gapMul;
  }
  // 穿越门:冒险约每 130~160m,无尽每 200m;不参与碰撞
  while(G.nextGate < G.dist + DRAWD){
    G.gates.push({ z: G.nextGate, passed:false, rz: G.nextGate - G.dist + ZP });
    G.nextGate += G.mode==='adv' ? rnd(130,160) : 200;
  }
  for(const g of G.gates){
    g.rz = g.z - G.dist + ZP;
    if(!g.passed && g.rz <= ZP){ g.passed = true; gateShower(lv); }
  }
  G.gates = G.gates.filter(g=>g.rz > 1.2);
  // 玩家物理
  pl.x = lerp(pl.x, pl.lane*LANEGAP, Math.min(1, dt*12));
  pl.vy -= 18*dt; pl.y += pl.vy*dt;
  if(pl.y<=0){ pl.y=0; pl.vy=0; pl.jumps=0; }
  pl.sliding = Math.max(0, pl.sliding - dt);

  // 过关判定先于碰撞:冲线同帧不冤死
  if(G.mode==='adv' && G.dist >= lv.len){ levelClear(); return; }

  // 障碍:更新相对深度 + 碰撞
  for(const o of G.obs){
    const prevRz = o.rz===undefined ? Infinity : o.rz;
    o.rz = o.z - G.dist + ZP;
    if(o.hit) continue;
    // 教学完成标记:首次跨过(不限于躲过)第一个障碍后落盘,秒退者下次还有教学
    if(G.tut && !save.tut && prevRz > ZP && o.rz <= ZP){ save.tut = true; persist(); }
    // 扫掠判定:在判定窗内,或本帧整体跨过玩家平面(防高速低帧率隧穿)
    const inWin = (o.rz > ZP-0.45 && o.rz < ZP+0.45) || (prevRz > ZP && o.rz <= ZP);
    if(inWin && Math.abs(o.x - pl.x) < 0.55){
      const jumpClear = pl.y > 0.72;                      // 跳起可通过 low
      const slideClear = pl.sliding > 0 && pl.y < 0.3;    // 贴地滑铲才可通过 high(空中快降不免疫)
      // H4:二段跳总高约 2.01,能从荷花缸/画舫/牌坊头顶飞过,给 full 加高度豁免,免于冤枉死
      const dead = (o.type==='full' && pl.y <= 1.9) || (o.type==='low' && !jumpClear) || (o.type==='high' && !slideClear);
      if(dead){ o.hit = true; gameOver(o.type); return; }
    }
  }
  G.obs = G.obs.filter(o=>o.rz > 1.2);
  // 收集品(同样扫掠,防高速漏捡)
  for(const c of G.cols){
    const prevRz = c.rz===undefined ? Infinity : c.rz;
    c.rz = c.z - G.dist + ZP;
    const inWin = (c.rz > ZP-0.5 && c.rz < ZP+0.5) || (prevRz > ZP && c.rz <= ZP);
    if(!c.got && inWin && Math.abs(c.x-pl.x)<0.6 && Math.abs(c.y-(pl.y+0.8))<0.95){
      c.got = true; G.items++;
      G.arcGot[c.arc] = (G.arcGot[c.arc]||0) + 1;
      G.combo++; G.comboT = 3; sfx.collect(G.combo);
      const p = proj(c.x, c.y, ZP); burst(p.x, p.y, '#f0b64c');
      if(!save.album[c.id]){
        save.album[c.id]=true; G.newIds.push(c.id); persist();
        const it = ITEMS.find(i=>i.id===c.id);
        G.newItem = { id:c.id, ttl:2.0 }; sfx.newItem();          // 新图鉴即时横幅(2 秒,不挡视野)
        G.egg = { text:it && it.quip ? it.quip : '', ttl:3.2, dur:3.2 };
      } else if(Math.random() < 0.2){
        const it = ITEMS.find(i=>i.id===c.id);
        if(it && it.quip) G.egg = { text:it.quip, ttl:2.6, dur:2.6 };
      }
      // M5:吃满整条弧线才报「一串全收」(按弧线总数计数,漏捡不再误报)
      if(G.combo >= 2 && G.arcGot[c.arc] === c.arcN){
        G.egg = G.egg && G.egg.ttl > 1.5 ? G.egg : { text:'一串全收!', ttl:2, dur:2 };
        const q = proj(c.x, c.y+0.6, ZP); burst(q.x, q.y, '#f0b64c');
      }
      // 冒险模式:星级门槛即时提示
      if(G.mode==='adv'){
        const need = [8,14,20];
        for(let i=0;i<3;i++) if(G.items === need[i]){
          G.egg = { text:'★'.repeat(i+1)+' 达成!', ttl:2.2, dur:2.2 }; sfx.gate();
        }
      }
    }
  }
  G.cols = G.cols.filter(c=>!c.got && c.rz > 1.2);
  // 粒子
  ambient(lv);
  for(const p of G.parts){
    p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt;
    if(!p.ambient) p.vy -= 6*dt;
    if(p.shard) p.rot += p.vr*dt;   // 纸片旋转
  }
  G.parts = G.parts.filter(p=>p.life>0);
}

export function gameOver(type){
  sfx.hit(); G.shake = 1; G.slowmo = 0.22;   // 震屏 + 0.2s 慢动作
  G.killedBy = type || null;                 // 死因(结算页教学提示)
  G.newBest = false;
  if(G.mode==='endless'){
    const m = Math.floor(G.dist);
    G.newBest = m > save.best;               // 先判后写,平局不误报
    if(G.newBest){ save.best = m; persist(); sfx.record(); }
  }
  G.state = 'over';
  track('over', { mode:G.mode, dist:Math.floor(G.dist) });
}
export function levelClear(){
  sfx.clear();
  const need = [8,14,20]; let star = 0;
  for(let i=0;i<3;i++) if(G.items>=need[i]) star = i+1;
  if(star > save.stars[G.lvIdx]) save.stars[G.lvIdx]=star;
  save.cleared[G.lvIdx] = true;   // 通关即解锁下一关,与星级脱钩
  persist();
  G.state = 'clear';
  track('clear', { lv:G.lvIdx, star, items:G.items });
}
export function nextAfterClear(){
  if(G.lvIdx < LEVELS.length-1){
    const next = LEVELS[G.lvIdx+1];
    // 隐藏关(大桥)未达成解锁条件时不允许 Enter 直进
    if(next.hidden){
      const albumFull = Object.keys(save.album).length >= ITEMS.length;
      const totalStars = save.stars.reduce((a,b)=>a+b,0);
      if(!(albumFull && totalStars >= 15)){ G.state = 'menu'; return; }
    }
    startRun('adv', G.lvIdx+1);
  } else G.state = 'menu';
}
