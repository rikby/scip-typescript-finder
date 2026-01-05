# Tasks: SCF-004

**Source**: [SCF-004](./SCF-004.md)
**Tests**: `docs/CRs/SCF-004/tests.md`
**Generated**: 2026-01-04

## Project Context

| Setting | Value |
|---------|-------|
| Source directory | `src/` |
| Test command | `npm test` |
| Build command | `npm run build` |
| File extension | `.ts` |
| Test filter | `--testPathPattern="query-syntax|query-engine-suffix-filter"` |

## Size Thresholds (SCF-004)

| Module | Baseline | Default | Hard Max | Action |
|--------|----------|---------|----------|--------|
| `cli/query-syntax.ts` | 0 (NEW) | 60 | 90 | Flag at 60+, STOP at 90+ |
| `core/query-engine.ts` | 124 | 164 | 246 | Flag at 164+, STOP at 246+ |
| `cli/index.ts` | 88 | 113 | 170 | Flag at 113+, STOP at 170+ |

**From Architecture Design → Size Guidance**

## Shared Utilities (SCF-004)

| Function | Extract To | Used By |
|----------|------------|---------|
| `detectQuerySyntax()` | `cli/query-syntax.ts` | `cli/index.ts` |
| `stripMethodParameters()` | `cli/query-syntax.ts` | `cli/index.ts` |

> **Phase 1** extracts these shared utilities BEFORE other phases use them.

## Architecture Structure (SCF-004)

```
src/
  ├── cli/
  │   ├── index.ts                 → UPDATE: Add help examples (+25 lines)
  │   ├── query-syntax.ts          → NEW: Syntax detection (60 lines)
  │   └── formatter.ts             → Unchanged
  ├── core/
  │   ├── query-engine.ts          → ADD: suffix filtering (+40 lines)
  │   └── scip/
  │       └── SuffixType.ts        → FROM PREP: Suffix enum
```

## STOP Conditions

- File exceeds Hard Max → STOP, subdivide further
- Duplicating syntax detection logic → STOP, import from `cli/query-syntax.ts`
- Breaking existing queries → STOP, maintain backward compatibility
- Adding post-processing filter → STOP, filtering must be at index level

## Test Coverage (from tests.md)

| Test | Requirement | Task | Status |
|------|-------------|------|--------|
| `query-syntax.test > method detection` | R3.1 | Task 1 | 🔴 RED |
| `query-syntax.test > property detection` | R3.2 | Task 1 | 🔴 RED |
| `query-syntax.test > wildcard default` | R3.3, R3.6 | Task 1 | 🔴 RED |
| `query-syntax.test > parameter stripping` | R3.5, R5.2 | Task 1 | 🔴 RED |
| `query-syntax.test > getter/setter` | R5.3 | Task 1 | 🔴 RED |
| `query-syntax.test > edge cases` | R5.4 | Task 1 | 🔴 RED |
| `query-engine-suffix-filter.test > filter by property` | R2.1 | Task 2 | 🔴 RED |
| `query-engine-suffix-filter.test > filter by method` | R2.2 | Task 2 | 🔴 RED |
| `query-engine-suffix-filter.test > wildcard match` | R2.3, R4.2 | Task 2 | 🔴 RED |
| `query-engine-suffix-filter.test > index level filtering` | R2.4 | Task 2 | 🔴 RED |
| `query-engine-suffix-filter.test > legacy SCIP` | R5.4 | Task 2 | 🔴 RED |
| `query-engine-suffix-filter.test > combined filters` | R2.4 | Task 2, 3 | 🔴 RED |

**TDD Goal**: All tests RED before implementation, GREEN after respective task

---

## TDD Verification

Before starting:
```bash
npm test -- --testPathPattern="query-syntax|query-engine-suffix-filter"
# Expected: ~35 failed, 0 passed (🔴 All RED)
```

After each task:
```bash
npm test -- --testPathPattern="query-syntax|query-engine-suffix-filter"
# Fewer failures should appear

npm test
# Full suite — no regressions
```

---

## Phase 1: Shared Utilities

### Task 1: Create CLI syntax detection module

**Structure**: `src/cli/query-syntax.ts` (NEW FILE)

**Implements**: FR-4, FR-5, FR-6

**Makes GREEN**:
- `tests/unit/cli/query-syntax.test.ts`: All 20 scenarios (R3, R5)

**Limits**:
- Default: 60 lines
- Hard Max: 90 lines
- If > 60: ⚠️ flag
- If > 90: ⛔ STOP

**Create**:
- `detectQuerySyntax(query: string): SuffixType | undefined` function
  - Returns `SuffixType.Method` if query contains `(` or ends with `()`
  - Returns `SuffixType.Term` if query contains `.` but no `(`
  - Returns `undefined` for bare names (wildcard)
- `stripMethodParameters(query: string): string` function
  - Removes `(...)` parameters from method queries
  - Handles edge cases (nested parens, unmatched parens)

**Export**:
- `detectQuerySyntax`
- `stripMethodParameters`

