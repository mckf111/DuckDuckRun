import { ctx, TAU, HOR, poly, disc, petalFlower, proj, clamp, ROAD_HALF, ZP } from '../core.js';

/* ================= 两侧走廊装饰(多色插画,与实景照片同色系) ================= */
export function drawSide(motif, x, y, s, lv, mirror){
  const m = mirror ? -1 : 1;
  if(motif==='crenel'){          // 城墙段:青砖 + 垛口 + 墙头红灯笼
    const w = '#6b6560', wl = '#8a837a', wd = '#544e48';
    poly([[x-1.2*s,y],[x-1.2*s,y-1.5*s],[x+1.2*s,y-1.5*s],[x+1.2*s,y]], w);
    ctx.fillStyle = wl; ctx.fillRect(x-1.2*s, y-1.5*s, 2.4*s, 0.14*s);   // 墙顶受光
    ctx.strokeStyle = wd; ctx.lineWidth = Math.max(1, s*0.02);
    for(let i=1;i<=2;i++){ ctx.beginPath(); ctx.moveTo(x-1.2*s, y-i*0.5*s); ctx.lineTo(x+1.2*s, y-i*0.5*s); ctx.stroke(); } // 砖缝
    ctx.fillStyle = w;
    for(let i=0;i<4;i++) ctx.fillRect(x-1.15*s+i*0.62*s, y-1.72*s, 0.34*s, 0.25*s);  // 垛口
    ctx.fillStyle = wl;
    for(let i=0;i<4;i++) ctx.fillRect(x-1.15*s+i*0.62*s, y-1.72*s, 0.34*s, 0.05*s);
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = Math.max(1, s*0.02);    // 灯笼绳
    ctx.beginPath(); ctx.moveTo(x+m*0.7*s, y-1.72*s); ctx.lineTo(x+m*0.7*s, y-1.56*s); ctx.stroke();
    disc(x+m*0.7*s, y-1.42*s, 0.14*s, '#e2483d');
    ctx.fillStyle = 'rgba(240,182,76,0.28)';
    ctx.beginPath(); ctx.arc(x+m*0.7*s, y-1.42*s, 0.24*s, 0, TAU); ctx.fill();
  } else if(motif==='lotus'){    // 湖堤:矮石栏 + 荷叶荷花 + 垂柳(树冠成团)
    ctx.fillStyle = '#7a8a80'; ctx.fillRect(x-0.9*s, y-0.34*s, 1.8*s, 0.34*s);   // 矮石栏
    ctx.fillStyle = '#93a298'; ctx.fillRect(x-0.9*s, y-0.34*s, 1.8*s, 0.08*s);
    disc(x-0.62*s, y-0.05*s, 0.22*s, '#2f6b52');                          // 栏下荷叶
    disc(x+0.55*s, y-0.07*s, 0.26*s, '#3f7a5a');
    petalFlower(x+0.55*s, y-0.32*s, 0.15*s, '#d98ba0');                   // 一朵荷花
    ctx.strokeStyle = '#4a3a2c'; ctx.lineWidth = Math.max(1.5, s*0.05);   // 柳干
    ctx.beginPath(); ctx.moveTo(x, y-0.34*s); ctx.quadraticCurveTo(x+m*0.16*s, y-1.3*s, x+m*0.1*s, y-1.95*s); ctx.stroke();
    disc(x+m*0.08*s, y-1.98*s, 0.45*s, '#4a7a52');                        // 树冠两团
    disc(x+m*0.38*s, y-1.68*s, 0.34*s, '#5a8a5f');
    ctx.lineWidth = Math.max(1, s*0.026);
    for(let i=0;i<5;i++){                                                 // 垂条
      const bx = x+m*(0.1+0.15*i)*s;
      ctx.strokeStyle = i%2 ? '#5a8a5f' : '#7ba86f';
      ctx.beginPath(); ctx.moveTo(bx, y-(1.8-0.05*i)*s);
      ctx.quadraticCurveTo(bx+m*0.1*s, y-1.2*s, bx+m*0.03*s, y-(0.62+0.05*i)*s); ctx.stroke();
    }
  } else if(motif==='steps'){    // 雪松:棕干 + 三层蓝绿
    ctx.fillStyle = '#4a3a30'; ctx.fillRect(x-0.08*s, y-0.5*s, 0.16*s, 0.5*s);
    poly([[x,y-2.4*s],[x-0.8*s,y-1.3*s],[x+0.8*s,y-1.3*s]], '#3a6b56');
    poly([[x,y-1.9*s],[x-0.95*s,y-0.7*s],[x+0.95*s,y-0.7*s]], '#2f5a48');
    poly([[x-0.08*s,y-2.28*s],[x-0.5*s,y-1.5*s],[x+0.1*s,y-1.55*s]], '#4a8570'); // 受光面
  } else if(motif==='lantern'){  // 灯笼杆:木杆挑灯 + 暖光晕
    ctx.strokeStyle = '#4a2c3a'; ctx.lineWidth = Math.max(1.5, s*0.03);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-2.4*s); ctx.lineTo(x+m*0.7*s, y-2.4*s); ctx.stroke();
    disc(x+m*0.55*s, y-2.05*s, 0.3*s, '#e2483d');
    ctx.fillStyle = '#c8342e';
    ctx.beginPath(); ctx.ellipse(x+m*0.55*s, y-2.05*s, 0.16*s, 0.3*s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(240,182,76,0.35)';
    ctx.beginPath(); ctx.arc(x+m*0.55*s, y-2.05*s, 0.48*s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f0b64c';
    ctx.fillRect(x+m*0.45*s, y-2.4*s, 0.2*s, 0.06*s);
    poly([[x+m*0.48*s,y-1.75*s],[x+m*0.62*s,y-1.75*s],[x+m*0.55*s,y-1.5*s]], '#f0b64c');
  } else {                       // 松树:棕干 + 三层墨绿 + 受光棱
    ctx.fillStyle = '#3a2f28'; ctx.fillRect(x-0.09*s, y-0.6*s, 0.18*s, 0.6*s);
    poly([[x,y-2.6*s],[x-0.7*s,y-1.6*s],[x+0.7*s,y-1.6*s]], '#2a5a45');
    poly([[x,y-2.0*s],[x-0.9*s,y-0.9*s],[x+0.9*s,y-0.9*s]], '#1f4a38');
    poly([[x,y-1.4*s],[x-1.05*s,y-0.4*s],[x+1.05*s,y-0.4*s]], '#2a5a45');
    poly([[x-0.08*s,y-2.45*s],[x-0.42*s,y-1.75*s],[x+0.05*s,y-1.8*s]], '#3f6b52');
  }
}

/* 远景天际线剪影(照片缺失时的回退,正常流程不走) */
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
    poly([[bx+140,base],[bx+140,base-55],[bx+155,base-88],[bx+170,base-55],[bx+170,base]], lv.sideTop);
  }
  ctx.globalAlpha = 1;
}

