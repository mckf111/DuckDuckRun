import { ctx, W, H, fit, visualRnd, setRandomSeed, downgradeQuality, viewport } from './core.js';
import { G, startRun, update, curLv, pauseRun, bookScene } from './game.js';
import { LEVELS, LM_CYCLE } from './config.js';
import { render } from './render.js';
import { loadMenuBackground, loadBackground, prefetchBackground } from './art/photo.js';
import { preloadGameSprites, getSprite } from './art/sprites.js';
import { bgmStop, disposeAudio, suspendAudio } from './audio.js';
import { prefersReducedMotion } from './save.js';
import { renderDomUI, mountDomUI, disposeDomUI } from './dom-ui.js';
import { createInputController } from './input.js';
import { track } from './track.js';

const DEFAULT_DEMO_SEED = 20260901;
let started = false;
let disposed = false;
let frameId = 0;
let inputController = null;
let cancelPrefetch = null;
let lastT = 0;
let prevState = G.state;
let perfStart = 0;
let perfFrames = 0;
let perfPrev = 0;
let assetKey = '';
let canvasRecovering = false;
let pausedByRotate = false;

function setCanvasRecovery(visible){
  const el = document.getElementById('canvasRecovery');
  if(el) el.hidden = !visible;
}

function recoverCanvas(){
  // Canvas 2D 在支持 contextlost/contextrestored 的浏览器中会复用同一上下文；重置尺寸和资源键可强制重绘。
  canvasRecovering = false;
  fit();
  assetKey = '';
  syncAssets();
  setCanvasRecovery(false);
}

function onCanvasContextLost(event){
  event.preventDefault?.();
  canvasRecovering = true;
  setCanvasRecovery(true);
}

function onCanvasContextRestored(){ recoverCanvas(); }

function parseSeed(raw){
  if(raw === null || raw === '') return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value >>> 0 : null;
}

function applyReplayQuery(){
  const query = new URLSearchParams(location.search);
  const requested = parseSeed(query.get('seed'));
  const demo = query.has('demo');
  const slice = query.get('slice') === '1';
  const easy = query.has('easy');
  const quiet = query.has('quiet');
  G.sliceRequest = slice ? { demo, easy, quiet } : null;
  const seed = requested ?? (demo ? DEFAULT_DEMO_SEED : null);
  if(seed === null) return;
  const normalized = setRandomSeed(seed);
  G.replay = { seed:normalized, source:demo ? 'demo' : 'query' };
}

function resizeRuntime(){
  const wasPortrait=viewport.portrait;
  fit();
  if(started&&wasPortrait!==viewport.portrait&&G.state==='play'){pauseRun();suspendAudio();}
}

function clearPrefetch(){
  if(cancelPrefetch) cancelPrefetch();
  cancelPrefetch = null;
}

function syncAssets(){
  if(G.state!=='play' && G.state!=='crashing' && G.state!=='over' && G.state!=='clear'){
    if(assetKey === 'menu') return;
    assetKey = 'menu';
    clearPrefetch();
    return;
  }
  if(G.scripted||G.mode==='endless'){
    const key='journey:'+G.mode+':'+(G.scripted?G.lvIdx:Math.floor(G.dist/600)%LEVELS.length);if(assetKey===key)return;
    assetKey=key;clearPrefetch();getSprite(bookScene()?.background||'bookBackdrop');return;
  }
  if(G.mode==='slice'){
    if(assetKey==='slice') return;
    assetKey='slice';clearPrefetch();return;
  }
  const endlessIndex = Math.floor(G.dist/600)%LM_CYCLE.length;
  const id = G.mode==='endless' ? LM_CYCLE[endlessIndex] : curLv().landmark;
  const next = G.mode==='endless'
    ? LM_CYCLE[(endlessIndex+1)%LM_CYCLE.length]
    : LEVELS[Math.min(G.lvIdx+1, LEVELS.length-1)].landmark;
  const nextKey = next === id ? '' : next;
  const key = `run:${id}:${nextKey}`;
  if(key === assetKey) return;
  assetKey = key;
  loadBackground(id);
  clearPrefetch();
  if(nextKey) cancelPrefetch = prefetchBackground(nextKey, 120);
}

