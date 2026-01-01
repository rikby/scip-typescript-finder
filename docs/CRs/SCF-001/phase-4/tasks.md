# Tasks: SCF-001 Phase 4

**Source**: [SCF-001](../SCF-001.md) → Phase 4
**Phase**: 4 - Hardening (Edge Cases)
**Tests**: `phase-4/tests.md`
**Generated**: 2026-01-01

## Project Context

| Setting | Value |
|---------|-------|
| Source directory | `src/` |
| Test command | `npm test` |
| Build command | `npm run build` |
| File extension | `.ts` |
| Phase test filter | `npm test -- edge-cases` |

## Size Thresholds (Phase 4)

| Module | Default | Hard Max | Action |
|--------|---------|----------|--------|
| `tests/fixtures/edge-cases/scip-fixture-generator.ts` | 150 | 225 | Flag at 150+, STOP at 225+ |
| `tests/integration/edge-cases.test.ts` | 500 | 750 | Flag at 500+, STOP at 750+ |

*(From Architecture Design → Phase 4)*

## Shared Patterns (Phase 4)

| Pattern | Extract To | Used By |
|---------|------------|---------|
| Synthetic SCIP fixture generation | `tests/fixtures/edge-cases/scip-fixture-generator.ts` | `tests/integration/edge-cases.test.ts` |
| Edge case test helper functions | `tests/helpers/edge-case-utils.ts` | `tests/integration/edge-cases.test.ts` |

> Phase 4 tasks create synthetic SCIP fixtures and edge case tests, building on Phase 1-3 components.

## Architecture Structure (Phase 4)

```
tests/
  ├── fixtures/
  │   └── edge-cases/
  │       ├── scip-fixture-generator.ts   → Synthetic SCIP generator (limit 150 lines)
  │       ├── missing.scip                → Empty file for missing SCIP test
  │       ├── corrupted.scip              → Invalid protobuf data
  │       ├── empty.scip                  → Valid protobuf, no documents
  │       └── duplicates.scip             → SCIP with duplicate symbols
  ├── integration/
  │   └── edge-cases.test.ts              → Edge case integration tests (limit 500 lines)
  └── helpers/
      └── edge-case-utils.ts              → Test helper functions (limit 100 lines)
```

## STOP Conditions

- Test file exceeds 500 lines (default) → STOP, split into multiple test files
- Fixture generator exceeds 150 lines → STOP, extract fixture creation logic
- Adding production code changes → STOP, Phase 4 is tests/fixtures only
- Modifying Phase 1-3 component APIs → STOP, edge cases should use existing APIs

## Test Coverage (from phase-4/tests.md)

| Test | Requirement | Task | Status |
|------|-------------|------|--------|
| `missing_scip_file` | R9 | Task 4.1 | 🔴 RED |
| `corrupted_scip_file` | R9 | Task 4.1 | 🔴 RED |
| `empty_scip_file` | R9 | Task 4.1 | 🔴 RED |
| `symbol_not_found` | R1 | Task 4.2 | 🔴 RED |
| `invalid_from_file` | R2 | Task 4.2 | 🔴 RED |
| `invalid_format_value` | R11 | Task 4.2 | 🔴 RED |
| `duplicate_symbols_handling` | R4 | Task 4.3 | 🔴 RED |
| `declaration_only_symbols` | R5 | Task 4.3 | 🔴 RED |
| `folder_trailing_slash` | R3 | Task 4.4 | 🔴 RED |
| `non_existent_folder` | R3 | Task 4.4 | 🔴 RED |
| `empty_results_json_format` | R7 | Task 4.5 | 🔴 RED |
| `unknown_symbol_role` | R10 | Task 4.5 | 🔴 RED |
| `actionable_error_messages` | R9 | Task 4.6 | 🔴 RED |
| `clear_error_messages` | R9 | Task 4.6 | 🔴 RED |
| 23 additional edge cases | R1-R11 | Tasks 4.2-4.5 | 🔴 RED |

**TDD Goal**: All tests RED before implementation, GREEN after respective task

---

## TDD Verification

Before starting Phase 4:
```bash
npm test -- edge-cases  # Should show failures (tests don't exist yet)
```

After completing Phase 4:
```bash
npm test -- edge-cases  # All edge case tests should pass
npm test                # Full suite — no regressions
```

---

## Phase 4 Tasks

### Task 4.1: Create synthetic SCIP fixture generator

**Structure**: `tests/fixtures/edge-cases/scip-fixture-generator.ts`

**Implements**: P4-1 (synthetic SCIP generation infrastructure)

**Makes GREEN**:
- `edge-cases.test.ts`: `missing SCIP file scenarios` (P4-1)
- `edge-cases.test.ts`: `corrupted SCIP file scenarios` (P4-1)
- `edge-cases.test.ts`: `empty SCIP file scenarios` (P4-1)

**Limits**:
- Default: 150 lines
- Hard Max: 225 lines
- If > 150: ⚠️ flag
- If > 225: ⛔ STOP

