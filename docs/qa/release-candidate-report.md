# DuckDuckRun 本地 remediation 发布候选报告

**实现提交：`768d707`（前置 `0651ac3`、`bb7d4fe`）；构建 ID：`f36b36debf1a`；验收日期：2026-09-02；状态：本地技术候选，未推送、未合并、未部署。**

旧标签 `v0.5.0-rc.1` 与 PR #1 仍停在 Manus 候选 `78e04a7`，不含本轮修复；远端 `main` 当前为公众号素材提交 `27e8fa1`。线上 GitHub Pages 仍是旧版，不能作为本候选的试玩、二维码或公众号入口。

## 1. 放行判断

本地工程门禁未发现 P0/P1，已达到“可提交远端 CI 的技术候选”水平；尚未达到“可以公开发布”的水平。原因不是再缺一轮桌面自动化，而是新提交还没有远端 CI、真实手机/微信和真人易学性证据，也没有稳定生产 URL 与有效二维码。

| 门禁 | 本轮结果 | 证据边界 |
|---|---|---|
| 完整门禁 | `npm.cmd run verify` 通过；语法、合同、逻辑、存档、可玩性和浏览器回归全绿 | 本地 Node/Chromium |
| 可复现制品 | 84 个制品文件、57 个指纹资产、86 个入口/资源可达；Windows/Linux build ID 同为 `f36b36debf1a` | 未在新 GitHub Actions 上复跑 |
| 体积 | 首屏 1166.0 KiB / 6 MiB；完整会话 5.78 MiB / 20 MiB | 静态预算 |
| 模拟 4G | 入库证据 1,895 ms，最终复跑 1,965 ms；关键资源 404 降级通过 | CDP 模拟，不是真实国内移动网络 |
| 素材与告知 | 47/47 受管文件唯一登记；三份 legal notice 与运行时授权入口通过 | 工程台账，不是正式法律意见 |
| 跨端模拟 | 5 个 Chromium/UA/视口配置通过；横屏 CSS 视口和 Canvas 铺满尺寸进入硬断言 | 只有 Chromium 是实际浏览器二进制；iOS 不是 WebKit |
| 微信分享模拟 | 真实 Canvas 触控命中“分享成绩”，`toBlob` 成卡 1 次，600 px 图片完成解码，复制文案只含稳定根地址 | MicroMessenger UA 模拟，不是真微信 WebView |
| 十次重开 | 两次最终样本均 0 console/page/network error；JS 堆变化 -2.01% 与 +3.57% | GC 稳定中位数，本地无头 Chromium |
| 20 分钟 soak | 1,200.378 秒、16 次重开、0 错误；堆 +191,380 B / +5.63%，最长长任务 111 ms、阻塞比 0.00009；八项音频/生命周期全通过 | 844×390 触控模拟；不是实体设备 GPU、温升或电量结论 |
| 性能抽样 | 桌面和触控模拟的既有首关/南京切片均约 60 FPS；切片请求 29 个、传输约 1.23 MB | 本地无网络限速，不能外推真机 |

## 2. 本轮修复的关键问题

- 将视觉粒子、对白和撞车文案随机从玩法随机流拆开，固定 seed 不再随帧数、动效偏好或音频状态漂移。
- 修复移动横屏菜单按钮不足 44 CSS px、菜单重叠、HUD 小字/进度条重叠、竖屏遮罩下游戏继续跑和音频继续占用。
- 分享卡正确区分南京切片与主线成绩；二维码和复制链接只指向稳定站点根入口，不传播 `/releases/<build-id>/`。
- 构建输入规范化为 LF，同一 build ID 产物字节稳定；公开根配置、法务文件、深链、缓存和回滚指针进入制品检查。
- CI 补齐 PR、`main`、remediation 分支、tag、90 天制品/证据与独立 soak；部署脚本具备 dry-run、STS/环境变量密钥、读回核验和不重传版本目录的回滚测试。
- 修复旧测试的两类假绿：微信测试不再直接调用处理函数；发布截图必须连续三帧确认字体加载、状态稳定且 `wipe <= 0`，并校验恢复横屏后的真实视口与 Canvas 尺寸。

## 3. 当前视觉证据

本轮重新生成并人工查看了以下候选截图：

- `evidence/release-desktop_chromium.png`：1440×900，Canvas 1440×810；HUD、路线、鸭子、暂停/静音完整，无过场遮罩和字体方框。
- `evidence/release-android_chrome_ua.png`：844×390、DPR 2 触控模拟，Canvas 693.3×390；横屏完整，无旧截图的右半幅黑屏/裁切。
- `evidence/release-wechat-ua-share.png`：真实 Canvas 触控后的微信遮罩、成绩卡、二维码、复制按钮与 toast 完整可见。

详细观察见 [`evidence/release-visual-inspection.md`](evidence/release-visual-inspection.md)。这些截图不能替代实体 Android、iPhone 或微信 WebView。

## 4. 发布前仍需完成

1. 将当前本地分支推送为新的候选线，运行新工作流的完整 release 与独立 20 分钟 soak；先开启 `main` 分支保护，禁止绕过 PR/门禁直接写入。
2. 在稳定 HTTPS 候选地址上执行真实微信 WebView 5 分钟烟测，并补一台中端 Android、一台 iPhone 各 10 分钟记录；覆盖打开、首次操作、音频、前后台、横竖屏、失败重开、分享/刷新。
3. 完成南京成年人、亲子或青少年、非南京玩家各 8–10 人测试；规则复述率至少 85%，60 秒内主动重试率至少 60%。没有这组证据，不宣称“十秒会玩、老少咸宜”。
4. 用最终稳定 URL 重新生成并扫码核验二维码，再用本候选重截公众号素材。公众号提交 `27e8fa1` 基于旧基线，不能直接发布。
5. 另行获得合并与生产部署授权；任一真机失败、P0/P1、错误 build ID、404、证书或缓存问题均停止发布并按回滚手册处理。

## 5. 可复现命令

```powershell
npm.cmd ci
npm.cmd ci --prefix tools/e2e
npm.cmd run verify
npm.cmd run test:release
npm.cmd run test:release:soak
```

日常命令默认把机器证据写入系统临时目录。只有准备入库的候选证据才显式设置 `RELEASE_EVIDENCE_DIR=docs/qa/evidence`；不得让普通测试悄悄改写跟踪文件。
