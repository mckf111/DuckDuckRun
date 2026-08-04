import { ITEMS, LEVELS } from './config.js';

export const SAVE_SCHEMA = 2;
export const BRIDGE_INDEX = LEVELS.length - 1;
export const NORMAL_ITEM_IDS = ITEMS.filter(item => !item.secret).map(item => item.id);
const ITEM_IDS = new Set(ITEMS.map(item => item.id));

export const OBSTACLE_RULES = {
  low:  { instruction:{ keyboard:'矮障碍要跳过去（↑）', touch:'矮障碍要上滑跳过去' } },
  high: { instruction:{ keyboard:'高横梁要贴地滑铲（↓）', touch:'高横梁要下滑钻过去' } },
  full: { instruction:{ keyboard:'整堵墙只能换道（← →）', touch:'整堵墙只能左右滑换道' } },
};

const finiteInt = (value, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
const clampInt = (value, min, max) => Math.min(max, Math.max(min, finiteInt(value)));

/* 纯规则：障碍语法只在这里定义，游戏和测试共用。 */
export function canPassObstacle(player, obstacle){
  const type = typeof obstacle === 'string' ? obstacle : obstacle && obstacle.type;
  const y = player && typeof player.y === 'number' && Number.isFinite(player.y) ? player.y : 0;
  if(type === 'low') return y > 0.72;
  if(type === 'high') return !!(player && player.sliding > 0 && y < 0.3);
  if(type === 'full') return false;
  return true;
}

export function getObstacleInstruction(type, touch=false){
  const rule=OBSTACLE_RULES[type];
  return rule ? rule.instruction[touch?'touch':'keyboard'] : '';
}

export function calculateRunStars(markCount, thresholds){
  const marks = Math.max(0, finiteInt(markCount));
  const needs = Array.isArray(thresholds) ? thresholds : [];
  let stars = 0;
  for(let i = 0; i < Math.min(3, needs.length); i++){
    const need = Math.max(0, finiteInt(needs[i], Infinity));
    if(marks >= need) stars = i + 1;
  }
  return stars;
}

export function sanitizeAlbum(raw){
  const album = {};
  if(!raw || typeof raw !== 'object' || Array.isArray(raw)) return album;
  for(const id of Object.keys(raw)) if(raw[id] && ITEM_IDS.has(id)) album[id] = true;
  return album;
}

/* 同一存档 key 内的幂等迁移：脏值、6 关旧档和旧教学字段统一在这里收口。 */
export function normalizeSave(raw){
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const oldSix = Array.isArray(source.stars) && source.stars.length === 6
    && Array.isArray(source.cleared) && source.cleared.length === 6;
  const stars = LEVELS.map((_, i) => clampInt(source.stars && source.stars[i], 0, 3));
  const cleared = LEVELS.map((_, i) => !!(source.cleared && source.cleared[i]));
  if(oldSix){
    stars[BRIDGE_INDEX] = clampInt(source.stars[5], 0, 3);
    cleared[BRIDGE_INDEX] = !!source.cleared[5];
    stars[5] = 0;
    cleared[5] = false;
  }
  const tutorialCompleted = !!(source.tutorialCompleted ?? source.tut ?? source.tutorialDone);
  const upgrades = source.ups && typeof source.ups === 'object' && !Array.isArray(source.ups)
    ? source.ups : {};
  return {
    ...source,
    schema: SAVE_SCHEMA,
    best: Math.max(0, finiteInt(source.best)),
    stars,
    cleared,
    album: sanitizeAlbum(source.album),
    tutorialCompleted,
    tut: tutorialCompleted,
    muted: !!source.muted,
    distTotal: Math.max(0, finiteInt(source.distTotal)),
    albumNew: !!source.albumNew,
    coins: Math.max(0, finiteInt(source.coins)),
    ups: {
      magnet: clampInt(upgrades.magnet, 0, 3),
      gui: clampInt(upgrades.gui, 0, 3),
      spawn: clampInt(upgrades.spawn, 0, 3),
    },
  };
}

export function getBridgeUnlockStatus(candidate){
  const source = candidate && typeof candidate === 'object' ? candidate : {};
  const cleared = Array.isArray(source.cleared) ? source.cleared : [];
  const stars = Array.isArray(source.stars) ? source.stars : [];
  const bridgeCleared = !!cleared[BRIDGE_INDEX];
  const firstNineCleared = LEVELS.slice(0, BRIDGE_INDEX).every((_, i) => !!cleared[i]);
  const starCount = LEVELS.slice(0, BRIDGE_INDEX)
    .reduce((sum, _, i) => sum + clampInt(stars[i], 0, 3), 0);
  const album = sanitizeAlbum(source.album);
  const ordinaryCount = NORMAL_ITEM_IDS.reduce((sum, id) => sum + (album[id] ? 1 : 0), 0);
  return {
    unlocked: bridgeCleared || (firstNineCleared && starCount >= 15 && ordinaryCount >= 28),
    bridgeCleared,
    firstNineCleared,
    starCount,
    ordinaryCount,
    ordinaryTotal: NORMAL_ITEM_IDS.length,
  };
}
