---
name: skill-get
description: 从多种来源安装Claude Code Skills的统一安装器。当用户请求安装skill、查找skill、列出已安装skills、更新skill、查询支持哪些marketplace/来源、skill-get help、打包skill、编译skill、或提到skill名称/URL时触发。支持：(1)官方仓库 github.com/anthropics/skills，(2)第三方Marketplace（skillsmp.com、prompts.chat、skillhub.club、smithery.ai等），(3)GitHub搜索，(4)直接Git/HTTP URL，(5)本地路径，(6)打包skill为.skill文件，(7)更新已安装的skill。
---

# Skill Get

一句话从任意来源安装Skill到本地。

[English](SKILL.md)

## 安装位置

| 类型 | 路径 | 说明 |
|------|------|------|
| 用户级 | `~/.claude/skills/` | 所有项目可用 |
| 项目级 | `.claude/skills/` | 仅当前项目可用 |

默认询问用户选择安装位置。

## 工作流程

### 场景A: 用户给出明确地址

直接执行安装：

```bash
# Git仓库
scripts/install_skill.sh "https://github.com/anthropics/skills" ~/.claude/skills docx

# HTTP URL（SKILL.md）
scripts/install_skill.sh "https://example.com/skill/SKILL.md" ~/.claude/skills/my-skill

# 本地路径
scripts/install_skill.sh /path/to/skill ~/.claude/skills
```

### 场景B: 用户只给Skill名称

按优先级搜索并安装。

#### ⚠️ 搜索约束（必须遵守）

1. **严格按优先级顺序搜索**：必须从优先级 1 开始，依次搜索到优先级 9，不可跳跃
2. **禁止跳过任何来源**：即使某个来源很可能没有结果，也必须执行搜索
3. **实时显示搜索进度**：每搜索一个来源，必须向用户显示当前正在搜索的来源名称
4. **找到即停止**：一旦在某个来源找到匹配结果，立即停止搜索并展示结果
5. **全部搜索完才报未找到**：只有当所有 9 个来源都搜索完毕且无结果时，才能报告"未找到"
6. **GitHub 搜索兜底**：GitHub 搜索放在最后（第 9 步），优先从第三方 Marketplace 获取精准结果

#### 搜索进度显示格式

```
🔍 正在搜索 "skill-name"...

[1/9] 搜索 github.com/anthropics/skills ... ❌ 未找到
[2/9] 搜索 prompts.chat (MCP API) ... ✅ 找到匹配！
```

> **注意**: GitHub 搜索放在第 9 步（最后）作为兜底，避免同名混淆。

#### 搜索步骤（按有效性排序，GitHub搜索兜底）

> **设计原则**: 优先从第三方 Marketplace 进行精准搜索，GitHub 搜索作为兜底能力放在最后，避免同名混淆。

**Step 1/9: 官方仓库 (github.com/anthropics/skills)** ⭐ 官方优先
```bash
echo "[1/9] 搜索 github.com/anthropics/skills ..."
curl -s "https://api.github.com/repos/anthropics/skills/contents/skills" | jq -r '.[] | select(.type=="dir") | .name' | grep -i "{keyword}"
```

**Step 2/9: Prompts.chat Skills (prompts.chat/skills)** ⭐⭐ MCP API最佳

prompts.chat 提供 MCP API，**优先使用 MCP 工具**：

**方法1: MCP API (推荐)**

直接调用 MCP 端点：
```bash
echo "[2/9] 搜索 prompts.chat (MCP API) ..."
curl -sL -X POST "https://prompts.chat/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_skills","arguments":{"query":"{skill-name}","limit":10}},"id":1}'
```

如果 MCP 服务器已配置 (`prompts.chat: https://prompts.chat/api/mcp`)，使用：
- `search_skills` - 搜索 skills
- `get_skill` - 获取完整 skill 内容（包括所有文件）

```
# 搜索
search_skills(query="{skill-name}", limit=10)

# 获取完整内容
get_skill(id="{skill-id}")
```

**方法2: 页面抓取 (备用)**
```bash
curl -sL -A "Mozilla/5.0" "https://prompts.chat/skills?q={skill-name}" | grep -oE '/prompts/[a-zA-Z0-9_-]+'
```

