import { ctx, W, H, CX, poly, disc, petalFlower, clamp } from './core.js';
import { LEVELS, ITEMS } from './config.js';
import { save } from './save.js';
import { sfx } from './audio.js';
import { G, curLv, startRun, nextAfterClear } from './game.js';
import { drawItemIcon } from './art/items.js';
import { drawSide } from './art/scenery.js';

/* ================= 渲染:UI 组件 ================= */
export function text(str, x, y, size, color, align, weight){
  ctx.font = (weight ? weight + ' ' : '') + size + 'px "Microsoft YaHei","PingFang SC",sans-serif';
  ctx.textAlign = align||'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}
export function button(id, label, x, y, w, h, opts){
  opts = opts||{};
  G.buttons.push({ id, x:x-w/2, y:y-h/2, w, h, data:opts.data });
  ctx.globalAlpha = opts.disabled ? 0.45 : 1;
  const bg = opts.bg || '#c8342e';
  poly([[x-w/2+8,y-h/2],[x+w/2-8,y-h/2],[x+w/2,y],[x+w/2-8,y+h/2],[x-w/2+8,y+h/2],[x-w/2,y]], bg);
  ctx.strokeStyle = '#f0b64c'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x-w/2+8,y-h/2); ctx.lineTo(x+w/2-8,y-h/2); ctx.lineTo(x+w/2,y);
  ctx.lineTo(x+w/2-8,y+h/2); ctx.lineTo(x-w/2+8,y+h/2); ctx.lineTo(x-w/2,y); ctx.closePath(); ctx.stroke();
  text(label, x, y+1, opts.size||22, '#f7ead0', 'center', 'bold');
  ctx.globalAlpha = 1;
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
  drawItemIcon('plum', 34, 66, 11, false);
  text('× '+G.items, 52, 66, 20, lv.hud, 'left', 'bold');
  if(G.mode==='adv'){
    text(lv.name, CX, 30, 22, lv.hud, 'center', 'bold');
    // 进度条
    const pw = 260, px = CX-pw/2, py = 48;
    ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(px, py, pw, 6);
    ctx.fillStyle=lv.accent; ctx.fillRect(px, py, pw*clamp(G.dist/lv.len,0,1), 6);
  } else {
    text('无尽模式 · 最佳 '+save.best+' m', CX, 30, 20, lv.hud, 'center', 'bold');
  }
  text('←→换道  ↑跳  ↓滑铲  P暂停  M静音'+(save.muted?'(已静音)':''), CX, H-16, 13, lv.hud, 'center');
  // 彩蛋文案(淡入淡出)
  if(G.egg){
    const a = clamp(Math.min((G.egg.dur-G.egg.ttl)*4, G.egg.ttl), 0, 1);
    ctx.globalAlpha = a;
    text(G.egg.text, CX, H-48, 16, '#f0b64c', 'center', 'bold');
    ctx.globalAlpha = 1;
  }
  if(G.paused){
    dim(0.6);
    text('暂 停', CX, H*0.42, 54, '#f7ead0', 'center', 'bold');
    button('resume','继续', CX, H*0.56, 180, 52);
    button('quit','回主菜单', CX, H*0.68, 180, 52, {bg:'#5a4a6b'});
  }
}

