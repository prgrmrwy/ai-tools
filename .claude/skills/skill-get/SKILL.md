---
name: skill-get
description: Unified installer for Claude Code Skills from multiple sources. Triggered when users request to install skills, search for skills, list installed skills, update skills, query supported marketplaces/sources, skill-get help, package skills, compile skills, or mention skill names/URLs. Supports: (1) Official repository github.com/anthropics/skills, (2) Third-party marketplaces (skillsmp.com, prompts.chat, skillhub.club, smithery.ai, etc.), (3) GitHub search, (4) Direct Git/HTTP URLs, (5) Local paths, (6) Packaging skills as .skill files, (7) Updating installed skills.
---

## Language Preference / 语言偏好

**IMPORTANT**: Detect user's language preference and respond accordingly.

| User Language | Response Language | Reference Document |
|---------------|-------------------|-------------------|
| Chinese (中文) | Chinese | [SKILL_ZH_CN.md](SKILL_ZH_CN.md) |
| English | English | This document |
| Other | Match user's language | This document (adapt) |

**Detection methods**:
1. User's message language (highest priority)
2. Previous conversation language
3. System locale if available

**Example**:
- User says "安装 playwright" → Respond in Chinese, use Chinese prompts
- User says "install playwright" → Respond in English, use English prompts

---

# Skill Get

Install skills from any source with a single command.

[中文文档](SKILL_ZH_CN.md)

## Installation Locations

| Type | Path | Description |
|------|------|-------------|
| User-level | `~/.claude/skills/` | Available to all projects |
| Project-level | `.claude/skills/` | Only for current project |

Prompts user to choose installation location by default.

## Workflows

### Scenario A: User provides explicit address

Execute installation directly:

```bash
# Git repository
scripts/install_skill.sh "https://github.com/anthropics/skills" ~/.claude/skills docx

# HTTP URL (SKILL.md)
scripts/install_skill.sh "https://example.com/skill/SKILL.md" ~/.claude/skills/my-skill

# Local path
scripts/install_skill.sh /path/to/skill ~/.claude/skills
```

### Scenario B: User provides only skill name

Search and install by priority.

#### ⚠️ Search Constraints (must follow)

1. **Search strictly in priority order**: Must search from priority 1 through 9 in sequence, no skipping
2. **Never skip any source**: Even if a source is unlikely to have results, must execute the search
3. **Show search progress in real-time**: Display the current source name being searched to the user
4. **Stop on first match**: Once a match is found in any source, stop searching and show results
5. **Report "not found" only after all searches**: Only report "not found" after all 9 sources have been searched
6. **GitHub search as fallback**: GitHub search is last (step 9), prioritize third-party marketplaces for precise results

#### Search Progress Display Format

```
🔍 Searching for "skill-name"...

[1/9] Searching github.com/anthropics/skills ... ❌ Not found
[2/9] Searching prompts.chat (MCP API) ... ✅ Match found!
```

> **Note**: GitHub search is at step 9 (last) as a fallback to avoid name collisions.

#### Search Steps (sorted by effectiveness, GitHub as fallback)

> **Design Principle**: Prioritize precise searches from third-party marketplaces, with GitHub search as a fallback to avoid name collisions.

**Step 1/9: Official Repository (github.com/anthropics/skills)** ⭐ Official priority
```bash
echo "[1/9] Searching github.com/anthropics/skills ..."
curl -s "https://api.github.com/repos/anthropics/skills/contents/skills" | jq -r '.[] | select(.type=="dir") | .name' | grep -i "{keyword}"
```

**Step 2/9: Prompts.chat Skills (prompts.chat/skills)** ⭐⭐ Best MCP API

prompts.chat provides MCP API, **prioritize using MCP tools**:

**Method 1: MCP API (Recommended)**

Call MCP endpoint directly:
```bash
echo "[2/9] Searching prompts.chat (MCP API) ..."
curl -sL -X POST "https://prompts.chat/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_skills","arguments":{"query":"{skill-name}","limit":10}},"id":1}'
```

If MCP server is configured (`prompts.chat: https://prompts.chat/api/mcp`), use:
- `search_skills` - Search skills
- `get_skill` - Get complete skill content (including all files)

