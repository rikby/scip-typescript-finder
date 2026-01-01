# Tasks: SCF-001 Phase 3

**Source**: [SCF-001](../SCF-001.md) -> Phase 3
**Phase**: 3 - CLI + Output + Integration Tests
**Tests**: `phase-3/tests.md`
**Generated**: 2025-12-31

## Project Context

| Setting | Value |
|---------|-------|
| Source directory | `src/` |
| Test command | `npm test tests/integration/` |
| Build command | `npm run build` |
| File extension | `.ts` |
| Phase test filter | `npm test tests/integration/` |

## Size Thresholds (Phase 3)

| Module | Default | Hard Max | Action |
|--------|---------|----------|--------|
| `cli/index.ts` | 50 | 75 | Flag at 50+, STOP at 75+ |
| `output/text-formatter.ts` | 100 | 150 | Flag at 100+, STOP at 150+ |
| `output/json-formatter.ts` | 100 | 150 | Flag at 100+, STOP at 150+ |

*(From Architecture Design -> Phase 3)*

## Shared Patterns (Phase 3)

| Pattern | Extract To | Used By |
|---------|------------|---------|
| Symbol role bitmask parsing | `utils/symbol-roles.ts` (Phase 1) | Formatters, CLI |
| SCIP symbol name extraction | `utils/symbol-parser.ts` (Phase 1) | Query engine |

> Phase 3 imports from Phase 1 & 2 shared utilities — do NOT duplicate logic.

## Architecture Structure (Phase 3)

```
src/
  ├── cli/
  │   └── index.ts              → CLI entry point with commander.js (limit 50 lines)
  ├── output/
  │   ├── text-formatter.ts     → Grep-like output (limit 100 lines)
  │   └── json-formatter.ts     → JSON structured output (limit 100 lines)
  └── ... (Phase 1 & 2 modules)

tests/
  ├── integration/
  │   ├── cli.test.ts           → CLI integration tests
  │   └── real-scip.test.ts     → Real SCIP file tests
```

## STOP Conditions

- File exceeds Hard Max -> STOP, subdivide
- Duplicating logic that exists in shared module -> STOP, import instead
- Structure path doesn't match Architecture Design -> STOP, clarify

## Test Coverage (from phase-3/tests.md)

