import { ctx, W, H, proj, clamp, TAU, ROAD_HALF, LANEGAP, DRAWD, ZP } from '../core.js';

/* ================= 路面:按景点写实纹理(砖/石板/花岗岩/沥青) ================= */
// 以 lv.motif 关联路面材质:course=横向缝间距(米), joint=缝色, speck=噪点不透明度
const TEX = {
  crenel:  { course: 2.2, joint: '#8a6848', speck: 0.08, vanguard:true, name: '城砖' },
  lotus:   { course: 3.0, joint: '#14382f', speck: 0.10, water: true, name: '湖堤石板' },
  steps:   { course: 4.0, joint: '#93a7bd', speck: 0.08, name: '花岗岩' },
  lantern: { course: 2.6, joint: '#120d1c', speck: 0.12, warm: true, name: '石板街' },
  pine:    { course: 6.0, joint: '#1a1530', speck: 0.14, dash: true, name: '沥青' },
  plane:   { course: 2.8, joint: '#6b4a2a', speck: 0.10, leaf: true, name: '梧桐柏油' },
  street:  { course: 2.2, joint: '#6b3a30', speck: 0.12, warm: true, name: '老门东石板' },
  maple:   { course: 3.2, joint: '#5f2a1a', speck: 0.12, leaf: true, name: '枫叶砾石' },
  pagoda:  { course: 2.4, joint: '#1a2440', speck: 0.10, warm: true, name: '琉璃砖' },
  bridge:  { course: 5.0, joint: '#1c2c4a', speck: 0.14, dash: true, wide: true, name: '钢桥面' },
};

/* 平铺噪点材质(只建一次,滚动 drawImage 实现路面质感) */
let noiseCv = null;
function noiseTile(){
  if(noiseCv) return noiseCv;
  noiseCv = document.createElement('canvas');
  noiseCv.width = noiseCv.height = 256;
  const c = noiseCv.getContext('2d');
  for(let i = 0; i < 1700; i++){
    const v = Math.random();
    c.fillStyle = v < 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)';
    c.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  }
  return noiseCv;
}

