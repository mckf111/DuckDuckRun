import { ctx, TAU, proj, poly, disc, petalFlower } from '../core.js';

/* ================= 障碍:按景点写实物件 ================= */
// 三类:low(跳过)/high(滑铲钻过)/full(必须换道);碰撞逻辑在 game.js,此处仅绘制。
// px,py 为地面接触点屏幕坐标,s 为该深度缩放;约定光从左上来。

function rect(x, y, w, h, fill){
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
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
    g.addColorStop(0, 'rgba(240,182,76,0.4)'); g.addColorStop(1, 'rgba(240,182,76,0)');
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
  rect(x - w / 2, y - h, w, h, base);
  rect(x - w / 2, y - h, w, h * 0.16, light);                       // 顶面受光
  line(x - w / 2, y - h * 0.5, x + w / 2, y - h * 0.5, dark, Math.max(1, h * 0.04));  // 横缝
  line(x, y - h, x, y - h * 0.5, dark, Math.max(1, h * 0.04));      // 竖缝(上错缝)
  line(x - w * 0.25, y - h * 0.5, x - w * 0.25, y, dark, Math.max(1, h * 0.04));
  line(x + w * 0.25, y - h * 0.5, x + w * 0.25, y, dark, Math.max(1, h * 0.04));
}
function tree(x, y, s, g1, g2, trunk){
  rect(x - 0.09 * s, y - 0.6 * s, 0.18 * s, 0.6 * s, trunk);
  poly([[x, y - 2.5 * s], [x - 0.7 * s, y - 1.5 * s], [x + 0.7 * s, y - 1.5 * s]], g2);
  poly([[x, y - 2.0 * s], [x - 0.88 * s, y - 0.9 * s], [x + 0.88 * s, y - 0.9 * s]], g1);
  poly([[x, y - 1.45 * s], [x - 1.0 * s, y - 0.35 * s], [x + 1.0 * s, y - 0.35 * s]], g2);
  poly([[x - 0.1 * s, y - 2.1 * s], [x - 0.5 * s, y - 1.55 * s], [x + 0.15 * s, y - 1.6 * s]], '#ffffff22');
}

