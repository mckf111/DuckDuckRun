/* ================= 基础 ================= */
export const cv = document.getElementById('cv');
export const ctx = cv.getContext('2d');
export const W = 960, H = 540, CX = W / 2, HOR = H * 0.40;   // 逻辑分辨率与地平线
export const CAMF = 300, CAMH = 2.3, ZP = 3, DRAWD = 72;      // 透视参数:焦距/相机高/绘制距离
export const LANEGAP = 1.25, ROAD_HALF = 2.0;

const QUALITY_LEVELS = [
  { name:'high', dpr:2 },
  { name:'medium', dpr:1.5 },
  { name:'low', dpr:1 },
];
let qualityIndex = 0;

export function getQuality(){ return QUALITY_LEVELS[qualityIndex]; }
export function downgradeQuality(){
  if(qualityIndex >= QUALITY_LEVELS.length-1) return false;
  qualityIndex++;
  fit();
  return true;
}
export function resetQuality(){ qualityIndex = 0; fit(); }

export function fit(){
  const cap = getQuality().dpr;
  const dpr = Math.min(cap, Math.max(1, window.devicePixelRatio || 1));
  const s = Math.min(innerWidth / W, innerHeight / H);
  const cssW = W * s, cssH = H * s;
  cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
  // 背板 = CSS 显示尺寸 × cappedDPR，逻辑坐标仍为 960×540。
  cv.width = Math.max(1, Math.round(cssW * dpr));
  cv.height = Math.max(1, Math.round(cssH * dpr));
  ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
  if(cv.dataset) cv.dataset.quality = getQuality().name;
}

// 可回放随机流：只服务玩法状态。视觉抖动和音频噪声使用独立原生随机数，不让帧率或音频解锁改变关卡序列。
let replaySeed = null;
let randomSource = Math.random;
function normalizeSeed(value){
  const numeric = Number(value);
  return Number.isSafeInteger(numeric) ? numeric >>> 0 : null;
}
function mulberry32(seed){
  let state = seed >>> 0;
  return () => {
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function setRandomSeed(seed){
  const normalized = normalizeSeed(seed);
  if(normalized === null) return null;
  replaySeed = normalized;
  randomSource = mulberry32(normalized);
  return replaySeed;
}
export function getRandomSeed(){ return replaySeed; }
export function restartRandomSequence(){
  if(replaySeed === null) return false;
  randomSource = mulberry32(replaySeed);
  return true;
}
export function clearRandomSeed(){
  replaySeed = null;
  randomSource = Math.random;
}

// 透视投影:世界(车道x, 高度y, 相对深度z) -> 屏幕
export function proj(x, y, z){
  const s = CAMF / z;
  return { x: CX + x * s, y: HOR + (CAMH - y) * s, s };
}
export const clamp = (v,a,b)=>v<a?a:v>b?b:v;
export const lerp = (a,b,t)=>a+(b-a)*t;
export const rnd = (a,b)=>a+randomSource()*(b-a);
export const irnd = (a,b)=>Math.floor(rnd(a,b+1));
export const visualRnd = (a,b)=>a+Math.random()*(b-a);
export const TAU = Math.PI*2;

/* ================= 剪纸绘制:小件 ================= */
export function poly(pts, fill, stroke, lw){
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for(let i=0;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if(fill){ ctx.fillStyle=fill; ctx.fill(); }
  if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw||1.5; ctx.stroke(); }
}
export function disc(x,y,r,fill,stroke,lw){
  ctx.beginPath(); ctx.arc(x,y,r,0,TAU);
  if(fill){ ctx.fillStyle=fill; ctx.fill(); }
  if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw||1.5; ctx.stroke(); }
}
/* 圆角矩形:现代 UI 按钮底;无 roundRect 的浏览器手写圆弧兜底 */
export function rrect(x,y,w,h,r,fill,stroke,lw){
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  if(ctx.roundRect){ ctx.roundRect(x,y,w,h,r); }
  else{
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }
  if(fill){ ctx.fillStyle=fill; ctx.fill(); }
  if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw||1; ctx.stroke(); }
}
/* 接地椭圆影:一切落地物件的接触影(消除"纸片漂浮感") */
export function shadow(x, y, rx, alpha){
  ctx.fillStyle = `rgba(0,0,0,${alpha===undefined?0.26:alpha})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, rx*0.22, 0, 0, TAU); ctx.fill();
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
