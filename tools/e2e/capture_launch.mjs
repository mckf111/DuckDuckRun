/* 公众号补图：真实启动、教学和自然失败，展示图不作真人验收证据。 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {startStaticServer,browserExecutable} from './release_support.mjs';
import {normalizeSave} from '../../src/rules.js';

const root=fileURLToPath(new URL('../..',import.meta.url)),out=join(root,'docs/launch/assets');
mkdirSync(out,{recursive:true});
const server=await startStaticServer({cwd:root,port:8152,probePath:'/',label:'公众号补图'});
const browser=await chromium.launch({headless:true,executablePath:browserExecutable()}),errors=[];
try{
 const p=await browser.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(server.base);await p.locator('[data-action="start"]').waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
 await p.screenshot({path:join(out,'screenshot-menu.jpg'),quality:88});
 await p.locator('[data-action="start"]').click();await p.waitForTimeout(800);
 await p.screenshot({path:join(out,'screenshot-tutorial.jpg'),quality:88});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(save=>localStorage.setItem('jinling_run_v1',JSON.stringify(save)),normalizeSave({tutorialCompleted:true,difficulty:'standard',muted:true}));
 const run=await context.newPage();run.on('pageerror',e=>errors.push(e.message));
 await run.goto(server.base+'/#lv0');await run.evaluate(async()=>{window.launchGame=await import('/src/game.js');});
 await run.waitForFunction(()=>window.launchGame.G.state==='over',{},{timeout:90000});
 await run.waitForTimeout(650);
 await run.screenshot({path:join(out,'screenshot-over.jpg'),quality:88});
 const failure=await run.evaluate(()=>({state:window.launchGame.G.state,distance:window.launchGame.G.dist,killedBy:window.launchGame.G.killedBy}));
 if(errors.length)throw new Error(errors.join('\n'));
 writeFileSync(join(root,'tools/e2e/shots/readme/launch-capture.json'),JSON.stringify({scope:'local browser screenshots, not physical-device evidence',failure,errors},null,2));
 console.log('PASS | 首次菜单、真实教学和自然失败结算已重截');
}finally{await browser.close();await server.stop();}
