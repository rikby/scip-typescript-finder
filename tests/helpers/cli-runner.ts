/**
 * CLI Test Runner Helper
 * Provides consistent CLI execution for integration tests
 */

import { execSync } from 'child_process';
import path from 'path';

interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Run the scip-finder CLI and capture output, errors, and exit code
 * @param args - Command line arguments (e.g., '--scip index.scip Ticket')
 * @returns Object with stdout, stderr, and exitCode
 */
export function runCli(args: string): CliResult {
  const cliPath = path.join(process.cwd(), 'bin/scip-finder.js');

  try {
    // stdio: ['inherit', 'pipe', 'pipe'] captures both stdout and stderr
    const output = execSync(`node ${cliPath} ${args}`, {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
    return { stdout: output, stderr: '', exitCode: 0 };
  } catch (error: any) {
    // When process exits with non-zero code, execSync throws
    // Both stdout and stderr are available as Buffers
    const stderr = error.stderr?.toString() || '';
    const stdout = error.stdout?.toString() || '';
    return {
      stdout,
      stderr,
      exitCode: error.status || 1
    };
  }
}
