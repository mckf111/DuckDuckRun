import { ctx, TAU, HOR, poly, disc, petalFlower } from '../core.js';

/* ================= 剪纸绘制:两侧走廊装饰 ================= */
export function drawSide(motif, x, y, s, lv, mirror){
  const m = mirror ? -1 : 1;
  const c = lv.side, t = lv.sideTop, a = lv.accent;
  if(motif==='crenel'){ // 城垛
    poly([[x-1.2*s,y],[x-1.2*s,y-1.5*s],[x+1.2*s,y-1.5*s],[x+1.2*s,y]], c);
    ctx.fillStyle=t;
    for(let i=0;i<4;i++) ctx.fillRect(x-1.15*s+i*0.62*s, y-1.72*s, 0.34*s, 0.25*s);
  } else if(motif==='lotus'){ // 荷叶丛
    ctx.fillStyle=c; ctx.fillRect(x-1.2*s, y-0.9*s, 2.4*s, 0.9*s);
    disc(x-0.5*s, y-1.0*s, 0.4*s, t); disc(x+0.45*s, y-1.05*s, 0.45*s, t);
    ctx.strokeStyle=a; ctx.lineWidth=Math.max(1,s*0.02);
    ctx.beginPath(); ctx.arc(x-0.5*s, y-1.0*s, 0.22*s, 0, TAU); ctx.stroke();
    petalFlower(x+0.45*s, y-1.5*s, 0.22*s, '#d98ba0');
  } else if(motif==='steps'){ // 雪松
    ctx.fillStyle=c; ctx.fillRect(x-0.08*s, y-0.5*s, 0.16*s, 0.5*s);
    poly([[x,y-2.4*s],[x-0.8*s,y-1.3*s],[x+0.8*s,y-1.3*s]], t);
    poly([[x,y-1.9*s],[x-0.95*s,y-0.7*s],[x+0.95*s,y-0.7*s]], t);
  } else if(motif==='lantern'){ // 灯笼杆
    ctx.strokeStyle=t; ctx.lineWidth=Math.max(1.5,s*0.03);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-2.4*s); ctx.lineTo(x+m*0.7*s, y-2.4*s); ctx.stroke();
    disc(x+m*0.55*s, y-2.05*s, 0.3*s, '#e2483d');
    ctx.fillStyle='rgba(240,182,76,0.35)';
    ctx.beginPath(); ctx.arc(x+m*0.55*s, y-2.05*s, 0.48*s, 0, TAU); ctx.fill();
    poly([[x+m*0.48*s,y-1.75*s],[x+m*0.62*s,y-1.75*s],[x+m*0.55*s,y-1.5*s]], a);
  } else { // 松树
    ctx.fillStyle=c; ctx.fillRect(x-0.09*s, y-0.6*s, 0.18*s, 0.6*s);
    poly([[x,y-2.6*s],[x-0.7*s,y-1.6*s],[x+0.7*s,y-1.6*s]], t);
    poly([[x,y-2.0*s],[x-0.9*s,y-0.9*s],[x+0.9*s,y-0.9*s]], t);
    poly([[x,y-1.4*s],[x-1.05*s,y-0.4*s],[x+1.05*s,y-0.4*s]], t);
  }
}

/* 远景天际线剪影(含紫峰大厦) */
export function drawSkyline(lv, dist){
  const base = HOR + 2;
  const off = (dist*4) % 240;
  ctx.fillStyle = lv.sideTop;
  ctx.globalAlpha = 0.55;
  for(let i=-1;i<6;i++){
    const bx = i*240 - off;
    const h1 = 30 + ((i*73)%50+50)%50, h2 = 20 + ((i*41)%40+40)%40;
    ctx.fillRect(bx, base-h1, 60, h1);
    ctx.fillRect(bx+70, base-h2, 45, h2);
    // 紫峰塔剪影:尖顶高楼
    poly([[bx+140,base],[bx+140,base-55],[bx+155,base-88],[bx+170,base-55],[bx+170,base]], lv.sideTop);
  }
  ctx.globalAlpha = 1;
}
