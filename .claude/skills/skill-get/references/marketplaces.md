# Third-Party Skill Marketplace Reference

This document provides data retrieval methods for third-party marketplaces, **sorted by search effectiveness and precision**.

[中文文档](marketplaces_ZH_CN.md)

> **Validation Date**: 2026-01-24
> **Validation Method**: Actual HTTP/API request testing

## Search Strategy

**Design Principle**: Prioritize precise searches from third-party marketplaces, with GitHub search as a fallback to avoid name collisions.

## Search Difficulty Quick Reference

| Priority | Source | Difficulty | API Available | Description |
|----------|--------|------------|---------------|-------------|
| 1 | github.com/anthropics/skills | ⭐ Easy | ✅ | Official repository, stable API |
| 2 | prompts.chat/skills | ⭐⭐ Best | ✅ MCP | MCP API, full content |
| 3 | skills.sh | ⭐⭐ Excellent | ✅ REST | REST API + npx install |
| 4 | mcpservers.org/claude-skills | ⭐ Effective | ❌ | Structured URL, page scraping |
| 5 | skillhub.club | ⭐ Effective | ❌ | Category browsing, page scraping |
| 6 | claudemarketplaces.com | ⚠️ Partial | ❌ | Homepage accessible, /skills 404 |
| 7 | skillsmp.com | ❌ Difficult | ❌ | Cloudflare 403 protected |
| 8 | smithery.ai | ❌ Hardest | ❌ | HTTP 429 rate limiting/security checkpoint |
| 9 | GitHub Search | ⭐ Fallback | ✅ | Last resort, avoids name collision |

---

## 1. Official Repository (github.com/anthropics/skills) ⭐ Official

**Features**: Anthropic official Skills repository, quality guaranteed

**Validation Status**: ✅ HTTP 200, stable API

**Current Skills** (2026-01-24):
- algorithmic-art, brand-guidelines, canvas-design, doc-coauthoring
- docx, frontend-design, internal-comms, mcp-builder
- pdf, pptx, skill-creator, slack-gif-creator
- theme-factory, web-artifacts-builder, webapp-testing, xlsx

**Search Method**:
```bash
# List all official skills
curl -s "https://api.github.com/repos/anthropics/skills/contents/skills" | \
  jq -r '.[] | select(.type=="dir") | .name'

# Search specific skill
curl -s "https://api.github.com/repos/anthropics/skills/contents/skills" | \
  jq -r '.[] | select(.type=="dir") | .name' | grep -i "{keyword}"
```

**Installation**:
```bash
scripts/install_skill.sh "https://github.com/anthropics/skills" ~/.claude/skills {skill-name}
```

---

## 2. Prompts.chat Skills (prompts.chat/skills) ⭐⭐ Best

**Features**: Community-driven Skills directory, provides MCP API with full file content retrieval

**Validation Status**: ✅ MCP API working, returns structured JSON

**URL Formats**:
- List: `https://prompts.chat/skills`
- Search: `https://prompts.chat/skills?q={keyword}`
- Details: `https://prompts.chat/prompts/{skill-id}`
- MCP: `https://prompts.chat/api/mcp`

### Method 1: MCP API (Recommended) ⭐

**Direct MCP endpoint call**:
```bash
# Search skills
curl -sL -X POST "https://prompts.chat/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_skills","arguments":{"query":"{skill-name}","limit":10}},"id":1}'
```

**MCP Server Configuration** (`.mcp.json`):
```json
{
  "prompts.chat": {
    "type": "http",
    "url": "https://prompts.chat/api/mcp"
  }
}
```

**Available Tools**:
- `search_skills` - Search skills
  - `query`: Search keyword
  - `limit`: Result count (default 10, max 50)
  - `category`: Category filter
  - `tag`: Tag filter

- `get_skill` - Get complete skill content
  - `id`: skill ID
  - Returns: All file contents (SKILL.md, scripts, configs, etc.)

### Method 2: Page Scraping (Backup)

```bash
curl -sL -A "Mozilla/5.0" "https://prompts.chat/skills?q={keyword}" | \
  grep -oE '/prompts/[a-zA-Z0-9_-]+' | head -10
```

### Installation Flow

1. Call `search_skills(query)` to search
2. Call `get_skill(id)` to get all files
3. Create directory `.claude/skills/{slug}/`
4. Save each file to corresponding location
5. Create `.skill-meta.json` to record installation info

**Discovery Date**: 2026-01-24
**Discovery Method**: Referenced awesome-chatgpt-prompts repository Claude plugin implementation

---

## 3. Skills.sh (skills.sh) ⭐⭐ New Discovery

**Features**: Vercel official Agent Skills directory, provides REST API and npx installation

