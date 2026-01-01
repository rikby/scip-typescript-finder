# Requirements: SCF-001

**Source**: [SCF-001](../SCF-001.md)
**Generated**: 2025-12-31
**CR Type**: Feature Enhancement

## Introduction

Type-aware code search tool for TypeScript codebases using SCIP (Sourcegraph Code Intelligence Protocol) index files. The system enables developers to find precise symbol references without false positives from same-named symbols in different files or packages.

## Behavioral Requirements (EARS)

### Requirement 1: Symbol Search by Name

**Objective**: As a developer, I want to search for a symbol by name, so that I can find all references to a specific type, interface, or function across the codebase.

#### Acceptance Criteria

1. WHEN user provides a symbol name via CLI argument, the system shall search the SCIP index for all matching symbols.
2. WHEN multiple symbols match the provided name, the system shall return results for all matching symbols unless `--from` is specified.
3. IF no symbols match the provided name, THEN the system shall display "symbol not found" message and exit with code 0.

### Requirement 2: Definition File Filtering

**Objective**: As a developer, I want to specify which definition file a symbol comes from, so that I can distinguish between same-named symbols from different files.

#### Acceptance Criteria

1. WHEN user provides `--from <file>` argument, the system shall filter symbol results to only those defined in the specified file.
2. WHEN `--from` file contains multiple symbols with the same name (overloads), the system shall return all overloaded variants.
3. IF the specified `--from` file does not contain any matching symbol, THEN the system shall display a warning and return results for all symbols with the matching name from other files.

### Requirement 3: Folder Scope Filtering

**Objective**: As a developer, I want to limit search results to a specific folder, so that I can analyze symbol usage within a specific module or subsystem.

#### Acceptance Criteria

1. WHEN user provides `--folder <path>` argument, the system shall filter occurrences to only those in files within the specified folder path.
2. WHEN filtering by folder, the system shall match files whose path starts with the folder path (prefix match).
3. IF no occurrences exist within the specified folder, THEN the system shall return empty results with a message indicating no matches found in that folder.

### Requirement 4: Package-Aware Symbol Distinction

**Objective**: As a developer, I want the system to distinguish between same-named types from different npm packages, so that I don't get false positives from unrelated types.

#### Acceptance Criteria

1. WHEN searching for a symbol with `--from` specified, the system shall extract the package name from the SCIP symbol encoding.
2. WHEN returning results, the system shall only include symbols from the same package as the `--from` definition.
3. WHEN two symbols have the same name but different package names, the system shall treat them as distinct symbols.

### Requirement 5: Declaration File Handling

**Objective**: As a developer, I want the system to merge symbols from `.ts` source files and `.d.ts` declaration files, so that I see complete usage information including compiled code references.

#### Acceptance Criteria

1. WHEN symbol has both `.ts` and `.d.ts` variants in the same package, the system shall merge occurrences from both variants.
2. WHEN merging symbol variants, the system shall deduplicate occurrences by file path and line/column position.
3. IF only `.d.ts` variant exists for a symbol, THEN the system shall return results from the declaration file.

### Requirement 6: Output Format - Text

**Objective**: As a developer using the CLI interactively, I want grep-like text output, so that I can quickly scan results in my terminal.

#### Acceptance Criteria

1. WHEN `--format text` is specified (or by default), the system shall output results in grep-like format: `file_path:line:column: symbol`.
2. WHEN displaying results, the system shall include the file path, line number, column range, and symbol role (Definition, Reference, Import, etc.).
3. WHEN multiple occurrences exist, the system shall display each occurrence on a separate line.

### Requirement 7: Output Format - JSON

**Objective**: As a developer building tooling on top of scip-find, I want structured JSON output, so that I can programmatically parse and process results.

#### Acceptance Criteria

1. WHEN `--format json` is specified, the system shall output results as valid JSON.
2. WHEN outputting JSON, the system shall include: symbol name, occurrence count, and array of occurrences with file, line, column, and role fields.
3. WHEN outputting JSON, the system shall ensure all boolean flags (isDefinition, isReference, isImport, isExport) are present for each occurrence.

### Requirement 8: SCIP File Discovery

**Objective**: As a developer, I want the system to automatically discover or accept the SCIP index file, so that I don't need to manually specify paths in standard project layouts.

#### Acceptance Criteria

1. WHEN `--scip <path>` argument is provided, the system shall load the SCIP file from the specified path.
2. WHEN `--scip` argument is not provided, the system shall search for `index.scip` in the current directory and parent directories.
3. IF no SCIP file is found and `--scip` is not specified, THEN the system shall display an error message indicating how to specify the SCIP file path and exit with code 1.

### Requirement 9: Error Handling - Invalid SCIP File

**Objective**: As a developer, I want clear error messages when the SCIP file is missing or corrupted, so that I can quickly diagnose and fix the issue.

#### Acceptance Criteria

1. WHEN the specified SCIP file does not exist, the system shall display "SCIP file not found: <path>" and exit with code 1.
2. WHEN the SCIP file cannot be parsed (corrupted or invalid format), the system shall display "Failed to parse SCIP file: <reason>" and exit with code 1.
3. IF the bundled `scip.proto` schema file is missing, THEN the system shall display "scip.proto schema not found" and exit with code 1.

