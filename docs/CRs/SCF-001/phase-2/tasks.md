# Tasks: SCF-001 Phase 2

**Source**: [SCF-001](../SCF-001.md) -> Phase 2
**Phase**: 2 - Query Core (Symbol Lookup with Filtering)
**Tests**: `phase-2/tests.md`
**Generated**: 2025-12-31

## Project Context

| Setting | Value |
|---------|-------|
| Source directory | `src/` |
| Test command | `npm test -- tests/unit/core/query-engine.test.ts` |
| Build command | `npm run build` |
| File extension | `.ts` |
| Phase test filter | `--testPathPattern=query-engine` |

## Size Thresholds (Phase 2)

| Module | Default | Hard Max | Action |
|--------|---------|----------|--------|
| `core/query-engine.ts` | 250 | 375 | Flag at 250+, STOP at 375+ |

*(From Architecture Design -> Phase 2)*

## Shared Patterns (Phase 2)

| Pattern | Extract To | Used By |
|---------|------------|---------|
| Symbol role bitmask parsing | `utils/symbol-roles.ts` | Query engine |
| SCIP symbol name extraction | `utils/symbol-parser.ts` | Query engine |

> Phase 2 imports shared utilities from Phase 1.

## Architecture Structure (Phase 2)

```
src/
  ├── core/
  │   ├── scip-loader.ts        -> (From Phase 1)
  │   ├── symbol-indexer.ts     -> (From Phase 1)
  │   └── query-engine.ts       -> NEW in Phase 2 (limit 250 lines)
  ├── utils/
  │   ├── symbol-roles.ts       -> (From Phase 1)
  │   └── symbol-parser.ts      -> (From Phase 1)
  └── bundle/
      └── scip.proto            -> (From Phase 1)
```

## STOP Conditions

- File exceeds Hard Max -> STOP, subdivide
- Duplicating logic that exists in Phase 1 shared modules -> STOP, import instead
- Structure path doesn't match Architecture Design -> STOP, clarify

## Test Coverage (from phase-2/tests.md)

| Test | Requirement | Task | Status |
|------|-------------|------|--------|
| `symbol_search_simple_name` | R1 | Task 2.1 | RED |
| `symbol_search_unknown_symbol` | R1 | Task 2.1 | RED |
| `symbol_search_case_sensitive` | R1 | Task 2.1 | RED |
| `from_filter_specific_file` | R2 | Task 2.2 | RED |
| `from_filter_different_packages` | R2 | Task 2.2 | RED |
| `from_filter_no_match` | R2 | Task 2.2 | RED |
| `folder_filter_basic` | R3 | Task 2.3 | RED |
| `folder_filter_nested` | R3 | Task 2.3 | RED |
| `folder_filter_combined_with_from` | R3 | Task 2.3 | RED |
| `package_aware_different_packages` | R4 | Task 2.4 | RED |
| `package_aware_scoped_packages` | R4 | Task 2.4 | RED |
| `package_aware_non_scoped` | R4 | Task 2.4 | RED |

**TDD Goal**: All tests RED before implementation, GREEN after respective task

---

## TDD Verification

Before starting Phase 2:
```bash
npm test -- --testPathPattern=query-engine
# Expected: 12 failed, 0 passed (RED)
```

After completing each task:
```bash
npm test -- --testPathPattern=query-engine
# Task-specific tests should turn GREEN
```

After Phase 2 complete:
```bash
npm test tests/unit/
# All Phase 1 + Phase 2 tests GREEN
```

---

## Phase 2 Tasks

### Task 2.1: Implement Symbol Search by Name

**Structure**: `src/core/query-engine.ts`

**Implements**: R1

**Makes GREEN**:
- `query-engine.test.ts`: `should return all occurrences of symbols matching the name` (R1)
- `query-engine.test.ts`: `should return empty array for unknown symbol` (R1)
- `query-engine.test.ts`: `should not match symbols with different casing` (R1)

