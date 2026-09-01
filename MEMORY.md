# DuckDuckRun 项目记忆

## 当前基线

| 字段 | 事实 |
|---|---|
| 默认分支 | `main` |
| 阶段 1 游戏代码基线 | `b90462e1c182fc0fee5ee1fe29c9b6789690d9a9`（2026-08-31） |
| 阶段 2 起点 | `5a8631be20eb0d3d3c257636fe526d1f646c747f`（仅审查/承接文档） |
| 工作分支 | `manus/duckduckrun-hardening` |
| 当前架构决定 | **保留并修复**；见 [`ADR-001`](docs/architecture/ADR-001-target-architecture.md) |
| 第 2 阶段状态 | 本地 `npm run verify` 与 `e271ac2` 的远端 CI（run 33445931085）均已通过；第 3 阶段本地 `npm run verify` 亦已通过，提交后仍待远端等价复核 |
| 第 3 阶段状态 | `vertical_slice_status: approved`；南京代表性切片已获接受，作为第4阶段唯一扩展基线 |
| 发布状态 | **不通过**：A-02 线上版本漂移且本阶段未部署；A-04/A-09 缺物理设备性能/容器证据 |

## 阶段 2 已完成的事实

| 编号 | 变更与验证 | 结论 |
|---|---|---|
| A-01 | 确认背景契约为“菜单仅菜单背景；开局当前背景＋短空闲预取下一背景”；`npm run test:browser` 已通过 | 本地关闭，不能靠删除断言取得绿色 |
| A-03 | `packageManager: npm@10.9.2`、根 `package-lock.json`、`check`/`verify`、构建/制品/体积命令已加入 | 无构建静态项目已有可复现质量定义 |
| A-05 | 输入层改为可创建/销毁控制器；键盘、鼠标、触控、后台暂停都有成对监听器释放路径 | 生命周期稳定性提升；Canvas 语义/缩放仍未解决 |
| A-06 | 零依赖构建生成 `dist/releases/<build-id>/`、HTML build ID、`build-info.json` 与根跳转；`test:dist` 全文件 HTTP 检查通过 | 本地原子制品成立；线上缓存演练未做 |
| A-07 | 核心随机流可设置/重置 seed，`?demo&seed=20260901` 可复放；渲染/音频随机与玩法随机隔离 | 纯逻辑与浏览器同 seed 重开均通过 |
| A-08 | `docs/qa/asset-sbom.json` 已生成 41 条照片/字体路径与 SHA-256 映射 | 历史下载日期、来源修订和处理记录不明，未作虚构填补 |
| A-09 | 浏览器自动化增加启动、重开、输入、resize、音频手势解锁及 `disposeApp()`/`startApp()` 冒烟 | 不等同 iOS/Android/微信真机通过 |

## 第 3 阶段：南京代表性垂直切片

在不改变十关主线、图鉴、商店、持久化或 Canvas/ESM 架构的前提下，新增独立 `slice` 模式。标准路径为 **720m / 10.0m/s（理论约 72 秒）**，轻松路径为 **720m / 9.0m/s（理论约 80 秒）**，并提供两次“灯影接住”容错。入口为菜单中的“南京夜跑切片”/“轻松·灯影护航”，或 `?slice=1&demo&seed=20260903`；后者为固定 seed 自动演示。`&quiet=1` 隐藏切片标题，仅供无标题城市线索截图审阅。

| 需求 | 已实现的最小闭环 | 证据 |
|---|---|---|
| 十秒学习 | 开场中道封墙、左道箭头/非色彩轮廓、安全门洞和短动作提示，标准模式必须玩家横移。 | `docs/qa/evidence/slice-desktop-opening.webp`；`tools/e2e/browser_test.mjs` |
| 首次反馈与风险收益 | 约 7 秒取得盐水鸭牌并触发原创合成桨点音；约 28 秒为“左跳摘双灯 / 右侧稳过”。 | `slice-desktop-feedback.webp`、`slice-desktop-risk.webp` |
| 南京多层线索 | 中华门三道瓮城门序进入空间/节奏；秦淮画舫灯影进入路线/奖励；盐水鸭牌和桨点进入反馈。 | `docs/research/nanjing-source-notes.md`、`docs/design/nanjing-vertical-slice.md` |
| 收束与重开 | 成功为“夜渡到岸”，失败沿用既有结算；两种情况都有首要“再跑一趟（Enter）”。 | `docs/qa/evidence/slice-demo.mp4`；最终帧 `slice-demo-frames/frame-06.png` |
| 老少等价机制 | 轻松模式降速并给两次护航，不删除基础动作；按钮保持既有 ≥44 CSS px 目标。 | `tools/e2e/browser_test.mjs` 切片断言 |

