# Property-Level Search: Implementation Options Analysis

**Document**: SCF-002.1 - Implementation Options
**Parent**: SCF-002 - Add property-level symbol search to scip-finder
**Status**: Exploratory
**Created**: 2026-01-01

## Overview

This document analyzes four implementation approaches for adding property-level symbol search to scip-finder. Each option is evaluated on technical complexity, performance, maintenance burden, and compatibility.

---

## Option 1: Extend SCIP Protocol (Contribute Upstream)

### Description

Modify the SCIP protocol and `scip-typescript` to index interface properties as separate symbols. Submit changes to Sourcegraph for inclusion in the official SCIP implementation.

### How It Works

1. Fork `scip-typescript` repository
2. Modify TypeScript indexer to create `LocalSymbol` entries for properties
3. Extend SCIP protocol to support property symbols (if needed)
4. Submit PR to Sourcegraph
5. Wait for upstream acceptance and release
6. Update scip-finder to use new SCIP version

### Symbol Encoding

Current SCIP:
```
scip-typescript npm markdown-ticket 0.0.0 `models/Ticket.ts`/`Ticket`#
```

Proposed SCIP:
```
scip-typescript npm markdown-ticket 0.0.0 `models/Ticket.ts`/`Ticket`/`title`#
scip-typescript npm markdown-ticket 0.0.0 `models/Ticket.ts`/`Ticket`/`status`#
```

### Advantages

| Benefit | Description |
|---------|-------------|
| Official support | Changes become part of SCIP standard |
| Community benefit | All SCIP users get property search |
| No custom tooling | Uses standard SCIP files |
| Performance | Fast symbol-based lookup (no parsing) |
| Compatibility | Works with all SCIP tools |

### Disadvantages

| Drawback | Impact |
|----------|--------|
| Upstream timeline | 3-12 months for acceptance + release |
| Uncertain acceptance | Sourcegraph may reject the change |
| Coordination required | Must align with SCIP maintainers |
| Fork maintenance | Must maintain fork until accepted |
| Protocol changes | May require SCIP v2 if protocol extension needed |

### Implementation Complexity

| Aspect | Effort |
|--------|--------|
| Protocol design | Medium (may not need changes) |
| scip-typescript changes | High (symbol indexing logic) |
| Testing | High (full test suite) |
| PR process | High (reviews, revisions) |
| Timeline | 3-12 months |

### Performance Characteristics

| Metric | Expected |
|--------|----------|
| Index time | +10-20% (more symbols to encode) |
| SCIP file size | +30-50% (more symbol entries) |
| Search latency | < 1ms (symbol lookup, same as current) |
| Memory usage | +20-30% (larger symbol index) |

### Recommendation

**NOT RECOMMENDED** for immediate needs. Consider this as a long-term strategic contribution after implementing Option 3. Use Option 3 to deliver value quickly while pursuing Option 1 in parallel.

---

## Option 2: Build Custom SCIP Generator

### Description

Create a fork of `scip-typescript` or build a custom indexer that generates enhanced SCIP files with property symbols. Distribute as `@yourorg/scip-typescript-enhanced`.

### How It Works

1. Fork `scip-typescript` or build from scratch
2. Modify indexer to create property symbol entries
3. Use SCIP protocol's extensibility (custom metadata)
4. Publish as separate npm package
5. Users generate SCIP files with custom tool
6. scip-finder reads enhanced SCIP files

### Symbol Encoding (Using SCIP Extensibility)

```
scip-typescript npm markdown-ticket 0.0.0 `models/Ticket.ts`/`Ticket`#
  metadata: {
    "properties": ["title", "status", "code"]
  }

scip-typescript npm markdown-ticket 0.0.0 `models/Ticket.ts`/`Ticket`/`title`#
  metadata: {
    "type": "property",
    "parent": "Ticket",
    "line": 6,
    "column": 3
  }
```

### Advantages

| Benefit | Description |
|---------|-------------|
| Full control | No dependency on upstream approval |
| Immediate availability | Ship when ready |
| SCIP-compatible | Uses SCIP protocol extensibility |
| Performance | Fast symbol-based lookup |

### Disadvantages

