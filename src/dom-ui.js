import { G, startRun, curLv, nextAfterClear, pauseRun, resumeRun, retryCurrentTutorial, benchmarkBeat, onPauseKey, skipTutorial } from './game.js';
import { save, persist, flushSave, replaceSave, saveError } from './save.js';
import { LEVELS, ITEMS, SHOPS, MOBILE, MOBILE_UI, JOURNEY_COPY, SKINS, PROGRESS_COPY as PC, PHOTO_COPY as PH, EXPERIENCE, EXPERIENCE_COPY as EC, TUTORIAL_COPY as TC, buildJourneyPlan } from './config.js';
import { getBridgeUnlockStatus, getObstacleInstruction, parseSaveImport, totalStars, skinUnlocked, effectiveSkin } from './rules.js';
import { unlockAudio, syncVolumes, sfx, suspendAudio } from './audio.js';
import { shareScore } from './share.js';
import { withDrawingContext } from './core.js';
import { drawItemIcon } from './art/items.js';
import { drawBookDuck } from './art/book.js';
import { getSprite } from './art/sprites.js';
import { COPYRIGHT_LINE, CREDIT_SECTIONS } from './legal.js';
import { ALBUM_PHOTOS } from './album-photos.js';
import { assetUrl } from './asset-url.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(action,label,kind='',extra='')=>`<button type="button" data-action="${esc(action)}" class="${kind}" ${extra}>${esc(label)}</button>`;
const picture=(id,size=72)=>`<canvas data-item="${esc(id)}" width="${size*2}" height="${size*2}" style="width:${size}px;height:${size}px" aria-hidden="true"></canvas>`;
const starText=n=>'★'.repeat(n)+'☆'.repeat(3-n);
const count=()=>Object.keys(save.album).length;
let root=null,lastKey='',lastPage='',category='food',feedback='',skinFeedback='',pendingImport=null,lastSkinKey='',missingOnly=false;
const format=(copy,values)=>copy.replace(/\{(\w+)\}/g,(_,key)=>String(values[key]??''));
const starsSummary=()=>`${PC.total} ${totalStars(save)}/${LEVELS.length*3}`;
const external=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${esc(label)}</a>`;
const photoCredit=photo=>`<p class="photo-credit">${esc(photo.author)} · ${external(photo.sourceUrl,PH.source)} · ${external(photo.licenseUrl,photo.license)}</p>`;
function itemPhoto(item){
  const photo=ALBUM_PHOTOS[item.id];
  if(!photo?.file)return `<section class="photo-missing"><p>${PH.missing}</p></section>`;
  return `<figure class="item-photo" data-photo="${item.id}"><button type="button" class="photo-open" data-action="photo:${item.id}" aria-label="${esc(item.name)} · ${PH.enlarge}" disabled><img src="${esc(assetUrl(photo.file))}" alt="${esc(photo.caption)}" width="${photo.width}" height="${photo.height}" decoding="async" referrerpolicy="no-referrer"></button><p data-photo-status role="status">${PH.loading}</p><button type="button" data-action="retryPhoto:${item.id}" class="secondary" hidden>${PH.retry}</button><figcaption><strong>${PH[photo.kind]}</strong><p>${esc(photo.caption)}</p>${photoCredit(photo)}</figcaption></figure>`;
}
function closePhoto(){
  const dialog=root?.querySelector('.photo-dialog');
  if(dialog){dialog.close();dialog.remove();}
}
function openPhoto(id){
  const photo=ALBUM_PHOTOS[id],item=ITEMS.find(it=>it.id===id);
  if(!item||!photo?.file||!save.album[id]||G.albumZoom!==id)return;
  const loaded=root.querySelector('.item-photo img');if(!loaded?.complete||!loaded.naturalWidth)return;
  closePhoto();const dialog=document.createElement('dialog');dialog.className='photo-dialog';
  dialog.setAttribute('aria-label',item.name+' · '+PH.enlarge);
  dialog.innerHTML=`<div class="photo-dialog-head"><strong>${esc(item.name)} · ${PH[photo.kind]}</strong>${btn('closePhoto',PH.close,'quiet')}</div><img src="${esc(loaded.currentSrc||loaded.src)}" alt="${esc(photo.caption)}" width="${photo.width}" height="${photo.height}" referrerpolicy="no-referrer"><p>${esc(photo.caption)}</p>${photoCredit(photo)}`;
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});root.append(dialog);dialog.showModal();
}
function continueIndex(){let i=save.lastLevel;if(i===9&&!getBridgeUnlockStatus(save).unlocked)i=8;while(i>0&&!save.cleared[i-1])i--;return i;}
const cats=[['food',MOBILE_UI.text001,MOBILE_UI.text002],['craft',MOBILE_UI.text003,MOBILE_UI.text004],['ruin',MOBILE_UI.text005,MOBILE_UI.text006],['creature',MOBILE_UI.text007,MOBILE_UI.text008]];
const page=(title,content,kicker=MOBILE_UI.text009)=>`<section class="page"><header class="page-head"><div><p class="eyebrow">${esc(kicker)}</p><h1 tabindex="-1">${esc(title)}</h1></div>${btn('back',MOBILE_UI.text010,'quiet')}</header>${content}</section>`;
const modeName=()=>EC.modes[save.difficulty];
const difficulty=()=>`<fieldset class="difficulty"><legend>${EC.difficulty}</legend>${['standard','easy'].map(x=>`<label class="${save.difficulty===x?'chosen':''}"><input type="radio" name="difficulty" value="${x}" ${save.difficulty===x?'checked':''}>${EC.modes[x]}</label>`).join('')}<p class="mode-description">${EC.descriptions[save.difficulty]}</p></fieldset>`;
function skillGuide(plan,index,live=false){
 return `<details class="skill-guide"><summary>${EC.skillHelp} · ${esc(LEVELS[index].name)}</summary><h3>${format(EC.skillTitle,{level:esc(LEVELS[index].name)})}</h3><p>${EC.skillExplain}</p><p>${EC.skillMarker}</p><p>${EC.skillLaneHelp}</p><ol>${plan.skills.map(skill=>`<li data-skill="${skill.id}"><strong>${esc(skill.name)}</strong><p class="skill-actions">${EC.skillAction}：${skill.steps.map((step,i)=>`${i+1}. ${EC.actions[step.action]}`).join(' → ')}</p>${live?`<p class="skill-lanes">${EC.skillRoute}：${skill.steps.map((step,i)=>`${i+1}. ${EC.lanes[step.lane+1]}道`).join(' → ')}</p>`:''}</li>`).join('')}</ol><p>${live?'':EC.skillPreview}</p><p>${EC.skillFailure}</p><p>${EC.skillOptional}</p><p>${EC.starHelp}</p><p>${EC.starRule}</p></details>`;
}
function goalCard(plan,index,live=false){
 return `<section class="run-goals"><strong>${EC.target} · ${esc(LEVELS[index].name)}</strong><p>${format(EC.goals,{eggs:plan.collectTarget})}</p>${skillGuide(plan,index,live)}</section>`;
}
function bridgeCard(){
 const b=getBridgeUnlockStatus(save),completed=save.cleared.slice(0,9).filter(Boolean).length;
 const rows=[[EC.cleared,completed,9,EC.needLevels],[EC.stars,b.starCount,15,EC.needStars],[EC.ordinary,b.ordinaryCount,28,EC.needItems]];
 return `<section class="bridge-progress"><h2>${EC.bridge}</h2><p>${b.unlocked?EC.bridgeOpen:EC.allRequired}</p><ul class="goal-list">${rows.map(([label,n,target,copy])=>`<li class="${n>=target?'met':''}">${n>=target?'✓':'○'} ${label} ${n}／${target}${n<target?' · '+format(copy,{n:target-n}):''}</li>`).join('')}</ul><p class="muted">${EC.ordinaryNote}</p>${!b.unlocked?`<div class="two-actions">${btn('earnStars',EC.goStars,'secondary')}${btn('missing',EC.goItems,'secondary')}</div>`:''}</section>`;
}
function resultGoals(clear){
 if(!G.scripted)return '';
 const n=new Set(G.skills).size;
 return `<ul class="goal-list"><li class="${clear?'met':''}">${clear?'✓':'○'} ${EC.clear} · ${clear?EC.gain:PC.failed}</li>${[[EC.eggs,G.runMarks,G.plan.collectTarget,EC.eggsUnit],[EC.skills,n,2,EC.skillUnit]].map(([label,count,target,unit])=>{
   const met=count>=target;return `<li class="${met&&clear?'met':''}">${met?'✓':'○'} ${label} ${count}／${target} · ${met?(clear?EC.achieved+' · '+EC.gain:EC.notCleared):format(EC.remaining,{n:target-count,unit})}</li>`;
 }).join('')}</ul><p class="muted">${EC.starHelp}</p>`;
}

function home(){
  const next=continueIndex(),label=save.journeyStarted?MOBILE_UI.text014:EC.start;
  return `<section class="home"><header><p class="eyebrow">${MOBILE_UI.text016}</p><h1>${MOBILE_UI.text017}<br><span>${MOBILE_UI.text018}</span></h1><p class="home-intro">${MOBILE_UI.text019}</p></header><div class="hero-duck"><canvas data-duck width="300" height="340" aria-hidden="true"></canvas><span class="paper-tag">${MOBILE_UI.text020}</span></div><div class="home-actions">${difficulty()}<p class="next-place">${MOBILE_UI.text021}${esc(LEVELS[next].name)}</p>${goalCard(buildJourneyPlan(next),next)}${btn('start',label+' · '+modeName(),'primary large')}<nav class="home-nav" aria-label="${MOBILE_UI.text022}">${btn('levels',MOBILE_UI.text023,'secondary')}${btn('album',`${MOBILE_UI.text024}${count()}/40`,'secondary')}${btn('endless',MOBILE_UI.text025,'secondary')}${btn('shop',MOBILE_UI.text026,'secondary')}</nav></div><footer>${btn('settings',MOBILE_UI.text027,'text-button')}${btn('credits',MOBILE_UI.text028,'text-button')}<span>${MOBILE_UI.text029}</span></footer></section>`;
}
function levelPage(){
  const bridge=getBridgeUnlockStatus(save);
  return page(MOBILE_UI.text030,`<p class="lead">${starsSummary()}</p><p class="muted">${PC.rule}</p><p class="muted">${EC.starHelp}</p><p class="muted">${EC.starRule}</p>${difficulty()}<ol class="level-list">${LEVELS.map((lv,i)=>{
    const open=lv.hidden?bridge.unlocked:i===0||save.cleared[i-1];
    const medals=save.medals[save.difficulty][i];
    return `<li class="level-card ${open?'':'locked'}"><span class="station">${String(i+1).padStart(2,'0')}</span><div><h2>${esc(lv.name)}</h2><p>${esc(EXPERIENCE.challenges[i])}</p><p>${format(EC.levelTarget,{eggs:MOBILE.collectTargets[i]})}</p>${skillGuide(buildJourneyPlan(i),i)}<small>${PC.best} ${starText(save.stars[i])}</small><p class="medal-record">${PC.medals}：${[[PC.clear,medals.clear],[PC.collect,medals.collect],[PC.skill,medals.skill]].map(([label,met])=>`${met?'✓':'○'} ${label}`).join(' · ')}</p>${!open?`<p class="lock-note">${lv.hidden?EC.allRequired:`${MOBILE_UI.text036}${esc(LEVELS[i-1].name)}${MOBILE_UI.text037}`}</p>`:''}</div>${open?btn('level:'+i,MOBILE_UI.text038,'small-button',`aria-label="${MOBILE_UI.text039}${esc(lv.name)}"`):MOBILE_UI.text040}</li>`;
  }).join('')}</ol>${bridgeCard()}`);
}
function albumPage(){
  if(G.albumZoom){
    const item=ITEMS.find(x=>x.id===G.albumZoom);if(!item){G.albumZoom=null;return albumPage();}
    const owned=!!save.album[item.id];
    return page(owned||!item.secret?item.name:MOBILE_UI.text041,`<article class="item-detail"><div class="item-visuals"><div>${picture(item.id,132)}</div>${owned?itemPhoto(item):''}</div><p class="item-note">${esc(owned?item.note:item.secret?item.riddle:MOBILE_UI.text042)}</p>${owned?`<blockquote>${esc(item.quip)}</blockquote><p>${esc(item.where)}</p>`:!item.secret?`<p>${MOBILE_UI.text043}${esc(LEVELS[item.home??0].name)}</p>`:''}<div class="stack">${!owned&&!item.secret?btn('track:'+item.id,save.trackedItem===item.id?MOBILE_UI.text044:MOBILE_UI.text045,'primary'):''}${!item.secret?btn('find:'+item.id,MOBILE_UI.text046,'secondary'):''}</div><p class="muted">${MOBILE_UI.text047}</p></article>`,MOBILE_UI.text048);
  }
  const list=ITEMS.filter(x=>missingOnly?!x.secret&&!save.album[x.id]:x.cat===category);
  return page(MOBILE_UI.text048,`<p class="lead">${count()} / 40 ${MOBILE_UI.text049}</p>${missingOnly?`<h2>${EC.missing}</h2>${!list.length?`<p>${EC.rewardDone}</p>`:''}${btn('allItems',EC.allItems,'secondary')}`:''}<nav class="category-tabs" aria-label="${MOBILE_UI.text050}">${cats.map(([id,label,name])=>btn('category:'+id,label+(category===id?' · '+name:''),category===id?'selected':'',`aria-pressed="${category===id}"`)).join('')}</nav><div class="album-grid">${list.map(it=>`<button class="item-tile ${save.album[it.id]?'owned':''}" data-action="item:${it.id}">${picture(it.id)}<strong>${esc(it.secret&&!save.album[it.id]?MOBILE_UI.text051:it.name)}</strong><small>${save.album[it.id]?MOBILE_UI.text052:save.trackedItem===it.id?MOBILE_UI.text044:it.secret?MOBILE_UI.text053:esc(LEVELS[it.home??0].name)}</small></button>`).join('')}</div>`);
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
  return page(MOBILE_UI.text028,`<p class="lead">${esc(COPYRIGHT_LINE)}</p>${CREDIT_SECTIONS.map(s=>`<section class="settings-block"><h2>${esc(s.title)}</h2>${s.lines.map(l=>`<p>${esc(l)}</p>`).join('')}</section>`).join('')}<details><summary>${MOBILE_UI.text087}</summary><p>${MOBILE_UI.text088}</p>${Object.entries(ALBUM_PHOTOS).filter(([,photo])=>photo.file).map(([id,photo])=>`<section class="photo-license"><h3>${esc(ITEMS.find(it=>it.id===id).name)} · ${PH[photo.kind]}</h3><p>${esc(photo.caption)}</p>${photoCredit(photo)}<p>${PH.changes}：${esc(photo.changes)}</p></section>`).join('')}</details><p>${MOBILE_UI.text089}<a href="${document.querySelector('meta[name=duckduckrun-build]')?.content!=='__BUILD_ID__'?new URL('../legal/LICENSE.md',import.meta.url).href:new URL('../LICENSE.md',import.meta.url).href}">${MOBILE_UI.text090}</a> · <a href="${document.querySelector('meta[name=duckduckrun-build]')?.content!=='__BUILD_ID__'?new URL('../legal/PHOTO-CREDITS.md',import.meta.url).href:new URL('../assets/album/CREDITS.md',import.meta.url).href}">${PH.record}</a> · <a href="https://github.com/mckf111" target="_blank" rel="noopener noreferrer">${MOBILE_UI.text091}</a></p>`);
}
function outcome(){
  const clear=G.state==='clear',lv=curLv(),bridge=getBridgeUnlockStatus(save);
  const next=G.lvIdx<9&&(!LEVELS[G.lvIdx+1].hidden||bridge.unlocked);

  return page(clear?(G.plan?.clearTitle||MOBILE_UI.text096):G.crashLine||MOBILE_UI.text097,`<div class="result-summary"><p>${esc(lv.name)} · ${Math.floor(G.dist)} ${MOBILE_UI.text098}</p><strong>${G.mode==='slice'?G.slice.tokenCount:G.runMarks}<span>${G.mode==='slice'?MOBILE_UI.text099:MOBILE_UI.text094}</span></strong>${clear?`<p>${PC.current}</p><p class="result-stars">${starText(G.runStars)}</p>`:`<p>${esc(getObstacleInstruction(G.killedBy,true))}</p><p class="muted">${MOBILE_UI.text100}</p><p>${PC.failed}</p>`}${G.mode==='adv'?`<p>${PC.levelBest} ${starText(save.stars[G.lvIdx])}</p><p>${starsSummary()}</p>`:''}</div>${resultGoals(clear)}${G.mode==='adv'&&G.lvIdx===8?bridgeCard():''}${G.newIds.length?`<section class="rewards"><h2>${MOBILE_UI.text103}</h2>${G.newIds.map(id=>{const it=ITEMS.find(x=>x.id===id);return `<button type="button" class="reward-item" data-action="reward:${id}">${picture(id,42)}<span>${esc(it.name)}${it.secret?MOBILE_UI.text104:''}</span><small>${EC.viewItem}</small></button>`;}).join('')}</section>`:''}<div class="result-actions">${btn('retry',clear?MOBILE_UI.text105:MOBILE_UI.text106,'primary large')}${clear&&G.mode==='adv'&&next?btn('next',MOBILE_UI.text021+LEVELS[G.lvIdx+1].name,'secondary'):''}${btn('share',MOBILE_UI.text107,'secondary')}${btn('quit',MOBILE_UI.text108,'text-button')}</div>`,MOBILE_UI.text109);
}
function pausePanel(){
 const training=G.tutorial,failed=training?.retryPending;
 return `<section class="pause-dialog" role="dialog" aria-modal="true" aria-labelledby="pause-title"><p class="eyebrow">${training?TC.title:MOBILE_UI.text112}</p><h1 id="pause-title">${failed?TC.retryTitle:MOBILE_UI.text113}</h1>${training?`<p>${esc(training.tip)}</p><p class="muted">${failed?TC.retryNote:TC.note}</p>`:G.scripted?goalCard(G.plan,G.lvIdx,true):''}<div class="stack">${failed?'':btn('resume',MOBILE_UI.text114,'primary')}${training?btn('practice',TC.retry,failed?'primary':'secondary'):btn('retry',MOBILE_UI.text116,'secondary')}${training?btn('skipTutorial',TC.skip,'secondary'):''}${btn('quit',MOBILE_UI.text108,'text-button')}</div></section>`;
}
function playUI(){
  return `<div class="hud"><div class="hud-top"><div class="run-location"><span class="eyebrow" id="run-mode"></span><strong id="run-place"></strong><progress id="run-progress" max="1" value="0" aria-label="${MOBILE_UI.text110}"></progress></div>${btn('pause',MOBILE_UI.text111,'hud-button')}</div><div class="run-stats"><span id="run-eggs"></span><span id="run-skills"></span><span id="run-power"></span></div><div id="run-notice" class="run-notice" role="status"></div><div class="run-cue" id="run-cue"></div></div>${G.paused?pausePanel():''}<div id="resume-count" class="resume-count" hidden><span></span>${btn('skipResume',MOBILE_UI.text117,'secondary')}</div>`;
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
  const key=playing?'':JSON.stringify([G.state,G.paused,G.albumZoom,category,missingOnly,save.coins,save.trackedItem,save.muted,save.difficulty,save.motion,save.ups,save.album,G.state==='shop'?null:save.stars,feedback,!!pendingImport]);
  // 局内只更新文本，不按鸭蛋数量替换 DOM，保证触控和焦点稳定。
  const stateKey=playing?G.state+':'+G.paused+(G.paused?':'+JSON.stringify([G.mode,G.lvIdx,G.plan?.variant,G.tutorial?.step,G.tutorial?.retryPending]):''):key;
  if(lastKey!==stateKey){
    const changedPage=lastPage!==G.state;lastPage=G.state;lastKey=stateKey;lastSkinKey='';
    const focusAction=document.activeElement?.dataset?.action;
    const focusMode=document.activeElement?.name==='difficulty'?document.activeElement.value:null;
    root.className=playing?'in-game':'in-page';
    root.innerHTML=playing?playUI():G.state==='menu'?home():G.state==='levels'?levelPage():G.state==='album'?albumPage():G.state==='shop'?shopPage():G.state==='settings'?settingsPage():G.state==='credits'?creditsPage():outcome();
    paintIllustrations();
    for(const img of root.querySelectorAll('.item-photo img'))if(img.complete)updatePhotoState(img);
    if(G.paused)root.querySelector(G.tutorial?.retryPending?'[data-action="practice"]':'[data-action="resume"]')?.focus({preventScroll:true});
    else if(!playing&&changedPage)root.querySelector('h1')?.focus({preventScroll:true});
    else if(focusMode)root.querySelector(`input[name="difficulty"][value="${focusMode}"]`)?.focus({preventScroll:true});
    else if(focusAction){[...root.querySelectorAll('[data-action]')].find(el=>el.dataset.action===focusAction)?.focus({preventScroll:true});}
  }
  if(G.albumReturn&&G.state===G.albumReturn.state){const previous=G.albumReturn;G.albumReturn=null;root.scrollTop=previous.scroll;root.querySelector(`[data-action="reward:${previous.item}"]`)?.focus({preventScroll:true});}
  if(G.state==='album'&&G.albumReturn){const back=root.querySelector('[data-action="back"]');if(back)back.textContent=EC.returnResult;}
  if(G.state==='levels'&&G.levelFocus!==null){const card=root.querySelectorAll('.level-card')[G.levelFocus];G.levelFocus=null;card?.scrollIntoView({block:'center'});card?.querySelector('button')?.focus({preventScroll:true});}
  if(G.state==='shop')updateSkinChoice();
  if(playing){
    const lv=curLv();set('run-place',G.tutorial?TC.beforeLevel:lv.name);set('run-mode',G.tutorial?TC.title:G.mode==='endless'?MOBILE_UI.text118:G.difficulty==='easy'?MOBILE_UI.text119+G.rescues+MOBILE_UI.text120:MOBILE_UI.text121+(G.lvIdx+1)+MOBILE_UI.text122);
    const progress=root.querySelector('#run-progress');progress.value=G.tutorial?G.tutorial.step/(G.benchmark?3:4):G.mode==='endless'?(G.dist%600)/600:G.dist/lv.len;
    set('run-eggs',G.tutorial?format(TC.step,{step:G.tutorial.step+1,total:G.benchmark?3:4}):EC.eggs+' '+G.runMarks+(G.scripted?'/'+G.plan.collectTarget:''));
    set('run-skills',G.tutorial?'':G.scripted?(G.plan.lightGates?JOURNEY_COPY.gate+' '+G.gatesPassed+'/6 · ':'')+EC.skills+' '+G.skills.length+'/2':Math.floor(G.dist)+MOBILE_UI.text125);
    set('run-power',G.shield?MOBILE_UI.text126:G.powerT.magnet>0?MOBILE_UI.text127+Math.ceil(G.powerT.magnet)+MOBILE_UI.text128:G.powerT.gui>0?MOBILE_UI.text129+Math.ceil(G.powerT.gui)+MOBILE_UI.text128:'');
    set('run-notice',saveError||G.egg?.text||'');
    const cue=G.tutorial?`${MOBILE_UI.text130}${G.tutorial.step+1}/3 · ${G.tutorial.tip}`:G.scripted?(G.t<EXPERIENCE.goalIntro?format(EC.goals,{eggs:G.plan.collectTarget}):benchmarkBeat().cue):G.t<5?MOBILE_UI.text131:'';
    set('run-cue',cue);
    const countdown=root.querySelector('#resume-count');countdown.hidden=G.resumeIn<=0;countdown.querySelector('span').textContent=String(Math.ceil(G.resumeIn));
  }
}
function go(state){G.state=state;G.albumZoom=null;G.albumReturn=null;G.albumFrom='menu';missingOnly=false;feedback='';skinFeedback='';pendingImport=null;}
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
  else if(id==='back'){if(G.state==='album')onPauseKey();else go('menu');}
  else if(id==='quit'){pauseRun();suspendAudio();go('menu');}
  else if(id==='pause')pauseRun();
  else if(id==='resume')resumeRun();
  else if(id==='skipResume')resumeRun(true);
  else if(id==='practice'){retryCurrentTutorial();resumeRun();}
  else if(id==='skipTutorial')skipTutorial();
  else if(id==='retry')startRun(G.mode,G.lvIdx);
  else if(id==='next')nextAfterClear();
  else if(id==='tutorial')start(0,true);
  else if(id==='reward'){
    const item=ITEMS.find(x=>x.id===value);if(!item||!save.album[value])return;
    const previous={state:G.state,scroll:root.scrollTop,item:value};
    go('album');category=item.cat;G.albumZoom=value;G.albumReturn=previous;flushSave();
  }
  else if(id==='earnStars'){
    go('levels');const candidates=LEVELS.slice(0,9).map((_,i)=>i).filter(i=>i===0||save.cleared[i-1]);
    G.levelFocus=candidates.sort((a,b)=>save.stars[a]-save.stars[b])[0];
  }
  else if(id==='missing'){go('album');missingOnly=true;G.albumFrom='levels';}
  else if(id==='allItems')missingOnly=false;
  else if(id==='item')G.albumZoom=value;
  else if(id==='photo')openPhoto(value);
  else if(id==='closePhoto')closePhoto();
  else if(id==='retryPhoto'){
    const figure=root.querySelector('.item-photo'),photo=ALBUM_PHOTOS[value];
    if(figure?.dataset.photo===value&&photo?.file&&save.album[value]){
      const img=figure.querySelector('img');img.hidden=false;figure.querySelector('[data-photo-status]').textContent=PH.loading;
      figure.querySelector('[data-action^="retryPhoto:"]').hidden=true;
      img.dataset.attempt=String(Number(img.dataset.attempt||0)+1);
      const url=new URL(assetUrl(photo.file));url.searchParams.set('retry',img.dataset.attempt);img.src=url.href;
    }
  }
  else if(id==='category'){category=value;missingOnly=false;G.albumZoom=null;}
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
function updatePhotoState(img){
  const figure=img.closest('.item-photo');if(!figure||!root.contains(figure))return;
  const ready=img.complete&&img.naturalWidth>0;img.hidden=!ready;
  figure.querySelector('.photo-open').disabled=!ready;
  figure.querySelector('[data-photo-status]').textContent=ready?PH.enlarge:PH.failed;
  figure.querySelector('[data-action^="retryPhoto:"]').hidden=ready;
}
const onPhotoState=e=>{if(e.target instanceof HTMLImageElement)updatePhotoState(e.target);};
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
  root.addEventListener('load',onPhotoState,true);root.addEventListener('error',onPhotoState,true);
}
export function disposeDomUI(){
  if(!root)return;closePhoto();root.removeEventListener('click',onClick);root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('keydown',onKey);root.removeEventListener('load',onPhotoState,true);root.removeEventListener('error',onPhotoState,true);root.replaceChildren();root=null;lastKey='';
}
