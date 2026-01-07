# scip-finder

> Fast symbol search for SCIP code intelligence indexes

Search for symbol definitions and references across large codebases using SCIP (Sourcegraph Code Intelligence Protocol) indexes. Perfect for understanding code structure, finding usage locations, and navigating complex projects.

## Features

- **Type-aware search** - Distinguishes same-named symbols from different files/packages
- **Fast queries** - Searches large codebases (<100k LOC) in under 1 second
- **Flexible filtering** - Filter by defining file (`--from`) or folder (`--folder`)
- **Multiple formats** - Output as grep-like text or structured JSON
- **Zero-config discovery** - Automatically finds `index.scip` in current directory

## Quick Start

### Prerequisites

- Node.js 18+
- SCIP index file

### Installation

```bash
npm install -g scip-finder
```

### Generate SCIP Index

```bash
# Install scip-typescript
npm install -g @sourcegraph/scip-typescript

# Generate index for your project (excludes node_modules, dist, build)
scip-index
```

### Basic Usage

```bash
# Find all usages of a symbol
scip-finder MyFunction

# Filter to symbols from a specific file
scip-finder --from lib/main.ts SymbolName

# Filter results to a specific folder
scip-finder --folder src/ SymbolName

# Output as JSON for programmatic use
scip-finder --format json SymbolName
```

## Usage Examples

### Find Symbol References

```bash
$ scip-finder SymbolName

lib/main.ts:10:1: Definition
services/handler.ts:25:10:
services/handler.ts:42:20:
```

### Filter Results

```bash
# Only symbols defined in specific file
scip-finder --from models/User.ts User

# Only occurrences within a folder
scip-finder --folder server/ handleRequest
```

### JSON Output

```bash
$ scip-finder --format json SymbolName

{
  "symbol": "SymbolName",
  "occurrences": [
    {
      "file": "lib/main.ts",
      "line": 10,
      "column": 1,
      "role": "Definition"
    }
  ]
}
```

### Property and Method Search (SCF-004)

The CLI auto-detects property vs method search based on query syntax:

```bash
# Property search - names containing "." are treated as property queries
scip-finder MyThing.myProp

# Method search - names containing "()" are treated as method queries
scip-finder MyThing.method()

# Wildcard search - bare names match both properties and methods
scip-finder process
```

No special flags required - queries are backward compatible with existing symbol search.

## Commands

### `scip-finder`

Search for symbols in SCIP indexes.

```bash
scip-finder [options] <symbol>
```

**Options:**
| Option | Description |
|--------|-------------|
| `--scip <path>` | Path to SCIP file (auto-discovers `index.scip`) |
| `--from <file>` | Filter to symbols defined in specific file |
| `--folder <path>` | Filter occurrences to files within folder |
| `--format <type>` | Output format: `text` or `json` (default: `text`) |

### `scip-index`

Generate SCIP index from TypeScript project.

```bash
scip-index
```

Automatically finds all `tsconfig*.json` files (excluding `node_modules`, `dist`, `build`, `.git`) and creates `index.scip`.

**Options:**
| Option | Description |
|--------|-------------|
| `--depth <number>` | Maximum depth to search for tsconfig files (default: `2`) |
| `--config <paths...>` | Explicit tsconfig file paths (comma-separated, skips auto-discovery) |

**Examples:**

```bash
# Default: search depth 2, auto-discover tsconfig files
scip-index

# Search deeper for nested tsconfig files (monorepo structure)
scip-index --depth 4

# Specify exact tsconfig files to index
scip-index --config tsconfig.json,src/tsconfig.json,packages/*/tsconfig.json

# Get help
scip-index --help
```

## How It Works

1. **Generate SCIP** - `scip-typescript` indexes your TypeScript/JavaScript project
2. **Search** - scip-finder loads the SCIP index and queries symbol occurrences
3. **Filter** - Narrow results by defining file or folder path
4. **Output** - Get results in text or JSON format

## Contributing

Contributions are welcome! This project uses TypeScript and Jest.

## License

MIT

## Resources

- [SCIP Protocol](https://github.com/sourcegraph/scip)
- [scip-typescript](https://www.npmjs.com/package/@sourcegraph/scip-typescript)
