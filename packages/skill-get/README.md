# @prgrmrwy/skill-get

Install [skill-get](https://github.com/prgrmrwy/ai-tools/tree/main/.claude/skills/skill-get) - Claude Code's unified skill installer from multiple sources.

## Installation

```bash
# Install to current project (recommended)
npx @prgrmrwy/install-skill-get

# Or install globally
npx @prgrmrwy/install-skill-get --global
```

## Usage

```bash
# Install to project level (.claude/skills/)
npx @prgrmrwy/install-skill-get

# Install to user level (~/.claude/skills/)
npx @prgrmrwy/install-skill-get --global

# Force reinstall
npx @prgrmrwy/install-skill-get --force
```

## Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--local` | `-l` | Install to project level (.claude/skills/) [default] |
| `--global` | `-g` | Install to user level (~/.claude/skills/) |
| `--force` | `-f` | Force reinstall even if already installed |
| `--help` | `-h` | Show help message |

## What is skill-get?

**skill-get** is Claude Code's unified installer for skills from multiple sources. It streamlines installation, updates, packaging, and management of Claude Code Skills.

### Key Features

- **Multi-source support**: Official repos, third-party marketplaces, GitHub, direct URLs, and local paths
- **Smart search**: Searches from 9 sources in priority order, stopping when a match is found
- **Installation tracking**: Records metadata for future updates via `.skill-meta.json`
- **Skill lifecycle management**: Install, update, list, package, and unpack operations

### Search Priority (9 Steps)

The system searches in this order:

1. Official anthropics/skills repository
2. prompts.chat (via MCP API)
3. skills.sh (REST API)
4. mcpservers.org
5. skillhub.club
6. claudemarketplaces.com
7. skillsmp.com (via npx)
8. smithery.ai
9. GitHub search (fallback)

### Installation Locations

Skills can be installed at:
- **Project level** (`.claude/skills/`) - Current project only [default]
- **User level** (`~/.claude/skills/`) - Available for all projects

## Source

This package installs skill-get from:
[https://github.com/prgrmrwy/ai-tools/tree/main/.claude/skills/skill-get](https://github.com/prgrmrwy/ai-tools/tree/main/.claude/skills/skill-get)

## License

MIT
