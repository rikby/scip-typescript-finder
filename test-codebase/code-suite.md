# Test Codebase Specification for SCIP Testing

## Overview

A TypeScript monorepo with 3 scoped packages designed for comprehensive SCIP index testing. This codebase serves as the foundation for validating scip-finder's symbol resolution across different edge cases.

## Package Structure

```
test-codebase/
├── alpha/           # @tt/alpha - imports from gamma
├── beta/            # @tt/beta - imports from gamma
├── gamma/           # @tt/gamma - base library (no imports)
└── package.json     # (optional) root workspace config
```

### Package Names

- `@tt/alpha` - Consumer package 1
- `@tt/beta` - Consumer package 2
- `@tt/gamma` - Shared library

**Dependency Graph:**
```
gamma (no deps)
  ↑
  ├── alpha (imports gamma)
  └── beta (imports gamma)
```

## Edge Case Coverage

### 1. Type System Features

#### 1.1 Classes
- **Basic class** - `class SimpleClass {}`
- **Class with constructor** - parameterized constructor
- **Class inheritance** - `class Child extends Parent`
- **Abstract class** - `abstract class AbstractBase`
- **Generic class** - `class Container<T>`
- **Class with multiple decorators** - `@sealed @log class Decorated`
- **[EDGE] Class with same name in different packages** - `class Duplicate` in alpha, beta, gamma

#### 1.2 Interfaces
- **Basic interface** - `interface ISimple {}`
- **Interface extending interface** - `interface IExtended extends ISimple`
- **Interface extending class** - `interface IFromClass extends ClassType`
- **Generic interface** - `interface IContainer<T>`
- **[EDGE] Interface with same name in different files** - `interface IConfig` in multiple files

#### 1.3 Type Aliases
- **Simple type** - `type ID = string;`
- **Union type** - `type Value = string | number;`
- **Intersection type** - `type Mixed = A & B;`
- **Generic type** - `type Result<T> = { data: T; };`
- **Conditional type** - `type NonNullable<T> = T extends null ? never : T;`
- **[EDGE] Type with circular reference** - `type Node = { next?: Node; }`

#### 1.4 Enums
- **Numeric enum** - `enum Status { Active, Inactive }`
- **String enum** - `enum Direction { Up = 'UP' }`
- **Const enum** - `const enum Permissions`
- **[EDGE] Enum with computed values** - `enum Dynamic { A = 1 << 0 }`

#### 1.5 Functions
- **Basic function** - `function foo() {}`
- **Arrow function** - `const bar = () => {}`
- **Function overloading** - multiple signatures
- **Generic function** - `function identity<T>(x: T): T`
- **[EDGE] Function with same name, different signatures** - across packages

#### 1.6 Namespaces
- **Basic namespace** - `namespace Utils {}`
- **Nested namespace** - `namespace App.Core {}`
- **Namespace with export** - `export namespace Models {}`
- **[EDGE] Multi-file namespace** - same namespace across files

### 2. Language Features

#### 2.1 Async Patterns
- **async/await function** - `async function fetchData()`
- **Promise return type** - `function returnsPromise(): Promise<T>`
- **Generator function** - `function* sequence()`

#### 2.2 Decorators
- **Class decorator** - `@Singleton class Service {}`
- **Method decorator** - `@Log method() {}`
- **Property decorator** - `@tracked prop: string;`
- **Parameter decorator** - `method(@inject dep: Dependency) {}`
- **[EDGE] Decorator factory** - `@config({}) class Foo {}`

#### 2.3 Access Modifiers
- **public** (default) - `class Foo { public pub: string; }`
- **private** - `class Foo { private priv: string; }`
- **protected** - `class Foo { protected prot: string; }`
- **readonly** - `class Foo { readonly constant: string; }`
- **[EDGE] #private fields** - `class Foo { #privateField: string; }`

#### 2.4 Modules
- **Named export** - `export { Symbol }`
- **Default export** - `export default class DefaultClass`
- **Re-export** - `export * from './other'`
- **[EDGE] Re-export with rename** - `export { foo as bar } from './baz'`

### 3. Dead Code (Never Referenced)

**Purpose:** Test scip-finder's ability to find symbols with zero references.

All dead code must use the `Dead` prefix in names to make it obvious.

#### 3.1 Dead Classes
```typescript
/**
 * [SCIP-DEAD-001] Class never instantiated or referenced
 * References: 0 (intentionally dead)
 * Status: DEAD - should appear in SCIP but have no occurrences beyond definition
 */
export class DeadClass {
  deadMethod(): void {
    console.log('This is never called');
  }
}
```

#### 3.2 Dead Interfaces
```typescript
/**
 * [SCIP-DEAD-002] Interface never implemented or referenced
 * References: 0 (intentionally dead)
 * Status: DEAD
 */
export interface DeadInterface {
  deadProperty: string;
}
```