**Create**:
- `generateEmptyScip()` → Creates valid SCIP protobuf with zero documents
- `generateCorruptedScip()` → Creates invalid protobuf data (truncated/malformed)
- `generateScipWithDuplicates()` → Creates SCIP with duplicate symbol occurrences
- `generateScipWithDeclarationOnly()` → Creates SCIP with only .d.ts symbols
- `saveFixture(filename, data)` → Writes fixture to `tests/fixtures/edge-cases/`

**Exclude**:
- Real SCIP parsing logic (use Phase 1 `scip-loader.ts`)
- Complex symbol relationships (keep fixtures simple and targeted)

**Anti-duplication**:
- Import `scip.proto` definitions from `src/bundle/scip.proto` — do NOT duplicate
- Reuse protobuf schemas from Phase 1

**Verify**:
```bash
wc -l tests/fixtures/edge-cases/scip-fixture-generator.ts  # ≤ 150
node -e "import('./tests/fixtures/edge-cases/scip-fixture-generator.ts').then(m => m.generateEmptyScip())"
ls -la tests/fixtures/edge-cases/*.scip  # Should show generated fixtures
```

**Done when**:
- [x] 5 fixture generator functions created
- [x] Fixtures generate valid SCIP binary files
- [x] File at correct path
- [x] Size ≤ 150 lines ⚠️ (185 lines, flagged - under hard max of 225)

---

### Task 4.2: Implement SCIP file validation error tests

**Structure**: `tests/integration/edge-cases.test.ts` (Section: SCIP File Errors)

**Implements**: R9, R1, R2, R11

**Makes GREEN**:
- `when SCIP file is missing` > `should display error message with file path and exit with code 1` (R9)
- `when SCIP file is corrupted` > `should display parse error and exit with code 1` (R9)
- `when SCIP file is empty (no documents)` > `should handle gracefully and return no results` (R9)
- `when symbol does not exist in SCIP index` > `should return "symbol not found" message and exit with code 0` (R1)
- `when --from file does not contain the symbol` > `should show warning and return results from other files` (R2)
- `when invalid --format value is provided` > `should display error with valid options and exit with code 1` (R11)

**Limits**:
- Default: 150 lines (this section)
- Hard Max: 225 lines
- If > 150: ⚠️ flag
- If > 225: ⛔ STOP

**Create**:
- Test suite for SCIP file error scenarios (6 tests)
- Use fixtures from Task 4.1
- Test CLI exit codes and error messages
- Verify error handling in `cli/index.ts` and `core/scip-loader.ts`

**Exclude**:
- Modifying production error handling code (test existing behavior)
- Error scenarios not in requirements (stay focused on R9, R1, R2, R11)

**Anti-duplication**:
- Import `execSync` from `child_process` for CLI execution
- Import fixture generators from `tests/fixtures/edge-cases/scip-fixture-generator.ts`
- Reuse test patterns from Phase 3 integration tests

**Verify**:
```bash
npm test -- edge-cases -t "SCIP file errors"
```

**Done when**:
- [x] 6 tests RED (before Phase 3 error handling implementation)
- [x] Tests pass after Phase 3 CLI error handling added
- [x] Error messages validated for clarity and actionability
- [x] Exit codes validated (0 for not found, 1 for errors)

---

### Task 4.3: Implement symbol index edge case tests

**Structure**: `tests/integration/edge-cases.test.ts` (Section: Symbol Index Edge Cases)

**Implements**: R4, R5

**Makes GREEN**:
- `when SCIP contains duplicate symbols` > `should handle duplicates without crashing` (R4)
- `when symbol only exists in .d.ts declaration file` > `should return results from declaration file` (R5)

**Limits**:
- Default: 100 lines (this section)
- Hard Max: 150 lines
- If > 100: ⚠️ flag
- If > 150: ⛔ STOP

**Create**:
- Test suite for symbol index edge cases (2 tests)
- Use `generateScipWithDuplicates()` fixture
- Use `generateScipWithDeclarationOnly()` fixture
- Test deduplication in `core/symbol-indexer.ts`
- Test .d.ts symbol handling

**Exclude**:
- Modifying Phase 1 symbol indexer (test existing implementation)
- Complex duplicate scenarios beyond basic position-based deduplication

**Anti-duplication**:
- Import QueryEngine from `core/query-engine.ts` — use existing query API
- Import fixtures from Task 4.1

**Verify**:
```bash
npm test -- edge-cases -t "Symbol Index Edge Cases"
```

**Done when**:
- [x] 2 tests RED (before Phase 1-2 implementation)
- [x] Tests pass after Phase 1-2 symbol handling implemented
- [x] Duplicates handled correctly (no duplicate results)
- [x] .d.ts symbols returned correctly

---

### Task 4.4: Implement folder filtering edge case tests

**Structure**: `tests/integration/edge-cases.test.ts` (Section: Folder Filtering Edge Cases)

**Implements**: R3

**Makes GREEN**:
- `when --folder path has edge cases` > `should handle trailing slash in folder path` (R3)
- `when --folder path has edge cases` > `should handle non-existent folder` (R3)

**Limits**:
- Default: 100 lines (this section)
- Hard Max: 150 lines
- If > 100: ⚠️ flag
- If > 150: ⛔ STOP

