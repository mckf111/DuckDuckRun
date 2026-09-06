import { ITEMS, LEVELS } from './config.js';

export const SAVE_SCHEMA = 5;
export const BRIDGE_INDEX = LEVELS.length - 1;
export const NORMAL_ITEM_IDS = ITEMS.filter(item => !item.secret).map(item => item.id);
const ITEM_IDS = new Set(ITEMS.map(item => item.id));
const GUARANTEED_SECRET_IDS = new Set(ITEMS.filter(item => item.secret && item.id!=='jiangtun').map(item => item.id));

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

export function getCollectionWeight(item,candidateSave,levelIndex){
  if(!item||item.secret)return 0;
  const source=candidateSave&&typeof candidateSave==='object'?candidateSave:{};
  const owned=!!(source.album&&source.album[item.id]);
  const dryRuns=clampInt(source.albumDryRuns,0,99);
  const base=owned?1:(dryRuns>=3?12:6);
  return base*(item.home===levelIndex?3:1);
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
  const secretPending = Array.isArray(source.secretPending)
    ? [...new Set(source.secretPending.filter(id => GUARANTEED_SECRET_IDS.has(id)))] : [];
  return {
    schema: SAVE_SCHEMA,
    best: Math.max(0, finiteInt(source.best)),
    stars,
    cleared,
    album: sanitizeAlbum(source.album),
    tutorialCompleted,
    tut: tutorialCompleted,
    muted: !!source.muted,
    difficulty: source.difficulty==='easy'?'easy':'standard',
    selectedSkin: source.selectedSkin==='gold'?'gold':'white',
    trackedItem: NORMAL_ITEM_IDS.includes(source.trackedItem)?source.trackedItem:null,
    journeyStarted: !!source.journeyStarted || cleared.some(Boolean),
    lastLevel: clampInt(source.lastLevel,0,LEVELS.length-1),
    skillTutorial: !!source.skillTutorial,
    volumes: Object.fromEntries(['music','effects','voice'].map(key=>[key,
      typeof source.volumes?.[key]==='number'&&Number.isFinite(source.volumes[key])?Math.max(0,Math.min(1,source.volumes[key])):key==='music'?0.65:0.8])),
    medals: Object.fromEntries(['standard','easy'].map(mode=>[mode,LEVELS.map((_,i)=>{
      const m=source.medals?.[mode]?.[i];
      return {clear:!!m?.clear,collect:!!m?.collect,skill:!!m?.skill};
    })])),
    motion: ['system','reduced','full'].includes(source.motion) ? source.motion : 'system',
    distTotal: Math.max(0, finiteInt(source.distTotal)),
    albumNew: !!source.albumNew,
    coins: Math.max(0, finiteInt(source.coins)),
    albumDryRuns: clampInt(source.albumDryRuns, 0, 99),
    secretPending,
    ups: {
      magnet: clampInt(upgrades.magnet, 0, 3),
      gui: clampInt(upgrades.gui, 0, 3),
      spawn: clampInt(upgrades.spawn, 0, 3),
    },
  };
}

export function calculateMedals(marks,target,skillIds){
  const medals={clear:true,collect:marks>=target,skill:new Set(skillIds).size>=2};
  return {medals,stars:Object.values(medals).filter(Boolean).length};
}
export function parseSaveImport(text){
  if(typeof text!=='string'||text.length>65536)throw new Error('存档文件过大');
  const parsed=JSON.parse(text);
  const raw=parsed?.format==='jinling-save'?parsed.data:parsed;
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||!Array.isArray(raw.stars)||!Array.isArray(raw.cleared))throw new Error('这不是金陵跑酷存档');
  if(raw.schema>SAVE_SCHEMA)throw new Error('存档来自更新版本，请先更新游戏');
  return normalizeSave(raw);
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