| Test | Requirement | Task | Status |
|------|-------------|------|--------|
| `cli.test > CLI Help and Usage (R11) > should display usage information` | R11.1 | Task 3.1 | 🔴 RED |
| `cli.test > CLI Help and Usage (R11) > should show all available options` | R11.2 | Task 3.1 | 🔴 RED |
| `cli.test > CLI Help and Usage (R11) > should show examples in help text` | R11.3 | Task 3.1 | 🔴 RED |
| `cli.test > Invalid Arguments (R11) > should display error message and suggest --help` | R11.3 | Task 3.1 | 🔴 RED |
| `cli.test > SCIP File Discovery (R8) > should load SCIP file from specified path` | R8.1 | Task 3.1 | 🔴 RED |
| `cli.test > SCIP File Discovery (R8) > should display error message and exit with code 1` | R9.1 | Task 3.1 | 🔴 RED |
| `cli.test > SCIP File Discovery (R8) > should display error message indicating how to specify SCIP file` | R8.3 | Task 3.1 | 🔴 RED |
| `cli.test > Error Handling - Invalid SCIP File (R9) > should display parse error and exit with code 1` | R9.2 | Task 3.1 | 🔴 RED |
| `cli.test > Symbol Search by Name (R1) > should search SCIP index for matching symbols` | R1.1 | Task 3.1 | 🔴 RED |
| `cli.test > Symbol Search by Name (R1) > should display symbol not found message and exit with code 0` | R1.3 | Task 3.1 | 🔴 RED |
| `cli.test > Filtering Options (R2, R3) > should filter results to symbols from specified file` | R2.1 | Task 3.1 | 🔴 RED |
| `cli.test > Filtering Options (R2, R3) > should filter occurrences to files within specified folder` | R3.1 | Task 3.1 | 🔴 RED |
| `cli.test > Output Formats (R6, R7) > should output results in grep-like format` | R6.1 | Task 3.2 | 🔴 RED |
| `cli.test > Output Formats (R6, R7) > should include file path, line number, and column` | R6.2 | Task 3.2 | 🔴 RED |
| `cli.test > Output Formats (R6, R7) > should use text format by default` | R6.1 | Task 3.2 | 🔴 RED |
| `cli.test > Output Formats (R6, R7) > should output valid JSON` | R7.1 | Task 3.3 | 🔴 RED |
| `cli.test > Output Formats (R6, R7) > should include symbol name and occurrences array` | R7.2 | Task 3.3 | 🔴 RED |
| `cli.test > Output Formats (R6, R7) > should include boolean flags for each occurrence` | R7.3 | Task 3.3 | 🔴 RED |
| `cli.test > Output Formats (R6, R7) > should display error with valid options and exit with code 1` | R7.1 | Task 3.3 | 🔴 RED |
| `cli.test > Symbol Role Identification (R10) > should identify symbol role based on SCIP bitmask` | R10.1 | Task 3.2 | 🔴 RED |
| `cli.test > Symbol Role Identification (R10) > should display all applicable role names` | R10.2 | Task 3.2 | 🔴 RED |
| `cli.test > Symbol Role Identification (R10) > should display Unknown role` | R10.3 | Task 3.2 | 🔴 RED |
| `real-scip.test > Real SCIP - Symbol Search (R1) > should find all usages across project` | R1.1 | Task 3.4 | 🔴 RED |
| `real-scip.test > Real SCIP - Definition File Filtering (R2) > should show warning and return results from other files` | R2.3 | Task 3.4 | 🔴 RED |
| `real-scip.test > Real SCIP - Definition File Filtering (R2) > should return only usages of Ticket from that specific file` | R2.1 | Task 3.4 | 🔴 RED |
| `real-scip.test > Real SCIP - Edge Cases > should return all overloaded variants` | R2.2 | Task 3.4 | 🔴 RED |
| `real-scip.test > Real SCIP - Folder Scope Filtering (R3) > should return only occurrences in shared folder` | R3.2 | Task 3.4 | 🔴 RED |
| `real-scip.test > Real SCIP - Package-Aware Distinction (R4) > should distinguish between them based on package` | R4.3 | Task 3.4 | 🔴 RED |
| `real-scip.test > Real SCIP - Declaration File Handling (R5) > should merge occurrences from both variants` | R5.1 | Task 3.4 | 🔴 RED |
| `real-scip.test > Real SCIP - Output Format Validation (R6, R7) > should produce valid JSON with all required fields` | R6.1, R7.2 | Task 3.4 | 🔴 RED |
| `real-scip.test > Real SCIP - Symbol Role Identification (R10) > should display all applicable role names` | R10.2 | Task 3.4 | 🔴 RED |
| `real-scip.test > Real SCIP - Symbol Role Identification (R10) > should display Unknown role` | R10.3 | Task 3.4 | 🔴 RED |

**TDD Goal**: All tests RED before implementation, GREEN after respective task

---

## TDD Verification

Before starting each task:
```bash
npm test tests/integration/
```

After completing each task:
```bash
npm test tests/integration/  # Task tests should pass
npm test                      # Full suite - no regressions
```

---

## Phase 3 Tasks

### Task 3.1: Implement CLI entry point with commander.js

**Structure**: `src/cli/index.ts`

**Implements**: R1, R2, R3, R8, R9, R11

**Makes GREEN**:
- `cli.test.ts`: `should display usage information` (R11.1)
- `cli.test.ts`: `should show all available options` (R11.2)
- `cli.test.ts`: `should show examples in help text` (R11.3)
- `cli.test.ts`: `should display error message and suggest --help` (R11.3)
- `cli.test.ts`: `should load SCIP file from specified path` (R8.1)
- `cli.test.ts`: `should display error message and exit with code 1` (R9.1)
- `cli.test.ts`: `should display error message indicating how to specify SCIP file` (R8.3)
- `cli.test.ts`: `should display parse error and exit with code 1` (R9.2)
- `cli.test.ts`: `should search SCIP index for matching symbols` (R1.1)
- `cli.test.ts`: `should display symbol not found message and exit with code 0` (R1.3)
- `cli.test.ts`: `should filter results to symbols from specified file` (R2.1)
- `cli.test.ts`: `should filter occurrences to files within specified folder` (R3.1)

