# DuckDuckRun 生产发布运行手册

> **备选方案归档。** 2026-09-07 已改为复用现有 EdgeOne Pages 免费托管，现役手册为 [edgeone.md](edgeone.md)。本页与 OSS 脚本保留备用，不代表需要开通或购买阿里云 OSS。

本手册对应 [`scripts/deploy_aliyun_oss.sh`](../../scripts/deploy_aliyun_oss.sh)，目标是将已验证的候选制品发布到**阿里云 OSS + 中国内地 CDN + HTTPS 自定义子域名**。发布保持纯静态：不部署服务器、容器、数据库、分析 SDK 或后台进程。默认路径是消费绑定批准 commit 的绿色 CI 制品；脚本先核对清单和 build ID，再上传不可变版本，最后为同一目标重新生成并切换两份根指针。任何凭证只存在于 GitHub Secrets、部署平台安全变量或本次命令进程环境中，不写配置文件，也不通过 `-i`/`-k` 出现在命令行。

正式入口已确定为 `https://jinlingrun.caowenhu.com/`，源码仓库保持 Private。部署时只操作 `jinlingrun` 子域名。2026-09-07 现场核对：OSS 尚未开通，当前无游戏 Bucket 或对应 DNS 记录；不要把下文示例值当作现成资源。当前状态见 [`../release/publish-status.md`](../release/publish-status.md)。

素材发布审核以 `assets/release-review.json` 为准，逐文件绑定 SHA-256、审阅者、日期、依据和结论。修改文件后批准自动失效；70 项当前随包素材已复核，具体依据见发布记录。

> **发布控制。** 未经一次明确生产确认，不执行脚本、不上传 OSS、不刷新 CDN，亦不修改 DNS。第 6 节的真实微信 WebView 冒烟是部署链路的最低人工技术门槛；公开发布仍须同时满足 `docs/qa/release-candidate-report.md` 列出的 Android/iPhone 实机和三类玩家验证，不能把一次微信烟测写成全部产品验收。

## 1. 一次性平台准备

| 项目 | 所需配置 | 验收标准 |
|---|---|---|
| Bucket | 创建标准存储 OSS Bucket（上海或现有合规中国内地区域），开启版本控制；只允许公共读取网站静态对象。 | Bucket 内无密钥、用户数据、构建工作目录或源 PNG。 |
| 静态站点 | 设置默认首页为 `index.html`。本项目根入口自行跳转到版本目录，正常候选路径不依赖 SPA 兜底。 | `https://run.example.com/` 和 `?slice=1&demo&seed=20260903` 均进入当前版本。 |
| CDN | 新增加速域名 `run.example.com`，源站为 OSS Bucket；加速区域为中国内地，缓存遵循第 4 节。 | 源站健康、CDN 域名状态正常，且只保留 OSS 源站。 |
| 域名与备案 | 配置子域名 CNAME；为中国内地 CDN 准备有效 ICP 备案。 | 备案号真实有效，DNS TTL 在首次切换前降至 300 秒。 |
| HTTPS | 在 CDN 加速域名配置与子域名匹配的有效证书，强制 HTTP→HTTPS。 | `curl -I http://run.example.com/` 为 301/302 到 HTTPS；浏览器证书链有效。 |
| RAM 最小权限 | 发布身份仅授予目标 Bucket 的对象上传/读取以及 CDN `RefreshObjectCaches`。 | 不使用主账号 AccessKey；密钥不出现在仓库、日志、Issue 或 PR。 |

OSS 静态站点、CDN 缓存和中国内地 CDN 的 ICP 前提均有官方说明。[1] [2] 自定义域名建议使用子域名而不是根域名 CNAME。[3] 前置 CDN 时，证书应配置在 CDN 域名上并可启用 HTTP→HTTPS。[4]

## 2. 环境变量与密钥

将下表值配置到 GitHub repository/environment 的 **Secrets**，或受保护部署平台的 secret variables。不要创建 `.env` 文件，不要把 AccessKey 写到 Actions YAML、Shell 历史、截图、工单或仓库。

