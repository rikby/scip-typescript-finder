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
  fullDescriptor: string;  // Full hierarchical descriptor (e.g., "ProjectService#getAllProjects().")
}

/** Parser for SCIP symbol format */
export class SymbolParser {
  parse(symbol: string): ParsedSymbol {
    return {
      packageName: this.extractPackageName(symbol),
      filePath: this.extractFilePath(symbol),
      displayName: this.extractDisplayName(symbol),
      suffix: this.detectSuffixType(symbol),
      fullDescriptor: this.extractFullDescriptor(symbol),
    };
  }

  private extractPackageName(symbol: string): string {
    const match = symbol.match(/^scip-typescript\s+npm\s+(\S+)/);
    return match ? match[1] : '';
  }

  private extractDisplayName(symbol: string): string {
    // Extract the descriptor part (after the last space)
    const lastSpaceIndex = symbol.lastIndexOf(' ');
    if (lastSpaceIndex === -1) {
      return '';
    }

    const descriptorPart = symbol.slice(lastSpaceIndex + 1);

    // Special handling for namespace suffix '/'
    if (descriptorPart.endsWith('/')) {
      // For namespace, remove the trailing '/' suffix to get the name
      const descriptor = descriptorPart.slice(0, -1);
      // Extract leaf name (after last '#' or '/')
      const leafName = this.extractLeafName(descriptor);
      return leafName;
    }

    // For other descriptors, find the last '/' in the path
    const lastSlashInPath = descriptorPart.lastIndexOf('/');
    if (lastSlashInPath === -1) {
      return '';
    }

    const descriptor = descriptorPart.slice(lastSlashInPath + 1);
    const len = descriptor.length;

    // Edge case: empty descriptor
    if (len === 0) {
      return '';
    }

    // Extract the leaf name (after last '#' or '/' in the descriptor)
    // This handles cases like "Outer#Inner." -> "Inner"
    const leafName = this.extractLeafName(descriptor);
    const leafLen = leafName.length;

    if (leafLen === 0) {
      return '';
    }

    // Check for method suffix "()." - methods have name(). format
    if (leafLen >= 3 && leafName.endsWith('().')) {
      const name = leafName.slice(0, -3); // Remove "()." suffix
      return name; // Return name without () for consistent indexing
    }

    // Check for type suffix "#"
    if (leafName[leafLen - 1] === '#') {
      const name = leafName.slice(0, leafLen - 1);
      return name;
    }

    // Check for property/term suffix "."
    if (leafName[leafLen - 1] === '.') {
      const name = leafName.slice(0, leafLen - 1);
      return name;
    }

    // Check for namespace suffix "/"
    if (leafName[leafLen - 1] === '/') {
      const name = leafName.slice(0, leafLen - 1);
      return name;
    }

    // No suffix found - return as-is (handles parameters, type parameters, etc.)
    return leafName;
  }

  /**
   * Extract the leaf name from a descriptor by finding the last '#' or '/'.
   * For hierarchical descriptors (Outer#Inner), returns the Inner part with its suffix.
   * For simple descriptors (Name# or Name/), returns the full descriptor with suffix.
   * Examples:
   * - "ProjectManager#projectService." -> "projectService."
   * - "ProjectService#getAllProjects()." -> "getAllProjects()."
   * - "Ticket#" -> "Ticket#"
   * - "models/" -> "models/"
   * - "SomeName" -> "SomeName"
   */
  private extractLeafName(descriptor: string): string {
    const lastHashIndex = descriptor.lastIndexOf('#');
    const lastSlashIndex = descriptor.lastIndexOf('/');

    if (lastHashIndex !== -1 && lastHashIndex >= lastSlashIndex) {
      // If there's content after '#', return just that part (e.g., Outer#Inner. -> Inner.)
      // If '#' is at the end, return the whole descriptor (e.g., Ticket# -> Ticket#)
      if (lastHashIndex < descriptor.length - 1) {
        return descriptor.slice(lastHashIndex + 1);
      }
      return descriptor;
    }

    if (lastSlashIndex !== -1) {
      // If there's content after '/', return just that part (e.g., models/sub/ -> sub/)
      // If '/' is at the end, return the whole descriptor (e.g., models/ -> models/)
      if (lastSlashIndex < descriptor.length - 1) {
        return descriptor.slice(lastSlashIndex + 1);
      }
      return descriptor;
    }

    return descriptor;
  }

  private extractFilePath(symbol: string): string {
    const match = symbol.match(/(\S+\/)(?:\\+)?`([^`\\]+)(?:\\+)?`/);
    return match ? match[1] + match[2] : '';
  }

  /**
   * Extract the full hierarchical descriptor from a SCIP symbol.
   * This includes the parent context (e.g., "ProjectService#getAllProjects().")
   * unlike displayName which only includes the leaf name.
   *
   * Examples:
   * - "scip-typescript npm @mdt/shared 1.0.0 services/`ProjectService.ts`/ProjectService#getAllProjects()."
   *   -> "ProjectService#getAllProjects()."
   * - "scip-typescript npm @mdt/shared 1.0.0 models/`Ticket.ts`/Ticket#"
   *   -> "Ticket#"
   */
  private extractFullDescriptor(symbol: string): string {
    // Extract the descriptor part (after the last space)
    const lastSpaceIndex = symbol.lastIndexOf(' ');
    if (lastSpaceIndex === -1) {
      return '';
    }

    const descriptorPart = symbol.slice(lastSpaceIndex + 1);

    // Find the last '/' in the path (separates file path from descriptor)
    const lastSlashInPath = descriptorPart.lastIndexOf('/');
    if (lastSlashInPath === -1) {
      return '';
    }

    // Return everything after the file path (the full descriptor)
    return descriptorPart.slice(lastSlashInPath + 1);
  }

  private detectSuffixType(symbol: string): SuffixType {
    // Extract the descriptor part (after the last space)
    const lastSpaceIndex = symbol.lastIndexOf(' ');
    if (lastSpaceIndex === -1) {
      return SuffixType.Namespace;
    }

    const descriptorPart = symbol.slice(lastSpaceIndex + 1);

    // Check for method suffix "()." - must check before "."
    if (descriptorPart.endsWith("().")) {
      return SuffixType.Method;
    }

    // Check for type suffix "#"
    if (descriptorPart.endsWith('#')) {
      return SuffixType.Type;
    }

    // Check for property/term suffix "."
    if (descriptorPart.endsWith('.')) {
      return SuffixType.Term;
    }

    // Check for namespace suffix "/"
    if (descriptorPart.endsWith('/')) {
      return SuffixType.Namespace;
    }

    // Check for parameter suffix "(...)" - contains parentheses but doesn't end with ). or ).
    if (descriptorPart.includes('#(') || descriptorPart.includes('.(')) {
      return SuffixType.Parameter;
    }

    // Check for type parameter suffix "[...]"
    if (descriptorPart.includes('[') && descriptorPart.includes(']')) {
      return SuffixType.TypeParameter;
    }

    // Default to namespace if no suffix matched
    return SuffixType.Namespace;
  }
}
