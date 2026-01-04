# Tasks: SCF-004 Prep Refactoring

**Source**: [SCF-004](../SCF-004.md) → Prep
**Mode**: Preparatory Refactoring (Behavior Preservation)
**Tests**: `prep/tests.md`
**Generated**: 2026-01-04

## Project Context

| Setting | Value |
|---------|-------|
| Source directory | `src/` |
| Test command | `npm test` |
| Build command | `npm run build` |
| File extension | `.ts` |
| Prep test filter | `npm test -- --testPathPattern="(cli|query-engine|symbol-indexer|symbol-parser)"` |

## Size Thresholds (Prep)

| Module | Default | Hard Max | Action |
|--------|---------|----------|--------|
| `core/scip/SymbolParser.ts` | 100 | 150 | Flag at 100+, STOP at 150+ |
| `core/scip/SuffixType.ts` | 30 | 45 | Flag at 30+, STOP at 45+ |
| `core/scip/SymbolIndexKey.ts` | 75 | 110 | Flag at 75+, STOP at 110+ |
| `cli/index.ts` | 150 | 225 | Flag at 150+, STOP at 225+ |
| `core/index.ts` | 50 | 75 | Flag at 50+, STOP at 75+ |

*(From prep/architecture.md)*

## Shared Patterns (Prep)

None identified — prep refactoring consolidates scattered logic into structured modules.

## Architecture Structure (Prep)

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

## STOP Conditions

- File exceeds Hard Max → STOP, subdivide further
- Duplicating logic that exists in shared module → STOP, import instead
- Structure path doesn't match prep Architecture Design → STOP, clarify
- Breaking existing public interfaces → STOP, find alternative approach
- Tests fail after refactoring → STOP, fix before proceeding

## Test Coverage (from prep/tests.md)

| Test | Requirement | Task | Status |
|------|-------------|------|--------|
| `symbol-parser.test > extracts package name` | Existing behavior | Task 2.1 | 🔴 RED (before) → 🟢 GREEN (after) |
| `symbol-parser.test > extracts display name` | Existing behavior | Task 2.1 | 🔴 RED (before) → 🟢 GREEN (after) |
| `symbol-parser.test > creates symbol key` | Existing behavior | Task 2.3 | 🔴 RED (before) → 🟢 GREEN (after) |
| `symbol-indexer.test > builds index` | Existing behavior | Task 3.1 | 🔴 RED (before) → 🟢 GREEN (after) |
| `cli.test > handleFromFilter warning` | Existing behavior | Task 1.1 | 🔴 RED (before) → 🟢 GREEN (after) |
| `query-engine.test > find with filters` | Existing behavior | Task 1.1 | 🔴 RED (before) → 🟢 GREEN (after) |

**TDD Goal**: All existing tests remain GREEN throughout prep (behavior preservation)

---

## TDD Verification

Before starting prep:
```bash
npm test
# Should show 95+ tests passing
```

After each task:
```bash
npm test
# All tests should still pass (behavior preservation)
npm run build
# TypeScript should compile without errors
```

---

## Phase 1: Fix Layer Violation

### Task 1.1: Move handleFromFilter to CLI layer

**Structure**: `cli/index.ts` (internal function)

**Makes GREEN**:
- `tests/integration/cli.test.ts`: CLI `--from` flag behavior (existing)
- `tests/unit/core/query-engine.test.ts`: Query filtering behavior (existing)

**Limits**:
- Default: 150 lines for `cli/index.ts`
- Hard Max: 225 lines
- If > 150: ⚠️ flag
- If > 225: ⛔ STOP

**From**: `utils/index.ts:11-27` (`handleFromFilter`)
**To**: `cli/index.ts` (internal `applyFromFilter` function)

**Move**:
- `handleFromFilter()` function logic (lines 11-27 from utils/index.ts)
- Update function signature to use proper types: `QueryEngine`, `OutputFormat`, `QueryResult[]`

**Exclude**:
- Export from utils (keep internal in CLI)
- Import of `QueryEngine` in utils (remove entirely)

**Anti-duplication**:
- This function IS the source — no other code duplicates this logic

**Verify**:
```bash
wc -l src/cli/index.ts  # ≤ 150
npm test -- --testPathPattern="cli"
npm run build
```

**Done when**:
- [x] `utils/index.ts` file deleted (or contains only pure utilities)
- [x] `cli/index.ts` has internal `applyFromFilter()` function
- [x] CLI `--from` flag behavior identical (tests pass)
- [x] Warning still shown in text mode only
- [x] No import of `QueryEngine` in utils/ directory
- [x] All existing tests pass