**安装流程**:
1. 调用 `get_skill(id)` 获取所有文件内容
2. 创建目录 `.claude/skills/{slug}/`
3. 保存 SKILL.md 和其他文件到对应位置

**Step 3/9: Skills.sh (skills.sh)** ⭐⭐ REST API + npx

Vercel 官方维护的 Agent Skills 目录：
```bash
echo "[3/9] 搜索 skills.sh ..."
# REST API 获取 skills 列表
curl -sL "https://skills.sh/api/skills" | jq -r '.skills[] | select(.name | test("{keyword}"; "i")) | "\(.name) (⭐\(.installs)) - \(.topSource)"'
```

**安装方式**:
```bash
npx skills add {owner}/{repo}
npx skills add vercel-labs/agent-skills
```

**Step 4/9: mcpservers.org/claude-skills** ⭐ 结构化目录
```bash
echo "[4/9] 搜索 mcpservers.org/claude-skills ..."
curl -sL -A "Mozilla/5.0" "https://mcpservers.org/claude-skills" | grep -oE 'href="/claude-skills/[^"]+' | grep -i "{keyword}"
```

**Step 5/9: SkillHub (skillhub.club)** ⭐ 分类浏览
```bash
echo "[5/9] 搜索 skillhub.club ..."
curl -sL -A "Mozilla/5.0" "https://skillhub.club" | grep -oE 'href="/skills/[^"]+' | grep -i "{keyword}"
```

**Step 6/9: Claude Marketplaces (claudemarketplaces.com)** ⚠️ 部分可用
```bash
echo "[6/9] 搜索 claudemarketplaces.com ..."
curl -sL -A "Mozilla/5.0" "https://claudemarketplaces.com" | grep -oE 'github\.com/[a-zA-Z0-9_/-]+'
```

**Step 7/9: SkillsMP (skillsmp.com)** ❌ Cloudflare保护

Cloudflare 403 保护，优先使用 npx 直接安装：
```bash
echo "[7/9] 搜索 skillsmp.com ..."
# 直接尝试 npx 安装（无需搜索）
npx skills add {skill-name}

# 或 curl 探测（可能被拦截）
curl -sL -A "Mozilla/5.0" "https://skillsmp.com/skills/{skill-name}" | grep -oE 'npx skills add [a-zA-Z0-9_-]+'
```

**Step 8/9: Smithery (smithery.ai/skills)** ❌ 限流严重
```bash
echo "[8/9] 搜索 smithery.ai/skills ..."
# 注意: 该站点 HTTP 429 限流严重，可能失败
curl -sL -A "Mozilla/5.0" "https://smithery.ai/skills/{skill-name}" | grep -oE 'github\.com/[a-zA-Z0-9_/-]+'
```

**Step 9/9: GitHub 搜索 (兜底)** ⭐ 最后搜索，避免同名混淆
```bash
echo "[9/9] 搜索 GitHub (兜底) ..."
curl -s "https://api.github.com/search/repositories?q=claude+skill+{keyword}&sort=stars&per_page=5" | jq -r '.items[] | "\(.full_name) ⭐\(.stargazers_count)"'
```

> **说明**: GitHub 搜索放在最后是因为搜索结果可能包含大量不相关项目，容易出现同名混淆。优先从第三方 Marketplace 搜索可以获得更精准的结果。

详见 [references/marketplaces.md](references/marketplaces.md)

找到后展示结果，确认后安装。

### 场景C: 列出已安装Skills

```bash
scripts/list_skills.sh
```

### 场景D: 查询支持的Marketplace / skill-get help

当用户问"支持哪些marketplace"、"有哪些skill来源"、"skill-get help"等问题时，展示支持的来源列表和配置说明：

#### 默认搜索顺序（按有效性排序，GitHub搜索兜底）

| 优先级 | 来源 | 有效性 | 说明 |
|--------|------|--------|------|
| 1 | github.com/anthropics/skills | ⭐ 官方 | 官方Skill仓库，API稳定 |
| 2 | prompts.chat/skills | ⭐⭐ 最佳 | MCP API，可获取完整内容 |
| 3 | skills.sh | ⭐⭐ 优秀 | Vercel官方，REST API + npx |
| 4 | mcpservers.org/claude-skills | ⭐ 有效 | 结构化目录，页面抓取 |
| 5 | skillhub.club | ⭐ 有效 | 分类浏览，页面抓取 |
| 6 | claudemarketplaces.com | ⚠️ 部分 | 首页可访问，/skills 404 |
| 7 | skillsmp.com | ❌ 困难 | Cloudflare 403保护，需npx |
| 8 | smithery.ai/skills | ❌ 最难 | HTTP 429限流严重 |
| 9 | GitHub搜索 | ⭐ 兜底 | **放最后**，避免同名混淆 |
| - | 直接Git/HTTP URL | - | 用户提供完整地址 |
| - | 本地路径 | - | 复制本地文件夹 |

