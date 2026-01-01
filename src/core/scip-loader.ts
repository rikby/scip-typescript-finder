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

    // Handle empty file
    if (buffer.length === 0) {
      return { documents: [] };
    }

    // Try to parse as JSON first (for test fixtures)
    const content = buffer.toString('utf-8');
    if (content.trim().startsWith('{')) {
      try {
        const jsonIndex = JSON.parse(content);
        // Normalize JSON fixture data to match protobuf structure
        if (jsonIndex.documents) {
          jsonIndex.documents = jsonIndex.documents.map((doc: any) => ({
            relativePath: doc.relativePath || doc.uri?.replace('file:///', '') || '',
            language: doc.language || '',
            occurrences: (doc.occurrences || []).map((occ: any) => {
              // Handle different fixture formats
              if (occ.range && typeof occ.range === 'object') {
                // Convert {start: {line, character}, end: {line, character}} to [line, character, endLine, endCharacter]
                const range = occ.range;
                const startLine = range.start?.line || 0;
                const startChar = range.start?.character || 0;
                const endLine = range.end?.line || startLine;
                const endChar = range.end?.character || startChar;
                return {
                  symbol: occ.symbol || '',
                  symbolRoles: occ.role || occ.symbolRoles || 0,
                  range: [startLine, startChar, endLine, endChar],
                  overrideDocumentation: occ.overrideDocumentation || [],
                  syntaxKind: occ.syntaxKind || 0,
                  diagnostics: occ.diagnostics || [],
                  enclosingRange: occ.enclosingRange || [],
                };
              }
              return occ;
            }),
            symbols: doc.symbols || [],
            text: doc.text || '',
          }));
        } else {
          jsonIndex.documents = [];
        }
        return jsonIndex as ScipIndex;
      } catch (jsonError) {
        // If JSON parsing fails, fall through to protobuf parsing
      }
    }

    // Parse as protobuf
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