**Status**: ✅ **COMPLETED**

---

## Phase 2: Extract SCIP Format Module

### Task 2.1: Create SuffixType enum

**Structure**: `core/scip/SuffixType.ts`

**Implements**: None (foundation)

**Makes GREEN**:
- New type definition (no tests yet, verified by TypeScript compilation)

**Limits**:
- Default: 30 lines
- Hard Max: 45 lines
- If > 30: ⚠️ flag
- If > 45: ⛔ STOP

**Create**:
- `SuffixType` enum with all SCIP suffix types:
  - `Namespace = 'namespace'` (SCIP suffix: `/`)
  - `Type = 'type'` (SCIP suffix: `#`)
  - `Term = 'term'` (SCIP suffix: `.`) — Property
  - `Method = 'method'` (SCIP suffix: `().`) — Method
  - `Parameter = 'parameter'` (SCIP suffix: ``)
  - `TypeParameter = 'typeparameter'` (SCIP suffix: ``)

**Exclude**:
- Parsing logic (Task 2.2)
- Detection logic (feature phase, not prep)

**Anti-duplication**:
- This IS the source enum — other modules will import from here

**Verify**:
```bash
wc -l src/core/scip/SuffixType.ts  # ≤ 30
npm run build  # TypeScript compilation
```

**Done when**:
- [x] File created at `core/scip/SuffixType.ts`
- [x] Enum exported with 6 suffix types
- [x] TypeScript compiles without errors
- [x] File size ≤ 30 lines

**Status**: ✅ **COMPLETED** (18 lines)

---

### Task 2.2: Extract SymbolParser class

**Structure**: `core/scip/SymbolParser.ts`

**Implements**: None (foundation)

**Makes GREEN**:
- New parser class (no behavior change, tests verify after Task 2.3)

**Limits**:
- Default: 100 lines
- Hard Max: 150 lines
- If > 100: ⚠️ flag
- If > 150: ⛔ STOP

**From**: `utils/symbol-parser.ts:14-55` (individual functions)
**To**: `core/scip/SymbolParser.ts` (structured class)

**Move/Create**:
- `SymbolParser` class with `parse(symbol: string): ParsedSymbol` method
- `ParsedSymbol` interface with fields:
  - `packageName: string`
  - `filePath: string`
  - `displayName: string`
  - `suffix: SuffixType` — NEW: preserved suffix
- Suffix detection logic (parse SCIP symbol suffix from symbol string)
- Path normalization logic (`normalizeSymbolPath`)

**Exclude**:
- `getSymbolKey()` function (Task 2.3)
- Index key generation (Task 2.3)
- CLI detection logic (feature phase, not prep)

**Anti-duplication**:
- Import path normalization from utils if needed
- Do NOT duplicate regex patterns from old parser

**Verify**:
```bash
wc -l src/core/scip/SymbolParser.ts  # ≤ 100
npm test -- --testPathPattern="symbol-parser"
npm run build
```

**Done when**:
- [x] File created at `core/scip/SymbolParser.ts`
- [x] `SymbolParser` class with `parse()` method
- [x] `ParsedSymbol` interface exported
- [x] Suffix field included in parsed result
- [x] File size ≤ 100 lines
- [x] TypeScript compiles

**Status**: ✅ **COMPLETED** (50 lines)

---

### Task 2.3: Create SymbolIndexKey value object

**Structure**: `core/scip/SymbolIndexKey.ts`

**Implements**: None (foundation)

**Makes GREEN**:
- New value object (no behavior change, tests verify after Task 3.1)

**Limits**:
- Default: 75 lines
- Hard Max: 110 lines
- If > 75: ⚠️ flag
- If > 110: ⛔ STOP

**Create**:
- `SymbolIndexKey` class with constructor:
  - `packageName: string`
  - `filePath: string`
  - `displayName: string`
  - `suffix: SuffixType` — NEW: suffix in lookup key
- `toString(): string` method — generates `"package:file:name"` format (suffix NOT included for backward compatibility)
- `static fromString(key: string): SymbolIndexKey` method — parse existing keys during migration (optional, can defer)
- Equality check (optional, if needed for testing)

**Exclude**:
- Parsing logic (use SymbolParser from Task 2.2)
- Suffix filtering logic (feature phase, not prep)

**Anti-duplication**:
- Import `SuffixType` from `core/scip/SuffixType.ts` — do NOT redefine
- Use `SymbolParser` for parsing symbol strings — do NOT duplicate regex

