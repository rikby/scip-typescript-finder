/**
 * SCIP Fixture Generator for Phase 4 Edge Case Tests
 *
 * Generates synthetic SCIP Protocol Buffer data for testing error scenarios
 * and edge cases that are difficult to reproduce with real SCIP files.
 *
 * Test scenarios:
 * 1. Empty SCIP (no documents)
 * 2. SCIP with documents but no symbols
 * 3. SCIP with corrupted/invalid data
 * 4. SCIP with duplicate symbols
 * 5. SCIP with only .d.ts symbols
 * 6. SCIP with unknown symbol roles
 * 7. SCIP with extremely long symbol names
 * 8. SCIP with special characters in file paths
 */

import protobuf from 'protobufjs';
import fs from 'fs';
import path from 'path';

// SCIP proto schema (simplified - actual scip.proto should be used)
// This is a placeholder showing how to generate test fixtures

export interface ScipFixtureOptions {
  documents?: number;
  symbolsPerDocument?: number;
  includeDuplicates?: boolean;
  includeDeclarationFiles?: boolean;
  includeUnknownRoles?: boolean;
  corruptionLevel?: 'none' | 'partial' | 'complete';
}

/**
 * Generate a minimal valid SCIP index for testing
 */
export async function generateEmptyScip(outputPath: string): Promise<void> {
  // Empty SCIP with no documents
  const emptyIndex = {
    documents: []
  };

  // In reality, this would use protobufjs to encode the schema
  // For now, write a placeholder
  fs.writeFileSync(
    outputPath,
    JSON.stringify(emptyIndex),
    'utf-8'
  );
}

/**
 * Generate SCIP with documents but no symbols
 */
export async function generateNoSymbolsScip(outputPath: string): Promise<void> {
  const noSymbolsIndex = {
    documents: [
      {
        uri: 'file:///path/to/empty.ts',
        language: 'typescript',
        occurrences: []
      }
    ]
  };

  fs.writeFileSync(
    outputPath,
    JSON.stringify(noSymbolsIndex),
    'utf-8'
  );
}

/**
 * Generate SCIP with duplicate symbols
 */
export async function generateDuplicatesScip(outputPath: string): Promise<void> {
  const duplicatesIndex = {
    documents: [
      {
        uri: 'file:///path/to/file1.ts',
        language: 'typescript',
        occurrences: [
          {
            symbol: 'scip-typescript npm test-package 1.0.0 path/`to/file1.ts`/DuplicateSymbol#',
            role: 1, // Definition
            range: {
              start: { line: 1, character: 0 },
              end: { line: 1, character: 16 }
            }
          },
          {
            symbol: 'scip-typescript npm test-package 1.0.0 path/`to/file1.ts`/DuplicateSymbol#',
            role: 2, // Reference
            range: {
              start: { line: 5, character: 0 },
              end: { line: 5, character: 16 }
            }
          }
        ]
      },
      {
        uri: 'file:///path/to/file2.ts',
        language: 'typescript',
        occurrences: [
          {
            symbol: 'scip-typescript npm test-package 1.0.0 path/`to/file2.ts`/DuplicateSymbol#',
            role: 1, // Definition - duplicate!
            range: {
              start: { line: 1, character: 0 },
              end: { line: 1, character: 16 }
            }
          }
        ]
      }
    ]
  };

  fs.writeFileSync(
    outputPath,
    JSON.stringify(duplicatesIndex),
    'utf-8'
  );
}

/**
 * Generate SCIP with only .d.ts declaration files
 */
export async function generateDeclarationOnlyScip(outputPath: string): Promise<void> {
  const declarationOnlyIndex = {
    documents: [
      {
        uri: 'file:///path/to/types.d.ts',
        language: 'typescript',
        occurrences: [
          {
            symbol: 'scip-typescript npm test-package 1.0.0 types/`types.d.ts`/OnlyInDeclaration#',
            role: 1, // Definition
            range: {
              start: { line: 1, character: 0 },
              end: { line: 1, character: 20 }
            }
          }
        ]
      }
    ]
  };

  fs.writeFileSync(
    outputPath,
    JSON.stringify(declarationOnlyIndex),
    'utf-8'
  );
}

/**
 * Generate corrupted SCIP file for error handling tests
 */
export async function generateCorruptedScip(outputPath: string): Promise<void> {
  // Write invalid binary data
  const buffer = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05,
    // Invalid protobuf data that will fail to parse
    0xFF, 0xFF, 0xFF, 0xFF
  ]);

  fs.writeFileSync(outputPath, buffer);
}

/**
 * Generate all fixtures
 */
export async function generateAllFixtures(fixturesDir: string): Promise<void> {
  // Ensure fixtures directory exists
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  await generateEmptyScip(path.join(fixturesDir, 'empty.scip'));
  await generateNoSymbolsScip(path.join(fixturesDir, 'no-symbols.scip'));
  await generateDuplicatesScip(path.join(fixturesDir, 'duplicates.scip'));
  await generateDeclarationOnlyScip(path.join(fixturesDir, 'declaration-only.scip'));
  await generateCorruptedScip(path.join(fixturesDir, 'corrupted.scip'));

  console.log(`Generated SCIP fixtures in ${fixturesDir}`);
}
