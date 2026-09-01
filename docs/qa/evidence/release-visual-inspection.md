# 第 5 阶段发布候选视觉抽检

> **范围。** 本记录基于候选制品的本地 Chromium 截图。桌面 Chromium 为真实 Linux 浏览器二进制；Android Chrome 画面为触控/DPR/UA 模拟，不是物理 Android 或微信 WebView 结论。

| 证据 | 视口/环境 | 观察 | 判定 |
|---|---|---|---|
| `release-desktop_chromium.png` | 1440×900，Chromium | 中华门、秦淮水面、画舫、白鸭、路线提示、灯牌 HUD、静音/暂停控制完整可见。中文未出现缺字或回退方框；画面留白与对比足够，未见错误边界、占位图或布局裁切。 | 通过 |
| `release-android_chrome_ua.png` | 844×390，DPR 2、触控/Android Chrome UA 模拟，候选默认渲染比 1.5 | 主提示、灯牌 HUD、暂停/静音、城门与白鸭同时可读；两侧未见安全区裁切或触控遮挡。较桌面清晰度下降但文字与关键控件仍可辨，符合以中端性能优先的最小 DPR 调整目标。 | 通过（模拟） |

本次视觉抽检不外推至真实 Android Chrome、iOS Safari、微信 WebView 或物理设备温升/性能；这些结论依 `docs/qa/release-candidate-report.md` 中的设备分级与人工门槛处理。
