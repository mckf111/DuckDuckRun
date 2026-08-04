/* ================= 存档 ================= */
import { normalizeSave } from './rules.js';
export const SAVE_KEY = 'jinling_run_v1';
const rawSave = (()=>{
  try{
    return JSON.parse(localStorage.getItem(SAVE_KEY));
  }catch(e){ return {}; }
})();
export const save = normalizeSave(rawSave);

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
    lastWrite = Date.now();
    return true;
  }catch(e){ return false; }
}

export function hasPendingSave(){ return dirty; }
export const persist = flushSave;