**Exclude**:
- Query engine logic (Task 2)
- CLI argument parsing (Task 3)

**Anti-duplication**:
- Import `SuffixType` from `core/scip/SuffixType.ts` — do NOT redefine

**Verify**:
```bash
wc -l src/cli/query-syntax.ts      # ≤ 60
npm test tests/unit/cli/query-syntax.test.ts
npm run build
```

**Done when**:
- [x] All 20 query-syntax tests GREEN (were RED)
- [x] File at `src/cli/query-syntax.ts`
- [x] Size ≤ 60 lines (actual: 39)
- [x] Exports both functions
- [x] Imports SuffixType (no duplication)

---

## Phase 2: Query Engine Enhancement

### Task 2: Add suffix filtering to query engine

**Structure**: `src/core/query-engine.ts`

**Implements**: R2.1-R2.4, FR-3, FR-7

**Makes GREEN**:
- `tests/unit/core/query-engine-suffix-filter.test.ts`: All 15 scenarios (R2, R4, R5)

**Limits**:
- Baseline: 124 lines
- Default: 164 lines (+40)
- Hard Max: 246 lines
- If > 164: ⚠️ flag
- If > 246: ⛔ STOP

**Add to** `QueryOptions` interface:
- `suffixFilter?: SuffixType` — optional suffix type filter

**Add to** `QueryResult` interface:
- `suffix?: SuffixType` — suffix type from occurrence

**Modify** `find()` method:
- Filter occurrences by `suffixFilter` if provided
- Handle `undefined` as wildcard (all types)
- Add `suffix` field to results

**Add** `suffix` to `toQueryResult()`:
- Extract from occurrence if present
- Handle legacy occurrences without suffix (graceful degradation)

**Exclude**:
- Syntax detection logic (Task 1 — import instead)
- Parameter stripping (Task 1 — import instead)

**Anti-duplication**:
- Import `SuffixType` from `core/scip/SuffixType.ts` — do NOT redefine
- Import `detectQuerySyntax` and `stripMethodParameters` from `cli/query-syntax.ts` when needed in CLI (Task 3)

**Verify**:
```bash
wc -l src/core/query-engine.ts     # ≤ 164
npm test tests/unit/core/query-engine-suffix-filter.test.ts
npm run build
```

**Done when**:
- [x] All 15 query-engine-suffix-filter tests GREEN (were RED)
- [x] `QueryOptions.suffixFilter` field added
- [x] `QueryResult.suffix` field added
- [x] Size ≤ 164 lines (actual: 141)
- [x] Backward compatible (undefined = wildcard)

---

## Phase 3: CLI Integration

### Task 3: Integrate syntax detection in CLI

**Structure**: `src/cli/index.ts`

**Implements**: R3.1-R3.6, FR-4, FR-5

**Makes GREEN**:
- Integration tests (manual CLI verification)
- `query-syntax.test.ts`: Integration scenarios

**Limits**:
- Baseline: 88 lines
- Default: 113 lines (+25)
- Hard Max: 170 lines
- If > 113: ⚠️ flag
- If > 170: ⛔ STOP

**Add imports**:
- `detectQuerySyntax` from `./query-syntax.js`
- `stripMethodParameters` from `./query-syntax.js`
- `SuffixType` from `../core/scip/SuffixType.js`

**Modify** `handleCommand()`:
- Detect query syntax: `const suffixFilter = detectQuerySyntax(symbolName)`
- Strip parameters: `const baseSymbolName = stripMethodParameters(symbolName)`
- Pass to query engine: `queryEngine.find(baseSymbolName, { from: options.from, folder: options.folder, suffixFilter })`

**Update** help text:
- Add property search example: `$ scip-finder MyThing.myProp`
- Add method search example: `$ scip-finder MyThing.method()`
- Document auto-detection behavior

**Exclude**:
- Syntax detection logic (use import from Task 1)
- Query engine logic (use import from Task 2)

**Anti-duplication**:
- Import `detectQuerySyntax` and `stripMethodParameters` — do NOT reimplement
- Import `SuffixType` — do NOT redefine

**Verify**:
```bash
wc -l src/cli/index.ts             # ≤ 113
npm test
npm run build
scip-finder --help                 # Check examples
```

**Done when**:
- [x] CLI imports from `query-syntax.ts`
- [x] Help text includes property/method examples
- [x] Size ≤ 113 lines (actual: 94)
- [x] Backward compatible (existing commands work)

---

## Phase 4: Documentation

### Task 4: Update documentation

**Structure**: `README.md`

**Implements**: NFR-U3

**Makes GREEN**:
- Manual verification tests (documentation examples work)

**Add** to README usage examples:
- Property search: `scip-finder MyThing.myProp`
- Method search: `scip-finder MyThing.method()`
- Wildcard search: `scip-finder process` (matches both)

**Document** auto-detection behavior:
- Query syntax determines suffix type
- No flags needed
- Backward compatible

**Verify**:
```bash
# Test examples from README
scip-finder MyThing.myProp
scip-finder MyThing.method()
scip-finder process
```