### Requirement 10: Symbol Role Identification

**Objective**: As a developer, I want to see how each symbol is used (definition, reference, import, export), so that I can understand the context of each occurrence.

#### Acceptance Criteria

1. WHEN displaying occurrence results, the system shall identify the symbol role based on the SCIP symbol role bitmask.
2. WHEN a symbol has multiple roles (bitmask), the system shall display all applicable role names.
3. WHEN role cannot be determined (unknown bitmask), the system shall display "Unknown" role.

### Requirement 11: CLI Help and Usage

**Objective**: As a developer, I want clear help documentation, so that I can understand available options and how to use the tool.

#### Acceptance Criteria

1. WHEN user runs `scip-find --help` or `scip-find -h`, the system shall display usage information including: command syntax, arguments, options, and examples.
2. WHEN displaying help, the system shall show all available options: `--from`, `--folder`, `--format`, `--scip`, `--help`.
3. WHEN user provides invalid arguments, the system shall display an error message with the invalid argument and suggest using `--help`.

---

## Functional Requirements

| ID | Requirement | Rationale |
|----|-------------|-----------|
| FR-1 | Parse SCIP Protocol Buffer binary format | SCIP uses Protocol Buffers for efficient serialization |
| FR-2 | Build in-memory symbol index from SCIP data | Enables fast O(1) symbol lookups |
| FR-3 | Extract symbol display name from full SCIP symbol encoding | SCIP symbols include package, version, file path—user searches simple names |
| FR-4 | Extract package name from SCIP symbol for filtering | Distinguishes same-named types from different packages |
| FR-5 | Filter occurrences by file path prefix | Enables folder-scoped searches |
| FR-6 | Merge `.ts` and `.d.ts` symbol variants from same package | Handles TypeScript compiled declaration files |
| FR-7 | Deduplicate occurrences by file path and position | Removes duplicate entries from merged symbols |
| FR-8 | Output grep-compatible text format | Familiar to developers, works with Unix tooling |
| FR-9 | Output structured JSON format | Enables programmatic consumption by other tools |
| FR-10 | Decode SCIP symbol role bitmask to readable names | Makes symbol usage context clear to users |

## Non-Functional Requirements

### Performance

| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-P1 | SCIP file parsing | < 1 second for 12MB SCIP file (~437 documents) | Fast startup for CLI usage |
| NFR-P2 | Symbol lookup query | < 1 second for 100k LOC codebase | Interactive responsiveness |
| NFR-P3 | Memory usage | Full index in memory (suitable for CLI) | Trade memory for query speed, acceptable for CLI tools |

### Reliability

| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-R1 | Symbol search precision | 100% (no false positives from same-named symbols) | Primary value proposition of SCIP-based search |
| NFR-R2 | Symbol search recall | 100% (find all actual references) | Completeness required for refactoring impact analysis |
| NFR-R3 | Output format validity | 100% valid JSON when `--format json` | Programmatic consumers require parseable output |

### Usability

| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-U1 | Error message clarity | All errors include actionable guidance | Users should know how to fix problems |
| NFR-U2 | Command syntax consistency | Follow common CLI conventions (GNU style) | Familiarity reduces learning curve |
| NFR-U3 | Help documentation | Examples covering common use cases | Users learn by example |

---

## Artifact Mapping

| Req ID | Requirement Summary | Primary Artifact | Integration Points |
|--------|---------------------|------------------|-------------------|
| R1 | Symbol search by name | `core/query-engine.ts` | `core/symbol-indexer.ts`, `cli/index.ts` |
| R2 | Definition file filtering | `core/query-engine.ts` | `utils/symbol-parser.ts` |
| R3 | Folder scope filtering | `core/query-engine.ts` | `cli/index.ts` |
| R4 | Package-aware distinction | `core/query-engine.ts` | `utils/symbol-parser.ts` |
| R5 | Declaration file handling | `core/symbol-indexer.ts` | `utils/symbol-parser.ts` |
| R6 | Text output format | `output/text-formatter.ts` | `utils/symbol-roles.ts` |
| R7 | JSON output format | `output/json-formatter.ts` | `utils/symbol-roles.ts` |
| R8 | SCIP file discovery | `core/scip-loader.ts` | `cli/index.ts` |
| R9 | Error handling | `cli/index.ts` | All components |
| R10 | Symbol role identification | `utils/symbol-roles.ts` | SCIP data structures |
| R11 | CLI help and usage | `cli/index.ts` | `commander` library |

---

## Traceability

| Req ID | CR Section | Acceptance Criteria |
|--------|------------|---------------------|
| R1 | Problem, Success Conditions | AC-1, AC-2 |
| R2 | Problem, Success Conditions | AC-1 |
| R3 | Success Conditions | AC-1 |
| R4 | Problem, Success Conditions | AC-6 |
| R5 | Problem (d.ts variants) | AC-6 |
| R6 | Success Conditions | AC-4, AC-5 |
| R7 | Success Conditions | AC-4, AC-5 |
| R8 | Constraints | N/A |
| R9 | Edge Cases | Edge cases section |
| R10 | Success Conditions | AC-3 |
| R11 | Open Questions | N/A |

---
*Generated from SCF-001 by /mdt:requirements (v3)*
