# Flow Explorer HTML 模板规范（NIOFlow 设计系统）

本文件是 `flow-explorer` 输出 HTML 的视觉与结构契约。所有颜色、间距、布局、交互都以此为准，不得即兴发挥。

## 一、NIOFlow 设计 token

写成 CSS 变量放在 `:root`：

```css
:root {
  /* 品牌主色 NIO Teal */
  --accent:      #00bebe;  /* 强调：关键数据、CTA、激活态 */
  --accent-2:    #00D4D4;  /* 高亮 / 渐变顶部 / hover */
  --accent-soft: #D0F5F5;  /* 卡片背景 / tag / 引用块 */
  --sage:        #004b64;  /* 深色背景 / 渐变底部 */
  --grad:        linear-gradient(135deg, #00D4D4, #00bebe); /* 默认渐变 */

  /* 中性灰（青色调，禁止纯灰 #888/#666） */
  --ink-1: #1A1F1F;  /* 标题 */
  --ink-2: #2E3D3D;  /* 正文 */
  --ink-3: #5C7070;  /* 辅助 / 副标题（正文颜色不得浅于此） */
  --ink-4: #8AABAB;  /* 说明 / footer */

  /* 背景与分割线 */
  --bg: #FFFFFF;
  --bg-soft: #F0FAFA;
  --bg-card: #FFFFFF;
  --line: #D8EEEE;
  --line-2: #B8DEDE;

  /* 阴影（青色冷调，禁止纯黑阴影） */
  --shadow-card:  0 16px 34px -22px rgba(0,60,70,0.15);
  --shadow-em:    0 24px 50px -32px rgba(0,60,70,0.18);
  --shadow-float: 0 40px 80px -50px rgba(0,60,70,0.25);
  --glow:         0 0 0 4px rgba(0,190,190,0.15);
}
```

硬性规则：

- 主色仅用于强调：单块面积 ≤15%，每屏 ≤3 处主色实例；正文中的主色文字用 `#00bebe`；大面积浅色块用 `#D0F5F5`
- 文本最多 4 级层级（ink-1 ~ ink-4）
- 大面积背景仅限 `#FFFFFF`、`#F0FAFA`、`#E8FAFA`
- 渐变只允许两类：主色青绿渐变、冷调灰度渐变；禁止暖色和彩虹渐变
- 深色背景用 `#0a0a0a` 或 `--sage` 系深青，搭配 `#00D4D4` 高亮
- `#D14545` 仅用于极少数告警/失败语义，不出现在正文标题

## 二、节点分类色板

分类颜色从下表选取（边框 + 浅填充 + 深文字），4–7 类为宜；「主色青」每张图只给一个最核心的分类：

| key 建议 | 边框 | 填充 | 文字 | 用途 |
|----------|------|------|------|------|
| team/core | `#00bebe` | `#D0F5F5` | `#0B4A4A` | 核心对象、主流程 |
| radio/infra | `#004b64` | `#DEF0F4` | `#00323F` | 硬件、底层能力 |
| talk/process | `#3D8090` | `#E1EEF1` | `#1F3E45` | 常规处理、次级链路 |
| bind/account | `#5D4DD4` | `#ECE9FB` | `#2A2260` | 账号、绑定、第三方 |
| buy/external | `#D49922` | `#FBF1DA` | `#4A3A10` | 商城、交易、外部动作 |
| decision | `#00AAAA` | `#FFFFFF` | `#1A1F1F` | 判断分支（菱形 + `stroke-dasharray: 4 3`） |
| alert（慎用） | `#D14545` | `#FBE9E9` | `#5C1D1D` | 失败 / 告警 |

对应 Mermaid `classDef`（由数据模型生成）：

```
classDef team fill:#D0F5F5,stroke:#00bebe,color:#0B4A4A,stroke-width:1.5px;
classDef decision fill:#FFFFFF,stroke:#00AAAA,color:#1A1F1F,stroke-width:1.5px,stroke-dasharray:4 3;
```

## 三、页面结构

```
<body>
  .header          深青渐变横幅
  .tab-bar         视图切换 + 编辑工具栏（sticky）
  .legend-bar      分类图例
  .layout
    .left-content
      .view[data-view=flow]   Mermaid 视口（缩放/平移/编辑）
      .view[data-view=cards]  分阶段卡片视图
      .view[data-view=edges]  连线管理表格
    .detail-panel  右侧详情/编辑面板（约 500px）
  .page-footer
</body>
```

