#!/usr/bin/env bash
# DuckDuckRun 纯静态发布：先验证制品/目标版本，再切换两份根指针。
# 凭证只从进程环境读取，不写配置文件，也不出现在命令行或日志中。
set -euo pipefail

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

DRY_RUN="${DEPLOY_DRY_RUN:-0}"
ARTIFACT_DIR="${DEPLOY_ARTIFACT_DIR:-}"
BUILD_ID="${DEPLOY_BUILD_ID:-}"
POINTER_DIR=""

fail() {
  echo "ERROR | $*" >&2
  exit 2
}

require() {
  local name="$1"
  [[ -n "${!name:-}" ]] || fail "缺少必需环境变量：$name"
}

show_command() {
  printf 'DRY-RUN |'
  printf ' %q' "$@"
  printf '\n'
}

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    show_command "$@"
  else
    "$@"
  fi
}

run_quiet() {
  if [[ "$DRY_RUN" == "1" ]]; then
    show_command "$@"
  else
    "$@" >/dev/null
  fi
}

read_manifest_field() {
  node -e '
    const fs = require("node:fs");
    const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))[process.argv[2]];
    if (typeof value !== "string") process.exit(2);
    process.stdout.write(value);
  ' "$1" "$2"
}

validate_build_id() {
  [[ "$1" =~ ^[0-9a-f]{12}$ ]] || fail "无效构建 ID：期望 12 位小写十六进制。"
}

validate_manifest() {
  local manifest="$1"
  local expected="$2"
  [[ -f "$manifest" ]] || fail "缺少构建清单：$manifest"
  node -e 'const m=require(process.argv[1]); if(m.distribution!=="production" || m.pendingAssetReviews!==0)process.exit(1)' "$manifest" || fail "内部试玩制品、素材待审制品或缺少正式审核信息的制品不能发布。"
  local actual path
  actual="$(read_manifest_field "$manifest" buildId)" || fail "无法读取 $manifest 的 buildId。"
  path="$(read_manifest_field "$manifest" releasePath)" || fail "无法读取 $manifest 的 releasePath。"
  [[ "$actual" == "$expected" ]] || fail "构建清单指向 $actual，目标却是 $expected。"
  [[ "$path" == "releases/$expected/" ]] || fail "构建清单 releasePath 未指向 releases/$expected/。"
}

validate_artifact() {
  local artifact="$1"
  local expected="${2:-}"
  [[ -d "$artifact" ]] || fail "制品目录不存在：$artifact"
  [[ -f "$artifact/build-info.json" ]] || fail "制品缺少 build-info.json：$artifact"

  local actual release_dir release_info
  actual="$(read_manifest_field "$artifact/build-info.json" buildId)" || fail "无法读取制品 buildId。"
  validate_build_id "$actual"
  if [[ -n "$expected" && "$actual" != "$expected" ]]; then
    fail "制品 buildId 为 $actual，与指定目标 $expected 不一致。"
  fi
  release_dir="$artifact/releases/$actual"
  release_info="$release_dir/build-info.json"
  [[ -d "$release_dir" ]] || fail "制品缺少版本目录：$release_dir"
  [[ -f "$release_dir/index.html" ]] || fail "制品缺少版本入口：$release_dir/index.html"
  validate_manifest "$artifact/build-info.json" "$actual"
  validate_manifest "$release_info" "$actual"
  cmp -s "$artifact/build-info.json" "$release_info" \
    || fail "根构建清单与版本目录内清单不一致。"
  node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    const manifest = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const release = path.resolve(process.argv[2]);
    if (!Array.isArray(manifest.files) || manifest.files.length === 0) process.exit(2);
    for (const relative of manifest.files) {
      if (typeof relative !== "string") process.exit(2);
      const target = path.resolve(release, relative);
      if (!target.startsWith(release + path.sep) || !fs.statSync(target).isFile()) process.exit(2);
    }
  ' "$release_info" "$release_dir" || fail "版本清单含缺失或越界文件。"
  if [[ -f "$artifact/index.html" ]] && ! grep -Fq "./releases/$actual/" "$artifact/index.html"; then
    fail "制品自带根 index.html 未指向 releases/$actual/。"
  fi
  printf '%s' "$actual"
}

make_pointer_files() {
  local build_id="$1"
  local release_info="$2"
  validate_manifest "$release_info" "$build_id"
  cp "$release_info" "$POINTER_DIR/build-info.json"
  node - "$release_info" "$build_id" "$POINTER_DIR/index.html" <<'NODE'
    const fs = require('node:fs');
    const [manifestPath, buildId, outputPath] = process.argv.slice(2);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.buildId !== buildId || manifest.releasePath !== `releases/${buildId}/`) process.exit(2);
    const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const title = '冲鸭！金陵！· 南京城市跑酷';
    const description = '南京城市主题跑酷 H5:逃出鸭店的白胖鸭,跑遍金陵十景,收集 40 件风物图鉴。';
    const basePath = manifest.publicBasePath || '';
    const deployedSite = process.env.DEPLOY_CDN_DOMAIN ? `https://${process.env.DEPLOY_CDN_DOMAIN}` : manifest.publicSiteUrl;
    const publicRoot = deployedSite ? `${String(deployedSite).replace(/\/+$/, '')}${basePath}/` : '';
    const icon = manifest.assets?.['assets/icons/duck-512.png'];
    const publicImage = publicRoot && icon ? `${publicRoot}${manifest.releasePath}${icon}` : '';
    const social = [
      '<meta property="og:type" content="website">',
      `<meta property="og:title" content="${escape(title)}">`,
      `<meta property="og:description" content="${escape(description)}">`,
      ...(publicRoot ? [`<meta property="og:url" content="${escape(publicRoot)}">`] : []),
      ...(publicImage ? [`<meta property="og:image" content="${escape(publicImage)}">`] : []),
    ].join('\n');
    fs.writeFileSync(outputPath, [
      '<!doctype html>', '<html lang="zh-CN"><head>', '<meta charset="utf-8">',
      `<title>${title}</title>`, social, '</head><body>', '<p>正在打开游戏……</p>',
      `<script>location.replace('./${manifest.releasePath}'+location.search+location.hash)</script>`,
      `<noscript><a href="./${manifest.releasePath}">打开游戏</a></noscript>`, '</body></html>', '',
    ].join('\n'));
NODE
  validate_manifest "$POINTER_DIR/build-info.json" "$build_id"
  grep -Fq "./releases/$build_id/" "$POINTER_DIR/index.html" \
    || fail "生成的根 index.html 未指向 releases/$build_id/。"
}

make_dry_run_manifest() {
  local build_id="$1"
  cat >"$POINTER_DIR/dry-run-release-build-info.json" <<EOF
{"schema":2,"buildId":"$build_id","releasePath":"releases/$build_id/","distribution":"production","pendingAssetReviews":0,"dryRunPlaceholder":true}
EOF
  printf '%s' "$POINTER_DIR/dry-run-release-build-info.json"
}

verify_remote_pointer() {
  local build_id="$1"
  local remote_info="$POINTER_DIR/remote-root-build-info.json"
  local remote_index="$POINTER_DIR/remote-root-index.html"
  run_quiet ossutil cp -f "$TARGET/build-info.json" "$remote_info"
  run_quiet ossutil cp -f "$TARGET/index.html" "$remote_index"
  if [[ "$DRY_RUN" != "1" ]]; then
    validate_manifest "$remote_info" "$build_id"
    grep -Fq "./releases/$build_id/" "$remote_index" \
      || fail "OSS 根 index.html 未指向 releases/$build_id/。"
  fi
}

[[ "$DRY_RUN" == "0" || "$DRY_RUN" == "1" ]] || fail "DEPLOY_DRY_RUN 只能是 0 或 1。"
command -v node >/dev/null 2>&1 || fail "未找到 Node.js，无法验证构建清单。"
require DEPLOY_OSS_ENDPOINT
require DEPLOY_OSS_BUCKET
[[ "$DEPLOY_OSS_ENDPOINT" =~ ^[A-Za-z0-9.-]+$ ]] || fail "DEPLOY_OSS_ENDPOINT 格式无效。"
[[ "$DEPLOY_OSS_BUCKET" =~ ^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$ ]] || fail "DEPLOY_OSS_BUCKET 格式无效。"
if [[ -n "${DEPLOY_CDN_DOMAIN:-}" ]]; then
  [[ "$DEPLOY_CDN_DOMAIN" =~ ^[A-Za-z0-9.-]+$ ]] || fail "DEPLOY_CDN_DOMAIN 格式无效。"
  require ALIYUN_REGION_ID
  [[ "$ALIYUN_REGION_ID" =~ ^[A-Za-z0-9-]+$ ]] || fail "ALIYUN_REGION_ID 格式无效。"
