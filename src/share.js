import { drawBookDuck } from './art/book.js';
import { getSprite } from './art/sprites.js';
import { G, bookScene } from './game.js';
import { LEVELS, ITEMS, MILESTONES, NANJING_SLICE } from './config.js';
import { save } from './save.js';
import { track } from './track.js';
import { makeQR } from './qr.js';

/* ================= 分享:拍立得成绩卡(离屏绘制 → 系统分享/微信长按保存/下载) ================= */
const isWeixin = /MicroMessenger/i.test(navigator.userAgent);

/*
 * 构建期公开入口合同（由 asset-manifest.js 在模块加载前注入）：
 * globalThis.__DUCKDUCKRUN_PUBLIC__ = { publicSiteUrl, publicBasePath }。
 * 生产分享只认稳定站点根入口；版本目录只负责加载制品，不能进入二维码。
 */
export function resolveShareLink(publicConfig={}, currentLocation=location){
  const site = String(publicConfig?.publicSiteUrl || '').trim().replace(/\/+$/, '');
  const base = String(publicConfig?.publicBasePath || '').trim();
  if(site){
    const basePath = base ? '/' + base.replace(/^\/+|\/+$/g, '') : '';
    try{ return new URL(site + basePath + '/').href; }catch(e){ /* 走开发态回退 */ }
  }

  // 本地开发/旧制品没有注入配置时，从当前地址剥掉不可公开传播的版本目录。
  const url = new URL(currentLocation.href || String(currentLocation));
  const releaseAt = url.pathname.search(/\/releases\/[^/]+(?:\/|$)/);
  if(releaseAt >= 0) url.pathname = url.pathname.slice(0, releaseAt) + '/';
  else if(/\/[^/]+\.[^/]+$/.test(url.pathname)) url.pathname = url.pathname.replace(/[^/]+$/, '');
  else if(!url.pathname.endsWith('/')) url.pathname += '/';
  url.search = '';
  url.hash = '';
  return url.href;
}

export function shareLink(){
  return resolveShareLink(globalThis.__DUCKDUCKRUN_PUBLIC__ || {}, location);
}

export function buildShareCopy(snapshot, account, link){
  const { dist, marks, stars, endless, slice, levelName, albumN, tokens, easy, routeName } = snapshot;
  if(slice){
    const mode = easy ? '轻松模式' : '标准模式';
    return {
      text:'我在《冲鸭！金陵！》的“' + NANJING_SLICE.name + '”跑了 ' + dist
        + ' m，收下 ' + tokens + ' 枚灯牌。来跑一趟南京夜色：' + link,
      title:NANJING_SLICE.name + ' · ' + dist + ' m',
      sub:mode + ' · 灯牌 ' + tokens + ' 枚' + (routeName ? ' · ' + routeName : ''),
      footer:'南京夜跑切片 · 独立试玩，不计主线星级',
    };
  }
  const title = endless ? '无尽模式' : levelName;
  let sub = '本局鸭蛋 ' + marks + ' 枚' + (endless ? '' : ' · '+stars+' 星') + ' · 图鉴 ' + albumN + '/' + ITEMS.length;
  if(endless){
    const ms = MILESTONES.filter(m => dist >= m[0]).pop();
    if(ms) sub += ' · ' + ms[1];
  }
  return {
    text:'我在《冲鸭！金陵！》跑了 ' + dist + ' m，集齐 ' + albumN + '/' + ITEMS.length
      + ' 件金陵风物！没有一只鸭子能走出南京——除了我。 ' + link,
    title:title + ' · ' + dist + ' m',
    sub,
    footer:'无尽最佳 ' + account.best + ' m · 星星 ' + account.totalStars + '/' + (LEVELS.length*3),
  };
}

function roundRect(c, x, y, w, h, r){
  c.beginPath();
  c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.arcTo(x+w, y, x+w, y+r, r);
  c.lineTo(x+w, y+h-r); c.arcTo(x+w, y+h, x+w-r, y+h, r);
  c.lineTo(x+r, y+h); c.arcTo(x, y+h, x, y+h-r, r);
  c.lineTo(x, y+r); c.arcTo(x, y, x+r, y, r); c.closePath();
}

