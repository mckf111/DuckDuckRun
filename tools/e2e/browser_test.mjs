import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root=join(dirname(fileURLToPath(import.meta.url)),'..','..');
const base='http://127.0.0.1:8123';
const python=process.platform==='win32' && existsSync(join(root,'.venv','Scripts','python.exe'))
  ? join(root,'.venv','Scripts','python.exe') : (process.platform==='win32' ? 'python' : 'python3');
const server=spawn(python,['-m','http.server','8123','--bind','127.0.0.1'],{cwd:root,stdio:'ignore',windowsHide:true});

async function waitServer(){
  for(let i=0;i<50;i++){
    try{ const response=await fetch(base); if(response.ok) return; }catch(e){}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error('本地测试服务未启动');
}

async function launchBrowser(){
  try{ return await chromium.launch({headless:true}); }catch(e){}
  try{ return await chromium.launch({channel:'chrome',headless:true}); }catch(e){}
  return chromium.launch({channel:'msedge',headless:true});
}

async function seedPage(page, seed=20260804){
  await page.addInitScript(value => {
    let state=value|0;
    Math.random=()=>{ state|=0; state=state+0x6D2B79F5|0; let t=Math.imul(state^state>>>15,1|state); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  },seed);
}

async function openMenu(page){
  const started=Date.now();
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{ window.__GAME=(await import('/src/game.js')).G; });
  await page.waitForFunction(()=>window.__GAME.state==='menu' && window.__GAME.buttons.length>=4,{timeout:2500});
  return Date.now()-started;
}

function watchErrors(page){
  const errors=[];
  page.on('pageerror',error=>errors.push('pageerror: '+error.message));
  page.on('console',message=>{ if(message.type()==='error') errors.push('console: '+message.text()); });
  page.on('requestfailed',request=>errors.push('request: '+request.url()+' '+(request.failure()?.errorText||'')));
  page.on('response',response=>{ if(response.status()>=400) errors.push('response: '+response.status()+' '+response.url()); });
  return errors;
}

async function canvasShot(page){
  await page.evaluate(async()=>{
    const photos=await import('/src/art/photo.js');
    await photos.loadMenuBackground();
    await document.fonts.ready;
  });
  await page.waitForTimeout(500);
  return page.locator('#cv').screenshot();
}

let browser;
try{
  await waitServer();
  browser=await launchBrowser();
  const profiles=[
    {name:'桌面',options:{viewport:{width:1000,height:600}}},
    {name:'小屏横屏',options:{viewport:{width:667,height:375}}},
    {name:'触屏横屏',options:{viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2}},
  ];
  for(const [index,profile] of profiles.entries()){
    const context=await browser.newContext(profile.options);
    const page=await context.newPage();
    await seedPage(page,20260804+index);
    const errors=watchErrors(page);
    const readyMs=await openMenu(page);
    assert.ok(readyMs<=2500,profile.name+' 菜单可操作耗时 '+readyMs+'ms');
    const box=await page.locator('#cv').boundingBox();
    if(profile.options.deviceScaleFactor===2){
      const ratios=[];
      ratios.push(await page.evaluate(()=>document.querySelector('#cv').width/document.querySelector('#cv').getBoundingClientRect().width));
      ratios.push(await page.evaluate(async()=>{ (await import('/src/core.js')).downgradeQuality(); const c=document.querySelector('#cv'); return c.width/c.getBoundingClientRect().width; }));
      ratios.push(await page.evaluate(async()=>{ (await import('/src/core.js')).downgradeQuality(); const c=document.querySelector('#cv'); return c.width/c.getBoundingClientRect().width; }));
      assert.deepEqual(ratios.map(value=>Math.round(value*10)/10),[2,1.5,1]);
    }
    const x=box.x+box.width*0.5, y=box.y+box.height*0.60;
    if(profile.options.hasTouch) await page.touchscreen.tap(x,y); else await page.mouse.click(x,y);
    await page.waitForFunction(()=>window.__GAME.state==='levels');
    await page.waitForTimeout(150);
    assert.deepEqual(errors,[],profile.name+' 出现浏览器错误');
    await context.close();
  }

  // 首屏只取菜单；开跑后只取当前关，并在空闲期预取下一关。
  {
    const context=await browser.newContext({viewport:{width:1000,height:600}});
    const page=await context.newPage();
    await seedPage(page);
    const interactionErrors=watchErrors(page);
    const backgrounds=[];
    page.on('request',request=>{
      if(/\/assets\/(?:img\/bg_|game\/(?:menu-background|bg-))/.test(request.url())) backgrounds.push(request.url().split('/').pop());
    });
    await openMenu(page);
    await page.waitForTimeout(200);
    assert.deepEqual([...new Set(backgrounds)],['menu-background.webp']);
    const first=await canvasShot(page);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.evaluate(async()=>{ window.__GAME=(await import('/src/game.js')).G; });
    await page.waitForFunction(()=>window.__GAME.buttons.length>=4);
    const second=await canvasShot(page);
    assert.equal(createHash('sha256').update(first).digest('hex'),createHash('sha256').update(second).digest('hex'),'固定种子截图不一致');
    await page.evaluate(async()=>{ (await import('/src/game.js')).startRun('adv',0); });
    await page.waitForTimeout(500);
    const requested=[...new Set(backgrounds)];
    assert.ok(requested.includes('bg-zhonghua.webp'));
    assert.ok(requested.includes('bg_jiming.webp'));
    assert.equal(requested.filter(name=>name!=='menu-background.webp'&&name!=='bg-zhonghua.webp'&&name!=='bg_jiming.webp').length,0);

    // 金桂只翻铜钱；首次通桥直接授予江豚并写入本局新物品。
    const ledger=await page.evaluate(async()=>{
      const game=await import('/src/game.js');
      const saves=await import('/src/save.js');
      saves.save.cleared.fill(false); saves.save.stars.fill(0); saves.save.album={};
      const lockedBridgeRejected=game.startRun('adv',9)===false && game.G.state==='levels';
      game.startRun('adv',0);
      game.G.nextSpawn=Infinity; game.G.nextGate=Infinity; game.G.nextPower=Infinity;
      game.G.obs=[]; game.G.cols=[{x:0,z:0.2,y:0.8,id:'duck',got:false,arc:1,arcN:1}];
      game.G.powerT.gui=1; const before=saves.save.coins;
      game.update(1/60);
      const pickup={marks:game.G.runMarks,stars:game.G.runStars,coins:saves.save.coins-before};
      delete saves.save.album.jiangtun;
      game.G.lvIdx=9; game.G.mode='adv'; game.G.state='play'; game.G.dist=900; game.G.runMarks=0; game.G.newIds=[];
      game.levelClear();
      return {lockedBridgeRejected,pickup,jiangtun:!!saves.save.album.jiangtun,newIds:game.G.newIds.slice(),red:!!saves.save.albumNew};
    });
    assert.equal(ledger.lockedBridgeRejected,true);
    assert.deepEqual(ledger.pickup,{marks:1,stars:0,coins:2});
    assert.equal(ledger.jiangtun,true);
    assert.ok(ledger.newIds.includes('jiangtun'));
    assert.equal(ledger.red,true);

    const interaction=await page.evaluate(async()=>{
      const game=await import('/src/game.js');
      const saves=await import('/src/save.js');

      const tickUntil=(condition,max=2400)=>{
        for(let i=0;i<max;i++){
          game.update(1/60);
          if(condition()) return i+1;
        }
        throw new Error('教学实输入超时');
      };
      const approach=margin=>tickUntil(()=>game.G.tutorial.targetZ-game.G.dist<=margin);
      const playTutorial=async()=>{
        game.onRight();
        tickUntil(()=>game.G.tutorial?.step===1);
        const step1=game.G.tutorial?.step;

        approach(2.8); game.onJump();
        tickUntil(()=>game.G.tutorial?.step===2);
        const step2=game.G.tutorial?.step;

        approach(2.8); game.onSlide();
        tickUntil(()=>game.G.tutorial?.step===3);
        const step3=game.G.tutorial?.step;

        // 留出一个真实绘制帧，专门防住“进入第 4 步首帧 NaN 导致主循环冻结”的回归。
        await new Promise(resolve=>requestAnimationFrame(()=>resolve()));

        tickUntil(()=>game.pl.y<=0.01,240);
        game.onJump(); game.update(1/60);
        game.onJump(); game.update(1/60);
        return {step1,step2,step3,completed:saves.save.tutorialCompleted&&!game.G.tutorial,
          resetDist:game.G.dist,state:game.G.state};
      };

      saves.save.tutorialCompleted=false; saves.save.tut=false;
      game.startRun('adv',0,true);
      const replayTutorial=await playTutorial();

      saves.save.tutorialCompleted=false; saves.save.tut=false;
      game.startRun('adv',0,true);
      tickUntil(()=>game.G.tutorial?.retries===1);
      const retryShield=game.G.state==='play' && game.G.tutorial?.step===0 && game.G.tutorial.retries===1;

      saves.save.tutorialCompleted=false; saves.save.tut=false;
      game.startRun('adv',0,false);
      const firstRunTutorial=await playTutorial();

      saves.save.tutorialCompleted=true; saves.save.tut=true;
      game.startRun('adv',0);
      game.G.nextSpawn=Infinity; game.G.nextGate=Infinity; game.G.nextPower=Infinity; game.G.obs=[];
      game.onJump();
      const bufferedBefore=game.pl.vy===0 && game.G.inputBuffer.jump>0;
      game.update(1/60);
      const bufferedAfter=game.pl.vy>0 && game.G.inputBuffer.jump===0;

      game.startRun('adv',0);
      game.G.nextSpawn=Infinity; game.G.nextGate=Infinity; game.G.nextPower=Infinity;
      game.G.obs=[{lane:0,x:0,z:0.1,type:'full'}]; game.pl.lane=0; game.pl.x=0;
      game.update(1/60);
      const crashStart=game.G.state;
      game.update(0.07); const crashHold=game.G.state;
      game.update(0.2); const crashEnd=game.G.state;

      game.startRun('adv',0);game.G.nextSpawn=Infinity;game.G.nextPower=50;
      game.G.obs=[{lane:-1,x:-1.25,z:50,type:'full'},{lane:0,x:0,z:50,type:'full'}];
      game.update(1/60);
      const power=game.G.powers[0];
      const powerSafe=power.lane===1&&!game.G.obs.some(o=>o.lane===power.lane&&Math.abs(o.z-power.z)<8);

      delete saves.save.album.baiju;saves.save.secretPending=['baiju'];
      game.startRun('adv',0);game.G.nextSpawn=Infinity;
      const firstSecret=game.G.secretQueue.find(entry=>entry.id==='baiju');
      game.G.obs=[{lane:-1,x:-1.25,z:firstSecret.spawnAt,type:'full'},{lane:0,x:0,z:firstSecret.spawnAt,type:'full'}];
      for(let i=0;i<30&&!firstSecret.spawned;i++)game.update(1/60);
      const secretMarks=game.G.cols.filter(mark=>mark.id==='baiju');
      const secretLane=Math.round(secretMarks[0].x/1.25);
      const secretSafe=firstSecret.spawnAt<=75&&secretMarks.length===5
        &&!game.G.obs.some(o=>o.lane===secretLane&&Math.abs(o.z-firstSecret.spawnAt)<9);
      game.gameOver('full');
      game.startRun('adv',0);game.G.nextSpawn=Infinity;
      const guaranteedNextRun=game.G.secretQueue.some(entry=>entry.id==='baiju');
      const nextSecret=game.G.secretQueue.find(entry=>entry.id==='baiju');
      for(let i=0;i<30&&!nextSecret.spawned;i++)game.update(1/60);
      const mark=game.G.cols.find(entry=>entry.id==='baiju');
      game.pl.lane=Math.round(mark.x/1.25);game.pl.x=mark.x;game.pl.y=Math.max(0,mark.y-0.8);
      game.G.dist=mark.z-0.1;game.update(1/60);
      const secretCollected=!!saves.save.album.baiju&&!saves.save.secretPending.includes('baiju');

      saves.save.albumDryRuns=0;
      for(let i=0;i<3;i++){game.startRun('adv',0);game.gameOver('full');}
      const dryRuns=saves.save.albumDryRuns;

      const ui=await import('/src/ui.js');
      const config=await import('/src/config.js');
      saves.save.ups.magnet=0;saves.save.coins=0;game.G.state='shop';game.G.egg=null;
      ui.handleButton('buy',0);
      const shopFail={...game.G.shopFeedback,egg:game.G.egg};
      saves.save.coins=50;game.G.egg=null;ui.handleButton('buy',0);
      const shopSuccess={...game.G.shopFeedback,level:saves.save.ups.magnet,coins:saves.save.coins,egg:game.G.egg,final:config.SHOPS[0].levels[3]};
      return {replayTutorial,firstRunTutorial,retryShield,bufferedBefore,bufferedAfter,crashStart,crashHold,crashEnd,
        powerSafe,secretSafe,guaranteedNextRun,secretCollected,dryRuns,shopFail,shopSuccess};
    });
    assert.deepEqual(interaction,{
      replayTutorial:{step1:1,step2:2,step3:3,completed:true,resetDist:0,state:'play'},
      firstRunTutorial:{step1:1,step2:2,step3:3,completed:true,resetDist:0,state:'play'},
      retryShield:true,
      bufferedBefore:true,bufferedAfter:true,crashStart:'crashing',crashHold:'crashing',crashEnd:'over',
      powerSafe:true,secretSafe:true,guaranteedNextRun:true,secretCollected:true,dryRuns:3,
      shopFail:{type:'fail',index:0,missing:50,ttl:1.2,egg:null},
      shopSuccess:{type:'success',index:0,spent:50,ttl:1.2,level:1,coins:0,egg:null,final:'12 秒'},
    });
    assert.deepEqual(interactionErrors,[],'教学或第一关产生浏览器错误');
    await context.close();
  }

  // 慢图、全部图片失败和存档写入失败都不能挡住菜单或开跑。
  {
    const context=await browser.newContext({viewport:{width:1000,height:600}});
    await context.route('**/assets/game/menu-background.webp',async route=>{
      await new Promise(resolve=>setTimeout(resolve,1200));
      await route.continue().catch(()=>{});
    });
    const page=await context.newPage();
    await seedPage(page);
    const readyMs=await openMenu(page);
    assert.ok(readyMs<1000,'慢图阻塞了菜单: '+readyMs+'ms');
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:1000,height:600}});
    await context.route('**/assets/game/menu-background.webp',route=>route.fulfill({status:404,body:''}));
    const page=await context.newPage();
    const images=[];
    page.on('request',request=>{ if(/(menu-background|bg_menu)\.(webp|jpg)$/.test(request.url())) images.push(request.url().split('/').pop()); });
    await seedPage(page);
    await openMenu(page);
    await page.waitForTimeout(150);
    assert.deepEqual([...new Set(images)],['menu-background.webp','bg_menu.webp']);
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:1000,height:600}});
    await context.route('**/assets/game/menu-background.webp',route=>route.fulfill({status:200,contentType:'image/webp',body:'not-an-image'}));
    const page=await context.newPage();
    await seedPage(page);
    await openMenu(page);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>window.__GAME.state),'menu');
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:1000,height:600}});
    await context.route('**/assets/img/**',route=>route.abort('internetdisconnected'));
    await context.route('**/assets/game/**',route=>route.abort('internetdisconnected'));
    const page=await context.newPage();
    await seedPage(page);
    await openMenu(page);
    await page.evaluate(async()=>{ (await import('/src/game.js')).startRun('adv',0); });
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>window.__GAME.state),'play');
    assert.ok(await page.evaluate(()=>window.__GAME.dist)>0);
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:1000,height:600}});
    const page=await context.newPage();
    await seedPage(page);
    await page.addInitScript(()=>{ Storage.prototype.setItem=function(){ throw new DOMException('quota','QuotaExceededError'); }; });
    await openMenu(page);
    await page.evaluate(async()=>{ const game=await import('/src/game.js'); game.startRun('adv',0); (await import('/src/save.js')).flushSave(); });
    assert.equal(await page.evaluate(()=>window.__GAME.state),'play');
    await context.close();
  }
  console.log('PASS | 浏览器门禁：3 视口、按需加载、慢网/离线/404/解码失败、脏写入、确定性截图');
} finally {
  if(browser) await browser.close().catch(()=>{});
  server.kill();
}
