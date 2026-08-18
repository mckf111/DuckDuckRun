# 冲鸭！金陵！· 南京城市跑酷

> 著作权：游戏本体保留所有权利（见 `LICENSE.md`）。实景照片与字体仍走原 CC / OFL 授权。

南京城市主题跑酷小游戏:跑遍金陵十景(明城墙、玄武湖、中山陵、夫子庙、紫金山、颐和路、老门东、栖霞山、大报恩寺 + 隐藏关「长江大桥」),收集 40 件金陵风物(食/工/迹/灵四部,含 6 件按条件解锁的隐藏档)。前九关全部通关、前九关至少 15 星且收集 28/34 件普通风物后解锁大桥,旧档已经通桥则继续开放。视觉为「实景照片 × 预制 WebP 角色/障碍 × Canvas 动态层」混合:首个标杆关使用新版白鸭动作、立体障碍与拾取环,其余场景和加载失败情况继续由代码插画兜底。零构建、原生 ES Modules。

玩法:三车道跑酷,低障碍跳、高障碍滑铲、整墙换道;连击有音阶爬升,无尽模式有里程碑勋章与 600m 地标报站;每件收集品 = 1 枚铜钱,可去鸭铺升级局内道具(磁铁/护盾/金桂);结算页可生成拍立得成绩卡分享;15 星解锁金鸭皮肤。

## 操作

- `←` / `→`(或 `A` / `D`):换道
- `↑` / `空格`(或 `W`):跳跃(可二段跳)
- `↓`(或 `S`):滑铲 / 空中快降
- `P` / `Esc`:暂停、返回
- `M`:静音开关;`Enter`:重开 / 下一关
- 触屏:滑动 = 操作,点击 = 按钮;右上角有暂停与静音按钮
- 竖屏手机自动显示「横过来」引导层

## 本地运行

