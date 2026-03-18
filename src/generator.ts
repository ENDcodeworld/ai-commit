import { CommitStyle, Language, CommitMessage, DiffResult } from './types';
import { COMMIT_TYPES } from './constants';
import { analyzeDiff } from './analyzer';

/**
 * Generate commit message based on diff and style
 */
export function generateCommitMessage(
  diff: string,
  diffResult: DiffResult,
  style: CommitStyle = 'conventional',
  lang: Language = 'zh'
): CommitMessage {
  const analysis = analyzeDiff(diff, diffResult);
  
  let raw: string;
  const commitType = COMMIT_TYPES.find(t => t.type === analysis.type) || COMMIT_TYPES[0];
  
  switch (style) {
    case 'gitmoji':
      raw = generateGitmojiMessage(analysis, commitType, lang);
      break;
    case 'angular':
      raw = generateAngularMessage(analysis, commitType, lang);
      break;
    case 'conventional':
    default:
      raw = generateConventionalMessage(analysis, commitType, lang);
      break;
  }
  
  return {
    type: analysis.type,
    scope: analysis.scope,
    subject: analysis.subject,
    raw
  };
}

/**
 * Generate Conventional Commits style message
 * Format: type: subject
 * Example: feat: add user login
 */
function generateConventionalMessage(
  analysis: { type: string; scope?: string; subject: string },
  commitType: typeof COMMIT_TYPES[0],
  lang: Language
): string {
  return `${analysis.type}: ${analysis.subject}`;
}

/**
 * Generate Angular style message
 * Format: type(scope): subject
 * Example: feat(auth): add user login
 */
function generateAngularMessage(
  analysis: { type: string; scope?: string; subject: string },
  commitType: typeof COMMIT_TYPES[0],
  lang: Language
): string {
  const scope = analysis.scope ? `(${analysis.scope})` : '';
  return `${analysis.type}${scope}: ${analysis.subject}`;
}

/**
 * Generate Gitmoji style message
 * Format: emoji subject
 * Example: ✨ Add user login
 */
function generateGitmojiMessage(
  analysis: { type: string; scope?: string; subject: string },
  commitType: typeof COMMIT_TYPES[0],
  lang: Language
): string {
  const emoji = commitType.emoji || '📝';
  return `${emoji} ${analysis.subject}`;
}

/**
 * Generate multiple commit message options for user to choose
 */
export function generateCommitOptions(
  diff: string,
  diffResult: DiffResult,
  lang: Language = 'zh'
): CommitMessage[] {
  const styles: CommitStyle[] = ['conventional', 'angular', 'gitmoji'];
  
  return styles.map(style => 
    generateCommitMessage(diff, diffResult, style, lang)
  );
}

/**
 * Format commit message for display
 */
export function formatCommitMessage(message: CommitMessage, lang: Language = 'zh'): string {
  const typeInfo = COMMIT_TYPES.find(t => t.type === message.type);
  const description = typeInfo ? typeInfo.description[lang] : '';
  
  return lang === 'zh'
    ? `${message.raw}\n    → ${description}`
    : `${message.raw}\n    → ${description}`;
}
