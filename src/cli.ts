#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { 
  isGitRepo, 
  hasStagedChanges, 
  getStagedDiff, 
  getDiffResult, 
  stageAll, 
  createCommit,
  getCurrentBranch 
} from './git';
import { generateCommitOptions, formatCommitMessage } from './generator';
import { loadConfig, saveConfig, getConfigPath } from './config';
import { saveToHistory, getRecentCommits, clearHistory, searchHistory, getStats } from './history';
import { CommitStyle, Language } from './types';

const program = new Command();

program
  .name('ai-commit')
  .description('🤖 AI-powered git commit message generator')
  .version('1.1.0');

// Main command - generate commit message
program
  .command('gen', { isDefault: true })
  .description('Generate commit message from staged changes')
  .option('-s, --style <style>', 'Commit style (conventional, angular, gitmoji)')
  .option('-l, --lang <lang>', 'Output language (en, zh)')
  .option('-c, --commit', 'Auto commit after generating message', false)
  .option('-d, --dry-run', 'Show message without committing', false)
  .option('-a, --add', 'Stage all changes before commit', false)
  .option('-y, --yes', 'Skip confirmation prompts', false)
  .action(async (options) => {
    try {
      await generateCommit(options);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Configure ai-commit settings')
  .option('-s, --style <style>', 'Default commit style')
  .option('-l, --lang <lang>', 'Default language')
  .option('-m, --max-length <number>', 'Max message length')
  .option('-e, --emoji', 'Show emoji in messages')
  .option('--auto-add', 'Auto stage all changes')
  .option('--show', 'Show current config')
  .option('--reset', 'Reset to default config')
  .action(async (options) => {
    try {
      if (options.show) {
        const config = loadConfig();
        console.log(chalk.blue('\n📋 Current Configuration:\n'));
        console.log(chalk.gray(`Config file: ${getConfigPath()}`));
        console.log(JSON.stringify(config, null, 2));
        return;
      }

      if (options.reset) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Reset to default configuration?',
            default: false
          }
        ]);

        if (confirm) {
          saveConfig({
            style: 'conventional',
            lang: 'zh',
            maxLength: 72,
            showEmoji: false,
            autoAdd: false,
            defaultScope: null
          });
          console.log(chalk.green('✅ Configuration reset to defaults'));
        }
        return;
      }

      const updates: Record<string, any> = {};
      
      if (options.style) {
        updates.style = options.style;
      }
      if (options.lang) {
        updates.lang = options.lang;
      }
      if (options.maxLength) {
        updates.maxLength = parseInt(options.maxLength);
      }
      if (options.emoji !== undefined) {
        updates.showEmoji = options.emoji;
      }
      if (options.autoAdd !== undefined) {
        updates.autoAdd = options.autoAdd;
      }

      if (Object.keys(updates).length > 0) {
        saveConfig(updates);
        console.log(chalk.green('✅ Configuration updated'));
      } else {
        // Interactive config
        const config = loadConfig();
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'style',
            message: 'Default commit style:',
            choices: ['conventional', 'angular', 'gitmoji'],
            default: config.style
          },
          {
            type: 'list',
            name: 'lang',
            message: 'Default language:',
            choices: ['en', 'zh'],
            default: config.lang
          },
          {
            type: 'number',
            name: 'maxLength',
            message: 'Max message length:',
            default: config.maxLength
          },
          {
            type: 'confirm',
            name: 'showEmoji',
            message: 'Show emoji in messages?',
            default: config.showEmoji
          },
          {
            type: 'confirm',
            name: 'autoAdd',
            message: 'Auto stage all changes?',
            default: config.autoAdd
          }
        ]);

        saveConfig(answers);
        console.log(chalk.green('✅ Configuration saved'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// History command
program
  .command('history')
  .description('View commit history')
  .option('-l, --limit <number>', 'Number of entries to show', '20')
  .option('-s, --search <query>', 'Search history')
  .option('--clear', 'Clear history')
  .option('--stats', 'Show statistics')
  .action(async (options) => {
    try {
      if (options.clear) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Clear all history?',
            default: false
          }
        ]);

        if (confirm) {
          clearHistory();
          console.log(chalk.green('✅ History cleared'));
        }
        return;
      }

      if (options.stats) {
        const stats = getStats();
        console.log(chalk.blue('\n📊 Commit Statistics:\n'));
        console.log(`  Total commits: ${chalk.cyan(stats.total)}`);
        console.log(`  Today: ${chalk.green(stats.today)}`);
        console.log(`  This week: ${chalk.yellow(stats.thisWeek)}`);
        console.log(`  This month: ${chalk.magenta(stats.thisMonth)}`);
        return;
      }

      let history = options.search 
        ? searchHistory(options.search)
        : getRecentCommits(parseInt(options.limit));

      if (history.length === 0) {
        console.log(chalk.yellow('📭 No history found'));
        return;
      }

      const table = new Table({
        head: [chalk.cyan('Time'), chalk.cyan('Message'), chalk.cyan('Files')],
        colWidths: [20, 40, 30]
      });

      for (const entry of history) {
        const time = new Date(entry.timestamp).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        table.push([
          chalk.gray(time),
          entry.message.substring(0, 38) + (entry.message.length > 38 ? '...' : ''),
          entry.files.slice(0, 3).join(', ') + (entry.files.length > 3 ? '...' : '')
        ]);
      }

      console.log(table.toString());
      console.log(chalk.gray(`\nShowing ${history.length} entries`));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Hook command
program
  .command('hook')
  .description('Install git hook for automatic commit messages')
  .option('--install', 'Install prepare-commit-msg hook')
  .option('--uninstall', 'Remove hook')
  .action(async (options) => {
    console.log(chalk.yellow('⚠️  Git hook feature coming soon!'));
    console.log(chalk.gray('   For now, use: ai-commit -c'));
  });

async function generateCommit(options: {
  style?: CommitStyle;
  lang?: Language;
  commit: boolean;
  dryRun: boolean;
  add: boolean;
  yes: boolean;
}) {
  // Load config
  const config = loadConfig();
  
  // Merge options with config
  const style = options.style || config.style;
  const lang = options.lang || config.lang;
  const autoAdd = options.add || config.autoAdd;

  // Check if in git repo
  if (!(await isGitRepo())) {
    throw new Error('Not a git repository. Please run this command in a git repository.');
  }

  // Stage all if requested
  if (autoAdd) {
    console.log(chalk.blue('📦 Staging all changes...'));
    await stageAll();
  }

  // Check for staged changes
  if (!(await hasStagedChanges())) {
    console.log(chalk.yellow('⚠️  No staged changes found.'));
    console.log(chalk.gray('   Use "git add <files>" or run with --add flag'));
    return;
  }

  // Get diff information
  const diff = await getStagedDiff();
  const diffResult = await getDiffResult();
  
  if (!diff) {
    throw new Error('Failed to get diff content');
  }

  // Show summary
  console.log(chalk.blue('\n📊 Changes summary:'));
  console.log(chalk.gray(`   Files: ${diffResult.files.length}`));
  console.log(chalk.gray(`   Additions: +${diffResult.additions}`));
  console.log(chalk.gray(`   Deletions: -${diffResult.deletions}`));
  
  // Generate commit messages
  const messages = generateCommitOptions(diff, diffResult, lang);
  
  console.log(chalk.green('\n💡 Suggested commit messages:\n'));
  
  // Show all style options
  const styleNames: Record<string, string> = {
    conventional: 'Conventional',
    angular: 'Angular',
    gitmoji: 'Gitmoji'
  };
  
  messages.forEach((msg, index) => {
    console.log(chalk.cyan(`  [${index + 1}] ${styleNames[msg.type as keyof typeof styleNames] || msg.type}:`));
    console.log(chalk.white(`      ${msg.raw}`));
    console.log();
  });

  // Dry run mode
  if (options.dryRun) {
    return;
  }

  // Auto commit mode
  if (options.commit || options.yes) {
    const selected = messages.find(m => m.type === style) || messages[0];
    console.log(chalk.blue('📝 Creating commit...'));
    await createCommit(selected.raw);
    
    // Save to history
    saveToHistory({
      message: selected.raw,
      files: diffResult.files,
      branch: await getCurrentBranch()
    });
    
    console.log(chalk.green('✅ Commit created successfully!'));
    console.log(chalk.gray(`   ${selected.raw}`));
    return;
  }

  // Interactive mode
  const { chosenIndex, shouldCommit } = await inquirer.prompt([
    {
      type: 'list',
      name: 'chosenIndex',
      message: 'Choose a commit message:',
      choices: messages.map((msg, i) => ({
        name: msg.raw,
        value: i
      }))
    },
    {
      type: 'confirm',
      name: 'shouldCommit',
      message: 'Create commit?',
      default: true
    }
  ]);

  if (shouldCommit) {
    const selected = messages[chosenIndex];
    console.log(chalk.blue('\n📝 Creating commit...'));
    await createCommit(selected.raw);
    
    // Save to history
    saveToHistory({
      message: selected.raw,
      files: diffResult.files,
      branch: await getCurrentBranch()
    });
    
    console.log(chalk.green('✅ Commit created successfully!'));
    console.log(chalk.gray(`   ${selected.raw}`));
    
    // Show branch info
    const branch = await getCurrentBranch();
    console.log(chalk.gray(`   Branch: ${branch}`));
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Unexpected error:'), error.message);
  process.exit(1);
});

program.parse();
