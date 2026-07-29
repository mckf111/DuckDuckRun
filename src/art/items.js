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
  } else if(id==='tea'){ // 雨花茶盏(无 CC 照片,多色插画:白瓷盏+绿茶汤+竖立松针茶叶)
    const cup = locked ? '#3a3344' : '#f5f2ea', rim = locked ? '#2c2735' : '#e0dccf';
    const soup = locked ? '#2c2735' : '#a8c47a', leaf = locked ? '#3a3344' : '#4a7a3a';
    ctx.fillStyle = locked ? '#2c2735' : '#d8d2c4';                     // 盏托
    ctx.beginPath(); ctx.ellipse(0, r*0.6, r*0.72, r*0.16, 0, 0, TAU); ctx.fill();
    poly([[-r*0.62,-r*0.26],[r*0.62,-r*0.26],[r*0.4,r*0.52],[-r*0.4,r*0.52]], cup);   // 盏身
    poly([[-r*0.62,-r*0.26],[r*0.62,-r*0.26],[r*0.54,-r*0.15],[-r*0.54,-r*0.15]], rim); // 盏口
    ctx.fillStyle = soup;                                                // 茶汤面
    ctx.beginPath(); ctx.ellipse(0, -r*0.2, r*0.5, r*0.11, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = leaf; ctx.lineWidth = r*0.05; ctx.lineCap = 'round'; // 竖立茶叶(形如松针)
    for(const [px, tilt] of [[-r*0.18,-0.14],[0.02*r,0.04],[r*0.2,0.16],[-r*0.04,-0.04]]){
      ctx.beginPath(); ctx.moveTo(px, -r*0.18); ctx.lineTo(px+tilt*r, -r*0.68); ctx.stroke();
    }
    ctx.strokeStyle = locked ? lite : 'rgba(255,255,255,0.65)';          // 热气
    ctx.lineWidth = r*0.06;
    for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*r*0.28, -r*0.46);
      ctx.quadraticCurveTo(i*r*0.28+r*0.1, -r*0.7, i*r*0.24, -r*0.9); ctx.stroke(); }
  } else if(id==='taro'){ // 糖芋苗
    ctx.fillStyle=main;
    ctx.beginPath(); ctx.arc(0,0,r*0.75,0,Math.PI); ctx.closePath(); ctx.fill();
    for(let i=0;i<3;i++) disc((i-1)*r*0.35,-r*0.12,r*0.17, lite);
    petalFlower(r*0.45,-r*0.5,r*0.22, locked?'#3a3344':'#f3d9a0');
  } else if(id==='plum'){ // 梅花
    petalFlower(0,0,r*0.85, main, lite);
  } else if(id==='pot'){ // 牛肉锅贴:月牙弯饺
    ctx.fillStyle = locked ? '#3a3344' : '#e8b04b';
    ctx.beginPath(); ctx.ellipse(0, r*0.1, r*0.85, r*0.42, -0.15, 0, TAU); ctx.fill();
    ctx.strokeStyle = locked ? '#2c2735' : '#c98a2a'; ctx.lineWidth = r*0.07;
    for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*r*0.28, -r*0.22); ctx.lineTo(i*r*0.28+r*0.1, r*0.02); ctx.stroke(); }
    ctx.fillStyle = locked ? '#2c2735' : '#f5d78a';                       // 受光面
    ctx.beginPath(); ctx.ellipse(-r*0.15, -r*0.05, r*0.5, r*0.18, -0.15, 0, TAU); ctx.fill();
  } else if(id==='bean'){ // 赤豆元宵:红糊小碗 + 白元宵
    ctx.fillStyle = locked ? '#3a3344' : '#8a3b34';
    ctx.beginPath(); ctx.arc(0, r*0.05, r*0.78, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = locked ? '#2c2735' : '#6b2a24';                        // 赤豆糊
    ctx.beginPath(); ctx.ellipse(0, r*0.02, r*0.7, r*0.2, 0, 0, TAU); ctx.fill();
    for(const [px,py] of [[-0.3,0],[0.05,-0.06],[0.38,0.02]]) disc(px*r, py*r, r*0.15, locked?'#3a3344':'#f5f0e6');
  } else if(id==='cloud'){ // 云锦:织金缎面 + 云纹
    poly([[0,-r*0.85],[r*0.85,0],[0,r*0.85],[-r*0.85,0]], locked?'#3a3344':'#7a2a3a');
    poly([[0,-r*0.6],[r*0.6,0],[0,r*0.6],[-r*0.6,0]], locked?'#2c2735':'#a03a4a');
    ctx.strokeStyle = locked ? lite : '#f0b64c'; ctx.lineWidth = r*0.07;
    for(const dy of [-0.25, 0.05, 0.35]){
      ctx.beginPath(); ctx.moveTo(-r*0.4, r*dy);
      ctx.quadraticCurveTo(-r*0.15, r*(dy-0.18), r*0.05, r*dy);
      ctx.quadraticCurveTo(r*0.2, r*(dy+0.14), r*0.4, r*(dy-0.06)); ctx.stroke();
    }
  } else if(id==='gold'){ // 金箔:层叠金片
    ctx.save(); ctx.rotate(0.12);
    ctx.fillStyle = locked ? '#3a3344' : '#d8a83a'; ctx.fillRect(-r*0.6, -r*0.42, r*1.2, r*0.84);
    ctx.fillStyle = locked ? '#2c2735' : '#f0c85a'; ctx.fillRect(-r*0.6, -r*0.42, r*1.2, r*0.3);
    ctx.strokeStyle = locked ? lite : '#a87a1e'; ctx.lineWidth = r*0.06;
    ctx.strokeRect(-r*0.6, -r*0.42, r*1.2, r*0.84);
    ctx.restore();
  } else if(id==='leaf'){ // 梧桐叶:掌状五裂
    ctx.fillStyle = locked ? '#3a3344' : '#c9903a';
    for(let i=0;i<5;i++){
      const a = -Math.PI/2 + (i-2)*0.5;
      ctx.beginPath(); ctx.ellipse(Math.cos(a)*r*0.34, Math.sin(a)*r*0.34, r*0.42, r*0.2, a, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = locked ? '#2c2735' : '#8a5a1e'; ctx.lineWidth = r*0.06;
    ctx.beginPath(); ctx.moveTo(0, r*0.2); ctx.lineTo(0, r*0.75); ctx.stroke();  // 叶柄
    for(let i=0;i<5;i++){ const a = -Math.PI/2 + (i-2)*0.5;
      ctx.beginPath(); ctx.moveTo(0, r*0.15); ctx.lineTo(Math.cos(a)*r*0.55, Math.sin(a)*r*0.55); ctx.stroke(); }
  } else if(id==='lamp'){ // 秦淮花灯:荷花灯
    ctx.fillStyle = locked ? '#3a3344' : '#e2483d';
    for(let i=0;i<6;i++){
      const a = -Math.PI/2 + i*TAU/6;
      ctx.beginPath(); ctx.ellipse(Math.cos(a)*r*0.4, Math.sin(a)*r*0.32, r*0.4, r*0.2, a, 0, TAU); ctx.fill();
    }
    disc(0, -r*0.05, r*0.28, locked ? '#2c2735' : '#f0b64c');            // 灯芯
    ctx.strokeStyle = locked ? lite : '#f0b64c'; ctx.lineWidth = r*0.06;
    ctx.beginPath(); ctx.moveTo(0, r*0.55); ctx.lineTo(0, r*0.9); ctx.stroke(); // 灯穗
    disc(0, r*0.62, r*0.08, locked ? '#2c2735' : '#f0b64c');
  } else { // 雨花石
    ctx.fillStyle=main;
    ctx.beginPath(); ctx.ellipse(0,0,r*0.8,r*0.6,0.4,0,TAU); ctx.fill();
    ctx.strokeStyle=lite; ctx.lineWidth=r*0.08;
    ctx.beginPath(); ctx.ellipse(0,0,r*0.5,r*0.35,0.4,0,TAU); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0,0,r*0.22,r*0.14,0.4,0,TAU); ctx.stroke();
  }
  ctx.restore();
}
