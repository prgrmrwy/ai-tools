# 第三方 Skill Marketplace 参考

本文档提供第三方Marketplace的数据获取方法，**按搜索有效性和精准度排序**。

> **验证日期**: 2026-01-24
> **验证方法**: 实际 HTTP/API 请求测试

## 搜索策略说明

**设计原则**: 优先从第三方 Marketplace 进行精准搜索，GitHub 搜索作为兜底能力放在最后，避免同名混淆。

## 搜索难度速查

| 优先级 | 来源 | 难度 | API可用 | 说明 |
|--------|------|------|---------|------|
| 1 | github.com/anthropics/skills | ⭐ 容易 | ✅ | 官方仓库，API稳定 |
| 2 | prompts.chat/skills | ⭐⭐ 最佳 | ✅ MCP | MCP API，完整内容 |
| 3 | skills.sh | ⭐⭐ 优秀 | ✅ REST | REST API + npx 安装 |
| 4 | mcpservers.org/claude-skills | ⭐ 有效 | ❌ | 结构化URL，页面抓取 |
| 5 | skillhub.club | ⭐ 有效 | ❌ | 分类浏览，页面抓取 |
| 6 | claudemarketplaces.com | ⚠️ 部分 | ❌ | 首页可访问，/skills 404 |
| 7 | skillsmp.com | ❌ 困难 | ❌ | Cloudflare 403 保护 |
| 8 | smithery.ai | ❌ 最难 | ❌ | HTTP 429 限流/安全检查点 |
| 9 | GitHub 搜索 | ⭐ 兜底 | ✅ | 放最后，避免同名混淆 |

---

## 1. 官方仓库 (github.com/anthropics/skills) ⭐ 官方

**特点**: Anthropic 官方 Skills 仓库，质量有保证

**验证状态**: ✅ HTTP 200，API 稳定

**当前 Skills** (2026-01-24):
- algorithmic-art, brand-guidelines, canvas-design, doc-coauthoring
- docx, frontend-design, internal-comms, mcp-builder
- pdf, pptx, skill-creator, slack-gif-creator
- theme-factory, web-artifacts-builder, webapp-testing, xlsx

**搜索方法**:
```bash
# 列出所有官方 skills
curl -s "https://api.github.com/repos/anthropics/skills/contents/skills" | \
  jq -r '.[] | select(.type=="dir") | .name'

# 搜索特定 skill
curl -s "https://api.github.com/repos/anthropics/skills/contents/skills" | \
  jq -r '.[] | select(.type=="dir") | .name' | grep -i "{keyword}"
```

**安装方式**:
```bash
scripts/install_skill.sh "https://github.com/anthropics/skills" ~/.claude/skills {skill-name}
```

---

## 2. Prompts.chat Skills (prompts.chat/skills) ⭐⭐ 最佳

**特点**: 社区驱动的 Skills 目录，提供 MCP API，可获取完整文件内容

**验证状态**: ✅ MCP API 正常工作，返回结构化 JSON

**URL格式**:
- 列表: `https://prompts.chat/skills`
- 搜索: `https://prompts.chat/skills?q={keyword}`
- 详情: `https://prompts.chat/prompts/{skill-id}`
- MCP: `https://prompts.chat/api/mcp`

### 方法1: MCP API (推荐) ⭐

**直接调用 MCP 端点**:
```bash
# 搜索 skills
curl -sL -X POST "https://prompts.chat/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_skills","arguments":{"query":"{skill-name}","limit":10}},"id":1}'
```

**MCP 服务器配置** (`.mcp.json`):
```json
{
  "prompts.chat": {
    "type": "http",
    "url": "https://prompts.chat/api/mcp"
  }
}
```

**可用工具**:
- `search_skills` - 搜索 skills
  - `query`: 搜索关键词
  - `limit`: 结果数量 (默认 10, 最大 50)
  - `category`: 分类过滤
  - `tag`: 标签过滤

- `get_skill` - 获取完整 skill 内容
  - `id`: skill ID
  - 返回: 所有文件内容 (SKILL.md, scripts, configs 等)

### 方法2: 页面抓取 (备用)

```bash
curl -sL -A "Mozilla/5.0" "https://prompts.chat/skills?q={keyword}" | \
  grep -oE '/prompts/[a-zA-Z0-9_-]+' | head -10
```

### 安装流程

1. 调用 `search_skills(query)` 搜索
2. 调用 `get_skill(id)` 获取所有文件
3. 创建目录 `.claude/skills/{slug}/`
4. 保存每个文件到对应位置
5. 创建 `.skill-meta.json` 记录安装信息

**发现日期**: 2026-01-24
**发现途径**: 参考 awesome-chatgpt-prompts 仓库的 Claude 插件实现

---

## 3. Skills.sh (skills.sh) ⭐⭐ 新发现

**特点**: Vercel 官方维护的 Agent Skills 目录，提供 REST API 和 npx 安装命令

**验证状态**: ✅ REST API 正常，返回完整 skills 列表

