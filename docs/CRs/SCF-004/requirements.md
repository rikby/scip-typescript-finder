# Requirements: SCF-004

**Source**: [SCF-004](../SCF-004.md)
**Generated**: 2026-01-04
**CR Type**: Feature Enhancement

## Introduction

scip-finder currently cannot search for object properties or class methods, limiting code navigation and refactoring capabilities in object-oriented codebases. The SCIP protocol fully supports property and method references through descriptor suffixes, but scip-finder strips this information during parsing. This enhancement adds suffix-aware symbol parsing with intuitive CLI syntax auto-detection, enabling users to query properties (`MyThing.myProp`) and methods (`MyThing.method()`) using natural code patterns.

## Behavioral Requirements (EARS)

### Requirement 1: Suffix Preservation

**Objective**: As a user, I want the system to preserve SCIP suffix information, so that I can distinguish between properties and methods in search results.

#### Acceptance Criteria

1. WHEN parsing SCIP symbol strings, the system shall extract and preserve the SCIP suffix type through the entire parsing pipeline.
2. WHEN a property suffix (`.`) is encountered, the system shall preserve it for filtering purposes.
3. WHEN a method suffix (`().`) is encountered, the system shall preserve it for filtering purposes.
4. WHEN a type suffix (`#`) is encountered, the system shall preserve it for filtering purposes.
5. WHEN a namespace suffix (`/`) is encountered, the system shall preserve it for filtering purposes.

### Requirement 2: Suffix-Aware Filtering

**Objective**: As a user, I want to filter search results by suffix type, so that I can find specific symbol types (properties, methods, or both).

#### Acceptance Criteria

1. WHEN querying for symbols, the system shall support filtering to return only property occurrences.
2. WHEN querying for symbols, the system shall support filtering to return only method occurrences.
3. WHEN querying for symbols, the system shall support filtering to return all occurrences (wildcard match).
4. WHEN applying suffix filters, the system shall perform filtering at index level rather than post-processing.

### Requirement 3: CLI Syntax Auto-Detection

**Objective**: As a user, I want to use natural code syntax for queries, so that I can search for properties and methods without learning special flags.

#### Acceptance Criteria

1. WHEN a user provides a query ending with `()` or containing `(`, the system shall detect it as a method query.
2. WHEN a user provides a query containing `.` but no `(`, the system shall detect it as a property query.
3. WHEN a user provides a bare name (no `.` or `(`), the system shall default to wildcard match (both properties and methods).
4. WHEN a user provides a nested property query, the system shall determine type from the last segment.
5. WHEN a user provides a method query with parameters, the system shall strip parameters for matching.
6. WHEN a user queries with bare name syntax, the system shall return both property and method occurrences.

### Requirement 4: Backward Compatibility

**Objective**: As an existing user, I want my current commands to work unchanged, so that I don't need to modify my workflows.

#### Acceptance Criteria

1. WHEN existing commands are executed, the system shall maintain current behavior without modification.
2. WHEN no suffix syntax is provided, the system shall default to wildcard suffix matching.
3. WHEN existing CLI options are used, the system shall continue to function as documented.

### Requirement 5: Edge Case Handling

**Objective**: As a user, I want the system to handle ambiguous or complex queries gracefully, so that I get reliable results across all code patterns.

#### Acceptance Criteria

1. WHEN a function-type property is queried, the system shall treat it as a property (SCIP `.` suffix).
2. WHEN method overloads are encountered, the system shall match base method name after stripping parameters.
3. WHEN getters/setters are queried, the system shall support both property and method syntaxes.
4. WHEN SCIP index is missing suffix information, the system shall gracefully degrade to match all types.

---

## Functional Requirements

> Specific capabilities the system must provide.

| ID | Requirement | Rationale |
|----|-------------|-----------|
| FR-1 | Extract and preserve SCIP suffix types (`.`, `().`, `#`, `/`) during symbol parsing | SCIP protocol encodes type information in suffixes; required for filtering |
| FR-2 | Include suffix information in lookup keys for efficient filtering | Index-level filtering improves performance and accuracy |
| FR-3 | Filter query results by suffix type (property, method, or wildcard) | Enables type-specific search capabilities |
| FR-4 | Auto-detect suffix type from query syntax (`()`, `.`, bare name) | Provides intuitive, zero-flag user experience |
| FR-5 | Strip method parameters during query parsing (e.g., `method(string)` → `method`) | Handles overloaded methods and user syntax variations |
| FR-6 | Handle nested property syntax (last segment determines type) | Supports object-oriented code patterns |
| FR-7 | Maintain backward compatibility with existing queries | Prevents breaking changes for current users |

## Non-Functional Requirements

> Quality attributes and constraints.

