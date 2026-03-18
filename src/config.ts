import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { CommitStyle, Language } from './types';

export interface Config {
  style: CommitStyle;
  lang: Language;
  maxLength: number;
  showEmoji: boolean;
  autoAdd: boolean;
  defaultScope: string | null;
}

const CONFIG_PATH = join(homedir(), '.ai-commit.json');

const DEFAULT_CONFIG: Config = {
  style: 'conventional',
  lang: 'zh',
  maxLength: 72,
  showEmoji: false,
  autoAdd: false,
  defaultScope: null
};

/**
 * Load config from file
 */
export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) {
    return DEFAULT_CONFIG;
  }

  try {
    const content = readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content);
    return { ...DEFAULT_CONFIG, ...config };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Save config to file
 */
export function saveConfig(config: Partial<Config>): void {
  const current = loadConfig();
  const updated = { ...current, ...config };
  writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2));
}

/**
 * Get config file path
 */
export function getConfigPath(): string {
  return CONFIG_PATH;
}
