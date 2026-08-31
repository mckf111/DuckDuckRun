# DuckDuckRun 项目记忆

## 当前基线

| 字段 | 事实 |
|---|---|
| 默认分支 | `main` |
| 审查基线 | `b90462e1c182`（2026-08-31） |
| 审查分支 | `manus/duckduckrun-hardening` |
| 当前架构决定 | **保留并修复**；见 [`ADR-001`](docs/architecture/ADR-001-target-architecture.md) |
| 本阶段边界 | 仅审查/承接文档；未改游戏源码、依赖版本、CI、部署或资产 |
| 发布状态 | **不通过**：A-01 浏览器回归失败，A-02 线上版本漂移 |

## 已验证事实

本地静态服务下，1440×900 桌面、844×390 DPR2 触摸横屏、390×844 DPR2 竖屏均已实际运行。桌面路径已经覆盖菜单、选关、教程、首次成功、失败、Enter 重开、P 暂停/继续以及 `blur` 自动暂停；横屏触摸已验证点击与右滑换道；竖屏遮罩阻止了游戏点击并在转横后解除。十次失败→Enter 重开没有显性异常，但没有获得可靠的堆/监听器指标，因此**不得写成“无内存泄漏”** [1]。

本地脚本/图片/字体请求均同源，无 console error、4xx/5xx、CORS 错误或外部运行时域名。线上 GitHub Pages 可访问（HTTP 200）但对应旧版 `game.js` blob/旧标题，不能作为当前基线试玩链接。线上稳定文件名结合 `max-age=600`，存在多文件发布的新旧资源混用窗口 [1]。

## 未关闭问题

| 优先级 | 编号 | 摘要 | 下一步 |
|---|---|---|---|
| P1 | A-01 | 浏览器回归在 `browser_test.mjs:118` 的照片预取断言失败 | 判定产品契约并修复，CI 全绿 |
| P1 | A-02 | GitHub Pages 为旧版本，当前发布链未可信 | 唯一制品源、版本标识、部署前后核对 |
| P2 | A-03 | 没有 build/typecheck/lint 质量命令及根锁文件 | 定义无构建项目的可复现检查 |
| P2 | A-04 | DPR2 模拟捕获最高 147 ms 长任务 | 真机性能/热采样后再优化 |
| P2 | A-05 | Canvas 无语义替代、禁缩放、横屏硬要求 | 无障碍与老少适配渐进增强 |
| P2 | A-06 | 无内容哈希，缓存窗口 600 秒 | 原子制品/缓存策略 |
| P2 | A-07 | 随机局不可重放 | seed、版本、输入摘要 |
| P2 | A-08 | 第三方素材缺不可变许可台账 | SBOM、下载日期、源 hash、审查记录 |
| P2 | A-09 | 未实测微信/iOS/Android 真机 | 按 QA 矩阵完成 P0 样本 |
| P3 | A-10 | 运行中 `#play` 不触发无尽模式 | 明确行为或监听 `hashchange` |
| P3 | A-11 | P1 未关前扩功能会扩大维护面 | 冻结内容扩张 |

## 不要重复的错误

不要为了绿色构建升级依赖；不要在未修 A-01/A-02 前部署；不要把自动化视口模拟写成微信/真机测试；不要删除失败断言来掩盖契约漂移；不要把“十次重开未崩溃”写成“没有内存泄漏”；不要将 CC BY-SA 素材问题误说成已经侵权。所有未来提交只走非默认分支，并引用 A 编号与复现命令。

## 关键入口

| 用途 | 位置 |
|---|---|
| 主审查报告 | `docs/review/first-principles-adversarial-audit.md` |
| 评分卡 | `docs/review/scorecard.md` |
| 证据索引 | `docs/review/evidence-index.md` |
| 架构决策 | `docs/architecture/ADR-001-target-architecture.md` |
| 设备矩阵 | `docs/qa/device-and-browser-matrix.md` |
| 下一阶段计划 | `PLAN.md` |
| 文档/代码责任 | `STRUCTURE.md` |
| 资产台账承接 | `ASSETS.md` |
| Agent 上下文 | `MANUS_CONTEXT.md` |

## 参考资料

[1]: docs/review/evidence-index.md "审查命令、截图与原始运行证据"
