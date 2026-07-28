import { ctx, TAU, ZP, proj, poly, disc } from '../core.js';

/* ================= 剪纸绘制:玩家(逃跑的盐水鸭) ================= */
// 一只从桂花鸭店橱窗逃出的白胖鸭:橘喙脚蹼、头顶桂花枝(它的标志物)
const BODY = '#f5f0e6', BELLY = '#e3d9c8';            // 鸭身/腹羽
const ORANGE = '#f08c1e', ORANGE_D = '#d97a12';       // 喙与脚蹼
const DARK = '#1a1220';
const OSM = '#f0b64c', LEAF = '#7ba05b';              // 桂花与叶

/* 橘色脚蹼:扇形三趾蹼;flip=true 表示朝天(滑铲/撞车时) */
function foot(fx, fy, s, flip){
  const d = flip ? -1 : 1; // 默认蹼朝前(屏幕上方),flip 时蹼朝上展开
  poly([[fx-0.09*s, fy], [fx+0.09*s, fy],
        [fx+0.14*s, fy-d*0.13*s], [fx+0.05*s, fy-d*0.2*s],
        [fx-0.04*s, fy-d*0.16*s]], ORANGE);
}

/* 头顶桂花枝 */
function osmanthus(ox, oy, s){
  ctx.strokeStyle = LEAF; ctx.lineWidth = Math.max(1, s*0.03);
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox+0.06*s, oy-0.16*s); ctx.stroke();
  poly([[ox+0.02*s,oy-0.06*s],[ox-0.08*s,oy-0.1*s],[ox+0.01*s,oy-0.12*s]], LEAF);
  disc(ox+0.06*s, oy-0.18*s, 0.05*s, OSM);
  disc(ox+0.12*s, oy-0.14*s, 0.04*s, OSM);
  disc(ox+0.01*s, oy-0.20*s, 0.035*s, OSM);
}

/* 头 + 表情:panic 时瞪眼张嘴冒汗(兼作障碍逼近提示) */
function head(hx, hy, s, panic, tilt){
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(tilt||0);
  disc(0, 0, 0.3*s, BODY);
  const open = panic ? 0.1*s : 0.02*s;               // 惊恐时张嘴
  poly([[0.2*s,-0.06*s],[0.55*s,-0.02*s],[0.2*s,0.02*s]], ORANGE);     // 上喙
  poly([[0.2*s,0.04*s],[0.48*s,0.04*s+open],[0.2*s,0.1*s]], ORANGE_D); // 下喙
  if(panic){
    disc(0.08*s, -0.1*s, 0.085*s, '#fff'); disc(0.1*s, -0.09*s, 0.04*s, DARK); // 瞪圆的眼
    ctx.fillStyle = '#9fd4e8';                                            // 汗珠
    ctx.beginPath(); ctx.ellipse(0.26*s, -0.26*s, 0.04*s, 0.06*s, 0.3, 0, TAU); ctx.fill();
  } else {
    disc(0.08*s, -0.08*s, 0.045*s, DARK);            // 平时淡定眯眼
  }
  osmanthus(-0.05*s, -0.26*s, s);
  ctx.restore();
}