function monitorFrameBudget(ts){
  if(perfPrev && ts-perfPrev > 250){ perfStart=ts; perfFrames=0; }
  perfPrev = ts;
  if(!perfStart) perfStart = ts;
  perfFrames++;
  if(ts-perfStart < 3000) return;
  const averageFrameMs = (ts-perfStart)/Math.max(1, perfFrames-1);
  if(averageFrameMs > 33) downgradeQuality();
  perfStart = ts;
  perfFrames = 0;
}

function frame(ts){
  if(!started || disposed) return;
  if(canvasRecovering){ frameId = requestAnimationFrame(frame); return; }
  monitorFrameBudget(ts);
  const raw = Math.min(0.05, (ts-lastT)/1000 || 0.016);
  lastT = ts;
  update(raw);
  syncAssets();
  G.buttons = [];
  ctx.save();
  if(G.shake>0 && !prefersReducedMotion()) ctx.translate(visualRnd(-1,1)*G.shake*8, visualRnd(-1,1)*G.shake*8);
  render();
  ctx.restore();
  renderDomUI();
  if(G.state !== prevState){
    if(prevState==='play' && G.state!=='play') bgmStop();
    const crashTransition=G.state==='crashing'||prevState==='crashing';
    prevState = G.state;
    G.wipe = 0;
    G.kbSel = 0;
    G.kbActive = false;
    G.stateT = 0;
  }
  G.stateT = (G.stateT||0) + raw;
  if(G.wipe > 0){
    G.wipe -= raw;
    const x = (1 - Math.max(0,G.wipe)/0.32) * (W+160) - 80;
    ctx.fillStyle = '#0d0a14';
    ctx.fillRect(x, 0, W-x+80, H);
    ctx.fillStyle = '#f0b64c';
    ctx.fillRect(x-3, 0, 3, H);
  }
  frameId = requestAnimationFrame(frame);
}

export function startApp(){
  if(started) return false;
  started = true;
  disposed = false;
  applyReplayQuery();
  mountDomUI();
  inputController = createInputController();
  addEventListener('resize', resizeRuntime);
  addEventListener('orientationchange', resizeRuntime);
  const canvas = document.getElementById('cv');
  canvas?.addEventListener('contextlost', onCanvasContextLost);
  canvas?.addEventListener('contextrestored', onCanvasContextRestored);
  resizeRuntime();
  track('view');
  preloadGameSprites();

  if(G.sliceRequest) startRun('slice',0,false,G.sliceRequest);
  else if(location.hash==='#slice') startRun('slice',0,false,{easy:false,demo:false});
  else if(location.hash==='#play') startRun('endless', 0);
  else if(/^#lv\d$/.test(location.hash)) startRun('adv', +location.hash.slice(3));

  frameId = requestAnimationFrame(frame);
  return true;
}

export function disposeApp(){
  if(!started) return false;
  started = false;
  disposed = true;
  if(frameId) cancelAnimationFrame(frameId);
  frameId = 0;
  removeEventListener('resize', resizeRuntime);
  removeEventListener('orientationchange', resizeRuntime);
  const canvas = document.getElementById('cv');
  canvas?.removeEventListener('contextlost', onCanvasContextLost);
  canvas?.removeEventListener('contextrestored', onCanvasContextRestored);
  inputController?.dispose();
  inputController = null;
  disposeDomUI();
  clearPrefetch();
  bgmStop();
  disposeAudio();
  lastT = 0;
  perfStart = 0;
  perfFrames = 0;
  perfPrev = 0;
  assetKey = '';
  canvasRecovering = false;
  pausedByRotate = false;
  setCanvasRecovery(false);
  prevState = G.state;
  return true;
}

// 自动启动仍是唯一的生产入口；导出的 start/dispose 仅供宿主销毁或自动化回归使用。
try{ startApp(); }catch(error){
  console.error('DuckDuckRun 启动失败', error);
  window.__duckDuckRunShowError?.();
}
