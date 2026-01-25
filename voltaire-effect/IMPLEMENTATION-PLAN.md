# Voltaire-Effect Implementation Plan

**Date**: 2026-01-25  
**Status**: Planning  
**Reviews analyzed**: 017-105 + summary documents

---

## Overview

This plan organizes all identified issues into phases where each **step within a phase can be worked in parallel**. Steps are grouped by code locality (touching same files/modules) to minimize merge conflicts.

---

## Phase 1: Critical Runtime Bugs (P0)

**Goal**: Fix bugs that cause incorrect behavior in production

### Step 1.1: NonceManager Race Condition
**Files**: `src/services/NonceManager/DefaultNonceManager.ts`
**Reviews**: 034, 074, 080
- [ ] Replace plain Map with `SynchronizedRef`
- [ ] Use atomic `Ref.modify` for nonce increment
- [ ] Add chainId to nonce key
- [ ] Add concurrency tests

### Step 1.2: HttpTransport Effect Patterns  
**Files**: `src/services/Transport/HttpTransport.ts`
**Reviews**: 017, 018, 019
- [ ] Replace `let requestId` with `Ref.make(0)`
- [ ] Replace manual retry loop with `Effect.retry` + `Schedule`
- [ ] Replace `setTimeout`/`AbortController` with `Effect.timeoutFail` + `Effect.acquireRelease`

### Step 1.3: MemoryCache Global State
**Files**: `src/services/Cache/MemoryCache.ts`
**Reviews**: 020, 021
- [ ] Move Map creation inside `Layer.effect`
- [ ] Store in `SynchronizedRef`
- [ ] Replace `Date.now()` with `Clock.currentTimeMillis`
- [ ] Add test with `TestClock`

### Step 1.4: FallbackTransport Bugs
**Files**: `src/services/Transport/FallbackTransport.ts`
**Reviews**: 033, 043, 075
- [ ] Fix schedule type bug (`Effect.succeed(retryDelay)` → `Schedule.spaced`)
- [ ] Replace mutable array with `Ref<TransportInstance[]>`

### Step 1.5: WebSocketTransport Effect Patterns
**Files**: `src/services/Transport/WebSocketTransport.ts`
**Reviews**: 040, 041, 042, 073
- [ ] Replace `Effect.runSync` with `Runtime.runSync(runtime)` in callbacks
- [ ] Replace `setTimeout` with `Effect.sleep`
- [ ] Replace `setInterval` with `Effect.repeat` + `Schedule.spaced`
- [ ] Use `Effect.forkScoped` for automatic cleanup

### Step 1.6: Provider/BlockStream Runtime Escape
**Files**: `src/services/Provider/Provider.ts`, `src/services/BlockStream/BlockStream.ts`
**Reviews**: 023, 024, 027
- [ ] Capture runtime via `Effect.runtime<never>()`
- [ ] Use `Runtime.runPromise(runtime)` in async callbacks
- [ ] Extract shared `makeEip1193Provider` helper

---

## Phase 2: Critical Type Safety (P1)

**Goal**: Fix incorrect error types that lie about failure modes

### Step 2.1: Bn254/KZG Effect.sync → Effect.try
**Files**: `src/crypto/Bn254/Bn254Service.ts`, `src/crypto/KZG/KZGService.ts`
**Reviews**: 031, 032, 048
- [ ] Replace `Effect.sync` with `Effect.try` for throwing operations
- [ ] Add proper error types to return signatures
- [ ] Fix JSDoc documentation

### Step 2.2: HDWallet Error Types
**Files**: `src/crypto/HDWallet/*.ts`, `src/crypto/Bip39/*.ts`
**Reviews**: 050, 051, 085
- [ ] Standardize `generateMnemonic` return to `string` (not `string[]`)
- [ ] Add `InvalidPathError`, `InvalidSeedError` types
- [ ] Update service shapes with proper error types

### Step 2.3: Contract Thrown Errors → Effect
**Files**: `src/services/Contract/Contract.ts`
**Reviews**: 022
- [ ] Convert `decodeResult` to `decodeResultE` returning Effect
- [ ] Convert `getEventTopic` to `getEventTopicE`
- [ ] Convert `decodeEventLog` to `decodeEventLogE`
- [ ] Update callers to use Effect versions

