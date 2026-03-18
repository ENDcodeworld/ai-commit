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
  .option('--status', 'Check hook status')
  .action(async (options) => {
    try {
      const { installHook, uninstallHook, getHookStatus } = await import('./hooks');
      
      if (options.status) {
        const status = getHookStatus();
        console.log(chalk.blue('\n🔗 Git Hook Status:\n'));
        
        if (!status.installed) {
          console.log(chalk.yellow('  No hook installed'));
        } else {
          console.log(chalk.green(`  ✓ Hook installed: ${status.path}`));
          if (status.isAiCommit) {
            console.log(chalk.gray('    Managed by ai-commit'));
          } else {
            console.log(chalk.yellow('    Not managed by ai-commit'));
          }
        }
        
        console.log(chalk.gray('\n  Install with: ai-commit hook --install'));
        return;
      }
      
      if (options.uninstall) {
        const result = uninstallHook();
        
        if (result.success) {
          console.log(chalk.green(`✅ ${result.message}`));
        } else {
          console.log(chalk.red(`❌ ${result.message}`));
        }
        return;
      }
      
      if (options.install) {
        const result = installHook();
        
        if (result.success) {
          console.log(chalk.green(`✅ ${result.message}`));
          console.log(chalk.gray(`   Path: ${result.path}`));
          console.log(chalk.gray('\n   The hook will automatically generate commit messages.'));
          console.log(chalk.gray('   To disable, run: ai-commit hook --uninstall'));
        } else {
          console.log(chalk.red(`❌ ${result.message}`));
        }
        return;
      }
      
      // Interactive mode
      const status = getHookStatus();
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Install hook', value: 'install', disabled: status.isAiCommit },
            { name: 'Uninstall hook', value: 'uninstall', disabled: !status.isAiCommit },
            { name: 'Check status', value: 'status' },
            { name: 'Cancel', value: 'cancel' }
          ]
        }
      ]);
      
      if (action === 'cancel') return;
      
      if (action === 'status') {
        console.log(chalk.blue('\n🔗 Git Hook Status:\n'));
        if (status.installed) {
          console.log(chalk.green(`  ✓ Hook installed: ${status.path}`));
        } else {
          console.log(chalk.yellow('  No hook installed'));
        }
        return;
      }
      
      const result = action === 'install' ? installHook() : uninstallHook();
      
      if (result.success) {
        console.log(chalk.green(`✅ ${result.message}`));
      } else {
        console.log(chalk.red(`❌ ${result.message}`));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Template command
program
  .command('template')
  .description('Manage commit message templates')
  .option('-l, --list', 'List all templates')
  .option('-c, --create', 'Create a new template')
  .option('-d, --delete <name>', 'Delete a custom template')
  .option('-s, --show <name>', 'Show template details')
  .action(async (options) => {
    try {
      const { 
        loadTemplates, 
        getTemplate, 
        saveTemplate, 
        deleteTemplate, 
        createTemplateInteractive,
        listTemplates 
      } = await import('./templates');
      
      if (options.list) {
        listTemplates();
        return;
      }
      
      if (options.show) {
        const template = getTemplate(options.show);
        
        if (!template) {
          console.log(chalk.red(`❌ Template not found: ${options.show}`));
          return;
        }
        
        console.log(chalk.blue('\n📋 Template Details:\n'));
        console.log(`  Name: ${chalk.cyan(template.name)}`);
        if (template.description) {
          console.log(`  Description: ${template.description}`);
        }
        console.log(`  Pattern: ${chalk.yellow(template.pattern)}`);
        console.log(`  Example: ${chalk.green(template.example)}`);
        return;
      }
      
      if (options.delete) {
        const deleted = deleteTemplate(options.delete);
        
        if (deleted) {
          console.log(chalk.green(`✅ Template deleted: ${options.delete}`));
        } else {
          console.log(chalk.red(`❌ Template not found or is a default template`));
        }
        return;
      }
      
      if (options.create) {
        const template = await createTemplateInteractive();
        saveTemplate(template);
        console.log(chalk.green(`✅ Template created: ${template.name}`));
        return;
      }
      
      // Interactive mode
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'List templates', value: 'list' },
            { name: 'Create template', value: 'create' },
            { name: 'Delete template', value: 'delete' },
            { name: 'Cancel', value: 'cancel' }
          ]
        }
      ]);
      
      if (action === 'cancel') return;
      
      if (action === 'list') {
        listTemplates();
      } else if (action === 'create') {
        const template = await createTemplateInteractive();
        saveTemplate(template);
        console.log(chalk.green(`✅ Template created: ${template.name}`));
      } else if (action === 'delete') {
        const templates = loadTemplates();
        const customTemplates = templates.filter(t => 
          !['default', 'detailed', 'breaking', 'simple'].includes(t.name)
        );
        
        if (customTemplates.length === 0) {
          console.log(chalk.yellow('No custom templates to delete'));
          return;
        }
        
        const { name } = await inquirer.prompt([
          {
            type: 'list',
            name: 'name',
            message: 'Select template to delete:',
            choices: customTemplates.map(t => ({ name: t.name, value: t.name }))
          }
        ]);
        
        const deleted = deleteTemplate(name);
        if (deleted) {
          console.log(chalk.green(`✅ Template deleted: ${name}`));
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
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
