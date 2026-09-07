# 《冲鸭！金陵！》发布记录

日期：2026-09-07。固定入口：`https://jinlingrun.caowenhu.com/`。仓库保持 **Private**。

## 当前状态

- README、头图与当前游戏实截已完成；桌面 900px、手机 360px、深浅色和图片检查通过。
- 公众号二维码为 `docs/launch/assets/jinlingrun-qr.png`，528×528，保留四模块留白；独立 ZXing-C++ 解码结果为固定根网址。二维码正确不等于网址已经上线。
- 素材复核为 66/70 通过；4 项 Grok 图集/派生图标的分发条件待确认。正式构建应拒绝，不能把试玩制品改标签后上传。
- Git 合并、远端 CI、完整发布检查与 20 分钟运行结果将在执行后更新，不沿用旧报告冒充本轮证据。
- OSS 控制台显示尚未开通；开通页面显示当前应付 ¥0，开通后按量后付费。尚未购买或开通服务。
- 阿里云 DNS 已核对 `caowenhu.com`，当前没有 `jinlingrun` 记录。已有 9 条解析保持原状。
- 未创建 Bucket、未新增 CDN 域名、未配置证书或 DNS，未上传网页。
- 真实 iPhone/Android 微信与公众号预览验收尚未执行。已有自动化和历史实机反馈不替代这次正式网址验收。

## 已选配置与前提

采用上海区域独立 OSS Bucket，建议名称 `jinlingrun-caowenhu-prod`（创建时核对全局可用性），标准存储、本地冗余、版本控制；CDN 使用 `jinlingrun.caowenhu.com`。只存放审核通过的游戏制品，根入口不缓存，版本资源长期缓存。部署身份限定到该 Bucket 与 CDN 刷新权限。

账号开通与后付费预算须在最终开通前确认；网页可访问性与证书就绪前不切 DNS。ICP备案和游戏公开发布适用手续分别核实，不以域名解析正常或私人测试通过代替。

## 发布顺序

1. 关闭实际素材待核项，逐文件更新有依据的审核记录。
2. 对最终 `main` 提交手动运行 `quality-gate`，`production=true`；等待 release 和 soak 作业通过。
3. 下载同一 run 的 `duckduckrun-<sha>-production`；核对 `distribution=production`、`pendingAssetReviews=0`、根与版本清单一致。
4. 使用部署脚本 dry-run，核对目标 Bucket、CDN 域名、构建 ID；再上传不可变版本、读回验证，最后切根指针。
5. HTTPS、根入口、关键资源与手机微信验收通过后，将 README 改为“开始游玩”，再提供公众号发布用入口。

## 回滚

正常版本回滚只恢复上一已验证版本的根入口及构建清单，再刷新两个入口 URL。首次上线没有旧版时，使用维护页并保留故障制品供定位。DNS 切换前记录原值；本次 `jinlingrun` 原状态为不存在。
