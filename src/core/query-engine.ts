/**
 * SCIP Query Engine - Implements R1, R2, R3, R4
 * Phase: 2 - Query Core
 * Requirements: R1 (Symbol Search), R2 (Definition File Filtering), R3 (Folder Scope Filtering), R4 (Package-Aware Distinction)
 *
 * Provides fast symbol lookup with filtering capabilities.
 * Query operations are case-sensitive exact match on symbol names.
 */

import type { Occurrence } from './symbol-indexer.js';

/** Query options for filtering search results */
export interface QueryOptions {
  /** Filter to symbols defined in this file (R2) */
  from?: string;
  /** Filter to occurrences within this folder (R3) */
  folder?: string;
}

/** Query result extending Occurrence with convenience property */
export interface QueryResult extends Occurrence {
  isDefinition: boolean;
}

/** SCIP role bit flag for definition */
const DEFINITION_ROLE = 0x1;

/**
 * Query engine for fast symbol lookup with filtering.
 * Supports symbol search by name, definition file filtering, folder scope filtering, and package-aware distinction.
 */
export class QueryEngine {
  constructor(private readonly symbolIndex: Map<string, Occurrence[]>) {}

  /**
   * Find all occurrences of a symbol by name, with optional filtering.
   * Performs case-sensitive exact match on symbol names.
   *
   * @param symbolName - The exact symbol name to search for (case-sensitive)
   * @param options - Optional query filters (from, folder)
   * @returns Array of matching symbol occurrences, empty if none found
   */
  find(symbolName: string, options?: QueryOptions): QueryResult[] {
    if (!symbolName) {
      return [];
    }

    const folder = normalizeFolderPath(options?.folder);
    const results: QueryResult[] = [];

    for (const [key, occurrences] of this.symbolIndex) {
      const parsedKey = parseSymbolKey(key);
      if (!parsedKey) continue;

      const { name } = parsedKey;

      if (name !== symbolName) continue;

      if (!this.matchesFromFilter(occurrences, options?.from)) continue;

      const matchingOccurrences = filterByFolder(occurrences, folder);
      results.push(...matchingOccurrences.map(toQueryResult));
    }

    return results;
  }

  /**
   * Check if occurrences match the 'from' filter (R2).
   * Returns true if any definition occurrence is from the specified file.
   */
  private matchesFromFilter(occurrences: Occurrence[], from?: string): boolean {
    if (!from) return true;

    return occurrences.some(
      occ => (occ.roles & DEFINITION_ROLE) !== 0 && occ.filePath === from
    );
  }
}

/**
 * Normalize folder path to ensure trailing slash.
 */
function normalizeFolderPath(folder?: string): string | undefined {
  if (!folder) return undefined;
  return folder.endsWith('/') ? folder : `${folder}/`;
}

/**
 * Parse symbol index key into components.
 * Expected format: "package:file:name"
 */
function parseSymbolKey(key: string): { definingFile: string; name: string } | null {
  const parts = key.split(':');
  if (parts.length !== 3) return null;

  const [, definingFile, name] = parts;
  return { definingFile, name };
}

/**
 * Filter occurrences by folder path (R3).
 */
function filterByFolder(occurrences: Occurrence[], folder?: string): Occurrence[] {
  if (!folder) return occurrences;

  return occurrences.filter(occ => occ.filePath.startsWith(folder));
}

/**
 * Convert Occurrence to QueryResult with isDefinition flag.
 */
function toQueryResult(occ: Occurrence): QueryResult {
  return {
    symbol: occ.symbol,
    filePath: occ.filePath,
    line: occ.line,
    column: occ.column,
    endLine: occ.endLine,
    endColumn: occ.endColumn,
    roles: occ.roles,
    isDefinition: (occ.roles & DEFINITION_ROLE) !== 0,
  };
}