### Step 2.4: Unsafe Error Casting Fixes
**Files**: `src/crypto/Bls12381/*.ts`, `src/crypto/Secp256k1/*.ts`
**Reviews**: 035, 046
- [ ] Add `instanceof` checks before error casting
- [ ] Wrap unexpected errors in typed error classes
- [ ] Preserve original error as `cause`

### Step 2.5: Abi Error Types
**Files**: `src/primitives/Abi/*.ts`
**Reviews**: 060, 061
- [ ] Add `AbiDecodingError` to `decodeFunction` return type
- [ ] Add Schema validation to `parseItem`

---

## Phase 3: Security Fixes (P1)

**Goal**: Address cryptographic security issues

### Step 3.1: Constant-Time Comparisons
**Files**: `src/crypto/Secp256k1/verify.js`, `src/crypto/Secp256k1/verifyHash.js`, `src/crypto/Secp256k1/sign.js`
**Reviews**: 036, 037, 054
- [ ] Add `constantTimeEqual` utility function
- [ ] Add `constantTimeIsZero` utility function
- [ ] Replace `.every()` with constant-time versions
- [ ] Apply to Address.equals if sensitive

### Step 3.2: Memory Cleanup for Keys
**Files**: `src/crypto/HDWallet/*.js`, `src/crypto/Keystore/decrypt.js`, `src/services/Account/LocalAccount.ts`, `src/services/Account/fromMnemonic.ts`
**Reviews**: 038
- [ ] Add `try/finally` with `.fill(0)` for entropy/seeds
- [ ] Use `Effect.acquireRelease` for scoped key cleanup
- [ ] Clear derivedKey, encryptionKey, macKey in Keystore

### Step 3.3: Contract verifySignature Silent Catch
**Files**: `src/primitives/ContractSignature/verifySignature.js`
**Reviews**: 053
- [ ] Distinguish "invalid signature" from "verification error"
- [ ] Propagate network/encoding errors

---

## Phase 4: FeeEstimator & Provider Fixes (P2)

**Goal**: Fix precision and timing issues

### Step 4.1: FeeEstimator Precision Loss
**Files**: `src/services/FeeEstimator/DefaultFeeEstimator.ts`
**Reviews**: 044
- [ ] Remove `Number()` conversion for baseFee
- [ ] Use bigint arithmetic with basis points
- [ ] Add test with baseFee > 2^53

### Step 4.2: Provider Manual Time Tracking
**Files**: `src/services/Provider/Provider.ts`
**Reviews**: 025
- [ ] Replace manual `remainingTime` with `Schedule.recurUpTo`
- [ ] Use `Effect.timeoutFail` for overall timeout
- [ ] Remove dead retry code in fetchBlock functions (028, 029)

### Step 4.3: Signer Message Retry
**Files**: `src/services/Signer/Signer.ts`
**Reviews**: 026
- [ ] Fix string message retry logic

### Step 4.4: BlockStream Cleanup
**Files**: `src/services/BlockStream/BlockStream.ts`
**Reviews**: 030
- [ ] Add proper cleanup/finalization

---

## Phase 5: Type Safety & API Consistency (P2)

**Goal**: Improve type accuracy and API ergonomics

### Step 5.1: Ed25519 Branded Types
**Files**: `src/crypto/Ed25519/Ed25519Service.ts`
**Reviews**: 045
- [ ] Use branded types for SecretKey, PublicKey, Signature
- [ ] Update parameter and return types

### Step 5.2: Primitives Module Cleanup
**Files**: `src/primitives/Address/*.ts`, `src/primitives/Bytes/*.ts`, `src/primitives/Hex/*.ts`
**Reviews**: 054, 055, 056, 057, 058
- [ ] Consolidate duplicate AddressTypeSchema
- [ ] Export missing Bytes functions (equals, concat, size, toString)
- [ ] Add Bytes32 tests
- [ ] Standardize Effect wrapping (infallible → direct return)

