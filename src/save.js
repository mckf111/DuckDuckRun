/* ================= 存档 ================= */
import { normalizeSave } from './rules.js';
export const SAVE_KEY = 'jinling_run_v1';
const rawSave = (()=>{
  try{
    return JSON.parse(localStorage.getItem(SAVE_KEY));
  }catch(e){ return {}; }
})();
export const save = normalizeSave(rawSave);
export let saveError = '';
export function replaceSave(next){
  const normalized=normalizeSave(next);
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(normalized));}
  catch(e){saveError='浏览器没有保存成功，请先导出备份';return false;}
  for(const key of Object.keys(save))delete save[key];
  Object.assign(save,normalized);saveError='';return true;
}

// 用户显式设置优先；未设置时跟随系统 prefers-reduced-motion。
export function prefersReducedMotion(){
  if(save.motion==='reduced') return true;
  if(save.motion==='full') return false;
  return typeof window!=='undefined' && typeof window.matchMedia==='function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
export function cycleMotionPreference(){
  save.motion = save.motion==='system' ? 'reduced' : save.motion==='reduced' ? 'full' : 'system';
  persist();
  return save.motion;
}

let dirty = false, timer = null, lastWrite = 0;

/* 普通拾取最多每秒落盘一次；失败只丢本次持久化，不打断当局。 */
export function queuePersist(){
  dirty = true;
  if(timer) return;
  const wait = Math.max(0, 1000 - (Date.now() - lastWrite));
  timer = setTimeout(() => { timer = null; flushSave(); }, wait);
}

/* 通关、死亡、购买和离开页面走强制冲刷。 */
export function flushSave(){
  if(timer){ clearTimeout(timer); timer = null; }
  dirty = false;
  try{
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    saveError='';
    lastWrite = Date.now();
    return true;
  }catch(e){ saveError='浏览器暂时不能保存进度，请在设置中导出备份'; return false; }
}

export function hasPendingSave(){ return dirty; }
export const persist = flushSave;