fi

if [[ "$DRY_RUN" == "1" && -z "$ARTIFACT_DIR" && -z "$BUILD_ID" ]]; then
  fail "dry-run 不执行冷构建；请指定 DEPLOY_ARTIFACT_DIR 或 DEPLOY_BUILD_ID。"
fi

if [[ "$DRY_RUN" != "1" ]]; then
  require ALIYUN_ACCESS_KEY_ID
  require ALIYUN_ACCESS_KEY_SECRET
  command -v ossutil >/dev/null 2>&1 || fail "未找到 ossutil；按 docs/deployment/runbook.md 安装 ossutil 1.6.16+。"
  if [[ -n "${DEPLOY_CDN_DOMAIN:-}" ]]; then
    command -v aliyun >/dev/null 2>&1 || fail "已设置 DEPLOY_CDN_DOMAIN 但未找到 aliyun CLI。"
  fi
fi

export OSS_ENDPOINT="$DEPLOY_OSS_ENDPOINT"
# ossutil 官方支持从环境变量取凭证。不要使用 -i/-k，避免密钥进入进程列表或日志。
# dry-run 不读取或映射凭证，即使调用环境意外注入了这些变量。
if [[ "$DRY_RUN" != "1" ]]; then
  export OSS_ACCESS_KEY_ID="$ALIYUN_ACCESS_KEY_ID"
  export OSS_ACCESS_KEY_SECRET="$ALIYUN_ACCESS_KEY_SECRET"
  export ALIBABA_CLOUD_ACCESS_KEY_ID="$ALIYUN_ACCESS_KEY_ID"
  export ALIBABA_CLOUD_ACCESS_KEY_SECRET="$ALIYUN_ACCESS_KEY_SECRET"
  if [[ -n "${ALIYUN_SECURITY_TOKEN:-}" ]]; then
    export OSS_SESSION_TOKEN="$ALIYUN_SECURITY_TOKEN"
    export ALIBABA_CLOUD_SECURITY_TOKEN="$ALIYUN_SECURITY_TOKEN"
  fi
fi

TARGET="oss://${DEPLOY_OSS_BUCKET}"
POINTER_DIR="$(mktemp -d)"
trap 'rm -rf -- "$POINTER_DIR"' EXIT

MODE="release"
RELEASE_DIR=""
RELEASE_INFO=""

if [[ -n "$BUILD_ID" ]]; then
  MODE="rollback"
  validate_build_id "$BUILD_ID"
  LOCAL_RELEASE_INFO=""
  if [[ -n "$ARTIFACT_DIR" ]]; then
    ARTIFACT_DIR="$(CDPATH= cd -- "$ARTIFACT_DIR" && pwd)"
    validate_artifact "$ARTIFACT_DIR" "$BUILD_ID" >/dev/null
    LOCAL_RELEASE_INFO="$ARTIFACT_DIR/releases/$BUILD_ID/build-info.json"
  fi
  if [[ "$DRY_RUN" == "1" ]]; then
    if [[ -n "$LOCAL_RELEASE_INFO" ]]; then
      RELEASE_INFO="$LOCAL_RELEASE_INFO"
    else
      RELEASE_INFO="$(make_dry_run_manifest "$BUILD_ID")"
    fi
  else
    # 回滚只切换到已经存在的不可变版本；先从 OSS 读回目标清单并验证。
    run_quiet ossutil stat "$TARGET/releases/$BUILD_ID/index.html"
    RELEASE_INFO="$POINTER_DIR/rollback-release-build-info.json"
    run_quiet ossutil cp -f "$TARGET/releases/$BUILD_ID/build-info.json" "$RELEASE_INFO"
    validate_manifest "$RELEASE_INFO" "$BUILD_ID"
    if [[ -n "$LOCAL_RELEASE_INFO" ]]; then
      cmp -s "$LOCAL_RELEASE_INFO" "$RELEASE_INFO" \
        || fail "本地回滚制品与 OSS 上目标版本清单不一致。"
    fi
  fi
  validate_manifest "$RELEASE_INFO" "$BUILD_ID"
