# Architecture: SCF-001

**Source**: [SCF-001](../SCF-001.md)
**Generated**: 2025-12-31
**Complexity Score**: 8 (Complex)

## Overview

Type-aware symbol search CLI that parses SCIP (Sourcegraph Code Intelligence Protocol) index files to find precise symbol references across TypeScript codebases. The architecture validates a Map-based in-memory index for O(1) symbol lookups with protobufjs for SCIP Protocol Buffer parsing.

**Key constraints validated in PoC**:
- SCIP parsing via `protobufjs` + bundled `scip.proto` schema (~500ms for 12MB file)
- In-memory index: 10,060 unique symbols with 116,820 occurrences
- Query performance: 0.03ms average (33x faster than 1s target)
- Package-aware symbol merging to distinguish same-named types from different packages

## Pattern

**Repository Pattern** — In-memory symbol index abstracts SCIP parsing complexity from query logic

The SCIP file is parsed once and cached in a `Map<string, Occurrence[]>` structure, allowing O(1) lookup by full symbol name. The query layer filters and formats results without understanding SCIP internals.

## Key Dependencies

### Use Existing

| Capability | Package | Coverage | Rationale |
|------------|---------|----------|-----------|
| CLI argument parsing | `commander@^12.0.0` | 100% | Mature library (20M+ weekly downloads), auto-generated help, argument validation, option parsing |
| SCIP Protocol Buffer parsing | `protobufjs@^8.0.0` | 100% | Mature library (40M+ weekly downloads), runtime proto parsing, no code generation needed |

### Build Custom

| Capability | Reason | Estimated Size |
|------------|--------|---------------|
| Symbol index queries | Custom logic for package-aware merging and SCIP-specific filtering | ~150 lines |
| Output formatting | Custom format requirements (grep-like + JSON) | ~100 lines |

## Component Boundaries

```mermaid
graph TB
    subgraph "CLI Layer"
        CLI[CLI Parser]
    end
    subgraph "Core Layer"
        Loader[SCIP Loader]
        Indexer[Symbol Indexer]
        Query[Query Engine]
    end
    subgraph "Output Layer"
        Text[Text Formatter]
        JSON[JSON Formatter]
    end

    CLI --> Loader
    Loader --> Indexer
    Indexer --> Query
    Query --> Text
    Query --> JSON
```

| Component | Responsibility | Owns | Depends On |
|-----------|----------------|------|------------|
| `cli/index.ts` | CLI entry point, commander.js config, help text | CLI configuration | `commander` |
| `core/scip-loader.ts` | Load and parse SCIP binary files | Proto schema, raw index | `protobufjs` |
| `core/symbol-indexer.ts` | Build Map-based symbol lookup index | Symbol → occurrences mapping | SCIP data structures |
| `core/query-engine.ts` | Symbol lookup, package filtering, folder filtering | Query logic, result aggregation | Symbol index |
| `output/text-formatter.ts` | Grep-like text output | Text formatting templates | Query results |
| `output/json-formatter.ts` | Structured JSON output | JSON serialization | Query results |

## Shared Patterns

| Pattern | Occurrences | Extract To |
|---------|-------------|------------|
| Symbol role bitmask parsing | Query engine, formatters | `utils/symbol-roles.ts` |
| SCIP symbol name extraction | Indexer, query engine | `utils/symbol-parser.ts` |

> Phase 1 extracts these utilities before implementing feature modules.

## Structure

```
src/
  ├── cli/
  │   └── index.ts              → CLI entry point with commander.js (limit 50 lines)
  ├── core/
  │   ├── scip-loader.ts        → SCIP file loading and parsing (limit 150 lines)
  │   ├── symbol-indexer.ts     → Build Map-based symbol index (limit 200 lines)
  │   └── query-engine.ts       → Symbol lookup with filtering (limit 250 lines)
  ├── output/
  │   ├── text-formatter.ts     → Grep-like output (limit 100 lines)
  │   └── json-formatter.ts     → JSON structured output (limit 100 lines)
  ├── utils/
  │   ├── symbol-roles.ts       → Symbol role bitmask utilities (limit 75 lines)
  │   └── symbol-parser.ts      → SCIP symbol parsing helpers (limit 100 lines)
  └── bundle/
      └── scip.proto            → SCIP Protocol Buffer schema (bundled from official repo)

tests/
  ├── unit/                     → Component unit tests
  ├── integration/              → End-to-end CLI tests with real SCIP files
  └── fixtures/                 → Synthetic SCIP files for edge cases
```