#### 3.3 Dead Types
```typescript
/**
 * [SCIP-DEAD-003] Type alias never used
 * References: 0 (intentionally dead)
 * Status: DEAD
 */
export type DeadType = string | number;

/**
 * [SCIP-DEAD-004] Generic type never used
 * References: 0 (intentionally dead)
 * Status: DEAD
 */
export type DeadResult<T> = { data: T; error: null };
```

#### 3.4 Dead Functions
```typescript
/**
 * [SCIP-DEAD-005] Function never called
 * References: 0 (intentionally dead)
 * Status: DEAD
 */
export function deadFunction(x: number): number {
  return x * 2;
}

/**
 * [SCIP-DEAD-006] Async function never awaited
 * References: 0 (intentionally dead)
 * Status: DEAD
 */
export async function deadAsyncFunction(): Promise<string> {
  return 'never called';
}
```

#### 3.5 Dead Variables
```typescript
/**
 * [SCIP-DEAD-007] Const never imported or referenced
 * References: 0 (intentionally dead)
 * Status: DEAD
 */
export const DEAD_CONSTANT = 'NEVER_USED';

/**
 * [SCIP-DEAD-008] Enum never referenced
 * References: 0 (intentionally dead)
 * Status: DEAD
 */
export enum DeadEnum {
  DeadValue = 'dead'
}
```

#### 3.6 Dead Methods and Properties
```typescript
export class PartiallyLiveClass {
  liveMethod(): void {
    // This is used
  }

  /**
   * [SCIP-DEAD-009] Method never called
   * References: 0 (intentionally dead)
   * Status: DEAD
   */
  deadMethod(): void {
    console.log('unreachable');
  }

  liveProperty: string = 'used';

  /**
   * [SCIP-DEAD-010] Property never accessed
   * References: 0 (intentionally dead)
   * Status: DEAD
   */
  deadProperty: string = 'unused';
}
```

#### Dead Code Distribution

Place dead code across all three packages:

| Package | Dead Symbols |
|---------|--------------|
| `@tt/alpha` | `DeadAlphaClass`, `deadAlphaFunction`, `DEAD_ALPHA_CONST` |
| `@tt/beta` | `DeadBetaInterface`, `DeadBetaType`, `deadBetaMethod()` |
| `@tt/gamma` | `DeadGammaEnum`, `DEAD_GAMMA_CONSTANT`, `deadGammaUtil()` |

**Testing Strategy for Dead Code:**

```bash
# Query for dead symbol - should find exactly 1 result (the definition)
scip-finder DeadClass

# Expected output:
# gamma/src/dead/DeadClass.ts:3:7: class DeadClass

# Verify no references:
scip-finder DeadClass | grep -v "gamma/src/dead/DeadClass.ts:3:7"
# Should produce no output
```

### 4. SCIP-Specific Edge Cases

#### 4.1 Symbol Collision Cases
- Same symbol name in `@tt/alpha` and `@tt/beta`
- Same symbol name in different files within same package
- Import with alias: `import { Symbol as Alias }`
- Namespace collision: imported symbol vs local symbol

#### 3.2 Import Patterns
- **Default import** - `import Foo from './foo'`
- **Named import** - `import { bar } from './foo'`
- **Namespace import** - `import * as foo from './foo'`
- **Side-effect import** - `import './foo'`
- **Type-only import** - `import type { Type } from './foo'`
- **[EDGE] Mixed type/value import** - `import { Type, value } from './foo'`

#### 3.3 Cross-Package References
- `@tt/alpha` imports class from `@tt/gamma`
- `@tt/beta` imports interface from `@tt/gamma`
- Type from gamma used as generic parameter in alpha
- [EDGE] Exported type from gamma re-exported from beta

#### 3.4 Complex Type References
- Nested generic: `Map<string, Promise<Result<Data>>>`
- Conditional type in function signature
- Indexed access type: `typeof obj[key]`
- keyof operator: `keyof T`
- infer keyword: `infer R` in conditional type

#### 3.5 Declaration Merging
- Interface merging across files
- Namespace + function merging
- Class + interface merging (same name)
- [EDGE] Module augmentation

### 5. File Structure Patterns

