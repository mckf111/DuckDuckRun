import { existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root=join(dirname(fileURLToPath(import.meta.url)),'..','..');
const base='http://127.0.0.1:8130';
const out=join(root,'docs','qa','evidence','slice-performance.json');
const executable=process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox']});

async function sample(profile, query){
  const context=await browser.newContext(profile.options);
  const page=await context.newPage();
  const start=Date.now();
  await page.goto(base+'/'+query,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(async()=>{
    const game=await import('/src/game.js');
    return game.G.state==='play';
  },{timeout:4000});
  const playableMs=Date.now()-start;
  const metrics=await page.evaluate(async()=>{
    const frames=await new Promise(resolve=>{
      let count=0;const begin=performance.now();
      function step(now){count++;if(now-begin>=3000) resolve({count,elapsed:now-begin});else requestAnimationFrame(step);}
      requestAnimationFrame(step);
    });
    const resources=performance.getEntriesByType('resource');
    const transferBytes=resources.reduce((sum,entry)=>sum+(entry.transferSize||0),0);
    const game=await import('/src/game.js');
    return {fps:Number((frames.count/(frames.elapsed/1000)).toFixed(2)),transferBytes,resources:resources.length,mode:game.G.mode,dist:Number(game.G.dist.toFixed(1))};
  });
  await context.close();
  return {playableMs,...metrics};
}

const profiles=[
  {name:'desktop',options:{viewport:{width:1000,height:600}}},
  {name:'mobile_simulated',options:{viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2}},
];
const results={
  capturedAt:new Date().toISOString(),
  environment:'Local headless Chromium; no network throttling; mobile is touch/DPR simulation, not a physical device.',
  profiles:{},
};
for(const profile of profiles){
  results.profiles[profile.name]={
    existingLevel:await sample(profile,'?demo&seed=20260903#lv0'),
    slice:await sample(profile,'?slice=1&demo&seed=20260903'),
  };
}
writeFileSync(out,JSON.stringify(results,null,2)+'\n');
await browser.close();
console.log(JSON.stringify(results,null,2));
