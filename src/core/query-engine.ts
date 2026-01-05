/**
 * SCIP Query Engine - Implements R1, R2, R3, R4
 * Phase: 2 - Query Core
 * Requirements: R1 (Symbol Search), R2 (Definition File Filtering), R3 (Folder Scope Filtering), R4 (Package-Aware Distinction)
 *
 * Provides fast symbol lookup with filtering capabilities.
 * Query operations are case-sensitive exact match on symbol names.
 *
 * Enhanced to support full hierarchical descriptor matching for qualified name searches.
 * Example: "ProjectService.getAllProjects()" matches "ProjectService#getAllProjects()."
 */

import type { Occurrence } from './symbol-indexer.js';
import { SuffixType } from './scip/SuffixType.js';

/** Query options for filtering search results */
export interface QueryOptions {
  /** Filter to symbols defined in this file (R2) */
  from?: string;
  /** Filter to occurrences within this folder (R3) */
  folder?: string;
  /** Filter to occurrences with this suffix type (SCF-004) */
  suffixFilter?: SuffixType;
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
 *
 * Enhanced to support qualified name searches (e.g., "ProjectService.getAllProjects()").
 */
export class QueryEngine {
  constructor(private readonly symbolIndex: Map<string, Occurrence[]>) {}

  /**
   * Find all occurrences of a symbol by name, with optional filtering.
   * Performs case-sensitive exact match on symbol names.
   *
   * Supports both leaf name matching (e.g., "getAllProjects") and
   * qualified name matching (e.g., "ProjectService.getAllProjects()").
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

    // Check if this is a qualified name search (contains dot or hash)
    const isQualifiedName = symbolName.includes('.') || symbolName.includes('#');

    for (const [key, occurrences] of this.symbolIndex) {
      const parsedKey = parseSymbolKey(key);
      if (!parsedKey) continue;

      const { name } = parsedKey;

      // Try both leaf name match and full descriptor match
      const isMatch = isQualifiedName
        ? this.matchesQualifiedName(symbolName, occurrences)
        : name === symbolName;

      if (!isMatch) continue;

      if (!this.matchesFromFilter(occurrences, options?.from)) continue;

      let matchingOccurrences = occurrences;
      matchingOccurrences = filterByFolder(matchingOccurrences, folder);
      matchingOccurrences = filterBySuffix(matchingOccurrences, options?.suffixFilter);
      results.push(...matchingOccurrences.map(toQueryResult));
    }

    return results;
  }

  /**
   * Check if any occurrence matches the qualified name pattern.
   * Converts dot notation to SCIP format for matching.
   * Example: "ProjectService.getAllProjects()" -> "ProjectService#getAllProjects()."
   */
  private matchesQualifiedName(qualifiedName: string, occurrences: Occurrence[]): boolean {
    // Convert dot notation to SCIP format
    const scipPattern = this.convertToScipPattern(qualifiedName);

    // Check if any occurrence's symbol ends with the SCIP pattern
    return occurrences.some(occ => {
      // Extract the descriptor part from the full symbol
      const descriptor = this.extractDescriptorFromSymbol(occ.symbol);
      return descriptor === scipPattern || descriptor.endsWith('/' + scipPattern);
    });
  }

  /**
   * Convert user-friendly dot notation to SCIP descriptor format.
   * Examples:
   * - "ProjectService.getAllProjects()" -> "ProjectService#getAllProjects()."
   * - "ProjectService.getAllProjects" -> "ProjectService#getAllProjects."
   * - "ProjectService#getAllProjects()" -> "ProjectService#getAllProjects()." (already SCIP format)
   */
  private convertToScipPattern(query: string): string {
    // If already in SCIP format (contains #), just normalize suffix
    if (query.includes('#')) {
      // Ensure proper suffix
      if (query.endsWith('()')) {
        return query.replace('()', '().');
      } else if (!query.endsWith('.') && !query.endsWith('#') && !query.endsWith('/')) {
        return query + '.';
      }
      return query;
    }

    // Convert dot notation to SCIP format
    // "Outer.Inner" -> "Outer#Inner."
    // "Outer.Inner()" -> "Outer#Inner()."
    const parts = query.split('.');
    if (parts.length < 2) {
      return query;
    }

    const lastPart = parts[parts.length - 1];
    const isMethod = lastPart.endsWith('()');

    // Remove empty parentheses for method detection
    const baseLastPart = isMethod ? lastPart.slice(0, -2) : lastPart;

    // Join all parts with # and add appropriate suffix
    const result = parts.slice(0, -1).join('#') + '#' + baseLastPart;

    if (isMethod) {
      return result + '().';
    } else {
      return result + '.';
    }
  }

  /**
   * Extract the descriptor part from a full SCIP symbol.
   * Example: "scip-typescript npm @mdt/shared 1.0.0 services/`ProjectService.ts`/ProjectService#getAllProjects()."
   *          -> "ProjectService#getAllProjects()."
   */
  private extractDescriptorFromSymbol(symbol: string): string {
    const lastSpaceIndex = symbol.lastIndexOf(' ');
    if (lastSpaceIndex === -1) {
      return symbol;
    }

    const descriptorPart = symbol.slice(lastSpaceIndex + 1);
    const lastSlashInPath = descriptorPart.lastIndexOf('/');
    if (lastSlashInPath === -1) {
      return descriptorPart;
    }

    return descriptorPart.slice(lastSlashInPath + 1);
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
 * Filter occurrences by suffix type (SCF-004).
 * Returns all occurrences when suffixFilter is undefined (wildcard).
 * Gracefully handles legacy indices where suffix may be undefined.
 */
function filterBySuffix(occurrences: Occurrence[], suffixFilter?: SuffixType): Occurrence[] {
  if (!suffixFilter) return occurrences;

  return occurrences.filter(occ => occ.suffix === suffixFilter);
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
    suffix: occ.suffix,
    isDefinition: (occ.roles & DEFINITION_ROLE) !== 0,
  };
}
