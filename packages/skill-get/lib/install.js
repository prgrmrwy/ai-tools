#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const REPO_URL = 'https://github.com/prgrmrwy/ai-tools.git';
const SKILL_PATH = '.claude/skills/skill-get';
const SKILL_NAME = 'skill-get';

/**
 * Download a file from URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

/**
 * Execute command and return output
 */
function execCommand(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (error) {
    throw new Error(`Command failed: ${cmd}\n${error.message}`);
  }
}

/**
 * Check if git is available
 */
function hasGit() {
  try {
    execSync('git --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create directory recursively
 */
function mkdirp(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  mkdirp(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Remove directory recursively
 */
function rmdir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Get installation target directory
 */
function getTargetDir(isGlobal) {
  if (isGlobal) {
    return path.join(os.homedir(), '.claude', 'skills', SKILL_NAME);
  } else {
    return path.join(process.cwd(), '.claude', 'skills', SKILL_NAME);
  }
}

/**
 * Install skill-get from GitHub
 */
async function installSkill(options = {}) {
  const { global: isGlobal = false, force = false } = options;
  const targetDir = getTargetDir(isGlobal);
  const targetType = isGlobal ? 'user (~/.claude/skills/)' : 'project (.claude/skills/)';

  console.log(`\n📦 Installing skill-get to ${targetType}...`);
  console.log(`   Target: ${targetDir}\n`);

  // Check if already installed
  if (fs.existsSync(targetDir) && !force) {
    const skillMd = path.join(targetDir, 'SKILL.md');
    if (fs.existsSync(skillMd)) {
      console.log('✅ skill-get is already installed.');
      console.log(`   Location: ${targetDir}`);
      console.log('\n   Use --force to reinstall.');
      return { success: true, alreadyInstalled: true, path: targetDir };
    }
  }

  // Create temp directory for cloning
  const tempDir = path.join(os.tmpdir(), `skill-get-install-${Date.now()}`);

  try {
    mkdirp(tempDir);

    if (hasGit()) {
      console.log('📥 Cloning repository (sparse checkout)...');

      // Use sparse checkout for efficiency
      execCommand(`git clone --depth 1 --filter=blob:none --sparse "${REPO_URL}" "${tempDir}/repo"`, {
        stdio: 'inherit'
      });

      execCommand(`git sparse-checkout set "${SKILL_PATH}"`, {
        cwd: path.join(tempDir, 'repo'),
        stdio: 'inherit'
      });

      const sourceDir = path.join(tempDir, 'repo', SKILL_PATH);

      if (!fs.existsSync(sourceDir)) {
        throw new Error(`Skill path not found in repository: ${SKILL_PATH}`);
      }

      // Ensure parent directory exists
      mkdirp(path.dirname(targetDir));

      // Remove existing if force
      if (force && fs.existsSync(targetDir)) {
        rmdir(targetDir);
      }

      // Copy skill files
      console.log('📋 Copying skill files...');
      copyDir(sourceDir, targetDir);

    } else {
      // Fallback: download files directly via raw.githubusercontent.com
      console.log('📥 Downloading skill files (git not available)...');

      const baseUrl = 'https://raw.githubusercontent.com/prgrmrwy/ai-tools/main/.claude/skills/skill-get';
      const files = [
        'SKILL.md',
        '.skillignore',
        'scripts/install_skill.sh',
        'scripts/list_skills.sh',
        'scripts/package_skill.py',
        'references/marketplaces.md'
      ];

      mkdirp(targetDir);
      mkdirp(path.join(targetDir, 'scripts'));
      mkdirp(path.join(targetDir, 'references'));

      for (const file of files) {
        const url = `${baseUrl}/${file}`;
        const dest = path.join(targetDir, file);
        console.log(`   Downloading ${file}...`);
        try {
          await downloadFile(url, dest);
        } catch (err) {
          console.warn(`   Warning: Could not download ${file}: ${err.message}`);
        }
      }
    }

    // Verify installation
    const skillMd = path.join(targetDir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      throw new Error('Installation verification failed: SKILL.md not found');
    }

    // Create skill metadata
    const metaPath = path.join(targetDir, '.skill-meta.json');
    const metadata = {
      name: SKILL_NAME,
      source: REPO_URL,
      sourcePath: SKILL_PATH,
      installedAt: new Date().toISOString(),
      installedBy: '@prgrmrwy/skill-get',
      version: require('../package.json').version
    };
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

    console.log('\n✅ skill-get installed successfully!');
    console.log(`   Location: ${targetDir}`);
    console.log('\n📖 Usage:');
    console.log('   skill-get is now available as a Claude Code skill.');
    console.log('   Use it to install other skills from various sources.\n');

    return { success: true, path: targetDir };

  } catch (error) {
    console.error('\n❌ Installation failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    // Cleanup temp directory
    rmdir(tempDir);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const options = {
    global: true,
    force: false,
    help: false
  };

  for (const arg of args) {
    switch (arg) {
      case '--global':
      case '-g':
        options.global = true;
        break;
      case '--local':
      case '-l':
        options.global = false;
        break;
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
@prgrmrwy/skill-get - Install Claude Code skill-get

Usage:
  npx @prgrmrwy/skill-get [options]
  skill-get [options]

Options:
  -g, --global    Install to user level (~/.claude/skills/) [default]
  -l, --local     Install to project level (.claude/skills/)
  -f, --force     Force reinstall even if already installed
  -h, --help      Show this help message

Examples:
  npx @prgrmrwy/skill-get              # Install globally (user level)
  npx @prgrmrwy/skill-get --local      # Install to current project
  npx @prgrmrwy/skill-get --force      # Force reinstall

About skill-get:
  skill-get is Claude Code's unified installer for skills from multiple sources:
  - Official anthropics/skills repository
  - Third-party marketplaces (prompts.chat, skills.sh, etc.)
  - GitHub repositories
  - Direct URLs
  - Local paths

Source:
  https://github.com/prgrmrwy/ai-tools/tree/main/.claude/skills/skill-get
`);
}

// Main execution
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

// Export for programmatic use
module.exports = { installSkill, getTargetDir };

// Run if executed directly
if (require.main === module) {
  main();
}
