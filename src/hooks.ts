import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

const HOOK_NAME = 'prepare-commit-msg';
const HOOK_CONTENT = `#!/bin/sh
# ai-commit hook - automatically generate commit message
# This hook is triggered before the commit message editor opens

# Only run if there's no message file (not amending)
if [ -z "$2" ]; then
    # Get the commit message from ai-commit
    MSG=$(ai-commit --dry-run --style conventional --lang zh 2>/dev/null | head -n 1)
    
    if [ -n "$MSG" ]; then
        # Write the message to the commit file
        echo "$MSG" > "$1"
        echo "✅ ai-commit: Generated commit message"
    fi
fi
`;

export interface HookResult {
  success: boolean;
  message: string;
  path?: string;
}

/**
 * Get git hooks directory
 */
export function getHooksDir(repoPath: string = process.cwd()): string | null {
  const gitDir = join(repoPath, '.git');
  
  if (!existsSync(gitDir)) {
    return null;
  }
  
  // Check for core.hooksPath in git config
  try {
    const { execSync } = require('child_process');
    const customPath = execSync('git config --get core.hooksPath', { 
      cwd: repoPath,
      encoding: 'utf-8' 
    }).trim();
    
    if (customPath) {
      return customPath;
    }
  } catch {
    // Ignore if config doesn't exist
  }
  
  return join(gitDir, 'hooks');
}

/**
 * Check if hook is installed
 */
export function isHookInstalled(repoPath: string = process.cwd()): boolean {
  const hooksDir = getHooksDir(repoPath);
  if (!hooksDir) return false;
  
  const hookPath = join(hooksDir, HOOK_NAME);
  return existsSync(hookPath);
}

/**
 * Install the prepare-commit-msg hook
 */
export function installHook(repoPath: string = process.cwd()): HookResult {
  const hooksDir = getHooksDir(repoPath);
  
  if (!hooksDir) {
    return {
      success: false,
      message: 'Not a git repository'
    };
  }
  
  // Create hooks directory if it doesn't exist
  if (!existsSync(hooksDir)) {
    mkdirSync(hooksDir, { recursive: true });
  }
  
  const hookPath = join(hooksDir, HOOK_NAME);
  
  // Check if hook already exists
  if (existsSync(hookPath)) {
    const existingContent = readFileSync(hookPath, 'utf-8');
    
    if (existingContent.includes('ai-commit')) {
      return {
        success: true,
        message: 'Hook is already installed',
        path: hookPath
      };
    }
    
    // Backup existing hook
    const backupPath = `${hookPath}.backup`;
    writeFileSync(backupPath, existingContent);
    console.log(chalk.yellow(`⚠️  Existing hook backed up to: ${backupPath}`));
  }
  
  // Write the hook
  writeFileSync(hookPath, HOOK_CONTENT, { mode: 0o755 });
  
  return {
    success: true,
    message: 'Hook installed successfully',
    path: hookPath
  };
}

/**
 * Uninstall the prepare-commit-msg hook
 */
export function uninstallHook(repoPath: string = process.cwd()): HookResult {
  const hooksDir = getHooksDir(repoPath);
  
  if (!hooksDir) {
    return {
      success: false,
      message: 'Not a git repository'
    };
  }
  
  const hookPath = join(hooksDir, HOOK_NAME);
  
  if (!existsSync(hookPath)) {
    return {
      success: false,
      message: 'No hook found'
    };
  }
  
  const existingContent = readFileSync(hookPath, 'utf-8');
  
  if (!existingContent.includes('ai-commit')) {
    return {
      success: false,
      message: 'Hook exists but was not installed by ai-commit'
    };
  }
  
  // Remove the hook
  unlinkSync(hookPath);
  
  // Restore backup if exists
  const backupPath = `${hookPath}.backup`;
  if (existsSync(backupPath)) {
    const backupContent = readFileSync(backupPath, 'utf-8');
    writeFileSync(hookPath, backupContent, { mode: 0o755 });
    unlinkSync(backupPath);
    return {
      success: true,
      message: 'Hook removed and backup restored'
    };
  }
  
  return {
    success: true,
    message: 'Hook removed successfully'
  };
}

/**
 * Get hook status
 */
export function getHookStatus(repoPath: string = process.cwd()): {
  installed: boolean;
  path?: string;
  isAiCommit: boolean;
} {
  const hooksDir = getHooksDir(repoPath);
  
  if (!hooksDir) {
    return { installed: false, isAiCommit: false };
  }
  
  const hookPath = join(hooksDir, HOOK_NAME);
  
  if (!existsSync(hookPath)) {
    return { installed: false, isAiCommit: false };
  }
  
  const content = readFileSync(hookPath, 'utf-8');
  
  return {
    installed: true,
    path: hookPath,
    isAiCommit: content.includes('ai-commit')
  };
}
