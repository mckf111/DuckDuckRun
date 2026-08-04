import { canPassObstacle } from '../../src/rules.js';

function mulberry32(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

let modulesPromise;
async function gameModules(){
  if(!modulesPromise){
    global.window = { devicePixelRatio:1, innerWidth:960, innerHeight:540 };
    global.document = { getElementById:() => ({ getContext:() => ({}) }) };
    global.localStorage = { getItem:() => null, setItem:() => {} };
    modulesPromise = Promise.all([
      import('../../src/game.js'), import('../../src/core.js'),
      import('../../src/save.js'), import('../../src/audio.js'),
    ]);
  }
  return modulesPromise;
}

function applyAction(state, action){
  const next = { ...state };
  if(action==='left' && next.lane>-1) next.lane--;
  else if(action==='right' && next.lane<1) next.lane++;
  else if(action==='jump'){
    if(next.y<=0.01){ next.vy=6.4; next.jumps=1; }
    else if(next.jumps===1){ next.vy=5.6; next.jumps=2; }
    next.sliding=0;
  } else if(action==='slide'){
    if(next.y>0.01) next.vy=Math.min(next.vy,-7);
    next.sliding=0.75;
  }
  return next;
}

function advance(state, dt){
  state.x += (state.lane*1.25-state.x)*Math.min(1,dt*12);
  state.vy -= 18*dt;
  state.y += state.vy*dt;
  if(state.y<=0){ state.y=0; state.vy=0; state.jumps=0; }
  state.sliding=Math.max(0,state.sliding-dt);
}

function stateKey(state){
  return [state.lane,Math.round(state.x*20),Math.round(state.y*20),Math.round(state.vy*8),Math.round(state.sliding*20),state.jumps].join('|');
}

function hasPath(obstacles, start, end){
  const dt=1/30, speed=20, actions=['none','left','right','jump','slide'];
  let distance=start, frame=0;
  let states=[{ lane:0,x:0,y:0,vy:0,sliding:0,jumps:0 }];
  while(distance<end && states.length){
    const previous=distance;
    distance+=speed*dt;
    const nearby=obstacles.filter(obstacle => obstacle.z>=previous-0.45 && obstacle.z<=distance+0.45);
    const choices=frame%2===0 ? actions : ['none'];
    const next=[], seen=new Set();
    for(const state of states){
      for(const action of choices){
        const candidate=applyAction(state,action);
        advance(candidate,dt);
        const hit=nearby.some(obstacle => Math.abs(obstacle.x-candidate.x)<0.55 && !canPassObstacle(candidate,obstacle));
        if(hit) continue;
        const key=stateKey(candidate);
        if(seen.has(key)) continue;
        seen.add(key); next.push(candidate);
      }
    }
    states=next.slice(0,120);
    frame++;
  }
  return states.length>0;
}

export async function runBeamAudit(seedCount=200, meters=500){
  const [{ G, startRun, spawnCluster }, { rnd }, { save }, { bgmStop }] = await gameModules();
  const failed=[];
  save.tut=true;
  for(let seed=1;seed<=seedCount;seed++){
    Math.random=mulberry32(seed);
    startRun('endless',0);
    G.dist=3000; G.speed=20; G.tutStage=3; G.obs=[];
    let next=3040;
    while(next<3000+meters){
      spawnCluster(next);
      next+=(rnd(16,24)*(9.5/20)+4);
    }
    const end=Math.max(3000,...G.obs.map(obstacle => obstacle.z))+2;
    if(!hasPath(G.obs,3000,end)) failed.push(seed);
  }
  bgmStop();
  return failed;
}

export async function runRhythmAudit(seedCount=12,meters=1000){
  const [{G,startRun,spawnCluster},{rnd},{save},{bgmStop}]=await gameModules();
  const failures=[];
  save.tutorialCompleted=true;save.tut=true;save.cleared[9]=true;
  for(let level=0;level<10;level++)for(let seed=1;seed<=seedCount;seed++){
    Math.random=mulberry32(level*1000+seed);
    startRun('adv',level);
    let next=40;
    while(next<meters){spawnCluster(next);next+=rnd(16,24)*(9.5/G.speed)+4;}
    const log=G.rhythmLog;
    if(log.filter(entry=>entry.kind==='feature').length<2)failures.push(`lv${level}/s${seed}:feature`);
    if(log.some(entry=>entry.actionStreak>2))failures.push(`lv${level}/s${seed}:action`);
    for(let i=0;i<log.length-1;i++)if(log[i].pressure&&log[i+1].kind!=='relief'){
      failures.push(`lv${level}/s${seed}:relief`);break;
    }
  }
  bgmStop();
  return failures;
}