**Limits**:
- Default: 50 lines
- Hard Max: 75 lines
- If > 50: ⚠️ flag
- If > 75: ⛔ STOP

**Create**:
- `src/cli/index.ts` with commander.js configuration
- Arguments: `<symbol>` (required positional argument)
- Options: `--from <file>`, `--folder <path>`, `--format <type>`, `--scip <path>`
- Help text with examples covering common use cases
- Error handling for missing/invalid SCIP files
- Integration with `QueryEngine` from Phase 2

**Exclude**:
- Output formatting logic (Task 3.2, 3.3)
- Test implementations (tests already exist)

**Anti-duplication**:
- Import `QueryEngine` from `core/query-engine.ts` — do NOT re-implement query logic
- Import `loadScipIndex` from `core/scip-loader.ts` — do NOT re-implement SCIP loading
- Import `buildSymbolIndex` from `core/symbol-indexer.ts` — do NOT re-implement index building

**Verify**:
```bash
wc -l src/cli/index.ts              # <= 50
npm test tests/integration/cli.test.ts
npm run build
```

**Done when**:
- [ ] 23 CLI tests GREEN (were RED)
- [ ] File at `src/cli/index.ts`
- [ ] Size <= 50 lines
- [ ] `scip-find --help` displays usage
- [ ] `scip-find Symbol --from file.ts --folder src/ --format json --scip index.scip` works

---

### Task 3.2: Implement text formatter (grep-like output)

**Structure**: `src/output/text-formatter.ts`

**Implements**: R6, R10

**Makes GREEN**:
- `cli.test.ts`: `should output results in grep-like format` (R6.1)
- `cli.test.ts`: `should include file path, line number, and column` (R6.2)
- `cli.test.ts`: `should use text format by default` (R6.1)
- `cli.test.ts`: `should identify symbol role based on SCIP bitmask` (R10.1)
- `cli.test.ts`: `should display all applicable role names` (R10.2)
- `cli.test.ts`: `should display Unknown role` (R10.3)

**Limits**:
- Default: 100 lines
- Hard Max: 150 lines
- If > 100: ⚠️ flag
- If > 150: ⛔ STOP

**Create**:
- `src/output/text-formatter.ts` with `format(results: QueryResult[]): string` function
- Grep-like format: `file_path:line:column: symbol role`
- Integration with `symbol-roles.ts` from Phase 1 for role decoding
- Handle multiple roles (display all applicable role names)
- Handle unknown roles (display "Unknown")
- One occurrence per line

**Exclude**:
- JSON formatting (Task 3.3)
- Query logic (use `QueryEngine` from Phase 2)

**Anti-duplication**:
- Import `getRoleName` from `utils/symbol-roles.ts` — do NOT re-implement role parsing
- This is the source formatter — CLI will import from here

**Verify**:
```bash
wc -l src/output/text-formatter.ts  # <= 100
npm test tests/integration/cli.test.ts
npm run build
```

**Done when**:
- [ ] 6 text format tests GREEN (were RED)
- [ ] File at `src/output/text-formatter.ts`
- [ ] Size <= 100 lines
- [ ] Output format matches grep pattern
- [ ] Roles displayed correctly

---

### Task 3.3: Implement JSON formatter (structured output)

**Structure**: `src/output/json-formatter.ts`

**Implements**: R7

**Makes GREEN**:
- `cli.test.ts`: `should output valid JSON` (R7.1)
- `cli.test.ts`: `should include symbol name and occurrences array` (R7.2)
- `cli.test.ts`: `should include boolean flags for each occurrence` (R7.3)
- `cli.test.ts`: `should display error with valid options and exit with code 1` (R7.1)

**Limits**:
- Default: 100 lines
- Hard Max: 150 lines
- If > 100: ⚠️ flag
- If > 150: ⛔ STOP

**Create**:
- `src/output/json-formatter.ts` with `format(results: QueryResult[]): string` function
- JSON structure: `{ symbol, count, occurrences: [{ file, line, column, role, isDefinition, isReference, isImport, isExport }] }`
- Valid JSON output (parseable)
- All boolean flags present for each occurrence
- Integration with `symbol-roles.ts` from Phase 1 for role decoding

**Exclude**:
- Text formatting (Task 3.2)
- Query logic (use `QueryEngine` from Phase 2)

