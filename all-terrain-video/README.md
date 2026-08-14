# 全地形模式 · 需求动画

把《关于"全地形模式"产品功能的语音笔记》（Get达人，2026-08-13）做成一条 49 秒的功能演示动画，
用本仓库的 `remotion` skill 规范编写：全部动画由 `useCurrentFrame()` 驱动，组件保持纯函数、无交互、可确定性渲染。

## 成片

`out/all-terrain-mode.mp4` — 1920×1080 / 30fps / 1470 帧 / 49 秒 / 无音轨。

## 分镜与时长

| 帧区间 | 场景 | 内容 |
|---|---|---|
| 0–119 | `Opening` | 标题「全地形模式」+ 文档出处 |
| 120–359 | `TerrainGrid` | 五种地形：泥地 / 沙地 / 雪地 / 湿地 / 碎石，逐张入场后依次扫过 |
| 360–689 | `FeatureAutoDetect` | **核心功能 1 自动识别与提醒**：柏油路 →（fade）雪地，系统弹窗「已驶入雪地，是否为您打开全地形模式？」→ 确认 → 模式开启 |
| 690–959 | `FeatureQuickActivate` | **核心功能 2 便捷激活**：方向盘按键按下，对应模式直接进入 |
| 960–1289 | `FeatureSceneSwitch` | **核心功能 3 场景切换识别**：柏油路 →（wipe）沙地，弹窗「已驶入沙地，是否为您切换到沙地模式？」→ 切换完成 |
| 1290–1469 | `Closing` | 三项核心能力回顾 |

改时长只需调 `src/Root.tsx` 里的 `SCENES` 常量，总时长自动累加。

## 目录

```
src/
├── Root.tsx              ← Composition 定义 + Series 串场
├── theme.ts              ← 配色 token、五种地形定义
├── fonts.ts              ← Noto Sans SC 字体加载（delayRender 阻塞到就绪）
├── components/
│   ├── Ground.tsx        ← 行驶中的地面（透视条纹 + 地形颗粒）
│   ├── HmiPrompt.tsx     ← 车机弹窗（询问 / 按下 / 淡出）
│   ├── ActivatedPanel.tsx← 模式开启确认态
│   ├── SteeringWheel.tsx ← 方向盘 + 多功能按键
│   ├── TerrainIcon.tsx   ← 五种地形图标
│   ├── SceneHeader.tsx   ← 场景编号标题
│   └── Scrim.tsx         ← 正文区压暗层
└── scenes/               ← 六个场景
```

## 本地运行

```bash
npm install
npm start          # 打开 Remotion Studio 预览、拖时间轴
npm run typecheck  # tsc
```

## 渲染

```bash
node scripts/render.mjs            # 出整片 → out/all-terrain-mode.mp4
node scripts/stills.mjs 470 800    # 出指定帧的 PNG，用于快速核对画面
```

两个脚本都会一次打包、复用同一个 bundle，比反复调 `remotion render` 快很多。

## 环境备注

这两条是在当前容器里踩到的坑，换机器时可能需要调整：

- **浏览器**：脚本里写死了 `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`。
  不能用同目录的完整版 `chromium-1194/chrome-linux/chrome`——新版 Chrome 已移除旧版 headless 模式，
  而 Remotion 用的正是它，会直接启动失败。
- **TypeScript 必须锁 5.x**：TS 7 是原生重写版，没有 `ts.sys` / `ts.readConfigFile`，
  `@remotion/bundler` 的 esbuild-loader 读 tsconfig 时会抛 `Cannot read properties of undefined`。

## 素材

无外部素材。画面全部由代码绘制（SVG + CSS），字体来自 `@fontsource/noto-sans-sc`，
子集文件已复制到 `public/fonts/` 并通过 `staticFile()` 引用，因此离线可渲染。