### 1. Header

- 背景：`linear-gradient(135deg, #00323F 0%, #004b64 55%, #007D8C 100%)`（深青渐变，属于允许的青绿渐变类）
- 右上角 radial 辉光装饰：`radial-gradient(circle, rgba(0,212,212,.22), transparent 65%)`，绝对定位、pointer-events none
- `h1`：白色，20–22px，700；标题里的关键词可用 `#00D4D4` 强调
- `.subtitle`：`rgba(255,255,255,.75)`，12px；行内 `<code>` 用 `rgba(0,212,212,.15)` 底 + `#7FE8E8` 字
- padding：`22px 32px`

### 2. Tab bar / 工具栏

- 白底，底边 `1px solid var(--line)`，`position: sticky; top: 0; z-index: 30`
- 左侧 tabs：`data-view` 属性切换；激活态背景 `var(--grad)`、白字、圆角 8px；非激活 `var(--ink-3)`，hover 背景 `var(--bg-soft)`
- 右侧编辑工具按钮：`+ 新增节点`（主按钮，`var(--grad)` 底白字）、`撤销`/`重做`（描边按钮，禁用态 40% 透明度）、`自动布局`（清除全部手动拖动偏移）、`导出 Mermaid`、`导出 JSON`、`重置`（描边按钮，红字用 `#D14545` 仅此一处）
- 描边按钮样式：白底、`1px solid var(--line-2)`、`var(--ink-2)` 字、hover 边框变 `var(--accent)`

### 3. Legend bar

- 背景 `#FAFAFC` 或 `var(--bg-soft)`，上下细边 `var(--line)`
- 每项：14×14 圆角 4px 色样（填充=分类填充色、边框=分类边框色）+ 12px `var(--ink-3)` 标签
- 尾部附操作提示文字（`var(--ink-4)`, 11px）：「单击节点查看详情 · 双击直接编辑 · 滚轮缩放 · 拖拽平移」

### 4. Mermaid 视口

- `position: relative; overflow: hidden; cursor: grab`（拖动时 `grabbing`）
- 24px 网格底纹：
  ```css
  background-image:
    linear-gradient(var(--line) 0.5px, transparent 0.5px),
    linear-gradient(90deg, var(--line) 0.5px, transparent 0.5px);
  background-size: 24px 24px;
  background-color: #FDFFFF;
  ```
- 内层 `#stage` 承载 SVG，`transform: translate(tx,ty) scale(s)`，`transform-origin: 0 0`
- `#stage svg { max-width: none !important; width: auto !important; height: auto !important; }`
- 缩放控件：**绝对定位在视口右上角**（不是 fixed），白底圆角条，含 `[−] [100%] [+] | [⤢ 适应] [⟲ 复位]`，青调阴影
- 节点 hover：`filter: brightness(0.97)` + `cursor: pointer`（渲染后统一给 `.node` 加）
- 首次渲染自动 fit-to-screen；此后重渲染保留用户当前的缩放/平移

### 5. 详情/编辑面板（右侧）

- 宽约 500px，`flex-shrink: 0`，背景 `#FAFAFC`，左边线 `1px solid var(--line)`
- 左缘 2px 渐变饰条：`::before` 绝对定位，`background: var(--grad)`
- 三种模式（同一容器切换）：
  - **查看**：节点标题（16px, 700, ink-1）+ 分类 tag 胶囊（分类填充色底/边框色描边）→ `🎯 目的` 与 `⚙️ 处理逻辑` 两个区块（h3 15px/700；正文 `.content` 13px、`var(--ink-2)`、line-height 1.8、`white-space: pre-wrap`）→ 底部按钮行：`编辑节点`（渐变主按钮）、`删除节点`（描边红字）
  - **编辑**：表单（标题 input、分类 select、阶段 select、目的 textarea、处理逻辑 textarea）→ `保存`（主按钮）/`取消`；由双击节点或查看态「编辑」进入
  - **新增**：同编辑表单，另加「上游节点」「下游节点」两个可选 select（选了就自动建连线）
- 空态：居中 `var(--ink-4)` 提示「点击流程图或卡片中的任意节点查看详情」
- 表单控件：白底、`1px solid var(--line-2)`、圆角 8px、focus 时边框 `var(--accent)` + `box-shadow: var(--glow)`

### 6. 卡片视图

