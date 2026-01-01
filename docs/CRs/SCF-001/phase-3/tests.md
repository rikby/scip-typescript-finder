# Tests: SCF-001 Phase 3

**Mode**: Feature
**Phase**: 3 - CLI + Output + Integration Tests
**Source**: architecture.md → Phase 3
**Generated**: 2025-12-31
**Scope**: Phase 3 only

## Test Configuration

| Setting | Value |
|---------|-------|
| Framework | Jest with ts-jest |
| Test Directory | `tests/` |
| Test Command | `npm test tests/integration/` |
| Status | 🔴 RED (implementation pending) |

## Requirement → Test Mapping

| Req ID | Description | Test File | Scenarios | Status |
|--------|-------------|-----------|-----------|--------|
| R1 | Symbol search by name | `cli.test.ts` | 3 | 🔴 RED |
| R2 | Definition file filtering | `cli.test.ts`, `real-scip.test.ts` | 4 | 🔴 RED |
| R3 | Folder scope filtering | `cli.test.ts`, `real-scip.test.ts` | 3 | 🔴 RED |
| R4 | Package-aware distinction | `real-scip.test.ts` | 2 | 🔴 RED |
| R5 | Declaration file handling | `real-scip.test.ts` | 1 | 🔴 RED |
| R6 | Text output format | `cli.test.ts`, `real-scip.test.ts` | 4 | 🔴 RED |
| R7 | JSON output format | `cli.test.ts`, `real-scip.test.ts` | 5 | 🔴 RED |
| R8 | SCIP file discovery | `cli.test.ts` | 3 | 🔴 RED |
| R9 | Error handling | `cli.test.ts` | 2 | 🔴 RED |
| R10 | Symbol role identification | `cli.test.ts`, `real-scip.test.ts` | 3 | 🔴 RED |
| R11 | CLI help and usage | `cli.test.ts` | 4 | 🔴 RED |

## Test Specifications

### Feature: CLI Help and Usage (R11)

**File**: `tests/integration/cli.test.ts`
**Covers**: R11

#### Scenario: display_help_with_flag (R11.1)

```gherkin
Given the scip-find CLI is installed
When the user runs scip-find --help
Then the system shall display usage information including command syntax, arguments, options, and examples
```

**Test**: `describe('CLI Help and Usage (R11)') > it('should display usage information')`

#### Scenario: show_all_available_options (R11.2)

```gherkin
Given the scip-find CLI is installed
When the user runs scip-find --help
Then the system shall show all available options: --from, --folder, --format, --scip, --help
```

**Test**: `describe('CLI Help and Usage (R11)') > it('should show all available options')`

#### Scenario: help_shows_examples (R11.3)

```gherkin
Given the scip-find CLI is installed
When the user runs scip-find --help
Then the system shall show examples covering common use cases
```

**Test**: `describe('CLI Help and Usage (R11)') > it('should show examples in help text')`

#### Scenario: invalid_argument_shows_error (R11.3)

```gherkin
Given the scip-find CLI is installed
When the user provides invalid arguments
Then the system shall display an error message with the invalid argument and suggest using --help
```

**Test**: `describe('Invalid Arguments (R11)') > it('should display error message and suggest using --help')`

---

### Feature: SCIP File Discovery (R8)

**File**: `tests/integration/cli.test.ts`
**Covers**: R8

#### Scenario: load_from_specified_path (R8.1)

```gherkin
Given the scip-find CLI is installed
When the user provides --scip <path> argument
Then the system shall load the SCIP file from the specified path
```

**Test**: `describe('SCIP File Discovery (R8)') > it('should load the SCIP file from the specified path')`

#### Scenario: scip_file_not_found (R9.1)

```gherkin
Given the scip-find CLI is installed
When the specified SCIP file does not exist
Then the system shall display "SCIP file not found: <path>" and exit with code 1
```

**Test**: `describe('SCIP File Discovery (R8)') > it('should display error message and exit with code 1')`

#### Scenario: no_scip_file_provided (R8.3)

```gherkin
Given the scip-find CLI is installed
When no SCIP file is found and --scip is not specified
Then the system shall display an error message indicating how to specify the SCIP file path and exit with code 1
```

**Test**: `describe('SCIP File Discovery (R8)') > it('should display error message indicating how to specify SCIP file')`

