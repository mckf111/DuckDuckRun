import { assetUrl } from '../asset-url.js';

/* 预渲染游戏素材：异步加载失败时，各绘制模块继续走原 Canvas 兜底。 */
const SOURCES = {
  duck: assetUrl('assets/game/duck-atlas.webp'),
  pickup: assetUrl('assets/game/pickup-ring.webp'),
  crenelObstacles: assetUrl('assets/game/obstacles-crenel.webp'),
  sliceToken: assetUrl('assets/game/nanjing-slice/salted-duck-token.webp'),
  sliceMarker: assetUrl('assets/game/nanjing-slice/qinhuai-lantern-marker.webp'),
};

const CACHE = new Map();

export function getSprite(name){
  const cached = CACHE.get(name);
  if(cached) return cached.ready ? cached.image : null;
  if(typeof Image === 'undefined' || !SOURCES[name]) return null;

  const image = new Image();
  const entry = { image, ready:false, failed:false };
  CACHE.set(name, entry);
  image.decoding = 'async';
  image.onload = () => { entry.ready = image.naturalWidth > 0; };
  image.onerror = () => { entry.failed = true; };
  image.src = SOURCES[name];
  return null;
}

export function preloadGameSprites(){
  Object.keys(SOURCES).forEach(getSprite);
}

export function drawSpriteFrame(context, image, cols, rows, frame, dx, dy, dw, dh){
  if(!image || !image.naturalWidth || !image.naturalHeight) return false;
  const count = cols * rows;
  const index = ((frame % count) + count) % count;
  const col = index % cols, row = Math.floor(index / cols);
  const sx0 = Math.round(col * image.naturalWidth / cols);
  const sx1 = Math.round((col + 1) * image.naturalWidth / cols);
  const sy0 = Math.round(row * image.naturalHeight / rows);
  const sy1 = Math.round((row + 1) * image.naturalHeight / rows);
  context.drawImage(image, sx0, sy0, sx1-sx0, sy1-sy0, dx, dy, dw, dh);
  return true;
}
