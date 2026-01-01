/**
 * JSON normalization utilities for SCIP data
 * Handles conversion from various JSON fixture formats to standard SCIP format
 */

import type { ScipIndex, ScipDocument, ScipOccurrence } from './scip-types.js';

/** Range object format from LSP-style fixtures */
interface ObjectRange {
  start?: { line?: number; character?: number };
  end?: { line?: number; character?: number };
}

/** Default values for occurrence fields */
const EMPTY_OCCURRENCE: Omit<ScipOccurrence, 'range'> = {
  symbol: '',
  symbolRoles: 0,
  overrideDocumentation: [],
  syntaxKind: 0,
  diagnostics: [],
  enclosingRange: [],
};

/** Check if range is an object format (not array) */
function isObjectRange(range: unknown): range is ObjectRange {
  return range !== null && typeof range === 'object' && !Array.isArray(range);
}

/** Extract position with defaults, supporting fallback to start position */
function extractPosition(
  pos?: { line?: number; character?: number },
  fallbackLine?: number,
  fallbackChar?: number
): { line: number; character: number } {
  return {
    line: pos?.line ?? fallbackLine ?? 0,
    character: pos?.character ?? fallbackChar ?? 0,
  };
}

/** Convert object range to array format [startLine, startChar, endLine, endChar] */
function convertRangeToArray(range: ObjectRange): number[] {
  const start = extractPosition(range.start);
  const end = extractPosition(range.end, start.line, start.character);
  return [start.line, start.character, end.line, end.character];
}

/** Get symbol roles from occurrence, checking both possible field names */
function getSymbolRoles(occ: { role?: number; symbolRoles?: number }): number {
  return occ.role ?? occ.symbolRoles ?? 0;
}

/** Normalize a single occurrence from various JSON formats to SCIP format */
function normalizeOccurrence(occ: any): ScipOccurrence {
  if (!isObjectRange(occ.range)) {
    return occ;
  }

  return {
    ...EMPTY_OCCURRENCE,
    symbol: occ.symbol,
    symbolRoles: getSymbolRoles(occ),
    range: convertRangeToArray(occ.range),
  };
}

/** Extract relative path from document, handling URI format */
function getDocumentPath(doc: { relativePath?: string; uri?: string }): string {
  if (doc.relativePath) return doc.relativePath;
  if (doc.uri) return doc.uri.replace('file:///', '');
  return '';
}

/** Default values for document fields */
const EMPTY_DOCUMENT: Omit<ScipDocument, 'occurrences'> = {
  relativePath: '',
  language: '',
  symbols: [],
  text: '',
};

/** Normalize a single document from JSON fixture format */
function normalizeDocument(doc: any): ScipDocument {
  return {
    ...EMPTY_DOCUMENT,
    relativePath: getDocumentPath(doc),
    language: doc.language,
    occurrences: (doc.occurrences ?? []).map(normalizeOccurrence),
    symbols: doc.symbols,
    text: doc.text,
  };
}

/** Parse JSON content as SCIP index */
export function parseJsonIndex(content: string): ScipIndex | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith('{')) {
    return null;
  }

  try {
    const jsonIndex = JSON.parse(trimmed) as any;
    jsonIndex.documents = jsonIndex.documents?.map(normalizeDocument) ?? [];
    return jsonIndex;
  } catch {
    return null;
  }
}
