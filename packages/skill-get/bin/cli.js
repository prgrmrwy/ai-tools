#!/usr/bin/env node

const { installSkill } = require('../lib/install.js');

function parseArgs(args) {
  const options = { global: false, force: false, help: false };
  for (const arg of args) {
    if (arg === '--global' || arg === '-g') options.global = true;
    else if (arg === '--local' || arg === '-l') options.global = false;
    else if (arg === '--force' || arg === '-f') options.force = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
  }
  return options;
}

function showHelp() {
  console.log(`
@prgrmrwy/install-skill-get - Install Claude Code skill-get

Usage:
  npx @prgrmrwy/install-skill-get [options]

Options:
  -l, --local     Install to project level (.claude/skills/) [default]
  -g, --global    Install to user level (~/.claude/skills/)
  -f, --force     Force reinstall even if already installed
  -h, --help      Show this help message

Examples:
  npx @prgrmrwy/install-skill-get              # Install to current project
  npx @prgrmrwy/install-skill-get --global     # Install to user level
  npx @prgrmrwy/install-skill-get --force      # Force reinstall
`);
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const result = await installSkill(options);
  process.exit(result.success ? 0 : 1);
}

main();
