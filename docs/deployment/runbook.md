# DuckDuckRun 生产发布运行手册

本手册对应 [`scripts/deploy_aliyun_oss.sh`](../../scripts/deploy_aliyun_oss.sh)，目标是将已验证的候选制品发布到**阿里云 OSS + 中国内地 CDN + HTTPS 自定义子域名**。发布保持纯静态：不部署服务器、容器、数据库、分析 SDK 或后台进程。脚本先做构建/门禁，再上传不可变版本，最后切换根入口；任何凭证只存在于 GitHub Secrets、部署平台安全变量或本次命令进程中。

> **发布控制。** 未经一次明确生产确认，不执行脚本、不上传 OSS、不刷新 CDN，亦不修改 DNS。本阶段的实机微信 WebView 冒烟是发布前唯一人工门槛；其步骤见本手册第 6 节。

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
| `ALIYUN_REGION_ID` | CDN 时是 | `cn-shanghai` | CDN 刷新 API 使用的区域标识。 |
| `DEPLOY_CDN_DOMAIN` | CDN 时是 | `run.example.com` | CDN URL 刷新和最终访问入口。 |
| `DEPLOY_BUILD_ID` | 回滚时是 | `3e46040dc2db` | 要重新指向的已上传版本；正常新发布无需设置。 |
| `RUN_RELEASE_SOAK` | 否 | `1` | 设置为 `1` 时，将在本地/CI 发布前额外执行 20 分钟浸泡。 |

阿里云 `ossutil cp` 支持以命令行传入 Endpoint、AccessKey 并上传对象元数据；RAM 用户需要显式获得相应操作权限。[5] CDN 刷新 API 需要 `cdn:RefreshObjectCaches` 权限。[6]

## 3. 一键构建与部署

在受保护的发布环境安装 Node 22、`ossutil` 和阿里云 CLI 后，以 Secrets 注入上述变量。下面命令是唯一发布入口；脚本会运行 `npm ci`、`npm run verify`、构建与候选制品检查，然后获取构建 ID。

```bash
./scripts/deploy_aliyun_oss.sh
```

脚本的发布顺序不可改变。它先将 `dist/releases/<build-id>/` 的全部内容上传为不可变版本，接着上传 `build-info.json`，最后覆盖根 `index.html`。所以入口要么仍指向旧版本，要么指向已完整上传的新版本。若设置 `DEPLOY_CDN_DOMAIN`，它只提交 `index.html` 与 `build-info.json` 的 URL 刷新，避免不必要地冲掉内容指纹资源的边缘缓存。

建议为 GitHub 的生产环境设置审批规则，并将上述值全部设为 environment-level Secrets。合并 PR、创建 tag 与执行生产发布是三个不同动作；本阶段只准备脚本和候选，不自动执行第三步。

## 4. 缓存、版本化与 CDN 刷新规则

| 路径类型 | OSS/CDN 响应头 | 发布动作 | 原因 |
|---|---|---|---|
| `releases/<build-id>/**` | `Cache-Control: max-age=31536000, immutable` | 只上传；不做 CDN 刷新 | build ID 与内容哈希保证路径不可变，可长期缓存。 |
| `/index.html` | `Cache-Control: no-cache, no-store, must-revalidate` | 每次发布最后上传并刷新 URL | 这是唯一指向新版本的切换指针。 |
| `/build-info.json` | `Cache-Control: no-cache, no-store, must-revalidate` | 每次发布上传并刷新 URL | 便于发布后确认当前构建。 |
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

## 6. 唯一人工门槛：真实手机微信 WebView 冒烟（≤5 分钟）

必须用一台真实手机、最新可用微信内置浏览器和最终 HTTPS 候选 URL 执行一次；自动化 UA 模拟不替代此测试。无需完整通关，按以下顺序操作并在任一步失败时截图：打开链接，进行首次操作，确认音频经用户手势解锁；将微信切至后台再返回；切换横竖屏；故意失败后点击再跑；在失败页执行分享或刷新链接。记录手机型号、OS、微信版本、网络、URL/build ID、通过/失败和截图。全部通过才允许把该候选用于公开生产入口。

## References

[1]: https://help.aliyun.com/zh/oss/user-guide/hosting-static-websites "OSS 静态网站托管"
[2]: https://help.aliyun.com/zh/icp-filing/basic-icp-service/product-overview/use-alibaba-cloud-cdn "使用阿里云 CDN 的 ICP 备案要求"
[3]: https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names "通过自定义域名访问 OSS"
[4]: https://help.aliyun.com/zh/oss/user-guide/access-oss-by-https-protocol "通过 HTTPS 协议访问 OSS"
[5]: https://help.aliyun.com/zh/oss/developer-reference/upload-objects-6 "ossutil cp 上传文件"
[6]: https://help.aliyun.com/zh/cdn/developer-reference/api-cdn-2018-05-10-refreshobjectcaches "RefreshObjectCaches - 刷新缓存"
