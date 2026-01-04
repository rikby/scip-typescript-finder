# Prep Architecture: SCF-004

**Source**: [SCF-004](../SCF-004.md)
**Generated**: 2026-01-04
**Mode**: Preparatory Refactoring
**Input**: [domain-audit.md](../domain-audit.md)

## Overview

This refactoring addresses structural issues identified in the domain audit that block SCF-004 implementation. The audit revealed:
- Layer violation: `utils/index.ts` imports `QueryEngine` from `core/`
- Missing value objects: Suffix information lost during parsing
- Primitive obsession: Lookup keys are fragile strings

**Goal**: Restructure code to enable suffix-aware symbol queries without breaking existing behavior.

## Pattern

**Value Object Extraction + Layer Boundary Enforcement** — Separate SCIP format knowledge from indexing logic, and move orchestration to appropriate layer.

### Rationale

- **Value Objects**: Encapsulate suffix type and symbol keys with type safety
- **Layer Enforcement**: Utils should never depend on core; orchestration belongs in CLI
- **Behavior Preservation**: All changes are internal; public interfaces remain stable

## Current Structure Analysis

### Issues from domain-audit.md

| Issue | File | Problem | Impact |
|-------|------|---------|--------|
| Layer Violation | `utils/index.ts:28` | Imports `QueryEngine` from core | Utils depends on core (upward dependency) |
| Missing Value Object | `symbol-parser.ts:48-55` | `getSymbolKey()` loses suffix type | Cannot filter by property vs method |
| Primitive Obsession | `symbol-indexer.ts:48` | Lookup key is `"package:file:name"` string | Fragile parsing, no type safety |
| Mixed Responsibility | `symbol-parser.ts:55` | SCIP parsing + path normalization + key gen | Hard to extend with suffix logic |

### Dependency Violation

```
utils/index.ts (28 lines)
  └── core/query-engine.ts ← VIOLATION: utils importing from core
```

**Expected**: Core → Utils (core may use utils)
**Actual**: Utils → Core (upward dependency, wrong direction)

## Refactoring Transformation

### Phase 1: Fix Layer Violation

| From | To | Reduction | Reason |
|------|----|-----------|--------|
| `utils/index.ts` exports `handleFromFilter()` | `cli/index.ts` internal `applyFromFilter()` | 28 → 0 lines in utils | Orchestration logic belongs in CLI layer |
| `utils/index.ts` imports `QueryEngine` | Remove import entirely | Eliminates upward dependency | Utils should be infrastructure layer |

**Impact**:
- `utils/index.ts` becomes empty (can be removed)
- `cli/index.ts` gains orchestrator logic (proper home)
- Dependency direction corrected: CLI → Core → Utils

### Phase 2: Extract SCIP Format Module

| From | To | Reduction | Reason |
|------|----|-----------|--------|
| `utils/symbol-parser.ts` (55 lines) | `core/scip/SymbolParser.ts` | 55 → 100 lines (structured) | SCIP format knowledge lives in core |
| `extractDisplayName()` (regex, loses suffix) | `SymbolParser.parse().suffix` | Preserves suffix | Required for FR-1 (suffix extraction) |
| `getSymbolKey()` (primitive string) | `core/scip/SymbolIndexKey.ts` | String → Value Object | Type-safe key with suffix field |

**New Structure**:

```typescript
// core/scip/SymbolParser.ts (extracted from utils)
class SymbolParser {
  parse(symbol: string): ParsedSymbol {
    // Returns structured object with suffix field
  }
}

interface ParsedSymbol {
  packageName: string;
  filePath: string;
  displayName: string;
  suffix: SuffixType;  // NEW: preserved suffix
}

// core/scip/SuffixType.ts (new)
enum SuffixType {
  Namespace = 'namespace',
  Type = 'type',
  Term = 'term',      // Property
  Method = 'method',  // Method
  Parameter = 'parameter',
  TypeParameter = 'typeparameter'
}

// core/scip/SymbolIndexKey.ts (new)
class SymbolIndexKey {
  constructor(
    public packageName: string,
    public filePath: string,
    public displayName: string,
    public suffix: SuffixType  // NEW: suffix in lookup key
  ) {}

  toString(): string {
    // For Map lookup key: "package:file:name:suffix"
  }

  static fromString(key: string): SymbolIndexKey {
    // Parse existing keys during migration
  }
}
```

### Phase 3: Update Indexer to Use Value Objects

| From | To | Reduction | Reason |
|------|----|-----------|--------|
| `symbol-indexer.ts:48` uses `getSymbolKey()` string | Uses `SymbolIndexKey` value object | String → Typed | Lookup key includes suffix for filtering |

**Behavioral Equivalence**:
- `SymbolIndexKey.toString()` generates same key format for Map compatibility
- Existing index building logic unchanged (uses SymbolIndexKey internally)
- Public interface `buildSymbolIndex()` preserved

## Shared Patterns

None identified — refactoring consolidates scattered logic into structured modules.

## Structure

### Target Structure (After Prep)

```
src/
├── core/
│   ├── scip/                    # NEW: SCIP format module
│   │   ├── SymbolParser.ts      # From utils/symbol-parser.ts (structured)
│   │   ├── SymbolIndexKey.ts    # NEW: Value object with suffix
│   │   └── SuffixType.ts        # NEW: Enum for suffix types
│   ├── index/
│   │   └── SymbolIndexer.ts     # Updated: uses SymbolIndexKey
│   ├── query/
│   │   └── QueryEngine.ts       # Updated: suffix-aware filtering (Phase 2)
│   ├── scip-loader.ts           # Unchanged
│   └── scip-types.ts            # Unchanged
├── cli/
│   ├── index.ts                 # Updated: absorbs handleFromFilter logic
│   └── formatter.ts             # Unchanged
└── utils/                       # True utilities only
    └── path-utils.ts            # NEW: Generic path helpers (if needed)
```