else
  if [[ -n "$ARTIFACT_DIR" ]]; then
    # 推荐路径：消费从已通过门禁的 CI run 下载并解压出的 dist 制品。
    ARTIFACT_DIR="$(CDPATH= cd -- "$ARTIFACT_DIR" && pwd)"
    BUILD_ID="$(validate_artifact "$ARTIFACT_DIR")"
  else
    # 冷环境兜底：明确安装两套锁定依赖和 Chromium，再生成并验证制品。
    command -v npm >/dev/null 2>&1 || fail "未找到 npm，无法从源码构建。"
    npm ci
    npm ci --prefix tools/e2e
    node tools/e2e/node_modules/playwright-core/cli.js install --with-deps chromium webkit
    npm run verify
    npm run test:release:production
    SOAK_DURATION_MS=1200000 npm run test:release:soak
    ARTIFACT_DIR="$ROOT/dist"
    BUILD_ID="$(validate_artifact "$ARTIFACT_DIR")"
  fi
  RELEASE_DIR="$ARTIFACT_DIR/releases/$BUILD_ID"
  RELEASE_INFO="$RELEASE_DIR/build-info.json"
fi

make_pointer_files "$BUILD_ID" "$RELEASE_INFO"

if [[ "$MODE" == "release" ]]; then
  # --meta 的格式是 header:value；Cache-Control 内部指令必须以逗号分隔。
  run ossutil cp -r -f "$RELEASE_DIR/" "$TARGET/releases/$BUILD_ID/" \
    --meta 'Cache-Control:max-age=31536000, immutable' \
    --acl public-read --disable-ignore-error
  # 上传命令成功后仍读回版本清单，确认不会把根入口切到错误 ID。
  run_quiet ossutil stat "$TARGET/releases/$BUILD_ID/index.html"
  run_quiet ossutil cp -f "$TARGET/releases/$BUILD_ID/build-info.json" "$POINTER_DIR/remote-release-build-info.json"
  if [[ "$DRY_RUN" != "1" ]]; then
    validate_manifest "$POINTER_DIR/remote-release-build-info.json" "$BUILD_ID"
  fi
fi

# build-info 先更新、index 最后切换；两者都由目标版本清单重新生成，不复用陈旧根文件。
run ossutil cp -f "$POINTER_DIR/build-info.json" "$TARGET/build-info.json" \
  --meta 'Cache-Control:no-cache, no-store, must-revalidate' \
  --acl public-read
run ossutil cp -f "$POINTER_DIR/index.html" "$TARGET/index.html" \
  --meta 'Cache-Control:no-cache, no-store, must-revalidate' \
  --acl public-read

verify_remote_pointer "$BUILD_ID"

if [[ -n "${DEPLOY_CDN_DOMAIN:-}" ]]; then
  # 只刷新可变入口；凭证仍通过环境变量注入，不出现在参数或输出中。
  if [[ "$DRY_RUN" == "1" ]]; then
    show_command aliyun cdn RefreshObjectCaches --region "$ALIYUN_REGION_ID" \
      --ObjectPath "https://${DEPLOY_CDN_DOMAIN}/index.html<NEWLINE>https://${DEPLOY_CDN_DOMAIN}/build-info.json" \
      --ObjectType File
  else
    aliyun cdn RefreshObjectCaches --region "$ALIYUN_REGION_ID" \
      --ObjectPath $'https://'"${DEPLOY_CDN_DOMAIN}"$'/index.html\nhttps://'"${DEPLOY_CDN_DOMAIN}"$'/build-info.json' \
      --ObjectType File >/dev/null
  fi
fi

if [[ "$DRY_RUN" == "1" ]]; then
  echo "DRY-RUN | 合同检查通过；未访问 OSS/CDN，也未使用凭证。目标构建：$BUILD_ID（$MODE）。"
else
  echo "发布完成：OSS 根入口与 build-info.json 均已读回确认指向构建 $BUILD_ID（$MODE）。"
fi
if [[ -n "${DEPLOY_CDN_DOMAIN:-}" ]]; then
  echo "访问地址：https://${DEPLOY_CDN_DOMAIN}/"
else
  echo '未设置 DEPLOY_CDN_DOMAIN：请使用已绑定 HTTPS 的自定义域名进行验证。'
fi