| 变量 | 是否必需 | 示例格式 | 用途 |
|---|---:|---|---|
| `DEPLOY_OSS_ENDPOINT` | 是 | `oss-cn-shanghai.aliyuncs.com` | 目标 Bucket 的 OSS 外网 Endpoint。 |
| `DEPLOY_OSS_BUCKET` | 是 | `duckduckrun-prod` | 不含 `oss://` 的 Bucket 名。 |
| `ALIYUN_ACCESS_KEY_ID` | 是 | `LTAI…` | 仅有最小权限的 RAM 部署身份。 |
| `ALIYUN_ACCESS_KEY_SECRET` | 是 | 保密值 | 同上；不得打印。 |
| `ALIYUN_SECURITY_TOKEN` | STS 时是 | 保密值 | 可选的短期 STS token；脚本映射为 ossutil 与阿里云 CLI 的进程环境变量。 |
| `ALIYUN_REGION_ID` | CDN 时是 | `cn-shanghai` | CDN 刷新 API 使用的区域标识。 |
| `DEPLOY_CDN_DOMAIN` | CDN 时是 | `run.example.com` | CDN URL 刷新和最终访问入口。 |
| `DEPLOY_ARTIFACT_DIR` | 正常发布推荐 | `/secure/artifacts/dist` | 从指定绿色 CI run 下载并解压后的 `dist/` 根目录；脚本不在此目录改写指针。 |
| `DEPLOY_BUILD_ID` | 回滚时是 | `3e46040dc2db` | 要重新指向的已上传版本；脚本先核验远端版本清单，绝不复用当前 `dist` 根指针。 |
| `DEPLOY_DRY_RUN` | 否 | `1` | 只验证本地制品/ID 并打印脱敏命令；不访问 OSS/CDN、不读取凭证。 |
| `PUBLIC_SITE_URL` | 正式构建必设 | `https://jinlingrun.caowenhu.com` | 构建期固定根网址；`PUBLIC_BASE_PATH` 留空。 |

部署脚本会用 `DEPLOY_CDN_DOMAIN` 为根 `index.html` 生成稳定的 Open Graph URL/图片地址；版本目录内的运行时分享若未预注入 `PUBLIC_SITE_URL`，会自动从当前版本路径退回同域根入口，因此不会把二维码固定在 `/releases/<id>/`。

阿里云 ossutil 支持 `OSS_ENDPOINT`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET` 和 `OSS_SESSION_TOKEN` 环境变量；官方同时警告命令行密钥参数可能暴露在系统日志中。脚本把上表变量映射到这些进程环境变量，避免 AccessKey 出现在参数、进程列表和 dry-run 输出中。[7] 对象元数据使用官方 `header:value` 格式。[5] RAM 用户需要显式获得相应操作权限；CDN 刷新 API 需要 `cdn:RefreshObjectCaches` 权限。[6]

## 3. 制品优先的一键部署

在受保护的发布环境安装 Node 22、ossutil 1.6.16+ 和阿里云 CLI。对最终 `main` 提交手动运行 `quality-gate`，选择 `production=true`；它生成正式包并强制独立 20 分钟浸泡。必须等待 release 与 soak 两个作业都成功，下载该 run 的 `duckduckrun-<commit SHA>-production` 制品。普通 push/PR 产生的 `-preview` 包只供内部试玩，不得上传生产。以下以 GitHub CLI 为例，下载后的目录必须直接包含 `build-info.json` 和 `releases/`：

```bash
gh run download <绿色 run ID> \
  --name duckduckrun-<完整 commit SHA>-production \
  --dir /secure/artifacts/duckduckrun-dist