/* 简笔白胖鸭(背影):离屏卡片用,不依赖游戏 ctx;gold=金鸭皮肤(15 星) */
function drawDuck(c, x, y, s, gold){
  const body = gold ? '#f5d76e' : '#f5f0e6', belly = gold ? '#d8a83a' : '#e3d9c8';
  c.fillStyle = body;
  c.beginPath(); c.ellipse(x, y, 0.46*s, 0.56*s, 0, 0, Math.PI*2); c.fill();   // 梨形身体
  c.beginPath(); c.arc(x+0.05*s, y-0.78*s, 0.3*s, 0, Math.PI*2); c.fill();     // 头
  c.fillStyle = belly;
  c.beginPath(); c.ellipse(x, y+0.24*s, 0.34*s, 0.24*s, 0, 0, Math.PI*2); c.fill(); // 背阴
  c.fillStyle = '#f08c1e';
  c.beginPath();                                                                // 喙尖(3/4 后视)
  c.moveTo(x+0.29*s, y-0.8*s); c.lineTo(x+0.5*s, y-0.74*s); c.lineTo(x+0.29*s, y-0.68*s); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(x-0.16*s, y+0.58*s, 0.14*s, 0.08*s, 0, 0, Math.PI*2); c.fill(); // 脚蹼
  c.beginPath(); c.ellipse(x+0.16*s, y+0.58*s, 0.14*s, 0.08*s, 0, 0, Math.PI*2); c.fill();
  c.strokeStyle = '#7ba05b'; c.lineWidth = Math.max(1.5, s*0.03);               // 桂花枝
  c.beginPath(); c.moveTo(x, y-1.04*s); c.lineTo(x+0.08*s, y-1.2*s); c.stroke();
  c.fillStyle = '#f0b64c';
  for(const [dx,dy] of [[0.08,-1.22],[0.14,-1.17],[0.03,-1.24]]){
    c.beginPath(); c.arc(x+dx*s, y+dy*s, 0.05*s, 0, Math.PI*2); c.fill();
  }
}

/* 二维码:分享卡右下角的回游入口(卡面印链接,看到卡的人有路进来) */
function drawQR(c, x, y, size){
  const m = makeQR(shareLink());
  if(!m) return;
  const n = m.length, quiet = 2, cell = size / (n + quiet*2);
  const x0 = x - size/2, y0 = y - size/2;
  c.fillStyle = '#fff'; c.fillRect(x0, y0, size, size);
  c.fillStyle = '#1a1424';
  for(let r=0;r<n;r++) for(let col=0;col<n;col++)
    if(m[r][col]) c.fillRect(x0 + (col+quiet)*cell, y0 + (r+quiet)*cell, Math.ceil(cell), Math.ceil(cell));
}

/* 分享遮罩(微信/老 iOS):把 PNG 渲染成 <img>,提示长按保存;附复制链接 */
function showShareLayer(blobUrl, text){
  const layer = document.getElementById('shareLayer');
  if(!layer) return;
  const img = layer.querySelector('.card');
  const btn = layer.querySelector('#copyBtn');
  const close = layer.querySelector('#closeShare');
  img.src = blobUrl;
  layer.style.display = 'flex';
  btn.onclick = () => copyText(text);
  close.onclick = () => { layer.style.display = 'none'; URL.revokeObjectURL(img.src); };
  track('share');
}

let toastTimer = null;
function toast(msg){
  const el = document.getElementById('shareToast');
  if(!el) return;
  el.textContent = msg; el.style.opacity = 1;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ el.style.opacity = 0; }, 2000);
}

/* 复制链接/文案:clipboard API + execCommand 兜底 */
export function copyText(text){
  const done = ()=> toast('链接已复制,发给朋友直接玩');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done){
  try{
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    done();
  }catch(e){ toast('复制失败,请手动复制网址:'+shareLink()); }
}

