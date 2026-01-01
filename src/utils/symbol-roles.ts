/**
 * SCIP Symbol Role Utilities
 * Phase: 1 - Foundation
 * Requirement: R10 (Symbol Role Identification)
 *
 * Provides utilities for working with SCIP symbol role bitmasks.
 * Roles are represented as bitmasks following the SCIP protocol specification.
 */

/** Symbol role bitmask constants from SCIP protocol. Roles can be combined using bitwise OR operations. */
export const Definition = 0x1;  // Symbol definition site
export const Reference = 0x2;   // Symbol reference site
export const Import = 0x4;      // Symbol import site
export const Export = 0x8;      // Symbol export site

/** Map of role bitmasks to their display names. */
const ROLE_NAMES: ReadonlyMap<number, string> = new Map([
  [Definition, 'Definition'],
  [Reference, 'Reference'],
  [Import, 'Import'],
  [Export, 'Export'],
]);

/**
 * Get the role name for a single role bitmask.
 * @param role - The role bitmask to look up
 * @returns The role name, or "Unknown" if the role is not recognized
 * @example getRoleName(0x1) // => "Definition"
 */
export function getRoleName(role: number): string {
  return ROLE_NAMES.get(role) || 'Unknown';
}

/**
 * Get all role names for a combined bitmask.
 * @param role - The role bitmask (may contain multiple roles)
 * @returns Array of role names for all recognized roles in the bitmask
 * @example getRoleNames(0x5) // => ["Definition", "Import"]
 */
export function getRoleNames(role: number): string[] {
  const names: string[] = [];
  if (role & Definition) names.push('Definition');
  if (role & Reference) names.push('Reference');
  if (role & Import) names.push('Import');
  if (role & Export) names.push('Export');
  return names;
}

/** Check if the definition role bit (0x1) is set. */
export function isDefinition(role: number): boolean {
  return (role & Definition) !== 0;
}

/** Check if the reference role bit (0x2) is set. */
export function isReference(role: number): boolean {
  return (role & Reference) !== 0;
}

/** Check if the import role bit (0x4) is set. */
export function isImport(role: number): boolean {
  return (role & Import) !== 0;
}

/** Check if the export role bit (0x8) is set. */
export function isExport(role: number): boolean {
  return (role & Export) !== 0;
}
