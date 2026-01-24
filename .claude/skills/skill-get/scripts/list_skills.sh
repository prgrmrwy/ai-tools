#!/bin/bash
# list_skills.sh - List installed skills
# Usage: list_skills.sh [--json]
#
# Scans ~/.claude/skills/ and .claude/skills/ for installed skills

set -e

JSON_OUTPUT=false
if [ "$1" = "--json" ]; then
    JSON_OUTPUT=true
fi

USER_DIR="$HOME/.claude/skills"
PROJECT_DIR=".claude/skills"

print_skill_info() {
    local path="$1"
    local location="$2"
    local skill_md="$path/SKILL.md"

    if [ -f "$skill_md" ]; then
        local name=$(basename "$path")
        local description=""

        # Extract description from YAML frontmatter
        if grep -q "^---" "$skill_md"; then
            description=$(sed -n '/^---$/,/^---$/p' "$skill_md" | grep "^description:" | sed 's/^description:[[:space:]]*//' | head -1)
        fi

        if [ "$JSON_OUTPUT" = true ]; then
            echo "{\"name\":\"$name\",\"path\":\"$path\",\"location\":\"$location\",\"description\":\"$description\"}"
        else
            echo "  $name"
            echo "    Location: $location ($path)"
            if [ -n "$description" ]; then
                echo "    Description: ${description:0:80}..."
            fi
            echo
        fi
    fi
}

if [ "$JSON_OUTPUT" = true ]; then
    echo "["
    first=true
fi

# Scan user-level skills
if [ -d "$USER_DIR" ]; then
    if [ "$JSON_OUTPUT" = false ]; then
        echo "User-level skills (~/.claude/skills/):"
        echo
    fi
    for skill in "$USER_DIR"/*/; do
        if [ -d "$skill" ]; then
            if [ "$JSON_OUTPUT" = true ] && [ "$first" = false ]; then
                echo ","
            fi
            first=false
            print_skill_info "$skill" "user"
        fi
    done
    if [ "$JSON_OUTPUT" = false ]; then
        echo
    fi
fi

# Scan project-level skills
if [ -d "$PROJECT_DIR" ]; then
    if [ "$JSON_OUTPUT" = false ]; then
        echo "Project-level skills (.claude/skills/):"
        echo
    fi
    for skill in "$PROJECT_DIR"/*/; do
        if [ -d "$skill" ]; then
            if [ "$JSON_OUTPUT" = true ] && [ "$first" = false ]; then
                echo ","
            fi
            first=false
            print_skill_info "$skill" "project"
        fi
    done
fi

if [ "$JSON_OUTPUT" = true ]; then
    echo "]"
fi
