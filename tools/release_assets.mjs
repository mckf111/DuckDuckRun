/* 精确排除停用图鉴照片及内部候选记录，背景后备仍保留。 */
export function includeReleaseAsset(path){
  return path!=='assets/img/src'&&!path.startsWith('assets/img/src/')
    &&!/^assets\/img\/it_[^/]+\.(?:jpg|jpeg|png|webp)$/i.test(path)
    &&!['assets/img/CREDITS.json','assets/img/CREDITS.md','assets/album/REVIEW.json','assets/album/CREDITS.md'].includes(path);
}
