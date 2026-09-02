import { ctx, W, H, CX, poly, disc, rrect, petalFlower, clamp } from './core.js';
import { LEVELS, NANJING_SLICE, ITEMS, MILESTONES, SHOPS, RUN_STAR_THRESHOLDS } from './config.js';
import { save, persist, cycleMotionPreference } from './save.js';
import { getBridgeUnlockStatus, getObstacleInstruction } from './rules.js';
import { sfx } from './audio.js';
import { G, curLv, startRun, nextAfterClear, currentSliceCue } from './game.js';
import { drawItemPhoto, hasPhoto, loadItemPhotos } from './art/photo.js';
import { drawItemIcon } from './art/items.js';
import { drawSide } from './art/scenery.js';
import { drawPickupMedallion, drawPowerIcon } from './render.js';
import { shareScore, copyText, shareLink } from './share.js';
import { COPYRIGHT_LINE, CREDIT_SECTIONS, PHOTO_CREDITS, SHOP_DISCLAIMER } from './legal.js';

/* ================= 渲染:UI 组件 ================= */
export function text(str, x, y, size, color, align, weight, soft){
  // 三档字体:soft=书法体大标题(铭心毛笔);≥14px=文楷;<14px 与数字提示=黑体
  const clean = soft==='clean';
  const family = soft===true ? '"JinlingBrush","KaiTi","Microsoft YaHei",serif'
    : '"JinlingKai","Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif';
  ctx.font = (weight && soft!==true ? weight + ' ' : '') + size + 'px ' + family;
  ctx.textAlign = align||'center'; ctx.textBaseline = 'middle';
  // 统一深色描边:任何实景照片背景上都可读;soft=大标题用细淡描边(现代感)
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(clean?1.4:2, size*(soft===true?0.08:clean?0.045:0.16));
  ctx.strokeStyle = soft ? 'rgba(7,17,30,0.44)' : 'rgba(10,8,16,0.6)';
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
  const r = Math.min(14,h/2);
  ctx.shadowColor = 'rgba(2,9,18,0.42)'; ctx.shadowBlur = pressed?4:12; ctx.shadowOffsetY = pressed?2:5;
  if(opts.ghost){  // 次级按钮:黛蓝底 + 湖青描边
    rrect(x-w/2, y-h/2, w, h, r, 'rgba(9,25,43,0.72)', 'rgba(139,207,235,0.48)', 1.4);
  } else {
    const fill = opts.bg || (()=>{
      const g=ctx.createLinearGradient(x-w/2,y-h/2,x+w/2,y+h/2);
      g.addColorStop(0,'#f6df95'); g.addColorStop(1,'#dfa84a'); return g;
    })();
    rrect(x-w/2, y-h/2, w, h, r, fill, 'rgba(255,238,178,0.62)', 1);
    rrect(x-w/2+2, y-h/2+2, w-4, h*0.34, r*0.7, 'rgba(255,255,255,0.13)');
  }
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  text(label, x, y+1, opts.size||20, opts.fg||(opts.ghost||opts.bg?'#f4f7fb':'#17243a'), 'center', 'bold', 'clean');
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
  if(!G.buttons.length || (G.state==='play' && !G.paused)) return;   // L2:暂停菜单也能键盘导航
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

function motionLabel(){ return save.motion==='reduced' ? '动效 · 减弱' : save.motion==='full' ? '动效 · 完整' : '动效 · 跟随系统'; }

function glassPanel(x,y,w,h,r=14){
  ctx.save();
  ctx.shadowColor='rgba(70,40,16,0.28)';ctx.shadowBlur=14;ctx.shadowOffsetY=5;
  rrect(x,y,w,h,r,'rgba(246,236,214,0.90)','rgba(90,54,24,0.45)',1.4);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  rrect(x+1.5,y+1.5,w-3,h*0.34,r-2,'rgba(255,248,230,0.45)');
  ctx.restore();
}

/* ---- HUD ---- */
export function drawHUD(){
  const lv = curLv();
  glassPanel(16,14,154,102);
  const sliceMode=G.mode==='slice';
  text(Math.floor(G.dist)+' m', 30, 38, 24, '#3a2614', 'left', 'bold', 'clean');
  text(sliceMode?NANJING_SLICE.ui.ledgerLabel:'本局鸭蛋', 30, 68, 14, 'rgba(90,54,24,0.62)', 'left', null, 'clean');
  text(String(sliceMode?(G.slice?.tokenCount||0):G.runMarks), 140, 68, 17, '#b86a20', 'right', 'bold', 'clean');
  if(sliceMode){
    disc(31,94,7,'#F4BE57','#3A2614',1);
    text(NANJING_SLICE.ui.nonMainline,47,94,14,'#b86a20','left','bold','clean');
  } else {
    drawPickupMedallion('gold',31,94,7,0);
    text('鸭蛋 '+save.coins, 47, 94, 13, '#b86a20', 'left', 'bold', 'clean');
  }
  if(G.combo >= 2){
    glassPanel(18,124,112,32,10);
    text(G.combo+' 连击', 74, 140, 14, '#b86a20', 'center', 'bold', 'clean');
  }
  // 道具状态(磁铁/金桂剩余秒;护盾小图标)
  let stY = G.combo>=2 ? 176 : 140, stX = 24;
  if(G.powerT.magnet > 0){ text('磁铁 '+Math.ceil(G.powerT.magnet)+'s', stX, stY, 14, '#f0a860', 'left', 'bold'); stY += 22; }
  if(G.powerT.gui > 0){ text('金桂 '+Math.ceil(G.powerT.gui)+'s', stX, stY, 14, '#f0c85a', 'left', 'bold'); stY += 22; }
  if(G.shield){
    disc(stX+8, stY, 8, '#4a8a4a'); disc(stX+8, stY, 8, null, '#7ba86f', 1.5);
    ctx.fillStyle = '#5aa85a'; ctx.beginPath(); ctx.ellipse(stX+8, stY-1, 7, 3, 0, Math.PI, 0); ctx.fill();
    text('护盾', stX+22, stY, 14, '#a8d5a2', 'left', 'bold');
  }
  if(G.mode==='adv' || G.mode==='slice'){
    glassPanel(CX-154,14,308,64);
    const slice = G.mode==='slice';
    text(slice ? (G.slice?.quiet?'◉  ◉  ◉':NANJING_SLICE.ui.displayName) : lv.name, CX, 30, 18, '#3a2614', 'center', 'bold', 'clean');
    if(slice && !G.slice?.quiet) text((G.slice?.config?.label||NANJING_SLICE.modes.standard.label)+' · 灯牌 '+(G.slice?.tokenCount||0), CX, 49, 14, 'rgba(90,54,24,0.70)', 'center', null, 'clean');
    const pw = 266, px = CX-pw/2, py = 61;
    rrect(px,py,pw,6,3,'rgba(255,255,255,0.12)');
    rrect(px,py,pw*clamp(G.dist/lv.len,0,1),6,3,lv.accent);
  } else {
    glassPanel(CX-170,14,340,58);
    text('无尽模式 · 最佳 '+save.best+' m', CX, 32, 17, '#3a2614', 'center', 'bold', 'clean');
    if(G.msIdx < MILESTONES.length)
      text('距「'+MILESTONES[G.msIdx][1]+'」还差 '+Math.max(0,Math.ceil(MILESTONES[G.msIdx][0]-G.dist))+' m', CX, 57, 12, 'rgba(90,54,24,0.62)', 'center', null, 'clean');
  }
  // 右上角:暂停 + 静音按钮(F3 触屏可暂停;M4 移动端可静音)
  if(!G.paused){
    button('mute', save.muted?'♪̶':'♪', W-96, 34, 44, 44, {ghost:true, size:18});
    button('pause','▐▐', W-42, 34, 44, 44, {ghost:true, size:16});
  }
  // 新图鉴即时横幅(右上角,不挡地平线障碍出生点)
  if(G.newItem){
    const it = ITEMS.find(i=>i.id===G.newItem.id);
    const a = clamp(Math.min((2.0-G.newItem.ttl)*5, G.newItem.ttl*2), 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    disc(W-96, 96, 30, 'rgba(27,42,68,0.8)');
    disc(W-96, 96, 30, null, '#e8c170', 1.5);
    drawItemIcon(G.newItem.id, W-96, 96, 22, false);
    text('新图鉴:'+(it?it.name:''), W-96, 132, 15, '#f0b64c', 'center', 'bold');
    ctx.restore();
  }
  // 底部操作提示:开场 5 秒内显示后淡出,暂停时重新出现;触屏设备显示手势
  const hint = ('ontouchstart' in window) ? '左右滑换道  上滑跳  下滑铲  右上角可暂停'
    : '←→换道  ↑跳  ↓滑铲  P暂停  M静音'+(save.muted?'(已静音)':'');
  if(G.tutorial){
    const tw=520,tx=CX-tw/2,ty=H-100;
    glassPanel(tx,ty,tw,76,16);
    text('教学 '+(G.tutorial.step+1)+' / 4',tx+22,ty+22,13,'#8a5a28','left','bold','clean');
    for(let i=0;i<4;i++) disc(tx+tw-86+i*18,ty+22,4,i<=G.tutorial.step?'#d89a3a':'rgba(90,54,24,0.18)');
    text(G.tutorial.tip, CX, ty+50, 17, '#3a2614', 'center', 'bold', 'clean');
  }
  if(G.mode==='slice' && !G.paused && G.t<62 && !G.egg){
    const beat=currentSliceCue();
    const sliceTip=beat?.cue || '中道夜渡 · 收束在前';
    glassPanel(CX-180,H-42,360,34,12);
    text(sliceTip, CX, H-25, 14, '#3A2614', 'center', 'bold', 'clean');
  } else if(!G.tutorial && (G.paused || G.t < 5)){
    ctx.globalAlpha = G.paused ? 1 : clamp(5-G.t, 0, 1);
    text(hint, CX, H-16, 13, lv.hud, 'center');
    ctx.globalAlpha = 1;
  }
  // 彩蛋文案(淡入淡出)
  if(G.egg && G.egg.text){
    const a = clamp(Math.min((G.egg.dur-G.egg.ttl)*4, G.egg.ttl), 0, 1);
    ctx.globalAlpha = a;
    text(G.egg.text, CX, G.tutorial?H-116:H-48, 16, '#f0b64c', 'center', 'bold', 'clean');
    ctx.globalAlpha = 1;
  }
  if(G.paused){
    dim(0.6);
    text('暂 停', CX, H*0.42, 56, '#f4f1e8', 'center', null, true);
    button('resume','继续', CX, H*0.56, 180, 52);
    button('quit','回主菜单', CX, H*0.68, 180, 52, {ghost:true});
  }
}

/* ---- 界面 ---- */
export function drawMenu(){
  dim(0.22);
  const compactTouch = 'ontouchstart' in window && innerHeight <= 480;
  const weixin = /MicroMessenger/i.test(navigator.userAgent);
  const ty = compactTouch ? 102 : H*0.20;
  text('奔跑展开的金陵长卷', CX, compactTouch?38:H*0.07, compactTouch?14:12, 'rgba(174,220,239,0.78)', 'center', 'bold', 'clean');
  ctx.save();
  if('letterSpacing' in ctx) ctx.letterSpacing = '4px';
  text('冲鸭！金陵！', CX, ty, compactTouch?56:68, '#f7f5ee', 'center', 'bold', 'clean');
  ctx.restore();
  ctx.strokeStyle = '#f1c86b'; ctx.lineWidth = 2;
  const ruleY=ty+(compactTouch?42:50);
  ctx.beginPath(); ctx.moveTo(CX-58, ruleY); ctx.lineTo(CX+58, ruleY); ctx.stroke();
  disc(CX, ruleY, 3, '#f1c86b');
  text('一只认真逃跑的白鸭 · 十站金陵 · 四十件风物', CX, compactTouch?188:H*0.36, compactTouch?16:15, 'rgba(228,239,245,0.82)', 'center', null, 'clean');
  if(compactTouch){
    const left=CX-190,right=CX+190,h=62,w=340;
    button('slice',NANJING_SLICE.ui.menuStandard,left,245,w,h,{bg:'#d88a3f',size:17});
    button('sliceEasy',NANJING_SLICE.ui.menuEasy,right,245,w,h,{ghost:true,size:17});
    button('adv','开始冒险',left,318,w,h);
    button('endless','无尽奔跑',right,318,w,h,{ghost:true});
    button('album','风物图鉴 '+Object.keys(save.album).length+'/'+ITEMS.length+(save.albumNew?'  ●':''),left,391,w,h,{ghost:true,size:18});
    button('shop','鸭铺升级 · '+save.coins+' 蛋',right,391,w,h,{ghost:true,size:18});
    text(COPYRIGHT_LINE,CX,weixin?430:444,12,'rgba(211,230,240,0.56)','center',null,'clean');
    button('tutorial','重玩教学',160,500,260,h,{ghost:true,size:17});
    button('motion',motionLabel(),CX,500,260,h,{ghost:true,size:16});
    button('credits','素材与授权',W-160,500,260,h,{ghost:true,size:17});
  }else{
    button('slice',NANJING_SLICE.ui.menuStandard,CX-92,H*0.45,270,44,{bg:'#d88a3f'});
    button('sliceEasy',NANJING_SLICE.ui.menuEasy,CX+220,H*0.45,170,44,{ghost:true,size:14});
    button('adv','开始冒险',CX,H*0.54,224,46);
    button('endless','无尽奔跑',CX,H*0.63,224,44,{ghost:true});
    button('album','风物图鉴 '+Object.keys(save.album).length+'/'+ITEMS.length+(save.albumNew?'  ●':''),CX,H*0.72,224,44,{ghost:true});
    button('shop','鸭铺升级 · '+save.coins+' 蛋',CX,H*0.81,224,44,{ghost:true});
    text(COPYRIGHT_LINE,CX,H-50,11,'rgba(211,230,240,0.48)','center',null,'clean');
    button('tutorial','重玩教学',90,H-18,140,32,{ghost:true,size:14});
    button('motion',motionLabel(),CX,H-18,164,32,{ghost:true,size:13});
    button('credits','素材与授权',W-90,H-18,150,32,{ghost:true,size:14});
  }
  if(!G.kbActive){
    const primary=G.buttons.findIndex(entry=>entry.id==='adv');
    if(primary>=0) G.kbSel=primary;
  }
  // F6:微信内提示绕开内置浏览器限制(下载/分享被吞)
  if(weixin)
    text('微信内体验有限:点右上角 ··· → 在浏览器打开', CX, compactTouch?450:H-70, 12, 'rgba(246,241,231,0.42)');
}
/* 长文案自动缩字号,保证不溢出容器 */
function fitSize(str, maxW, base){
  let s = base;
  for(; s > 9; s--){
    ctx.font = s + 'px "JinlingKai","KaiTi","Microsoft YaHei",serif';
    if(ctx.measureText(str).width <= maxW) break;
  }
  return s;
}

/* 选关 = 赶路站牌:每关一张「第 N 站」站牌,实色名条保证站名永远清晰 */
export function drawLevels(){
  dim(0.4);
  text('选 择 路 线', CX, 44, 32, '#f4f1e8', 'center', 'bold');
  const totalStars = save.stars.reduce((a,b)=>a+b,0);
  const albumN = Object.keys(save.album).length;
  text('已集风物 '+albumN+' / '+ITEMS.length+' · 总星 '+totalStars, CX, 72, 13, 'rgba(232,193,112,0.9)');
  const n = LEVELS.length;
  const bridgeStatus = getBridgeUnlockStatus(save);
  const cols = n <= 6 ? n : 5;
  const rows = Math.ceil(n / cols);
  const gap = 10;
  const cw = Math.min(176, (W - 48 - (cols-1)*gap) / cols);
  const ch = rows > 1 ? 178 : 214;
  const x0 = CX - (cols*cw + (cols-1)*gap) / 2;
  const y0 = rows > 1 ? 94 : 118;
  for(let i=0;i<n;i++){
    const lv = LEVELS[i];
    const unlocked = lv.hidden ? bridgeStatus.unlocked : (i===0 || save.cleared[i-1]);
    const cx0 = x0 + (i%cols)*(cw+gap), cy0 = y0 + Math.floor(i/cols)*(ch+gap);
    const bandY = cy0 + Math.round(ch*0.52), bandH = 28;
    // 站牌底:上半该关天色,下半黛蓝面板
    const g = ctx.createLinearGradient(0, cy0, 0, bandY);
    g.addColorStop(0, lv.sky[0]); g.addColorStop(1, lv.sky[1]);
    rrect(cx0, cy0, cw, ch, 10, '#1b2a44');
    ctx.save(); ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(cx0, cy0, cw, bandY-cy0, [10,10,0,0]); else ctx.rect(cx0, cy0, cw, bandY-cy0);
    ctx.clip(); ctx.fillStyle = g; ctx.fillRect(cx0, cy0, cw, bandY-cy0);
    drawSide(lv.motif, cx0+cw/2, bandY-4, 14, lv, false);   // 天色里的母题小景
    ctx.restore();
    // 实色名条:站名压在上面,任何天色都清楚
    ctx.fillStyle = lv.side; ctx.fillRect(cx0, bandY, cw, bandH);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(cx0, bandY, cw, 2);
    text(lv.hidden && !unlocked ? '???' : lv.name, cx0+cw/2, bandY+bandH/2+1, 19, lv.textDark?'#274a6b':'#f4f1e8', 'center', 'bold');
    // 眉标:第 N 站(隐藏关是谜)
    text(lv.hidden ? '第 ? 站' : '第 '+(i+1)+' 站', cx0+cw/2, cy0+16, 13, lv.accent, 'center');
    if(unlocked){
      text(lv.sub, cx0+cw/2, bandY+bandH+22, fitSize(lv.sub, cw-12, 11), 'rgba(244,241,232,0.72)', 'center');
      stars(save.stars[i], cx0+cw/2, cy0+ch-22, 9);
    } else {
      const riddle = lv.hidden ? '九站走遍,星与风物皆有凭' : lv.sub;
      const lock = lv.hidden
        ? '🔒 前九关 · '+bridgeStatus.starCount+'/15 星 · '+bridgeStatus.ordinaryCount+'/28 风物'
        : '🔒 通关「'+LEVELS[i-1].name+'」解锁';
      text(riddle, cx0+cw/2, bandY+bandH+20, fitSize(riddle, cw-12, 11), 'rgba(232,193,112,0.75)', 'center');
      text(lock, cx0+cw/2, cy0+ch-20, fitSize(lock, cw-12, 12), 'rgba(244,241,232,0.78)');
      // 锁定压暗(名条除外,留个念想)
      ctx.fillStyle = 'rgba(13,16,28,0.5)';
      ctx.fillRect(cx0, cy0+2, cw, bandY-cy0-2);
      ctx.fillRect(cx0, bandY+bandH, cw, ch-bandH-(bandY-cy0)-2);
    }
    ctx.strokeStyle = unlocked ? lv.accent : 'rgba(127,170,200,0.35)';
    ctx.lineWidth = unlocked ? 1.6 : 1;
    rrect(cx0, cy0, cw, ch, 10, null, ctx.strokeStyle, ctx.lineWidth);
    if(unlocked){
      G.buttons.push({id:'lv', x:cx0, y:cy0, w:cw, h:ch, data:i});
      focusRing(G.buttons.length-1, cx0, cy0, cw, ch);
    }
  }
  button('back','返回', CX, H-42, 140, 44, {ghost:true});
}

/* 鸭铺:三张价目牌(站牌风格统一:黛蓝卡 + 实色名条),花铜钱升级;满级「已精通」 */
export function drawShop(){
  dim(0.42);
  text('鸭 铺', CX, 46, 40, '#f4f1e8', 'center', null, true);
  text('◉ '+save.coins+' · 花鸭蛋把手艺学到精通 · 星级与障碍数值一律不动', CX, 80, 14, 'rgba(232,193,112,0.9)');
  if(G.shopFeedback){
    const msg=G.shopFeedback.type==='success'?'升级成功 · -'+G.shopFeedback.spent+' 枚':'还差 '+G.shopFeedback.missing+' 枚';
    text(msg,CX,103,14,G.shopFeedback.type==='success'?'#a8d5a2':'#f0a080','center','bold');
  }
  const cw = 250, ch = 268, gap = 20;
  const x0 = CX - (cw*3 + gap*2) / 2, y0 = 116;
  const NAMEC = { magnet:'#b8533f', gui:'#b8934a', spawn:'#3f6e8c' };
  for(let i=0;i<SHOPS.length;i++){
    const s = SHOPS[i], lvl = save.ups[s.id], maxed = lvl >= 3;
    const cx = x0 + i*(cw+gap);
    const feedback=G.shopFeedback&&G.shopFeedback.index===i?G.shopFeedback:null;
    ctx.save();
    if(feedback){
      const age=1.2-feedback.ttl;
      if(feedback.type==='success'){
        const scale=1+Math.sin(Math.min(1,age/0.35)*Math.PI)*0.055;
        ctx.translate(cx+cw/2,y0+ch/2);ctx.scale(scale,scale);ctx.translate(-cx-cw/2,-y0-ch/2);
      }else ctx.translate(Math.sin(age*45)*5,0);
    }
    rrect(cx, y0, cw, ch, 10, '#1b2a44');
    rrect(cx, y0, cw, ch, 10, null, 'rgba(232,193,112,0.5)', 1.4);
    // 实色名条
    ctx.fillStyle = NAMEC[s.id]; ctx.fillRect(cx, y0, cw, 34);
    text(s.name, cx+cw/2, y0+18, 19, '#f4f1e8', 'center', 'bold');
    // 图标 + 效果说明
    drawPowerIcon(s.icon, cx+cw/2, y0+78, 22);
    text(s.line, cx+cw/2, y0+124, 13, 'rgba(244,241,232,0.72)');
    text('Lv.'+lvl+' · '+s.levels[lvl], cx+cw/2, y0+148, 16, lvl ? '#f0c85a' : 'rgba(244,241,232,0.55)', 'center', 'bold');
    text(s.note, cx+cw/2, y0+172, 12, 'rgba(232,193,112,0.7)');
    // 购买/已精通
    if(maxed){
      rrect(cx+cw/2-70, y0+196, 140, 44, 22, 'rgba(232,193,112,0.16)');
      text('已 精 通', cx+cw/2, y0+219, 16, '#e8c170', 'center', 'bold');
    } else {
      const afford = save.coins >= s.price[lvl];
      button('buy', '◉ '+s.price[lvl]+' 升级', cx+cw/2, y0+218, 150, 44, {bg: afford ? '#d85c47' : 'rgba(216,92,71,0.4)', data:i});
    }
    // 升级预览:下一级效果
    if(!maxed){
      text('下一级 · '+s.levels[lvl+1], cx+cw/2, y0+252, 11, 'rgba(244,241,232,0.45)');
    }
    ctx.restore();
  }
  button('back','返回', CX, H-40, 140, 44, {ghost:true});
}

export function drawOver(){
  dim(0.28);
  const got = G.newIds.length;
  text(G.crashLine || '墙说不行。鸭说再试。', CX, H*0.22, 46, '#f6edd4', 'center', null, true);
  const deathTip=getObstacleInstruction(G.killedBy,'ontouchstart' in window);
  if(deathTip) text(deathTip, CX, H*0.33, 13, 'rgba(246,237,212,0.55)');
  const line = G.mode==='endless'
    ? '跑了 '+Math.floor(G.dist)+' m · 鸭蛋 '+G.runMarks+(G.newBest?' · 新纪录!':'')
    : G.mode==='slice'
      ? NANJING_SLICE.ui.displayName+' · 跑了 '+Math.floor(G.dist)+' m · 灯牌 '+(G.slice?.tokenCount||0)+' · 距收束 '+Math.max(0,Math.ceil(curLv().len-G.dist))+' m'
      : LEVELS[G.lvIdx].name+' · 跑了 '+Math.floor(G.dist)+' m · 鸭蛋 '+G.runMarks+' · 距终点还差 '+Math.max(0,Math.ceil(LEVELS[G.lvIdx].len-G.dist))+' m';
  text(line, CX, H*0.40, 18, '#e8c170');
  if(got) text('新图鉴:'+G.newIds.map(id=>(ITEMS.find(i=>i.id===id)||{}).name||'').join('、'), CX, H*0.46, 16, '#a8d5a2');
  if(G.newIds.some(id=>ITEMS.find(i=>i.id===id)?.secret)) text('隐藏风物现身!', CX, H*0.51, 15, '#f0b64c', 'center', 'bold');
  button('retry',G.mode==='slice'?'再跑一趟 (Enter)':'起来再跑 (Enter)', CX, H*0.50, 240, 50);
  button('share','分享成绩', CX-115, H*0.61, 210, 46, {ghost:true});
  button('copy','复制链接', CX+115, H*0.61, 210, 46, {ghost:true});
  button('quit','回主菜单', CX, H*0.72, 240, 46, {ghost:true});
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
  const lv = curLv();
  const slice = G.mode==='slice';
  text(slice?NANJING_SLICE.ui.finishTitle:'过关!', CX, H*0.2, 58, '#f4f1e8', 'center', null, true);
  text(slice?NANJING_SLICE.ui.finishSub:lv.sub, CX, H*0.29, 15, '#d8c9a8');
  text(slice?NANJING_SLICE.ui.displayName+' · 灯牌 '+(G.slice?.tokenCount||0):lv.name+' · 本局拾取 '+G.runMarks+' 枚鸭蛋', CX, H*0.36, 20, '#f0b64c');
  // 星星逐颗弹入
  const n = G.runStars;
  for(let i=0;i<3;i++){
    const k = clamp((G.stateT-0.35-i*0.25)/0.2, 0, 1);
    if(k>0) star(CX+(i-1)*52, H*0.45, 20, i<n, 1.6-0.6*k);
  }
  if(G.stateT > 1.2){
    if(slice){
      text((G.slice?.easy?NANJING_SLICE.modes.easy.label+'模式 · 灯影护航':NANJING_SLICE.modes.standard.label+'模式 · 路线取舍完成')+' · 不写入主线进度', CX, H*0.53, 15, '#f7ead0', 'center', 'bold');
      text('行旅小笺 · '+(G.slice?.routeName||'月影左线')+'：三道瓮城的门序，跑成今晚的一小段夜渡。', CX, H*0.575, 13, '#d8c9a8');
    }
    else {
      text('本局 '+G.runStars+' 星 · 历史最佳 '+save.stars[G.lvIdx]+' 星', CX, H*0.515, 15, '#f7ead0', 'center', 'bold');
      text('鸭蛋 '+RUN_STAR_THRESHOLDS.join(' / ')+' = 1 / 2 / 3 星', CX, H*0.555, 13, '#d8c9a8');
    }
  }
  if(G.newIds.length) text('新图鉴:'+G.newIds.map(id=>(ITEMS.find(i=>i.id===id)||{}).name||'').join('、'), CX, H*0.58, 16, '#a8d5a2');
  if(G.newIds.some(id=>ITEMS.find(i=>i.id===id)?.secret)) text('隐藏风物现身!', CX, H*0.63, 15, '#f0b64c', 'center', 'bold');
  if(slice) button('next','再跑一趟 (Enter)', CX, H*0.68, 300, 52);
  else if(G.lvIdx < LEVELS.length-1){
    const next = LEVELS[G.lvIdx+1];
    const bridgeStatus = getBridgeUnlockStatus(save);
    if(!next.hidden || bridgeStatus.unlocked) button('next','下一关:'+next.name+' (Enter)', CX, H*0.66, 300, 52);
    else text('前九关通关 + 15 星 + 28/34 普通风物,解锁「'+next.name+'」', CX, H*0.66, 15, '#f7ead0');
  } else if(G.lvIdx===LEVELS.length-1) text('你已跑过长江大桥!金陵再也没墙拦得住鸭鸭', CX, H*0.66, 18, '#f7ead0');
  else text('你已跑遍金陵十景!图鉴还在继续等你集齐', CX, H*0.66, 18, '#f7ead0');
  button('share','分享成绩', CX-115, H*0.76, 210, 52, {ghost:true});
  button('copy','复制链接', CX+115, H*0.76, 210, 52, {ghost:true});
  button('quit','回主菜单', CX, H*0.86, 240, 52, {ghost:true});
}
export function drawAlbum(){
  dim(0.82);
  text('金陵风物谱', CX, 44, 38, '#f6f1e7', 'center', 'bold', true);
  const albumN = Object.keys(save.album).length;
  const secretN = ITEMS.filter(i=>i.secret && save.album[i.id]).length;
  const secretAll = ITEMS.filter(i=>i.secret).length;
  text('已集 '+albumN+' / '+ITEMS.length+' · 隐藏 '+secretN+' / '+secretAll, CX, 76, 14, 'rgba(217,179,106,0.9)');
  // 纵向滚动列表:四部印章式部头 + 部内条目(6 列),位置记忆不重排
  const COLS = 6, CW = 86, ROW = 82, HEAD = 52;
  const cats = [
    { head:'食', name:'食之属', list:ITEMS.filter(i=>i.cat==='food') },
    { head:'工', name:'工之艺', list:ITEMS.filter(i=>i.cat==='craft') },
    { head:'迹', name:'迹之忆', list:ITEMS.filter(i=>i.cat==='ruin') },
    { head:'灵', name:'生之灵', list:ITEMS.filter(i=>i.cat==='creature') },
  ];
  let rows = 0; for(const c of cats) rows += Math.ceil(c.list.length / COLS);
  const contentH = cats.length * HEAD + rows * ROW;
  const maxScroll = Math.max(0, contentH - (H - 150));
  G.albumScroll = Math.min(Math.max(0, G.albumScroll||0), maxScroll);
  ctx.save(); ctx.translate(0, -G.albumScroll);
  let y = 112;
  for(const c of cats){
    // 部头:朱砂方章 + 部名
    rrect(CX - 170, y, 34, 34, 6, '#d85c47');
    text(c.head, CX - 153, y + 18, 20, '#f4f1e8', 'center', 'bold');
    text(c.name + ' · '+c.list.filter(i=>save.album[i.id]).length+' / '+c.list.length, CX - 128, y + 18, 16, '#f0c85a', 'left');
    ctx.strokeStyle = 'rgba(232,193,112,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(CX - 122, y + 26); ctx.lineTo(CX + 170, y + 26); ctx.stroke();
    y += HEAD;
    for(let i=0;i<c.list.length;i++){
      const it = c.list[i], got = !!save.album[it.id];
      const x = CX - 250 + (i%COLS)*CW, yy = y + Math.floor(i/COLS)*ROW + 20;
      disc(x, yy, 23, got ? 'rgba(27,42,68,0.9)' : 'rgba(20,28,46,0.9)');
      disc(x, yy, 23, null, got ? '#e8c170' : 'rgba(127,170,200,0.4)', got?1.4:1);
      drawItemIcon(it.id, x, yy, got ? 16 : 15, !got);
      text(got ? it.name : (it.secret ? '???' : '???'), x, yy + 34, 12, got?'#f4f1e8':'#6a6a78', 'center', 'bold');
      // 隐藏未达成:灰色谜面小字(给玩家留线索)
      if(!got && it.secret && it.riddle){
        text(it.riddle, x, yy + 50, 9, 'rgba(216,201,168,0.5)', 'center');
      }
      if(got && !G.albumZoom){
        const by = yy - 34 - G.albumScroll;   // 按钮用屏幕坐标(点击判定不随滚动)
        G.buttons.push({id:'item', x:x-40, y:by, w:80, h:76, data:it.id});
        focusRing(G.buttons.length-1, x-40, by, 80, 76);
      }
    }
    y += Math.ceil(c.list.length / COLS) * ROW;
  }
  ctx.restore();
  if(maxScroll > 0){   // 滚动提示条
    text('↑ 滚轮 / 上下拖动 ↑', CX, H - 34, 12, 'rgba(216,201,168,0.6)');
  }
  text(SHOP_DISCLAIMER, CX, H-28, 11, 'rgba(216,201,168,0.55)');
  text('照片作者与许可证见「素材与授权」', CX, H-14, 11, 'rgba(216,201,168,0.45)');
  button('back','返回 (Esc)', W-90, 46, 150, 44, {ghost:true});
  if(G.albumZoom) drawAlbumZoom();
}

/* 图鉴放大层:大插画 + 完整文案;有实拍(hasPhoto)的条目右侧附「实景对照」小拍立得 */
function drawAlbumZoom(){
  const it = ITEMS.find(i=>i.id===G.albumZoom);
  if(!it){ G.albumZoom = null; return; }
  G.buttons.push({id:'zoomclose', x:0, y:0, w:W, h:H});
  dim(0.88);
  const hasReal = hasPhoto('it_'+it.id);
  const ix = hasReal ? CX-190 : CX;   // 有实景对照时大插画左移,给拍立得让位
  disc(ix, H*0.36, 88, 'rgba(27,42,68,0.92)');
  disc(ix, H*0.36, 88, null, '#e8c170', 2);
  drawItemIcon(it.id, ix, H*0.36, 64, false);
  text(it.name, CX, H*0.72, 34, '#f6f1e7', 'center', 'bold', true);
  text(it.note, CX, H*0.775, 14, '#d8c9a8');
  text(it.quip, CX, H*0.825, 14, '#f0b64c');
  text(it.where, CX, H*0.875, 13, '#a8d5a2');
  text(SHOP_DISCLAIMER, CX, H-36, 11, 'rgba(216,201,168,0.5)');
  if(hasReal){
    drawItemPhoto(it.id, CX+190, H*0.36, 62, 0.04, false);
    text('实景对照', CX+190, H*0.62, 13, 'rgba(216,201,168,0.75)');
  }
  text('点击任意处关闭', CX, H-18, 12, 'rgba(246,241,231,0.55)');
}

function wrapLine(str, maxW, size){
  ctx.font = size + 'px "JinlingKai","KaiTi","Microsoft YaHei",serif';
  if(ctx.measureText(str).width <= maxW) return [str];
  const out = [];
  let line = '';
  for(const ch of str){
    const next = line + ch;
    if(ctx.measureText(next).width > maxW && line){ out.push(line); line = ch; }
    else line = next;
  }
  if(line) out.push(line);
  return out;
}

/* 素材与授权:玩家不用翻仓库就能看到版权口径和照片署名 */
export function drawCredits(){
  dim(0.82);
  text('素材与授权', CX, 40, 34, '#f6f1e7', 'center', 'bold', true);
  text(COPYRIGHT_LINE, CX, 70, 13, 'rgba(232,193,112,0.9)');
  const lines = [];
  for(const section of CREDIT_SECTIONS){
    lines.push({ kind:'h', text:section.title });
    for(const body of section.lines) lines.push({ kind:'p', text:body });
  }
  lines.push({ kind:'h', text:'照片署名' });
  for(const [id, name, author, license] of PHOTO_CREDITS)
    lines.push({ kind:'p', text:id+' · '+name+' · '+author+' · '+license });
  const maxW = 760;
  const packed = [];
  for(const line of lines){
    if(line.kind==='h') packed.push(line);
    else for(const piece of wrapLine(line.text, maxW, 14)) packed.push({ kind:'p', text:piece });
  }
  const contentH = packed.length * 22 + 40;
  const maxScroll = Math.max(0, contentH - (H - 130));
  G.creditsScroll = Math.min(Math.max(0, G.creditsScroll||0), maxScroll);
  ctx.save();
  ctx.beginPath(); ctx.rect(80, 88, W-160, H-150); ctx.clip();
  ctx.translate(0, -G.creditsScroll);
  let y = 108;
  for(const line of packed){
    if(line.kind==='h'){
      y += 10;
      text(line.text, CX, y, 16, '#f0c85a', 'center', 'bold', 'clean');
    } else {
      text(line.text, CX, y, 14, 'rgba(244,241,232,0.82)', 'center', null, 'clean');
    }
    y += 22;
  }
  ctx.restore();
  if(maxScroll > 0) text('↑ 滚轮 / 上下拖动 ↑', CX, H-38, 12, 'rgba(216,201,168,0.6)');
  button('back','返回 (Esc)', CX, H-22, 150, 40, {ghost:true,size:14});
}

/* ---- 点击 ---- */
export function clickAt(px, py){
  // 后绘制的按钮在视觉顶层，必须先命中（图鉴遮罩优先于下方卡片）。
  for(let i=G.buttons.length-1;i>=0;i--){
    const b = G.buttons[i];
    if(px>=b.x && px<=b.x+b.w && py>=b.y && py<=b.y+b.h){
      sfx.click(); handleButton(b.id, b.data); return;
    }
  }
}
export function handleButton(id, data){
  if(id==='adv') G.state='levels';
  else if(id==='slice') startRun('slice',0,false,{easy:false});
  else if(id==='sliceEasy') startRun('slice',0,false,{easy:true});
  else if(id==='tutorial') startRun('adv',0,true);
  else if(id==='endless') startRun('endless', 0);
  else if(id==='shop'){ G.shopFeedback=null; G.state='shop'; }
  else if(id==='buy'){   // 鸭铺购买:钱够扣钱升级,不够给提示
    const s = SHOPS[data], lvl = save.ups[s.id];
    if(lvl >= 3) return;
    if(save.coins >= s.price[lvl]){
      const spent=s.price[lvl];save.coins -= spent; save.ups[s.id]++;
      persist(); sfx.gate();
      G.shopFeedback={type:'success',index:data,spent,ttl:1.2};
    } else {
      G.shopFeedback={type:'fail',index:data,missing:s.price[lvl]-save.coins,ttl:1.2};
      sfx.click();
    }
  }
  else if(id==='credits'){ G.creditsScroll=0; G.state='credits'; }
  else if(id==='album'){ G.albumFrom='menu'; G.albumZoom=null; G.state='album';
    loadItemPhotos(ITEMS.filter(i=>i.photo).map(i=>i.id));   // 只请求 config 标记的 18 张实景照片
    if(save.albumNew){ save.albumNew=false; persist(); }   // 隐藏件红点看完即清
  }
  else if(id==='item') G.albumZoom = data;
  else if(id==='zoomclose') G.albumZoom = null;
  else if(id==='lv') startRun('adv', data);
  else if(id==='back'){ G.albumZoom=null; G.state = G.state==='album' ? G.albumFrom : 'menu'; }
  else if(id==='retry') startRun(G.mode, G.lvIdx);
  else if(id==='quit'){ G.paused=false; G.state='menu'; }
  else if(id==='resume') G.paused=false;
  else if(id==='pause') G.paused=true;
  else if(id==='mute'){ save.muted=!save.muted; persist(); }
  else if(id==='motion') cycleMotionPreference();
  else if(id==='next') nextAfterClear();
  else if(id==='share') shareScore();
  else if(id==='copy'){
    const dist = Math.floor(G.dist), albumN = Object.keys(save.album).length;
    copyText('我在《冲鸭！金陵！》跑了 '+dist+' m,集齐 '+albumN+'/'+ITEMS.length+' 件金陵风物!这只鸭已经跑遍南京。 '+shareLink());
  }
}
