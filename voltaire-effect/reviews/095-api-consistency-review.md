# Review 095: API Consistency Review

<issue>
<metadata>
priority: P2
files: [
  "voltaire-effect/src/primitives/Address/index.ts",
  "voltaire-effect/src/primitives/Hex/index.ts",
  "voltaire-effect/src/primitives/Bytes/index.ts",
  "voltaire-effect/src/primitives/Hash/index.ts",
  "voltaire-effect/src/primitives/Signature/index.ts",
  "voltaire-effect/src/primitives/Uint/index.ts",
  "voltaire-effect/src/primitives/*/index.ts"
]
reviews: []
</metadata>

<module_overview>
<purpose>
Cross-cutting review of API consistency across all 141 primitive namespaces in voltaire-effect. Evaluates naming conventions, return types, schema naming, export patterns, error types, and JSDoc quality for a unified developer experience.
</purpose>
<current_status>
**MEDIUM severity** - Schema naming and export patterns are consistent. However, significant issues exist:
- Inconsistent `is*` naming (isValid vs isHex vs isBytes vs is)
- Mixed Effect vs plain returns for same operation types
- Missing common utilities across modules
- Error types not exported from some index files
- Some JSDoc claims exports that don't exist
</current_status>
</module_overview>

<findings>
<critical>
None - no correctness issues, only consistency concerns.
</critical>
<high>
### 1. Inconsistent `is*` Naming Pattern (P1)

**Location**: Multiple primitive index.ts files

| Module | Function Name | Expected |
|--------|--------------|----------|
| Address | `isValid` | ✅ `isAddress` or `isValid` |
| Hex | `isHex` | ⚠️ Should be `isValid` or `isHex` (not both) |
| Bytes | `isBytes` | ⚠️ Different from Address pattern |
| Hash | `isValidHex` | ⚠️ Inconsistent with others |
| Signature | `is` AND `isSignature` | ❌ Duplicate exports |
| Uint | (missing) | ❌ No `isUint` or `isValid` |

**Recommendation**: Standardize on `is{Type}` pattern: `isAddress`, `isHex`, `isBytes`, `isHash`, `isSignature`, `isUint`.

### 2. Effect vs Pure Return Type Inconsistency (P1)

**Location**: Hex and Bytes modules

| Module | `equals` Return | `clone` Return |
|--------|-----------------|----------------|
| Address | `boolean` | `AddressType` |
| Hex | `Effect<boolean>` | `Effect<HexType>` |
| Bytes | `Effect<boolean>` | N/A |
| Hash | `boolean` | `HashType` |
| Signature | `boolean` | N/A |
| Uint | `boolean` | `Uint256Type` |

**Problem**: Hex and Bytes return `Effect` for infallible operations. Comparing two typed values should never fail.

```typescript
// Hex module - WRONG
export const equals: (a: HexType, b: HexType) => Effect<boolean>

// Should be pure like Address:
export const equals: (a: HexType, b: HexType) => boolean
```

</high>
<medium>
### 3. Missing Exports Claimed in JSDoc (P2)

**Location**: `Bytes/index.ts` JSDoc vs actual exports

JSDoc claims:
```typescript
* - `equals` - Compare two Bytes values
* - `concat` - Concatenate bytes
* - `slice` - Slice bytes
* - `size` - Get byte length
```

Actually exported: only `isBytes`, `random`

### 4. Missing Common Utilities Across Modules (P2)

| Utility | Address | Hex | Bytes | Hash | Signature | Uint |
|---------|---------|-----|-------|------|-----------|------|
| `clone` | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `equals` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `isZero` | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `random` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `compare` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 5. Signature Has Duplicate `is`/`isSignature` (P2)

**Location**: `Signature/index.ts`

Both `is` and `isSignature` are exported, doing the same thing. Remove one.

### 6. Error Types Not Visible from Index Files (P2)

**Location**: Various primitive modules

Signature module JSDoc mentions `InvalidAlgorithmError` but doesn't export it from index.

</medium>
</findings>

<effect_improvements>
### Reserve Effect for Fallible Operations

```typescript
// Pure operations - no Effect wrapper
export const equals = (a: HexType, b: HexType): boolean => 
  Hex.equals(a, b);

export const clone = (value: HexType): HexType => 
  Hex.clone(value);

// Fallible operations - use Effect
export const fromString = (s: string): Effect<HexType, HexParseError> =>
  Effect.try({
    try: () => Hex.from(s),
    catch: (e) => new HexParseError(e)
  });
```

### Standardize Type Guards