**Validation Status**: ✅ REST API working, returns complete skills list

**URL Formats**:
- API List: `https://skills.sh/api/skills`
- Page: `https://skills.sh/{owner}/{repo}`
- Docs: `https://skills.sh/docs`

### REST API

```bash
# Get skills list (sorted by installs)
curl -sL "https://skills.sh/api/skills"

# Response format example:
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
# Install skill
npx skills add {owner}/{repo}
npx skills add vercel-labs/agent-skills

# Install from URL
npx skills add https://github.com/anthropics/skills

# Check updates
npx skills check

# Update all
npx skills update
```

**Installation Locations**:
- Default: `.claude/skills/` (project-level)
- Global: `~/.claude/skills/` (use `--global` or `-g`)

**Popular Skills** (2026-01-24 stats):
- anti-slop (66003 installs)
- vercel-react-best-practices (46196 installs)
- web-design-guidelines (34563 installs)
- frontend-design (11828 installs)

**Discovery Date**: 2026-01-24
**Discovery Method**: npx skills --help Discover URL

---

## 4. mcpservers.org/claude-skills ⭐ Effective

**Features**: MCP and Skill integrated directory with structured URL format

**Validation Status**: ✅ HTTP 200, page accessible, complete skill list

**URL Formats**:
- List: `https://mcpservers.org/claude-skills`
- Details: `https://mcpservers.org/claude-skills/{owner}/{skill-name}`
  - e.g.: `/claude-skills/anthropic/docx`
  - e.g.: `/claude-skills/vercel/react-best-practices`

**Included Skills** (partial):
- anthropic/frontend-design, anthropic/docx, anthropic/pdf
- vercel/react-best-practices
- notion/notion-knowledge-capture
- cloudflare/building-ai-agent-on-cloudflare

**Data Retrieval**:
```bash
# Get skills list
curl -sL -A "Mozilla/5.0" "https://mcpservers.org/claude-skills" | \
  grep -oE 'href="/claude-skills/[^"]+' | head -20

# Get specific skill details
curl -sL -A "Mozilla/5.0" "https://mcpservers.org/claude-skills/{owner}/{skill}" | \
  grep -oE 'github\.com/[^"<>\s]+'
```

**Discovery Date**: 2026-01-24
**Discovery Method**: Found structured skills path during validation testing

---

## 5. SkillHub (skillhub.club) ⭐ Effective

**Features**: 7000+ AI-evaluated Skills, category browsing and Playground trial

**Validation Status**: ✅ HTTP 200, homepage and detail pages accessible

**URL Formats**:
- List: `https://skillhub.club/skills`
- Details: `https://skillhub.club/skills/{skill-slug}`
- Categories: `https://skillhub.club/skills?category={category}`
  - Categories: development, frontend, backend, data, ai-ml, productivity, writing

**Note**: Search page `/search?q={keyword}` returns 404, use category browsing or homepage list

**Data Retrieval**:
```bash
# Get homepage skill list
curl -sL -A "Mozilla/5.0" "https://skillhub.club" | \
  grep -oE 'href="/skills/[^"]+' | head -20

# Get detail page (contains GitHub links)
curl -sL -A "Mozilla/5.0" "https://skillhub.club/skills/{skill-slug}" | \
  grep -oE 'github\.com/[^"<>\s]+'
```

**Popular Skills**:
- f-awesome-chatgpt-prompts-prompt-lookup
- langgenius-dify-component-refactoring
- oven-sh-bun-zig-system-calls
- obra-superpowers-systematic-debugging

---

## 6. claudemarketplaces.com ⚠️ Partially Effective

**Features**: Claude Code plugin marketplace directory aggregator

**Validation Status**: ⚠️ Homepage HTTP 200, but /skills returns 404

**URL Format**: `https://claudemarketplaces.com`

**Data Retrieval** (homepage only):
```bash
curl -sL -A "Mozilla/5.0" "https://claudemarketplaces.com" | \
  grep -oE 'github\.com/[a-zA-Z0-9_/-]+' | head -10
```

**Note**: This site mainly aggregates information, limited actual search functionality

---

## 7. SkillsMP (skillsmp.com) ❌ Cloudflare Protected

**Features**: Claims 71000+ agent skills, but Cloudflare 403 protected

**Validation Status**: ❌ All endpoints return HTTP 403 (Cloudflare Challenge)

**URL Formats**:
- List: `https://skillsmp.com/skills`
- API: `https://skillsmp.com/api/skills` (also protected)

