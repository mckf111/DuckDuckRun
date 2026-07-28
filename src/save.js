/* ================= 存档 ================= */
export const SAVE_KEY = 'jinling_run_v1';
export const save = (()=>{ try{ return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; }catch(e){ return {}; } })();
save.best   = save.best   || 0;          // 无尽最高分(米)
save.stars  = save.stars  || [0,0,0,0,0];// 每关星级
save.album  = save.album  || {};         // 图鉴 {id:true}
save.muted  = !!save.muted;
export function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }
