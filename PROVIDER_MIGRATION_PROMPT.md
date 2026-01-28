# Provider Service Migration: Service Object → Free Functions

## Executive Summary

We are migrating `voltaire-effect` from a **service-object pattern** (not idiomatic Effect.ts) to a **free-function pattern** (idiomatic Effect.ts).

**BEFORE (not idiomatic):**
```typescript
const provider = yield* ProviderService
const balance = yield* provider.getBalance(address)
const block = yield* provider.getBlock({ blockTag: "latest" })
```

**AFTER (idiomatic Effect.ts):**
```typescript
import { getBalance, getBlock } from "voltaire-effect"

const balance = yield* getBalance(address)
const block = yield* getBlock({ blockTag: "latest" })
```

This matches how `@effect/platform` and other Effect.ts ecosystem libraries work.

---

## Architecture Overview

### Current State (Partially Migrated)

```
┌─────────────────────────────────────────────────────┐
│                   Free Functions                     │
│  (CREATED - in src/services/Provider/functions/)    │
│  getBlockNumber, getBalance, call, getLogs, etc.    │
└─────────────────────┬───────────────────────────────┘
                      │ depend on
┌─────────────────────▼───────────────────────────────┐
│                 ProviderService                      │
│  (NEEDS TO BE MINIMAL - only request method)        │
│    { request: (method, params?) => Effect<T, E> }   │
└─────────────────────┬───────────────────────────────┘
                      │ provided by
┌─────────────────────▼───────────────────────────────┐
│              Provider Layer                          │
│  (Delegates to TransportService)                    │
└─────────────────────┬───────────────────────────────┘
                      │ depends on
┌─────────────────────▼───────────────────────────────┐
│              TransportService                        │
│  (HTTP, WebSocket, Browser, Test transports)        │
└─────────────────────────────────────────────────────┘
```

### What's Been Done

1. **Created free functions** in `src/services/Provider/functions/`:
   - 50 free functions covering all provider operations
   - Each function uses `Effect.flatMap(ProviderService, svc => svc.request(...))`
   - Example: `getBalance.ts`, `getBlock.ts`, `call.ts`, `getLogs.ts`, etc.

2. **Created `types.ts`** with all type definitions extracted from old ProviderService

3. **Created `utils.ts`** with helper functions (toAddressHex, parseHexToBigInt, etc.)

4. **Updated `actions/`** (readContract, multicall, simulateContract) to use `call()` free function

5. **Updated ENS functions** to use `call()` free function

### What's BROKEN and Needs Fixing

A previous attempt incorrectly **restored all methods to ProviderShape** instead of updating consumers. This needs to be undone.

**Current broken state:**
- `ProviderService.ts` has a fat `ProviderShape` with all methods (WRONG)
- `Provider.ts` implements all those methods (WRONG)
- Consumers like `DefaultFeeEstimator.ts` still use `provider.getGasPrice()` (WRONG)

**Target state:**
- `ProviderService.ts` has minimal `ProviderShape` with only `request` method
- `Provider.ts` is ~30 lines, just delegates to TransportService
- All consumers use free functions

---

## CRITICAL CONSTRAINTS

1. **DO NOT add methods to ProviderShape** - it must remain minimal with only `request`
2. **DO NOT modify free functions in `functions/`** - they are correct
3. **DO NOT modify TransportService** - it stays unchanged
4. **DO update consumers** to use free functions instead of `provider.method()`

---

## Files to Modify

### 1. ProviderService.ts - Make Minimal

**File:** `voltaire-effect/src/services/Provider/ProviderService.ts`

**Target content:**
```typescript
/**
 * @fileoverview Minimal Provider service for blockchain JSON-RPC operations.
 * @module ProviderService
 * @since 0.0.1
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { TransportError } from "../Transport/TransportError.js";

/**
 * Minimal provider shape - only the request method.
 * All operations are exposed as free functions that use this internally.
 */
export type ProviderShape = {
  readonly request: <T>(
    method: string,
    params?: unknown[],
  ) => Effect.Effect<T, TransportError>;
};

/**
 * Provider service for blockchain JSON-RPC operations.
 * Use free functions (getBalance, getBlock, call, etc.) for operations.
 */
export class ProviderService extends Context.Tag("ProviderService")<
  ProviderService,
  ProviderShape
>() {}

// Re-export all types for convenience
export * from "./types.js";
```

### 2. Provider.ts - Make Minimal

**File:** `voltaire-effect/src/services/Provider/Provider.ts`

**Target content:**
```typescript
/**
 * @fileoverview Live implementation of ProviderService.
 * @module Provider
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportService } from "../Transport/TransportService.js";
import { ProviderService } from "./ProviderService.js";

/**
 * Live implementation layer for ProviderService.
 * Provides the minimal request method that all free functions use.
 * Requires TransportService to be provided.
 */
export const Provider = Layer.effect(
  ProviderService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    return {
      request: <T>(method: string, params?: unknown[]) =>
        transport.request<T>(method, params),
    };
  }),
);
```

### 3. DefaultFeeEstimator.ts - Update to Use Free Functions

**File:** `voltaire-effect/src/services/FeeEstimator/DefaultFeeEstimator.ts`

**Current (WRONG):**
```typescript
const provider = yield* ProviderService;
// ...
const gasPriceValue = yield* provider.getGasPrice()
// ...
const [block, priorityFee] = yield* Effect.all([
  provider.getBlock({ blockTag: "latest" }),
  provider.getMaxPriorityFeePerGas(),
])
```

**Target (CORRECT):**
```typescript
import { getGasPrice, getBlock, getMaxPriorityFeePerGas } from "../Provider/functions/index.js";

// Remove: const provider = yield* ProviderService

// ...
const gasPriceValue = yield* getGasPrice()
// ...
const [block, priorityFee] = yield* Effect.all([
  getBlock({ blockTag: "latest" }),
  getMaxPriorityFeePerGas(),
])
```

**Note:** The Layer still depends on ProviderService, but through the free functions, not by yielding the service directly. Update the Layer type:
```typescript
Layer.Layer<FeeEstimatorService, never, ProviderService>
```
This remains correct because the free functions require ProviderService in their context.

### 4. DefaultNonceManager.ts - Update to Use Free Functions

**File:** `voltaire-effect/src/services/NonceManager/DefaultNonceManager.ts`

**Current (WRONG):**
```typescript
const provider = yield* ProviderService;
const onChainNonce = yield* provider.getTransactionCount(address, "pending")
```

**Target (CORRECT):**
```typescript
import { getTransactionCount } from "../Provider/functions/index.js";

// Remove: const provider = yield* ProviderService
const onChainNonce = yield* getTransactionCount(address, "pending")
```

### 5. Signer/actions/deployContract.ts - Update to Use Free Functions

**File:** `voltaire-effect/src/services/Signer/actions/deployContract.ts`

Look for any usage of `provider.method()` and replace with free function imports.

### 6. Any Other Consumers

Search for patterns like:
- `const provider = yield* ProviderService`
- `provider.getBalance(`
- `provider.getBlock(`
- `provider.call(`
- `provider.getLogs(`
- etc.

And replace with free function imports.

---

## Free Function Pattern Reference

Every free function in `src/services/Provider/functions/` follows this pattern:

```typescript
import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { SomeType, SomeError } from "../types.js";
import { someHelper } from "../utils.js";

export const someOperation = (
  arg1: Type1,
  arg2: Type2 = "default",
): Effect.Effect<ReturnType, ErrorType, ProviderService> =>
  Effect.flatMap(ProviderService, (svc) =>
    svc.request<RpcResponseType>("eth_someMethod", [arg1, arg2]).pipe(
      Effect.map(transformResponse),
      // or Effect.flatMap for validation/error handling
    ),
  );
```

**Key points:**
- Uses `Effect.flatMap(ProviderService, svc => ...)` to access the service
- Calls `svc.request<T>(method, params)` for RPC
- Returns `Effect.Effect<T, E, ProviderService>` - the ProviderService requirement propagates automatically
- Consumers just call `yield* someOperation(args)` and the context requirement is inferred

