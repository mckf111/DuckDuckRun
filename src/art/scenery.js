import { ctx, TAU, HOR, poly, disc, petalFlower, proj, clamp, shadow, ROAD_HALF, ZP } from '../core.js';

/* ================= 两侧走廊装饰(多色插画,与实景照片同色系) ================= */
/* 红灯笼:径向柔光晕 + 竖向骨架 + 上下收口 + 穗(替代过去的实心圆盘) */
function lantern(x, y, r){
  const g = ctx.createRadialGradient(x, y, r*0.2, x, y, r*1.8);
  g.addColorStop(0, 'rgba(240,182,76,0.42)'); g.addColorStop(1, 'rgba(240,182,76,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r*1.8, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e2483d';
  ctx.beginPath(); ctx.ellipse(x, y, r*0.88, r, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#b02a24'; ctx.lineWidth = Math.max(1, r*0.09);   // 骨架弧
  for(const k of [0.55, 0.28]){ ctx.beginPath(); ctx.ellipse(x, y, r*k, r, 0, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#f0b64c';
  ctx.fillRect(x-r*0.32, y-r*1.16, r*0.64, r*0.2);                    // 上盖
  ctx.fillRect(x-r*0.32, y+r*0.96, r*0.64, r*0.2);                    // 下托
  ctx.strokeStyle = '#f0b64c'; ctx.lineWidth = Math.max(1, r*0.1);
  ctx.beginPath(); ctx.moveTo(x, y+r*1.16); ctx.lineTo(x, y+r*1.5); ctx.stroke(); // 穗
}

export function drawSide(motif, x, y, s, lv, mirror){
  const m = mirror ? -1 : 1;
  shadow(x, y+0.02*s, 1.05*s, 0.22);   // 接触影:装饰"落地"
  if(motif==='crenel'){          // 城墙段:青砖 + 垛口 + 墙头红灯笼
    const wall = ctx.createLinearGradient(x-1.2*s,y-0.88*s,x+1.2*s,y);
    wall.addColorStop(0,'#526579'); wall.addColorStop(0.42,'#35495d'); wall.addColorStop(1,'#1b2a3a');
    poly([[x-1.2*s,y],[x-1.2*s,y-0.88*s],[x+1.2*s,y-0.88*s],[x+1.2*s,y]], wall);
    ctx.fillStyle = 'rgba(151,184,207,0.38)'; ctx.fillRect(x-1.2*s, y-0.88*s, 2.4*s, 0.09*s); // 月光顶面
    ctx.fillStyle = 'rgba(5,13,24,0.34)'; ctx.fillRect(x+0.98*s, y-0.79*s, 0.22*s, 0.79*s);   // 右侧压暗
    ctx.strokeStyle = 'rgba(15,26,39,0.52)'; ctx.lineWidth = Math.max(1, s*0.018);
    for(let row=0;row<3;row++){
      const yy=y-(row+1)*0.27*s;
      ctx.beginPath();ctx.moveTo(x-1.2*s,yy);ctx.lineTo(x+1.2*s,yy);ctx.stroke();
      const shift=row%2?0.28:0;
      for(let bx=-0.9+shift;bx<1.05;bx+=0.58){
        ctx.beginPath();ctx.moveTo(x+bx*s,yy);ctx.lineTo(x+bx*s,yy+0.27*s);ctx.stroke();
      }
    }
    for(let i=0;i<4;i++){
      const bx=x-1.15*s+i*0.62*s;
      ctx.fillStyle = '#34495d';ctx.fillRect(bx,y-1.1*s,0.34*s,0.23*s);
      ctx.fillStyle = 'rgba(161,194,216,0.5)';ctx.fillRect(bx,y-1.1*s,0.34*s,0.04*s);
      ctx.fillStyle = 'rgba(9,18,29,0.32)';ctx.fillRect(bx+0.27*s,y-1.06*s,0.07*s,0.19*s);
    }
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = Math.max(1, s*0.02);    // 灯笼绳
    ctx.beginPath(); ctx.moveTo(x+m*0.7*s, y-1.1*s); ctx.lineTo(x+m*0.7*s, y-0.94*s); ctx.stroke();
    lantern(x+m*0.7*s, y-0.73*s, 0.13*s);
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
  } else if(motif==='lantern'){  // 灯笼杆:木杆挑灯 + 径向暖光晕
    ctx.strokeStyle = '#4a2c3a'; ctx.lineWidth = Math.max(1.5, s*0.03);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-2.4*s); ctx.lineTo(x+m*0.7*s, y-2.4*s); ctx.stroke();
    lantern(x+m*0.55*s, y-2.05*s, 0.3*s);
  } else if(motif==='plane'){    // 颐和路:黄墙洋房 + 梧桐树
    ctx.fillStyle = '#c9a868'; ctx.fillRect(x-1.15*s, y-1.5*s, 2.3*s, 1.5*s);      // 黄墙
    ctx.fillStyle = '#b8985a'; ctx.fillRect(x-1.15*s, y-1.5*s, 2.3*s, 0.12*s);     // 檐口
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x-1.05*s, y-1.42*s, 2.1*s, 0.1*s);
    for(const k of [-0.6, 0.15, 0.75]){                                             // 拱窗
      ctx.fillStyle = '#7a5a34';
      ctx.beginPath(); ctx.moveTo(x+k*s-0.14*s, y-0.2*s); ctx.lineTo(x+k*s-0.14*s, y-1.1*s);
      ctx.arc(x+k*s, y-1.1*s, 0.14*s, Math.PI, 0); ctx.lineTo(x+k*s+0.14*s, y-0.2*s); ctx.fill();
    }
    ctx.fillStyle = '#5a4428'; ctx.fillRect(x-0.08*s, y-2.5*s, 0.16*s, 1.05*s);    // 梧桐干
    disc(x-0.5*s, y-2.3*s, 0.62*s, '#d8a83a');                                     // 金黄树冠
    disc(x+0.42*s, y-2.55*s, 0.5*s, '#c9983a');
    disc(x+0.1*s, y-1.95*s, 0.36*s, '#e0b84a');
  } else if(motif==='street'){   // 老门东:粉墙黛瓦 + 木幌子
    ctx.fillStyle = '#d8a89a'; ctx.fillRect(x-1.15*s, y-1.4*s, 2.3*s, 1.4*s);      // 粉墙
    poly([[x-1.15*s,y-1.4*s],[x-1.05*s,y-1.72*s],[x+1.05*s,y-1.72*s],[x+1.15*s,y-1.4*s]], '#3a3a46', '#2a2a34', Math.max(1, s*0.02)); // 黛瓦檐
    ctx.fillStyle = '#8a5a4a'; ctx.fillRect(x-1.05*s, y-1.34*s, 2.1*s, 0.06*s);
    ctx.strokeStyle = '#4a2c3a'; ctx.lineWidth = Math.max(1, s*0.02);              // 幌子杆
    ctx.beginPath(); ctx.moveTo(x+m*0.55*s, y-1.72*s); ctx.lineTo(x+m*0.55*s, y-1.9*s); ctx.stroke();
    ctx.fillStyle = '#e8d8b0'; ctx.fillRect(x+m*0.55*s-0.2*s, y-2.14*s, 0.4*s, 0.28*s);   // 幌子
    ctx.fillStyle = '#a83a2e'; ctx.fillRect(x+m*0.55*s-0.14*s, y-2.05*s, 0.28*s, 0.1*s);
    lantern(x+m*0.9*s, y-1.6*s, 0.13*s);
  } else if(motif==='maple'){    // 栖霞山:红枫(赤金树冠 + 棕干)
    ctx.fillStyle = '#5a3528'; ctx.fillRect(x-0.09*s, y-2.3*s, 0.18*s, 1.2*s);
    ctx.fillStyle = '#e0783a';                                                      // 红枫三团
    disc(x-0.5*s, y-2.2*s, 0.58*s, '#e0783a');
    disc(x+0.48*s, y-2.45*s, 0.52*s, '#d0682a');
    disc(x+0.05*s, y-1.9*s, 0.4*s, '#e8884a');
    disc(x-0.35*s, y-2.55*s, 0.3*s, '#f0904a');
  } else if(motif==='pagoda'){   // 大报恩寺:琉璃塔角 + 金檐 + 光晕
    const g = ctx.createRadialGradient(x, y-1.4*s, s*0.2, x, y-1.4*s, s*1.8);
    g.addColorStop(0, 'rgba(232,193,112,0.28)'); g.addColorStop(1, 'rgba(232,193,112,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y-1.4*s, s*1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c9c2b0'; ctx.fillRect(x-0.3*s, y-1.9*s, 0.6*s, 1.9*s);        // 白琉璃塔身
    ctx.fillStyle = '#a89f8e'; ctx.fillRect(x-0.3*s, y-1.9*s, 0.16*s, 1.9*s);       // 受光棱
    for(let k=0;k<3;k++){                                                            // 金檐
      poly([[x-0.52*s,y-1.26*s-k*0.3*s],[x-0.3*s,y-1.5*s-k*0.3*s],[x+0.3*s,y-1.5*s-k*0.3*s],[x+0.52*s,y-1.26*s-k*0.3*s]], '#e8c170', '#b8934a', Math.max(1, s*0.02));
    }
    ctx.strokeStyle = '#e8c170'; ctx.lineWidth = Math.max(1, s*0.025);
    ctx.beginPath(); ctx.moveTo(x, y-1.9*s); ctx.lineTo(x, y-2.5*s); ctx.stroke();  // 塔刹
    disc(x, y-2.55*s, 0.08*s, '#e8c170');
  } else {                       // 大桥:路灯杆 + 斜拉钢索
    ctx.strokeStyle = '#4a5a74'; ctx.lineWidth = Math.max(1.5, s*0.03);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-2.3*s); ctx.stroke();        // 灯杆
    ctx.beginPath(); ctx.moveTo(x, y-2.3*s); ctx.lineTo(x+m*0.75*s, y-1.6*s); ctx.stroke();  // 钢索
    ctx.beginPath(); ctx.moveTo(x, y-2.3*s); ctx.lineTo(x+m*0.55*s, y-1.1*s); ctx.stroke();
    lantern(x, y-2.38*s, 0.15*s);                                                     // 桥灯
    ctx.strokeStyle = '#3a4a66'; ctx.lineWidth = Math.max(1, s*0.028);               // 桥栏杆
    ctx.beginPath(); ctx.moveTo(x-1.1*s, y); ctx.lineTo(x+1.1*s, y); ctx.stroke();
    for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(x+i*0.55*s, y); ctx.lineTo(x+i*0.55*s, y-0.3*s); ctx.stroke(); }
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
    poly([[x-bw/2-6,base-100],[x+bw/2+6,base-97],[x-bw/2-6,base-94]], '#e2483d');
  } else if(id==='yihe'){      // 颐和路:民国洋房一排 + 梧桐
    for(const k of [-2,-1,0,1,2]){
      const hx = x+k*64;
      ctx.fillStyle = k%2 ? SIL : '#7a6238';
      ctx.fillRect(hx-24, base-44, 48, 44);
      ctx.fillStyle = SKY;                                    // 平顶女儿墙
      ctx.fillRect(hx-26, base-52, 52, 8);
      ctx.fillRect(hx-18, base-30, 12, 18);                   // 窗
      ctx.fillRect(hx+6, base-30, 12, 18);
    }
    ctx.fillStyle = SIL;
    ctx.fillRect(x+152, base-34, 6, 34);                      // 梧桐干
    disc(x+162, base-44, 22, SIL);
    disc(x+140, base-48, 16, SIL);
  } else if(id==='mendong'){   // 老门东:牌坊 + 两侧黛瓦山墙
    ctx.fillRect(x-28, base-58, 56, 58);
    poly([[x-44,base-58],[x-30,base-76],[x+30,base-76],[x+44,base-58]], SIL);
    ctx.fillRect(x-6, base-82, 12, 6);
    poly([[x-12,base-82],[x,base-90],[x+12,base-82]], SIL);
    for(const m of [-1,1]){                                   // 山墙
      poly([[x+m*84,base],[x+m*46,base],[x+m*38,base-40],[x+m*84,base-40]], SIL);
      poly([[x+m*84,base-40],[x+m*72,base-52],[x+m*88,base-52]], SKY);
    }
  } else if(id==='qixia'){     // 栖霞山:宝塔 + 枫树剪影
    let w = 26, y0 = base;
    for(let k=0;k<6;k++){
      ctx.fillRect(x-w/2, y0-9, w, 9);
      poly([[x-w/2-6,y0-9],[x,y0-16],[x+w/2+6,y0-9]], SIL);
      y0 -= 16; w *= 0.82;
    }
    ctx.fillRect(x-2, y0-10, 4, 10);
    poly([[x-5,y0-10],[x+5,y0-10],[x,y0-18]], SIL);
    for(const m of [-1,1]){                                   // 枫树团
      disc(x+m*70, base-46, 26, '#8a4a2a');
      disc(x+m*52, base-32, 20, '#8a4a2a');
    }
  } else if(id==='baoen'){     // 大报恩寺:细高琉璃塔 + 基座
    ctx.fillRect(x-60, base-16, 120, 16);
    ctx.fillRect(x-46, base-30, 92, 14);
    let w = 40, y0 = base-30;
    for(let k=0;k<9;k++){
      ctx.fillRect(x-w/2, y0-7, w, 7);
      poly([[x-w/2-7,y0-7],[x-w/2-3,y0-13],[x+w/2+3,y0-13],[x+w/2+7,y0-7]], SIL);
      y0 -= 13; w *= 0.88;
    }
    ctx.fillRect(x-2, y0-10, 4, 10);
    poly([[x-6,y0-10],[x+6,y0-10],[x,y0-18]], SIL);
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
    plane:   { pillar:'#a8865c', beam:'#c9a868', trim:'#d8a83a' },
    street:  { pillar:'#8f6d60', beam:'#3a3a46', trim:'#e8a04a' },
    maple:   { pillar:'#5a3528', beam:'#7a4428', trim:'#e0783a' },
    pagoda:  { pillar:'#c9c2b0', beam:'#1b2440', trim:'#e8c170' },
    bridge:  { pillar:'#3a4a66', beam:'#2a3a5a', trim:'#7fb8f0' },
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
      lantern(hx, pl2.y+0.26*s, 0.14*s);
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
      lantern(hx, pl2.y+0.3*s, 0.16*s);
    }
  } else if(motif==='plane'){    // 梧桐门:黄叶拱
    poly([[pl2.x,pl2.y-bh],[pr2.x,pr2.y-bh],[pr2.x,pl2.y-bh-0.14*s],[pl2.x,pl2.y-bh-0.14*s]], '#c9a868');
    for(let i=0;i<7;i++){
      const hx = pl2.x+(pr2.x-pl2.x)*i/6;
      disc(hx, pl2.y-bh-0.18*s, 0.18*s, i%2 ? '#d8a83a' : '#c9983a');
    }
  } else if(motif==='street'){   // 老门东牌坊:粉墙瓦檐 + 两盏灯
    poly([[pl2.x,pl2.y-bh],[pr2.x,pr2.y-bh],[pr2.x,pl2.y-bh-0.16*s],[pl2.x,pl2.y-bh-0.16*s]], '#d8a89a');
    poly([[pl2.x-0.14*s,pl2.y-bh],[pr2.x+0.14*s,pr2.y-bh],[pr2.x,pl2.y-bh-0.3*s],[pl2.x,pl2.y-bh-0.3*s]], '#3a3a46');
    for(const k of [0.3, 0.7]){
      const hx = pl2.x+(pr2.x-pl2.x)*k;
      ctx.strokeStyle = trim; ctx.lineWidth = Math.max(1, s*0.02);
      ctx.beginPath(); ctx.moveTo(hx, pl2.y); ctx.lineTo(hx, pl2.y+0.14*s); ctx.stroke();
      lantern(hx, pl2.y+0.3*s, 0.14*s);
    }
  } else if(motif==='maple'){    // 枫门:赤金拱
    poly([[pl2.x,pl2.y-bh],[pr2.x,pr2.y-bh],[pr2.x,pl2.y-bh-0.12*s],[pl2.x,pl2.y-bh-0.12*s]], '#7a4428');
    for(let i=0;i<8;i++){
      const hx = pl2.x+(pr2.x-pl2.x)*i/7;
      disc(hx, pl2.y-bh-0.15*s, 0.17*s, i%3 ? '#e0783a' : '#e8884a');
    }
  } else if(motif==='pagoda'){   // 琉璃塔门:金檐叠塔
    for(let k=0;k<3;k++){
      poly([[cxm-0.9*s,pl2.y-bh+k*0.1*s],[cxm-0.62*s,pl2.y-bh-0.22*s+k*0.1*s],[cxm+0.62*s,pl2.y-bh-0.22*s+k*0.1*s],[cxm+0.9*s,pl2.y-bh+k*0.1*s]], '#e8c170');
    }
    ctx.fillStyle = '#c9c2b0'; ctx.fillRect(cxm-0.2*s, pl2.y-bh+0.06*s, 0.4*s, 0.2*s);
    const g = ctx.createRadialGradient(cxm, pl2.y-bh-0.3*s, s*0.1, cxm, pl2.y-bh-0.3*s, s*1.2);
    g.addColorStop(0, 'rgba(232,193,112,0.35)'); g.addColorStop(1, 'rgba(232,193,112,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cxm, pl2.y-bh-0.3*s, s*1.2, 0, TAU); ctx.fill();
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
  if(motif==='crenel') return;               // 实景城墙已承担近景，删掉重复石柱让跑道更干净
  if(motif==='steps'){                        // 石栏柱(两色受光)
    ctx.fillStyle = '#9db1c6';
    ctx.fillRect(x-0.12*s, y-1.1*s, 0.24*s, 1.1*s);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(x-0.12*s, y-1.1*s, 0.06*s, 1.1*s);
    disc(x, y-1.18*s, 0.17*s, '#c6d0de');
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
      lantern(lx, ly, 0.16*s);
    }
  } else if(motif==='plane' || motif==='maple'){  // 黄叶/枫枝(从上方扫过)
    const leaf = motif==='maple' ? '#e0783a' : '#d8b04a', leafD = motif==='maple' ? '#c06028' : '#c9983a';
    ctx.strokeStyle = '#5a4428'; ctx.lineWidth = Math.max(2, s*0.06);
    ctx.beginPath(); ctx.moveTo(x, y-2.6*s); ctx.lineTo(x+m*0.9*s, y-2.2*s); ctx.stroke();
    disc(x+m*0.7*s, y-2.1*s, 0.4*s, leaf);
    disc(x+m*0.3*s, y-2.3*s, 0.32*s, leafD);
    disc(x+m*1.0*s, y-1.85*s, 0.26*s, leaf);
  } else if(motif==='street'){               // 招牌幌子串
    ctx.strokeStyle = '#4a2c3a'; ctx.lineWidth = Math.max(1.5, s*0.03);
    ctx.beginPath(); ctx.moveTo(x, y-2.1*s); ctx.quadraticCurveTo(x+m*0.4*s, y-1.9*s, x+m*1.0*s, y-2.0*s); ctx.stroke();
    for(let i=0;i<3;i++){
      const lx = x+m*(0.3+0.32*i)*s;
      ctx.fillStyle = i%2 ? '#e8d8b0' : '#d8a89a';
      ctx.fillRect(lx-0.18*s, y-2.3*s, 0.36*s, 0.3*s);
      ctx.fillStyle = '#a83a2e';
      ctx.fillRect(lx-0.12*s, y-2.2*s, 0.24*s, 0.1*s);
    }
  } else if(motif==='pagoda'){               // 金灯串
    ctx.strokeStyle = '#3a4a66'; ctx.lineWidth = Math.max(1.5, s*0.03);
    ctx.beginPath(); ctx.moveTo(x, y-2.3*s); ctx.lineTo(x+m*1.0*s, y-2.2*s); ctx.stroke();
    for(let i=0;i<3;i++) lantern(x+m*(0.3+0.32*i)*s, y-2.15*s, 0.13*s, true);
  } else if(motif==='bridge'){               // 桥侧:斜拉钢索 + 竖杆(快速掠过)
    ctx.strokeStyle = '#3a4a66'; ctx.lineWidth = Math.max(1.5, s*0.035);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-2.1*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y-2.1*s); ctx.lineTo(x+m*1.0*s, y-1.4*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y-2.1*s); ctx.lineTo(x+m*0.8*s, y-0.9*s); ctx.stroke();
    ctx.strokeStyle = '#5a6a8a'; ctx.lineWidth = Math.max(1, s*0.025);
    ctx.beginPath(); ctx.moveTo(x-0.9*s, y-0.1*s); ctx.lineTo(x+0.9*s, y-0.1*s); ctx.stroke();
  } else {                                   // 松枝(从上方扫过)
    ctx.strokeStyle = '#3a2f28'; ctx.lineWidth = Math.max(2, s*0.06);
    ctx.beginPath(); ctx.moveTo(x, y-2.6*s); ctx.lineTo(x+m*0.9*s, y-2.2*s); ctx.stroke();
    poly([[x+m*0.9*s,y-2.2*s],[x+m*0.3*s,y-2.0*s],[x+m*0.7*s,y-1.6*s]], '#2a5a45');
    poly([[x+m*0.6*s,y-2.35*s],[x+m*0.1*s,y-2.2*s],[x+m*0.45*s,y-1.9*s]], '#1f4a38');
  }
}
