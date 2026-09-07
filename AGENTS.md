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

《冲鸭！金陵！》：南京城市主题三车道跑酷 H5（逃出鸭店的白胖鸭跑遍金陵十景，收集 40 件风物图鉴，含 6 件隐藏档）。无框架、无打包器、无运行时依赖，代码插画 + Wikimedia Commons CC 实景照片；源码可通过 HTTP 直接调试，正式发布只部署经门禁验证的版本化 `dist/` 制品。游戏本体保留所有权利，见 `LICENSE.md`。当前收口线为 `codex/manus-rc-remediation`；不直接改 `main`，合并、推送和生产部署必须分别获得明确授权。

## 怎么跑

ES Modules 必须走 http 协议，`file://` 打不开：

```bash
python -m http.server 8000        # 浏览器开 http://localhost:8000
node tools/e2e/shot.mjs           # e2e 截图冒烟（需先起本地 http 服务）
```

素材管线（重新抓图/调色/字体子集化）见 README 对应章节，用项目内 `.venv`。
字体再生成：`scan_chars` 逻辑见 `tools/` 无独立脚本时，用 `.venv` 的 pyftsubset 对 `chars.txt`/`chars-brush.txt` 子集化（源字体：Ma Shan Zheng 毛笔 + LXGW WenKai Medium，本地缓存于系统临时目录）。

## 技术栈

原生 JS ES Modules + Canvas 2D（960×540 逻辑分辨率，DPR 适配）、WebAudio 合成音频、localStorage 存档（key=`jinling_run_v1`）。无框架、无打包器、无 npm 运行时依赖（仅 tools/e2e 用 playwright-core）；`npm run build` 只做确定性静态复制、指纹化和版本化发布。

## 目录与约定

- `src/`：main.js 入口主循环，game.js 状态与逻辑，ui.js 界面，render.js 场景，art/* 绘制，audio/input/save/share 各司其职。
- **`src/config.js` 是关卡、风物、玩法数值和切片路线配置的唯一数据源**——不要在状态机或 UI 复制玩法配置；界面、分享和许可文案分别留在 `ui.js`、`share.js`、`legal.js`。
- `tools/`：素材抓取/处理脚本 + e2e；`assets/img/src/`、`tools/e2e/shots/`、新建 `docs/` 文件默认不入库；现有已跟踪文档只做事实同步。
- 一个主题一个 commit，信息简要说明改动目的；不提交 node_modules/dist/.venv。
- 代码风格：中文简短注释、单文件内聚、不引新依赖——照现有文件抄风格。

## 当前状态与下一步（2026-09-02）

- `codex/manus-rc-remediation` 从 Manus 候选 `78e04a7` 起修复跨平台构建、发布/回滚、分享、素材登记、字体、触屏布局、竖屏暂停、固定 seed 与截图假绿；实现提交为 `0651ac3`、`bb7d4fe`、`768d707`，尚未推送、合并或部署。
- 当前本地技术候选构建为 `f36b36debf1a`；`npm.cmd run verify`、`npm.cmd run test:release` 与真实 20 分钟 `npm.cmd run test:release:soak` 均通过，Windows/Linux 规范化构建一致。新提交尚未进入 GitHub Actions。
- 线上 GitHub Pages 仍是旧版本，不能作为当前试玩或公众号入口。生产上传、CDN、DNS、二维码、公众号发布均未执行。
- 自动化和 UA 模拟不等于真机/真人：真实微信 WebView、Android/iPhone、三类玩家易学性与重试门槛仍是发布前 `pending`。
- 权威入口：使用/结构见 `README.md`、`STRUCTURE.md`；当前执行状态只看 `MANUS_CONTEXT.md`，`PLAN.md` 是 Manus 分阶段历史计划；部署与回滚见 `docs/deployment/`。
