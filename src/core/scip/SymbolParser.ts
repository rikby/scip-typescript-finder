/**
 * SCIP Symbol Parser (SCF-004 Phase 2)
 *
 * Parses SCIP symbol format: scip-typescript npm <package> <version> <descriptors>
 * Example: scip-typescript npm @mdt/shared 1.0.0 models/`Ticket.ts`/Ticket#
 */

import { SuffixType } from './SuffixType.js';

/** Parsed SCIP symbol components */
export interface ParsedSymbol {
  packageName: string;
  filePath: string;
  displayName: string;
  suffix: SuffixType;
}

/** Parser for SCIP symbol format */
export class SymbolParser {
  parse(symbol: string): ParsedSymbol {
    return {
      packageName: this.extractPackageName(symbol),
      filePath: this.extractFilePath(symbol),
      displayName: this.extractDisplayName(symbol),
      suffix: this.detectSuffixType(symbol),
    };
  }

  private extractPackageName(symbol: string): string {
    const match = symbol.match(/^scip-typescript\s+npm\s+(\S+)/);
    return match ? match[1] : '';
  }

  private extractDisplayName(symbol: string): string {
    const match = symbol.match(/\/([^\/#.]+?)(\(\)|\(.*?\))?[.#]?$/);
    return match ? match[1] + (match[2] || '') : '';
  }

  private extractFilePath(symbol: string): string {
    const match = symbol.match(/(\S+\/)(?:\\+)?`([^`\\]+)(?:\\+)?`/);
    return match ? match[1] + match[2] : '';
  }

  private detectSuffixType(symbol: string): SuffixType {
    if (symbol.includes('().')) return SuffixType.Method;
    if (symbol.includes('#')) return SuffixType.Type;
    if (symbol.includes('.')) return SuffixType.Term;
    return SuffixType.Namespace;
  }
}