```
alpha/
├── src/
│   ├── models/              # Test: nested paths
│   │   ├── User.ts          # Class with all access modifiers
│   │   └── Admin.ts         # Extends User, adds decorators
│   ├── services/
│   │   └── DataService.ts   # Async methods, imports gamma types
│   ├── utils/
│   │   ├── helpers.ts       # Generic functions, overloads
│   │   └── constants.ts     # Const enums, readonly
│   ├── types/
│   │   ├── index.ts         # Type aliases, unions
│   │   └── advanced.ts      # Conditional types, mapped types
│   ├── dead/
│   │   └── DeadAlpha.ts     # DeadAlphaClass, deadAlphaFunction
│   ├── cli.ts               # Entry point: npm run dev:alpha
│   └── index.ts             # Re-exports
├── tsconfig.json
└── package.json

beta/
├── src/
│   ├── api/
│   │   └── Client.ts        # Same-named class as in alpha (collision test)
│   ├── hooks/
│   │   └── useData.ts       # Custom hooks pattern
│   ├── dead/
│   │   └── DeadBeta.ts      # DeadBetaInterface, DeadBetaType
│   ├── cli.ts               # Entry point: npm run dev:beta
│   └── index.ts
├── tsconfig.json
└── package.json

gamma/
├── src/
│   ├── core/
│   │   ├── Base.ts          # Abstract base class
│   │   ├── Types.ts         # Shared interfaces
│   │   └── Logger.ts        # Shared Logger (used by alpha, beta)
│   ├── utils/
│   │   ├── Common.ts        # Utility functions
│   │   └── date.ts          # formatDate (used by beta)
│   ├── dead/
│   │   └── DeadGamma.ts     # DeadGammaEnum, DEAD_GAMMA_CONSTANT
│   └── index.ts             # Re-exports all
├── tsconfig.json
└── package.json

scripts/
└── validate.ts              # Runs all package entry points
```

## Comment Markers for Test Tracking

Each edge case in the code should be marked with a comment indicating:

```typescript
/**
 * [SCIP-001] Basic class declaration
 * Status: SHOULD_WORK
 */
export class SimpleClass {}

/**
 * [SCIP-002] Class with private hash field (#)
 * Status: EXPERIMENTAL - may not be fully supported
 */
export class PrivateFieldTest {
  #field: string;
}

/**
 * [SCIP-003] Same symbol name as beta/src/api/Client.ts
 * Status: COLLISION_TEST - tests package disambiguation
 */
export class Client {}
```

**Status values:**
- `SHOULD_WORK` - Standard feature, expected to work
- `EXPERIMENTAL` - Newer TS feature, may have issues
- `COLLISION_TEST` - Tests name collision handling
- `NOT_SUPPORTED` - Known limitation
- `TO_BE_INVESTIGATED` - Unknown if supported

## Configuration Requirements

### tsconfig.json (each package)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### package.json (each package)

```json
{
  "name": "@tt/alpha",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "dependencies": {
    "@tt/gamma": "workspace:*"
  }
}
```

## Testing Strategy

### Phase 1: Basic Symbol Resolution
1. Build index.scip from all packages
2. Query for unique symbols (no collisions)
3. Verify correct symbol encoding: `scip-typescript npm @tt/gamma 1.0.0 src/...`

### Phase 2: Collision Detection
1. Query for `Client` - should return results from both alpha and beta
2. Verify package disambiguation in output
3. Test `--from` filter with package names

### Phase 3: Cross-Package References
1. Find all usages of gamma types in alpha
2. Verify import symbols are captured
3. Test re-export tracking

### Phase 4: Complex Types
1. Query for generic symbols
2. Verify type parameter symbols
3. Test nested type references

## Index Generation

```bash
# From test-codebase directory
scip-index --no-compatibility

# Expected output:
# - index.scip containing all 3 packages
# - Proper symbol encoding for @tt/* scoped packages
# - All symbols from src/ directories
```

## Code Quality Requirements

### 1. Executable Code (Must Produce Output)

The codebase must be **functional** - not just type definitions. Each consumer package (alpha, beta) must demonstrate runtime execution.

**Entry Points:**

#### alpha/src/cli.ts
```typescript
/**
 * [SCIP-RUN-001] Alpha CLI entry point
 * Status: SHOULD_WORK - demonstrates runtime usage of gamma imports
 */
import { Logger } from '@tt/gamma';
import { User } from './models/User';

export function runAlpha(): void {
  const logger = new Logger();
  const user = new User('Alice', 30);

  logger.log(user.greet());
  console.log('[ALPHA] User:', user.name);
}
```

#### beta/src/cli.ts
```typescript
/**
 * [SCIP-RUN-002] Beta CLI entry point
 * Status: SHOULD_WORK - demonstrates different usage of gamma imports
 */
import { formatDate } from '@tt/gamma';
import { Client } from './api/Client';

export function runBeta(): void {
  const client = new Client('https://api.example.com');
  const timestamp = formatDate(new Date());

  console.log('[BETA] Client:', client.endpoint);
  console.log('[BETA] Time:', timestamp);
}
```

#### gamma/src/core/Logger.ts (shared utility)
```typescript
/**
 * [SCIP-RUN-003] Shared Logger class
 * Status: SHOULD_WORK - used by both alpha and beta
 */
export class Logger {
  log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
}
```

### package.json Scripts

Each package must have:

```json
{
  "scripts": {
    "dev": "tsx src/cli.ts",
    "build": "tsc",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  }
}
```

**Expected Output:**

```bash
$ npm run dev:alpha
[2024-01-15T10:30:00.000Z] Hello, I'm Alice!
[ALPHA] User: Alice

$ npm run dev:beta
[BETA] Client: https://api.example.com
[BETA] Time: 2024-01-15
```

### 2. ESLint Compliance

All code must pass ESLint with zero errors.

#### .eslintrc.json (root, shared by all packages)

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": "off"
  },
  "ignorePatterns": ["dist", "node_modules", "*.js"]
}
```

#### package.json (add dev dependencies)

```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

**Validation:**
```bash
# Must pass with exit code 0
npm run lint

# Expected output:
# (no errors)
```

### 3. Additional Quality Measures (Suggested)

Beyond ESLint, consider these validations:

#### A. TypeScript Strict Mode Verification

```json
// tsconfig.json MUST include:
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Important:** `noUnusedLocals` and `noUnusedParameters` do NOT catch:
- ❌ Unused exported classes
- ❌ Unused exported interfaces
- ❌ Unused exported types
- ❌ Unused exported functions
- ❌ Unused exported constants (enums, vars)

TypeScript intentionally allows unused exports since they're part of your public API.

For dead export detection, use:
- `ts-prune` - finds unused exports
- `ts-unused-exports` - similar tool
- SCIP index comparison (definition with 0 references = dead)

**Dead Code Validation:**

After building `index.scip`, verify dead symbols have exactly 1 occurrence (definition only):

```bash
# Should find exactly 1 result (the definition)
scip-finder DeadAlphaClass | wc -l
# Expected: 1

# Should find exactly 1 result
scip-finder DEAD_GAMMA_CONSTANT | wc -l
# Expected: 1
```

#### B. Type Checking Without Emit
```bash
npm run typecheck  # tsc --noEmit
```
Ensures all types resolve correctly across packages.

#### C. Edge Case Coverage Checklist

Each SCIP test file should have a corresponding marker comment:

```typescript
/**
 * SCIP-EDGE-001: Class with #private field
 * Coverage: YES
 * Tested: scip-finder PrivateClass
 * Expected: Should find the symbol, but may not detect #field
 */
export class PrivateClass {
  #field: string;
}
```

Generate a coverage report:
```bash
npm run test:coverage  # Custom script that parses [SCIP-XXX] markers
```

#### D. Build Verification

Ensure `.d.ts` files are generated correctly:
```bash
npm run build
# Verify: dist/**/*.d.ts files exist and have correct content
```

#### E. Cross-Package Import Validation

Verify that alpha and beta can actually import from gamma:
```typescript
// gamma/src/index.ts - MUST export everything alpha/beta need
export { Logger } from './core/Logger';
export { formatDate } from './utils/formatDate';
// ... all shared symbols
```

#### F. Minimal Runtime Test

Instead of full unit tests (which would add complexity), add a simple validation script:

**scripts/validate.ts**
```typescript
#!/usr/bin/env tsx
import { runAlpha } from '../alpha/src/cli';
import { runBeta } from '../beta/src/cli';
import { Logger } from '@tt/gamma';

const logger = new Logger();

logger.log('Running alpha...');
try {
  runAlpha();
} catch (e) {
  console.error('Alpha failed:', e);
  process.exit(1);
}

logger.log('Running beta...');
try {
  runBeta();
} catch (e) {
  console.error('Beta failed:', e);
  process.exit(1);
}

logger.log('All packages validated successfully!');
```

Run with: `npm run validate`

## Validation Checklist

Before using this codebase for SCIP testing:

### Runtime Validation
- [ ] `npm run dev:alpha` produces output without errors
- [ ] `npm run dev:beta` produces output without errors
- [ ] `npm run validate` runs all entry points successfully
- [ ] Cross-package imports resolve correctly (alpha→gamma, beta→gamma)

### Code Quality Validation
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run typecheck` passes (tsc --noEmit)
- [ ] `npm run build` generates dist/ with .d.ts files

### SCIP Index Validation
- [ ] `scip-index` generates index.scip successfully
- [ ] All `@tt/alpha`, `@tt/beta`, `@tt/gamma` packages present in index
- [ ] Live symbols have >1 occurrences (definition + references)
- [ ] Dead symbols have exactly 1 occurrence (definition only)
- [ ] Collision test: `scip-finder Client` returns results from both alpha and beta

### Documentation
- [ ] All `[SCIP-XXX]` markers are documented in a coverage list

## Future Additions

- [ ] Add `.d.ts` only files for declaration file testing
- [ ] Add circular dependencies (alpha ↔ beta)
- [ ] Add dynamic imports
- [ ] Add JS files with @ts-check comments
