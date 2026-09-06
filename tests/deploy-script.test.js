import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = join(root, 'scripts', 'deploy_aliyun_oss.sh');
const source = readFileSync(scriptPath, 'utf8');
const buildId = 'abcdef123456';

function makeArtifact(){
  const artifact = mkdtempSync(join(tmpdir(), 'duckduckrun-deploy-artifact-'));
  const release = join(artifact, 'releases', buildId);
  mkdirSync(release, { recursive:true });
  const manifest = JSON.stringify({ schema:2, buildId, releasePath:`releases/${buildId}/`, files:['index.html'] }) + '\n';
  writeFileSync(join(artifact, 'build-info.json'), manifest);
  writeFileSync(join(artifact, 'index.html'), `<script>location.replace('./releases/${buildId}/')</script>`);
  writeFileSync(join(release, 'build-info.json'), manifest);
  writeFileSync(join(release, 'index.html'), '<!doctype html><title>release</title>');
  return artifact;
}

function availableBash(){
  if(process.platform === 'win32'){
    const candidates = [
      'C:\\Program Files\\Git\\bin\\bash.exe',
      'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
    ];
    return candidates.find(existsSync) || null;
  }
  const probe = spawnSync('bash', ['--version'], { encoding:'utf8' });
  return probe.status === 0 ? 'bash' : null;
}

const bash = availableBash();

test('内部试玩包在构造上传命令前被拒绝', {skip:!bash},()=>{
  const artifact=makeArtifact();
  try{
    for(const path of [join(artifact,'build-info.json'),join(artifact,'releases',buildId,'build-info.json')]){
      const manifest=JSON.parse(readFileSync(path,'utf8'));manifest.distribution='internal-preview';manifest.pendingAssetReviews=55;writeFileSync(path,JSON.stringify(manifest));
    }
    const run=spawnSync(bash,[scriptPath],{cwd:root,encoding:'utf8',env:{...process.env,DEPLOY_DRY_RUN:'1',DEPLOY_ARTIFACT_DIR:artifact,DEPLOY_OSS_ENDPOINT:'oss-cn-shanghai.aliyuncs.com',DEPLOY_OSS_BUCKET:'duckduckrun-test'}});
    assert.notEqual(run.status,0);assert.match(run.stderr,/内部试玩制品/);assert.doesNotMatch(run.stdout,/ossutil cp/);
  }finally{rmSync(artifact,{recursive:true,force:true});}
});

test('部署合同使用官方 OSS 元数据格式且不把密钥放进参数', () => {
  assert.match(source, /Cache-Control:max-age=31536000, immutable/);
  assert.match(source, /Cache-Control:no-cache, no-store, must-revalidate/);
  assert.doesNotMatch(source, /Cache-Control:max-age=31536000:immutable/);
  assert.doesNotMatch(source, /Cache-Control:no-cache:no-store:must-revalidate/);
  assert.doesNotMatch(source, /(?:^|\s)-(?:i|k)\s+["']?\$ALIYUN_/m);
  assert.match(source, /OSS_ACCESS_KEY_ID/);
  assert.match(source, /OSS_ACCESS_KEY_SECRET/);
});

test('冷构建安装根依赖、e2e 依赖和 Chromium', () => {
  const rootInstall = source.indexOf('npm ci\n');
  const e2eInstall = source.indexOf('npm ci --prefix tools/e2e');
  const browserInstall = source.indexOf('playwright-core/cli.js install --with-deps chromium');
  const verify = source.indexOf('npm run verify');
  assert.ok(rootInstall >= 0 && rootInstall < e2eInstall);
  assert.ok(e2eInstall < browserInstall && browserInstall < verify);
});

test('发布和回滚都重新生成并读回核验根指针', () => {
  assert.match(source, /make_pointer_files "\$BUILD_ID" "\$RELEASE_INFO"/);
  assert.match(source, /verify_remote_pointer "\$BUILD_ID"/);
  assert.match(source, /ossutil stat "\$TARGET\/releases\/\$BUILD_ID\/index\.html"/);
  assert.match(source, /og:title/);
  assert.match(source, /og:image/);
  assert.match(source, /DEPLOY_CDN_DOMAIN/);
  assert.doesNotMatch(source, /cp -f "dist\/build-info\.json"/);
  assert.doesNotMatch(source, /cp -f "dist\/index\.html"/);
});

test('dry-run 构造完整发布命令且不泄露密钥', { skip:!bash }, () => {
  const artifact = makeArtifact();
  try{
    const output = execFileSync(bash, [scriptPath], {
      cwd:root,
      encoding:'utf8',
      env:{
        ...process.env,
        DEPLOY_DRY_RUN:'1',
        DEPLOY_ARTIFACT_DIR:artifact,
        DEPLOY_OSS_ENDPOINT:'oss-cn-shanghai.aliyuncs.com',
        DEPLOY_OSS_BUCKET:'duckduckrun-test',
        DEPLOY_CDN_DOMAIN:'run.example.com',
        ALIYUN_REGION_ID:'cn-shanghai',
        ALIYUN_ACCESS_KEY_ID:'must-not-appear-id',
        ALIYUN_ACCESS_KEY_SECRET:'must-not-appear-secret',
      },
    });
    assert.match(output, new RegExp(`releases/${buildId}/`));
    assert.match(output, /Cache-Control:max-age=31536000/);
    assert.match(output, /Cache-Control:no-cache/);
    assert.match(output, /RefreshObjectCaches/);
    assert.match(output, /合同检查通过/);
    assert.doesNotMatch(output, /must-not-appear/);
  } finally {
    rmSync(artifact, { recursive:true, force:true });
  }
});

test('dry-run 回滚只切换根指针，不重传版本目录', { skip:!bash }, () => {
  const output = execFileSync(bash, [scriptPath], {
    cwd:root,
    encoding:'utf8',
    env:{
      ...process.env,
      DEPLOY_DRY_RUN:'1',
      DEPLOY_BUILD_ID:buildId,
      DEPLOY_OSS_ENDPOINT:'oss-cn-shanghai.aliyuncs.com',
      DEPLOY_OSS_BUCKET:'duckduckrun-test',
    },
  });
  assert.match(output, new RegExp(`目标构建：${buildId}（rollback）`));
  assert.match(output, /build-info\.json/);
  assert.match(output, /index\.html/);
  assert.doesNotMatch(output, /cp -r/);
});

test('dry-run 在根入口与清单 build ID 不一致时拒绝发布', { skip:!bash }, () => {
  const artifact = makeArtifact();
  try{
    writeFileSync(join(artifact, 'index.html'), "<script>location.replace('./releases/000000000000/')</script>");
    const result = spawnSync(bash, [scriptPath], {
      cwd:root,
      encoding:'utf8',
      env:{
        ...process.env,
        DEPLOY_DRY_RUN:'1',
        DEPLOY_ARTIFACT_DIR:artifact,
        DEPLOY_OSS_ENDPOINT:'oss-cn-shanghai.aliyuncs.com',
        DEPLOY_OSS_BUCKET:'duckduckrun-test',
      },
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /根 index\.html 未指向/);
    assert.doesNotMatch(result.stdout, /ossutil cp/);
  } finally {
    rmSync(artifact, { recursive:true, force:true });
  }
});