export function shareScore(){
  // L4:进异步回调前捕获本局数据,避免玩家在此期间重开导致文案变「跑了 0 m」
  const snapshot = {
    dist:Math.floor(G.dist), marks:G.runMarks, stars:G.runStars,
    endless:G.mode==='endless', slice:G.mode==='slice', levelName:LEVELS[G.lvIdx].name,
    albumN:Object.keys(save.album).length,
    tokens:G.slice?.tokenCount||0, easy:!!G.slice?.easy, routeName:G.slice?.routeName||'',
  };
  const { dist } = snapshot;
  const link = shareLink();
  const totalStars = save.stars.reduce((a,b)=>a+b,0);
  const copy = buildShareCopy(snapshot, {best:save.best,totalStars}, link);
  const text = copy.text;
  const gold = save.selectedSkin==='gold'&&save.stars.reduce((a,b)=>a+b,0) >= 15;

  const c = document.createElement('canvas');
  c.width = 600; c.height = 760;
  const x2 = c.getContext('2d');
  // 拍立得相纸
  x2.fillStyle = '#0d0a14'; x2.fillRect(0, 0, 600, 760);
  x2.fillStyle = '#f6f0e2'; roundRect(x2, 30, 30, 540, 700, 8); x2.fill();
  x2.fillStyle = '#1a1424'; roundRect(x2, 60, 60, 480, 480, 4); x2.fill();
  // 卡面内容
  x2.textAlign = 'center'; x2.textBaseline = 'middle';
  x2.fillStyle = '#f0b64c';
  x2.font = '32px "JinlingBrush","KaiTi","Microsoft YaHei",serif';
  x2.fillText('冲鸭！金陵！', 300, 105);
  x2.strokeStyle = '#f0b64c'; x2.lineWidth = 1.5;
  x2.beginPath(); x2.moveTo(150, 130); x2.lineTo(450, 130); x2.stroke();
  const scene=bookScene(),backdrop=getSprite(scene?.background||'bookBackdrop');
  if(backdrop){
    const sw=backdrop.naturalWidth/(scene?.background?3:1),sx=(scene?.panel||0)*sw;
    x2.save();x2.beginPath();x2.rect(60,148,480,270);x2.clip();x2.globalAlpha=.82;
    x2.drawImage(backdrop,sx,backdrop.naturalHeight*.27,sw,sw*270/480,60,148,480,270);x2.restore();
  }
  drawBookDuck(x2,300,390,195,{t:1,gold});
  x2.fillStyle = '#f7ead0'; x2.font = '26px "JinlingKai","KaiTi","Microsoft YaHei",serif';
  x2.fillText(copy.title, 300, 448);
  x2.fillStyle = '#c9b88f'; x2.font = '18px "JinlingKai","KaiTi","Microsoft YaHei",serif';
  const details=copy.sub.split(' · ');x2.fillText(details.slice(0,2).join(' · '),300,482);if(details.length>2)x2.fillText(details.slice(2).join(' · '),300,510);
  // 底部文案
  x2.fillStyle = '#6b5a3a'; x2.font = '16px "JinlingKai","KaiTi","Microsoft YaHei",serif';
  x2.fillText('—— 奔跑展开的金陵长卷 ——', 300, 590);
  x2.fillText('南京地标取景 · 游戏美术化呈现', 300, 622);
  x2.fillStyle = '#a89a78'; x2.font = '14px "JinlingKai","KaiTi","Microsoft YaHei",serif';
  x2.textAlign='left';x2.fillText(copy.footer,72,670);x2.textAlign='center';
  // 右下角二维码 + 回游链接(传播第一跳的入口)
  drawQR(x2, 516, 655, 92);
  x2.font = '11px "Microsoft YaHei","PingFang SC",sans-serif';
  x2.fillText('扫码开跑', 516, 718);

  const fname = '冲鸭金陵-' + dist + 'm.png';
  track('share');
  c.toBlob(blob => {
    if(!blob) return;
    if(isWeixin){
      // F6:微信内置浏览器长按下载常被吞,navigator.share 带文件基本失败
      // → 全屏遮罩渲染成 <img>,微信对 img 长按菜单是通的;同时复制带链接文案
      const url = URL.createObjectURL(blob);
      showShareLayer(url, text);
      return;
    }
    let file = null;
    try{ if(typeof File === 'function') file = new File([blob], fname, { type:'image/png' }); }catch(e){}
    if(file && navigator.canShare && navigator.canShare({ files:[file] })){
      try{
        navigator.share({ files:[file], title:'冲鸭！金陵！', text })
          .then(()=>track('shareOk'))
          .catch(e=>{
            if(e.name !== 'AbortError') downloadBlob(blob, fname);   // L11:用户取消不触发下载
          });
        return;
      }catch(e){ /* 走下载兜底 */ }
    }
    downloadBlob(blob, fname);
  }, 'image/png');
}

/* 下载兜底:老 iOS 用新标签打开 blob(避免导航跑偏),其余 a.download */
function downloadBlob(blob, fname){
  const url = URL.createObjectURL(blob);
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent);
  if(ios && typeof File !== 'function'){
    window.open(url, '_blank');   // L10:老 iOS 无 File 且不支持 download,新标签打开可长按保存
  } else {
    const a = document.createElement('a');
    a.href = url; a.download = fname; a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
