---
title: "Milestone 1 Implementation Plan"
description: "Complete TEVM Parity Milestone 1 - TypeScript Integration Layer"
---

# Milestone 1: Forked Read Node - Implementation Plan

## Status

**Zig Core**: ✅ Complete (3,891 lines, 65+ tests passing)
**TypeScript Integration**: 🔨 In Progress

## Overview

Milestone 1 delivers a forked read node that proxies state reads to remote Ethereum chains. Core Zig implementation is complete and tested. This document tracks the TypeScript integration layer implementation.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Integration Test (TypeScript)                                   │
│  - Creates StateManager with forkUrl                            │
│  - Calls StateManager.getBalance(vitalik)                       │
└───────────────────┬─────────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│ StateManager.native.ts (TypeScript FFI Wrapper)                 │
│  - Loads native lib via loadNative()                            │
│  - Calls state_manager_get_balance(handle, address_hex, output) │
└───────────────────┬─────────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│ c_api.zig (C FFI Exports)                                       │
│  - state_manager_get_balance() wrapper                          │
│  - Forwards to Zig StateManager.getBalance()                    │
└───────────────────┬─────────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│ StateManager.zig → JournaledState.zig → ForkBackend.zig         │
│  - Check normal cache → check fork cache → fetch from RPC       │
│  - RPC Client vtable injected from TypeScript                   │
└───────────────────┬─────────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│ TypeScript RPC Client                                           │
│  - Uses fetch() to call Alchemy eth_getProof                    │
│  - Returns AccountState to Zig                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Completed Work (Zig Core)

### State Manager Module (43/43 tests ✅)
- **StateCache.zig** - LRU caching with checkpoint/revert journaling
- **ForkBackend.zig** - RPC client abstraction with vtable pattern
- **JournaledState.zig** - Dual-cache orchestrator (normal + fork)
- **StateManager.zig** - High-level API with snapshot support
- **c_api.zig** - C FFI exports for TypeScript integration

### Blockchain Module (20/20 tests ✅)
- **BlockStore.zig** - Local block storage with canonical chain tracking
- **ForkBlockCache.zig** - Remote block fetching with LRU caching
- **Blockchain.zig** - Unified block access (local + remote)
- **c_api.zig** - C FFI exports for TypeScript integration

## Implementation Phases

### Phase 1: JSON-RPC Server (2-3 hours)

**Goal**: Create JSON-RPC server for StateManager/Blockchain communication

**Files to Create**:
- `src/jsonrpc/types.ts` - JsonRpcRequest, JsonRpcResponse, RpcHandler interfaces
- `src/jsonrpc/server.ts` - HTTP server with request/response handling
- `src/jsonrpc/handlers.ts` - Method dispatch to StateManager/Blockchain

**Methods**:
- `eth_getBalance` → stateManager.getBalance()
- `eth_getCode` → stateManager.getCode()
- `eth_getStorageAt` → stateManager.getStorage()
- `eth_getTransactionCount` → stateManager.getNonce()
- `eth_blockNumber` → blockchain.getCanonicalHead()
- `eth_getBlockByNumber` → blockchain.getBlockByNumber()
- `eth_getBlockByHash` → blockchain.getBlockByHash()

**Verification**: `pnpm test -- jsonrpc`

### Phase 2: Native StateManager Wrappers (3-4 hours)

**Goal**: Create `/native` entrypoint for StateManager

**Files to Create**:
- `src/state-manager/StateManager.native.ts` - FFI wrapper using loadNative()
- `src/state-manager/StateManager/StateManagerType.ts` - Branded types + config
- `src/state-manager/StateManager/index.ts` - Public namespace API
- `src/state-manager/StateManager/*.test.ts` - Tests for each method

