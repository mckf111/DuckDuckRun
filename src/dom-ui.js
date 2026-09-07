import { G, startRun, curLv, nextAfterClear, pauseRun, resumeRun, retryCurrentTutorial, benchmarkBeat } from './game.js';
import { save, persist, flushSave, replaceSave, saveError } from './save.js';
import { LEVELS, ITEMS, SHOPS, MOBILE, MOBILE_UI, JOURNEY_COPY, SKINS, PROGRESS_COPY as PC } from './config.js';
import { getBridgeUnlockStatus, getObstacleInstruction, parseSaveImport, totalStars, skinUnlocked, effectiveSkin } from './rules.js';
import { unlockAudio, syncVolumes, sfx, suspendAudio } from './audio.js';
import { shareScore } from './share.js';
import { withDrawingContext } from './core.js';
import { drawItemIcon } from './art/items.js';
import { drawBookDuck } from './art/book.js';
import { getSprite } from './art/sprites.js';
import { COPYRIGHT_LINE, CREDIT_SECTIONS, PHOTO_CREDITS } from './legal.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(action,label,kind='',extra='')=>`<button type="button" data-action="${esc(action)}" class="${kind}" ${extra}>${esc(label)}</button>`;
const picture=(id,size=72)=>`<canvas data-item="${esc(id)}" width="${size*2}" height="${size*2}" style="width:${size}px;height:${size}px" aria-hidden="true"></canvas>`;
const starText=n=>'★'.repeat(n)+'☆'.repeat(3-n);
const count=()=>Object.keys(save.album).length;
let root=null,lastKey='',lastPage='',category='food',feedback='',skinFeedback='',pendingImport=null,lastSkinKey='';
const format=(copy,values)=>copy.replace(/\{(\w+)\}/g,(_,key)=>String(values[key]??''));
const starsSummary=()=>`${PC.total} ${totalStars(save)}/${LEVELS.length*3}`;
function continueIndex(){let i=save.lastLevel;if(i===9&&!getBridgeUnlockStatus(save).unlocked)i=8;while(i>0&&!save.cleared[i-1])i--;return i;}
const cats=[['food',MOBILE_UI.text001,MOBILE_UI.text002],['craft',MOBILE_UI.text003,MOBILE_UI.text004],['ruin',MOBILE_UI.text005,MOBILE_UI.text006],['creature',MOBILE_UI.text007,MOBILE_UI.text008]];
const page=(title,content,kicker=MOBILE_UI.text009)=>`<section class="page"><header class="page-head"><div><p class="eyebrow">${esc(kicker)}</p><h1 tabindex="-1">${esc(title)}</h1></div>${btn('back',MOBILE_UI.text010,'quiet')}</header>${content}</section>`;
const difficulty=()=>`<fieldset class="difficulty"><legend>${MOBILE_UI.text011}</legend>${['easy','standard'].map(x=>`<label><input type="radio" name="difficulty" value="${x}" ${save.difficulty===x?'checked':''}>${x==='easy'?MOBILE_UI.text012:MOBILE_UI.text013}</label>`).join('')}</fieldset>`;

