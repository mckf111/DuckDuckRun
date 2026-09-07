import { ALBUM_PHOTOS } from './album-photos.js';
/* 玩家可见的版权与素材说明。游戏本体保留所有权利；照片/字体走原许可证。 */
export const GAME_TITLE = '冲鸭！金陵！';
export const COPYRIGHT_LINE = '© 2026 曹文虎 · 原创内容保留权利';
export const SHOP_DISCLAIMER = '图鉴里的店名、地名只作家乡描述，不构成推荐、广告或合作背书。';

/* 玩家可见声明的发布路径合同；构建器负责复制源文件并写入 build-info.notices。 */
export const PLAYER_VISIBLE_NOTICE_CONTRACT = Object.freeze({
  ui_route:'menu:credits',
  ui_module:'src/legal.js',
  release_files:Object.freeze({
    gameLicense:Object.freeze({source:'LICENSE.md', publicPath:'legal/LICENSE.md'}),
    photoCredits:Object.freeze({source:'assets/album/CREDITS.md', publicPath:'legal/PHOTO-CREDITS.md'}),
    fontLicense:Object.freeze({source:'assets/fonts/OFL.txt', publicPath:'legal/FONT-OFL.txt'}),
  }),
  manifest_field:'notices',
});

// 项目协作署名来自作者确认；官网链接只核对模型名称，不替代逐图来源记录。
export const AI_MODELS = [
  {name:'Kimi K3',url:'https://www.kimi.com/news/kimi-k3'},
  {name:'Qwen3.8-Max',url:'https://www.qwencloud.com/models/qwen3.8-max'},
  {name:'Grok 4.6',url:'https://x.ai/news/grok-4-6'},
  {name:'GPT-6 Astra',url:'https://developers.openai.com/api/docs/models/gpt-6-astra'},
];
export const AI_CREATION_LINE = `Created with ${AI_MODELS[0].name}, ${AI_MODELS[1].name} and ${AI_MODELS[2].name}.`;
export const GROK_ATTRIBUTION_LINE = 'Grok 辅助生成部分：Created with Grok。';
export const AI_FINISH_LINE = `由 ${AI_MODELS[3].name} 完成最终整合、修正与收尾。`;
export const CREDITS_UI = {
  modelLinks:'模型名称与官方资料',fontLicense:'字体许可原文',
  backgroundTitle:'随包保留的背景照片来源',
  backgroundNote:'以下为旧场景与历史照片素材，保留在游戏包中；当前首页和十站主视觉为绘本图像。',
  backgroundChanges:'历史版本包含缩放、压缩或调色；原始处理过程未完整记录。',
  missingTitle:'照片暂缺的图鉴条目',missingNote:'这些条目保留插画，未用 AI 生成图片代替实物照片。',
};
export const PHOTO_SUMMARY = {
  total:Object.keys(ALBUM_PHOTOS).length,
  available:Object.values(ALBUM_PHOTOS).filter(p=>p.file).length,
  missing:Object.values(ALBUM_PHOTOS).filter(p=>!p.file).length,
  kinds:Object.fromEntries(['actual','documentary','reconstruction','related'].map(kind=>[kind,Object.values(ALBUM_PHOTOS).filter(p=>p.file&&p.kind===kind).length])),
};
export const CREDIT_SECTIONS = [
  {
    title:'游戏本体',
    lines:[
      '本项目由曹文虎组织创作；依法享有权利的原创程序、美术、角色、文案和音频保留权利。',
      '允许通过官方网址游玩，以及个人非商业截图、录屏并注明游戏名。',
      '未经许可，禁止复制游戏原创源码或素材制作实质相似的游戏，禁止镜像再发布。第三方素材按其各自许可处理。',
      '玩法类型不受版权保护；权利声明针对本游戏依法受保护的具体表达。完整声明可从本页底部打开。',
    ],
  },
  {
    title:'AI 辅助创作',
    lines:[AI_CREATION_LINE,AI_FINISH_LINE,GROK_ATTRIBUTION_LINE,
      '以上为作者组织的项目协作署名，涵盖程序、画面与内容制作；实景照片和字体另按原作者及各自许可署名。',
      '绘本角色、场景、游戏图标与程序化插画共同构成游戏画面；AI 辅助输出的权利范围依据实际贡献与适用条款判断。',
      '工具与模型名称仅用于说明创作过程，不代表相关厂商参与发行或为游戏背书。',
    ],
    links:[...AI_MODELS,{name:'Grok 署名指引',url:'https://x.ai/legal/brand-guidelines'}],
  },
  {
    title:'字体（SIL OFL 1.1）',
    lines:[
      '首页标题与部分装饰用字：Ma Shan Zheng（马善政楷书），The Ma Shan Zheng Project Authors。',
      '部分标题、图鉴与画布文字：LXGW WenKai Medium（霞鹜文楷），LXGW。常规界面文字也会使用设备自带的系统字体。',
      '两款随包字体均经过 WOFF2 子集化，遵循 SIL Open Font License 1.1；许可原文可从本页底部打开。',
    ],
    links:[{name:'Ma Shan Zheng 字体来源',url:'https://github.com/googlefonts/mashanzheng'},{name:'LXGW WenKai 字体来源',url:'https://github.com/lxgw/LxgwWenKai'}],
  },
  {
    title:'音乐与音效',
    lines:[
      '背景音乐、鸭叫、跳跃、碰撞和收集音效由游戏在浏览器中通过 WebAudio 程序合成；当前版本没有加载第三方歌曲或录音文件。',
      '音乐、音效与鸭叫音量可以在“设置与存档”中分别调整。',
    ],
  },
  {
    title:'实景照片与图鉴',
    lines:[
      `当前 ${PHOTO_SUMMARY.total} 件图鉴中，${PHOTO_SUMMARY.available} 件附有照片，${PHOTO_SUMMARY.missing} 件照片暂缺。已采用照片包括：实物实拍 ${PHOTO_SUMMARY.kinds.actual} 张、现场纪实 ${PHOTO_SUMMARY.kinds.documentary} 张、复原展示 ${PHOTO_SUMMARY.kinds.reconstruction} 张、相关示意 ${PHOTO_SUMMARY.kinds.related} 张。`,
      '图鉴照片来自 Wikimedia Commons 的原始文件记录，作者、原始来源、具体许可与本地处理说明逐张列出。',
      '当前首页与十站主视觉采用 AI 辅助绘本图像和程序化绘制，不是实景摄影，也不代表景区授权。',
      '第三方照片独立遵守各自许可，不受游戏原创内容的额外限制覆盖；CC BY-SA 照片的本地处理版本仍沿用其相同许可。',
      '实物实拍、现场纪实、复原展示与相关示意在照片旁分别标明。暂缺照片的条目保留插画，不用生成图片冒充摄影。',
      '图鉴照片从本站按需加载；来源及许可链接只在主动点击时打开。',
      SHOP_DISCLAIMER,
    ],
  },
];

