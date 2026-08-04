import { ctx, W, H, CX, fit, rnd } from './core.js';
import { G, startRun, update } from './game.js';
import { render } from './render.js';
import { loadAll } from './art/photo.js';
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
function frame(ts){
  const raw = Math.min(0.05, (ts-lastT)/1000 || 0.016); lastT = ts;
  // 撞车慢动作:0.3 倍速 0.22 秒
  let dt = raw;
  if(G.slowmo > 0){ dt = raw*0.3; G.slowmo -= raw; }
  update(dt);
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
/* 照片预加载:完成后再进主循环(缺图不阻塞,对应元素走代码插画回退) */
function drawLoading(p){
  ctx.fillStyle = '#0d0a14'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#f4f1e8'; ctx.font = '44px "JinlingBrush","KaiTi","Microsoft YaHei",serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('金陵快跑', CX, H*0.38);
  ctx.fillStyle = 'rgba(247,234,208,0.25)'; ctx.fillRect(CX-140, H*0.52, 280, 6);
  ctx.fillStyle = '#f0b64c'; ctx.fillRect(CX-140, H*0.52, 280*p, 6);
  ctx.font = '15px "Microsoft YaHei","PingFang SC",sans-serif';
  ctx.fillStyle = '#f0b64c';
  ctx.fillText('照片冲洗中…', CX, H*0.6);
}
loadAll(drawLoading).then(() => {
  requestAnimationFrame(frame);
  track('view');
  // 深链直达:#lv0~#lv9 直接开对应关,#play 直接无尽模式(便于分享/测试)
  if(location.hash==='#play') startRun('endless', 0);
  else if(/^#lv\d$/.test(location.hash)) startRun('adv', +location.hash.slice(3));
});
