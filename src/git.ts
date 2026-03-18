import { execa } from 'execa';
import { DiffResult, ChangeInfo } from './types';

/**
 * Check if current directory is a git repository
 */
export async function isGitRepo(): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if there are staged changes
 */
export async function hasStagedChanges(): Promise<boolean> {
  try {
    const { stdout } = await execa('git', ['diff', '--staged', '--quiet']);
    return false;
  } catch (error) {
    // git diff --staged --quiet returns exit code 1 if there are changes
    return true;
  }
}

/**
 * Get git diff of staged changes
 */
export async function getStagedDiff(): Promise<string> {
  try {
    const { stdout } = await execa('git', ['diff', '--staged']);
    return stdout;
  } catch (error) {
    return '';
  }
}

/**
 * Get list of staged files with their status
 */
export async function getStagedFiles(): Promise<ChangeInfo[]> {
  try {
    const { stdout } = await execa('git', [
      'diff',
      '--staged',
      '--name-status',
      '--numstat'
    ]);
    
    const changes: ChangeInfo[] = [];
    const lines = stdout.split('\n').filter(Boolean);
    
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const [status, additions, deletions, file] = parts;
        changes.push({
          file: file || parts[2],
          type: parseStatus(status),
          additions: parseInt(additions) || 0,
          deletions: parseInt(deletions) || 0
        });
      }
    }
    
    return changes;
  } catch (error) {
    return [];
  }
}

/**
 * Parse git status code to change type
 */
function parseStatus(status: string): ChangeInfo['type'] {
  switch (status.charAt(0)) {
    case 'A':
      return 'added';
    case 'M':
      return 'modified';
    case 'D':
      return 'deleted';
    case 'R':
      return 'renamed';
    default:
      return 'modified';
  }
}

/**
 * Get full diff result with statistics
 */
export async function getDiffResult(): Promise<DiffResult> {
  const changes = await getStagedFiles();
  const diff = await getStagedDiff();
  
  let additions = 0;
  let deletions = 0;
  
  for (const change of changes) {
    additions += change.additions;
    deletions += change.deletions;
  }
  
  return {
    files: changes.map(c => c.file),
    additions,
    deletions,
    changes
  };
}

/**
 * Stage all changes
 */
export async function stageAll(): Promise<void> {
  await execa('git', ['add', '.']);
}

/**
 * Create a commit with the given message
 */
export async function createCommit(message: string): Promise<void> {
  await execa('git', ['commit', '-m', message]);
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(): Promise<string> {
  try {
    const { stdout } = await execa('git', ['branch', '--show-current']);
    return stdout;
  } catch {
    return 'main';
  }
}