#### 自定义搜索顺序

用户可以在 `~/.claude/skill-get-config.json` 中自定义 marketplace 搜索顺序：

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

> **注意**: `github-search` 放在最后作为兜底能力。

**说明**：
- 数组顺序决定搜索优先级
- 移除某项则跳过该来源
- `github-search` 代表 GitHub 公开仓库搜索
- 直接 URL 和本地路径始终支持，无需配置

读取配置：
```bash
cat ~/.claude/skill-get-config.json 2>/dev/null || echo "使用默认配置"
```

### 场景E: 更新Skill (update)

当用户说"更新skill"、"update skill"、"升级skill"等，根据安装记录检查并更新指定skill。

**重要**: 用户 **必须** 指定要更新的 skill 名称。

#### 安装记录文件

安装 skill 时，自动在安装目录生成 `.skill-meta.json` 记录安装信息：

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

**来源类型**：
- `git`: Git 仓库，记录 commit hash
- `npm`: npx 安装，记录版本号
- `http`: HTTP URL，记录 ETag 或 Last-Modified
- `local`: 本地路径，记录文件修改时间

#### 更新流程

```bash
# 用户必须指定 skill 名称
用户: 更新 playwright-testing
```

**Step 1**: 读取安装记录
```bash
cat ~/.claude/skills/playwright-testing/.skill-meta.json
# 或
cat .claude/skills/playwright-testing/.skill-meta.json
```

**Step 2**: 检查远程版本
```bash
# Git 仓库：获取最新 commit
git ls-remote {url} {branch} | cut -f1

# npm：检查最新版本
npm view {package-name} version
```

**Step 3**: 对比版本
- 如果远程 commit/version 与本地记录一致：提示 "已是最新版本"
- 如果不一致：显示更新内容，确认后执行更新

**Step 4**: 执行更新
```bash
# 备份当前版本（可选）
cp -r {skill-path} {skill-path}.bak

# 重新安装
scripts/install_skill.sh {source-url} {install-path} {skill-name}

# 更新记录文件中的 commit/version
```

#### 批量检查更新

```bash
# 列出所有可更新的 skills
用户: 检查所有 skill 更新

AI: 检查已安装的 skills...

| Skill | 当前版本 | 最新版本 | 状态 |
|-------|----------|----------|------|
| playwright-testing | abc1234 | def5678 | 可更新 |
| docx-converter | v1.0.0 | v1.0.0 | 已最新 |
| my-local-skill | - | - | 本地安装，跳过 |
```

### 场景F: 打包Skill

当用户说"打包skill"、"编译skill"、"生成.skill文件"等，将skill目录打包为可分发的.skill文件。

```bash
python3 scripts/package_skill.py pack <skill-folder> [output-directory]
```

**示例**：
```bash
# 打包 skill-get，输出到当前目录
python3 scripts/package_skill.py pack .claude/skills/skill-get

# 打包到指定目录
python3 scripts/package_skill.py pack .claude/skills/skill-get ./dist
```

**输出**：`<skill-name>.skill` 文件（zip格式）

打包前会自动验证：
- SKILL.md 存在
- YAML frontmatter 格式正确
- name 和 description 字段存在

#### .skillignore 支持

在 skill 目录下创建 `.skillignore` 文件可排除不需要打包的文件：

```
# .skillignore 示例
*.log
*.tmp
tests/
node_modules/
.env
```

**默认忽略**（无需配置）：
- `.git/`, `__pycache__/`, `*.pyc`, `*.pyo`
- `.DS_Store`, `Thumbs.db`
- `.skillignore` 本身

### 场景G: 解包Skill

当用户说"解包skill"、"解压skill"、"提取.skill文件"等，将.skill文件解压到指定目录。

