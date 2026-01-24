# Claude Code Tools

Claude Code 扩展工具集，包含 Skills、Plugins 和 MCP Servers。

[English](README.md)

## 目录结构

```
.
├── skills/           # Claude Code Skills
├── plugins/          # Claude Code Plugins
├── mcp-servers/      # MCP (Model Context Protocol) Servers
```

## Skills

自定义技能，扩展 Claude Code 的命令能力。

### skill-get

**一句话从任意来源安装 Skill 到本地。**

统一的 Skill 安装器，支持多种来源。

#### 快速安装

```bash
# 安装到当前项目（推荐）
npx @prgrmrwy/install-skill-get

# 或安装到用户级别
npx @prgrmrwy/install-skill-get --global
```

> **设计原则**: 优先从第三方 Marketplace 进行精准搜索，GitHub 搜索作为兜底能力放在最后，避免同名混淆。

#### 支持的数据源（按搜索优先级排序）

| 优先级 | 来源 | 有效性 | 说明 |
|--------|------|--------|------|
| 1 | github.com/anthropics/skills | ⭐ 官方 | 官方 Skill 仓库，API 稳定 |
| 2 | prompts.chat/skills | ⭐⭐ 最佳 | MCP API，可获取完整内容 |
| 3 | skills.sh | ⭐⭐ 优秀 | Vercel 官方，REST API + npx |
| 4 | mcpservers.org/claude-skills | ⭐ 有效 | 结构化目录，页面抓取 |
| 5 | skillhub.club | ⭐ 有效 | 7000+ AI 评估的 Skills |
| 6 | claudemarketplaces.com | ⚠️ 部分 | 首页可访问 |
| 7 | skillsmp.com | ❌ 困难 | Cloudflare 保护，需 npx |
| 8 | smithery.ai/skills | ❌ 最难 | HTTP 429 限流严重 |
| 9 | GitHub 搜索 | ⭐ 兜底 | **放最后**，避免同名混淆 |
| - | 直接 Git/HTTP URL | - | 用户提供完整地址 |
| - | 本地路径 | - | 复制本地文件夹 |

> 数据源验证日期: 2026-01-24

#### 用法示例

**安装 Skill（按名称搜索）**
```
用户: 安装 playwright-testing
```
skill-get 会按优先级在 9 个来源中搜索，找到后询问安装位置（项目级或用户级）。

**从指定地址安装**
```
用户: 安装 https://github.com/anthropics/skills 中的 docx
```

**更新已安装的 Skill**
```
用户: 更新 playwright-testing
```
根据安装记录检查远程版本，如有更新则下载安装。

**列出已安装的 Skills**
```
用户: 列出已安装的 skills
```

**打包 Skill**
```
用户: 打包 skill-get
```
将 skill 目录打包为 `.skill` 文件，方便分发。

**解包 Skill**
```
用户: 解包 my-skill.skill 到 ~/.claude/skills/
```

**获取帮助**
```
用户: skill-get help
```
显示支持的命令、搜索顺序和配置说明。

#### 自定义搜索顺序

编辑 `~/.claude/skill-get-config.json` 可自定义 marketplace 搜索优先级：

```json
{
  "marketplaces": [
    "github.com/anthropics/skills",
    "prompts.chat/skills",
    "skills.sh",
    "mcpservers.org/claude-skills",
    "skillhub.club",
    "claudemarketplaces.com",
    "skillsmp.com",
    "smithery.ai/skills",
    "github-search"
  ]
}
```

> **建议**: 将 `github-search` 放在最后作为兜底，避免同名项目混淆。

#### 安装位置

| 类型 | 路径 | 说明 |
|------|------|------|
| 用户级 | `~/.claude/skills/` | 所有项目可用 |
| 项目级 | `.claude/skills/` | 仅当前项目可用 |

## Plugins

插件系统，增强 Claude Code 功能。

## MCP Servers

MCP 服务器，为 Claude 提供外部工具和资源访问能力。
