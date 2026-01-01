/**
 * SCIP File Loader - Implements R8 (File Discovery), R9 (Error Handling)
 * Phase 1 - Foundation
 */

import * as fs from 'fs';
import * as path from 'path';
import protobuf from 'protobufjs';

// Get the project root - works in both dev and production
const projectRoot = process.cwd();
const protoPath = path.join(projectRoot, 'src/bundle/scip.proto');

// SCIP Protocol Buffer type definitions
export interface ScipIndex {
  metadata?: {
    version?: { version?: number };
    toolInfo?: { name?: string; version?: string };
    projectRoot?: string;
    textDocumentEncoding?: number;
  };
  documents?: ScipDocument[];
  externalSymbols?: ScipSymbolInformation[];
}

export interface ScipDocument {
  relativePath?: string;
  language?: string;
  occurrences?: ScipOccurrence[];
  symbols?: ScipSymbolInformation[];
  text?: string;
  positionEncoding?: number;
}

export interface ScipOccurrence {
  range?: number[];
  symbol?: string;
  symbolRoles?: number;
  overrideDocumentation?: string[];
  syntaxKind?: number;
  diagnostics?: ScipDiagnostic[];
  enclosingRange?: number[];
}

export interface ScipSymbolInformation {
  symbol?: string;
  documentation?: string[];
  relationships?: ScipRelationship[];
  kind?: number;
  displayName?: string;
  signatureDocumentation?: ScipDocument;
  enclosingSymbol?: string;
}

export interface ScipRelationship {
  symbol?: string;
  isReference?: boolean;
  isImplementation?: boolean;
  isTypeDefinition?: boolean;
  isDefinition?: boolean;
}

export interface ScipDiagnostic {
  severity?: number;
  code?: string;
  message?: string;
  source?: string;
  tags?: number[];
}

const MAX_PARENT_SEARCH = 10;

/** Find SCIP file path (R8) */
export function findScipFile(scipPath?: string): string | null {
  if (scipPath) {
    return fs.existsSync(scipPath) ? scipPath : null;
  }

  let currentDir = process.cwd();
  for (let i = 0; i < MAX_PARENT_SEARCH; i++) {
    const scipFilePath = path.join(currentDir, 'index.scip');
    if (fs.existsSync(scipFilePath)) {
      return scipFilePath;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}

/** Load and parse SCIP file (R9) */
export function loadScipIndex(scipPath: string): ScipIndex {
  if (!fs.existsSync(scipPath)) {
    throw new Error(`SCIP file not found: ${scipPath}`);
  }

  try {
    const buffer = fs.readFileSync(scipPath);
    const root = protobuf.loadSync(protoPath);
    const ScipIndexMessage = root.lookupType('scip.Index');
    const decoded = ScipIndexMessage.decode(buffer);
    const index = ScipIndexMessage.toObject(decoded, {
      longs: String,
      enums: String,
      bytes: String,
    });
    return index as ScipIndex;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse SCIP file: ${error.message}`);
    }
    throw new Error('Failed to parse SCIP file: unknown error');
  }
}
