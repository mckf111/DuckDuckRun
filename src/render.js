import { ctx, W, H, CX, HOR, TAU, proj, poly, disc, rrect, clamp, shadow, ROAD_HALF, LANEGAP, ZP, DRAWD } from './core.js';
import { LEVELS, LM_CYCLE } from './config.js';
import { G, pl, curLv } from './game.js';
import { drawItemIcon } from './art/items.js';
import { drawObstacle } from './art/obstacles.js';
import { drawSide, drawSkyline, drawLandmark, drawBoat, drawGate, drawNear } from './art/scenery.js';
import { drawBackdrop, drawMenuBg } from './art/photo.js';
import { drawRoad } from './art/road.js';
import { drawPlayer } from './art/player.js';
import { drawSpriteFrame, getSprite } from './art/sprites.js';

let vgCv = null;   // 晕影离屏缓存
const dotCache = new Map();   // 柔边粒子精灵(按颜色缓存)

/* 柔边圆点:径向渐变精灵,环境粒子用(硬边 disc 在照片背景上像坏点) */
function softDot(x, y, r, color){
  let sp = dotCache.get(color);
  if(!sp){
    sp = document.createElement('canvas'); sp.width = sp.height = 32;
    const c = sp.getContext('2d');
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, color); g.addColorStop(0.35, color + 'aa'); g.addColorStop(1, color + '00');
    c.fillStyle = g; c.fillRect(0, 0, 32, 32);
    dotCache.set(color, sp);
  }
  ctx.drawImage(sp, x - r, y - r, r * 2, r * 2);
}

/* 全局轻晕影(预渲染一次,统一照片层与手绘层质感) */
function vignette(){
  if(!vgCv){
    vgCv = document.createElement('canvas'); vgCv.width = 480; vgCv.height = 270;
    const c = vgCv.getContext('2d');
    const g2 = c.createRadialGradient(240, 124, 114, 240, 140, 232);
    g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(8,6,14,0.34)');
    c.fillStyle = g2; c.fillRect(0, 0, 480, 270);
  }
  ctx.drawImage(vgCv, 0, 0, W, H);
}

