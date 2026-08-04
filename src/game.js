import { clamp, lerp, rnd, irnd, proj, LANEGAP, ZP, DRAWD, TAU } from './core.js';
import { LEVELS, ITEMS, LM_CYCLE, LM_NAME, MILESTONES, RUN_STAR_THRESHOLDS } from './config.js';
import { save, persist, queuePersist } from './save.js';
import { canPassObstacle, calculateRunStars, getBridgeUnlockStatus, getObstacleInstruction } from './rules.js';
import { sfx, bgm } from './audio.js';
import { track } from './track.js';

/* ================= 游戏状态 ================= */
export const G = {
  state:'menu',      // menu | levels | play | crashing | over | clear | album
  mode:'adv',        // adv | endless
  lvIdx:0, paused:false, t:0,
  dist:0, speed:0, runMarks:0, runStars:0, newIds:[],
  obs:[], cols:[], parts:[], gates:[],
  nextSpawn:0, nextGate:0, shake:0,
  buttons:[], albumFrom:'menu', wipe:0, pressed:null,
  albumZoom:null,    // 图鉴放大查看的风物 id(纯 UI 状态)
  albumScroll:0,     // 图鉴页纵向滚动偏移(px)
  egg:null,            // 彩蛋文案 { text, ttl, dur }
  newBest:false,       // 本局是否破了无尽纪录(结算页展示)
  kbSel:0, kbActive:false, // 菜单键盘导航焦点
  combo:0, comboT:0,   // 连击与剩余窗口
  tut:null,            // 教学飘字 [{z,text}]
  tutStage:4,          // 兼容测试快照；0~3 对应四步教学，4=结束
  tutorial:null,       // {step,targetZ,targetLane,actionDone,retries}
  inputBuffer:{jump:0,slide:0},
  crashT:0,
  arcGot:{},           // 每弧线已收计数(一串全收判定)
  killedBy:null,       // 致死障碍类型(结算页死因提示)
  newItem:null,        // 新图鉴即时横幅 { id, ttl }
  secretUnlock:{ baiju:false, baochuan:false },  // 局内隐藏件解锁标记(白局15连击/宝船3000m)
  powers:[],           // 局内道具 { lane, x, z, kind }(磁铁/护盾/金桂)
  nextPower:0,         // 下一个道具生成距离
  powerT:{ magnet:0, gui:0 },   // 磁铁/金桂剩余时间(秒)
  shield:false,        // 护盾:挡一次碰撞
  msIdx:0, lmCyc:-1,   // 无尽:里程碑进度 / 报站周期
};
export const pl = { lane:0, x:0, y:0, vy:0, sliding:0, jumps:0 };

export function startRun(mode, lvIdx, forceTutorial=false){
  if(mode==='adv' && (!LEVELS[lvIdx] || (LEVELS[lvIdx].hidden && !getBridgeUnlockStatus(save).unlocked))){
    G.state = 'levels';
    return false;
  }
  G.mode = mode; G.lvIdx = lvIdx;
  G.dist = 0; G.runMarks = 0; G.runStars = 0; G.newIds = []; G.t = 0;
  G.obs = []; G.cols = []; G.parts = []; G.gates = [];
  G.speed = mode==='adv' ? LEVELS[lvIdx].speed : 9.5;
  G.nextSpawn = 40; G.paused = false; G.shake = 0; G.egg = null;
  G.newBest = false; G.kbSel = 0; G.kbActive = false;
  G.combo = 0; G.comboT = 0; G.killedBy = null; G.newItem = null;
  G.secretUnlock = { baiju:false, baochuan:false };
  G.powers = []; G.powerT = { magnet:0, gui:0 }; G.shield = false;
  G.nextPower = 120;
  G.msIdx = 0; G.lmCyc = -1; G.arcGot = {};
  G.inputBuffer={jump:0,slide:0}; G.crashT=0;
  const teach=mode==='adv' && lvIdx===0 && (forceTutorial || !save.tutorialCompleted);
  G.tut=null; G.tutorial=null; G.tutStage=teach?0:4;
  if(teach) G.nextSpawn=Infinity;
  G.nextGate = mode==='adv' ? 130 : 200;
  pl.lane = 0; pl.x = 0; pl.y = 0; pl.vy = 0; pl.sliding = 0; pl.jumps = 0;
  G.state = 'play';
  if(teach) beginTutorialStep(0);
  bgm(LEVELS[lvIdx].motif);
  track('start', { mode, lv:lvIdx });
  return true;
}
export const curLv = ()=> G.mode==='adv' ? LEVELS[G.lvIdx] : LEVELS[Math.floor(G.dist/600)%LEVELS.length];

