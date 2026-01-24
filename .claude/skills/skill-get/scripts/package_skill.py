#!/usr/bin/env python3
"""
Skill Packager - Pack and unpack .skill files

Usage:
    package_skill.py pack <skill-folder> [output-directory]
    package_skill.py unpack <skill-file> [output-directory]

Examples:
    package_skill.py pack ~/.claude/skills/my-skill
    package_skill.py pack .claude/skills/my-skill ./dist
    package_skill.py unpack my-skill.skill
    package_skill.py unpack my-skill.skill ~/.claude/skills/
"""

import sys
import re
import fnmatch
import zipfile
from pathlib import Path

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


def load_skillignore(skill_path):
    """Load .skillignore patterns from skill directory."""
    ignore_file = skill_path / '.skillignore'
    patterns = []

    # Default ignore patterns (only system/build files, NOT .skillignore)
    default_patterns = [
        '.git',
        '.git/**',
        '__pycache__',
        '__pycache__/**',
        '*.pyc',
        '*.pyo',
        '.DS_Store',
        'Thumbs.db',
    ]
    patterns.extend(default_patterns)

    if ignore_file.exists():
        content = ignore_file.read_text()
        for line in content.splitlines():
            line = line.strip()
            # Skip empty lines and comments
            if line and not line.startswith('#'):
                patterns.append(line)

    return patterns


def should_ignore(file_path, patterns, base_path):
    """Check if file should be ignored based on patterns."""
    rel_path = str(file_path.relative_to(base_path))
    name = file_path.name

    for pattern in patterns:
        # Match against full relative path
        if fnmatch.fnmatch(rel_path, pattern):
            return True
        # Match against filename only
        if fnmatch.fnmatch(name, pattern):
            return True
        # Match against path with ** glob
        if '**' in pattern:
            # Convert ** pattern to regex-like matching
            if fnmatch.fnmatch(rel_path, pattern.replace('**/', '**/').replace('/**', '/**/*')):
                return True
            # Check if any parent directory matches
            parts = rel_path.split('/')
            for i in range(len(parts)):
                partial = '/'.join(parts[:i+1])
                if fnmatch.fnmatch(partial, pattern.rstrip('/**')):
                    return True

    return False


def validate_skill(skill_path):
    """Basic validation of a skill."""
    skill_path = Path(skill_path)

    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return False, "SKILL.md not found"

    content = skill_md.read_text()

    if not content.startswith('---'):
        return False, "No YAML frontmatter found"

    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return False, "Invalid frontmatter format"

    frontmatter_text = match.group(1)

    if HAS_YAML:
        try:
            frontmatter = yaml.safe_load(frontmatter_text)
            if not isinstance(frontmatter, dict):
                return False, "Frontmatter must be a YAML dictionary"
        except yaml.YAMLError as e:
            return False, f"Invalid YAML: {e}"

        if 'name' not in frontmatter:
            return False, "Missing 'name' in frontmatter"
        if 'description' not in frontmatter:
            return False, "Missing 'description' in frontmatter"

        name = frontmatter.get('name', '')
        if not re.match(r'^[a-z0-9-]+$', name):
            return False, f"Name '{name}' should be hyphen-case"
    else:
        if 'name:' not in frontmatter_text:
            return False, "Missing 'name' in frontmatter"
        if 'description:' not in frontmatter_text:
            return False, "Missing 'description' in frontmatter"

    return True, "Skill is valid!"


