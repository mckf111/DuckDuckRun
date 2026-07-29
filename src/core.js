/* ================= 基础 ================= */
export const cv = document.getElementById('cv');
export const ctx = cv.getContext('2d');
export const W = 960, H = 540, CX = W / 2, HOR = H * 0.40;   // 逻辑分辨率与地平线
export const CAMF = 300, CAMH = 2.3, ZP = 3, DRAWD = 72;      // 透视参数:焦距/相机高/玩家z/绘制距离
export const LANEGAP = 1.25, ROAD_HALF = 2.0;

export function fit(){
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const s = Math.min(innerWidth / W, innerHeight / H);
  cv.style.width = (W * s) + 'px'; cv.style.height = (H * s) + 'px';
  // DPR 适配:高分屏/手机上按物理像素渲染,逻辑坐标不变
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// 透视投影:世界(车道x, 高度y, 相对深度z) -> 屏幕
export function proj(x, y, z){
  const s = CAMF / z;
  return { x: CX + x * s, y: HOR + (CAMH - y) * s, s };
}
export const clamp = (v,a,b)=>v<a?a:v>b?b:v;
export const lerp = (a,b,t)=>a+(b-a)*t;
export const rnd = (a,b)=>a+Math.random()*(b-a);
export const irnd = (a,b)=>Math.floor(rnd(a,b+1));
export const TAU = Math.PI*2;

/* ================= 剪纸绘制:小件 ================= */
export function poly(pts, fill, stroke, lw){
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if(fill){ ctx.fillStyle=fill; ctx.fill(); }
  if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw||1.5; ctx.stroke(); }
}
export function disc(x,y,r,fill,stroke,lw){
  ctx.beginPath(); ctx.arc(x,y,r,0,TAU);
  if(fill){ ctx.fillStyle=fill; ctx.fill(); }
  if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw||1.5; ctx.stroke(); }
}
export function petalFlower(x,y,r,fill,center){
  for(let i=0;i<5;i++){
    const a = -Math.PI/2 + i*TAU/5;
    ctx.beginPath();
    ctx.ellipse(x+Math.cos(a)*r*0.62, y+Math.sin(a)*r*0.62, r*0.55, r*0.34, a, 0, TAU);
    ctx.fillStyle=fill; ctx.fill();
  }
  disc(x,y,r*0.3,center||'#f0b64c');
}
