/**
 * SCIP Symbol Index Key (SCF-004 Phase 2)
 *
 * Value object for symbol index keys. Format: "package:file:name"
 * Suffix NOT included in string representation for backward compatibility.
 */

import { SuffixType } from './SuffixType.js';

export class SymbolIndexKey {
  private readonly _packageName: string;
  private readonly _filePath: string;
  private readonly _displayName: string;
  private readonly _suffix: SuffixType;

  constructor(
    packageName: string,
    filePath: string,
    displayName: string,
    suffix: SuffixType
  ) {
    this._packageName = packageName;
    this._filePath = filePath;
    this._displayName = displayName;
    this._suffix = suffix;
  }

  get packageName(): string {
    return this._packageName;
  }

  get filePath(): string {
    return this._filePath;
  }

  get displayName(): string {
    return this._displayName;
  }

  get suffix(): SuffixType {
    return this._suffix;
  }

  /** String format: "package:file:name" (suffix excluded for backward compatibility) */
  toString(): string {
    return `${this._packageName}:${this._filePath}:${this._displayName}`;
  }

  valueOf(): string {
    return this.toString();
  }

  equals(other: SymbolIndexKey): boolean {
    return (
      this._packageName === other._packageName &&
      this._filePath === other._filePath &&
      this._displayName === other._displayName &&
      this._suffix === other._suffix
    );
  }
}
