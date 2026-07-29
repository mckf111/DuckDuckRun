import { G } from './game.js';
import { LEVELS, ITEMS, MILESTONES } from './config.js';
import { save } from './save.js';

/* ================= 分享成绩:拍立得风成绩卡(离屏绘制 → 系统分享/下载) ================= */
function roundRect(c, x, y, w, h, r){
  c.beginPath();
  c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.arcTo(x+w, y, x+w, y+r, r);
  c.lineTo(x+w, y+h-r); c.arcTo(x+w, y+h, x+w-r, y+h, r);
  c.lineTo(x+r, y+h); c.arcTo(x, y+h, x, y+h-r, r);
  c.lineTo(x, y+r); c.arcTo(x, y, x+r, y, r); c.closePath();
}

/* 简笔白胖鸭(背影):离屏卡片用,不依赖游戏 ctx */
function drawDuck(c, x, y, s){
  c.fillStyle = '#f5f0e6';
  c.beginPath(); c.ellipse(x, y, 0.46*s, 0.56*s, 0, 0, Math.PI*2); c.fill();   // 梨形身体
  c.beginPath(); c.arc(x+0.05*s, y-0.78*s, 0.3*s, 0, Math.PI*2); c.fill();     // 头
  c.fillStyle = '#e3d9c8';
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

export function shareScore(){
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
  x2.font = 'bold 30px "JinlingSong","STSong","SimSun",serif';
  x2.fillText('金 陵 快 跑', 300, 105);
  x2.strokeStyle = '#f0b64c'; x2.lineWidth = 1.5;
  x2.beginPath(); x2.moveTo(150, 130); x2.lineTo(450, 130); x2.stroke();
  drawDuck(x2, 300, 320, 130);
  const endless = G.mode==='endless';
  const title = endless ? '无尽模式' : LEVELS[G.lvIdx].name;
  x2.fillStyle = '#f7ead0'; x2.font = 'bold 26px "Microsoft YaHei","PingFang SC",sans-serif';
  x2.fillText(title + ' · ' + Math.floor(G.dist) + ' m', 300, 448);
  x2.fillStyle = '#c9b88f'; x2.font = '18px "Microsoft YaHei","PingFang SC",sans-serif';
  const albumN = Object.keys(save.album).length;
  let sub = '收集风物 ' + G.items + ' 件 · 图鉴 ' + albumN + '/' + ITEMS.length;
  if(endless){
    const ms = MILESTONES.filter(m => save.best >= m[0]).pop();
    if(ms) sub += ' · ' + ms[1];
  }
  x2.fillText(sub, 300, 482);
  // 底部文案
  x2.fillStyle = '#6b5a3a'; x2.font = '16px "Microsoft YaHei","PingFang SC",sans-serif';
  x2.fillText('—— 奔跑展开的金陵长卷 ——', 300, 590);
  x2.fillText('游戏里的风景,都是真的南京', 300, 622);
  x2.fillStyle = '#a89a78'; x2.font = '14px "Microsoft YaHei","PingFang SC",sans-serif';
  const totalStars = save.stars.reduce((a,b)=>a+b,0);
  x2.fillText('无尽最佳 ' + save.best + ' m · 星星 ' + totalStars + '/18', 300, 680);

  const fname = '金陵快跑-' + Math.floor(G.dist) + 'm.png';
  c.toBlob(async blob => {
    if(!blob) return;
    const file = new File([blob], fname, { type:'image/png' });
    if(navigator.canShare && navigator.canShare({ files:[file] })){
      try{
        await navigator.share({ files:[file], title:'金陵快跑',
          text:'我在《金陵快跑》跑了 ' + Math.floor(G.dist) + ' m,集齐 ' + albumN + '/' + ITEMS.length + ' 件金陵风物!' });
        return;
      }catch(e){ /* 用户取消或失败则走下载 */ }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fname; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}
