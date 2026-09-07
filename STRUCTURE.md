# DuckDuckRun 仓库结构与责任边界

> 本文记录 2026-09-02 remediation 后的现役结构边界。目标是让后续修复在已有模块责任内完成，而不是为了“整齐”重排可运行模块。

| 路径 | 责任 | 现役判断 |
|---|---|---|
| `index.html` | 静态宿主、Canvas、字体、旋转/分享 DOM 容器、ESM 入口和构建 ID 占位符 | 保持轻量；构建时注入版本标识，缩放/语义替代仍需后续可访问性工作 [1] |
| `src/main.js` | 应用初始化、唯一帧循环、resize/方向、深链启动与 `disposeApp()` | 生命周期唯一入口；重复启动拒绝，销毁时取消循环/预取并释放输入和音频 [2] |
| `src/core.js` | 数学、可复放玩法随机流、投影、DPR/画质等级 | 性能与可重放随机局的关键边界；视觉随机不得污染玩法随机流 |
| `src/config.js` | 十关、南京切片节奏/路线/难度、风物与数值的唯一数据源 | 第4阶段的 `NANJING_SLICE` 统一维护六段节奏、三条有限路线、演示输入和两档参数；不在状态机/UI 内分散城市条件判断。 |
| `src/game.js` | 状态机、生成、教程、碰撞、结算、重开和隐藏风物安全路线 | 保留；固定 seed 重开重置玩法随机流，南京切片从配置读取路线并记录节奏经过点。 |
| `src/rules.js` | 纯玩法规则、星级、解锁判断 | 可单元测试的良好边界 |
| `src/input.js` | 可创建/销毁的键盘、Pointer/touch、窗口失焦与可见性暂停控制器 | 唯一输入语义；监听器由控制器成对注册与释放 |
| `src/render.js` 与 `src/art/` | Canvas 场景与精灵绘制、照片加载/预取 | 保留视觉边界；背景预取可取消，加载失败继续使用代码绘制降级背景；减弱动态时静止非必要水波、漂浮和粒子。 |
| `src/save.js` / `src/rules.js` | 本地存档、迁移、节流写入与纯玩法规则 | `motion` 设置规范化为 system/reduced/full；用户选择优先于 `prefers-reduced-motion`。 |
| `src/audio.js` | Web Audio 合成、用户手势解锁、暂停、BGM 与完整销毁 | 状态机不得隐式创建 `AudioContext`；销毁时停止定时器并关闭上下文 |
| `src/save.js` | 本地存档、迁移和节流写入 | 已有存档测试；后续变更须保持迁移兼容 |
| `src/share.js`、`src/qr.js` | 分享、复制链接、二维码 | 仍需在微信/iOS 真机验收 |
| `src/legal.js`、`assets/img/CREDITS.md` | 游戏内许可、照片署名与素材说明 | 保持玩家可见署名；`docs/qa/asset-sbom.json` 补本地哈希映射，不替代许可审查 |
| `tests/` | 规则、节奏、存档、内容、分享、素材与部署合同回归 | `runtime.test.js` 锁定固定 seed/视觉随机隔离；`share-release`、`asset-registry`、`deploy-script` 锁定传播、许可和 dry-run 边界 |
| `tools/e2e/` | 语法、Playwright 浏览器回归、切片平衡审计、制品 404 与体积预算检查 | `audit_slice_playability.mjs` 以固定 seed 覆盖路线、公平性、10 分钟连续和20分钟浸泡；浏览器工具仍使用锁定依赖。[3] |
| `tools/build_static.mjs` | 无运行时依赖的静态构建、版本化发布目录与构建清单 | 规范化文本换行，注入公开根配置，附三份 legal notice；同一 build ID 字节确定，输出 `dist/releases/<build-id>/` |
| `tools/generate_asset_sbom.mjs` | 从受管磁盘集合反查并生成机器可读素材台账 | 当前 47/47 唯一登记；不推测历史下载/处理信息，已知缺口保留给许可复核 |
| `.github/workflows/test.yml` | CI 质量门禁与不可变制品工件 | PR、`main`、remediation 分支和 tag 运行完整 release，工件/证据保留 90 天；20 分钟 soak 手动或周计划独立运行；不部署生产环境 |
| `docs/review/` | 审查报告、评分与证据索引 | 默认被 `.gitignore` 忽略，提交时必须显式加入 |
| `docs/architecture/` | 架构决策记录 | ADR-001 固定“保留并修复” |
| `docs/qa/` | 设备/浏览器矩阵、工程加固、可玩性报告与机器可读证据 | `playability-report.md`、`evidence/slice-playability.json` 必须区分固定 seed 模拟、自动化视口、视觉抽检与真人/真机结果；默认被 `.gitignore` 忽略，提交时必须显式加入。 |

## 依赖流

```text
index.html
  └─ src/main.js
      ├─ core / game / input / render / audio / ui
      ├─ config / rules / save / track
      ├─ art/*（精灵、场景、障碍、物品、照片）
      └─ share / qr / legal

package.json + package-lock.json
  └─ tests/* + tools/e2e/* + tools/build_static.mjs
      └─ .github/workflows/test.yml
          ├─ npm run verify + npm run test:release
          │   └─ dist/releases/<build-id>/ + build-info.json（不可变 CI 工件）
          └─ npm run test:release:soak（独立 20 分钟门禁）
```

该项目没有打包器或运行时框架；`package.json` 锁定 `npm@10.9.2`，根 `package-lock.json` 仅锁定零依赖项目本身，浏览器测试依赖在 `tools/e2e/package-lock.json` 锁定 [4]。`npm run build` 是零依赖静态复制/版本化过程，不改变 Canvas/ESM 运行架构。`npm run test:playability` 是同一门禁中的确定性状态机审计，不引入运行时依赖。后续工具只能服务于已定义的质量需求，不能改变该默认架构。

## 文档承接规则

审查文档中的问题编号（A-01 至 A-11）继续作为历史风险主键；现役状态以 `MANUS_CONTEXT.md` 和当前 `docs/qa/release-candidate-report.md` 为准。同步现役项目文档即可；项目或 Codex 记忆只有在用户明确授权时才能更新，不能作为普通提交的强制步骤。机器证据只在显式生成时写入 `docs/qa/evidence/`，日常测试默认写系统临时目录。

## 参考资料

[1]: index.html "Canvas 宿主、版本标识与旋转层"
[2]: src/main.js "初始化、释放与固定 seed 入口"
[3]: tools/e2e/browser_test.mjs "浏览器回归测试"
[4]: package.json "项目脚本与包管理器锁定"