```bash
python3 scripts/package_skill.py unpack <skill-file> [output-directory]
```

**示例**：
```bash
# 解包到当前目录
python3 scripts/package_skill.py unpack my-skill.skill

# 解包到 skills 目录
python3 scripts/package_skill.py unpack my-skill.skill ~/.claude/skills/
```

### 场景H: 更新策略库 (自动)

**重要**: 每次成功完成检索和安装链路后，检查并更新 `references/marketplaces.md`。

#### 触发条件

当以下情况发生时，自动执行策略库更新：
1. 在某个 marketplace 成功找到并安装了 skill
2. 使用了新的搜索方法（如发现新的 API 端点）
3. 发现现有策略失效或有更好的替代方案

#### 更新流程

**Step 1**: 检查当前策略是否已记录
```bash
grep -q "{marketplace-name}" references/marketplaces.md && echo "已存在" || echo "新来源"
```

**Step 2**: 如果是新策略或改进策略，追加/更新到 `references/marketplaces.md`

**Step 3**: 记录内容包括：
- Marketplace 名称和 URL
- 可用的 API 端点
- 搜索方法和示例命令
- 安装方式
- 特殊处理（如 Cloudflare 绕过）

#### 更新格式示例

```markdown
## N. {Marketplace Name} ({domain})

**特点**: {描述}

**URL格式**:
- 搜索: `{search-url}`
- 详情: `{detail-url}`
- API: `{api-url}` (如果有)

**数据获取**:
\`\`\`bash
{获取命令}
\`\`\`

**安装方式**: `{安装命令}`

**发现日期**: {日期}
**发现途径**: {如何发现这个策略的}
```

#### 策略优先级调整

如果某个策略被证明比现有策略更有效，应该：
1. 更新该来源的搜索步骤编号
2. 更新 SKILL.md 中的搜索顺序
3. 更新 `默认搜索顺序` 表格

---

## 安装验证

安装前检查：
```bash
test -f <path>/SKILL.md && echo "valid" || echo "invalid"
```

## 异常处理

| 场景 | 处理 |
|------|------|
| 来源不存在 | 提示检查地址 |
| 无SKILL.md | 提示格式不正确 |
| 同名已存在 | 询问：覆盖/重命名/取消 |
| 网络错误 | 提示重试 |
| Cloudflare 403 | 改用 curl + User-Agent，或直接尝试 npx 安装 |
| npx 安装失败 | 回退到 curl 抓取 GitHub 链接后 git clone |

## 安装完成提示

安装完成后，**必须**高亮显示安装来源。

**重要**: 链接必须是**完整URL**，禁止使用省略号(...)截断！

格式如下：

```
✅ 安装完成: <安装路径>

┌────────────────────────────────────────────────────────────────────────────┐
│  📦 来源: <来源名称>                                                         │
│  🔗 https://github.com/<owner>/<repo>/path/to/skill                        │
└────────────────────────────────────────────────────────────────────────────┘
```

## 示例对话

### 示例1: 安装skill

```
用户: 安装 playwright-testing

AI: 🔍 正在搜索 "playwright-testing"...

[1/8] 搜索 github.com/anthropics/skills ... ❌ 未找到
[2/8] 搜索 skillsmp.com ... ✅ 找到匹配！

找到以下结果:
- playwright-browser-automation (⭐ 234)
  描述: Model-invoked Playwright automation

安装到哪里？
[1] 项目级 (.claude/skills/)
[2] 用户级 (~/.claude/skills/)

用户: 2

AI: 正在安装...

✅ 安装完成: ~/.claude/skills/playwright-browser-automation

┌──────────────────────────────────────────────────────────────────────────────────┐
│  📦 来源: skillsmp.com                                                            │
│  🔗 https://github.com/anthropics/skills/tree/main/skills/playwright             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 示例1.1: 未找到skill

```
用户: 安装 nonexistent-skill

AI: 🔍 正在搜索 "nonexistent-skill"...

[1/9] 搜索 github.com/anthropics/skills ... ❌ 未找到
[2/9] 搜索 prompts.chat (MCP API) ... ❌ 未找到
[3/9] 搜索 skills.sh ... ❌ 未找到
[4/9] 搜索 mcpservers.org/claude-skills ... ❌ 未找到
[5/9] 搜索 skillhub.club ... ❌ 未找到
[6/9] 搜索 claudemarketplaces.com ... ❌ 未找到
[7/9] 搜索 skillsmp.com (npx) ... ❌ 未找到
[8/9] 搜索 smithery.ai/skills ... ❌ 未找到
[9/9] 搜索 GitHub (兜底) ... ❌ 未找到

