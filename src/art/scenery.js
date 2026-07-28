import { ctx, TAU, HOR, poly, disc, petalFlower, proj, clamp, ROAD_HALF, ZP } from '../core.js';

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

/* 远景地标剪影:每关一个一眼可辨的南京符号(远层,慢速视差) */
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
  if(id==='zhonghua'){          // 中华门瓮城:三重拱门 + 两重檐敌楼
    ctx.fillRect(x-110, base-58, 220, 58);
    for(let k=0;k<9;k++) ctx.fillRect(x-104+k*24, base-66, 12, 8);   // 垛口
    ctx.fillStyle = SKY;
    for(const k of [-1,0,1]){                                        // 三道拱门(镂空见天)
      ctx.beginPath();
      ctx.moveTo(x+k*64-15, base); ctx.lineTo(x+k*64-15, base-24);
      ctx.arc(x+k*64, base-24, 15, Math.PI, 0);
      ctx.lineTo(x+k*64+15, base); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = SIL;
    ctx.fillRect(x-30, base-84, 60, 26);                             // 敌楼
    poly([[x-46,base-84],[x-26,base-98],[x+26,base-98],[x+46,base-84]], SIL);
    ctx.fillRect(x-14, base-108, 28, 10);
    poly([[x-22,base-108],[x,base-118],[x+22,base-108]], SIL);
  } else if(id==='jiming'){     // 鸡鸣寺药师佛塔:五层密檐
    let w = 60, y0 = base;
    for(let k=0;k<5;k++){
      ctx.fillRect(x-w/2, y0-13, w, 13);
      poly([[x-w/2-9,y0-13],[x,y0-21],[x+w/2+9,y0-13]], SIL);
      y0 -= 21; w *= 0.8;
    }
    ctx.fillRect(x-2, y0-12, 4, 12);                                 // 塔刹
    poly([[x-6,y0-12],[x+6,y0-12],[x,y0-22]], SIL);
  } else if(id==='sunyard'){    // 中山陵祭堂:蓝瓦白墙(琉璃蓝大屋顶)
    poly([[x-95,base],[x-72,base-14],[x+72,base-14],[x+95,base]], SIL); // 台阶基座
    ctx.fillRect(x-52, base-54, 104, 40);                            // 墙身
    ctx.fillStyle = SKY;
    for(const k of [-1,0,1]){                                        // 三座拱门
      ctx.beginPath();
      ctx.moveTo(x+k*30-8, base-14); ctx.lineTo(x+k*30-8, base-36);
      ctx.arc(x+k*30, base-36, 8, Math.PI, 0);
      ctx.lineTo(x+k*30+8, base-14); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#2e5f8a';                                       // 琉璃蓝瓦
    poly([[x-66,base-54],[x-42,base-82],[x+42,base-82],[x+66,base-54]], '#2e5f8a');
    poly([[x-32,base-82],[x-20,base-92],[x+20,base-92],[x+32,base-82]], '#2e5f8a');
  } else if(id==='zhaobi'){     // 夫子庙双龙戏珠大照壁
    ctx.fillRect(x-120, base-50, 240, 50);
    poly([[x-132,base-50],[x-118,base-62],[x+118,base-62],[x+132,base-50]], SIL); // 瓦顶
    ctx.strokeStyle = lv.accent; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x-92, base-18);                      // 左龙
    ctx.quadraticCurveTo(x-62, base-44, x-34, base-20);
    ctx.quadraticCurveTo(x-20, base-10, x-10, base-24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+92, base-18);                      // 右龙
    ctx.quadraticCurveTo(x+62, base-44, x+34, base-20);
    ctx.quadraticCurveTo(x+20, base-10, x+10, base-24); ctx.stroke();
    disc(x, base-24, 7, '#f0b64c');                                  // 明珠
    ctx.fillStyle = 'rgba(240,182,76,0.4)';
    ctx.beginPath(); ctx.arc(x, base-24, 12, 0, TAU); ctx.fill();
  } else if(id==='observatory'){ // 紫金山天文台:山丘银圆顶
    poly([[x-150,base],[x-60,base-32],[x+70,base-28],[x+150,base]], SIL);
    ctx.fillStyle = '#b9c4d6';
    ctx.beginPath(); ctx.arc(x-16, base-40, 20, Math.PI, 0); ctx.fill(); // 主圆顶
    ctx.fillRect(x-36, base-40, 40, 12);
    ctx.beginPath(); ctx.arc(x+38, base-36, 12, Math.PI, 0); ctx.fill(); // 小圆顶
    ctx.fillRect(x+26, base-36, 24, 9);
    ctx.strokeStyle = SIL; ctx.lineWidth = 3;                        // 天窗缝
    ctx.beginPath(); ctx.moveTo(x-16, base-60); ctx.lineTo(x-16, base-46); ctx.stroke();
  } else if(id==='bridge'){     // 南京长江大桥:双层桁架 + 桥头堡
    const bw = 320;
    ctx.fillRect(x-bw/2, base-48, bw, 6);                            // 公路层
    ctx.fillRect(x-bw/2, base-28, bw, 6);                            // 铁路层
    for(let k=0;k<=10;k++) ctx.fillRect(x-bw/2+k*bw/10-1, base-48, 2, 26); // 桁架
    for(const k of [-1,0,1]) ctx.fillRect(x+k*110-5, base-22, 10, 22);     // 桥墩
    ctx.fillRect(x-bw/2-16, base-80, 26, 38);                        // 桥头堡
    poly([[x-bw/2-20,base-80],[x-bw/2-3,base-92],[x-bw/2+14,base-80]], SIL);
    ctx.fillRect(x-bw/2-9, base-100, 3, 10);                         // 旗杆
    poly([[x-bw/2-6,base-100],[x-bw/2+6,base-97],[x-bw/2-6,base-94]], '#e2483d'); // 红旗
  }
}