### Performance
| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-P1 | Suffix filtering shall occur at index level | No post-processing overhead | Index-level filtering is more efficient than filtering entire result sets |
| NFR-P2 | Query response time shall not increase | <5% overhead vs current | Suffix filtering should not degrade performance |

### Reliability
| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-R1 | Graceful degradation for legacy SCIP indexes | Match all types if suffix missing | Not all SCIP indexes may include suffix information |
| NFR-R2 | No false negatives in suffix detection | 100% coverage of suffix types | All SCIP-supported suffixes must be handled |

### Usability
| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-U1 | Zero learning curve for existing users | No flags or new syntax required | Auto-detection based on existing code syntax patterns |
| NFR-U2 | Intuitive query syntax | Matches user mental model | Users write code, not CLI commands |
| NFR-U3 | Clear documentation with examples | README + CLI help text | Users need to understand auto-detection behavior |

### Code Quality
| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-Q1 | Maintain test coverage | >80% | Ensures reliability of new functionality |
| NFR-Q2 | Zero ESLint warnings | Pass all linting rules | Maintains code quality standards |
| NFR-Q3 | Follow existing TypeScript patterns | Consistent with codebase | Ensures maintainability |

---

## Configuration Requirements

> Include only if feature has configurable settings.

Not applicable — feature uses syntax-based auto-detection with no configuration options.

---

## Current Implementation Context

> Informational only. Architecture may restructure as needed.

| Behavior | Current Location | Notes |
|----------|------------------|-------|
| SCIP symbol parsing | `core/scip/SymbolParser.ts` | ✅ Suffix extraction complete (prep phase) |
| Suffix type enumeration | `core/scip/SuffixType.ts` | ✅ Created in prep phase |
| Query engine | `core/query-engine.ts` | Needs suffix filtering capability |
| CLI argument parsing | `src/cli/index.ts` | Needs integration with query-syntax module |
| Query syntax detection | `cli/query-syntax.ts` | ❌ NEW - needs implementation |

---

## Artifact Mapping

> Maps requirements to implementation. Architecture decides final structure.

| Req ID | Requirement Summary | Primary Artifact | Status | Integration Points |
|--------|---------------------|------------------|--------|-------------------|
| R1.1-R1.5 | Suffix preservation | `core/scip/SymbolParser.ts` | ✅ Prep complete | Parser pipeline, lookup key generation |
| R2.1-R2.4 | Suffix filtering | `core/query-engine.ts` | ❌ New | Index lookup, result filtering |
| R3.1-R3.6 | CLI auto-detection | `cli/query-syntax.ts` | ❌ New | CLI integration, help text |
| R4.1-R4.3 | Backward compatibility | All query artifacts | N/A | Existing test suite |
| R5.1-R5.4 | Edge case handling | `cli/query-syntax.ts`, `core/query-engine.ts` | ❌ New | Parameter stripping, wildcard default |
| FR-1, FR-2 | Suffix extraction/preservation | `core/scip/SymbolParser.ts` | ✅ Prep complete | Parser pipeline |
| FR-3 | Filter by suffix type | `core/query-engine.ts` | ❌ New | Index-level filtering |
| FR-4 | Auto-detect from syntax | `cli/query-syntax.ts` | ❌ New | CLI boundary |
| FR-5 | Strip method parameters | `cli/query-syntax.ts` | ❌ New | Syntax detection |
| FR-6 | Nested property handling | `cli/query-syntax.ts` | ❌ New | Last segment detection |
| FR-7 | Backward compatibility | All artifacts | N/A | Wildcard default behavior |
| NFR-U3 | Documentation | `README.md`, `cli/index.ts` | ❌ New | CLI help text, usage examples |

---

## Traceability

| Req ID | Primary Artifact | Implementation Status |
|--------|-----------------|----------------------|
| R1.1-R1.5 | `core/scip/SymbolParser.ts` | ✅ Complete (prep phase) |
| R2.1-R2.4 | `core/query-engine.ts` | ❌ Pending (SCF-004) |
| R3.1-R3.6 | `cli/query-syntax.ts` | ❌ Pending (SCF-004) |
| R4.1-R4.3 | All query artifacts | ✅ Existing behavior preserved |
| R5.1-R5.4 | `cli/query-syntax.ts`, `core/query-engine.ts` | ❌ Pending (SCF-004) |
| FR-1, FR-2 | `core/scip/SymbolParser.ts` | ✅ Complete (prep phase) |
| FR-3 | `core/query-engine.ts` | ❌ Pending (SCF-004) |
| FR-4, FR-5, FR-6 | `cli/query-syntax.ts` | ❌ Pending (SCF-004) |
| FR-7 | All artifacts | ✅ Wildcard default ensures compatibility |
| NFR-U3 | `cli/index.ts`, `README.md` | ❌ Pending (SCF-004) |

---
*Generated from SCF-004 by /mdt:requirements (v3)*