```
# Search
search_skills(query="{skill-name}", limit=10)

# Get complete content
get_skill(id="{skill-id}")
```

**Method 2: Page Scraping (Backup)**
```bash
curl -sL -A "Mozilla/5.0" "https://prompts.chat/skills?q={skill-name}" | grep -oE '/prompts/[a-zA-Z0-9_-]+'
```

**Installation Flow**:
1. Call `get_skill(id)` to get all file contents
2. Create directory `.claude/skills/{slug}/`
3. Save SKILL.md and other files to corresponding locations

**Step 3/9: Skills.sh (skills.sh)** ⭐⭐ REST API + npx

Vercel official Agent Skills directory:
```bash
echo "[3/9] Searching skills.sh ..."
# REST API to get skills list
curl -sL "https://skills.sh/api/skills" | jq -r '.skills[] | select(.name | test("{keyword}"; "i")) | "\(.name) (⭐\(.installs)) - \(.topSource)"'
```

**Installation**:
```bash
npx skills add {owner}/{repo}
npx skills add vercel-labs/agent-skills
```

**Step 4/9: mcpservers.org/claude-skills** ⭐ Structured directory
```bash
echo "[4/9] Searching mcpservers.org/claude-skills ..."
curl -sL -A "Mozilla/5.0" "https://mcpservers.org/claude-skills" | grep -oE 'href="/claude-skills/[^"]+' | grep -i "{keyword}"
```

**Step 5/9: SkillHub (skillhub.club)** ⭐ Category browsing
```bash
echo "[5/9] Searching skillhub.club ..."
curl -sL -A "Mozilla/5.0" "https://skillhub.club" | grep -oE 'href="/skills/[^"]+' | grep -i "{keyword}"
```

**Step 6/9: Claude Marketplaces (claudemarketplaces.com)** ⚠️ Partially available
```bash
echo "[6/9] Searching claudemarketplaces.com ..."
curl -sL -A "Mozilla/5.0" "https://claudemarketplaces.com" | grep -oE 'github\.com/[a-zA-Z0-9_/-]+'
```

**Step 7/9: SkillsMP (skillsmp.com)** ❌ Cloudflare protected

Cloudflare 403 protected, prioritize direct npx installation:
```bash
echo "[7/9] Searching skillsmp.com ..."
# Try npx installation directly (no search needed)
npx skills add {skill-name}

# Or curl probe (may be blocked)
curl -sL -A "Mozilla/5.0" "https://skillsmp.com/skills/{skill-name}" | grep -oE 'npx skills add [a-zA-Z0-9_-]+'
```

**Step 8/9: Smithery (smithery.ai/skills)** ❌ Heavy rate limiting
```bash
echo "[8/9] Searching smithery.ai/skills ..."
# Note: This site has severe HTTP 429 rate limiting, may fail
curl -sL -A "Mozilla/5.0" "https://smithery.ai/skills/{skill-name}" | grep -oE 'github\.com/[a-zA-Z0-9_/-]+'
```

**Step 9/9: GitHub Search (Fallback)** ⭐ Last search, avoids name collision
```bash
echo "[9/9] Searching GitHub (fallback) ..."
curl -s "https://api.github.com/search/repositories?q=claude+skill+{keyword}&sort=stars&per_page=5" | jq -r '.items[] | "\(.full_name) ⭐\(.stargazers_count)"'
```

> **Note**: GitHub search is last because search results may contain many irrelevant projects with name collisions. Searching third-party marketplaces first yields more precise results.

See [references/marketplaces.md](references/marketplaces.md) for details.

Show results after finding, confirm before installing.

### Scenario C: List Installed Skills

```bash
scripts/list_skills.sh
```

### Scenario D: Query Supported Marketplaces / skill-get help

When user asks "which marketplaces are supported", "what skill sources exist", "skill-get help", etc., show supported sources list and configuration:

#### Default Search Order (sorted by effectiveness, GitHub as fallback)

