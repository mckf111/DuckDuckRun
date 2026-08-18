# AGENTS.md

## 语言风格

1. 默认使用简体中文；外文专业名词首次出现时，补充简短的中文解释。
2. 使用直白易懂的大白话，可以幽默，但准确优先。

## 做事原则

1. 第一性原理管目标：先明确真实目标、约束和完成标准，再动手。
2. 科斯定理管委派：只有并行收益大于沟通与整合成本，且任务可独立验收时，才委派子 Agent。
3. 奥卡姆剃刀管实现：采用最小充分方案，不为假设中的未来需求增加功能、模块、抽象或依赖。
4. 墨菲定律管测试：重点验证高概率或高影响的失败路径、边界条件和回滚能力，不无限扩大测试范围。
5. 古德哈特定律管指标：指标是证据，不是目标；不得为了变绿、凑数或好看而降低标准或偏离真实目标。
6. 停止规则管重试：没有新证据时，同一做法最多重试一次；再次失败必须更新判断或更换方法。继续行动若既不改善结果、不降低风险、不提供必要证据，也不解除阻塞，就记录遗留及影响，然后停止。

## 定位

《冲鸭！金陵！》：南京城市主题三车道跑酷 H5（逃出鸭店的白胖鸭跑遍金陵十景，收集 40 件风物图鉴，含 6 件隐藏档）。零构建、无依赖、代码插画 + Wikimedia Commons CC 实景照片。游戏本体保留所有权利，见 `LICENSE.md`。工作只在 `codex/trusted-experience` 进行，不直接改 `main`。

## 怎么跑

ES Modules 必须走 http 协议，`file://` 打不开：

```bash
python -m http.server 8000        # 浏览器开 http://localhost:8000
node tools/e2e/shot.mjs           # e2e 截图冒烟（需先起本地 http 服务）
```

素材管线（重新抓图/调色/字体子集化）见 README 对应章节，用项目内 `.venv`。
字体再生成：`scan_chars` 逻辑见 `tools/` 无独立脚本时，用 `.venv` 的 pyftsubset 对 `chars.txt`/`chars-brush.txt` 子集化（源字体：Ma Shan Zheng 毛笔 + LXGW WenKai Medium，本地缓存于系统临时目录）。

## 技术栈

原生 JS ES Modules + Canvas 2D（960×540 逻辑分辨率，DPR 适配）、WebAudio 合成音频、localStorage 存档（key=`jinling_run_v1`）。无框架、无构建、无 npm 运行时依赖（仅 tools/e2e 用 playwright-core）。

## 目录与约定

- `src/`：main.js 入口主循环，game.js 状态与逻辑，ui.js 界面，render.js 场景，art/* 绘制，audio/input/save/share 各司其职。
- **`src/config.js` 是关卡、风物、文案、数值的唯一数据源**——改文案/数值改这里，别散落到 ui.js（LEVELS 含 mod 修饰器字段、ITEMS 含 cat/secret/riddle、SHOPS 鸭铺数值）。
- `tools/`：素材抓取/处理脚本 + e2e；`assets/img/src/`（候选原图）、`tools/e2e/shots/`、`docs/` 均不入库（见 .gitignore）。
- 一个主题一个 commit，信息简要说明改动目的；不提交 node_modules/dist/.venv。
- 代码风格：中文简短注释、单文件内聚、不引新依赖——照现有文件抄风格。

## 当前状态与下一步（2026-08-04 二期 v2 已全部落地）

- 分支 `review/adversarial-audit`；二期方案 `docs/iteration-v2.md` 五阶段 A~E 全部完成并提交：
  - **A**（053e9ad）：首页+选关翻新——暮色金陵令牌（黛蓝/湖青/云金/月白/朱砂）、三档字体（铭心毛笔+文楷+黑体）、南京眼蓝调背景、5 张新实景照、按钮精简。
  - **B**（9d1c586）：收集品全插画化——items.js 40 件插画（深描边+多色+高光）、路上金晕、it_* 照片懒加载、放大层插画+实景对照。
  - **C**（caa1017）：关卡 6→10——颐和路/老门东/栖霞山/大报恩寺新四关+大桥隐藏位迁至第 10 站（旧档 cleared[5]→[9] 自动迁移）、大桥专修（检修路障/钢桁架镂空/窄桥墩）、10 关修饰器（config 的 mod 字段，game.js 分发）、字体子集重建。
  - **D**（3a1a919）：图鉴 18→40（四部：食 14/工 8/迹 9/灵 9）、6 件隐藏风物按条件解锁（25 星/15 连击/累计万米/集齐生之灵/通大桥/无尽 3000m）不进掉落池、distTotal 累计里程、图鉴页改版（印章部头+纵向滚动+???谜面+隐藏红点）。
  - **E**（3d7c281）：铜钱（1 件=1 枚）+局内三道具（磁铁/护盾/金桂，免费道发光生成，间隔 150~250m）+鸭铺三升级线（时长/间隔，花铜钱）；星级门槛/障碍数值一律未动。
- e2e 全部可用：`sim.mjs`（T1-T5，含 10 关无全堵断言；T4 用轻量快照替代 structuredClone 保可跑）、`shot.mjs`（13 页）、`save_check.mjs`（含 6→10 关存档迁移用例）、`share_check.mjs`、`ui_check.mjs`。
- 剩余待办：F7 公网部署（GitHub Pages，og:image 需换绝对 URL）、H7 分级加载/WebP（阶段 1）、埋点接入真实端点（src/track.js TRACK_URL 留空即静默）、微信 UA 提示条已做但「在浏览器打开」引导仅菜单处显示。
- 定位口径：免费公益 H5 / 政企合作敲门砖；合规红线见 `docs/adversarial-review.md` §6 清单。
