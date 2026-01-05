---
code: SCF-004
status: In Progress
dateCreated: 2026-01-04T14:50:31.992Z
type: Feature Enhancement
priority: High
phaseEpic: SCIP Query Enhancement
dependsOn: SCF-003
implementationDate: 2026-01-05
implementationNotes: Test infrastructure fixed:
- Resolved import.meta Jest compatibility issue
- All 9 test suites passing (184/184 tests)
- Ready for feature implementation phases
- Committed ba754d5
---

# Add property and method search support to scip-finder CLI

## 1. Description
### Requirements Scope
`full` — Full EARS + FR + NFR specifications

### Problem Statement

**Current State:**
- scip-finder cannot search for object properties or class methods
- Users can only find symbol references (classes, interfaces, functions)
- Property and method usages cannot be queried despite SCIP protocol supporting them

**Evidence from SCF-003:**
- SCIP protocol FULLY SUPPORTS property/method references through descriptor suffixes
- scip-typescript emits `Suffix.Term` for properties and `Suffix.Method` for methods
- scip-finder strips suffix information, losing type context

**Impact:**
- Users cannot refactor properties safely (missing usage detection)
- Code navigation incomplete for object-oriented codebases
- Feature parity gap with SCIP protocol capabilities

### Affected Areas

- **CLI Interface**: Auto-detect property/method from query syntax (no flags)
- **Symbol Parsing**: Preserve SCIP suffixes through parsing pipeline
- **Query Engine**: Add suffix-aware filtering logic with auto-detection
- **Documentation**: Update usage examples with property/method searches

### Scope

**In scope:**
- Implement suffix-aware symbol parsing
- Implement syntax-based auto-detection in CLI (`prop` → property, `method()` → method)
- Update query engine to filter by suffix type
- Handle edge cases (ambiguous names, function-type properties, method overloads)

**Out of scope:**
- SCIP protocol changes (not needed per SCF-003)
- Performance optimization beyond basic suffix filtering
- UI/UX changes for web interfaces (CLI only)
- Support for Parameter/TypeParameter suffixes (future enhancement)

### Prep Workflow

**Status**: ✅ **Complete** — All prep refactoring finished and verified (2026-01-04)

**Prep Completed**:
1. ✅ Fixed layer violation: Moved `handleFromFilter` from `utils/index.ts` to `cli/index.ts`
2. ✅ Extracted `core/scip/` module: Created `SymbolParser`, `SymbolIndexKey`, `SuffixType`
3. ✅ Updated `SymbolIndexer` to use new value objects
4. ✅ All structural improvements verified: 194/194 production tests passing
5. ✅ Created snapshot validation infrastructure for integration testing

**Next Steps**:
1. `/mdt:architecture SCF-004` — Design feature implementation
2. `/mdt:tasks SCF-004` — Generate feature implementation tasks
3. `/mdt:implement SCF-004` — Execute feature phases
## 2. Rationale

### Why This Change Is Necessary

1. **Protocol Parity**: SCIP protocol supports properties/methods but scip-finder doesn't expose this capability
2. **Refactoring Safety**: Property/method refactoring requires complete usage detection
3. **SCF-003 Finding**: Investigation confirmed enhancement is feasible without schema changes
4. **User Expectation**: Users expect to search `MyThing.method()` and `MyThing.myProp` using natural syntax

### What It Accomplishes

- Enables property queries with natural syntax: `scip-finder MyThing.myProp`
- Enables method queries with natural syntax: `scip-finder MyThing.method()`
- Bare names perform wildcard search: `scip-finder process` (matches both)
- Completes SCIP protocol feature coverage for common symbol types

### Alignment with Project Goals

- **Goal**: Provide comprehensive code search capabilities
- **Approach**: Leverage existing SCIP protocol features rather than workarounds
- **Benefit**: Users get first-class property/method support without breaking changes

## 3. Solution Analysis
> **Extracted**: Complex architecture — see [architecture.md](./SCF-004/architecture.md)

**Summary**:
- **Approach**: Parse query syntax at CLI boundary, pass filter type to query engine
- **Components**: 3 modified (CLI, QueryEngine, help text) + 1 new (`query-syntax.ts`)
- **Key constraint**: Zero breaking changes, suffix filtering at index level
- **New lines**: ~100 total (60 syntax + 40 filtering + examples)

**Shared Utilities**:
- `detectQuerySyntax()` — Parse query string, return suffix type
- `stripMethodParameters()` — Remove `(...)` from method queries

**Extension Rule**: To add new query syntax, add detection logic to `cli/query-syntax.ts` (limit 60 lines), extend filter type if needed, update help text.

### Evaluated Alternatives

| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| A) Add `--suffix` flag | Explicit, type-safe | Requires flag for every query, worse UX | Rejected |
| **B) Auto-detect from query syntax** | **Natural UX, no flags needed** | **Ambiguous cases need handling** | **SELECTED** |
| C) Separate CLI commands | Clean separation | Code duplication, CLI bloat | Rejected |
| D) Post-filter output | No parser changes | Loses filtering performance, inaccurate results | Rejected |

### Selected Approach: Syntax-Based Auto-Detection

**Detection Behavior:**

| Query Syntax | Detected Type | Example |
|--------------|---------------|---------|
| Contains `(` or ends with `()` | Method | `MyThing.method()` |
| Contains `.` but no `(` | Property | `MyThing.myProp` |
| Bare name (no `.` or `(`) | Wildcard (both) | `process` |

**Key Design Decisions:**
- **Intuitive Syntax**: Users write natural code patterns (`prop` vs `method()`)
- **Zero Flags**: No command-line flags needed
- **Backward Compatible**: Existing queries work unchanged
- **Ambiguity Handling**: Bare names default to wildcard match

### Edge Cases Handled

| Edge Case | Example | Resolution |
|-----------|---------|------------|
| **Ambiguous bare names** | `scip-finder process` | Wildcard match (both property and method) |
| **Function-type properties** | `onClick: (event) => void` | Property in SCIP, users don't type `()` |
| **Method overloads** | `process()` vs `process(string)` | Strip parameters, match base method name |
| **Getters/Setters** | `get value()` | Support both `value` and `value()` syntaxes |
| **Nested properties** | `MyThing.nested.prop` | Last segment determines type |
| **Partial symbols** | `scip-finder method` (no `()`) | Wildcard match both properties and methods |

### Rejected Options

- **`--suffix` flag**: Explicit but requires extra keystrokes, worse UX
- **Separate Commands**: Duplicates core logic, violates DRY principle
- **Post-Filter**: Inefficient (filters entire result set), loses index-level optimization
## 4. Implementation Specification

### Technical Requirements

#### FR-1: Suffix Extraction and Preservation

**WHEN** parsing SCIP symbol strings
**THE SYSTEM SHALL** extract and preserve the SCIP suffix type through the parsing pipeline

**Acceptance Criteria:**
- [ ] Property suffix (`.`) is extracted and preserved
- [ ] Method suffix (`().`) is extracted and preserved
- [ ] Type suffix (`#`) is extracted and preserved
- [ ] Namespace suffix (`/`) is extracted and preserved
- [ ] Suffix information is included in lookup keys

#### FR-2: Suffix-Aware Query Filtering

**WHEN** finding symbol occurrences
**THE SYSTEM SHALL** support filtering by suffix type

**Acceptance Criteria:**
- [ ] Query can filter to return only property occurrences
- [ ] Query can filter to return only method occurrences
- [ ] Query can return all occurrences (wildcard match)
- [ ] Filtering occurs at index level (not post-filter)

#### FR-3: CLI Syntax Auto-Detection

**WHEN** user provides a query
**THE SYSTEM SHALL** auto-detect suffix type from query syntax

**Acceptance Criteria:**
- [ ] Queries ending with `()` or containing `(` are detected as methods
- [ ] Queries containing `.` but no `(` are detected as properties
- [ ] Bare names (no `.` or `(`) default to wildcard match
- [ ] Detection logic handles nested properties correctly
- [ ] Detection logic strips method parameters for matching
- [ ] Help text documents auto-detection behavior with examples

**CLI Examples:**

```bash
# Property (detected from . syntax)
scip-finder MyThing.myProp

# Method (detected from () syntax)
scip-finder MyThing.method()

# Wildcard (bare name, matches both)
scip-finder process

# Method with params (stripped to base name)
scip-finder MyThing.method(string, number)

# Nested property (last segment determines type)
scip-finder MyThing.nested.prop
```

#### FR-4: Documentation Updates

**WHEN** feature is released
**THE SYSTEM SHALL** include usage examples for property/method searches

**Acceptance Criteria:**
- [ ] README.md updated with property search example
- [ ] README.md updated with method search example
- [ ] CLI help text includes auto-detection behavior with examples

### Non-Functional Requirements
#### NFR-1: Backward Compatibility
- Existing `scip-finder SymbolName` commands MUST work without modification
- Default behavior MUST be wildcard suffix matching
- Zero breaking changes to existing CLI interface

#### NFR-2: Code Quality
- New code MUST follow existing TypeScript patterns
- MUST pass ESLint checks without warnings
- MUST maintain test coverage above 80%
### Implementation Sequence

1. **Phase 1: Parser Enhancement** (2-4 hours)
   - Implement suffix extraction and preservation
   - Add unit tests for suffix extraction

