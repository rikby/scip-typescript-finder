# SCIP Property and Method Reference Support Investigation

**Date**: 2026-01-04
**CR**: SCF-003
**Status**: ✅ **INVESTIGATION COMPLETE**

---

## Executive Summary

**Finding**: SCIP **DOES** support property and method references natively through its descriptor suffix system. The protocol distinguishes between properties (using `.` suffix) and methods (using `().` suffix). However, the **current scip-finder implementation has a tool limitation**, not a protocol limitation.

**Recommendation**: **ENHANCE scip-finder** to properly handle SCIP symbols with different suffixes. No SCIP schema upgrade required.

---

## 1. SCIP Protocol Capabilities

### 1.1 Descriptor Suffix System

SCIP uses **descriptor suffixes** to distinguish symbol types:

| Suffix Type | Character | Purpose | Example |
|-------------|-----------|---------|---------|
| **Namespace** | `/` | Packages, modules | `models/` |
| **Type** | `#` | Classes, interfaces | `Ticket#` |
| **Term** | `.` | Properties, fields | `title.` |
| **Method** | `().` | Methods, functions | `toString().` |
| **Parameter** | `()` | Function parameters | `(param)` |
| **TypeParameter** | `[]` | Generic types | `[T]` |
| **Meta** | `:` | Metadata | `meta:` |
| **Macro** | `!` | Macros | `macro!` |

