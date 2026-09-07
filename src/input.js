import { cv } from './core.js';
import { flushSave, save, persist } from './save.js';
import { unlockAudio, suspendAudio, syncVolumes } from './audio.js';
import { MOBILE } from './config.js';
import { G, onLeft, onRight, onJump, onSlide, onPauseKey, onEnter, pauseRun } from './game.js';

/* 原生按钮负责点击；画布只负责手势，两个输入面不互相命中。 */
export function createInputController(){
  const listeners=[];let gesture=null;
  const on=(target,type,handler,options)=>{target.addEventListener(type,handler,options);listeners.push([target,type,handler,options]);};
  const cancel=()=>{gesture=null;};
  const background=()=>{cancel();pauseRun();flushSave();suspendAudio();};
  on(window,'keydown',e=>{
    if(e.isComposing||e.keyCode===229||e.repeat)return;
    const element=e.target;
    if(element?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
    unlockAudio();
    const key=e.key.length===1?e.key.toLowerCase():e.key;
    const playing=G.state==='play'&&!G.paused&&!G.resumeIn;
    if(playing&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','a','d','w','s'].includes(key)){
      e.preventDefault();({ArrowLeft:onLeft,a:onLeft,ArrowRight:onRight,d:onRight,ArrowUp:onJump,w:onJump,' ':onJump,ArrowDown:onSlide,s:onSlide})[key]();
    } else if(key==='Escape'||key==='p'){e.preventDefault();onPauseKey();}
    else if(key==='m'){save.muted=!save.muted;persist();syncVolumes();}
    else if(key==='Enter'&&!element?.closest?.('button,a,summary')&&(G.state==='over'||G.state==='clear')){e.preventDefault();onEnter();}
  });
  on(cv,'pointerdown',e=>{
    if(!e.isPrimary||G.state!=='play'||G.paused||G.resumeIn)return;
    unlockAudio();gesture={id:e.pointerId,x:e.clientX,y:e.clientY,used:false};
    try{cv.setPointerCapture(e.pointerId);}catch(err){}
  });
  on(cv,'pointermove',e=>{
    if(!gesture||gesture.id!==e.pointerId||gesture.used||G.paused||G.resumeIn)return;
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))<MOBILE.swipeThreshold)return;
    let action;
    if(Math.abs(dx)>Math.abs(dy)*1.15)action=dx>0?onRight:onLeft;
    else if(Math.abs(dy)>Math.abs(dx)*1.15)action=dy<0?onJump:onSlide;
    else return;
    gesture.used=true;action();
  });
  const end=e=>{if(gesture?.id===e.pointerId)cancel();};
  on(window,'pointerup',end);on(window,'pointercancel',end);on(cv,'lostpointercapture',end);
  on(document,'visibilitychange',()=>{if(document.hidden)background();});
  on(window,'blur',background);on(window,'pagehide',background);
  return {dispose(){cancel();for(const [target,type,handler,options]of listeners)target.removeEventListener(type,handler,options);listeners.length=0;}};
}
