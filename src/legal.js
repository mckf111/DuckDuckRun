/* 玩家可见的版权与素材说明。游戏本体保留所有权利；照片/字体走原许可证。 */
export const GAME_TITLE = '冲鸭！金陵！';
export const COPYRIGHT_LINE = '© 作者 · 保留所有权利 · 可玩不可抄';
export const SHOP_DISCLAIMER = '图鉴里的店名、地名只作家乡描述，不构成推荐、广告或合作背书。';

/* 玩家可见声明的发布路径合同；构建器负责复制源文件并写入 build-info.notices。 */
export const PLAYER_VISIBLE_NOTICE_CONTRACT = Object.freeze({
  ui_route:'menu:credits',
  ui_module:'src/legal.js',
  release_files:Object.freeze({
    gameLicense:Object.freeze({source:'LICENSE.md', publicPath:'legal/LICENSE.md'}),
    photoCredits:Object.freeze({source:'assets/img/CREDITS.md', publicPath:'legal/PHOTO-CREDITS.md'}),
    fontLicense:Object.freeze({source:'assets/fonts/OFL.txt', publicPath:'legal/FONT-OFL.txt'}),
  }),
  manifest_field:'notices',
});

export const CREDIT_SECTIONS = [
  {
    title: '游戏本体',
    lines: [
      '程序、原创美术、桂花鸭角色、界面、文案、关卡与合成音频，著作权归作者所有，保留一切权利。',
      '允许通过官方网址游玩，以及个人非商业截图、录屏并注明游戏名。',
      '禁止复制源码或素材做相同或实质相似的游戏，禁止镜像再发布与拆素材商用。',
      '正式发布版随附完整声明：legal/LICENSE.md。玩法类型不受版权保护；受保护的是这只鸭和这些金陵表达。',
    ],
  },
  {
    title: '字体（SIL OFL 1.1）',
    lines: [
      '标题用字：马善政楷书 Ma Shan Zheng，OFL-1.1。',
      '正文用字：霞鹜文楷 LXGW WenKai Medium，OFL-1.1。',
      '仓库内为子集化 woff2，正式发布版许可原文见 legal/FONT-OFL.txt。',
    ],
  },
  {
    title: '实景照片',
    lines: [
      '远景与部分风物照片来自 Wikimedia Commons / Openverse，按各自 CC 或公有领域授权使用。',
      '正式发布版完整照片署名与来源见 legal/PHOTO-CREDITS.md。',
      '游戏只把照片当作远景或图鉴对照，不把整款游戏改成知识共享协议。',
      '金箔、云锦、雨花茶等替代图在条目中标为工艺示意或相关实景，不是该物本尊。',
      SHOP_DISCLAIMER,
    ],
  },
];

/* 与 assets/img/CREDITS.md 同步的短署名，供授权页滚动列表。 */
export const PHOTO_CREDITS = [
  ['bg_zhonghua', '中华东门', 'Chainwit.', 'CC BY 4.0'],
  ['bg_jiming', '鸡鸣寺', 'BlueSkySummer', 'CC BY-SA 4.0'],
  ['bg_sunyard', '中山陵祭堂', 'Jiong Sheng from London, United Kingdom', 'CC BY-SA 2.0'],
  ['bg_zhaobi', '夫子庙秦淮夜', 'Dick Rochester', 'CC BY-SA 2.0'],
  ['bg_observatory', '紫金山天文台', 'Gmbsfd', 'CC BY-SA 4.0'],
  ['bg_bridge', '南京长江大桥', 'Jack No1', 'CC BY 3.0'],
  ['bg_menu', '南京眼步行桥', 'Uyiliu2', 'CC BY-SA 4.0'],
  ['bg_yihe', '颐和路民国建筑', '猫猫的日记本', 'CC BY-SA 3.0'],
  ['bg_mendong', '老门东', '西安兵马俑', 'CC BY-SA 4.0'],
  ['bg_qixia', '栖霞山秋色', 'Haha169', 'CC BY-SA 4.0'],
  ['bg_baoen', '大报恩寺琉璃塔', 'Chainwit.', 'CC BY 4.0'],
  ['it_duck', '盐水鸭', 'AddisWang', 'CC BY-SA 3.0'],
  ['it_fans', '鸭血粉丝汤', 'N509FZ', 'CC BY-SA 4.0'],
  ['it_taro', '桂花糖芋苗', 'AddisWang', 'CC BY-SA 3.0'],
  ['it_plum', '梅花山梅花', '西安兵马俑', 'CC BY-SA 4.0'],
  ['it_stone', '雨花石', 'Caitriana Nicholson from 北京 ~ Beijing, 中国 ~ China', 'CC BY-SA 2.0'],
  ['it_tea', '茶园相关实景', '董辰兴', 'CC BY-SA 4.0'],
  ['it_pot', '牛肉锅贴', 'avlxyz', 'CC BY-SA 2.0'],
  ['it_bean', '赤豆元宵', 'avlxyz', 'CC BY-SA 2.0'],
  ['it_cloud', '织金工艺示意', 'Dr. Meierhofer', 'CC BY-SA 3.0'],
  ['it_gold', '金箔工艺示意', 'Eckhard Pecher', 'CC BY 2.5'],
  ['it_leaf', '梧桐叶', 'Nyx Ning', 'CC BY-SA 3.0'],
  ['it_lamp', '秦淮花灯', 'Ralph.Torello', 'Public Domain'],
  ['it_cake', '梅花糕', 'François Nguyen', 'CC BY 2.0'],
  ['it_root', '糖粥藕', 'Pauloleong2002', 'CC BY-SA 4.0'],
  ['it_egg', '活珠子', 'Berthe', 'CC BY-SA 3.0'],
  ['it_elephant', '明孝陵石象路', '董辰兴', 'CC BY-SA 4.0'],
  ['it_sakura', '鸡鸣寺路樱花', 'helkonig', 'CC BY 3.0'],
  ['it_book', '先锋书店五台山店外观', 'JosephLai', 'CC BY-SA 4.0'],
];