```typescript
// Every primitive module should export:
export const is{Type} = (u: unknown): u is {Type}Type => 
  {Type}.is(u);

// Alias for flexibility:
export const isValid = is{Type};
```
</effect_improvements>

<viem_comparison>
**viem Reference**: Consistent patterns across all modules

viem uses consistent naming:
- `isAddress(value)` - type guard
- `isHex(value)` - type guard  
- `isBytes(value)` - type guard
- All pure functions return plain values, not wrapped

```typescript
// viem patterns
export function isAddress(address: string): address is Address
export function isHex(value: unknown): value is Hex
export function isBytes(value: unknown): value is ByteArray
```
</viem_comparison>

<implementation>
<refactoring_steps>
1. **Standardize `is*` naming** - Use `is{Type}` pattern everywhere
2. **Fix Hex/Bytes Effect returns** - Make pure operations return plain values
3. **Add missing Bytes exports** - Implement equals, concat, slice, size
4. **Remove Signature duplicate** - Keep `isSignature`, remove `is`
5. **Add missing utilities** - random to Address/Signature/Uint, clone to Bytes/Signature
6. **Export error types** - Add error exports to all index files
7. **Fix JSDoc** - Update to match actual exports
</refactoring_steps>
<new_patterns>
```typescript
// Pattern: Consistent primitive module structure
// primitives/{Type}/index.ts

// Schemas
export { Bytes, Hex, String, ... } from "./schemas.js";

// Type
export type { {Type}Type } from "@tevm/voltaire/{Type}";

// Type guard (standardized naming)
export { is{Type} } from "./{Type}.js";
export { is{Type} as isValid } from "./{Type}.js";  // Alias

// Pure utilities
export { equals } from "./equals.js";
export { clone } from "./clone.js";
export { isZero } from "./isZero.js";

// Effect-wrapped utilities (only for fallible ops)
export { from } from "./from.js";  // Can fail on invalid input

// Errors
export { {Type}Error, {Type}ParseError } from "./errors.js";
```
</new_patterns>
</implementation>

<tests>
<missing_coverage>
- Cross-module API consistency tests
- Type guard behavior across all primitives
- Effect vs pure return type verification
- Error type availability tests
</missing_coverage>
<test_code>
```typescript
// api-consistency.test.ts
import { describe, expect, it } from "vitest";
import * as Address from "./Address/index.js";
import * as Hex from "./Hex/index.js";
import * as Bytes from "./Bytes/index.js";
import * as Hash from "./Hash/index.js";
import * as Signature from "./Signature/index.js";
import * as Uint from "./Uint/index.js";

const modules = { Address, Hex, Bytes, Hash, Signature, Uint };

describe("API Consistency", () => {
  describe("Type guard naming", () => {
    it("all modules export isValid or is{Type}", () => {
      for (const [name, mod] of Object.entries(modules)) {
        const hasIs = `is${name}` in mod || "isValid" in mod;
        expect(hasIs, `${name} should have type guard`).toBe(true);
      }
    });
  });

  describe("Pure vs Effect returns", () => {
    it("equals returns boolean, not Effect", () => {
      if ("equals" in Address) {
        const result = Address.equals(
          new Uint8Array(20) as any,
          new Uint8Array(20) as any
        );
        expect(typeof result).toBe("boolean");
      }
    });
  });

  describe("Schema exports", () => {
    it("all modules export Hex schema", () => {
      for (const [name, mod] of Object.entries(modules)) {
        expect("Hex" in mod, `${name} should export Hex schema`).toBe(true);
      }
    });

    it("all modules export Bytes schema", () => {
      for (const [name, mod] of Object.entries(modules)) {
        expect("Bytes" in mod, `${name} should export Bytes schema`).toBe(true);
      }
    });
  });
});
```
</test_code>
</tests>

<docs>
- Create "API Conventions" documentation page
- Document standard primitive module structure
- List all utility functions with Effect vs pure designation
- Add migration guide for Effect return type changes
</docs>

<api>
<changes>
1. Rename type guards to `is{Type}` pattern with `isValid` alias
2. Change Hex.equals, Hex.clone to return plain values
3. Change Bytes.equals (when added) to return boolean
4. Add missing exports: Bytes.equals, Bytes.concat, Bytes.slice, Bytes.size
5. Remove Signature.is (keep Signature.isSignature)
6. Add random to Address, Signature, Uint modules
7. Export all error types from index files
</changes>
</api>

<references>
- [Effect Schema API](https://effect.website/docs/schema)
- [viem utilities](https://viem.sh/docs/utilities/introduction)
- [TypeScript type guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
</references>
</issue>
