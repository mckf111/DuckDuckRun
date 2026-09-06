/* ================= 关卡主题(国风剪纸配色) ================= */
export const MOBILE = {
  bookPlayerScale:{touch:1.4,desktop:1.05},
  swipeThreshold:18, inputBuffer:{standard:0.12,easy:0.18}, easySpeed:0.9, rescues:2,
  collectTargets:[40,45,45,50,50,55,55,60,60,65],
  benchmark:{
    len:600,speed:10,collectTarget:40,
    safeLane:-1,tutorialEnd:100,
    rewards:{from:114,to:565,every:30,count:5,gap:1.8,height:.55},
    skillRewards:{count:3,gap:1.7,height:.65,jumpHeight:1.6,groundHeight:.7},
    flight:{z:350,gap:2,count:3,height:3.1,lane:0},
    relic:{z:164,height:.95,defaultId:'chengzhuan'},power:{z:310,kind:'magnet'},
    cueWords:{lanes:['左','中','右'],actions:{jump:'跳',slide:'滑'},seal:'印章',reward:'，收下',safe:'道稳过'},
    beats:[
      {from:0,to:110,name:'出城第一步',cue:'左右滑换道，跟着鸭蛋走'},
      {from:110,to:200,name:'城砖轻响',cue:'先走稳，再试一条新的路'},
      {from:200,to:300,name:'瓮城折返',skill:'weave'},
      {from:300,to:380,name:'桂花风起',cue:'起跳后再上滑一次，试试高处的鸭蛋'},
      {from:380,to:490,name:'灯影穿门',skill:'arch'},
      {from:490,to:601,name:'金陵在前',cue:'稳稳抵达，城门为你敞开'},
    ],
    skills:[
      {id:'weave',name:'瓮城折返',steps:[{z:220,lane:1,action:'lane'},{z:232,lane:0,action:'lane'},{z:244,lane:1,action:'lane'}]},
      {id:'arch',name:'灯影穿门',steps:[{z:425,lane:1,action:'jump'},{z:446,lane:1,action:'slide'}]},
    ],
    obstacles:[
      {z:144,lane:0,type:'low'},{z:172,lane:1,type:'high'},
      {z:220,lane:0,type:'full',skillId:'weave'},{z:232,lane:1,type:'full',skillId:'weave'},
      {z:244,lane:0,type:'full',skillId:'weave'},
      {z:286,lane:1,type:'low'},{z:318,lane:0,type:'high'},
      {z:425,lane:1,type:'low',skillId:'arch'},{z:446,lane:1,type:'high',skillId:'arch'},
      {z:512,lane:1,type:'full'},{z:544,lane:0,type:'low'},
    ],
    gates:[120,200,290,380,490,586],
  },
};
// 每关:天空渐变/地面/车道线/两侧装饰/强调色/障碍母题/远景地标
// mod:关卡修饰器(game.js spawnCluster 层分发,见迭代方案 §C3)
export const NANJING_SLICE = {
  name:'中华门·秦淮夜渡', sub:'三道瓮城，跟着灯影跑',
  sky:['#11213D','#315E69'], ground:'#172638', road:'#1A2A38', lane:'#F4BE57',
  side:'#233847', sideTop:'#6B6E70', accent:'#F4BE57', motif:'crenel',
  hud:'#F4F0E6', textDark:false, speed:10, len:720,
  landmark:'zhonghua', lmColor:'#303B46', side2:'秦淮灯影', mod:'sliceNight',
  referenceSeed:20260903,
  ui:{
    displayName:'中华门 · 秦淮夜渡',
    menuStandard:'南京夜跑切片 · 约 72 秒',
    menuEasy:'轻松 · 灯影护航',
    ledgerLabel:'本局灯牌',
    nonMainline:'夜渡不写主线',
    finishTitle:'夜渡到岸!',
    finishSub:'三道瓮城已过，灯影还在水上。',
  },
  // 两档只调整可读性、容错和反应余量；动作语法不变。
  modes:{
    standard:{ id:'standard', label:'常规', speed:10, rescues:0, inputBuffer:0.10, collisionWidth:0.55, cueLead:12 },
    easy:{ id:'easy', label:'轻松', speed:9, rescues:2, inputBuffer:0.18, collisionWidth:0.46, cueLead:18 },
  },
  // 城市事实只在资料笔记中断言；这里仅保存原创的玩法转译和短提示。
  beats:[
    { id:'onboard', from:0, to:80, cue:'← 向左滑 · 跟灯影入门', spatial:'中华门首道门洞', gameplay:'亮起的安全门洞把瓮城门序转成横移教学' },
    { id:'confidence', from:80, to:220, cue:'穿过瓮城 · 拿盐水鸭牌', spatial:'三道瓮城门序', gameplay:'盐水鸭牌以短音和灯牌计数形成首次正反馈' },
    { id:'choice', from:220, to:380, cue:'左跳摘双灯 · 右侧稳过', spatial:'秦淮画舫灯带', gameplay:'画舫灯影标出高回报跳跃线与安全线' },
    { id:'pressure', from:380, to:510, cue:'门梁将近 · 低头再过一门', spatial:'城门横梁', gameplay:'门洞高度把滑铲读图转成短压力段' },
    { id:'relief', from:510, to:600, cue:'灯影稍缓 · 收好这一盏', spatial:'临水灯影与画舫', gameplay:'安全线补一枚可见灯牌，让玩家在高潮前喘息' },
    { id:'climax', from:600, to:721, cue:'中道夜渡 · 收束在前', spatial:'中华门剪影与水面同框', gameplay:'两侧封墙把终点门洞变成清晰的收束选择' },
  ],
  // 有限路线组合。referenceSeed 保留第3阶段已验证的月影左线，其余只改变中段组合，不引入不可解释随机惩罚。
  routeSets:[
    { id:'moon-left', label:'月影左线',
      gates:[52,142,222,520,690],
      cols:[
        {lane:-1,z:68,y:0.9,kind:'sliceToken',id:'saltedDuck',arc:'slice-start',arcN:1},
        {lane:-1,z:304,y:1.25,kind:'sliceLight',id:'qinhuaiLight',arc:'slice-risk',arcN:2},
        {lane:-1,z:311,y:1.45,kind:'sliceLight',id:'qinhuaiLight',arc:'slice-risk',arcN:2},
        {lane:0,z:548,y:0.95,kind:'sliceLight',id:'qinhuaiLight',arc:'slice-relief',arcN:1},
      ],
      obs:[
        {lane:0,z:30,type:'full',beat:'onboard'}, {lane:0,z:282,type:'full',beat:'choice'},
        {lane:-1,z:300,type:'low',beat:'choice'}, {lane:0,z:480,type:'high',beat:'pressure'},
        {lane:-1,z:656,type:'full',beat:'climax'}, {lane:1,z:656,type:'full',beat:'climax'},
      ],
      demo:[{at:8,action:'left'},{at:296,action:'jump'},{at:450,action:'right'},{at:476,action:'slide'}],
    },
    { id:'boat-right', label:'画舫右线',
      gates:[52,142,222,520,690],
      cols:[
        {lane:-1,z:68,y:0.9,kind:'sliceToken',id:'saltedDuck',arc:'slice-start',arcN:1},
        {lane:1,z:304,y:1.25,kind:'sliceLight',id:'qinhuaiLight',arc:'slice-risk',arcN:2},
        {lane:1,z:311,y:1.45,kind:'sliceLight',id:'qinhuaiLight',arc:'slice-risk',arcN:2},
        {lane:0,z:548,y:0.95,kind:'sliceLight',id:'qinhuaiLight',arc:'slice-relief',arcN:1},
      ],
      obs:[
        {lane:0,z:30,type:'full',beat:'onboard'}, {lane:0,z:282,type:'full',beat:'choice'},
        {lane:1,z:300,type:'low',beat:'choice'}, {lane:0,z:480,type:'high',beat:'pressure'},
        {lane:-1,z:656,type:'full',beat:'climax'}, {lane:1,z:656,type:'full',beat:'climax'},
      ],
      demo:[{at:8,action:'left'},{at:242,action:'right'},{at:255,action:'right'},{at:296,action:'jump'},{at:450,action:'left'},{at:476,action:'slide'}],
    },
    { id:'arch-weave', label:'门序折返',
      gates:[52,142,222,520,690],
      cols:[
        {lane:-1,z:68,y:0.9,kind:'sliceToken',id:'saltedDuck',arc:'slice-start',arcN:1},
        {lane:-1,z:304,y:1.25,kind:'sliceLight',id:'qinhuaiLight',arc:'slice-risk',arcN:2},
        {lane:-1,z:311,y:1.45,kind:'sliceLight',id:'qinhuaiLight',arc:'slice-risk',arcN:2},
        {lane:1,z:548,y:0.95,kind:'sliceLight',id:'qinhuaiLight',arc:'slice-relief',arcN:1},
      ],
      obs:[
        {lane:0,z:30,type:'full',beat:'onboard'}, {lane:0,z:282,type:'full',beat:'choice'},
        {lane:-1,z:300,type:'low',beat:'choice'}, {lane:-1,z:420,type:'full',beat:'pressure'},
        {lane:0,z:480,type:'high',beat:'pressure'}, {lane:-1,z:656,type:'full',beat:'climax'},
        {lane:1,z:656,type:'full',beat:'climax'},
      ],
      demo:[{at:8,action:'left'},{at:296,action:'jump'},{at:404,action:'right'},{at:450,action:'right'},{at:476,action:'slide'},{at:620,action:'left'}],
    },
  ],
};