```

先执行无凭证 dry-run。它会核对根清单与版本清单完全一致、清单所列文件真实存在、根入口与 build ID 一致，并打印即将执行的 OSS/CDN 命令；它不会访问云端，也不能替代发布后的读回验证。

```bash
DEPLOY_DRY_RUN=1 \
DEPLOY_ARTIFACT_DIR=/secure/artifacts/duckduckrun-dist \
./scripts/deploy_aliyun_oss.sh
```

在 dry-run 输出、批准 SHA 和 build ID 三者一致后，再以受保护 Secrets 注入真实变量并执行同一个入口：

```bash
DEPLOY_ARTIFACT_DIR=/secure/artifacts/duckduckrun-dist \
./scripts/deploy_aliyun_oss.sh
```

如果无法取得已验证制品且明确选择从源码构建，可不设置 `DEPLOY_ARTIFACT_DIR`。此冷环境兜底会依次执行根目录 `npm ci`、`tools/e2e` 的锁定安装、Playwright Chromium/WebKit 安装、`verify`、`test:release:production` 和强制 20 分钟浸泡。不得把这条兜底写成“使用了 CI 制品”。

脚本的发布顺序不可改变。正常发布先上传 `releases/<build-id>/`，再从 OSS 读回版本入口和版本清单确认 ID；随后依据该版本清单在临时目录重新生成根 `build-info.json` 和根 `index.html`，最后上传并再次从 OSS 读回两者，确认都指向同一 build ID。它不直接上传制品中可能陈旧的根文件。若设置 `DEPLOY_CDN_DOMAIN`，只刷新 `index.html` 与 `build-info.json` 两个 URL。

建议为 GitHub 的生产环境设置审批规则，并将上述值全部设为 environment-level Secrets。合并 PR、创建 tag 与执行生产发布是三个不同动作；本阶段只准备脚本和候选，不自动执行第三步。

## 4. 缓存、版本化与 CDN 刷新规则

| 路径类型 | OSS/CDN 响应头 | 发布动作 | 原因 |
|---|---|---|---|
| `releases/<build-id>/**` | `Cache-Control: max-age=31536000, immutable` | 只上传；不做 CDN 刷新 | build ID 与内容哈希保证路径不可变；ossutil 参数为 `Cache-Control:max-age=31536000, immutable`。 |
| `/index.html` | `Cache-Control: no-cache, no-store, must-revalidate` | 每次发布最后上传并刷新 URL | 指向目标版本的跳转指针；由脚本按目标 ID 重新生成。 |
| `/build-info.json` | `Cache-Control: no-cache, no-store, must-revalidate` | 每次发布先于 index 上传并刷新 URL | 从目标版本清单复制；发布后必须读回确认 build ID。 |
| 不存在对象 | 正常 404 | 不配置为全站返回 `index.html` | 游戏根入口不依赖 SPA fallback；保留真实 404 有利于发现错路径。 |

CDN 刷新会使节点上的目标缓存失效，官方提示批量刷新会增加回源压力，且任务通常约需 5–6 分钟生效。[6] 因此只刷新两个可变 URL；更新后等待任务生效，再执行验证。不要刷新整个 `releases/` 目录、hash 文件或通配根目录。

## 5. 发布后验证与故障排查

发布后在 Chrome、Edge、Android Chrome、iOS Safari 模拟/可用环境重复候选测试，并从两个不同网络检查最终域名。下列命令不含密钥，可在任意终端执行。

```bash
curl -sS https://run.example.com/build-info.json
curl -I https://run.example.com/
curl -sS 'https://run.example.com/?slice=1&demo&seed=20260903' | head
```

应看到新 `buildId`、HTTPS 有效响应，以及深链接的正常根入口跳转。随后打开页面，检查第一次输入后音频启用，失败重开、页面刷新、后台返回与横竖屏切换均正常。若任何检查失败，**先回滚入口，后分析原因**。

| 现象 | 优先检查 | 处置 |
|---|---|---|
| 访问旧版 | `index.html` 响应头、CDN 刷新任务状态、构建 ID | 只重刷 `/index.html` 和 `/build-info.json`；等待 5–6 分钟后复测。 |
| 404/白屏 | 根入口跳转、版本目录是否完整、浏览器 console | 回滚根入口；核对 `dist/releases/<build-id>/` 与 `build-info.json`。 |
| HTTPS 报错 | 证书域名、证书链、CDN HTTPS 配置、强制跳转 | 暂停 DNS 切换或回滚入口；不要以关闭 HTTPS 作为常规修复。 |
| CDN 回源异常 | CDN 源站仅 OSS、Bucket 公共读策略、Endpoint/区域 | 修正源站与 Bucket ACL；不添加 ECS/反向代理作为临时补丁。 |
| 成本异常 | CDN 用量、Referer 防盗链、异常请求日志 | 优先启用域名白名单与告警；不在未评估下接入分析 SDK。 |
| 发布脚本失败 | 环境变量、`ossutil`/`aliyun` 命令、RAM 权限 | 停止发布，保留旧入口，按照错误码补最小权限后重试。 |

## 6. 部署前最低人工技术门槛：真实手机微信 WebView 冒烟（≤5 分钟）

必须用一台真实手机、最新可用微信内置浏览器和最终 HTTPS 候选 URL 执行一次；自动化 UA 模拟不替代此测试。无需完整通关，按以下顺序操作并在任一步失败时截图：打开链接，进行首次操作，确认音频经用户手势解锁；将微信切至后台再返回；切换横竖屏；故意失败后点击再跑；在失败页执行分享或刷新链接。记录手机型号、OS、微信版本、网络、URL/build ID、通过/失败和截图。本项失败即停止部署；本项通过也只关闭微信部署烟测，不能替代另一个系统真机样本和真人易学性测试。

## References

[1]: https://help.aliyun.com/zh/oss/user-guide/hosting-static-websites "OSS 静态网站托管"
[2]: https://help.aliyun.com/zh/icp-filing/basic-icp-service/product-overview/use-alibaba-cloud-cdn "使用阿里云 CDN 的 ICP 备案要求"
[3]: https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names "通过自定义域名访问 OSS"
[4]: https://help.aliyun.com/zh/oss/user-guide/access-oss-by-https-protocol "通过 HTTPS 协议访问 OSS"
[5]: https://help.aliyun.com/zh/oss/developer-reference/upload-objects-6 "ossutil cp 上传文件"
[6]: https://help.aliyun.com/zh/cdn/developer-reference/api-cdn-2018-05-10-refreshobjectcaches "RefreshObjectCaches - 刷新缓存"
[7]: https://help.aliyun.com/zh/oss/developer-reference/ossutil-overview "ossutil 环境变量与凭证优先级"