/* 道具小图标(发光物件本体):磁铁 U 形 / 护盾荷叶帽 / 金桂桂枝 */
export function drawPowerIcon(kind, x, y, r){
  const out = 'rgba(14,11,20,0.5)';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if(kind==='magnet'){            // U 形磁铁:红身 + 白极
    ctx.strokeStyle = '#c8342e'; ctx.lineWidth = r*0.34;
    ctx.beginPath();
    ctx.arc(x, y, r*0.62, Math.PI, 0);
    ctx.lineTo(x+r*0.62, y+r*0.7);
    ctx.arc(x+r*0.62, y+r*0.7, r*0.2, 0, -Math.PI/2, false);
    ctx.arc(x-r*0.62, y+r*0.7, r*0.2, -Math.PI/2, 0, true);
    ctx.stroke();
    ctx.strokeStyle = out; ctx.lineWidth = r*0.36;
    ctx.beginPath(); ctx.arc(x, y, r*0.62, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#f5f0e6';    // 白极
    ctx.fillRect(x-r*0.78, y+r*0.45, r*0.32, r*0.5);
    ctx.fillRect(x+r*0.46, y+r*0.45, r*0.32, r*0.5);
  } else if(kind==='shield'){     // 荷叶帽:绿圆帽 + 梗
    ctx.fillStyle = '#4a8a4a';
    ctx.beginPath(); ctx.ellipse(x, y+r*0.1, r*0.9, r*0.28, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = r*0.1; ctx.stroke();
    ctx.fillStyle = '#5aa85a';    // 帽顶
    ctx.beginPath(); ctx.ellipse(x, y-r*0.05, r*0.95, r*0.34, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = r*0.1; ctx.stroke();
    ctx.strokeStyle = '#3a6a3a'; ctx.lineWidth = r*0.09;   // 叶脉
    ctx.beginPath(); ctx.moveTo(x-r*0.6, y-r*0.3); ctx.quadraticCurveTo(x, y-r*0.42, x+r*0.6, y-r*0.3); ctx.stroke();
    ctx.strokeStyle = '#4a8a4a'; ctx.lineWidth = r*0.14;   // 梗
    ctx.beginPath(); ctx.moveTo(x, y-r*0.36); ctx.lineTo(x, y-r*0.85); ctx.stroke();
  } else {                        // 金桂:桂枝 + 花簇
    ctx.strokeStyle = '#6a4a2c'; ctx.lineWidth = r*0.16;
    ctx.beginPath(); ctx.moveTo(x-r*0.7, y+r*0.7); ctx.quadraticCurveTo(x-r*0.1, y+r*0.1, x+r*0.5, y-r*0.6); ctx.stroke();
    ctx.strokeStyle = '#4a7a3a'; ctx.lineWidth = r*0.1;
    ctx.beginPath(); ctx.moveTo(x-r*0.55, y+r*0.45); ctx.lineTo(x-r*0.2, y+r*0.55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-r*0.15, y+r*0.1); ctx.lineTo(x+r*0.15, y+r*0.02); ctx.stroke();
    ctx.fillStyle = '#f0c85a';
    for(const [px,py] of [[-0.3,0.05],[0,-0.15],[0.28,-0.35],[-0.12,-0.3],[0.45,-0.6],[0.1,0.2]]){
      disc(x+px*r, y+py*r, r*0.16, '#f0c85a');
      disc(x+px*r, y+py*r, r*0.07, '#f7e0a0');
    }
  }
}

export function drawEgg(x, y, r, wobble){
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(wobble || 0);
  ctx.fillStyle = 'rgba(90,50,20,0.18)';
  ctx.beginPath(); ctx.ellipse(0, r*0.72, r*0.72, r*0.22, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f7ecd0';
  ctx.strokeStyle = '#5a3a20';
  ctx.lineWidth = Math.max(1.6, r*0.12);
  ctx.beginPath(); ctx.ellipse(0, 0, r*0.72, r, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,248,230,0.7)';
  ctx.beginPath(); ctx.ellipse(-r*0.18, -r*0.28, r*0.22, r*0.16, -0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d2a06a';
  for(const [dx,dy,s] of [[0.16,0.08,0.09],[0.02,0.32,0.07],[-0.22,0.18,0.06]]){
    ctx.beginPath(); ctx.ellipse(dx*r, dy*r, s*r, s*r*0.7, 0.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

export function drawRelic(id, x, y, r){
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#e8c98a';
  ctx.strokeStyle = '#5a3a20';
  ctx.lineWidth = Math.max(1.5, r*0.1);
  ctx.beginPath();
  ctx.moveTo(-r*1.05, -r*0.7); ctx.lineTo(r*1.05, -r*0.7);
  ctx.lineTo(r*0.9, r*0.75); ctx.lineTo(-r*0.9, r*0.75);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c45a3a';
  ctx.fillRect(-r*0.18, -r*0.7, r*0.36, r*0.22);
  ctx.restore();
  drawItemIcon(id, x, y+r*0.04, r*0.55, false);
}

/* 旧金环仍给 HUD 小图标兜底。 */
export function drawPickupMedallion(id, x, y, r, frame){
  if(id==='gold' || id==='egg'){ drawEgg(x, y, r*1.15, 0); return true; }
  const image = getSprite('pickup');
  if(!image){ drawRelic(id, x, y, r); return true; }
  const index = ((frame||0)%4+4)%4;
  const squash = [1,0.72,0.16,0.72][index];
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(squash,1);
  drawItemIcon(id, 0, 0, r*0.58, false);
  ctx.restore();
  const dw = r*2.18;
  const dh = dw * (image.naturalHeight / (image.naturalWidth/4));
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  drawSpriteFrame(ctx, image, 4, 1, index, x-dw/2, y-dh/2, dw, dh);
  ctx.restore();
  return true;
}

function drawSliceToken(x, y, r){
  const image=getSprite('sliceToken');
  if(image){
    ctx.save();ctx.globalAlpha=0.96;ctx.drawImage(image,x-r,y-r,r*2,r*2);ctx.restore();return;
  }
  disc(x,y,r,'#F4BE57','#11213D',Math.max(1.5,r*0.11));
  disc(x,y,r*0.46,'#F4F0E6','#11213D',Math.max(1,r*0.07));
  ctx.fillStyle='#C95B45';ctx.fillRect(x-r*0.18,y+r*0.5,r*0.36,r*0.18);
}

function drawSliceMarker(x, y, r){
  const image=getSprite('sliceMarker');
  if(image){ctx.drawImage(image,x-r,y-r,r*2,r*2);return;}
  disc(x,y,r,'#11213D','#F4F0E6',Math.max(1.4,r*0.09));
  ctx.save();ctx.strokeStyle='#F4F0E6';ctx.lineWidth=Math.max(2,r*0.2);ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(x-r*0.38,y-r*0.18);ctx.lineTo(x,y+r*0.24);ctx.lineTo(x+r*0.38,y-r*0.18);ctx.stroke();ctx.restore();
}

function drawSliceQinhuai(){
  const bank=proj(-ROAD_HALF-0.2,0,DRAWD), near=proj(-ROAD_HALF-0.2,0,2.2);
  ctx.save();
  ctx.fillStyle='rgba(20,78,91,0.68)';
  ctx.beginPath();ctx.moveTo(0,HOR+5);ctx.lineTo(bank.x,HOR+5);ctx.lineTo(near.x,near.y);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(244,190,87,0.34)';ctx.lineWidth=1.2;
  for(let i=0;i<4;i++){const y=HOR+20+i*16+Math.sin(G.t*2+i)*3;ctx.beginPath();ctx.moveTo(16,y);ctx.lineTo(Math.max(18,near.x-20),y+3);ctx.stroke();}
  ctx.globalAlpha=0.96;drawBoat(W*0.18+Math.sin(G.t*0.45)*18,HOR+26);ctx.globalAlpha=1;
  ctx.restore();
}

/* ================= 渲染:场景(远/中/近三层视差) ================= */
export function render(){
  // 菜单/选关/图鉴/鸭铺:南京眼蓝调底图(缺图回退下方旧场景)
  if((G.state==='menu'||G.state==='levels'||G.state==='album'||G.state==='shop'||G.state==='credits') && drawMenuBg()){ vignette(); return; }
  const active=G.state==='play'||G.state==='crashing'||G.state==='over'||G.state==='clear';
  const lv = active ? curLv() : LEVELS[3]; // 菜单用秦淮夜景
  // 无尽模式地标轮换(含长江大桥);冒险模式用本关地标
  const lmId = G.mode==='endless' && active
    ? LM_CYCLE[Math.floor(G.dist/600)%LM_CYCLE.length]
    : lv.landmark;
  // 天空
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, lv.sky[0]); g.addColorStop(0.62, lv.sky[1]); g.addColorStop(0.62, lv.ground); g.addColorStop(1, lv.side);
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  // 实景照片远景(无尽模式在 600m 边界叠化);缺图回退到代码剪影
  let drewPhoto = false;
  if(G.mode!=='slice'){
    if(G.mode==='endless' && active){
      const cyc = Math.floor(G.dist/600);
      const mixB = clamp(((G.dist % 600) - 540) / 60, 0, 1);
      drewPhoto = drawBackdrop(LM_CYCLE[cyc % LM_CYCLE.length], lv, G.dist, 1-mixB);
      if(mixB > 0) drewPhoto = drawBackdrop(LM_CYCLE[(cyc+1) % LM_CYCLE.length], lv, G.dist, mixB) || drewPhoto;
    } else drewPhoto = drawBackdrop(lmId, lv, G.dist, 1);
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
  // 秦淮河:切片将水面、画舫和灯影置入可见空间；常规夫子庙保留既有画舫。
  if(G.mode==='slice') drawSliceQinhuai();
  else if(lv.motif==='lantern'){
    ctx.globalAlpha = 0.85;
    drawBoat((G.t*26) % (W+360) - 180, HOR + 26);
    ctx.globalAlpha = 1;
  }

  // 地面道路:按景点写实纹理(砖/石板/花岗岩/沥青)
  drawRoad(lv, G.dist);
  // 两侧走廊装饰(远->近;远处加距离雾淡入背景)
  const sstep = 5, sz0 = Math.floor((G.dist - ZP)/sstep)*sstep + sstep;
  for(let z = sz0; z < G.dist - ZP + DRAWD; z += sstep){
    const rz = z - G.dist + ZP; if(rz < 2.4) continue;
    for(const m of [-1,1]){
      const px = m * (ROAD_HALF + 1.3);
      const p = proj(px, 0, rz);
      ctx.globalAlpha = 1 - clamp((rz-8)/48, 0, 0.55);
      drawSide(lv.motif, p.x, p.y, p.s, lv, m<0);
      ctx.globalAlpha = 1;
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
  // 首屏安全道标记：轮廓、箭头和灯笼共同传达，不只借助颜色。
  if(G.mode==='slice'&&G.dist<82){
    const marker=proj(-LANEGAP,1.18,30-G.dist+ZP);
    if(marker.s>0&&marker.y>-40&&marker.y<H+40) drawSliceMarker(marker.x,marker.y,clamp(marker.s*0.42,14,34));
  }
  // 收集品(远->近;贴地投影 + 落地影,近处尺寸收敛不挡视野)
  // 二期:全插画化——金色柔光晕 + 深描边本体,路上 r≈15px 一眼认出
  const cols = G.cols.slice().sort((a,b)=>(b.rz??b.z-G.dist+ZP)-(a.rz??a.z-G.dist+ZP));
  for(const c of cols){
    // 教学切到第 4 步的同一帧，新增印记尚未经过 update；先按世界坐标投影，避免 NaN 让主循环停摆。
    const rz = c.rz ?? c.z-G.dist+ZP;
    if(rz < 2 || rz > DRAWD) continue;
    const p = proj(c.x, c.y + Math.sin(G.t*3+c.z)*0.08, rz);
    const gp = proj(c.x, 0, rz);
    shadow(gp.x, gp.y, gp.s*0.28, 0.18);
    const r = clamp(p.s*0.34, 4, 19);
    if(c.kind==='sliceToken') drawSliceToken(p.x,p.y,r*1.45);
    else if(c.kind==='sliceLight') drawSliceMarker(p.x,p.y,r*1.15);
    else if(c.kind==='relic') drawRelic(c.id, p.x, p.y, r*1.15);
    else drawEgg(p.x, p.y, r, Math.sin(G.t*4+c.z)*0.12);
  }
  // 局内道具(发光物件,与收集品同层;免费道上不挡路)
  for(const p of G.powers){
    if(p.rz < 2 || p.rz > DRAWD) continue;
    const pp = proj(p.lane*LANEGAP, 0.55 + Math.sin(G.t*3+p.z)*0.08, p.rz);
    const gp = proj(p.lane*LANEGAP, 0, p.rz);
    shadow(gp.x, gp.y, gp.s*0.3, 0.2);
    const r = clamp(pp.s*0.38, 5, 21);
    ctx.save();
    const gl = ctx.createRadialGradient(pp.x, pp.y, r*0.2, pp.x, pp.y, r*2.6);
    gl.addColorStop(0, 'rgba(240,200,90,0.35)');
    gl.addColorStop(1, 'rgba(240,200,90,0)');
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(pp.x, pp.y, r*2.6, 0, TAU); ctx.fill();
    ctx.restore();
    drawPowerIcon(p.kind, pp.x, pp.y, r);
  }
  // 障碍(远->近)
  const obs = G.obs.slice().sort((a,b)=>b.rz-a.rz);
  for(const o of obs){ if(o.rz > 2 && o.rz < DRAWD) drawObstacle(o, lv); }
  // 玩家(鸭子):障碍逼近时惊恐表情,撞车后保持四脚朝天
  if(G.state==='play' || G.state==='crashing' || G.state==='over'){
    let panic = false;
    for(const o of G.obs){
      if(!o.hit && o.rz > ZP && o.rz < ZP+12){ panic = true; break; }
    }
    const crashAge = G.state==='crashing' ? (G.crashLen-G.crashT) : G.crashLen;
    drawPlayer(pl, G.t, {
      panic,
      crashed: G.state==='crashing'||G.state==='over',
      crashAge,
      crashKind: G.killedBy,
    });
    if(G.state==='crashing' && G.crashLine && (G.crashLen-G.crashT)>0.22){
      const a = clamp(((G.crashLen-G.crashT)-0.22)*6, 0, 1);
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = '42px "JinlingBrush","KaiTi","Microsoft YaHei",serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(58,38,20,0.55)';
      ctx.strokeText(G.crashLine, CX, H*0.22);
      ctx.fillStyle = '#f6edd4'; ctx.fillText(G.crashLine, CX, H*0.22);
      ctx.restore();
    }
    if(G.speech && G.speech.text){
      const p = proj(pl.x, pl.y+1.85, ZP);
      const a = clamp(Math.min((G.speech.dur-G.speech.ttl)*6, G.speech.ttl*4), 0, 1);
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = '15px "JinlingKai","KaiTi","Microsoft YaHei",serif';
      const tw = Math.min(220, ctx.measureText(G.speech.text).width + 18);
      rrect(p.x-tw/2, p.y-18, tw, 26, 10, 'rgba(246,236,214,0.94)', '#5a3a20', 1.3);
      ctx.fillStyle = '#3a2614'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(G.speech.text, p.x, p.y-5);
      ctx.restore();
    }
  }
  // 粒子(收集/穿门为剪纸碎片,环境粒子为柔边圆点)
  for(const pt of G.parts){
    const p = proj(pt.x, pt.y, pt.z);
    ctx.globalAlpha = clamp(pt.life, 0, 1) * (pt.ambient?0.4:1);
    if(pt.egg){
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(pt.rot||0);
      ctx.fillStyle = '#f7ecd0'; ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(0, 0, pt.size*0.72, pt.size, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if(pt.flower){
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(pt.rot||0.4);
      ctx.fillStyle = '#7ba05b'; ctx.fillRect(-1.5, -pt.size, 3, pt.size);
      ctx.fillStyle = '#f0b64c';
      for(const [dx,dy] of [[0,-pt.size],[4,-pt.size+3],[-4,-pt.size+2]]){
        ctx.beginPath(); ctx.arc(dx, dy, 3.2, 0, TAU); ctx.fill();
      }
      ctx.restore();
    } else if(pt.shard){
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(pt.rot);
      const sz = pt.size;
      if(pt.dia) poly([[0,-sz],[sz*0.7,0],[0,sz],[-sz*0.7,0]], pt.color);   // 菱形纸片
      else poly([[0,-sz],[sz*0.9,sz*0.7],[-sz*0.9,sz*0.7]], pt.color);       // 三角纸片
      ctx.restore();
    } else if(pt.ambient){
      softDot(p.x, p.y, pt.size*(p.s*0.02+0.6), pt.color);
    } else {
      disc(p.x, p.y, pt.size, pt.color);
    }
  }
  ctx.globalAlpha = 1;
  vignette();
}