**URL格式**:
- API 列表: `https://skills.sh/api/skills`
- 页面: `https://skills.sh/{owner}/{repo}`
- 文档: `https://skills.sh/docs`

### REST API

```bash
# 获取 skills 列表 (按安装数排序)
curl -sL "https://skills.sh/api/skills"

# 返回格式示例:
# {
#   "skills": [
#     {
#       "id": "frontend-design",
#       "name": "frontend-design",
#       "installs": 11828,
#       "topSource": "anthropics/skills"
#     }
#   ],
#   "hasMore": true
# }
```

### npx skills CLI

```bash
# 安装 skill
npx skills add {owner}/{repo}
npx skills add vercel-labs/agent-skills

# 从 URL 安装
npx skills add https://github.com/anthropics/skills

# 检查更新
npx skills check

# 更新所有
npx skills update
```

**安装位置**:
- 默认: `.claude/skills/` (项目级)
- 全局: `~/.claude/skills/` (使用 `--global` 或 `-g`)

**热门 Skills** (2026-01-24 统计):
- anti-slop (66003 安装)
- vercel-react-best-practices (46196 安装)
- web-design-guidelines (34563 安装)
- frontend-design (11828 安装)

**发现日期**: 2026-01-24
**发现途径**: npx skills --help 显示的 Discover URL

---

## 4. mcpservers.org/claude-skills ⭐ 有效

**特点**: MCP 与 Skill 整合目录，有结构化的 URL 格式

**验证状态**: ✅ HTTP 200，页面可访问，有完整 skill 列表

**URL格式**:
- 列表: `https://mcpservers.org/claude-skills`
- 详情: `https://mcpservers.org/claude-skills/{owner}/{skill-name}`
  - 例: `/claude-skills/anthropic/docx`
  - 例: `/claude-skills/vercel/react-best-practices`

**包含的 Skills** (部分):
- anthropic/frontend-design, anthropic/docx, anthropic/pdf
- vercel/react-best-practices
- notion/notion-knowledge-capture
- cloudflare/building-ai-agent-on-cloudflare

**数据获取**:
```bash
# 获取 skills 列表
curl -sL -A "Mozilla/5.0" "https://mcpservers.org/claude-skills" | \
  grep -oE 'href="/claude-skills/[^"]+' | head -20

# 获取特定 skill 详情
curl -sL -A "Mozilla/5.0" "https://mcpservers.org/claude-skills/{owner}/{skill}" | \
  grep -oE 'github\.com/[^"<>\s]+'
```

**发现日期**: 2026-01-24
**发现途径**: 验证测试时发现有结构化的 skills 路径

---

## 5. SkillHub (skillhub.club) ⭐ 有效

**特点**: 7000+ AI 评估的 Skills，提供分类浏览和 Playground 试用

**验证状态**: ✅ HTTP 200，首页和详情页可访问

**URL格式**:
- 列表: `https://skillhub.club/skills`
- 详情: `https://skillhub.club/skills/{skill-slug}`
- 分类: `https://skillhub.club/skills?category={category}`
  - 分类: development, frontend, backend, data, ai-ml, productivity, writing

**注意**: 搜索页 `/search?q={keyword}` 返回 404，需要使用分类浏览或首页列表

**数据获取**:
```bash
# 获取首页 skill 列表
curl -sL -A "Mozilla/5.0" "https://skillhub.club" | \
  grep -oE 'href="/skills/[^"]+' | head -20

# 获取详情页 (包含 GitHub 链接)
curl -sL -A "Mozilla/5.0" "https://skillhub.club/skills/{skill-slug}" | \
  grep -oE 'github\.com/[^"<>\s]+'
```

**热门 Skills**:
- f-awesome-chatgpt-prompts-prompt-lookup
- langgenius-dify-component-refactoring
- oven-sh-bun-zig-system-calls
- obra-superpowers-systematic-debugging

---

## 6. claudemarketplaces.com ⚠️ 部分有效

**特点**: Claude Code plugin marketplace 目录聚合

**验证状态**: ⚠️ 首页 HTTP 200，但 /skills 返回 404

**URL格式**: `https://claudemarketplaces.com`

**数据获取** (仅首页):
```bash
curl -sL -A "Mozilla/5.0" "https://claudemarketplaces.com" | \
  grep -oE 'github\.com/[a-zA-Z0-9_/-]+' | head -10
```

**说明**: 该站点主要是聚合信息，实际搜索功能有限

---

## 7. SkillsMP (skillsmp.com) ❌ Cloudflare 保护

**特点**: 声称 71000+ agent skills，但有 Cloudflare 403 保护

**验证状态**: ❌ 所有端点返回 HTTP 403 (Cloudflare Challenge)

**URL格式**:
- 列表: `https://skillsmp.com/skills`
- API: `https://skillsmp.com/api/skills` (也被保护)