## Size Guidance

| Module | Role | Limit | Hard Max |
|--------|------|-------|----------|
| `cli/index.ts` | Entry point with commander.js | 50 | 75 |
| `core/scip-loader.ts` | SCIP parsing | 150 | 225 |
| `core/symbol-indexer.ts` | Index building | 200 | 300 |
| `core/query-engine.ts` | Query logic | 250 | 375 |
| `output/text-formatter.ts` | Text format | 100 | 150 |
| `output/json-formatter.ts` | JSON format | 100 | 150 |
| `utils/symbol-roles.ts` | Role utilities | 75 | 110 |
| `utils/symbol-parser.ts` | Symbol parsing | 100 | 150 |

## Requirement Coverage

| Requirement | Component | Coverage |
|-------------|-----------|----------|
| R1: Symbol search by name | `core/query-engine.ts` | Symbol matching algorithm |
| R2: Definition file filtering | `core/query-engine.ts` | `--from` option processing |
| R3: Folder scope filtering | `core/query-engine.ts` | Path prefix matching |
| R4: Package-aware distinction | `core/query-engine.ts`, `utils/symbol-parser.ts` | Package extraction from SCIP symbols |
| R5: Declaration file handling | `core/symbol-indexer.ts` | `.d.ts` variant merging |
| R6: Text output format | `output/text-formatter.ts` | Grep-like formatting |
| R7: JSON output format | `output/json-formatter.ts` | Structured JSON output |
| R8: SCIP file discovery | `core/scip-loader.ts` | File loading with `--scip` option |
| R9: Error handling | `cli/index.ts` + all | Validation and error messages |
| R10: Symbol role identification | `utils/symbol-roles.ts` | Bitmask decoding |
| R11: CLI help and usage | `cli/index.ts` | commander.js auto-generated help |

**Coverage**: 11/11 requirements (100%)

## Error Scenarios

| Scenario | Detection | Response | Recovery |
|----------|-----------|----------|----------|
| SCIP file missing | `fs.existsSync()` check | Print error with file path, exit code 1 | User creates SCIP file or provides correct path |
| SCIP file corrupted | protobufjs decode throws | Print parse error, exit code 1 | User regenerates SCIP file |
| Symbol not found | Zero results from index | Print "symbol not found" message, exit code 0 | User verifies symbol name or checks `--from` file |
| Invalid `--format` value | Argument validation | Print error with valid options, exit code 1 | User uses `text` or `json` |
| Invalid `--from` file | Symbol not in index | Print warning, search all symbols with same name | User provides correct file path |

## Validated Decisions (from PoC)

The following decisions were validated in `/docs/CRs/SCF-001/poc.md`:

| Decision | Validated Approach | Impact |
|----------|-------------------|--------|
| SCIP parsing library | `protobufjs` with bundled `scip.proto` | Runtime proto parsing, no code generation |
| Symbol index structure | `Map<string, Occurrence[]>` keyed by full SCIP symbol | O(1) lookup, 0.03ms query performance |
| Package filtering | Extract package name from SCIP symbol format | Distinguishes same-named types from different packages |
| `.d.ts` handling | Merge `.ts` and `.d.ts` symbols from same package | Handles compiled declaration files correctly |
| SCIP loading strategy | Parse once at CLI startup, cache in memory | ~500ms startup cost, subsequent queries instant |

## SCIP Symbol Format Understanding

**SCIP symbol encoding** (validated in PoC):
```
scip-typescript npm <package-name> <version> <descriptors>
```

**Examples**:
- `scip-typescript npm @mdt/shared 1.0.0 models/\`Ticket.ts\`/Ticket#` → `Ticket` interface
- `scip-typescript npm @mdt/shared 1.0.0 models/\`Ticket.ts\`/parseDate().` → `parseDate()` method
- `scip-typescript npm markdown-ticket 0.0.0 src/types/\`ticket.ts\`/Ticket#` → Different `Ticket` type

