import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {startStaticServer,browserExecutable} from './release_support.mjs';
const root=fileURLToPath(new URL('../..',import.meta.url)),dist=join(root,'dist');
const info=JSON.parse(readFileSync(join(dist,'build-info.json'),'utf8'));
const server=await startStaticServer({cwd:dist,port:8126,label:'真实请求计量'});
const browser=await chromium.launch({headless:true,executablePath:browserExecutable(),args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
 const page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 const requests=new Map();cdp.on('Network.responseReceived',e=>requests.set(e.requestId,{url:e.response.url,status:e.response.status,bytes:0}));
 cdp.on('Network.loadingFinished',e=>{const r=requests.get(e.requestId);if(r)r.bytes=e.encodedDataLength;});
 await page.goto(server.base,{waitUntil:'networkidle'});await page.locator('[data-action="start"]').waitFor();
 const sum=()=>[...requests.values()].reduce((n,r)=>n+r.bytes,0),firstScreenBytes=sum();
 await page.evaluate(async()=>{const {save}=await import('./src/save.js');save.tutorialCompleted=true;window.game=await import('./src/game.js');game.startRun('adv',0);game.onLeft();});
 for(let pass=0;pass<60;pass++){await page.evaluate(()=>{for(let i=0;i<60;i++)game.update(1/60);});await page.waitForTimeout(20);}
 await page.waitForLoadState('networkidle');const firstLevelBytes=sum();
 assert.equal(await page.evaluate(()=>game.G.state),'clear');
 const fullBytes=info.files.reduce((n,p)=>n+readFileSync(join(dist,info.releasePath,p)).length,0);
 assert.ok(firstScreenBytes<=1.5*1024**2,`first screen ${firstScreenBytes}`);assert.ok(firstLevelBytes<=3*1024**2,`first level ${firstLevelBytes}`);assert.ok(fullBytes<=20*1024**2,`full ${fullBytes}`);
 assert.ok(!info.files.some(p=>p.includes('assets/img/src/')),'candidate originals leaked into build');
 const result={buildId:info.buildId,method:'Chromium CDP encodedDataLength, HTTP localhost without compression, cache disabled. Not mainland network timing.',firstScreenBytes,firstLevelBytes,fullBytes,requests:[...requests.values()]};
 mkdirSync(join(root,'docs/mobile-upgrade'),{recursive:true});writeFileSync(join(root,'docs/mobile-upgrade/network-budget.json'),JSON.stringify(result,null,2));
 console.log(`PASS | 实际请求首屏 ${(firstScreenBytes/1024).toFixed(0)} KiB / 1.5 MiB，首关累计 ${(firstLevelBytes/1024).toFixed(0)} KiB / 3 MiB；完整制品 ${(fullBytes/1024**2).toFixed(2)} MiB / 20 MiB（本地无压缩，非国内速度结论）`);
}finally{await browser.close();await server.stop();}
