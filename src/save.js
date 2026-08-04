/* ================= 存档 ================= */
import { ITEMS, LEVELS } from './config.js';
export const SAVE_KEY = 'jinling_run_v1';
// F1 致命白屏兜底:存档被写成标量(123/"abc"/true)时 JSON.parse 返回原始值,
// 严格模式顶层给原始值设属性会抛 TypeError 导致整个游戏白屏。必须挡住非对象。
export const save = (()=>{
  try{
    const p = JSON.parse(localStorage.getItem(SAVE_KEY));
    return (p && typeof p==='object' && !Array.isArray(p)) ? p : {};
  }catch(e){ return {}; }
})();
// 类型容错:旧版本或手工改坏的数据一律回退默认值
save.best    = (typeof save.best==='number' && isFinite(save.best) && save.best>0) ? Math.floor(save.best) : 0; // 无尽最高分(米),防 Infinity(L8)
// 关卡数 6→10 迁移:旧 6 关格式中 index5 是隐藏关大桥,新格式大桥在 index9;
// 旧玩家的桥进度搬过去,index5 新关(颐和路)保持未玩
const isOld6 = Array.isArray(save.stars) && save.stars.length===6 && Array.isArray(save.cleared) && save.cleared.length===6;
save.stars   = Array.isArray(save.stars) ? LEVELS.map((_,i)=>Math.min(3, Math.max(0, save.stars[i]|0))) : LEVELS.map(()=>0); // 每关星级
save.cleared = Array.isArray(save.cleared) ? LEVELS.map((_,i)=>!!save.cleared[i]) : LEVELS.map(()=>false); // 每关通关标记(解锁用)
if(isOld6){ save.stars[9] = save.stars[5]; save.stars[5] = 0; save.cleared[9] = save.cleared[5]; save.cleared[5] = false; }
// M3:album 用 ITEMS id 白名单重建,脏数据塞的假键不计入图鉴进度
{ const raw = (save.album && typeof save.album==='object') ? save.album : {};
  save.album = {};
  for(const k of Object.keys(raw)) if(raw[k] && ITEMS.some(i=>i.id===k)) save.album[k] = true; }
save.tut     = !!save.tut;                 // 首局教学已看过
save.muted   = !!save.muted;
save.distTotal = (typeof save.distTotal==='number' && isFinite(save.distTotal) && save.distTotal>0) ? Math.floor(save.distTotal) : 0; // 累计里程(米,隐藏件紫峰大厦判定)
save.albumNew = !!save.albumNew;           // 隐藏件新获得红点(进图鉴页后清除)
// E 阶段:铜钱与鸭铺升级(三条线 0~3 级)
save.coins = (typeof save.coins==='number' && isFinite(save.coins) && save.coins>=0) ? Math.floor(save.coins) : 0;
{ const u = (save.ups && typeof save.ups==='object') ? save.ups : {};
  save.ups = {
    magnet: Math.min(3, Math.max(0, u.magnet|0)),
    gui:    Math.min(3, Math.max(0, u.gui|0)),
    spawn:  Math.min(3, Math.max(0, u.spawn|0)),
  }; }
export function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }
