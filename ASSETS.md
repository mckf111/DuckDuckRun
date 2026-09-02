# DuckDuckRun 资产与许可台账承接

> **结论：当前可见署名覆盖度较好，但不可变溯源不足。** 本文不判定任何第三方资产侵权；它记录当前已知许可与下一阶段必须补齐的证据。游戏本体按 All Rights Reserved 声明，照片/字体按各自许可使用，二者必须分别管理 [1] [2]。

## 资产清单与当前状态

| 类别 | 已知位置 | 当前权利/来源主张 | 已有证据 | 缺口与风险 |
|---|---|---|---|---|
| 游戏程序、原创美术、角色、UI、文案、关卡、合成音频 | `src/`、`assets/game/` 等 | 作者保留全部权利 | `LICENSE.md`、`src/legal.js` | 缺原始创作/委托/生成记录索引；内部维护足够，商业尽调尚不足 |
| 字体 | `assets/fonts/` | 马善政楷书、霞鹜文楷，SIL OFL 1.1 | `assets/fonts/OFL.txt`、`src/legal.js:17–22` | 应记录源版本、子集工具/时间、文件 SHA-256 |
| 远景照片 | `assets/img/bg_*.webp/.jpg` | Wikimedia Commons/Openverse，CC BY/CC BY-SA | `assets/img/CREDITS.md:5–15` | 缺下载日期、源文件版本/oldid、原文件 SHA-256、裁剪/压缩记录 |
| 风物照片 | `assets/img/it_*.jpg` | 各自 CC、PD 或替代工艺示意 | `assets/img/CREDITS.md:16–33`、`src/legal.js` | 同上；部分非南京本体素材须在玩家界面持续明示 |
| 南京文化文字与事实 | `src/config.js`、`src/ui.js` | 项目原创编辑/描述 | 关卡与图鉴配置 | 缺逐条资料来源、核验日期和版本；应防止“景点导览”式过度承诺 |
| 分享卡与二维码 | `src/share.js`、`src/qr.js` | 运行时生成 | 源码可审计 | 微信/iOS 实机输出、保存和识别率尚未验证 |

## 许可处理原则

CC BY 与 CC BY-SA 的照片不能被“游戏本体保留所有权利”一句话覆盖。现有做法将照片当作远景或图鉴对照，并在游戏内列出照片署名，方向合理；下一阶段应确认每一个裁剪、压缩、颜色调整或组合是否构成需满足的适当署名、许可链接和改动说明。对 CC BY-SA 内容，不宜在未完成权利审查前给出绝对的“整个游戏无需任何额外义务”判断 [2]。

| 资产状态 | 发布动作 |
|---|---|
| 有明确作者、链接、许可且本地文件可映射 | 可保留；补齐不可变证据 |
| “工艺示意/相关实景”且在游戏内明确说明 | 可保留；确保每次 UI 改版仍可见该说明 |
| 来源只有聚合平台名称，缺原始页/许可版本 | 暂停新增使用，补原始来源后再发布 |
| 无可追溯来源或商业授权不清 | 不得用于新的公开制品，替换或取得授权 |

## 下一阶段 SBOM 最小字段

每一行资产必须有唯一 ID、仓库相对路径、类别、用途、是否修改、来源 URL、来源页固定版本/oldid、作者、许可 SPDX/文本、下载日期、本地 SHA-256、处理脚本与输出日期、审核者、审核日期、游戏内署名位置。对原创/委托/生成资产还应记录创作人或合同/提示词与生成平台的内部证据位置。该表应为机器可读 CSV/JSON 加人工可读 Markdown 两份；第 1 阶段未创建该数据文件，以遵守当时“只新增审查与承接文档”的边界。第 2 阶段已按当前可得证据生成 JSON，进展见下一节。

## 第 2 阶段 SBOM 进展

`docs/qa/asset-sbom.json` 已由 `tools/generate_asset_sbom.mjs` 生成，当前覆盖 47 条受管文件：40 个照片文件、2 个精选照片衍生背景、2 个字体文件、3 个切片生成资产。门禁从磁盘真实集合反查，缺失、重复或额外登记均失败。每条记录包含唯一 ID、本地路径、类别/用途、来源 URL、作者、已知许可、本地 SHA-256、玩家可见署名位置、审阅人和日期。该文件用 SHA-256 固定当前交付物，而不是把“Wikimedia/Openverse”笼统描述当作充分尽调。

