/* README 取材：独立展示存档，只截当前产品，不改游戏数值或用户存档。 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { startStaticServer, browserExecutable } from './release_support.mjs';
import { normalizeSave } from '../../src/rules.js';
import { ITEMS } from '../../src/config.js';

const root=fileURLToPath(new URL('../..',import.meta.url));
const output=join(root,'assets/readme'),evidence=join(root,'tools/e2e/shots/readme');
mkdirSync(output,{recursive:true});mkdirSync(evidence,{recursive:true});
const server=await startStaticServer({cwd:root,port:8151,probePath:'/',label:'README 截图'});
const browser=await chromium.launch({headless:true,executablePath:browserExecutable()});
const errors=[];
try{
  const page=await browser.newPage({viewport:{width:1200,height:540},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(server.base+'/assets/readme/source/hero-preview.html');
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({path:join(output,'hero.png')});
  const showcase=normalizeSave({stars:Array(9).fill(2),cleared:Array(9).fill(true),album:Object.fromEntries(ITEMS.filter(x=>!x.secret).slice(0,28).map(x=>[x.id,true])),tutorialCompleted:true,journeyStarted:true,lastLevel:0,difficulty:'easy',motion:'reduced',volumes:{music:0,effects:0,voice:0}});
  await page.addInitScript(save=>localStorage.setItem('jinling_run_v1',JSON.stringify(save)),showcase);
  await page.setViewportSize({width:390,height:844});
  await page.goto(server.base);
  await page.locator('[data-action="start"]').waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('[data-action="start"]').click();
  await page.waitForFunction(async()=> (await import('/src/game.js')).G.dist>=140,{},{timeout:20000});
  assert.equal(await page.evaluate(async()=> (await import('/src/game.js')).G.state),'play');
  await page.screenshot({path:join(output,'gameplay.png')});
  await page.locator('[data-action="pause"]').click();
  await page.locator('[data-action="quit"]').click();
  await page.setViewportSize({width:1100,height:900});
  await page.locator('[data-action="levels"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({path:join(output,'stations.png')});
  await page.locator('[data-action="back"]').click();
  await page.locator('[data-action="album"]').click();
  await page.locator('#app-ui').evaluate(element=>element.scrollTop=0);
  await page.waitForTimeout(500);
  await page.screenshot({path:join(output,'album.png')});
  assert.deepEqual(errors,[]);
  writeFileSync(join(evidence,'capture.json'),JSON.stringify({date:'2026-09-07',source:'current local application; isolated showcase save, not human completion evidence',ordinaryItems:28,hiddenItems:0,files:['hero.png','gameplay.png','stations.png','album.png'],errors},null,2));
  console.log('PASS | README 头图与三个当前游戏画面已输出');
}finally{await browser.close();await server.stop();}