#### Scenario: corrupted_scip_file (R9.2)

```gherkin
Given the scip-find CLI is installed
When the SCIP file cannot be parsed (corrupted or invalid format)
Then the system shall display "Failed to parse SCIP file: <reason>" and exit with code 1
```

**Test**: `describe('Error Handling - Invalid SCIP File (R9)') > it('should display parse error and exit with code 1')`

---

### Feature: Symbol Search by Name (R1)

**File**: `tests/integration/cli.test.ts`, `tests/integration/real-scip.test.ts`
**Covers**: R1

#### Scenario: search_by_symbol_name (R1.1)

```gherkin
Given a SCIP index is loaded
When the user provides a symbol name via CLI argument
Then the system shall search the SCIP index for all matching symbols
```

**Test**: `describe('Symbol Search by Name (R1)') > it('should search the SCIP index for matching symbols')`

#### Scenario: symbol_not_found (R1.3)

```gherkin
Given a SCIP index is loaded
When no symbols match the provided name
Then the system shall display "symbol not found" message and exit with code 0
```

**Test**: `describe('Symbol Search by Name (R1)') > it('should display symbol not found message and exit with code 0')`

#### Scenario: find_ticket_usages (R1.1)

```gherkin
Given the markdown-ticket SCIP index is loaded
When the user searches for "Ticket"
Then the system shall find all usages of the Ticket interface across the project
```

**Test**: `describe('Real SCIP - Symbol Search (R1)') > it('should find all usages across the project')`

---

### Feature: Definition File Filtering (R2)

**File**: `tests/integration/cli.test.ts`, `tests/integration/real-scip.test.ts`
**Covers**: R2

#### Scenario: filter_by_from_file (R2.1)

```gherkin
Given a SCIP index is loaded
When the user provides --from <file> argument
Then the system shall filter symbol results to only those defined in the specified file
```

**Test**: `describe('Filtering Options (R2, R3)') > it('should filter results to symbols from the specified file')`

#### Scenario: from_file_not_found (R2.3)

```gherkin
Given a SCIP index is loaded
When the specified --from file does not contain any matching symbol
Then the system shall display a warning and return results for all symbols with the matching name from other files
```

**Test**: `describe('Real SCIP - Definition File Filtering (R2)') > it('should show warning and return results from other files')`

#### Scenario: filter_ticket_from_shared (R2.1)

```gherkin
Given the markdown-ticket SCIP index is loaded
When the user searches for "Ticket --from shared/models/Ticket.ts"
Then the system shall return only usages of the Ticket interface from shared/models/Ticket.ts
```

**Test**: `describe('Real SCIP - Definition File Filtering (R2)') > it('should return only usages of Ticket from that specific file')`

#### Scenario: overloaded_symbols (R2.2)

```gherkin
Given a SCIP index is loaded with overloaded functions in the same file
When the user provides --from <file> argument
Then the system shall return all overloaded variants
```

**Test**: `describe('Real SCIP - Edge Cases') > it('should return all overloaded variants')`

---

### Feature: Folder Scope Filtering (R3)

**File**: `tests/integration/cli.test.ts`, `tests/integration/real-scip.test.ts`
**Covers**: R3

#### Scenario: filter_by_folder (R3.1)

```gherkin
Given a SCIP index is loaded
When the user provides --folder <path> argument
Then the system shall filter occurrences to only those in files within the specified folder path
```

**Test**: `describe('Filtering Options (R2, R3)') > it('should filter occurrences to files within the specified folder')`

#### Scenario: folder_prefix_match (R3.2)

```gherkin
Given a SCIP index is loaded
When filtering by folder
Then the system shall match files whose path starts with the folder path
```

**Test**: `describe('Real SCIP - Folder Scope Filtering (R3)') > it('should return only occurrences in shared folder')`

#### Scenario: folder_empty_results (R3.3)

```gherkin
Given a SCIP index is loaded
When no occurrences exist within the specified folder
Then the system shall return empty results with a message indicating no matches found in that folder
```

---

### Feature: Package-Aware Symbol Distinction (R4)

**File**: `tests/integration/real-scip.test.ts`
**Covers**: R4

#### Scenario: distinguish_same_name_different_package (R4.3)

