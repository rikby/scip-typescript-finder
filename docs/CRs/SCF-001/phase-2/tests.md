# Tests: SCF-001 Phase 2

**Mode**: Feature
**Phase**: 2 - Query Core (Symbol Lookup with Filtering)
**Source**: architecture.md → Phase 2
**Generated**: 2025-12-31
**Scope**: Phase 2 only

## Test Configuration

| Setting | Value |
|---------|-------|
| Framework | Jest |
| Test Directory | `tests/unit/core/` |
| Test Command | `npm test tests/unit/core/query-engine.test.ts` |
| Phase Filter | `npm test -- --testPathPattern=query-engine` |
| Status | 🔴 RED (implementation pending) |

## Requirement → Test Mapping

| Req ID | Description | Test File | Scenarios | Status |
|--------|-------------|-----------|-----------|--------|
| R1 | Symbol search by name | `query-engine.test.ts` | 6 | 🔴 RED |
| R2 | Definition file filtering | `query-engine.test.ts` | 7 | 🔴 RED |
| R3 | Folder scope filtering | `query-engine.test.ts` | 6 | 🔴 RED |
| R4 | Package-aware distinction | `query-engine.test.ts` | 5 | 🔴 RED |

## Test Specifications

### Feature: Symbol Search by Name (R1)

**File**: `tests/unit/core/query-engine.test.ts`
**Covers**: R1

#### Scenario: symbol_search_simple_name (R1)

```gherkin
Given a symbol index containing multiple Ticket symbols
When searching for "Ticket"
Then returns all occurrences of symbols matching "Ticket"
And results include occurrences from both @mdt/shared and markdown-ticket packages
And each result has symbol, filePath, line, column, roles properties
```

**Test**: `describe('Symbol Search by Name (R1)') > it('should return all occurrences of symbols matching the name')`

---

#### Scenario: symbol_search_unknown_symbol (R1)

```gherkin
Given a symbol index containing various symbols
When searching for "NonExistent"
Then returns empty array
```

**Test**: `describe('Symbol Search by Name (R1)') > it('should return empty array for unknown symbol')`

---

#### Scenario: symbol_search_case_sensitive (R1)

```gherkin
Given a symbol index containing "Ticket" symbols
When searching for "ticket" (lowercase)
Then returns empty array (case-sensitive match)
```

**Test**: `describe('Symbol Search by Name (R1)') > it('should not match symbols with different casing')`

---

### Feature: Definition File Filtering (R2)

**File**: `tests/unit/core/query-engine.test.ts`
**Covers**: R2

#### Scenario: from_filter_specific_file (R2)

```gherkin
Given a symbol index with Ticket from shared/models/Ticket.ts and src/types.ts
When searching for "Ticket" with from: "shared/models/Ticket.ts"
Then returns only occurrences from @mdt/shared Ticket
And does not include occurrences from markdown-ticket package
```

**Test**: `describe('Definition File Filtering (R2)') > it('should return only occurrences from symbols defined in that file')`

---

#### Scenario: from_filter_different_packages (R2)

```gherkin
Given same-named symbols in different packages
When searching with from: "shared/models/Ticket.ts"
And searching with from: "src/types.ts"
Then results are different for each file
```

**Test**: `describe('Definition File Filtering (R2)') > it('should work with different file paths for same-named symbols')`

---

#### Scenario: from_filter_no_match (R2)

```gherkin
Given a symbol index with Ticket defined in specific files
When searching for "Ticket" with from: "some/other/File.ts"
Then returns empty results
```

**Test**: `describe('Definition File Filtering (R2)') > it('should return empty results')`

---

### Feature: Folder Scope Filtering (R3)

**File**: `tests/unit/core/query-engine.test.ts`
**Covers**: R3

#### Scenario: folder_filter_basic (R3)

```gherkin
Given a symbol index with occurrences across multiple directories
When searching for "Ticket" with folder: "src/"
Then returns only occurrences within src/ directory
And all result file paths start with "src/"
```

**Test**: `describe('Folder Scope Filtering (R3)') > it('should return only occurrences within the specified folder')`

---

#### Scenario: folder_filter_nested (R3)

```gherkin
Given a symbol index with occurrences in nested directories
When searching for "Ticket" with folder: "shared/models/"
Then returns only occurrences within shared/models/ subdirectory
```

**Test**: `describe('Folder Scope Filtering (R3)') > it('should support nested folder paths')`

---

#### Scenario: folder_filter_combined_with_from (R3)

