/**
 * Output formatters for CLI results
 * Phase: 3 - CLI + Output + Integration Tests
 * Requirements: R6 (Text Output), R7 (JSON Output)
 */

import type { QueryResult } from '../core/query-engine.js';
import {
  getRoleNames,
  isDefinition,
  isReference,
  isImport,
  isExport,
} from '../utils/symbol-roles.js';

/** Output format options */
export type OutputFormat = 'text' | 'json';

/**
 * Format query results as text (grep-like output).
 * Format: file:line:column: role
 */
export function formatAsText(symbolName: string, results: QueryResult[]): string {
  if (results.length === 0) {
    return `symbol not found: ${symbolName}`;
  }

  return results
    .map((r) => `${r.filePath}:${r.line}:${r.column}: ${getRoleNames(r.roles).join(', ')}`)
    .join('\n');
}

/**
 * Format query results as JSON.
 * Structure: { symbol, occurrences: [{ file, line, column, role, isDefinition, ... }] }
 */
export function formatAsJson(symbolName: string, results: QueryResult[]): string {
  const occurrences = results.map((r) => ({
    file: r.filePath,
    line: r.line,
    column: r.column,
    endLine: r.endLine,
    endColumn: r.endColumn,
    role: getRoleNames(r.roles).join(', '),
    isDefinition: isDefinition(r.roles),
    isReference: isReference(r.roles),
    isImport: isImport(r.roles),
    isExport: isExport(r.roles),
  }));

  return JSON.stringify({ symbol: symbolName, occurrences, count: occurrences.length }, null, 2);
}
