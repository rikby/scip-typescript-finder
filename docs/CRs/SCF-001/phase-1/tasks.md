# Tasks: SCF-001 Phase 1

**Source**: [SCF-001](../SCF-001.md) - Phase 1
**Phase**: 1 - Foundation
**Tests**: `phase-1/tests.md`
**Generated**: 2025-12-31

## Project Context

| Setting | Value |
|---------|-------|
| Source directory | `./src` |
| Test command | `npm test tests/unit/` |
| Build command | `npm run build` |
| File extension | `.ts` |
| Phase test filter | `--testPathPattern="tests/unit/"` |

## Size Thresholds (Phase 1)

| Module | Default | Hard Max | Action |
|--------|---------|----------|--------|
| `utils/symbol-roles.ts` | 75 | 110 | Flag at 75+, STOP at 110+ |
| `utils/symbol-parser.ts` | 100 | 150 | Flag at 100+, STOP at 150+ |
| `core/scip-loader.ts` | 150 | 225 | Flag at 150+, STOP at 225+ |
| `core/symbol-indexer.ts` | 200 | 300 | Flag at 200+, STOP at 300+ |

*(From Architecture Design - Phase 1)*

## Shared Patterns (Phase 1)

| Pattern | Extract To | Used By |
|---------|------------|---------|
| SCIP role bitmask parsing | `utils/symbol-roles.ts` | Query engine, formatters (Phase 2-3) |
| SCIP symbol name extraction | `utils/symbol-parser.ts` | Indexer, query engine (Phase 1-2) |

> **Phase 1 extracts shared utilities BEFORE implementing feature modules**

## Architecture Structure (Phase 1)

```
src/
  ├── utils/
  │   ├── symbol-roles.ts       → Symbol role bitmask utilities (limit 75 lines)
  │   └── symbol-parser.ts      → SCIP symbol parsing helpers (limit 100 lines)
  ├── core/
  │   ├── scip-loader.ts        → SCIP file loading with protobufjs (limit 150 lines)
  │   └── symbol-indexer.ts     → Map-based symbol index builder (limit 200 lines)
  └── bundle/
      └── scip.proto            → SCIP Protocol Buffer schema (bundled from official repo)

tests/
  └── unit/
      ├── utils/
      │   ├── symbol-roles.test.ts
      │   └── symbol-parser.test.ts
      └── core/
          ├── scip-loader.test.ts
          └── symbol-indexer.test.ts
```

## STOP Conditions

- File exceeds Hard Max → STOP, subdivide further
- Duplicating logic that exists in shared utility → STOP, import instead
- Structure path doesn't match Architecture Design → STOP, clarify

## Test Coverage (from phase-1/tests.md)

| Test | Requirement | Task | Status |
|------|-------------|------|--------|
| `symbol-roles.test > getRoleName` | R10 | Task 1.1 | 🔴 RED |
| `symbol-roles.test > getRoleNames` | R10 | Task 1.1 | 🔴 RED |
| `symbol-roles.test > isDefinition/isReference/isImport/isExport` | R10 | Task 1.1 | 🔴 RED |
| `symbol-parser.test > extractPackageName` | R2, R4 | Task 1.2 | 🔴 RED |
| `symbol-parser.test > extractDisplayName` | R1 | Task 1.2 | 🔴 RED |
| `symbol-parser.test > extractFilePath` | R2 | Task 1.2 | 🔴 RED |
| `symbol-parser.test > isDeclarationFile` | R5 | Task 1.2 | 🔴 RED |
| `symbol-parser.test > normalizeSymbolPath` | R5 | Task 1.2 | 🔴 RED |
| `symbol-parser.test > getSymbolKey` | R4 | Task 1.2 | 🔴 RED |
| `scip-loader.test > findScipFile` | R8 | Task 1.3 | 🔴 RED |
| `scip-loader.test > loadScipIndex` | R8, R9 | Task 1.3 | 🔴 RED |
| `scip-loader.test > error handling` | R9 | Task 1.3 | 🔴 RED |
| `symbol-indexer.test > buildSymbolIndex` | R1, R4 | Task 1.4 | 🔴 RED |
| `symbol-indexer.test > package-aware indexing` | R4 | Task 1.4 | 🔴 RED |
| `symbol-indexer.test > declaration file merging` | R5 | Task 1.4 | 🔴 RED |
| `symbol-indexer.test > occurrence deduplication` | R5 | Task 1.4 | 🔴 RED |

