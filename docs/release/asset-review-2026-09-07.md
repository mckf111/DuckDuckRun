# 2026-09-07 素材发布复核

本次复核服务于《冲鸭！金陵！》个人作品网页发布，源码仓库维持私有。审阅者为 Codex；用户已批准实施 README、合并与阿里云发布方案。这里的批准只表示依据已核对的素材来源、许可及使用方式完成工程发布复核，不冒充律师意见、第三方授权书或真人测试。

最终逐文件状态在 `assets/release-review.json`，绑定当前 SHA-256。任何素材变化使批准失效。`assets/album/REVIEW.json` 保留此前来源核验记录，不用它的历史 `publicationReview` 字段代替本轮发布决定。

## 复核结果

当前随包素材 70 项：66 项工程复核通过，4 项等待 Grok 输出分发条件确认。正式构建继续拒绝这 4 项；不得通过改用试玩包上传绕过。

| 分组 | 数量 | 依据与使用条件 | 本次结论 |
| --- | ---: | --- | --- |
| 图鉴照片 | 30 | `assets/album/REVIEW.json` 保留原文件版本、作者、许可、下载和处理哈希；`CREDITS.md` 与游戏详情显示署名、来源和照片性质。CC BY-SA 衍生版本继续相同许可，不将整个游戏的保留权利条款套用到照片。 | 本次公开网页的图鉴用途通过；不作人物代言或商业推荐。 |
| 背景与派生背景 | 24 | `assets/img/CREDITS.md`、原图候选记录和 `tools/process_assets.py`；对应作者、来源和 CC 许可在游戏授权页列示。历史下载日期和部分原始版本未记录，按实际缺口保留，不倒填。 | 按已列许可及改作说明保留，用于场景背景。 |
| 字体 | 2 | `assets/fonts/OFL.txt`、本地留存上游字体与子集清单；霞鹜文楷 v1.522，马善政历史 master 精确 commit 未记录。当前输出已固定文件指纹。 | 保留完整 OFL 告知；不单独售卖字体，不宣称独占。 |
| OpenAI 绘本图集与拾取光环 | 6 | `ASSETS.md`、留存原图及生成记录；本轮重新编码拾取光环，与现有文件逐字节一致。角色/场景不使用第三方商标参考，光环使用本项目玩法截图作为上下文。 | 允许本项目表达用途，保留 AI 辅助声明，不承诺排他版权。 |
| Manus 南京切片素材 | 3 | `ASSETS.md` 记录提示词、处理路径与非官方表达边界；官方帮助说明允许个人与商业使用输出，并保留法律与第三方权利条件。 | 本项目用途通过；不作为真实建筑考据照片或官方标志。 |
| WebAudio 源码 | 1 | `src/audio.js` 的程序化振荡器/包络合成，没有采样音乐或外部音频文件。 | 随原创程序保留。 |
| Grok 历史图集与派生图标 | 4 | 鸭子图集、障碍图集原始 JPG 和生成请求已找回；用 `tools/assemble_vanguard_art.py` 重建，两份 WebP 均与仓库字节一致。两个图标由 `tools/make_icon.py` 从该鸭子图集派生。 | 来源已确认；输出分发所适用的账号条款、许可与署名处理未闭合，保持待审。 |

## 本轮找回的原图证据

- 鸭子图集：保留生成 JPG `4/6/8/9/10/11/12/13.jpg`，各姿态由同一项目鸭子图生成/修改；脚本去绿、按脚底排列成 4×3 图集。重建输出与 `assets/game/duck-atlas.webp` 的 SHA-256 一致。
- 障碍图集：生成 JPG `5.jpg` 经去绿、分割和帧排齐。重建输出与 `assets/game/obstacles-crenel.webp` 的 SHA-256 一致。
- 拾取光环：保留 OpenAI 原始 PNG `exec-a82599c6-4a17-49b7-8a3a-c7e9e10a20c3.png`，由 `tools/process_game_art.py --quality 90` 处理后与 `assets/game/pickup-ring.webp` 的 SHA-256 一致。
- 原图、生成过程和机器特定路径继续留在本地私有证据中，不复制到网页包；本报告不包含登录信息或完整聊天记录。

## 分发条件待核依据

2026-09-07 读取的 [Grok Consumer Terms §4](https://x.ai/legal/terms-of-service) 同时提到输出权属、许可与署名；[Brand Guidelines](https://x.ai/legal/brand-guidelines) 对生成内容要求显示 “Created with Grok” 或相应文字。当前记录不能证明具体账号适用条款和所需许可已经满足，因此这 4 项不直接批准。后续确认适用条件并落实署名，或明确批准替换对应素材后，再更新逐文件记录。

[OpenAI 内容条款](https://openai.com/policies/terms-of-use/) 将输出权属与适用法律、第三方权利及非唯一性区分；[Manus 官方输出权属说明](https://help.manus.im/en/articles/13125514-do-i-own-the-assets-websites-images-videos-slides-generated-via-manus) 允许个人与商业用途。两者均不等于生成结果必然具有独占版权。

## 独立的上线条件

本表不替代备案与游戏公开发布适用手续、OSS 服务开通、HTTPS 配置或真实手机微信验收。具体进度统一记录在同目录的发布记录中。