2. **Phase 2: Query Engine** (3-6 hours)
   - Add suffix filtering capability
   - Implement suffix filtering logic
   - Add integration tests

3. **Phase 3: CLI Auto-Detection** (2-3 hours)
   - Implement syntax-based detection logic
   - Integrate detection with query engine
   - Add CLI tests for auto-detection logic

4. **Phase 4: Documentation** (1-2 hours)
   - Update README with examples
   - Update CLI help text
   - Verify backward compatibility

**Total Estimated Effort**: 8-15 hours

### Testing Requirements

**Unit Tests:**
- Suffix extraction with all suffix types
- Key generation preserves suffix correctly
- Auto-detection with various query patterns
- Suffix filtering logic in query engine

**Integration Tests:**
- CLI auto-detection with SCIP index
- Property syntax detection (`MyThing.myProp`)
- Method syntax detection (`MyThing.method()`)
- Wildcard detection (bare names)
- Backward compatibility (default behavior)
- Combined filters (`--from` + auto-detection)

**Manual Verification:**
- Test with real SCIP index containing properties/methods
- Verify output format unchanged
- Confirm existing commands still work

## 5. Acceptance Criteria
### Functional (Outcome-Focused)

- [ ] `scip-finder MyThing.myProp` returns only property occurrences
- [ ] `scip-finder MyThing.method()` returns only method occurrences
- [ ] `scip-finder process` returns both property and method occurrences (wildcard)
- [ ] `scip-finder method(string, number)` returns method occurrences (params stripped)
- [ ] README.md includes property/method search examples

### Non-Functional

- [ ] All existing CLI commands work without modification
- [ ] ESLint passes with zero warnings
- [ ] Test coverage remains above 80%

### Edge Cases

| Scenario | Example | Expected Behavior |
|----------|---------|-------------------|
| Ambiguous bare name | `scip-finder process` | Wildcard match (both property and method) |
| Function-type property | `onClick: () => void` | Property (SCIP `.` suffix), user should NOT type `()` |
| Method overload | `process()` vs `process(string)` | Strip params, match base method name |
| Getter/setter | `get value()` | Support both `value` and `value()` syntaxes |
| Nested property | `MyThing.nested.prop` | Last segment determines type (property) |
| Partial query | `scip-finder method` (no `()`) | Wildcard match (may be property or method) |
| SCIP index missing suffix | Legacy index | Graceful degradation, match all types |

> Full EARS requirements: [requirements.md](./SCF-004/requirements.md)
## 6. Verification

### How to Verify Success

**Automated Verification:**

```bash
# Run test suite
npm test

# Verify property search
scip-finder MyThing.myProp
# Expect: Only property occurrences

# Verify method search
scip-finder MyThing.method()
# Expect: Only method occurrences

# Verify wildcard (bare name)
scip-finder process
# Expect: Both property and method occurrences

# Verify backward compatibility
scip-finder mySymbol
# Expect: All occurrences (no change from current behavior)
```

**Manual Verification:**
1. Create test file with properties and methods
2. Generate SCIP index: `scip-typescript index --index.scip`
3. Query with property syntax `MyThing.myProp` and verify only properties returned
4. Query with method syntax `MyThing.method()` and verify only methods returned
5. Query with bare name `process` and verify both types returned
6. Verify existing commands still work

**Documentation Verification:**
- README.md examples work as documented
- CLI `--help` explains auto-detection behavior clearly
- Error messages are actionable for edge cases

### Success Metrics
- **Functional**: All FR-1 through FR-4 acceptance criteria met
- **Quality**: Zero ESLint warnings, >80% test coverage
- **Compatibility**: 100% backward compatibility (zero breaking changes)
- **UX**: Intuitive syntax that matches user mental model

## 8. Clarifications

### Post-Implementation Session 2026-01-04

**Specification Corrections:**
- **`src/core/scip-loader.ts`**: Proto path resolves via `import.meta.url`, not `process.cwd()`. Required for CLI execution from different directories.
- **`tests/unit/core/scip-loader.test.ts`**: Mocked `protobufjs` hid path resolution bug. Integration tests now required for working-directory validation.

**New Artifacts:**
- **`scripts/validate-snapshots.ts`**: Snapshot validator running real CLI commands to catch integration bugs
- **`.claude/skills/snapshot-validator/skill.md`**: Snapshot validation skill documentation
- **`jest.setup.ts`**: Jest setup configuring `SCIP_PROJECT_ROOT` environment variable

**Modified Artifacts:**
- **`jest.config.js`**: Added `setupFiles: ['<rootDir>/jest.setup.ts']` for ESM test environment
- **`tests/helpers/cli-runner.ts`**: Added `cwd` parameter for multi-directory CLI test execution

**Prep Status**: Complete. All structural improvements verified. 194/194 production tests passing. Ready for feature implementation.