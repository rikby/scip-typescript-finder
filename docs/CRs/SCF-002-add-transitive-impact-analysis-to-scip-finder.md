---
code: SCF-002
status: Proposed
dateCreated: 2026-01-06T23:28:04.269Z
type: Feature Enhancement
priority: Medium
---

# Add Transitive Impact Analysis to scip-finder

## 1. Description

### Requirements Scope
full - Generate EARS + FR + NFR specifications

### Problem

- LLMs and developers lack visibility into transitive dependencies when changing symbols
- Current `scip-finder` shows only direct references, missing indirect dependents that may break
- Refactoring decisions made without full impact picture cause unexpected breakage in deeper layers

### Affected Areas

- CLI interface: New `--impact` flag and related options
- Core indexing: Call graph construction from SCIP data
- Query engine: Transitive dependency traversal
- Output formatting: Flat hierarchy display with depth control

### Scope

**Changes:**
- Add `--impact` flag for transitive dependency queries
- Build call graph index from SCIP occurrence data
- Implement depth-limited traversal (default: 2 levels)
- Add flat hierarchical output format

**Unchanged:**
- Existing `scip-finder SymbolName` behavior (direct references only)
- Current text and JSON output formats
- SCIP loading and symbol indexing logic

## 2. Desired Outcome
### Success Conditions

- When user runs `scip-finder --impact SymbolName`, system displays transitive dependency tree
- When user specifies `--depth N`, system limits traversal to N levels
- When symbol has no dependents, system exits gracefully with status 0
- When LLM consumes JSON format, system receives structured dependency tree

### Constraints

- Must build on existing SCIP index (no new index format)
- Must complete queries in < 1s for typical codebases (< 10k symbols)
- Must detect cycles to prevent infinite traversal
- Must fit within existing module size limits (query-engine.ts < 375 lines)
- Output format must be parseable by both humans and LLMs

### Non-Goals

- Not changing SCIP index format or generation
- Not analyzing non-SCIP languages (TypeScript only)
- Not providing runtime call graph (static analysis only)
- Not integrating with git history or other tools (phase 2)

### Interface Specification

#### CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--impact` | Enable transitive dependency analysis | Off |
| `--depth N` | Limit traversal depth (1-10, or 'all') | 2 |
| `--format flat` | Pure flat hierarchy with indentation | Default |
| `--format summary` | Compact counts only | - |
| `--format json` | Structured for LLM consumption | - |

#### Output Behavior

**Flat Format (default)**

When user queries `validateEmail` with depth=2, system displays:

```
validateEmail (utils/email-validator.ts:1)
  createUser (services/user-service.ts:8)
    handleUserRegistration (controllers/user-controller.ts:15)
    adminCreateUser (controllers/admin-controller.ts:22)
  login (services/auth-service.ts:12)
    handleLogin (controllers/auth-controller.ts:9)
```

Format rules:
- Indentation shows hierarchy (2 spaces per level)
- Each line shows: symbol name (file:line)
- No reference counts or occurrence numbers
- Truncates at specified depth

**Summary Format**

When user selects summary, system displays:

```
Impact: validateEmail
  Direct: 2 files
  Indirect: 3 files (depth 2)
  Total: 5 files
```

Format rules:
- Shows counts only
- Always includes depth level
- Compact, single block

**JSON Format**

When user selects JSON, system provides:

```json
{
  "symbol": "validateEmail",
  "definition": {"file": "utils/email-validator.ts", "line": 1},
  "impact": {
    "direct": [
      {"symbol": "createUser", "file": "services/user-service.ts", "line": 8}
    ],
    "indirect": [
      {"symbol": "handleUserRegistration", "file": "controllers/user-controller.ts", "line": 15, "depth": 1}
    ]
  }
}
```

Format rules:
- Structure: {symbol, definition, impact{direct[], indirect[]}}
- indirect items include depth level
- No reference counts
- Parseable by LLMs and tools

#### Edge Case Behavior

| Scenario | Output |
|----------|--------|
| Symbol not found | Exit status 0, no output (current behavior) |
| No dependents | Show definition only, exit 0 |
| Cycle detected | Show each symbol once in chain, no infinite loop |
| Depth exceeds available | Show all available levels, no error |
| Symbol from external package | Include package name in file path |
## 3. Open Questions

| Area | Question | Constraints |
|------|----------|-------------|
| Algorithm | DFS vs BFS for traversal? | Must handle large graphs efficiently |
| Cycle detection | Tarjan vs simple visited set? | Must prevent infinite loops, minimal overhead |
| Output | Include symbol types or just names? | Must fit typical terminal width (80 chars) |
| Depth | What is max reasonable depth limit? | Must prevent performance issues |
| Memory | Cache call graph or rebuild per query? | Must maintain < 100MB memory footprint |

### Known Constraints

- Must use existing SCIP symbol index as data source
- Must maintain backward compatibility with current CLI
- Must not require changes to SCIP index generation
- Must handle self-referencing symbols (cycles)

### Decisions Deferred

- Specific call graph data structure (determined by `/mdt:architecture`)
- Exact output format details (determined by `/mdt:architecture`)
- Performance optimization approach (determined by `/mdt:architecture`)
- Error handling for corrupted SCIP data (determined by `/mdt:architecture`)

## 4. Acceptance Criteria

### Functional (Outcome-focused)

- [ ] User can run `scip-finder --impact SymbolName` and see transitive dependents
- [ ] User can limit depth with `--depth N` flag (default: 2)
- [ ] User can choose output format: flat (default), summary, json
- [ ] System displays definition file + line for each symbol
- [ ] System handles cycles without infinite loops or errors
- [ ] System exits with status 0 when symbol not found (current behavior)
- [ ] JSON output provides structured tree for LLM consumption

### Non-Functional

- [ ] Query completes in < 1s for codebase with 10k symbols
- [ ] Memory usage stays within 50MB baseline + 20MB for call graph
- [ ] Output format compatible with existing grep-like workflows
- [ ] No changes required to SCIP index generation or format

### Edge Cases

- [ ] Symbol with 0 dependents: Display definition only, exit 0
- [ ] Self-referencing symbol (A calls A): Detect cycle, display once
- [ ] Circular chain (A→B→C→A): Detect cycle, display chain once
- [ ] Very deep chains (> 10 levels): Respect --depth limit, truncate cleanly
- [ ] Symbol from external package: Show package name in output

## 5. Verification

### How to Verify Success

**Manual verification:**
- Run `scip-finder --impact` on known symbol with dependents
- Verify output matches expected dependency tree
- Test `--depth 1` shows only direct dependents
- Test `--depth 2` shows direct + one level of indirect
- Test JSON output validates against schema

**Automated verification:**
- Unit test: Call graph builder creates correct adjacency list
- Unit test: DFS traversal respects depth limit
- Unit test: Cycle detection prevents infinite loops
- Integration test: CLI output matches snapshot format
- Performance test: 10k symbol index queries in < 1s

**Example verification test:**
```typescript
// Given: Symbol A → B → C → D (chain)
// When: scip-finder --impact A --depth 2
// Then: Shows A, B, C (but not D - depth limit)
```