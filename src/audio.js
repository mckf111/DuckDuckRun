import { save } from './save.js';

/* ================= 音频(WebAudio 合成) ================= */
let AC = null;
export function ac(){
  if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(AC && AC.state === 'suspended') AC.resume().catch(()=>{});
  return AC;
}
export function tone(f0, f1, dur, type, vol, delay){
  if(save.muted) return; const a = ac(); if(!a || a.state!=='running') return; // suspended 时不排队,避免解锁瞬间连发爆音
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
  collect(n){ // 五声音阶拨弦,连击越高音越高
    const p = [523,587,659,784,880]; const f = p[(n||0)%5] * ((n||0)>=5 ? 2 : 1);
    tone(f, f, 0.25, 'sine', 0.14); tone(f*2, f*2, 0.18, 'sine', 0.05);
  },
  hit(){ tone(160, 40, 0.4, 'sawtooth', 0.2); tone(90, 30, 0.5, 'square', 0.12, 0.03); },
  clear(){ [523,659,784,1047].forEach((f,i)=>tone(f,f,0.3,'triangle',0.13,i*0.12)); },
  click(){ tone(700, 700, 0.06, 'square', 0.06); },
  gate(){ tone(660, 660, 0.12, 'triangle', 0.1); tone(880, 880, 0.2, 'triangle', 0.1, 0.09); }, // 穿门风铃
  newItem(){ [880,1109,1319].forEach((f,i)=>tone(f,f,0.22,'triangle',0.1,i*0.08)); },         // 新图鉴风铃
  record(){ [523,659,784,1047,1319].forEach((f,i)=>tone(f,f,0.26,'triangle',0.12,i*0.09)); }, // 破纪录琶音
};

/* ---- BGM:五声音阶江南小调循环,每关换根音,垫底音量 ---- */
const PENTA = [1, 9/8, 5/4, 3/2, 5/3];
const PATTERN = [2,1,0,1, 2,3,4,3, 2,1,0,2, 1,0,1,2];
const ROOTS = { crenel:220, lotus:196, steps:247, lantern:175, pine:208 };
let bgmTimer = null, bgmRoot = 220, bgmStep = 0;
export function bgm(motif){
  if(motif && ROOTS[motif]) bgmRoot = ROOTS[motif];
  if(bgmTimer) return;
  bgmTimer = setInterval(()=>{
    if(save.muted || !AC || AC.state!=='running') return;
    const f = bgmRoot * PENTA[PATTERN[bgmStep % PATTERN.length]];
    bgmStep++;
    tone(f, f, 0.5, 'sine', 0.03);
    if(bgmStep % 4 === 0) tone(f/2, f/2, 0.9, 'triangle', 0.018); // 低音垫
  }, 460);
}
