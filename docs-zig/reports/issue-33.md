---
title: "Issue #33: TypeScript Test Failures"
date: 2025-12-20
issue: https://github.com/evmts/voltaire/issues/33
status: partial
---

# Issue #33: TypeScript Test Failures

## Summary
Partially fixed TypeScript type errors that were causing test failures. Reduced failures from 425 to 386 (-9%) and source errors from 1597 to 1546 (-3%).

## Problem
Running `bun run test:run` resulted in 393+ test failures across 64+ test files, caused by TypeScript type errors that prevented test collection.

## Root Causes Identified

### Fixed Issues

1. **WithdrawalType incorrect field types**
   - `index`, `validatorIndex`, `amount` used generic `Uint256Type` instead of domain-specific branded types
   - Fix: Updated to use `WithdrawalIndexType`, `ValidatorIndexType`, `GweiType`

2. **batch.ts array access undefined errors**
   - TypeScript strict mode flagged `batch[i]` and `results[i]` as potentially undefined
   - Fix: Added non-null assertions with safety comments

3. **Hardware wallet missing imports/types**
   - `TransactionType.js` didn't exist (should be `types.ts`)
   - Ledger/Trezor dependencies not installed (optional peer deps)
   - `Hex` doesn't have default export
   - `Signature.from` expects Uint8Array, got strings
   - Fix: Fixed imports, added `@ts-expect-error` for optional deps, fixed type casts

4. **Secp256k1.getPublicKey references (41 occurrences)**
   - Tests/docs referenced non-existent `getPublicKey` function
   - Fix: Renamed to `Secp256k1.derivePublicKey` across 17 files

5. **Keccak256Hash merged declaration conflict**
   - Type import conflicted with const export in native module
   - Fix: Renamed type import to `Keccak256HashType`

6. **SHA256Hash return type casting**
   - Functions returned plain Uint8Array instead of branded type
   - Fix: Added JSDoc type casts

7. **UserOperation pack bigint mutation**
   - `>>=` operator on Uint256Type variables violated type safety
   - Fix: Cast to plain bigint before mutation

8. **EIP712 Domain index signature**
   - String indexing without proper type annotation
   - Fix: Added `@type {Record<string, ...>}` annotation

9. **MAX_SAFE_INTEGER typo (4 files)**
   - `Number.MAXSAFEINTEGER` should be `Number.MAX_SAFE_INTEGER`

10. **Bitwise operation undefined checks (3 files)**
    - `Array.pop()` returns `T | undefined`, used without handling
    - Fix: Added JSDoc type assertions after length validation

11. **Frame default Address branding**
    - Default parameters not properly branded
    - Fix: Cast default values to AddressType

12. **P256 Hash type reference**
    - Wrong import for Hash type
    - Fix: Changed to import `HashType` from correct module

## Files Changed

### Implementation Files
- `src/primitives/Withdrawal/WithdrawalType.ts`
- `src/utils/batch.ts`
- `src/wallet/hardware/HardwareWallet.ts`
- `src/wallet/hardware/LedgerWallet.ts`
- `src/wallet/hardware/TrezorWallet.ts`
- `src/crypto/Keccak256/Keccak256.native.ts`
- `src/crypto/SHA256/hashHex.js`
- `src/crypto/SHA256/hashString.js`
- `src/primitives/UserOperation/pack.js`
- `src/crypto/EIP712/Domain/hash.js`
- `src/evm/log/0xa1_LOG1.js`, `0xa2_LOG2.js`, `0xa3_LOG3.js`, `0xa4_LOG4.js`
- `src/evm/bitwise/0x1b_SHL.js`, `0x1c_SHR.js`, `0x1d_SAR.js`
- `src/evm/Frame/from.js`
- `src/crypto/p256.wasm.ts`

### Test Files
- `src/primitives/Transaction/*/getSender.test.ts` (6 files)
- `src/primitives/Transaction/*/Transaction*.test.ts` (2 files)

### Documentation Files
- `docs/dev/crypto-reference.mdx`
- `docs/crypto/keccak256/usage-patterns.mdx`
- `docs/crypto/wallet-integration.mdx`
- `src/primitives/Address/*.mdx` (3 files)
- `src/primitives/Signature/fundamentals.mdx`
- `docs/public/lib/primitives/Address/*.mdx` (3 files)

## Validation

### Before
```
Test Files  70 failed | 746 passed
Tests       425 failed | 17590 passed | 182 skipped
Errors      1597 errors
```

### After
```
Test Files  60 failed | 756 passed
Tests       386 failed | 17629 passed | 182 skipped
Errors      1546 errors
```

### Improvement
- 10 fewer failed test files (70→60)
- 39 fewer failed tests (425→386, -9%)
- 51 fewer source errors (1597→1546, -3%)
- 39 more passing tests (17590→17629)

## Remaining Issues

~3000+ TypeScript errors remain throughout the codebase. Common patterns:
- Branded type mismatches in EVM opcodes
- Undefined/null checks needed in many files
- Implicit `any` parameter types in helper functions
- Type annotation issues in tests

## Architecture Impact
No architectural changes. Fixes maintain existing patterns:
- Branded types for type safety
- JSDoc type casts for JavaScript files
- `@ts-expect-error` for optional dependencies

## Recommendation

Issue #33 understated the scope. The codebase has ~3000+ TypeScript errors that need systematic resolution. Recommend:

1. Create separate issues for each error category
2. Consider relaxing some strictness settings temporarily
3. Prioritize fixing errors in critical paths first
4. Add TypeScript error count to CI metrics

---
_Generated by Claude Code fix-issue command_
