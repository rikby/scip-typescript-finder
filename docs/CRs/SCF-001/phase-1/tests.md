# Tests: SCF-001 Phase 1

**Mode**: Feature
**Phase**: 1 - Foundation
**Source**: requirements.md + architecture.md Phase 1
**Generated**: 2025-12-31
**Scope**: Phase 1 only (SCIP parsing + symbol index)

## Test Configuration

| Setting | Value |
|---------|-------|
| Framework | Jest (TypeScript) |
| Test Directory | `tests/` |
| Test Command | `npm test tests/unit/` |
| Phase Filter | `--testPathPattern="tests/unit/"` |
| Status | 🔴 RED (implementation pending) |

## Requirement → Test Mapping

| Req ID | Description | Test File | Scenarios | Status |
|--------|-------------|-----------|-----------|--------|
| R1 | Symbol search by name | `symbol-indexer.test.ts` | 4 | 🔴 RED |
| R2 | Definition file filtering | `symbol-parser.test.ts` | 3 | 🔴 RED |
| R4 | Package-aware distinction | `symbol-parser.test.ts`, `symbol-indexer.test.ts` | 5 | 🔴 RED |
| R5 | Declaration file handling | `symbol-parser.test.ts`, `symbol-indexer.test.ts` | 6 | 🔴 RED |
| R8 | SCIP file discovery | `scip-loader.test.ts` | 4 | 🔴 RED |
| R9 | Error handling | `scip-loader.test.ts` | 3 | 🔴 RED |
| R10 | Symbol role identification | `symbol-roles.test.ts` | 14 | 🔴 RED |

**Total**: 39 scenarios across 4 test files

## Test Specifications

### Feature: Symbol Role Identification (R10)

**File**: `tests/unit/utils/symbol-roles.test.ts`
**Covers**: R10

#### Scenario: getRoleName for standard roles

```gherkin
Given a SCIP symbol role bitmask
When the role is 0x1 (Definition)
Then return "Definition"
When the role is 0x2 (Reference)
Then return "Reference"
When the role is 0x4 (Import)
Then return "Import"
When the role is 0x8 (Export)
Then return "Export"
```

**Test**: `describe('getRoleName') > it('should return "Definition" for definition role')`

---

#### Scenario: getRoleName for unknown roles

```gherkin
Given an unknown SCIP symbol role bitmask
When the role is 0x100 or 0 (undefined/zero)
Then return "Unknown"
```

**Test**: `describe('getRoleName') > it('should return "Unknown" for unrecognized role')`

---

#### Scenario: getRoleNames for combined roles

```gherkin
Given a symbol with multiple roles (bitmask combination)
When the bitmask is 0x5 (Definition + Import)
Then return ['Definition', 'Import']
When the bitmask is 0xF (all roles)
Then return ['Definition', 'Reference', 'Import', 'Export']
```

**Test**: `describe('getRoleNames') > it('should return array of all role names')`

---

#### Scenario: Role predicate functions

```gherkin
Given a SCIP symbol role bitmask
When checking isDefinition(0x1)
Then return true
When checking isDefinition(0x2)
Then return false
When checking isReference(0x2)
Then return true
When checking isImport(0x4)
Then return true
When checking isExport(0x8)
Then return true
```

**Test**: `describe('isDefinition/isReference/isImport/isExport') > it('should return true when bit is set')`

---

### Feature: Symbol Parsing (R2, R4, R5)

**File**: `tests/unit/utils/symbol-parser.test.ts`
**Covers**: R2, R4, R5

#### Scenario: extractPackageName (P1-1)

```gherkin
Given a SCIP symbol string with package metadata
When the symbol is "scip-typescript npm @mdt/shared 1.0.0 ..."
Then extract "@mdt/shared" as package name
When the symbol is from unscoped package "npm lodash 4.17.21"
Then extract "lodash" as package name
```

**Test**: `describe('extractPackageName') > it('should extract package name')`

---

#### Scenario: extractDisplayName (P1-2)

```gherkin
Given a SCIP symbol string with encoded display name
When the symbol ends with '#' (interface/type)
Then return name without suffix: "Ticket"
When the symbol ends with '().' (method)
Then return name with '()': "parseDate()"
When the symbol ends with '.' (property)
Then return property name: "id"
```

**Test**: `describe('extractDisplayName') > it('should extract interface name without # suffix')`

---

#### Scenario: extractFilePath (P1-3)

```gherkin
Given a SCIP symbol with backtick-enclosed file path
When the symbol contains 'models/\\`Ticket.ts\\`/...'
Then extract "models/Ticket.ts"
When the symbol contains nested paths
Then extract full directory path
```

**Test**: `describe('extractFilePath') > it('should extract file path from backtick-enclosed path')`

---

#### Scenario: isDeclarationFile (P1-4)

```gherkin
Given a file path string
When the path ends with ".d.ts"
Then return true
When the path ends with ".ts" (but not ".d.ts")
Then return false
```

**Test**: `describe('isDeclarationFile') > it('should return true for .d.ts declaration file')`

---

#### Scenario: normalizeSymbolPath (P1-5)

```gherkin
Given a file path string
When the path is "models/Ticket.d.ts"
Then return "models/Ticket.ts"
When the path is "models/Ticket.ts"
Then return unchanged
```

**Test**: `describe('normalizeSymbolPath') > it('should normalize .d.ts to .ts')`

---

#### Scenario: getSymbolKey (P1-6)

```gherkin
Given a SCIP symbol
When creating a lookup key
Then return "packageName:filePath:displayName"
When symbols have same name from different packages
Then create different keys
When symbols have same name from same package different files
Then create different keys including file path
```

