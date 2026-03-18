// Commit message styles
export type CommitStyle = 'conventional' | 'angular' | 'gitmoji';

// Output language
export type Language = 'en' | 'zh';

// Commit type definitions
export interface CommitType {
  type: string;
  emoji?: string;
  description: {
    en: string;
    zh: string;
  };
}

// Git diff result
export interface DiffResult {
  files: string[];
  additions: number;
  deletions: number;
  changes: ChangeInfo[];
}

// Change information
export interface ChangeInfo {
  file: string;
  type: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
}

// Generated commit message
export interface CommitMessage {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  raw: string;
}

// CLI options
export interface CliOptions {
  style?: CommitStyle;
  lang?: Language;
  commit?: boolean;
  dryRun?: boolean;
}
