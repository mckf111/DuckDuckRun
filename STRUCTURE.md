# DuckDuckRun 仓库结构与责任边界

> 本文记录审查时的代码基线结构，不改变模块责任。目标是让后续修复在已有边界内完成，而不是为了“整齐”重排可运行模块。

| 路径 | 责任 | 审查判断 |
|---|---|---|
| `index.html` | 静态宿主、Canvas、字体、旋转/分享 DOM 容器、ESM 入口 | 轻量但可访问性与缩放策略需后续硬化 [1] |
| `src/main.js` | 应用初始化、主循环、resize、路由式深链启动 | 生命周期核心；需在未来决定是否支持 `hashchange` [2] |
| `src/core.js` | 数学、随机、投影、DPR/画质等级 | 性能与可重放随机局的关键边界 |
| `src/game.js` | 状态机、生成、教程、碰撞、结算、重开 | 保留；不建议重写，需给随机局加复现元数据 |
| `src/rules.js` | 纯玩法规则、星级、解锁判断 | 可单元测试的良好边界 |
| `src/input.js` | 键盘、Pointer/touch、窗口失焦与可见性暂停 | WebView/老少适配的首要验证点 |
| `src/render.js` 与 `src/art/` | Canvas 场景与精灵绘制、照片预取 | 性能和照片预取契约的关键边界 |
| `src/audio.js` | Web Audio 合成、懒创建、暂停与 BGM | 自动播放兼容、后台恢复的关键边界 |
| `src/save.js` | 本地存档、迁移和节流写入 | 已有存档测试；未来变更须保持迁移兼容 |
| `src/share.js`、`src/qr.js` | 分享、复制链接、二维码 | 需在微信/iOS 真机验收 |
| `src/legal.js`、`assets/img/CREDITS.md` | 游戏内许可、照片署名与素材说明 | 需补不可变 SBOM，不应删除现有声明 |
| `tests/` | 规则、节奏、存档、内容回归 | 大部分通过；浏览器覆盖是当前 P1 |
| `tools/e2e/` | 语法检查、Playwright 依赖与浏览器回归 | 浏览器测试失败位置在 `browser_test.mjs:118` [3] |
| `.github/workflows/test.yml` | CI 与 Pages 静态制品复制 | 仅监听指定分支，当前线上制品漂移 [4] |
| `docs/review/` | 审查报告、评分与证据索引 | 本阶段新建；默认被 `.gitignore` 忽略，提交时必须显式加入 |
| `docs/architecture/` | 架构决策记录 | ADR-001 固定“保留并修复” |
| `docs/qa/` | 设备/浏览器矩阵与发布门槛 | 区分模拟与真机，不得混写 |

## 依赖流

```text
index.html
  └─ src/main.js
      ├─ core / game / input / render / audio / ui
      ├─ config / rules / save / track
      ├─ art/*（精灵、场景、障碍、物品、照片）
      └─ share / qr / legal

package.json
  └─ tests/* + tools/e2e/*
      └─ .github/workflows/test.yml
          └─ GitHub Pages _site（index.html + src + assets）
```

该项目没有构建器或运行时框架；`package.json` 只定义测试脚本，根目录也没有 npm/pnpm/yarn 锁文件 [5]。这降低了维护成本，却要求发布流程对静态文件版本、缓存和测试工具版本更加明确。后续若要加工具，只能服务于已定义的质量需求，不能改变 Canvas/ESM 的默认架构。

## 文档承接规则

审查文档中的问题编号（A-01 至 A-11）是后续变更的唯一风险主键。每个代码、测试、工作流或资产修改的提交说明都应列出它关闭或验证的编号，并更新 `MEMORY.md`。截图/原始日志不随本阶段提交；其位置和重现命令由 `docs/review/evidence-index.md` 管理。

## 参考资料

[1]: index.html "Canvas 宿主、禁止缩放与旋转层"
[2]: src/main.js "初始化与深链入口"
[3]: tools/e2e/browser_test.mjs "浏览器回归测试"
[4]: .github/workflows/test.yml "CI 和 Pages 预览"
[5]: package.json "项目脚本"
