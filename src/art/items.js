import { ctx, TAU, poly, disc, petalFlower } from '../core.js';

/* 图鉴图标:以 (x,y) 为中心,r 为半径 */
export function drawItemIcon(id, x, y, r, locked){
  const main = locked ? '#3a3344' : '#e2483d';
  const lite = locked ? '#2c2735' : '#f0b64c';
  ctx.save(); ctx.translate(x,y);
  if(id==='duck'){ // 盐水鸭剪影
    ctx.fillStyle=main;
    ctx.beginPath(); ctx.ellipse(0,r*0.15,r*0.85,r*0.5,0,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.55,-r*0.35,r*0.3,0,TAU); ctx.fill();
    poly([[r*0.78,-r*0.4],[r*1.05,-r*0.3],[r*0.78,-r*0.22]], main);
    if(!locked) disc(r*0.62,-r*0.42,r*0.05,'#fff');
    poly([[-r*0.7,-r*0.15],[-r*1.05,-r*0.45],[-r*0.85,0]], main);
  } else if(id==='fans'){ // 一碗粉丝汤
    ctx.fillStyle=main;
    ctx.beginPath(); ctx.arc(0,0,r*0.8,0,Math.PI); ctx.closePath(); ctx.fill();
    poly([[-r*0.9,0],[r*0.9,0],[r*0.8,0],[ -r*0.8,0]], main);
    ctx.strokeStyle=lite; ctx.lineWidth=r*0.09;
    for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*r*0.3,-r*0.05);
      ctx.quadraticCurveTo(i*r*0.3+r*0.12,-r*0.5,i*r*0.25,-r*0.8); ctx.stroke(); }
    disc(r*0.45,-r*0.15,r*0.12,lite);
  } else if(id==='tea'){ // 雨花茶盏
    poly([[-r*0.6,-r*0.2],[r*0.6,-r*0.2],[r*0.4,r*0.5],[-r*0.4,r*0.5]], main);
    poly([[-r*0.3,r*0.55],[r*0.3,r*0.55],[r*0.35,r*0.7],[-r*0.35,r*0.7]], main);
    ctx.strokeStyle=lite; ctx.lineWidth=r*0.08;
    for(let i=0;i<3;i++){ const px=(i-1)*r*0.28;
      ctx.beginPath(); ctx.moveTo(px,-r*0.3);
      ctx.quadraticCurveTo(px+r*0.1,-r*0.6,px,-r*0.9); ctx.stroke(); }
  } else if(id==='taro'){ // 糖芋苗
    ctx.fillStyle=main;
    ctx.beginPath(); ctx.arc(0,0,r*0.75,0,Math.PI); ctx.closePath(); ctx.fill();
    for(let i=0;i<3;i++) disc((i-1)*r*0.35,-r*0.12,r*0.17, lite);
    petalFlower(r*0.45,-r*0.5,r*0.22, locked?'#3a3344':'#f3d9a0');
  } else if(id==='plum'){ // 梅花
    petalFlower(0,0,r*0.85, main, lite);
  } else { // 雨花石
    ctx.fillStyle=main;
    ctx.beginPath(); ctx.ellipse(0,0,r*0.8,r*0.6,0.4,0,TAU); ctx.fill();
    ctx.strokeStyle=lite; ctx.lineWidth=r*0.08;
    ctx.beginPath(); ctx.ellipse(0,0,r*0.5,r*0.35,0.4,0,TAU); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0,0,r*0.22,r*0.14,0.4,0,TAU); ctx.stroke();
  }
  ctx.restore();
}
