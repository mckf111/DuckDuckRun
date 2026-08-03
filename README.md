# 金陵快跑 · 南京实景跑酷

南京城市主题跑酷小游戏:跑过明城墙、玄武湖、中山陵、夫子庙、紫金山五关(图鉴集齐+15星解锁隐藏关「长江大桥」),收集盐水鸭、鸭血粉丝汤、梅花糕、石象路等 18 件金陵风物。视觉为「实景照片 × 代码插画」混合:远景是 Wikimedia Commons 的南京实景照片(统一下载、调色、加颗粒),角色、障碍、路面、UI 全部由 Canvas 代码实时绘制。零构建、原生 ES Modules。

玩法:三车道跑酷,低障碍跳、高障碍滑铲、整墙换道;连击有音阶爬升,无尽模式有里程碑勋章与 600m 地标报站;结算页可生成拍立得成绩卡分享;15 星解锁金鸭皮肤。

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

深链:`#play` 直接进无尽模式,`#lv0` ~ `#lv4` 直接进对应关卡。

## 部署(传播层)

零构建项目,静态托管直接可用。国内访问速度:境外托管(GitHub Pages 等)不稳,有传播苗头后建议走「ICP 备案 + 国内 CDN」。

```bash
# GitHub Pages 示例(零构建,直接推)
git init && git add . && git commit -m "init"
git remote add origin https://github.com/<你>/<仓库>.git
git push -u origin main    # 仓库 Settings → Pages → Source 选 main 根目录
```

部署后把 `index.html` 的 `og:image` 换成绝对 URL。埋点见 `src/track.js` 顶部 `TRACK_URL`(留空 = 不上报;可用 Cloudflare Web Analytics 补 PV/UV)。

分享链路:结算页「分享成绩」→ 非微信走系统分享/下载;**微信内自动弹全屏遮罩,长按图片保存 + 复制链接**;成绩卡右下角印二维码与回游链接(自研零依赖 QR 生成器 `src/qr.js`,已与 qrcode 参考实现逐模块对拍验证)。

## 目录结构

```
index.html      入口骨架(style + canvas + module script)
src/
  core.js       canvas/透视投影/常量/绘制原语(含接触影/DPR 适配)
  config.js     关卡与收集品数据(6 关 18 风物,含文案/主场权重/里程碑)
  save.js       localStorage 存档(带类型容错)
  audio.js      WebAudio 合成音效 + 五声音阶 BGM
  art/
    photo.js    实景照片:预加载(带超时兜底)/远景背景(叠化)/拍立得风物卡
    road.js     路面纹理(城砖/湖堤石板/花岗岩/石板街/沥青)
    scenery.js  两侧走廊/穿越门/画舫(含剪影回退)
    obstacles.js 障碍(按景点写实物件:城砖堆/敌楼/荷花缸/画舫/路锥…)
    items.js    风物插画(无照片素材时的 fallback)
    player.js   主角:逃出鸭店的白胖鸭(3/4 背视角;15 星金鸭皮肤)
  game.js       游戏状态与主更新逻辑(扫掠碰撞/连击/教学/里程碑/报站)
  render.js     场景渲染(照片远景 → 路面 → 两侧 → 门 → 收集品 → 障碍 → 鸭子 → 晕影)
  ui.js         HUD 与各界面(图鉴=相册,含键盘导航)
  share.js      拍立得成绩卡生成与分享(navigator.share/下载)
  input.js      键盘/触屏输入(多指/画布外松手/IME 容错)
  main.js       入口:照片预加载(缺图回退插画) + 主循环与深链 + 竖屏旋转引导层
  qr.js         零依赖 QR 生成器(V1~4 / L 纠错,分享卡回游二维码)
  track.js      轻量埋点(sendBeacon,TRACK_URL 留空则静默)
assets/
  fonts/        标题用子集化思源宋体(jinling-serif.woff2)与字符表 chars.txt
  icons/        duck-512.png / duck-192.png(游戏图标,make_icon.py 生成)
  img/          实景照片:bg_*.jpg(六张远景横幅)、it_*.jpg(风物卡)、CREDITS.md(署名)
tools/
  make_icon.py          生成 assets/icons 鸭子图标(Pillow)
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

18 件风物全部为实景照片(雨花茶无本尊 CC 照片,以茶园实景代替;云锦用乾隆龙袍织金代表织金工艺;金箔缺南京本地的 CC 实拍图,条目已标注「工艺示意图」)。缺图时所有照片元素仍会自动回退到 `art/items.js` 的代码插画,游戏始终可运行。

## 重新生成标题字体

游戏用字变化后,用项目内 `.venv`(fonttools + brotli)重新子集化:

```bash
# 1. 重新提取字符表(见 assets/fonts/chars.txt 的生成脚本,遍历 src/**/*.js + index.html)
# 2. 下载 Noto Serif SC(可变字重),固定到 wght=600 后子集化:
./.venv/Scripts/fonttools varLib.instancer NotoSerifSC.ttf wght=600 -o NotoSerif600.ttf
./.venv/Scripts/pyftsubset NotoSerif600.ttf --text-file=assets/fonts/chars.txt \
  --flavor=woff2 --output-file=assets/fonts/jinling-serif.woff2 --no-hinting --desubroutinize
```

## 版本控制约定

一个主题一个 commit,提交信息简要说明改动目的;不提交 `node_modules/`、`dist/` 等产物。