function home(){
  const next=continueIndex(),label=save.journeyStarted?MOBILE_UI.text014:MOBILE_UI.text015;
  return `<section class="home"><header><p class="eyebrow">${MOBILE_UI.text016}</p><h1>${MOBILE_UI.text017}<br><span>${MOBILE_UI.text018}</span></h1><p class="home-intro">${MOBILE_UI.text019}</p></header><div class="hero-duck"><canvas data-duck width="300" height="340" aria-hidden="true"></canvas><span class="paper-tag">${MOBILE_UI.text020}</span></div><div class="home-actions">${btn('start',label,'primary large')}${save.journeyStarted?`<p class="next-place">${MOBILE_UI.text021}${esc(LEVELS[next].name)}</p>`:''}<nav class="home-nav" aria-label="${MOBILE_UI.text022}">${btn('levels',MOBILE_UI.text023,'secondary')}${btn('album',`${MOBILE_UI.text024}${count()}/40`,'secondary')}${btn('endless',MOBILE_UI.text025,'secondary')}${btn('shop',MOBILE_UI.text026,'secondary')}</nav></div><footer>${btn('settings',MOBILE_UI.text027,'text-button')}${btn('credits',MOBILE_UI.text028,'text-button')}<span>${MOBILE_UI.text029}</span></footer></section>`;
}
function levelPage(){
  const bridge=getBridgeUnlockStatus(save);
  return page(MOBILE_UI.text030,`<p class="lead">${starsSummary()}</p><p class="muted">${PC.rule}</p><p class="muted">${PC.earn}</p>${difficulty()}<ol class="level-list">${LEVELS.map((lv,i)=>{
    const open=lv.hidden?bridge.unlocked:i===0||save.cleared[i-1];
    const medals=save.medals[save.difficulty][i];
    return `<li class="level-card ${open?'':'locked'}"><span class="station">${String(i+1).padStart(2,'0')}</span><div><h2>${esc(lv.name)}</h2><p>${esc(lv.sub)}</p><small>${PC.best} ${starText(save.stars[i])}</small><p class="medal-record">${PC.medals}：${[[PC.clear,medals.clear],[PC.collect,medals.collect],[PC.skill,medals.skill]].map(([label,met])=>`${met?'✓':'○'} ${label}`).join(' · ')}</p>${!open?`<p class="lock-note">${lv.hidden?`${MOBILE_UI.text033}${bridge.starCount}/15 ${MOBILE_UI.text034}${bridge.ordinaryCount}/28 ${MOBILE_UI.text035}`:`${MOBILE_UI.text036}${esc(LEVELS[i-1].name)}${MOBILE_UI.text037}`}</p>`:''}</div>${open?btn('level:'+i,MOBILE_UI.text038,'small-button',`aria-label="${MOBILE_UI.text039}${esc(lv.name)}"`):MOBILE_UI.text040}</li>`;
  }).join('')}</ol>`);
}
function albumPage(){
  if(G.albumZoom){
    const item=ITEMS.find(x=>x.id===G.albumZoom);if(!item){G.albumZoom=null;return albumPage();}
    const owned=!!save.album[item.id];
    return page(owned||!item.secret?item.name:MOBILE_UI.text041,`<article class="item-detail">${picture(item.id,132)}<p class="item-note">${esc(owned?item.note:item.secret?item.riddle:MOBILE_UI.text042)}</p>${owned?`<blockquote>${esc(item.quip)}</blockquote><p>${esc(item.where)}</p>`:!item.secret?`<p>${MOBILE_UI.text043}${esc(LEVELS[item.home??0].name)}</p>`:''}<div class="stack">${!owned&&!item.secret?btn('track:'+item.id,save.trackedItem===item.id?MOBILE_UI.text044:MOBILE_UI.text045,'primary'):''}${!item.secret?btn('find:'+item.id,MOBILE_UI.text046,'secondary'):''}</div><p class="muted">${MOBILE_UI.text047}</p></article>`,MOBILE_UI.text048);
  }
  const list=ITEMS.filter(x=>x.cat===category);
  return page(MOBILE_UI.text048,`<p class="lead">${count()} / 40 ${MOBILE_UI.text049}</p><nav class="category-tabs" aria-label="${MOBILE_UI.text050}">${cats.map(([id,label,name])=>btn('category:'+id,label+(category===id?' · '+name:''),category===id?'selected':'',`aria-pressed="${category===id}"`)).join('')}</nav><div class="album-grid">${list.map(it=>`<button class="item-tile ${save.album[it.id]?'owned':''}" data-action="item:${it.id}">${picture(it.id)}<strong>${esc(it.secret&&!save.album[it.id]?MOBILE_UI.text051:it.name)}</strong><small>${save.album[it.id]?MOBILE_UI.text052:save.trackedItem===it.id?MOBILE_UI.text044:it.secret?MOBILE_UI.text053:esc(LEVELS[it.home??0].name)}</small></button>`).join('')}</div>`);
}
function skinChoice(){
  return `<section class="skin-choice"><h2>${PC.skinTitle}</h2><p>${PC.skinNote}</p><p>${format(PC.goldUnlock,{stars:SKINS.goldStars})}</p><p id="skin-progress"></p><div class="skin-cards">${['white','gold'].map(skin=>`<button type="button" data-action="skin:${skin}" class="skin-card" aria-pressed="false"><canvas data-duck="${skin}" width="300" height="340" aria-hidden="true"></canvas><strong>${PC.skinNames[skin]}</strong><span data-skin-status></span></button>`).join('')}</div><p id="skin-feedback" class="status" role="status"></p><p class="muted">${PC.rule}</p>${btn('levels',PC.goLevels,'secondary')}<p class="muted">${PC.local}</p></section>`;
}
function updateSkinChoice(){
  const key=JSON.stringify([effectiveSkin(save),totalStars(save),skinFeedback]);
  if(lastSkinKey===key)return;lastSkinKey=key;
  for(const button of root.querySelectorAll('.skin-card')){
    const skin=button.dataset.action.split(':')[1],selected=effectiveSkin(save)===skin,open=skinUnlocked(save,skin);
    button.disabled=!open;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));
    button.querySelector('[data-skin-status]').textContent=selected?PC.using:open?PC.use:PC.locked;
  }
  set('skin-progress',skinUnlocked(save,'gold')?`${PC.unlocked} · ${starsSummary()}`:format(PC.progress,{total:totalStars(save),stars:SKINS.goldStars}));
  set('skin-feedback',skinFeedback);
}
function shopPage(){
  return page(MOBILE_UI.text054,`<p class="balance">${save.coins} <span>${MOBILE_UI.text055}</span></p><p class="status" role="status">${esc(feedback)}</p><div class="shop-list">${SHOPS.map((shop,i)=>{
    const n=save.ups[shop.id],max=n>=3;
    return `<article class="shop-card"><div><p class="eyebrow">${esc(shop.line)}</p><h2>${esc(shop.name)}</h2><p>${esc(shop.note)}</p><p class="upgrade-preview">${esc(shop.levels[n])}${max?MOBILE_UI.text056:' → '+esc(shop.levels[n+1])}</p></div>${max?MOBILE_UI.text057:btn('buy:'+i,`${shop.price[n]} ${MOBILE_UI.text058}`,'secondary')}</article>`;
  }).join('')}</div>${skinChoice()}`);
}
function settingsPage(){
  return page(MOBILE_UI.text064,`${difficulty()}<section class="settings-block"><h2>${MOBILE_UI.text065}</h2>${[['music',MOBILE_UI.text066],['effects',MOBILE_UI.text067],['voice',MOBILE_UI.text068]].map(([key,label])=>`<label class="volume">${label}<input aria-label="${label}${MOBILE_UI.text069}" type="range" min="0" max="100" value="${Math.round(save.volumes[key]*100)}" data-volume="${key}"><output>${Math.round(save.volumes[key]*100)}%</output></label>`).join('')}${btn('mute',save.muted?MOBILE_UI.text070:MOBILE_UI.text071,'secondary')}</section><section class="settings-block"><h2>${MOBILE_UI.text072}</h2><label>${MOBILE_UI.text073}<select name="motion" aria-label="${MOBILE_UI.text073}">${[['system',MOBILE_UI.text074],['reduced',MOBILE_UI.text075],['full',MOBILE_UI.text076]].map(([v,label])=>`<option value="${v}" ${save.motion===v?'selected':''}>${label}</option>`).join('')}</select></label></section><section class="settings-block"><h2>${MOBILE_UI.text077}</h2><p>${MOBILE_UI.text078}</p><div class="two-actions">${btn('export',MOBILE_UI.text079,'secondary')}${btn('import',MOBILE_UI.text080,'secondary')}</div><input id="save-file" type="file" accept="application/json,.json" hidden>${pendingImport?`<div class="import-preview"><p>${MOBILE_UI.text081}${Object.keys(pendingImport.album).length} ${MOBILE_UI.text082}${pendingImport.coins} ${MOBILE_UI.text083}</p>${btn('confirmImport',MOBILE_UI.text084,'primary')}${btn('cancelImport',MOBILE_UI.text085,'secondary')}</div>`:''}<p role="status" class="status">${esc(feedback||saveError)}</p></section>${btn('tutorial',MOBILE_UI.text086,'secondary')}`);
}
function creditsPage(){
  return page(MOBILE_UI.text028,`<p class="lead">${esc(COPYRIGHT_LINE)}</p>${CREDIT_SECTIONS.map(s=>`<section class="settings-block"><h2>${esc(s.title)}</h2>${s.lines.map(l=>`<p>${esc(l)}</p>`).join('')}</section>`).join('')}<details><summary>${MOBILE_UI.text087}</summary><p>${MOBILE_UI.text088}</p>${PHOTO_CREDITS.map(([id,name,author,license])=>`<p>${esc(name)} · ${esc(author)} · ${esc(license)}</p>`).join('')}</details><p>${MOBILE_UI.text089}<a href="${document.querySelector('meta[name=duckduckrun-build]')?.content!=='__BUILD_ID__'?new URL('../legal/LICENSE.md',import.meta.url).href:new URL('../LICENSE.md',import.meta.url).href}">${MOBILE_UI.text090}</a> · <a href="https://github.com/mckf111" target="_blank" rel="noopener noreferrer">${MOBILE_UI.text091}</a></p>`);
}
function outcome(){
  const clear=G.state==='clear',lv=curLv(),bridge=getBridgeUnlockStatus(save);
  const next=G.lvIdx<9&&(!LEVELS[G.lvIdx+1].hidden||bridge.unlocked);
  const goals=G.scripted?[[G.benchmark?MOBILE_UI.text092:JOURNEY_COPY.clearGoal,clear],[MOBILE_UI.text093+G.plan.collectTarget+MOBILE_UI.text094,G.runMarks>=G.plan.collectTarget],[MOBILE_UI.text095,G.skills.length>=2]]:[];
  return page(clear?(G.plan?.clearTitle||MOBILE_UI.text096):G.crashLine||MOBILE_UI.text097,`<div class="result-summary"><p>${esc(lv.name)} · ${Math.floor(G.dist)} ${MOBILE_UI.text098}</p><strong>${G.mode==='slice'?G.slice.tokenCount:G.runMarks}<span>${G.mode==='slice'?MOBILE_UI.text099:MOBILE_UI.text094}</span></strong>${clear?`<p>${PC.current}</p><p class="result-stars">${starText(G.runStars)}</p>`:`<p>${esc(getObstacleInstruction(G.killedBy,true))}</p><p class="muted">${MOBILE_UI.text100}</p><p>${PC.failed}</p>`}${G.mode==='adv'?`<p>${PC.levelBest} ${starText(save.stars[G.lvIdx])}</p><p>${starsSummary()}</p>`:''}</div>${goals.length?`<ul class="goal-list">${goals.map(([label,met])=>`<li class="${clear&&met?'met':''}">${clear&&met?MOBILE_UI.text101:MOBILE_UI.text102} · ${esc(label)}</li>`).join('')}</ul>`:''}${G.newIds.length?`<section class="rewards"><h2>${MOBILE_UI.text103}</h2>${G.newIds.map(id=>{const it=ITEMS.find(x=>x.id===id);return `<div>${picture(id,42)}<span>${esc(it.name)}${it.secret?MOBILE_UI.text104:''}</span></div>`;}).join('')}</section>`:''}<div class="result-actions">${btn('retry',clear?MOBILE_UI.text105:MOBILE_UI.text106,'primary large')}${clear&&G.mode==='adv'&&next?btn('next',MOBILE_UI.text021+LEVELS[G.lvIdx+1].name,'secondary'):''}${btn('share',MOBILE_UI.text107,'secondary')}${btn('quit',MOBILE_UI.text108,'text-button')}</div>`,MOBILE_UI.text109);
}
function playUI(){
  return `<div class="hud"><div class="hud-top"><div class="run-location"><span class="eyebrow" id="run-mode"></span><strong id="run-place"></strong><progress id="run-progress" max="1" value="0" aria-label="${MOBILE_UI.text110}"></progress></div>${btn('pause',MOBILE_UI.text111,'hud-button')}</div><div class="run-stats"><span id="run-eggs"></span><span id="run-skills"></span><span id="run-power"></span></div><div id="run-notice" class="run-notice" role="status"></div><div class="run-cue" id="run-cue"></div></div>${G.paused?`<section class="pause-dialog" role="dialog" aria-modal="true" aria-labelledby="pause-title"><p class="eyebrow">${MOBILE_UI.text112}</p><h1 id="pause-title">${MOBILE_UI.text113}</h1><div class="stack">${btn('resume',MOBILE_UI.text114,'primary')}${G.tutorial?btn('practice',MOBILE_UI.text115,'secondary'):''}${btn('retry',MOBILE_UI.text116,'secondary')}${btn('quit',MOBILE_UI.text108,'text-button')}</div></section>`:''}<div id="resume-count" class="resume-count" hidden><span></span>${btn('skipResume',MOBILE_UI.text117,'secondary')}</div>`;
}
const set=(id,value)=>{const el=root.querySelector('#'+id);if(el&&el.textContent!==value)el.textContent=value;};
function paintIllustrations(){
  for(const canvas of root.querySelectorAll('canvas[data-item]')){
    const c=canvas.getContext('2d');withDrawingContext(c,()=>drawItemIcon(canvas.dataset.item,canvas.width/2,canvas.height/2,canvas.width*.32,false));
  }
  paintDucks();
}
function paintDucks(){
  for(const canvas of root.querySelectorAll('canvas[data-duck]')){
    const skin=canvas.dataset.duck||effectiveSkin(save),loaded=!!getSprite('bookDuck'),key=skin+':'+loaded;
    if(canvas.dataset.paint===key)continue;
    const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);
    drawBookDuck(c,150,280,205,{t:1,gold:skin==='gold'});canvas.dataset.paint=key;
  }
}
export function renderDomUI(){
  if(!root)return;
  paintDucks();
  const playing=G.state==='play'||G.state==='crashing';
  const key=playing?'':JSON.stringify([G.state,G.paused,G.albumZoom,category,save.coins,save.trackedItem,save.muted,save.difficulty,save.motion,save.ups,save.album,G.state==='shop'?null:save.stars,feedback,!!pendingImport]);
  // 局内只更新文本，不按鸭蛋数量替换 DOM，保证触控和焦点稳定。
  const stateKey=playing?G.state+':'+G.paused:key;
  if(lastKey!==stateKey){
    const changedPage=lastPage!==G.state;lastPage=G.state;lastKey=stateKey;lastSkinKey='';
    const focusAction=document.activeElement?.dataset?.action;
    root.className=playing?'in-game':'in-page';
    root.innerHTML=playing?playUI():G.state==='menu'?home():G.state==='levels'?levelPage():G.state==='album'?albumPage():G.state==='shop'?shopPage():G.state==='settings'?settingsPage():G.state==='credits'?creditsPage():outcome();
    paintIllustrations();
    if(G.paused)root.querySelector('[data-action="resume"]')?.focus({preventScroll:true});
    else if(!playing&&changedPage)root.querySelector('h1')?.focus({preventScroll:true});
    else if(focusAction){[...root.querySelectorAll('[data-action]')].find(el=>el.dataset.action===focusAction)?.focus({preventScroll:true});}
  }
  if(G.state==='shop')updateSkinChoice();
  if(playing){
    const lv=curLv();set('run-place',lv.name);set('run-mode',G.mode==='endless'?MOBILE_UI.text118:G.difficulty==='easy'?MOBILE_UI.text119+G.rescues+MOBILE_UI.text120:MOBILE_UI.text121+(G.lvIdx+1)+MOBILE_UI.text122);
    const progress=root.querySelector('#run-progress');progress.value=G.mode==='endless'?(G.dist%600)/600:G.dist/lv.len;
    set('run-eggs',G.runMarks+(G.scripted?'/'+G.plan.collectTarget:'')+MOBILE_UI.text123);set('run-skills',G.scripted?(G.plan.lightGates?JOURNEY_COPY.gate+' '+G.gatesPassed+'/6 · ':'')+MOBILE_UI.text124+G.skills.length+'/2':Math.floor(G.dist)+MOBILE_UI.text125);
    set('run-power',G.shield?MOBILE_UI.text126:G.powerT.magnet>0?MOBILE_UI.text127+Math.ceil(G.powerT.magnet)+MOBILE_UI.text128:G.powerT.gui>0?MOBILE_UI.text129+Math.ceil(G.powerT.gui)+MOBILE_UI.text128:'');
    set('run-notice',saveError||G.egg?.text||'');
    const cue=G.tutorial?`${MOBILE_UI.text130}${G.tutorial.step+1}/3 · ${G.tutorial.tip}`:G.scripted?benchmarkBeat().cue:G.t<5?MOBILE_UI.text131:'';
    set('run-cue',cue);
    const countdown=root.querySelector('#resume-count');countdown.hidden=G.resumeIn<=0;countdown.querySelector('span').textContent=String(Math.ceil(G.resumeIn));
  }
}
function go(state){G.state=state;G.albumZoom=null;feedback='';skinFeedback='';pendingImport=null;}
function start(index,force=false){
  G.albumZoom=null;feedback='';startRun('adv',index,force);document.querySelector('#cv')?.focus({preventScroll:true});
}
function exportSave(){
  flushSave();const blob=new Blob([JSON.stringify({format:'jinling-save',exportedAt:new Date().toISOString(),data:save},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=MOBILE_UI.text132;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  feedback=MOBILE_UI.text133;
}
function handle(action){
  const [id,value]=action.split(':');unlockAudio();sfx.click();
  if(['levels','album','shop','settings','credits'].includes(id))go(id);
  else if(id==='start')start(continueIndex());
  else if(id==='level')start(Number(value));
  else if(id==='endless')startRun('endless',0);
  else if(id==='back'){if(G.albumZoom)G.albumZoom=null;else go('menu');}
  else if(id==='quit'){pauseRun();suspendAudio();go('menu');}
  else if(id==='pause')pauseRun();
  else if(id==='resume')resumeRun();
  else if(id==='skipResume')resumeRun(true);
  else if(id==='practice'){retryCurrentTutorial();resumeRun();}
  else if(id==='retry')startRun(G.mode,G.lvIdx);
  else if(id==='next')nextAfterClear();
  else if(id==='tutorial')start(0,true);
  else if(id==='item')G.albumZoom=value;
  else if(id==='category'){category=value;G.albumZoom=null;}
  else if(id==='track'){save.trackedItem=value;persist();}
  else if(id==='find'){
    const it=ITEMS.find(x=>x.id===value),index=it?.home??0;
    if(index>0&&!save.cleared[index-1])go('levels');else start(index);
  }
  else if(id==='buy'){
    const shop=SHOPS[Number(value)],level=save.ups[shop.id];
    if(level<3&&save.coins>=shop.price[level]){save.coins-=shop.price[level];save.ups[shop.id]++;persist();feedback=shop.name+MOBILE_UI.text134+shop.levels[level+1];sfx.gate();}
    else feedback=MOBILE_UI.text135+Math.max(0,shop.price[level]-save.coins)+MOBILE_UI.text136;
  }
  else if(id==='skin'&&skinUnlocked(save,value)){
    save.selectedSkin=value;
    skinFeedback=persist()?format(PC.saved,{skin:PC.skinNames[value]}):PC.saveFailed;
  }
  else if(id==='mute'){save.muted=!save.muted;persist();syncVolumes();}
  else if(id==='share')shareScore();
  else if(id==='export')exportSave();
  else if(id==='import')root.querySelector('#save-file').click();
  else if(id==='confirmImport'&&pendingImport){if(replaceSave(pendingImport)){pendingImport=null;feedback=MOBILE_UI.text137;syncVolumes();}else feedback=saveError;}
  else if(id==='cancelImport')pendingImport=null;
  renderDomUI();
}
const onClick=e=>{const button=e.target.closest('[data-action]');if(button&&!button.disabled)handle(button.dataset.action);};
const onInput=e=>{
  const key=e.target.dataset.volume;if(!key)return;
  save.volumes[key]=Number(e.target.value)/100;save.muted=false;persist();syncVolumes();e.target.nextElementSibling.textContent=e.target.value+'%';
};
const onChange=async e=>{
  if(e.target.name==='difficulty'){save.difficulty=e.target.value;persist();}
  else if(e.target.name==='motion'){save.motion=e.target.value;persist();}
  else if(e.target.id==='save-file'){
    try{const file=e.target.files[0];if(!file)return;if(file.size>65536)throw new Error(MOBILE_UI.text138);pendingImport=parseSaveImport(await file.text());feedback=MOBILE_UI.text139;}
    catch(error){pendingImport=null;feedback=error.message==='Unexpected token'?MOBILE_UI.text140:error.message;}
  }
  renderDomUI();
};
const onKey=e=>{
  const dialog=root.querySelector('[aria-modal="true"]');if(!dialog||e.key!=='Tab')return;
  const buttons=[...dialog.querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
};
export function mountDomUI(){
  root=document.getElementById('app-ui');lastKey='';lastPage='';lastSkinKey='';
  root.addEventListener('click',onClick);root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('keydown',onKey);renderDomUI();
}
export function disposeDomUI(){
  if(!root)return;root.removeEventListener('click',onClick);root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('keydown',onKey);root.replaceChildren();root=null;lastKey='';
}
