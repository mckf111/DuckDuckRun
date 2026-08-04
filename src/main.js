import { ctx, W, H, fit, rnd, downgradeQuality } from './core.js';
import { G, startRun, update, curLv } from './game.js';
import { LEVELS, LM_CYCLE } from './config.js';
import { render } from './render.js';
import { loadMenuBackground, loadBackground, prefetchBackground } from './art/photo.js';
import { bgmStop } from './audio.js';
import { drawHUD, drawMenu, drawLevels, drawOver, drawClear, drawAlbum, drawShop } from './ui.js';
import { track } from './track.js';
import './input.js';

addEventListener('resize', fit); fit();

/* 竖屏引导层:触屏设备纵向持机时全屏提示旋转(横屏手机与桌面不受影响) */
function checkRotate(){
  const el = document.getElementById('rotate');
  if(!el) return;
  const portrait = ('ontouchstart' in window) && innerHeight > innerWidth;
  el.style.display = portrait ? 'flex' : 'none';
}
addEventListener('resize', checkRotate);
addEventListener('orientationchange', checkRotate);
checkRotate();

/* ================= 主循环 ================= */
let lastT = 0, prevState = G.state;
let perfStart = 0, perfFrames = 0, perfPrev = 0, assetKey = '';
function syncAssets(){
  if(G.state!=='play' && G.state!=='over' && G.state!=='clear'){
    loadMenuBackground();
    return;
  }
  const endlessIndex = Math.floor(G.dist/600)%LM_CYCLE.length;
  const id = G.mode==='endless' ? LM_CYCLE[endlessIndex] : curLv().landmark;
  if(id === assetKey) return;
  assetKey = id;
  loadBackground(id);
  const next = G.mode==='endless'
    ? LM_CYCLE[(endlessIndex+1)%LM_CYCLE.length]
    : LEVELS[Math.min(G.lvIdx+1, LEVELS.length-1)].landmark;
  if(next !== id) prefetchBackground(next);
}
function monitorFrameBudget(ts){
  if(perfPrev && ts-perfPrev > 250){ perfStart=ts; perfFrames=0; }
  perfPrev = ts;
  if(!perfStart) perfStart = ts;
  perfFrames++;
  if(ts-perfStart < 3000) return;
  const averageFrameMs = (ts-perfStart)/Math.max(1, perfFrames-1);
  if(averageFrameMs > 33) downgradeQuality();
  perfStart = ts; perfFrames = 0;
}
function frame(ts){
  monitorFrameBudget(ts);
  const raw = Math.min(0.05, (ts-lastT)/1000 || 0.016); lastT = ts;
  // 撞车慢动作:0.3 倍速 0.22 秒
  let dt = raw;
  if(G.slowmo > 0){ dt = raw*0.3; G.slowmo -= raw; }
  update(dt);
  syncAssets();
  G.buttons = [];
  ctx.save();
  if(G.shake>0) ctx.translate(rnd(-1,1)*G.shake*8, rnd(-1,1)*G.shake*8);
  render();
  ctx.restore();
  if(G.state==='play') drawHUD();
  else if(G.state==='menu') drawMenu();
  else if(G.state==='levels') drawLevels();
  else if(G.state==='over') drawOver();
  else if(G.state==='clear') drawClear();
  else if(G.state==='album') drawAlbum();
  else if(G.state==='shop') drawShop();
  // 界面切换:卷轴自左向右揭开;离开游玩状态即停 BGM(菜单/结算不再无限循环)
  if(G.state !== prevState){
    if(prevState==='play' && G.state!=='play') bgmStop();
    prevState = G.state; G.wipe = 0.32; G.kbSel = 0; G.kbActive = false; G.stateT = 0;
  }
  G.stateT = (G.stateT||0) + raw;
  if(G.wipe > 0){
    G.wipe -= raw;
    const x = (1 - Math.max(0,G.wipe)/0.32) * (W+160) - 80;
    ctx.fillStyle = '#0d0a14'; ctx.fillRect(x, 0, W-x+80, H);
    ctx.fillStyle = '#f0b64c'; ctx.fillRect(x-3, 0, 3, H);
  }
  requestAnimationFrame(frame);
}

// HTML 与模块就绪即开循环；照片只负责渐入，失败或挂起不再挡住菜单。
requestAnimationFrame(frame);
track('view');
loadMenuBackground();
if(location.hash==='#play') startRun('endless', 0);
else if(/^#lv\d$/.test(location.hash)) startRun('adv', +location.hash.slice(3));
