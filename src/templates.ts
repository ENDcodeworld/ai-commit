import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';

const TEMPLATES_DIR = join(homedir(), '.ai-commit', 'templates');

export interface Template {
  name: string;
  description?: string;
  pattern: string;
  example: string;
}

// Default templates
const DEFAULT_TEMPLATES: Template[] = [
  {
    name: 'default',
    description: 'Standard commit format',
    pattern: '{type}: {subject}',
    example: 'feat: add user login'
  },
  {
    name: 'detailed',
    description: 'With scope and body',
    pattern: '{type}({scope}): {subject}\n\n{body}',
    example: 'feat(auth): add user login\n\nAdd login page with OAuth support'
  },
  {
    name: 'breaking',
    description: 'Breaking change format',
    pattern: '{type}!: {subject}\n\nBREAKING CHANGE: {body}',
    example: 'feat!: redesign API\n\nBREAKING CHANGE: All endpoints changed'
  },
  {
    name: 'simple',
    description: 'Minimal format',
    pattern: '{emoji} {subject}',
    example: '✨ Add user login'
  }
];

/**
 * Ensure templates directory exists
 */
function ensureTemplatesDir(): void {
  if (!existsSync(TEMPLATES_DIR)) {
    mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
}

/**
 * Load all templates
 */
export function loadTemplates(): Template[] {
  ensureTemplatesDir();
  
  const templates: Template[] = [...DEFAULT_TEMPLATES];
  
  // Load custom templates
  if (existsSync(TEMPLATES_DIR)) {
    const files = readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const content = readFileSync(join(TEMPLATES_DIR, file), 'utf-8');
        const template = JSON.parse(content);
        templates.push(template);
      } catch {
        // Ignore invalid templates
      }
    }
  }
  
  return templates;
}

/**
 * Get template by name
 */
export function getTemplate(name: string): Template | undefined {
  const templates = loadTemplates();
  return templates.find(t => t.name === name);
}

/**
 * Save custom template
 */
export function saveTemplate(template: Template): void {
  ensureTemplatesDir();
  
  const filePath = join(TEMPLATES_DIR, `${template.name}.json`);
  writeFileSync(filePath, JSON.stringify(template, null, 2));
}

/**
 * Delete custom template
 */
export function deleteTemplate(name: string): boolean {
  const filePath = join(TEMPLATES_DIR, `${name}.json`);
  
  if (existsSync(filePath)) {
    const { unlinkSync } = require('fs');
    unlinkSync(filePath);
    return true;
  }
  
  return false;
}

/**
 * Format message with template
 */
export function formatWithTemplate(
  template: Template,
  data: {
    type?: string;
    scope?: string;
    subject?: string;
    body?: string;
    emoji?: string;
  }
): string {
  let message = template.pattern;
  
  message = message.replace(/{type}/g, data.type || '');
  message = message.replace(/{scope}/g, data.scope || '');
  message = message.replace(/{subject}/g, data.subject || '');
  message = message.replace(/{body}/g, data.body || '');
  message = message.replace(/{emoji}/g, data.emoji || '');
  
  // Clean up empty placeholders
  message = message.replace(/\(\): /g, ': ');
  message = message.replace(/\(\)/g, '');
  message = message.trim();
  
  return message;
}

/**
 * Interactive template creator
 */
export async function createTemplateInteractive(): Promise<Template> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Template name:',
      validate: (input: string) => {
        if (!input.trim()) return 'Name is required';
        if (!/^[a-z0-9-]+$/.test(input)) return 'Only lowercase letters, numbers, and hyphens';
        return true;
      }
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):'
    },
    {
      type: 'input',
      name: 'pattern',
      message: 'Pattern (use {type}, {scope}, {subject}, {body}, {emoji}):',
      default: '{type}: {subject}',
      validate: (input: string) => {
        if (!input.includes('{subject}')) return 'Pattern must include {subject}';
        return true;
      }
    },
    {
      type: 'input',
      name: 'example',
      message: 'Example:',
      default: 'feat: add feature'
    }
  ]);
  
  return {
    name: answers.name,
    description: answers.description || undefined,
    pattern: answers.pattern,
    example: answers.example
  };
}

/**
 * List templates with details
 */
export function listTemplates(): void {
  const templates = loadTemplates();
  
  console.log(chalk.blue('\n📋 Commit Message Templates:\n'));
  
  for (const template of templates) {
    const isDefault = DEFAULT_TEMPLATES.some(t => t.name === template.name);
    const badge = isDefault ? chalk.gray('[default]') : chalk.green('[custom]');
    
    console.log(`  ${chalk.cyan(template.name)} ${badge}`);
    if (template.description) {
      console.log(chalk.gray(`    ${template.description}`));
    }
    console.log(chalk.gray(`    Pattern: ${template.pattern}`));
    console.log(chalk.gray(`    Example: ${template.example}`));
    console.log();
  }
  
  console.log(chalk.gray(`Templates directory: ${TEMPLATES_DIR}`));
}
