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
  } else if(id==='bao'){ // 小笼包:蒸笼 + 白包子 + 褶
    ctx.fillStyle = locked ? '#5a5560' : '#b8934a';                              // 蒸笼
    ctx.beginPath(); ctx.ellipse(0, r*0.62, r*0.85, r*0.22, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.7; ctx.stroke();
    disc(0, r*0.3, r*0.62, locked?'#f5f0e6':'#f7f2ea', out, lw);                  // 包子皮
    ctx.strokeStyle = locked ? '#6e6974' : '#e0d8cc'; ctx.lineWidth = lw*0.7;     // 褶
    for(const a of [0, 1.2, 2.4]){
      ctx.beginPath(); ctx.arc(0, r*0.28, r*0.22, a, a+0.9); ctx.stroke();
    }
    disc(0, r*0.2, r*0.09, locked?'#6e6974':'#f0b64c');                          // 蟹黄顶
    ctx.strokeStyle = locked ? '#6e6974' : 'rgba(255,255,255,0.7)'; ctx.lineWidth = lw*0.7; // 热气
    for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*r*0.2, -r*0.1);
      ctx.quadraticCurveTo(i*r*0.2+r*0.06, -r*0.4, i*r*0.16, -r*0.62); ctx.stroke(); }
  } else if(id==='xiangdu'){ // 南京香肚:红棕圆肚 + 白纹 + 麻绳
    ctx.strokeStyle = locked ? '#46414c' : '#8a6a3a'; ctx.lineWidth = lw; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-r*0.1, -r*0.95); ctx.quadraticCurveTo(r*0.15, -r*0.6, 0, -r*0.3); ctx.stroke(); // 挂绳
    ctx.fillStyle = locked ? '#5a5560' : '#a84a38';                               // 肚身
    ctx.beginPath(); ctx.ellipse(0, r*0.15, r*0.62, r*0.78, 0.1, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = locked ? '#6e6974' : '#c86548';                               // 受光
    ctx.beginPath(); ctx.ellipse(-r*0.2, r*0.05, r*0.28, r*0.5, 0.1, 0, TAU); ctx.fill();
    ctx.strokeStyle = locked ? '#46414c' : '#f0e0c8'; ctx.lineWidth = lw*0.6;     // 捆扎白纹
    for(let i=0;i<3;i++){ ctx.beginPath();
      ctx.moveTo(-r*0.55, r*0.15+i*r*0.28); ctx.quadraticCurveTo(0, r*(0.05+i*0.28), r*0.55, r*0.15+i*r*0.28); ctx.stroke(); }
  } else if(id==='zhuangyuan'){ // 状元豆:小碗 + 卤豆
    ctx.fillStyle = locked ? '#5a5560' : '#8a3b34';                               // 碗
    ctx.beginPath(); ctx.arc(0, r*0.15, r*0.8, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = locked ? '#46414c' : '#6b2a24';                               // 卤汁
    ctx.beginPath(); ctx.ellipse(0, r*0.1, r*0.7, r*0.2, 0, 0, TAU); ctx.fill();
    for(const [px,py] of [[-0.3,0.04],[0,0.12],[0.32,0.05],[-0.12,-0.02]])
      disc(px*r, py*r, r*0.15, locked?'#6e6974':'#d8a83a', out, lw*0.4);          // 黄豆
  } else if(id==='luhao'){ // 芦蒿:一把青茎
    ctx.strokeStyle = locked ? '#5a5560' : '#5a8a3a'; ctx.lineWidth = lw; ctx.lineCap='round';
    for(let i=-2;i<=2;i++){
      ctx.beginPath(); ctx.moveTo(i*r*0.28, r*0.7);
      ctx.quadraticCurveTo(i*r*0.28+r*0.12, 0, i*r*0.2, -r*0.62); ctx.stroke();
    }
    ctx.strokeStyle = locked ? '#46414c' : '#7aa85a'; ctx.lineWidth = lw*0.8;     // 节
    for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*r*0.28+r*0.08, r*0.1);
      ctx.quadraticCurveTo(i*r*0.28+r*0.18, r*0.18, i*r*0.24, r*0.1); ctx.stroke(); }
    ctx.fillStyle = locked ? '#6e6974' : '#7aa85a';                               // 叶
    for(let i of [-1,1]){ ctx.beginPath(); ctx.ellipse(i*r*0.5, -r*0.35, r*0.16, r*0.08, i*0.6, 0, TAU); ctx.fill(); }
  } else if(id==='wufan'){ // 乌饭:黑饭团 + 竹叶
    ctx.fillStyle = locked ? '#46414c' : '#2a2a34';                               // 饭团
    ctx.beginPath(); ctx.arc(0, r*0.05, r*0.62, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = locked ? '#5a5560' : '#3d3d4a';                               // 高光
    ctx.beginPath(); ctx.arc(-r*0.2, -r*0.12, r*0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = locked ? '#5a5560' : '#4a7a3a';                               // 竹叶
    for(const m of [-1,1]){ ctx.beginPath();
      ctx.ellipse(m*r*0.62, r*0.15, r*0.4, r*0.13, m*0.8, 0, TAU); ctx.fill(); }
    disc(0, r*0.55, r*0.05, locked?'#6e6974':'#f0b64c');                         // 红枣点缀
  } else if(id==='ronghua'){ // 南京绒花:粉红牡丹
    ctx.fillStyle = locked ? '#5a5560' : '#f0a8bc';
    for(let k=0;k<2;k++){                                                         // 两层瓣
      for(let i=0;i<6;i++){
        const a = -Math.PI/2 + i*TAU/6 + k*0.3;
        ctx.beginPath(); ctx.ellipse(Math.cos(a)*r*(0.38+k*0.14), Math.sin(a)*r*(0.34+k*0.14), r*(0.4-k*0.08), r*0.24, a, 0, TAU); ctx.fill();
      }
    }
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.6;                                // 瓣描边
    for(let i=0;i<6;i++){
      const a = -Math.PI/2 + i*TAU/6;
      ctx.beginPath(); ctx.ellipse(Math.cos(a)*r*0.42, Math.sin(a)*r*0.36, r*0.4, r*0.24, a, 0, TAU); ctx.stroke();
    }
    disc(0, 0, r*0.22, locked?'#6e6974':'#f7d8e0');                               // 花心
    disc(0, 0, r*0.1, locked?'#5a5560':'#f0b64c');
  } else if(id==='zheshan'){ // 金陵折扇:展开扇面 + 竹骨
    ctx.save(); ctx.rotate(-0.5);
    ctx.fillStyle = locked ? '#6e6974' : '#f5e8c8';                               // 扇面
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, r*0.95, -0.55, 1.75); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.7; ctx.stroke();
    ctx.strokeStyle = locked ? '#46414c' : '#b8934a'; ctx.lineWidth = lw*0.6;     // 竹骨
    for(let i=0;i<6;i++){
      const a = -0.4 + i*0.38;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a)*r*0.92, Math.sin(a)*r*0.92); ctx.stroke();
    }
    ctx.strokeStyle = locked ? '#5a5560' : '#c9803a'; ctx.lineWidth = lw;         // 扇骨尾
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-r*0.15, r*0.4); ctx.stroke();
    ctx.restore();
  } else if(id==='jianzhi'){ // 南京剪纸:红团花
    ctx.fillStyle = locked ? '#5a5560' : '#c8342e';
    ctx.beginPath(); ctx.arc(0, 0, r*0.9, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = locked ? '#46414c' : '#a02a24';                               // 内圈
    ctx.beginPath(); ctx.arc(0, 0, r*0.62, 0, TAU); ctx.fill();
    ctx.strokeStyle = locked ? '#6e6974' : '#f0b64c'; ctx.lineWidth = lw*0.6;     // 花心纹
    for(let i=0;i<6;i++){
      const a = -Math.PI/2 + i*TAU/6;
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*r*0.34, Math.sin(a)*r*0.34);
      ctx.lineTo(Math.cos(a)*r*0.55, Math.sin(a)*r*0.55); ctx.stroke();
      disc(Math.cos(a)*r*0.55, Math.sin(a)*r*0.55, r*0.06, locked?'#5a5560':'#f0b64c');
    }
    disc(0, 0, r*0.14, locked?'#5a5560':'#f0b64c');
  } else if(id==='kejing'){ // 金陵刻经:经页 + 木版
    ctx.fillStyle = locked ? '#6e6974' : '#f5e8c8';                               // 经页
    ctx.fillRect(-r*0.75, -r*0.62, r*1.5, r*1.24);
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.7; ctx.strokeRect(-r*0.75, -r*0.62, r*1.5, r*1.24);
    ctx.fillStyle = locked ? '#46414c' : '#3a3a34';                               // 竖排字行
    for(let x=-0.5; x<=0.5; x+=0.24){
      for(let y=-0.42; y<=0.42; y+=0.16){
        ctx.fillRect(x*r-0.035*r, y*r-0.05*r, r*0.07, r*0.1);
      }
    }
    ctx.fillStyle = locked ? '#5a5560' : '#8a5a3a';                               // 木版框
    ctx.fillRect(-r*0.95, r*0.5, r*0.24, r*0.42);
    ctx.fillRect(r*0.71, r*0.5, r*0.24, r*0.42);
    ctx.strokeStyle = locked ? '#46414c' : '#6a4a2c'; ctx.lineWidth = lw*0.5;
    ctx.strokeRect(-r*0.95, r*0.5, r*0.24, r*0.42);
    ctx.strokeRect(r*0.71, r*0.5, r*0.24, r*0.42);
  } else if(id==='baiju'){ // 南京白局:小鼓 + 快板
    ctx.fillStyle = locked ? '#5a5560' : '#8a3b34';                               // 鼓身
    ctx.fillRect(-r*0.55, -r*0.2, r*1.1, r*0.72);
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.strokeRect(-r*0.55, -r*0.2, r*1.1, r*0.72);
    ctx.fillStyle = locked ? '#6e6974' : '#c8a06a';                               // 鼓面
    ctx.beginPath(); ctx.ellipse(0, -r*0.2, r*0.55, r*0.2, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = locked ? '#46414c' : '#b8934a'; ctx.lineWidth = lw*0.6;
    ctx.beginPath(); ctx.ellipse(0, -r*0.2, r*0.4, r*0.14, 0, Math.PI, 0); ctx.stroke();
    disc(-r*0.3, r*0.45, r*0.08, locked?'#5a5560':'#e8d8b0');                     // 鼓脚
    disc(r*0.3, r*0.45, r*0.08, locked?'#5a5560':'#e8d8b0');
    ctx.strokeStyle = locked ? '#46414c' : '#4a3a2c'; ctx.lineWidth = lw;         // 鼓槌
    ctx.beginPath(); ctx.moveTo(r*0.62, r*0.5); ctx.lineTo(r*0.95, -r*0.3); ctx.stroke();
    disc(r*0.95, -r*0.34, r*0.09, locked?'#6e6974':'#e8d8b0');
  } else if(id==='pibie'){ // 辟邪:南朝石兽
    const stone = locked ? '#5a5560' : '#8f959d';
    ctx.fillStyle = stone;
    ctx.beginPath(); ctx.ellipse(0, r*0.1, r*0.6, r*0.42, 0, 0, TAU); ctx.fill();  // 身
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.7; ctx.stroke();
    disc(r*0.52, -r*0.28, r*0.24, stone, out, lw*0.6);                            // 头
    poly([[r*0.68,-r*0.2],[r*0.9,r*0.12],[r*0.72,r*0.18],[r*0.55,-r*0.08]], stone, out, lw*0.6); // 吻
    poly([[r*0.42,-r*0.46],[r*0.62,-r*0.66],[r*0.8,-r*0.46],[r*0.7,-r*0.4],[r*0.55,-r*0.55],[r*0.42,-r*0.34]], stone, out, lw*0.5); // 翼
    ctx.fillRect(-r*0.4, r*0.36, r*0.14, r*0.34); ctx.fillRect(r*0.06, r*0.36, r*0.14, r*0.34);   // 腿
    disc(r*0.58, -r*0.32, r*0.045, locked?'#46414c':'#4a5058');                   // 眼
    poly([[-r*0.1,r*0.1],[-r*0.55,-r*0.2],[-r*0.1,-r*0.32]], '#8f959d');          // 尾
    ctx.fillStyle = locked ? '#46414c' : '#6a7078';                               // 尾卷
    ctx.beginPath(); ctx.arc(-r*0.55, -r*0.2, r*0.14, 0, TAU); ctx.fill();
  } else if(id==='wadang'){ // 人面瓦当:圆瓦当 + 人面
    ctx.fillStyle = locked ? '#6e6974' : '#b8a878';                               // 瓦当
    ctx.beginPath(); ctx.arc(0, 0, r*0.88, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = locked ? '#5a5560' : '#8f7f58';                               // 内圈
    ctx.beginPath(); ctx.arc(0, 0, r*0.66, 0, TAU); ctx.fill();
    ctx.fillStyle = locked ? '#6e6974' : '#d8c898';                               // 人脸
    ctx.beginPath(); ctx.arc(0, -r*0.05, r*0.44, 0, TAU); ctx.fill();
    for(const k of [-0.16, 0.16]) disc(k*r, -r*0.12, r*0.05, locked?'#46414c':'#4a4030'); // 眼
    ctx.strokeStyle = locked ? '#46414c' : '#4a4030'; ctx.lineWidth = lw*0.6;      // 笑纹
    ctx.beginPath(); ctx.moveTo(-r*0.2, r*0.08); ctx.quadraticCurveTo(0, r*0.22, r*0.2, r*0.08); ctx.stroke();
  } else if(id==='chengzhuan'){ // 铭文城砖
    ctx.fillStyle = locked ? '#5a5560' : '#8a8078';                               // 砖
    ctx.fillRect(-r*0.8, -r*0.6, r*1.6, r*1.2);
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.strokeRect(-r*0.8, -r*0.6, r*1.6, r*1.2);
    ctx.fillStyle = locked ? '#6e6974' : '#a89e94';                               // 受光
    ctx.fillRect(-r*0.8, -r*0.6, r*1.6, r*0.18);
    ctx.fillStyle = locked ? '#46414c' : '#5f554d';                               // 铭文竖排
    for(let y=-0.42; y<=0.42; y+=0.2){
      ctx.fillRect(-r*0.1, y*r-0.035*r, r*0.2, r*0.07);
    }
    ctx.strokeStyle = locked ? '#46414c' : '#5f554d'; ctx.lineWidth = lw*0.4;     // 砖缝
    ctx.beginPath(); ctx.moveTo(-r*0.8, 0); ctx.lineTo(r*0.8, 0); ctx.stroke();
  } else if(id==='nanyanjing'){ // 南京眼:双环桥
    ctx.strokeStyle = locked ? '#6e6974' : '#5a7a9a'; ctx.lineWidth = lw*0.8;     // 桥面
    ctx.beginPath(); ctx.moveTo(-r*0.95, r*0.55); ctx.lineTo(r*0.95, r*0.55); ctx.stroke();
    ctx.strokeStyle = locked ? '#5a5560' : '#4a6a8a'; ctx.lineWidth = lw;         // 支撑
    ctx.beginPath(); ctx.moveTo(-r*0.28, r*0.55); ctx.lineTo(-r*0.28, r*0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*0.28, r*0.55); ctx.lineTo(r*0.28, r*0.2); ctx.stroke();
    for(const m of [-1,1]){                                                        // 双环
      const cx = m*r*0.34, cy = -r*0.2;
      ctx.strokeStyle = locked ? '#6e6974' : '#d8a83a'; ctx.lineWidth = lw*0.8;
      ctx.beginPath(); ctx.arc(cx, cy, r*0.52, 0, TAU); ctx.stroke();
      ctx.strokeStyle = locked ? '#5a5560' : '#b8934a'; ctx.lineWidth = lw*0.4;
      ctx.beginPath(); ctx.arc(cx, cy, r*0.38, 0, TAU); ctx.stroke();
      for(let i=0;i<8;i++){                                                       // 辐条
        const a = i*TAU/8;
        ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r*0.38, cy+Math.sin(a)*r*0.38);
        ctx.lineTo(cx+Math.cos(a)*r*0.5, cy+Math.sin(a)*r*0.5); ctx.stroke();
      }
    }
    ctx.fillStyle = locked ? '#46414c' : '#3a5a7a';                               // 江水
    ctx.fillRect(-r*0.95, r*0.55, r*1.9, r*0.22);
    ctx.strokeStyle = locked ? '#5a5560' : '#7fb8f0'; ctx.lineWidth = lw*0.4;     // 波光
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-r*0.7+i*r*0.5, r*0.64);
      ctx.quadraticCurveTo(-r*0.5+i*r*0.5, r*0.7, -r*0.3+i*r*0.5, r*0.64); ctx.stroke(); }
  } else if(id==='zifeng'){ // 紫峰大厦
    ctx.fillStyle = locked ? '#5a5560' : '#3a5a7a';                               // 塔楼
    poly([[-r*0.32,-r*0.95],[r*0.32,-r*0.95],[r*0.38,r*0.8],[-r*0.38,r*0.8]], locked?'#5a5560':'#4a6a8a', out, lw);
    ctx.fillStyle = locked ? '#6e6974' : '#5a7a9a';                               // 受光
    poly([[-r*0.32,-r*0.95],[r*0.32,-r*0.95],[r*0.36,r*0.8],[-r*0.3,r*0.8]], locked?'#6e6974':'#5a7a9a');
    poly([[-r*0.42,-r*0.95],[r*0.42,-r*0.95],[r*0.3,-r*0.78],[-r*0.3,-r*0.78]], locked?'#5a5560':'#6a8aa8', out, lw*0.6); // 塔冠
    ctx.strokeStyle = locked ? '#46414c' : '#9fc0e8'; ctx.lineWidth = lw*0.3;     // 玻璃竖线
    for(let x=-0.2; x<=0.2; x+=0.13){
      ctx.beginPath(); ctx.moveTo(x*r, -r*0.9); ctx.lineTo(x*r, r*0.75); ctx.stroke();
    }
    ctx.fillStyle = locked ? '#5a5560' : '#d8a83a';                               // 顶层灯
    ctx.fillRect(-r*0.24, -r*0.82, r*0.48, r*0.06);
  } else if(id==='baoenta'){ // 大报恩寺塔:琉璃塔
    const g = ctx.createRadialGradient(0, -r*0.3, r*0.1, 0, -r*0.3, r*1.4);
    g.addColorStop(0, 'rgba(232,193,112,0.35)'); g.addColorStop(1, 'rgba(232,193,112,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -r*0.3, r*1.4, 0, TAU); ctx.fill();
    ctx.fillStyle = locked ? '#6e6974' : '#c9c2b0';                               // 塔身
    ctx.fillRect(-r*0.3, -r*0.78, r*0.6, r*1.5);
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.6; ctx.strokeRect(-r*0.3, -r*0.78, r*0.6, r*1.5);
    ctx.fillStyle = locked ? '#5a5560' : '#e8c170';                               // 金檐
    for(let k=0;k<5;k++){
      poly([[-r*0.5,-r*0.5+k*r*0.28],[-r*0.3,-r*0.68+k*r*0.28],[r*0.3,-r*0.68+k*r*0.28],[r*0.5,-r*0.5+k*r*0.28]], locked?'#5a5560':'#e8c170', out, lw*0.4);
    }
    ctx.strokeStyle = locked ? '#6e6974' : '#e8c170'; ctx.lineWidth = lw*0.6;     // 塔刹
    ctx.beginPath(); ctx.moveTo(0, -r*0.78); ctx.lineTo(0, -r*1.05); ctx.stroke();
    disc(0, -r*1.08, r*0.07, locked?'#6e6974':'#e8c170');
    ctx.fillStyle = locked ? '#5a5560' : '#e0d8c4';                               // 基座
    ctx.fillRect(-r*0.6, r*0.72, r*1.2, r*0.14);
  } else if(id==='baochuan'){ // 郑和宝船
    ctx.fillStyle = locked ? '#5a5560' : '#8a6a4a';                               // 船身
    poly([[-r*0.9,r*0.28],[r*0.9,r*0.28],[r*0.62,r*0.72],[-r*0.62,r*0.72]], locked?'#5a5560':'#8a6a4a', out, lw);
    ctx.fillStyle = locked ? '#6e6974' : '#c9a868';                               // 船楼
    ctx.fillRect(-r*0.2, -r*0.18, r*0.4, r*0.46);
    ctx.fillStyle = locked ? '#5a5560' : '#f0e0c8';                               // 帆
    ctx.beginPath(); ctx.moveTo(0, r*0.28); ctx.lineTo(-r*0.58, -r*0.18); ctx.lineTo(-r*0.58, r*0.2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, r*0.28); ctx.lineTo(r*0.7, -r*0.28); ctx.lineTo(r*0.7, r*0.16); ctx.closePath(); ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = locked ? '#46414c' : '#4a3a2c'; ctx.lineWidth = lw*0.7;     // 桅杆
    ctx.beginPath(); ctx.moveTo(0, r*0.28); ctx.lineTo(0, -r*0.42); ctx.stroke();
    poly([[0,-r*0.42],[-r*0.06,-r*0.55],[r*0.06,-r*0.55]], locked?'#5a5560':'#c8342e');  // 旗
    ctx.fillStyle = locked ? '#46414c' : '#3a5a7a';                               // 水
    ctx.fillRect(-r*0.95, r*0.72, r*1.9, r*0.14);
  } else if(id==='jiangtun'){ // 江豚:微笑精灵
    ctx.fillStyle = locked ? '#5a5560' : '#8a9a9a';                               // 豚身
    ctx.beginPath(); ctx.ellipse(0, r*0.05, r*0.75, r*0.45, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    poly([[r*0.72,r*0.02],[r*0.95,r*0.18],[r*0.7,r*0.16]], locked?'#5a5560':'#8a9a9a', out, lw*0.6); // 吻
    disc(r*0.45, -r*0.14, r*0.05, locked?'#46414c':'#2a3434');                    // 眼
    ctx.strokeStyle = locked ? '#46414c' : '#2a3434'; ctx.lineWidth = lw*0.6;      // 微笑
    ctx.beginPath(); ctx.moveTo(r*0.3, r*0.1); ctx.quadraticCurveTo(r*0.42, r*0.2, r*0.55, r*0.12); ctx.stroke();
    ctx.fillStyle = locked ? '#46414c' : '#5a7070';                               // 背鳍
    poly([[0,-r*0.4],[-r*0.08,-r*0.62],[r*0.12,-r*0.46]], locked?'#46414c':'#6a8080', out, lw*0.5);
    poly([[-r*0.6,r*0.12],[-r*0.88,r*0.02],[-r*0.6,r*0.28]], locked?'#5a5560':'#8a9a9a', out, lw*0.5); // 尾
    ctx.strokeStyle = locked ? '#5a5560' : '#7fb8f0'; ctx.lineWidth = lw*0.4;      // 水花
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-r*0.7+i*r*0.5, r*0.55);
      ctx.quadraticCurveTo(-r*0.5+i*r*0.5, r*0.62, -r*0.3+i*r*0.5, r*0.55); ctx.stroke(); }
  } else if(id==='hufengdie'){ // 中华虎凤蝶
    ctx.strokeStyle = locked ? '#46414c' : '#3a3a34'; ctx.lineWidth = lw*0.7;      // 身体
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.1, r*0.5, 0, 0, TAU); ctx.fill();
    for(const m of [-1,1]){                                                        // 翅
      ctx.fillStyle = locked ? '#5a5560' : '#e8a83a';
      ctx.beginPath(); ctx.ellipse(m*r*0.45, -r*0.22, r*0.5, r*0.32, m*0.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = out; ctx.lineWidth = lw*0.6; ctx.stroke();
      ctx.fillStyle = locked ? '#6e6974' : '#3a3a34';                              // 虎纹
      for(let i=0;i<3;i++){
        ctx.beginPath(); ctx.moveTo(m*r*0.12, -r*0.22-i*r*0.12);
        ctx.lineTo(m*r*0.6, -r*0.3-i*r*0.08); ctx.stroke();
      }
      disc(m*r*0.5, -r*0.28, r*0.06, locked?'#5a5560':'#f5e8c8');                 // 翅斑
    }
    ctx.strokeStyle = locked ? '#46414c' : '#e8a83a'; ctx.lineWidth = lw*0.6;      // 触角
    for(const m of [-1,1]){ ctx.beginPath(); ctx.moveTo(m*r*0.06, -r*0.42);
      ctx.quadraticCurveTo(m*r*0.2, -r*0.6, m*r*0.12, -r*0.68); ctx.stroke(); }
  } else if(id==='yinghuo'){ // 萤火虫:虫 + 光
    const g = ctx.createRadialGradient(0, -r*0.1, r*0.05, 0, -r*0.1, r*1.1);
    g.addColorStop(0, 'rgba(240,220,110,0.5)'); g.addColorStop(1, 'rgba(240,220,110,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -r*0.1, r*1.1, 0, TAU); ctx.fill();
    ctx.fillStyle = locked ? '#5a5560' : '#4a3a2c';                               // 虫身
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.22, r*0.4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.5; ctx.stroke();
    ctx.fillStyle = locked ? '#6e6974' : '#f0dc6a';                               // 发光腹
    ctx.beginPath(); ctx.ellipse(0, r*0.3, r*0.14, r*0.12, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = locked ? '#46414c' : '#6a5a3a'; ctx.lineWidth = lw*0.4;     // 翅
    for(const m of [-1,1]){ ctx.beginPath(); ctx.ellipse(m*r*0.28, -r*0.12, r*0.2, r*0.12, m*0.8, 0, TAU); ctx.stroke(); }
  } else if(id==='guihua'){ // 桂花:一枝金桂
    ctx.strokeStyle = locked ? '#46414c' : '#6a4a2c'; ctx.lineWidth = lw; ctx.lineCap='round'; // 枝
    ctx.beginPath(); ctx.moveTo(-r*0.55, r*0.7); ctx.quadraticCurveTo(-r*0.1, r*0.2, r*0.25, -r*0.55); ctx.stroke();
    ctx.fillStyle = locked ? '#5a5560' : '#4a7a3a';                               // 叶
    for(const [px,py,rot] of [[-0.45,0.35,0.5],[-0.15,0.5,-0.4],[0.1,-0.05,0.8],[0.35,-0.35,-0.5]]){
      ctx.save(); ctx.translate(px*r, py*r); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, r*0.22, r*0.09, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = locked ? '#6e6974' : '#f0b64c';                               // 花簇
    for(const [px,py] of [[-0.28,0.05],[-0.08,-0.18],[0.12,-0.3],[0.28,-0.52],[-0.2,-0.35],[0.0,-0.05]]){
      disc(px*r, py*r, r*0.09, locked?'#6e6974':'#f0b64c');
      disc(px*r, py*r, r*0.04, locked?'#5a5560':'#f7e0a0');
    }
  } else if(id==='baige'){ // 白鸽:中山陵音乐台的白鸽
    ctx.fillStyle = locked ? '#6e6974' : '#f5f2ea';                               // 身
    ctx.beginPath(); ctx.ellipse(0, r*0.15, r*0.55, r*0.4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw; ctx.stroke();
    disc(r*0.42, -r*0.2, r*0.22, locked?'#6e6974':'#f5f2ea', out, lw*0.7);        // 头
    poly([[r*0.6,-r*0.24],[r*0.78,-r*0.18],[r*0.6,-r*0.14]], locked?'#5a5560':'#e8a83a', out, lw*0.4); // 喙
    disc(r*0.5, -r*0.26, r*0.04, locked?'#46414c':'#3a3a34');                     // 眼
    ctx.fillStyle = locked ? '#5a5560' : '#e0dcd0';                               // 翅
    ctx.beginPath(); ctx.ellipse(-r*0.05, -r*0.1, r*0.5, r*0.24, -0.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = out; ctx.lineWidth = lw*0.5; ctx.stroke();
    poly([[-r*0.5,r*0.28],[-r*0.8,r*0.1],[-r*0.5,r*0.44]], locked?'#6e6974':'#f0ece2', out, lw*0.5); // 尾
    ctx.strokeStyle = locked ? '#46414c' : '#e8a83a'; ctx.lineWidth = lw*0.6;     // 爪
    ctx.beginPath(); ctx.moveTo(r*0.05, r*0.52); ctx.lineTo(r*0.05, r*0.66); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r*0.2, r*0.52); ctx.lineTo(-r*0.2, r*0.66); ctx.stroke();
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