| 已补字段 | 仍缺字段 | 处理口径 |
|---|---|---|
| 本地路径、文件 SHA-256、来源 URL、作者、许可、用途、游戏内署名位置 | 原始文件固定版本/oldid、历史下载日期、裁剪/压缩记录、来源页快照 | 不追溯不到就填“未记录”；不得编造日期、版本或处理历史 |
| 运行时字体路径、OFL-1.1 依据、SHA-256、子集工具与 2026-09-02 输出记录 | 霞鹜文楷已记录 v1.522；马善政楷书仅记录官方仓库当日快照，仍缺精确 commit | 后续再生必须先固定上游 revision；不得倒填本轮未记录的 commit |
| featured 背景 WebP 与相应 CREDITS 条目映射 | CC BY-SA 适配/组合后的法务结论 | SBOM 是工程证据，不是法律意见；公开发布前独立复核 |

SBOM 是阶段 2 的基础性 A-08 修复。新增资产、替换文件、压缩或裁剪时，必须重新运行生成器并提交生成后的差异；不得手改生成 JSON 或哈希字段。该 JSON 位于默认忽略的 `docs/` 路径，提交时须显式纳入版本控制。

## 资产发布门槛

新的线上制品至少应保证：所有运行时资产可同源加载；所有第三方资产可映射至台账；游戏内授权入口可到达；分享卡不意外删除署名/说明；线上制品版本与台账版本可对应。线上版本当前漂移时，许可证页面本身也可能是旧的，因此 A-02 关闭前不应把线上页面视为最终许可披露 [3]。

## 参考资料

[1]: LICENSE.md "游戏本体著作权声明"
[2]: assets/img/CREDITS.md "实景照片作者与许可清单"
[3]: docs/review/first-principles-adversarial-audit.md "A-02 与 A-08 的事实与边界"

## 第 3 阶段：南京垂直切片生成资产

> **边界。** 下表中的三项均为本项目生成的原创风格资产，不是南京市政府、南京文旅、景区、文博机构、商家或任何第三方的徽标、宣传物或授权素材。中华门、秦淮河/画舫、盐水鸭的事实依据分别记录于 `docs/research/nanjing-source-notes.md`；生成资产不复制其摄影作品、标识或原文。

| 资产 ID | 提交路径与用途 | 提示词/来源 | 权利与授权口径 | 尺寸与压缩 | 处理与保留 |
|---|---|---|---|---|---|
| `nanjing-slice-target-v1` | `assets/game/nanjing-slice/nanjing-vertical-slice-target.webp`；视觉目标参考，不在运行时请求。 | 2026-09-01 由 Manus 图像生成。英文提示词：`Create a clean sharp 2D Canvas runner game screenshot ... 16:9 ... near-ground three-quarter behind-the-runner camera ... warm lantern gold ... moon-white ... muted vermilion ... weathered gray-brick multi-arched city gate ... teal river ... covered Qinhuai pleasure boat ... no logos, no readable text, no photograph ...` | 生成资产；仅表达项目视觉方向。其文化语义由 N-01、N-02、N-03 核验，不构成官方授权、合作或背书。 | 原始 PNG 1920×1080；提交版 WebP 1280×720，质量 82，91 KiB。 | `tools/process_nanjing_slice_assets.py` 用 Pillow LANCZOS 转换；原 PNG 已移出仓库工作树，仅保留本地生成记录。 |
| `nanjing-slice-salted-duck-v1` | `assets/game/nanjing-slice/salted-duck-token.webp`；首个可拾取“盐水鸭牌”，也可复用为 HUD/奖励图标。 | 2026-09-01 由 Manus 图像生成，以上述视觉目标为风格参考。英文提示词：`Create a single reusable 2D game pickup sprite ... round salted-duck token ... ivory-white duck silhouette nested inside a warm lantern-gold medallion ... muted vermilion ribbon knot ... bold dark navy ink outline ... transparent PNG ... no text, logo, packaging, brand, watermark or Chinese characters.` | 生成资产；盐水鸭作为南京饮食文化线索的事实依据为 N-03。它不是食品商标、包装、菜品照片或官方认证标识。 | 原始透明 PNG 1920×1920；提交版透明无损 WebP 256×256，65 KiB。 | 同上；运行时经 `src/art/sprites.js` 异步载入，失败时 `src/render.js` 程序化回退。 |
| `nanjing-slice-lantern-marker-v1` | `assets/game/nanjing-slice/qinhuai-lantern-marker.webp`；安全道与双灯奖励的非色彩单独标识。 | 2026-09-01 由 Manus 图像生成，以上述视觉目标为风格参考。英文提示词：`Create a single reusable 2D game route marker sprite ... outlined downward route chevron paired with a tiny warm lantern ... moon-white chevron inside a dark indigo circular badge ... muted vermilion tassel ... transparent PNG ... no signage, real-world emblem, logo, letters or watermark.` | 生成资产；画舫灯影的文化语义由 N-02、N-03 支撑。它是原创 UI 标记，不是景区导向标识。 | 原始透明 PNG 1920×1920；提交版透明无损 WebP 192×192，33 KiB。 | 同上；运行时经 `src/art/sprites.js` 异步载入，失败时 `src/render.js` 绘制箭头回退。 |

