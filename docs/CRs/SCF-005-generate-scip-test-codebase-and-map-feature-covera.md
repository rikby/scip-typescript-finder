---
code: SCF-005
status: Proposed
dateCreated: 2026-01-05T14:17:53.993Z
type: Feature Enhancement
priority: Medium
---

# Generate SCIP test codebase and map feature coverage

## 1. Description

### Requirements Scope
`brief` — Test codebase generation and coverage mapping

### Problem
- scip-finder tests lack a comprehensive, realistic codebase for validation
- No systematic tracking of which TypeScript features are covered by tests
- Dead code detection cannot be verified without intentionally unused exports
- Cross-package symbol resolution testing requires realistic monorepo structure

### Affected Areas
- Testing: Test fixtures and SCIP index generation
- Documentation: Feature coverage tracking
- Validation: Test codebase must build, run, and pass lint

### Scope
- **In scope**: Generate 3-package monorepo (@tt/alpha, @tt/beta, @tt/gamma) with edge cases, map test coverage
- **Out of scope**: Modifying scip-finder implementation (ticket is about test data only)
- **Reference**: Full specification in `test-codebase/code-suite.md`

## 2. Desired Outcome

### Success Conditions
- Test codebase generates valid `index.scip` via scip-index
- `npm run dev:alpha` and `npm run dev:beta` produce output without errors
- `npm run lint` passes with zero ESLint errors
- SCIP queries find symbols from all three packages correctly
- Dead symbols (prefixed with `Dead`) have exactly 1 occurrence (definition only)
- Collision symbols (same name in alpha/beta) return multiple results

### Constraints
- Must use `test-codebase/code-suite.md` as specification (do not duplicate)
- All packages must be scoped: `@tt/alpha`, `@tt/beta`, `@tt/gamma`
- Dead code must use `Dead` prefix in names
- Linear dependency only: alpha, beta import from gamma (no cycles)
- Must include cli.ts entry points that demonstrate gamma imports

### Non-Goals
- Not modifying scip-finder source code
- Not changing SCIP indexing logic
- Not adding production features to scip-finder

## 3. Open Questions

| Area | Question | Constraints |
|------|----------|-------------|
| Features | What scip-finder features exist to map coverage? | Review SCF-001, SCF-004 tickets |
| Tests | What test patterns exist to understand coverage gaps? | Review tests/ directory |
| Dead Code | Should we integrate ts-prune or rely on SCIP comparison? | SCIP comparison preferred |

### Known Constraints
- Must reference `test-codebase/code-suite.md` (not duplicate content)
- Code must be working TypeScript (build, run, lint)
- Coverage markers must be testable via scip-finder queries

### Decisions Deferred
- Package manager choice (pnpm, npm, yarn)
- Specific test queries for validation
- Integration with CI/CD

## 4. Acceptance Criteria

### Codebase Generation
- [ ] `test-codebase/alpha/` package created with src/cli.ts entry point
- [ ] `test-codebase/beta/` package created with src/cli.ts entry point
- [ ] `test-codebase/gamma/` package created (base library)
- [ ] All three packages scoped as `@tt/*`
- [ ] Dead code files created: `dead/DeadAlpha.ts`, `dead/DeadBeta.ts`, `dead/DeadGamma.ts`
- [ ] Each package has tsconfig.json and package.json
- [ ] Root .eslintrc.json created

### Code Quality
- [ ] `npm run dev:alpha` executes without errors
- [ ] `npm run dev:beta` executes without errors
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run build` generates .d.ts files
- [ ] `npm run typecheck` (tsc --noEmit) passes

### SCIP Validation
- [ ] `scip-index` generates valid index.scip
- [ ] `scip-finder` finds symbols from all three packages
- [ ] Dead symbols return exactly 1 occurrence (definition only)
- [ ] Collision symbols (same name in alpha/beta) return multiple results
- [ ] Cross-package imports (alpha→gamma, beta→gamma) indexed correctly

### Coverage Documentation
- [ ] List of scip-finder features compiled (from SCF-001, SCF-004)
- [ ] Test codebase markers ([SCIP-XXX]) mapped to feature list
- [ ] Coverage gaps documented
- [ ] Dead code coverage verified via SCIP queries

## 5. Verification

### How to Verify Success
- **Code generation**: test-codebase/ directory contains all packages and configs
- **Runtime**: `npm run dev:alpha` and `npm run dev:beta` produce console output
- **Quality**: `npm run lint` and `npm run typecheck` pass
- **SCIP**: `scip-index` succeeds, `scip-finder` queries work correctly
- **Coverage**: Feature list exists with [SCIP-XXX] marker mapping
- **Dead code**: Query for `DeadClass` returns exactly 1 result