| Priority | Source | Effectiveness | Description |
|----------|--------|---------------|-------------|
| 1 | github.com/anthropics/skills | ⭐ Official | Official skill repository, stable API |
| 2 | prompts.chat/skills | ⭐⭐ Best | MCP API, full content retrieval |
| 3 | skills.sh | ⭐⭐ Excellent | Vercel official, REST API + npx |
| 4 | mcpservers.org/claude-skills | ⭐ Effective | Structured directory, page scraping |
| 5 | skillhub.club | ⭐ Effective | Category browsing, page scraping |
| 6 | claudemarketplaces.com | ⚠️ Partial | Homepage accessible, /skills 404 |
| 7 | skillsmp.com | ❌ Difficult | Cloudflare 403 protected, requires npx |
| 8 | smithery.ai/skills | ❌ Hardest | HTTP 429 rate limiting |
| 9 | GitHub Search | ⭐ Fallback | **Last**, avoids name collision |
| - | Direct Git/HTTP URL | - | User provides full address |
| - | Local path | - | Copy local folder |

#### Custom Search Order

Users can customize marketplace search order in `~/.claude/skill-get-config.json`:

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

> **Note**: `github-search` should be last as a fallback.

**Notes**:
- Array order determines search priority
- Remove an item to skip that source
- `github-search` represents GitHub public repository search
- Direct URLs and local paths are always supported, no configuration needed

Read configuration:
```bash
cat ~/.claude/skill-get-config.json 2>/dev/null || echo "Using default configuration"
```

### Scenario E: Update Skill

When user says "update skill", "upgrade skill", etc., check and update specified skill based on installation record.

**Important**: User **must** specify the skill name to update.

#### Installation Record File

When installing a skill, automatically generate `.skill-meta.json` in the installation directory:

```json
{
  "name": "playwright-testing",
  "installed_at": "2025-01-24T12:00:00Z",
  "source": {
    "type": "git",
    "url": "https://github.com/anthropics/skills",
    "path": "skills/playwright-testing",
    "commit": "abc1234",
    "branch": "main"
  },
  "marketplace": "github.com/anthropics/skills"
}
```

**Source types**:
- `git`: Git repository, records commit hash
- `npm`: npx installation, records version number
- `http`: HTTP URL, records ETag or Last-Modified
- `local`: Local path, records file modification time

#### Update Flow

```bash
# User must specify skill name
User: update playwright-testing
```

**Step 1**: Read installation record
```bash
cat ~/.claude/skills/playwright-testing/.skill-meta.json
# or
cat .claude/skills/playwright-testing/.skill-meta.json
```

**Step 2**: Check remote version
```bash
# Git repository: get latest commit
git ls-remote {url} {branch} | cut -f1

# npm: check latest version
npm view {package-name} version
```

**Step 3**: Compare versions
- If remote commit/version matches local record: prompt "Already up to date"
- If different: show update content, confirm before updating

**Step 4**: Execute update
```bash
# Backup current version (optional)
cp -r {skill-path} {skill-path}.bak

# Reinstall
scripts/install_skill.sh {source-url} {install-path} {skill-name}

# Update commit/version in record file
```

#### Batch Update Check

```bash
# List all updatable skills
User: check all skill updates

AI: Checking installed skills...

| Skill | Current Version | Latest Version | Status |
|-------|-----------------|----------------|--------|
| playwright-testing | abc1234 | def5678 | Updatable |
| docx-converter | v1.0.0 | v1.0.0 | Up to date |
| my-local-skill | - | - | Local install, skip |
```

### Scenario F: Package Skill

When user says "package skill", "compile skill", "generate .skill file", etc., package skill directory into distributable .skill file.

```bash
python3 scripts/package_skill.py pack <skill-folder> [output-directory]
```

**Examples**:
```bash
# Package skill-get, output to current directory
python3 scripts/package_skill.py pack .claude/skills/skill-get

# Package to specified directory
python3 scripts/package_skill.py pack .claude/skills/skill-get ./dist
```

**Output**: `<skill-name>.skill` file (zip format)

Auto-validates before packaging:
- SKILL.md exists
- YAML frontmatter format is correct
- name and description fields exist

#### .skillignore Support

Create `.skillignore` file in skill directory to exclude files from packaging:

