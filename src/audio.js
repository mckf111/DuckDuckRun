import { save } from './save.js';

/* ================= 音频：轻量分层 WebAudio ================= */
let AC = null, BUS = null, noiseBuffer = null, lastQuack=-Infinity;

function buildBus(a){
  const master=a.createGain(), compressor=a.createDynamicsCompressor();
  const music=a.createGain(), effects=a.createGain(), voice=a.createGain();
  master.gain.value=0.72; music.gain.value=0.34; effects.gain.value=0.78;
  compressor.threshold.value=-18;compressor.knee.value=18;compressor.ratio.value=4;
  compressor.attack.value=0.006;compressor.release.value=0.2;
  music.connect(master);effects.connect(master);voice.connect(master);master.connect(compressor);compressor.connect(a.destination);
  BUS={master,music,effects,voice,compressor};syncVolumes();
}

// AudioContext 只在真实指针/键盘手势中创建或恢复；游戏状态机和主循环不能绕过该门槛。
export function unlockAudio(){
  if(!AC){
    try{ AC=new (window.AudioContext||window.webkitAudioContext)();buildBus(AC); }
    catch(e){ return null; }
  }
  if(AC.state==='suspended') AC.resume().catch(()=>{});
  return AC;
}

// 保持旧调用点的无副作用访问：没有手势解锁时返回 null，而不是暗中创建音频上下文。
export function ac(){ return AC; }

export function suspendAudio(){
  if(AC&&AC.state==='running') AC.suspend().catch(()=>{});
}

export function disposeAudio(){
  bgmStop();
  const nodes = BUS ? [BUS.music, BUS.effects, BUS.voice, BUS.master, BUS.compressor] : [];
  for(const node of nodes){ try{ node.disconnect(); }catch(e){} }
  const context = AC;
  AC = null;
  BUS = null;
  noiseBuffer = null;lastQuack=-Infinity;
  if(context && context.state!=='closed') context.close().catch(()=>{});
}

export function syncVolumes(){
  if(!BUS)return;
  BUS.master.gain.value=save.muted?0:0.72;
  for(const [kind,base]of [['music',0.34],['effects',0.78],['voice',0.7]])BUS[kind].gain.value=base*(save.volumes?.[kind]??0.8);
}
function targetBus(kind){return BUS?.[kind]||BUS?.effects;}

function oscAt(f0,f1,dur,type,vol,when,kind='effects',cutoff=0){
  if(save.muted) return;
  const a=ac(),out=targetBus(kind);if(!a||a.state!=='running'||!out)return;
  const t0=Math.max(a.currentTime,when??a.currentTime),o=a.createOscillator(),g=a.createGain();
  const filter=cutoff?a.createBiquadFilter():null;
  o.type=type||'sine';o.frequency.setValueAtTime(Math.max(1,f0),t0);
  if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t0+dur);
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,vol||0.1),t0+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  if(filter){filter.type='lowpass';filter.frequency.setValueAtTime(cutoff,t0);filter.Q.value=0.7;o.connect(filter);filter.connect(g);}
  else o.connect(g);
  g.connect(out);o.start(t0);o.stop(t0+dur+0.03);
}

export function tone(f0,f1,dur,type,vol,delay){
  const a=ac();if(!a)return;
  oscAt(f0,f1,dur,type,vol,a.currentTime+(delay||0));
}

function getNoise(a){
  if(noiseBuffer&&noiseBuffer.sampleRate===a.sampleRate)return noiseBuffer;
  const len=a.sampleRate,buffer=a.createBuffer(1,len,a.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<len;i++)data[i]=Math.random()*2-1;
  noiseBuffer=buffer;return buffer;
}

function noiseAt(when,dur,vol,filterType,frequency,kind='effects'){
  if(save.muted)return;
  const a=ac(),out=targetBus(kind);if(!a||a.state!=='running'||!out)return;
  const t0=Math.max(a.currentTime,when??a.currentTime),src=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();
  src.buffer=getNoise(a);f.type=filterType||'bandpass';f.frequency.setValueAtTime(frequency||1200,t0);f.Q.value=1.1;
  g.gain.setValueAtTime(Math.max(0.0002,vol),t0);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  src.connect(f);f.connect(g);g.connect(out);src.start(t0);src.stop(t0+dur+0.02);
}