- 每个阶段一个 section：渐变胶囊编号（`var(--grad)` 白字圆角胶囊）+ 标题（15px 700，渐变文字可选）+ hint（12px ink-3）
- 节点卡片网格：`repeat(auto-fill, minmax(230px, 1fr))`
- 卡片：白底、`1px solid var(--line)`、圆角 10px、`var(--shadow-card)`；内含分类色 tag 胶囊、标题（13.5px 700 ink-1）、目的一行（12px ink-3、两行截断）
- hover：底部 3px 渐变条淡入（`::after` + `var(--grad)`）、阴影升级为 `var(--shadow-em)`、上移 1px
- 卡片可点击，联动右侧详情面板

### 7. 连线管理视图

- 表格：白底卡片包裹，表头 `var(--bg-soft)` 底、12px ink-3
- 每行：起点 select、箭头符号（虚线行用 `-·->`／实线 `——>`，ink-4）、终点 select、标签 input、线型 select（实线/虚线）、`删除` 文字按钮（红 `#D14545`）
- 行内任何修改立即写入 state 并重渲染流程图
- 底部 `+ 新增连线` 描边按钮
- 校验：起点=终点时拒绝并提示；重复连线提示

### 8. Footer

- 9.5px，`var(--ink-4)`，居中；顶部一条 2px × 56px 渐变小标线（`var(--grad)`）
- 内容：文档名 · 生成日期 · 「本页面可直接编辑，修改自动保存于浏览器本地」

## 四、编辑器架构（脚本骨架）

```html
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
  const TAGS   = { /* key: {label, border, fill, text, shape?} */ };
  const INITIAL = { nodes: {...}, edges: [...], phases: [...], layout: {} };  // 初始数据（深拷贝后使用）
  let state;                      // 当前数据模型（唯一事实源；layout 存拖动偏移 id -> {dx, dy}）
  let undoStack = [], redoStack = [];   // 历史快照（JSON 字符串，上限 50）
  let view = { s: 1, tx: 0, ty: 0, fitted: false };  // 缩放平移状态

  // 1. 数据 → Mermaid 源码
  function buildMermaid(state) {
    // flowchart TD
    // 每个 phase 一个 subgraph（内部 direction TB，只放节点声明）
    // 全部 edge 写在所有 subgraph 之后
    // classDef / class 语句由 TAGS 生成
    // sanitizeLabel(): " → '、# → ＃、< > → ＜ ＞、& → &amp;，超长自动 <br/> 折行
  }

  // 2. 渲染
  let renderSeq = 0;
  async function renderFlow() {
    const { svg } = await mermaid.render('graph-' + (++renderSeq), buildMermaid(state));
    stage.innerHTML = svg;
    bindNodeEvents();             // 见下
    if (!view.fitted) { fitToScreen(); view.fitted = true; }
    else applyTransform();        // 保留用户当前缩放平移
  }

  // 3. 事件绑定：不用 mermaid click 语句，渲染后自行绑定
  function bindNodeEvents() {
    stage.querySelectorAll('.node').forEach(el => {
      const m = /^flowchart-(.+?)-\d+$/.exec(el.id);   // 提取节点 ID
      if (!m || !state.nodes[m[1]]) return;
      el.style.cursor = 'pointer';
      el.addEventListener('click',    () => showDetail(m[1]));
      el.addEventListener('dblclick', () => openEdit(m[1]));
    });
  }

  // 4. 所有修改走同一入口：先存历史，再改 state，再重渲染 + 持久化
  function commit(mutator) {
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > 50) undoStack.shift();
    redoStack.length = 0;
    mutator(state);
    persist();       // localStorage.setItem(KEY, JSON.stringify(state))
    renderAll();     // renderFlow() + renderCards() + renderEdgeTable()
  }

  // 5. 撤销/重做：交换栈顶快照
  // 6. 导出：Blob 下载 buildMermaid(state) / JSON.stringify(state, null, 2)
  // 7. 初始化：localStorage 有存档则恢复，否则用 INITIAL 深拷贝
  mermaid.initialize({
    startOnLoad: false, securityLevel: 'loose', theme: 'base',
    flowchart: { curve: 'basis', htmlLabels: true, nodeSpacing: 40, rankSpacing: 60, padding: 12 },
    themeVariables: {
      fontFamily: "-apple-system,'PingFang SC','Microsoft YaHei',sans-serif",
      lineColor: '#8AABAB', edgeLabelBackground: '#F0FAFA',
      clusterBkg: '#F4FBFB', clusterBorder: '#B8DEDE',
      primaryColor: '#D0F5F5', primaryBorderColor: '#00bebe', primaryTextColor: '#1A1F1F',
    },
  });
</script>
```