/* 远景地标剪影(回退用) */
export function drawLandmark(id, lv, dist){
  const base = HOR + 2;
  const off = (dist*2) % 720;
  ctx.globalAlpha = 0.55;
  for(let i=-1;i<3;i++){
    drawLm(id, lv, i*720 - off + 360, base);
  }
  ctx.globalAlpha = 1;
}

function drawLm(id, lv, x, base){
  const SIL = lv.lmColor || lv.sideTop, SKY = lv.sky[1];
  ctx.fillStyle = SIL;
  if(id==='zhonghua'){
    ctx.fillRect(x-110, base-58, 220, 58);
    for(let k=0;k<9;k++) ctx.fillRect(x-104+k*24, base-66, 12, 8);
    ctx.fillStyle = SKY;
    for(const k of [-1,0,1]){
      ctx.beginPath();
      ctx.moveTo(x+k*64-15, base); ctx.lineTo(x+k*64-15, base-24);
      ctx.arc(x+k*64, base-24, 15, Math.PI, 0);
      ctx.lineTo(x+k*64+15, base); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = SIL;
    ctx.fillRect(x-30, base-84, 60, 26);
    poly([[x-46,base-84],[x-26,base-98],[x+26,base-98],[x+46,base-84]], SIL);
    ctx.fillRect(x-14, base-108, 28, 10);
    poly([[x-22,base-108],[x,base-118],[x+22,base-108]], SIL);
  } else if(id==='jiming'){
    let w = 60, y0 = base;
    for(let k=0;k<5;k++){
      ctx.fillRect(x-w/2, y0-13, w, 13);
      poly([[x-w/2-9,y0-13],[x,y0-21],[x+w/2+9,y0-13]], SIL);
      y0 -= 21; w *= 0.8;
    }
    ctx.fillRect(x-2, y0-12, 4, 12);
    poly([[x-6,y0-12],[x+6,y0-12],[x,y0-22]], SIL);
  } else if(id==='sunyard'){
    poly([[x-95,base],[x-72,base-14],[x+72,base-14],[x+95,base]], SIL);
    ctx.fillRect(x-52, base-54, 104, 40);
    ctx.fillStyle = SKY;
    for(const k of [-1,0,1]){
      ctx.beginPath();
      ctx.moveTo(x+k*30-8, base-14); ctx.lineTo(x+k*30-8, base-36);
      ctx.arc(x+k*30, base-36, 8, Math.PI, 0);
      ctx.lineTo(x+k*30+8, base-14); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#2e5f8a';
    poly([[x-66,base-54],[x-42,base-82],[x+42,base-82],[x+66,base-54]], '#2e5f8a');
    poly([[x-32,base-82],[x-20,base-92],[x+20,base-92],[x+32,base-82]], '#2e5f8a');
  } else if(id==='zhaobi'){
    ctx.fillRect(x-120, base-50, 240, 50);
    poly([[x-132,base-50],[x-118,base-62],[x+118,base-62],[x+132,base-50]], SIL);
    ctx.strokeStyle = lv.accent; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x-92, base-18);
    ctx.quadraticCurveTo(x-62, base-44, x-34, base-20);
    ctx.quadraticCurveTo(x-20, base-10, x-10, base-24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+92, base-18);
    ctx.quadraticCurveTo(x+62, base-44, x+34, base-20);
    ctx.quadraticCurveTo(x+20, base-10, x+10, base-24); ctx.stroke();
    disc(x, base-24, 7, '#f0b64c');
    ctx.fillStyle = 'rgba(240,182,76,0.4)';
    ctx.beginPath(); ctx.arc(x, base-24, 12, 0, TAU); ctx.fill();
  } else if(id==='observatory'){
    poly([[x-150,base],[x-60,base-32],[x+70,base-28],[x+150,base]], SIL);
    ctx.fillStyle = '#b9c4d6';
    ctx.beginPath(); ctx.arc(x-16, base-40, 20, Math.PI, 0); ctx.fill();
    ctx.fillRect(x-36, base-40, 40, 12);
    ctx.beginPath(); ctx.arc(x+38, base-36, 12, Math.PI, 0); ctx.fill();
    ctx.fillRect(x+26, base-36, 24, 9);
    ctx.strokeStyle = SIL; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x-16, base-60); ctx.lineTo(x-16, base-46); ctx.stroke();
  } else if(id==='bridge'){
    const bw = 320;
    ctx.fillRect(x-bw/2, base-48, bw, 6);
    ctx.fillRect(x-bw/2, base-28, bw, 6);
    for(let k=0;k<=10;k++) ctx.fillRect(x-bw/2+k*bw/10-1, base-48, 2, 26);
    for(const k of [-1,0,1]) ctx.fillRect(x+k*110-5, base-22, 10, 22);
    ctx.fillRect(x-bw/2-16, base-80, 26, 38);
    poly([[x-bw/2-20,base-80],[x-bw/2-3,base-92],[x-bw/2+14,base-80]], SIL);
    ctx.fillRect(x-bw/2-9, base-100, 3, 10);
    poly([[x-bw/2-6,base-100],[x-bw/2+6,base-97],[x-bw/2-6,base-94]], '#e2483d');
  }
}

