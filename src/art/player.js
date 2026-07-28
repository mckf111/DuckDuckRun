import { ctx, TAU, ZP, proj, poly, disc } from '../core.js';

/* ================= 剪纸绘制:玩家(背影小人) ================= */
export function drawPlayer(pl, t){
  const p = proj(pl.x, pl.y, ZP);
  const s = p.s * 0.62;                 // 角色整体缩放
  const x = p.x, y = p.y;
  const RED = '#c8342e', GOLD = '#f0b64c', DARK = '#1a1220';
  const run = Math.sin(t*14);
  ctx.save();
  ctx.translate(x, y);
  if(pl.sliding){ // 滑铲:身体放平
    ctx.rotate(-0.08);
    ctx.fillStyle = RED;
    ctx.beginPath(); ctx.ellipse(0, -0.35*s, 0.75*s, 0.32*s, 0, 0, TAU); ctx.fill();
    disc(0.62*s, -0.62*s, 0.26*s, RED);            // 头
    disc(0.62*s, -0.88*s, 0.1*s, DARK);            // 发髻
    poly([[0.7*s,-0.5*s],[1.15*s,-0.42*s],[0.75*s,-0.34*s]], GOLD); // 飘带
    ctx.strokeStyle=GOLD; ctx.lineWidth=Math.max(1.5,s*0.03);
    ctx.beginPath(); ctx.ellipse(0, -0.35*s, 0.75*s, 0.32*s, 0, 0, TAU); ctx.stroke();
  } else {
    const airK = pl.y > 0.05 ? 0.4 : 1; // 空中收腿
    // 腿
    ctx.strokeStyle = RED; ctx.lineCap='round'; ctx.lineWidth = 0.2*s;
    const l1 = run*0.5*airK, l2 = -run*0.5*airK;
    ctx.beginPath(); ctx.moveTo(0,-0.95*s); ctx.lineTo(l1*s, -0.45*s); ctx.lineTo(l1*s*1.5, -0.02*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-0.95*s); ctx.lineTo(l2*s, -0.45*s); ctx.lineTo(l2*s*1.5, -0.02*s); ctx.stroke();
    // 身体(剪纸长衫)
    poly([[-0.34*s,-0.9*s],[0.34*s,-0.9*s],[0.26*s,-1.85*s],[-0.26*s,-1.85*s]], RED, GOLD, Math.max(1.5,s*0.025));
    // 手臂
    ctx.strokeStyle = RED; ctx.lineWidth = 0.16*s;
    ctx.beginPath(); ctx.moveTo(-0.22*s,-1.7*s); ctx.lineTo((-0.5-run*0.25)*s, -1.2*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.22*s,-1.7*s); ctx.lineTo((0.5+run*0.25)*s, -1.2*s); ctx.stroke();
    // 头与发髻(背影)
    disc(0, -2.12*s, 0.3*s, RED);
    disc(0, -2.44*s, 0.12*s, DARK);
    // 腰间金带
    ctx.strokeStyle=GOLD; ctx.lineWidth=Math.max(1.5,s*0.04);
    ctx.beginPath(); ctx.moveTo(-0.3*s,-1.05*s); ctx.lineTo(0.3*s,-1.05*s); ctx.stroke();
    // 飘带
    const fl = Math.sin(t*10)*0.12;
    poly([[-0.1*s,-1.15*s],[-0.55*s,(-1.3+fl)*s],[-0.2*s,-1.35*s]], GOLD);
  }
  ctx.restore();
}
