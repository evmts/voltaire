# Review 089: Numeric Primitives

**Modules**: `Uint`, `Int256`, `U256`  
**Severity**: Medium  
**Status**: Open

## Summary

The numeric primitive modules provide Effect-TS wrappers around Ethereum's 256-bit integer types. Overall quality is good, but several issues need attention.

## Critical Issues

### 1. Int256.add Missing from Exports

**Location**: [Int256/index.ts#L74-83](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/index.ts#L74-L83)

The `add` function is documented in the module JSDoc but NOT exported:

```typescript
// JSDoc says:
// Int256.add(a, b)      // Int256Type

// But exports are:
export { sub } from "./sub.js";
export { mul } from "./mul.js";
export { div } from "./div.js";
// Missing: export { add } from "./add.js";
```

The `add.ts` file exists and is correctly implemented but not exported.

**Fix**: Add `export { add } from "./add.js";` to index.ts

### 2. Int256.equals Missing from Exports

**Location**: [Int256/index.ts#L74-83](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/index.ts#L74-L83)

Similarly documented but not exported:

```typescript
// JSDoc says:
// Int256.equals(a, b)   // boolean

// Not in exports!
```

**Fix**: Add `export { equals } from "./equals.js";`

### 3. Uint dividedBy/modulo Documented but Don't Exist

**Location**: [Uint/index.ts#L32](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/index.ts#L32)

Module JSDoc claims these operations exist:
```typescript
// - `plus`, `minus`, `times`, `dividedBy`, `modulo`
```

Neither `dividedBy.ts` nor `modulo.ts` exist in the directory. Directory listing confirms absence.

**Fix**: Either implement these or remove from documentation.

## Medium Issues

### 4. Int256 Has No Tests

**Location**: `Int256/` directory

Unlike Uint which has comprehensive `Uint.test.ts` (568 lines), Int256 has zero test coverage. Critical edge cases untested:
- MIN overflow on negate (`-MIN` overflows)
- Division by zero behavior
- Signed arithmetic wrapping

**Fix**: Create `Int256.test.ts` with tests for:
- Boundary values (MIN, MAX, ZERO)
- Negate overflow
- Division edge cases
- Signed overflow/underflow

### 5. Inconsistent Effect Wrapping

**Location**: Int256 vs Uint operations

Uint operations return `Effect.Effect<T>`:
```typescript
// Uint/plus.ts
export const plus = (a, b): Effect.Effect<Uint256Type> =>
  Effect.sync(() => Uint256.plus(a, b));
```

Int256 operations return plain values:
```typescript
// Int256/add.ts
export const add = (a, b): Int256Type => BrandedInt256.plus(a, b);
```

This inconsistency is confusing for users.

**Fix**: Either:
- Wrap Int256 operations in Effect.sync() for consistency
- Document that Int256 ops are pure (but this seems like API mismatch)

### 6. Int256 Schema Type Guard Too Loose

**Location**: [Int256/BigInt.ts#L12-15](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/BigInt.ts#L12-L15)

```typescript
const Int256TypeSchema = S.declare<Int256Type>(
  (u): u is Int256Type => typeof u === "bigint",  // Only checks bigint!
  { identifier: "Int256" },
);
```

Accepts ANY bigint, doesn't verify range (-2^255 to 2^255-1).

Compare to Uint which properly uses `isUint256()`:
```typescript
const Uint256TypeSchema = S.declare<Uint256Type>(
  (u): u is Uint256Type => isUint256(u),  // Proper validation
  { identifier: "Uint256" },
);
```

**Fix**: Use a proper `isInt256()` type guard that checks range.

## Minor Issues

### 7. Duplicate Schema Declaration Per File

**Location**: Multiple Uint/*.ts and Int256/*.ts files

Each schema file (BigInt.ts, String.ts, Number.ts, etc.) declares its own copy of `Uint256TypeSchema` or `Int256TypeSchema`:

```typescript
// In BigInt.ts
const Uint256TypeSchema = S.declare<Uint256Type>(...);

// In String.ts (same declaration)
const Uint256TypeSchema = S.declare<Uint256Type>(...);
```

**Fix**: Extract to shared `Uint256TypeSchema.ts` and import.

### 8. Missing toPower Test Coverage

**Location**: [Uint.test.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/Uint.test.ts)

`toPower` is exported but has no tests. Edge cases:
- x^0 = 1
- 0^x = 0 (for x>0)
- 0^0 = ?
- Large exponents causing overflow

## Test Coverage Assessment

### Uint Module ✅ Good
- Schema parsing (BigInt, Hex, Number, String, Bytes)
- Arithmetic with overflow wrapping
- Comparison operations
- Bitwise operations
- Utility functions (isZero, isPowerOf2, bitLength, etc.)
- Aggregate functions (min, max, sum, product, gcd, lcm)
- Edge cases (zero, MAX_UINT256)

### Int256 Module ❌ Missing
- No test file exists
- Critical signed operations untested

### U256 Module ⚠️ Indirect
- Alias for Uint, covered by Uint tests

## Recommendations

1. **P0**: Add missing `add` and `equals` exports to Int256
2. **P0**: Fix or remove `dividedBy`/`modulo` documentation from Uint
3. **P1**: Create Int256.test.ts with comprehensive tests
4. **P1**: Fix Int256 schema type guard to validate range
5. **P2**: Unify Effect wrapping pattern between Uint and Int256
6. **P3**: Extract shared schema declarations

## Files Reviewed

- [Uint/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/index.ts)
- [Uint/BigInt.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/BigInt.ts)
- [Uint/Number.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/Number.ts)
- [Uint/String.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/String.ts)
- [Uint/Hex.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/Hex.ts)
- [Uint/Bytes.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/Bytes.ts)
- [Uint/plus.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/plus.ts)
- [Uint/minus.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/minus.ts)
- [Uint/times.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/times.ts)
- [Uint/sum.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/sum.ts)
- [Uint/product.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/product.ts)
- [Uint/toPower.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/toPower.ts)
- [Uint/equals.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/equals.ts)
- [Uint/Uint.test.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Uint/Uint.test.ts)
- [Int256/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/index.ts)
- [Int256/BigInt.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/BigInt.ts)
- [Int256/Number.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/Number.ts)
- [Int256/String.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/String.ts)
- [Int256/Int256Schema.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/Int256Schema.ts)
- [Int256/constants.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/constants.ts)
- [Int256/add.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/add.ts)
- [Int256/sub.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/sub.ts)
- [Int256/mul.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/mul.ts)
- [Int256/div.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/div.ts)
- [Int256/negate.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/negate.ts)
- [Int256/abs.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/abs.ts)
- [Int256/equals.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Int256/equals.ts)
- [U256/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/U256/index.ts)