export function drawRoad(lv, dist){
  const t = TEX[lv.motif] || TEX.crenel;
  const pN = proj(-ROAD_HALF, 0, 2.2), pN2 = proj(ROAD_HALF, 0, 2.2);
  const pF = proj(-ROAD_HALF, 0, DRAWD), pF2 = proj(ROAD_HALF, 0, DRAWD);
  const yN = Math.min(pN.y, H + 40);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pF.x, pF.y); ctx.lineTo(pF2.x, pF2.y);
  ctx.lineTo(pN2.x, yN); ctx.lineTo(pN.x, yN);
  ctx.closePath();
  ctx.fillStyle = lv.road; ctx.fill();
  ctx.clip();
  // 噪点材质(随 dist 滚动)
  const tile = noiseTile(), off = (dist * 52) % 256;
  ctx.globalAlpha = t.speck;
  for(let y = -off - 256; y < H; y += 256)
    for(let x = 0; x < W; x += 256)
      ctx.drawImage(tile, x, y);
  ctx.globalAlpha = 1;
  if(t.vanguard){
    const sheen = ctx.createLinearGradient(0,0,0,H);
    sheen.addColorStop(0,'rgba(255,236,198,0)');
    sheen.addColorStop(0.55,'rgba(255,228,180,0.10)');
    sheen.addColorStop(1,'rgba(120,78,42,0.08)');
    ctx.fillStyle = sheen; ctx.fillRect(0,0,W,H);
  }
  // 横向缝(透视投影,兼作前进感条纹)
  const z0 = Math.floor((dist - ZP) / t.course) * t.course + t.course;
  for(let z = z0; z < dist - ZP + DRAWD; z += t.course){
    const rz = z - dist + ZP; if(rz < 2.2) continue;
    const a = proj(-ROAD_HALF, 0, rz), b = proj(ROAD_HALF, 0, rz);
    ctx.strokeStyle = t.joint;
    ctx.globalAlpha = clamp(0.55 * (1 - rz / DRAWD) + 0.08, 0, 0.6);
    ctx.lineWidth = Math.max(1, a.s * 0.05);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // 玄武湖:路缘两道水光(贴边的高光带,随流动闪烁)
  if(t.water){
    for(const m of [-1, 1]){
      const a = proj(m * (ROAD_HALF - 0.12), 0, 2.2), b = proj(m * (ROAD_HALF - 0.12), 0, DRAWD);
      ctx.strokeStyle = '#9fd8c8';
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(dist * 2.4 + m);
      ctx.lineWidth = Math.max(1.5, a.s * 0.05);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // 夫子庙:路面暖色灯影(两团随距离掠过的光池)
  if(t.warm){
    for(const zoff of [5, 12, 20, 30]){
      const rz = (zoff * 7 - (dist % (zoff * 7))) + 4;
      if(rz < 2.2 || rz > DRAWD) continue;
      const p = proj((zoff % 2 ? -0.9 : 0.9), 0, rz);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 0.9);
      g.addColorStop(0, 'rgba(240,182,76,0.20)'); g.addColorStop(1, 'rgba(240,182,76,0)');
      ctx.fillStyle = g;
      ctx.fillRect(p.x - p.s, p.y - p.s * 0.4, p.s * 2, p.s * 0.8);
    }
  }
  // 紫金山/大桥:中央黄色虚线(盘山公路/桥面标线)
  if(t.dash){
    ctx.strokeStyle = '#c9b458'; ctx.lineCap = 'butt';
    for(let z = z0; z < dist - ZP + DRAWD; z += t.course){
      const rz0 = z - dist + ZP, rz1 = rz0 + t.course * 0.45;
      if(rz1 < 2.2) continue;
      const a = proj(0, 0, Math.max(2.2, rz0)), b = proj(0, 0, rz1);
      ctx.globalAlpha = clamp(0.7 * (1 - rz0 / DRAWD), 0, 0.7);
      ctx.lineWidth = Math.max(1.5, a.s * 0.05);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // 颐和路/栖霞山:飘落的梧桐叶/枫叶铺在路面上(随距离滚动,深色路面上的亮色)
  if(t.leaf){
    ctx.globalAlpha = 0.5;
    for(let i = 0; i < 8; i++){
      const zoff = ((i * 7 + 3) % 28) + 4;
      const rz = (zoff * 6 - (dist % (zoff * 6))) + 3;
      if(rz < 2.2 || rz > DRAWD) continue;
      const p = proj((i % 2 ? -0.8 : 0.6) + Math.sin(i * 1.7) * 0.5, 0, rz);
      ctx.fillStyle = t === TEX.maple ? '#e0783a' : '#d8b04a';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.s * 0.09, p.s * 0.04, i * 0.7, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // 车道分隔线(保留原手感;大桥 lane 加宽 1px,钢桥面标线更清晰)
  for(const lx of [-LANEGAP / 2, LANEGAP / 2]){
    const a = proj(lx, 0, 2.2), b = proj(lx, 0, DRAWD);
    ctx.strokeStyle = lv.lane; ctx.globalAlpha = t.vanguard ? 0.64 : 0.5; ctx.lineWidth = t.wide ? 3 : 2;
    if(t.vanguard){ ctx.shadowColor='rgba(240,210,150,0.45)'; ctx.shadowBlur=6; }
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  // 路缘石(亮一线,界定路肩)
  for(const m of [-1, 1]){
    const a = proj(m * ROAD_HALF, 0, 2.2), b = proj(m * ROAD_HALF, 0, DRAWD);
    ctx.strokeStyle = lv.lane; ctx.globalAlpha = 0.35;
    ctx.lineWidth = Math.max(2, a.s * 0.06);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
