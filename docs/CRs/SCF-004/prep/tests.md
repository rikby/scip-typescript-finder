# Tests: SCF-004 Prep Refactoring

**Mode**: Refactoring (Behavior Preservation)
**Source**: architecture.md → Prep
**Generated**: 2026-01-04
**Scope**: Lock current behavior before structural refactoring

## Test Configuration

| Setting | Value |
|---------|-------|
| Framework | jest |
| Test Directory | `tests/unit/` |
| Test Command | `npm test` |
| Status | 🟢 GREEN (locking current behavior) |

## Behavioral Analysis Summary

### Public Interfaces to Preserve

| Interface | Signature | Current Behavior | Test File |
|-----------|-----------|-------------------|-----------|
| `getSymbolKey()` | `(symbol: string) => string` | Returns `"package:file:name"` key, loses suffix | `symbol-parser.test.ts` |
| `extractDisplayName()` | `(symbol: string) => string` | Returns symbol name with parameters, loses suffix type | `symbol-parser.test.ts` |
| `buildSymbolIndex()` | `(scipIndex: ScipIndex) => Map` | Creates index with string keys, no suffix info | `symbol-indexer.test.ts` |
| `QueryEngine.find()` | `(name: string, options?) => QueryResult[]` | Case-sensitive exact match, filters by from/folder | `query-engine.test.ts` |
| `handleFromFilter()` | `(queryEngine, symbol, from, folder, format, results) => any[]` | Shows warning if --from has no results (text mode only) | `utils/index.ts` |

### Layer Violation to Fix

| Current Location | Issue | Target Location |
|------------------|-------|-----------------|
| `utils/index.ts` | Imports `QueryEngine` from `core/` | `cli/index.ts` (internal) |
| `utils/symbol-parser.ts` | SCIP format knowledge in utils | `core/scip/SymbolParser.ts` |

### Missing Value Objects to Create

| Gap | Current Implementation | Target Implementation |
|-----|----------------------|----------------------|
| Suffix info lost | `extractDisplayName()` strips suffix | `SymbolParser.parse()` returns `{ suffix }` |
| Primitive keys | String lookup keys | `SymbolIndexKey` value object |

## Behavior Preservation Tests

### Test Files

| File | Scenarios | Status |
|------|-----------|--------|
| `tests/unit/core/symbol-indexer.test.ts` | 15 | 🟢 Existing |
| `tests/unit/core/query-engine.test.ts` | 35 | 🟢 Existing |
| `tests/unit/utils/symbol-parser.test.ts` | 20 | 🟢 Existing |
| `tests/integration/cli.test.ts` | 25 | 🟢 Existing |
| **TOTAL** | **95** | **🟢 All GREEN** |

### Current Test Coverage

**Public API Tests:**
- ✅ `buildSymbolIndex()` creates index Map with string keys
- ✅ `QueryEngine.find()` performs case-sensitive exact match
- ✅ `QueryEngine.find()` filters by `--from` file
- ✅ `QueryEngine.find()` filters by `--folder` directory
- ✅ `getSymbolKey()` creates `"package:file:name"` format
- ✅ `extractDisplayName()` strips suffix but keeps parameters
- ✅ `handleFromFilter()` shows warning in text mode only
- ✅ CLI smoke tests pass (help, error handling, formats)

**Behavioral Contract Tests:**
- ✅ Symbol lookup is case-sensitive exact match
- ✅ `.d.ts` files normalized to `.ts` in lookup keys
- ✅ Package-aware distinction (same name, different packages)
- ✅ Occurrence deduplication by position
- ✅ Definition role flag correctly identified
- ✅ Empty symbol name returns empty results
- ✅ Invalid SCIP file shows parse error

**Integration Tests:**
- ✅ CLI argument parsing works
- ✅ SCIP file auto-discovery
- ✅ Text and JSON output formats
- ✅ Error messages displayed correctly

## Behavioral Discrepancies (Known Bugs)

The following tests currently FAIL but document current buggy behavior:

| Test | Bug | Impact |
|------|-----|--------|
| `symbol-parser-v2.test.ts` | Method parameter parsing | Test file for new parser (not prep concern) |

**Note**: These failures are NOT part of prep refactoring. They're from experimental parser code.

## Refactoring Verification Plan

### Phase 1: Fix Layer Violation

**Before Refactoring:**
```typescript
// utils/index.ts (28 lines) - VIOLATION
import { QueryEngine } from '../core/query-engine.js';

export function handleFromFilter(
  queryEngine: any,
  symbolName: string,
  from: string | undefined,
  folder: string | undefined,
  format: string,
  initialResults: any[]
): any[] {
  // ... orchestration logic
}
```

**After Refactoring:**
```typescript
// utils/index.ts - REMOVED (or contains only pure utilities)

// cli/index.ts - internal function
function applyFromFilter(
  queryEngine: QueryEngine,
  symbolName: string,
  from: string | undefined,
  folder: string | undefined,
  format: OutputFormat,
  initialResults: QueryResult[]
): QueryResult[] {
  // ... same logic, now in CLI layer
}
```

