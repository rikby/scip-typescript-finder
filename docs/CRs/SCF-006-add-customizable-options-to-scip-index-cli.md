---
code: SCF-006
status: In Progress
dateCreated: 2026-01-06T18:59:15.424Z
type: Feature Enhancement
priority: Medium
---

# Add customizable options to scip-index CLI

## 1. Description

### Requirements Scope
`none` — Skip requirements workflow

### Problem
- `bin/scip-index.js` hardcodes `maxdepth 2` for finding tsconfig files (line 26)
- No way to customize search depth for projects with different directory structures
- No way to specify custom paths to tsconfig files instead of auto-discovery
- Users with deeply nested or monorepo structures cannot control which tsconfigs are indexed

### Affected Artifacts
- `bin/scip-index.js` (hardcoded maxdepth and EXCLUDED_DIRS array)
- `package.json` (bin entry point for scip-index)
- Project documentation (README.md - CLI usage section)

### Scope
- **Changes**: Add CLI argument parsing to `bin/scip-index.js`, support `--depth` and `--config` flags
- **Unchanged**: Core SCIP indexing logic via `scip-typescript index`, existing default behavior when flags not provided

## 2. Decision

### Chosen Approach
Add `--depth` and `--config` CLI flags to scip-index using commander.js for argument parsing.

### Rationale
- Commander.js already a dependency in `package.json` (line 44), used by `scip-finder` CLI
- Minimal code change to existing `bin/scip-index.js` (~30 lines added)
- Backward compatible: defaults to current behavior (maxdepth 2, auto-discovery) when flags not provided
- Trade-off: Accepts complexity of argument parsing in favor of user flexibility

## 3. Alternatives Considered

| Approach | Key Difference | Why Rejected |
|----------|---------------|--------------|
| **Chosen Approach** | Add CLI flags via commander.js | **ACCEPTED** - Uses existing dependency, maintains backward compatibility |
| Environment variables | Config via SCIP_INDEX_DEPTH, SCIP_INDEX_CONFIG | Less discoverable than CLI flags, harder to use per-invocation |
| Config file | YAML/JSON config file for scip-index options | Over-engineering for simple options, adds file management overhead |
| No change | Keep hardcoded maxdepth 2 | Does not address user requirement for customization |

## 4. Artifact Specifications

### New Artifacts

| Artifact | Type | Purpose |
|----------|------|---------|
| None | N/A | No new files created |

### Modified Artifacts

| Artifact | Change Type | Modification |
|----------|-------------|--------------|
| `bin/scip-index.js` | Feature added | Add `--depth` flag (default: 2), add `--config` flag (accepts multiple paths), import commander.js |
| `README.md` | Documentation updated | Document `scip-index --depth N` and `scip-index --config path/to/tsconfig.json` usage |

### Integration Points

| From | To | Interface |
|------|----|-----------|
| CLI args | `bin/scip-index.js` | commander.js `.option()` parsing |
| `--config` flag values | `scip-typescript index` | Pass explicit tsconfig paths instead of find results |
| `--depth` flag value | `find` command | Replace hardcoded `2` with variable |

### Key Patterns
- Commander.js option pattern: `program.option('--depth <number>', 'Search depth', '2')`
- Conditional execution: Use explicit paths if `--config` provided, otherwise use `find` with `--depth`
- Default preservation: When no flags provided, maintain current behavior (maxdepth 2, auto-discovery)

## 5. Acceptance Criteria
### Functional
- [ ] `bin/scip-index.js` accepts `--depth N` flag to control find command maxdepth
- [ ] `bin/scip-index.js` accepts `--config <path...>` flag to specify explicit tsconfig paths
- [ ] Default behavior (no flags) matches current implementation: maxdepth 2, auto-discovery
- [ ] `--config` flag accepts multiple paths: `scip-index --config tsconfig.json src/tsconfig.json`
- [ ] `--depth` flag validates input is positive integer
- [ ] Help text displays via `scip-index --help`

### Non-Functional
- [ ] Backward compatible: existing scripts calling `scip-index` without flags work unchanged
- [ ] Exit code 1 when `--config` paths do not exist
- [ ] Error message clarifies required flag format when invalid input provided

### Testing
- Manual: Run `scip-index --help` and verify flags documented
- Manual: Run `scip-index --depth 3` in test project and verify deeper tsconfigs found
- Manual: Run `scip-index --config tsconfig.json` and verify only specified config indexed
- Manual: Run `scip-index` (no flags) and verify default behavior unchanged

> **Full EARS requirements**: [requirements.md](./SCF-006/requirements.md) — Generated with `--override` flag
## 6. Verification

### By CR Type
- **Feature**: `bin/scip-index.js` modified to accept `--depth` and `--config` flags, `scip-index --help` displays new options

### Metrics
No performance metrics applicable (feature addition, not optimization).

Verifiable artifacts after implementation:
- `bin/scip-index.js` includes commander.js import and option definitions
- `scip-index --help` output includes `--depth` and `--config` options
- `README.md` documents new flag usage

## 7. Deployment

### Simple Changes
- Publish new version to npm (automated via `npm publish`)
- Users update via `npm install -g scip-finder` or `npm update scip-finder`
- No configuration changes required
- No migration needed (backward compatible)