**Done when**:
- [x] README.md includes property/method examples
- [x] Auto-detection behavior documented
- [x] All examples work as documented

---

## Phase 3: CLI Integration

### Task 3: Integrate syntax detection in CLI

**Structure**: `src/cli/index.ts`

**Implements**: R3.1-R3.6, FR-4, FR-5

**Makes GREEN**:
- Integration tests (manual CLI verification)
- `query-syntax.test.ts`: Integration scenarios

**Limits**:
- Baseline: 88 lines
- Default: 113 lines (+25)
- Hard Max: 170 lines
- If > 113: ⚠️ flag
- If > 170: ⛔ STOP

**Add imports**:
- `detectQuerySyntax` from `./query-syntax.js`
- `stripMethodParameters` from `./query-syntax.js`
- `SuffixType` from `../core/scip/SuffixType.js`

**Modify** `handleCommand()`:
- Detect query syntax: `const suffixFilter = detectQuerySyntax(symbolName)`
- Strip parameters: `const baseSymbolName = stripMethodParameters(symbolName)`
- Pass to query engine: `queryEngine.find(baseSymbolName, { from: options.from, folder: options.folder, suffixFilter })`

**Update** help text:
- Add property search example: `$ scip-finder MyThing.myProp`
- Add method search example: `$ scip-finder MyThing.method()`
- Document auto-detection behavior

**Exclude**:
- Syntax detection logic (use import from Task 1)
- Query engine logic (use import from Task 2)

**Anti-duplication**:
- Import `detectQuerySyntax` and `stripMethodParameters` — do NOT reimplement
- Import `SuffixType` — do NOT redefine

**Verify**:
```bash
wc -l src/cli/index.ts             # ≤ 113
npm test
npm run build
scip-finder --help                 # Check examples
```

**Done when**:
- [ ] CLI imports from `query-syntax.ts`
- [ ] Help text includes property/method examples
- [ ] Size ≤ 113 lines
- [ ] Backward compatible (existing commands work)

---

## Phase 4: Documentation

### Task 4: Update documentation

**Structure**: `README.md`

**Implements**: NFR-U3

**Makes GREEN**:
- Manual verification tests (documentation examples work)

**Add** to README usage examples:
- Property search: `scip-finder MyThing.myProp`
- Method search: `scip-finder MyThing.method()`
- Wildcard search: `scip-finder process` (matches both)

**Document** auto-detection behavior:
- Query syntax determines suffix type
- No flags needed
- Backward compatible

**Verify**:
```bash
# Test examples from README
scip-finder MyThing.myProp
scip-finder MyThing.method()
scip-finder process
```

**Done when**:
- [ ] README.md includes property/method examples
- [ ] Auto-detection behavior documented
- [ ] All examples work as documented

---

## Post-Implementation

### Task 5: Verify no duplication

```bash
# Check detectQuerySyntax exists only in query-syntax.ts
grep -r "detectQuerySyntax" src/ --include="*.ts" | cut -d: -f1 | sort | uniq
```

**Done when**: [ ] `detectQuerySyntax` exists only in `src/cli/query-syntax.ts`

```bash
# Check stripMethodParameters exists only in query-syntax.ts
grep -r "stripMethodParameters" src/ --include="*.ts" | cut -d: -f1 | sort | uniq
```

**Done when**: [ ] `stripMethodParameters` exists only in `src/cli/query-syntax.ts`

### Task 6: Verify size compliance

```bash
wc -l src/cli/query-syntax.ts      # ≤ 60
wc -l src/core/query-engine.ts     # ≤ 164
wc -l src/cli/index.ts             # ≤ 113
```

**Done when**: [ ] All files within default limits (or flagged if ≤ hard max)

### Task 7: Run full test suite

```bash
npm test
```

**Done when**: [ ] All tests GREEN (including SCF-004 tests)

### Task 8: Verify backward compatibility

```bash
# Existing commands should still work
scip-finder Ticket
scip-finder --from models/Ticket.ts Ticket
scip-finder --folder src/ Ticket
```

**Done when**: [ ] All existing commands return same results as before

### Task 9: Manual CLI verification

```bash
# Test property search
scip-finder MyThing.myProp

# Test method search
scip-finder MyThing.method()

# Test wildcard (bare name)
scip-finder process

# Test combined filters
scip-finder --from models/MyThing.ts myProp
scip-finder --folder src/ process()
```

**Done when**: [ ] All CLI commands work as documented

---

## Summary

| Phase | Task | File | Lines | Tests |
|-------|------|------|-------|-------|
| 1 | Create syntax detection | `cli/query-syntax.ts` | 60 | 20 |
| 2 | Add suffix filtering | `core/query-engine.ts` | +40 | 15 |
| 3 | CLI integration | `cli/index.ts` | +25 | Integration |
| 4 | Documentation | `README.md` | - | Manual |

**Total**: ~125 new lines, 35+ tests

---

*Generated by /mdt:tasks (v7)*