**Bypass Strategy** (limited effectiveness):
```bash
# curl + User-Agent (may still be blocked)
curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "https://skillsmp.com/skills/{skill-name}"

# Try to extract npx command
curl -sL -A "Mozilla/5.0" "https://skillsmp.com/skills/{skill-name}" | \
  grep -oE 'npx skills add [a-zA-Z0-9_-]+'
```

**Recommended**: If skill name is known, install directly with npx
```bash
npx skills add {skill-name}
```

---

## 8. Smithery (smithery.ai) ❌ Heavy Rate Limiting

**Features**: MCP and Skill aggregator, supports custom Skill creation

**Validation Status**: ❌ HTTP 429 rate limiting + Vercel security checkpoint

**URL Format**: `https://smithery.ai/skills?q={keyword}`

**Note**: This site has severe rate limiting, frequently returns 429 or security check pages, not recommended as primary search source

---

## 9. GitHub Search ⭐ Fallback

**Features**: Largest code hosting platform, used as fallback search capability

**Validation Status**: ✅ API stable

**Why Last**:
1. Search results may contain many irrelevant projects
2. Many projects with same name, easy to confuse
3. Requires extra filtering to find actual Claude Skills
4. Prioritize third-party marketplaces for more precise results

**Search Method**:
```bash
# Search claude skill repositories
curl -s "https://api.github.com/search/repositories?q=claude+skill+{keyword}&sort=stars&order=desc&per_page=5" | \
  jq -r '.items[] | "- \(.full_name) (⭐\(.stargazers_count))\n  \(.html_url)"'

# Use gh CLI
gh search repos "claude skill {keyword}" --sort stars --limit 10
```

**Filtering Suggestions**:
- Prioritize repositories with high star counts
- Check if SKILL.md file exists
- Review repository description for explicit Claude Code Skills mention

---

## Cloudflare Protection Strategies

Many marketplaces use Cloudflare protection, here are general strategies:

### Strategy 1: curl + Full User-Agent

```bash
curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  "{url}" 2>/dev/null
```

### Strategy 2: Use npx/CLI Tools Directly

Many platforms provide CLI tools that bypass web protection:
```bash
npx skills add {skill-name}
```

### Strategy 3: Use MCP API

Some platforms provide MCP API, call directly:
```bash
curl -sL -X POST "{mcp-endpoint}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_skills","arguments":{"query":"{keyword}"}},"id":1}'
```

---

## Installation Flow Decision Tree (sorted by effectiveness)

```
User requests install "{skill-name}"
    │
    ├─ 1. ⭐ Check official repository (github.com/anthropics/skills)
    │     curl GitHub API → Found? → git clone install
    │
    ├─ 2. ⭐⭐ prompts.chat MCP API (Best)
    │     MCP search_skills → Found? → get_skill files → install
    │
    ├─ 3. ⭐⭐ skills.sh REST API
    │     curl API → Found? → npx skills add install
    │
    ├─ 4. ⭐ mcpservers.org/claude-skills
    │     Page scraping → Found? → Get GitHub link → git clone
    │
    ├─ 5. ⭐ skillhub.club
    │     Category browsing → Found? → Get GitHub link → git clone
    │
    ├─ 6. ⚠️ claudemarketplaces.com
    │     Homepage scraping → Found GitHub link? → git clone
    │
    ├─ 7. ❌ skillsmp.com (Cloudflare protected)
    │     npx skills add {skill-name} → Success? → Done
    │
    ├─ 8. ❌ smithery.ai (Heavy rate limiting)
    │     May be 429 rate limited, skip or retry
    │
    ├─ 9. ⭐ GitHub Search (Fallback)
    │     Search "claude skill {keyword}" → Filter results → git clone
    │
    └─ 10. Not found
          Inform user, suggest checking skill name or provide direct link
```

---

## Common Installation Command Formats

| Platform | Installation Command |
|----------|---------------------|
| skills.sh | `npx skills add {owner}/{repo}` |
| SkillsMP | `npx skills add {skill-name}` |
| Direct GitHub | `git clone` then copy to skills directory |

### npx skills add Explained

```bash
# Install from GitHub repository
npx skills add vercel-labs/agent-skills

# Install from URL
npx skills add https://github.com/anthropics/skills

# Global install
npx skills add {source} --global
```

---

## Changelog

### 2026-01-24 Validation Update

1. **Added skills.sh** - Vercel official, REST API available
2. **Validated prompts.chat MCP API** - Fully functional, returns structured data
3. **Validated mcpservers.org** - Found structured skills directory
4. **Validated skillhub.club** - Homepage and detail pages work, search 404
5. **Confirmed skillsmp.com** - Full Cloudflare protection
6. **Confirmed smithery.ai** - 429 rate limiting + security checkpoint
7. **Adjusted GitHub Search** - Moved to last as fallback, avoids name collision
