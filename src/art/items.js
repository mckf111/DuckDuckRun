import { ctx, TAU, poly, disc, petalFlower } from '../core.js';

/* 图鉴图标:以 (x,y) 为中心,r 为半径。
   画风:多色 + 主轮廓深描边(OUT),48px 大稿画起,缩到路上 r≈15px 也要一眼认出。
   locked = 未获得:整体降灰。 */
const OUT = '#3a2a1e';   // 深棕描边:路面浅时一眼可辨
const OUTW = r => Math.max(1, r * 0.09);
function lineCapRound(){ ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }

export function drawItemIcon(id, x, y, r, locked){
  const g = locked ? '#5a5560' : '#d8a83a';   // 主色系(锁定统一灰金)
  const d = locked ? '#46414c' : '#8a6a2a';   // 次色系
  const lite = locked ? '#6e6974' : '#f0c85a'; // 高光
  const out = locked ? '#2c2735' : OUT;
  const lw = OUTW(r);
  lineCapRound();
  ctx.save(); ctx.translate(x, y);
  if(id==='duck'){ // 盐水鸭:卤金鸭身 + 鸭头 + 翅纹
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, r*0.15, r*0.8, r*0.5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    ctx.beginPath(); ctx.arc(r*0.55, -r*0.35, r*0.3, 0, TAU); ctx.fill();
    ctx.stroke();
    poly([[r*0.78,-r*0.4],[r*1.05,-r*0.3],[r*0.78,-r*0.22]], g, out, lw);   // 喙
    if(!locked) disc(r*0.62,-r*0.42,r*0.05,'#fff');
    poly([[-r*0.7,-r*0.15],[-r*1.05,-r*0.45],[-r*0.85,0]], g, out, lw);     // 颈
    ctx.strokeStyle = d; ctx.lineWidth = lw*0.8;                            // 翅纹
    ctx.beginPath(); ctx.moveTo(-r*0.3, 0); ctx.quadraticCurveTo(0, r*0.25, r*0.3, 0); ctx.stroke();
  } else if(id==='fans'){ // 鸭血粉丝汤:青花碗 + 汤面 + 鸭血/粉丝
    ctx.fillStyle = '#3a6a8a';                                              // 碗
    ctx.beginPath(); ctx.arc(0, 0, r*0.82, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    poly([[-r*0.95,0],[r*0.95,0],[r*0.8,r*0.12],[-r*0.8,r*0.12]], '#3a6a8a', out, lw);
    ctx.fillStyle = locked ? '#6e6974' : '#e8d8b0';                         // 汤面
    ctx.beginPath(); ctx.ellipse(0, -r*0.08, r*0.72, r*0.2, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = locked ? '#46414c' : '#d8c8a0'; ctx.lineWidth = lw*0.7;
    for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*r*0.3, -r*0.05);  // 粉丝
      ctx.quadraticCurveTo(i*r*0.3+r*0.12, -r*0.5, i*r*0.25, -r*0.8); ctx.stroke(); }
    disc(-r*0.28, -r*0.14, r*0.13, locked?'#46414c':'#8a3b34');            // 鸭血
    disc(r*0.32, -r*0.16, r*0.11, locked?'#46414c':'#8a3b34');
    disc(r*0.45, -r*0.12, r*0.05, locked?'#46414c':'#5a8a3a');             // 香菜
    disc(r*0.28, -r*0.28, r*0.04, locked?'#46414c':'#5a8a3a');
  } else if(id==='tea'){ // 雨花茶:白瓷盏 + 绿汤 + 松针竖叶
    const cup = locked ? '#6e6974' : '#f5f2ea', rim = locked ? '#5a5560' : '#e0dccf';
    const soup = locked ? '#46414c' : '#a8c47a', leaf = locked ? '#46414c' : '#4a7a3a';
    ctx.fillStyle = locked ? '#46414c' : '#d8d2c4';                         // 盏托
    ctx.beginPath(); ctx.ellipse(0, r*0.6, r*0.72, r*0.16, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.7; ctx.stroke();
    poly([[-r*0.62,-r*0.26],[r*0.62,-r*0.26],[r*0.4,r*0.52],[-r*0.4,r*0.52]], cup, out, lw);   // 盏身
    poly([[-r*0.62,-r*0.26],[r*0.62,-r*0.26],[r*0.54,-r*0.15],[-r*0.54,-r*0.15]], rim, out, lw*0.6); // 盏口
    ctx.fillStyle = soup;                                                  // 茶汤面
    ctx.beginPath(); ctx.ellipse(0, -r*0.2, r*0.5, r*0.11, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = leaf; ctx.lineWidth = r*0.06;                        // 竖立松针茶叶
    for(const [px, tilt] of [[-r*0.18,-0.14],[0.02*r,0.04],[r*0.2,0.16],[-r*0.04,-0.04]]){
      ctx.beginPath(); ctx.moveTo(px, -r*0.18); ctx.lineTo(px+tilt*r, -r*0.68); ctx.stroke();
    }
    ctx.strokeStyle = locked ? '#6e6974' : 'rgba(255,255,255,0.75)';        // 热气
    ctx.lineWidth = r*0.07;
    for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*r*0.28, -r*0.46);
      ctx.quadraticCurveTo(i*r*0.28+r*0.1, -r*0.7, i*r*0.24, -r*0.9); ctx.stroke(); }
  } else if(id==='taro'){ // 桂花糖芋苗:红糖糊 + 芋头块 + 桂花
    ctx.fillStyle = locked ? '#46414c' : '#8a3b34';                        // 碗
    ctx.beginPath(); ctx.arc(0, 0, r*0.78, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = locked ? '#5a5560' : '#a84a3a';                         // 糖糊
    ctx.beginPath(); ctx.ellipse(0, -r*0.12, r*0.7, r*0.22, 0, 0, TAU); ctx.fill();
    for(let i=0;i<3;i++) disc((i-1)*r*0.35, -r*0.14, r*0.16, locked?'#6e6974':'#f3d9a0', out, lw*0.6); // 芋块
    petalFlower(r*0.45, -r*0.5, r*0.2, locked?'#5a5560':'#f3d9a0');
    if(!locked) disc(-r*0.4, -r*0.42, r*0.06, '#f0b64c');                  // 撒桂花
  } else if(id==='plum'){ // 梅花:五瓣 + 黄蕊
    petalFlower(0, 0, r*0.85, locked?'#6e6974':'#f7e0e8', locked?'#5a5560':'#f0b64c');
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.8;                          // 花瓣描边
    for(let i=0;i<5;i++){
      const a = -Math.PI/2 + i*TAU/5;
      ctx.beginPath(); ctx.ellipse(Math.cos(a)*r*0.53, Math.sin(a)*r*0.53, r*0.47, r*0.29, a, 0, TAU); ctx.stroke();
    }
  } else if(id==='pot'){ // 牛肉锅贴:金月牙饺 + 焦底 + 芝麻
    ctx.fillStyle = locked ? '#6e6974' : '#e8b04b';
    ctx.beginPath(); ctx.ellipse(0, r*0.1, r*0.85, r*0.42, -0.15, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = locked ? '#46414c' : '#c98a2a';                         // 焦底
    ctx.beginPath(); ctx.ellipse(0, r*0.32, r*0.62, r*0.16, -0.15, 0, TAU); ctx.fill();
    ctx.strokeStyle = locked ? '#5a5560' : '#a86a1e'; ctx.lineWidth = lw*0.8; // 褶
    for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*r*0.28, -r*0.22); ctx.lineTo(i*r*0.28+r*0.1, r*0.02); ctx.stroke(); }
    ctx.fillStyle = locked ? '#6e6974' : '#f5d78a';                         // 受光面
    ctx.beginPath(); ctx.ellipse(-r*0.15, -r*0.05, r*0.5, r*0.18, -0.15, 0, TAU); ctx.fill();
    for(const [px,py] of [[-0.5,0.05],[0.15,0.18],[0.5,-0.02]])
      disc(px*r, py*r, r*0.05, locked?'#6e6974':'#f5f0e6');                // 芝麻
  } else if(id==='bean'){ // 赤豆元宵:红糊小碗 + 白元宵
    ctx.fillStyle = locked ? '#46414c' : '#8a3b34';
    ctx.beginPath(); ctx.arc(0, r*0.05, r*0.78, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = locked ? '#5a5560' : '#6b2a24';                         // 赤豆糊
    ctx.beginPath(); ctx.ellipse(0, r*0.02, r*0.7, r*0.2, 0, 0, TAU); ctx.fill();
    for(const [px,py] of [[-0.3,0],[0.05,-0.06],[0.38,0.02]]) disc(px*r, py*r, r*0.15, locked?'#6e6974':'#f5f0e6', out, lw*0.5);
  } else if(id==='cloud'){ // 云锦:织金缎面 + 云纹 + 金线
    poly([[0,-r*0.85],[r*0.85,0],[0,r*0.85],[-r*0.85,0]], locked?'#46414c':'#7a2a3a', out, lw);
    poly([[0,-r*0.6],[r*0.6,0],[0,r*0.6],[-r*0.6,0]], locked?'#5a5560':'#a03a4a');
    ctx.strokeStyle = locked ? '#6e6974' : '#f0b64c'; ctx.lineWidth = r*0.07; // 金线云纹
    for(const dy of [-0.25, 0.05, 0.35]){
      ctx.beginPath(); ctx.moveTo(-r*0.4, r*dy);
      ctx.quadraticCurveTo(-r*0.15, r*(dy-0.18), r*0.05, r*dy);
      ctx.quadraticCurveTo(r*0.2, r*(dy+0.14), r*0.4, r*(dy-0.06)); ctx.stroke();
    }
    disc(0, -r*0.5, r*0.05, locked?'#5a5560':'#f0b64c');                   // 金点
    disc(r*0.42, r*0.3, r*0.04, locked?'#5a5560':'#f0b64c');
  } else if(id==='gold'){ // 金箔:层叠金片 + 折光
    ctx.save(); ctx.rotate(0.12);
    ctx.fillStyle = locked ? '#5a5560' : '#d8a83a'; ctx.fillRect(-r*0.6, -r*0.42, r*1.2, r*0.84);
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.strokeRect(-r*0.6, -r*0.42, r*1.2, r*0.84);
    ctx.fillStyle = locked ? '#6e6974' : '#f0c85a'; ctx.fillRect(-r*0.6, -r*0.42, r*1.2, r*0.3);
    ctx.fillStyle = locked ? '#5a5560' : '#f7e0a0';                         // 折光条
    ctx.fillRect(-r*0.34, -r*0.12, r*0.18, r*0.42);
    ctx.strokeStyle = locked ? '#6e6974' : '#a87a1e'; ctx.lineWidth = lw*0.6;
    ctx.strokeRect(-r*0.42, -r*0.3, r*1.04, r*0.66);
    ctx.restore();
  } else if(id==='leaf'){ // 梧桐叶:掌状五裂 + 叶脉
    ctx.fillStyle = locked ? '#6e6974' : '#c9903a';
    for(let i=0;i<5;i++){
      const a = -Math.PI/2 + (i-2)*0.5;
      ctx.beginPath(); ctx.ellipse(Math.cos(a)*r*0.34, Math.sin(a)*r*0.34, r*0.42, r*0.2, a, 0, TAU); ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.8;
    ctx.beginPath(); ctx.moveTo(0, r*0.2); ctx.lineTo(0, r*0.75); ctx.stroke();  // 叶柄
    ctx.strokeStyle = locked ? '#46414c' : '#8a5a1e'; ctx.lineWidth = lw*0.6;     // 叶脉
    for(let i=0;i<5;i++){ const a = -Math.PI/2 + (i-2)*0.5;
      ctx.beginPath(); ctx.moveTo(0, r*0.15); ctx.lineTo(Math.cos(a)*r*0.55, Math.sin(a)*r*0.55); ctx.stroke(); }
    ctx.fillStyle = locked ? '#5a5560' : '#e8b04b';                         // 光斑
    ctx.beginPath(); ctx.ellipse(-r*0.12, -r*0.2, r*0.16, r*0.1, 0.4, 0, TAU); ctx.fill();
  } else if(id==='lamp'){ // 秦淮花灯:荷花灯红瓣 + 金芯 + 灯穗
    ctx.fillStyle = locked ? '#5a5560' : '#e2483d';
    for(let i=0;i<6;i++){
      const a = -Math.PI/2 + i*TAU/6;
      ctx.beginPath(); ctx.ellipse(Math.cos(a)*r*0.4, Math.sin(a)*r*0.32, r*0.4, r*0.2, a, 0, TAU); ctx.fill();
      ctx.strokeStyle = out; ctx.lineWidth = lw*0.7; ctx.stroke();
    }
    disc(0, -r*0.05, r*0.28, locked ? '#5a5560' : '#f0b64c', locked ? '#46414c' : '#e2483d', lw*0.5); // 灯芯
    disc(0, -r*0.05, r*0.14, locked ? '#6e6974' : '#f7e0a0');               // 芯光
    ctx.strokeStyle = locked ? '#6e6974' : '#e2483d'; ctx.lineWidth = lw*0.7;
    ctx.beginPath(); ctx.moveTo(0, r*0.55); ctx.lineTo(0, r*0.9); ctx.stroke();  // 灯穗
    disc(0, r*0.62, r*0.09, locked ? '#5a5560' : '#f0b64c');
  } else if(id==='cake'){ // 梅花糕:五瓣花形糕 + 焦糖面 + 果仁
    ctx.fillStyle = locked ? '#6e6974' : '#e8c07a';
    for(let i=0;i<5;i++){
      const a = -Math.PI/2 + i*TAU/5;
      ctx.beginPath(); ctx.ellipse(Math.cos(a)*r*0.42, Math.sin(a)*r*0.42, r*0.42, r*0.3, a, 0, TAU); ctx.fill();
      ctx.strokeStyle = out; ctx.lineWidth = lw*0.7; ctx.stroke();
    }
    disc(0, 0, r*0.5, locked?'#5a5560':'#f0d89a', out, lw*0.6);
    disc(0, 0, r*0.34, locked?'#46414c':'#c9803a');                         // 焦糖面
    disc(-r*0.1, -r*0.08, r*0.07, locked?'#5a5560':'#a03a2a');              // 红枣
    disc(r*0.12, r*0.06, r*0.05, locked?'#5a5560':'#7ba05b');               // 青丝
    disc(r*0.02, -r*0.16, r*0.04, locked?'#6e6974':'#f5f0e6');              // 芝麻
  } else if(id==='root'){ // 糖粥藕:红糖粥 + 带孔糯米藕片
    ctx.fillStyle = locked ? '#5a5560' : '#8a3b34';
    ctx.beginPath(); ctx.ellipse(0, r*0.3, r*0.8, r*0.4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = locked ? '#5a5560' : '#7a3a2a';                          // 粥面纹
    ctx.beginPath(); ctx.ellipse(0, r*0.18, r*0.62, r*0.22, 0, 0, TAU); ctx.fill();
    for(const [px,py] of [[-0.25,-0.1],[0.28,-0.02]]){
      disc(px*r, py*r, r*0.34, locked?'#6e6974':'#e8d0a8', out, lw*0.8);    // 藕片
      ctx.fillStyle = locked ? '#46414c' : '#b89a68';
      for(let k=0;k<5;k++){ const a=k*TAU/5;
        ctx.beginPath(); ctx.arc(px*r+Math.cos(a)*r*0.16, py*r+Math.sin(a)*r*0.16, r*0.05, 0, TAU); ctx.fill(); }  // 藕孔
      ctx.beginPath(); ctx.arc(px*r, py*r, r*0.06, 0, TAU); ctx.fill();
    }
  } else if(id==='egg'){ // 活珠子:五香卤蛋 + 剥开的裂壳
    disc(0, r*0.1, r*0.62, locked?'#6e6974':'#d8b06a', out, lw);            // 卤蛋
    poly([[-r*0.5,-r*0.1],[-r*0.28,-r*0.34],[-r*0.1,-r*0.12],[r*0.08,-r*0.36],
          [r*0.24,-r*0.14],[r*0.44,-r*0.3],[r*0.5,-r*0.08],[0,r*0.06]], locked?'#5a5560':'#f5ecd8', out, lw*0.6); // 裂壳
    ctx.strokeStyle = locked ? '#46414c' : '#a87a3a'; ctx.lineWidth = lw*0.7; // 卤纹
    ctx.beginPath(); ctx.moveTo(-r*0.3, r*0.25); ctx.quadraticCurveTo(0, r*0.35, r*0.3, r*0.22); ctx.stroke();
    if(!locked) disc(-r*0.08, r*0.02, r*0.05, '#8a5a2a');                   // 卤斑
  } else if(id==='elephant'){ // 石象路:神道石象立姿 + 石座
    const stone = locked ? '#5a5560' : '#9aa0a8';
    ctx.fillStyle = stone;
    ctx.beginPath(); ctx.ellipse(0, r*0.02, r*0.55, r*0.42, 0, 0, TAU); ctx.fill();   // 身
    ctx.strokeStyle = locked ? '#46414c' : '#6a7078'; ctx.lineWidth = lw*0.8; ctx.stroke();
    disc(r*0.45, -r*0.3, r*0.26, stone, out, lw*0.7);                       // 头
    poly([[r*0.6,-r*0.16],[r*0.74,r*0.28],[r*0.56,r*0.28],[r*0.44,-r*0.08]], stone, out, lw*0.7); // 长鼻
    ctx.fillStyle = stone; ctx.fillRect(-r*0.38, r*0.28, r*0.16, r*0.42); ctx.fillRect(r*0.02, r*0.28, r*0.16, r*0.42); // 腿
    disc(r*0.52, -r*0.36, r*0.045, locked?'#46414c':'#5a6068');             // 眼
    ctx.fillStyle = locked ? '#6e6974' : '#b8bec6';                          // 石座
    ctx.fillRect(-r*0.6, r*0.66, r*1.2, r*0.1);
  } else if(id==='sakura'){ // 樱花:斜枝两朵 + 蕊
    ctx.strokeStyle = locked ? '#46414c' : '#6a4a3a'; ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r*0.6, r*0.6); ctx.quadraticCurveTo(-r*0.1, 0, r*0.3, -r*0.5); ctx.stroke(); // 枝
    petalFlower(-r*0.05, -r*0.05, r*0.4, locked?'#6e6974':'#f0a8bc', locked?'#5a5560':'#f0b64c');
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.6;                          // 瓣描边
    for(let i=0;i<5;i++){
      const a = -Math.PI/2 + i*TAU/5;
      ctx.beginPath(); ctx.ellipse(-r*0.05+Math.cos(a)*r*0.25, -r*0.05+Math.sin(a)*r*0.25, r*0.22, r*0.14, a, 0, TAU); ctx.stroke();
    }
    petalFlower(r*0.35, -r*0.5, r*0.3, locked?'#5a5560':'#f4bcc8', locked?'#46414c':'#f7e0e8');
  } else if(id==='book'){ // 先锋书店:一摞书 + 书签
    poly([[-r*0.7,r*0.15],[r*0.7,r*0.15],[r*0.6,r*0.45],[-r*0.6,r*0.45]], locked?'#5a5560':'#3a5a6b', out, lw);   // 下册
    poly([[-r*0.6,-r*0.15],[r*0.6,-r*0.15],[r*0.7,r*0.13],[-r*0.7,r*0.13]], locked?'#5a5560':'#c8342e', out, lw);  // 上册
    poly([[-r*0.5,-r*0.42],[r*0.4,-r*0.42],[r*0.6,-r*0.17],[-r*0.6,-r*0.17]], locked?'#6e6974':'#e8e0cc', out, lw); // 顶册
    ctx.fillStyle = locked ? '#46414c' : '#e8e0cc';                          // 书脊
    ctx.fillRect(-r*0.68, r*0.15, r*0.12, r*0.3);
    poly([[r*0.1,-r*0.42],[r*0.22,-r*0.42],[r*0.22,-r*0.2],[r*0.16,-r*0.26],[r*0.1,-r*0.2]], locked?'#5a5560':'#f0b64c', out, lw*0.5); // 书签
  } else { // 雨花石:椭圆石 + 层纹
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0,0,r*0.8,r*0.6,0.4,0,TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    ctx.strokeStyle = locked ? '#46414c' : '#8a3b34'; ctx.lineWidth = lw*0.8;   // 玛瑙纹
    ctx.beginPath(); ctx.ellipse(0,0,r*0.5,r*0.35,0.4,0,TAU); ctx.stroke();
    ctx.strokeStyle = locked ? '#5a5560' : '#5a8a3a';
    ctx.beginPath(); ctx.ellipse(0,0,r*0.22,r*0.14,0.4,0,TAU); ctx.stroke();
    ctx.fillStyle = locked ? '#6e6974' : '#f0c85a';                             // 高光
    ctx.beginPath(); ctx.ellipse(-r*0.22,-r*0.2,r*0.12,r*0.06,0.4,0,TAU); ctx.fill();
  }
  ctx.restore();
}