要点回顾：

- **单一事实源**：一切编辑都改 `state`，图、卡片、连线表全部从 `state` 重建，永不手改 SVG（唯一例外：拖动只更新当前节点 transform + 重画连线层，DOM 已是最新状态，不必整图重渲染）
- **重渲染保位**：`view` 里的缩放平移与 `state` 解耦，重渲染不回跳；重渲染后按 `state.layout` 重放偏移
- **快捷键**：`+`/`−` 缩放、`0` 复位 100%、`F` 适应屏幕、`Ctrl+Z`/`Ctrl+Shift+Z`(或 `Ctrl+Y`) 撤销重做；输入框聚焦时快捷键失效（判断 `e.target` 是否为 INPUT/TEXTAREA/SELECT）
- **平移**：视口 mousedown 起拖，移动阈值 3px 以内视为点击（不干扰节点 click）
- **滚轮缩放**：以鼠标位置为锚点，`s` 限制在 0.2–3

## 五、节点拖拽与自绘连线层

「每个方框可随意拖动」不能靠 Mermaid 本身实现（它的连线路径是布局时算死的）。采用分层方案：

**Mermaid 只负责两件事：自动布局 + 绘制节点和阶段容器。连线一律删掉重画。**

渲染管线（每次 `mermaid.render` 之后执行 `setupScene(svg)`）：

1. **索引节点**：遍历 `.node`，从 `el.transform.baseVal` 读出 Mermaid 给的基准位置 `baseX/baseY`，`el.getBBox()` 记录尺寸，存入 `nodeGeo[id]`；随后把 `state.layout[id]` 的偏移加到 transform 上（重放上次的拖动结果）
2. **换连线层**：删除 Mermaid 的 `.edgePaths` 与 `.edgeLabels`，在原位置插入自绘 `<g class="custom-edges">`（保持在节点之下）；`<defs>` 里注册箭头 `<marker>`（填充 `#8AABAB`）
3. **画连线** `drawEdges()`：对每条 `state.edges`，取两端节点当前几何 `geoOf(id)`（基准 + 偏移），按相对方位选锚点——垂直为主时从底边中点到顶边中点，水平为主时从侧边中点出发——用三次贝塞尔连接，控制点距离 `clamp(距离*0.4, 24, 120)`；虚线 `stroke-dasharray: 4 4`；标签取 `path.getPointAtLength(total/2)` 中点，`#F0FAFA` 圆角底 + `#5C7070` 文字
4. **重算容器** `updateClusters()`：每个阶段容器矩形改为成员节点外接矩形 + padding（顶部多留 ~46px 放标题），标题 `.cluster-label` 平移到顶部居中。容器元素优先 `svg.getElementById(phase.id)`，找不到就按标题文本在 `.cluster` 里匹配（Mermaid 版本差异兜底）

拖动交互：

- 节点 `mousedown` 时 `stopPropagation()`（避免触发画布平移），记录起点与 `JSON.stringify(state)` 快照
- `mousemove` 中把屏幕位移除以缩放系数 `view.s` 换算成 SVG 坐标，写入 `state.layout[id]`，然后只做三件事：更新该节点 transform、`drawEdges()`、`updateClusters()`——十几条边全量重画每帧毫无压力，代码远比增量更新简单
- `mouseup` 时若确实移动过（阈值 3px）：把拖前快照压入 undo 栈、清空 redo、`persist()`。**一次完整拖动 = 一条历史记录**
- 松手后用一个微任务级标志（`setTimeout(0)` 清除）吞掉紧随的 click，避免拖完误触详情面板

三个必须防的坑：

- **`display:none` 里的 SVG 无法 `getBBox()`**——视图切换要用 `visibility: hidden` + 绝对定位，保证隐藏的流程图仍有布局（在「连线管理」视图里改数据也要能重渲染流程图）
- **拖出 viewBox 会被裁剪**——给 `svg` 设 `overflow: visible`
- **fit/复位不能再用 viewBox**——节点可能已拖到 viewBox 之外，改用 `svg.getBBox()` 的实际内容外接矩形计算缩放与居中
