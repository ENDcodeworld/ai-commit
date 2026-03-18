import { CommitType } from './types';

// Standard commit types with descriptions
export const COMMIT_TYPES: CommitType[] = [
  {
    type: 'feat',
    emoji: '✨',
    description: { en: 'A new feature', zh: '新增功能' }
  },
  {
    type: 'fix',
    emoji: '🐛',
    description: { en: 'A bug fix', zh: '修复bug' }
  },
  {
    type: 'docs',
    emoji: '📝',
    description: { en: 'Documentation only changes', zh: '文档更新' }
  },
  {
    type: 'style',
    emoji: '💄',
    description: { en: 'Code style changes (formatting, etc)', zh: '代码格式调整' }
  },
  {
    type: 'refactor',
    emoji: '♻️',
    description: { en: 'Code refactoring', zh: '代码重构' }
  },
  {
    type: 'perf',
    emoji: '⚡',
    description: { en: 'Performance improvements', zh: '性能优化' }
  },
  {
    type: 'test',
    emoji: '✅',
    description: { en: 'Adding or updating tests', zh: '测试相关' }
  },
  {
    type: 'build',
    emoji: '📦',
    description: { en: 'Build system or dependency changes', zh: '构建系统/依赖更新' }
  },
  {
    type: 'ci',
    emoji: '👷',
    description: { en: 'CI configuration changes', zh: 'CI配置更改' }
  },
  {
    type: 'chore',
    emoji: '🔧',
    description: { en: 'Other changes that don\'t modify src or test', zh: '其他杂项' }
  },
  {
    type: 'revert',
    emoji: '⏪',
    description: { en: 'Reverts a previous commit', zh: '回滚提交' }
  }
];

// File extension to scope mapping
export const EXTENSION_SCOPE_MAP: Record<string, string> = {
  // Frontend
  '.vue': 'ui',
  '.jsx': 'ui',
  '.tsx': 'ui',
  '.css': 'ui',
  '.scss': 'ui',
  '.less': 'ui',
  '.html': 'ui',
  
  // Backend
  '.go': 'api',
  '.rs': 'api',
  '.py': 'api',
  '.java': 'api',
  
  // Config
  '.json': 'config',
  '.yaml': 'config',
  '.yml': 'config',
  '.toml': 'config',
  
  // Docs
  '.md': 'docs',
  '.txt': 'docs',
  
  // Test
  '.test.ts': 'test',
  '.spec.ts': 'test',
  '.test.js': 'test',
  '.spec.js': 'test',
};

// Keywords that suggest specific commit types
export const KEYWORD_TYPE_MAP: Record<string, string> = {
  // feat keywords
  'add': 'feat',
  'create': 'feat',
  'implement': 'feat',
  'support': 'feat',
  'introduce': 'feat',
  '新增': 'feat',
  '添加': 'feat',
  '实现': 'feat',
  '支持': 'feat',
  
  // fix keywords
  'fix': 'fix',
  'bug': 'fix',
  'issue': 'fix',
  'error': 'fix',
  'problem': 'fix',
  'repair': 'fix',
  '修复': 'fix',
  '解决': 'fix',
  '修正': 'fix',
  
  // docs keywords
  'doc': 'docs',
  'readme': 'docs',
  'comment': 'docs',
  '文档': 'docs',
  '说明': 'docs',
  
  // refactor keywords
  'refactor': 'refactor',
  'restructure': 'refactor',
  'reorganize': 'refactor',
  '重构': 'refactor',
  '优化': 'refactor',
  
  // style keywords
  'style': 'style',
  'format': 'style',
  'lint': 'style',
  '格式': 'style',
  '样式': 'style',
  
  // test keywords
  'test': 'test',
  'spec': 'test',
  '测试': 'test',
  
  // perf keywords
  'perf': 'perf',
  'optimize': 'perf',
  'speed': 'perf',
  '性能': 'perf',
  
  // build keywords
  'build': 'build',
  'dep': 'build',
  'dependency': 'build',
  'package': 'build',
  '依赖': 'build',
  '构建': 'build',
};