/* 跑步:前倾白胖身体 + 屁股扭 + 小碎步;腾空时扑翼(鸭子不会飞,硬扑腾) */
function drawRun(pl, t, s, run, run2, panic){
  const airK = pl.y > 0.05 ? 0.25 : 1;               // 空中脚蹼收起
  ctx.translate(0, pl.y > 0.05 ? 0 : -Math.abs(run2)*0.04*s); // 跑步上下颠簸
  // 脚蹼交替拍地
  const f1 = run*0.3*airK, f2 = -run*0.3*airK;
  foot(f1*s, -0.04*s - Math.max(0, run2)*0.07*s*airK, s, false);
  foot(f2*s + 0.08*s, -0.04*s - Math.max(0,-run2)*0.07*s*airK, s, false);
  // 尾巴上翘,随跑步摇摆
  poly([[-0.42*s,-0.72*s],[-0.72*s,(-0.98+run*0.06)*s],[-0.5*s,-0.62*s]], BELLY);
  // 身体
  ctx.save(); ctx.translate(0, -0.72*s); ctx.rotate(-0.14 + run*0.04);
  ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.ellipse(0, 0, 0.5*s, 0.42*s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = BELLY;
  ctx.beginPath(); ctx.ellipse(0.05*s, 0.14*s, 0.34*s, 0.22*s, 0, 0, TAU); ctx.fill();
  // 翅膀:跑步贴身,腾空扑翼(二段跳扑得更急)
  const flap = pl.y > 0.05 ? Math.sin(t*(pl.jumps===2?34:24))*0.9 : run*0.12;
  ctx.save(); ctx.translate(0.1*s, -0.05*s); ctx.rotate(flap);
  ctx.fillStyle = BELLY;
  ctx.beginPath(); ctx.ellipse(0.12*s, 0.1*s, 0.3*s, 0.13*s, 0.5, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.restore();
  head(0.24*s, -1.28*s, s, panic, panic ? -0.15 : run*0.03);
}

/* 滑铲:肚皮贴地、双脚朝天、喙几乎擦地 */
function drawSlide(t, s){
  // 速度线
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, s*0.03);
  for(let i=0;i<3;i++){
    const ly = (-0.25-i*0.18)*s;
    ctx.beginPath(); ctx.moveTo(-0.95*s-i*0.12*s, ly); ctx.lineTo(-1.35*s-i*0.12*s, ly); ctx.stroke();
  }
  foot(-0.5*s, -0.62*s, s, true);                    // 双脚朝天
  foot(-0.34*s, -0.78*s, s, true);
  ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.ellipse(0, -0.3*s, 0.62*s, 0.27*s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = BELLY;
  ctx.beginPath(); ctx.ellipse(0, -0.18*s, 0.5*s, 0.12*s, 0, 0, TAU); ctx.fill();
  poly([[-0.55*s,-0.4*s],[-0.82*s,-0.66*s],[-0.6*s,-0.3*s]], BELLY); // 尾巴上翘
  // 头前伸,眯眼
  ctx.save(); ctx.translate(0.6*s, -0.34*s); ctx.rotate(0.1);
  disc(0, 0, 0.27*s, BODY);
  poly([[0.18*s,0.02*s],[0.52*s,0.1*s],[0.18*s,0.12*s]], ORANGE);
  ctx.strokeStyle = DARK; ctx.lineWidth = Math.max(1.2, s*0.025);
  ctx.beginPath(); ctx.moveTo(0.02*s,-0.08*s); ctx.lineTo(0.14*s,-0.06*s); ctx.stroke();
  osmanthus(-0.08*s, -0.24*s, s);
  ctx.restore();
}

/* 撞车:四脚朝天 + X 眼 + 眼冒金星 + 桂花枝掉落 */
function drawCrash(t, s, run){
  ctx.save(); ctx.translate(-0.75*s, -0.04*s); ctx.rotate(1.4); osmanthus(0, 0, s); ctx.restore();
  // 仰面翻倒的身体
  ctx.save(); ctx.translate(0, -0.4*s); ctx.rotate(-0.5);
  ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.ellipse(0, 0, 0.52*s, 0.4*s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = BELLY;
  ctx.beginPath(); ctx.ellipse(0.08*s, 0.12*s, 0.36*s, 0.24*s, 0, 0, TAU); ctx.fill();
  ctx.restore();
  // 双脚朝天抽搐
  foot(-0.15*s, (-0.85+run*0.05)*s, s, true);
  foot(0.2*s, (-0.95-run*0.05)*s, s, true);
  // 头歪在一边,X 眼 + 喙松开
  ctx.save(); ctx.translate(0.55*s, -0.42*s); ctx.rotate(0.5);
  disc(0, 0, 0.28*s, BODY);
  poly([[0.16*s,0.04*s],[0.45*s,0.14*s],[0.16*s,0.16*s]], ORANGE);
  ctx.strokeStyle = DARK; ctx.lineWidth = Math.max(1.5, s*0.03);
  ctx.beginPath();
  ctx.moveTo(-0.02*s,-0.12*s); ctx.lineTo(0.1*s,-0.02*s);
  ctx.moveTo(0.1*s,-0.12*s); ctx.lineTo(-0.02*s,-0.02*s);
  ctx.stroke();
  ctx.restore();
  // 眼冒金星(绕头旋转)
  for(let i=0;i<3;i++){
    const a = t*3 + i*TAU/3;
    spark(0.55*s+Math.cos(a)*0.4*s, -0.85*s+Math.sin(a)*0.14*s, 0.07*s);
  }
}
function spark(sx, sy, r){
  poly([[sx,sy-r],[sx+r*0.35,sy-r*0.35],[sx+r,sy],[sx+r*0.35,sy+r*0.35],
        [sx,sy+r],[sx-r*0.35,sy+r*0.35],[sx-r,sy],[sx-r*0.35,sy-r*0.35]], OSM);
}

// opts: { panic: 障碍逼近, crashed: 撞车定格 }
export function drawPlayer(pl, t, opts){
  opts = opts || {};
  const p = proj(pl.x, pl.y, ZP);
  const s = p.s * 0.62;                 // 角色整体缩放
  const x = p.x, y = p.y;
  const run = Math.sin(t*14), run2 = Math.sin(t*28);
  ctx.save();
  ctx.translate(x, y);
  if(opts.crashed) drawCrash(t, s, run);
  else if(pl.sliding) drawSlide(t, s);
  else drawRun(pl, t, s, run, run2, !!opts.panic);
  ctx.restore();
}
