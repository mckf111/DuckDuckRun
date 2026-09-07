# EdgeOne Pages 正式发布与回滚

当前选择：复用作者已有腾讯云 EdgeOne Pages（控制台现称 Makers）免费站点，创建独立项目 `jinlingrun`，全球可用区（含中国大陆），正式域名 `https://jinlingrun.caowenhu.com/`。仓库保持 Private。阿里云只负责该域名的 DNS，不开通 OSS 或新增付费套餐。

## 制品与上线

1. 合并至 `main`，手动运行 `quality-gate`，设置 `production=true`。等待 release 与 soak 两个作业全部成功；正式浸泡强制 20 分钟。普通 push 生成的 preview 包不可发布。
2. 下载该次 run 的 `duckduckrun-<完整 SHA>-production` 到独立目录。检查 `distribution=production`、待审数量为 0、构建 ID 及来源提交一致。
3. 执行 `python tools/package_edgeone.py --artifact-dir <已解压制品目录> --commit <该 run 的完整 SHA>`。该脚本不会构建：只检查清单、稳定网址、文件集合与路径，再生成 ZIP 和 SHA-256 回执，逐文件读回比对。默认产物在 `tools/e2e/shots/edgeone/`，不入库。
4. EdgeOne 控制台选择“创建项目 → 直接上传”，项目名 `jinlingrun`，使用上述正式 ZIP。压缩包最外层直接含 `index.html`、`build-info.json`、`edgeone.json` 与 `releases/`，不能再包一层 `dist/`。
5. 绑定 `jinlingrun.caowenhu.com`，按照控制台实际返回值新增归属验证和 CNAME。只修改 `jinlingrun` 及其必要验证记录，保留主域名与其他项目记录。等待平台 HTTPS 证书生效。
6. 核验根网址、版本清单、资源 MIME/404、分享根链接和手机微信访问。通过后更新 README 入口状态并交付公众号二维码。

直接上传不需要给平台新的 GitHub 仓库权限，也不需要读取或保存长期部署密钥。只上传经过验证的制品，不上传整个源码目录、内部审核材料、原始候选照片或聊天记录。

## 缓存与回滚

`edgeone.json` 随制品提供：根 `/`、`/index.html`、`/build-info.json` 禁用存储缓存；`/releases/*` 为一年不可变缓存。上线后读取真实响应头验证，不能只看本地配置。

首次上线保存正式 ZIP、来源 SHA、构建 ID、平台部署 ID 和域名记录。后续回滚先在部署记录中检查平台当前可用的回滚/重新发布入口；若没有，就重新上传上一份已验收 ZIP，使根入口、版本文件和缓存配置一起恢复。重新读取线上 `build-info.json` 和关键页面确认。不要把旧根入口单独指向当前包中不存在的版本目录。

后续发布默认使用 `--retain-artifact <上一已验收正式制品目录>` 打包，保留仍在线使用的旧版本资源。脚本分别校验新旧制品，仅追加旧 `releases/<id>/`，根入口、根清单和缓存配置来自新版，并在回执记录保留的构建 ID。上线后核验旧版本延迟加载的图片仍可读取；不能假定平台自动保留旧部署文件。

## 验收边界

自动化检查不替代真实 iPhone/Android 微信。正式地址须由实体设备复核首次游玩、触控、音频手势解锁、前后台恢复、旋转暂停、图鉴照片与分享返回。ICP 备案及游戏公开发布适用手续按实际主体和平台要求核对，不以免费套餐代替。

官方依据：[直接上传](https://pages.edgeone.ai/zh/document/direct-upload)、[配置文件](https://pages.edgeone.ai/document/edgeone-json)、[自定义域名](https://pages.edgeone.ai/document/custom-domain)、[免费方案](https://pages.edgeone.ai/zh/pricing)。免费额度与规则以当前控制台为准。
