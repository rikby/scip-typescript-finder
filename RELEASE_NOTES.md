# Release Notes

## [0.2.0] - 2026-01-07

### New Features

- Property and method search with auto-detection (SCF-004)
  - Search for object properties using dot notation: `scip-finder MyThing.myProp`
  - Search for class methods using parentheses: `scip-finder MyThing.method()`
  - Wildcard search matches both properties and methods: `scip-finder process`
  - No special flags required - backward compatible with existing symbol search

### Improvements

- Enhanced symbol parsing to preserve SCIP suffix type information
- Query engine now supports suffix-aware filtering for properties and methods
- Better support for object-oriented codebases with property/method navigation

### Under the Hood

- Extracted SCIP format module into dedicated value objects (`SymbolParser`, `SymbolIndexKey`, `SuffixType`)
- Fixed layer violation by moving `handleFromFilter` from `utils/index.ts` to `cli/index.ts`
- All 184 tests passing across 9 test suites

### Documentation

- README updated with property and method search examples
- Architecture documentation expanded in `docs/CRs/SCF-004/`

## [0.1.0] - Initial Release

### Features

- Type-aware symbol search using SCIP indexes
- Fast queries on large codebases (<100k LOC in <1 second)
- Flexible filtering by defining file (`--from`) or folder (`--folder`)
- Multiple output formats: grep-like text or structured JSON
- Zero-config SCIP file discovery
- Auto-discovery of `index.scip` in current directory