/* 秦淮河画舫:横向缓缓漂过(中景) */
export function drawBoat(x, y){
  poly([[x-70,y],[x-56,y-14],[x+56,y-14],[x+70,y]], '#120d1e');
  ctx.fillStyle = '#120d1e';
  ctx.fillRect(x-34, y-38, 68, 24);
  poly([[x-44,y-38],[x,y-52],[x+44,y-38]], '#1a1228');
  disc(x-22, y-28, 4, '#f0b64c'); disc(x, y-28, 4, '#f0b64c'); disc(x+22, y-28, 4, '#f0b64c');
  disc(x+52, y-20, 5, '#e2483d');
}

/* 穿越门地标:随深度逼近放大,掠过头顶时淡出;不参与碰撞 */
export function drawGate(g, lv){
  const X = ROAD_HALF + 0.35;
  const pl1 = proj(-X, 0, g.rz), pr1 = proj(X, 0, g.rz);
  const pl2 = proj(-X, 3.0, g.rz), pr2 = proj(X, 3.0, g.rz);
  const s = pl1.s;
  ctx.globalAlpha = clamp((g.rz - ZP + 0.6)/2.4, 0, 1);
  const motif = lv.motif;
  // 各关门的真实材质色
  const GATEC = {
    crenel:  { pillar:'#6b6560', beam:'#544e48', trim:'#e8b04b' },
    lotus:   { pillar:'#4a3a2c', beam:'#1f4a42', trim:'#a8d5a2' },
    steps:   { pillar:'#aeb9c9', beam:'#2e5f8a', trim:'#5a7ca6' },
    lantern: { pillar:'#3d2430', beam:'#4a2030', trim:'#f0b64c' },
    pine:    { pillar:'#5a5a6b', beam:'#3a3552', trim:'#c9a2ff' },
  }[motif] || { pillar: lv.side, beam: lv.sideTop, trim: lv.accent };
  const { pillar, beam, trim } = GATEC;
  const pw = 0.3*s, bh = 0.24*s;
  ctx.fillStyle = pillar;
  ctx.fillRect(pl1.x-pw/2, pl2.y, pw, pl1.y-pl2.y);
  ctx.fillRect(pr1.x-pw/2, pr2.y, pw, pr1.y-pr2.y);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';                 // 柱受光棱
  ctx.fillRect(pl1.x-pw/2, pl2.y, pw*0.22, pl1.y-pl2.y);
  ctx.fillRect(pr1.x-pw/2, pr2.y, pw*0.22, pr1.y-pr2.y);
  poly([[pl2.x,pl2.y],[pr2.x,pr2.y],[pr2.x,pr2.y-bh],[pl2.x,pl2.y-bh]], beam, trim, Math.max(1.5,s*0.02));
  const cxm = (pl2.x+pr2.x)/2;
  ctx.fillStyle = trim;
  ctx.fillRect(cxm-0.34*s, pl2.y-bh*0.5-0.14*s, 0.68*s, 0.28*s);
  if(motif==='crenel'){          // 中华门:城垛 + 两盏灯笼
    ctx.fillStyle = pillar;
    const n = 7, step = (pr2.x-pl2.x)/n;
    for(let i=0;i<n;i++) ctx.fillRect(pl2.x+i*step+step*0.2, pl2.y-bh-0.14*s, step*0.6, 0.14*s);
    for(const k of [0.3, 0.7]){
      const hx = pl2.x+(pr2.x-pl2.x)*k;
      ctx.strokeStyle = trim; ctx.lineWidth = Math.max(1, s*0.02);
      ctx.beginPath(); ctx.moveTo(hx, pl2.y); ctx.lineTo(hx, pl2.y+0.12*s); ctx.stroke();
      disc(hx, pl2.y+0.26*s, 0.14*s, '#e2483d');
    }
  } else if(motif==='lotus'){    // 湖堤柳门:门楣垂下柳帘
    poly([[pl2.x,pl2.y-bh],[pr2.x,pr2.y-bh],[pr2.x,pr2.y-bh-0.1*s],[pl2.x,pl2.y-bh-0.1*s]], '#1f4a42');
    const n = 9;
    for(let i=0;i<=n;i++){
      const hx = pl2.x+(pr2.x-pl2.x)*i/n;
      ctx.strokeStyle = i%2 ? '#5a8a5f' : '#7ba86f'; ctx.lineWidth = Math.max(1, s*0.02);
      ctx.beginPath(); ctx.moveTo(hx, pl2.y);
      ctx.quadraticCurveTo(hx+0.06*s, pl2.y+0.5*s, hx-0.03*s, pl2.y+(0.9+0.2*Math.sin(i*2.1))*s);
      ctx.stroke();
    }
  } else if(motif==='steps'){    // 博爱坊:蓝瓦三楼
    const roof = '#2e5f8a';
    poly([[cxm-1.1*s,pl2.y-bh],[cxm-0.8*s,pl2.y-bh-0.34*s],[cxm+0.8*s,pl2.y-bh-0.34*s],[cxm+1.1*s,pl2.y-bh]], roof);
    poly([[pl2.x-0.2*s,pl2.y-bh],[pl2.x+0.15*s,pl2.y-bh-0.24*s],[pl2.x+0.55*s,pl2.y-bh-0.24*s],[pl2.x+0.7*s,pl2.y-bh]], roof);
    poly([[pr2.x+0.2*s,pr2.y-bh],[pr2.x-0.15*s,pr2.y-bh-0.24*s],[pr2.x-0.55*s,pr2.y-bh-0.24*s],[pr2.x-0.7*s,pr2.y-bh]], roof);
    poly([[cxm-1.1*s,pl2.y-bh],[cxm-0.8*s,pl2.y-bh-0.34*s],[cxm-0.5*s,pl2.y-bh-0.3*s],[cxm-0.85*s,pl2.y-bh-0.06*s]], '#3a6f9e'); // 瓦面受光
  } else if(motif==='lantern'){  // 天下文枢坊:翘檐 + 三盏灯笼
    poly([[cxm-1.3*s,pl2.y-bh],[cxm-0.7*s,pl2.y-bh-0.3*s],[cxm+0.7*s,pl2.y-bh-0.3*s],[cxm+1.3*s,pl2.y-bh]], '#3d1430');
    poly([[cxm-1.3*s,pl2.y-bh],[cxm-1.45*s,pl2.y-bh-0.18*s],[cxm-1.1*s,pl2.y-bh-0.1*s]], '#3d1430');
    poly([[cxm+1.3*s,pl2.y-bh],[cxm+1.45*s,pl2.y-bh-0.18*s],[cxm+1.1*s,pl2.y-bh-0.1*s]], '#3d1430');
    for(const k of [0.25, 0.5, 0.75]){
      const hx = pl2.x+(pr2.x-pl2.x)*k;
      ctx.strokeStyle = trim; ctx.lineWidth = Math.max(1, s*0.02);
      ctx.beginPath(); ctx.moveTo(hx, pl2.y); ctx.lineTo(hx, pl2.y+0.14*s); ctx.stroke();
      disc(hx, pl2.y+0.3*s, 0.16*s, '#e2483d');
      ctx.fillStyle = 'rgba(240,182,76,0.35)';
      ctx.beginPath(); ctx.arc(hx, pl2.y+0.3*s, 0.26*s, 0, TAU); ctx.fill();
    }
  } else {                       // 盘山牌坊:石坊 + 松枝
    poly([[cxm-0.9*s,pl2.y-bh],[cxm-0.6*s,pl2.y-bh-0.26*s],[cxm+0.6*s,pl2.y-bh-0.26*s],[cxm+0.9*s,pl2.y-bh]], beam);
    poly([[pl2.x,pl2.y-bh],[pl2.x-0.3*s,pl2.y-bh-0.35*s],[pl2.x+0.25*s,pl2.y-bh-0.5*s]], trim);
    poly([[pr2.x,pr2.y-bh],[pr2.x+0.3*s,pr2.y-bh-0.35*s],[pr2.x-0.25*s,pr2.y-bh-0.5*s]], trim);
  }
  ctx.globalAlpha = 1;
}

