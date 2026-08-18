import { G } from './game.js';
import { LEVELS, ITEMS, MILESTONES } from './config.js';
import { save } from './save.js';
import { track } from './track.js';
import { makeQR } from './qr.js';

/* ================= 分享:拍立得成绩卡(离屏绘制 → 系统分享/微信长按保存/下载) ================= */
const isWeixin = /MicroMessenger/i.test(navigator.userAgent);
export function shareLink(){
  // 分享用干净入口 URL(不带 #lv 深链,对方打开进菜单)
  return location.origin + location.pathname;
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
    endless:G.mode==='endless', levelName:LEVELS[G.lvIdx].name,
    albumN:Object.keys(save.album).length,
  };
  const { dist, marks, stars, endless, levelName, albumN } = snapshot;
  const link = shareLink();
  const text = '我在《冲鸭！金陵！》跑了 ' + dist + ' m,集齐 ' + albumN + '/' + ITEMS.length
    + ' 件金陵风物!没有一只鸭子能走出南京——除了我。 ' + link;
  const gold = save.stars.reduce((a,b)=>a+b,0) >= 15;

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
  drawDuck(x2, 300, 320, 130, gold);
  const title = endless ? '无尽模式' : levelName;
  x2.fillStyle = '#f7ead0'; x2.font = '26px "JinlingKai","KaiTi","Microsoft YaHei",serif';
  x2.fillText(title + ' · ' + dist + ' m', 300, 448);
  x2.fillStyle = '#c9b88f'; x2.font = '18px "JinlingKai","KaiTi","Microsoft YaHei",serif';
  let sub = '本局鸭蛋 ' + marks + ' 枚' + (endless ? '' : ' · '+stars+' 星') + ' · 图鉴 ' + albumN + '/' + ITEMS.length;
  if(endless){
    const ms = MILESTONES.filter(m => dist >= m[0]).pop();
    if(ms) sub += ' · ' + ms[1];
  }
  x2.fillText(sub, 300, 482);
  // 底部文案
  x2.fillStyle = '#6b5a3a'; x2.font = '16px "JinlingKai","KaiTi","Microsoft YaHei",serif';
  x2.fillText('—— 奔跑展开的金陵长卷 ——', 300, 590);
  x2.fillText('南京地标取景 · 游戏美术化呈现', 300, 622);
  x2.fillStyle = '#a89a78'; x2.font = '14px "JinlingKai","KaiTi","Microsoft YaHei",serif';
  const totalStars = save.stars.reduce((a,b)=>a+b,0);
  x2.fillText('无尽最佳 ' + save.best + ' m · 星星 ' + totalStars + '/' + (LEVELS.length*3), 300, 680);
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
