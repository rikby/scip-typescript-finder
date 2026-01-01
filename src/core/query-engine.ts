/**
 * SCIP Query Engine - Implements R1, R2, R3, R4
 * Phase: 2 - Query Core
 * Requirements: R1 (Symbol Search), R2 (Definition File Filtering), R3 (Folder Scope Filtering), R4 (Package-Aware Distinction)
 *
 * Provides fast symbol lookup with filtering capabilities.
 * Query operations are case-sensitive exact match on symbol names.
 */

import type { Occurrence } from './symbol-indexer.js';
import { extractPackageName } from '../utils/symbol-parser.js';

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

    const from = options?.from;
    const folder = options?.folder
      ? options.folder.endsWith('/')
        ? options.folder
        : `${options.folder}/`
      : undefined;

    const results: QueryResult[] = [];

    for (const [key, occurrences] of this.symbolIndex) {
      const keyParts = key.split(':');
      if (keyParts.length !== 3) continue;

      const [, definingFile, name] = keyParts;

      // Task 2.1: Case-sensitive exact match on symbol name
      if (name !== symbolName) continue;

      // Task 2.2: Filter by definition file (--from)
      // Check if any definition occurrence in this symbol comes from the specified file
      if (from) {
        const hasDefinitionInFile = occurrences.some(
          occ => (occ.roles & 0x1) !== 0 && occ.filePath === from
        );
        if (!hasDefinitionInFile) continue;
      }

      // Task 2.3 & 2.4: Filter by folder and preserve package info
      for (const occ of occurrences) {
        if (folder && !occ.filePath.startsWith(folder)) continue;

        results.push({
          symbol: occ.symbol,
          filePath: occ.filePath,
          line: occ.line,
          column: occ.column,
          endLine: occ.endLine,
          endColumn: occ.endColumn,
          roles: occ.roles,
          isDefinition: (occ.roles & 0x1) !== 0,
        });
      }
    }

    return results;
  }
}
