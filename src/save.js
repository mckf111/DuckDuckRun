/* ================= 存档 ================= */
export const SAVE_KEY = 'jinling_run_v1';
export const save = (()=>{ try{ return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; }catch(e){ return {}; } })();
// 类型容错:旧版本或手工改坏的数据一律回退默认值
save.best    = (typeof save.best==='number' && save.best>0) ? Math.floor(save.best) : 0; // 无尽最高分(米)
save.stars   = Array.isArray(save.stars) ? [0,1,2,3,4,5].map(i=>Math.min(3, Math.max(0, save.stars[i]|0))) : [0,0,0,0,0,0]; // 每关星级
save.cleared = Array.isArray(save.cleared) ? [0,1,2,3,4,5].map(i=>!!save.cleared[i]) : [false,false,false,false,false,false]; // 每关通关标记(解锁用)
save.album   = (save.album && typeof save.album==='object') ? save.album : {};         // 图鉴 {id:true}
save.tut     = !!save.tut;                 // 首局教学已看过
save.muted   = !!save.muted;
export function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }
