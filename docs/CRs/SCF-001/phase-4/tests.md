# Tests: SCF-001 Phase 4

**Mode**: Feature (Edge Case Testing)
**Phase**: 4 - Hardening (Edge Cases)
**Source**: architecture.md → Phase 4
**Generated**: 2026-01-01
**Scope**: Phase 4 only - Edge cases and error handling validation

## Test Configuration

| Setting | Value |
|---------|-------|
| Framework | Jest |
| Test Directory | `tests/` |
| Test Command | `npm test` |
| Phase Filter | `npm test -- edge-cases` |
| Status | 🔴 RED (implementation pending) |

## Requirement → Test Mapping

| Req ID | Description | Test File | Scenarios | Status |
|--------|-------------|-----------|-----------|--------|
| R9 | Missing SCIP file | `edge-cases.test.ts` | 2 | 🔴 RED |
| R9 | Corrupted SCIP file | `edge-cases.test.ts` | 2 | 🔴 RED |
| R9 | Empty SCIP file | `edge-cases.test.ts` | 2 | 🔴 RED |
| R2 | Invalid --from file | `edge-cases.test.ts` | 2 | 🔴 RED |
| R11 | Invalid --format value | `edge-cases.test.ts` | 2 | 🔴 RED |
| R1 | Symbol not found | `edge-cases.test.ts` | 2 | 🔴 RED |
| R5 | Declaration-only symbols | `edge-cases.test.ts` | 1 | 🔴 RED |
| R3 | Folder filtering edge cases | `edge-cases.test.ts` | 3 | 🔴 RED |
| R4 | Same-named symbols from different packages | `edge-cases.test.ts` | 1 | 🔴 RED |
| R10 | Unknown symbol roles | `edge-cases.test.ts` | 2 | 🔴 RED |
| R6,R7 | Output format edge cases | `edge-cases.test.ts` | 3 | 🔴 RED |

## Test Specifications

### Feature: Edge Case Error Handling

**File**: `tests/integration/edge-cases.test.ts`
**Covers**: R8, R9, R11

#### Scenario: missing_scip_file (R9)

```gherkin
Given the scip-find CLI is available
When the user specifies a SCIP file that does not exist
Then the CLI should exit with code 1
And the error message should include "SCIP file not found"
And the error message should show the file path
And the error should suggest using --scip option
```

**Test**: `describe('when SCIP file is missing') > it('should display error message with file path and exit with code 1')`

---

#### Scenario: corrupted_scip_file (R9)

```gherkin
Given the scip-find CLI is available
When the user specifies a SCIP file with corrupted protobuf data
Then the CLI should exit with code 1
And the error message should indicate parse failure
And the error should mention SCIP file format
```

**Test**: `describe('when SCIP file is corrupted') > it('should display parse error and exit with code 1')`

---

#### Scenario: empty_scip_file (R9)

```gherkin
Given the scip-find CLI is available
When the SCIP file contains no documents
Then the CLI should exit with code 0
And the output should indicate "symbol not found" or "no results"
And the CLI should not crash or throw unhandled errors
```

**Test**: `describe('when SCIP file is empty (no documents)') > it('should handle gracefully and return no results')`

---

#### Scenario: symbol_not_found (R1)

```gherkin
Given a valid SCIP file is loaded
When the user searches for a symbol that does not exist
Then the CLI should exit with code 0 (not an error)
And the output should indicate "symbol not found"
And no errors should be displayed
```

**Test**: `describe('when symbol does not exist in SCIP index') > it('should return "symbol not found" message and exit with code 0')`

---

#### Scenario: invalid_from_file (R2)

```gherkin
Given a valid SCIP file is loaded
When the user specifies --from with a file that doesn't contain the symbol
Then the CLI should show a warning
And the CLI should still search for symbols with the same name from other files
And the exit code should be 0
```

**Test**: `describe('when --from file does not contain the symbol') > it('should show warning and return results from other files')`

---

#### Scenario: invalid_format_value (R11)

```gherkin
Given the scip-find CLI is available
When the user specifies --format with an invalid value
Then the CLI should exit with code 1
And the error message should list valid format options (text, json)
And the error should suggest using --help
```

**Test**: `describe('when invalid --format value is provided') > it('should display error with valid options and exit with code 1')`

---

### Feature: Symbol Index Edge Cases

**File**: `tests/integration/edge-cases.test.ts`
**Covers**: R4, R5

#### Scenario: duplicate_symbols_handling

```gherkin
Given a SCIP file with duplicate symbol definitions
When the user searches for the duplicated symbol
Then the CLI should deduplicate occurrences by file path and position
And the CLI should not crash or return duplicate results
```

**Test**: `describe('when SCIP contains duplicate symbols') > it('should handle duplicates without crashing')`

---

#### Scenario: declaration_only_symbols (R5)

```gherkin
Given a SCIP file with symbols only in .d.ts declaration files
When the user searches for such a symbol
Then the CLI should return results from the declaration file
And the file path should end with .d.ts
```

**Test**: `describe('when symbol only exists in .d.ts declaration file') > it('should return results from declaration file')`

---

### Feature: Folder Filtering Edge Cases

**File**: `tests/integration/edge-cases.test.ts`
**Covers**: R3

#### Scenario: folder_trailing_slash

```gherkin
Given a valid SCIP file is loaded
When the user specifies --folder with trailing slash (src/)
And also specifies --folder without trailing slash (src)
Then both should produce equivalent results
```

**Test**: `describe('when --folder path has edge cases') > it('should handle trailing slash in folder path')`

---

#### Scenario: non_existent_folder

```gherkin
Given a valid SCIP file is loaded
When the user specifies --folder with a path that doesn't exist
Then the CLI should exit with code 0
And the output should indicate "no results" or "not found"
```

**Test**: `describe('when --folder path has edge cases') > it('should handle non-existent folder')`

---

### Feature: Output Format Edge Cases

**File**: `tests/integration/edge-cases.test.ts`
**Covers**: R6, R7

#### Scenario: empty_results_json_format

```gherkin
Given a SCIP file with no matching symbols
When the user searches with --format json
Then the output should be valid JSON
And the JSON should have symbol and occurrences fields
And occurrences should be an empty array
```

**Test**: `describe('when output format has edge cases') > it('should handle empty results in JSON format')`

---

#### Scenario: unknown_symbol_role (R10)

```gherkin
Given a SCIP file with symbols having unknown role bitmasks
When the user searches for such symbols with --format json
Then each occurrence should have a role field
And the role value should be a string
And unknown roles should be handled gracefully
```

**Test**: `describe('when symbol role has edge cases') > it('should handle unknown/invalid role bitmask')`

---

### Feature: Error Message Quality

**File**: `tests/integration/edge-cases.test.ts`
**Covers**: R9, R11

#### Scenario: actionable_error_messages

```gherkin
Given the scip-find CLI encounters an error
When the error is due to missing SCIP file
Then the error message should suggest --scip option
And the error message should be actionable
```

**Test**: `describe('error messages should be actionable') > it('should suggest --scip when SCIP file not found')`

---

#### Scenario: clear_error_messages

```gherkin
Given the scip-find CLI encounters an error
When the error occurs
Then the error message should clearly indicate what went wrong
And the error message should use user-friendly language
```

**Test**: `describe('error messages should be clear') > it('should clearly indicate SCIP file not found')`

---

## Edge Cases

