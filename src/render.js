import { ctx, W, H, HOR, TAU, proj, poly, disc, clamp, ROAD_HALF, LANEGAP, ZP, DRAWD } from './core.js';
import { LEVELS, LM_CYCLE } from './config.js';
import { G, pl, curLv } from './game.js';
import { drawItemIcon } from './art/items.js';
import { drawObstacle } from './art/obstacles.js';
import { drawSide, drawSkyline, drawLandmark, drawBoat, drawGate, drawNear } from './art/scenery.js';
import { drawBackdrop, drawItemPhoto, hasPhoto } from './art/photo.js';
import { drawRoad } from './art/road.js';
import { drawPlayer } from './art/player.js';

let vgCv = null;   // 晕影离屏缓存

/* ================= 渲染:场景(远/中/近三层视差) ================= */
export function render(){
  const lv = G.state==='play'||G.state==='over'||G.state==='clear' ? curLv() : LEVELS[3]; // 菜单用秦淮夜景
  // 无尽模式地标轮换(含长江大桥);冒险模式用本关地标
  const lmId = G.mode==='endless' && (G.state==='play'||G.state==='over'||G.state==='clear')
    ? LM_CYCLE[Math.floor(G.dist/600)%LM_CYCLE.length]
    : lv.landmark;
  // 天空
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, lv.sky[0]); g.addColorStop(0.62, lv.sky[1]); g.addColorStop(0.62, lv.ground); g.addColorStop(1, lv.side);
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  // 实景照片远景(无尽模式在 600m 边界叠化);缺图回退到代码剪影
  let drewPhoto = false;
  if(G.mode==='endless' && (G.state==='play'||G.state==='over'||G.state==='clear')){
    const cyc = Math.floor(G.dist/600);
    const mixB = clamp(((G.dist % 600) - 540) / 60, 0, 1);
    drewPhoto = drawBackdrop(LM_CYCLE[cyc % LM_CYCLE.length], lv, G.dist, 1-mixB);
    if(mixB > 0) drewPhoto = drawBackdrop(LM_CYCLE[(cyc+1) % LM_CYCLE.length], lv, G.dist, mixB) || drewPhoto;
  } else {
    drewPhoto = drawBackdrop(lmId, lv, G.dist, 1);
  }
  if(!drewPhoto){
    // 月亮/太阳剪纸圆盘
    const moonX = W*0.78, moonY = H*0.16;
    ctx.fillStyle = lv.motif==='lantern' ? '#e2483d' : '#f3e2b0';
    ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(moonX, moonY, 34, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.arc(moonX, moonY, 52, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    drawSkyline(lv, G.dist);
    drawLandmark(lmId, lv, G.dist);
  }
  // 秦淮河:画舫横向漂过(在道路之前绘制,从路后穿过)
  if(lv.motif==='lantern'){
    ctx.globalAlpha = 0.85;
    drawBoat((G.t*26) % (W+360) - 180, HOR + 26);
    ctx.globalAlpha = 1;
  }

  // 地面道路:按景点写实纹理(砖/石板/花岗岩/沥青)
  drawRoad(lv, G.dist);
  // 两侧走廊装饰(远->近)
  const sstep = 5, sz0 = Math.floor((G.dist - ZP)/sstep)*sstep + sstep;
  for(let z = sz0; z < G.dist - ZP + DRAWD; z += sstep){
    const rz = z - G.dist + ZP; if(rz < 2.4) continue;
    for(const m of [-1,1]){
      const px = m * (ROAD_HALF + 1.3);
      const p = proj(px, 0, rz);
      drawSide(lv.motif, p.x, p.y, p.s, lv, m<0);
    }
  }
  // 近层(快):栏杆柱/柳枝/灯笼串/松枝,只画最近一段,从两侧高速掠过
  const nstep = 9, nz0 = Math.floor((G.dist - ZP)/nstep)*nstep + nstep;
  for(let z = nz0; z < G.dist - ZP + 14; z += nstep){
    const rz = z - G.dist + ZP; if(rz < 2.4 || rz > 14) continue;
    for(const m of [-1,1]){
      const p = proj(m * (ROAD_HALF + 2.6), 0, rz);
      drawNear(lv.motif, p.x, p.y, p.s, lv, m<0);
    }
  }
  // 穿越门(远->近,在收集品与障碍之后)
  const gates = G.gates.slice().sort((a,b)=>b.rz-a.rz);
  for(const g of gates){ if(g.rz > 2 && g.rz < DRAWD) drawGate(g, lv); }
  // 收集品(远->近)
  const cols = G.cols.slice().sort((a,b)=>b.rz-a.rz);
  for(const c of cols){
    if(c.rz < 2 || c.rz > DRAWD) continue;
    const p = proj(c.x, c.y + Math.sin(G.t*3+c.z)*0.08, c.rz);
    if(hasPhoto('it_'+c.id)) drawItemPhoto(c.id, p.x, p.y, clamp(p.s*0.34, 4, 30), Math.sin(G.t*2+c.z)*0.08, false);
    else drawItemIcon(c.id, p.x, p.y, clamp(p.s*0.32, 3, 26), false);
  }
  // 障碍(远->近)
  const obs = G.obs.slice().sort((a,b)=>b.rz-a.rz);
  for(const o of obs){ if(o.rz > 2 && o.rz < DRAWD) drawObstacle(o, lv); }
  // 玩家(鸭子):障碍逼近时惊恐表情,撞车后保持四脚朝天
  if(G.state==='play' || G.state==='over'){
    let panic = false;
    for(const o of G.obs){
      if(!o.hit && o.rz > ZP && o.rz < ZP+12){ panic = true; break; }
    }
    drawPlayer(pl, G.t, { panic, crashed: G.state==='over' });
  }
  // 粒子(收集/穿门为剪纸碎片,环境粒子仍为圆点)
  for(const pt of G.parts){
    const p = proj(pt.x, pt.y, pt.z);
    ctx.globalAlpha = clamp(pt.life, 0, 1) * (pt.ambient?0.7:1);
    if(pt.shard){
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(pt.rot);
      const sz = pt.size;
      if(pt.dia) poly([[0,-sz],[sz*0.7,0],[0,sz],[-sz*0.7,0]], pt.color);   // 菱形纸片
      else poly([[0,-sz],[sz*0.9,sz*0.7],[-sz*0.9,sz*0.7]], pt.color);       // 三角纸片
      ctx.restore();
    } else {
      disc(p.x, p.y, pt.size*(pt.ambient?p.s*0.02+0.6:1), pt.color);
    }
  }
  ctx.globalAlpha = 1;
  // 全局轻晕影(预渲染一次,统一照片层与手绘层质感)
  if(!vgCv){
    vgCv = document.createElement('canvas'); vgCv.width = 480; vgCv.height = 270;
    const c = vgCv.getContext('2d');
    const g2 = c.createRadialGradient(240, 124, 114, 240, 140, 232);
    g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(8,6,14,0.34)');
    c.fillStyle = g2; c.fillRect(0, 0, 480, 270);
  }
  ctx.drawImage(vgCv, 0, 0, W, H);
}