**绕过策略** (效果有限):
```bash
# curl + User-Agent (仍然可能被拦截)
curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "https://skillsmp.com/skills/{skill-name}"

# 尝试提取 npx 命令
curl -sL -A "Mozilla/5.0" "https://skillsmp.com/skills/{skill-name}" | \
  grep -oE 'npx skills add [a-zA-Z0-9_-]+'
```

**推荐方式**: 如果知道 skill 名称，直接使用 npx 安装
```bash
npx skills add {skill-name}
```

---

## 8. Smithery (smithery.ai) ❌ 限流严重

**特点**: MCP 和 Skill 聚合，支持创建自定义 Skill

**验证状态**: ❌ HTTP 429 限流 + Vercel 安全检查点

**URL格式**: `https://smithery.ai/skills?q={keyword}`

**说明**: 该站点限流严重，经常返回 429 或安全检查页面，不推荐作为主要搜索来源

---

## 9. GitHub 搜索 ⭐ 兜底

**特点**: 最大的代码托管平台，作为兜底搜索能力

**验证状态**: ✅ API 稳定

**为什么放最后**:
1. 搜索结果可能包含大量不相关项目
2. 同名项目多，容易混淆
3. 需要额外筛选才能找到真正的 Claude Skills
4. 优先使用第三方 Marketplace 获得更精准的结果

**搜索方法**:
```bash
# 搜索 claude skill 仓库
curl -s "https://api.github.com/search/repositories?q=claude+skill+{keyword}&sort=stars&order=desc&per_page=5" | \
  jq -r '.items[] | "- \(.full_name) (⭐\(.stargazers_count))\n  \(.html_url)"'

# 使用 gh CLI
gh search repos "claude skill {keyword}" --sort stars --limit 10
```

**筛选建议**:
- 优先选择星标数高的仓库
- 检查是否包含 SKILL.md 文件
- 查看仓库描述是否明确提及 Claude Code Skills

---

## Cloudflare 保护应对策略

许多 Marketplace 使用 Cloudflare 保护，以下是通用应对策略：

### 策略1: curl + 完整 User-Agent

```bash
curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  "{url}" 2>/dev/null
```

### 策略2: 直接使用 npx/CLI 工具

很多平台提供 CLI 工具，可以绕过网页保护：
```bash
npx skills add {skill-name}
```

### 策略3: 使用 MCP API

部分平台提供 MCP API，可以直接调用：
```bash
curl -sL -X POST "{mcp-endpoint}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_skills","arguments":{"query":"{keyword}"}},"id":1}'
```

---

## 安装流程决策树（按有效性排序）

```
用户请求安装 "{skill-name}"
    │
    ├─ 1. ⭐ 检查官方仓库 (github.com/anthropics/skills)
    │     curl GitHub API → 找到? → git clone 安装
    │
    ├─ 2. ⭐⭐ prompts.chat MCP API (最佳)
    │     MCP search_skills → 找到? → get_skill 获取文件 → 安装
    │
    ├─ 3. ⭐⭐ skills.sh REST API
    │     curl API → 找到? → npx skills add 安装
    │
    ├─ 4. ⭐ mcpservers.org/claude-skills
    │     页面抓取 → 找到? → 获取 GitHub 链接 → git clone
    │
    ├─ 5. ⭐ skillhub.club
    │     分类浏览 → 找到? → 获取 GitHub 链接 → git clone
    │
    ├─ 6. ⚠️ claudemarketplaces.com
    │     首页抓取 → 找到 GitHub 链接? → git clone
    │
    ├─ 7. ❌ skillsmp.com (Cloudflare 保护)
    │     npx skills add {skill-name} → 成功? → 完成
    │
    ├─ 8. ❌ smithery.ai (限流严重)
    │     可能被 429 限流，跳过或重试
    │
    ├─ 9. ⭐ GitHub 搜索 (兜底)
    │     搜索 "claude skill {keyword}" → 筛选结果 → git clone
    │
    └─ 10. 未找到
          告知用户，建议检查 skill 名称或提供直接链接
```

---

## 常见安装命令格式

| 平台 | 安装命令格式 |
|------|-------------|
| skills.sh | `npx skills add {owner}/{repo}` |
| SkillsMP | `npx skills add {skill-name}` |
| 直接 GitHub | `git clone` 后复制到 skills 目录 |

### npx skills add 工作原理

```bash
# 从 GitHub 仓库安装
npx skills add vercel-labs/agent-skills

# 从 URL 安装
npx skills add https://github.com/anthropics/skills

# 全局安装
npx skills add {source} --global
```

---

## 更新日志

### 2026-01-24 验证更新

1. **新增 skills.sh** - Vercel 官方维护，REST API 可用
2. **验证 prompts.chat MCP API** - 完全可用，返回结构化数据
3. **验证 mcpservers.org** - 发现结构化 skills 目录
4. **验证 skillhub.club** - 首页和详情页可用，搜索 404
5. **确认 skillsmp.com** - Cloudflare 全保护
6. **确认 smithery.ai** - 429 限流 + 安全检查点
7. **调整 GitHub 搜索** - 移至最后作为兜底，避免同名混淆
