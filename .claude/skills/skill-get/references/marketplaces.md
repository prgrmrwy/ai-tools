# 第三方 Skill Marketplace 参考

本文档提供第三方Marketplace的数据获取方法，按热度排序。

---

## Cloudflare 保护应对策略

许多 Marketplace 使用 Cloudflare 保护，WebFetch 可能返回 403。使用以下策略：

### 策略1: curl + User-Agent

```bash
curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  "https://skillsmp.com/skills/{skill-name}" 2>/dev/null
```

### 策略2: 分析 DOM 提取安装命令

即使被 Cloudflare 拦截，部分页面内容可能仍在 HTML 中。搜索以下模式：

```bash
# 提取 npx 安装命令
curl -sL -A "Mozilla/5.0" "https://skillsmp.com/skills/{skill-name}" | grep -oE 'npx skills add [a-zA-Z0-9_-]+'

# 提取 GitHub 链接
curl -sL -A "Mozilla/5.0" "https://skillsmp.com/skills/{skill-name}" | grep -oE 'github\.com/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+'

# 提取安装按钮/代码块内容
curl -sL -A "Mozilla/5.0" "https://skillsmp.com/skills/{skill-name}" | grep -oE '(npm|npx|git clone)[^<"]+' | head -5
```

### 策略3: 尝试 API 端点

部分 Marketplace 有隐藏的 API：

```bash
# SkillsMP 可能的 API
curl -sL "https://skillsmp.com/api/skills/{skill-name}" 2>/dev/null
curl -sL "https://skillsmp.com/api/search?q={keyword}" 2>/dev/null
```

---

## 常见安装命令格式

不同 Marketplace 使用不同的安装方式：

| 平台 | 安装命令格式 |
|------|-------------|
| SkillsMP | `npx skills add {skill-name}` |
| Smithery | `npx @anthropic-ai/claude-skill add {skill-name}` |
| 直接GitHub | `git clone` 后复制到 skills 目录 |

### npx skills add 工作原理

`npx skills add` 通常会：
1. 从 registry 下载 skill 包
2. 解压到 `~/.claude/skills/` 或 `.claude/skills/`

可以直接运行：
```bash
npx skills add {skill-name}
# 或指定目录
npx skills add {skill-name} --path .claude/skills/
```

---

## 1. SkillsMP (skillsmp.com)

**特点**: 71000+ agent skills，支持Claude Code、Codex CLI和ChatGPT

**URL格式**:
- 搜索: `https://skillsmp.com/search?q={keyword}`
- 详情: `https://skillsmp.com/skills/{skill-name}`

**安装方式**: `npx skills add {skill-name}`

**数据获取**:
```bash
# 尝试获取 skill 详情页
curl -sL -A "Mozilla/5.0" "https://skillsmp.com/skills/{skill-name}" | \
  grep -oE '(npx skills add [^<"]+|github\.com/[^<"]+)' | head -5
```

## 2. SkillHub (skillhub.club)

**特点**: 7000+ AI评估的Skills，提供Playground试用

**URL格式**:
- 列表: `https://skillhub.club/skills`
- 搜索: `https://skillhub.club/search?q={keyword}`

**数据获取**:
```bash
curl -sL -A "Mozilla/5.0" "https://skillhub.club/skills/{skill-name}" | \
  grep -oE '(github\.com/[^<"]+|安装|install)[^<]*' | head -10
```

## 3. Smithery (smithery.ai/skills)

**特点**: MCP和Skill聚合，支持创建自定义Skill

**URL格式**: `https://smithery.ai/skills?q={keyword}`

**数据获取**:
```bash
curl -sL -A "Mozilla/5.0" "https://smithery.ai/skills/{skill-name}" | \
  grep -oE '(npx [^<"]+|github\.com/[^<"]+)' | head -5
```

## 4. mcpservers.org

**URL**: `https://mcpservers.org/claude-skills`

**特点**: MCP与Skill整合目录

## 5. claudemarketplaces.com

**URL**: `https://claudemarketplaces.com`

**特点**: Claude Code plugin marketplace目录聚合

---

## GitHub API 参考

### 搜索官方仓库

```bash
curl -s "https://api.github.com/repos/anthropics/skills/contents/skills" | jq -r '.[] | select(.type=="dir") | .name'
```

### 搜索公开仓库

```bash
curl -s "https://api.github.com/search/repositories?q=claude+skill+{keyword}&sort=stars&order=desc&per_page=5" | \
  jq -r '.items[] | "- \(.full_name) (⭐\(.stargazers_count))\n  \(.html_url)"'
```

### 使用 gh CLI

```bash
gh search repos "claude skill {keyword}" --sort stars --limit 10
gh api repos/anthropics/skills/contents/skills
```

---

## 安装流程决策树

```
用户请求安装 "{skill-name}"
    │
    ├─ 1. 检查官方仓库
    │     curl GitHub API → 找到? → git clone 安装
    │
    ├─ 2. 尝试 npx skills add (SkillsMP)
    │     npx skills add {skill-name} → 成功? → 完成
    │
    ├─ 3. curl Marketplace 页面
    │     提取安装命令或 GitHub 链接 → 找到? → 执行安装
    │
    ├─ 4. GitHub 搜索
    │     搜索 "claude skill {keyword}" → 找到? → git clone 安装
    │
    └─ 5. 未找到
          告知用户，建议检查 skill 名称或提供直接链接
```
