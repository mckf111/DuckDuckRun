import { ctx, W, H, TAU, proj, poly, disc, clamp, ROAD_HALF, LANEGAP, ZP, DRAWD } from './core.js';
import { LEVELS } from './config.js';
import { G, pl, curLv } from './game.js';
import { drawItemIcon } from './art/items.js';
import { drawObstacle } from './art/obstacles.js';
import { drawSide, drawSkyline } from './art/scenery.js';
import { drawPlayer } from './art/player.js';

/* ================= 渲染:场景 ================= */
export function render(){
  const lv = G.state==='play'||G.state==='over'||G.state==='clear' ? curLv() : LEVELS[3]; // 菜单用秦淮夜景
  // 天空
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, lv.sky[0]); g.addColorStop(0.62, lv.sky[1]); g.addColorStop(0.62, lv.ground); g.addColorStop(1, lv.side);
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  // 月亮/太阳剪纸圆盘
  const moonX = W*0.78, moonY = H*0.16;
  ctx.fillStyle = lv.motif==='lantern' ? '#e2483d' : '#f3e2b0';
  ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(moonX, moonY, 34, 0, TAU); ctx.fill();
  ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.arc(moonX, moonY, 52, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
  drawSkyline(lv, G.dist);

  // 地面道路(梯形)
  const pN = proj(-ROAD_HALF, 0, 2.2), pN2 = proj(ROAD_HALF, 0, 2.2);
  const pF = proj(-ROAD_HALF, 0, DRAWD), pF2 = proj(ROAD_HALF, 0, DRAWD);
  poly([[pF.x,pF.y],[pF2.x,pF2.y],[pN2.x,Math.min(pN.y,H+40)],[pN.x,Math.min(pN.y,H+40)]], lv.road);
  // 车道分隔线
  for(const lx of [-LANEGAP/2, LANEGAP/2]){
    const a = proj(lx,0,2.2), b = proj(lx,0,DRAWD);
    ctx.strokeStyle = lv.lane; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.globalAlpha = 1;
  }
  // 横向条纹(前进感)
  const step = 3, z0 = Math.floor((G.dist - ZP)/step)*step + step;
  for(let z = z0; z < G.dist - ZP + DRAWD; z += step){
    const rz = z - G.dist + ZP; if(rz < 2.2) continue;
    const a = proj(-ROAD_HALF, 0, rz), b = proj(ROAD_HALF, 0, rz);
    ctx.strokeStyle = lv.lane; ctx.globalAlpha = clamp(0.35*(1-rz/DRAWD), 0, 0.35);
    ctx.lineWidth = Math.max(1, a.s*0.03);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
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
  // 中山陵:远处祭堂剪影
  if(lv.motif==='steps'){
    const p = proj(0, 0, DRAWD*0.96);
    poly([[p.x-30,p.y],[p.x-30,p.y-26],[p.x,p.y-40],[p.x+30,p.y-26],[p.x+30,p.y]], '#5a7ca6');
  }
  // 收集品(远->近)
  const cols = G.cols.slice().sort((a,b)=>b.rz-a.rz);
  for(const c of cols){
    if(c.rz < 2 || c.rz > DRAWD) continue;
    const p = proj(c.x, c.y + Math.sin(G.t*3+c.z)*0.08, c.rz);
    drawItemIcon(c.id, p.x, p.y, clamp(p.s*0.32, 3, 26), false);
  }
  // 障碍(远->近)
  const obs = G.obs.slice().sort((a,b)=>b.rz-a.rz);
  for(const o of obs){ if(o.rz > 2 && o.rz < DRAWD) drawObstacle(o, lv); }
  // 玩家
  if(G.state==='play') drawPlayer(pl, G.t);
  // 粒子
  for(const pt of G.parts){
    const p = proj(pt.x, pt.y, pt.z);
    ctx.globalAlpha = clamp(pt.life, 0, 1) * (pt.ambient?0.7:1);
    disc(p.x, p.y, pt.size*(pt.ambient?p.s*0.02+0.6:1), pt.color);
  }
  ctx.globalAlpha = 1;
}
