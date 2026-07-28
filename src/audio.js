import { irnd } from './core.js';
import { save } from './save.js';

/* ================= 音频(WebAudio 合成) ================= */
let AC = null;
export function ac(){
  if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(AC && AC.state === 'suspended') AC.resume();
  return AC;
}
export function tone(f0, f1, dur, type, vol, delay){
  if(save.muted) return; const a = ac(); if(!a) return;
  const t0 = a.currentTime + (delay||0);
  const o = a.createOscillator(), g = a.createGain();
  o.type = type||'sine'; o.frequency.setValueAtTime(f0, t0);
  if(f1) o.frequency.exponentialRampToValueAtTime(Math.max(f1,1), t0+dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol||0.15, t0+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  o.connect(g); g.connect(a.destination);
  o.start(t0); o.stop(t0+dur+0.05);
}
export const sfx = {
  jump(){ tone(300, 620, 0.18, 'triangle', 0.12); },
  slide(){ tone(500, 180, 0.2, 'sawtooth', 0.05); },
  lane(){ tone(420, 500, 0.08, 'square', 0.05); },
  collect(){ // 五声音阶拨弦
    const p = [523,587,659,784,880]; const f = p[irnd(0,4)];
    tone(f, f, 0.25, 'sine', 0.14); tone(f*2, f*2, 0.18, 'sine', 0.05);
  },
  hit(){ tone(160, 40, 0.4, 'sawtooth', 0.2); tone(90, 30, 0.5, 'square', 0.12, 0.03); },
  clear(){ [523,659,784,1047].forEach((f,i)=>tone(f,f,0.3,'triangle',0.13,i*0.12)); },
  click(){ tone(700, 700, 0.06, 'square', 0.06); },
};