### Removed Files

- `utils/index.ts` (28 lines) — orchestration moved to CLI
- `utils/symbol-parser.ts` (55 lines) — moved to `core/scip/SymbolParser.ts`

### New Files

- `core/scip/SymbolParser.ts` — Structured SCIP parsing
- `core/scip/SuffixType.ts` — Suffix type enum
- `core/scip/SymbolIndexKey.ts` — Value object for lookup keys

## Size Guidance

| Module | Role | Limit | Hard Max |
|--------|------|-------|----------|
| `core/scip/SymbolParser.ts` | SCIP format parsing | 100 | 150 |
| `core/scip/SuffixType.ts` | Type definition | 30 | 45 |
| `core/scip/SymbolIndexKey.ts` | Value object | 75 | 110 |
| `cli/index.ts` | CLI orchestration | 150 | 225 |
| `core/index.ts` | Public API exports | 50 | 75 |

**Total Reduction**:
- Remove: 83 lines (utils/index.ts + utils/symbol-parser.ts)
- Add: 205 lines (core/scip/ module + cli growth)
- Net: +122 lines (but structured, testable, extensible)

## Interface Preservation

| Public Interface | Status | Verification |
|------------------|--------|--------------|
| `core/scip-loader.ts: findScipFile()` | Preserved | Existing tests |
| `core/scip-loader.ts: loadScipIndex()` | Preserved | Existing tests |
| `core/symbol-indexer.ts: buildSymbolIndex()` | Preserved | Existing tests |
| `core/query-engine.ts: QueryEngine.findOccurrences()` | Preserved | Existing tests |
| `cli/index.ts: main()` | Preserved | CLI smoke tests |
| `utils/symbol-parser.ts: extractPackageName()` | **Removed** | Internal only, called by indexer |
| `utils/symbol-parser.ts: extractFilePath()` | **Removed** | Internal only, called by indexer |
| `utils/symbol-parser.ts: extractDisplayName()` | **Removed** | Replaced by `SymbolParser.parse()` |
| `utils/symbol-parser.ts: getSymbolKey()` | **Removed** | Replaced by `SymbolIndexKey` |
| `utils/index.ts: handleFromFilter()` | **Removed** | Moved to `cli/index.ts` internal |

**Breaking Changes**: None (all removed interfaces are internal utilities)

## Behavioral Equivalence

### Test Coverage
- **Existing tests** verify: index building, symbol lookup, query filtering
- **New tests needed**: SymbolParser parsing, SymbolIndexKey equality, suffix extraction

### Migration Strategy
1. **Add new files** (`core/scip/`) alongside old code
2. **Update indexer** to use `SymbolIndexKey` internally
3. **Update CLI** to absorb `handleFromFilter` logic
4. **Remove old files** (`utils/symbol-parser.ts`, `utils/index.ts`)
5. **Run full test suite** to verify behavioral equivalence

### Performance Impact
- **Indexing**: Minimal overhead (value object construction vs string concat)
- **Querying**: No change (Map lookup still uses string keys via `toString()`)
- **Memory**: Slight increase (SymbolIndexKey objects vs strings)

## Extension Rule

After prep refactoring:
1. **To add suffix filtering** (FR-2): Extend `QueryEngine` with `filterBySuffix()` method
2. **To add CLI auto-detection** (FR-3): Add `detectSuffixType()` in `cli/index.ts`
3. **To add new suffix types**: Extend `SuffixType` enum (e.g., `Macro`, `Module`)

## Domain Alignment

| Domain Concept | Implementation | Notes |
|----------------|----------------|-------|
| SCIP Symbol (aggregate root) | `core/scip/SymbolParser.ts` | Entry point for symbol parsing |
| Symbol Suffix (value object) | `core/scip/SuffixType.ts` | Type-safe suffix representation |
| Index Key (value object) | `core/scip/SymbolIndexKey.ts` | Encapsulates lookup logic with suffix |
| Symbol Index (aggregate) | `core/index/SymbolIndexer.ts` | Uses SymbolIndexKey for building index |
| Query (aggregate root) | `core/query/QueryEngine.ts` | After prep, ready for suffix filtering |

## Next Steps (Prep Workflow)

1. **Lock current behavior** — Run `/mdt:tests SCF-004 --prep` to capture existing test coverage
2. **Break down refactoring** — Run `/mdt:tasks SCF-004 --prep` for prep tasks
3. **Execute refactoring** — Run `/mdt:implement SCF-004 --prep` to complete prep
4. **Verify behavior preserved** — Run full test suite, compare before/after
5. **Design feature architecture** — Run `/mdt:architecture SCF-004` for suffix filtering feature

## Success Criteria

### Structural (Prep Completeness)
- [ ] Layer violation fixed: `utils/` no longer imports from `core/`
- [ ] Value objects extracted: `SymbolIndexKey` with `suffix` field
- [ ] SCIP format consolidated: All parsing in `core/scip/SymbolParser.ts`
- [ ] Public interfaces preserved: All existing tests pass

### Quality
- [ ] TypeScript compilation: No errors
- [ ] ESLint: Zero warnings
- [ ] Test coverage: Maintained or improved

### Foundation for SCF-004
- [ ] Suffix information preserved through parsing pipeline
- [ ] `SymbolIndexKey` supports suffix-based filtering
- [ ] `QueryEngine` ready for suffix-aware queries (after feature phase)

---
*Generated by /mdt:architecture (prep mode)*
