/**
 * SCIP Symbol Suffix Types (SCF-004 Phase 2)
 *
 * Enum representing SCIP symbol suffix types.
 * Each suffix corresponds to a specific SCIP delimiter:
 * - Namespace: `/`
 * - Type/Class: `#`
 * - Term/Property: `.`
 * - Method: `().`
 */
export enum SuffixType {
  Namespace = 'namespace',
  Type = 'type',
  Term = 'term',
  Method = 'method',
  Parameter = 'parameter',
  TypeParameter = 'typeparameter',
}
