# 2026-09-02 remediation 候选视觉抽检

> **范围。** 本记录对应实现提交 `768d707`、构建 `f36b36debf1a`。截图由本地 Chromium 重新生成并逐张查看；Android/iOS/微信均是 UA、触控和视口模拟，不是物理设备或真实 WebView 结论。

| 证据 | 视口/环境 | 本轮观察 | 判定 |
|---|---|---|---|
| `release-desktop_chromium.png` | 1440×900，Canvas 1440×810，Chromium | HUD 三块互不遮挡；路线、城门、鸭子、暂停/静音和底部动作提示完整；无字体方框、过场遮罩或裁切。 | 通过 |
| `release-android_chrome_ua.png` | 844×390、DPR 2、触控模拟，Canvas 693.3×390 | 横屏画面完整铺满可用高度，两侧仅为正常宽高比留黑；HUD、月亮、控制按钮和动作提示均在 Canvas 内，无右半幅黑屏。 | 通过（模拟） |
| `release-ios_safari_ua.png` | 844×390、DPR 2、iPhone/Safari UA 的 Chromium | 视口、Canvas 铺满、竖屏拦截后恢复与字体加载断言通过；不冒充 WebKit。 | 通过（模拟） |
| `release-wechat-ua-share.png` | 844×390、MicroMessenger UA、真实 Canvas 触控 | 成绩卡、二维码、长按提示、复制按钮、复制成功 toast 与关闭按钮完整可见；图片 naturalWidth=600。 | 通过（容器模拟） |

本轮曾复现一张右半幅发黑的移动截图。根因是测试在 `wipe` 过场尚未结束时提前截图，不是稳定游戏画面；门禁现要求字体加载、目标状态、`stateT`、`wipe <= 0` 连续三帧稳定，并断言恢复横屏后的 CSS 视口和 Canvas 尺寸。修复门禁后重新生成的上述截图不再出现该问题。

本记录不外推到真实 Android Chrome、iOS WebKit、微信 WebView、物理设备温升/耗电，也不证明“老少咸宜”或南京辨识度。对应门槛见 [`../release-candidate-report.md`](../release-candidate-report.md)。