❌ 在所有 9 个来源中均未找到 "nonexistent-skill"

您可以：
1. 检查 skill 名称拼写
2. 提供 skill 的完整 URL
3. 创建一个新的 skill
```

### 示例2: skill-get help

```
用户: skill-get help

AI: ## skill-get 帮助

统一的 Claude Code Skill 安装器，支持从多种来源安装、更新、打包 Skills。

### 支持的命令

| 命令 | 说明 |
|------|------|
| 安装 {name/url} | 安装 skill |
| 更新 {name} | 更新已安装的 skill |
| 列出已安装 | 显示所有已安装的 skills |
| 打包 {path} | 打包 skill 为 .skill 文件 |
| 解包 {file} | 解压 .skill 文件 |
| help | 显示此帮助 |

### 搜索顺序（按有效性排序，GitHub兜底）

| 优先级 | 来源 | 有效性 | 说明 |
|--------|------|--------|------|
| 1 | github.com/anthropics/skills | ⭐ | 官方仓库，API稳定 |
| 2 | prompts.chat/skills | ⭐⭐ | MCP API最佳 |
| 3 | skills.sh | ⭐⭐ | REST API + npx |
| 4 | mcpservers.org | ⭐ | 结构化目录 |
| 5 | skillhub.club | ⭐ | 分类浏览 |
| 6 | claudemarketplaces.com | ⚠️ | 部分可用 |
| 7 | skillsmp.com | ❌ | Cloudflare保护 |
| 8 | smithery.ai | ❌ | 限流严重 |
| 9 | GitHub搜索 | ⭐ | **兜底**，避免同名混淆 |

### 自定义搜索顺序

编辑 `~/.claude/skill-get-config.json`:
\`\`\`json
{
  "marketplaces": ["github.com/anthropics/skills", "prompts.chat/skills", "skills.sh", ..., "github-search"]
}
\`\`\`

> **建议**: 将 `github-search` 放在最后作为兜底。
```

### 示例3: 更新skill

```
用户: 更新 playwright-testing

AI: 🔍 检查 playwright-testing 更新...

📦 当前版本: abc1234 (2025-01-20)
📦 最新版本: def5678 (2025-01-24)

发现新版本！是否更新？
[1] 更新
[2] 取消

用户: 1

AI: 正在更新...

✅ 更新完成: ~/.claude/skills/playwright-testing

┌──────────────────────────────────────────────────────────────────────────────────┐
│  📦 来源: github.com/anthropics/skills                                            │
│  🔗 https://github.com/anthropics/skills/tree/main/skills/playwright-testing     │
│  📝 abc1234 → def5678                                                             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 示例4: 检查所有更新

```
用户: 检查所有 skill 更新

AI: 🔍 检查已安装的 skills...

| Skill | 当前版本 | 最新版本 | 状态 |
|-------|----------|----------|------|
| playwright-testing | abc1234 | def5678 | ⬆️ 可更新 |
| docx-converter | v1.0.0 | v1.0.0 | ✅ 已最新 |
| my-local-skill | - | - | ⏭️ 本地安装 |

发现 1 个可更新的 skill，是否全部更新？
```

### 示例5: 打包skill

```
用户: 打包 skill-get

AI: 📦 正在打包 skill-get...

🔍 Validating skill...
✅ Skill is valid!

  Added: skill-get/SKILL.md
  Added: skill-get/scripts/install_skill.sh
  Added: skill-get/scripts/list_skills.sh
  Added: skill-get/scripts/package_skill.py
  Added: skill-get/references/marketplaces.md

✅ 打包完成: ./skill-get.skill
   5 files added, 0 files ignored
```

### 示例6: 解包skill

```
用户: 解包 my-skill.skill 到 ~/.claude/skills/

AI: 📂 正在解包 my-skill.skill...

📂 Extracted to: /home/user/.claude/skills/my-skill
  my-skill/SKILL.md
  my-skill/scripts/helper.py

✅ 解包完成: 2 files
```