### Step 5.3: Receipt Pre-Byzantium
**Files**: `src/primitives/Receipt/from.js`
**Reviews**: 059
- [ ] Accept `root` field for pre-Byzantium receipts
- [ ] Make `status` optional when `root` present

### Step 5.4: Abi Event Log Topics
**Files**: `src/primitives/Abi/encodeEventLog.ts`
**Reviews**: 062
- [ ] Return `null` for null indexed args (not `"0x"`)
- [ ] Update return type

---

## Phase 6: JSON-RPC Cleanup (P3)

**Goal**: Fix JSON-RPC module issues

### Step 6.1: ID Counter Consolidation
**Files**: `src/jsonrpc/Eth.ts`, `src/jsonrpc/Request.ts`
**Reviews**: 066, 067
- [ ] Remove unused `eth` import
- [ ] Consolidate duplicate `idCounter` to single source
- [ ] Export `nextId` from Request.ts

### Step 6.2: Ethereum Error Codes
**Files**: `src/jsonrpc/Error.ts`
**Reviews**: 068
- [ ] Add EIP-1193 provider error codes
- [ ] Add common Ethereum RPC error codes
- [ ] Add helper methods (`isUserRejected`, etc.)

---

## Phase 7: ERC Standards Completeness (P3)

**Goal**: Complete ERC-20/721/1155 implementations

### Step 7.1: ERC20 View Encoders
**Files**: `src/standards/ERC20.ts`
**Reviews**: 063
- [ ] Add `encodeTotalSupply`, `encodeName`, `encodeSymbol`, `encodeDecimals`
- [ ] Add corresponding result decoders

### Step 7.2: ERC721 Query Encoders
**Files**: `src/standards/ERC721.ts`
**Reviews**: 064
- [ ] Add `encodeBalanceOf`, `encodeGetApproved`, `encodeIsApprovedForAll`
- [ ] Add `encodeSafeTransferFromWithData`

### Step 7.3: ERC1155 Batch Methods
**Files**: `src/standards/ERC1155.ts`
**Reviews**: 065
- [ ] Add `encodeBalanceOfBatch`, `encodeSafeBatchTransferFrom`
- [ ] Add `decodeTransferBatchEvent`, `decodeURIEvent`

---

## Phase 8: Test Coverage (P2-P3)

**Goal**: Add missing tests

### Step 8.1: Crypto Edge Case Tests
**Files**: `src/crypto/*/tests`
**Reviews**: 039, 047, 049
- [ ] Ed25519: empty message, max key
- [ ] Secp256k1: max valid private key, reject key >= n
- [ ] BLS12-381: fix 48 vs 96 byte assertion, invalid point tests
- [ ] Bn254/KZG: error condition tests

### Step 8.2: Primitives Tests
**Files**: `src/primitives/*/tests`
**Reviews**: 055, 069, 070
- [ ] Add Bytes32 tests
- [ ] Add RLP edge case tests (16MB+ data, nested empty lists, overflow)
- [ ] Add Signature edge case tests (yParity, large chainId, r/s=0)

### Step 8.3: Abi Tests
**Files**: `src/primitives/Abi/tests`
**Reviews**: 071
- [ ] Add comprehensive Abi tests

---

## Phase 9: Effect Idiomatic Patterns (P2)

**Goal**: Improve Effect usage throughout

### Step 9.1: BatchScheduler Refactor
**Files**: `src/services/Transport/BatchScheduler.ts`
**Reviews**: 072
- [ ] Replace async/await with Effect Queue + Fiber

### Step 9.2: Remove @ts-nocheck
**Files**: `src/crypto/Secp256k1/*.js`
**Reviews**: 052
- [ ] Remove `@ts-nocheck` directives
- [ ] Add proper JSDoc types or `.d.ts` files

---

## Phase 10: Viem Parity Features (P1-P2)

**Goal**: Add missing features for viem parity

### Step 10.1: Transaction Type Support
**Files**: New files in `src/primitives/Transaction/`
**Reviews**: 004
- [ ] Add EIP-2930 access list transactions
- [ ] Add EIP-1559 fee market transactions
- [ ] Add EIP-4844 blob transactions

