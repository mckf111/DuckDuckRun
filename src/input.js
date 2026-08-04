import { cv, W, H } from './core.js';
import { save, persist, flushSave } from './save.js';
import { ac, suspendAudio } from './audio.js';
import { G, onLeft, onRight, onJump, onSlide, onPauseKey, onEnter } from './game.js';
import { clickAt, kbNav, kbEnter } from './ui.js';

/* ================= 输入 ================= */
addEventListener('keydown', e=>{
  if(e.isComposing || e.keyCode===229) return;   // L9:输入法组合中的 Enter 不触发游戏
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
    // L5:图鉴放大层打开时 Enter 先关放大层;暂停菜单 Enter 可激活按钮(L2)
    else if(G.state==='album' && G.albumZoom) G.albumZoom = null;
    else if(G.state!=='play' || G.paused) kbEnter();
  }
});

// 图鉴页滚动:滚轮 + 触屏拖拽(纵向,见 ui.js drawAlbum)
cv.addEventListener('wheel', e=>{
  if(G.state!=='album' || G.albumZoom) return;
  G.albumScroll += e.deltaY * (e.deltaMode===1 ? 30 : 1);
}, {passive:true});

// 触屏/鼠标:滑动 = 操作;点击 = 按钮;图鉴页拖拽 = 滚动
let tStart = null, dragScroll = null;
cv.addEventListener('pointerdown', e=>{
  if(!e.isPrimary) return;   // M1:双指操作只认第一根手指,杜绝幽灵滑动
  ac();
  if(G.state==='album' && !G.albumZoom){   // 图鉴:拖拽滚动(不按按钮)
    tStart = null;
    dragScroll = { y:e.clientY, scroll:G.albumScroll, moved:false };
    return;
  }
  dragScroll = null;
  tStart = {x:e.clientX, y:e.clientY};
  // 记录按下的按钮(按压反馈)
  const r = cv.getBoundingClientRect();
  const px = (e.clientX-r.left)/r.width*W, py = (e.clientY-r.top)/r.height*H;
  G.pressed = null;
  for(const b of G.buttons){
    if(px>=b.x && px<=b.x+b.w && py>=b.y && py<=b.y+b.h){ G.pressed = {id:b.id, data:b.data}; break; }
  }
});
cv.addEventListener('pointermove', e=>{
  if(!dragScroll || !e.isPrimary) return;
  const r = cv.getBoundingClientRect();
  const dy = (e.clientY - dragScroll.y) * H / r.height;
  if(Math.abs(dy) > 3) dragScroll.moved = true;
  G.albumScroll = dragScroll.scroll - dy;
});
function endPointer(e){
  if(dragScroll){
    const wasMove = dragScroll.moved; dragScroll = null; G.pressed = null;
    if(!e.isPrimary) return;
    if(wasMove || G.wipe > 0) return;   // 拖过 = 滚动,不触发点击
    const r = cv.getBoundingClientRect();
    const px = (e.clientX-r.left)/r.width*W, py = (e.clientY-r.top)/r.height*H;
    clickAt(px, py);
    return;
  }
  const was = tStart; tStart = null; G.pressed = null;
  if(!was || !e.isPrimary) return;
  if(G.wipe > 0) return;   // L1:界面切换过场动画期间不响应操作
  const dx = e.clientX - was.x, dy = e.clientY - was.y;
  const r = cv.getBoundingClientRect();
  // M6:阈值带 CSS 像素下限(窄屏不把点按误判成滑动)
  const thresh = Math.max(24 * r.width / W, 12);
  if(Math.hypot(dx,dy) > thresh){ // 滑动
    if(Math.abs(dx) > Math.abs(dy)) (dx>0?onRight():onLeft());
    else (dy<0?onJump():onSlide());
  } else { // 点击 -> 屏幕坐标命中按钮
    const px = (e.clientX-r.left)/r.width*W, py = (e.clientY-r.top)/r.height*H;
    clickAt(px, py);
  }
}
cv.addEventListener('pointerup', endPointer);
// M2:鼠标在画布外松手会丢 pointerup,window 级兜底,避免 G.pressed 卡死与陈旧起点幽灵滑动
addEventListener('pointerup', e=>{ if(e.target !== cv) endPointer(e); });
function cancelPointer(){ G.pressed = null; tStart = null; dragScroll = null; }
function pauseForBackground(){
  cancelPointer();
  if(G.state==='play') G.paused = true;
  flushSave();
  suspendAudio();
}
addEventListener('pointercancel', cancelPointer);
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) pauseForBackground(); });
addEventListener('blur', pauseForBackground);
addEventListener('pagehide', pauseForBackground);
