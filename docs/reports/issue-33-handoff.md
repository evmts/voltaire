# Issue #33 Continuation: TypeScript Test Failures Handoff

## Mission
Continue fixing TypeScript type errors to reduce test failures. Previous sessions reduced source errors from 1597→1341 (-16%). Target: Get all 18,197 tests passing.

## Current State

```
Test Files  60 failed | 756 passed | 2 skipped (818)
Tests       386 failed | 17629 passed | 182 skipped (18197)
Errors      1341 source errors
```

**Latest commit**: `8deb1bbcc` on `main`

## What Was Already Fixed

| Issue | Files | Technique |
|-------|-------|-----------|
| WithdrawalType wrong field types | `src/primitives/Withdrawal/WithdrawalType.ts` | Use domain-specific branded types |
| batch.ts undefined errors | `src/utils/batch.ts` | Non-null assertions `batch[i]!` with safety comment |
| Hardware wallet imports | `src/wallet/hardware/*.ts` | Fix imports, `@ts-expect-error` for optional deps |
| Secp256k1.getPublicKey references | 17 files | Global rename to `derivePublicKey` |
| Keccak256Hash declaration conflict | `src/crypto/Keccak256/Keccak256.native.ts` | Rename type import to avoid conflict |
| SHA256 return types | `src/crypto/SHA256/*.js` | JSDoc type casts `/** @type {SHA256Hash} */` |
| UserOperation bigint mutation | `src/primitives/UserOperation/pack.js` | Cast to `/** @type {bigint} */` before `>>=` |
| EIP712 index signature | `src/crypto/EIP712/Domain/hash.js` | Add `@type {Record<string, ...>}` |
| MAX_SAFE_INTEGER typo | `src/evm/log/0xa*.js` | Fix `MAXSAFEINTEGER` → `MAX_SAFE_INTEGER` |
| Bitwise pop() undefined | `src/evm/bitwise/0x1*.js` | JSDoc cast after length check |
| Frame default params | `src/evm/Frame/from.js` | Cast defaults to `AddressType` |
| P256 Hash import | `src/crypto/p256.wasm.ts` | Import `HashType` not `Hash` namespace |
| **BrandedHash export** | `src/primitives/Hash/BrandedHash.ts` | Added `BrandedHash` alias for `HashType` |
| **Double-branded types** | Multiple `*Type.ts` files | Changed from `Type & { brand: "X" }` to base types |
| **Abi type/value conflict** | Renamed `Abi.ts` → `AbiNamespace.ts` | Avoid TS resolution conflict |
| **from() return types** | `Nonce/from.js`, `Gas/*.js` | Added JSDoc return type casts |
| **Wrong import paths** | ~40 files | Fixed `../../` to `../` for sibling modules |
| **BrandedEventLog export** | `EventLogType.ts` | Added `BrandedEventLog` alias |

## Remaining Error Patterns (Priority Order)

### 1. HIGH: undefined/null handling (~130 errors)
```
Argument of type 'number | undefined' is not assignable to parameter of type 'string | number | bigint | boolean'.
Object is possibly 'undefined'.
Type 'bigint | undefined' is not assignable to type 'bigint'.
```

**Fix patterns**:
```javascript
// Option 1: Non-null assertion (if guaranteed by prior logic)
const value = obj.prop!;

// Option 2: Default value
const value = obj.prop ?? 0n;

// Option 3: Type assertion after check
if (obj.prop !== undefined) {
  return /** @type {bigint} */ (obj.prop);
}
```

### 2. HIGH: Branded type mismatches (~106 errors)
```
Type 'bigint' is not assignable to type 'Uint128Type'.
Type 'bigint' is not assignable to type 'BrandedInt256'.
Type 'number' is not assignable to type 'Uint32Type'.
```

**Fix pattern**:
```javascript
// Before
const value = someBigint;

// After
const value = /** @type {import('./Uint128Type.js').Uint128Type} */ (someBigint);
```

### 3. MEDIUM: Implicit `any` parameters (~40 errors)
```
Parameter 'value' implicitly has an 'any' type.
```

**Fix pattern**:
```javascript
// Before
const fn = (a, b) => { ... }

// After
/** @param {string} a @param {number} b */
const fn = (a, b) => { ... }
```

### 4. MEDIUM: ABI Item type compatibility (~57 errors in tests)
```
Argument of type '{ type: string; ... }[]' is not assignable to parameter of type 'readonly Item[]'.
```

**Fix pattern**: Use proper type assertions or `as const` for ABI items in tests.

## Validation Commands

```bash
# Quick error count
bun run tsc --noEmit 2>&1 | wc -l

# Find specific error patterns
bun run tsc --noEmit 2>&1 | grep "implicitly has an 'any'" | wc -l
bun run tsc --noEmit 2>&1 | grep "possibly 'undefined'" | wc -l

# Error categories breakdown
bun run tsc --noEmit 2>&1 | grep "error TS" | sed 's/.*error /error /' | sort | uniq -c | sort -rn | head -20

# Run tests (includes typecheck)
bun run test:run 2>&1 | tail -20

# Run specific test file
bun run test:run src/evm/arithmetic/0x01_ADD.test.ts
```

## Architecture Context

### Branded Types Pattern
All primitives use branded types for type safety:
```typescript
type AddressType = Uint8Array & { readonly [brand]: "Address" };
type Uint256Type = bigint & { readonly [brand]: "Uint256" };
```

**IMPORTANT**: Do NOT create double-branded types like:
```typescript
// ❌ BAD - creates 'never' type
type NonceType = Uint256Type & { readonly [brand]: "Nonce" };

// ✅ GOOD - single brand
type NonceType = bigint & { readonly [brand]: "Nonce" };
```

### JSDoc for .js Files
Implementation files use `.js` with JSDoc types:
```javascript
/**
 * @param {AddressType} address
 * @returns {import('./NonceType.js').NonceType}
 */
export function toNonce(address) { ... }
```

### Import Paths
Files at `src/primitives/Foo/` should import siblings as `../Bar/` not `../../Bar/`.

## Do NOT
- Use `any` casts unless absolutely necessary
- Remove or disable tests
- Change public API signatures
- Create double-branded types (extends another branded type)
- Skip validation after fixes

## Success Criteria
- All 18,197 tests passing
- Zero source errors in `bun run test:run`
- `zig build test` still passes (no regressions)

---
_Handoff prepared by Claude Code - Issue #33 continuation_
