#!/bin/bash
# install_skill.sh - Install a skill from various sources
# Usage: install_skill.sh <source> <target_dir> [skill_name]
#
# Source types:
#   - Git URL: https://github.com/user/repo or git@github.com:user/repo
#   - HTTP URL: https://example.com/path/to/SKILL.md
#   - Local path: /path/to/skill-folder
#
# Examples:
#   install_skill.sh https://github.com/anthropics/skills ~/.claude/skills docx
#   install_skill.sh https://example.com/skill/SKILL.md ~/.claude/skills/my-skill
#   install_skill.sh /path/to/local/skill ~/.claude/skills

set -e

SOURCE="$1"
TARGET_DIR="$2"
SKILL_NAME="$3"

if [ -z "$SOURCE" ] || [ -z "$TARGET_DIR" ]; then
    echo "Usage: install_skill.sh <source> <target_dir> [skill_name]"
    exit 1
fi

# Create target directory if not exists
mkdir -p "$TARGET_DIR"

# Detect source type and install
if [[ "$SOURCE" =~ ^https://github\.com/ ]] || [[ "$SOURCE" =~ ^git@ ]]; then
    # Git repository
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT

    # Extract repo URL and subpath
    if [[ "$SOURCE" =~ ^https://github\.com/([^/]+)/([^/]+)/?(.*)$ ]]; then
        OWNER="${BASH_REMATCH[1]}"
        REPO="${BASH_REMATCH[2]}"
        SUBPATH="${BASH_REMATCH[3]}"
        REPO_URL="https://github.com/$OWNER/$REPO.git"
    else
        REPO_URL="$SOURCE"
        SUBPATH=""
    fi

    echo "Cloning repository..."
    git clone --depth 1 "$REPO_URL" "$TEMP_DIR/repo" 2>/dev/null

    # Determine source path within repo
    if [ -n "$SUBPATH" ]; then
        SOURCE_PATH="$TEMP_DIR/repo/$SUBPATH"
    elif [ -n "$SKILL_NAME" ]; then
        SOURCE_PATH="$TEMP_DIR/repo/$SKILL_NAME"
    else
        SOURCE_PATH="$TEMP_DIR/repo"
    fi

    # Validate skill
    if [ ! -f "$SOURCE_PATH/SKILL.md" ]; then
        echo "Error: No SKILL.md found at $SOURCE_PATH"
        exit 1
    fi

    # Get skill name from directory
    FINAL_NAME=$(basename "$SOURCE_PATH")
    FINAL_TARGET="$TARGET_DIR/$FINAL_NAME"

    # Check if already exists
    if [ -d "$FINAL_TARGET" ]; then
        echo "Warning: $FINAL_TARGET already exists"
        read -p "Overwrite? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Cancelled"
            exit 0
        fi
        rm -rf "$FINAL_TARGET"
    fi

    # Copy skill
    cp -r "$SOURCE_PATH" "$FINAL_TARGET"
    echo "Installed to $FINAL_TARGET"

elif [[ "$SOURCE" =~ ^https?:// ]]; then
    # HTTP URL - assume it's a SKILL.md file or directory
    if [[ "$SOURCE" =~ SKILL\.md$ ]]; then
        # Direct SKILL.md URL
        FINAL_NAME="${SKILL_NAME:-skill-$(date +%s)}"
        FINAL_TARGET="$TARGET_DIR/$FINAL_NAME"
        mkdir -p "$FINAL_TARGET"

        echo "Downloading SKILL.md..."
        curl -fsSL "$SOURCE" -o "$FINAL_TARGET/SKILL.md"
        echo "Installed to $FINAL_TARGET"
    else
        echo "Error: HTTP URL must point to a SKILL.md file"
        exit 1
    fi

elif [ -d "$SOURCE" ]; then
    # Local directory
    if [ ! -f "$SOURCE/SKILL.md" ]; then
        echo "Error: No SKILL.md found in $SOURCE"
        exit 1
    fi

    FINAL_NAME=$(basename "$SOURCE")
    FINAL_TARGET="$TARGET_DIR/$FINAL_NAME"

    if [ -d "$FINAL_TARGET" ]; then
        echo "Warning: $FINAL_TARGET already exists"
        read -p "Overwrite? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Cancelled"
            exit 0
        fi
        rm -rf "$FINAL_TARGET"
    fi

    cp -r "$SOURCE" "$FINAL_TARGET"
    echo "Installed to $FINAL_TARGET"

else
    echo "Error: Unknown source type or path not found: $SOURCE"
    exit 1
fi

echo "Done!"
