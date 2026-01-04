/**
 * Jest setup file
 * Runs before all tests to configure the test environment
 */

// Set the project root directory for CLI tests
// This allows the CLI runner to find the binary even when running from different directories
process.env.SCIP_PROJECT_ROOT = process.cwd();
