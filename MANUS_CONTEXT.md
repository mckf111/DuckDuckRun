# DuckDuckRun Agent 上下文

## 当前任务状态

第 5 阶段在 `manus/duckduckrun-hardening` 完成**技术发布候选**准备。第 4 阶段南京垂直切片仍为唯一扩展基线，ADR-001 仍为 **保留并修复**；本阶段没有增加关卡、账号、后端、数据库、PWA、分析 SDK 或引擎重写，仅修复发布阻断和必要 P2。[1]

> **状态：候选构建 ID 为 `1634d51bc5b8`，RC tag 为 `v0.5.0-rc.1`，PR 为 [#1](https://github.com/mckf111/DuckDuckRun/pull/1)，尚未生产发布、尚未修改 DNS。** `npm run verify`、`npm run test:release` 与 20 分钟 `npm run test:release:soak` 均通过；模拟 4G 首个可玩画面为 1,977 ms（≤8 s），10 次失败—重开 JS 堆变化 -16.79%（≤15%），20 分钟运行时浸泡堆变化 +1.35%，均无非预期 console/page/network error。此前远端 push CI [33460221271](https://github.com/mckf111/DuckDuckRun/actions/runs/33460221271) 和 PR CI [33460259091](https://github.com/mckf111/DuckDuckRun/actions/runs/33460259091) 均绿色；本次慢图CI抗抖动修复提交推送后需等待最新远端工作流复核。唯一明确的人工 QA 门槛是一次真实手机**微信 WebView**五分钟烟测；Chrome/Edge/Android/iOS/微信的其他候选结论均已明确区分真实 Chromium 与 UA/视口模拟，绝不冒充真机。部署仍因未提供大陆云账号、备案域名、DNS/CDN 配置与受保护 Secrets 而停止；这些是部署输入，不是另一个人工 QA 门槛。

第 5 阶段新增 `docs/qa/release-candidate-report.md`、`docs/deployment/domestic-hosting-decision.md`、`docs/deployment/runbook.md`、`docs/deployment/rollback.md`，并增加内容哈希静态制品、`scripts/deploy_aliyun_oss.sh`、发布传输/跨端/微信模拟/重开内存/浸泡与资产登记检查。主部署决策是：若已有备案域名和大陆阿里云账号，使用 OSS + 中国内地 CDN + HTTPS 子域名；无备案时仅以香港 OSS 作预览/备用，GitHub Pages、境外免费托管与 manus.space 不作为国内访问优先主站。生产上传或 DNS 修改前，只向用户询问一次明确确认。

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
| V-04 | 切片成为唯一扩展基线：`NANJING_SLICE` 集中管理六段节奏、三条有限路线、难度数值和 demo；不加入无解释的随机惩罚 | `npm run test:playability`；`docs/design/gameplay-and-balance.md` |
| V-05 | 标准/轻松以速度、输入缓冲、碰撞宽度、提示提前量和两次护航形成少而清楚的层级；轻松不自动过关 | 首错差异断言；`docs/qa/evidence/slice-playability.json` |
| A-05/V-06 | 默认尊重 `prefers-reduced-motion`，菜单可切换 system/reduced/full；减弱时保留文字/轮廓/计数，停用非必要运动 | `src/save.js`、`src/main.js`、`src/render.js`；浏览器回归 |

## 已实际运行的命令和结果

| 命令 | 结果 |
|---|---|
| `npm ci && npm ci --prefix tools/e2e` | 通过；根项目零依赖，浏览器子工具锁定安装 |
| `npm run typecheck` / `npm run lint` | 通过；21 个运行时模块语法检查（原生 JavaScript 无独立类型系统/ESLint） |
| `npm run test:logic` | 8/8 通过，包括 200 个固定 seed 的可生还路径和 seed 精确复放 |
| `npm run test:save` | 3/3 通过 |
| `npm run test:resources` | 4/4 通过 |
| `npm run test:browser` | 通过；三视口、按需预取、失败降级、输入、尺寸、音频与生命周期均通过 |
| `npm run build && npm run test:dist && npm run test:size` | 通过；81 个制品入口/资源 HTTP 无 4xx/5xx；第4阶段首屏 485.9 KiB、全会话 5.69 MiB，均在 6/20 MiB 预算内。 |
| `npm run verify` | 通过；第4阶段完整门禁已运行。原子制品版本 `766dfb5dafe2` 在本地工作树代码上通过 81 个入口/资源可达性检查；提交后由远端 CI 复核。 |
| `npm run test:playability` | 通过；3 条标准与 3 条轻松固定 seed 路线均完成 720 m/4 灯牌，10 分钟连续模拟完成 7 局，20 分钟浸泡完成 15 局；仅为状态机模拟 |
| `node tools/e2e/measure_slice_performance.mjs` | 通过；切片对比既有首关：桌面 59.60 vs 52.66 FPS、移动模拟 41.12 vs 34.87 FPS，且资源请求少 3 个/传输少 249,000 B；只作为自动化信号 |
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

## 第 4 阶段体验与证据入口

| 用途 | 入口/位置 | 边界 |
|---|---|---|
| 路线与难度配置 | `src/config.js` 的 `NANJING_SLICE` | 仅有限路线组合；`20260903` 保持第3阶段月影左线。 |
| 平衡审计 | `npm run test:playability`；`docs/qa/evidence/slice-playability.json` | 固定 seed 的实际状态机模拟，不是用户研究。 |
| 玩家体验说明 | `docs/design/gameplay-and-balance.md` | 城市事实与原创玩法转译分离。 |
| 可玩性质量报告 | `docs/qa/playability-report.md` | 区分浏览器模拟、视觉抽检、真人试玩和物理真机。 |
| 动效偏好 | 菜单“动效·跟随系统/减弱/完整” | 用户设置优先；减弱动态不删除基础输入或反馈。 |

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

阶段起点 `5a8631be20eb0d3d3c257636fe526d1f646c747f` 是第 2 阶段代码回滚点；以第 3 阶段提交 SHA 作为切片单脚本回滚点，提交完成后以第 4 阶段提交 SHA 作为批准后路线/难度回滚点。不得直接改默认分支，不得创建 PR，不得部署；不得在真人试玩前扩展关卡/资产池，也不得以升级依赖、替换引擎、重写架构、增加内容/账号/后端/PWA 来替代上述未关闭问题。

## 参考资料

[1]: docs/architecture/ADR-001-target-architecture.md "保留并修复的目标架构"
