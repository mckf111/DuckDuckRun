# 微信发布素材索引

2026-09-07 更新。封面是现有游戏美术合成，其他游戏画面均为当前版本本地浏览器实截。全部截图不冒充实体手机验收；展示存档不代表真人通关。

| 文件 | 尺寸 | 用途 | 来源与边界 |
| --- | --- | --- | --- |
| [cover-900x383.jpg](assets/cover-900x383.jpg) | 900×383 | 合成封面 | 现有桂花鸭与城门素材 + SVG 标题排版，非游戏截图 |
| [core-gameplay-1200x800.jpg](assets/core-gameplay-1200x800.jpg) | 1200×800 | 流程展示 | 菜单、竖屏跑局、自然失败三张浏览器截图拼图 |
| [screenshot-menu.jpg](assets/screenshot-menu.jpg) | 390×844 | 首次首页 | 无进度的新浏览器存档 |
| [screenshot-levels.jpg](assets/screenshot-levels.jpg) | 1100×900 | 十站选关 | 展示存档，局部站点列表 |
| [screenshot-tutorial.jpg](assets/screenshot-tutorial.jpg) | 390×844 | 操作引导 | 首次开始后的真实引导画面 |
| [screenshot-formal-run.jpg](assets/screenshot-formal-run.jpg) | 390×844 | 正式跑局 | 展示存档，左侧路线实际跑至 140 米，已收集 5 枚鸭蛋 |
| [screenshot-mobile-run.jpg](assets/screenshot-mobile-run.jpg) | 390×844 | 竖屏跑局 | 与正式跑局相同的当前截图 |
| [screenshot-over.jpg](assets/screenshot-over.jpg) | 390×844 | 自然失败结算 | 标准模式不操作，在约 143 米处撞到矮障碍 |
| [screenshot-album.jpg](assets/screenshot-album.jpg) | 1100×900 | 风物谱 | 展示存档 28/40，不揭示未解锁隐藏条目 |
| [jinlingrun-qr.png](assets/jinlingrun-qr.png) | 528×528 | 正式网址二维码 | 独立 ZXing-C++ 解码确认 URL；可访问性另验 |

上述现役素材合计 0.70 MiB。`qr-placeholder.jpg` 仅留历史，不使用；正式二维码为 `jinlingrun-qr.png`，SVG 为其可编辑来源。

## 后台装配

1. 封面上传 `cover-900x383.jpg`。
2. 正文按文章里的图位上传当前截图；无需把所有备用图都插进去。
3. “阅读原文”填写 `https://jinlingrun.caowenhu.com/`。
4. 正文末尾插入 `jinlingrun-qr.png`，配“点击文末阅读原文，或长按二维码，直接开玩”。
5. 发布前用真实微信预览验证两种入口，确认进的是当前版本。

## 核验

- `cover-900x383.jpg` SHA-256：`9ad1c2ae8a41676e9367a642a3c2c0c292ec5cd7a3f213c685e06f2093ef76d8`
- `core-gameplay-1200x800.jpg` SHA-256：`fafd7a5f382ca554994cc5de97e9be8e67e39c461451390f55978cf62d255e6e`
- `screenshot-menu.jpg` SHA-256：`a16be3a11e43f68a09b5d2f4268866b73cfe6d86eb4d834584fe71de949e2cf3`
- `screenshot-levels.jpg` SHA-256：`ce474aa5c7944a78aea10ce72ad5561b4509b4876d42ec512aa6bced2480de60`
- `screenshot-tutorial.jpg` SHA-256：`f054d361648c861f0495cc4b45416356d850dbf0289b6c8063a4718520ce63c5`
- `screenshot-formal-run.jpg` SHA-256：`353bef8ff5abf0568813bf23cb5f6132d7dda7bc92807c8bc7463a7b35c940c9`
- `screenshot-mobile-run.jpg` SHA-256：`353bef8ff5abf0568813bf23cb5f6132d7dda7bc92807c8bc7463a7b35c940c9`
- `screenshot-over.jpg` SHA-256：`7cd6a340eb3d30d18df42fedba48444543257c83009960baaeb74f2babe2b42b`
- `screenshot-album.jpg` SHA-256：`28e8fb0b2845286e1df5fbee12e94dbd6662a42a42e30f61254cb9f5c7eda3c5`
- `jinlingrun-qr.png` SHA-256：`3f744165e40de4769b0bdf29dd1e6e0121022ceb23ccb423b48cfd4f7e367738`
