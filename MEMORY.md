# DuckDuckRun 项目记忆

## 当前基线

| 字段 | 事实 |
|---|---|
| 默认分支 | `main` |
| 阶段 1 游戏代码基线 | `b90462e1c182fc0fee5ee1fe29c9b6789690d9a9`（2026-08-31） |
| 阶段 2 起点 | `5a8631be20eb0d3d3c257636fe526d1f646c747f`（仅审查/承接文档） |
| 工作分支 | `manus/duckduckrun-hardening` |
| 当前架构决定 | **保留并修复**；见 [`ADR-001`](docs/architecture/ADR-001-target-architecture.md) |
| 第 2 阶段状态 | 本地 `npm run verify` 与 `e271ac2` 的远端 CI（run 33445931085）均已通过；文档收尾提交仍将触发一次等价复核 |
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

## 已验证运行与测量

本地静态服务下，浏览器门禁已覆盖三种视口、菜单/预取、慢图、全部图失败、404、解码失败、存储失败、教学、重开、输入、resize、用户手势音频、运行时销毁/重启及固定 seed。生产静态制品的 78 个入口/资源 HTTP 请求均为非 4xx/5xx；gzip 首屏为 480.5 KiB、完整首次会话为 5.50 MiB。[1]

同口径 CDP 4G 模拟下，加固后桌面/移动模拟首个可玩菜单为 1,674/1,519 ms，首屏传输均为 257,636 B，完整会话为 1,437,219 B，控制台/网络错误为 0/0，运行时外部请求域名为 0。预热后连续重开 10 局 JS 堆变化为桌面 +7.11%、移动模拟 +7.19%，低于 15% 门槛。无头自动化桌面/移动平均帧率为 38.86/40.23 FPS，**低于桌面 60 和移动 45 的目标，且不能替代真机测量**。[1]

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

不要为了绿色构建升级依赖；不要在 A-02 未关闭前部署；不要将自动化视口模拟写成微信/真机测试；不要删除失败断言来掩盖契约漂移；不要将十次重开 JS 堆达标写成“没有内存泄漏”；不要将 CC BY-SA 证据不足误说成已经侵权；不要在无真机归因前更换引擎或大规模重写渲染。所有提交只走非默认分支，并引用 A 编号与复现命令。

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

## 参考资料

[1]: docs/qa/engineering-hardening-report.md "第 2 阶段测量、门禁与遗留风险"
