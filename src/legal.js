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

export const CREDIT_SECTIONS = [
  {
    title: '游戏本体',
    lines: [
      '本项目由曹文虎组织创作；依法享有权利的原创程序、美术、角色、文案和音频保留权利。',
      '允许通过官方网址游玩，以及个人非商业截图、录屏并注明游戏名。',
      '未经许可，禁止复制游戏原创源码或素材制作实质相似的游戏，禁止镜像再发布。第三方素材按其各自许可处理。',
      '正式发布版随附完整声明：legal/LICENSE.md。玩法类型不受版权保护；受保护的是这只鸭和这些金陵表达。',
      '部分历史鸭子、障碍及派生图标：Created with Grok。当前绘本角色与场景由 OpenAI 图像生成辅助制作；程序与关卡由作者组织多工具协作完成。',
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
      '图鉴照片来自 Wikimedia Commons 的原始文件记录，作者、来源、具体许可与本地处理说明逐张列出。',
      '当前十站绘本场景与角色采用 AI 辅助图像和程序化绘制，不是实景摄影，也不代表景区授权。',
      '完整照片署名与来源随包提供于 legal/PHOTO-CREDITS.md；旧场景的背景后备也在该文件中列出。',
      '第三方照片独立遵守各自许可，不受游戏原创内容的额外限制覆盖；CC BY-SA 照片的本地处理版本仍沿用其相同许可。',
      '实拍、现场纪实、复原展示与相关示意在照片旁分别标明。暂缺的照片保留插画，不用生成图片冒充摄影。',
      '图鉴照片从本站按需加载，不向外部图片服务发送请求；来源及许可链接仅在主动点击时打开。',
      SHOP_DISCLAIMER,
    ],
  },
];

/* 旧绘图界面兼容的短署名；图鉴部分从当前照片台账派生。 */
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
  ...Object.entries(ALBUM_PHOTOS).filter(([,photo])=>photo.file).map(([id,photo])=>['it_'+id,photo.caption,photo.author,photo.license])
];