| Drawback | Impact |
|----------|--------|
| Maintenance burden | Must track upstream changes |
| Divergence risk | Fork may drift from SCIP standard |
| User adoption | Users must switch to custom tool |
| CI/CD changes | Build scripts need new tool |
| Version drift | May become incompatible with official SCIP |

### Implementation Complexity

| Aspect | Effort |
|--------|--------|
| Fork/setup | Low |
| Indexer modifications | High |
| Testing | High |
| Package publishing | Low |
| Documentation | Medium |
| Timeline | 4-8 weeks |

### Performance Characteristics

| Metric | Expected |
|--------|----------|
| Index time | +10-20% |
| SCIP file size | +30-50% |
| Search latency | < 1ms |
| Memory usage | +20-30% |

### Recommendation

**NOT RECOMMENDED** unless planning to maintain custom SCIP tooling long-term. Maintenance burden outweighs benefits for this specific use case.

---

## Option 3: Hybrid Approach (SCIP + On-Demand Parsing) ⭐ RECOMMENDED

### Description

Use SCIP for fast top-level symbol search, then parse TypeScript source files on-demand to find property occurrences. Add `--property` flag to CLI to trigger property search mode.

### How It Works

#### Symbol Search (Existing, Unchanged)

```
User: scip-find Ticket
↓
Load SCIP file
↓
Query symbol index
↓
Return occurrences (fast, < 1ms)
```

#### Property Search (New)

```
User: scip-find --property title Ticket
↓
Load SCIP file
↓
Query symbol index for "Ticket"
↓
Get list of files containing Ticket
↓
Parse those .ts/.tsx files using TypeScript compiler API
↓
AST traversal to find PropertyAccessExpression nodes
↓
Match: node.name.text === "title" && node.expression.symbol.name === "Ticket"
↓
Return occurrences (slower, < 2s target)
```

### Implementation Architecture

```
┌─────────────────────────────────────────────────────┐
│ src/cli/index.ts                                     │
│   .option('--property <name>', 'Search for property')│
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐    ┌─────────────────┐
│ Symbol Search │    │ Property Search │
│ (existing)    │    │ (new)           │
├───────────────┤    ├─────────────────┤
│ SCIP lookup   │    │ 1. SCIP lookup  │
│ < 1ms         │    │ 2. Get files    │
└───────────────┘    │ 3. Parse sources │
                     │ 4. Find props   │
                     │ < 2s target     │
                     └─────────────────┘
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
              ┌────────────┐   ┌──────────────┐
              │ ts-morph   │   │ typescript   │
              │ (wrapper)  │   │ compiler API │
              └────────────┘   └──────────────┘
```

### New Components

| Component | Purpose | Interface |
|-----------|---------|-----------|
| `PropertySearcher.ts` | Parse files and find properties | `findProperties(symbolName, propertyName, files)` |
| `TsParser.ts` | Wrapper for TypeScript compiler API | `parseFile(filePath): SourceFile` |
| `AstCache.ts` | Cache parsed ASTs | `get(filePath): SourceFile \| null` |
| CLI flag | Enable property search mode | `--property <name>` |

### Advantages

| Benefit | Description |
|---------|-------------|
| No SCIP changes | Works with existing SCIP files |
| Immediate value | Can ship in 2-4 weeks |
| Backward compatible | Existing search unchanged |
| Low maintenance | Leverages TypeScript compiler API |
| Progressive enhancement | Add more granular search later |
| Works with multi-SCIP | Extends to all SCIP files |

### Disadvantages

| Drawback | Mitigation |
|----------|------------|
| Slower than SCIP | Acceptable for property searches (infrequent) |
| TypeScript dependency | Already a dependency (peer dep) |
| Memory overhead | Cache with LRU eviction |
| File parsing required | Only parse files with symbol definitions |

### Implementation Complexity

| Aspect | Effort |
|--------|--------|
| TypeScript parser integration | Low (use `typescript` package) |
| AST traversal logic | Medium |
| CLI flag handling | Low |
| Caching layer | Medium |
| Testing | Medium |
| Timeline | 2-4 weeks |

### Performance Characteristics

| Metric | Expected | Optimization |
|--------|----------|--------------|
| Property search | 500ms - 2s | Cache parsed ASTs |
| Symbol search | < 1ms | Unchanged |
| Memory overhead | +10-50MB | LRU cache limit |
| First search | 1-2s | Parse all files |
| Subsequent searches | < 500ms | Use cached ASTs |

### Pseudo-Code

```typescript
// Property search algorithm
function searchProperty(symbolName: string, propertyName: string, scipFiles: string[]): Occurrence[] {
  // Step 1: Use SCIP to find files containing the symbol
  const symbolResults = queryEngine.find(symbolName);
  const files = [...new Set(symbolResults.map(r => r.file))];

  // Step 2: Parse each file to find property usages
  const results: Occurrence[] = [];
  for (const file of files) {
    const ast = getOrParseAst(file); // Use cache if available
    const properties = findPropertyAccess(ast, symbolName, propertyName);
    results.push(...properties);
  }

  return results;
}

function findPropertyAccess(ast: SourceFile, symbolName: string, propertyName: string): Occurrence[] {
  const results: Occurrence[] = [];

  function visit(node: Node) {
    if (isPropertyAccessExpression(node)) {
      const expr = node.expression;
      const prop = node.name;

      // Match: ticket.title where ticket is of type Ticket
      if (prop.text === propertyName &&
          expr.symbol?.name === symbolName) {
        results.push({
          file: ast.fileName,
          line: ast.getLineAndCharAtPosition(node.start).line + 1,
          column: ast.getLineAndCharAtPosition(node.start).character,
          property: propertyName
        });
      }
    }

    node.forEachChild(visit);
  }

  ast.forEachChild(visit);
  return results;
}
```

### Caching Strategy

```typescript
// LRU cache for parsed ASTs
const astCache = new LRUCache<string, SourceFile>({
  max: 100, // Cache up to 100 files
  ttl: 1000 * 60 * 5, // 5 minute TTL
  maxSize: 50 * 1024 * 1024, // 50MB memory limit
  sizeCalculation: (ast) => estimateSize(ast)
});

function getOrParseAst(filePath: string): SourceFile {
  let ast = astCache.get(filePath);
  if (!ast) {
    ast = ts.createSourceFile(filePath, fs.readFileSync(filePath, 'utf-8'));
    astCache.set(filePath, ast);
  }
  return ast;
}
```

### Recommendation

**⭐ RECOMMENDED** - Best balance of:
- Fast implementation (2-4 weeks)
- No SCIP protocol changes
- Backward compatible
- Maintainable
- Extensible to other features (method parameters, generic types)

---

## Option 4: Post-Process SCIP Files

### Description

Parse SCIP files after generation and enhance them with property information by reading the source files. Create a separate "enhanced SCIP" format.

### How It Works

```
1. Generate SCIP normally
   npx scip-typescript index --output index.scip

2. Enhance SCIP (new step)
   npx scip-finder enhance index.scip --add-properties

3. Search (uses enhanced SCIP)
   scip-find Ticket.title  ✅
```

### Enhancement Process

```
┌────────────────────────────────────────────────────┐
│ index.scip (original)                              │
│  - Documents: 102 files                            │
│  - Symbols: 1,922 symbol keys                      │
│  - Occurrences: 20,831                             │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼ Enhancement Command
┌────────────────────────────────────────────────────┐
│ For each symbol in SCIP:                          │
│  1. Find its definition file                      │
│  2. Parse source file                             │
│  3. Find properties within the symbol             │
│  4. Add property occurrences to SCIP metadata     │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│ index.enhanced.scip                                │
│  - Original SCIP data + property metadata         │
│  - Custom scip-finder metadata section            │
└────────────────────────────────────────────────────┘
```

### Metadata Format (SCIP Custom Metadata)

```protobuf
message EnhancedIndex {
  repeated PropertySymbol properties = 1;
}

message PropertySymbol {
  string name = 1;        // "title"
  string parent = 2;      // "Ticket"
  string defining_file = 3; // "models/Ticket.ts"
  int32 defining_line = 4; // 6
  repeated Occurrence occurrences = 5;
}
```

### Advantages

