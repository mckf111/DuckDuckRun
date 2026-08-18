/* ================= 关卡主题(国风剪纸配色) ================= */
// 每关:天空渐变/地面/车道线/两侧装饰/强调色/障碍母题/远景地标
// mod:关卡修饰器(game.js spawnCluster 层分发,见迭代方案 §C3)
export const LEVELS = [
  { name:'明城墙', sub:'六百年城砖,从台城跑到中华门',
    sky:['#09182e','#315879'], ground:'#1d2a3a', road:'#31465b', lane:'#d9b45d',
    side:'#142033', sideTop:'#21344b', accent:'#f1c86b', motif:'crenel',
    hud:'#edf7ff', textDark:false, speed:9.5, len:520,
    landmark:'zhonghua', lmColor:'#17243a',   // 中华门瓮城
    side2:'紫峰剪影', weight:{low:.5,high:.28,full:.22}, mod:'wallPair' },
  { name:'玄武湖', sub:'湖堤十里,荷风四面',
    sky:['#0f2e2c','#2f6f66'], ground:'#1e4a44', road:'#2a5f57', lane:'#cfe8d8',
    side:'#173a35', sideTop:'#1f4a42', accent:'#a8d5a2', motif:'lotus',
    hud:'#e8f4e4', textDark:false, speed:10.5, len:560,
    landmark:'jiming', lmColor:'#12302b',     // 鸡鸣寺药师佛塔
    side2:'湖光', weight:{low:.45,high:.3,full:.25}, mod:'longArc' },
  { name:'中山陵', sub:'三百九十二级台阶,一口气跑上去',
    sky:['#8fa9c4','#dfe9f2'], ground:'#c3cedb', road:'#cfd9e4', lane:'#5a7ca6',
    side:'#9db1c6', sideTop:'#aebfd2', accent:'#2e5f8a', motif:'steps',
    hud:'#274a6b', textDark:true, speed:11, len:600,
    landmark:'sunyard', lmColor:'#93a9c2',    // 蓝瓦祭堂
    side2:'雪松', weight:{low:.62,high:.18,full:.2}, mod:'stepRhythm' },
  { name:'夫子庙', sub:'桨声灯影,十里珠帘',
    sky:['#0c0918','#2b1a3d'], ground:'#191226', road:'#2e2144', lane:'#f0b64c',
    side:'#120d1e', sideTop:'#1a1228', accent:'#e2483d', motif:'lantern',
    hud:'#f7d9a0', textDark:false, speed:11.5, len:640,
    landmark:'zhaobi', lmColor:'#160f26',     // 双龙戏珠大照壁
    side2:'画舫', weight:{low:.4,high:.35,full:.25}, mod:'lanternDense' },
  { name:'紫金山', sub:'夜奔紫金山巅,终点看金陵灯火',
    sky:['#100e24','#3a2a66'], ground:'#221c3d', road:'#2c2450', lane:'#b9a8e8',
    side:'#181331', sideTop:'#201a40', accent:'#c9a2ff', motif:'pine',
    hud:'#e6dcff', textDark:false, speed:12, len:700,
    landmark:'observatory', lmColor:'#171233',// 天文台银圆顶
    side2:'星空', weight:{low:.42,high:.3,full:.28}, mod:'firefly' },
  // 6~9:二期新增四关,难度/长度递进(速度 12.3/12.6/12.8/13,长度 +40/关)
  { name:'颐和路', sub:'梧桐黄叶,民国洋房,晨雾一条街',
    sky:['#9db8d8','#e8f0f6'], ground:'#b08a52', road:'#c0a06a', lane:'#5a6a4a',
    side:'#8a6a4a', sideTop:'#a8865c', accent:'#d8a83a', motif:'plane',
    hud:'#f3e6c8', textDark:false, speed:12.3, len:780,
    landmark:'yihe', lmColor:'#6b543a',       // 民国洋房群
    side2:'晨雾', weight:{low:.5,high:.28,full:.22}, mod:'planeFall' },
  { name:'老门东', sub:'粉墙黛瓦,巷子深处的黄昏',
    sky:['#d98a5a','#f2cfae'], ground:'#a87a5a', road:'#b88a62', lane:'#f0d8b0',
    side:'#7a5650', sideTop:'#8f6d60', accent:'#e8a04a', motif:'street',
    hud:'#f7e8d0', textDark:false, speed:12.6, len:820,
    landmark:'mendong', lmColor:'#6b4438',    // 老门东牌坊
    side2:'暖灯', weight:{low:.46,high:.3,full:.24}, mod:'alleyNarrow' },
  { name:'栖霞山', sub:'霜叶满山,夕照下的红枫道',
    sky:['#c9683a','#f0b070'], ground:'#8a4a2a', road:'#9a5a34', lane:'#f0c890',
    side:'#5a3528', sideTop:'#6e4433', accent:'#e0783a', motif:'maple',
    hud:'#f7e0c8', textDark:false, speed:12.8, len:860,
    landmark:'qixia', lmColor:'#4a2c20',      // 栖霞寺红墙塔影
    side2:'夕照', weight:{low:.48,high:.3,full:.22}, mod:'arcDrift' },
  { name:'大报恩寺', sub:'琉璃夜塔,一路金光入夜',
    sky:['#1b2a44','#3a5a7a'], ground:'#2a3852', road:'#33456b', lane:'#e8c170',
    side:'#1b2440', sideTop:'#24304f', accent:'#e8c170', motif:'pagoda',
    hud:'#f0e4c8', textDark:false, speed:13, len:900,
    landmark:'baoen', lmColor:'#1f2a4a',      // 琉璃塔
    side2:'金雨', weight:{low:.46,high:.3,full:.24}, mod:'glazeRain' },
  // 隐藏第十关:前九关通关 + 15 星 + 28/34 普通风物(旧桥通关档继续开放)
  { name:'长江大桥', sub:'双层公铁,一夜过江',
    sky:['#0a1024','#1c2c50'], ground:'#141c30', road:'#2e4066', lane:'#9fc0e8',
    side:'#0e1424', sideTop:'#16203a', accent:'#7fb8f0', motif:'bridge',
    hud:'#dceaff', textDark:false, speed:13, len:900,
    landmark:'bridge', lmColor:'#101a30',   // 双层公铁两用桥
    side2:'江风', weight:{low:.5,high:.3,full:.2}, hidden:true, mod:'riverWind' },
];

