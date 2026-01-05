/**
 * CLI Query Syntax Detection (SCF-004 Phase 1)
 *
 * Auto-detects property vs method search syntax without flags.
 * Enhanced to support qualified name searches (e.g., "ProjectService.getAllProjects()").
 */

import { SuffixType } from '../core/scip/SuffixType.js';

/**
 * Detects query syntax type from string patterns.
 * - `(` present → Method
 * - `.` without `(` → Term (property)
 * - Neither → undefined (wildcard, match all)
 *
 * Examples:
 * - "ProjectService" → undefined (all types)
 * - "ProjectService.getAllProjects" → Term (property)
 * - "ProjectService.getAllProjects()" → Method
 * - "getAllProjects" → undefined (all types)
 * - "getAllProjects()" → Method
 */
export function detectQuerySyntax(query: string): SuffixType | undefined {
  if (!query) return undefined;
  if (query.includes('(')) return SuffixType.Method;
  // Only detect Term if there's a dot but no parentheses
  // This allows "ProjectService" to match all types (not just Term)
  if (query.includes('.') && !query.includes('(')) return SuffixType.Term;
  return undefined;
}

/**
 * Strips `(...)` parameters from method queries.
 * Handles nested parentheses; returns unchanged if unmatched.
 *
 * Preserves the rest of the qualified name for proper indexing.
 * Examples:
 * - "ProjectService.getAllProjects()" → "ProjectService.getAllProjects"
 * - "getAllProjects()" → "getAllProjects"
 * - "ProjectService" → "ProjectService"
 */
export function stripMethodParameters(query: string): string {
  const openIndex = query.indexOf('(');
  if (openIndex === -1) return query;

  let depth = 0;
  for (let i = openIndex; i < query.length; i++) {
    if (query[i] === '(') depth++;
    else if (query[i] === ')') {
      depth--;
      if (depth === 0) return query.substring(0, openIndex);
    }
  }
  return query;
}
