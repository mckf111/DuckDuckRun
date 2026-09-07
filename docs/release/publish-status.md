# 《冲鸭！金陵！》发布记录

日期：2026-09-07。固定入口：`https://jinlingrun.caowenhu.com/`。仓库保持 **Private**。

## 当前状态

- README、头图与当前游戏实截已完成；桌面 900px、手机 360px、深浅色和图片检查通过。
- 公众号二维码为 `docs/launch/assets/jinlingrun-qr.png`，528×528，保留四模块留白；独立 ZXing-C++ 解码结果为固定根网址。二维码正确不等于网址已经上线。
- 素材复核为 70/70 通过；用户确认个人 Grok 订阅，依据官方 Consumer FAQ 落实 Created with Grok 署名。文件变化后仍自动失效。
- 首次合并已推送到 `main`：`5198f38`；远端普通检查 run `34082938830` 成功。这是预览检查，不冒充最终正式制品验收。
- 首次正式 CI `34084463294` 暴露音频源 CRLF/LF 指纹差异，已修复为与实际发布字节相同的规范化规则。最终正式 CI [34085016442](https://github.com/mckf111/DuckDuckRun/actions/runs/34085016442) 的 release 与 soak 两项均成功，来源提交 `2d95faf7837bd7bbc3b7506002461a05a54bb463`，构建 `18741739d7da`，与本地及干净检出构建一致。
- 持续运行 1,200,442 ms，16 次重开，堆变化 +1.97%，错误数 0；这是 CI Chromium 触控模拟，非实体手机结果。
- 已下载同一 CI 的正式制品，打包为 108 文件、12,078,496 字节的 ZIP；SHA-256 为 `42fc12d7ddb65b11a8e8b6f4b31b47e330b6a518427d7ad31e4010f6590e0f45`。未重建 CI 制品。
- 持续测试原脚本在旋转阶段仍等待已取消的 `#rotate`；已改为验证旋转暂停、竖屏适配、恢复后距离推进和横屏恢复，8 秒流程自检通过。该短程检查不替代 20 分钟浸泡。
- 托管改为已有 EdgeOne Pages 免费站点的独立 `jinlingrun` 项目，全球可用区（含中国大陆）。账号已登录；现有 `if-history` 项目、免费额度和区域已核对。
- OSS 未购买、未开通；阿里云只负责 DNS。
- 阿里云 DNS 已核对 `caowenhu.com`，当前没有 `jinlingrun` 记录。已有 9 条解析保持原状。
- 用户已明确授权向 EdgeOne 上传正式网页包并公开访问，首次自动审批拦截已解除。正式包已上传成功：项目 `makers-ph8ezjstboo1`（jinlingrun），部署 `dp2edl0rn7rm`，平台显示成功，时间 2026-09-07 13:32:13（UTC+8）。平台只解压与复制静态文件，没有重跑本仓库源码构建。
- 临时项目域名 `jinlingrun-l2jzjarz.edgeone.cool` 的匿名 HTTPS 构建清单返回 200，版本为 `18741739d7da`、production、待审 0；清单与下载的 CI 文件逐字节一致，根清单响应带 `no-cache, no-store, must-revalidate`。临时域名不作为公众号入口。
- 已添加自定义域名 `jinlingrun.caowenhu.com` 并验证归属权；新增 TXT 主机 `edgeonereclaim.jinlingrun`，TTL 600，公共 DNS 已核对生效。此时原有解析均保留。
- 13:42 刷新前最后可读状态：固定域名在 EdgeOne 显示“部署中”，CNAME 尚未返回、HTTPS 尚未配置。随后腾讯云控制台在两个浏览器中持续只显示页头；已尝试刷新、服务总览入口和另一已登录浏览器，仍无法读取配置。浏览器标签列表通信正常，无 JavaScript 对话框阻塞。当前需恢复控制台访问以继续 CNAME 与证书配置；不能据此宣称固定域名已上线。
- 真实 iPhone/Android 微信与公众号预览验收尚未执行。已有自动化和历史实机反馈不替代这次正式网址验收。

## 已选配置与前提

采用现有 `default-pages-zone` 下独立 EdgeOne 项目 `jinlingrun`，通过 ZIP 直接上传审核通过的静态制品。无需新建 GitHub 授权或长期部署密钥；根入口不缓存，版本资源长期缓存。

只使用已核对的免费方案，不开通额外付费服务。ICP备案和游戏公开发布适用手续分别核实，不以域名解析正常或私人测试通过代替。

## 发布顺序

1. 关闭实际素材待核项，逐文件更新有依据的审核记录。
2. 对最终 `main` 提交手动运行 `quality-gate`，`production=true`；等待 release 和 soak 作业通过。
3. 下载同一 run 的 `duckduckrun-<sha>-production`；核对 `distribution=production`、`pendingAssetReviews=0`、根与版本清单一致。
4. 使用 `tools/package_edgeone.py` 校验并打包同一 CI 制品，直接上传 EdgeOne；绑定已选域名、验证证书与实际缓存响应头。详见 [现役发布手册](../deployment/edgeone.md)。
5. HTTPS、根入口、关键资源与手机微信验收通过后，将 README 改为“开始游玩”，再提供公众号发布用入口。

## 回滚

正常版本回滚使用平台可用的历史部署入口，或重新上传上一份完整、已验证的 ZIP。首次上线没有旧版时使用维护页，并保留故障制品供定位。DNS 切换前记录原值；本次 `jinlingrun` 原状态为不存在。
