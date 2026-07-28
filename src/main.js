import { ctx, fit, rnd } from './core.js';
import { G, startRun, update } from './game.js';
import { render } from './render.js';
import { drawHUD, drawMenu, drawLevels, drawOver, drawClear, drawAlbum } from './ui.js';
import './input.js';

addEventListener('resize', fit); fit();

/* ================= 主循环 ================= */
let lastT = 0;
function frame(ts){
  const dt = Math.min(0.05, (ts-lastT)/1000 || 0.016); lastT = ts;
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
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// 深链直达:#lv0~#lv4 直接开对应关,#play 直接无尽模式(便于分享/测试)
if(location.hash==='#play') startRun('endless', 0);
else if(/^#lv[0-4]$/.test(location.hash)) startRun('adv', +location.hash.slice(3));
