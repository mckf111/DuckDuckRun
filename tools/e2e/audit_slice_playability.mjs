import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let modulesPromise;
async function gameModules(){
  if(!modulesPromise){
    global.window = {
      devicePixelRatio:1, innerWidth:960, innerHeight:540,
      matchMedia:() => ({matches:false}),
      addEventListener:()=>{}, removeEventListener:()=>{},
    };
    global.document = { getElementById:() => ({ getContext:() => ({}) }) };
    global.localStorage = { getItem:() => null, setItem:() => {} };
    modulesPromise = Promise.all([
      import('../../src/game.js'), import('../../src/core.js'),
      import('../../src/save.js'), import('../../src/audio.js'), import('../../src/config.js'),
    ]);
  }
  return modulesPromise;
}

function updateUntilDone(game, maxFrames=6000, dt=1/60){
  let frames=0;
  while(game.G.state==='play' && frames<maxFrames){ game.update(dt); frames++; }
  return frames;
}

function gitSha(){
  try { return execFileSync('git',['rev-parse','HEAD'],{cwd:resolve(fileURLToPath(new URL('../..',import.meta.url))),encoding:'utf8'}).trim(); }
  catch { return 'uncommitted'; }
}

export async function runSliceRouteAudit(){
  const [{ G, pl, startRun, update, onJump }, { setRandomSeed, clearRandomSeed }, { save }, { bgmStop }, { NANJING_SLICE }] = await gameModules();
  const seeds=[NANJING_SLICE.referenceSeed,1,2];
  const runs=[];
  save.muted=true;
  for(const easy of [false,true]){
    for(const seed of seeds){
      setRandomSeed(seed);
      startRun('slice',0,false,{demo:true,easy});
      const frames=updateUntilDone({G,update});
      runs.push({
        mode:easy?'easy':'standard', seed, route:G.slice?.routeId, state:G.state,
        durationSec:Number((frames/60).toFixed(2)), dist:Math.floor(G.dist), tokens:G.slice?.tokenCount||0,
        beats:G.slice?.beatLog.filter(entry=>entry.id!=='rescue').map(entry=>entry.id)||[],
      });
    }
  }
  // 轻松模式不是自动通关：玩家未换道仍消耗一次护航；标准模式同一失误必须失败。
  setRandomSeed(NANJING_SLICE.referenceSeed);
  startRun('slice',0,false,{easy:true});G.dist=29.9;pl.lane=0;pl.x=0;update(1/60);
  const easyMiss={state:G.state,rescues:G.slice?.rescues,inputBuffer:G.slice?.config.inputBuffer,collisionWidth:G.slice?.config.collisionWidth};
  startRun('slice',0,false,{easy:false});G.dist=29.9;pl.lane=0;pl.x=0;update(1/60);
  const standardMiss={state:G.state,inputBuffer:G.slice?.config.inputBuffer,collisionWidth:G.slice?.config.collisionWidth};
  startRun('slice',0,false,{easy:true});onJump();
  const bufferedInput=G.inputBuffer.jump;
  clearRandomSeed();bgmStop();
  return {runs,easyMiss,standardMiss,bufferedInput};
}

export async function runSliceSessionAudit(targetSeconds=600){
  const [{ G, startRun, update }, { setRandomSeed, clearRandomSeed }, { save }, { bgmStop }, { NANJING_SLICE }] = await gameModules();
  save.muted=true;
  const dt=1/30;
  let elapsed=0, completed=0, maxObjects=0, maxParticles=0, frameCount=0;
  while(elapsed<targetSeconds){
    setRandomSeed(NANJING_SLICE.referenceSeed+completed);
    startRun('slice',0,false,{demo:true,easy:completed%2===1});
    while(G.state==='play' && elapsed<targetSeconds){
      update(dt); elapsed+=dt; frameCount++;
      maxObjects=Math.max(maxObjects,G.obs.length+G.cols.length+G.gates.length);
      maxParticles=Math.max(maxParticles,G.parts.length);
    }
    if(G.state!=='clear') break;
    completed++;
  }
  const result={
    targetSeconds, simulatedSeconds:Number(elapsed.toFixed(2)), completedRuns:completed,
    finalState:G.state, maxObjects, maxParticles, updateFrames:frameCount,
  };
  clearRandomSeed();bgmStop();
  return result;
}

export async function runSlicePlayabilityAudit(){
  const routeAudit=await runSliceRouteAudit();
  const requiredBeats=['onboard','confidence','choice','pressure','relief','climax'];
  const routeIds=new Set(routeAudit.runs.map(run=>run.route));
  const routeFailures=routeAudit.runs.filter(run=>
    run.state!=='clear' || run.dist!==720 || run.tokens!==4 || requiredBeats.some(beat=>!run.beats.includes(beat))
  );
  const durationFailures=routeAudit.runs.filter(run=>
    run.mode==='standard' ? run.durationSec<70||run.durationSec>74 : run.durationSec<78||run.durationSec>82
  );
  const tenMinutes=await runSliceSessionAudit(600);
  const twentyMinutes=await runSliceSessionAudit(1200);
  const checks={
    threeNewcomerPaths:routeAudit.runs.filter(run=>run.mode==='standard').length===3 && routeIds.size===3 && !routeFailures.some(run=>run.mode==='standard'),
    allModeRoutesComplete:routeFailures.length===0,
    durationDistribution:durationFailures.length===0,
    easyHasGraceNotAutoplay:routeAudit.easyMiss.state==='play' && routeAudit.easyMiss.rescues===1
      && routeAudit.standardMiss.state==='crashing' && routeAudit.bufferedInput>routeAudit.standardMiss.inputBuffer,
    tenMinuteContinuous:tenMinutes.finalState!=='crashing' && tenMinutes.completedRuns>=7 && tenMinutes.maxObjects<=16,
    twentyMinuteSoak:twentyMinutes.finalState!=='crashing' && twentyMinutes.completedRuns>=14
      && twentyMinutes.maxObjects<=16 && twentyMinutes.maxParticles<=72,
  };
  const passed=Object.values(checks).every(Boolean);
  return {
    schema:1,
    generatedAt:new Date().toISOString(),
    source:'deterministic simulation; no human participant or physical-device claim',
    commit:gitSha(),
    referenceSeed:20260903,
    checks, passed, routeAudit, tenMinutes, twentyMinutes,
  };
}

const isDirect=process.argv[1]===fileURLToPath(import.meta.url);
if(isDirect){
  const report=await runSlicePlayabilityAudit();
  const output=resolve(fileURLToPath(new URL('../../docs/qa/evidence/slice-playability.json',import.meta.url)));
  mkdirSync(dirname(output),{recursive:true});
  writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  if(!report.passed){ console.error(JSON.stringify(report,null,2));process.exitCode=1; }
  else console.log('PASS | 切片可玩性审计：三局路径、路线组合、10 分钟连续模拟与 20 分钟浸泡');
}
