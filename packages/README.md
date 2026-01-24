# Packages

This directory contains npm packages for installing tools and skills from this repository.

## Available Packages

| Package | Description | Install |
|---------|-------------|---------|
| [@prgrmrwy/skill-get](./skill-get) | Install skill-get to local | `npx @prgrmrwy/skill-get` |

## Purpose

These packages provide a convenient way to install skills and tools via `npx` without manually cloning the repository.

Each package:
- Downloads the corresponding tool/skill from this repository
- Installs it to the appropriate location (`~/.claude/skills/` or `.claude/skills/`)
- Tracks installation metadata for future updates

## Creating a New Package

To add a new installer package:

1. Create a new directory under `packages/` with the target name
2. Include:
   - `package.json` with `@prgrmrwy/<name>` naming
   - `bin/cli.js` as the CLI entry point
   - `lib/install.js` with installation logic
   - `README.md` with usage documentation
3. Update this README to list the new package
