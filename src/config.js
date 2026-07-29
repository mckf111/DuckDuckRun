/* ================= 关卡主题(国风剪纸配色) ================= */
// 每关:天空渐变/地面/车道线/两侧装饰/强调色/障碍母题/远景地标
export const LEVELS = [
  { name:'明城墙', sub:'六百年城砖,从台城跑到中华门',
    sky:['#16222e','#3a5468'], ground:'#7d3a32', road:'#93504a', lane:'#e8d9b0',
    side:'#4a2c28', sideTop:'#5d3833', accent:'#e8b04b', motif:'crenel',
    hud:'#f3e6c8', textDark:false, speed:9.5, len:520,
    landmark:'zhonghua', lmColor:'#3a2320',   // 中华门瓮城
    side2:'紫峰剪影', weight:{low:.5,high:.28,full:.22} },
  { name:'玄武湖', sub:'湖堤十里,荷风四面',
    sky:['#0f2e2c','#2f6f66'], ground:'#1e4a44', road:'#2a5f57', lane:'#cfe8d8',
    side:'#173a35', sideTop:'#1f4a42', accent:'#a8d5a2', motif:'lotus',
    hud:'#e8f4e4', textDark:false, speed:10.5, len:560,
    landmark:'jiming', lmColor:'#12302b',     // 鸡鸣寺药师佛塔
    side2:'湖光', weight:{low:.45,high:.3,full:.25} },
  { name:'中山陵', sub:'三百九十二级台阶,一口气跑上去',
    sky:['#8fa9c4','#dfe9f2'], ground:'#c3cedb', road:'#cfd9e4', lane:'#5a7ca6',
    side:'#9db1c6', sideTop:'#aebfd2', accent:'#2e5f8a', motif:'steps',
    hud:'#274a6b', textDark:true, speed:11, len:600,
    landmark:'sunyard', lmColor:'#93a9c2',    // 蓝瓦祭堂
    side2:'雪松', weight:{low:.62,high:.18,full:.2} },
  { name:'夫子庙', sub:'桨声灯影,十里珠帘',
    sky:['#0c0918','#2b1a3d'], ground:'#191226', road:'#2e2144', lane:'#f0b64c',
    side:'#120d1e', sideTop:'#1a1228', accent:'#e2483d', motif:'lantern',
    hud:'#f7d9a0', textDark:false, speed:11.5, len:640,
    landmark:'zhaobi', lmColor:'#160f26',     // 双龙戏珠大照壁
    side2:'画舫', weight:{low:.4,high:.35,full:.25} },
  { name:'紫金山', sub:'夜奔紫金山巅,终点看金陵灯火',
    sky:['#100e24','#3a2a66'], ground:'#221c3d', road:'#2c2450', lane:'#b9a8e8',
    side:'#181331', sideTop:'#201a40', accent:'#c9a2ff', motif:'pine',
    hud:'#e6dcff', textDark:false, speed:12, len:700,
    landmark:'observatory', lmColor:'#171233',// 天文台银圆顶
    side2:'星空', weight:{low:.42,high:.3,full:.28} },
];

/* 无尽模式地标轮换(含南京长江大桥) */
export const LM_CYCLE = ['zhonghua','jiming','sunyard','zhaobi','observatory','bridge'];

/* 收集品图鉴(剪纸图标 + 民俗小注) */
export const ITEMS = [
  { id:'duck',  name:'盐水鸭',   note:'桂花鸭最负盛名,皮白肉嫩,金陵第一味' },
  { id:'fans',  name:'鸭血粉丝汤', note:'鸭血滑嫩粉丝爽口,南京人的一碗乡愁' },
  { id:'tea',   name:'雨花茶',   note:'形如松针,绿意清雅,全国十大名茶之一' },
  { id:'taro',  name:'桂花糖芋苗', note:'红糖熬芋苗,桂花香里软糯拉丝' },
  { id:'plum',  name:'梅花',     note:'南京市花,梅花山上凌寒独放' },
  { id:'stone', name:'雨花石',   note:'天赐国宝,一枚石子一山水' },
];