/* ---- 界面 ---- */
export function drawMenu(){
  dim(0.25);
  // 标题剪纸章
  text('金陵快跑', CX, H*0.26, 78, '#f7ead0', 'center', 'bold');
  ctx.strokeStyle='#f0b64c'; ctx.lineWidth=3;
  ctx.strokeRect(CX-190, H*0.26-52, 380, 104);
  text('—— 奔跑展开的金陵长卷 ——', CX, H*0.38, 18, '#f0b64c');
  petalFlower(CX-230, H*0.26, 16, '#e2483d'); petalFlower(CX+230, H*0.26, 16, '#e2483d');
  button('adv','冒险模式 · 五关金陵', CX, H*0.52, 300, 54);
  button('endless','无尽模式 · 最佳 '+save.best+' m', CX, H*0.64, 300, 54, {bg:'#8a3b34'});
  button('album','金陵图鉴 ('+Object.keys(save.album).length+'/'+ITEMS.length+')', CX, H*0.76, 300, 54, {bg:'#3a5a6b'});
  text('南京城市主题 · 国风剪纸跑酷 · 全部画面由代码实时绘制', CX, H-24, 13, 'rgba(247,234,208,0.7)');
}
export function drawLevels(){
  dim(0.55);
  text('选择关卡', CX, 70, 40, '#f7ead0', 'center', 'bold');
  for(let i=0;i<5;i++){
    const x = CX + (i-2)*180, y = H*0.48, unlocked = i===0 || save.stars[i-1] > 0;
    const lv = LEVELS[i];
    ctx.globalAlpha = unlocked?1:0.45;
    poly([[x-78,y-100],[x+78,y-100],[x+88,y],[x+78,y+110],[x-78,y+110],[x-88,y]], lv.ground);
    ctx.strokeStyle = lv.accent; ctx.lineWidth=2; ctx.stroke();
    text((i+1)+'', x, y-74, 30, lv.hud, 'center', 'bold');
    text(lv.name, x, y-38, 19, lv.hud, 'center', 'bold');
    // 该关小图标
    const p = {s:26};
    drawSide(lv.motif, x, y+52, p.s, lv, false);
    if(unlocked){ stars(save.stars[i], x, y+86, 11); G.buttons.push({id:'lv', x:x-88, y:y-100, w:176, h:210, data:i}); }
    else text('🔒 通关前一关解锁', x, y+86, 12, '#cbb');
    ctx.globalAlpha = 1;
  }
  button('back','返回', CX, H-56, 140, 44, {bg:'#5a4a6b'});
}
export function drawOver(){
  dim(0.55);
  const got = G.newIds.length;
  text('撞上了!', CX, H*0.3, 52, '#f7ead0', 'center', 'bold');
  const line = G.mode==='endless'
    ? '跑了 '+Math.floor(G.dist)+' m · 收集 '+G.items+(Math.floor(G.dist)>=save.best?' · 新纪录!':'')
    : LEVELS[G.lvIdx].name+' · 跑了 '+Math.floor(G.dist)+' m · 收集 '+G.items;
  text(line, CX, H*0.4, 20, '#f0b64c');
  if(got) text('新图鉴:'+G.newIds.map(id=>ITEMS.find(i=>i.id===id).name).join('、'), CX, H*0.46, 16, '#a8d5a2');
  button('retry','再来一次 (Enter)', CX, H*0.58, 240, 52);
  button('quit','回主菜单', CX, H*0.7, 240, 52, {bg:'#5a4a6b'});
}
export function drawClear(){
  dim(0.5);
  text('过关!', CX, H*0.24, 56, '#f7ead0', 'center', 'bold');
  text(LEVELS[G.lvIdx].name+' · 收集 '+G.items+' 件金陵风物', CX, H*0.33, 20, '#f0b64c');
  stars(save.stars[G.lvIdx], CX, H*0.44, 20);
  if(G.newIds.length) text('新图鉴:'+G.newIds.map(id=>ITEMS.find(i=>i.id===id).name).join('、'), CX, H*0.53, 16, '#a8d5a2');
  if(G.lvIdx<4) button('next','下一关:'+LEVELS[G.lvIdx+1].name+' (Enter)', CX, H*0.64, 300, 52);
  else text('你已跑遍金陵五景!图鉴还在继续等你集齐', CX, H*0.64, 18, '#f7ead0');
  button('quit','回主菜单', CX, H*0.76, 240, 52, {bg:'#5a4a6b'});
}
export function drawAlbum(){
  dim(0.82);
  text('金陵图鉴', CX, 56, 40, '#f7ead0', 'center', 'bold');
  text('跑酷途中收集的风物,点亮即永久收录', CX, 92, 15, '#f0b64c');
  for(let i=0;i<ITEMS.length;i++){
    const it = ITEMS[i], got = !!save.album[it.id];
    const x = CX + (i%3-1)*260, y = 190 + Math.floor(i/3)*160;
    ctx.globalAlpha = got?1:0.6;
    disc(x, y-24, 40, got?'rgba(200,52,46,0.25)':'rgba(255,255,255,0.06)', got?'#f0b64c':'#555', 2);
    drawItemIcon(it.id, x, y-24, 26, !got);
    text(got?it.name:'???', x, y+30, 20, got?'#f7ead0':'#776e85', 'center', 'bold');
    text(got?it.note:'还未收集到…', x, y+56, 12, got?'#d8c9a8':'#5a5366');
    ctx.globalAlpha = 1;
  }
  button('back','返回 (Esc)', CX, H-48, 180, 44, {bg:'#5a4a6b'});
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
}
