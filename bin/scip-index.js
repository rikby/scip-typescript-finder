#!/usr/bin/env node
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Build find command with directory exclusions using -prune
const excludeExpr = EXCLUDED_DIRS.map(d => `-name ${d}`).join(' -o ');
const findCmd = `find . -maxdepth 2 \\( ${excludeExpr} \\) -prune -o -name "tsconfig*.json" -type f -print`;

// Find all tsconfig files in current working directory
const tsconfigFiles = execSync(findCmd, {
  encoding: 'utf-8',
  cwd: process.cwd()
}).trim().split('\n').filter(Boolean);

if (tsconfigFiles.length === 0) {
  console.error('No tsconfig files found in current directory');
  process.exit(1);
}

console.log(`Found ${tsconfigFiles.length} tsconfig file(s):`);
tsconfigFiles.forEach(f => console.log(`  - ${f}`));

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