### Step 10.2: Multicall Implementation
**Files**: New `src/services/Multicall/`
**Reviews**: 008
- [ ] Add Multicall3 contract calls
- [ ] Add batching support

### Step 10.3: Transport Batching
**Files**: `src/services/Transport/`
**Reviews**: 010
- [ ] Add JSON-RPC batching
- [ ] Use Effect.request pattern

---

## Phase 11: Effect Layer Patterns (P2)

**Goal**: Improve Effect architecture

### Step 11.1: Schema for Types
**Files**: All primitive types
**Reviews**: 076
- [ ] Use Effect Schema for type validation

### Step 11.2: Request/Resolver for Provider
**Files**: `src/services/Provider/Provider.ts`
**Reviews**: 077
- [ ] Add Request/Resolver pattern for batching

### Step 11.3: Layer Composition Patterns
**Files**: All service layers
**Reviews**: 078
- [ ] Standardize layer composition

### Step 11.4: Stream Patterns
**Files**: `src/services/BlockStream/`
**Reviews**: 079
- [ ] Build native Effect Streams (not AsyncGenerator wrappers)

### Step 11.5: Error Patterns
**Files**: All error types
**Reviews**: 080
- [ ] Use `Data.TaggedError` consistently

### Step 11.6: Config Patterns
**Files**: All configuration
**Reviews**: 081
- [ ] Use `Config` for configuration

### Step 11.7: Duration Consistency
**Files**: All time-related code
**Reviews**: 082
- [ ] Use `Duration` instead of raw milliseconds

### Step 11.8: Tracing
**Files**: All services
**Reviews**: 083
- [ ] Add tracing spans

---

## Phase 12: Advanced Viem Features (P2-P3)

**Goal**: Advanced feature parity

### Step 12.1: State Overrides
**Reviews**: 086
- [ ] Add stateOverride to call/estimateGas

### Step 12.2: Signature Utilities
**Reviews**: 087
- [ ] Add verifyMessage, verifyTypedData, recoverAddress

### Step 12.3: Blob/KZG Utilities
**Reviews**: 088
- [ ] Add EIP-4844 blob utilities

### Step 12.4: SIWE Support
**Reviews**: 089
- [ ] Add Sign-In with Ethereum

### Step 12.5: Unit Conversion
**Reviews**: 090
- [ ] Add parseEther, formatEther, formatUnits

### Step 12.6: Contract Helpers
**Reviews**: 091
- [ ] Add Contract.estimateGas, Contract.deploy

### Step 12.7: Event Subscriptions
**Reviews**: 092
- [ ] Add watchEvent, watchContractEvent

---

## Summary

| Phase | Priority | Steps | Can Parallel |
|-------|----------|-------|--------------|
| 1 - Runtime Bugs | P0 | 6 | Yes |
| 2 - Type Safety | P1 | 5 | Yes |
| 3 - Security | P1 | 3 | Yes |
| 4 - FeeEstimator/Provider | P2 | 4 | Yes |
| 5 - API Consistency | P2 | 4 | Yes |
| 6 - JSON-RPC | P3 | 2 | Yes |
| 7 - ERC Standards | P3 | 3 | Yes |
| 8 - Tests | P2-P3 | 3 | Yes |
| 9 - Effect Idioms | P2 | 2 | Yes |
| 10 - Viem Features | P1-P2 | 3 | Yes |
| 11 - Effect Patterns | P2 | 8 | Yes |
| 12 - Advanced Features | P2-P3 | 7 | Yes |

**Total**: 50 parallelizable steps across 12 phases

---

## Execution Notes

1. **Phase 1 is blocking** - complete before merging other phases
2. **Phase 2 & 3** can run in parallel after Phase 1
3. **Phases 4-9** can run in parallel after Phase 2
4. **Phases 10-12** are feature additions, can be interleaved

Each step should:
1. Create a branch from main
2. Implement changes
3. Run `zig build test && pnpm test:run`
4. Submit PR with review reference(s)
