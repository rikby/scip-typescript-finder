/**
 * SCIP File Loader - Implements R8 (File Discovery), R9 (Error Handling)
 * Phase 1 - Foundation
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import protobuf from 'protobufjs';
import type { ScipIndex } from './scip-types.js';
import { parseJsonIndex } from './scip-json-normalizer.js';

// Re-export types for consumers
export type {
  ScipIndex,
  ScipDocument,
  ScipOccurrence,
  ScipSymbolInformation,
  ScipRelationship,
  ScipDiagnostic,
} from './scip-types.js';

// Get the directory of this module (works in both dev and production)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const protoPath = path.join(__dirname, '../bundle/scip.proto');

const MAX_PARENT_SEARCH = 10;

/** Parse protobuf content as SCIP index */
function parseProtobufIndex(buffer: Buffer): ScipIndex {
  const root = protobuf.loadSync(protoPath);
  const ScipIndexMessage = root.lookupType('scip.Index');
  const decoded = ScipIndexMessage.decode(buffer);
  return ScipIndexMessage.toObject(decoded, {
    longs: String,
    enums: String,
    bytes: String,
  }) as ScipIndex;
}

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

  const buffer = fs.readFileSync(scipPath);

  if (buffer.length === 0) {
    return { documents: [] };
  }

  const content = buffer.toString('utf-8');
  const jsonResult = parseJsonIndex(content);
  if (jsonResult) {
    return jsonResult;
  }

  try {
    return parseProtobufIndex(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Failed to parse SCIP file: ${message}`);
  }
}