| Benefit | Description |
|---------|-------------|
| One-time cost | Enhancement done once per SCIP file |
| Fast searches | Property data in SCIP, no re-parsing |
| Compatible | Can share enhanced SCIP files |
| Incremental | Enhance only when needed |

### Disadvantages

| Drawback | Impact |
|----------|--------|
| New file format | Need to maintain `.enhanced.scip` format |
| Enhancement step | Extra build step |
| Staleness | Must re-enhance when code changes |
| Storage | +30-50% file size |
| Distribution | Can't use official SCIP files directly |

### Implementation Complexity

| Aspect | Effort |
|--------|--------|
| Metadata format | Low (use SCIP extensibility) |
| Enhancement CLI | Medium |
| SCIP reader/writer | Medium |
| Enhanced loader | Low |
| Testing | Medium |
| Timeline | 3-5 weeks |

### Performance Characteristics

| Metric | Expected |
|--------|----------|
| Enhancement time | 30-60s for typical monorepo |
| SCIP file size | +30-50% |
| Property search | < 1ms (from enhanced SCIP) |
| Symbol search | < 1ms (unchanged) |

### Recommendation

**CONSIDER** if:
- Property searches are frequent
- SCIP files can be distributed in enhanced format
- Team can manage extra build step

**NOT RECOMMENDED** if:
- SCIP files are generated externally (outside team control)
- Build simplicity is important
- Property searches are infrequent

---

## Comparison Matrix

| Aspect | Option 1: Extend SCIP | Option 2: Custom SCIP | Option 3: Hybrid ⭐ | Option 4: Post-Process |
|--------|----------------------|----------------------|---------------------|----------------------|
| **Time to Ship** | 3-12 months | 4-8 weeks | **2-4 weeks** | 3-5 weeks |
| **Maintenance** | Low (upstream) | High (fork) | **Medium** | Medium |
| **Performance** | Best (< 1ms) | Best (< 1ms) | **Good (< 2s)** | Best (< 1ms) |
| **SCIP Changes** | Required | Fork required | **None** | Enhancement step |
| **Backward Compatible** | Yes | Yes (fork) | **Yes** | Yes |
| **Dependencies** | SCIP release | Custom package | **typescript** | Enhancement tool |
| **File Size** | +30-50% | +30-50% | **0%** | +30-50% |
| **Complexity** | High | High | **Medium** | Medium |
| **Extensibility** | High | High | **High** | Low |
| **Upstream Alignment** | Yes | No (diverges) | **Yes** | Yes |

---

## Recommendation

### Primary Recommendation: Option 3 (Hybrid) ⭐

**Rationale**:
1. **Fastest to deliver** - 2-4 weeks vs. 3-12 months for other options
2. **No SCIP changes** - Works with existing SCIP files
3. **Backward compatible** - Existing searches unchanged
4. **Good performance** - < 2s acceptable for property searches
5. **Maintainable** - Uses TypeScript compiler API (well-documented)
6. **Extensible** - Can add method parameters, generic types later

### Implementation Priority

```
Phase 1: Core Property Search (2 weeks)
  ├─ PropertySearcher.ts
  ├─ TsParser.ts
  ├─ CLI --property flag
  └─ Integration tests

Phase 2: Caching (1 week)
  ├─ AstCache.ts (LRU)
  └─ Performance optimization

Phase 3: Enhancement (1 week)
  ├─ Handle edge cases
  ├─ Error handling
  └─ Documentation
```

### Future Considerations

- **Parallel work**: Pursue Option 1 (upstream SCIP) as strategic contribution
- **Fallback**: If performance becomes issue, implement Option 4 (post-process)
- **Metrics**: Track property search frequency to validate caching strategy

---

## Decision Record

**Decision**: Option 3 (Hybrid Approach)
**Date**: 2026-01-01
**Made By**: Architecture team
**Valid Until**: Property search performance becomes bottleneck OR SCIP adds native property support

**Alternatives Considered**:
- Option 1: Rejected due to timeline (3-12 months)
- Option 2: Rejected due to maintenance burden
- Option 4: Viable backup if performance insufficient

**Success Criteria**:
- Property search < 2s for typical interfaces
- Symbol search performance unchanged (< 5% degradation)
- Zero SCIP file format changes
- Test coverage > 80% for new code
