/**
 * SCIP Symbol Indexer - Implements R1, R4, R5
 * Phase: 1 - Foundation
 * Requirements: R1 (Symbol Search), R4 (Package-Aware Distinction), R5 (Declaration File Handling)
 *
 * Builds a fast lookup index from SCIP data for symbol search operations.
 * Index structure: Map<"package:file:name", Occurrence[]>
 */

import type { ScipIndex, ScipOccurrence } from './scip-loader.js';
import { SymbolParser } from './scip/SymbolParser.js';
import { SymbolIndexKey } from './scip/SymbolIndexKey.js';

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

/** Parsed SCIP range with start and end positions */
interface ParsedRange {
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
}

/** Variant map buckets for separating .ts and .d.ts occurrences */
interface VariantBuckets {
  ts: Occurrence[];
  dts: Occurrence[];
}

/**
 * Parse SCIP range array into start/end positions.
 * SCIP ranges can be 3 elements [startLine, startChar, endChar] or 4 elements [startLine, startChar, endLine, endChar]
 */
function parseRange(range: number[]): ParsedRange | null {
  if (range.length < 3) {
    return null;
  }

  const [startLine, startChar, ...rest] = range;
  const endLine = range.length === 3 ? startLine : rest[0];
  const endChar = range.length === 3 ? rest[0] : rest[1];

  return { startLine, startChar, endLine, endChar };
}

/**
 * Convert SCIP occurrence to indexed occurrence with location info.
 */
function toIndexedOccurrence(
  occ: ScipOccurrence,
  docPath: string,
  range: ParsedRange
): Occurrence {
  return {
    symbol: occ.symbol || '',
    filePath: docPath,
    line: range.startLine,
    column: range.startChar,
    endLine: range.endLine,
    endColumn: range.endChar,
    roles: occ.symbolRoles || 0,
  };
}

/**
 * Get or create variant buckets for a symbol key.
 */
function getOrCreateBuckets(
  map: Map<string, VariantBuckets>,
  key: string
): VariantBuckets {
  if (!map.has(key)) {
    map.set(key, { ts: [], dts: [] });
  }
  return map.get(key)!;
}

/**
 * Check if a file path is a declaration file (.d.ts).
 */
function isDeclarationFile(filePath: string): boolean {
  return filePath.endsWith('.d.ts');
}

/**
 * Convert .d.ts to .ts for lookup, preserving other paths unchanged.
 */
function normalizeSymbolPath(path: string): string {
  if (isDeclarationFile(path)) {
    return path.replace(/\.d\.ts$/, '.ts');
  }
  return path;
}

/**
 * Validate and parse SCIP occurrence range.
 */
function parseOccurrenceRange(occ: ScipOccurrence): ParsedRange | null {
  const range = occ.range;
  if (!range || range.length < 3) {
    return null;
  }
  return parseRange(range);
}

/**
 * Add occurrence to the appropriate bucket based on file type.
 */
function addToBucket(
  buckets: VariantBuckets,
  occurrence: Occurrence,
  docPath: string
): void {
  if (isDeclarationFile(docPath)) {
    buckets.dts.push(occurrence);
  } else {
    buckets.ts.push(occurrence);
  }
}

/**
 * Process a single SCIP occurrence and add it to the variant map.
 */
function processOccurrence(
  variantMap: Map<string, VariantBuckets>,
  occ: ScipOccurrence,
  docPath: string
): void {
  const symbol = occ.symbol;
  if (!symbol) return;

  const parsedRange = parseOccurrenceRange(occ);
  if (!parsedRange) return;

  const occurrence = toIndexedOccurrence(occ, docPath, parsedRange);
  const parser = new SymbolParser();
  const parsed = parser.parse(symbol);
  const normalizedPath = normalizeSymbolPath(parsed.filePath);

  // Use SymbolIndexKey value object for generating index keys
  const indexKey = new SymbolIndexKey(
    parsed.packageName,
    normalizedPath,
    parsed.displayName,
    parsed.suffix
  );
  const key = indexKey.toString();

  const buckets = getOrCreateBuckets(variantMap, key);
  addToBucket(buckets, occurrence, docPath);
}

/**
 * Process all occurrences from a single document.
 */
function processDocument(
  variantMap: Map<string, VariantBuckets>,
  docPath: string,
  occurrences: ScipOccurrence[]
): void {
  for (const occ of occurrences) {
    processOccurrence(variantMap, occ, docPath);
  }
}

/**
 * Process a document from SCIP index.
 */
function processDocumentFromIndex(
  variantMap: Map<string, VariantBuckets>,
  doc: { relativePath?: string; occurrences?: ScipOccurrence[] }
): void {
  const docPath = doc.relativePath || '';
  const occurrences = doc.occurrences || [];
  processDocument(variantMap, docPath, occurrences);
}

/**
 * Process all documents and build the variant map.
 */
function buildVariantMap(scipIndex: ScipIndex): Map<string, VariantBuckets> {
  const variantMap = new Map<string, VariantBuckets>();
  const documents = scipIndex.documents || [];

  for (const doc of documents) {
    processDocumentFromIndex(variantMap, doc);
  }

  return variantMap;
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
  const variantMap = buildVariantMap(scipIndex);

  for (const [key, { ts, dts }] of variantMap) {
    const merged = mergeSymbolVariants(ts, dts);
    index.set(key, merged);
  }

  return index;
}

/** Deduplication state for merging occurrences */
interface DedupeState {
  seen: Set<string>;
  merged: Occurrence[];
}

/** Create dedupe key for an occurrence */
function makeDedupeKey(occ: Occurrence): string {
  return `${occ.filePath}:${occ.line}:${occ.column}`;
}

/**
 * Add a single occurrence if not already seen.
 */
function addUniqueOccurrence(state: DedupeState, occ: Occurrence): void {
  const key = makeDedupeKey(occ);
  if (!state.seen.has(key)) {
    state.seen.add(key);
    state.merged.push(occ);
  }
}

/**
 * Add occurrences to merged array if not already seen.
 */
function addUniqueOccurrences(state: DedupeState, occurrences: Occurrence[]): void {
  for (const occ of occurrences) {
    addUniqueOccurrence(state, occ);
  }
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
  const state: DedupeState = { seen: new Set<string>(), merged: [] };

  addUniqueOccurrences(state, tsOccurrences);
  addUniqueOccurrences(state, dtsOccurrences);

  return state.merged;
}
