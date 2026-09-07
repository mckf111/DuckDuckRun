import { drawBookDuck } from './book.js';
import { skinAtlas } from './skin.js';
import { effectiveSkin } from '../rules.js';
import { ctx, TAU, ZP, LANEGAP, proj, poly, disc, shadow, clamp } from '../core.js';
import { save } from '../save.js';
import { MOBILE } from '../config.js';
import { drawSpriteFrame, getSprite } from './sprites.js';

/* ================= 剪纸绘制:玩家(逃跑的盐水鸭) ================= */
// 一只从桂花鸭店橱窗逃出的白胖鸭:橘喙脚蹼、头顶桂花枝(它的标志物)
// 15 星解锁金鸭皮肤(金色羽毛)
let BODY = '#f5f0e6', BELLY = '#e3d9c8';            // 鸭身/腹羽
const ORANGE = '#f08c1e', ORANGE_D = '#d97a12';       // 喙与脚蹼
const DARK = '#1a1220';
const OSM = '#f0b64c', LEAF = '#7ba05b';              // 桂花与叶

/* 橘色脚蹼:扇形三趾蹼;flip=true 表示朝天(滑铲/撞车时);rot 整体旋转(甩蹼) */
function foot(fx, fy, s, flip, rot){
  const d = flip ? -1 : 1; // 默认蹼朝前(屏幕上方),flip 时蹼朝上展开
  ctx.save(); ctx.translate(fx, fy); ctx.rotate(rot || 0);
  poly([[-0.09*s, 0], [0.09*s, 0],
        [0.14*s, -d*0.13*s], [0.05*s, -d*0.2*s],
        [-0.04*s, -d*0.16*s]], ORANGE);
  ctx.restore();
}

/* 头顶桂花枝;bristle=true 时受惊竖直炸起 */
function osmanthus(ox, oy, s, bristle){
  const lean = bristle ? 0.015 : 0.06, tall = bristle ? 0.22 : 0.16;
  ctx.strokeStyle = LEAF; ctx.lineWidth = Math.max(1, s*0.03);
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox+lean*s, oy-tall*s); ctx.stroke();
  poly([[ox+0.02*s,oy-0.06*s],[ox-0.08*s,oy-0.1*s],[ox+0.01*s,oy-0.12*s]], LEAF);
  disc(ox+lean*s, oy-(tall+0.02)*s, 0.05*s, OSM);
  disc(ox+(lean+0.06)*s, oy-(tall-0.02)*s, 0.04*s, OSM);
  disc(ox+(lean-0.05)*s, oy-(tall+0.04)*s, 0.035*s, OSM);
}

/* 后脑勺(3/4 后视):平时只见后脑与桂花枝,右缘露一点喙尖;
   panic 时扭头回望镜头——瞪眼张嘴冒汗(兼作障碍逼近提示);bob 为桂花枝弹跳 */
function headBack(hx, hy, s, panic, bob){
  ctx.save(); ctx.translate(hx, hy);
  disc(0, 0, 0.34*s, BODY);
  ctx.fillStyle = BELLY;                                              // 颈部分界阴
  ctx.beginPath(); ctx.ellipse(0, 0.2*s, 0.24*s, 0.12*s, 0, 0, TAU); ctx.fill();
  if(panic){
    disc(-0.1*s, -0.06*s, 0.09*s, '#fff'); disc(-0.11*s, -0.05*s, 0.03*s, DARK);  // 瞪圆的眼(瞳孔缩小)
    disc(0.12*s, -0.08*s, 0.07*s, '#fff'); disc(0.11*s, -0.07*s, 0.024*s, DARK);
    poly([[-0.32*s,-0.02*s],[-0.58*s,0.06*s],[-0.3*s,0.12*s]], ORANGE);           // 上喙朝镜头
    poly([[-0.3*s,0.14*s],[-0.52*s,0.24*s],[-0.26*s,0.22*s]], ORANGE_D);          // 下喙张开
    ctx.fillStyle = '#9fd4e8';                                                     // 汗珠三颗飞溅
    ctx.beginPath(); ctx.ellipse(0.24*s, -0.28*s, 0.04*s, 0.06*s, -0.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0.35*s, -0.17*s, 0.03*s, 0.045*s, -0.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-0.3*s, -0.25*s, 0.028*s, 0.042*s, 0.4, 0, TAU); ctx.fill();
  } else {
    poly([[0.24*s,-0.02*s],[0.44*s,0.04*s],[0.24*s,0.1*s]], ORANGE);              // 右缘喙尖(3/4 视角)
  }
  osmanthus(-0.04*s, (-0.27+(bob||0))*s, s, panic);
  ctx.restore();
}

