# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`scip-finder` is a type-aware code search CLI tool for TypeScript codebases that uses SCIP (Sourcegraph Code Intelligence Protocol) index files to provide precise symbol search capabilities. Unlike text-based search tools, it distinguishes between same-named symbols from different files/packages and eliminates false positives.

**Technology Stack**: Node.js 18+, TypeScript 5.3+ (strict mode, ES2022 modules), Jest 29.7 with ts-jest

## Common Commands

```bash
# Build
npm run build              # tsc + copy scip.proto to dist/bundle/
npm run prepublishOnly     # Runs build before NPM publish

# Testing
npm test                  # Run all Jest tests
npm run test:watch        # Jest watch mode
npm run test:unit         # Unit tests only

# Validation
npm run validate:snapshots  # Validate CLI output against stored snapshots

# Development (requires SCIP index)
scip-index                # Generate SCIP index (excludes node_modules, dist, build)
scip-finder SymbolName    # Search for symbol
```

## Architecture

The system follows a **Repository Pattern** with three distinct layers:

```
CLI Layer (Command Parsing)
    ↓
Core Layer (SCIP Loading → Index Building → Querying)
    ↓
Output Layer (Text/JSON Formatting)
```

### Core Components

| Component | File | Responsibility | Size Limit |
|-----------|------|----------------|------------|
| CLI Entry Point | `src/cli/index.ts` | commander.js setup, multi-SCIP support, help text | 75 lines |
| SCIP Loader | `src/core/scip-loader.ts` | Load SCIP binary files via protobufjs, auto-discovery | 200 lines |
| Symbol Indexer | `src/core/symbol-indexer.ts` | Build `Map<string, Occurrence[]>` index, merge indexes | 250 lines |
| Query Engine | `src/core/query-engine.ts` | Symbol lookup with filtering (file/folder/package) | 250 lines |
| SCIP Types | `src/core/scip/` | SymbolParser, SymbolIndexKey, SuffixType value objects | - |
| Utilities | `src/utils/symbol-roles.ts` | SCIP role bitmask constants (Definition=0x1, Reference=0x2, etc.) | 75 lines |

### Data Flow

1. **CLI Entry Point** (`cli/index.ts`): Parses commander.js arguments, validates inputs
2. **SCIP Loader** (`core/scip-loader.ts`): Loads binary SCIP files using protobufjs with bundled `scip.proto` schema
3. **Symbol Indexer** (`core/symbol-indexer.ts`): Builds `Map<string, Occurrence[]>` for O(1) lookups
4. **Query Engine** (`core/query-engine.ts`): Filters results by file/folder/package
5. **Formatters** (`cli/formatter.ts`): Outputs grep-like text or structured JSON

### Key Architectural Decisions

- **In-memory index**: Full SCIP data cached in memory for sub-millisecond queries (~50MB for 2,616 symbols)
- **Package-aware merging**: SCIP symbol encoding (`package:file:name`) naturally segregates packages
- **Declaration file handling**: Merges `.ts` and `.d.ts` variants with deduplication
- **0-based to 1-based conversion**: SCIP uses 0-based line/char numbers, formatters convert to 1-based for display

## SCIP Symbol Format

SCIP symbols are encoded as:
```
scip-typescript npm <package> <version> <descriptors>
```

Example: `scip-typescript npm @mdt/shared 1.0.0 models/\`Ticket.ts\`/Ticket#`

**Symbol Index Key Format**: `"package:file:name"` (suffix excluded for backward compatibility)

**Suffix Types** (from `src/core/scip/SuffixType.ts`):
- `#` - Type
- `.` - Term
- `().` - Method
- `/` - Namespace
- `,` - Parameter
- `::` - TypeParameter

## Testing Structure

- `tests/unit/` - Component unit tests with mock SCIP data
- `tests/integration/` - End-to-end CLI tests with real SCIP files
- `tests/fixtures/` - Synthetic SCIP files for edge cases
- `tests/helpers/cli-runner.ts` - CLI test execution helper
- `scripts/validate-snapshots.ts` - Validates actual CLI output against stored snapshots in `markdown-ticket/snapshot_*.txt`

Tests reference requirements by ID (e.g., "R1", "R8") in comments. Requirements are documented in `docs/CRs/SCF-001/requirements.md`.

## Project Management

- Uses MDT (ticket management system) with project code `SCF`
- Tickets stored in `docs/CRs/`
- Current implementation: SCF-001 (Type-aware SCIP code search tool)
- WIP: SCF-004 (Property and method search support)

## Naming Conventions

- Files: `kebab-case.ts` (e.g., `scip-loader.ts`, `symbol-indexer.ts`)
- Classes: `PascalCase` (e.g., `QueryEngine`, `SymbolParser`)
- Functions/Variables: `camelCase` (e.g., `buildSymbolIndex`, `findScipFile`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `Definition`, `Reference`)

## Error Handling

- Fail fast on missing/corrupted SCIP files with clear error messages
- Auto-fallback warning when `--from` filter finds no results (text mode only)
- Exit code 0 for "symbol not found", exit code 1 for errors

## Extension Rules

**To add output format**:
1. Create formatter in `cli/formatter.ts` implementing `format(results: QueryResult): string`
2. Add `.option()` to commander in `cli/index.ts`
3. Wire up formatter in action handler

**To add filter option**:
1. Add `.option()` to commander in `cli/index.ts`
2. Implement filter logic in `core/query-engine.ts` (within 250 line limit)

**To support new SCIP protocol version**:
1. Update `src/bundle/scip.proto` from official repo
2. Verify `protobufjs` compatibility

## Performance Characteristics (Validated in PoC)

- SCIP parse: ~500ms for 12MB file (~437 documents)
- Query time: 0.03ms average (33x faster than 1s target)
- Memory: ~50MB for 2,616 symbols
- Multi-SCIP load: 55ms average per file

## Size Limits Enforced

The architecture enforces strict size limits to maintain modularity:

| Module | Limit | Hard Max |
|--------|-------|----------|
| `cli/index.ts` | 75 | 110 |
| `core/scip-loader.ts` | 200 | 300 |
| `core/symbol-indexer.ts` | 250 | 375 |
| `core/query-engine.ts` | 250 | 375 |
| `utils/symbol-roles.ts` | 75 | 110 |

See `docs/CRs/SCF-001/architecture.md` for full architectural documentation.
