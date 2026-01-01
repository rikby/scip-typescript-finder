/**
 * Core module exports
 */

export { findScipFile, loadScipIndex } from './scip-loader.js';
export type {
  ScipIndex,
  ScipDocument,
  ScipOccurrence,
  ScipSymbolInformation,
  ScipRelationship,
  ScipDiagnostic,
} from './scip-loader.js';

export { buildSymbolIndex, mergeSymbolVariants } from './symbol-indexer.js';
export type { Occurrence } from './symbol-indexer.js';

export { QueryEngine } from './query-engine.js';
export type { QueryOptions, QueryResult } from './query-engine.js';