**TDD Goal**: All 39 tests RED before implementation, GREEN after respective task

---

## TDD Verification

Before starting Phase 1:
```bash
npm test tests/unit/  # Should show failures (tests don't exist yet)
```

After completing each task:
```bash
npm test tests/unit/  # Task tests should pass
npm run build         # Verify TypeScript compiles
```

---

## Phase 1 Tasks

### Task 1.1: Implement SCIP role bitmask utilities

**Structure**: `src/utils/symbol-roles.ts`

**Implements**: R10 (Symbol role identification)

**Makes GREEN**:
- `tests/unit/utils/symbol-roles.test.ts`: `getRoleName for standard roles` (R10)
- `tests/unit/utils/symbol-roles.test.ts`: `getRoleName for unknown roles` (R10)
- `tests/unit/utils/symbol-roles.test.ts`: `getRoleNames for combined roles` (R10)
- `tests/unit/utils/symbol-roles.test.ts`: `isDefinition/isReference/isImport/isExport` (R10)
- `tests/unit/utils/symbol-roles.test.ts`: All role predicate functions (R10)

**Limits**:
- Default: 75 lines
- Hard Max: 110 lines
- If > 75: ⚠️ flag
- If > 110: ⛔ STOP

**Create**:
- `getRoleName(role: number): string` — Map bitmask to role name ("Definition", "Reference", "Import", "Export", "Unknown")
- `getRoleNames(role: number): string[]` — Return array of all role names for combined bitmask
- `isDefinition(role: number): boolean` — Check if 0x1 bit set
- `isReference(role: number): boolean` — Check if 0x2 bit set
- `isImport(role: number): boolean` — Check if 0x4 bit set
- `isExport(role: number): boolean` — Check if 0x8 bit set

**Role bitmask constants** (from SCIP protocol):
- `Definition = 0x1`
- `Reference = 0x2`
- `Import = 0x4`
- `Export = 0x8`

**Exclude**:
- Formatting logic (Phase 3 - output formatters)
- Query filtering logic (Phase 2 - query engine)

**Anti-duplication**:
- This IS the source for role utilities — Phase 2-3 will import from here

**Verify**:
```bash
wc -l src/utils/symbol-roles.ts  # <= 75
npm test tests/unit/utils/symbol-roles.test.ts
npm run build
```

**Done when**:
- [x] 14 role-related tests GREEN (were RED)
- [x] File at `src/utils/symbol-roles.ts`
- [x] Size <= 75 lines (67 lines)
- [x] Exports all role functions and constants

---

### Task 1.2: Implement SCIP symbol parsing helpers

**Structure**: `src/utils/symbol-parser.ts`

**Implements**: R1, R2, R4, R5 (Symbol parsing, package-aware distinction, declaration file handling)

**Makes GREEN**:
- `tests/unit/utils/symbol-parser.test.ts`: `extractPackageName` (P1-1, R4)
- `tests/unit/utils/symbol-parser.test.ts`: `extractDisplayName` (P1-2, R1)
- `tests/unit/utils/symbol-parser.test.ts`: `extractFilePath` (P1-3, R2)
- `tests/unit/utils/symbol-parser.test.ts`: `isDeclarationFile` (P1-4, R5)
- `tests/unit/utils/symbol-parser.test.ts`: `normalizeSymbolPath` (P1-5, R5)
- `tests/unit/utils/symbol-parser.test.ts`: `getSymbolKey` (P1-6, R4)

**Limits**:
- Default: 100 lines
- Hard Max: 150 lines
- If > 100: ⚠️ flag
- If > 150: ⛔ STOP

