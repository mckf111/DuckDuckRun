import { ctx, TAU, proj, poly, disc, petalFlower } from '../core.js';

/* ================= 剪纸绘制:障碍 ================= */
// 三类:low(跳过)/high(滑铲钻过)/full(必须换道)
// 在世界投影坐标下绘制:px,py 为地面接触点屏幕坐标,s 为该深度缩放
export function drawObstacle(ob, lv){
  const p = proj(ob.x, 0, ob.rz);
  const s = p.s, x = p.x, y = p.y;
  const body = lv.textDark ? '#4a5d75' : '#0f0d18';   // 障碍主体剪影色
  const trim = lv.accent;
  if(ob.type==='low'){          // 地面矮障碍(石狮子/城砖/缆桩/台阶)
    const w = 0.95*s, h = 0.78*s;
    poly([[x-w/2,y],[x-w/2,y-h*0.75],[x-w*0.3,y-h],[x+w*0.3,y-h],[x+w/2,y-h*0.75],[x+w/2,y]], body);
    ctx.strokeStyle=trim; ctx.lineWidth=Math.max(1.5,s*0.02);
    ctx.beginPath(); ctx.moveTo(x-w*0.3,y-h); ctx.lineTo(x+w*0.3,y-h); ctx.stroke();
    // 母题纹样
    if(lv.motif==='crenel'){ // 石狮子面纹
      disc(x, y-h*0.55, 0.16*s, trim);
      disc(x-0.05*s, y-h*0.58, 0.03*s, body); disc(x+0.05*s, y-h*0.58, 0.03*s, body);
    } else if(lv.motif==='lotus'){ // 荷叶卷边
      ctx.strokeStyle=trim; ctx.lineWidth=Math.max(1.5,s*0.025);
      ctx.beginPath(); ctx.arc(x, y-h*0.5, 0.2*s, Math.PI, TAU); ctx.stroke();
    } else if(lv.motif==='steps'){ // 台阶线
      ctx.strokeStyle=trim; ctx.lineWidth=Math.max(1,s*0.018);
      for(let i=1;i<=2;i++){ ctx.beginPath(); ctx.moveTo(x-w/2+2, y-h*i/3); ctx.lineTo(x+w/2-2, y-h*i/3); ctx.stroke(); }
    } else if(lv.motif==='lantern'){ // 灯影纹
      disc(x, y-h*0.5, 0.14*s, null, trim, Math.max(1.5,s*0.02));
    } else { // 松针
      poly([[x,y-h*0.75],[x-0.14*s,y-h*0.4],[x+0.14*s,y-h*0.4]], trim);
    }
  } else if(ob.type==='high'){  // 悬空障碍(灯笼架/横杆),底部留空可滑铲
    const w = 1.0*s, top = 2.1*s, bot = 0.9*s;
    ctx.fillStyle = body;
    ctx.fillRect(x-w/2, y-top, w*0.08, top);          // 左柱
    ctx.fillRect(x+w/2-w*0.08, y-top, w*0.08, top);   // 右柱
    ctx.fillRect(x-w/2, y-top, w, top-bot);           // 横梁体
    ctx.strokeStyle=trim; ctx.lineWidth=Math.max(1.5,s*0.02);
    ctx.strokeRect(x-w/2, y-top, w, top-bot);
    // 挂饰
    for(let i=-1;i<=1;i++){
      const hx = x + i*w*0.28;
      ctx.strokeStyle=trim; ctx.beginPath(); ctx.moveTo(hx, y-bot); ctx.lineTo(hx, y-bot+0.14*s); ctx.stroke();
      if(lv.motif==='lantern'||lv.motif==='crenel'){
        disc(hx, y-bot+0.3*s, 0.13*s, lv.motif==='lantern'?'#e2483d':trim);
        if(lv.motif==='lantern'){ ctx.fillStyle='rgba(240,182,76,0.35)'; ctx.beginPath(); ctx.arc(hx, y-bot+0.3*s, 0.24*s, 0, TAU); ctx.fill(); }
      } else {
        poly([[hx, y-bot+0.14*s],[hx-0.1*s, y-bot+0.4*s],[hx+0.1*s, y-bot+0.4*s]], trim);
      }
    }
  } else {                       // 全车道高障碍(砖墙/画舫/大树),必须换道
    const w = 1.05*s, h = 2.3*s;
    poly([[x-w/2,y],[x-w/2,y-h],[x+w/2,y-h],[x+w/2,y]], body);
    ctx.strokeStyle=trim; ctx.lineWidth=Math.max(1.5,s*0.02);
    ctx.strokeRect(x-w/2, y-h, w, h);
    if(lv.motif==='crenel'){     // 城垛口
      ctx.fillStyle=trim;
      for(let i=0;i<3;i++) ctx.fillRect(x-w/2+w*0.1+i*w*0.36, y-h-0.12*s, w*0.16, 0.12*s);
    } else if(lv.motif==='lotus'){ // 荷花
      petalFlower(x, y-h*0.55, 0.22*s, trim, body);
    } else if(lv.motif==='steps'){ // 牌坊门
      ctx.strokeStyle=trim; ctx.lineWidth=Math.max(1.5,s*0.025);
      ctx.beginPath(); ctx.moveTo(x-w*0.28,y); ctx.lineTo(x-w*0.28,y-h*0.55); ctx.lineTo(x+w*0.28,y-h*0.55); ctx.lineTo(x+w*0.28,y); ctx.stroke();
    } else if(lv.motif==='lantern'){ // 大灯笼墙
      disc(x, y-h*0.6, 0.32*s, '#e2483d');
      ctx.fillStyle='rgba(240,182,76,0.4)'; ctx.beginPath(); ctx.arc(x, y-h*0.6, 0.5*s, 0, TAU); ctx.fill();
      poly([[x-0.1*s,y-h*0.28],[x+0.1*s,y-h*0.28],[x,y-h*0.12]], trim);
    } else {                   // 大树
      poly([[x,y-h],[x-0.3*s,y-h*0.55],[x+0.3*s,y-h*0.55]], trim);
      poly([[x,y-h*0.75],[x-0.38*s,y-h*0.3],[x+0.38*s,y-h*0.3]], trim);
    }
  }
}