---

## Available Free Functions

All in `voltaire-effect/src/services/Provider/functions/`:

**Block operations:**
- `getBlockNumber()` → `bigint`
- `getBlock(args?)` → `BlockType`
- `getBlockTransactionCount(args)` → `bigint`
- `getBlockReceipts(args)` → `ReceiptType[]`
- `getUncle(args, index)` → `UncleBlockType`
- `getUncleCount(args)` → `bigint`

**Account operations:**
- `getBalance(address, blockTag?)` → `bigint`
- `getTransactionCount(address, blockTag?)` → `bigint`
- `getCode(address, blockTag?)` → `0x${string}`
- `getStorageAt(address, slot, blockTag?)` → `0x${string}`
- `getProof(address, keys, blockTag?)` → `ProofType`

**Transaction operations:**
- `getTransaction(hash)` → `TransactionType`
- `getTransactionReceipt(hash)` → `ReceiptType`
- `getTransactionByBlockHashAndIndex(hash, index)` → `TransactionType`
- `getTransactionByBlockNumberAndIndex(tag, index)` → `TransactionType`
- `sendRawTransaction(signedTx)` → `0x${string}`
- `waitForTransactionReceipt(hash, opts?)` → `ReceiptType`
- `getTransactionConfirmations(hash)` → `bigint`

**Call/Simulation:**
- `call(request, blockTag?)` → `0x${string}`
- `estimateGas(request, blockTag?)` → `bigint`
- `createAccessList(request, blockTag?)` → `AccessListType`
- `simulateV1(payload)` → `SimulateV1Result`
- `simulateV2(payload)` → `SimulateV2Result`

**Events/Logs:**
- `getLogs(filter)` → `LogType[]`
- `createEventFilter(filter?)` → `FilterId`
- `createBlockFilter()` → `FilterId`
- `createPendingTransactionFilter()` → `FilterId`
- `getFilterChanges(id)` → `FilterChanges`
- `getFilterLogs(id)` → `LogType[]`
- `uninstallFilter(id)` → `boolean`

**Network:**
- `getChainId()` → `bigint`
- `getGasPrice()` → `bigint`
- `getMaxPriorityFeePerGas()` → `bigint`
- `getFeeHistory(count, block, percentiles)` → `FeeHistoryType`
- `getBlobBaseFee()` → `bigint`
- `getSyncing()` → `SyncingStatus`
- `getAccounts()` → `0x${string}[]`
- `getCoinbase()` → `0x${string}`
- `netVersion()` → `string`
- `getProtocolVersion()` → `string`
- `getMining()` → `boolean`
- `getHashrate()` → `bigint`

**Streaming:**
- `watchBlocks(opts?)` → `Stream<BlockStreamEvent>`
- `backfillBlocks(opts)` → `Stream<BlocksEvent>`
- `subscribe(sub, params?)` → `0x${string}`
- `unsubscribe(id)` → `boolean`

**Node-dependent (unlocked accounts):**
- `sendTransaction(tx)` → `0x${string}`
- `sign(address, message)` → `0x${string}`
- `signTransaction(tx)` → `unknown`

---

## Verification Steps

After making changes:

1. **TypeScript check:**
   ```bash
   cd voltaire-effect && pnpm tsc --noEmit
   ```

2. **Run tests:**
   ```bash
   cd voltaire-effect && pnpm test:run
   ```

3. **Verify ProviderShape is minimal:**
   ```bash
   grep -A 10 "export type ProviderShape" src/services/Provider/ProviderService.ts
   ```
   Should show ONLY the `request` method.

4. **Verify no direct provider method calls remain:**
   ```bash
   grep -r "provider\.\(getBalance\|getBlock\|getGasPrice\|call\|getLogs\)" src/services/
   ```
   Should return no matches (except in comments/docs).

---

## Summary

1. Make `ProviderService.ts` minimal (only `request` method)
2. Make `Provider.ts` minimal (~30 lines)
3. Update all consumers to import and use free functions
4. Do NOT add methods back to ProviderShape
5. The free functions in `functions/` are already correct - don't modify them
