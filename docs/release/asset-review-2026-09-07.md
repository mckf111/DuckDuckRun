# 2026-09-07 素材发布复核

本次复核服务于《冲鸭！金陵！》个人作品网页发布，源码仓库维持私有。审阅者为 Codex；用户已批准实施 README、合并与阿里云发布方案。这里的批准只表示依据已核对的素材来源、许可及使用方式完成工程发布复核，不冒充律师意见、第三方授权书或真人测试。

最终逐文件状态在 `assets/release-review.json`，绑定当前 SHA-256。任何素材变化使批准失效。`assets/album/REVIEW.json` 保留此前来源核验记录，不用它的历史 `publicationReview` 字段代替本轮发布决定。

指纹规则与实际发布字节一致：图片/字体按原始二进制，JavaScript 音频源按构建器相同的 LF 换行规范化后计算。首次正式 CI 曾因 Windows CRLF 与 Linux LF 的音频源哈希不同而拒绝 1 项，现已修复并覆盖回归测试；实质代码和二进制变化仍会使审核失效。

## 复核结果

当前随包素材 70 项均完成工程复核。最初 4 项 Grok 输出分发条件待核，随后用户确认个人订阅，官方 Consumer FAQ 明确允许包含图片在内的输出用于商业目的；已在游戏版权页、LICENSE 与 README 补充 Created with Grok 署名。文件变更后仍须重新审核，不得通过改用试玩包上传绕过。

| 分组 | 数量 | 依据与使用条件 | 本次结论 |
| --- | ---: | --- | --- |
| 图鉴照片 | 30 | `assets/album/REVIEW.json` 保留原文件版本、作者、许可、下载和处理哈希；`CREDITS.md` 与游戏详情显示署名、来源和照片性质。CC BY-SA 衍生版本继续相同许可，不将整个游戏的保留权利条款套用到照片。 | 本次公开网页的图鉴用途通过；不作人物代言或商业推荐。 |
| 背景与派生背景 | 24 | `assets/img/CREDITS.md`、原图候选记录和 `tools/process_assets.py`；对应作者、来源和 CC 许可在游戏授权页列示。历史下载日期和部分原始版本未记录，按实际缺口保留，不倒填。 | 按已列许可及改作说明保留，用于场景背景。 |
| 字体 | 2 | `assets/fonts/OFL.txt`、本地留存上游字体与子集清单；霞鹜文楷 v1.522，马善政历史 master 精确 commit 未记录。当前输出已固定文件指纹。 | 保留完整 OFL 告知；不单独售卖字体，不宣称独占。 |
| OpenAI 绘本图集与拾取光环 | 6 | `ASSETS.md`、留存原图及生成记录；本轮重新编码拾取光环，与现有文件逐字节一致。角色/场景不使用第三方商标参考，光环使用本项目玩法截图作为上下文。 | 允许本项目表达用途，保留 AI 辅助声明，不承诺排他版权。 |
| Manus 南京切片素材 | 3 | `ASSETS.md` 记录提示词、处理路径与非官方表达边界；官方帮助说明允许个人与商业使用输出，并保留法律与第三方权利条件。 | 本项目用途通过；不作为真实建筑考据照片或官方标志。 |
| WebAudio 源码 | 1 | `src/audio.js` 的程序化振荡器/包络合成，没有采样音乐或外部音频文件。 | 随原创程序保留。 |
| Grok 历史图集与派生图标 | 4 | 鸭子图集、障碍图集原始 JPG 和生成请求已找回；用 `tools/assemble_vanguard_art.py` 重建，两份 WebP 均与仓库字节一致。两个图标由 `tools/make_icon.py` 从该鸭子图集派生。 | 用户确认个人订阅；依官方 Consumer FAQ 使用输出并落实 Created with Grok 署名，本项目用途通过。 |

## 本轮找回的原图证据

- 鸭子图集：保留生成 JPG `4/6/8/9/10/11/12/13.jpg`，各姿态由同一项目鸭子图生成/修改；脚本去绿、按脚底排列成 4×3 图集。重建输出与 `assets/game/duck-atlas.webp` 的 SHA-256 一致。
- 障碍图集：生成 JPG `5.jpg` 经去绿、分割和帧排齐。重建输出与 `assets/game/obstacles-crenel.webp` 的 SHA-256 一致。
- 拾取光环：保留 OpenAI 原始 PNG `exec-a82599c6-4a17-49b7-8a3a-c7e9e10a20c3.png`，由 `tools/process_game_art.py --quality 90` 处理后与 `assets/game/pickup-ring.webp` 的 SHA-256 一致。
- 原图、生成过程和机器特定路径继续留在本地私有证据中，不复制到网页包；本报告不包含登录信息或完整聊天记录。

## 分发条件与补充确认

2026-09-07 用户确认使用 Grok 个人订阅。[Grok Consumer FAQ 的输出权属章节](https://x.ai/legal/faq#who-owns-the-inputs-to-and-outputs-from-grok) 明确允许个人用户将输出（包括图片）用于商业用途，并要求按 [Brand Guidelines](https://x.ai/legal/brand-guidelines) 署名。已在 `src/legal.js`、`LICENSE.md` 和 README 保留 Created with Grok。结合来源重建证据与本项目用途，这 4 项转为通过；不承诺 AI 输出唯一或具有当然排他版权。

用户另补充开发大致由 Kimi 起步、中途 Grok 参与，可能还使用过 Qwen，最后由 Codex 承接。具体版本和部分环节不确定，故这是协作背景，不当作逐文件生成归属；不将整个项目归于任何一个模型。

[OpenAI 内容条款](https://openai.com/policies/terms-of-use/) 将输出权属与适用法律、第三方权利及非唯一性区分；[Manus 官方输出权属说明](https://help.manus.im/en/articles/13125514-do-i-own-the-assets-websites-images-videos-slides-generated-via-manus) 允许个人与商业用途。两者均不等于生成结果必然具有独占版权。

## 独立的上线条件

本表不替代备案与游戏公开发布适用手续、OSS 服务开通、HTTPS 配置或真实手机微信验收。具体进度统一记录在同目录的发布记录中。