def pack_skill(skill_path, output_dir=None):
    """Package a skill folder into a .skill file."""
    skill_path = Path(skill_path).resolve()

    if not skill_path.exists():
        print(f"❌ Error: Skill folder not found: {skill_path}")
        return None

    if not skill_path.is_dir():
        print(f"❌ Error: Path is not a directory: {skill_path}")
        return None

    # Run validation
    print("🔍 Validating skill...")
    valid, message = validate_skill(skill_path)
    if not valid:
        print(f"❌ Validation failed: {message}")
        return None
    print(f"✅ {message}\n")

    # Load ignore patterns
    ignore_patterns = load_skillignore(skill_path)

    # Check if .skillignore exists
    skillignore_file = skill_path / '.skillignore'
    if skillignore_file.exists():
        print(f"📋 Using .skillignore\n")

    # Determine output location
    skill_name = skill_path.name
    if output_dir:
        output_path = Path(output_dir).resolve()
        output_path.mkdir(parents=True, exist_ok=True)
    else:
        output_path = Path.cwd()

    skill_filename = output_path / f"{skill_name}.skill"

    # Create .skill file (zip format)
    try:
        added_count = 0
        ignored_count = 0

        with zipfile.ZipFile(skill_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in skill_path.rglob('*'):
                if file_path.is_file():
                    # Check against ignore patterns
                    if should_ignore(file_path, ignore_patterns, skill_path):
                        ignored_count += 1
                        continue

                    arcname = file_path.relative_to(skill_path.parent)
                    zipf.write(file_path, arcname)
                    print(f"  Added: {arcname}")
                    added_count += 1

        print(f"\n✅ Successfully packaged: {skill_filename}")
        print(f"   {added_count} files added, {ignored_count} files ignored")
        return skill_filename

    except Exception as e:
        print(f"❌ Error creating .skill file: {e}")
        return None


def unpack_skill(skill_file, output_dir=None):
    """Extract a .skill file to a directory."""
    skill_file = Path(skill_file).resolve()

    if not skill_file.exists():
        print(f"❌ Error: Skill file not found: {skill_file}")
        return None

    if not skill_file.suffix == '.skill':
        print(f"❌ Error: File must have .skill extension: {skill_file}")
        return None

    # Determine output location
    if output_dir:
        output_path = Path(output_dir).resolve()
    else:
        output_path = Path.cwd()

    output_path.mkdir(parents=True, exist_ok=True)

    try:
        with zipfile.ZipFile(skill_file, 'r') as zipf:
            # List contents
            file_list = zipf.namelist()

            # Extract skill name from first entry
            if file_list:
                skill_name = file_list[0].split('/')[0]
                target_dir = output_path / skill_name

                # Check if already exists
                if target_dir.exists():
                    print(f"⚠️  Warning: {target_dir} already exists")
                    response = input("Overwrite? [y/N] ").strip().lower()
                    if response != 'y':
                        print("Cancelled")
                        return None
                    import shutil
                    shutil.rmtree(target_dir)

            # Extract all files
            zipf.extractall(output_path)

            print(f"📂 Extracted to: {output_path / skill_name}")
            for name in file_list:
                print(f"  {name}")

            print(f"\n✅ Successfully unpacked: {len(file_list)} files")
            return output_path / skill_name

    except zipfile.BadZipFile:
        print(f"❌ Error: Invalid .skill file (not a valid zip)")
        return None
    except Exception as e:
        print(f"❌ Error extracting .skill file: {e}")
        return None


def print_usage():
    print("Usage:")
    print("  package_skill.py pack <skill-folder> [output-directory]")
    print("  package_skill.py unpack <skill-file> [output-directory]")
    print()
    print("Commands:")
    print("  pack    Package a skill folder into a .skill file")
    print("  unpack  Extract a .skill file to a directory")
    print()
    print("Examples:")
    print("  package_skill.py pack ~/.claude/skills/my-skill")
    print("  package_skill.py pack .claude/skills/my-skill ./dist")
    print("  package_skill.py unpack my-skill.skill")
    print("  package_skill.py unpack my-skill.skill ~/.claude/skills/")
    print()
    print(".skillignore:")
    print("  Create a .skillignore file in the skill folder to exclude files.")
    print("  Syntax is similar to .gitignore (glob patterns, # for comments).")


def main():
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    command = sys.argv[1]

    if command == 'pack':
        if len(sys.argv) < 3:
            print("Error: Missing skill folder path")
            print("Usage: package_skill.py pack <skill-folder> [output-directory]")
            sys.exit(1)

        skill_path = sys.argv[2]
        output_dir = sys.argv[3] if len(sys.argv) > 3 else None

        print(f"📦 Packaging skill: {skill_path}\n")
        result = pack_skill(skill_path, output_dir)
        sys.exit(0 if result else 1)

    elif command == 'unpack':
        if len(sys.argv) < 3:
            print("Error: Missing skill file path")
            print("Usage: package_skill.py unpack <skill-file> [output-directory]")
            sys.exit(1)

        skill_file = sys.argv[2]
        output_dir = sys.argv[3] if len(sys.argv) > 3 else None

        print(f"📂 Unpacking skill: {skill_file}\n")
        result = unpack_skill(skill_file, output_dir)
        sys.exit(0 if result else 1)

    # Backward compatibility: if first arg is a path, assume pack
    elif Path(sys.argv[1]).exists() or sys.argv[1].startswith('.') or sys.argv[1].startswith('/') or sys.argv[1].startswith('~'):
        skill_path = sys.argv[1]
        output_dir = sys.argv[2] if len(sys.argv) > 2 else None

        print(f"📦 Packaging skill: {skill_path}\n")
        result = pack_skill(skill_path, output_dir)
        sys.exit(0 if result else 1)

    else:
        print(f"Unknown command: {command}")
        print_usage()
        sys.exit(1)


if __name__ == "__main__":
    main()
