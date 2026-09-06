import { ctx, W, H, HOR, CX, TAU, viewport } from '../core.js';
import { getSprite } from './sprites.js';

/* 绘本图集与程序化加载后备：统一后视和脚底锚点，分享与主页复用。 */
export function drawBookDuck(c,x,y,size,{t=0,air=false,slide=false,gold=false,panic=false}={}){
  const atlas=getSprite('bookDuck');
  if(atlas){
    const frame=slide?3:air?2:Math.floor(t*8)%2,sw=atlas.naturalWidth/2,sh=atlas.naturalHeight/2;
    const width=size*2.25*(slide?1.12:1),height=size*1.5*(slide?.62:1);
    c.save();if(gold)c.filter='sepia(.55) saturate(1.15)';
    c.drawImage(atlas,(frame%2)*sw,Math.floor(frame/2)*sh,sw,sh,x-width/2,y-height*.93,width,height);c.restore();return;
  }
  c.save();c.translate(x,y);c.scale(size/100,size/100);
  c.lineJoin='round';c.lineCap='round';c.lineWidth=2.6;
  const white=gold?'#ecd18a':'#fff7df',shade=gold?'#cba44a':'#dfd6bc',ink='#37494a';
  const ellipse=(x,y,rx,ry,fill,rotation=0)=>{c.fillStyle=fill;c.strokeStyle=ink;c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,TAU);c.fill();c.stroke();};
  c.fillStyle='rgba(21,52,54,.16)';c.beginPath();c.ellipse(0,4,31,7,0,0,TAU);c.fill();
  if(slide){c.rotate(-0.16);ellipse(0,-17,36,18,white);ellipse(22,-28,18,15,white);ellipse(40,-24,12,5,'#dc933d');}
  else{
    const step=air?0:Math.sin(t*14)*7;
    ellipse(-14,-1+step*.3,10,4,'#e0a14d',-.3);ellipse(15,-1-step*.3,10,4,'#e0a14d',.3);
    c.translate(0,air?-3:-Math.abs(step)*.24);
    ellipse(0,-35,29,34,shade);ellipse(-2,-40,25,31,white);
    for(const side of [-1,1]){
      c.save();c.translate(side*24,-43);c.rotate(side*(air?-.85+Math.sin(t*20)*.2:.12));
      ellipse(0,9,9,20,white,side*-.2);c.restore();
    }
    ellipse(2,-77,20,21,white);ellipse(21,-74,11,5,'#dea04b',.16);
    c.fillStyle=ink;c.beginPath();c.arc(panic?9:13,-80,2.3,0,TAU);c.fill();
    c.fillStyle=white;c.strokeStyle=ink;c.beginPath();c.moveTo(-10,-16);c.quadraticCurveTo(0,-29,10,-16);c.lineTo(3,-7);c.closePath();c.fill();c.stroke();
    c.strokeStyle='#a99f83';c.lineWidth=1.1;c.beginPath();c.moveTo(-15,-43);c.quadraticCurveTo(-8,-32,-10,-25);c.stroke();
    c.strokeStyle='#607754';c.lineWidth=2;c.beginPath();c.moveTo(1,-96);c.quadraticCurveTo(4,-110,12,-116);c.stroke();
    c.fillStyle='#d9aa50';for(const [a,b]of [[10,-115],[16,-111],[9,-108]]){c.beginPath();c.arc(a,b,4,0,TAU);c.fill();}
    c.fillStyle='#758762';c.beginPath();c.ellipse(0,-109,3,7,-.7,0,TAU);c.fill();
  }
  c.restore();
}

export function drawBookBackdrop(){
  const image=getSprite('bookBackdrop');
  ctx.fillStyle='#e7e7d4';ctx.fillRect(0,0,W,H);
  if(image){
    if(!viewport.portrait){
      const cropH=image.naturalWidth/(W/(H*.64));
      ctx.drawImage(image,0,image.naturalHeight*.27,image.naturalWidth,cropH,0,0,W,H*.64);
    }else{
      const height=H*.64,width=height*image.naturalWidth/image.naturalHeight;
      const scale=Math.max(W/width,1);
      ctx.drawImage(image,(W-width*scale)/2,0,width*scale,height*scale);
    }
  }else{
    ctx.fillStyle='#ccdcd2';ctx.fillRect(0,0,W,HOR+60);
    ctx.fillStyle='#6f9090';ctx.beginPath();ctx.moveTo(0,HOR+10);ctx.quadraticCurveTo(W*.2,HOR-90,W*.45,HOR-28);ctx.quadraticCurveTo(W*.7,HOR-120,W,HOR);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
    const gateW=Math.min(W*.55,420),gateH=Math.min(H*.19,160),x=CX-gateW/2,y=HOR-gateH*.82;
    ctx.fillStyle='#5b7574';ctx.fillRect(x,y,gateW,gateH);
    ctx.fillStyle='#eadcb8';ctx.beginPath();ctx.arc(CX,y+gateH*.72,gateW*.12,Math.PI,0);ctx.lineTo(CX+gateW*.12,y+gateH);ctx.lineTo(CX-gateW*.12,y+gateH);ctx.fill();
    ctx.fillStyle='#315b60';for(let i=0;i<9;i++)ctx.fillRect(x+i*gateW/9,y-9,gateW/13,16);
    ctx.fillStyle='#d5ad66';ctx.fillRect(CX-50,y-42,100,33);ctx.fillStyle='#344e50';ctx.beginPath();ctx.moveTo(CX-70,y-39);ctx.lineTo(CX,y-64);ctx.lineTo(CX+70,y-39);ctx.closePath();ctx.fill();
  }
  const grad=ctx.createLinearGradient(0,H*.40,0,H*.75);grad.addColorStop(0,'rgba(221,217,188,0)');grad.addColorStop(1,'#ddd9bc');ctx.fillStyle=grad;ctx.fillRect(0,H*.4,W,H*.6);
}