/* ---- 操作回调 ---- */
function noteTutorialAction(kind){
  if(!G.tutorial) return;
  if((G.tutorial.step===0 && kind==='lane') || (G.tutorial.step===1 && kind==='jump')
    || (G.tutorial.step===2 && kind==='slide') || (G.tutorial.step===3 && kind==='double'))
    G.tutorial.actionDone=true;
}
export function onLeft(){ if(G.state==='play'&&!G.paused){ if(pl.lane>-1){ pl.lane--; noteTutorialAction('lane'); sfx.lane(); } } }
export function onRight(){ if(G.state==='play'&&!G.paused){ if(pl.lane<1){ pl.lane++; noteTutorialAction('lane'); sfx.lane(); } } }
export function onJump(){
  if(G.state!=='play'||G.paused) return;
  G.inputBuffer.jump=0.1; G.inputBuffer.slide=0;
}
export function onSlide(){
  if(G.state!=='play'||G.paused) return;
  G.inputBuffer.slide=0.1; G.inputBuffer.jump=0;
}
export function onPauseKey(){
  if(G.state==='play'){ G.paused = !G.paused; sfx.click(); }
  else if(G.state==='album'){
    if(G.albumZoom) G.albumZoom = null;        // 放大查看时 Esc 先关放大层
    else G.state = G.albumFrom;
    sfx.click();
  }
  else if(G.state==='levels' || G.state==='over' || G.state==='clear' || G.state==='shop'){ G.state='menu'; sfx.click(); }
}
export function onEnter(){
  if(G.state==='over'){ startRun(G.mode, G.lvIdx); }
  else if(G.state==='clear'){ nextAfterClear(); }
}

/* ---- 生成器:障碍簇 + 收集品引导线 ---- */
const TUTORIAL_TYPES=['full','low','high','double'];
function beginTutorialStep(step,retry=false){
  const lane=pl.lane, z=G.dist+(retry?30:34), previous=G.tutorial;
  G.obs=G.obs.filter(obstacle=>obstacle.tutorialStep===undefined);
  G.cols=G.cols.filter(mark=>mark.tutorialStep===undefined);
  G.tutStage=step;
  G.tutorial={step,targetZ:z,targetLane:lane,actionDone:false,retries:retry?(previous?.retries||0)+1:0};
  const touch='ontouchstart' in window;
  const type=TUTORIAL_TYPES[step];
  const tip=step===3 ? (touch?'空中再上滑一次，够到高处印记':'空中再按一次 ↑，够到高处印记')
    : getObstacleInstruction(type,touch);
  G.tut=[{z:z-12,text:'第 '+(step+1)+'/4 步 · '+tip}];
  if(step<3){
    G.obs.push({lane,x:lane*LANEGAP,z,type,tutorialStep:step});
  }else{
    for(let i=0;i<3;i++) G.cols.push({
      x:lane*LANEGAP,z:z-2+i*2,y:2.6+i*0.2,id:'plum',got:false,
      arc:'tutorial-'+z,arcN:3,tutorialStep:3,tutorialGoal:i===2,
    });
  }
}
function retryTutorial(){
  if(!G.tutorial) return;
  const step=G.tutorial.step;
  G.egg={text:'临时护盾接住了，再试一次',ttl:2,dur:2};
  sfx.shieldBreak();
  beginTutorialStep(step,true);
}
function completeTutorialStep(step){
  if(!G.tutorial || G.tutorial.step!==step) return;
  if(step<3){
    G.egg={text:'做对了！下一步',ttl:1.5,dur:1.5};
    beginTutorialStep(step+1,false);
    return;
  }
  save.tutorialCompleted=true; save.tut=true; persist();
  G.obs=G.obs.filter(obstacle=>obstacle.tutorialStep===undefined);
  G.cols=G.cols.filter(mark=>mark.tutorialStep===undefined);
  G.tutorial=null; G.tut=null; G.tutStage=4; G.nextSpawn=G.dist+40;
  G.egg={text:'四步全会了，开跑！',ttl:2.4,dur:2.4};
}
function consumeInputBuffer(dt){
  if(G.inputBuffer.jump>0){
    let used=false;
    if(pl.y<=0.01){pl.vy=6.4;pl.jumps=1;used=true;noteTutorialAction('jump');}
    else if(pl.jumps===1){pl.vy=5.6;pl.jumps=2;used=true;noteTutorialAction('double');}
    if(used){pl.sliding=0;G.inputBuffer.jump=0;sfx.jump();}
    else G.inputBuffer.jump=Math.max(0,G.inputBuffer.jump-dt);
  }
  if(G.inputBuffer.slide>0){
    if(pl.y>0.01) pl.vy=Math.min(pl.vy,-7);
    pl.sliding=0.75;G.inputBuffer.slide=0;noteTutorialAction('slide');sfx.slide();
  }
}
/* 隐藏件条件判定(二期 §D2):条件未达成根本不进掉落池。
   全局条件看存档(星/里程/图鉴/通关),局内条件看 G.secretUnlock。 */
