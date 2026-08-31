import { cv, W, H } from './core.js';
import { save, persist, flushSave } from './save.js';
import { unlockAudio, suspendAudio } from './audio.js';
import { G, onLeft, onRight, onJump, onSlide, onPauseKey, onEnter } from './game.js';
import { clickAt, kbNav, kbEnter } from './ui.js';

/* ================= 输入 ================= */
export function createInputController(){
  let tStart = null;
  let dragScroll = null;
  const listeners = [];
  const on = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push([target, type, handler, options]);
  };

  const cancelPointer = () => {
    G.pressed = null;
    tStart = null;
    dragScroll = null;
  };

  const pauseForBackground = () => {
    cancelPointer();
    if(G.state==='play') G.paused = true;
    flushSave();
    suspendAudio();
  };

  const onKeyDown = e => {
    if(e.isComposing || e.keyCode===229) return;   // 输入法组合中的 Enter 不触发游戏
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
    if(e.repeat) return;
    unlockAudio();
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
      // 图鉴放大层打开时 Enter 先关放大层;暂停菜单 Enter 可激活按钮
      else if(G.state==='album' && G.albumZoom) G.albumZoom = null;
      else if(G.state!=='play' || G.paused) kbEnter();
    }
  };

  const onWheel = e => {
    const delta = e.deltaY * (e.deltaMode===1 ? 30 : 1);
    if(G.state==='album' && !G.albumZoom) G.albumScroll += delta;
    else if(G.state==='credits') G.creditsScroll += delta;
  };

  const onPointerDown = e => {
    if(!e.isPrimary) return;   // 双指操作只认第一根手指，杜绝幽灵滑动
    unlockAudio();
    if((G.state==='album' && !G.albumZoom) || G.state==='credits'){
      tStart = null;
      dragScroll = {
        y:e.clientY,
        scroll: G.state==='credits' ? G.creditsScroll : G.albumScroll,
        moved:false,
        key: G.state==='credits' ? 'creditsScroll' : 'albumScroll',
      };
      return;
    }
    dragScroll = null;
    tStart = {x:e.clientX, y:e.clientY};
    // 记录按下的按钮（按压反馈）。
    const r = cv.getBoundingClientRect();
    const px = (e.clientX-r.left)/r.width*W, py = (e.clientY-r.top)/r.height*H;
    G.pressed = null;
    for(const b of G.buttons){
      if(px>=b.x && px<=b.x+b.w && py>=b.y && py<=b.y+b.h){ G.pressed = {id:b.id, data:b.data}; break; }
    }
  };

  const onPointerMove = e => {
    if(!dragScroll || !e.isPrimary) return;
    const r = cv.getBoundingClientRect();
    const dy = (e.clientY - dragScroll.y) * H / r.height;
    if(Math.abs(dy) > 3) dragScroll.moved = true;
    G[dragScroll.key] = dragScroll.scroll - dy;
  };

  const endPointer = e => {
    if(dragScroll){
      const wasMove = dragScroll.moved;
      dragScroll = null;
      G.pressed = null;
      if(!e.isPrimary) return;
      if(wasMove || G.wipe > 0) return;   // 拖过 = 滚动，不触发点击
      const r = cv.getBoundingClientRect();
      const px = (e.clientX-r.left)/r.width*W, py = (e.clientY-r.top)/r.height*H;
      clickAt(px, py);
      return;
    }
    const was = tStart;
    tStart = null;
    G.pressed = null;
    if(!was || !e.isPrimary) return;
    if(G.wipe > 0) return;   // 界面切换过场动画期间不响应操作
    const dx = e.clientX - was.x, dy = e.clientY - was.y;
    const r = cv.getBoundingClientRect();
    // 阈值带 CSS 像素下限，窄屏不把点按误判成滑动。
    const thresh = Math.max(24 * r.width / W, 12);
    if(Math.hypot(dx,dy) > thresh){
      if(Math.abs(dx) > Math.abs(dy)) (dx>0?onRight():onLeft());
      else (dy<0?onJump():onSlide());
    }else{
      const px = (e.clientX-r.left)/r.width*W, py = (e.clientY-r.top)/r.height*H;
      clickAt(px, py);
    }
  };

  const onWindowPointerUp = e => { if(e.target !== cv) endPointer(e); };
  const onVisibility = () => { if(document.hidden) pauseForBackground(); };

  on(window, 'keydown', onKeyDown);
  on(cv, 'wheel', onWheel, {passive:true});
  on(cv, 'pointerdown', onPointerDown);
  on(cv, 'pointermove', onPointerMove);
  on(cv, 'pointerup', endPointer);
  // 鼠标在画布外松手会丢 pointerup，window 级兜底，避免按压状态和陈旧起点残留。
  on(window, 'pointerup', onWindowPointerUp);
  on(cv, 'pointercancel', cancelPointer);
  on(document, 'visibilitychange', onVisibility);
  on(window, 'blur', pauseForBackground);
  on(window, 'pagehide', pauseForBackground);

  return {
    dispose(){
      cancelPointer();
      for(const [target, type, handler, options] of listeners) target.removeEventListener(type, handler, options);
      listeners.length = 0;
    },
  };
}