**Key insight**: Symbol names include package, version, file path, and descriptor—providing global uniqueness without needing external document IDs.

## Extension Rule

To add output format:
1. Create `output/{name}-formatter.ts` (limit 100 lines) implementing `format(results: QueryResult): string`
2. Add `.option()` to commander in `cli/index.ts`
3. Wire up formatter in action handler

To add filter option:
1. Add `.option()` to commander in `cli/index.ts`
2. Implement filter logic in `core/query-engine.ts` (within 250 line limit)
3. commander.js auto-generates help text

To support new SCIP protocol version:
1. Update `bundle/scip.proto` from official repo
2. Verify `protobufjs` compatibility
3. No code changes needed if protocol is backward compatible

## Implementation Phases

| Phase | Deliverable | Components | Size Estimate | Tests Included |
|-------|-------------|------------|---------------|----------------|
| **Phase 1: Foundation** | SCIP parsing + symbol index | `utils/`, `core/scip-loader.ts`, `core/symbol-indexer.ts` | ~500 lines | ✅ Unit tests |
| **Phase 2: Query Core** | Symbol lookup with filtering | `core/query-engine.ts` | ~250 lines | ✅ Unit tests |
| **Phase 3: CLI + Output** | Working CLI with formatters | `cli/index.ts`, `output/` | ~250 lines | ✅ Integration tests |
| **Phase 4: Hardening** | Edge cases + error handling | `tests/fixtures/`, `tests/integration/edge-cases.test.ts` | ~150 lines | ✅ Edge case tests |
| **Optional: Performance** | Performance benchmarks | `tests/performance/` | ~50 lines | ⚪ Optional |

### Dependency Graph

```
Phase 1: Foundation + Unit Tests
    ├─ utils/symbol-roles.ts + tests
    ├─ utils/symbol-parser.ts + tests
    ├─ core/scip-loader.ts + tests
    └─ core/symbol-indexer.ts + tests
    ↓
Phase 2: Query Core + Unit Tests
    ├─ core/query-engine.ts + tests
    └─ Depends on Phase 1 APIs
    ↓
Phase 3: CLI + Output + Integration Tests
    ├─ cli/index.ts
    ├─ output/text-formatter.ts
    ├─ output/json-formatter.ts
    └─ integration/ (real SCIP tests)
    ↓
Phase 4: Hardening (Edge Cases)
    ├─ fixtures/ (synthetic SCIP)
    └─ integration/edge-cases.test.ts

Optional: Performance (can be done anytime after Phase 3)
    └─ performance/benchmark.test.ts
```

### Phase 1: Foundation + Unit Tests
**Goal**: Load SCIP file, build symbol index, verify with unit tests

**Components**:
- `utils/symbol-roles.ts` — SCIP role bitmask utilities (75 lines)
- `utils/symbol-parser.ts` — SCIP symbol parsing helpers (100 lines)
- `core/scip-loader.ts` — SCIP file loading with protobufjs (150 lines)
- `core/symbol-indexer.ts` — Map-based symbol index builder (200 lines)
- `tests/unit/utils/symbol-roles.test.ts` — Unit tests for role parsing (50 lines)
- `tests/unit/utils/symbol-parser.test.ts` — Unit tests for symbol parsing (75 lines)
- `tests/unit/core/scip-loader.test.ts` — Unit tests for SCIP loading (100 lines)
- `tests/unit/core/symbol-indexer.test.ts` — Unit tests for index building (150 lines)

**Verification**:
```bash
# Run after Phase 1:
npm test tests/unit/

# Manual verification:
node -e "
  import { loadScipIndex } from './dist/core/scip-loader.js';
  import { buildSymbolIndex } from './dist/core/symbol-indexer.js';
  const index = loadScipIndex('/path/to/index.scip');
  const symbolIndex = buildSymbolIndex(index);
  console.log('✓ Loaded', index.documents.length, 'documents');
  console.log('✓ Indexed', symbolIndex.size, 'unique symbols');
"
```

**Acceptance Criteria**:
- [ ] SCIP file loads successfully (protobufjs)
- [ ] Symbol index builds with correct structure
- [ ] Unit tests pass (>80% coverage for utils/ and core/)
- [ ] Manual verification script runs without errors

