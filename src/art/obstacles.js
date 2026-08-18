import { ctx, TAU, proj, poly, disc, petalFlower } from '../core.js';
import { drawSpriteFrame, getSprite } from './sprites.js';

/* ================= 障碍:按景点写实物件 ================= */
// 三类:low(跳过)/high(滑铲钻过)/full(必须换道);碰撞逻辑在 game.js,此处仅绘制。
// px,py 为地面接触点屏幕坐标,s 为该深度缩放;约定光从左上来。
// 辨识度原则:主轮廓统一深色描边 + 顶面受光,配色与本关路面拉开明度/冷暖差。
const OUT = 'rgba(14,11,20,0.45)';      // 主轮廓描边

function rect(x, y, w, h, fill){
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
}
function rectO(x, y, w, h, fill, lw){   // 带主轮廓的矩形(大剪影用)
  rect(x, y, w, h, fill);
  ctx.strokeStyle = OUT; ctx.lineWidth = lw || Math.max(1, h * 0.06);
  ctx.strokeRect(x, y, w, h);
}
function line(x1, y1, x2, y2, color, lw){
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function shadow(x, y, w){
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.22, 0, 0, TAU); ctx.fill();
}
function lantern(x, y, r, glow){
  if(glow){
    const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.8);
    g.addColorStop(0, 'rgba(240,182,76,0.5)'); g.addColorStop(1, 'rgba(240,182,76,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, TAU); ctx.fill();
  }
  disc(x, y, r, '#e2483d');
  ctx.fillStyle = '#c8342e';
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.55, r, 0, 0, TAU); ctx.fill();
  rect(x - r * 0.35, y - r * 1.18, r * 0.7, r * 0.2, '#f0b64c');   // 上盖
  rect(x - r * 0.35, y + r * 0.98, r * 0.7, r * 0.2, '#f0b64c');   // 下托
  line(x, y + r * 1.18, x, y + r * 1.55, '#f0b64c', Math.max(1, r * 0.12)); // 穗
}
function brickBox(x, y, w, h, base, dark, light){
  rectO(x - w / 2, y - h, w, h, base);
  rect(x - w / 2, y - h, w, h * 0.16, light);                       // 顶面受光
  line(x - w / 2, y - h * 0.5, x + w / 2, y - h * 0.5, dark, Math.max(1, h * 0.04));  // 横缝
  line(x, y - h, x, y - h * 0.5, dark, Math.max(1, h * 0.04));      // 竖缝(上错缝)
  line(x - w * 0.25, y - h * 0.5, x - w * 0.25, y, dark, Math.max(1, h * 0.04));
  line(x + w * 0.25, y - h * 0.5, x + w * 0.25, y, dark, Math.max(1, h * 0.04));
}
function tree(x, y, s, g1, g2, trunk){
  rectO(x - 0.09 * s, y - 0.6 * s, 0.18 * s, 0.6 * s, trunk);
  const lw = Math.max(1, s * 0.03);
  poly([[x, y - 2.5 * s], [x - 0.7 * s, y - 1.5 * s], [x + 0.7 * s, y - 1.5 * s]], g2, OUT, lw);
  poly([[x, y - 2.0 * s], [x - 0.88 * s, y - 0.9 * s], [x + 0.88 * s, y - 0.9 * s]], g1, OUT, lw);
  poly([[x, y - 1.45 * s], [x - 1.0 * s, y - 0.35 * s], [x + 1.0 * s, y - 0.35 * s]], g2, OUT, lw);
  poly([[x - 0.1 * s, y - 2.1 * s], [x - 0.5 * s, y - 1.55 * s], [x + 0.15 * s, y - 1.6 * s]], 'rgba(230,240,235,0.25)'); // 月色轮廓光
}

