#!/usr/bin/env bash
# DuckDuckRun 纯静态发布：先上传不可变版本目录，再原子切换根入口。
# 仅从环境变量读取凭证；请将其设置为 GitHub Secrets 或部署平台密钥。
set -euo pipefail

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

require() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "缺少必需环境变量：$name" >&2
    exit 2
  fi
}
for name in DEPLOY_OSS_ENDPOINT DEPLOY_OSS_BUCKET ALIYUN_ACCESS_KEY_ID ALIYUN_ACCESS_KEY_SECRET; do require "$name"; done
command -v ossutil >/dev/null 2>&1 || { echo '未找到 ossutil；按 docs/deployment/runbook.md 安装或由 CI 预装。' >&2; exit 2; }

if [[ -z "${DEPLOY_BUILD_ID:-}" ]]; then
  npm ci
  npm run verify
  npm run test:release
  if [[ "${RUN_RELEASE_SOAK:-0}" == "1" ]]; then npm run test:release:soak; fi
  BUILD_ID="$(sed -nE 's/.*"buildId"[[:space:]]*:[[:space:]]*"([0-9a-f]{12})".*/\1/p' dist/build-info.json | head -1)"
else
  BUILD_ID="$DEPLOY_BUILD_ID"
fi

if [[ ! "$BUILD_ID" =~ ^[0-9a-f]{12}$ ]]; then
  echo "无效 DEPLOY_BUILD_ID；期望 12 位小写十六进制构建 ID。" >&2
  exit 2
fi
if [[ ! -d "dist/releases/$BUILD_ID" ]]; then
  echo "未找到 dist/releases/$BUILD_ID；回滚时请先获取该候选制品，或改用已保存的根入口副本。" >&2
  exit 2
fi

# 通过本次进程的命令行参数传入凭证，不生成或修改本机 ossutil 配置文件。
# 生产中请使用最小权限 RAM 凭证或 CI 的临时凭证，绝不可把值写入仓库。
OSS=(ossutil -e "$DEPLOY_OSS_ENDPOINT" -i "$ALIYUN_ACCESS_KEY_ID" -k "$ALIYUN_ACCESS_KEY_SECRET")
TARGET="oss://${DEPLOY_OSS_BUCKET}"

# 版本目录永不覆盖历史版本；内容指纹资源可安全长期缓存。
"${OSS[@]}" cp -r -f "dist/releases/$BUILD_ID/" "$TARGET/releases/$BUILD_ID/" \
  --meta 'Cache-Control:max-age=31536000:immutable' \
  --acl public-read
"${OSS[@]}" cp -f "dist/build-info.json" "$TARGET/build-info.json" \
  --meta 'Cache-Control:no-cache:no-store:must-revalidate' \
  --acl public-read

# 根入口是唯一可变对象。最后上传它，用户要么进入旧版本，要么进入完整上传的新版本。
"${OSS[@]}" cp -f "dist/index.html" "$TARGET/index.html" \
  --meta 'Cache-Control:no-cache:no-store:must-revalidate' \
  --acl public-read

if [[ -n "${DEPLOY_CDN_DOMAIN:-}" ]]; then
  require ALIYUN_REGION_ID
  command -v aliyun >/dev/null 2>&1 || { echo '已设置 DEPLOY_CDN_DOMAIN 但未找到 aliyun CLI。' >&2; exit 2; }
  # 只刷新可变入口；不得刷新版本目录或 hash 文件，避免放大回源与缓存抖动。
  ALIBABA_CLOUD_ACCESS_KEY_ID="$ALIYUN_ACCESS_KEY_ID" \
  ALIBABA_CLOUD_ACCESS_KEY_SECRET="$ALIYUN_ACCESS_KEY_SECRET" \
  aliyun cdn RefreshObjectCaches --region "$ALIYUN_REGION_ID" \
    --ObjectPath $'https://'"${DEPLOY_CDN_DOMAIN}"$'/index.html\nhttps://'"${DEPLOY_CDN_DOMAIN}"$'/build-info.json' \
    --ObjectType File >/dev/null
fi

echo "发布完成：构建 $BUILD_ID 已上传至 $TARGET；根入口已切换。"
if [[ -n "${DEPLOY_CDN_DOMAIN:-}" ]]; then
  echo "访问地址：https://${DEPLOY_CDN_DOMAIN}/"
else
  echo '未设置 DEPLOY_CDN_DOMAIN：请使用已绑定 HTTPS 的自定义域名进行验证。'
fi