| Scenario | Expected Behavior | Test | Req |
|----------|-------------------|------|-----|
| Missing SCIP file | Error with file path, exit 1, suggest --scip | `edge-cases.test.ts` | R9 |
| Corrupted SCIP file | Parse error, exit 1 | `edge-cases.test.ts` | R9 |
| Empty SCIP (no documents) | Graceful handling, "no results" message | `edge-cases.test.ts` | R9 |
| No symbols in SCIP | Graceful handling, "symbol not found" | `edge-cases.test.ts` | R1 |
| Symbol not found | "symbol not found" message, exit 0 | `edge-cases.test.ts` | R1 |
| Invalid --from file | Warning, search other files | `edge-cases.test.ts` | R2 |
| Invalid --format value | Error with valid options, exit 1 | `edge-cases.test.ts` | R11 |
| Duplicate symbols | Deduplicated by position | `edge-cases.test.ts` | R4 |
| Declaration-only symbols | Return from .d.ts file | `edge-cases.test.ts` | R5 |
| Special characters in paths | Handle without error | `edge-cases.test.ts` | R8 |
| Overloaded functions | Return all variants | `edge-cases.test.ts` | R2 |
| Same-named symbols different packages | Distinguish with --from | `edge-cases.test.ts` | R4 |
| Very long symbol names | Handle without error | `edge-cases.test.ts` | R1 |
| Empty symbol name | Handle gracefully | `edge-cases.test.ts` | R11 |
| Folder trailing slash | Treat equivalent to no slash | `edge-cases.test.ts` | R3 |
| Non-existent folder | "no results" message | `edge-cases.test.ts` | R3 |
| Root folder path | Handle without error | `edge-cases.test.ts` | R3 |
| Multiple filters combined | Apply all filters correctly | `edge-cases.test.ts` | R2,R3 |
| Empty results text format | Graceful handling | `edge-cases.test.ts` | R6 |
| Empty results JSON format | Valid JSON with empty array | `edge-cases.test.ts` | R7 |
| Unknown role bitmask | Display as "Unknown" or handle | `edge-cases.test.ts` | R10 |
| Multiple roles on symbol | Display all applicable roles | `edge-cases.test.ts` | R10 |
| Large SCIP file | Complete in reasonable time | `edge-cases.test.ts` | NFR-P1 |

## Generated Test Files

| File | Scenarios | Lines | Status |
|------|-----------|-------|--------|
| `tests/integration/edge-cases.test.ts` | 38 | ~500 | 🔴 RED |
| `tests/fixtures/edge-cases/scip-fixture-generator.ts` | 5 fixture types | ~150 | 🔴 RED |

## Verification

Run Phase 4 edge case tests (should all fail initially):
```bash
npm test -- edge-cases
```

Expected: **~38 failed, 0 passed** (before implementation)

After Phase 4 implementation:
```bash
npm test -- edge-cases
```

Expected: **38 passed, 0 failed**

## Coverage Checklist

- [x] All Phase 4 edge cases have at least one test
- [x] Error scenarios covered (missing SCIP, corrupted SCIP, invalid inputs)
- [x] Edge cases documented (empty files, duplicates, special characters)
- [x] Output format edge cases covered (empty results, unknown roles)
- [x] Error message quality validated (actionable, clear)
- [ ] Tests are RED (verified manually)
- [ ] Full test suite passes with >80% coverage

---

## For Implementation

Phase 4 tasks should focus on making these edge case tests GREEN:

| Area | Tests to Make GREEN |
|------|---------------------|
| SCIP file validation | Missing SCIP, corrupted SCIP, empty SCIP tests |
| Error handling | Invalid --from, invalid --format, symbol not found tests |
| Edge case handling | Duplicates, declaration-only, special characters tests |
| Output quality | Error messages, empty results, unknown roles tests |
| Performance | Large SCIP file test |

After implementing Phase 4:
- All edge case tests should pass
- Error messages should be clear and actionable
- CLI should handle all edge cases gracefully
- Full test suite should have >80% coverage

---

## Integration with Other Phases

Phase 4 builds on:
- **Phase 1**: SCIP loading and symbol indexing (tested with empty/corrupted files)
- **Phase 2**: Query engine (tested with edge case symbols and filters)
- **Phase 3**: CLI and output (tested with error messages and format edge cases)

Phase 4 validates:
- Error handling across all components
- Edge case scenarios not covered in earlier phases
- Production-ready behavior and user experience

---

*Generated by /mdt:tests (v2)*