/* 最终背景来源以 assets/img/CREDITS.md 为准；CREDITS.json 含候选原图，不能替代最终记录。 */
export const BACKGROUND_CREDITS = [
  {
    "id": "bg_zhonghua",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File%3A2024Apr_-_Nanjing_-_East_Zhonghua_Gate_%E4%B8%AD%E5%8D%8E%E4%B8%9C%E9%97%A8_-_img_04.jpg",
    "author": "Chainwit.",
    "license": "CC BY 4.0",
    "name": "中华东门",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "files": [
      "assets/img/bg_zhonghua.jpg",
      "assets/img/bg_zhonghua.webp",
      "assets/game/bg-zhonghua.webp"
    ]
  },
  {
    "id": "bg_jiming",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AJiming_Temple_Nanjing%2C_2019_%28cropped%29.jpg",
    "author": "BlueSkySummer",
    "license": "CC BY-SA 4.0",
    "name": "鸡鸣寺",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "files": [
      "assets/img/bg_jiming.jpg",
      "assets/img/bg_jiming.webp"
    ]
  },
  {
    "id": "bg_sunyard",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AHall_of_Sun_Yat-sen_Mausoleum.jpg",
    "author": "Jiong Sheng from London, United Kingdom",
    "license": "CC BY-SA 2.0",
    "name": "中山陵祭堂",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/",
    "files": [
      "assets/img/bg_sunyard.jpg",
      "assets/img/bg_sunyard.webp"
    ]
  },
  {
    "id": "bg_zhaobi",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AConfucius_Temple_and_Qinhuai_River%2C_Nanjing_Night.jpg",
    "author": "Dick Rochester",
    "license": "CC BY-SA 2.0",
    "name": "夫子庙秦淮夜",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/",
    "files": [
      "assets/img/bg_zhaobi.jpg",
      "assets/img/bg_zhaobi.webp"
    ]
  },
  {
    "id": "bg_observatory",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File%3APurple_Mountain_Observatory_2016.7.16-1.jpg",
    "author": "Gmbsfd",
    "license": "CC BY-SA 4.0",
    "name": "紫金山天文台",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "files": [
      "assets/img/bg_observatory.jpg",
      "assets/img/bg_observatory.webp"
    ]
  },
  {
    "id": "bg_bridge",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ANanjing_Yangtze_River_Bridge.jpg",
    "author": "Jack No1",
    "license": "CC BY 3.0",
    "name": "南京长江大桥",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0/",
    "files": [
      "assets/img/bg_bridge.jpg",
      "assets/img/bg_bridge.webp"
    ]
  },
  {
    "id": "bg_menu",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AFull_view_of_Nanjing_Eye_Pedestrian_Bridge.jpg",
    "author": "Uyiliu2",
    "license": "CC BY-SA 4.0",
    "name": "南京眼步行桥",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "files": [
      "assets/img/bg_menu.jpg",
      "assets/img/bg_menu.webp",
      "assets/game/menu-background.webp"
    ]
  },
  {
    "id": "bg_yihe",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AFormer_Consulate_of_Mexico_in_Nanjing_2012-11.JPG",
    "author": "猫猫的日记本",
    "license": "CC BY-SA 3.0",
    "name": "颐和路民国建筑",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "files": [
      "assets/img/bg_yihe.jpg",
      "assets/img/bg_yihe.webp"
    ]
  },
  {
    "id": "bg_mendong",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File%3A%E8%80%81%E9%97%A8%E4%B8%9C20200125_09.jpg",
    "author": "西安兵马俑",
    "license": "CC BY-SA 4.0",
    "name": "老门东",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "files": [
      "assets/img/bg_mendong.jpg",
      "assets/img/bg_mendong.webp"
    ]
  },
  {
    "id": "bg_qixia",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AQixia_Mountain_Autumn.jpg",
    "author": "Haha169",
    "license": "CC BY-SA 4.0",
    "name": "栖霞山秋色",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "files": [
      "assets/img/bg_qixia.jpg",
      "assets/img/bg_qixia.webp"
    ]
  },
  {
    "id": "bg_baoen",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File%3A2024Apr_-_Glass_Pagoda_of_Nanjing_-_img_03.jpg",
    "author": "Chainwit.",
    "license": "CC BY 4.0",
    "name": "大报恩寺琉璃塔",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "files": [
      "assets/img/bg_baoen.jpg",
      "assets/img/bg_baoen.webp"
    ]
  }
];

/* 旧绘图界面兼容的短署名由同一份资料派生。 */
export const PHOTO_CREDITS = [
  ...BACKGROUND_CREDITS.map(p=>[p.id,p.name,p.author,p.license]),
  ...Object.entries(ALBUM_PHOTOS).filter(([,photo])=>photo.file).map(([id,photo])=>['it_'+id,photo.caption,photo.author,photo.license]),
];
