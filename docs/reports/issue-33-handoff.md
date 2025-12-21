# Issue #33 Continuation: TypeScript Test Failures Handoff

## Mission
Continue fixing TypeScript type errors to reduce test failures. Progress: 1597→1177→832 (-48% total). Target: Get all 18,197 tests passing.

## Current State

```
Test Files  57 failed | 759 passed | 2 skipped (818)
Tests       388 failed | 17732 passed | 182 skipped (18302)
Errors      832 source errors
```

**Latest commits on `main`**:
- Session 3: JSDoc type casts, branded types, ABI fixes, FFI usize
- `e96e9aba9` - Add JSDoc type annotations for implicit any params
- `ea33e6f19` - Update issue-33 handoff with session progress
- `bc880aaa8` - Add JSDoc type casts for branded types

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
| **Int128/Int256/Uint* branded types** | ~80 files | JSDoc casts `/** @type {Branded*} */` |
| **Async test callbacks** | AccountState, PublicKey tests | Added `async` to test callbacks with `await import()` |
| **ABI Item type mismatches** | 5 test files | Added `/** @type {ItemType[]} */` annotations |
| **Constructor encodeParams/decodeParams** | `ConstructorType.ts` | Added `ConstructorInstance` interface with methods |
| **Abi.js prototype methods** | `Abi.js` | Added JSDoc types and `/** @type {*} */` casts for `this` |
| **EVM SWAP/PUSH handlers** | ~48 files | JSDoc casts for array access `/** @type {bigint|number} */` |
| **Bytes compare.js files** | ~20 files | Extract variables with JSDoc casts for array access |
| **Error 'unknown' in catch** | 5 test files | Rename `catch(e)` and cast `const error = /** @type {*} */ (e)` |
| **StealthAddress branded casts** | 2 files | JSDoc casts for Secp256k1 params |
| **PublicKey.verify signature** | `verify.js` | Updated JSDoc to match actual Secp256k1 verify signature |
| **FFI usize type** | `native-loader/types.ts` | Replace `FFIType.usize` with `FFIType.u64` |
| **Array<T> generic type** | jsonrpc BatchRequest/Response | Change `@param {Array}` to `@param {Array<*>}` |

## Remaining Error Patterns (Priority Order)

### 1. HIGH: Object/Item possibly undefined (~50 errors)
```
Object is possibly 'undefined'. (26)
'item' is possibly 'undefined'. (25)
```

**Fix pattern**:
```javascript
// Option 1: Type assertion after check
if (obj !== undefined) {
  return /** @type {SomeType} */ (obj);
}

// Option 2: Non-null assertion (only in .ts files)
const value = obj!;

// Option 3: JSDoc cast (works in .js)
const value = /** @type {*} */ (array[i]);
```

### 2. HIGH: bigint/string | undefined (~35 errors)
```
Argument of type 'bigint | undefined' is not assignable to parameter of type 'bigint'. (16+9)
Argument of type 'string | undefined' is not assignable to parameter of type 'string'. (11)
```

**Fix pattern**:
```javascript
const value = /** @type {bigint} */ (maybeUndefined);
// or use default:
const value = maybeUndefined ?? 0n;
```

### 3. MEDIUM: Implicit any (~30 errors)
```
Parameter 'value' implicitly has an 'any' type. (10)
'this' implicitly has type 'any'. (10)
Parameter 'hex' implicitly has an 'any' type. (7)
```

**Fix pattern**:
```javascript
/** @param {string} value */
const fn = (value) => { ... }
```

### 4. MEDIUM: ABI Item type mismatches (15 errors)
```
Argument of type '{ type: string; ... }' is not assignable to parameter of type 'Item'.
```

**Fix pattern**: Use `/** @type {*} */` cast or add `/** @type {ItemType[]} */` to arrays.

### 5. LOW: Address type missing properties (9 errors)
```
Type 'AddressType' is missing properties: toChecksummed, toLowercase...
```

These may require updating the Address type definitions to include instance methods.

### 6. LOW: Branded type conversion (8 errors)
```
Conversion of type 'Uint256Type' to type 'WeiType' may be a mistake.
```

**Fix pattern**: Cast through unknown: `/** @type {WeiType} */ (/** @type {unknown} */ (value))`

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

### Non-null Assertions
**Only work in `.ts` files!** In `.js` files, use JSDoc casts instead:
```javascript
// ❌ Won't work in .js
const value = array[0]!;

// ✅ Works in .js
const value = /** @type {*} */ (array[0]);
```

### Import Paths
Files at `src/primitives/Foo/` should import siblings as `../Bar/` not `../../Bar/`.

## Do NOT
- Use `any` casts unless absolutely necessary
- Remove or disable tests
- Change public API signatures
- Create double-branded types (extends another branded type)
- Skip validation after fixes
- Use non-null assertions (`!`) in `.js` files

## Success Criteria
- All 18,197 tests passing
- Zero source errors in `bun run test:run`
- `zig build test` still passes (no regressions)

---
_Handoff prepared by Claude Code - Issue #33 continuation_