function drawCrenelSprite(ob, p){
  const image = getSprite('crenelObstacles');
  if(!image) return false;
  const frame = ob.type==='low' ? 0 : ob.type==='high' ? 1 : 2;
  const dh = p.s * (ob.type==='low' ? 2.45 : ob.type==='high' ? 2.68 : 2.62);
  const dw = p.s * (ob.type==='low' ? 2.0 : 1.65);
  shadow(p.x, p.y + 0.03*p.s, p.s * (ob.type==='low' ? 0.55 : 0.62));
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  drawSpriteFrame(ctx, image, 3, 1, frame, p.x-dw/2, p.y-dh*0.82, dw, dh);
  ctx.restore();
  return true;
}

export function drawObstacle(ob, lv){
  const p = proj(ob.x, 0, ob.rz);
  const s = p.s, x = p.x, y = p.y;
  const m = lv.motif;
  if(m==='crenel' && drawCrenelSprite(ob, p)) return;

  if(ob.type === 'low'){
    shadow(x, y + 0.03 * s, 0.55 * s);
    if(m === 'crenel'){          // 城砖堆:两层错缝砖(冷青灰,与暖红路面分离)
      brickBox(x, y, 0.95 * s, 0.48 * s, '#5f6b72', '#3d4750', '#7f8b92');
      brickBox(x - 0.08 * s, y - 0.48 * s, 0.62 * s, 0.3 * s, '#68757d', '#3d4750', '#87929a');
    } else if(m === 'lotus'){    // 石缆桩:圆顶石柱 + 缆绳(暖石灰,与青绿路面分离)
      const w = 0.5 * s, h = 0.78 * s;
      rectO(x - w / 2, y - h * 0.82, w, h * 0.82, '#9a8f80');
      rect(x - w / 2, y - h * 0.82, w * 0.24, h * 0.82, '#b8ad9c'); // 受光面
      disc(x, y - h * 0.82, w / 2, '#a89d8c', OUT, Math.max(1, s * 0.02));
      disc(x, y - h * 0.82, w * 0.3, '#c4b9a8');
      for(let i = 0; i < 3; i++){                                    // 缆绳三圈
        ctx.strokeStyle = '#5f4426'; ctx.lineWidth = Math.max(1.5, s * 0.035);
        ctx.beginPath(); ctx.ellipse(x, y - h * (0.5 + i * 0.09), w * 0.56, w * 0.18, 0, 0, TAU); ctx.stroke();
      }
    } else if(m === 'steps'){    // 花岗岩台阶三级(压深两档,亮底关不再糊)
      for(let i = 0; i < 3; i++){
        const w = (0.95 - i * 0.14) * s, hh = 0.26 * s, yy = y - i * hh;
        rectO(x - w / 2, yy - hh, w, hh, i % 2 ? '#7e8ca6' : '#8b99b3');
        rect(x - w / 2, yy - hh, w, hh * 0.18, '#a5b2c8');
      }
    } else if(m === 'lantern'){  // 石鼓墩(暖石提亮,从深紫路面跳出)
      const r = 0.4 * s;
      rectO(x - r * 0.8, y - 0.12 * s, r * 1.6, 0.12 * s, '#7a6a54');        // 底座
      disc(x, y - 0.12 * s - r * 0.85, r, '#9a8871', OUT, Math.max(1, s * 0.025));
      disc(x, y - 0.12 * s - r * 0.85, r * 0.72, '#ac9a82');
      disc(x, y - 0.12 * s - r * 0.85, r * 0.2, '#6a5a44');                  // 鼓钉
      for(let i = 0; i < 8; i++){
        const a = i * TAU / 8;
        disc(x + Math.cos(a) * r * 0.82, y - 0.12 * s - r * 0.85 + Math.sin(a) * r * 0.82, r * 0.06, '#c2b096');
      }
    } else if(m === 'plane'){    // 矮花坛:黄砖围栏 + 顶上一排花
      rectO(x - 0.55 * s, y - 0.3 * s, 1.1 * s, 0.3 * s, '#c9a868');
      rect(x - 0.55 * s, y - 0.3 * s, 1.1 * s, 0.07 * s, '#e0c88a');
      for(let i = 0; i < 5; i++){
        ctx.fillStyle = i % 2 ? '#d98ba0' : '#e8d8b0';
        ctx.beginPath(); ctx.arc(x - 0.42 * s + i * 0.21 * s, y - 0.34 * s, 0.05 * s, 0, TAU); ctx.fill();
      }
      line(x - 0.5 * s, y - 0.22 * s, x + 0.5 * s, y - 0.22 * s, '#8a6a3a', Math.max(1, s * 0.015));
    } else if(m === 'street'){   // 青石墩:矮方石(粉巷里的灰石)
      rectO(x - 0.5 * s, y - 0.38 * s, 1.0 * s, 0.38 * s, '#8a8578');
      rect(x - 0.5 * s, y - 0.38 * s, 0.28 * s, 0.38 * s, '#a09a8a');
      disc(x, y - 0.38 * s, 0.12 * s, '#6a655a');                     // 顶部圆角
    } else if(m === 'maple'){    // 枫木桩:断桩 + 红菇
      rectO(x - 0.24 * s, y - 0.5 * s, 0.48 * s, 0.5 * s, '#5f3a28');
      ctx.fillStyle = '#e8d8b0';                                       // 断口
      ctx.beginPath(); ctx.ellipse(x, y - 0.5 * s, 0.24 * s, 0.08 * s, 0, 0, TAU); ctx.fill();
      disc(x - 0.26 * s, y - 0.24 * s, 0.1 * s, '#e0783a');
      disc(x + 0.22 * s, y - 0.18 * s, 0.08 * s, '#d0682a');
    } else if(m === 'pagoda'){   // 琉璃香炉:金脚圆炉 + 微光
      const g = ctx.createRadialGradient(x, y - 0.5 * s, 0, x, y - 0.5 * s, 0.9 * s);
      g.addColorStop(0, 'rgba(232,193,112,0.25)'); g.addColorStop(1, 'rgba(232,193,112,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 0.5 * s, 0.9 * s, 0, TAU); ctx.fill();
      rectO(x - 0.2 * s, y - 0.34 * s, 0.4 * s, 0.34 * s, '#c9c2b0');  // 炉身
      rectO(x - 0.28 * s, y - 0.4 * s, 0.56 * s, 0.1 * s, '#e8c170');  // 炉口
      rectO(x - 0.34 * s, y - 0.06 * s, 0.68 * s, 0.06 * s, '#b8934a'); // 炉脚
      rect(x - 0.28 * s, y - 0.4 * s, 0.56 * s, 0.05 * s, '#f5dd9a');
    } else if(m === 'bridge'){   // 检修路障:黄黑斜纹警示板 + 两支脚,全场最亮
      const bw = 1.1 * s, bh = 0.5 * s;
      ctx.fillStyle = '#f0c040';                                       // 警示板
      ctx.fillRect(x - bw / 2, y - bh, bw, bh);
      ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = Math.max(1.5, s * 0.035);
      for(let k = -3; k <= 3; k++){                                    // 斜纹
        ctx.beginPath(); ctx.moveTo(x - bw / 2 + k * bh * 0.42, y);
        ctx.lineTo(x - bw / 2 + (k + 1) * bh * 0.42, y - bh); ctx.stroke();
      }
      ctx.strokeRect(x - bw / 2, y - bh, bw, bh);
      rect(x - bw / 2, y - bh, bw, bh * 0.14, '#ffe08a');              // 受光沿
      rectO(x - bw / 2 - 0.06 * s, y - bh - 0.05 * s, bw + 0.12 * s, 0.07 * s, '#2a2a30'); // 顶杆
      line(x - bw * 0.32, y - 0.06 * s, x - bw * 0.18, y, '#2a2a30', Math.max(2, s * 0.05)); // 支脚
      line(x + bw * 0.32, y - 0.06 * s, x + bw * 0.18, y, '#2a2a30', Math.max(2, s * 0.05));
    } else {                     // 路锥 + 落枝
      const h = 0.72 * s;
      poly([[x, y - h], [x - 0.26 * s, y], [x + 0.26 * s, y]], '#e07830', OUT, Math.max(1, s * 0.025));  // 锥体
      poly([[x - 0.155 * s, y - h * 0.55], [x + 0.155 * s, y - h * 0.55], [x + 0.11 * s, y - h * 0.32], [x - 0.11 * s, y - h * 0.32]], '#f5f0e6'); // 反光条
      rectO(x - 0.32 * s, y - 0.05 * s, 0.64 * s, 0.05 * s, '#b85e20');      // 底座
      line(x + 0.3 * s, y - 0.02 * s, x + 0.62 * s, y - 0.14 * s, '#4a3a28', Math.max(1.5, s * 0.03)); // 落枝
      line(x + 0.42 * s, y - 0.08 * s, x + 0.5 * s, y - 0.22 * s, '#4a3a28', Math.max(1, s * 0.02));
    }
  } else if(ob.type === 'high'){
    // 悬空障碍:底部留空 0.9s 可滑铲,顶到 2.1s
    const w = 1.0 * s, top = 2.1 * s, bot = 0.9 * s;
    shadow(x, y + 0.03 * s, 0.5 * s);
    if(m === 'crenel' || m === 'lantern'){   // 灯笼横架(夫子庙更华丽)
      const pole = m === 'crenel' ? '#4a3d33' : '#33202c';
      rectO(x - w / 2, y - top, w * 0.07, top, pole);
      rectO(x + w / 2 - w * 0.07, y - top, w * 0.07, top, pole);
      rect(x - w / 2 - w * 0.03, y - top - 0.1 * s, w * 0.13, 0.12 * s, pole); // 柱头
      rect(x + w / 2 - w * 0.1, y - top - 0.1 * s, w * 0.13, 0.12 * s, pole);
      rectO(x - w / 2 - w * 0.06, y - top, w * 1.12, 0.14 * s, m === 'crenel' ? '#5d4c3f' : '#3d2531'); // 横梁
      for(let i = -1; i <= 1; i++){
        const hx = x + i * w * 0.3;
        line(hx, y - top + 0.14 * s, hx, y - top + 0.34 * s, '#f0b64c', Math.max(1, s * 0.02));
        lantern(hx, y - top + 0.52 * s, 0.17 * s, true);
      }
    } else if(m === 'lotus'){    // 垂柳横枝:一端树干,横枝垂柳帘
      const trunk = '#4a3a2c', leaf = '#5a8a5f', leafL = '#8fbc7a';
      rectO(x - w / 2, y - top, 0.14 * s, top, trunk);
      line(x - w / 2 + 0.06 * s, y - top, x + w / 2, y - top + 0.28 * s, trunk, Math.max(2, s * 0.06));
      for(let i = 0; i <= 8; i++){                                  // 垂下的柳条
        const bx = x - w / 2 + (i / 8) * w;
        const sway = Math.sin(i * 2.1) * 0.06 * s;
        ctx.strokeStyle = i % 2 ? leaf : leafL; ctx.lineWidth = Math.max(1, s * 0.022);
        ctx.beginPath(); ctx.moveTo(bx, y - top + 0.24 * s);
        ctx.quadraticCurveTo(bx + sway, y - top + (top - bot) * 0.55, bx - sway, y - bot - (0.04 + 0.08 * (i % 3)) * s);
        ctx.stroke();
      }
    } else if(m === 'steps'){    // 雪松横枝:两石柱 + 层叠松枝
      rectO(x - w / 2, y - top, w * 0.08, top, '#7c90ac');
      rectO(x + w / 2 - w * 0.08, y - top, w * 0.08, top, '#7c90ac');
      line(x - w / 2, y - top + 0.1 * s, x + w / 2, y - top + 0.1 * s, '#3a2f28', Math.max(2, s * 0.05));
      for(const k of [0.2, 0.5, 0.8]){
        const bx = x - w / 2 + k * w;
        poly([[bx, y - top - 0.06 * s], [bx - 0.3 * s, y - top + 0.34 * s], [bx + 0.3 * s, y - top + 0.34 * s]], '#2f5a48', OUT, Math.max(1, s * 0.02));
        poly([[bx, y - top + 0.1 * s], [bx - 0.36 * s, y - top + 0.55 * s], [bx + 0.36 * s, y - top + 0.55 * s]], '#3a6b56', OUT, Math.max(1, s * 0.02));
      }
    } else if(m === 'plane'){    // 电线杆横档:两黑杆 + 横线 + 吊灯
      rectO(x - w / 2, y - top, w * 0.06, top, '#3a3a42');
      rectO(x + w / 2 - w * 0.06, y - top, w * 0.06, top, '#3a3a42');
      line(x - w / 2, y - top + 0.08 * s, x + w / 2, y - top + 0.08 * s, '#4a4a52', Math.max(1.5, s * 0.025));
      for(const k of [-0.25, 0.25]){
        const hx = x + k * w;
        line(hx, y - top + 0.08 * s, hx, y - top + 0.34 * s, '#5a5a62', Math.max(1, s * 0.015)); // 吊线
        disc(hx, y - top + 0.42 * s, 0.07 * s, '#f0d890', OUT, Math.max(1, s * 0.015));          // 灯泡
      }
    } else if(m === 'street'){   // 幌子横杆:木杆 + 米布幌
      rectO(x - w / 2, y - top, w * 0.07, top, '#4a3a2c');
      rectO(x + w / 2 - w * 0.07, y - top, w * 0.07, top, '#4a3a2c');
      line(x - w / 2, y - top + 0.1 * s, x + w / 2, y - top + 0.1 * s, '#6a4a34', Math.max(2, s * 0.04));
      rectO(x - w * 0.3, y - top + 0.1 * s, w * 0.6, 0.5 * s, '#e8d8b0');  // 布幌
      rect(x - w * 0.22, y - top + 0.2 * s, w * 0.44, 0.12 * s, '#a83a2e'); // 红字
      rect(x - w * 0.22, y - top + 0.38 * s, w * 0.3, 0.08 * s, '#a83a2e');
    } else if(m === 'maple'){    // 枫枝横架:两石柱 + 红枫枝
      rectO(x - w / 2, y - top, w * 0.08, top, '#5a3528');
      rectO(x + w / 2 - w * 0.08, y - top, w * 0.08, top, '#5a3528');
      line(x - w / 2, y - top + 0.1 * s, x + w / 2, y - top + 0.1 * s, '#4a2a1c', Math.max(2, s * 0.05));
      for(let i = 0; i < 7; i++){
        const hx = x - w / 2 + (i / 6) * w;
        disc(hx, y - top - 0.02 * s, 0.14 * s, i % 2 ? '#e0783a' : '#d0682a', OUT, Math.max(1, s * 0.015));
      }
    } else if(m === 'pagoda'){   // 金檐横梁:两琉璃柱 + 金檐
      rectO(x - w / 2, y - top, w * 0.08, top, '#c9c2b0');
      rectO(x + w / 2 - w * 0.08, y - top, w * 0.08, top, '#c9c2b0');
      poly([[x - w * 0.62, y - top], [x - w * 0.34, y - top - 0.26 * s], [x + w * 0.34, y - top - 0.26 * s], [x + w * 0.62, y - top]], '#e8c170', '#b8934a', Math.max(1, s * 0.02));
      const g = ctx.createRadialGradient(x, y - top - 0.2 * s, 0, x, y - top - 0.2 * s, w);
      g.addColorStop(0, 'rgba(232,193,112,0.3)'); g.addColorStop(1, 'rgba(232,193,112,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - top - 0.2 * s, w, 0, TAU); ctx.fill();
    } else if(m === 'bridge'){   // 开放钢桁架:上弦 + 斜腹杆镂空(不挡后方视野)
      const steel = '#5a6a8a', steelD = '#2a3a5c';
      rectO(x - w / 2, y - top, w * 0.07, top, steelD);               // 端柱
      rectO(x + w / 2 - w * 0.07, y - top, w * 0.07, top, steelD);
      rectO(x - w / 2 - w * 0.04, y - top, w * 1.08, 0.16 * s, steel); // 上弦横杆
      rect(x - w / 2 - w * 0.04, y - top, w * 1.08, 0.05 * s, '#8a9ab8');
      for(let k = -4; k <= 4; k++){                                    // 斜腹杆(镂空:只画杆,空档透明)
        const t1 = (k + 5) / 9, t2 = (k + 5 + 0.5) / 9;
        line(x - w / 2 + t1 * w, y - top + 0.16 * s, x - w / 2 + t2 * w, y - bot + 0.1 * s, steel, Math.max(1.5, s * 0.03));
        line(x - w / 2 + t2 * w, y - top + 0.16 * s, x - w / 2 + t1 * w, y - bot + 0.1 * s, steelD, Math.max(1, s * 0.022));
      }
      rectO(x - w / 2 - w * 0.02, y - bot + 0.06 * s, w * 1.04, 0.12 * s, steelD); // 下弦
      disc(x - w * 0.35, y - top + 0.05 * s, 0.05 * s, '#e2483d');     // 端柱红旗标
      disc(x + w * 0.35, y - top + 0.05 * s, 0.05 * s, '#e2483d');
      line(x - w * 0.35, y - top + 0.02 * s, x - w * 0.35, y - top + 0.12 * s, '#f0d890', Math.max(1, s * 0.015));
    } else {                     // 山路护栏:金属横栏 + 反光标
      const post = '#5a6278', rail = '#aab2c8', railD = '#3f4556';
      rectO(x - w / 2, y - top + 0.5 * s, w * 0.07, top - 0.5 * s, post);
      rectO(x + w / 2 - w * 0.07, y - top + 0.5 * s, w * 0.07, top - 0.5 * s, post);
      rectO(x - w / 2 - w * 0.04, y - top, w * 1.08, (top - bot) * 0.42, rail);   // 上横栏
      rect(x - w / 2 - w * 0.04, y - top + (top - bot) * 0.42, w * 1.08, 0.06 * s, railD);
      rectO(x - w / 2 - w * 0.04, y - bot - (top - bot) * 0.32, w * 1.08, (top - bot) * 0.32, rail);  // 下横栏
      disc(x - w * 0.3, y - top + 0.1 * s, 0.05 * s, '#e2483d');                 // 反光标
      disc(x + w * 0.3, y - top + 0.1 * s, 0.05 * s, '#e2483d');
    }
  } else {                       // full:整车道,必须换道
    const w = 1.05 * s, h = 2.3 * s;
    shadow(x, y + 0.03 * s, 0.6 * s);
    if(m === 'crenel'){          // 敌楼门洞:砖墙 + 拱洞 + 城垛 + 瓦檐(冷青灰)
      rectO(x - w / 2, y - h * 0.72, w, h * 0.72, '#5f6b72');
      for(let i = 0; i < 3; i++) rectO(x - w / 2 + w * (0.12 + i * 0.34), y - h * 0.72 - 0.13 * s, w * 0.16, 0.13 * s, '#5f6b72'); // 垛口
      poly([[x - w * 0.6, y - h * 0.72], [x - w * 0.42, y - h * 0.88], [x + w * 0.42, y - h * 0.88], [x + w * 0.6, y - h * 0.72]], '#2e2a26', OUT, Math.max(1, s * 0.02)); // 瓦檐
      ctx.fillStyle = '#1c1a18';                                  // 拱洞(黑洞)
      ctx.beginPath();
      ctx.moveTo(x - w * 0.22, y); ctx.lineTo(x - w * 0.22, y - h * 0.4);
      ctx.arc(x, y - h * 0.4, w * 0.22, Math.PI, 0);
      ctx.lineTo(x + w * 0.22, y); ctx.closePath(); ctx.fill();
      line(x - w / 2, y - h * 0.3, x + w / 2, y - h * 0.3, '#45505a', Math.max(1, s * 0.02));
      line(x - w / 2, y - h * 0.55, x + w / 2, y - h * 0.55, '#45505a', Math.max(1, s * 0.02));
    } else if(m === 'lotus'){    // 荷花缸:酱色陶缸 + 荷叶 + 一朵荷花
      const pw = 0.95 * s, ph = 0.85 * s;
      poly([[x - pw / 2, y - ph], [x + pw / 2, y - ph], [x + pw * 0.38, y], [x - pw * 0.38, y]], '#6e4f45', OUT, Math.max(1, s * 0.025)); // 缸身
      rectO(x - pw / 2 - 0.04 * s, y - ph - 0.1 * s, pw + 0.08 * s, 0.12 * s, '#82604f');  // 缸沿
      disc(x - 0.2 * s, y - ph - 0.22 * s, 0.24 * s, '#3f6b52', OUT, Math.max(1, s * 0.02));
      disc(x + 0.22 * s, y - ph - 0.3 * s, 0.28 * s, '#4a7a5a', OUT, Math.max(1, s * 0.02));
      disc(x, y - ph - 0.45 * s, 0.22 * s, '#3f6b52', OUT, Math.max(1, s * 0.02));
      petalFlower(x + 0.05 * s, y - ph - 0.78 * s, 0.22 * s, '#d98ba0');
      line(x + 0.05 * s, y - ph - 0.66 * s, x + 0.05 * s, y - ph - 0.3 * s, '#4a7a5a', Math.max(1.5, s * 0.025));
    } else if(m === 'steps'){    // 石牌坊柱:整柱 + 蓝瓦小额枋(柱身压深)
      rectO(x - w * 0.3, y - h * 0.78, w * 0.6, h * 0.78, '#8291ab');
      rect(x - w * 0.3, y - h * 0.78, w * 0.14, h * 0.78, '#9fadc2'); // 受光棱
      rectO(x - w * 0.38, y - h * 0.14, w * 0.76, h * 0.14, '#6f7f9a'); // 柱础
      rectO(x - w * 0.42, y - h * 0.86, w * 0.84, h * 0.09, '#7c90ac'); // 额枋
      poly([[x - w * 0.52, y - h * 0.86], [x - w * 0.34, y - h], [x + w * 0.34, y - h], [x + w * 0.52, y - h * 0.86]], '#2e5f8a', OUT, Math.max(1, s * 0.02)); // 蓝瓦
    } else if(m === 'lantern'){  // 画舫:泊在航道上的彩船(提亮舱体,深紫夜里更醒目)
      poly([[x - w * 0.55, y - h * 0.12], [x - w * 0.42, y - h * 0.3], [x + w * 0.42, y - h * 0.3], [x + w * 0.55, y - h * 0.12]], '#5c2838', OUT, Math.max(1, s * 0.025)); // 船体
      rectO(x - w * 0.34, y - h * 0.62, w * 0.68, h * 0.34, '#70334a');  // 船舱
      poly([[x - w * 0.44, y - h * 0.62], [x, y - h * 0.82], [x + w * 0.44, y - h * 0.62]], '#8f4456', OUT, Math.max(1, s * 0.02));  // 舱顶
      for(const k of [-0.18, 0.02, 0.22]){                            // 窗灯
        rect(x + k * w - 0.05 * s, y - h * 0.5, 0.1 * s, 0.12 * s, '#f0b64c');
      }
      lantern(x + w * 0.4, y - h * 0.36, 0.1 * s, true);              // 船头灯
    } else if(m === 'plane'){    // 梧桐大树:满冠金黄(晨雾天最显眼)
      tree(x, y, s * 0.95, '#d8a83a', '#c08a2a', '#5a4428');
    } else if(m === 'street'){   // 门楼:粉墙门面 + 黛瓦檐 + 灯笼
      rectO(x - w / 2, y - h * 0.78, w, h * 0.78, '#d8a89a');           // 粉墙
      rect(x - w / 2, y - h * 0.78, w, 0.1 * s, '#f0d0c0');             // 受光
      poly([[x - w * 0.58, y - h * 0.78], [x - w * 0.42, y - h * 0.95], [x + w * 0.42, y - h * 0.95], [x + w * 0.58, y - h * 0.78]], '#3a3a46', OUT, Math.max(1, s * 0.02)); // 瓦檐
      ctx.fillStyle = '#6a4a42';                                        // 门洞
      ctx.fillRect(x - w * 0.2, y - h * 0.45, w * 0.4, h * 0.45);
      line(x - w / 2, y - h * 0.42, x + w / 2, y - h * 0.42, '#8a5a4a', Math.max(1, s * 0.02));
      lantern(x + w * 0.36, y - h * 0.5, 0.09 * s, true);
    } else if(m === 'maple'){    // 红枫大树
      tree(x, y, s * 0.95, '#e0783a', '#c06028', '#5a3528');
    } else if(m === 'pagoda'){   // 塔柱:白琉璃柱 + 金檐 + 光晕
      const g = ctx.createRadialGradient(x, y - h * 0.6, 0, x, y - h * 0.6, h * 0.9);
      g.addColorStop(0, 'rgba(232,193,112,0.3)'); g.addColorStop(1, 'rgba(232,193,112,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - h * 0.6, h * 0.9, 0, TAU); ctx.fill();
      rectO(x - w * 0.34, y - h * 0.8, w * 0.68, h * 0.8, '#c9c2b0');   // 塔身
      rect(x - w * 0.34, y - h * 0.8, w * 0.16, h * 0.8, '#e0d8c4');    // 受光棱
      poly([[x - w * 0.44, y - h * 0.8], [x - w * 0.26, y - h * 0.92], [x + w * 0.26, y - h * 0.92], [x + w * 0.44, y - h * 0.8]], '#e8c170', '#b8934a', Math.max(1, s * 0.02)); // 金檐
      rectO(x - w * 0.4, y - h * 0.12, w * 0.8, h * 0.12, '#a89f8e');   // 基座
    } else if(m === 'bridge'){   // 窄桥墩:瘦身 0.6s + 浅灰蓝 + 顶旗 + 灯点
      const bw = 0.6 * s;                                              // 瘦身后不遮邻道与后方
      shadow(x, y + 0.03 * s, 0.45 * s);
      rectO(x - bw / 2, y - h * 0.85, bw, h * 0.85, '#5a6a8a');        // 墩身浅灰蓝
      rect(x - bw / 2, y - h * 0.85, bw * 0.3, h * 0.85, '#7a8aaa');   // 受光棱
      rectO(x - bw / 2 - 0.06 * s, y - h * 0.85 - 0.06 * s, bw + 0.12 * s, 0.09 * s, '#2a3a5c'); // 顶帽
      poly([[x - bw * 0.3, y - h * 0.85 - 0.06 * s], [x, y - h * 0.85 - 0.3 * s], [x + bw * 0.3, y - h * 0.85 - 0.06 * s]], '#e2483d', OUT, Math.max(1, s * 0.015)); // 红旗
      rect(x - bw / 2, y - h * 0.42, bw, h * 0.08, '#2a3a5c');         // 横缝
      disc(x, y - h * 0.58, 0.05 * s, '#f0d890');                      // 灯点
      rectO(x - bw / 2 - 0.08 * s, y - h * 0.1, bw + 0.16 * s, h * 0.1, '#4a5a7a'); // 墩座
    } else {                     // 松树(夜色,提亮 + 月色轮廓光)
      tree(x, y, s * 0.92, '#3a8562', '#2e6a4e', '#4a3c30');
    }
  }
}
