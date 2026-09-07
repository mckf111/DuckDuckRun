import { ctx, W, H, HOR, clamp } from '../core.js';
import { ITEMS } from '../config.js';
import { drawItemIcon } from './items.js';
import { assetUrl } from '../asset-url.js';
import { ALBUM_PHOTOS } from '../album-photos.js';

/* ================= 实景照片:加载 / 远景 / 拍立得风物卡 ================= */
// 命名约定:背景 assets/img/bg_<landmarkId>.jpg;风物 assets/img/it_<itemId>.jpg
// landmarkId 与 config.js 的 LEVELS.landmark / LM_CYCLE 一致;itemId 与 ITEMS.id 一致。
const IMGS = {};
const LOADS = {};
const READY_AT = {};
const PHOTO_ITEMS = new Set(ITEMS.filter(item => item.photo).map(item => item.id));

function now(){ return typeof performance !== 'undefined' ? performance.now() : Date.now(); }

function tryImage(url, timeoutMs){
  return new Promise(resolve => {
    const img = new Image();
    let settled = false;
    const finish = value => {
      if(settled) return;
      settled = true;
      clearTimeout(timer);
      img.onload = img.onerror = null;
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    img.onload = async () => {
      try{ if(img.decode) await img.decode(); }catch(e){ finish(null); return; }
      finish(img.naturalWidth > 0 ? img : null);
    };
    img.onerror = () => finish(null);
    img.src = url;
  });
}

function loadWithFallback(key, urls){
  if(hasPhoto(key)) return Promise.resolve(IMGS[key]);
  if(LOADS[key]) return LOADS[key];
  LOADS[key] = (async () => {
    for(const url of urls){
      const img = await tryImage(url, 3500);
      if(img){ IMGS[key] = img; READY_AT[key] = now(); return img; }
    }
    return null;
  })();
  return LOADS[key];
}

export function loadBackground(id){
  const featured = {
    menu:'assets/game/menu-background.webp',
    zhonghua:'assets/game/bg-zhonghua.webp',
  }[id];
  return loadWithFallback('bg_' + id, [
    ...(featured ? [featured] : []),
    'assets/img/bg_' + id + '.webp',
    'assets/img/bg_' + id + '.jpg',
  ].map(assetUrl));
}
export function loadMenuBackground(){ return loadBackground('menu'); }
export function prefetchBackground(id, delayMs=120){
  let cancelled = false;
  let idleHandle = null;
  let timerHandle = null;
  const run = () => {
    if(cancelled) return;
    cancelled = true;
    if(timerHandle) clearTimeout(timerHandle);
    if(idleHandle!==null && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleHandle);
    loadBackground(id);
  };
  // 有空闲回调时尽早执行；无头/节流环境若迟迟不给 idle，定时兜底仍履行预取契约。
  if(typeof requestIdleCallback === 'function') idleHandle = requestIdleCallback(run, { timeout:delayMs });
  timerHandle = setTimeout(run, delayMs);
  return () => {
    cancelled = true;
    if(timerHandle) clearTimeout(timerHandle);
    if(idleHandle!==null && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleHandle);
  };
}

/* 图鉴风物照片懒加载:首次进图鉴页时调用,逐张异步;已加载/加载中不重复。
   未加载完或缺图不阻塞 UI——放大层只在 hasPhoto 时显示「实景对照」。 */
export function loadItemPhoto(id){
  const key = 'it_' + id;
  if(!PHOTO_ITEMS.has(id)) return Promise.resolve(null);
  return loadWithFallback(key, [assetUrl(ALBUM_PHOTOS[id].file)]);
}
export function loadItemPhotos(ids){
  return Promise.all(ids.map(loadItemPhoto));
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
  // 底部过渡带:照片 → 地面色 → 路面色,150px 三段渐变消除"硬地平线"
  const [r, g, b] = hexRgb(lv.ground);
  const [r2, g2, b2] = hexRgb(lv.road);
  const band = 150;
  const grad = ctx.createLinearGradient(0, dh - band, 0, dh);
  grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},0.5)`);
  grad.addColorStop(0.85, `rgba(${r2},${g2},${b2},0.92)`);
  grad.addColorStop(1, `rgba(${r2},${g2},${b2},1)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, dh - band, W, band);
  // 绘本滤镜:压掉照片锐利感,让远景给鸭子让路。
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(228,198,150,0.38)';
  ctx.fillRect(0, 0, W, dh);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(255,244,220,0.16)';
  ctx.fillRect(0, 0, W, dh);
  ctx.globalAlpha = 1;
  return true;
}

/* 菜单/选关/图鉴底图:南京眼蓝调时刻,cover 铺满;底部压入黛蓝,界面元素坐得稳。
   缺图返回 false,render 回退旧场景。 */
export function drawMenuBg(){
  // 照片尚未就绪时先给可用的代码背景，菜单从第一帧即可操作。
  const fallback = ctx.createLinearGradient(0, 0, 0, H);
  fallback.addColorStop(0, '#16263d'); fallback.addColorStop(0.62, '#284866'); fallback.addColorStop(1, '#121a2b');
  ctx.fillStyle = fallback; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(127,184,240,0.26)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(W*0.08,H*0.63); ctx.quadraticCurveTo(W*0.5,H*0.44,W*0.92,H*0.63); ctx.stroke();
  ctx.fillStyle = 'rgba(232,193,112,0.72)'; ctx.beginPath(); ctx.arc(W*0.78,H*0.17,30,0,Math.PI*2); ctx.fill();
  const key = 'bg_menu';
  if(!hasPhoto(key)) return true;
  const img = IMGS[key];
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  ctx.save();
  ctx.globalAlpha = clamp((now() - READY_AT[key]) / 420, 0, 1);
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const g = ctx.createLinearGradient(0, H * 0.5, 0, H);
  g.addColorStop(0, 'rgba(27,42,68,0)');
  g.addColorStop(1, 'rgba(27,42,68,0.85)');
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.5, W, H * 0.5);
  const g2 = ctx.createLinearGradient(0, 0, 0, H * 0.3);
  g2.addColorStop(0, 'rgba(13,10,20,0.38)');
  g2.addColorStop(1, 'rgba(13,10,20,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H * 0.3);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(232,208,168,0.28)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
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
  } else if(!locked){
    ctx.fillStyle = '#e9e2d0';                                     // 缺图(雨花茶):相纸内手绘插画
    ctx.fillRect(-s / 2, -ch / 2 + padT, s, s);
    drawItemIcon(id, 0, -ch / 2 + padT + s / 2, s * 0.34, false);
  } else {
    ctx.fillStyle = '#b8ad94';                                     // 相纸背面
    ctx.fillRect(-s / 2, -ch / 2 + padT, s, s);
    ctx.fillStyle = '#8d8268';
    ctx.font = `bold ${Math.round(s * 0.5)}px "Microsoft YaHei","PingFang SC",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, -ch / 2 + padT + s / 2 + 1);
  }
  ctx.restore();
}
