/* ================= 存档 ================= */
import { ITEMS } from './config.js';
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
save.stars   = Array.isArray(save.stars) ? [0,1,2,3,4,5].map(i=>Math.min(3, Math.max(0, save.stars[i]|0))) : [0,0,0,0,0,0]; // 每关星级
save.cleared = Array.isArray(save.cleared) ? [0,1,2,3,4,5].map(i=>!!save.cleared[i]) : [false,false,false,false,false,false]; // 每关通关标记(解锁用)
// M3:album 用 ITEMS id 白名单重建,脏数据塞的假键不计入图鉴进度
{ const raw = (save.album && typeof save.album==='object') ? save.album : {};
  save.album = {};
  for(const k of Object.keys(raw)) if(raw[k] && ITEMS.some(i=>i.id===k)) save.album[k] = true; }
save.tut     = !!save.tut;                 // 首局教学已看过
save.muted   = !!save.muted;
export function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }
