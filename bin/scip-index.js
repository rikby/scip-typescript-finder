#!/usr/bin/env node
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { program } from 'commander';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directories to exclude when searching for tsconfig files
const EXCLUDED_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.gitWT',
  'coverage',
  '.next',
  '.nuxt',
  'out',
  '.turbo',
  '.cache'
];

program
  .name('scip-index')
  .description('Generate SCIP index for TypeScript projects')
  .option('--depth <number>', 'Maximum depth to search for tsconfig files', '2')
  .option('--config <paths>', 'Explicit tsconfig file paths (comma-separated)')
  .parse(process.argv);

const options = program.opts();

let tsconfigFiles = [];

if (options.config) {
  // Use explicit config paths (comma-separated)
  tsconfigFiles = options.config.split(',').map(p => p.trim());
  console.log(`Using ${tsconfigFiles.length} explicit config file(s):`);
  tsconfigFiles.forEach(f => console.log(`  - ${f}`));

  // Validate files exist
  const missing = tsconfigFiles.filter(f => !existsSync(f));
  if (missing.length > 0) {
    console.error(`\nError: The following config files do not exist:`);
    missing.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }
} else {
  // Auto-discover tsconfig files
  const depth = parseInt(options.depth, 10);
  if (isNaN(depth) || depth < 1) {
    console.error(`Error: --depth must be a positive integer (got: ${options.depth})`);
    process.exit(1);
  }

  // Build find command with directory exclusions using -prune
  const excludeExpr = EXCLUDED_DIRS.map(d => `-name ${d}`).join(' -o ');
  const findCmd = `find . -maxdepth ${depth} \\( ${excludeExpr} \\) -prune -o -name "tsconfig*.json" -type f -print`;

  // Find all tsconfig files in current working directory
  tsconfigFiles = execSync(findCmd, {
    encoding: 'utf-8',
    cwd: process.cwd()
  }).trim().split('\n').filter(Boolean);

  if (tsconfigFiles.length === 0) {
    console.error('No tsconfig files found in current directory');
    process.exit(1);
  }

  console.log(`Found ${tsconfigFiles.length} tsconfig file(s) at depth ${depth}:`);
  tsconfigFiles.forEach(f => console.log(`  - ${f}`));
}

// Run scip-typescript index with all tsconfig files
const cmd = `scip-typescript index --output index.scip ${tsconfigFiles.join(' ')}`;
console.log(`\nRunning: ${cmd}`);

try {
  execSync(cmd, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('\nIndex created: index.scip');
} catch (error) {
  console.error('\nFailed to create index');
  process.exit(1);
}