export function drawObstacle(ob, lv){
  const p = proj(ob.x, 0, ob.rz);
  const s = p.s, x = p.x, y = p.y;
  const m = lv.motif;

  if(ob.type === 'low'){
    shadow(x, y + 0.03 * s, 0.55 * s);
    if(m === 'crenel'){          // 城砖堆:两层错缝青砖
      brickBox(x, y, 0.95 * s, 0.48 * s, '#6b6560', '#453f39', '#8a837a');
      brickBox(x - 0.08 * s, y - 0.48 * s, 0.62 * s, 0.3 * s, '#75706a', '#453f39', '#8a837a');
    } else if(m === 'lotus'){    // 石缆桩:圆顶石柱 + 缆绳
      const w = 0.5 * s, h = 0.78 * s;
      rect(x - w / 2, y - h * 0.82, w, h * 0.82, '#8a9090');
      rect(x - w / 2, y - h * 0.82, w * 0.24, h * 0.82, '#a8aeb0'); // 受光面
      disc(x, y - h * 0.82, w / 2, '#9aa0a2');
      disc(x, y - h * 0.82, w * 0.3, '#b4baba');
      for(let i = 0; i < 3; i++){                                    // 缆绳三圈
        ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = Math.max(1.5, s * 0.035);
        ctx.beginPath(); ctx.ellipse(x, y - h * (0.5 + i * 0.09), w * 0.56, w * 0.18, 0, 0, TAU); ctx.stroke();
      }
    } else if(m === 'steps'){    // 花岗岩台阶三级
      for(let i = 0; i < 3; i++){
        const w = (0.95 - i * 0.14) * s, hh = 0.26 * s, yy = y - i * hh;
        rect(x - w / 2, yy - hh, w, hh, i % 2 ? '#aeb9c9' : '#bcc7d6');
        rect(x - w / 2, yy - hh, w, hh * 0.18, '#d7dfea');
      }
    } else if(m === 'lantern'){  // 石鼓墩
      const r = 0.4 * s;
      rect(x - r * 0.8, y - 0.12 * s, r * 1.6, 0.12 * s, '#6a5c4c');        // 底座
      disc(x, y - 0.12 * s - r * 0.85, r, '#7d6e5a');
      disc(x, y - 0.12 * s - r * 0.85, r * 0.72, '#8d7d68');
      disc(x, y - 0.12 * s - r * 0.85, r * 0.2, '#6a5c4c');                 // 鼓钉
      for(let i = 0; i < 8; i++){
        const a = i * TAU / 8;
        disc(x + Math.cos(a) * r * 0.82, y - 0.12 * s - r * 0.85 + Math.sin(a) * r * 0.82, r * 0.06, '#9d8d76');
      }
    } else {                     // 路锥 + 落枝
      const h = 0.72 * s;
      poly([[x, y - h], [x - 0.26 * s, y], [x + 0.26 * s, y]], '#e07830');  // 锥体
      poly([[x - 0.155 * s, y - h * 0.55], [x + 0.155 * s, y - h * 0.55], [x + 0.11 * s, y - h * 0.32], [x - 0.11 * s, y - h * 0.32]], '#f5f0e6'); // 反光条
      rect(x - 0.32 * s, y - 0.05 * s, 0.64 * s, 0.05 * s, '#c96a28');      // 底座
      line(x + 0.3 * s, y - 0.02 * s, x + 0.62 * s, y - 0.14 * s, '#4a3a28', Math.max(1.5, s * 0.03)); // 落枝
      line(x + 0.42 * s, y - 0.08 * s, x + 0.5 * s, y - 0.22 * s, '#4a3a28', Math.max(1, s * 0.02));
    }
  } else if(ob.type === 'high'){
    // 悬空障碍:底部留空 0.9s 可滑铲,顶到 2.1s
    const w = 1.0 * s, top = 2.1 * s, bot = 0.9 * s;
    shadow(x, y + 0.03 * s, 0.5 * s);
    if(m === 'crenel' || m === 'lantern'){   // 灯笼横架(夫子庙更华丽)
      const pole = m === 'crenel' ? '#5a4a40' : '#3d2430';
      rect(x - w / 2, y - top, w * 0.07, top, pole);
      rect(x + w / 2 - w * 0.07, y - top, w * 0.07, top, pole);
      rect(x - w / 2 - w * 0.03, y - top - 0.1 * s, w * 0.13, 0.12 * s, pole); // 柱头
      rect(x + w / 2 - w * 0.1, y - top - 0.1 * s, w * 0.13, 0.12 * s, pole);
      rect(x - w / 2 - w * 0.06, y - top, w * 1.12, 0.14 * s, m === 'crenel' ? '#6b5648' : '#4a2c3a'); // 横梁
      for(let i = -1; i <= 1; i++){
        const hx = x + i * w * 0.3;
        line(hx, y - top + 0.14 * s, hx, y - top + 0.34 * s, '#f0b64c', Math.max(1, s * 0.02));
        lantern(hx, y - top + 0.52 * s, 0.16 * s, true);
      }
    } else if(m === 'lotus'){    // 垂柳横枝:一端树干,横枝垂柳帘
      const trunk = '#4a3a2c', leaf = '#5a8a5f', leafL = '#7ba86f';
      rect(x - w / 2, y - top, 0.14 * s, top, trunk);
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
      rect(x - w / 2, y - top, w * 0.08, top, '#9db1c6');
      rect(x + w / 2 - w * 0.08, y - top, w * 0.08, top, '#9db1c6');
      line(x - w / 2, y - top + 0.1 * s, x + w / 2, y - top + 0.1 * s, '#3a2f28', Math.max(2, s * 0.05));
      for(const k of [0.2, 0.5, 0.8]){
        const bx = x - w / 2 + k * w;
        poly([[bx, y - top - 0.06 * s], [bx - 0.3 * s, y - top + 0.34 * s], [bx + 0.3 * s, y - top + 0.34 * s]], '#2f5a48');
        poly([[bx, y - top + 0.1 * s], [bx - 0.36 * s, y - top + 0.55 * s], [bx + 0.36 * s, y - top + 0.55 * s]], '#3a6b56');
      }
    } else {                     // 山路护栏:金属横栏 + 反光标
      const post = '#6a7288', rail = '#9aa2b8', railD = '#4a5064';
      rect(x - w / 2, y - top + 0.5 * s, w * 0.07, top - 0.5 * s, post);
      rect(x + w / 2 - w * 0.07, y - top + 0.5 * s, w * 0.07, top - 0.5 * s, post);
      rect(x - w / 2 - w * 0.04, y - top, w * 1.08, (top - bot) * 0.42, rail);   // 上横栏
      rect(x - w / 2 - w * 0.04, y - top + (top - bot) * 0.42, w * 1.08, 0.06 * s, railD);
      rect(x - w / 2 - w * 0.04, y - bot - (top - bot) * 0.32, w * 1.08, (top - bot) * 0.32, rail);  // 下横栏
      disc(x - w * 0.3, y - top + 0.1 * s, 0.05 * s, '#e2483d');                 // 反光标
      disc(x + w * 0.3, y - top + 0.1 * s, 0.05 * s, '#e2483d');
    }
  } else {                       // full:整车道,必须换道
    const w = 1.05 * s, h = 2.3 * s;
    shadow(x, y + 0.03 * s, 0.6 * s);
    if(m === 'crenel'){          // 敌楼门洞:砖墙 + 拱洞 + 城垛 + 瓦檐
      rect(x - w / 2, y - h * 0.72, w, h * 0.72, '#6b6560');
      for(let i = 0; i < 3; i++) rect(x - w / 2 + w * (0.12 + i * 0.34), y - h * 0.72 - 0.13 * s, w * 0.16, 0.13 * s, '#6b6560'); // 垛口
      poly([[x - w * 0.6, y - h * 0.72], [x - w * 0.42, y - h * 0.88], [x + w * 0.42, y - h * 0.88], [x + w * 0.6, y - h * 0.72]], '#3a332e'); // 瓦檐
      ctx.fillStyle = '#241f1c';                                  // 拱洞(黑洞)
      ctx.beginPath();
      ctx.moveTo(x - w * 0.22, y); ctx.lineTo(x - w * 0.22, y - h * 0.4);
      ctx.arc(x, y - h * 0.4, w * 0.22, Math.PI, 0);
      ctx.lineTo(x + w * 0.22, y); ctx.closePath(); ctx.fill();
      line(x - w / 2, y - h * 0.3, x + w / 2, y - h * 0.3, '#544e48', Math.max(1, s * 0.02));
      line(x - w / 2, y - h * 0.55, x + w / 2, y - h * 0.55, '#544e48', Math.max(1, s * 0.02));
    } else if(m === 'lotus'){    // 荷花缸:陶缸 + 荷叶 + 一朵荷花
      const pw = 0.95 * s, ph = 0.85 * s;
      poly([[x - pw / 2, y - ph], [x + pw / 2, y - ph], [x + pw * 0.38, y], [x - pw * 0.38, y]], '#5a4a6b'); // 缸身
      rect(x - pw / 2 - 0.04 * s, y - ph - 0.1 * s, pw + 0.08 * s, 0.12 * s, '#6b5a7d');  // 缸沿
      disc(x - 0.2 * s, y - ph - 0.22 * s, 0.24 * s, '#3f6b52');
      disc(x + 0.22 * s, y - ph - 0.3 * s, 0.28 * s, '#4a7a5a');
      disc(x, y - ph - 0.45 * s, 0.22 * s, '#3f6b52');
      petalFlower(x + 0.05 * s, y - ph - 0.78 * s, 0.22 * s, '#d98ba0');
      line(x + 0.05 * s, y - ph - 0.66 * s, x + 0.05 * s, y - ph - 0.3 * s, '#4a7a5a', Math.max(1.5, s * 0.025));
    } else if(m === 'steps'){    // 石牌坊柱:整柱 + 蓝瓦小额枋
      rect(x - w * 0.3, y - h * 0.78, w * 0.6, h * 0.78, '#aeb9c9');
      rect(x - w * 0.3, y - h * 0.78, w * 0.14, h * 0.78, '#c6d0de'); // 受光棱
      rect(x - w * 0.38, y - h * 0.14, w * 0.76, h * 0.14, '#93a7bd'); // 柱础
      rect(x - w * 0.42, y - h * 0.86, w * 0.84, h * 0.09, '#9db1c6'); // 额枋
      poly([[x - w * 0.52, y - h * 0.86], [x - w * 0.34, y - h], [x + w * 0.34, y - h], [x + w * 0.52, y - h * 0.86]], '#2e5f8a'); // 蓝瓦
    } else if(m === 'lantern'){  // 画舫:泊在航道上的彩船
      poly([[x - w * 0.55, y - h * 0.12], [x - w * 0.42, y - h * 0.3], [x + w * 0.42, y - h * 0.3], [x + w * 0.55, y - h * 0.12]], '#4a2030'); // 船体
      rect(x - w * 0.34, y - h * 0.62, w * 0.68, h * 0.34, '#5d2a3a');  // 船舱
      poly([[x - w * 0.44, y - h * 0.62], [x, y - h * 0.82], [x + w * 0.44, y - h * 0.62]], '#7d3a4a');  // 舱顶
      for(const k of [-0.18, 0.02, 0.22]){                            // 窗灯
        rect(x + k * w - 0.05 * s, y - h * 0.5, 0.1 * s, 0.12 * s, '#f0b64c');
      }
      lantern(x + w * 0.4, y - h * 0.36, 0.1 * s, true);              // 船头灯
    } else {                     // 松树(夜色,更高更密)
      tree(x, y, s * 0.92, '#1f4a38', '#2a5a45', '#3a2f28');
    }
  }
}