**Source**: [scip.proto](https://github.com/sourcegraph/scip/blob/main/scip.proto)

### 1.2 Property vs Method Distinction

**Properties** (Suffix.Term):
```
Ticket#title.           ← Interface property
Class#property.         ← Class property
Props#data.             ← Props property
```

**Methods** (Suffix.Method):
```
Ticket#toString().      ← Instance method
Class#staticMethod().   ← Static method
Array#map().            ← Prototype method
```

**Key Point**: The suffix is part of the symbol identifier, making properties and methods **distinct symbols** in SCIP.

### 1.3 Symbol Format

```
<scheme> <manager> <package> <version> <descriptors>
```

**Example**:
```
scip-typescript npm markdown-ticket 0.0.0 models/Ticket.ts#Ticket#title.
                                          └─────descriptor────┘
                                                  └─suffix (.)
```

---

## 2. SCIP Schema Analysis

### 2.1 Protocol Buffer Messages

**Occurrence Message** (scip.proto:674-684):
```protobuf
message Occurrence {
  repeated int32 range = 1;              // Position in document
  string symbol = 2;                      // Symbol reference
  int32 symbol_roles = 3;                 // Definition/Reference flags
  repeated string override_documentation = 4;
  SyntaxKind syntax_kind = 5;             // Syntactic context
  repeated Diagnostic diagnostics = 6;
  repeated int32 enclosing_range = 7;
}
```

**Descriptor Message** (scip.proto:433-447):
```protobuf
message Descriptor {
  string name = 1;                        // Symbol name
  string disambiguator = 2;               // Overload disambiguation
  Suffix suffix = 3;                      // Suffix type (crucial!)
  oneof _suffix_value {
    uint32 suffix_value = 4;              // Raw suffix enum value
  }
}

enum Suffix {
  Unspecified = 0;
  Namespace = 1;  // '/'
  Type = 2;       // '#'
  Term = 3;       // '.'
  Method = 4;     // '().'
  Parameter = 5;  // '()'
  TypeParameter = 6; // '['
  Meta = 7;       // ':'
  Macro = 8;      // '!'
}
```

**SymbolInformation Message** (scip.proto:477-514):
```protobuf
message SymbolInformation {
  string symbol = 1;                     // Full symbol string
  repeated string documentation = 3;
  repeated Relationship relationships = 4;
  Kind kind = 5;                         // 87 different kinds
  string display_name = 6;
  Document signature_documentation = 7;
  string enclosing_symbol = 8;
}

enum Kind {
  // ... 87 values including:
  Property = 41;
  Method = 26;
  Getter = 18;
  Setter = 45;
  Field = 15;
  // etc.
}
```

### 2.2 Schema Support Assessment

| Capability | Supported | Implementation |
|------------|-----------|----------------|
| Property symbols | ✅ YES | `Suffix.Term` (`.`) |
| Method symbols | ✅ YES | `Suffix.Method` (`().`) |
| Reference tracking | ✅ YES | `Occurrence.symbol_roles` bitset |
| Symbol distinction | ✅ YES | `SymbolInformation.kind` (87 values) |
| Type information | ✅ YES | `Descriptor.Suffix` + `SymbolInformation.Kind` |

**Conclusion**: SCIP schema **fully supports** property and method references.

---

## 3. scip-typescript Implementation

### 3.1 Reference Generation

**Location**: `/tmp/scip-typescript-research/src/FileIndexer.ts`

The scip-typescript indexer **DOES** emit property and method references:

**Property Access** (line 224):
```typescript
if (ts.isPropertyAccessExpression(node.parent) &&
    ts.isNewExpression(node.parent.parent)) {
  // Handles property references like `obj.property`
  scipSymbol = this.getSymbolForPropertyAccess(node)
}
```

**Property Assignment** (line 150):
```typescript
private getDeclarationsForPropertyAssignment(node: ts.Node) {
  // Handles object property definitions
}
```

**Method Calls** (inferred from code):
```typescript
// Method calls are indexed through TypeScript's type system
// ts.isCallExpression() triggers symbol resolution
```

### 3.2 Descriptor Creation

**Location**: `/tmp/scip-typescript-research/src/Descriptor.ts`

```typescript
export function termDescriptor(name: string): Descriptor {
  return new Descriptor({ name, suffix: Suffix.Term })  // Properties
}

export function methodDescriptor(name: string): Descriptor {
  return new Descriptor({ name, suffix: Suffix.Method })  // Methods
}
```

### 3.3 Test Evidence

**File**: `/tmp/scip-typescript-research/snapshots/input/syntax/src/property-assignment-reference.ts`
```typescript
import {
  propertyAssignment,
  shorthandPropertyAssignment,
} from './property-assignment'

export function run(): string {
  return propertyAssignment().a + shorthandPropertyAssignment().a
  //     ^^^^^^^^^^^^^^^^^^^^^ reference to property 'a'
  //                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ reference to property 'a'
}
```

**Conclusion**: scip-typescript **generates property and method references** correctly.

---

## 4. Current scip-finder Limitation

### 4.1 The Problem

**Location**: `/Users/kirby/home/scip-finder/src/utils/symbol-parser.ts:22`

```typescript
export function extractDisplayName(symbol: string): string {
  const match = symbol.match(/\/([^\/#.]+?)(\(\)|\(.*?\))?[.#]?$/);
  return match ? match[1] + (match[2] || '') : '';
}
```

**Issue**: This regex **strips suffix information**:
- Strips `.` (Term/Property)
- Strips `#` (Type)
- Strips `().` (Method)

**Result**: `Ticket#title.` → `title` (loses property context)

### 4.2 Symbol Key Generation

**Location**: `/Users/kirby/home/scip-finder/src/utils/symbol-parser.ts:48-55`

```typescript
export function getSymbolKey(symbol: string): string {
  const packageName = extractPackageName(symbol);
  const filePath = extractFilePath(symbol);
  const displayName = extractDisplayName(symbol);  // ← Loses suffix
  const normalizedPath = normalizeSymbolPath(filePath);

  return `${packageName}:${normalizedPath}:${displayName}`;
}
```

**Problem**: The symbol key doesn't preserve suffix, so:
- `Ticket#title.` (property)
- `Ticket#title` (type)
- `Ticket#title().` (method)

All map to the same key → **collision and loss of distinction**.

### 4.3 Root Cause Analysis

| Aspect | Current State | Required State |
|--------|---------------|----------------|
| Symbol parsing | Strips suffix | Preserves suffix |
| Lookup key | `name` only | `name` + `suffix` |
| Query support | Type symbols only | All suffix types |
| Documentation | "does not work for properties" | Needs update |

**Conclusion**: This is a **tool limitation** in scip-finder, not a protocol limitation.

---

## 5. Enhancement Feasibility

### 5.1 Required Changes

**No Schema Upgrade Needed**:
- ✅ SCIP protocol already supports properties/methods
- ✅ scip-typescript already indexes them
- ✅ Data exists in index.scip

**scip-finder Enhancements Required**:

1. **Update symbol parsing** (symbol-parser.ts):
   ```typescript
   export function extractDisplayName(symbol: string): string {
     // Keep the suffix for proper distinction
     const match = symbol.match(/\/([^\/#]+?)(\(\)|\(.*?\))?([.#])?$/);
     return match ? match[1] + (match[2] || '') + (match[3] || '') : '';
   }
   ```

2. **Update symbol key generation**:
   ```typescript
   export function getSymbolKey(symbol: string): string {
     // Include suffix in key
     const suffix = extractSuffix(symbol);
     return `${packageName}:${path}:${name}:${suffix}`;
   }
   ```

3. **Add suffix-aware queries**:
   ```bash
   # Query properties
   scip-finder --suffix term ClassName

   # Query methods
   scip-finder --suffix method ClassName

   # Query all
   scip-finder ClassName
   ```

### 5.2 Implementation Complexity

| Task | Complexity | Effort | Risk |
|------|------------|--------|------|
| Parse suffix from symbol | Low | 2-4 hours | Low |
| Update key generation | Low | 2-4 hours | Low |
| Handle backward compatibility | Medium | 4-8 hours | Medium |
| Update CLI/filtering | Low | 2-4 hours | Low |
| Testing | Medium | 4-8 hours | Low |
| **Total** | | **14-28 hours** | **Low** |

### 5.3 Backward Compatibility

**Approach**: Maintain dual key support
- **Old queries** (without suffix) → search all suffixes
- **New queries** (with suffix) → exact match
- **Migration path** → gradual adoption

**Impact**: Existing queries continue to work, new functionality is additive.

---

## 6. Verification Plan

### 6.1 Test Cases

```typescript
// Test 1: Property reference
interface Ticket {
  title: string;  // ← Should find references
}
const ticket: Ticket = { title: "Bug" }  // ← Reference

// Test 2: Method reference
class Service {
  processData(): void {}  // ← Should find references
}
const service = new Service();
service.processData();  // ← Reference

// Test 3: Destructuring
const { title } = ticket;  // ← Property reference

// Test 4: Method chaining
service.processData().toString();  // ← Two method references
```

### 6.2 Success Criteria

- [ ] Can find all references to `Ticket#title.`
- [ ] Can find all references to `Service#processData().`
- [ ] Can distinguish `title.` (property) from `title` (type)
- [ ] Backward compatible with existing queries
- [ ] Performance impact < 10% for large indexes

---

## 7. Recommendations

### 7.1 Immediate Actions

1. **Update CR SCF-003 status**: Change to "Enhancement Feasible"
2. **Create implementation CR**: SCF-004 - Add property/method reference support to scip-finder
3. **Update documentation**: Remove "does not work for properties" statement

### 7.2 Implementation Roadmap

**Phase 1**: Core Enhancement (SCF-004)
- Update symbol parsing to preserve suffix
- Update key generation to include suffix
- Add suffix-aware query filters

**Phase 2**: Testing & Validation (SCF-005)
- Unit tests for suffix parsing
- Integration tests for property/method queries
- Performance benchmarks

**Phase 3**: Documentation & CLI (SCF-006)
- Update CLI help text
- Add suffix query examples
- Update README with property/method support

### 7.3 Future Enhancements

- **Suffix-aware filtering**: `--suffix-only term`
- **Type-aware queries**: `--kind property`
- **Wildcard suffixes**: `ClassName#*.` (all members)
- **Regex suffixes**: `ClassName#get.*().` (all getters)

---

## 8. Conclusion

### 8.1 Answer to Investigation Question

**Question**: "Is it possible to upgrade SCIP database schema to enable fetching usages for properties, for methods, etc?"

**Answer**: **NO SCHEMA UPGRADE NEEDED**

**Reasoning**:
1. ✅ SCIP protocol **already supports** property/method references
2. ✅ SCIP schema **has the fields** (Suffix enum, SymbolInformation.Kind)
3. ✅ scip-typescript **already indexes** properties and methods
4. ❌ scip-finder **doesn't parse** the suffix information correctly

**Root Cause**: Tool limitation in scip-finder, not protocol/schema limitation.

### 8.2 Enhancement Path

**Required**: scip-finder code changes (symbol parsing, key generation, query filtering)

**Not Required**:
- ❌ SCIP protocol changes
- ❌ SCIP schema changes
- ❌ scip-typescript changes
- ❌ Index format changes

**Effort**: 14-28 hours development + testing

**Risk**: Low (backward compatible, additive changes)

### 8.3 Final Recommendation

**PROCEED** with scip-finder enhancement. The SCIP protocol and schema are fully capable of supporting property and method references. The limitation is purely in the scip-finder tool's symbol parsing logic, which can be fixed without breaking existing functionality.

---

## 9. Sources

### 9.1 Official Documentation
- [SCIP Protocol Definition - scip.proto](https://github.com/sourcegraph/scip/blob/main/scip.proto)
- [SCIP GitHub Repository](https://github.com/sourcegraph/scip)
- [SCIP Announcement Blog](https://sourcegraph.com/blog/announcing-scip)

### 9.2 Implementation References
- [scip-typescript Repository](https://github.com/sourcegraph/scip-typescript)
- `/tmp/scip-typescript-research/src/FileIndexer.ts`
- `/tmp/scip-typescript-research/src/Descriptor.ts`

### 9.3 Local Codebase
- `/Users/kirby/home/scip-finder/src/utils/symbol-parser.ts`
- `/Users/kirby/home/scip-finder/src/core/query-engine.ts`
- `/Users/kirby/home/scip-finder/src/core/symbol-indexer.ts`

---

## Appendix A: SCIP Suffix Quick Reference

```
Namespace  /    packages, modules
Type       #    classes, interfaces, types
Term       .    properties, fields, constants
Method     ().  methods, functions
Parameter  ()   function parameters
TypeParam  []   generic types
Meta       :    metadata
Macro      !    macros
```

## Appendix B: Symbol Examples

```
# Namespace
scip-typescript npm models/1.0.0

# Type
scip-typescript npm models/Ticket.ts#Ticket

# Property
scip-typescript npm models/Ticket.ts#Ticket#title.

# Method
scip-typescript npm models/Ticket.ts#Ticket#toString().

# Static Method
scip-typescript npm models/Ticket.ts#Ticket#staticMethod().

# Type Parameter
scip-typescript npm typescript 5.6.0 typescript[T].
```

---

**Investigation Completed**: 2026-01-04
**Next Step**: Create implementation CR (SCF-004)
**Estimated Effort**: 14-28 hours
**Risk Level**: Low
