/* 静态资源在开发时使用稳定路径；生产构建由 asset-manifest.js 映射到内容指纹文件。 */
export function assetUrl(path){
  const key = String(path || '').replace(/^\.\//, '');
  const manifest = globalThis.__DUCKDUCKRUN_ASSETS__ || {};
  return new URL(manifest[key] || key, document.baseURI).href;
}