**Limits**:
- Default: 250 lines
- Hard Max: 375 lines
- If > 250: Flag warning
- If > 375: STOP

**Create**:
- `QueryEngine` class with constructor accepting `Map<string, Occurrence[]>` symbol index
- `find(symbolName: string, options?: QueryOptions): QueryResult[]` method
- Basic symbol matching: case-sensitive exact match on symbol name
- Return all occurrences across all packages for matching symbols

**Exclude**:
- `--from` file filtering (Task 2.2)
- `--folder` filtering (Task 2.3)
- Package-aware merging (Task 2.4)

**Anti-duplication**:
- Import `extractPackageName` from `utils/symbol-parser.ts` — do NOT reimplement SCIP parsing
- Import `Role` enum from `utils/symbol-roles.ts` — do NOT redefine role constants

**Verify**:
```bash
wc -l src/core/query-engine.ts  # <= 250
npm test -- --testPathPattern=query-engine
npm run build
```

**Done when**:
- [x] 3 symbol search tests GREEN (were RED)
- [x] File at `src/core/query-engine.ts`
- [x] Size <= 250 lines (92 lines cumulative)
- [x] `find()` method returns all occurrences for symbol name
- [x] Unknown symbol returns empty array
- [x] Case-sensitive matching works

---

### Task 2.2: Implement Definition File Filtering (--from)

**Structure**: `src/core/query-engine.ts`

**Implements**: R2

**Makes GREEN**:
- `query-engine.test.ts`: `should return only occurrences from symbols defined in that file` (R2)
- `query-engine.test.ts`: `should work with different file paths for same-named symbols` (R2)
- `query-engine.test.ts`: `should return empty results` (R2)

**Limits**:
- Default: 250 lines (cumulative with Task 2.1)
- Hard Max: 375 lines
- If > 250: Flag warning
- If > 375: STOP

**Add to** `QueryEngine`:
- `from` parameter to `QueryOptions` interface
- Filter logic to match only symbols defined in specified file path
- Use full SCIP symbol matching to identify definition file

**Exclude**:
- `--folder` filtering (Task 2.3)
- Package merging logic (Task 2.4)

**Anti-duplication**:
- Import `extractPackageName` from `utils/symbol-parser.ts` for symbol comparison
- Do NOT copy SCIP symbol parsing logic

**Verify**:
```bash
wc -l src/core/query-engine.ts  # <= 250
npm test -- --testPathPattern=query-engine
```

**Done when**:
- [x] 3 `--from` filter tests GREEN (were RED)
- [x] Size still <= 250 lines (92 lines cumulative)
- [x] `--from` option filters to specific definition file
- [x] Different file paths for same-named symbols return different results

---

### Task 2.3: Implement Folder Scope Filtering (--folder)

**Structure**: `src/core/query-engine.ts`

**Implements**: R3

**Makes GREEN**:
- `query-engine.test.ts`: `should return only occurrences within the specified folder` (R3)
- `query-engine.test.ts`: `should support nested folder paths` (R3)
- `query-engine.test.ts`: `should apply both filters` (R3)

**Limits**:
- Default: 250 lines (cumulative with Tasks 2.1, 2.2)
- Hard Max: 375 lines
- If > 250: Flag warning
- If > 375: STOP

**Add to** `QueryEngine`:
- `folder` parameter to `QueryOptions` interface
- Path prefix matching logic for filtering by folder
- Combined filtering when both `from` and `folder` specified

**Exclude**:
- Complex package merging (Task 2.4)

**Anti-duplication**:
- Use string `startsWith()` for path prefix matching
- Do NOT duplicate path normalization logic if added to utils

**Verify**:
```bash
wc -l src/core/query-engine.ts  # <= 250
npm test -- --testPathPattern=query-engine
```

**Done when**:
- [x] 3 `--folder` filter tests GREEN (were RED)
- [x] Size still <= 250 lines (92 lines cumulative)
- [x] Folder path prefix matching works
- [x] Nested folder paths supported
- [x] Combined `from` + `folder` filtering works

