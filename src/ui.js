import { ctx, W, H, CX, poly, disc, rrect, petalFlower, clamp } from './core.js';
import { LEVELS, ITEMS, MILESTONES } from './config.js';
import { save } from './save.js';
import { sfx } from './audio.js';
import { G, curLv, startRun, nextAfterClear } from './game.js';
import { drawItemPhoto } from './art/photo.js';
import { drawSide } from './art/scenery.js';
import { shareScore } from './share.js';

/* ================= 渲染:UI 组件 ================= */
export function text(str, x, y, size, color, align, weight, soft){
  // 大字号标题用宋体系(金陵长卷气质),小字号 UI 保留黑体
  const family = size >= 30 ? '"JinlingSong","STSong","SimSun",serif' : '"Microsoft YaHei","PingFang SC",sans-serif';
  ctx.font = (weight ? weight + ' ' : '') + size + 'px ' + family;
  ctx.textAlign = align||'center'; ctx.textBaseline = 'middle';
  // 统一深色描边:任何实景照片背景上都可读;soft=大标题用细淡描边(现代感)
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size*(soft?0.08:0.16));
  ctx.strokeStyle = soft ? 'rgba(10,8,16,0.42)' : 'rgba(10,8,16,0.6)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}
export function button(id, label, x, y, w, h, opts){
  opts = opts||{};
  G.buttons.push({ id, x:x-w/2, y:y-h/2, w, h, data:opts.data });
  const bi = G.buttons.length-1;
  const pressed = G.pressed && G.pressed.id===id && G.pressed.data===opts.data;
  ctx.save();
  if(pressed){ ctx.translate(x,y); ctx.scale(0.94,0.94); ctx.translate(-x,-y); } // 按压回弹
  ctx.globalAlpha = opts.disabled ? 0.45 : 1;
  const r = h/2;   // 药丸形
  if(opts.ghost){  // 次级按钮:半透明幽灵风
    rrect(x-w/2, y-h/2, w, h, r, 'rgba(246,241,231,0.08)', 'rgba(246,241,231,0.35)', 1.5);
  } else {         // 主按钮:柔和朱红(opts.bg 可覆盖)
    rrect(x-w/2, y-h/2, w, h, r, opts.bg || '#d85c47');
    rrect(x-w/2+1.5, y-h/2+1.5, w-3, h*0.42, r*0.8, 'rgba(255,255,255,0.10)'); // 顶部柔光
  }
  text(label, x, y+1, opts.size||22, '#f7f2e6', 'center', 'bold');
  if(pressed) rrect(x-w/2, y-h/2, w, h, r, 'rgba(0,0,0,0.22)');
  ctx.globalAlpha = 1;
  ctx.restore();
  focusRing(bi, x-w/2, y-h/2, w, h);
}

/* 键盘导航:方向键移动焦点,Enter 激活(按过方向键后才显示焦点框) */
function focusRing(bi, bx, by, bw, bh){
  if(!G.kbActive || bi !== Math.min(G.kbSel||0, G.buttons.length-1)) return;
  ctx.save();
  ctx.strokeStyle = '#f7ead0'; ctx.lineWidth = 2; ctx.setLineDash([6,4]);
  ctx.strokeRect(bx-5, by-5, bw+10, bh+10);
  ctx.restore();
}
export function kbNav(d){
  if(!G.buttons.length || G.state==='play') return;
  G.kbActive = true;
  G.kbSel = ((G.kbSel||0)+d+G.buttons.length)%G.buttons.length;
  sfx.click();
}
export function kbEnter(){
  if(!G.buttons.length) return;
  const b = G.buttons[Math.min(G.kbSel||0, G.buttons.length-1)];
  if(b){ sfx.click(); handleButton(b.id, b.data); }
}
export function stars(n, x, y, r){
  for(let i=0;i<3;i++){
    const cx = x + (i-1)*r*2.6, on = i < n;
    ctx.fillStyle = on ? '#f0b64c' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    for(let k=0;k<10;k++){
      const a = -Math.PI/2 + k*Math.PI/5, rr = k%2 ? r*0.45 : r;
      ctx[k?'lineTo':'moveTo'](cx+Math.cos(a)*rr, y+Math.sin(a)*rr);
    }
    ctx.closePath(); ctx.fill();
  }
}
export function dim(alpha){ ctx.fillStyle=`rgba(8,6,14,${alpha})`; ctx.fillRect(0,0,W,H); }