```gherkin
Given a symbol index with occurrences across directories
When searching for "Ticket" with from: "shared/models/Ticket.ts" and folder: "src/"
Then applies both filters
And only returns occurrences from @mdt/shared Ticket in src/ folder
```

**Test**: `describe('Folder Scope Filtering (R3)') > it('should apply both filters')`

---

### Feature: Package-Aware Distinction (R4)

**File**: `tests/unit/core/query-engine.test.ts`
**Covers**: R4

#### Scenario: package_aware_different_packages (R4)

```gherkin
Given same-named "Ticket" symbols in @mdt/shared and markdown-ticket packages
When searching for "Ticket" without filter
Then distinguishes symbols by package name
And returns separate results for each package
```

**Test**: `describe('Package-Aware Distinction (R4)') > it('should distinguish symbols by package name')`

---

#### Scenario: package_aware_scoped_packages (R4)

```gherkin
Given symbols from scoped packages like @mdt/shared
When extracting package from SCIP symbol
Then correctly parses scoped package name format
```

**Test**: `describe('Package-Aware Distinction (R4)') > it('should handle scoped package names (@scope/package)')`

---

#### Scenario: package_aware_non_scoped (R4)

```gherkin
Given symbols from non-scoped packages like markdown-ticket
When extracting package from SCIP symbol
Then correctly parses non-scoped package name
```

**Test**: `describe('Package-Aware Distinction (R4)') > it('should handle non-scoped package names')`

---

## Edge Cases

| Scenario | Expected Behavior | Test | Req |
|----------|-------------------|------|-----|
| Empty symbol name | Empty results | `query-engine.test.ts` | R1 |
| Special characters in name | Handle gracefully | `query-engine.test.ts` | R1 |
| Empty index | Empty results | `query-engine.test.ts` | R1 |
| --from file not found | Empty results | `query-engine.test.ts` | R2 |
| --folder no matches | Empty results | `query-engine.test.ts` | R3 |
| Large index query | < 1 second response | `query-engine.test.ts` | Performance |

## Generated Test Files

| File | Scenarios | Lines | Status |
|------|-----------|-------|--------|
| `tests/unit/core/query-engine.test.ts` | 24 | ~450 | 🔴 RED |

## Verification

Run Phase 2 tests (should all fail):
```bash
npm test -- tests/unit/core/query-engine.test.ts
# Or using pattern:
npm test -- --testPathPattern=query-engine
```

Expected: **24 failed, 0 passed** (🔴 RED)

## Coverage Checklist

- [x] All Phase 2 requirements have at least one test
- [x] Error scenarios covered
- [x] Edge cases documented
- [x] Performance validation included
- [ ] Tests are RED (verified manually)

## BDD Scenarios Summary

### Happy Path Scenarios
1. Search for symbol by name → returns all occurrences
2. Filter by definition file → returns only matching symbols
3. Filter by folder scope → returns only occurrences in folder
4. Distinguish same-named symbols by package → separate results

### Edge Case Scenarios
1. Unknown symbol name → empty results
2. Case-sensitive matching → no match for different case
3. Non-existent --from file → empty results
4. Non-existent --folder → empty results
5. Empty symbol name → empty results
6. Empty index → empty results
7. Special characters → handle gracefully

### Performance Scenarios
1. Large index query (1000+ symbols) → < 1 second

---

## For Implementation

Each task in `/mdt:tasks` Phase 2 should reference which tests it will make GREEN:

| Task | Makes GREEN |
|------|-------------|
| Task 2.1 | Symbol search by name (R1 tests) |
| Task 2.2 | Definition file filtering (R2 tests) |
| Task 2.3 | Folder scope filtering (R3 tests) |
| Task 2.4 | Package-aware distinction (R4 tests) |

After each task: `npm test -- --testPathPattern=query-engine` should show fewer failures.

---

## Mock Data Structure

Tests use mock symbol index following this structure:

```typescript
Map<string, Occurrence[]>
// Key format: "{package}:{filePath}:{symbolName}"
// Example: "@mdt/shared:models/Ticket.ts:Ticket"

interface Occurrence {
  symbol: string;        // Full SCIP symbol
  filePath: string;      // Relative file path
  line: number;          // Line number (0-indexed)
  column: number;        // Column number (0-indexed)
  roles: number;         // SCIP role bitmask
  isDefinition: boolean; // True if this is a definition occurrence
}
```

---

*Generated by /mdt:tests (v2)*