这些资产总计 **189 KiB**（含不在运行时请求的 91 KiB 视觉目标图）；两枚运行时 WebP 合计 **98 KiB**。中华门门洞、城砖、城垛、秦淮水面、画舫、道路、灯影、引导箭头和全部 UI 均由既有/新增 Canvas 程序化几何绘制，因此没有引入批量原图、图集或第三方图片许可负担。第 3 阶段未引入 AVIF；在本项目既有静态构建链与浏览器回退逻辑中，带 alpha 的小型 WebP 是更低风险的格式选择。

新增或替换上述 WebP 后，必须运行 `node tools/generate_asset_sbom.mjs`，不得手动填写哈希。

## 第 4 阶段：资产变化结论

第 4 阶段没有新增、替换或下载运行时图片、音频、字体或第三方素材；因此不需要改动 `docs/qa/asset-sbom.json`，也不应人为重写其中的 SHA-256。新增体验来自 `NANJING_SLICE` 的路线/节奏配置、Canvas 既有程序化绘制和本地测试脚本，而非堆叠素材。

| 项目 | 第 4 阶段变化 | 台账处理 |
|---|---|---|
| 南京切片 WebP | 无变化；仍为盐水鸭牌与灯影路线标记两枚运行时资产。 | 保留第 3 阶段资产 ID、哈希、提示词和处理记录。 |
| 城门、水面、画舫、灯影、路线与结算卡 | 无新增外部文件；继续由 Canvas 程序化绘制。 | 不产生新的第三方许可或 SBOM 文件条目。 |
| 减弱动态 | 仅改变既有程序化粒子、水波、画舫漂移、镜头震动和转场的运行时开关。 | 不是资产替换，不更新资产哈希。 |
| QA 截图与回放数据 | 更新为本地回归证据；不作为游戏运行时素材。 | 与玩法证据分开记录在 `docs/qa/evidence/`。 |

> 不因“没有新素材”而关闭既有 A-08。历史照片/字体的固定来源、下载/处理记录及 CC BY-SA 适配审查仍依本台账前文要求办理。

## 2026-09-02 remediation 现状

本轮重新生成两套字体子集及其哈希，修复两条含逗号作者署名的解析错误，并补齐此前漏登记的 `bg_sunyard.jpg`、`bg_sunyard.webp`、`it_stone.jpg`。发布包现在固定随附 `legal/LICENSE.md`、`legal/PHOTO-CREDITS.md`、`legal/FONT-OFL.txt`，运行时授权页与 `build-info.notices` 同步校验。47/47 工程登记已经关闭“已发布文件未入台账”的问题；历史照片 oldid、下载日期、处理记录及 CC BY-SA 正式法律判断仍未闭合，不能把 SBOM 当法律意见。
