# 金陵快跑 · 南京剪纸跑酷

南京城市主题的国风剪纸跑酷小游戏:跑过明城墙、玄武湖、中山陵、夫子庙、紫金山五关,收集盐水鸭、雨花茶等金陵风物图鉴。全部画面由 Canvas 代码实时绘制,无外部素材,零构建、原生 ES Modules。

## 操作

- `←` / `→`(或 `A` / `D`):换道
- `↑` / `空格`(或 `W`):跳跃(可二段跳)
- `↓`(或 `S`):滑铲 / 空中快降
- `P` / `Esc`:暂停、返回
- `M`:静音开关;`Enter`:重开 / 下一关
- 触屏:滑动 = 操作,点击 = 按钮

## 本地运行

ES Modules 必须通过 http 协议访问,双击 `index.html`(file://)打不开。任选其一:

```bash
python -m http.server 8000   # 然后浏览器打开 http://localhost:8000
```

或使用 VS Code 的 Live Server 插件。

深链:`#play` 直接进无尽模式,`#lv0` ~ `#lv4` 直接进对应关卡。

## 目录结构

```
index.html      入口骨架(style + canvas + module script)
src/
  core.js       canvas/透视投影/常量/绘制原语
  config.js     关卡与收集品数据
  save.js       localStorage 存档
  audio.js      WebAudio 合成音效
  art/          剪纸绘制(收集品/障碍/两侧风景/玩家)
  game.js       游戏状态与主更新逻辑
  render.js     场景渲染
  ui.js         HUD 与各界面
  input.js      键盘/触屏输入
  main.js       入口:主循环与深链
assets/fonts/   标题用子集化思源宋体(jinling-serif.woff2)与字符表 chars.txt
docs/           设计文档(不参与版本控制的代码部分)
```

### 重新生成标题字体

游戏用字变化后,用项目内 `.venv`(fonttools + brotli)重新子集化:

```bash
# 1. 重新提取字符表(见 assets/fonts/chars.txt 的生成脚本,遍历 src/**/*.js + index.html)
# 2. 下载 Noto Serif SC(可变字重),固定到 wght=600 后子集化:
./.venv/Scripts/fonttools varLib.instancer NotoSerifSC.ttf wght=600 -o NotoSerif600.ttf
./.venv/Scripts/pyftsubset NotoSerif600.ttf --text-file=assets/fonts/chars.txt \
  --flavor=woff2 --output-file=assets/fonts/jinling-serif.woff2 --no-hinting --desubroutinize
```

## 版本控制约定

一个主题一个 commit,提交信息简要说明改动目的;不提交 `node_modules/`、`dist/` 等产物。