```
# .skillignore example
*.log
*.tmp
tests/
node_modules/
.env
```

**Default ignores** (no configuration needed):
- `.git/`, `__pycache__/`, `*.pyc`, `*.pyo`
- `.DS_Store`, `Thumbs.db`
- `.skillignore` itself

### Scenario G: Unpack Skill

When user says "unpack skill", "extract skill", "extract .skill file", etc., extract .skill file to specified directory.

```bash
python3 scripts/package_skill.py unpack <skill-file> [output-directory]
```

**Examples**:
```bash
# Unpack to current directory
python3 scripts/package_skill.py unpack my-skill.skill

# Unpack to skills directory
python3 scripts/package_skill.py unpack my-skill.skill ~/.claude/skills/
```

### Scenario H: Update Strategy Database (Auto)

**Important**: After each successful retrieval and installation, check and update `references/marketplaces.md`.

#### Trigger Conditions

Auto-execute strategy database update when:
1. Successfully found and installed a skill from a marketplace
2. Used a new search method (e.g., discovered new API endpoint)
3. Found existing strategy failed or better alternative exists

#### Update Flow

**Step 1**: Check if current strategy is recorded
```bash
grep -q "{marketplace-name}" references/marketplaces.md && echo "Exists" || echo "New source"
```

**Step 2**: If new or improved strategy, append/update to `references/marketplaces.md`

**Step 3**: Record content includes:
- Marketplace name and URL
- Available API endpoints
- Search methods and example commands
- Installation methods
- Special handling (e.g., Cloudflare bypass)

#### Update Format Example

```markdown
## N. {Marketplace Name} ({domain})

**Features**: {description}

**URL formats**:
- Search: `{search-url}`
- Details: `{detail-url}`
- API: `{api-url}` (if available)

**Data retrieval**:
\`\`\`bash
{retrieval command}
\`\`\`

**Installation**: `{install command}`

**Discovery date**: {date}
**Discovery method**: {how this strategy was discovered}
```

#### Strategy Priority Adjustment

If a strategy proves more effective than existing ones:
1. Update that source's search step number
2. Update search order in SKILL.md
3. Update `Default Search Order` table

---

## Installation Validation

Pre-installation check:
```bash
test -f <path>/SKILL.md && echo "valid" || echo "invalid"
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Source doesn't exist | Prompt to check address |
| No SKILL.md | Prompt incorrect format |
| Name already exists | Ask: overwrite/rename/cancel |
| Network error | Prompt to retry |
| Cloudflare 403 | Use curl + User-Agent, or try npx install directly |
| npx install failed | Fallback to curl scraping GitHub link then git clone |

## Installation Complete Prompt

After installation, **must** highlight the installation source.

**Important**: Links must be **full URLs**, no ellipsis (...) truncation!

Format:

```
✅ Installation complete: <installation-path>

┌────────────────────────────────────────────────────────────────────────────┐
│  📦 Source: <source-name>                                                   │
│  🔗 https://github.com/<owner>/<repo>/path/to/skill                        │
└────────────────────────────────────────────────────────────────────────────┘
```

## Example Dialogs

### Example 1: Install skill

```
User: install playwright-testing

AI: 🔍 Searching for "playwright-testing"...

[1/8] Searching github.com/anthropics/skills ... ❌ Not found
[2/8] Searching skillsmp.com ... ✅ Match found!

Found results:
- playwright-browser-automation (⭐ 234)
  Description: Model-invoked Playwright automation

Install to?
[1] Project-level (.claude/skills/)
[2] User-level (~/.claude/skills/)

User: 2

AI: Installing...

✅ Installation complete: ~/.claude/skills/playwright-browser-automation

┌──────────────────────────────────────────────────────────────────────────────────┐
│  📦 Source: skillsmp.com                                                          │
│  🔗 https://github.com/anthropics/skills/tree/main/skills/playwright             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Example 1.1: Skill not found

