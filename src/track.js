/* ================= 轻量埋点 ================= */
// 免费无后端:关键行为事件经 sendBeacon 上报;TRACK_URL 留空则完全静默(部署后填入自己的收集端点)。
// 参考:Cloudflare Web Analytics 一个 script 标签可补 PV/UV,本模块只打关键行为事件(开局/通关/死亡/分享)。
const TRACK_URL = '';   // 例:'https://your-track-endpoint.example/collect?site=jinling'
export function track(ev, data){
  if(!TRACK_URL) return;
  const p = new URLSearchParams({ e: ev, t: Date.now() });
  if(data) for(const k in data) p.set(k, data[k]);
  try{
    if(navigator.sendBeacon) navigator.sendBeacon(TRACK_URL + '?' + p.toString());
    else { const i = new Image(); i.src = TRACK_URL + '?' + p.toString(); }
  }catch(e){ /* 埋点失败不影响游戏 */ }
}
