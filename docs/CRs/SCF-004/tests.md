# Tests: SCF-004

**Mode**: Feature Enhancement
**Source**: requirements.md
**Generated**: 2026-01-04
**Scope**: Property and method search support

## Test Configuration

| Setting | Value |
|---------|-------|
| Framework | Jest |
| Test Directory | `tests/` |
| Test Command | `npm test` |
| Status | 🔴 RED (implementation pending) |

## Requirement → Test Mapping

| Req ID | Description | Test File | Scenarios | Status |
|--------|-------------|-----------|-----------|--------|
| R1.1-R1.5 | Suffix preservation | N/A (prep complete) | - | ✅ GREEN (prep phase) |
| R2.1-R2.4 | Suffix-aware filtering | `query-engine-suffix-filter.test.ts` | 15 | ✅ GREEN (Task 2) |
| R3.1-R3.6 | CLI syntax auto-detection | `query-syntax.test.ts` | 20 | ✅ GREEN (Task 1) |
| R4.1-R4.3 | Backward compatibility | `query-engine-suffix-filter.test.ts` | 3 | ✅ GREEN (Task 2) |
| R5.1-R5.4 | Edge case handling | `query-syntax.test.ts`, `query-engine-suffix-filter.test.ts` | 10 | ✅ GREEN (Tasks 1,2) |

## Test Specifications

### Feature 1: CLI Syntax Auto-Detection

**File**: `tests/unit/cli/query-syntax.test.ts`
**Covers**: R3 (CLI Syntax Auto-Detection), R5 (Edge Case Handling)

#### Scenario: method_detection_from_parentheses (R3.1)

```gherkin
Given a query string containing method syntax
When the query contains parentheses "()" or "("
Then it should be detected as a method query
And detection returns SuffixType.Method
```

**Test**: `describe('when query ends with () or contains (') > it('should detect as method query')`

**Examples**:
- `myMethod()` → Method
- `MyThing.myMethod()` → Method
- `process(data)` → Method

#### Scenario: property_detection_from_dot_syntax (R3.2)

```gherkin
Given a query string containing property syntax
When the query contains "." but no "("
Then it should be detected as a property query
And detection returns SuffixType.Term
```

**Test**: `describe('when query contains . but no (') > it('should detect as property query')`

**Examples**:
- `myProp` → Property
- `MyThing.myProp` → Property
- `user.name` → Property

#### Scenario: wildcard_default_for_bare_names (R3.3, R3.6)

```gherkin
Given a query string with no suffix syntax
When the query contains neither "." nor "()"
Then it should default to undefined (wildcard)
And undefined means "match all suffix types"
```

**Test**: `describe('when query is bare name (no . or ()') > it('should default to undefined')`

**Examples**:
- `process` → Wildcard (both)
- `Ticket` → Wildcard (both)
- `findById` → Wildcard (both)

#### Scenario: method_parameter_stripping (R3.5, R5.2)

```gherkin
Given a method query with parameters
When parameters are present in the query
Then they should be stripped to the base method name
And the base name is used for symbol lookup
```

**Test**: `describe('when method query has parameters') > it('should strip parameters')`

**Examples**:
- `method(string, number)` → `method`
- `findById(id: string)` → `findById`
- `MyThing.nested.method(x, y)` → `MyThing.nested.method`

#### Scenario: getter_setter_syntax_support (R5.3)

```gherkin
Given a getter or setter property
When queried with either property or method syntax
Then both syntaxes should be supported
```

**Test**: `describe('when getter/setter syntax is used')`

**Examples**:
- `value` → Wildcard (bare name)
- `MyThing.value` → Property
- `getValue()` → Method

#### Scenario: edge_case_handling_in_syntax_detection (R5.4)

```gherkin
Given queries with edge case syntax
When the query contains special characters or malformed patterns
Then the system should handle gracefully without errors
```

**Test**: `describe('when query has edge case syntax')`

**Examples**:
- Empty string → undefined
- Special characters (`$prop`) → handled
- Just `.` → Term
- Just `()` → Method

---

### Feature 2: Suffix-Aware Query Filtering

**File**: `tests/unit/core/query-engine-suffix-filter.test.ts`
**Covers**: R2 (Suffix-Aware Filtering), R4 (Backward Compatibility), R5 (Edge Cases)

#### Scenario: filter_by_property_suffix (R2.1)

```gherkin
Given a symbol index containing properties, methods, and types
When querying with suffixFilter: SuffixType.Term
Then only property occurrences should be returned
And methods and types should be excluded
```

**Test**: `describe('when filtering by property suffix') > it('should return only property occurrences')`

**Data**:
- `MyThing.myProp` (3 occurrences)
- `Other.myProp` (1 occurrence)
- Expected: 4 property occurrences