/* 跑步(3/4 后视,与追尾透视一致):梨形背影 + 上翘尾羽 + 两侧翅膀 + 交替脚蹼;
   腾空时扑翼(鸭子不会飞,硬扑腾,二段跳扑得更急,还掉羽毛) */
function drawRun(pl, t, s, run, run2, panic){
  const air = pl.y > 0.05;
  ctx.translate(0, air ? 0 : -Math.abs(run2)*0.06*s);   // 跑步上下颠簸
  if(!air) ctx.rotate(run*0.05);                        // 碎步左右摇摆
  // 脚蹼:跑步交替高抬外翻;腾空下垂乱蹬
  if(air){
    const kick = Math.sin(t*18);
    foot(-0.16*s, 0.02*s + kick*0.05*s, s, false, -0.5 + kick*0.3);
    foot( 0.16*s, 0.02*s - kick*0.05*s, s, false, 0.5 - kick*0.3);
  } else {
    foot(-0.16*s + run*0.08*s, -0.03*s - Math.max(0, run2)*0.11*s, s, false, -0.3 - Math.max(0, run2)*0.5);
    foot( 0.16*s - run*0.08*s, -0.03*s - Math.max(0,-run2)*0.11*s, s, false, 0.3 + Math.max(0,-run2)*0.5);
  }
  // 身体:上窄下宽的梨形背影,随节拍挤压拉伸(squash & stretch)
  const sq = air ? 1 : 1 + run2*0.06;
  ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.ellipse(0, -0.68*s, 0.46*s*sq, 0.56*s/sq, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = BELLY;                                        // 下缘背阴
  ctx.beginPath(); ctx.ellipse(0, -0.44*s, 0.34*s*sq, 0.26*s/sq, 0, 0, TAU); ctx.fill();
  // 尾羽:上翘一撮(鸭子的招牌屁股),随跑步大幅摇摆
  poly([[-0.14*s,(-1.08+run*0.06)*s],[-0.02*s,(-1.34+run*0.09)*s],[0.06*s,-1.1*s],
        [0.16*s,(-1.26-run*0.06)*s],[0.18*s,-1.04*s]], BELLY);
  // 翅膀:身体两侧;跑步甩摆,腾空向外扑,panic 炸毛张开
  const flap = air ? Math.sin(t*(pl.jumps===2?34:24)) : run*0.5;
  for(const m of [-1,1]){
    ctx.save(); ctx.translate(m*0.42*s, -0.82*s);
    ctx.rotate(m*(0.22 + flap*(air?0.7:0.2) + (panic?0.3:0)));
    ctx.fillStyle = BELLY;
    ctx.beginPath(); ctx.ellipse(0, 0.24*s, 0.15*s, 0.34*s, m*0.15, 0, TAU); ctx.fill();
    ctx.restore();
  }
  headBack(0.05*s, -1.42*s, s, panic, air ? 0 : run2*0.03);
  // 二段跳硬扑腾:飘落两片羽毛(纯视觉循环,不进粒子系统)
  if(air && pl.jumps===2){
    for(let i=0;i<2;i++){
      const ft = (t*1.6 + i*0.5) % 1;
      ctx.save();
      ctx.translate((i?0.5:-0.45)*s + ft*0.2*s, (-1.05 + ft*0.95)*s);
      ctx.rotate(ft*3 + i*2);
      ctx.globalAlpha = 1 - ft;
      ctx.fillStyle = BELLY;
      ctx.beginPath(); ctx.ellipse(0, 0, 0.05*s, 0.1*s, 0.4, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
}

/* 滑铲:肚皮贴地、双脚朝天高速抖动、>< 鬼脸、喙几乎擦地 */
function drawSlide(t, s){
  // 速度线
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, s*0.03);
  for(let i=0;i<5;i++){
    const ly = (-0.22-i*0.14)*s;
    ctx.beginPath(); ctx.moveTo(-0.95*s-i*0.1*s, ly); ctx.lineTo(-1.4*s-i*0.1*s, ly); ctx.stroke();
  }
  const jit = Math.sin(t*40)*0.02*s;                    // 脚蹼高频抖动
  foot(-0.5*s, -0.62*s + jit, s, true);                 // 双脚朝天
  foot(-0.34*s, -0.78*s - jit, s, true);
  ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.ellipse(0, -0.3*s, 0.62*s, 0.27*s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = BELLY;
  ctx.beginPath(); ctx.ellipse(0, -0.18*s, 0.5*s, 0.12*s, 0, 0, TAU); ctx.fill();
  poly([[-0.55*s,-0.4*s],[-0.82*s,-0.66*s],[-0.6*s,-0.3*s]], BELLY); // 尾巴上翘
  // 头前伸,>< 挤眼鬼脸,喙压低几乎擦地
  ctx.save(); ctx.translate(0.6*s, -0.34*s); ctx.rotate(0.1);
  disc(0, 0, 0.27*s, BODY);
  poly([[0.18*s,0.06*s],[0.54*s,0.12*s],[0.18*s,0.16*s]], ORANGE);
  ctx.strokeStyle = DARK; ctx.lineWidth = Math.max(1.2, s*0.025);
  ctx.beginPath();
  ctx.moveTo(0.0*s,-0.1*s); ctx.lineTo(0.08*s,-0.05*s); ctx.lineTo(0.0*s,0.0*s);
  ctx.moveTo(0.16*s,-0.1*s); ctx.lineTo(0.08*s,-0.05*s); ctx.lineTo(0.16*s,0.0*s);
  ctx.stroke();
  osmanthus(-0.08*s, -0.24*s, s);
  ctx.restore();
}

/* 撞车:四脚朝天 + X 眼 + 吐舌头 + 眼冒金星 + 桂花枝插落一旁 */
function drawCrash(t, s, run){
  ctx.save(); ctx.translate(-0.8*s, -0.02*s); ctx.rotate(2.4); osmanthus(0, 0, s); ctx.restore();
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
  // 头歪在一边,X 眼 + 喙松开吐舌
  ctx.save(); ctx.translate(0.55*s, -0.42*s); ctx.rotate(0.5);
  disc(0, 0, 0.28*s, BODY);
  poly([[0.16*s,0.04*s],[0.45*s,0.14*s],[0.16*s,0.16*s]], ORANGE);
  ctx.fillStyle = '#e88a9a';                                          // 吐出的小舌头
  ctx.beginPath(); ctx.ellipse(0.34*s, 0.19*s, 0.09*s, 0.05*s, 0.25, 0, TAU); ctx.fill();
  ctx.strokeStyle = DARK; ctx.lineWidth = Math.max(1.5, s*0.03);
  ctx.beginPath();
  ctx.moveTo(-0.02*s,-0.12*s); ctx.lineTo(0.1*s,-0.02*s);
  ctx.moveTo(0.1*s,-0.12*s); ctx.lineTo(-0.02*s,-0.02*s);
  ctx.stroke();
  ctx.restore();
  // 眼冒金星(绕头旋转,更大更亮)
  for(let i=0;i<4;i++){
    const a = t*3 + i*TAU/4;
    spark(0.55*s+Math.cos(a)*0.42*s, -0.85*s+Math.sin(a)*0.15*s, 0.1*s);
  }
}
function spark(sx, sy, r){
  poly([[sx,sy-r],[sx+r*0.35,sy-r*0.35],[sx+r,sy],[sx+r*0.35,sy+r*0.35],
        [sx,sy+r],[sx-r*0.35,sy+r*0.35],[sx-r,sy],[sx-r*0.35,sy-r*0.35]], OSM);
}

function crashXform(kind, age){
  if(age < 0.09){
    const k = age / 0.09;
    return { sx:1.42-k*0.12, sy:0.38+k*0.18, rot:0, dx:0, dy:0 };
  }
  const t = clamp((age-0.09)/0.45, 0, 1);
  if(kind==='low') return { sx:1.08, sy:0.82+t*0.12, rot:0.35+t*1.15, dx:t*0.22, dy:0.04+t*0.08 };
  if(kind==='high') return { sx:1, sy:1, rot:-t*3.4, dx:0, dy:Math.sin(t*Math.PI)*0.62 };
  const peel = t<0.45 ? 0.2+t*0.25 : 0.42+(t-0.45)*1.05;
  return { sx:1.55-t*0.35, sy:Math.max(0.2, peel), rot:t*0.55, dx:0, dy:t<0.45?0:(t-0.45)*0.18 };
}

function spriteFrame(pl, t, opts){
  if(opts.crashed){
    if((opts.crashAge||0) < 0.16) return opts.crashKind==='high' ? 6 : 9;
    return 10;
  }
  if(pl.sliding) return 8;
  if(pl.y > 0.05){
    if(pl.vy < 0) return 7;
    return pl.jumps === 2 ? 6 : 5;
  }
  if(opts.panic) return 9;                                // 临近障碍时张翼急刹
  return Math.floor(t * 8) % 4;                           // 四帧摇摆跑
}

function drawSpritePlayer(pl, t, opts, p, gold){
  const image = getSprite('duck');
  if(!image) return false;
  // 图集角色收回到原剪纸鸭的量级；后视角脚蹼对齐地面，避免像贴纸浮在路上。
  const dh = p.s * 1.72;
  const dw = dh * 0.75;                                   // 图集单格约 3:4
  const frame = spriteFrame(pl, t, opts);
  ctx.save();
  ctx.translate(p.x, p.y);
  if(opts.crashed){
    const xf = crashXform(opts.crashKind||'full', opts.crashAge||0.54);
    ctx.translate(xf.dx*p.s, -xf.dy*p.s);
    ctx.rotate(xf.rot);
    ctx.scale(xf.sx, xf.sy);
  } else {
    ctx.rotate(clamp((pl.lane*LANEGAP-pl.x)*0.18, -0.2, 0.2));
  }
  ctx.imageSmoothingEnabled = true;
  drawSpriteFrame(ctx, skinAtlas(image,gold), 4, 3, frame, -dw/2, -dh*0.88, dw, dh);
  ctx.restore();
  return true;
}

// opts: { panic: 障碍逼近, crashed: 撞车定格 }
export function drawPlayer(pl, t, opts){
  opts = opts || {};
  const gold = effectiveSkin(save)==='gold';
  BODY = gold ? '#f5d76e' : '#f5f0e6';
  BELLY = gold ? '#d8a83a' : '#e3d9c8';
  const p = proj(pl.x, pl.y, ZP);
  const desktopBook=opts.book && typeof matchMedia==='function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
  const bookScale=desktopBook?MOBILE.bookPlayerScale.desktop:MOBILE.bookPlayerScale.touch;
  const shadowScale=desktopBook?bookScale/MOBILE.bookPlayerScale.touch:1;
  const s = p.s * 0.62;                 // 角色整体缩放
  const x = p.x, y = p.y;
  const run = Math.sin(t*14), run2 = Math.sin(t*28);
  // 接地影:随起跳高度收缩变淡
  const gp = proj(pl.x, 0, ZP);
  const shK = Math.max(0.3, 1 - pl.y*0.55);
  shadow(gp.x, gp.y + 0.02*s, s*0.9*shK*shadowScale, 0.32*shK);
  if(opts.book){
    ctx.save();
    if(opts.crashed){ctx.translate(p.x,p.y);ctx.rotate(-Math.min(1,opts.crashAge*3)*.8);ctx.translate(-p.x,-p.y);}
    drawBookDuck(ctx,p.x,p.y,p.s*bookScale,{t,air:pl.y>.05,slide:!!pl.sliding,gold,panic:opts.panic});ctx.restore();return;
  }
  if(drawSpritePlayer(pl, t, opts, p, gold)) return;
  ctx.save();
  ctx.translate(x, y);
  if(opts.crashed){
    const xf = crashXform(opts.crashKind||'full', opts.crashAge||0.54);
    ctx.translate(xf.dx*s, -xf.dy*s);
    ctx.rotate(xf.rot);
    ctx.scale(xf.sx, xf.sy);
  } else {
    ctx.rotate(clamp((pl.lane*LANEGAP - pl.x)*0.35, -0.35, 0.35));
  }
  if(opts.crashed) drawCrash(t, s, run);
  else if(pl.sliding) drawSlide(t, s);
  else drawRun(pl, t, s, run, run2, !!opts.panic);
  ctx.restore();
}