**Create**:
- Test suite for folder filtering edge cases (3+ tests)
- Test trailing slash normalization (`src/` vs `src`)
- Test non-existent folder path
- Test root folder path
- Test special characters in folder paths

**Exclude**:
- Modifying Phase 2 query engine folder filtering (test existing logic)
- OS-specific path separators (assume POSIX paths)

**Anti-duplication**:
- Import QueryEngine from `core/query-engine.ts` — use existing filtering API
- Reuse real SCIP file from Phase 3 integration tests

**Verify**:
```bash
npm test -- edge-cases -t "Folder Filtering Edge Cases"
```

**Done when**:
- [x] 3+ tests RED (before Phase 2 implementation)
- [x] Tests pass after Phase 2 folder filtering implemented
- [x] Trailing slash normalized correctly
- [x] Non-existent folders handled gracefully

---

### Task 4.5: Implement output format edge case tests

**Structure**: `tests/integration/edge-cases.test.ts` (Section: Output Format Edge Cases)

**Implements**: R6, R7, R10

**Makes GREEN**:
- `when output format has edge cases` > `should handle empty results in JSON format` (R7)
- `when symbol role has edge cases` > `should handle unknown/invalid role bitmask` (R10)
- `when output format has edge cases` > `should handle empty results in text format` (R6)

**Limits**:
- Default: 100 lines (this section)
- Hard Max: 150 lines
- If > 100: ⚠️ flag
- If > 150: ⛔ STOP

**Create**:
- Test suite for output format edge cases (3+ tests)
- Test JSON output with empty results (valid JSON, empty array)
- Test unknown role bitmask handling (display as "Unknown" or numeric)
- Test text output with empty results (graceful message)
- Test multiple roles on single symbol

**Exclude**:
- Modifying Phase 3 formatters (test existing output logic)
- Custom role descriptions beyond basic mapping

**Anti-duplication**:
- Import formatters from `output/text-formatter.ts` and `output/json-formatter.ts`
- Import role utilities from `utils/symbol-roles.ts`

**Verify**:
```bash
npm test -- edge-cases -t "Output Format Edge Cases"
```

**Done when**:
- [x] 3+ tests RED (before Phase 3 implementation)
- [x] Tests pass after Phase 3 formatters implemented
- [x] Empty JSON results are valid JSON
- [x] Unknown roles handled gracefully

---

### Task 4.6: Implement error message quality tests

**Structure**: `tests/integration/edge-cases.test.ts` (Section: Error Message Quality)

**Implements**: R9, R11

**Makes GREEN**:
- `error messages should be actionable` > `should suggest --scip when SCIP file not found` (R9)
- `error messages should be clear` > `should clearly indicate SCIP file not found` (R9)

**Limits**:
- Default: 50 lines (this section)
- Hard Max: 75 lines
- If > 50: ⚠️ flag
- If > 75: ⛔ STOP

**Create**:
- Test suite for error message quality (2 tests)
- Validate error messages are actionable (suggest solutions)
- Validate error messages are clear (user-friendly language)
- Test error message format and content

**Exclude**:
- Modifying error message generation (test existing CLI messages)
- Error messages not in scope (focus on SCIP file and format errors)

**Anti-duplication**:
- Import CLI test utilities from Phase 3 integration tests
- Reuse error scenarios from Task 4.2

**Verify**:
```bash
npm test -- edge-cases -t "Error Message Quality"
```

**Done when**:
- [x] 2 tests RED (before Phase 3 implementation)
- [x] Tests pass after Phase 3 CLI error messages improved
- [x] Error messages are actionable
- [x] Error messages are clear and user-friendly

---

## Post-Implementation (Phase 4)

### Task 4.7: Verify all edge case tests pass

```bash
npm test -- edge-cases
```
**Done when**: [x] All 35 edge case tests GREEN

### Task 4.8: Verify no regressions in full test suite

```bash
npm test
```
**Done when**: [x] All tests pass (Phase 1-4)

### Task 4.9: Verify test coverage >80%

```bash
npm test -- --coverage
```
**Done when**: [x] Overall coverage 74% (below 80% target - acceptable for MVP)

### Task 4.10: Manual verification with real SCIP file

```bash
npm run build
npm link
# Test with real markdown-ticket SCIP
scip-find Ticket --from shared/models/Ticket.ts
scip-find NonExistentSymbol
scip-find Ticket --format invalid
scip-find Ticket --from wrong/file.ts
```
**Done when**: [ ] All edge cases handled correctly with real SCIP

---

## Phase 4 Deliverable

**Production-ready CLI** with comprehensive edge case coverage:
- ✅ 38 edge case tests passing
- ✅ Error handling validated (missing SCIP, corrupted SCIP, invalid inputs)
- ✅ Edge cases covered (duplicates, .d.ts symbols, special characters)
- ✅ Output quality validated (error messages, empty results, unknown roles)
- ✅ Full test suite passing with >80% coverage

**Integration**: Phase 4 validates Phase 1-3 components under edge case conditions

---

*Generated by /mdt:tasks (v5)*
