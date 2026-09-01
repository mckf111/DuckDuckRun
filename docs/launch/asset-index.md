# DuckDuckRun 微信发布素材索引

## 素材总览

以下可发布素材均位于 `docs/launch/assets/`，画面来源是当前仓库 `main` 分支本地可运行版本的真实浏览器截图。封面和核心玩法图只做裁切、拼图、压缩与事实性文字标注，没有用概念图替代实机图。仓库内素材总量约 **682 KiB**，低于本阶段要求的 5 MB 控制线。

| 文件 | 尺寸 | 类型 | 用途 | 画面来源与处理 | 备注 |
|---|---:|---|---|---|---|
| `cover-900x383.jpg` | 900×383 | JPG | 公众号封面 | `local-formal-run.png` 的真实正式跑局画面，裁切并叠加标题 | 公众号推荐头图构图；未增加不存在的场景 |
| `core-gameplay-1200x800.jpg` | 1200×800 | JPG | 核心玩法图 | `local-tutorial.png`、`local-tutorial-step3.png`、`local-formal-run.png` 三张实机图拼图 | 标注换道、滑铲、跳跃/二段跳和正式跑局 |
| `screenshot-menu.jpg` | 1366×682 | JPG | 实机图 | `local-menu.png` 压缩 | 当前版本菜单；不是旧线上页面 |
| `screenshot-levels.jpg` | 1366×682 | JPG | 实机图 | `local-levels.png` 压缩 | 路线选择和初始解锁状态 |
| `screenshot-tutorial.jpg` | 1366×682 | JPG | 实机图 | `local-tutorial.png` 压缩 | 第 1/4 步教学、明城墙门洞和 HUD |
| `screenshot-formal-run.jpg` | 1366×682 | JPG | 实机图 | `local-formal-run.png` 压缩 | 教学完成后的正式第一关画面 |
| `screenshot-over.jpg` | 1366×682 | JPG | 实机图 | `local-over.png` 压缩 | 真实失败结算、死因、距离和重开入口 |
| `screenshot-mobile-run.jpg` | 844×390 | JPG | 移动横屏实机图 | `local-mobile-run.png` 压缩 | 自动化浏览器横屏视口，不是实体手机微信验证 |
| `qr-placeholder.jpg` | 720×720 | JPG | 二维码区域占位 | 确定性文字排版生成 | 明确写“二维码暂不生成”“请勿扫码”，不是二维码 |

## 原图与会话附件

高分辨率 PNG 原图没有放进仓库，以控制仓库体积；它们保存在本次会话附件目录 `/home/ubuntu/DuckDuckRun-originals/`，包括菜单、选关、教学、正式跑局、失败结算和 844×390 移动横屏截图。原图均由当前本地浏览器真实运行截图复制而来，可在需要二次裁切时使用。仓库内 JPEG 仅用于公众号编辑器和预览，不改变画面事实。

## 图片与文章对应关系

`wechat-article.md` 已嵌入封面、核心玩法图、正式跑局、失败结算和移动横屏图，并为每一张图提供了说明。若公众号编辑器不保留 Markdown 图片引用，需要按照文章顺序手动上传同名 JPG；上传后应在手机预览中重新检查裁切和文字安全区。

封面标题是“我做了一只在南京城门里反复撞墙的白鸭”，对应文章推荐标题。核心玩法图的三块画面分别来自真实教学第 1/4、真实教学第 3/4 和正式跑局，标注采用界面中的“整堵墙只能换道（←→）”“高横梁要贴地滑铲（↓）”和真实可用的 ↑/二段跳动作。失败页截图中的 62 m 和 4 枚鸭蛋属于本次试玩偶然结果，不能在正文或配图说明中写成标准成绩。

## 二维码状态

当前没有稳定生产 HTTPS 地址。旧版 GitHub Pages [`https://mckf111.github.io/DuckDuckRun/`](https://mckf111.github.io/DuckDuckRun/) 虽可访问，但标题仍为“金陵快跑 · 南京实景跑酷”，与当前文章和截图使用的“冲鸭！金陵！”版本不一致。因此本次**不生成二维码、不验证二维码、不把旧地址作为试玩入口**。`qr-placeholder.jpg` 仅用于保留发布版式位置，正式 URL 和实体手机微信烟测完成后必须替换。