**Anti-duplication**:
- Import `getRoleName` from `utils/symbol-roles.ts` — do NOT re-implement role parsing
- This is the source formatter — CLI will import from here

**Verify**:
```bash
wc -l src/output/json-formatter.ts  # <= 100
npm test tests/integration/cli.test.ts
npm run build
```

**Done when**:
- [ ] 4 JSON format tests GREEN (were RED)
- [ ] File at `src/output/json-formatter.ts`
- [ ] Size <= 100 lines
- [ ] JSON is valid and parseable
- [ ] All required fields present

---

### Task 3.4: Integration tests with real SCIP file

**Structure**: `tests/integration/real-scip.test.ts`

**Implements**: R1-R5, R10 (validation with real SCIP data)

**Makes GREEN**:
- `real-scip.test.ts`: All 27 scenarios with real markdown-ticket SCIP file

**Limits**:
- Default: ~320 lines (test file, no strict limit)
- Hard Max: 400 lines

**Setup**:
- Generate SCIP file from markdown-ticket project:
  ```bash
  cd markdown-ticket
  npx scip-typescript index --projectName markdown-ticket
  cd ..
  ```
- Create tests that load the real SCIP file
- Validate Ticket interface searches across the project
- Test package-aware distinction, folder filtering, declaration file handling

**Create**:
- Test scenarios covering:
  - Symbol search across entire project (R1)
  - Definition file filtering with --from (R2)
  - Folder scope filtering with --folder (R3)
  - Package-aware distinction (R4)
  - Declaration file handling (R5)
  - Symbol role identification (R10)
  - Output format validation (R6, R7)

**Exclude**:
- CLI entry point tests (Task 3.1)
- Synthetic edge cases (Phase 4)

**Verify**:
```bash
# Generate SCIP file first
cd markdown-ticket && npx scip-typescript index --projectName markdown-ticket && cd ..

# Run tests
npm test tests/integration/real-scip.test.ts
```

**Done when**:
- [ ] 27 real SCIP tests GREEN (were RED)
- [ ] Tests validate against real markdown-ticket SCIP
- [ ] Coverage of R1-R5, R6, R7, R10 requirements
- [ ] No regressions in existing unit tests

---

## Post-Implementation (Phase 3)

### Task N.1: Verify no duplication

```bash
grep -r "function.*Role" src/ | grep -v "utils/symbol-roles.ts"
grep -r "function.*parseSymbol" src/ | grep -v "utils/symbol-parser.ts"
```
**Done when**: [ ] Each pattern exists in ONE location only (utils/)

### Task N.2: Verify size compliance

```bash
wc -l src/cli/index.ts src/output/text-formatter.ts src/output/json-formatter.ts
```
**Done when**:
- [ ] `cli/index.ts` <= 50 lines (flag if > 50, STOP if > 75)
- [ ] `output/text-formatter.ts` <= 100 lines (flag if > 100, STOP if > 150)
- [ ] `output/json-formatter.ts` <= 100 lines (flag if > 100, STOP if > 150)

### Task N.3: Run phase tests

```bash
npm test tests/integration/
```
**Done when**:
- [ ] All 61 integration tests GREEN
- [ ] No regressions in unit tests (Phase 1 & 2)

### Task N.4: Manual CLI verification

```bash
npm link
scip-find --help
scip-find Ticket --from shared/models/Ticket.ts --folder src/
scip-find Ticket --from shared/models/Ticket.ts --format json
```
**Done when**:
- [ ] Help text displays correctly
- [ ] Text output is grep-like
- [ ] JSON output is valid
- [ ] Filters work as expected

---

## Summary

| Metric | Value |
|--------|-------|
| Phase | 3 - CLI + Output + Integration Tests |
| Implementation Tasks | 4 (CLI, Text Formatter, JSON Formatter, Real SCIP Tests) |
| Post-Implementation Tasks | 4 |
| Total Tests to Make GREEN | 61 |

**Output**: `docs/CRs/SCF-001/phase-3/tasks.md`
**Tests**: `docs/CRs/SCF-001/phase-3/tests.md`

**Size thresholds**: Flag at default, STOP at 1.5x

**Next**: `/mdt:implement SCF-001 --phase 3`

---

*Generated by /mdt:tasks (v5) - Phase 3*
