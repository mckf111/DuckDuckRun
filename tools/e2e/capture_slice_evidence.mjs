import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root=join(dirname(fileURLToPath(import.meta.url)),'..','..');
const base='http://127.0.0.1:8130';
const out=join(root,'docs','qa','evidence');
const frames=join(out,'slice-demo-frames');
mkdirSync(out,{recursive:true});mkdirSync(frames,{recursive:true});
const executable=process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox']});

async function go(page, query='?slice=1&demo&seed=20260903'){
  await page.goto(base+'/'+query,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(async()=>{
    const game=await import('/src/game.js');
    return game.G.state==='play'&&game.G.mode==='slice';
  });
}
async function seek(page, distance){
  await page.evaluate(async target=>{
    const game=await import('/src/game.js');
    const speed=game.G.mode==='slice' ? (game.G.slice?.easy?9:10) : (game.G.speed||9.5);
    game.G.speed=0;
    // 多推进 0.8m，确保恰在动作阈值触发的输入缓冲能在下一帧被消费。
    const goal=target+0.8;
    for(let i=0;i<6000&&game.G.state==='play'&&game.G.dist<goal;i++){
      game.G.speed=speed;game.update(1/60);
    }
    game.G.speed=0;
  },distance);
  await page.waitForTimeout(80);
}
async function shot(name, options, distance, query){
  const context=await browser.newContext(options);const page=await context.newPage();
  await go(page,query);await seek(page,distance);
  await page.locator('#cv').screenshot({path:join(out,name),type:'webp'});
  await context.close();
}

await shot('pre-slice-existing-core.webp',{viewport:{width:1440,height:900}},15,'?demo&seed=20260903#lv0');
await shot('slice-desktop-opening.webp',{viewport:{width:1440,height:900}},15,'?slice=1&demo&seed=20260903&quiet=1');
await shot('slice-desktop-feedback.webp',{viewport:{width:1440,height:900}},78,'?slice=1&demo&seed=20260903&quiet=1');
await shot('slice-desktop-risk.webp',{viewport:{width:1440,height:900}},274,'?slice=1&demo&seed=20260903&quiet=1');
await shot('slice-mobile-portrait.webp',{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2},15,'?slice=1&demo&seed=20260903');
await shot('slice-mobile-landscape.webp',{viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2},274,'?slice=1&demo&seed=20260903');

// 演示由真实 Canvas 状态关键帧组成：开场、首牌、取舍、下滑、收束。
const context=await browser.newContext({viewport:{width:960,height:540}});
const page=await context.newPage();
await go(page);
for(const [index,distance] of [15,78,274,474,650,720].entries()){
  await seek(page,distance);
  await page.locator('#cv').screenshot({path:join(frames,'frame-'+String(index+1).padStart(2,'0')+'.png'),type:'png'});
}
await context.close();
await browser.close();
console.log('PASS | 南京切片证据帧已输出至 '+out);
