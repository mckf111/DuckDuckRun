# 开发与素材维护

本页保留本地开发、素材处理与发布命令。项目介绍见 [README](../README.md)。

## 操作

- `←` / `→`(或 `A` / `D`):换道
- `↑` / `空格`(或 `W`):跳跃(可二段跳)
- `↓`(或 `S`):滑铲 / 空中快降
- `P` / `Esc`:暂停、返回
- `M`:静音开关;`Enter`:重开 / 下一关
- 触屏：滑动超过 18 CSS 像素即操作，一次手势一次动作；右上角暂停，声音在设置中分路调节。
- 竖屏直接游玩；旋转、切后台后暂停，玩家继续时出现可跳过倒数。

## 本地运行

ES Modules 必须通过 http 协议访问,双击 `index.html`(file://)打不开。任选其一:

```bash
python -m http.server 8000   # 然后浏览器打开 http://localhost:8000
```

或使用 VS Code 的 Live Server 插件。

深链:`#play` 直接进无尽模式,`#lv0` ~ `#lv8` 直接进普通关卡；`#lv9` 仍会校验大桥解锁条件。

## 部署(传播层)

本地源码可通过 HTTP 直接运行；正式发布必须冷安装并通过 `npm run verify`、`npm run test:release` 与独立 20 分钟 soak，只上传该次生成并验证过的完整 `dist/`，不得在云端重新构建或只上传源码目录。目标为阿里云大陆 OSS/CDN；ICP备案、游戏公开出版/运营适用手续与素材批准分别核验，当前门槛未关闭。

当前 <https://mckf111.github.io/DuckDuckRun/> 由 `main` 的旧版本提供，只是历史预览，不能作为最新试玩、二维码或公众号入口。现有 GitHub Actions 只生成并保留候选制品与证据，不执行生产部署。

埋点见 `src/track.js` 顶部 `TRACK_URL`(留空 = 不上报;可用 Cloudflare Web Analytics 补 PV/UV)。

分享链路:结算页「分享成绩」→ 非微信走系统分享/下载;**微信内自动弹全屏遮罩,长按图片保存 + 复制链接**;成绩卡右下角印二维码与回游链接(自研零依赖 QR 生成器 `src/qr.js`,已与 qrcode 参考实现逐模块对拍验证)。二维码和复制文案始终指向稳定站点根入口，不携带 `/releases/<build-id>/`，因此不会绕过根指针回滚。

## 目录结构

```
index.html      入口骨架(style + canvas + module script)
src/
  core.js       canvas/透视投影/常量/绘制原语(含接触影/DPR 适配)
  config.js     关卡与收集品数据(10 关 40 风物,含 mod 修饰器/cat/secret/riddle/鸭铺数值)
  save.js       localStorage 存档(带类型容错与 6→10 关索引迁移)
  audio.js      WebAudio 分层节拍 BGM + 合成音效(按速度/连击调强度)
  art/
    photo.js    实景照片:bg_* 按关加载(WebP→JPEG→插画)/远景叠化/图鉴照片兼容加载
    road.js     路面纹理(城砖/湖堤石板/花岗岩/石板街/沥青/梧桐柏油/老门东石板/枫叶砾石/琉璃砖/钢桥面)
    scenery.js  两侧走廊/穿越门/画舫/地标剪影(每关母题独立)
    obstacles.js 障碍(按景点写实物件,大桥专修:检修路障/钢桁架镂空/窄桥墩)
    items.js    收集品插画(40 件深描边多色,路上/图鉴/放大层共用)
    player.js   主角:白鸭动作精灵图 + Canvas 兜底(15 星金鸭皮肤)
    sprites.js  预制 WebP 素材加载与分帧,失败时静默回退
  game.js       游戏状态与主更新逻辑(扫掠碰撞/连击/教学/里程碑/报站/道具/隐藏档)
  render.js     场景渲染(照片远景 → 路面 → 两侧 → 门 → 收集品 → 道具 → 障碍 → 鸭子 → 晕影)
  dom-ui.js     当前原生界面、皮肤选择与照片详情/放大/重试
  album-photos.js 由照片台账生成的运行时目录
  ui.js         保留的旧 Canvas 界面与兼容交互
  share.js      拍立得成绩卡生成与分享(navigator.share/下载)
  input.js      键盘/触屏输入(多指/画布外松手/IME 容错/图鉴拖拽滚动)
  main.js       入口:首帧启动 + 按关加载/预取 + 主循环与深链 + 竖屏旋转引导层
  qr.js         零依赖 QR 生成器(V1~4 / L 纠错,分享卡回游二维码)
  track.js      轻量埋点(sendBeacon,TRACK_URL 留空则静默)
assets/
  game/         标杆关角色、障碍、拾取环与背景 WebP
  fonts/        三档子集化字体:铭心毛笔 jinling-brush.woff2、文楷 jinling-kai.woff2、系统黑体
  icons/        duck-512.png / duck-192.png(游戏图标,make_icon.py 生成)
  album/        当前图鉴照片、REVIEW.json 核验台账、CREDITS.md 署名
  img/          历史背景后备；it_* 旧图鉴照片保留追溯但不随包发布
tools/
  make_icon.py          生成 assets/icons 鸭子图标(Pillow)
  process_game_art.py   绿幕素材去背/去溢色与 WebP 压缩
  fetch_assets.py      从 Wikimedia Commons 抓候选照片(仅 CC0/CC-BY/CC-BY-SA/PD)
  fetch_pageimages.py  兜底:取维基百科条目头图
  fetch_openverse.py   第三源:Openverse 聚合 CC 图床补抓(仅可改作授权)
  process_assets.py    Pillow 处理:横幅/方形裁剪、按关调色、颗粒、暗角
  e2e/*.mjs            playwright-core 截图与逻辑推演验证(需本地 http 服务)
docs/           已跟踪的设计、审查、QA 与部署合同；新增文件需明确决定后显式加入
```

## 图鉴照片与来源

<!-- album-summary:start -->
全部 40 件风物均有检索结论。当前采用 30 张：准确实拍 23；现场纪实 3；复原展示 1；相关示意 3；照片暂缺 10。
<!-- album-summary:end -->

逐项原因和来源见 [ALBUM-REVIEW.md](../ALBUM-REVIEW.md)。雨花茶不再以茶园冒充本体；原梅花糕照片因对象不符停用；动物标本、异地实拍和相关示意均在照片旁标明。

照片只在打开已获得条目的详情时同源加载，支持放大、关闭及加载失败重试。首页、局内和图鉴列表不预载照片；隐藏条目未解锁不请求对应照片。

当前台账是 assets/album/REVIEW.json；运行时目录、署名文件与核验报告由同一台账生成。原始下载及 API 证据留在 docs/album-review，不进网页包。停用的 assets/img/it_* 与候选记录也不进入新包；仍被引用的背景后备保留。

```bash
# 常规一致性检查（不需要重新联网）
node tools/sync_album_catalog.mjs --check

# 更新照片时：先检索和选片，再逐张查看、记录取舍
./.venv/Scripts/python tools/research_album_photos.py
# 编辑 tools/album_photo_choices.json 中的原始文件与用途
./.venv/Scripts/python tools/prepare_album_photos.py
# 逐张核验候选后填写 visualReview；不能用自动生成的说明冒充核验
./.venv/Scripts/python tools/finalize_album_photos.py
node tools/sync_album_catalog.mjs
```

原背景素材管线仍在 tools/fetch_assets.py、fetch_pageimages.py、process_assets.py，按历史场景需求使用，不用于覆盖当前图鉴照片。新照片保留具体许可、作者、原始文件版本与处理记录；公开发布审核仍独立执行。

## 重新生成字体

游戏用字变化后,用项目内 `.venv`(fonttools + brotli)重新子集化。源字体:Ma Shan Zheng(马善政楷书,毛笔展示体)+ LXGW WenKai Medium(霞鹜文楷,正文展示体);从两者官方仓库/Release 获取后只放系统临时目录,不提交源 TTF。字符表由 `src/**/*.js + index.html` 扫描生成:

```bash
# 1. 扫描全部用字写入 assets/fonts/chars.txt(毛笔字白名单另存 chars-brush.txt)
# 2. 子集化文楷:
./.venv/Scripts/pyftsubset LXGWWenKai-Medium.ttf --text-file=assets/fonts/chars.txt \
  --flavor=woff2 --output-file=assets/fonts/jinling-kai.woff2 --no-hinting --desubroutinize
# 3. 子集化毛笔(参数同上,源字体 MaShanZheng.ttf,文本表 chars-brush.txt,产物 jinling-brush.woff2)
```

字体分工(见 `ui.js text()`):书法体仅用于菜单主标题、过关和撞车等大标题;其余 Canvas 中文统一优先使用内嵌文楷,再回退系统中文字体,避免 Linux/精简 WebView 的小字号中文出现方框。

## 版本控制约定

一个主题一个 commit,提交信息简要说明改动目的;不提交 `node_modules/`、`dist/` 等产物。
