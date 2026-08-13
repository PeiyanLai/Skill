# 导出到飞书文档（可选步骤）

本文件是 SKILL.md「第 7 步：导出飞书文档」的实现参考。

## 核心约束与三层交付架构

**飞书文档不能执行 JavaScript**——交互 HTML（缩放、拖动、编辑）无法在文档内运行。因此导出采用三层结构，缺一不可：

| 层 | 载体 | 作用 |
|---|------|------|
| ① 结构化正文 | 飞书文档块（标题/高亮块/文本） | 阶段与节点的目的、处理逻辑，可搜索、可评论 |
| ② 流程图快照 | 高清 PNG 图片块 | 打开文档直接看到全景图 |
| ③ 交互版 HTML | 文件附件块（或内网托管链接） | 下载后浏览器打开，获得完整编辑能力 |

> 若公司有内网静态托管（把 HTML 发布成 URL），且该域名已在飞书管理后台加入 iframe 白名单，可以额外插入「内嵌网页」iframe 块直接展示交互版。这是锦上添花项，域名白名单需管理员配置，块类型支持范围以 open.feishu.cn 文档为准——默认方案不依赖它。

## 前置：优先使用内部 agent 已有的飞书工具

如果运行环境已经接入了飞书文档工具（MCP 工具、内部封装 API），**直接用这些工具**完成"建文档 → 写正文 → 传图片 → 传附件"，跳过下面的原始 OpenAPI 细节。下述原始接口流程是没有现成工具时的兜底实现。

## 第 1 步：生成快照

HTML 生成并 QA 通过后，用自带脚本产出高清 PNG：

```bash
npm i playwright-core   # 一次性
node scripts/snapshot.js {项目名}-flow.html ./out --cards
# → out/flow.png（流程图全景，视口高度按图的宽高比自适应，@2x 清晰度）
# → out/cards.png（分阶段卡片视图，可选插入）
# 离线环境：--mermaid /path/to/mermaid.min.js
# 浏览器路径：环境变量 CHROMIUM_PATH 指定
```

## 第 2 步：创建飞书文档并写入正文

原始 OpenAPI（需 tenant_access_token，权限 `docx:document` + `drive:drive`；下述块类型编号以 open.feishu.cn 最新文档为准）：

```
POST /open-apis/docx/v1/documents          # 建文档 {title, folder_token?} → document_id
POST /open-apis/docx/v1/documents/{document_id}/blocks/{document_id}/children
                                           # 根块 id 即 document_id；一次最多 50 个块
```

**推荐的文档结构**（从 `state` 数据模型直接生成）：

```
📄 {CONFIG.titleHtml 的纯文本} 
├─ 高亮块(callout)：一句话说明 + 「文末附件为可编辑交互版，下载后浏览器打开」
├─ H1 流程总览
│   └─ 图片块：flow.png
├─ H1 分阶段说明
│   ├─ H2 {phase.num} · {phase.title}（{phase.hint}）
│   │   ├─ H3 {node.title}   [分类：{TAGS[node.tag].label}]
│   │   ├─ 文本：🎯 目的：{node.purpose}
│   │   └─ 文本：⚙️ 处理逻辑：{node.logic}（多行拆成多个文本块）
│   └─ …每个阶段重复
├─ H1 交互版附件
│   ├─ 文件块：{项目名}-flow.html
│   └─ 文本：使用说明（双击节点改文字 / 拖动方框 / 连线管理 / 导出 JSON 协作）
```

文本块示例（children 数组中的一个元素）：

```json
{ "block_type": 2, "text": { "elements": [
    { "text_run": { "content": "🎯 目的：用户在商城完成对讲机硬件的购买。" } }
] } }
```

标题块用 `block_type` 3/4/5（H1/H2/H3），结构同上。高亮块（callout）带子块，需用 `.../blocks/{block_id}/descendant` 接口一次性创建嵌套结构。

## 第 3 步：插入图片（三步流程，顺序固定）

飞书 docx 插图必须"先建空块、再传素材、最后回填 token"：

```
1. children 接口创建空图片块：{ "block_type": 27, "image": {} } → 得到 image_block_id
2. POST /open-apis/drive/v1/medias/upload_all   (multipart)
     file_name=flow.png, parent_type=docx_image,
     parent_node={image_block_id}, size=..., file=<二进制>
   → 得到 file_token
3. PATCH /open-apis/docx/v1/documents/{document_id}/blocks/{image_block_id}
     { "replace_image": { "token": "{file_token}" } }
```

## 第 4 步：插入交互版 HTML 附件

与图片同构的三步，换成文件块：

```
1. children 接口创建空文件块：{ "block_type": 23, "file": {} } → file_block_id
2. medias/upload_all：parent_type=docx_file, parent_node={file_block_id}, file=<HTML 二进制>
3. PATCH 该块 { "replace_file": { "token": "{file_token}" } }
```

> 团队协作提示写进文档：编辑完的人用页面里「导出 JSON」把数据发回来，任何人「导入 JSON」即可接力编辑；改完的 HTML 也可重新上传替换附件。

## 第 5 步：QA 清单

- 文档标题、阶段数、节点数与 `state` 一致（逐项生成，勿手写）
- flow.png 在文档中清晰可读（列宽窄的文档场景可把 `--width` 降到 1440）
- 附件可下载、下载后浏览器打开可编辑
- 高亮块中的"可编辑交互版"指引存在
- 接口限频：children 批量建块一次 ≤50 块；大文档分批写入

## 生成时给 Claude 的实现建议

- 写一个一次性脚本（Python/Node 均可）串起 1–4 步，输入是 `{项目名}-flow.html` + 导出的 JSON（或直接从 HTML 的 DATA 区解析 `INITIAL`），输出飞书文档 URL
- 文档正文从**数据模型**生成而不是从 HTML 抓取——nodes/edges/phases 就是唯一事实源
- token、app_id/secret 走环境变量，不要写进脚本