function secretReady(it){
  if(it.id==='baiju') return G.secretUnlock.baiju;                 // 单局≥15连击(局内)
  if(it.id==='baochuan') return G.secretUnlock.baochuan;           // 无尽单局≥3000m(局内)
  if(it.id==='zhuangyuan') return save.stars.reduce((a,b)=>a+b,0) >= 25;   // 累计≥25星
  if(it.id==='zifeng') return save.distTotal >= 10000;             // 累计≥10000m
  if(it.id==='hufengdie') return ITEMS.filter(i=>i.cat==='creature' && !i.secret).every(i=>save.album[i.id]); // 集齐生之灵(常见件)
  if(it.id==='jiangtun') return !!save.cleared[9];                 // 通关第10站
  return true;
}

/* 收集品弧线:免费道上 4~6 个(玄武湖 longArc 修饰器加长到 5~7),若相邻道有 low 障碍则从其上方越过。
   栖霞山 arcDrift:弧线横向摆动,蛇形飘移 */
function spawnArc(z, freeLane){
  // 风物与关卡绑定:主场风物 3 倍权重;稀有款仅主场关或无尽 800m 后掉落;隐藏件条件未达成不进池
  const lvNow = G.mode==='adv' ? G.lvIdx : -1;
  const pool = [];
  for(const it of ITEMS){
    if(it.id==='jiangtun') continue;   // 江豚只由首次通关大桥授予,永不进随机池
    if(it.rare && !(it.home===lvNow || (G.mode==='endless' && G.dist>800))) continue;
    if(it.secret && !secretReady(it)) continue;
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
  if(G.state==='crashing'){
    G.crashT-=dt;
    if(G.crashT<=0) G.state='over';
    else if(G.crashT<0.18) G.t+=dt*0.3;   // 80ms 定格后，180ms 慢放翻倒
    return;
  }
  if(G.state!=='play' || G.paused) return;
  consumeInputBuffer(dt);
  G.t += dt;   // 世界时钟:暂停时冻结,画舫/粒子等不动
  const lv = curLv();
  if(G.mode==='endless') G.speed = Math.min(20, 9.5 + G.dist/280);
  const nearLesson=G.tutorial && !G.tutorial.actionDone && G.tutorial.targetZ-G.dist<20;
  G.dist += G.speed * dt * (nearLesson?0.45:1);
  // 连击窗口衰减
  if(G.comboT > 0){ G.comboT -= dt; if(G.comboT <= 0) G.combo = 0; }
  // 局内隐藏件解锁:15 连击混入白局,无尽 3000m 混入宝船(彩蛋提示)
  if(!G.secretUnlock.baiju && G.combo >= 15){
    G.secretUnlock.baiju = true;
    G.egg = { text:'有稀罕东西混进来了……', ttl:2.6, dur:2.6 };
  }
  if(!G.secretUnlock.baochuan && G.mode==='endless' && G.dist >= 3000){
    G.secretUnlock.baochuan = true;
    G.egg = { text:'有稀罕东西混进来了……', ttl:2.6, dur:2.6 };
  }
  // 道具计时(磁铁/金桂)
  if(G.powerT.magnet > 0) G.powerT.magnet -= dt;
  if(G.powerT.gui > 0) G.powerT.gui -= dt;
  // 磁铁生效:邻道收集品横向吸向玩家道
  if(G.powerT.magnet > 0){
    for(const c of G.cols){
      if(!c.got && Math.abs(c.x - pl.x) > 0.1) c.x += (pl.x - c.x) * Math.min(1, dt*4);
    }
  }
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
  while(!G.tutorial && G.nextSpawn < G.dist + DRAWD){
    spawnCluster(G.nextSpawn);
    G.nextSpawn += (rnd(16,24) * (9.5/G.speed) + 4) * gapMul;
  }
  // 局内道具:免费道形态的发光物件,每 150~250m 一个(货郎吆喝升级缩短间隔)
  const spawnMul = [1, 0.85, 0.7, 0.55][save.ups.spawn] || 1;
  while(!G.tutorial && G.nextPower < G.dist + DRAWD){
    const kinds = ['magnet','shield','gui'];
    G.powers.push({ lane: irnd(-1,1), x:0, z: G.nextPower, kind: kinds[irnd(0,2)] });
    G.nextPower += rnd(150,250) * spawnMul;
  }
  G.powers = G.powers.filter(p=>p.z - G.dist + ZP > 1.2);
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
    const crossed=prevRz>ZP && o.rz<=ZP;
    // 扫掠判定:在判定窗内,或本帧整体跨过玩家平面(防高速低帧率隧穿)
    const inWin = (o.rz > ZP-0.45 && o.rz < ZP+0.45) || (prevRz > ZP && o.rz <= ZP);
    if(inWin && Math.abs(o.x - pl.x) < 0.55){
      const dead = !canPassObstacle(pl, o);
      if(dead){
        if(o.tutorialStep!==undefined){
          o.hit=true;
          const q=proj(o.x,1.0,ZP);burst(q.x,q.y,'#7ba86f');
          retryTutorial();
          return;
        }else if(G.shield){                               // 护盾挡一次:荷叶飞散,不死
          G.shield = false; o.hit = true;
          const q = proj(o.x, 1.0, ZP); burst(q.x, q.y, '#7ba86f');
          sfx.shieldBreak();
        } else { o.hit = true; gameOver(o.type); return; }
      }
    }
    if(crossed && o.tutorialStep!==undefined){completeTutorialStep(o.tutorialStep);return;}
  }
  G.obs = G.obs.filter(o=>o.rz > 1.2);
  // 收集品(同样扫掠,防高速漏捡)
  for(const c of G.cols){
    const prevRz = c.rz===undefined ? Infinity : c.rz;
    c.rz = c.z - G.dist + ZP;
    const inWin = (c.rz > ZP-0.5 && c.rz < ZP+0.5) || (prevRz > ZP && c.rz <= ZP);
    if(!c.got && inWin && Math.abs(c.x-pl.x)<0.6 && Math.abs(c.y-(pl.y+0.8))<0.95){
      c.got = true;
      const coinMul = G.powerT.gui > 0 ? 2 : 1;            // 金桂只翻倍铜钱
      G.runMarks += 1;
      G.runStars = calculateRunStars(G.runMarks, RUN_STAR_THRESHOLDS);
      save.coins += coinMul;
      queuePersist();
      G.arcGot[c.arc] = (G.arcGot[c.arc]||0) + 1;
      G.combo++; G.comboT = 3; sfx.collect(G.combo);
      const p = proj(c.x, c.y, ZP); burst(p.x, p.y, '#f0b64c');
      if(!save.album[c.id]){
        grantAlbumItem(c.id);
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
        for(let i=0;i<3;i++) if(G.runMarks === RUN_STAR_THRESHOLDS[i]){
          G.egg = { text:'★'.repeat(i+1)+' 达成!', ttl:2.2, dur:2.2 }; sfx.gate();
        }
      }
      if(c.tutorialGoal && G.tutorial?.step===3 && G.tutorial.actionDone){completeTutorialStep(3);return;}
    }
    if(!c.got && c.tutorialGoal && c.rz<=1.2){retryTutorial();return;}
  }
  G.cols = G.cols.filter(c=>!c.got && c.rz > 1.2);
  // 道具扫掠(同收集品判定窗;磁铁/护盾/金桂)
  for(const p of G.powers){
    const prevRz = p.rz===undefined ? Infinity : p.rz;
    p.rz = p.z - G.dist + ZP;
    const inWin = (p.rz > ZP-0.5 && p.rz < ZP+0.5) || (prevRz > ZP && p.rz <= ZP);
    if(!p.got && inWin && p.lane === pl.lane){
      p.got = true;
      if(p.kind==='magnet'){ G.powerT.magnet = 6 + save.ups.magnet*2; sfx.magnet(); }
      else if(p.kind==='shield'){ G.shield = true; sfx.shield(); }
      else { G.powerT.gui = 6 + save.ups.gui*2; sfx.gui(); }
      sfx.power();
      const pr = proj(p.lane*LANEGAP, 0.9, ZP); burst(pr.x, pr.y, '#f0c85a');
    }
  }
  G.powers = G.powers.filter(p=>!p.got && p.z - G.dist + ZP > 1.2);
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
  sfx.hit(); G.shake = 1; G.crashT = 0.26;   // 80ms 定格 + 180ms 慢放
  G.killedBy = type || null;                 // 死因(结算页教学提示)
  G.newBest = false;
  if(G.mode==='endless'){
    const m = Math.floor(G.dist);
    G.newBest = m > save.best;               // 先判后写,平局不误报
    if(G.newBest){ save.best = m; persist(); sfx.record(); }
  }
  save.distTotal += Math.floor(G.dist); persist();   // 累计里程(隐藏件紫峰大厦判定)
  G.state = 'crashing';
  track('over', { mode:G.mode, dist:Math.floor(G.dist) });
}
export function levelClear(){
  sfx.clear();
  G.runStars = calculateRunStars(G.runMarks, RUN_STAR_THRESHOLDS);
  if(G.runStars > save.stars[G.lvIdx]) save.stars[G.lvIdx]=G.runStars;
  save.cleared[G.lvIdx] = true;   // 通关即解锁下一关,与星级脱钩
  if(G.lvIdx === LEVELS.length-1) grantAlbumItem('jiangtun');
  save.distTotal += Math.floor(G.dist);   // 累计里程
  persist();
  G.state = 'clear';
  track('clear', { lv:G.lvIdx, star:G.runStars, marks:G.runMarks });
}
export function nextAfterClear(){
  if(G.lvIdx < LEVELS.length-1){
    const next = LEVELS[G.lvIdx+1];
    // 隐藏关(大桥)未达成解锁条件时不允许 Enter 直进
    if(next.hidden){
      if(!getBridgeUnlockStatus(save).unlocked){ G.state = 'menu'; return; }
    }
    startRun('adv', G.lvIdx+1);
  } else G.state = 'menu';
}

/* 路上拾取与关卡奖励共用，保证图鉴、红点和本局新物品不串账。 */
export function grantAlbumItem(id){
  const item = ITEMS.find(entry => entry.id === id);
  if(!item || save.album[id]) return false;
  save.album[id] = true;
  G.newIds.push(id);
  if(item.secret) save.albumNew = true;
  G.newItem = { id, ttl:2.0 };
  G.egg = { text:item.quip || '', ttl:3.2, dur:3.2 };
  queuePersist();
  sfx.newItem();
  return true;
}
