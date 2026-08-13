# 导出到飞书文档（可选步骤）

本文件是 SKILL.md「第 7 步：导出飞书文档」的实现参考。

## 核心原则：先探测环境能力，再选路径

导出失败几乎都源于假设环境有某种能力（浏览器、block 级 API、公网）。**动手前先确认三件事**，然后按下面两张降级表各选一条可行路径：

1. **出图能力**：`python3 -c "import PIL"` 能否通过（不行就 `pip install pillow`）？有没有 Chromium + Node？
2. **飞书工具形态**：列出当前环境可用的飞书工具——是「传 markdown 建文档」的高层工具，还是 block 级 API 工具，还是只有 app 凭证？
3. **图片/附件能力**：飞书工具支不支持上传图片和文件？

## 三层交付架构（不变的目标形态）

飞书文档不能执行 JavaScript，交互 HTML 无法内嵌运行。理想交付是三层：**① 结构化正文**（阶段/节点的目的与处理逻辑）+ **② 流程图图片** + **③ 交互版 HTML 附件**（下载后浏览器打开可编辑）。环境能力不足时按下表逐层降级，②③ 可降，① 永远可达。

## 出图路径（从上往下，选第一条可行的）

| 优先级 | 路径 | 依赖 | 说明 |
|---|------|------|------|
| **A（默认）** | `scripts/render_png.py` | 仅 Python3 + Pillow + 任一中文字体 | **零浏览器、零外部服务**。从数据 JSON 直接画出 NIO 配色的流程图 PNG（阶段容器、菱形判断、虚线分支、图例、@2x 清晰度）。内部 agent 环境默认走这条 |
| B | `scripts/snapshot.js` | Node + playwright-core + Chromium | 所见即所得（与交互版完全一致的样式）。有浏览器才用 |
| C | mermaid 服务端渲染 | 可访问自建 kroki 服务 | `POST {KROKI_URL}/mermaid/png`，body 为「导出 Mermaid」的源码。⚠️ 公网 kroki.io / mermaid.ink 在企业内网通常被拦截，且业务流程外发第三方有信息安全风险——仅在公司自建了渲染服务时用 |
| D（兜底） | 无图模式 | 无 | 文档里放 mermaid 源码代码块 + 「图片后补」提示，正文信息仍完整 |

### 路径 A 用法

```bash
pip install pillow                       # 若未安装
python3 scripts/render_png.py data.json flow.png [--scale 2] [--max-width 960]
```

`data.json` 与页面「导出 JSON」结构兼容（nodes/edges/phases），可额外加两个字段：`title`（图顶标题）、`tags`（覆盖默认色板，结构同模板 TAGS）。生成 HTML 时顺手把数据模型另存一份 JSON 即可，**不要从 HTML 里抓取**。

字体问题：脚本自动搜索常见中文字体（文泉驿/Noto CJK/苹方/微软雅黑）；都没有时报错提示 `apt-get install fonts-wqy-zenhei`，或用 `--font 路径` / 环境变量 `FONT_PATH` 指定。

## 飞书写入路径（从上往下，选第一条可行的）

### 1. markdown 级工具（最常见——内部飞书集成大多是这种）

从数据模型生成 `{项目名}-flow.md`，直接喂给「用 markdown 创建飞书文档」类工具。模板：

```markdown
# {标题}

> 💡 本文档由 flow-explorer 生成。文末附可编辑交互版，下载后浏览器打开：
> 双击节点改文字 / 拖动方框 / 增删连线，改完「导出 JSON」回传接力。

## 流程总览

![流程图](flow.png)          <!-- 按工具能力三选一：本地路径（工具自动上传）/
                                  先传图拿 URL / 都不支持 → 换成 mermaid 代码块 -->

## 阶段 1 · {phase.title}（{phase.hint}）

### {node.title}  `{分类 label}`
- 🎯 目的：{node.purpose}
- ⚙️ 处理逻辑：{node.logic 各行}

（每个节点、每个阶段重复）

## 交互版
{附件或链接；工具不支持文件时，写「HTML 已存至 {位置}」}
```

图片的三种情形：工具支持本地图片路径（自动上传）→ 直接引用；工具要 URL → 先用飞书素材/云空间接口传图拿链接；都不行 → 该节改为 mermaid 源码代码块（无图模式）。

### 2. block 级工具 / 原始 OpenAPI（有 app 凭证时的兜底）

权限 `docx:document` + `drive:drive`，tenant_access_token。块类型编号以 open.feishu.cn 最新文档为准：

```
POST /open-apis/docx/v1/documents                    # 建文档 → document_id
POST .../documents/{doc_id}/blocks/{doc_id}/children # 批量写块，一次 ≤50 个
```

文本块 `{"block_type": 2, "text": {"elements": [{"text_run": {"content": "..."}}]}}`；标题 H1/H2/H3 为 block_type 3/4/5；高亮块（callout）带子块需用 `.../blocks/{block_id}/descendant` 接口。

**图片三步**（顺序固定）：① children 建空图片块 `{"block_type": 27, "image": {}}` → ② `POST /open-apis/drive/v1/medias/upload_all`（multipart：`parent_type=docx_image`, `parent_node={image_block_id}`, file）拿 file_token → ③ `PATCH .../blocks/{image_block_id}` 提交 `{"replace_image": {"token": ...}}`。

**HTML 附件三步**：同构，空文件块 `{"block_type": 23, "file": {}}` + `parent_type=docx_file` + `replace_file`。

### 3. 什么都没有

输出 markdown 文件 + PNG 交给用户，说明「把 md 内容粘贴到飞书文档、图片手动拖入」。这是最后一档，正文信息依然完整。

## 故障排查

| 症状 | 处理 |
|------|------|
| 出图失败：`No module named PIL` | `pip install pillow`；不能装则降到路径 D 无图模式 |
| 出图失败：找不到中文字体 | `apt-get install fonts-wqy-zenhei` 或 `--font` 指定；报错信息里有提示 |
| snapshot.js 失败 | 十有八九是没有 Chromium——不要恋战，直接换路径 A |
| 建不了文档 | 先让 agent 列出自己实际可用的飞书工具名和参数，再对号入座选写入路径；不要假设有 block 级 API |
| 图片插不进文档 | 工具不支持图片 → 图传云空间拿链接放正文；再不行 → 无图模式 |
| 附件传不上 | HTML 存到共享位置，正文放路径/链接说明 |

## QA 清单

- 文档标题、阶段数、节点数与数据模型一致（逐项生成，勿手写）
- 图片在文档中清晰可读（PNG 过宽时 `--max-width 760` 让布局更窄更高）
- 若有附件：可下载、下载后浏览器打开可编辑
- 正文包含「可编辑交互版」的获取方式说明（附件/链接/存放位置，三选一必有）