ES Modules 必须通过 http 协议访问,双击 `index.html`(file://)打不开。任选其一:

```bash
python -m http.server 8000   # 然后浏览器打开 http://localhost:8000
```

或使用 VS Code 的 Live Server 插件。

深链:`#play` 直接进无尽模式,`#lv0` ~ `#lv8` 直接进普通关卡；`#lv9` 仍会校验大桥解锁条件。

## 部署(传播层)

零构建项目,静态托管直接可用。国内访问速度:境外托管(GitHub Pages 等)不稳,有传播苗头后建议走「ICP 备案 + 国内 CDN」。

实施分支的技术预览由 GitHub Actions 在全部测试通过后发布：<https://mckf111.github.io/DuckDuckRun/>。该地址只用于测试，不代表正式机构托管方案。

埋点见 `src/track.js` 顶部 `TRACK_URL`(留空 = 不上报;可用 Cloudflare Web Analytics 补 PV/UV)。

分享链路:结算页「分享成绩」→ 非微信走系统分享/下载;**微信内自动弹全屏遮罩,长按图片保存 + 复制链接**;成绩卡右下角印二维码与回游链接(自研零依赖 QR 生成器 `src/qr.js`,已与 qrcode 参考实现逐模块对拍验证)。

## 目录结构

```
index.html      入口骨架(style + canvas + module script)
src/
  core.js       canvas/透视投影/常量/绘制原语(含接触影/DPR 适配)
  config.js     关卡与收集品数据(10 关 40 风物,含 mod 修饰器/cat/secret/riddle/鸭铺数值)
  save.js       localStorage 存档(带类型容错与 6→10 关索引迁移)
  audio.js      WebAudio 分层节拍 BGM + 合成音效(按速度/连击调强度)
  art/
    photo.js    实景照片:bg_* 按关加载(WebP→JPEG→插画)/远景叠化/it_* 图鉴页懒加载
    road.js     路面纹理(城砖/湖堤石板/花岗岩/石板街/沥青/梧桐柏油/老门东石板/枫叶砾石/琉璃砖/钢桥面)
    scenery.js  两侧走廊/穿越门/画舫/地标剪影(每关母题独立)
    obstacles.js 障碍(按景点写实物件,大桥专修:检修路障/钢桁架镂空/窄桥墩)
    items.js    收集品插画(40 件深描边多色,路上/图鉴/放大层共用)
    player.js   主角:白鸭动作精灵图 + Canvas 兜底(15 星金鸭皮肤)
    sprites.js  预制 WebP 素材加载与分帧,失败时静默回退
  game.js       游戏状态与主更新逻辑(扫掠碰撞/连击/教学/里程碑/报站/道具/隐藏档)
  render.js     场景渲染(照片远景 → 路面 → 两侧 → 门 → 收集品 → 道具 → 障碍 → 鸭子 → 晕影)
  ui.js         HUD 与各界面(图鉴=四部风物谱,纵向滚动,含键盘导航)
  share.js      拍立得成绩卡生成与分享(navigator.share/下载)
  input.js      键盘/触屏输入(多指/画布外松手/IME 容错/图鉴拖拽滚动)
  main.js       入口:首帧启动 + 按关加载/预取 + 主循环与深链 + 竖屏旋转引导层
  qr.js         零依赖 QR 生成器(V1~4 / L 纠错,分享卡回游二维码)
  track.js      轻量埋点(sendBeacon,TRACK_URL 留空则静默)
assets/
  game/         标杆关角色、障碍、拾取环与背景 WebP
  fonts/        三档子集化字体:铭心毛笔 jinling-brush.woff2、文楷 jinling-kai.woff2、系统黑体
  icons/        duck-512.png / duck-192.png(游戏图标,make_icon.py 生成)
  img/          实景照片:bg_*.jpg(11 张远景横幅)、it_*.jpg(18 张风物实拍)、CREDITS.md(署名)
tools/
  make_icon.py          生成 assets/icons 鸭子图标(Pillow)
  process_game_art.py   绿幕素材去背/去溢色与 WebP 压缩
  fetch_assets.py      从 Wikimedia Commons 抓候选照片(仅 CC0/CC-BY/CC-BY-SA/PD)
  fetch_pageimages.py  兜底:取维基百科条目头图
  fetch_openverse.py   第三源:Openverse 聚合 CC 图床补抓(仅可改作授权)
  process_assets.py    Pillow 处理:横幅/方形裁剪、按关调色、颗粒、暗角
  e2e/*.mjs            playwright-core 截图与逻辑推演验证(需本地 http 服务)
docs/           设计文档与审查报告(本地留档,不入库)
```

## 重新生成实景照片

正式产物(`assets/img/*.jpg` 与 `CREDITS.md`)入库;候选原图 `assets/img/src/` 与截图 `tools/e2e/shots/` 不入库。候选的授权/作者信息缓存在 `assets/img/CREDITS.json`。

```bash
./.venv/Scripts/pip install pillow
./.venv/Scripts/python tools/fetch_assets.py       # 抓候选(内置限流退避,约 3~5 分钟)
./.venv/Scripts/python tools/fetch_pageimages.py   # 条目头图兜底(中华门/鸡鸣寺等)
# 逐张看图后,改 tools/process_assets.py 顶部 PICK 选片、GRADE 调色
./.venv/Scripts/python tools/process_assets.py     # 产出 assets/img/*.jpg + CREDITS.md
```

40 件风物中 18 件有实景照片(懒加载,图鉴放大层附「实景对照」;雨花茶以茶园实景代替,云锦用乾隆龙袍织金代表织金工艺,金箔条目已标注「工艺示意图」),22 件为纯插画;路上收集品一律显示插画。缺图时所有照片元素仍会自动回退到 `art/items.js` 的代码插画,游戏始终可运行。

## 重新生成字体

游戏用字变化后,用项目内 `.venv`(fonttools + brotli)重新子集化。源字体:Ma Shan Zheng(马善政楷书,毛笔展示体)+ LXGW WenKai Medium(霞鹜文楷,正文展示体),本地缓存于系统临时目录;字符表由 `src/**/*.js + index.html` 扫描生成:

```bash
# 1. 扫描全部用字写入 assets/fonts/chars.txt(毛笔字白名单另存 chars-brush.txt)
# 2. 子集化文楷:
./.venv/Scripts/pyftsubset LXGWWenKai-Medium.ttf --text-file=assets/fonts/chars.txt \
  --flavor=woff2 --output-file=assets/fonts/jinling-kai.woff2 --no-hinting --desubroutinize
# 3. 子集化毛笔(参数同上,源字体 MaShanZheng.ttf,文本表 chars-brush.txt,产物 jinling-brush.woff2)
```

三档字体分工(见 `ui.js text()`):书法体仅大标题(菜单主标题/过关/撞车),文楷承担 ≥14px 一切正文,<14px 数据与数字回系统黑体。

## 版本控制约定

一个主题一个 commit,提交信息简要说明改动目的;不提交 `node_modules/`、`dist/` 等产物。
