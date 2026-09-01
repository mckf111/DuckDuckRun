# DuckDuckRun 静态发布回滚手册

本项目采用“不可变版本目录 + 可变根入口”发布。回滚的默认动作**不是**删除新版本、清空 CDN 或改动 DNS；而是把根 `index.html` 和 `build-info.json` 恢复到上一已知良好版本，然后只刷新这两个对象。这样可在最小影响范围内恢复玩家入口，同时保留故障版本供复盘。

> **先恢复可用性，后分析根因。** 出现白屏、P0/P1、运行时 console 异常、关键资源 404、错误版本 build ID、HTTPS 证书错误或真实微信冒烟失败时，停止后续发布，立即执行入口回滚。新版本目录不可删除，至少保留至事故复盘完成。

## 1. 回滚判据与责任边界

| 级别 | 触发条件 | 立即动作 | 是否需要 DNS 变更 |
|---|---|---|---|
| P0 | 首页不可访问、大范围白屏、证书完全失效、入口指向不存在版本 | 立即回滚根入口，刷新两个可变 URL，核验旧 build ID。 | 否，除非 CDN 域名/证书层本身不可用。 |
| P1 | 关键操作无响应、音频/前后台恢复使页面不可玩、首个可玩画面明显越过 8 秒、关键资源 404 | 停止发布，回滚根入口并提取 console/网络证据。 | 否。 |
| P2 | 视觉细节、非阻断性能波动、可用替代路径的文案/布局问题 | 不在生产紧急改动；创建修复候选。 | 否。 |
| DNS/CDN 层故障 | CNAME 误指向、CDN 域名配置错误、证书链错误，且入口回滚无效 | 依据 DNS 低 TTL 恢复上一个确认可用 CNAME/记录；若需改 DNS，先取得生产确认。 | 可能。 |

## 2. 标准入口回滚

首先确定“上一已知良好构建 ID”。保存发布记录时必须写入候选 tag、commit SHA、构建 ID、发布 UTC 时间、验证人及回滚构建 ID。当前发布候选为 `1634d51bc5b8`；它尚未实际上传，不得把它误记为线上旧版本。

从已保存的历史构建制品或上一次发布的 `dist/index.html` 和 `dist/build-info.json` 恢复入口。根入口的内容只包含一个指向 `./releases/<build-id>/` 的跳转，因此其回滚前应人工核对目标 build ID 的版本目录确实已存在于 OSS。若历史文件在本地未保存，重新检出对应 release tag 构建，并以 `DEPLOY_BUILD_ID=<old-build-id>` 运行部署脚本；脚本会验证本地已有 `dist/releases/<old-build-id>/` 后上传版本目录并在最后切换入口。

```bash
# 在受保护的发布环境注入 Secrets 后执行。
DEPLOY_BUILD_ID=<上一已知良好12位构建ID> \
  ./scripts/deploy_aliyun_oss.sh
```

该命令只在版本目录完整存在时才继续；它会覆盖根 `index.html` 与 `build-info.json`，并在配置了 `DEPLOY_CDN_DOMAIN` 时仅刷新这两个 URL。阿里云说明 URL 刷新会使目标节点缓存失效，新请求回源获取新内容；大面积刷新会抬高源站压力，因此不得用目录刷新替代本流程。[1]

## 3. 回滚验证

入口回滚提交后，等待 CDN 刷新任务生效（官方提示通常约 5–6 分钟），再从两个不同网络执行下表验证。[1]

| 验证 | 命令或操作 | 期望结果 |
|---|---|---|
| 当前入口版本 | `curl -sS https://<domain>/build-info.json` | `buildId` 为上一良好版本。 |
| HTTP/HTTPS | `curl -I http://<domain>/` 与 `curl -I https://<domain>/` | HTTP 跳 HTTPS；HTTPS 证书有效。 |
| 根入口 | 浏览器打开 `https://<domain>/` | 跳转到 `releases/<old-build-id>/`，无 404/白屏。 |
| 深链接 | 打开 `?slice=1&demo&seed=20260903` 并刷新 | 仍进入同一旧版切片。 |
| 核心可玩性 | 首次操作、音频、失败重开、后台返回、横竖屏 | 无 console error/资源 404；真实手机微信必须复测。 |

将结果、请求 ID、CDN 刷新任务 ID、响应头、截图、发生与恢复时间写入发布记录。不要仅因“浏览器缓存看起来旧”判断失败；应以 `build-info.json`、CDN 任务和两个独立网络为准。

## 4. DNS 与证书的紧急路径

正常版本回滚不改变 DNS。只有 CNAME、CDN 域名或证书本身错误并导致所有入口均失败时，才执行 DNS/证书应急：将记录还原到发布前已验证的值，或在 CDN 先恢复上一有效证书配置。域名 CNAME 变更会受 TTL 和运营商缓存影响，阿里云也提示完全生效可能从几分钟到数小时不等。[2] 因此，DNS 变更必须记录原值、目标值、TTL、操作者和计划回退时间，并取得一次明确生产确认。

任何证书异常都不应通过长期关闭 HTTPS 处理。自定义域名的 HTTPS 需匹配有效证书；CDN 前置时，证书应配置在 CDN 域名上。[3]

## 5. 复盘与恢复发布

故障稳定后，锁定故障构建 ID、tag、commit SHA 与发布脚本版本。检查错误边界、控制台、网络 4xx/5xx、CDN 回源、缓存头、真实微信 WebView 记录与资源清单哈希。修复应在新分支产生新 build ID；禁止直接复用故障版本目录覆盖文件，也禁止通过删除历史版本掩盖问题。通过 `npm run test:release`、`npm run test:release:soak` 和一次真实手机微信 WebView 冒烟后，才进入下一轮发布确认。

## References

[1]: https://help.aliyun.com/zh/cdn/developer-reference/api-cdn-2018-05-10-refreshobjectcaches "RefreshObjectCaches - 刷新缓存"
[2]: https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names "通过自定义域名访问 OSS"
[3]: https://help.aliyun.com/zh/oss/user-guide/access-oss-by-https-protocol "通过 HTTPS 协议访问 OSS"
