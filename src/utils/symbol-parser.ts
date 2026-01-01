/**
 * SCIP Symbol Parser Utilities
 * Phase: 1 - Foundation
 * Requirements: R1 (Symbol parsing), R2 (Definition File Filtering), R4 (Package-Aware Distinction), R5 (Declaration File Handling)
 *
 * Provides utilities for parsing SCIP symbol format and extracting components.
 * SCIP symbol format: scip-typescript npm <package-name> <version> <descriptors>
 *
 * Example symbols:
 * - scip-typescript npm @mdt/shared 1.0.0 models/\`Ticket.ts\`/Ticket#
 * - scip-typescript npm markdown-ticket 0.0.0 src/types/\`ticket.ts\`/Ticket#
 */

/** Extract package name from SCIP symbol format. */
export function extractPackageName(symbol: string): string {
  const match = symbol.match(/^scip-typescript\s+npm\s+(\S+)/);
  return match ? match[1] : '';
}

/** Extract readable symbol name, stripping #, ., and method suffixes. */
export function extractDisplayName(symbol: string): string {
  const match = symbol.match(/\/([^\/#.]+?)(\(\)|\(.*?\))?[.#]?$/);
  return match ? match[1] + (match[2] || '') : '';
}

/** Extract file path from backtick-enclosed path in symbol. Handles both `file` and \`file\` formats. */
export function extractFilePath(symbol: string): string {
  const match = symbol.match(/(\S+\/)(?:\\+)?`([^`\\]+)(?:\\+)?`/);
  if (!match) return '';

  return match[1] + match[2];
}

/** Check if path ends with .d.ts declaration file. */
export function isDeclarationFile(path: string): boolean {
  return path.endsWith('.d.ts');
}

/** Convert .d.ts to .ts for lookup, preserving other paths unchanged. */
export function normalizeSymbolPath(path: string): string {
  if (isDeclarationFile(path)) {
    return path.replace(/\.d\.ts$/, '.ts');
  }
  return path;
}

/** Create "package:file:name" lookup key for symbol indexing. */
export function getSymbolKey(symbol: string): string {
  const packageName = extractPackageName(symbol);
  const filePath = extractFilePath(symbol);
  const displayName = extractDisplayName(symbol);
  const normalizedPath = normalizeSymbolPath(filePath);

  return `${packageName}:${normalizedPath}:${displayName}`;
}
