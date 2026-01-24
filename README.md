# Claude Code Tools

Claude Code 扩展工具集，包含 Skills、Plugins 和 MCP Servers。

## 目录结构

```
.
├── skills/           # Claude Code Skills
├── plugins/          # Claude Code Plugins
├── mcp-servers/      # MCP (Model Context Protocol) Servers
└── skill-get.skill   # skill-get 的可分发打包文件
```

## Skills

自定义技能，扩展 Claude Code 的命令能力。

### skill-get

**一句话从任意来源安装 Skill 到本地。**

统一的 Skill 安装器，支持多种来源：

| 来源 | 说明 |
|------|------|
| github.com/anthropics/skills | 官方 Skill 仓库 |
| skillsmp.com | 71000+ agent skills |
| prompts.chat/skills | Prompts.chat Skills 目录 |
| skillhub.club | 7000+ AI 评估的 Skills |
| smithery.ai/skills | MCP 和 Skill 聚合 |
| GitHub 搜索 | 按 Star 排序搜索公开仓库 |
| 直接 Git/HTTP URL | 用户提供完整地址 |
| 本地路径 | 复制本地文件夹 |

#### 用法示例

**安装 Skill（按名称搜索）**
```
用户: 安装 playwright-testing
```
skill-get 会按优先级在各来源搜索，找到后询问安装位置（项目级或用户级）。

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
    "skillsmp.com",
    "skillhub.club"
  ]
}
```

#### 安装位置

| 类型 | 路径 | 说明 |
|------|------|------|
| 用户级 | `~/.claude/skills/` | 所有项目可用 |
| 项目级 | `.claude/skills/` | 仅当前项目可用 |

## Plugins

插件系统，增强 Claude Code 功能。

## MCP Servers

MCP 服务器，为 Claude 提供外部工具和资源访问能力。
