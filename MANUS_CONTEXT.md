# DuckDuckRun Agent 上下文

## 当前任务状态

第 3 阶段“南京代表性垂直切片”已在 `manus/duckduckrun-hardening` 上完成本地实现与验证，当前 `vertical_slice_status: awaiting_user_review`。阶段起点仍为第 2 阶段承接提交 `5a8631be20eb0d3d3c257636fe526d1f646c747f`；ADR-001 的决定仍是 **保留并修复**。本阶段未重写 Canvas、状态机或引擎，未部署、未创建 PR、未改默认分支，也未将一个切片扩展为多关内容。[1]

> **状态：第 3 阶段本地质量门禁为绿，仍禁止发布。** 第 2 阶段提交 `e271ac27f90506b38fe177919930ce5472388a87` 的远端质量门禁已成功（[run 33445931085](https://github.com/mckf111/DuckDuckRun/actions/runs/33445931085)）；本次尚未推送，远端复核待提交后发生。A-02（线上 Pages 旧版本）因本阶段明确不部署而保持 P1；A-04/A-09 因没有物理 Android/iPhone/微信证据而保持移动发布阻断。

## 本阶段关键决定与变更

| 编号 | 决定/变更 | 证据/回归命令 |
|---|---|---|
| A-01 | 背景契约固定为“菜单只加载菜单背景；开局加载当前背景并在 120 ms 空闲窗口预取下一背景”；预取可取消 | `npm run test:browser` |
| A-02/A-06 | 零依赖构建输出 `dist/releases/<build-id>/`、build ID、`build-info.json`、根跳转；CI 只生成不可变工件而不部署 | `npm run build && npm run test:dist` |
| A-03 | 根 `package-lock.json`、`packageManager: npm@10.9.2`、`check`、`verify`、体积预算命令 | `npm ci && npm run verify` |
| A-04 | 保留集中 DPR 质量档和自动降档；补前后同口径模拟测量，不在无真机证据时盲目裁剪 | `docs/qa/engineering-hardening-report.md` |
| A-05 | `src/input.js` 重构为带 `dispose()` 的统一输入控制器；`src/main.js` 单实例管理窗口监听、RAF 和方向/resize | `npm run test:browser` |
| A-07 | `src/core.js` 新增 seedable 玩法随机流；`?demo&seed=20260901` 可复放；视觉/音频随机不干扰玩法序列 | `npm run test:logic && npm run test:browser` |
| A-08 | `tools/generate_asset_sbom.mjs` 生成 `docs/qa/asset-sbom.json` 的 44 条文件/哈希/来源映射，含第 3 阶段三项生成资产 | `node tools/generate_asset_sbom.mjs` |
| A-09 | 浏览器冒烟新增启动、重开、输入、resize、AudioContext 用户手势解锁和 `disposeApp()`/`startApp()` 覆盖 | `npm run test:browser` |
| V-01 | 新增独立 `slice` 模式，而不是新主线关卡；固定脚本形成中华门门序、盐水鸭首牌、秦淮双灯取舍、下滑横梁、夜渡到岸的 720m 闭环 | `?slice=1&demo&seed=20260903`；`npm run test:browser` |
| V-02 | 轻松模式以 9m/s 与两次“灯影接住”容错服务慢反应玩家；标准模式仍保留横移、跳跃、下滑学习 | 菜单“轻松·灯影护航”；浏览器切片容错断言 |
| V-03 | 生成两枚透明 WebP，地标/水面/画舫/门洞/UI 全部程序化；源 PNG 不进入仓库 | `ASSETS.md`、`docs/qa/asset-sbom.json`、`node tools/generate_asset_sbom.mjs` |

## 已实际运行的命令和结果

| 命令 | 结果 |
|---|---|
| `npm ci && npm ci --prefix tools/e2e` | 通过；根项目零依赖，浏览器子工具锁定安装 |
| `npm run typecheck` / `npm run lint` | 通过；21 个运行时模块语法检查（原生 JavaScript 无独立类型系统/ESLint） |
| `npm run test:logic` | 8/8 通过，包括 200 个固定 seed 的可生还路径和 seed 精确复放 |
| `npm run test:save` | 3/3 通过 |
| `npm run test:resources` | 4/4 通过 |
| `npm run test:browser` | 通过；三视口、按需预取、失败降级、输入、尺寸、音频与生命周期均通过 |
| `npm run build && npm run test:dist && npm run test:size` | 通过；81 个制品入口/资源 HTTP 无 4xx/5xx；首屏 483.5 KiB、会话 5.69 MiB |
| `npm run verify` | 通过；第 3 阶段提交前本地绿色总门禁（制品版本 `5c13a81023cf`） |
| `node tools/e2e/measure_slice_performance.mjs` | 通过；切片对比既有首关：桌面 60.09 vs 50.30 FPS、移动模拟 42.91 vs 34.26 FPS，且资源请求少 3 个/传输少 249,000 B；只作为自动化信号 |
| `node tools/e2e/capture_slice_evidence.mjs` | 通过；生成桌面、移动横/竖屏与短演示关键帧；`slice-demo.mp4` 是六个真实 Canvas 状态帧编码的 12 秒摘要，不是实时录屏 |

## 第 3 阶段切片与证据入口

| 用途 | 入口/位置 | 边界 |
|---|---|---|
| 玩家标准切片 | 菜单“南京夜跑切片”，或 `?slice=1&seed=20260903` | 720m，约 72 秒，玩家自己操作 |
| 玩家轻松切片 | 菜单“轻松·灯影护航”，或 `?slice=1&easy&seed=20260903` | 约 80 秒，两次容错，仍需完成基本动作 |
| 确定性演示 | `?slice=1&demo&seed=20260903` | 自动完成固定脚本，用于复现与证据，不代表真人试玩 |
| 无标题审阅 | 上述演示再加 `&quiet=1` | 隐藏 HUD 标题，不隐藏真实场景/玩法线索 |
| 设计/事实来源 | `docs/design/nanjing-vertical-slice.md`；`docs/research/nanjing-source-notes.md` | 官方事实来源与游戏化边界分离；无官方授权暗示 |
| 证据 | `docs/qa/evidence/` | 自动化视口/短演示不等于实机或真人盲测 |

## 前后测量摘要

| 指标 | 改动前 | 改动后 | 判定 |
|---|---:|---:|---|
| 桌面模拟 4G 首个可玩菜单 | 1,714 ms | 1,674 ms | 通过 ≤4 s |
| 移动触摸模拟 4G 首个可玩菜单 | 1,497 ms | 1,519 ms | 通过 ≤4 s |
| 首屏传输 | 252,575 B | 257,636 B | 通过 ≤6 MiB |
| 完整首次会话传输 | 1,431,858 B | 1,437,219 B | 通过 ≤20 MiB |
| 桌面模拟平均 FPS | 37.99 | 38.86 | 自动化信号，未达 60；非真机结论 |
| 移动模拟平均 FPS | 40.68 | 40.23 | 未达 45；移动 release blocker |
| 连续重开 10 局 JS 堆增长（桌面/移动） | +7.11% / +7.13% | +7.11% / +7.19% | 通过 ≤15% |
| console/网络错误；运行时外部域名 | 0/0；0 | 0/0；0 | 通过 |

测量方法为本地 Chromium 无头自动化、CDP 4G 模拟和 CDP JS 堆；移动项只是 844×390 DPR2 触摸模拟，绝不能写成真机结果。完整口径、长任务和限制见 `docs/qa/engineering-hardening-report.md`。

## 变更文件

运行时：`src/main.js`、`src/input.js`、`src/audio.js`、`src/core.js`、`src/game.js`、`src/render.js`、`src/ui.js`、`src/art/sprites.js`、`src/config.js`、`src/art/photo.js`。测试与构建：`tests/runtime.test.js`、`tools/e2e/beam.mjs`、`tools/e2e/browser_test.mjs`、`tools/e2e/capture_slice_evidence.mjs`、`tools/e2e/measure_slice_performance.mjs`、`tools/e2e/check_dist.mjs`、`tools/e2e/check_size_budget.mjs`、`tools/build_static.mjs`、`tools/generate_asset_sbom.mjs`、`tools/process_nanjing_slice_assets.py`、`package.json`、`package-lock.json`、`.github/workflows/test.yml`。文档：`PLAN.md`、`STRUCTURE.md`、`MEMORY.md`、`ASSETS.md`、`docs/design/nanjing-vertical-slice.md`、`docs/research/nanjing-source-notes.md`、`docs/qa/asset-sbom.json`、`docs/qa/evidence/visual-inspection.md`、`docs/qa/engineering-hardening-report.md`、本文件。

## 未关闭问题与下一阶段前提

| 优先级 | 编号 | 当前状态 | 下一阶段前提 |
|---|---|---|---|
| P1 | A-02 | 线上 Pages 仍是旧制品；本阶段未部署 | 取得部署授权后仅发布 `dist/`，核验线上 build ID/清单/commit SHA 和缓存回滚 |
| P2 | A-04 | 模拟移动平均 40.23 FPS，低于 45；无温控/耗电数据 | Android 中端/低端与 iPhone 采样后才按瓶颈做最小性能裁剪 |
| P2 | A-05 | 仍缺 Canvas 语义替代、缩放与老少适配收敛 | 保持横屏主玩法，做渐进增强并用回归测试验证 |
| P2 | A-06 | 本地原子制品未经历真实 CDN/Pages 缓存切换/回滚 | 获授权的预览/发布演练 |
| P2 | A-08 | 历史 source revision/oldid、下载日期、处理记录和 CC BY-SA 评估缺失 | 许可证据回溯与独立法务复核 |
| P2 | A-09 | iPhone Safari/微信和 Android Chrome/微信无实机数据 | 按 `docs/qa/device-and-browser-matrix.md` 完成 S1–S8 |

## 回滚点与禁止项

阶段起点 `5a8631be20eb0d3d3c257636fe526d1f646c747f` 是本阶段的无损代码回滚点。提交完成后，以第 3 阶段提交 SHA 作为下一阶段回滚点。不得直接改默认分支，不得创建 PR，不得部署；不得在用户审查前扩展关卡/资产池，也不得以升级依赖、替换引擎、重写架构、增加内容/账号/后端/PWA 来替代上述未关闭问题。

## 参考资料

[1]: docs/architecture/ADR-001-target-architecture.md "保留并修复的目标架构"
