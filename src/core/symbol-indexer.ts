/**
 * SCIP Symbol Indexer - Implements R1, R4, R5
 * Phase: 1 - Foundation
 * Requirements: R1 (Symbol Search), R4 (Package-Aware Distinction), R5 (Declaration File Handling)
 *
 * Builds a fast lookup index from SCIP data for symbol search operations.
 * Index structure: Map<"package:file:name", Occurrence[]>
 */

import type { ScipIndex } from './scip-loader.js';
import {
  extractPackageName,
  extractDisplayName,
  extractFilePath,
  getSymbolKey,
  normalizeSymbolPath,
} from '../utils/symbol-parser.js';

/** Symbol occurrence with location and role information */
export interface Occurrence {
  symbol: string;
  filePath: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  roles: number;
}

/**
 * Build symbol lookup index from SCIP data (R1, R4, R5).
 * Creates Map<"package:file:name", Occurrence[]> for O(1) symbol lookup.
 *
 * @param scipIndex - Loaded SCIP index containing documents and symbols
 * @returns Map of symbol keys to their occurrences
 */
export function buildSymbolIndex(scipIndex: ScipIndex): Map<string, Occurrence[]> {
  const index = new Map<string, Occurrence[]>();
  const variantMap = new Map<string, Occurrence[][]>();

  const documents = scipIndex.documents || [];
  for (const doc of documents) {
    const docPath = doc.relativePath || '';
    const occurrences = doc.occurrences || [];

    for (const occ of occurrences) {
      const symbol = occ.symbol || '';
      if (!symbol) continue;

      const roles = occ.symbolRoles || 0;
      const range = occ.range || [];

      // SCIP ranges can be 3 elements [startLine, startChar, endChar] or 4 elements [startLine, startChar, endLine, endChar]
      if (range.length < 3) continue;

      const [startLine, startChar, ...rest] = range;
      // If 3 elements: [startLine, startChar, endChar], endLine = startLine
      // If 4 elements: [startLine, startChar, endLine, endChar]
      const endLine = range.length === 3 ? startLine : rest[0];
      const endChar = range.length === 3 ? rest[0] : rest[1];

      const occurrence: Occurrence = {
        symbol,
        filePath: docPath,
        line: startLine,
        column: startChar,
        endLine: endLine,
        endColumn: endChar,
        roles,
      };

      const key = getSymbolKey(symbol);

      if (!variantMap.has(key)) {
        variantMap.set(key, [[], []]);
      }

      const [tsOccs, dtsOccs] = variantMap.get(key)!;
      if (docPath.endsWith('.d.ts')) {
        dtsOccs.push(occurrence);
      } else {
        tsOccs.push(occurrence);
      }
    }
  }

  for (const [key, [tsOccs, dtsOccs]] of variantMap) {
    const merged = mergeSymbolVariants(tsOccs, dtsOccs);
    index.set(key, merged);
  }

  return index;
}

/**
 * Merge .ts and .d.ts symbol occurrences, deduplicating by position (R5).
 * Combines occurrences from implementation and declaration files.
 *
 * @param tsOccurrences - Occurrences from .ts files
 * @param dtsOccurrences - Occurrences from .d.ts files
 * @returns Deduplicated merged occurrence array
 */
export function mergeSymbolVariants(
  tsOccurrences: Occurrence[],
  dtsOccurrences: Occurrence[]
): Occurrence[] {
  const seen = new Set<string>();
  const merged: Occurrence[] = [];

  const addUnique = (occ: Occurrence) => {
    const dedupeKey = `${occ.filePath}:${occ.line}:${occ.column}`;
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      merged.push(occ);
    }
  };

  for (const occ of tsOccurrences) {
    addUnique(occ);
  }

  for (const occ of dtsOccurrences) {
    addUnique(occ);
  }

  return merged;
}
