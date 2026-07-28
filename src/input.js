import { cv, W, H } from './core.js';
import { save, persist } from './save.js';
import { ac } from './audio.js';
import { G, onLeft, onRight, onJump, onSlide, onPauseKey, onEnter } from './game.js';
import { clickAt } from './ui.js';

/* ================= 输入 ================= */
const keys = {};
addEventListener('keydown', e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
  if(!e.repeat){
    const k = e.key;
    if(k==='ArrowLeft'||k==='a') onLeft();
    else if(k==='ArrowRight'||k==='d') onRight();
    else if(k==='ArrowUp'||k===' '||k==='w') onJump();
    else if(k==='ArrowDown'||k==='s') onSlide();
    else if(k==='p'||k==='P'||k==='Escape') onPauseKey();
    else if(k==='m'||k==='M'){ save.muted=!save.muted; persist(); }
    else if(k==='Enter') onEnter();
  }
  keys[e.key]=true;
});
addEventListener('keyup', e=>{ keys[e.key]=false; });

// 触屏/鼠标:滑动 = 操作;点击 = 按钮
let tStart = null;
cv.addEventListener('pointerdown', e=>{ ac(); tStart = {x:e.clientX, y:e.clientY}; });
cv.addEventListener('pointerup', e=>{
  if(!tStart) return;
  const dx = e.clientX - tStart.x, dy = e.clientY - tStart.y;
  tStart = null;
  if(Math.hypot(dx,dy) > 24){ // 滑动
    if(Math.abs(dx) > Math.abs(dy)) (dx>0?onRight():onLeft());
    else (dy<0?onJump():onSlide());
  } else { // 点击 -> 屏幕坐标命中按钮
    const r = cv.getBoundingClientRect();
    const px = (e.clientX-r.left)/r.width*W, py = (e.clientY-r.top)/r.height*H;
    clickAt(px, py);
  }
});
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && G.state==='play') G.paused=true; });
