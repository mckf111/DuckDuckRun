# AGENTS.md

## 定位

《金陵快跑》：南京城市主题三车道跑酷 H5（逃出鸭店的白胖鸭跑遍金陵五景 + 隐藏关长江大桥，收集 18 件风物图鉴）。零构建、无依赖、全代码绘制 + Wikimedia Commons CC 实景照片。

## 怎么跑

ES Modules 必须走 http 协议，`file://` 打不开：

```bash
python -m http.server 8000        # 浏览器开 http://localhost:8000
node tools/e2e/shot.mjs           # e2e 截图冒烟（需先起本地 http 服务）
```

素材管线（重新抓图/调色/字体子集化）见 README 对应章节，用项目内 `.venv`。

## 技术栈

原生 JS ES Modules + Canvas 2D（960×540 逻辑分辨率，DPR 适配）、WebAudio 合成音频、localStorage 存档（key=`jinling_run_v1`）。无框架、无构建、无 npm 运行时依赖（仅 tools/e2e 用 playwright-core）。

## 目录与约定

- `src/`：main.js 入口主循环，game.js 状态与逻辑，ui.js 界面，render.js 场景，art/* 绘制，audio/input/save/share 各司其职。
- **`src/config.js` 是关卡、风物、文案、数值的唯一数据源**——改文案/数值改这里，别散落到 ui.js。
- `tools/`：素材抓取/处理脚本 + e2e；`assets/img/src/`（候选原图）、`tools/e2e/shots/`、`docs/` 均不入库（见 .gitignore）。
- 一个主题一个 commit，信息简要说明改动目的；不提交 node_modules/dist/.venv。
- 代码风格：中文简短注释、单文件内聚、不引新依赖——照现有文件抄风格。

## 当前状态与下一步（2026-08-04）

- 分支 `review/adversarial-audit`：已按 `docs/adversarial-review.md` §7 行动顺序迭代一轮（docs 不入库属正常）。
- 已完成：存档白屏兜底/album 白名单（save.js）、竖屏旋转引导层、HUD 暂停+静音按钮、BGM 离场即停、教学改造（按设备文案/整墙/二段跳/首关教案簇/跨过首障后落盘）、生成器约束（错位禁免费道+随速收缩、均匀洗牌、一串全收按弧线计数）、full 高度豁免（二段跳可飞越）、文化风险软化（金箔标注工艺示意图+口号改「背景风景,皆是实景南京」、多来两两→再来二两、雨花茶/梅花糕/雨花石/南京大牌档/绝对化用语）、里程碑补 1000/1500、无尽主题与报站统一 6 段、结算页距终点进度、分享卡金鸭+二维码、微信内长按保存遮罩+复制链接、埋点（src/track.js，TRACK_URL 留空即静默）、meta/OG/图标（assets/icons，make_icon.py）、QR 生成器（src/qr.js，已与 qrcode 参考实现逐模块对拍验证）。
- 剩余待办：F7 公网部署（GitHub Pages 步骤见 README「部署」章节，og:image 需换绝对 URL）、H7 分级加载/WebP（阶段 1）、埋点接入真实端点、微信 UA 提示条已做但「在浏览器打开」引导仅菜单处显示。
- 定位口径：免费公益 H5 / 政企合作敲门砖；合规红线见报告 §6 清单。
- e2e：`tools/e2e/shot.mjs`（截图冒烟）、`share_check.mjs`（分享链路/竖屏层）、`ui_check.mjs`（HUD 交互/教学文案）、`save_check.mjs`（存档容错）；跑之前需起本地 http 服务。
