/**
 * CLI Entry Point for scip-finder
 * Symbol search with SCIP indexes (R1-R11)
 */

import { Command } from 'commander';
import { findScipFile, loadScipIndex } from '../core/scip-loader.js';
import { buildSymbolIndex } from '../core/symbol-indexer.js';
import { QueryEngine, type QueryResult } from '../core/query-engine.js';
import { formatAsText, formatAsJson, OutputFormat } from './formatter.js';

interface CliOptions {
  scip?: string;
  from?: string;
  folder?: string;
  format?: OutputFormat;
}

/**
 * Apply --from filter with fallback warning.
 * If --from was specified but no results found, show warning and return all results.
 * Only shows warning in text mode (not JSON mode to avoid breaking JSON parsing).
 */
function applyFromFilter(
  queryEngine: QueryEngine,
  symbolName: string,
  from: string | undefined,
  folder: string | undefined,
  format: OutputFormat,
  initialResults: QueryResult[]
): QueryResult[] {
  if (from && initialResults.length === 0 && format === 'text') {
    const allResults = queryEngine.find(symbolName, { folder });
    if (allResults.length > 0) {
      console.log(`Warning: Symbol '${symbolName}' is not defined in '${from}'. Showing all occurrences.\n`);
      return allResults;
    }
  }
  return initialResults;
}

function handleCommand(symbolName: string, options: CliOptions): void {
  const format = options.format || 'text';

  // Validate format before loading SCIP file
  if (format !== 'text' && format !== 'json') {
    console.error(`Invalid format: ${format}. Valid options are: text, json`);
    process.exit(1);
  }

  const scipPath = findScipFile(options.scip);
  if (!scipPath) {
    console.error(
      options.scip
        ? `SCIP file not found: ${options.scip}`
        : 'No SCIP file found. Please specify a SCIP file using --scip option, or run from a directory containing index.scip\nRun with --help for usage information.'
    );
    process.exit(1);
  }

  const scipIndex = loadScipIndex(scipPath);
  const symbolIndex = buildSymbolIndex(scipIndex);
  const queryEngine = new QueryEngine(symbolIndex);

  let results = queryEngine.find(symbolName, { from: options.from, folder: options.folder });
  results = applyFromFilter(queryEngine, symbolName, options.from, options.folder, format, results);

  console.log(format === 'json' ? formatAsJson(symbolName, results) : formatAsText(symbolName, results));
}

export function main(): void {
  new Command()
    .name('scip-finder')
    .description('Search for symbols in SCIP code intelligence indexes')
    .version('0.0.1')
    .configureOutput({
      writeErr: (str) => console.error(str),
      outputError: (str, write) => write(`Error: ${str.replace('error: ', '')}\nRun with --help for usage information.\n`)
    })
    .argument('<symbol>', 'Symbol name to search for (case-sensitive exact match)')
    .option('--scip <path>', 'Path to SCIP index file (auto-discovers if not provided)')
    .option('--from <file>', 'Filter to symbols defined in specific file')
    .option('--folder <path>', 'Filter occurrences to files within folder')
    .option('--format <type>', 'Output format: text or json (default: text)', 'text')
    .addHelpText('after', '\nExamples:\n  $ scip-finder MyFunction\n  $ scip-finder --scip ./index.scip SymbolName\n  $ scip-finder --from lib/main.ts SymbolName\n  $ scip-finder --folder src/ SymbolName\n  $ scip-finder --format json SymbolName\n  $ scip-finder --from lib/main.ts --format json SymbolName\n\nFor more information, visit: https://github.com/sourcegraph/scip\n')
    .action(handleCommand)
    .parse();
}