**Deliverable**: Working symbol index API **+ passing unit tests**

---

### Phase 2: Query Core + Unit Tests
**Goal**: Implement symbol lookup logic with filtering

**Components**:
- `core/query-engine.ts` — Symbol lookup with package-aware filtering (250 lines)
- `tests/unit/core/query-engine.test.ts` — Unit tests for query logic (100 lines)

**Verification**:
```bash
# Run after Phase 2:
npm test tests/unit/

# Manual verification:
node -e "
  import { loadScipIndex } from './dist/core/scip-loader.js';
  import { buildSymbolIndex } from './dist/core/symbol-indexer.js';
  import { QueryEngine } from './dist/core/query-engine.js';

  const index = loadScipIndex('/path/to/index.scip');
  const symbolIndex = buildSymbolIndex(index);
  const queryEngine = new QueryEngine(symbolIndex);

  const results = queryEngine.find('Ticket', { from: 'shared/models/Ticket.ts' });
  console.log('✓ Found', results.length, 'occurrences of Ticket');
"
```

**Acceptance Criteria**:
- [ ] Query engine finds symbols by name
- [ ] `--from` filtering works correctly
- [ ] `--folder` filtering works correctly
- [ ] Package-aware merging works (same-named types distinguished)
- [ ] Unit tests pass (>80% coverage for query-engine)

**Deliverable**: `queryEngine.find(symbol, options)` API **+ passing unit tests**

---

### Phase 3: CLI + Output + Integration Tests
**Goal**: User-facing command-line tool with end-to-end tests

**Components**:
- `cli/index.ts` — commander.js CLI setup (50 lines)
- `output/text-formatter.ts` — Grep-like output (100 lines)
- `output/json-formatter.ts` — JSON output (100 lines)
- `tests/integration/cli.test.ts` — CLI integration tests (100 lines)
- `tests/integration/real-scip.test.ts` — Tests with real markdown-ticket SCIP (100 lines)

**Verification**:
```bash
# Run after Phase 3:
npm test tests/integration/

# Manual verification:
npm link
scip-find Ticket --from shared/models/Ticket.ts --folder src/
scip-find Ticket --from shared/models/Ticket.ts --format json
scip-find --help
```

**Acceptance Criteria**:
- [ ] `scip-find` command works end-to-end
- [ ] Text formatter produces grep-like output
- [ ] JSON formatter produces valid JSON
- [ ] `--help` displays usage information
- [ ] Integration tests with real SCIP file pass
- [ ] Error messages are clear and actionable

**Deliverable**: Fully functional `scip-find` CLI **+ passing integration tests**

---

### Phase 4: Hardening (Edge Cases)
**Goal**: Comprehensive edge case coverage and error handling

**Components**:
- `tests/fixtures/synthetic.scip` — Synthetic SCIP for edge cases (50 lines)
- `tests/integration/edge-cases.test.ts` — Edge case tests (100 lines)

**Verification**:
```bash
# Run after Phase 4:
npm test
```

**Acceptance Criteria**:
- [ ] Missing SCIP file handled correctly
- [ ] Corrupted SCIP file handled correctly
- [ ] Unknown symbol returns empty results
- [ ] Symbol not found in `--from` file shows warning
- [ ] Invalid `--format` value shows error
- [ ] Full test suite passes (>80% overall coverage)

**Deliverable**: Production-ready CLI **+ comprehensive edge case coverage**

---

### Optional: Performance Benchmarks
**Goal**: Validate performance targets (can be done anytime after Phase 3)

**Components**:
- `tests/performance/query-benchmark.test.ts` — Performance benchmarks (50 lines)

**Verification**:
```bash
# Run performance tests:
npm test tests/performance/

# Expected results:
# - SCIP parse time: < 1 second for 12MB file
# - Query time: < 1 second for 100k LOC codebase
```

**Acceptance Criteria**:
- [ ] SCIP file parsing < 1 second for 12MB file (~437 documents)
- [ ] Symbol lookup query < 1 second for 100k LOC codebase
- [ ] Memory usage acceptable for CLI (full index in memory)

**Deliverable**: Performance validation report **(optional)**

---
*Generated by /mdt:architecture (v5)*