---

### Task 2.4: Implement Package-Aware Distinction

**Structure**: `src/core/query-engine.ts`

**Implements**: R4

**Makes GREEN**:
- `query-engine.test.ts`: `should distinguish symbols by package name` (R4)
- `query-engine.test.ts`: `should handle scoped package names (@scope/package)` (R4)
- `query-engine.test.ts`: `should handle non-scoped package names` (R4)

**Limits**:
- Default: 250 lines (cumulative with Tasks 2.1-2.3)
- Hard Max: 375 lines
- If > 250: Flag warning
- If > 375: STOP

**Add to** `QueryEngine`:
- Package-aware result grouping using `extractPackageName` from utils
- Scoped package parsing (`@mdt/shared` vs `markdown-ticket`)
- Return package metadata in `QueryResult` output

**Exclude**:
- N/A — this is the final Phase 2 task

**Anti-duplication**:
- MUST use `extractPackageName()` from `utils/symbol-parser.ts`
- MUST use `Role` enum from `utils/symbol-roles.ts`
- Do NOT copy any symbol parsing logic

**Verify**:
```bash
wc -l src/core/query-engine.ts  # <= 250
npm test -- --testPathPattern=query-engine
npm test tests/unit/  # All Phase 1 + Phase 2 tests
```

**Done when**:
- [x] 3 package-aware tests GREEN (were RED)
- [x] Size <= 250 lines (92 lines)
- [x] Same-named symbols distinguished by package
- [x] Scoped packages (@scope/name) handled correctly
- [x] Non-scoped packages handled correctly
- [x] All Phase 1 + Phase 2 unit tests pass

---

## Post-Implementation (Phase 2)

### Task 2.5: Verify no duplication

```bash
# Check that query-engine doesn't reimplement symbol parsing
grep -r "extractPackageName" src/core/query-engine.ts | grep -v "import"
# Should use import from utils, not local implementation

# Check that query-engine doesn't redefine roles
grep -r "Role\." src/core/query-engine.ts | grep -v "import"
# Should use imported Role enum
```

**Done when**: [x] Query engine imports all shared utilities, no duplicated logic

### Task 2.6: Verify size compliance

```bash
wc -l src/core/query-engine.ts
# Should be <= 250 (warn if >250, error if >375)
```

**Done when**: [x] File size <= 250 lines (92 lines - OK)

### Task 2.7: Run Phase 2 tests

```bash
npm test -- --testPathPattern=query-engine
```

**Done when**: [x] All 28 Phase 2 tests GREEN

### Task 2.8: Verify Phase 1 integration

```bash
npm test tests/unit/
```

**Done when**: [x] All Phase 1 + Phase 2 unit tests GREEN (91 tests - no regressions)

### Task 2.9: Manual verification

```bash
npm run build

node -e "
  import { loadScipIndex } from './dist/core/scip-loader.js';
  import { buildSymbolIndex } from './dist/core/symbol-indexer.js';
  import { QueryEngine } from './dist/core/query-engine.js';

  const index = loadScipIndex('/path/to/index.scip');
  const symbolIndex = buildSymbolIndex(index);
  const queryEngine = new QueryEngine(symbolIndex);

  const results = queryEngine.find('Ticket', { from: 'shared/models/Ticket.ts' });
  console.log('Found', results.length, 'occurrences of Ticket from @mdt/shared');
"
```

**Done when**: [ ] Manual verification runs without errors, returns expected results

---

## Dependencies

**Before**: `/mdt:architecture SCF-001` (Phase 2 section defined)
**Before**: `/mdt:tests SCF-001 --phase 2` (tests.md exists)
**Before**: `/mdt:implement SCF-001 --phase 1` (Phase 1 utilities complete)

**After**: `/mdt:implement SCF-001 --phase 2`

---

## Co-location Pattern

```
docs/CRs/SCF-001/phase-2/
├── tests.md    <- /mdt:tests creates
└── tasks.md    <- /mdt:tasks creates (this file)
```
