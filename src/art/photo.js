import { ctx, W, H, HOR, clamp } from '../core.js';

/* ================= 实景照片:加载 / 远景 / 拍立得风物卡 ================= */
// 命名约定:背景 assets/img/bg_<landmarkId>.jpg;风物 assets/img/it_<itemId>.jpg
// landmarkId 与 config.js 的 LEVELS.landmark / LM_CYCLE 一致;itemId 与 ITEMS.id 一致。
const BG_IDS = ['zhonghua', 'jiming', 'sunyard', 'zhaobi', 'observatory', 'bridge'];
const IT_IDS = ['duck', 'fans', 'tea', 'taro', 'plum', 'stone'];
const IMGS = {};

/* 预加载全部照片;onProgress(0~1)。缺图不阻塞:hasPhoto 返回 false,走代码插画回退 */
export function loadAll(onProgress){
  const jobs = [];
  for(const id of BG_IDS) jobs.push(['bg_' + id, 'assets/img/bg_' + id + '.jpg']);
  for(const id of IT_IDS) jobs.push(['it_' + id, 'assets/img/it_' + id + '.jpg']);
  let done = 0;
  return Promise.all(jobs.map(([key, url]) => new Promise(res => {
    const img = new Image();
    const fin = () => { done++; onProgress && onProgress(done / jobs.length); res(); };
    img.onload = fin; img.onerror = fin;
    img.src = url;
    IMGS[key] = img;
  })));
}

export function hasPhoto(key){
  const im = IMGS[key];
  return !!(im && im.complete && im.naturalWidth > 0);
}

function hexRgb(hex){
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* 远景照片:铺在地平线以上,极慢呼吸漂移(远景相对位移小,也避免平铺接缝)。
   mix 用于无尽模式跨 600m 边界时两张照片叠化。照片底部用关卡地面色渐变融入插画层。 */
export function drawBackdrop(id, lv, dist, mix){
  const key = 'bg_' + id;
  if(mix <= 0 || !hasPhoto(key)) return false;
  const img = IMGS[key];
  const dh = H * 0.63;                                   // 盖过天地分界(0.62H),两侧不留天空色条
  const dw = dh * img.naturalWidth / img.naturalHeight;
  const drift = Math.sin(dist * 0.008) * 14;
  const dx = (W - dw) / 2 + drift;
  ctx.globalAlpha = clamp(mix, 0, 1);
  ctx.drawImage(img, dx, 0, dw, dh);
  // 底部渐变:照片 → 关卡地面色(照片层与手绘层的过渡带)
  const [r, g, b] = hexRgb(lv.ground);
  const grad = ctx.createLinearGradient(0, dh - 92, 0, dh);
  grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  grad.addColorStop(0.8, `rgba(${r},${g},${b},0.85)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},1)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, dh - 92, W, 92);
  ctx.globalAlpha = 1;
  return true;
}

/* 拍立得风物卡:方形照片 + 米色相纸边(下宽上窄)+ 投影;locked/缺图时显示相纸背面 */
export function drawItemPhoto(id, x, y, r, rot, locked){
  const key = 'it_' + id;
  const s = r * 2, padX = r * 0.26, padT = r * 0.26, padB = r * 0.66;
  const cw = s + padX * 2, ch = s + padT + padB;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot || 0);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(-cw / 2 + r * 0.08, -ch / 2 + r * 0.12, cw, ch);   // 投影
  ctx.fillStyle = locked ? '#d8d0be' : '#f6f0e2';                  // 相纸
  ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
  if(!locked && hasPhoto(key)){
    ctx.drawImage(IMGS[key], -s / 2, -ch / 2 + padT, s, s);
  } else {
    ctx.fillStyle = locked ? '#b8ad94' : '#e3d9c4';                // 相纸背面/缺图占位
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.fillStyle = locked ? '#8d8268' : '#b3a684';
    ctx.font = `bold ${Math.round(s * 0.5)}px "Microsoft YaHei","PingFang SC",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(locked ? '?' : '…', 0, 1);
  }
  ctx.restore();
}