```
User: install nonexistent-skill

AI: 🔍 Searching for "nonexistent-skill"...

[1/9] Searching github.com/anthropics/skills ... ❌ Not found
[2/9] Searching prompts.chat (MCP API) ... ❌ Not found
[3/9] Searching skills.sh ... ❌ Not found
[4/9] Searching mcpservers.org/claude-skills ... ❌ Not found
[5/9] Searching skillhub.club ... ❌ Not found
[6/9] Searching claudemarketplaces.com ... ❌ Not found
[7/9] Searching skillsmp.com (npx) ... ❌ Not found
[8/9] Searching smithery.ai/skills ... ❌ Not found
[9/9] Searching GitHub (fallback) ... ❌ Not found

❌ "nonexistent-skill" not found in all 9 sources

You can:
1. Check skill name spelling
2. Provide skill's full URL
3. Create a new skill
```

### Example 2: skill-get help

```
User: skill-get help

AI: ## skill-get Help

Unified Claude Code Skill installer, supports installing, updating, and packaging skills from multiple sources.

### Supported Commands

| Command | Description |
|---------|-------------|
| install {name/url} | Install skill |
| update {name} | Update installed skill |
| list installed | Show all installed skills |
| package {path} | Package skill as .skill file |
| unpack {file} | Extract .skill file |
| help | Show this help |

### Search Order (sorted by effectiveness, GitHub as fallback)

| Priority | Source | Effectiveness | Description |
|----------|--------|---------------|-------------|
| 1 | github.com/anthropics/skills | ⭐ | Official repository, stable API |
| 2 | prompts.chat/skills | ⭐⭐ | Best MCP API |
| 3 | skills.sh | ⭐⭐ | REST API + npx |
| 4 | mcpservers.org | ⭐ | Structured directory |
| 5 | skillhub.club | ⭐ | Category browsing |
| 6 | claudemarketplaces.com | ⚠️ | Partially available |
| 7 | skillsmp.com | ❌ | Cloudflare protected |
| 8 | smithery.ai | ❌ | Heavy rate limiting |
| 9 | GitHub Search | ⭐ | **Fallback**, avoids name collision |

### Custom Search Order

Edit `~/.claude/skill-get-config.json`:
\`\`\`json
{
  "marketplaces": ["github.com/anthropics/skills", "prompts.chat/skills", "skills.sh", ..., "github-search"]
}
\`\`\`

> **Recommendation**: Keep `github-search` last as a fallback.
```

### Example 3: Update skill

```
User: update playwright-testing

AI: 🔍 Checking playwright-testing for updates...

📦 Current version: abc1234 (2025-01-20)
📦 Latest version: def5678 (2025-01-24)

New version available! Update?
[1] Update
[2] Cancel

User: 1

AI: Updating...

✅ Update complete: ~/.claude/skills/playwright-testing

┌──────────────────────────────────────────────────────────────────────────────────┐
│  📦 Source: github.com/anthropics/skills                                          │
│  🔗 https://github.com/anthropics/skills/tree/main/skills/playwright-testing     │
│  📝 abc1234 → def5678                                                             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Example 4: Check all updates

```
User: check all skill updates

AI: 🔍 Checking installed skills...

| Skill | Current Version | Latest Version | Status |
|-------|-----------------|----------------|--------|
| playwright-testing | abc1234 | def5678 | ⬆️ Updatable |
| docx-converter | v1.0.0 | v1.0.0 | ✅ Up to date |
| my-local-skill | - | - | ⏭️ Local install |

Found 1 updatable skill, update all?
```

### Example 5: Package skill

```
User: package skill-get

AI: 📦 Packaging skill-get...

🔍 Validating skill...
✅ Skill is valid!

  Added: skill-get/SKILL.md
  Added: skill-get/scripts/install_skill.sh
  Added: skill-get/scripts/list_skills.sh
  Added: skill-get/scripts/package_skill.py
  Added: skill-get/references/marketplaces.md

✅ Package complete: ./skill-get.skill
   5 files added, 0 files ignored
```

### Example 6: Unpack skill

```
User: unpack my-skill.skill to ~/.claude/skills/

AI: 📂 Unpacking my-skill.skill...

📂 Extracted to: /home/user/.claude/skills/my-skill
  my-skill/SKILL.md
  my-skill/scripts/helper.py

✅ Unpack complete: 2 files
```
