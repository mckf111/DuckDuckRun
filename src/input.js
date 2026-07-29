import { cv, W, H } from './core.js';
import { save, persist } from './save.js';
import { ac } from './audio.js';
import { G, onLeft, onRight, onJump, onSlide, onPauseKey, onEnter } from './game.js';
import { clickAt, kbNav, kbEnter } from './ui.js';

/* ================= 输入 ================= */
addEventListener('keydown', e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
  if(e.repeat) return;
  const k = e.key.length===1 ? e.key.toLowerCase() : e.key;  // 兼容大写 WASD
  const playing = G.state==='play' && !G.paused;
  if(k==='ArrowLeft'||k==='a'){ playing ? onLeft() : kbNav(-1); }
  else if(k==='ArrowRight'||k==='d'){ playing ? onRight() : kbNav(1); }
  else if(k==='ArrowUp'||k==='w'){ playing ? onJump() : kbNav(-1); }
  else if(k==='ArrowDown'||k==='s'){ playing ? onSlide() : kbNav(1); }
  else if(k===' '){ if(playing) onJump(); }
  else if(k==='p'||k==='Escape') onPauseKey();
  else if(k==='m'){ save.muted=!save.muted; persist(); }
  else if(k==='Enter'){
    if(G.state==='over'||G.state==='clear') onEnter();
    else if(G.state!=='play') kbEnter();
  }
});

// 触屏/鼠标:滑动 = 操作;点击 = 按钮
let tStart = null;
cv.addEventListener('pointerdown', e=>{
  ac(); tStart = {x:e.clientX, y:e.clientY};
  // 记录按下的按钮(按压反馈)
  const r = cv.getBoundingClientRect();
  const px = (e.clientX-r.left)/r.width*W, py = (e.clientY-r.top)/r.height*H;
  G.pressed = null;
  for(const b of G.buttons){
    if(px>=b.x && px<=b.x+b.w && py>=b.y && py<=b.y+b.h){ G.pressed = {id:b.id, data:b.data}; break; }
  }
});
cv.addEventListener('pointerup', e=>{
  G.pressed = null;
  if(!tStart) return;
  const dx = e.clientX - tStart.x, dy = e.clientY - tStart.y;
  tStart = null;
  const r = cv.getBoundingClientRect();
  const thresh = 24 * r.width / W;   // 阈值换算:24 逻辑像素 -> 当前显示尺寸下的 client 像素
  if(Math.hypot(dx,dy) > thresh){ // 滑动
    if(Math.abs(dx) > Math.abs(dy)) (dx>0?onRight():onLeft());
    else (dy<0?onJump():onSlide());
  } else { // 点击 -> 屏幕坐标命中按钮
    const px = (e.clientX-r.left)/r.width*W, py = (e.clientY-r.top)/r.height*H;
    clickAt(px, py);
  }
});
cv.addEventListener('pointercancel', ()=>{ G.pressed = null; tStart = null; });
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && G.state==='play') G.paused=true; });
