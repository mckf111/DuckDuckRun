# 《冲鸭！金陵！》发布记录

日期：2026-09-07。固定入口：`https://jinlingrun.caowenhu.com/`。仓库保持 **Private**。

**本轮更新已上线。** 2026-09-07 18:28（UTC+8）正式域名已读回构建 `b599cfb77d82`，部署 ID `dp9a2abv7fw2`；下方保留首次上线记录。用户已对本轮本地手机试玩及修改作出确认并明确授权上线，线上技术检查不冒充所有实体设备或用户组验收。

## 本轮发布（当前）

- 源码已通过 [PR #2](https://github.com/mckf111/DuckDuckRun/pull/2) 合并至 `main`，来源提交 `59d42dbce5e75d23f1073de880dfb4e3012fe9e3`，源码树 `01b56a74381bbd4122bdadfdbd642169fa9df249`。包含关卡递进、难度与目标入口、教学失败边界、技巧判定、磁铁、撞击、图鉴往返及多模型创作署名。
- 正式 CI [34108877618](https://github.com/mckf111/DuckDuckRun/actions/runs/34108877618) 的 release 与 soak 均成功。持续运行 1,200,354 ms、16 次重开、错误 0、堆增长 2.05%、最长长任务 62 ms；环境为 Chromium 触控模拟。
- 下载同一 CI 的 production 制品，本地与 Linux CI 的 108 个文件逐字节一致；待审核素材 0 项。
- 通过 `package_edgeone.py --retain-artifact` 保留上一构建 `18741739d7da` 的版本资源。ZIP 包 213 文件、24,162,742 字节，SHA-256 `bac6d34f954d6d0b6f6e3ed3f9160a4e386349eb7c0cd704f770a6a306e384f7`。没有在上传前重建或改写 CI 制品。
- EdgeOne 项目 `makers-ph8ezjstboo1`（jinlingrun）生产环境部署成功，记录时间 2026-09-07 18:23:58，平台构建用时 19s；仅解压与发布静态文件，未运行项目源码构建。
- 公网根清单与 CI 原件一致，根入口及清单为 `no-cache, no-store, must-revalidate`；HTTP 正常跳转 HTTPS。210 个新旧版本文件全部返回正确字节和不可变缓存，JS/CSS 类型正确，故意请求不存在脚本返回 404。
- 已在 Chrome 实际打开正式根网址进入新版；首页难度与拿星目标、版权页四模型署名和资料入口在线可见。公网新手练习撞墙后明确暂停并出现重试/直接开跑出口，控制台错误 0。界面检查和控制台结果留在本轮工具记录；逐文件网络证据为 `docs/release/online-b599cfb77d82.json`。
- 本轮未改 DNS、证书、套餐、源码仓库可见性或其他项目。上一版完整正式制品与发布记录保留，可按 EdgeOne 运行手册回滚。
- Git 常规推送曾受网络影响，前三个提交通过 GitHub 官方 Git 对象 API 原样同步；blob、tree、commit SHA 均逐项一致，未强推或改写历史。网络恢复后常规 fetch/快进恢复。


## 首次上线验收（历史）

- CNAME：`jinlingrun` → `jinlingrun.caowenhu.com.pages.dnsoe4.com`，TTL 600；公共 DNS 与控制台读回一致。原有记录保留。
- 免费 HTTPS 证书已部署，CN 为 `jinlingrun.caowenhu.com`，颁发者 TrustAsia DV TLS RSA CA 2025，有效至 2026-12-06 07:59:59（UTC+8）；平台配置到期前 15 天自动更新。正常 TLS 校验通过，没有忽略证书错误。
- 强制 HTTPS 已开启：HTTP 根入口返回 302 到同域 HTTPS。HTTPS 根入口与构建清单均返回 200、`no-cache, no-store, must-revalidate`。
- 105 个版本文件全部返回 200、字节与 CI 制品一致，版本资源带不可变缓存；JS/CSS 类型正确，故意请求不存在的脚本返回 404。
- 正式域名已在 Chrome 中实际进入游戏，操作、暂停、恢复与版权入口可用；控制台错误数 0。Created with Grok 及照片/字体声明在线可见。
- 二维码仍指向固定根网址，不使用临时域名或版本目录。上线后 README 已改为“开始游玩”；公众号文章由作者自行预览和发布。

## 发布过程记录（按发生时状态保留）

## 首次发布时状态（历史）

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
- 发布前阿里云 DNS 已核对 `caowenhu.com`，当时没有 `jinlingrun` 记录；原有 9 条解析保留，本次只增加 TXT 与 CNAME。
- 用户已明确授权向 EdgeOne 上传正式网页包并公开访问，首次自动审批拦截已解除。正式包已上传成功：项目 `makers-ph8ezjstboo1`（jinlingrun），部署 `dp2edl0rn7rm`，平台显示成功，时间 2026-09-07 13:32:13（UTC+8）。平台只解压与复制静态文件，没有重跑本仓库源码构建。
- 临时项目域名 `jinlingrun-l2jzjarz.edgeone.cool` 的匿名 HTTPS 构建清单返回 200，版本为 `18741739d7da`、production、待审 0；清单与下载的 CI 文件逐字节一致，根清单响应带 `no-cache, no-store, must-revalidate`。临时域名不作为公众号入口。
- 已添加自定义域名 `jinlingrun.caowenhu.com` 并验证归属权；新增 TXT 主机 `edgeonereclaim.jinlingrun`，TTL 600，公共 DNS 已核对生效。此时原有解析均保留。
- 13:42 后曾因网络导致腾讯云控制台加载失败；用户恢复网络后继续配置，14:18 新增 CNAME，随后免费证书部署成功。该阻塞已解除。
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
