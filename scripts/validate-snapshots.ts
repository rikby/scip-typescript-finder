#!/usr/bin/env npx tsx

/**
 * Snapshot Validator Script
 *
 * Validates that actual scip-finder CLI output matches stored snapshots
 * in markdown-ticket/snapshot_*.txt files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface Snapshot {
  file: string;
  command: string;
  expectedOutput: string[];
}

interface ValidationResult {
  file: string;
  command: string;
  status: 'pass' | 'fail';
  expectedLines: number;
  actualLines: number;
  differences?: string[];
}

/**
 * Parse a snapshot file
 */
function parseSnapshot(snapshotPath: string): Snapshot | null {
  const content = fs.readFileSync(snapshotPath, 'utf-8');
  const lines = content.split('\n');

  // Find COMMAND: line
  const commandIndex = lines.findIndex(line => line.startsWith('COMMAND:'));

  if (commandIndex === -1) {
    console.error(`❌ No COMMAND: line found in ${snapshotPath}`);
    return null;
  }

  // Extract command
  const commandLine = lines[commandIndex];
  const command = commandLine.replace('COMMAND:', '').trim();

  // Extract expected output (everything before COMMAND: line, excluding empty lines at end)
  const expectedOutput = lines.slice(0, commandIndex).filter(line => line.trim() !== '');

  return {
    file: snapshotPath,
    command,
    expectedOutput
  };
}

/**
 * Run scip-finder command and get actual output
 */
function runCommand(command: string, workingDir: string): string[] {
  try {
    const output = execSync(command, {
      cwd: workingDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return output.split('\n').filter(line => line.trim() !== '');
  } catch (error: any) {
    // Command might exit with non-zero if symbol not found
    // That's okay, we still want to compare stdout
    const stdout = error.stdout?.toString() || '';
    return stdout.split('\n').filter(line => line.trim() !== '');
  }
}

/**
 * Compare expected and actual output line-by-line
 */
function compareOutputs(expected: string[], actual: string[]): string[] {
  const differences: string[] = [];

  // Find max length to iterate through both arrays
  const maxLen = Math.max(expected.length, actual.length);

  for (let i = 0; i < maxLen; i++) {
    const expectedLine = expected[i];
    const actualLine = actual[i];

    if (expectedLine === undefined && actualLine !== undefined) {
      // Extra line in actual
      differences.push(`+ ${actualLine}`);
    } else if (expectedLine !== undefined && actualLine === undefined) {
      // Missing line in actual
      differences.push(`- ${expectedLine}`);
    } else if (expectedLine !== actualLine) {
      // Lines differ
      differences.push(`Expected: ${expectedLine}`);
      differences.push(`Actual:   ${actualLine}`);
    }
  }

  return differences;
}

/**
 * Validate a single snapshot
 */
function validateSnapshot(snapshotPath: string, workingDir: string): ValidationResult {
  const snapshot = parseSnapshot(snapshotPath);

  if (!snapshot) {
    return {
      file: snapshotPath,
      command: 'N/A',
      status: 'fail',
      expectedLines: 0,
      actualLines: 0,
      differences: ['Failed to parse snapshot']
    };
  }

  const actualOutput = runCommand(snapshot.command, workingDir);
  const differences = compareOutputs(snapshot.expectedOutput, actualOutput);

  return {
    file: path.basename(snapshotPath),
    command: snapshot.command,
    status: differences.length === 0 ? 'pass' : 'fail',
    expectedLines: snapshot.expectedOutput.length,
    actualLines: actualOutput.length,
    differences: differences.length > 0 ? differences : undefined
  };
}

/**
 * Main validation function
 */
function main() {
  const projectRoot = process.cwd();
  const snapshotDir = path.join(projectRoot, 'markdown-ticket');
  const workingDir = snapshotDir;

  // Find all snapshot files
  const snapshotFiles = fs.readdirSync(snapshotDir)
    .filter(file => file.startsWith('snapshot_') && file.endsWith('.txt'))
    .map(file => path.join(snapshotDir, file))
    .sort();

  console.log('Snapshot Validation Results');
  console.log('═'.repeat(55));
  console.log();

  let passCount = 0;
  let failCount = 0;

  for (const snapshotPath of snapshotFiles) {
    const result = validateSnapshot(snapshotPath, workingDir);

    console.log(`${result.file}`);
    console.log(`  Command: ${result.command}`);
    console.log(`  Status: ${result.status === 'pass' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Expected: ${result.expectedLines} lines`);
    console.log(`  Actual: ${result.actualLines} lines`);

    if (result.differences && result.differences.length > 0) {
      console.log('  Differences:');
      for (const diff of result.differences.slice(0, 10)) { // Limit output
        console.log(`    ${diff}`);
      }
      if (result.differences.length > 10) {
        console.log(`    ... and ${result.differences.length - 10} more`);
      }
    }

    console.log();

    if (result.status === 'pass') {
      passCount++;
    } else {
      failCount++;
    }
  }

  console.log('═'.repeat(55));
  console.log(`Total: ${passCount + failCount} snapshots`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log();

  // Exit with appropriate code
  process.exit(failCount > 0 ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, validateSnapshot, parseSnapshot, compareOutputs };