#### Scenario: filter_by_method_suffix (R2.2)

```gherkin
Given a symbol index containing mixed symbol types
When querying with suffixFilter: SuffixType.Method
Then only method occurrences should be returned
And properties and types should be excluded
```

**Test**: `describe('when filtering by method suffix') > it('should return only method occurrences')`

**Data**:
- `MyThing.process()` (2 occurrences)
- Expected: 2 method occurrences

#### Scenario: wildcard_match_all_types (R2.3)

```gherkin
Given a symbol name that exists as multiple types
When querying without a suffix filter
Then all occurrences should be returned regardless of suffix
```

**Test**: `describe('when no suffix filter is provided (wildcard)')`

**Data**:
- Symbol `handle` exists as both property and method
- Expected: Both occurrences returned

#### Scenario: index_level_filtering (R2.4)

```gherkin
Given a query with suffix filter
When the query engine performs lookup
Then filtering should occur at index level
And post-processing should not be needed
```

**Test**: `describe('when filtering occurs at index level')`

#### Scenario: backward_compatibility_wildcard_default (R4.2)

```gherkin
Given existing scip-finder usage patterns
When a query is made without specifying suffixFilter
Then the system should default to wildcard behavior
And existing commands should work unchanged
```

**Test**: `describe('backward compatibility - wildcard default')`

**Verification**:
- `queryEngine.find('symbol')` ≡ `queryEngine.find('symbol', {})`
- Both return all occurrences

#### Scenario: legacy_scip_index_handling (R5.4)

```ghergin
Given a SCIP index missing suffix information
When querying for symbols
Then the system should gracefully degrade
And results should be returned without error
```

**Test**: `describe('edge case - SCIP index missing suffix')`

**Verification**:
- Occurrences without `suffix` field should still be returned
- No errors thrown for legacy index format

#### Scenario: combined_filters (R2.4)

```gherkin
Given multiple filter options
When suffixFilter is combined with from or folder
Then all filters should apply together
And results should satisfy all conditions
```

**Test**: `describe('suffix filtering with other options')`

**Combinations**:
- `suffixFilter` + `from`
- `suffixFilter` + `folder`
- `suffixFilter` + `from` + `folder`

---

## Edge Cases

| Scenario | Expected Behavior | Test | Req |
|----------|-------------------|------|-----|
| Empty query string | Graceful handling, no crash | `query-syntax.test.ts` | R5.4 |
| Special characters in name | Handled correctly | `query-syntax.test.ts` | R5.4 |
| Nested properties | Last segment determines type | `query-syntax.test.ts` | R3.4 |
| Function-type properties | Property (no `()` in query) | `query-syntax.test.ts` | R5.1 |
| Method overloads | Base name matched (params stripped) | `query-syntax.test.ts` | R5.2 |
| Getters/setters | Both syntaxes supported | `query-syntax.test.ts` | R5.3 |
| SCIP index missing suffix | Graceful degradation | `query-engine-suffix-filter.test.ts` | R5.4 |
| Unmatched parentheses | Best-effort parsing | `query-syntax.test.ts` | R5.4 |

## Generated Test Files

| File | Scenarios | Lines | Status |
|------|-----------|-------|--------|
| `tests/unit/cli/query-syntax.test.ts` | 20 | ~210 | ✅ GREEN (Task 1) |
| `tests/unit/core/query-engine-suffix-filter.test.ts` | 15 | ~280 | 🔴 RED |

## Verification

Run SCF-004 tests (should all fail):

```bash
# Run all SCF-004 tests
npm test -- --testPathPattern="query-syntax|query-engine-suffix-filter"

# Or run specific test files
npm test tests/unit/cli/query-syntax.test.ts
npm test tests/unit/core/query-engine-suffix-filter.test.ts
```

**Expected**: ~35 failed, 0 passed (🔴 All RED)

## Coverage Checklist

- [x] All requirements have at least one test
- [x] Error scenarios covered
- [x] Edge cases documented
- [ ] Tests are RED (verified manually)

---

## For Implementation

Each task in `/mdt:tasks` should reference which tests it will make GREEN:

| Phase | Task | Makes GREEN |
|-------|------|-------------|
| 1 | Create `cli/query-syntax.ts` module | `query-syntax.test.ts` (R3, R5 scenarios) |
| 2 | Add suffix filtering to `query-engine.ts` | `query-engine-suffix-filter.test.ts` (R2, R4 scenarios) |
| 3 | Integrate syntax detection in CLI | `query-syntax.test.ts` (integration scenarios) |
| 4 | Update documentation | Documentation tests (manual) |

After each phase: `npm test` should show fewer failures.
