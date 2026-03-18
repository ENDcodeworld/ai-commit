#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
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
import { CommitStyle, Language } from './types';

const program = new Command();

program
  .name('ai-commit')
  .description('🤖 AI-powered git commit message generator')
  .version('1.0.0')
  .option('-s, --style <style>', 'Commit style (conventional, angular, gitmoji)', 'conventional')
  .option('-l, --lang <lang>', 'Output language (en, zh)', 'zh')
  .option('-c, --commit', 'Auto commit after generating message', false)
  .option('-d, --dry-run', 'Show message without committing', false)
  .option('-a, --add', 'Stage all changes before commit', false)
  .action(async (options) => {
    try {
      await run(options);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

async function run(options: {
  style: CommitStyle;
  lang: Language;
  commit: boolean;
  dryRun: boolean;
  add: boolean;
}) {
  // Check if in git repo
  if (!(await isGitRepo())) {
    throw new Error('Not a git repository. Please run this command in a git repository.');
  }

  // Stage all if requested
  if (options.add) {
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
  const messages = generateCommitOptions(diff, diffResult, options.lang);
  
  console.log(chalk.green('\n💡 Suggested commit messages:\n'));
  
  // Show all style options
  const styleNames = {
    conventional: 'Conventional',
    angular: 'Angular',
    gitmoji: 'Gitmoji'
  };
  
  messages.forEach((msg, index) => {
    console.log(chalk.cyan(`  [${index + 1}] ${styleNames[msg.type as keyof typeof styleNames] || msg.type}:`));
    console.log(chalk.white(`      ${msg.raw}`));
    console.log();
  });

  // Dry run mode - just show messages
  if (options.dryRun) {
    return;
  }

  // Auto commit mode
  if (options.commit) {
    const selected = messages.find(m => m.type === options.style) || messages[0];
    console.log(chalk.blue('📝 Creating commit...'));
    await createCommit(selected.raw);
    console.log(chalk.green('✅ Commit created successfully!'));
    console.log(chalk.gray(`   ${selected.raw}`));
    return;
  }

  // Interactive mode - let user choose
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
    console.log(chalk.green('✅ Commit created successfully!'));
    console.log(chalk.gray(`   ${selected.raw}`));
    
    // Show branch info
    const branch = await getCurrentBranch();
    console.log(chalk.gray(`   Branch: ${branch}`));
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Unexpected error:'), error.message);
  process.exit(1);
});

program.parse();