/* 无尽模式地标轮换(含长江大桥) */
export const LM_CYCLE = ['zhonghua','jiming','sunyard','zhaobi','observatory','yihe','mendong','qixia','baoen','bridge'];
/* 无尽模式 600m 报站名 */
export const LM_NAME = {
  zhonghua:'中华门瓮城', jiming:'鸡鸣寺', sunyard:'中山陵',
  zhaobi:'夫子庙', observatory:'紫金山天文台', bridge:'南京长江大桥',
  yihe:'颐和路', mendong:'老门东', qixia:'栖霞山', baoen:'大报恩寺',
};
/* 无尽模式里程碑(米 → 称号) */
export const MILESTONES = [
  [100, '跑出鸭店'], [500, '跑过中华门'], [1000, '跑过玄武湖'], [1500, '跑穿老城南'], [2000, '跑穿金陵'], [5000, '鸭界传说'],
];

/* 迭代 0 的统一星级口径；迭代 3 再按关卡实测拆分。 */
export const RUN_STAR_THRESHOLDS = [8, 14, 20];

/* 鸭铺升级线(二期 §E3):三条线 × 3 级,花铜钱。星级门槛/过关条件/障碍数值一律不动 */
export const SHOPS = [
  { id:'magnet', name:'磁铁手艺', line:'局内磁铁时长', levels:['6 秒','8 秒','10 秒','12 秒'], price:[50,150,400],
    note:'吸邻道收集品过来,吃得快', icon:'magnet' },
  { id:'gui',    name:'金桂手艺', line:'局内金桂时长', levels:['6 秒','8 秒','10 秒','12 秒'], price:[50,150,400],
    note:'只让铜钱翻倍,不影响印记与星级', icon:'gui' },
  { id:'spawn',  name:'货郎吆喝', line:'道具出现间隔', levels:['原间隔','×0.85','×0.7','×0.55'], price:[80,200,500],
    note:'路上的道具来得更勤', icon:'spawn' },
];