function pluckAt(freq,when,vol=0.07,kind='music'){
  const a=ac(),out=targetBus(kind);if(save.muted||!a||a.state!=='running'||!out)return;
  const o=a.createOscillator(),f=a.createBiquadFilter(),g=a.createGain();
  o.type='triangle';o.frequency.setValueAtTime(freq,when);
  f.type='lowpass';f.frequency.setValueAtTime(2600,when);f.frequency.exponentialRampToValueAtTime(720,when+0.22);
  g.gain.setValueAtTime(0.0001,when);g.gain.exponentialRampToValueAtTime(vol,when+0.006);g.gain.exponentialRampToValueAtTime(0.0001,when+0.28);
  o.connect(f);f.connect(g);g.connect(out);o.start(when);o.stop(when+0.31);
}

function kickAt(when,vol){oscAt(118,42,0.19,'sine',vol,when,'music');}
function hatAt(when,vol){noiseAt(when,0.045,vol,'highpass',6200,'music');}
function snareAt(when,vol){noiseAt(when,0.13,vol,'bandpass',1800,'music');}

export const sfx={
  jump(){const a=ac();if(!a)return;oscAt(260,660,0.16,'sine',0.11,a.currentTime);noiseAt(a.currentTime,0.1,0.025,'highpass',3600);},
  slide(){const a=ac();if(!a)return;noiseAt(a.currentTime,0.22,0.075,'bandpass',780);oscAt(140,82,0.18,'sine',0.035,a.currentTime);},
  lane(){const a=ac();if(!a)return;pluckAt(520,a.currentTime,0.045,'effects');},
  collect(n){
    const a=ac();if(!a)return;const p=[523,587,659,784,880],f=p[(n||0)%5]*((n||0)>=8?2:1);
    pluckAt(f,a.currentTime,0.105,'effects');oscAt(f*2,f*1.8,0.11,'sine',0.025,a.currentTime+0.02);
  },
  hit(){const a=ac();if(!a)return;kickAt(a.currentTime,0.19);noiseAt(a.currentTime,0.28,0.12,'lowpass',520);},
  bonk(){
    const a=ac();if(!a)return;
    oscAt(180,70,0.16,'sine',0.16,a.currentTime);
    noiseAt(a.currentTime,0.12,0.11,'bandpass',420);
    oscAt(520,180,0.11,'triangle',0.05,a.currentTime+0.03);
    noiseAt(a.currentTime+0.07,0.08,0.045,'highpass',2400);
    noiseAt(a.currentTime+0.12,0.06,0.03,'highpass',2800);
  },
  clear(){const a=ac();if(!a)return;[523,659,784,1047].forEach((f,i)=>pluckAt(f,a.currentTime+i*0.1,0.09,'effects'));},
  click(){const a=ac();if(!a)return;pluckAt(760,a.currentTime,0.035,'effects');},
  gate(){const a=ac();if(!a)return;[660,880].forEach((f,i)=>pluckAt(f,a.currentTime+i*0.08,0.075,'effects'));},
  newItem(){const a=ac();if(!a)return;[880,1109,1319].forEach((f,i)=>pluckAt(f,a.currentTime+i*0.07,0.075,'effects'));},
  record(){const a=ac();if(!a)return;[523,659,784,1047,1319].forEach((f,i)=>pluckAt(f,a.currentTime+i*0.075,0.08,'effects'));},
  power(){const a=ac();if(!a)return;oscAt(620,1080,0.18,'sine',0.09,a.currentTime);},
  magnet(){const a=ac();if(!a)return;oscAt(260,900,0.3,'sine',0.075,a.currentTime);},
  shield(){const a=ac();if(!a)return;[420,620].forEach((f,i)=>oscAt(f,f,0.18,'sine',0.055,a.currentTime+i*0.08));},
  shieldBreak(){const a=ac();if(!a)return;noiseAt(a.currentTime,0.26,0.09,'highpass',2400);oscAt(420,160,0.24,'triangle',0.055,a.currentTime);},
  gui(){const a=ac();if(!a)return;[659,880,1319].forEach((f,i)=>pluckAt(f,a.currentTime+i*0.06,0.07,'effects'));},
  quack(pitch=1){
    const a=ac();if(!a||a.currentTime-lastQuack<1.6)return;lastQuack=a.currentTime;
    const p=Math.max(0.7,Math.min(1.35,pitch));
    noiseAt(a.currentTime,0.08,0.065,'bandpass',880*p,'voice');
    oscAt(300*p,128*p,0.15,'triangle',0.07,a.currentTime,'voice');
    oscAt(190*p,86*p,0.17,'sine',0.035,a.currentTime+0.015,'voice');
  },
  // 南京切片的原创桨点：两次木质拨弦和极低量水声，不使用实景录音。
  qinhuai(){
    const a=ac();if(!a)return;
    pluckAt(392,a.currentTime,0.075,'effects');
    noiseAt(a.currentTime+0.01,0.06,0.018,'bandpass',640,'effects');
    pluckAt(587,a.currentTime+0.16,0.065,'effects');
    noiseAt(a.currentTime+0.17,0.05,0.014,'bandpass',760,'effects');
  },
};