/* ---- HUD ---- */
export function drawHUD(){
  const lv = curLv();
  text(Math.floor(G.dist)+' m', 24, 30, 24, lv.hud, 'left', 'bold');
  text('风物 × '+G.items, 24, 64, 20, lv.hud, 'left', 'bold');
  if(G.combo >= 2) text(G.combo+' 连击!', 24, 92, 16, '#f0b64c', 'left', 'bold');
  if(G.mode==='adv'){
    text(lv.name, CX, 30, 22, lv.hud, 'center', 'bold');
    // 进度条
    const pw = 260, px = CX-pw/2, py = 48;
    ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(px, py, pw, 6);
    ctx.fillStyle=lv.accent; ctx.fillRect(px, py, pw*clamp(G.dist/lv.len,0,1), 6);
  } else {
    text('无尽模式 · 最佳 '+save.best+' m', CX, 30, 20, lv.hud, 'center', 'bold');
    if(G.msIdx < MILESTONES.length)
      text('距「'+MILESTONES[G.msIdx][1]+'」还差 '+Math.max(0,Math.ceil(MILESTONES[G.msIdx][0]-G.dist))+' m', CX, 54, 13, lv.hud, 'center');
  }
  // 新图鉴即时横幅(拍立得滑入)
  if(G.newItem){
    const it = ITEMS.find(i=>i.id===G.newItem.id);
    const a = clamp(Math.min((2.8-G.newItem.ttl)*5, G.newItem.ttl*2), 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    drawItemPhoto(G.newItem.id, CX, 108, 20, -0.06, false);
    text('新图鉴:'+(it?it.name:''), CX, 150, 18, '#f0b64c', 'center', 'bold');
    ctx.restore();
  }
  // 底部操作提示:开场 5 秒内显示后淡出,暂停时重新出现;触屏设备显示手势
  const hint = ('ontouchstart' in window) ? '左右滑换道  上滑跳  下滑铲  点按钮暂停'
    : '←→换道  ↑跳  ↓滑铲  P暂停  M静音'+(save.muted?'(已静音)':'');
  if(G.paused || G.t < 5){
    ctx.globalAlpha = G.paused ? 1 : clamp(5-G.t, 0, 1);
    text(hint, CX, H-16, 13, lv.hud, 'center');
    ctx.globalAlpha = 1;
  }
  // 彩蛋文案(淡入淡出)
  if(G.egg && G.egg.text){
    const a = clamp(Math.min((G.egg.dur-G.egg.ttl)*4, G.egg.ttl), 0, 1);
    ctx.globalAlpha = a;
    text(G.egg.text, CX, H-48, 16, '#f0b64c', 'center', 'bold');
    ctx.globalAlpha = 1;
  }
  if(G.paused){
    dim(0.6);
    text('暂 停', CX, H*0.42, 54, '#f7ead0', 'center', 'bold');
    button('resume','继续', CX, H*0.56, 180, 52);
    button('quit','回主菜单', CX, H*0.68, 180, 52, {ghost:true});
  }
}

/* ---- 界面 ---- */
export function drawMenu(){
  dim(0.5);
  // 标题区自上而下渐变压暗,夜景之上文字更干净
  const g = ctx.createLinearGradient(0, 0, 0, H*0.66);
  g.addColorStop(0, 'rgba(8,6,14,0.55)'); g.addColorStop(1, 'rgba(8,6,14,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H*0.66);
  // 标题:宋体大字号 + 字距,细淡描边(soft)
  const ty = H*0.26;
  ctx.save();
  if('letterSpacing' in ctx) ctx.letterSpacing = '10px';
  text('金陵快跑', CX, ty, 92, '#f6f1e7', 'center', 'bold', true);
  ctx.restore();
  // 标题下短金线 + 单圆点收口(替代旧双线框/红纸花)
  ctx.strokeStyle = '#d9b36a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(CX-46, ty+66); ctx.lineTo(CX+46, ty+66); ctx.stroke();
  disc(CX, ty+66, 3, '#d9b36a');
  text('—— 奔跑展开的金陵长卷 ——', CX, H*0.44, 17, 'rgba(217,179,106,0.9)');
  text('没有一只鸭子能走出南京——除了我。', CX, H*0.50, 15, 'rgba(246,241,231,0.8)');
  button('adv','冒险模式 · 五关金陵', CX, H*0.62, 320, 54);
  button('endless','无尽模式 · 一路跑到长江大桥', CX, H*0.73, 320, 54, {ghost:true});
  button('album','金陵图鉴 ('+Object.keys(save.album).length+'/'+ITEMS.length+')', CX, H*0.84, 320, 54, {ghost:true});
  text('游戏里的风景,都是真的南京', CX, H-22, 13, 'rgba(246,241,231,0.5)');
}
export function drawLevels(){
  dim(0.55);
  text('选择关卡', CX, 70, 40, '#f7ead0', 'center', 'bold');
  const totalStars = save.stars.reduce((a,b)=>a+b,0);
  const albumFull = Object.keys(save.album).length >= ITEMS.length;
  for(let i=0;i<LEVELS.length;i++){
    const lv = LEVELS[i];
    const unlocked = lv.hidden ? (albumFull && totalStars>=15) : (i===0 || save.cleared[i-1]);
    const x = CX + (i-2.5)*160, y = H*0.48;
    poly([[x-70,y-100],[x+70,y-100],[x+80,y],[x+70,y+110],[x-70,y+110],[x-80,y]], lv.ground); // 卡片不透明
    ctx.strokeStyle = lv.accent; ctx.lineWidth=2; ctx.stroke();
    ctx.globalAlpha = unlocked?1:0.45;
    text(lv.hidden?'★':(i+1)+'', x, y-74, 30, lv.hud, 'center', 'bold');
    text(lv.name, x, y-40, 19, lv.hud, 'center', 'bold');
    text(lv.sub, x, y-14, 11, lv.hud, 'center');
    // 该关小图标
    const p = {s:22};
    drawSide(lv.motif, x, y+52, p.s, lv, false);
    if(unlocked){ stars(save.stars[i], x, y+88, 10); G.buttons.push({id:'lv', x:x-80, y:y-100, w:160, h:210, data:i}); focusRing(G.buttons.length-1, x-80, y-100, 160, 210); }
    else text(lv.hidden?'🔒 图鉴集齐+15星解锁':'🔒 通关前一关解锁', x, y+88, 12, '#cbb');
    ctx.globalAlpha = 1;
  }
  button('back','返回', CX, H-56, 140, 44, {ghost:true});
}
const CRASH_TITLES = ['撞上了!','鸭鸭眼冒金星!','被金陵的墙留下了','差一步就出城了……'];
const DEATH_TIPS = {
  low:'矮墩子要跳过去(↑)',
  high:'高门楼要滑铲钻过去(↓)',
  full:'整堵墙只能换道(←→)',
};
export function drawOver(){
  dim(0.55);
  const got = G.newIds.length;
  text(CRASH_TITLES[Math.floor(G.dist)%CRASH_TITLES.length], CX, H*0.26, 52, '#f7ead0', 'center', 'bold');
  if(G.killedBy && DEATH_TIPS[G.killedBy]) text('小提示:'+DEATH_TIPS[G.killedBy], CX, H*0.35, 15, '#a8d5a2');
  const line = G.mode==='endless'
    ? '跑了 '+Math.floor(G.dist)+' m · 收集 '+G.items+(G.newBest?' · 新纪录!':'')
    : LEVELS[G.lvIdx].name+' · 跑了 '+Math.floor(G.dist)+' m · 收集 '+G.items;
  text(line, CX, H*0.42, 20, '#f0b64c');
  if(got) text('新图鉴:'+G.newIds.map(id=>(ITEMS.find(i=>i.id===id)||{}).name||'').join('、'), CX, H*0.48, 16, '#a8d5a2');
  button('retry','再来一次 (Enter)', CX, H*0.58, 240, 52);
  button('share','分享成绩', CX, H*0.68, 240, 52, {ghost:true});
  button('quit','回主菜单', CX, H*0.78, 240, 52, {ghost:true});
}
function star(x, y, r, on, k){
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = on ? '#f0b64c' : 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  for(let i=0;i<10;i++){
    const a = -Math.PI/2 + i*Math.PI/5, rr = i%2 ? r*0.45 : r;
    ctx[i?'lineTo':'moveTo'](Math.cos(a)*rr, Math.sin(a)*rr);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
export function drawClear(){
  dim(0.5);
  const lv = LEVELS[G.lvIdx];
  text('过关!', CX, H*0.2, 56, '#f7ead0', 'center', 'bold');
  text(lv.sub, CX, H*0.29, 15, '#d8c9a8');
  text(lv.name+' · 收集 '+G.items+' 件金陵风物', CX, H*0.36, 20, '#f0b64c');
  // 星星逐颗弹入
  const n = save.stars[G.lvIdx];
  for(let i=0;i<3;i++){
    const k = clamp((G.stateT-0.35-i*0.25)/0.2, 0, 1);
    if(k>0) star(CX+(i-1)*52, H*0.45, 20, i<n, 1.6-0.6*k);
  }
  if(G.stateT > 1.2) text('收集 8 / 14 / 20 件 = 1 / 2 / 3 星', CX, H*0.52, 13, '#d8c9a8');
  if(G.newIds.length) text('新图鉴:'+G.newIds.map(id=>(ITEMS.find(i=>i.id===id)||{}).name||'').join('、'), CX, H*0.58, 16, '#a8d5a2');
  if(G.lvIdx < LEVELS.length-1){
    const next = LEVELS[G.lvIdx+1];
    const albumFull = Object.keys(save.album).length >= ITEMS.length;
    const totalStars = save.stars.reduce((a,b)=>a+b,0);
    if(!next.hidden || (albumFull && totalStars>=15)) button('next','下一关:'+next.name+' (Enter)', CX, H*0.66, 300, 52);
    else text('图鉴集齐 + 15 星,解锁隐藏关「'+next.name+'」', CX, H*0.66, 16, '#f7ead0');
  } else if(G.lvIdx===LEVELS.length-1) text('你已跑过长江大桥!金陵再也没墙拦得住鸭鸭', CX, H*0.66, 18, '#f7ead0');
  else text('你已跑遍金陵五景!图鉴还在继续等你集齐', CX, H*0.66, 18, '#f7ead0');
  button('share','分享成绩', CX, H*0.75, 240, 52, {ghost:true});
  button('quit','回主菜单', CX, H*0.85, 240, 52, {ghost:true});
}
export function drawAlbum(){
  dim(0.82);
  text('金陵图鉴', CX, 46, 40, '#f7ead0', 'center', 'bold');
  text('鸭子逃亡路上收集的南京记忆 · 游戏里的风景,都是真的南京', CX, 76, 14, '#f0b64c');
  for(let i=0;i<ITEMS.length;i++){
    const it = ITEMS[i], got = !!save.album[it.id];
    const x = CX + (i%4-1.5)*220, y = 140 + Math.floor(i/4)*128;
    ctx.globalAlpha = got?1:0.75;
    drawItemPhoto(it.id, x, y, 26, i%2?-0.06:0.05, !got);
    text(got?it.name:'???', x, y+38, 17, got?'#f7ead0':'#776e85', 'center', 'bold');
    if(got){
      text(it.note, x, y+56, 11, '#d8c9a8');
      text(it.quip, x, y+72, 11, '#f0b64c');
      text(it.where, x, y+88, 11, '#a8d5a2');
    } else {
      text('📍 还没去过…', x, y+56, 11, '#5a5366');
    }
    ctx.globalAlpha = 1;
  }
  text('实景照片来自 Wikimedia Commons,作者与授权见 assets/img/CREDITS.md', CX, H-14, 11, 'rgba(216,201,168,0.55)');
  button('back','返回 (Esc)', W-90, 46, 150, 44, {ghost:true});
}

/* ---- 点击 ---- */
export function clickAt(px, py){
  for(const b of G.buttons){
    if(px>=b.x && px<=b.x+b.w && py>=b.y && py<=b.y+b.h){
      sfx.click(); handleButton(b.id, b.data); return;
    }
  }
}
export function handleButton(id, data){
  if(id==='adv') G.state='levels';
  else if(id==='endless') startRun('endless', 0);
  else if(id==='album'){ G.albumFrom = G.state==='play'?'play':'menu'; G.state='album'; }
  else if(id==='lv') startRun('adv', data);
  else if(id==='back') G.state = G.state==='album' ? G.albumFrom : 'menu';
  else if(id==='retry') startRun(G.mode, G.lvIdx);
  else if(id==='quit'){ G.paused=false; G.state='menu'; }
  else if(id==='resume') G.paused=false;
  else if(id==='next') nextAfterClear();
  else if(id==='share') shareScore();
}