/* 收集品图鉴(全插画 + 民俗小注 + 鸭鸭批注 + 去哪儿)
   home:主场关卡(该关掉落加权);rare:稀有,仅主场关或无尽 800m 后掉落;
   secret:隐藏件,条件未达成根本不进掉落池,图鉴里显示谜面(判定见 game.js secretReady);
   cat:四部归类 food食/craft工/ruin迹/creature灵(图鉴页按部陈列) */
export const ITEMS = [
  /* ---- 食之属 14 ---- */
  { id:'duck',  name:'盐水鸭',   note:'桂花鸭最负盛名,皮白肉嫩,金陵一绝', quip:'鸭鸭别过头去:不看,不听,不知道。', where:'📍 章云板鸭、金宏兴,老字号遍地', photo:true, cat:'food' },
  { id:'fans',  name:'鸭血粉丝汤', note:'鸭血滑嫩粉丝爽口,南京人的一碗乡愁', quip:'……这碗里没有鸭,放心。', where:'📍 回味、鸭得堡,夫子庙周边', photo:true, cat:'food' },
  { id:'tea',   name:'雨花茶',   note:'形如松针,绿意清雅,江苏名茶', quip:'松针似的茶叶,鸭掌泡不开。', where:'📍 雨花台风景区', photo:true, cat:'food' },
  { id:'taro',  name:'桂花糖芋苗', note:'红糖熬芋苗,桂花香里软糯拉丝', quip:'甜到拉丝的南京秋天。', where:'📍 老门东、南京老字号', photo:true, cat:'food' },
  { id:'pot',   name:'牛肉锅贴', note:'七家湾老字号,金黄酥脆一口爆汁', quip:'鸭鸭:老板,再来二两!', where:'📍 李记清真馆、七家湾', home:3, photo:true, cat:'food' },
  { id:'bean',  name:'赤豆元宵', note:'桂花赤豆糊,小元宵软糯挂勺', quip:'跑完这一碗,还能再跑三关。', where:'📍 莲湖糕团店、老门东', home:3, photo:true, cat:'food' },
  { id:'cake',  name:'梅花糕',   note:'相传乾隆下江南时得了这名字,一朵会爆浆的梅花', quip:'烫嘴也要趁热吃,鸭蹼拿不住也认了。', where:'📍 老门东、夫子庙,左师傅梅花糕', home:3, photo:true, cat:'food' },
  { id:'root',  name:'糖粥藕',   note:'糯米灌藕红糖慢熬,糖粥一浇软糯拉丝', quip:'甜党鸭认证:比糖芋苗还黏牙。', where:'📍 老门东、南京老字号', home:0, photo:true, cat:'food' },
  { id:'egg',   name:'活珠子',   note:'六合名产,十二天旺鸡蛋,鲜掉眉毛的勇士料理', quip:'鸭鸭报警了:你们管这叫小吃?!', where:'📍 六合、街头五香卤锅', home:4, rare:true, photo:true, cat:'food' },
  { id:'bao',   name:'小笼包',   note:'皮薄如纸,一吮一包汤,配姜丝香醋', quip:'鸭鸭用吸管喝汤包,被老板娘瞪了。', where:'📍 刘长兴、鸡鸣汤包,老门东就有', home:6, cat:'food' },
  { id:'xiangdu', name:'南京香肚', note:'猪肚灌肉风干,金陵腊味一绝', quip:'挂起来像灯笼,吃起来像年味。', where:'📍 六合、老门东腊味铺', home:6, cat:'food' },
  { id:'luhao', name:'芦蒿',     note:'春水芦蒿,南京人桌上的第一口春', quip:'鸭鸭嚼不动,但闻着很上头。', where:'📍 春分前后,菜场随便买', home:1, cat:'food' },
  { id:'wufan', name:'乌饭',     note:'乌饭树叶染的糯米饭,四月初八的仪式感', quip:'黑得像墨,香得像春天。', where:'📍 农历四月初八,街头小摊', home:5, cat:'food' },
  { id:'zhuangyuan', name:'状元豆', note:'黄豆煮糖卤,书生赶考前的甜头', quip:'吃了这颗豆,下辈子考状元。', where:'📍 夫子庙一带,旧时赶考路上', home:3, secret:true, riddle:'星光攒够了,状元及第的甜才轮得到你。', cat:'food' },
  /* ---- 工之艺 8 ---- */
  { id:'cloud', name:'云锦',     note:'寸锦寸金,江宁织造的一寸光华', quip:'鸭鸭披上它,整个江宁都亮了。', where:'📍 南京云锦博物馆', home:0, rare:true, photo:true, cat:'craft' },
  { id:'gold',  name:'金箔',     note:'龙潭金箔,万锤打成的一片轻金(图为工艺示意)', quip:'轻得像鸭绒,亮得晃鸭眼。', where:'📍 栖霞龙潭金箔之乡', home:4, rare:true, photo:true, cat:'craft' },
  { id:'lamp',  name:'秦淮花灯', note:'正月里上灯,十里秦淮一夜鱼龙舞', quip:'鸭子提灯:照亮逃亡的路。', where:'📍 夫子庙花灯市场,正月', home:3, rare:true, photo:true, cat:'craft' },
  { id:'ronghua', name:'南京绒花', note:'绒条捻出牡丹,曾是宫花,今是手作', quip:'戴头上比真花轻,拍照还上相。', where:'📍 老门东绒花坊', home:3, cat:'craft' },
  { id:'zheshan', name:'金陵折扇', note:'竹骨宣面,一扇摇出金陵风', quip:'鸭鸭摇扇:本鸭可是文化鸭。', where:'📍 老门东、朝天宫周边', home:6, cat:'craft' },
  { id:'jianzhi', name:'南京剪纸', note:'一把剪刀一张纸,剪出花鸟鱼虫', quip:'剪个鸭鸭贴在窗上,永不逃店。', where:'📍 老门东非遗馆', home:6, cat:'craft' },
  { id:'kejing', name:'金陵刻经', note:'木版雕经,金陵刻经处的千年一版', quip:'字是刻的,心是静的。', where:'📍 淮海路金陵刻经处', home:8, cat:'craft' },
  { id:'baiju', name:'南京白局', note:'方言说唱,老南京的市井小调', quip:'唱的是白话,押的是生活。', where:'📍 夫子庙茶楼、老城南', home:3, secret:true, riddle:'一口气不断腔,十五板眼唱到底。', cat:'craft' },
  /* ---- 迹之忆 9 ---- */
  { id:'elephant', name:'石象路', note:'明孝陵神道,石兽六百米,一站六百年', quip:'石象不追鸭,好评。', where:'📍 明孝陵景区,深秋最美', home:2, photo:true, cat:'ruin' },
  { id:'book',  name:'先锋书店', note:'地下车库里的先锋书店,大地上的异乡者', quip:'鸭鸭看不懂字,但很会装文化鸭。', where:'📍 五台山总店,广州路173号', home:0, rare:true, photo:true, cat:'ruin' },
  { id:'pibie', name:'辟邪',     note:'南朝石兽,镇守帝陵的瑞兽', quip:'比石象凶,但不会追鸭。', where:'📍 南京博物院、六朝石刻', home:7, cat:'ruin' },
  { id:'wadang', name:'人面瓦当', note:'汉代瓦当上的神秘笑脸,从古城里挖出来', quip:'两千年前的鸭鸭同款微笑?', where:'📍 城墙博物馆、六朝博物馆', home:0, cat:'ruin' },
  { id:'chengzhuan', name:'铭文城砖', note:'每块城砖都刻着造砖人的名字,明城墙的实名制', quip:'刻上名字的砖,质量不敢糊弄。', where:'📍 中华门城墙砖库', home:0, cat:'ruin' },
  { id:'nanyanjing', name:'南京眼', note:'连接河西与江心洲的步行斜拉桥,江上的一只大眼睛', quip:'鸭鸭路过它,眼神一对就过江。', where:'📍 河西滨江,晚上亮灯更好看', home:8, rare:true, cat:'ruin' },
  { id:'baoenta', name:'大报恩寺塔', note:'琉璃塔复建,千年佛顶真骨安奉处', quip:'夜里亮灯时,整座城都在仰望。', where:'📍 大报恩寺遗址公园', home:8, cat:'ruin' },
  { id:'zifeng', name:'紫峰大厦', note:'金陵第一高楼,云里雾里都看得见', quip:'跑够一万米,才抬头看得见金陵最高处。', where:'📍 鼓楼广场', home:1, secret:true, riddle:'跑够一万米,才抬头看得见金陵最高处。', cat:'ruin' },
  { id:'baochuan', name:'郑和宝船', note:'七下西洋的宝船队,南京造的龙骨', quip:'跑到海的门口,宝船才起锚。', where:'📍 宝船厂遗址公园', home:9, rare:true, secret:true, riddle:'跑到海的门口,宝船才起锚。', cat:'ruin' },
  /* ---- 生之灵 9 ---- */
  { id:'plum',  name:'梅花',     note:'南京市花,梅花山上凌寒独放', quip:'市花戴在鸭头上,也算南京户口了。', where:'📍 明孝陵梅花山,2-3 月', home:1, photo:true, cat:'creature' },
  { id:'sakura', name:'樱花',    note:'鸡鸣寺路三月,下一场粉白色的雪', quip:'花瓣落鸭头,也算戴过春天了。', where:'📍 鸡鸣寺路、玄武湖樱洲', home:1, photo:true, cat:'creature' },
  { id:'leaf',  name:'梧桐叶',   note:'陵园大道梧桐,南京秋天的入场券', quip:'一片叶子,就是一条颐和路。', where:'📍 陵园大道、颐和路', home:2, photo:true, cat:'creature' },
  { id:'stone', name:'雨花石',   note:'天赐国宝,一枚石子一山水', quip:'挑一块揣兜里,雨花台见。', where:'📍 雨花台、六合横梁', home:4, photo:true, cat:'creature' },
  { id:'guihua', name:'桂花',    note:'金陵桂花,秋风吹过整条街都是甜的', quip:'桂花落进鸭汤,算是加餐。', where:'📍 灵谷寺桂王、街头巷尾', home:2, cat:'creature' },
  { id:'baige', name:'白鸽',     note:'中山陵音乐台前的白鸽,扑棱棱起飞', quip:'鸽子和鸭子互相看不惯,但都怕人。', where:'📍 中山陵音乐台', home:2, cat:'creature' },
  { id:'yinghuo', name:'萤火虫', note:'灵谷寺夏夜,萤光如银河落林', quip:'鸭鸭举着它当灯笼,照亮下山路。', where:'📍 灵谷寺,7-8 月夜晚', home:4, rare:true, cat:'creature' },
  { id:'hufengdie', name:'中华虎凤蝶', note:'南京的蝴蝶名片,春天里振翅', quip:'花开满了,蝶自会来。', where:'📍 紫金山麓,四月', home:4, secret:true, riddle:'花开满了,蝶自会来。', cat:'creature' },
  { id:'jiangtun', name:'江豚',  note:'长江的微笑精灵,比大熊猫还少', quip:'过江的那一夜,江里有微笑的影子。', where:'📍 长江南京段,江心洲附近', home:9, secret:true, riddle:'过江的那一夜,江里有微笑的影子。', cat:'creature' },
];
