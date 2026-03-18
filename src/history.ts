import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

const HISTORY_DIR = join(homedir(), '.ai-commit');
const HISTORY_FILE = join(HISTORY_DIR, 'history.json');

export interface HistoryEntry {
  id: string;
  timestamp: string;
  message: string;
  files: string[];
  branch: string;
}

/**
 * Ensure history directory exists
 */
function ensureHistoryDir(): void {
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

/**
 * Load commit history
 */
export function loadHistory(): HistoryEntry[] {
  ensureHistoryDir();
  
  if (!existsSync(HISTORY_FILE)) {
    return [];
  }

  try {
    const content = readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * Save commit to history
 */
export function saveToHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
  ensureHistoryDir();
  
  const history = loadHistory();
  const newEntry: HistoryEntry = {
    id: `commit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry
  };

  history.unshift(newEntry);
  
  // Keep only last 100 entries
  const trimmed = history.slice(0, 100);
  writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
}

/**
 * Get recent commits
 */
export function getRecentCommits(limit: number = 10): HistoryEntry[] {
  const history = loadHistory();
  return history.slice(0, limit);
}

/**
 * Clear history
 */
export function clearHistory(): void {
  if (existsSync(HISTORY_FILE)) {
    writeFileSync(HISTORY_FILE, '[]');
  }
}

/**
 * Search history
 */
export function searchHistory(query: string): HistoryEntry[] {
  const history = loadHistory();
  const lowerQuery = query.toLowerCase();
  
  return history.filter(entry => 
    entry.message.toLowerCase().includes(lowerQuery) ||
    entry.files.some(f => f.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get statistics
 */
export function getStats(): {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
} {
  const history = loadHistory();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setMonth(monthStart.getMonth() - 1);

  return {
    total: history.length,
    today: history.filter(e => new Date(e.timestamp) >= todayStart).length,
    thisWeek: history.filter(e => new Date(e.timestamp) >= weekStart).length,
    thisMonth: history.filter(e => new Date(e.timestamp) >= monthStart).length
  };
}