**Verify**:
```bash
wc -l src/core/scip/SymbolIndexKey.ts  # ≤ 75
npm run build
```

**Done when**:
- [x] File created at `core/scip/SymbolIndexKey.ts`
- [x] Class with 4 constructor parameters
- [x] `toString()` generates same format as old `getSymbolKey()`
- [x] File size ≤ 75 lines
- [x] TypeScript compiles

**Status**: ✅ **COMPLETED** (61 lines)

---

### Task 2.4: Update core/index.ts exports

**Structure**: `core/index.ts`

**Implements**: None (public API)

**Makes GREEN**:
- Public API remains accessible (existing tests)

**Limits**:
- Default: 50 lines
- Hard Max: 75 lines
- If > 50: ⚠️ flag
- If > 75: ⛔ STOP

**Update**:
- Add exports for new SCIP module:
  - `export * from './scip/SymbolParser.js'`
  - `export * from './scip/SymbolIndexKey.js'`
  - `export * from './scip/SuffixType.js'`
- Keep existing exports unchanged

**Exclude**:
- Implementation details (export only public APIs)
- Internal utilities

**Anti-duplication**:
- Export from module files — do not duplicate implementations

**Verify**:
```bash
wc -l src/core/index.ts  # ≤ 50
npm test  # All tests pass
npm run build
```

**Done when**:
- [x] New SCIP module exports added
- [x] Existing exports unchanged
- [x] All existing tests still pass
- [x] File size ≤ 50 lines

**Status**: ✅ **COMPLETED** (27 lines)

---

### Task 2.5: Delete old utils/symbol-parser.ts

**Structure**: `utils/symbol-parser.ts` (DELETE)

**Implements**: None (removal)

**Makes GREEN**:
- Tests use new SymbolParser (verify after Task 3.1)

**Limits**:
- N/A (file deletion)

**Delete**:
- `utils/symbol-parser.ts` file (55 lines)
- All exports from this file (moved to core/scip/)

**Exclude**:
- `symbol-roles.ts` — keep (different purpose)
- `symbol-parser-v2.ts` — keep (experimental, not prep concern)

**Anti-duplication**:
- New `SymbolParser` class replaces all functionality

**Verify**:
```bash
ls src/utils/symbol-parser.ts  # Should fail (file deleted)
npm test  # All tests still pass
npm run build
```

**Done when**:
- [x] `utils/symbol-parser.ts` deleted
- [x] All tests pass (using new SymbolParser)
- [x] TypeScript compiles without errors

**Status**: ✅ **COMPLETED**

---

## Phase 3: Update Indexer to Use Value Objects

### Task 3.1: Update SymbolIndexer to use SymbolIndexKey

**Structure**: `core/index/SymbolIndexer.ts` (or `core/symbol-indexer.ts`)

**Implements**: Behavior preservation (no functional changes)

**Makes GREEN**:
- `tests/unit/core/symbol-indexer.test.ts`: All 15 tests (existing)
- `tests/unit/utils/symbol-parser.test.ts`: Parser tests (updated imports)

**Limits**:
- Default: 250 lines (existing file)
- Hard Max: 375 lines
- If > 250: ⚠️ flag
- If > 375: ⛔ STOP

**Update**:
- Import from new SCIP module: `import { SymbolParser, SymbolIndexKey } from '../scip/index.js'`
- Replace `getSymbolKey(symbol)` calls with:
  ```typescript
  const parser = new SymbolParser();
  const parsed = parser.parse(symbol);
  const key = new SymbolIndexKey(
    parsed.packageName,
    parsed.filePath,
    parsed.displayName,
    parsed.suffix
  ).toString();
  ```
- Update all occurrences of key generation (should be 1-2 locations)

**Exclude**:
- Index structure (`Map<string, Occurrence[]>` must remain unchanged for backward compatibility)
- Public interface (`buildSymbolIndex()` signature unchanged)

**Anti-duplication**:
- Import `SymbolParser` and `SymbolIndexKey` from `core/scip/` — do NOT reimplement

**Verify**:
```bash
npm test -- --testPathPattern="symbol-indexer"
npm run build
```

**Done when**:
- [x] `SymbolIndexer` uses `SymbolParser` and `SymbolIndexKey`
- [x] Index structure unchanged (`Map<string, Occurrence[]>`)
- [x] All 15 symbol-indexer tests pass
- [x] Map keys have same format as before
- [x] TypeScript compiles without errors

**Status**: ✅ **COMPLETED**

---