export const LEVELS = [
  { name:'明城墙', sub:'六百年城砖,从台城跑到中华门',
    sky:['#6e8aaa','#f0d8b0'], ground:'#7a5a3c', road:'#c4a07a', lane:'#f3e2b8',
    side:'#8a6848', sideTop:'#b08960', accent:'#d89a3a', motif:'crenel',
    hud:'#3a2614', textDark:true, speed:9.5, len:520,
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

/* 撞车包袱：按死因抽一条，笑话在前，教学往后站。 */
export const CRASH_LINES = {
  low:['这块砖比我还矮！','鼻子先到的。','绊这一下，挺香。'],
  high:['头先过了，身子没过。','横梁：低头。鸭：不。','差一公分的自尊心。'],
  full:['墙说不行。鸭说再试。','贴上去了。','城砖：过不去。'],
};

/* 鸭子嘟囔。音效用合成呱呱，字只从这里出。 */
export const QUACKS = {
  idle:['腿好短。','桂花还在吧。','前面那墙……是墙。','再跑两步就到。','肚子空空的。'],
  egg:['真香。','又一个。','蛋比我圆。'],
  combo:['停不下来。','再来一串。'],
  magnet:['蛋会自己过来。','这铁真沉。'],
  shield:['这叶子能挡一下。','先顶一次。'],
  gui:['桂花香，蛋翻倍。','发财了。'],
  panic:['啊？','那是墙！'],
  crash:['……蛋还在就行。','城墙比我硬。'],
};

/* 迭代 0 的统一星级口径；迭代 3 再按关卡实测拆分。 */
export const RUN_STAR_THRESHOLDS = [8, 14, 20];

/* 鸭铺升级线(二期 §E3):三条线 × 3 级,花铜钱。星级门槛/过关条件/障碍数值一律不动 */
export const SHOPS = [
  { id:'magnet', name:'磁铁手艺', line:'局内磁铁时长', levels:['6 秒','8 秒','10 秒','12 秒'], price:[50,150,400],
    note:'吸邻道鸭蛋过来,吃得快', icon:'magnet' },
  { id:'gui',    name:'金桂手艺', line:'局内金桂时长', levels:['6 秒','8 秒','10 秒','12 秒'], price:[50,150,400],
    note:'只让鸭蛋翻倍,不影响星级', icon:'gui' },
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

/* 手机界面文案统一维护；视图只读取这些值。 */
export const MOBILE_UI = {
  "text001": "食",
  "text002": "街巷滋味",
  "text003": "工",
  "text004": "金陵手艺",
  "text005": "迹",
  "text006": "城中往事",
  "text007": "灵",
  "text008": "四时生灵",
  "text009": "金陵行旅",
  "text010": "返回",
  "text011": "奔跑节奏",
  "text012": "轻松 · 两次保护",
  "text013": "标准 · 放开跑",
  "text014": "继续旅程",
  "text015": "开始逃跑",
  "text016": "一只白鸭的金陵出逃记",
  "text017": "冲鸭！",
  "text018": "金陵！",
  "text019": "腿短一点，也能跑很远。",
  "text020": "桂花带上了。出发！",
  "text021": "下一站 · ",
  "text022": "游戏功能",
  "text023": "金陵十站",
  "text024": "风物谱 ",
  "text025": "无尽奔跑",
  "text026": "鸭铺",
  "text027": "设置与存档",
  "text028": "素材与版权",
  "text029": "南京 · 十站 · 四十件风物",
  "text030": "下一站，去哪里？",
  "text031": "本版 ",
  "text032": "历史 ",
  "text033": "九站通关 · ",
  "text034": "星 · ",
  "text035": "普通风物",
  "text036": "通关",
  "text037": "后解锁",
  "text038": "开跑",
  "text039": "前往",
  "text040": "<span class=\"lock-label\">未解锁</span>",
  "text041": "待发现的风物",
  "text042": "这件风物还在路上等你。",
  "text043": "寻找线索 · ",
  "text044": "正在追踪",
  "text045": "追踪这件风物",
  "text046": "前往相关路线",
  "text047": "城市风物的游戏化记录，店名与地点不代表商业合作。",
  "text048": "金陵风物谱",
  "text049": "件 · 每一件，都有南京的故事。",
  "text050": "风物分类",
  "text051": "隐藏风物",
  "text052": "已珍藏",
  "text053": "点开看线索",
  "text054": "鸭铺，歇歇脚",
  "text055": "枚鸭蛋",
  "text056": " · 已精通",
  "text057": "<span class=\"badge\">已精通</span>",
  "text058": "蛋 · 升级",
  "text059": "今天穿哪身？",
  "text060": "白鸭与金鸭只改变外观。",
  "text061": "桂花白鸭",
  "text062": "金羽鸭",
  "text063": "15 星解锁金羽鸭",
  "text064": "按你的节奏来",
  "text065": "声音",
  "text066": "音乐",
  "text067": "动作音效",
  "text068": "鸭鸭嘟囔",
  "text069": "音量",
  "text070": "打开声音",
  "text071": "全部静音",
  "text072": "画面",
  "text073": "动态效果",
  "text074": "跟随系统",
  "text075": "减弱动态",
  "text076": "完整动态",
  "text077": "我的旅程备份",
  "text078": "进度保存在当前浏览器。换手机、换域名之前，请先导出。",
  "text079": "导出存档",
  "text080": "导入存档",
  "text081": "待导入：",
  "text082": "件风物，",
  "text083": "枚鸭蛋。导入会替换本机进度，请先导出备份。",
  "text084": "确认替换本机存档",
  "text085": "取消",
  "text086": "重练第一关操作",
  "text087": "第三方照片记录",
  "text088": "原有照片保留来源记录；仅完成独立许可审核的素材可以进入正式发布制品。",
  "text089": "完整声明：",
  "text090": "游戏许可",
  "text091": "授权联系",
  "text092": "抵达城门",
  "text093": "收集 ",
  "text094": " 枚鸭蛋",
  "text095": "取得两枚技巧印章",
  "text096": "城门开了，冲鸭！",
  "text097": "拍拍灰，再跑一趟",
  "text098": "米",
  "text099": " 枚灯牌",
  "text100": "本局拾取已保留，下一次会更熟。",
  "text101": "已达成",
  "text102": "待达成",
  "text103": "这次带回了",
  "text104": " · 隐藏风物",
  "text105": "再跑本关",
  "text106": "起来再跑",
  "text107": "留一张行旅卡",
  "text108": "回到首页",
  "text109": "这一趟，值得记住",
  "text110": "关卡进度",
  "text111": "暂停",
  "text112": "鸭鸭也要喘口气",
  "text113": "等你回来",
  "text114": "继续奔跑",
  "text115": "重练当前动作",
  "text116": "重新开始",
  "text117": "准备好了",
  "text118": "无尽 · 一路向前",
  "text119": "轻松 · ",
  "text120": " 次保护",
  "text121": "金陵第 ",
  "text122": " 站",
  "text123": " 蛋",
  "text124": "印章 ",
  "text125": " 米",
  "text126": "荷叶护盾",
  "text127": "磁铁 ",
  "text128": "秒",
  "text129": "金桂 ",
  "text130": "练习 ",
  "text131": "左右滑换道 · 上滑跳 · 下滑铲",
  "text132": "冲鸭金陵-旅程备份.json",
  "text133": "备份已生成，请妥善保管下载文件。",
  "text134": "升级了 · ",
  "text135": "还差 ",
  "text136": " 枚鸭蛋，再跑一趟吧。",
  "text137": "旅程已导入",
  "text138": "存档文件过大",
  "text139": "请核对后再导入",
  "text140": "存档格式不正确"
};

/* 十站主线：首站保留已试玩标杆，后九站独立技巧和六段节奏。 */
const journeySkill=(id,name,knots)=>({id,name,steps:knots.map(([z,lane,action])=>({z,lane,action}))});
export const JOURNEY_LEVELS = [
 {len:630,speed:10.5,background:'bookJourney1',panel:0,ground:'#d7d4b5',road:'#cfc5a3',lane:'#f5edcf',intro:'湖风来了，沿着堤岸收鸭蛋',practice:'湖堤横石要上滑，长线鸭蛋别漏下',relief:'湖面开阔起来，沿堤歇一口气',finish:'把一阵湖风带回金陵',clearTitle:'湖光收好，继续向前',skills:[journeySkill('lake-line','一线湖光',[[220,1,'lane'],[243,0,'lane'],[266,1,'lane']]),journeySkill('lake-hop','荷风连跃',[[350,1,'jump'],[376,1,'jump'],[402,1,'jump']])]},
 {len:660,speed:11,background:'bookJourney1',panel:1,ground:'#d0d6cd',road:'#cbd0c3',lane:'#faf4d7',intro:'松影夹道，踏上登阶的节拍',practice:'看见低阶再起跳，落稳再跳下一次',relief:'台阶变缓，抬头看一眼蓝瓦',finish:'最后一段，稳稳跑上平台',clearTitle:'登阶到顶，松风在身后',skills:[journeySkill('stairs-three','三阶成拍',[[220,1,'jump'],[243,1,'jump'],[266,1,'jump']]),journeySkill('stairs-return','落地折返',[[347,1,'jump'],[370,0,'lane'],[394,0,'jump']])]},
 {len:690,speed:11.5,background:'bookJourney1',panel:2,ground:'#8b9185',road:'#848a80',lane:'#e4c48b',intro:'秦淮灯亮了，听着桨声往前跑',practice:'低石上滑越过，横灯下滑钻过',relief:'灯影疏了，收好河边这一串',finish:'桨声渐远，把花灯带回去',clearTitle:'灯影穿过，秦淮入画',skills:[journeySkill('lantern-dance','灯下三拍',[[220,1,'jump'],[242,1,'slide'],[264,1,'jump']]),journeySkill('boat-dance','桨声回环',[[350,0,'slide'],[373,0,'jump'],[397,0,'slide']])]},
 {len:720,speed:12,background:'bookJourney2',panel:0,ground:'#86958b',road:'#89958a',lane:'#e1dabb',intro:'钻进松林，山顶的光在前面',practice:'先试一次跳跃，再给翅膀一点空间',relief:'林间风小了，沿山路收好余下的鸭蛋',finish:'越过最后的树影，望见金陵',clearTitle:'山顶到了，灯火在脚下',skills:[journeySkill('pine-rise','借风展翅',[[235,1,'double'],[270,1,'double']]),journeySkill('pine-glide','林间腾挪',[[350,1,'jump'],[376,0,'lane'],[401,0,'double']])]},
 {len:738,speed:12.3,background:'bookJourney2',panel:1,ground:'#cec7aa',road:'#c5b997',lane:'#f8efd0',intro:'梧桐落叶，长街慢慢铺开',practice:'落枝上滑，低枝下滑，先看清再动',relief:'阳光穿过树叶，留一点从容',finish:'街角转过去，下一站在等你',clearTitle:'穿过梧桐，收下一街秋色',skills:[journeySkill('plane-branches','枝间节奏',[[220,1,'slide'],[243,1,'jump'],[266,0,'lane']]),journeySkill('plane-light','树影折返',[[349,0,'jump'],[373,1,'lane'],[398,1,'slide']])]},
 {len:756,speed:12.6,background:'bookJourney2',panel:2,ground:'#c5b198',road:'#b6a38d',lane:'#f5dfb9',intro:'巷口很多，先看好要走的方向',practice:'整墙要换道，小巷也有稳稳的一条路',relief:'巷子宽了，慢慢收好街角风物',finish:'拐过灯下的门，出巷啦',clearTitle:'巷口选对，烟火带回',skills:[journeySkill('alley-choice','巷口四转',[[218,1,'lane'],[237,0,'lane'],[256,1,'lane'],[277,0,'lane']]),journeySkill('alley-roof','檐下穿行',[[349,1,'slide'],[373,0,'lane'],[398,0,'jump']])]},
 {len:780,speed:12.8,background:'bookJourney3',panel:0,ground:'#c4ad85',road:'#bda17d',lane:'#f9ddb0',intro:'枫叶铺开，跟着弯弯的鸭蛋线走',practice:'沿着收集线提前换道，别等到跟前',relief:'夕照落在树梢，留意脚边的风物',finish:'把这一山红叶记住',clearTitle:'枫林穿过，满山秋色入册',arcRewards:true,skills:[journeySkill('maple-arc','红枫弧线',[[220,1,'lane'],[240,0,'lane'],[260,1,'lane'],[280,0,'lane']]),journeySkill('maple-cross','跨道追叶',[[350,1,'jump'],[374,0,'lane'],[399,0,'jump']])]},
 {len:806,speed:13,background:'bookJourney3',panel:1,ground:'#9ba7a0',road:'#a2aaa0',lane:'#fae2a6',intro:'一段一盏灯，把塔影慢慢点亮',practice:'跟住跳与滑的节拍，灯火会一路亮起',relief:'灯火连成线，最后一段稳稳走',finish:'最后一盏灯，等你亲手点亮',clearTitle:'六盏灯齐亮，金陵夜色入怀',lightGates:true,skills:[journeySkill('pagoda-light','琉璃三拍',[[220,1,'jump'],[243,1,'slide'],[266,1,'jump']]),journeySkill('pagoda-steps','逐灯向上',[[350,0,'double'],[376,1,'lane'],[401,1,'slide']])]},
 {len:858,speed:13,background:'bookJourney3',panel:2,ground:'#afb8a5',road:'#80928e',lane:'#eee3ba',intro:'江风来了，把一路学会的动作带上桥',practice:'前面是检修路障，跳滑换道都用得上',relief:'江面开阔起来，最后一段把脚步放稳',finish:'过江啦，十站金陵都在这一趟',clearTitle:'过江成功！十站金陵，一路相逢',skills:[journeySkill('bridge-cross','过江四式',[[217,1,'jump'],[239,0,'lane'],[259,0,'slide'],[285,0,'double']]),journeySkill('bridge-finish','金陵归程',[[348,1,'double'],[372,0,'lane'],[395,0,'jump'],[416,0,'slide']])]},
];
export const JOURNEY_COPY={clearGoal:'抵达终点',gate:'灯火',seal:' · 印章到手！',firstClear:'第一站跑通了，金陵还很长',safe:'道稳过',double:'二段跳'};
export function buildJourneyPlan(index,variant=0){
 if(index===0)return MOBILE.benchmark;
 const source=JOURNEY_LEVELS[index-1],factor=source.len/600,mirror=variant%2?-1:1,z=value=>Math.round(value*factor);
 const skills=source.skills.map(s=>({...s,steps:s.steps.map(step=>({...step,z:z(step.z),lane:step.lane*mirror}))}));
 const practice=[{z:z(112),lane:0,type:'low'},{z:z(158),lane:mirror,type:'high'}];
 const obstacles=[...practice,...skills.flatMap(s=>s.steps.map(step=>({z:step.z,lane:step.action==='lane'?(step.lane===mirror?0:mirror):step.lane,type:step.action==='lane'?'full':step.action==='slide'?'high':'low',skillId:s.id})))];
 return {...MOBILE.benchmark,...source,collectTarget:MOBILE.collectTargets[index],safeLane:-mirror,variant,
  skills,obstacles,cueWords:{...MOBILE.benchmark.cueWords,actions:{jump:'跳',slide:'滑',double:JOURNEY_COPY.double}},
  rewards:{from:28,to:source.len-36,every:32,count:5,gap:1.8,height:.55},
  flight:{z:z(474),gap:2,count:3,height:3.1,lane:0},relicSpots:[z(166),z(452),z(542)],
  gates:[100,190,300,425,540,586].map(z),
  beats:[
   {from:0,to:z(110),name:'引入',cue:source.intro},
   {from:z(110),to:z(190),name:'练习',cue:source.practice},
   {from:z(190),to:z(300),name:'变化',skill:skills[0].id},
   {from:z(300),to:z(430),name:'压力',skill:skills[1].id},
   {from:z(430),to:z(540),name:'舒缓',cue:source.relief},
   {from:z(540),to:source.len+1,name:'收束',cue:source.finish}],
 };
}