/* 近层装饰(快速掠过):栏杆柱/垂柳/灯笼串/松枝 */
export function drawNear(motif, x, y, s, lv, mirror){
  const m = mirror ? -1 : 1;
  if(motif==='crenel' || motif==='steps'){   // 石栏柱(两色受光)
    ctx.fillStyle = motif==='crenel' ? '#6b6560' : '#9db1c6';
    ctx.fillRect(x-0.12*s, y-1.1*s, 0.24*s, 1.1*s);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(x-0.12*s, y-1.1*s, 0.06*s, 1.1*s);
    disc(x, y-1.18*s, 0.17*s, motif==='crenel' ? '#8a837a' : '#c6d0de');
  } else if(motif==='lotus'){                // 垂柳
    ctx.strokeStyle = '#4a3a2c'; ctx.lineWidth = Math.max(1.5, s*0.05);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x+m*0.2*s, y-1.2*s, x+m*0.1*s, y-2.0*s); ctx.stroke();
    ctx.lineWidth = Math.max(1, s*0.025);
    for(let i=0;i<4;i++){
      const bx = x+m*(0.1+0.14*i)*s;
      ctx.strokeStyle = i%2 ? '#5a8a5f' : '#7ba86f';
      ctx.beginPath(); ctx.moveTo(bx, y-(1.9-0.08*i)*s);
      ctx.quadraticCurveTo(bx+m*0.12*s, y-1.3*s, bx+m*0.05*s, y-(0.7+0.06*i)*s); ctx.stroke();
    }
  } else if(motif==='lantern'){              // 灯笼串
    ctx.strokeStyle = '#4a2c3a'; ctx.lineWidth = Math.max(1.5, s*0.03);
    ctx.beginPath(); ctx.moveTo(x, y-2.2*s); ctx.quadraticCurveTo(x+m*0.5*s, y-1.8*s, x+m*1.0*s, y-2.1*s); ctx.stroke();
    for(let i=0;i<3;i++){
      const lx = x+m*(0.25+0.3*i)*s, ly = y-1.95*s - 0.12*s*Math.sin(i*1.3);
      disc(lx, ly, 0.16*s, '#e2483d');
      ctx.fillStyle = 'rgba(240,182,76,0.35)';
      ctx.beginPath(); ctx.arc(lx, ly, 0.26*s, 0, TAU); ctx.fill();
    }
  } else {                                   // 松枝(从上方扫过)
    ctx.strokeStyle = '#3a2f28'; ctx.lineWidth = Math.max(2, s*0.06);
    ctx.beginPath(); ctx.moveTo(x, y-2.6*s); ctx.lineTo(x+m*0.9*s, y-2.2*s); ctx.stroke();
    poly([[x+m*0.9*s,y-2.2*s],[x+m*0.3*s,y-2.0*s],[x+m*0.7*s,y-1.6*s]], '#2a5a45');
    poly([[x+m*0.6*s,y-2.35*s],[x+m*0.1*s,y-2.2*s],[x+m*0.45*s,y-1.9*s]], '#1f4a38');
  }
}
