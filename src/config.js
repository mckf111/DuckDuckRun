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
  // 隐藏第六关:图鉴集齐 + 15 星解锁(夜奔长江大桥;路面/障碍复用紫金山夜色)
  { name:'长江大桥', sub:'双层公铁,一夜过江',
    sky:['#0a1024','#1c2c50'], ground:'#141c30', road:'#1f2a44', lane:'#8fb4e0',
    side:'#0e1424', sideTop:'#16203a', accent:'#7fb8f0', motif:'pine',
    hud:'#dceaff', textDark:false, speed:12.5, len:800,
    landmark:'bridge', lmColor:'#101a30',   // 双层公铁两用桥
    side2:'江风', weight:{low:.42,high:.3,full:.28}, hidden:true },
];

/* 无尽模式地标轮换(含南京长江大桥) */
export const LM_CYCLE = ['zhonghua','jiming','sunyard','zhaobi','observatory','bridge'];
/* 无尽模式 600m 报站名 */
export const LM_NAME = {
  zhonghua:'中华门瓮城', jiming:'鸡鸣寺', sunyard:'中山陵',
  zhaobi:'夫子庙', observatory:'紫金山天文台', bridge:'南京长江大桥',
};
/* 无尽模式里程碑(米 → 称号) */
export const MILESTONES = [
  [100, '跑出鸭店'], [500, '跑过中华门'], [1000, '跑过玄武湖'], [1500, '跑穿老城南'], [2000, '跑穿金陵'], [5000, '鸭界传说'],
];

/* 收集品图鉴(拍立得照片/手绘插画 + 民俗小注 + 鸭鸭批注 + 去哪儿)
   home:主场关卡(该关掉落加权);rare:稀有,仅主场关或无尽 800m 后掉落 */
export const ITEMS = [
  { id:'duck',  name:'盐水鸭',   note:'桂花鸭最负盛名,皮白肉嫩,金陵一绝', quip:'鸭鸭别过头去:不看,不听,不知道。', where:'📍 章云板鸭、金宏兴,老字号遍地' },
  { id:'fans',  name:'鸭血粉丝汤', note:'鸭血滑嫩粉丝爽口,南京人的一碗乡愁', quip:'……这碗里没有鸭,放心。', where:'📍 回味、鸭得堡,夫子庙周边' },
  { id:'tea',   name:'雨花茶',   note:'形如松针,绿意清雅,江苏名茶', quip:'松针似的茶叶,鸭掌泡不开。', where:'📍 雨花台风景区' },
  { id:'taro',  name:'桂花糖芋苗', note:'红糖熬芋苗,桂花香里软糯拉丝', quip:'甜到拉丝的南京秋天。', where:'📍 老门东、南京老字号' },
  { id:'plum',  name:'梅花',     note:'南京市花,梅花山上凌寒独放', quip:'市花戴在鸭头上,也算南京户口了。', where:'📍 明孝陵梅花山,2-3 月', home:1 },
  { id:'stone', name:'雨花石',   note:'天赐国宝,一枚石子一山水', quip:'挑一块揣兜里,雨花台见。', where:'📍 雨花台、六合横梁', home:4 },
  { id:'pot',   name:'牛肉锅贴', note:'七家湾老字号,金黄酥脆一口爆汁', quip:'鸭鸭:老板,再来二两!', where:'📍 李记清真馆、七家湾', home:3 },
  { id:'bean',  name:'赤豆元宵', note:'桂花赤豆糊,小元宵软糯挂勺', quip:'跑完这一碗,还能再跑三关。', where:'📍 莲湖糕团店、老门东', home:3 },
  { id:'cloud', name:'云锦',     note:'寸锦寸金,江宁织造的一寸光华', quip:'鸭鸭披上它,整个江宁都亮了。', where:'📍 南京云锦博物馆', home:0, rare:true },
  { id:'gold',  name:'金箔',     note:'龙潭金箔,万锤打成的一片轻金(图为工艺示意)', quip:'轻得像鸭绒,亮得晃鸭眼。', where:'📍 栖霞龙潭金箔之乡', home:4, rare:true },
  { id:'leaf',  name:'梧桐叶',   note:'陵园大道梧桐,南京秋天的入场券', quip:'一片叶子,就是一条颐和路。', where:'📍 陵园大道、颐和路', home:2 },
  { id:'lamp',  name:'秦淮花灯', note:'正月里上灯,十里秦淮一夜鱼龙舞', quip:'鸭子提灯:照亮逃亡的路。', where:'📍 夫子庙花灯市场,正月', home:3, rare:true },
  { id:'cake',  name:'梅花糕',   note:'相传乾隆下江南时得了这名字,一朵会爆浆的梅花', quip:'烫嘴也要趁热吃,鸭蹼拿不住也认了。', where:'📍 老门东、夫子庙,左师傅梅花糕', home:3 },
  { id:'root',  name:'糖粥藕',   note:'糯米灌藕红糖慢熬,糖粥一浇软糯拉丝', quip:'甜党鸭认证:比糖芋苗还黏牙。', where:'📍 老门东、南京老字号', home:0 },
  { id:'egg',   name:'活珠子',   note:'六合名产,十二天旺鸡蛋,鲜掉眉毛的勇士料理', quip:'鸭鸭报警了:你们管这叫小吃?!', where:'📍 六合、街头五香卤锅', home:4, rare:true },
  { id:'elephant', name:'石象路', note:'明孝陵神道,石兽六百米,一站六百年', quip:'石象不追鸭,好评。', where:'📍 明孝陵景区,深秋最美', home:2 },
  { id:'sakura', name:'樱花',    note:'鸡鸣寺路三月,下一场粉白色的雪', quip:'花瓣落鸭头,也算戴过春天了。', where:'📍 鸡鸣寺路、玄武湖樱洲', home:1 },
  { id:'book',  name:'先锋书店', note:'地下车库里的先锋书店,大地上的异乡者', quip:'鸭鸭看不懂字,但很会装文化鸭。', where:'📍 五台山总店,广州路173号', home:0, rare:true },
];