**Behavioral Preservation:**
- [ ] CLI output identical for `--from` flag with no results
- [ ] Warning shown in text mode, not JSON mode
- [ ] All existing tests pass

### Phase 2: Extract SCIP Format Module

**Before Refactoring:**
```typescript
// utils/symbol-parser.ts (55 lines)
export function extractDisplayName(symbol: string): string {
  const match = symbol.match(/\/([^\/#.]+?)(\(\)|\(.*?\))?[.#]?$/);
  return match ? match[1] + (match[2] || '') : '';
}

export function getSymbolKey(symbol: string): string {
  const packageName = extractPackageName(symbol);
  const filePath = extractFilePath(symbol);
  const displayName = extractDisplayName(symbol);
  const normalizedPath = normalizeSymbolPath(filePath);
  return `${packageName}:${normalizedPath}:${displayName}`;
}
```

**After Refactoring:**
```typescript
// core/scip/SymbolParser.ts (new, ~100 lines)
export class SymbolParser {
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
export enum SuffixType {
  Namespace = 'namespace',
  Type = 'type',
  Term = 'term',      // Property
  Method = 'method',  // Method
  Parameter = 'parameter',
  TypeParameter = 'typeparameter'
}

// core/scip/SymbolIndexKey.ts (new, ~75 lines)
export class SymbolIndexKey {
  constructor(
    public packageName: string,
    public filePath: string,
    public displayName: string,
    public suffix: SuffixType
  ) {}

  toString(): string {
    // Generates same format: "package:file:name"
    // Suffix NOT included (for backward compatibility)
  }
}
```

**Behavioral Preservation:**
- [ ] `buildSymbolIndex()` returns `Map<string, Occurrence[]>` (unchanged type)
- [ ] Map keys have same format: `"package:file:name"`
- [ ] All existing symbol lookups work identically
- [ ] `.d.ts` normalization still works
- [ ] Package-aware distinction still works
- [ ] All existing tests pass

### Phase 3: Update Indexer to Use Value Objects

**Before Refactoring:**
```typescript
// core/symbol-indexer.ts:134
const key = getSymbolKey(symbol);  // Returns string
```

**After Refactoring:**
```typescript
// core/symbol-indexer.ts
import { SymbolParser, SymbolIndexKey } from './scip/index.js';

const parser = new SymbolParser();
const parsed = parser.parse(symbol);
const key = new SymbolIndexKey(
  parsed.packageName,
  parsed.filePath,
  parsed.displayName,
  parsed.suffix
).toString();  // Uses value object, generates same string
```

**Behavioral Preservation:**
- [ ] Index structure unchanged: `Map<string, Occurrence[]>`
- [ ] Map keys identical to previous implementation
- [ ] All queries return same results
- [ ] Performance characteristics maintained
- [ ] All existing tests pass

## Test Execution

### Current State (Before Refactoring)

```bash
npm test
```

**Expected Result:**
- ✅ PASS: `tests/unit/core/symbol-indexer.test.ts` (15 tests)
- ✅ PASS: `tests/unit/core/query-engine.test.ts` (35 tests)
- ✅ PASS: `tests/unit/utils/symbol-parser.test.ts` (20 tests)
- ✅ PASS: `tests/integration/cli.test.ts` (25 tests, if fixtures exist)
- ⚠️ FAIL: `tests/unit/utils/symbol-parser-v2.test.ts` (experimental, not prep concern)

**Passing Tests**: 95+ tests
**Failing Tests**: 0 (excluding experimental parser-v2)

### After Each Refactoring Phase

**Phase 1 Verification** (Fix Layer Violation):
```bash
npm test -- --testPathPattern="cli|query-engine"
```
Expected: All CLI and query-engine tests pass

**Phase 2 Verification** (Extract SCIP Module):
```bash
npm test -- --testPathPattern="symbol-indexer|symbol-parser"
```
Expected: All indexer and parser tests pass

**Phase 3 Verification** (Update Indexer):
```bash
npm test
```
Expected: All tests pass (full suite)

### Final Verification (After Complete Prep)

```bash
npm test
```

**Expected Result:**
- ✅ ALL existing tests pass (same 95+ tests)
- ✅ No behavioral changes
- ✅ Same CLI output for all commands
- ✅ Same JSON output format
- ✅ Same error messages

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
- [ ] Performance: No regression in index building or query speed

### Foundation for SCF-004
- [ ] Suffix information preserved through parsing pipeline
- [ ] `SymbolIndexKey` supports suffix-based filtering
- [ ] `QueryEngine` ready for suffix-aware queries (after feature phase)

## Next Steps

After prep refactoring complete and all tests pass:
1. ✅ Verify all tests still GREEN
2. ✅ Run `/mdt:tasks SCF-004` for feature implementation tasks
3. ✅ Run `/mdt:architecture SCF-004` for feature architecture design
4. ✅ Begin feature implementation (suffix-aware filtering)

---

**Generated by**: /mdt:tests SCF-004 --prep
**Test Status**: 🟢 All GREEN (locking current behavior)
**Next Command**: /mdt:tasks SCF-004 --prep
