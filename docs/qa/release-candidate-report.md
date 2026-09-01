# DuckDuckRun 第 5 阶段发布候选报告

**候选构建：`1634d51bc5b8`；验收日期：2026-09-01；状态：技术发布候选（RC），未生产发布。** 第 4 阶段基线已复核为绿色。本阶段没有扩展关卡、账号、后端、数据库、PWA、分析 SDK 或引擎；仅补齐发布可靠性：运行时错误边界、版本化内容指纹、根入口原子切换、移动端 DPR 上限、画布恢复、深链接刷新、发布验收工具与部署材料。

> **放行判断：自动化发布硬门槛通过，未发现 P0/P1、未处理 console/page error 或非预期 HTTP 4xx/5xx。唯一人工验收门槛是一次真实手机微信 WebView 冒烟（≤5分钟）。当前没有云账号/备案域名/部署凭证，因此不存在实际生产 URL，也没有执行上传、DNS 或 CDN 变更。**

## 1. 发布硬门槛结果

| 硬门槛 | 结果 | 证据 | 结论 |
|---|---|---|---|
| 第 4 阶段基线 | `npm run verify` 在候选改动前后通过；切片平衡审计通过。 | `MANUS_CONTEXT.md`；`docs/qa/playability-report.md` | 绿色 |
| 构建、制品、深链接与缓存 | 83 个入口/资源可达；根跳转、`?slice=1` 刷新、内容指纹与版本目录通过。 | `npm run test:dist`；`docs/qa/evidence/release-transport.json` [1] | 绿色 |
| 包体 | 首屏 1,078.9 KiB / 6 MiB；完整首次会话 5.69 MiB / 20 MiB。 | `npm run test:size` | 绿色 |
| 模拟 4G 首个可玩画面 | 1,977 ms，低于 8,000 ms硬上限。测试进入 `releases/1634d51bc5b8/`。 | [1] | 绿色（模拟） |
| 中端移动性能预算 | 触控/DPR 2 Chromium 模拟切片为 60.56 FPS；既有首关 49.74 FPS。候选移动 DPR 渲染比限制为 1.5。 | `docs/qa/evidence/slice-performance.json` [2] | 绿色（自动化信号，非真机） |
| 20 分钟浸泡 | 实际浏览器运行 1,200 秒，含连续重开、模拟后台/恢复、横竖屏、深链接刷新；0 错误，JS 堆变化 +1.35%。 | `docs/qa/evidence/release-soak.json` [3] | 绿色（模拟） |
| 10 次失败—重开内存 | 10 次真实运行时失败→Enter 重开；0 错误，JS 堆变化 -16.79%，低于 15% 门槛。 | `docs/qa/evidence/release-restart-memory.json` [4] | 绿色 |
| 资源失败演练 | 注入 1 个关键菜单背景 404 后仍到达菜单，错误边界未显示，无非预期错误。 | [1] | 绿色 |
| 资源、字体与境外关键依赖 | 运行时请求全部同源；字体和图片随构建发布并内容指纹化，无 Google Fonts、海外图床或分析 SDK。 | `release-cross-platform.json` [5]；`asset-sbom.json` [6] | 绿色 |
| 资产授权登记 | 44/44 条均含本地路径、SHA-256、来源/生成来源、作者/权利人、许可、许可义务与玩家可见归属入口。历史下载日期/原始 revision 不可追溯，但没有未登记的已发布素材。 | `npm run test:assets`；[6] | 绿色（非正式法律意见） |
| CI | push 工作流与 PR 工作流均成功；二者均执行 Node 22、依赖安装、Chromium 安装、`npm run verify` 与不可变制品上传。 | [push run 33462223416](https://github.com/mckf111/DuckDuckRun/actions/runs/33462223416)；[PR run 33462225469](https://github.com/mckf111/DuckDuckRun/actions/runs/33462225469) | 绿色 |

## 2. 跨端、访问性与生命周期验收

| 环境 | 结论 | 自动化覆盖 | 结论边界 |
|---|---|---|---|
| 桌面 Chromium 151，1440×900 | 通过 | 首菜单 576 ms、首次点击、音频解锁、失败重开、后台暂停/恢复、切片刷新、中文字体、键盘焦点、错误边界、同源资源。 | **真实 Linux Chromium 浏览器二进制**，非 Windows Chrome/Edge。 |
| 桌面 Chrome | 通过 | Chrome UA + 1440×900 Chromium 内核模拟，上述路径全部通过。 | UA 模拟，不可替代 Windows/macOS Chrome 真机。 |
| 桌面 Edge | 通过 | Edge UA + 1440×900 Chromium 内核模拟，上述路径全部通过。 | UA 模拟；环境无 Edge 二进制。 |
| Android Chrome | 通过 | Android Chrome UA、触控、844×390、DPR 2；音频、前后台、失败重开、竖屏旋转引导与恢复、刷新通过。 | 视口/触控/UA模拟，不可替代 Android 真机、性能/温升/网络结论。 |
| iOS Safari | 通过 | iPhone Safari UA、触控、844×390、DPR 2；同上。 | **不是 WebKit/Safari 引擎**，只是 Chromium 容器内的 UA/视口模拟。 |
| 微信内置浏览器 | 通过（容器模拟） | iPhone + MicroMessenger UA、音频用户手势、失败页分享遮罩、复制链接回退、版本化分享路径。 | 不是实际微信 WebView；不能作为实机放行。 |

候选版本对前后台恢复、`webglcontextlost`/画布上下文丢失、resize/orientation change、错误边界、音频用户手势解锁和中文字体回退均有运行时保护；本阶段覆盖的是 Canvas 恢复分支与不可用时重启/重绘降级，而不是宣称所有 GPU 驱动故障均被实体设备复现。Canvas 已具备 `tabindex="0"` 与 `aria-describedby="gameInstructions"`；键盘焦点和基础指令可用，但复杂 Canvas 游戏的全量无障碍替代不在本候选放行范围内。

两张候选截图分别核验了 1440×900 桌面与触控移动横屏的中文、HUD、控制区、安全区留白与画面完整性；未见字体方框、内容裁切、白屏或占位资源。[7]

## 3. 唯一人工验收门槛

必须在最终 HTTPS 候选地址上，用一台真实手机和微信内置浏览器执行一次不超过 5 分钟的烟测；**这是唯一明确的人工 QA 门槛，自动化不冒充真机。** 依次完成：打开、首次操作、确认音频解锁、微信切后台再回来、横竖屏、故意失败后重开、分享或刷新。记录手机型号、OS、微信版本、网络、URL/build ID、结果和失败截图。任一步失败即不发布，回滚/修复后重新验证。

云账号、备案域名、CDN 域名和受保护 Secrets 的缺失是**部署输入尚未提供**，不是额外的人工产品验收；它们满足后，才进入一次性的生产发布/DNS 确认。

## 4. 风险与回滚

剩余风险主要来自实体 iOS WebKit、真实 Android GPU/网络、微信实际授权/分享菜单策略，以及正式 CDN 缓存切换；这些不能由本地无头浏览器替代。解决方式不是再加功能，而是先执行唯一真机微信烟测，再在低风险时段将候选上传到不可变版本目录，最后切换根入口。若出现 P0/P1、HTTP 404、证书错误、错误 build ID 或真机失败，立即按 [`../deployment/rollback.md`](../deployment/rollback.md) 回退根入口；不要删除故障版本、清空整个 CDN 或仓促修改 DNS。

## 5. 可复现命令

```bash
npm ci
npm run verify
npm run test:release
npm run test:release:soak
```

`npm run test:release` 已涵盖构建、制品、包体、资产授权登记、模拟 4G、跨端模拟、微信 UA 模拟与 10 次重开；20 分钟浸泡单列执行，防止普通 CI 队列被 20 分钟任务拖慢。

## References

[1]: evidence/release-transport.json "模拟 4G、版本路径与受控 404 降级证据"
[2]: evidence/slice-performance.json "桌面与触控移动模拟性能采样"
[3]: evidence/release-soak.json "20 分钟真实运行时浸泡证据"
[4]: evidence/release-restart-memory.json "10 次重开 JS 堆检查"
[5]: evidence/release-cross-platform.json "跨端浏览器/UA 视口验收证据"
[6]: asset-sbom.json "44 条资产授权登记与哈希"
[7]: evidence/release-visual-inspection.md "桌面与移动横屏视觉抽检"