/* 秦淮河画舫:横向缓缓漂过(中景) */
export function drawBoat(x, y){
  poly([[x-70,y],[x-56,y-14],[x+56,y-14],[x+70,y]], '#120d1e');      // 船体
  ctx.fillStyle = '#120d1e';
  ctx.fillRect(x-34, y-38, 68, 24);                                   // 船舱
  poly([[x-44,y-38],[x,y-52],[x+44,y-38]], '#1a1228');                // 舱顶
  disc(x-22, y-28, 4, '#f0b64c'); disc(x, y-28, 4, '#f0b64c'); disc(x+22, y-28, 4, '#f0b64c'); // 窗灯
  disc(x+52, y-20, 5, '#e2483d');                                     // 船头灯笼
}

/* 穿越门地标:随深度逼近放大,掠过头顶时淡出;不参与碰撞 */
export function drawGate(g, lv){
  const X = ROAD_HALF + 0.35;
  const pl1 = proj(-X, 0, g.rz), pr1 = proj(X, 0, g.rz);   // 柱脚
  const pl2 = proj(-X, 3.0, g.rz), pr2 = proj(X, 3.0, g.rz); // 柱顶(门楣)
  const s = pl1.s;
  ctx.globalAlpha = clamp((g.rz - ZP + 0.6)/2.4, 0, 1);    // 穿门瞬间淡出
  const pillar = lv.side, beam = lv.sideTop, trim = lv.accent;
  const pw = 0.3*s, bh = 0.24*s;
  ctx.fillStyle = pillar;
  ctx.fillRect(pl1.x-pw/2, pl2.y, pw, pl1.y-pl2.y);        // 左柱
  ctx.fillRect(pr1.x-pw/2, pr2.y, pw, pr1.y-pr2.y);        // 右柱
  poly([[pl2.x,pl2.y],[pr2.x,pr2.y],[pr2.x,pr2.y-bh],[pl2.x,pl2.y-bh]], beam, trim, Math.max(1.5,s*0.02)); // 门楣
  const cxm = (pl2.x+pr2.x)/2;
  ctx.fillStyle = trim;                                    // 匾额
  ctx.fillRect(cxm-0.34*s, pl2.y-bh*0.5-0.14*s, 0.68*s, 0.28*s);
  const motif = lv.motif;
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
    ctx.strokeStyle = '#a8d5a2'; ctx.lineWidth = Math.max(1, s*0.02);
    const n = 9;
    for(let i=0;i<=n;i++){
      const hx = pl2.x+(pr2.x-pl2.x)*i/n;
      ctx.beginPath(); ctx.moveTo(hx, pl2.y);
      ctx.quadraticCurveTo(hx+0.06*s, pl2.y+0.5*s, hx-0.03*s, pl2.y+(0.9+0.2*Math.sin(i*2.1))*s);
      ctx.stroke();
    }
  } else if(motif==='steps'){    // 博爱坊:蓝瓦三楼
    const roof = '#2e5f8a';
    poly([[cxm-1.1*s,pl2.y-bh],[cxm-0.8*s,pl2.y-bh-0.34*s],[cxm+0.8*s,pl2.y-bh-0.34*s],[cxm+1.1*s,pl2.y-bh]], roof);
    poly([[pl2.x-0.2*s,pl2.y-bh],[pl2.x+0.15*s,pl2.y-bh-0.24*s],[pl2.x+0.55*s,pl2.y-bh-0.24*s],[pl2.x+0.7*s,pl2.y-bh]], roof);
    poly([[pr2.x+0.2*s,pr2.y-bh],[pr2.x-0.15*s,pr2.y-bh-0.24*s],[pr2.x-0.55*s,pr2.y-bh-0.24*s],[pr2.x-0.7*s,pr2.y-bh]], roof);
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
  const c = lv.side;
  if(motif==='crenel' || motif==='steps'){   // 石栏柱
    ctx.fillStyle = c;
    ctx.fillRect(x-0.12*s, y-1.1*s, 0.24*s, 1.1*s);
    disc(x, y-1.18*s, 0.17*s, lv.sideTop);
  } else if(motif==='lotus'){                // 垂柳
    ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, s*0.05);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x+m*0.2*s, y-1.2*s, x+m*0.1*s, y-2.0*s); ctx.stroke();
    ctx.lineWidth = Math.max(1, s*0.025);
    for(let i=0;i<4;i++){                    // 垂下的柳条
      const bx = x+m*(0.1+0.14*i)*s;
      ctx.beginPath(); ctx.moveTo(bx, y-(1.9-0.08*i)*s);
      ctx.quadraticCurveTo(bx+m*0.12*s, y-1.3*s, bx+m*0.05*s, y-(0.7+0.06*i)*s); ctx.stroke();
    }
  } else if(motif==='lantern'){              // 灯笼串
    ctx.strokeStyle = lv.sideTop; ctx.lineWidth = Math.max(1.5, s*0.03);
    ctx.beginPath(); ctx.moveTo(x, y-2.2*s); ctx.quadraticCurveTo(x+m*0.5*s, y-1.8*s, x+m*1.0*s, y-2.1*s); ctx.stroke();
    for(let i=0;i<3;i++){
      const lx = x+m*(0.25+0.3*i)*s, ly = y-1.95*s - 0.12*s*Math.sin(i*1.3);
      disc(lx, ly, 0.16*s, '#e2483d');
      ctx.fillStyle = 'rgba(240,182,76,0.35)';
      ctx.beginPath(); ctx.arc(lx, ly, 0.26*s, 0, TAU); ctx.fill();
    }
  } else {                                   // 松枝(从上方扫过)
    ctx.strokeStyle = c; ctx.lineWidth = Math.max(2, s*0.06);
    ctx.beginPath(); ctx.moveTo(x, y-2.6*s); ctx.lineTo(x+m*0.9*s, y-2.2*s); ctx.stroke();
    poly([[x+m*0.9*s,y-2.2*s],[x+m*0.3*s,y-2.0*s],[x+m*0.7*s,y-1.6*s]], lv.sideTop);
    poly([[x+m*0.6*s,y-2.35*s],[x+m*0.1*s,y-2.2*s],[x+m*0.45*s,y-1.9*s]], lv.sideTop);
  }
}
