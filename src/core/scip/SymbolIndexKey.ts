/**
 * SCIP Symbol Index Key (SCF-004 Phase 2)
 *
 * Value object for symbol index keys. Format: "package:file:name"
 * Suffix NOT included in string representation for backward compatibility.
 *
 * Enhanced to support full hierarchical descriptors for qualified name search.
 * Example: "ProjectService#getAllProjects()." allows searching by "ProjectService.getAllProjects()"
 */

import { SuffixType } from './SuffixType.js';

export class SymbolIndexKey {
  private readonly _packageName: string;
  private readonly _filePath: string;
  private readonly _displayName: string;
  private readonly _suffix: SuffixType;
  private readonly _fullDescriptor: string;  // Full hierarchical descriptor (e.g., "ProjectService#getAllProjects()")

  constructor(
    packageName: string,
    filePath: string,
    displayName: string,
    suffix: SuffixType,
    fullDescriptor: string = displayName  // Default to displayName for backward compatibility
  ) {
    this._packageName = packageName;
    this._filePath = filePath;
    this._displayName = displayName;
    this._suffix = suffix;
    this._fullDescriptor = fullDescriptor;
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

  get fullDescriptor(): string {
    return this._fullDescriptor;
  }

  /**
   * String format: "package:file:name"
   * For backward compatibility, uses displayName (leaf name) as the key.
   * Full descriptor matching is handled in QueryEngine.
   */
  toString(): string {
    return `${this._packageName}:${this._filePath}:${this._displayName}`;
  }

  /**
   * Returns the full descriptor key format.
   * Used for qualified name searches (e.g., "ProjectService.getAllProjects()")
   */
  toFullKey(): string {
    return `${this._packageName}:${this._filePath}:${this._fullDescriptor}`;
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
