# DuckDuckRun 审查证据索引

> 本索引将每条审查结论连接到可复核的源文件行号、命令输出或截图。截图和原始运行日志因本阶段“仅文档入库”的边界保留在审查会话工件目录；它们的 SHA-256、生成时间和复现命令均在此列出，便于后续阶段重新生成，而不是把二进制文件混入源码提交。

## 证据台账

| ID | 事实或问题 | 类型 | 可复核位置 | 生成方式与关键结果 | 对应问题 |
|---|---|---|---|---|---|
| E-01 | 本地质量门禁 | 命令日志 | 会话工件：`/home/ubuntu/duckduckrun-audit-artifacts/quality-gates.log` | 逐项运行 `npm run build/typecheck/lint`、四个子测试、`test:browser`、`npm test`。build/typecheck/lint 未定义；语法/逻辑/存档/资源通过；浏览器测试和总测试失败。 | A-01、A-03、A-07 |
| E-02 | 远端 CI 阻断 | GitHub Actions 日志 | `gh run view 32105509532 --repo mckf111/DuckDuckRun`；工作流 `/.github/workflows/test.yml:23–29` | 最近失败工作流在 `browser_test.mjs:118` 同一 `bg_jiming.webp` 断言失败；`preview` 依赖 test，见 `test.yml:31–33`。 | A-01、A-02 |
| E-03 | 跨端浏览器探针 | JSON + 截图 | 会话工件：`/home/ubuntu/duckduckrun-audit-artifacts/probe-results.json`；截图目录同级 | 外部只读 Playwright 探针；实测 1440×900、844×390@DPR2、390×844@DPR2 与 GitHub Pages。记录 console、请求失败、4xx/5xx、帧间隔、长任务、资源主机和 AudioContext。 | A-02、A-04、A-05、A-09 |
| E-04 | 十次失败→重开浸泡 | JSON 日志 | 会话工件：`/home/ubuntu/duckduckrun-audit-artifacts/restart-soak-results.json` | 844×390@DPR2；每轮用真实键盘 `Enter` 重开，10/10 完成，console/page error/request failure 均为空。CDP 未返回堆度量，故不作“无泄漏”断言。 | A-04、A-09 |
| E-05 | 线上/当前版本漂移 | 命令输出 + Git 对象 | 会话工件：`/home/ubuntu/online_game.js`；`git hash-object` 为 `4d8e65ef6678e1120108b8adb36de86a9ca9e026` | `git log --all --find-object` 将线上 `game.js` 对应到 `8556263/74d0e3a`；当前为 `b90462e`，文件长度 26,838 B vs 29,724 B。 | A-02 |
| E-06 | 缓存策略 | HTTP 响应头 | `curl -fsSI` 对线上 HTML、`src/game.js`、字体执行 | 三者稳定路径均为 `Cache-Control: max-age=600` + ETag；无内容哈希路径。 | A-06 |
| E-07 | 微信与真机覆盖缺口 | 验收矩阵 | [`../qa/device-and-browser-matrix.md`](../qa/device-and-browser-matrix.md) | 本轮只使用桌面自动化浏览器和模拟视口；未将模拟视口误记为 WeChat/iOS/Android 真机。 | A-04、A-09 |
| E-08 | 运行中哈希深链行为 | 真实浏览器操作 | 浏览器操作记录；代码 [`src/main.js:92–93`](../../src/main.js#L92-L93) | 已运行教程实例中导航到 `/#play`，URL 改变但仍是原 adventure 实例；强制冷启动后 `#play` 才进入 endless。 | A-10 |
| E-09 | 许可与素材声明 | 源码/文档 | [`assets/img/CREDITS.md:3–33`](../../assets/img/CREDITS.md#L3-L33)、[`src/legal.js:17–66`](../../src/legal.js#L17-L66)、[`LICENSE.md:1–2`](../../LICENSE.md#L1-L2) | 图片逐项列出作者与 CC 许可；游戏内声明保留游戏本体权利，并承认部分条目为工艺示意。 | A-08 |
| E-10 | 访问性与横竖屏约束 | 宿主 HTML + 截图 | [`index.html:5`](../../index.html#L5)、[`index.html:27–31`](../../index.html#L27-L31)、[`index.html:54–55`](../../index.html#L54-L55) | 禁止页面缩放；核心交互为单一 Canvas；触屏竖屏使用全屏旋转覆盖层。 | A-05 |

## 截图清单

| 工件文件 | 视口/场景 | 视觉结论 | 关联 |
|---|---|---|---|
| `desktop-menu.png` | 1440×900，菜单 | 菜单层级、白鸭/IP 与南京背景完整 | 评分：视觉完成度 |
| `desktop-levels.png` | 1440×900，选关 | 关卡与锁定反馈可达 | 核心路径 |
| `desktop-tutorial.png` | 1440×900，教学 1/4 | 操作提示、障碍类型、HUD 同屏可读 | A-04、A-05 |
| `desktop-over.png` | 1440×900，首次自然失败 | 死因、成绩、主重开 CTA 明显 | 核心路径 |
| `mobile_landscape_844x390.png` | 844×390，DPR 2，触摸菜单 | 主按钮可读，辅助文字较小 | A-05 |
| `mobile_portrait_390x844.png` | 390×844，DPR 2，竖屏 | 旋转遮罩有效，游戏内容被正确阻断 | A-05 |
| `online-menu.png` | GitHub Pages，1440×900 | 线上仍显示“金陵快跑”旧标题，与本地基线不同 | A-02 |

## 可复现命令

```bash
# 静态服务（不改变仓库）
cd /home/ubuntu/DuckDuckRun
python3 -m http.server 8000

# 现有质量门禁（不升级依赖）
npm ci --prefix tools/e2e
npm run test:syntax
npm run test:logic
npm run test:save
npm run test:resources
npm run test:browser
npm test

# 线上版本对象比对
curl -fsSL https://mckf111.github.io/DuckDuckRun/src/game.js -o /tmp/online_game.js
git hash-object /tmp/online_game.js
git log --all --find-object="$(git hash-object /tmp/online_game.js)"
```

会话探针本身不属于仓库交付物，也不触及游戏源码。下一阶段应将其中可维护的关键断言转为仓库内测试，但只有在先决定真实产品契约后才能提交。