```gherkin
Given same-named symbols exist in different packages
When searching for a symbol with --from specified
Then the system shall extract the package name from the SCIP symbol encoding
And the system shall treat symbols with different package names as distinct symbols
```

**Test**: `describe('Real SCIP - Package-Aware Distinction (R4)') > it('should distinguish between them based on package')`

#### Scenario: same_package_filtering (R4.2)

```gherkin
Given same-named symbols exist in different packages
When returning results
Then the system shall only include symbols from the same package as the --from definition
```

---

### Feature: Declaration File Handling (R5)

**File**: `tests/integration/real-scip.test.ts`
**Covers**: R5

#### Scenario: merge_ts_and_dts (R5.1)

```gherkin
Given a SCIP index is loaded
When a symbol has both .ts and .d.ts variants in the same package
Then the system shall merge occurrences from both variants
And the system shall deduplicate occurrences by file path and line/column position
```

**Test**: `describe('Real SCIP - Declaration File Handling (R5)') > it('should merge occurrences from both variants')`

---

### Feature: Output Format - Text (R6)

**File**: `tests/integration/cli.test.ts`, `tests/integration/real-scip.test.ts`
**Covers**: R6

#### Scenario: text_format_grep_like (R6.1)

```gherkin
Given symbol search results are available
When --format text is specified (or by default)
Then the system shall output results in grep-like format: file_path:line:column: role
```

**Test**: `describe('Output Formats (R6, R7)') > it('should output results in grep-like format')`

#### Scenario: text_format_includes_details (R6.2)

```gherkin
Given symbol search results are available
When displaying results in text format
Then the system shall include the file path, line number, column range, and symbol role
```

**Test**: `describe('Output Formats (R6, R7)') > it('should include file path, line number, and column')`

#### Scenario: text_format_multiple_lines (R6.3)

```gherkin
Given symbol search results are available
When multiple occurrences exist
Then the system shall display each occurrence on a separate line
```

**Test**: `describe('Output Formats (R6, R7)') > it('should include file path, line number, and column')`

#### Scenario: text_format_default (R6.1)

```gherkin
Given symbol search results are available
When format is not specified
Then the system shall use text format by default
```

**Test**: `describe('Output Formats (R6, R7)') > it('should use text format by default')`

---

### Feature: Output Format - JSON (R7)

**File**: `tests/integration/cli.test.ts`, `tests/integration/real-scip.test.ts`
**Covers**: R7

#### Scenario: json_format_valid (R7.1)

```gherkin
Given symbol search results are available
When --format json is specified
Then the system shall output results as valid JSON
```

**Test**: `describe('Output Formats (R6, R7)') > it('should output valid JSON')`

#### Scenario: json_format_structure (R7.2)

```gherkin
Given symbol search results are available
When outputting JSON
Then the system shall include: symbol name, occurrence count, and array of occurrences with file, line, column, and role fields
```

**Test**: `describe('Output Formats (R6, R7)') > it('should include symbol name and occurrences array')`

#### Scenario: json_format_boolean_flags (R7.3)

```gherkin
Given symbol search results are available
When outputting JSON
Then the system shall ensure all boolean flags (isDefinition, isReference, isImport, isExport) are present for each occurrence
```

**Test**: `describe('Output Formats (R6, R7)') > it('should include boolean flags for each occurrence')`

#### Scenario: json_format_all_fields (R7.2)

```gherkin
Given the markdown-ticket SCIP index is loaded
When outputting JSON format
Then the system should produce valid JSON with all required fields (symbol, occurrences with file/line/column/role/booleans)
```

**Test**: `describe('Real SCIP - Output Format Validation (R6, R7)') > it('should produce valid JSON with all required fields')`

#### Scenario: invalid_format_error (R7.1)

```gherkin
Given symbol search results are available
When invalid format value is provided
Then the system shall display error with valid options and exit with code 1
```

**Test**: `describe('Output Formats (R6, R7)') > it('should display error with valid options and exit with code 1')`

---

### Feature: Symbol Role Identification (R10)

**File**: `tests/integration/cli.test.ts`, `tests/integration/real-scip.test.ts`
**Covers**: R10

#### Scenario: identify_role_from_bitmask (R10.1)

