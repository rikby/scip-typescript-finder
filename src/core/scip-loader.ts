/**
 * SCIP File Loader - Implements R8 (File Discovery), R9 (Error Handling)
 * Phase 1 - Foundation
 */

import * as fs from 'fs';
import * as path from 'path';
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

const MAX_PARENT_SEARCH = 10;

// Get the directory of this module
// In tests: use __dirname (available after transpilation)
// In production: will be set via import.meta at module initialization
//
// For tests, we can set SCIP_MODULE_DIR via jest setup or environment variable
// @ts-ignore
const _dirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const moduleDir = process.env.SCIP_MODULE_DIR || _dirname;

// Default proto path - relative to the module directory
// In dev: project-root/src/bundle/scip.proto
// In production: project-root/dist/bundle/scip.proto
const DEFAULT_PROTO_PATH = path.join(moduleDir, '../bundle/scip.proto');

/** Get the proto file path - supports environment variable override */
function getProtoPath(): string {
  // Allow override via environment variable (for testing)
  if (process.env.SCIP_PROTO_PATH) {
    return process.env.SCIP_PROTO_PATH;
  }

  // Check if default path exists, if not try relative to module
  if (fs.existsSync(DEFAULT_PROTO_PATH)) {
    return DEFAULT_PROTO_PATH;
  }

  // Try dist directory (production build)
  const distProtoPath = path.join(moduleDir, '../bundle/scip.proto');
  if (fs.existsSync(distProtoPath)) {
    return distProtoPath;
  }

  // Try src directory (development)
  const srcProtoPath = path.join(moduleDir, '../../src/bundle/scip.proto');
  if (fs.existsSync(srcProtoPath)) {
    return srcProtoPath;
  }

  // Last resort: use default and let the error happen
  return DEFAULT_PROTO_PATH;
}

/** Parse protobuf content as SCIP index */
function parseProtobufIndex(buffer: Buffer): ScipIndex {
  const protoPath = getProtoPath();
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