**Methods to Wrap**:
- `create(forkUrl)` → StateManagerHandle
- `getBalance(handle, address)` → bigint
- `getNonce(handle, address)` → number
- `getCode(handle, address)` → Uint8Array
- `getStorage(handle, address, slot)` → bigint
- `setBalance(handle, address, balance)` → void
- `setNonce(handle, address, nonce)` → void
- `setCode(handle, address, code)` → void
- `setStorage(handle, address, slot, value)` → void
- `checkpoint(handle)` → void
- `revert(handle)` → void
- `commit(handle)` → void
- `snapshot(handle)` → number (snapshot ID)
- `revertToSnapshot(handle, id)` → void

**Pattern** (following Keccak256.native.ts):
```typescript
// Lazy-load native library
let nativeLib: Awaited<ReturnType<typeof loadNative>> | null = null;
async function ensureLoaded() {
  if (!nativeLib) nativeLib = await loadNative();
  return nativeLib;
}

export async function getBalance(
  handle: StateManagerHandle,
  address: AddressType
): Promise<bigint> {
  const lib = await ensureLoaded();
  const output = allocateOutput(32);
  const addressHex = Address.toHex(address);
  const result = lib.state_manager_get_balance(handle, addressHex, output);
  checkError(result, "getBalance");
  return bytesToBigInt(output);
}
```

**Verification**: `pnpm test -- StateManager.native`

### Phase 3: Native Blockchain Wrappers (2-3 hours)

**Goal**: Create `/native` entrypoint for Blockchain

**Files to Create**:
- `src/blockchain/Blockchain.native.ts` - FFI wrapper
- `src/blockchain/Blockchain/BlockchainType.ts` - Branded types
- `src/blockchain/Blockchain/index.ts` - Public namespace API
- `src/blockchain/Blockchain/*.test.ts` - Tests

**Methods to Wrap**:
- `create(forkCache)` → BlockchainHandle
- `getBlockByNumber(handle, number)` → Block | null
- `getBlockByHash(handle, hash)` → Block | null
- `getCanonicalHead(handle)` → Block
- `putBlock(handle, block)` → void
- `setCanonicalHead(handle, hash)` → void

**Verification**: `pnpm test -- Blockchain.native`

### Phase 4: RPC Client + Integration Test (2 hours)

**Goal**: Create TypeScript RPC client for ForkBackend, test full stack

**Files to Create**:
- `src/provider/RpcClient.ts` - TypeScript RPC client with fetch()
- `src/provider/ForkProvider.ts` - Provider using StateManager + Blockchain
- `tests/integration/fork-read.test.ts` - Integration test with real Alchemy RPC

**RPC Client Methods**:
- `getProof(address, slots, blockTag)` → EthProof
- `getCode(address, blockTag)` → Uint8Array
- `getBlockByNumber(number, fullTx)` → Block
- `getBlockByHash(hash, fullTx)` → Block

**Integration Tests**:
1. Read Vitalik's ETH balance from Mainnet
2. Read USDC contract code from Mainnet
3. Read USDC storage slot from Mainnet
4. Verify cache hit faster than cache miss
5. Read block by number from Mainnet

**Verification**: `ALCHEMY_RPC=<url> pnpm test:integration`

### Phase 5: Final Validation (30 min)

**Goal**: Run acceptance criteria script

**Execute**:
```bash
ALCHEMY_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY \
  pnpm tsx scripts/verify-milestone-1.ts
```

**Expected Output**:
```
============================================================
Milestone 1 Verification: Forked Read Node
============================================================

✅ Test 1: eth_getBalance works in fork mode
✅ Test 2: eth_getCode works in fork mode
✅ Test 3: eth_getStorageAt works in fork mode
✅ Test 4: eth_blockNumber returns fork head
✅ Test 5: eth_getBlockByNumber fetches remote blocks

Tests passed: 5/5

🎉 Milestone 1: PASSED (5/5 criteria)
```

## Key Design Decisions

### 1. FFI Approach
- ✅ Support BOTH `/native` (Bun FFI) AND `/wasm` entrypoints
- Pattern matches existing crypto modules (e.g., Keccak256.native.ts)
- Use existing `src/native-loader/` infrastructure