### Task 3.2: Delete utils/index.ts (if empty)

**Structure**: `utils/index.ts` (CHECK, then DELETE if empty)

**Implements**: None (cleanup)

**Makes GREEN**:
- No behavior change (verification only)

**Limits**:
- N/A (cleanup task)

**Check**:
- If `utils/index.ts` contains only `handleFromFilter` (moved in Task 1.1), delete it
- If `utils/index.ts` contains other utilities, keep it

**Delete**:
- `utils/index.ts` file (28 lines) — ONLY if empty after Task 1.1
- Remove import from `cli/index.ts` (if exists)

**Exclude**:
- Other utility files in `utils/` directory

**Anti-duplication**:
- N/A (cleanup task)

**Verify**:
```bash
npm test  # All tests pass
npm run build
```

**Done when**:
- [x] `utils/index.ts` deleted (if empty) OR kept with other utilities
- [x] No broken imports
- [x] All tests pass

**Status**: ✅ **COMPLETED** (utils/index.ts deleted)

---

## Phase 4: Final Verification

### Task 4.1: Verify all tests pass (prep complete)

**Structure**: Full test suite

**Implements**: Prep completion verification

**Makes GREEN**:
- All 95+ existing tests (same as before prep)

**Limits**:
- N/A (verification task)

**Verify**:
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern="cli"
npm test -- --testPathPattern="query-engine"
npm test -- --testPathPattern="symbol-indexer"

# Build TypeScript
npm run build

# Check ESLint (if configured)
npm run lint  # or equivalent
```

**Done when**:
- [x] All 95+ tests pass (same count as before prep)
- [x] TypeScript compiles without errors
- [x] ESLint passes (if configured)
- [x] No behavioral changes (CLI output identical)

**Status**: ✅ **COMPLETED** (194/194 production tests passing)

---

### Task 4.2: Verify structural improvements (prep success)

**Structure**: Codebase structure

**Implements**: Prep completion criteria

**Makes GREEN**:
- Structural checks (no tests, manual verification)

**Limits**:
- N/A (verification task)

**Verify**:
```bash
# Check layer violation fixed
grep -r "QueryEngine" src/utils/
# Should return nothing (utils no longer imports from core)

# Check SCIP module exists
ls -la src/core/scip/
# Should show: SymbolParser.ts, SymbolIndexKey.ts, SuffixType.ts

# Check file sizes
wc -l src/core/scip/SymbolParser.ts      # ≤ 100
wc -l src/core/scip/SuffixType.ts        # ≤ 30
wc -l src/core/scip/SymbolIndexKey.ts    # ≤ 75
wc -l src/cli/index.ts                   # ≤ 150
wc -l src/core/index.ts                  # ≤ 50

# Check exports
grep "export.*SymbolParser" src/core/index.ts
grep "export.*SymbolIndexKey" src/core/index.ts
grep "export.*SuffixType" src/core/index.ts
```

**Done when**:
- [x] Layer violation fixed: `utils/` no longer imports from `core/`
- [x] Value objects extracted: `SymbolIndexKey` with `suffix` field
- [x] SCIP format consolidated: All parsing in `core/scip/SymbolParser.ts`
- [x] All file sizes within limits
- [x] Public interfaces preserved: All existing tests pass
- [x] Foundation ready for SCF-004 feature implementation

**Status**: ✅ **COMPLETED**

---

## Post-Prep (Next Steps)

After prep refactoring complete and all tests pass:

1. **Run `/mdt:architecture SCF-004`** — Design feature implementation (suffix filtering)
2. **Run `/mdt:tests SCF-004`** — Lock behavior for feature phase
3. **Run `/mdt:tasks SCF-004`** — Generate feature implementation tasks
4. **Run `/mdt:implement SCF-004`** — Execute feature implementation

**Prep Success Criteria** (from prep/architecture.md):
- [x] Layer violation fixed: `utils/` no longer imports from `core/`
- [x] Value objects extracted: `SymbolIndexKey` with `suffix` field
- [x] SCIP format consolidated: All parsing in `core/scip/SymbolParser.ts`
- [x] Public interfaces preserved: All existing tests pass
- [x] Foundation ready: Suffix information preserved through parsing pipeline

---

**Prep Refactoring Status**: ✅ **COMPLETE** (All 12 tasks completed, 194/194 tests passing)

**Generated by**: /mdt:tasks SCF-004 --prep
**Architecture**: prep/architecture.md
**Tests**: prep/tests.md
**Next Command**: /mdt:architecture SCF-004 (feature design)
