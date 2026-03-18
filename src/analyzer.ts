import { DiffResult, CommitType, CommitStyle, Language } from './types';
import { COMMIT_TYPES, EXTENSION_SCOPE_MAP, KEYWORD_TYPE_MAP } from './constants';

/**
 * Analyze diff content and extract meaningful information
 */
export function analyzeDiff(diff: string, diffResult: DiffResult): {
  type: string;
  scope?: string;
  subject: string;
  suggestedType: CommitType;
} {
  // Detect commit type from diff content
  const detectedType = detectCommitType(diff, diffResult);
  
  // Detect scope from file paths
  const scope = detectScope(diffResult.files);
  
  // Generate subject from changes
  const subject = generateSubject(diff, diffResult, detectedType);
  
  const commitType = COMMIT_TYPES.find(t => t.type === detectedType) || COMMIT_TYPES[0];
  
  return {
    type: detectedType,
    scope,
    subject,
    suggestedType: commitType
  };
}

/**
 * Detect commit type from diff content and file changes
 */
function detectCommitType(diff: string, diffResult: DiffResult): string {
  const lowerDiff = diff.toLowerCase();
  const allFiles = diffResult.files.join(' ').toLowerCase();
  
  // Check keywords in diff content
  for (const [keyword, type] of Object.entries(KEYWORD_TYPE_MAP)) {
    if (lowerDiff.includes(keyword.toLowerCase())) {
      return type;
    }
  }
  
  // Check file patterns
  // If only documentation files changed
  if (diffResult.files.every(f => 
    f.endsWith('.md') || 
    f.endsWith('.txt') || 
    f.includes('doc') ||
    f.includes('readme')
  )) {
    return 'docs';
  }
  
  // If only test files changed
  if (diffResult.files.every(f => 
    f.includes('.test.') || 
    f.includes('.spec.') ||
    f.includes('__tests__')
  )) {
    return 'test';
  }
  
  // If config files changed
  if (diffResult.files.some(f => 
    f.includes('config') ||
    f.endsWith('.json') ||
    f.endsWith('.yaml') ||
    f.endsWith('.yml') ||
    f.includes('package') ||
    f.includes('tsconfig')
  )) {
    // Check if it's dependency update
    if (lowerDiff.includes('package') && (lowerDiff.includes('depend') || lowerDiff.includes('version'))) {
      return 'build';
    }
  }
  
  // If all files are new
  if (diffResult.changes.every(c => c.type === 'added')) {
    return 'feat';
  }
  
  // If all files are deleted
  if (diffResult.changes.every(c => c.type === 'deleted')) {
    return 'refactor';
  }
  
  // Default to chore
  return 'chore';
}

/**
 * Detect scope from file paths
 */
function detectScope(files: string[]): string | undefined {
  if (files.length === 0) return undefined;
  
  // Check extensions for common scopes
  const extensions = files.map(f => {
    const match = f.match(/\.[^.]+$/);
    return match ? match[0] : '';
  });
  
  // If all files have the same extension
  const uniqueExtensions = [...new Set(extensions)];
  if (uniqueExtensions.length === 1) {
    const ext = uniqueExtensions[0];
    if (EXTENSION_SCOPE_MAP[ext]) {
      return EXTENSION_SCOPE_MAP[ext];
    }
  }
  
  // Check directory patterns
  const dirs = files.map(f => {
    const parts = f.split('/');
    return parts.length > 1 ? parts[0] : '';
  }).filter(Boolean);
  
  const uniqueDirs = [...new Set(dirs)];
  if (uniqueDirs.length === 1) {
    return uniqueDirs[0].replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
  }
  
  return undefined;
}

/**
 * Generate a subject line from the diff
 */
function generateSubject(diff: string, diffResult: DiffResult, type: string): string {
  const lang = detectLanguage(diff);
  
  // Try to extract meaningful action from diff
  const lines = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
  const addedContent = lines.map(l => l.substring(1).trim()).filter(Boolean);
  
  // Look for function/class names
  const funcMatch = diff.match(/(?:function|def|class|func|fn|public|private)\s+(\w+)/);
  if (funcMatch) {
    const name = funcMatch[1];
    return lang === 'zh' 
      ? `${type === 'feat' ? '添加' : type === 'fix' ? '修复' : '更新'} ${name}`
      : `${type === 'feat' ? 'Add' : type === 'fix' ? 'Fix' : 'Update'} ${name}`;
  }
  
  // Look for component names (React/Vue)
  const componentMatch = diff.match(/(?:component|Component|const)\s+(\w+)/);
  if (componentMatch) {
    const name = componentMatch[1];
    return lang === 'zh'
      ? `${type === 'feat' ? '添加' : '更新'} ${name} 组件`
      : `${type === 'feat' ? 'Add' : 'Update'} ${name} component`;
  }
  
  // Use file names
  if (diffResult.files.length === 1) {
    const file = diffResult.files[0];
    const fileName = file.split('/').pop() || file;
    return lang === 'zh'
      ? `更新 ${fileName}`
      : `Update ${fileName}`;
  }
  
  if (diffResult.files.length > 1) {
    return lang === 'zh'
      ? `更新 ${diffResult.files.length} 个文件`
      : `Update ${diffResult.files.length} files`;
  }
  
  return lang === 'zh' ? '更新代码' : 'Update code';
}

/**
 * Detect language of the code/comments
 */
function detectLanguage(diff: string): 'en' | 'zh' {
  // Count Chinese characters
  const chineseChars = (diff.match(/[\u4e00-\u9fa5]/g) || []).length;
  const totalChars = diff.length;
  
  if (chineseChars / totalChars > 0.05) {
    return 'zh';
  }
  return 'en';
}
