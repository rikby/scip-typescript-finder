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

interface RunCliOptions {
  /**
   * Working directory to run the CLI from
   * If provided, the CLI will be executed from this directory
   * This is useful for testing SCIP file discovery behavior
   */
  cwd?: string;
}

/**
 * Run the scip-finder CLI and capture output, errors, and exit code
 * @param args - Command line arguments (e.g., '--scip index.scip Ticket')
 * @param options - Optional execution options
 * @returns Object with stdout, stderr, and exitCode
 */
export function runCli(args: string, options?: RunCliOptions): CliResult {
  // Get the project root directory (where bin/scip-finder.js is located)
  // We need to find this regardless of the current working directory
  const projectRoot = process.env.SCIP_PROJECT_ROOT || process.cwd();
  const cliPath = path.join(projectRoot, 'bin/scip-finder.js');

  const execOptions: any = {
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'pipe']
  };

  // If a custom cwd is provided, use it for the execution
  // This allows testing SCIP file discovery from different directories
  if (options?.cwd) {
    execOptions.cwd = options.cwd;
  }

  try {
    // stdio: ['inherit', 'pipe', 'pipe'] captures both stdout and stderr
    const output = execSync(`node ${cliPath} ${args}`, execOptions);
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