### 2. JSON-RPC Server
- ✅ Implement NOW as communication layer
- Bridges TypeScript RPC client and Zig state-manager/blockchain
- HTTP server with JSON-RPC 2.0 specification compliance

### 3. RPC Client
- ✅ TypeScript primary (fetch/axios), Zig secondary (std.http.Client)
- TypeScript RPC client with vtable pattern (recommended in fork-backend.md)
- Zig HTTP client example exists (fork-backend-zig-http.zig) as reference

## Code Patterns

### Voltaire TypeScript Pattern
```typescript
// File structure
Module/
  ModuleType.ts      // Branded type definition
  from.js            // Constructor (.js extension!)
  method.js          // Method implementation
  index.ts           // Public API with namespace export

// Dual export pattern
export { method as _method } from "./method.js";  // Internal
export function method(value: Input): Output {
  return _method(from(value));  // Public wrapper
}
```

### Native FFI Pattern
```typescript
// 1. Lazy-load native library
let nativeLib: Awaited<ReturnType<typeof loadNative>> | null = null;
async function ensureLoaded() {
  if (!nativeLib) nativeLib = await loadNative();
  return nativeLib;
}

// 2. Wrap C function
export async function method(data: Uint8Array): Promise<Result> {
  const lib = await ensureLoaded();
  const output = allocateOutput(size);
  const result = lib.c_function_name(data, data.length, output);
  checkError(result, "method");
  return output as Result;
}
```

## Acceptance Criteria

1. ✅ `eth_getBalance` works in fork mode
2. ✅ `eth_getCode` works in fork mode
3. ✅ `eth_getStorageAt` works in fork mode
4. ✅ `eth_blockNumber` returns fork head
5. ✅ `eth_getBlockByNumber` fetches remote blocks

## Testing Strategy

### Unit Tests
- Each FFI wrapper method
- Error handling paths
- Input validation
- Output format verification

### Integration Tests
- Real Alchemy RPC calls
- Cache hit/miss performance
- State read accuracy
- Block fetching correctness

### Acceptance Tests
- Run `scripts/verify-milestone-1.ts`
- All 5 criteria must pass
- Uses real Mainnet data via Alchemy

## Commands Reference

```bash
# Build Zig modules
zig build
zig build test  # 65+ tests should pass

# Build TypeScript
pnpm build

# Test TypeScript wrappers
pnpm test -- StateManager.native
pnpm test -- Blockchain.native

# Integration test (requires ALCHEMY_RPC)
ALCHEMY_RPC=<url> pnpm test:integration

# Final validation
ALCHEMY_RPC=<url> pnpm tsx scripts/verify-milestone-1.ts
```

## Success Metrics

**Completion**:
- [ ] JSON-RPC server implemented (7 methods)
- [ ] StateManager native wrappers (14 methods)
- [ ] Blockchain native wrappers (5 methods)
- [ ] TypeScript RPC client
- [ ] Integration test passes (5 tests)
- [ ] Validation script passes (5/5 criteria)

**Quality**:
- [ ] Type safety (minimal `any` usage)
- [ ] Error messages descriptive
- [ ] Tests cover happy + error paths
- [ ] JSDoc documentation inline
- [ ] No memory leaks

## Estimated Timeline

- Phase 1: 2-3 hours
- Phase 2: 3-4 hours
- Phase 3: 2-3 hours
- Phase 4: 2 hours
- Phase 5: 30 min
- **Total**: 9.5-12.5 hours

## References

- [Zig State Manager](/src/state-manager/StateManager.zig)
- [Zig Blockchain](/src/blockchain/Blockchain.zig)
- [C API Exports](/src/state-manager/c_api.zig)
- [Fork Backend Guide](/docs/fork-backend.md)
- [Native Loader](/src/native-loader/index.ts)
- [Keccak256 Native Example](/src/crypto/Keccak256/Keccak256.native.ts)
- [Milestone 1 Status](/MILESTONE-1-STATUS.md)
- [TEVM Parity Master Plan](/TEVM_PARITY_PLAN.md)
