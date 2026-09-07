/* 图集只着色一次；标准合成保留原透明度，手机无需 Canvas filter。 */
const atlases=new WeakMap();
export function skinAtlas(image,gold){
  const cached=atlases.get(image)||{};
  const skin=gold?'gold':'white';
  if(cached[skin])return cached[skin];
  const canvas=document.createElement('canvas');
  canvas.width=image.naturalWidth||image.width;canvas.height=image.naturalHeight||image.height;
  const c=canvas.getContext('2d');
  c.drawImage(image,0,0);
  if(gold){
    c.globalCompositeOperation='source-atop';
    c.fillStyle='rgba(232,174,46,.55)';c.fillRect(0,0,canvas.width,canvas.height);
  }
  // 两种皮肤使用同一种位图采样路径，缩放时不产生轮廓差异。
  cached[skin]=canvas;atlases.set(image,cached);return canvas;
}