**Test**: `describe('getSymbolKey') > it('should create key from package, file, and display name')`

---

### Feature: SCIP Loading (R8, R9)

**File**: `tests/unit/core/scip-loader.test.ts`
**Covers**: R8, R9

#### Scenario: findScipFile with explicit path (P1-7)

```gherkin
Given a --scip argument provided
When the file exists at the path
Then return the provided path
When the file does not exist
Then return null
```

**Test**: `describe('findScipFile') > it('should return the provided path if file exists')`

---

#### Scenario: findScipFile auto-discovery (P1-8)

```gherkin
Given no --scip argument provided
When index.scip exists in current directory
Then return current directory path
When not found, search parent directories
When not found in any parent
Then return null
```

**Test**: `describe('findScipFile') > it('should search current directory for index.scip')`

---

#### Scenario: loadScipIndex file not found (P1-9)

```gherkin
Given a SCIP file path that does not exist
When attempting to load
Then throw error "SCIP file not found: <path>"
```

**Test**: `describe('loadScipIndex') > it('should throw error with file path')`

---

#### Scenario: loadScipIndex corrupted file (P1-10)

```gherkin
Given a SCIP file that exists but is corrupted
When protobufjs fails to decode
Then throw error "Failed to parse SCIP file: <reason>"
```

**Test**: `describe('loadScipIndex') > it('should throw parse error')`

---

### Feature: Symbol Index Building (R1, R4, R5)

**File**: `tests/unit/core/symbol-indexer.test.ts`
**Covers**: R1, R4, R5

#### Scenario: buildSymbolIndex structure (P1-11)

```gherkin
Given a loaded SCIP index with documents
When building the symbol index
Then create Map<string, Occurrence[]>
And index all unique symbols
And each symbol maps to array of occurrences
```

**Test**: `describe('buildSymbolIndex') > it('should create Map with symbol keys')`

---

#### Scenario: package-aware indexing (P1-12)

```gherkin
Given symbols with same name from different packages
When building the index
Then create separate entries for each package
And keys include package name for distinction
```

**Test**: `describe('buildSymbolIndex') > it('should create separate entries for each package')`

---

#### Scenario: declaration file merging (P1-13)

```gherkin
Given .ts and .d.ts variants of same symbol from same package
When building the index
Then merge occurrences from both variants
And normalize .d.ts paths to .ts in lookup key
```

**Test**: `describe('buildSymbolIndex') > it('should merge occurrences from both variants')`

---

#### Scenario: occurrence deduplication (P1-14)

```gherkin
Given multiple occurrences with same file path and position
When building the index
Then deduplicate to single occurrence
```

**Test**: `describe('buildSymbolIndex') > it('should remove duplicate occurrences')`

---

#### Scenario: O(1) lookup performance (P1-15)

```gherkin
Given a built symbol index
When querying by symbol key
Then return results in < 1ms
```

**Test**: `describe('Index Structure') > it('should support O(1) lookup by symbol key')`

---

## Edge Cases

| Scenario | Expected Behavior | Test | Req |
|----------|-------------------|------|-----|
| Empty symbol string | Return empty/unknown values | `symbol-parser.test.ts` | R1 |
| Symbol without package metadata | Return empty string | `symbol-parser.test.ts` | R4 |
| Zero/undefined role bitmask | Return "Unknown" role | `symbol-roles.test.ts` | R10 |
| SCIP file not in current or parent dirs | Return null | `scip-loader.test.ts` | R8 |
| Duplicate occurrences | Deduplicate by file+position | `symbol-indexer.test.ts` | R5 |
| Only .d.ts variant exists | Use .d.ts occurrences | `symbol-indexer.test.ts` | R5 |

## Generated Test Files

| File | Scenarios | Lines | Status |
|------|-----------|-------|--------|
| `tests/unit/utils/symbol-roles.test.ts` | 14 | ~130 | 🔴 RED |
| `tests/unit/utils/symbol-parser.test.ts` | 11 | ~180 | 🔴 RED |
| `tests/unit/core/scip-loader.test.ts` | 7 | ~100 | 🔴 RED |
| `tests/unit/core/symbol-indexer.test.ts` | 7 | ~180 | 🔴 RED |

## Verification

Run Phase 1 tests (should all fail):

```bash
npm test tests/unit/
```

Expected: **39 failed, 0 passed**

## Coverage Checklist

- [x] All Phase 1 requirements have at least one test
- [x] Error scenarios covered (missing SCIP, corrupted SCIP)
- [x] Edge cases documented (empty symbols, zero roles, duplicates)
- [x] Package-aware distinction tested
- [x] Declaration file handling tested
- [x] Performance assertion included (O(1) lookup)
- [ ] Tests are RED (verified manually)

---

## For Implementation

Each task in `/mdt:tasks` should reference which tests it will make GREEN:

| Task | Makes GREEN |
|------|-------------|
| Task 1.1: symbol-roles.ts | `symbol-roles.test.ts` (R10 - all scenarios) |
| Task 1.2: symbol-parser.ts | `symbol-parser.test.ts` (R2, R4, R5 - all scenarios) |
| Task 1.3: scip-loader.ts | `scip-loader.test.ts` (R8, R9 - all scenarios) |
| Task 1.4: symbol-indexer.ts | `symbol-indexer.test.ts` (R1, R4, R5 - all scenarios) |

After each task: `npm test tests/unit/` should show fewer failures.

---

*Generated by /mdt:tests (v2)*
