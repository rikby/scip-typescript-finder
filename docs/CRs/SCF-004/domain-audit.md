# Domain Audit: SCF-004

**Scope**: src/core/**, src/utils/**, src/cli/**
**Generated**: 2026-01-04

## Summary

| Category | 🔴 High | 🟡 Medium | 🟢 Low |
|----------|---------|-----------|--------|
| DDD Violations | 2 | 1 | 0 |
| Structural Issues | 1 | 1 | 0 |

## DDD Violations

### 🔴 High Severity

#### Missing Value Objects
- **Field**: Symbol suffix information in SCIP symbol strings
- **Current**: Primitive string manipulation across multiple files
- **Evidence**:
  - `symbol-parser.ts:21-24` — `extractDisplayName()` strips suffixes with regex
  - `symbol-parser.ts:48-55` — `getSymbolKey()` loses suffix type in lookup key
  - SCF-003 finding: SCIP emits `Suffix.Term` (.) and `Suffix.Method` (().) but scip-finder strips them
- **Impact**: Cannot distinguish properties from methods in queries (core feature gap)
- **Fix direction**: Extract `SymbolSuffix` value object with type discrimination (Property/Method/Type/Namespace)

#### Primitive Obsession
- **Evidence**:
  - `symbol-indexer.ts:48` — Lookup key is primitive `"package:file:name"` string
  - `query-engine.ts:94-100` — Key parsing with string split, no type safety
  - Symbol roles: primitive number bitmask (0x1, 0x2, etc.)
- **Impact**: Fragile parsing, no type safety for suffix-aware queries
- **Fix direction**: Introduce `SymbolKey` and `SuffixType` value objects with typed parsing

### 🟡 Medium Severity

#### Feature Envy
- **File**: `symbol-parser.ts` (55 lines)
- **Evidence**:
  - `extractPackageName()`, `extractFilePath()`, `extractDisplayName()` all parse SCIP symbol strings
  - Logic tightly coupled to SCIP symbol format but lives in utility layer
  - Called by `symbol-indexer.ts` and indirectly by query engine
- **Impact**: SCIP format knowledge scattered across utils/core boundary
- **Fix direction**: Extract `ScipSymbolParser` class to core layer with parse() method returning structured object

## Structural Issues

### 🔴 High Severity

#### Layer Violation — Utils Reach Up to Core
- **File**: `utils/index.ts` (28 lines)
- **Evidence**:
  ```typescript
  export function handleFromFilter(
    queryEngine: QueryEngine,  // ← Core dependency in utils
    ...
  ): QueryResult[] { ... }
  ```
  - `utils/` imports `QueryEngine` from `core/`
  - Utils should be lowest layer (infrastructure), not depend on domain/core
- **Expected**: Core should not import from utils, utils should not import from core
- **Fix direction**: Move `handleFromFilter()` to `cli/` as `applyFromFilter()` — it's CLI orchestration logic

### 🟡 Medium Severity

#### Mixed Responsibility in Parser
- **File**: `utils/symbol-parser.ts` (55 lines)
- **Responsibilities**:
  1. SCIP symbol format parsing (package, file, name extraction)
  2. Path normalization (.d.ts → .ts)
  3. Key generation for index lookup
- **Evidence**:
  - `extractPackageName()` — SCIP format parsing
  - `normalizeSymbolPath()` — File system logic
  - `getSymbolKey()` — Index key generation
- **Fix direction**: Split into `ScipSymbolParser` (format) + `SymbolIndexKeyBuilder` (indexing)

## Dependency Analysis

```
cli/index.ts (66 lines)
  ├── core/scip-loader.ts (findScipFile, loadScipIndex)
  ├── core/symbol-indexer.ts (buildSymbolIndex)
  ├── core/query-engine.ts (QueryEngine)
  ├── cli/formatter.ts (formatAsText, formatAsJson)
  └── utils/index.ts (handleFromFilter) ← LAYER VIOLATION
          └── core/query-engine.ts (QueryEngine)

core/symbol-indexer.ts (246 lines)
  ├── core/scip-loader.ts (ScipIndex, ScipOccurrence)
  └── utils/symbol-parser.ts (getSymbolKey)
          ├── extractPackageName
          ├── extractFilePath
          ├── extractDisplayName
          └── normalizeSymbolPath

core/query-engine.ts (125 lines)
  ├── core/symbol-indexer.ts (Occurrence)
  └── utils/symbol-parser.ts (extractPackageName)
```

**Direction violations**:
- `utils/index.ts` imports `QueryEngine` from `core/` (upward dependency)
- Utils should be infrastructure layer, not depend on core

**No cycles detected** ✅

## Domain Concept

**Core Domain**: SCIP Symbol Index Query
**Operations**: parse SCIP symbols, build lookup index, query occurrences with filters
**Current State**: Partially cohesive (clear layers but minor boundary violations)
**Natural Grouping**:
```
src/core/
├── scip/
│   ├── SymbolParser.ts         # SCIP format parsing (from utils/symbol-parser.ts)
│   ├── SymbolIndexKey.ts       # Value object for "package:file:name"
│   └── SuffixType.ts           # Enum: Namespace, Type, Term, Method
├── index/
│   ├── SymbolIndexBuilder.ts   # Build index from SCIP data
│   └── SymbolIndex.ts          # Map-based lookup structure
├── query/
│   ├── QueryEngine.ts          # Symbol lookup with filters
│   └── QueryFilters.ts         # from, folder filtering logic
└── types.ts                    # SCIP protocol types

src/cli/
├── CliCommand.ts               # Commander.js setup
├── CliOrchestrator.ts          # Coordinate load → index → query → format (new)
└── output/
      ├── TextFormatter.ts
      └── JsonFormatter.ts

src/utils/ (true utilities only)
└── path-utils.ts               # Generic path helpers
```

## Recommendations

1. **Immediate** (for SCF-004):
   - Fix layer violation: Move `handleFromFilter()` from `utils/index.ts` to `cli/` or `core/query/`
   - Add `SuffixType` enum and preserve suffix in `SymbolIndexKey` value object
   - Update `getSymbolKey()` to include suffix type in lookup key

2. **Next cycle** (refactoring):
   - Extract `ScipSymbolParser` class to core/scip/ with structured parse result
   - Introduce `SymbolIndexKey` value object (replace primitive strings)
   - Consolidate SCIP format knowledge in core/scip/ module

3. **Opportunistic** (cleanup):
   - Replace primitive role bitmask with `SymbolRole` enum/set
   - Split `utils/symbol-parser.ts` responsibilities

## Next Steps

To implement SCF-004 (property/method search):
1. **Fix layer violation first** — Move `handleFromFilter()` to appropriate layer
2. **Preserve suffix information** — Add `SuffixType` to `SymbolIndexKey` (FR-1)
3. **Add suffix filtering** — Extend `QueryEngine` with suffix-aware queries (FR-2)
4. **Implement auto-detection** — Add CLI syntax detection in `cli/` (FR-3)
5. **Update tests** — Add property/method query tests
6. **Run `/mdt:architecture SCF-004`** — Design suffix-aware symbol index structure
7. **Run `/mdt:tasks SCF-004`** — Break down implementation steps

---
*Generated by /mdt:domain-audit v2*