新增资产只有两枚透明 WebP（盐水鸭牌 65 KiB、灯影路线标记 33 KiB）；地标、水面、画舫、门洞和 UI 均为 Canvas 程序化绘制。视觉目标图与完整提示词在 `ASSETS.md`，SBOM 扩展至 44 条，并由 `node tools/generate_asset_sbom.mjs` 生成。原始 1920px PNG 已移出仓库工作树，不提交。

## 已验证运行与测量

本地静态服务下，浏览器门禁已覆盖三种视口、菜单/预取、慢图、全部图失败、404、解码失败、存储失败、教学、重开、输入、resize、用户手势音频、运行时销毁/重启及固定 seed。生产静态制品在第 3 阶段为 81 个入口/资源 HTTP 请求均为非 4xx/5xx；gzip 首屏为 **483.6 KiB**、完整首次会话为 **5.69 MiB**。相对第 2 阶段的 480.5 KiB/5.50 MiB，增加 +3.1 KiB/+0.19 MiB，仍远低于 6/20 MiB 门槛。[1]

第 3 阶段最终本地无头 Chromium 三秒采样（无网络限速；触摸项为 844×390 DPR2 模拟）显示：与既有首关相比，切片桌面可玩时间 **389ms vs 576ms**、平均帧率 **60.09 vs 50.30 FPS**、资源传输 **1,284,895 vs 1,533,895 B**；移动模拟分别为 **419ms vs 590ms**、**42.91 vs 34.26 FPS**、**1,284,895 vs 1,533,895 B**。切片深链不预载菜单/实景背景，故同环境传输更低；这些结果只说明本次美术未在该模拟里显著退化，**不能替代真机测量或关闭 A-04/A-09**。原阶段 2 的 CDP 4G 指标与长期内存样本仍见工程报告。[1]

## 第 4 阶段：批准后的切片扩展与可玩性验证

第 4 阶段没有扩主线关卡、图鉴、商店、资产池、账号、后端、广告、付费、排行或多人功能。切片由 `src/config.js` 的 `NANJING_SLICE` 成为唯一数据入口：`modes` 保存标准/轻松参数，`beats` 保存六段节奏和短提示，`routeSets` 保存三条有限路线及其自动演示输入。`20260903` 显式映射到第 3 阶段已验证的月影左线；seed `1`/`2` 分别选择画舫右线/门序折返。`game.js` 只解释配置、记录节奏标记和执行通用碰撞/结算，避免把南京条件分散进 UI 或渲染层。

| 维度 | 已实施事实 | 自动化证据 | 不得外推 |
|---|---|---|---|
| 节奏 | 上手→信心→选择→压力→喘息→高潮→快速重开，保持 720 m 有限跑局。 | 三条标准和三条轻松路线均在实际状态机更新中出现六段标记。 | 不代表首次玩家必然理解。 |
| 重玩 | 3 条可理解的有限路线，仅改变中段双灯侧别或一次门序折返。 | 同一固定 seed 可复放；6 条审计路径均为 720 m/4 灯牌。 | 不代表路线选择率或长期留存。 |
| 难度 | 标准 10 m/s/0.10 s/0.55；轻松 9 m/s/0.18 s/0.46 + 2 次护航。 | 标准首错进入撞击；轻松首错消耗一次护航仍在玩。 | 不代表目标人群体感公平。 |
| 可访问性 | 暂停、静音、快速重开继续可达；动效默认跟随系统且可循环切换为减弱/完整。 | 浏览器回归及本地 Canvas 视觉抽检通过。 | 不等于辅助技术或真实移动端通过。 |
| 稳定性 | 状态机对象上限受控，未新增运行时依赖或新资产。 | 10 分钟模拟完成 7 局；20 分钟浸泡完成15局，均未崩溃。 | 不代表设备堆、GPU、温升、耗电。 |