```gherkin
Given symbol search results are available
When displaying occurrence results
Then the system shall identify the symbol role based on the SCIP symbol role bitmask
```

**Test**: `describe('Symbol Role Identification (R10)') > it('should identify symbol role based on SCIP bitmask')`

#### Scenario: multiple_roles_displayed (R10.2)

```gherkin
Given symbol search results are available
When a symbol has multiple roles (bitmask)
Then the system shall display all applicable role names
```

**Test**: `describe('Real SCIP - Symbol Role Identification (R10)') > it('should display all applicable role names')`

#### Scenario: unknown_role_handling (R10.3)

```gherkin
Given symbol search results are available
When role cannot be determined (unknown bitmask)
Then the system shall display "Unknown" role
```

**Test**: `describe('Real SCIP - Symbol Role Identification (R10)') > it('should display Unknown role')`

---

## Edge Cases

| Scenario | Expected Behavior | Test | Req |
|----------|-------------------|------|-----|
| Missing SCIP file | Display error, exit code 1 | `cli.test.ts` | R8, R9 |
| Corrupted SCIP file | Display parse error, exit code 1 | `cli.test.ts` | R9 |
| Unknown symbol | Display "not found", exit code 0 | `cli.test.ts` | R1 |
| Invalid `--from` file | Show warning, search all symbols | `real-scip.test.ts` | R2 |
| Invalid `--format` value | Display error with valid options | `cli.test.ts` | R7 |
| Invalid arguments | Display error, suggest --help | `cli.test.ts` | R11 |
| Overloaded functions | Return all variants | `real-scip.test.ts` | R2 |
| Same-named symbols | Distinguish by package | `real-scip.test.ts` | R4 |
| `.d.ts` and `.ts` variants | Merge and deduplicate | `real-scip.test.ts` | R5 |

## Generated Test Files

| File | Scenarios | Lines | Status |
|------|-----------|-------|--------|
| `tests/integration/cli.test.ts` | 34 | ~380 | 🔴 RED |
| `tests/integration/real-scip.test.ts` | 27 | ~320 | 🔴 RED |

## Verification

Run Phase 3 tests (should all fail):
```bash
npm test tests/integration/
```

Expected: **61 failed, 0 passed** (or similar - all tests should fail before implementation)

## Coverage Checklist

- [x] All Phase 3 requirements (R6, R7, R8, R9, R10, R11) have test coverage
- [x] R1-R5 requirements validated through integration tests
- [x] Error scenarios covered
- [x] Edge cases documented
- [ ] Tests are RED (requires CLI implementation)

---

## For Implementation

Each task in `/mdt:tasks SCF-001 --phase 3` should reference which tests it will make GREEN:

| Task | Makes GREEN |
|------|-------------|
| Task 3.1 - CLI entry point | `cli.test.ts` (R11) |
| Task 3.2 - Text formatter | `cli.test.ts` (R6) |
| Task 3.3 - JSON formatter | `cli.test.ts` (R7) |
| Task 3.4 - SCIP file loading in CLI | `cli.test.ts` (R8, R9) |
| Task 3.5 - Integration tests with real SCIP | `real-scip.test.ts` (R1-R10) |

After each task: `npm test tests/integration/` should show fewer failures.

---

## Test Execution Notes

### Before Running Tests

1. **Build the project**: The tests expect the CLI to be built at `dist/cli.js`
   ```bash
   npm run build
   ```

2. **Generate SCIP file for real tests**: To run `real-scip.test.ts` with real SCIP data:
   ```bash
   cd markdown-ticket
   npx scip-typescript index --projectName markdown-ticket
   cd ..
   ```

### Running Tests

```bash
# Run all integration tests
npm test tests/integration/

# Run only CLI tests (no real SCIP required)
npm test tests/integration/cli.test.ts

# Run only real SCIP tests (requires SCIP file)
npm test tests/integration/real-scip.test.ts

# Run tests in watch mode
npm test -- --watch tests/integration/
```

### Test Status Indicators

- 🔴 **RED**: Tests fail because implementation doesn't exist (expected before Phase 3 implementation)
- 🟢 **GREEN**: Tests pass after implementation is complete
- 🟡 **YELLOW**: Tests skipped due to missing fixtures (e.g., SCIP file not generated)

---

*Generated by /mdt:tests (v2) - Phase 3*