/* 104 BPM：低频、拨弦与轻打击分层；强度随跑速/连击增加，不再是单线蜂鸣循环。 */
const PENTA=[1,9/8,5/4,3/2,5/3];
const MELODIES=[
 [0,null,2,null,3,null,2,1,0,null,4,3,2,null,1,null],
 [2,null,3,4,null,3,null,2,1,null,0,null,2,null,null,null],
 [3,null,4,null,2,3,null,1,2,null,3,null,4,3,2,null],
 [4,3,null,2,1,null,2,null,0,null,null,null,1,null,0,null],
];
const ROOTS={crenel:110,lotus:98,steps:123.5,lantern:87.5,pine:104,plane:116.5,street:131,maple:147,pagoda:165,bridge:174.5};
const BGM={timer:null,root:110,step:0,next:0,intensity:0.28};

export function setBgmIntensity(value){BGM.intensity=Math.max(0,Math.min(1,value));}

function scheduleMusicStep(when,step){
  const beat=step%16,intensity=BGM.intensity,root=BGM.root;
  if(beat===0||beat===8)kickAt(when,0.045+intensity*0.025);
  if((beat===4||beat===12)&&intensity>0.2)snareAt(when,0.018+intensity*0.022);
  if(beat%2===1&&intensity>0.12)hatAt(when,0.008+intensity*0.013);
  if([0,6,8,14].includes(beat))oscAt(root,root,0.34,'triangle',0.027+intensity*0.018,when,'music',420);
  const phrase=Math.floor(step/16)%8;
  const degree=MELODIES[Math.floor(phrase/2)][beat];
  if(degree!==null)pluckAt(root*2*PENTA[degree],when,0.026+intensity*0.025,'music');
  if(beat===0||beat===8){
    oscAt(root*2,root*2,0.82,'sine',0.011,when,'music');
    oscAt(root*2*1.5,root*2*1.5,0.82,'sine',0.008,when,'music');
  }
}

function musicTick(){
  if(save.muted||!AC||AC.state!=='running')return;
  if(!BGM.next||BGM.next<AC.currentTime-0.2)BGM.next=AC.currentTime+0.04;
  const stepDur=60/104/4;
  while(BGM.next<AC.currentTime+0.12){scheduleMusicStep(BGM.next,BGM.step++);BGM.next+=stepDur;}
}

export function bgmStop(){
  if(BGM.timer){clearInterval(BGM.timer);BGM.timer=null;}
  BGM.next=0;BGM.step=0;
}

export function bgm(motif){
  if(motif&&ROOTS[motif])BGM.root=ROOTS[motif];
  if(BGM.timer)return;
  BGM.timer=setInterval(musicTick,35);
}
