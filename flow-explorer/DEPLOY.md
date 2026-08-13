# flow-explorer 接入公司内部 Agent 指南

本 skill 已通过官方 skill 格式校验（`SKILL.md` frontmatter + `references/` + `assets/` 结构），可直接接入任何支持 Anthropic Agent Skills 的平台。按你们内部 agent 的形态选择对应方式。

## 方式一：claude.ai / Claude Cowork（最简单，适合个人试用）

把打包好的 `flow-explorer.skill` 文件发到 Claude 对话里，文件卡片上会出现 **Save skill** 按钮（组织开启了 skill 创建权限时），点击即安装到个人 profile。

重新打包命令（skill 内容更新后）：

```bash
# 在 skill-creator 目录下
python -m scripts.package_skill /path/to/flow-explorer
```

## 方式二：Claude Code（团队仓库级共享，推荐）

Claude Code 会自动发现仓库里 `.claude/skills/` 下的 skill。把本目录复制到团队各业务仓库：

```bash
mkdir -p .claude/skills
cp -r flow-explorer .claude/skills/flow-explorer
git add .claude/skills && git commit -m "add flow-explorer skill"
```

之后团队成员在该仓库里对 Claude 说「画个交互流程图」即可触发；也可复制到个人目录 `~/.claude/skills/flow-explorer/` 全局生效。

> ⚠️ 注意：本仓库中 skill 位于根目录 `flow-explorer/`，这个位置**不会**被自动发现——必须放在 `.claude/skills/flow-explorer/` 才会加载。

## 方式三：Skills API（组织级，供 API 构建的内部 agent 使用）

把 skill 上传为组织的自定义 skill（beta 头 `skills-2025-10-02`），得到 `skill_id` 后可在两类 API agent 中引用：

```python
import anthropic
client = anthropic.Anthropic()

# 上传（zip 即 flow-explorer.skill 文件；具体字段见官方文档
# https://platform.claude.com/docs/en/agents-and-tools/skills）
skill = client.beta.skills.create(...)   # → skill_id: "skill_abc123"
```

**3a. Messages API + 代码执行容器**（内部 agent 直接调 `/v1/messages` 的场景）：

```python
response = client.beta.messages.create(
    model="claude-opus-5",
    max_tokens=16000,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={"skills": [
        {"type": "custom", "skill_id": "skill_abc123", "version": "latest"},
    ]},
    tools=[{"type": "code_execution_20260521", "name": "code_execution"}],
    messages=[{"role": "user", "content": "根据这份需求文档画个交互流程图：……"}],
)
# 生成的 HTML 在容器里，响应携带 file_id，用 Files API 下载：
# client.beta.files.download(file_id)
```

**3b. Managed Agents**（内部 agent 用 Anthropic 托管的 agent/session 架构）：

```python
agent = client.beta.agents.create(
    name="流程图助手",
    model="claude-opus-5",
    skills=[{"type": "custom", "skill_id": "skill_abc123", "version": "latest"}],
    tools=[{"type": "agent_toolset_20260401"}],
)
# 之后每次任务 sessions.create(agent=agent.id, environment_id=...)
```

> Managed Agents 还有一条零上传路径：session 挂载 GitHub 仓库时，会自动扫描仓库根目录 `.claude/skills/` 下的 skill（仅 cloud 沙箱、session 启动时扫描一次）。做好方式二的目录布局后，挂载仓库即自动获得本 skill。

## 方式四：Claude Agent SDK（自研 harness 的内部 agent）

Claude Agent SDK（`claude-agent-sdk` / `@anthropic-ai/claude-agent-sdk`）复用 Claude Code 的 skill 发现机制：把 skill 放到 agent 工作目录的 `.claude/skills/flow-explorer/`，SDK 启动时自动加载。文档：https://code.claude.com/docs/en/agent-sdk

## 注意事项

- **QA 步骤按环境降级**：SKILL.md 第 6 步要求无头浏览器验证。Claude Code / Agent SDK 环境有浏览器可完整执行；Messages API 代码执行容器没有浏览器，该步骤退化为 `node --check` 语法校验 + 人工在本地浏览器打开验收。
- **产物依赖 CDN**：生成的 HTML 通过 CDN 加载 mermaid，接收方需联网打开；内网隔离环境可把 `mermaid.min.js` 内联进文件。
- **版本更新**：skill 内容迭代后，方式二直接 git 更新即可；方式三需要 `client.beta.skills.versions.create(...)` 发新版本（引用 `"version": "latest"` 的 agent 自动拿到新版）。
