# Claude Code Tools

Extension toolkit for Claude Code, including Skills, Plugins, and MCP Servers.

[中文文档](README_ZH_CN.md)

## Directory Structure

```
.
├── skills/           # Claude Code Skills
├── plugins/          # Claude Code Plugins
├── mcp-servers/      # MCP (Model Context Protocol) Servers
```

## Skills

Custom skills that extend Claude Code's command capabilities.

### skill-get

**Install skills from any source with a single command.**

A unified skill installer supporting multiple sources.

#### Quick Install

```bash
# Install to current project (recommended)
npx @prgrmrwy/install-skill-get

# Or install to user level
npx @prgrmrwy/install-skill-get --global
```

> **Design Principle**: Prioritize precise searches from third-party marketplaces, with GitHub search as a fallback to avoid name collisions.

#### Supported Data Sources (by search priority)

| Priority | Source | Effectiveness | Description |
|----------|--------|---------------|-------------|
| 1 | github.com/anthropics/skills | ⭐ Official | Official skill repository, stable API |
| 2 | prompts.chat/skills | ⭐⭐ Best | MCP API, full content retrieval |
| 3 | skills.sh | ⭐⭐ Excellent | Vercel official, REST API + npx |
| 4 | mcpservers.org/claude-skills | ⭐ Effective | Structured directory, page scraping |
| 5 | skillhub.club | ⭐ Effective | 7000+ AI-evaluated skills |
| 6 | claudemarketplaces.com | ⚠️ Partial | Homepage accessible |
| 7 | skillsmp.com | ❌ Difficult | Cloudflare protected, requires npx |
| 8 | smithery.ai/skills | ❌ Hardest | HTTP 429 rate limiting |
| 9 | GitHub Search | ⭐ Fallback | **Last resort**, avoids name collision |
| - | Direct Git/HTTP URL | - | User provides full address |
| - | Local path | - | Copy local folder |

> Data source validation date: 2026-01-24

#### Usage Examples

**Install skill (search by name)**
```
User: install playwright-testing
```
skill-get will search across 9 sources by priority, then ask for installation location (project or user level).

**Install from specific URL**
```
User: install docx from https://github.com/anthropics/skills
```

**Update installed skill**
```
User: update playwright-testing
```
Checks remote version based on installation record, downloads and installs if updates available.

**List installed skills**
```
User: list installed skills
```

**Package skill**
```
User: package skill-get
```
Packages skill directory into a `.skill` file for distribution.

**Unpack skill**
```
User: unpack my-skill.skill to ~/.claude/skills/
```

**Get help**
```
User: skill-get help
```
Shows supported commands, search order, and configuration options.

#### Custom Search Order

Edit `~/.claude/skill-get-config.json` to customize marketplace search priority:

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

> **Recommendation**: Keep `github-search` last as a fallback to avoid name collisions.

#### Installation Locations

| Type | Path | Description |
|------|------|-------------|
| User-level | `~/.claude/skills/` | Available to all projects |
| Project-level | `.claude/skills/` | Only for current project |

## Plugins

Plugin system to enhance Claude Code functionality.

## MCP Servers

MCP servers that provide Claude with external tool and resource access capabilities.