**Create**:
- `extractPackageName(symbol: string): string` — Extract package name from SCIP symbol format
- `extractDisplayName(symbol: string): string` — Extract readable symbol name (strip #, ., () suffixes)
- `extractFilePath(symbol: string): string` — Extract file path from backtick-enclosed path
- `isDeclarationFile(path: string): boolean` — Check if path ends with `.d.ts`
- `normalizeSymbolPath(path: string): string` — Convert `.d.ts` to `.ts` for lookup
- `getSymbolKey(symbol: string): string` — Create "package:file:name" lookup key

**SCIP symbol format** (from PoC):
```
scip-typescript npm <package-name> <version> <descriptors>
```

Examples:
- `scip-typescript npm @mdt/shared 1.0.0 models/\`Ticket.ts\`/Ticket#`
- `scip-typescript npm markdown-ticket 0.0.0 src/types/\`ticket.ts\`/Ticket#`

**Exclude**:
- Index building logic (Task 1.4 - symbol-indexer)
- Query filtering logic (Phase 2 - query engine)

**Anti-duplication**:
- This IS the source for symbol parsing — symbol-indexer and query-engine will import from here

**Verify**:
```bash
wc -l src/utils/symbol-parser.ts  # <= 100
npm test tests/unit/utils/symbol-parser.test.ts
npm run build
```

**Done when**:
- [x] 11 parsing-related tests GREEN (were RED)
- [x] File at `src/utils/symbol-parser.ts`
- [x] Size <= 100 lines (55 lines)
- [x] Handles scoped packages (@mdt/shared) and unscoped (lodash)
- [x] Correctly extracts paths from backtick-enclosed strings

---

### Task 1.3: Implement SCIP file loading with protobufjs

**Structure**: `src/core/scip-loader.ts`

**Implements**: R8, R9 (SCIP file discovery, error handling)

**Makes GREEN**:
- `tests/unit/core/scip-loader.test.ts`: `findScipFile with explicit path` (P1-7, R8)
- `tests/unit/core/scip-loader.test.ts`: `findScipFile auto-discovery` (P1-8, R8)
- `tests/unit/core/scip-loader.test.ts`: `loadScipIndex file not found` (P1-9, R9)
- `tests/unit/core/scip-loader.test.ts`: `loadScipIndex corrupted file` (P1-10, R9)

**Limits**:
- Default: 150 lines
- Hard Max: 225 lines
- If > 150: ⚠️ flag
- If > 225: ⛔ STOP

**Create**:
- `findScipFile(scipPath?: string): string | null` — Find SCIP file path
  - If `scipPath` provided: check if exists, return or null
  - If not provided: search current dir for `index.scip`, then parent dirs
- `loadScipIndex(scipPath: string): ScipIndex` — Load and parse SCIP file
  - Use `protobufjs` to decode Protocol Buffer binary
  - Throw error if file not found: "SCIP file not found: <path>"
  - Throw error if corrupted: "Failed to parse SCIP file: <reason>"

**Dependencies**:
- `protobufjs@^8.0.0` for Protocol Buffer parsing
- `src/bundle/scip.proto` — bundled SCIP schema

**Exclude**:
- Index building logic (Task 1.4 - symbol-indexer)
- Query logic (Phase 2 - query-engine)

**Anti-duplication**:
- This IS the source for SCIP loading — symbol-indexer will import `loadScipIndex`

**Bundle scip.proto** (from official SCIP repo):
- Place in `src/bundle/scip.proto`
- Used by protobufjs for runtime schema loading

**Verify**:
```bash
wc -l src/core/scip-loader.ts  # <= 150
npm test tests/unit/core/scip-loader.test.ts
npm run build
```

**Done when**:
- [x] 7 loading-related tests GREEN (were RED)
- [x] File at `src/core/scip-loader.ts`
- [x] Size <= 150 lines (112 lines)
- [x] Auto-discovers `index.scip` in current/parent dirs
- [x] Throws clear errors for missing/corrupted files

---

### Task 1.4: Implement Map-based symbol index builder

**Structure**: `src/core/symbol-indexer.ts`

**Implements**: R1, R4, R5 (Symbol search, package-aware distinction, declaration file handling)

**Makes GREEN**:
- `tests/unit/core/symbol-indexer.test.ts`: `buildSymbolIndex structure` (P1-11, R1)
- `tests/unit/core/symbol-indexer.test.ts`: `package-aware indexing` (P1-12, R4)
- `tests/unit/core/symbol-indexer.test.ts`: `declaration file merging` (P1-13, R5)
- `tests/unit/core/symbol-indexer.test.ts`: `occurrence deduplication` (P1-14, R5)
- `tests/unit/core/symbol-indexer.test.ts`: `O(1) lookup performance` (P1-15, R1)

**Limits**:
- Default: 200 lines
- Hard Max: 300 lines
- If > 200: ⚠️ flag
- If > 300: ⛔ STOP

**Create**:
- `buildSymbolIndex(scipIndex: ScipIndex): Map<string, Occurrence[]>` — Build symbol lookup index
  - Iterate all documents in SCIP index
  - For each symbol in each document:
    - Extract package, file, display name using `symbol-parser.ts`
    - Create lookup key using `getSymbolKey()`
    - Store occurrence in Map under lookup key
  - Merge `.ts` and `.d.ts` variants (normalize paths)
  - Deduplicate occurrences by file path + position

**Index structure**:
```typescript
Map<string, Occurrence[]>
  // Key: "packageName:filePath:displayName"
  // Value: Array of occurrences with { symbol, range, role, ... }
```

**Import from**:
- `@/core/scip-loader` — `loadScipIndex()`, `ScipIndex` type
- `@/utils/symbol-parser` — `extractPackageName`, `extractDisplayName`, `extractFilePath`, `getSymbolKey`, `normalizeSymbolPath`

**Exclude**:
- Query filtering logic (Phase 2 - query-engine)
- Output formatting (Phase 3 - formatters)

**Anti-duplication**:
- Use `symbol-parser.ts` for all symbol extraction — do NOT duplicate parsing logic
- Use `symbol-roles.ts` for role checks if needed

**Verify**:
```bash
wc -l src/core/symbol-indexer.ts  # <= 200
npm test tests/unit/core/symbol-indexer.test.ts
npm run build
```

**Done when**:
- [x] 7 index-related tests GREEN (were RED)
- [x] File at `src/core/symbol-indexer.ts`
- [x] Size <= 200 lines (122 lines)
- [x] Creates Map with unique symbol keys
- [x] Merges .ts and .d.ts variants correctly
- [x] Deduplicates occurrences

---

## Post-Implementation (Phase 1)

### Task 1.5: Verify no duplication

```bash
# Check for duplicated role parsing logic
grep -r "0x1\|0x2\|0x4\|0x8" src/ | grep -v "symbol-roles.ts" | wc -l
# Should be 0 (all role checks import from symbol-roles.ts)

# Check for duplicated symbol parsing logic
grep -r "extractPackageName\|extractDisplayName" src/ | grep -v "symbol-parser.ts" | wc -l
# Should be 0 (all parsing imports from symbol-parser.ts)
```

**Done when**:
- [x] Role bitmask logic exists only in `symbol-roles.ts`
- [x] Symbol parsing logic exists only in `symbol-parser.ts`
- [x] Other modules import, not duplicate

---

### Task 1.6: Verify size compliance

```bash
# Check all Phase 1 modules against limits
echo "Checking file sizes..."
for file in src/utils/symbol-roles.ts src/utils/symbol-parser.ts src/core/scip-loader.ts src/core/symbol-indexer.ts; do
  lines=$(wc -l < "$file" 2>/dev/null || echo "0")
  echo "$file: $lines lines"
done
```

**Done when**:
- [x] `symbol-roles.ts` <= 75 lines (67 lines - OK)
- [x] `symbol-parser.ts` <= 100 lines (55 lines - OK)
- [x] `scip-loader.ts` <= 150 lines (112 lines - OK)
- [x] `symbol-indexer.ts` <= 200 lines (122 lines - OK)
- [x] No files exceed hard max

---

### Task 1.7: Run Phase 1 tests

```bash
npm test tests/unit/
```

**Done when**:
- [x] All 63 Phase 1 tests GREEN
- [x] No test failures
- [x] No TypeScript errors

---

### Task 1.8: Manual verification (optional but recommended)

```bash
npm run build
node -e "
  import { loadScipIndex } from './dist/core/scip-loader.js';
  import { buildSymbolIndex } from './dist/core/symbol-indexer.js';
  const index = loadScipIndex('/path/to/index.scip');
  const symbolIndex = buildSymbolIndex(index);
  console.log('✓ Loaded', index.documents.length, 'documents');
  console.log('✓ Indexed', symbolIndex.size, 'unique symbols');
"
```

**Done when**:
- [ ] Manual verification script runs without errors
- [ ] Shows reasonable document and symbol counts

---

## Phase 1 Completion Criteria

- [ ] All 39 unit tests passing
- [ ] All files within size limits (or flagged if near hard max)
- [ ] No code duplication (shared utilities imported, not copied)
- [ ] TypeScript compiles without errors
- [ ] Manual verification confirms SCIP loading and indexing works

**Deliverable**: Working symbol index API + passing unit tests

---

*Generated by /mdt:tasks (v5)*
