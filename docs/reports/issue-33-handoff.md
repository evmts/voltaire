# Issue #33 Continuation: TypeScript Test Failures Handoff

## Mission
Continue fixing TypeScript type errors to reduce test failures. Previous sessions reduced source errors from 1597→1177 (-26%). Target: Get all 18,197 tests passing.

## Current State

```
Test Files  57 failed | 759 passed | 2 skipped (818)
Tests       388 failed | 17732 passed | 182 skipped (18302)
Errors      1177 source errors
```

**Latest commits on `main`**:
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
| **Int128 branded types** | 13 files in `src/primitives/Int128/` | JSDoc casts `/** @type {BrandedInt128} */` |
| **Int256 branded types** | 13 files in `src/primitives/Int256/` | JSDoc casts `/** @type {BrandedInt256} */` |
| **Uint128 branded types** | 18 files in `src/primitives/Uint128/` | JSDoc casts `/** @type {Uint128Type} */` |
| **Uint64 branded types** | 18 files in `src/primitives/Uint64/` | JSDoc casts `/** @type {Uint64Type} */` |
| **Uint32 branded types** | 18 files in `src/primitives/Uint32/` | JSDoc casts `/** @type {Uint32Type} */` |
| **Async test callbacks** | AccountState, PublicKey tests | Added `async` to test callbacks with `await import()` |
| **EIP712 verifyTypedData** | `verifyTypedData.js` | JSDoc cast for array access in loop |
| **Abi.test.js undefined** | `Abi.test.js` | `/** @type {*} */ (item)` instead of `item!` |
| **PublicKey toHex test** | `toHex.test.js` | Added `asPublicKey` helper for branded casts |
| **jsonrpc implicit any** | 5 files in `src/jsonrpc/` | Added JSDoc params for returned functions |
| **createMemoryHost params** | `createMemoryHost.js` | JSDoc types for transient storage |

## Remaining Error Patterns (Priority Order)

### 1. HIGH: undefined/null handling (~100 errors)
```
Argument of type 'number | undefined' is not assignable to parameter of type 'string | number | bigint | boolean'.
Object is possibly 'undefined'.
Type 'bigint | undefined' is not assignable to type 'bigint'.
```

**Fix patterns**:
```javascript
// Option 1: Non-null assertion (only in .ts files)
const value = obj.prop!;

// Option 2: Default value
const value = obj.prop ?? 0n;

// Option 3: Type assertion after check (works in .js)
if (obj.prop !== undefined) {
  return /** @type {bigint} */ (obj.prop);
}

// Option 4: JSDoc cast (works in .js)
const value = /** @type {number} */ (array[i]);
```

### 2. HIGH: ABI Item type compatibility (~70 errors)
```
Argument of type '{ type: string; ... }[]' is not assignable to parameter of type 'readonly Item[]'.
Property 'encodeParams' does not exist on type...
```

**Fix pattern**: Use `as const` for ABI literals or proper type imports:
```typescript
const abi = [{ type: "function", ... }] as const;
// or
import type { Item } from './ItemType.js';
const items: Item[] = [...];
```

### 3. MEDIUM: Implicit `any` parameters (~30 remaining errors)
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

// Or for arrow functions:
const fn = /** @param {string} a */ (a) => { ... }
```

### 4. MEDIUM: Secp256k1SignatureType mismatch (~11 errors)
```
Type '(signature: Secp256k1SignatureType, messageHash: HashType, publicKey: Secp256k1PublicKeyType) => boolean'
is not assignable to type '(signature: ..., hash: Uint8Array, publicKey: Uint8Array) => boolean'.
```

**Fix**: Ensure consistent branded type usage across signature verification functions.

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