第4阶段原始结果在 `docs/qa/evidence/slice-playability.json`；设计说明和测试边界在 `docs/design/gameplay-and-balance.md`、`docs/qa/playability-report.md`。性能采样仍是本地无头 Chromium：切片桌面 59.60 FPS、移动触摸模拟 41.12 FPS；移动结果低于 45 FPS 参考目标，A-04/A-09 不得关闭。

## 未关闭问题

| 优先级 | 编号 | 摘要 | 下一步 | release blocker |
|---|---|---|---|---|
| P1 | A-02 | GitHub Pages 仍为旧版本，虽已具备可审计新制品，但本阶段按约束未部署 | 获得未来部署授权后，发布单一 `dist/` 制品并核对线上 `build-info.json`/HTML build ID/提交 SHA | 是 |
| P2 | A-04 | 移动自动化平均 40.23 FPS，且缺高 DPR 真机温控/耗电归因 | 中端/低端 Android 与 iPhone 采集 10 分钟 FPS、长任务、温升、耗电；只按瓶颈做最小裁剪 | 移动发布时是 |
| P2 | A-05 | Canvas 无语义替代、`user-scalable=no` 与横屏硬要求仍限制部分用户 | 增加 DOM 说明/替代操作与可访问性回归，不推翻横屏主玩法 | 否 |
| P2 | A-06 | 本地原子制品未在真实 CDN/Pages 缓存、深链接和回滚条件下演练 | 获准部署后做版本切换、缓存和回滚演练 | 线上发布时是 |
| P2 | A-08 | SBOM 缺历史 source revision/oldid、下载日期、处理记录和 CC BY-SA 适配结论 | 回溯原始来源并完成许可审查；台账不是法律结论 | 公开发布前是 |
| P2 | A-09 | iPhone Safari/微信、Android Chrome/微信均无真机记录 | 依 `docs/qa/device-and-browser-matrix.md` 完成 S1–S8 | 移动发布时是 |
| P3 | A-10 | 运行中修改 `#play` 不启动无尽模式 | 仅在分享/导航需求明确时支持 `hashchange`；不在本阶段扩展 | 否 |
| P3 | A-11 | P1/P2 未完全关闭前扩功能会扩大维护面 | 继续冻结关卡、道具、商业化和后端范围 | 否 |

## 不要重复的错误

不要为了绿色构建升级依赖；不要在 A-02 未关闭前部署；不要将自动化视口模拟写成微信/真机测试；不要删除失败断言来掩盖契约漂移；不要把 10/20 分钟状态机浸泡写成真实设备稳定性或用户研究；不要将 CC BY-SA 证据不足误说成已经侵权；不要在无真机归因前更换引擎或大规模重写渲染。所有提交只走非默认分支，并引用 A 编号与复现命令。

## 关键入口

| 用途 | 位置 |
|---|---|
| 主审查报告 | `docs/review/first-principles-adversarial-audit.md` |
| 评分卡 | `docs/review/scorecard.md` |
| 证据索引 | `docs/review/evidence-index.md` |
| 架构决策 | `docs/architecture/ADR-001-target-architecture.md` |
| 实机验收门槛 | `docs/qa/device-and-browser-matrix.md` |
| 第 2 阶段报告 | `docs/qa/engineering-hardening-report.md` |
| 机器可读素材 SBOM | `docs/qa/asset-sbom.json` |
| 下一阶段计划 | `PLAN.md` |
| 文档/代码责任 | `STRUCTURE.md` |
| 素材/许可承接 | `ASSETS.md` |
| Agent 上下文 | `MANUS_CONTEXT.md` |
| 南京事实来源 | `docs/research/nanjing-source-notes.md` |
| 南京切片设计 | `docs/design/nanjing-vertical-slice.md` |
| 切片性能与画面证据 | `docs/qa/evidence/slice-performance.json`、`docs/qa/evidence/` |

## 参考资料

[1]: docs/qa/engineering-hardening-report.md "第 2 阶段测量、门禁与遗留风险"
