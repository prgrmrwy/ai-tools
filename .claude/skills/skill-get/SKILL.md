---
name: skill-get
description: 从多种来源安装Claude Code Skills的统一安装器。当用户请求安装skill、查找skill、列出已安装skills、查询支持哪些marketplace/来源、打包skill、编译skill、或提到skill名称/URL时触发。支持：(1)官方仓库 github.com/anthropics/skills，(2)第三方Marketplace（skillsmp.com、skillhub.club、smithery.ai等），(3)GitHub搜索，(4)直接Git/HTTP URL，(5)本地路径，(6)打包skill为.skill文件。
---

# Skill Get

一句话从任意来源安装Skill到本地。

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

按优先级搜索并安装：

**Step 1: 官方仓库**
```bash
curl -s "https://api.github.com/repos/anthropics/skills/contents/skills" | jq -r '.[] | select(.type=="dir") | .name' | grep -i "{keyword}"
```

**Step 2: SkillsMP (npx 安装)**

直接尝试 npx 安装（SkillsMP 默认方式）：
```bash
npx skills add {skill-name}
```

如果需要确认 skill 存在，用 curl 探测：
```bash
# 尝试获取页面并提取安装命令
curl -sL -A "Mozilla/5.0" "https://skillsmp.com/skills/{skill-name}" | grep -oE 'npx skills add [a-zA-Z0-9_-]+'
```

**Step 3: curl 抓取 Marketplace**

Cloudflare 保护的站点，使用 curl + User-Agent：
```bash
# 提取 GitHub 链接
curl -sL -A "Mozilla/5.0" "https://skillsmp.com/skills/{skill-name}" | grep -oE 'github\.com/[a-zA-Z0-9_/-]+'

# 提取任何安装命令
curl -sL -A "Mozilla/5.0" "https://skillsmp.com/skills/{skill-name}" | grep -oE '(npx|npm|git clone)[^<"]*' | head -5
```

**Step 4: GitHub搜索**
```bash
curl -s "https://api.github.com/search/repositories?q=claude+skill+{keyword}&sort=stars&per_page=5" | jq -r '.items[] | "\(.full_name) ⭐\(.stargazers_count)"'
```

详见 [references/marketplaces.md](references/marketplaces.md)

找到后展示结果，确认后安装。

### 场景C: 列出已安装Skills

```bash
scripts/list_skills.sh
```

### 场景D: 查询支持的Marketplace

当用户问"支持哪些marketplace"、"有哪些skill来源"等问题时，展示支持的来源列表：

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | github.com/anthropics/skills | 官方Skill仓库 |
| 2 | skillsmp.com | 71000+ agent skills |
| 3 | skillhub.club | 7000+ AI评估的Skills |
| 4 | smithery.ai/skills | MCP和Skill聚合 |
| 5 | mcpservers.org/claude-skills | MCP与Skill整合目录 |
| 6 | claudemarketplaces.com | Claude Code marketplace目录聚合 |
| 7 | GitHub搜索 | 按Star排序搜索公开仓库 |
| 8 | 直接Git/HTTP URL | 用户提供完整地址 |
| 9 | 本地路径 | 复制本地文件夹 |

### 场景E: 打包Skill

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

### 场景F: 解包Skill

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

AI: 正在搜索 "playwright-testing"...

1. 在 github.com/anthropics/skills 中未找到
2. 在 skillsmp.com 找到匹配:
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

### 示例2: 查询支持的marketplace

```
用户: 支持哪些skill来源？

AI: skill-get 支持以下来源（按搜索优先级排序）：

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | github.com/anthropics/skills | 官方Skill仓库 |
| 2 | skillsmp.com | 71000+ agent skills |
| 3 | skillhub.club | 7000+ AI评估的Skills |
| 4 | smithery.ai/skills | MCP和Skill聚合 |
| 5 | mcpservers.org/claude-skills | MCP与Skill整合目录 |
| 6 | claudemarketplaces.com | Claude Code marketplace聚合 |
| 7 | GitHub搜索 | 按Star排序搜索公开仓库 |
| 8 | 直接Git/HTTP URL | 用户提供完整地址 |
| 9 | 本地路径 | 复制本地文件夹 |
```

### 示例3: 打包skill

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

### 示例4: 解包skill

```
用户: 解包 my-skill.skill 到 ~/.claude/skills/

AI: 📂 正在解包 my-skill.skill...

📂 Extracted to: /home/user/.claude/skills/my-skill
  my-skill/SKILL.md
  my-skill/scripts/helper.py

✅ 解包完成: 2 files
```
