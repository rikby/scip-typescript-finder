// Utilities exports

export * from './symbol-roles.js';
export * from './symbol-parser.js';

/**
 * Handle --from filter with fallback warning.
 * If --from was specified but no results found, show warning and return all results.
 * Only shows warning in text mode (not JSON mode to avoid breaking JSON parsing).
 */
export function handleFromFilter(
  queryEngine: any,
  symbolName: string,
  from: string | undefined,
  folder: string | undefined,
  format: string,
  initialResults: any[]
): any[] {
  if (from && initialResults.length === 0 && format === 'text') {
    const allResults = queryEngine.find(symbolName, { folder });
    if (allResults.length > 0) {
      console.error(`Warning: Symbol '${symbolName}' is not defined in '${from}'. Showing all occurrences.\n`);
      return allResults;
    }
  }
  return initialResults;
}

