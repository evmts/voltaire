# StateManager FFI Boundary Documentation

## Overview

The StateManager FFI layer bridges Zig implementation with TypeScript, providing state management with optional fork backend support. This document specifies memory ownership, async patterns, and cross-language boundaries.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  TypeScript (index.ts)                              │
│  - StateManager class wrapper                       │
│  - Async/await API                                  │
│  - Pending request tracking                         │
│  - RpcClientAdapter integration                     │
└──────────────┬──────────────────────────────────────┘
               │ FFI Boundary (bigint handles)
               ▼
┌─────────────────────────────────────────────────────┐
│  Zig (c_api.zig)                                    │
│  - Opaque handles (StateManagerHandle)              │
│  - C calling convention exports                     │
│  - String/buffer conversions                        │
│  - RPC vtable management                            │
└──────────────┬──────────────────────────────────────┘
               │ Internal Zig API
               ▼
┌─────────────────────────────────────────────────────┐
│  Zig Internal (StateManager.zig, ForkBackend.zig)   │
│  - State operations                                 │
│  - Cache management                                 │
│  - Checkpoint/snapshot tracking                     │
│  - RPC client vtable invocation                     │
└─────────────────────────────────────────────────────┘
```

---

## Memory Ownership

### Handle Ownership

**Rule**: TypeScript owns handles, Zig owns pointed-to memory.

```typescript
// TypeScript creates handle
const handle = ffi.state_manager_create();  // Zig allocates StateManager
// ...use handle...
ffi.state_manager_destroy(handle);          // Zig frees StateManager
```

**Lifecycle**:
1. `state_manager_create()` → Zig allocates `StateManager` struct
2. Returns opaque handle (`*anyopaque` cast to `bigint`)
3. TypeScript stores handle as `bigint`
4. `state_manager_destroy(handle)` → Zig frees `StateManager`

**Invariants**:
- Handle MUST be destroyed exactly once
- Using handle after destroy is undefined behavior
- Handles are NOT transferable across FFI library loads

---

### String Buffers

**Rule**: Caller allocates buffers, callee writes, caller frees.

#### Input Strings (TypeScript → Zig)

```typescript
// TypeScript owns string
const addressHex = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

// Zig receives as [*:0]const u8 (null-terminated C string)
ffi.state_manager_get_balance_sync(handle, addressHex, outBuffer, 67);
//                                         ^^^^^^^^^^
//                                         TS string → C string (auto by runtime)
```

**Ownership**: TypeScript owns input strings. Zig MUST NOT free them.

#### Output Buffers (Zig → TypeScript)

```typescript
// TypeScript allocates buffer
const buffer = new Uint8Array(67);  // "0x" + 64 hex + null terminator

// Zig writes into buffer
const result = ffi.state_manager_get_balance_sync(
  handle,
  addressHex,
  buffer,   // ← Zig writes here
  67        // ← buffer length
);

// TypeScript owns buffer, reads result
const hex = new TextDecoder().decode(buffer.subarray(0, buffer.indexOf(0)));
```

**Ownership**: TypeScript owns output buffers. Zig MUST NOT allocate or free.

**Buffer Sizes**:
- Balance/storage: 67 bytes (`"0x" + 64 hex digits + null`)
- Nonce: `BigUint64Array(1)` (8 bytes)
- Code: Variable length (call `get_code_len_sync` first)

---

### Code Buffers (Variable Length)

**Pattern**: Two-phase fetch (length → data)

```typescript
// Phase 1: Get length
const lenBuffer = new BigUint64Array(1);
ffi.state_manager_get_code_len_sync(handle, addressHex, lenBuffer);
const codeLen = Number(lenBuffer[0]);

// Phase 2: Allocate buffer and fetch
const codeBuffer = new Uint8Array(codeLen);
ffi.state_manager_get_code_sync(handle, addressHex, codeBuffer, codeLen);
```

**Ownership**: TypeScript allocates after knowing length, Zig writes, TypeScript frees.

---

## Async RPC Pattern

### Problem

Fork backend needs to fetch state from remote RPC (async), but Zig doesn't have built-in async runtime. Solution: **Callback continuations**.

### Design

**Components**:
1. **RPC Client VTable** (Zig struct with function pointers)
2. **Pending Requests Map** (TypeScript `Map<requestId, {resolve, reject}>`)
3. **Callback Functions** (TypeScript → Zig → TypeScript)

### Flow

```
TypeScript                      Zig                        Remote RPC
    │                            │                              │
    │ getBalance(address)        │                              │
    ├──────────────────────────► │                              │
    │                            │ Check cache (miss)           │
    │                            │                              │
    │                            │ Generate request_id          │
    │                            │                              │
    │                            │ vtable.getProof()            │
    │                            ├────────────────────────────► │
    │                            │                              │
    │                            │ ◄────────────────────────────┤
    │                            │ (async result)               │
    │                            │                              │
    │ callback(request_id, ...)  │                              │
    │ ◄──────────────────────────┤                              │
    │                            │                              │
    │ resolve(promise)           │                              │
    │                            │                              │
```

### Implementation (Placeholder)

**Current**: Synchronous mock (fork backend waits for RPC)

```zig
// ForkBackend.fetchAccount() - CURRENT (blocking)
const proof = try self.rpc_client.getProof(address, slots, block_tag);
// ↑ This blocks Zig thread waiting for RPC
```

**Future**: Async callback pattern

```zig
// ForkBackend.fetchAccount() - FUTURE (non-blocking)
const request_id = generateRequestId();
self.pending_requests.put(request_id, .{ .callback = callback });
try self.rpc_client.getProof(address, slots, block_tag, request_id);
// Returns immediately, callback invoked later
```

```typescript
// TypeScript RPC vtable wrapper
const getProofVtable = (
  ptr: bigint,
  address: Uint8Array,
  slots: bigint,
  blockTag: string,
  requestId: string
) => {
  // Store callback
  pendingRequests.set(requestId, { resolve, reject });

  // Execute async RPC
  httpProvider.request({ method: 'eth_getProof', params: [...] })
    .then(result => {
      // Invoke Zig callback
      zigCallback(requestId, JSON.stringify(result), 0);
    })
    .catch(error => {
      zigCallback(requestId, "", -4); // STATE_MANAGER_ERROR_RPC_FAILED
    });
};
```

**Status**: Not implemented in current version. Current implementation is **synchronous** (Zig waits for RPC).

---

## WASM vs Native Differences

### Native (Node.js, Bun FFI)

- **Handles**: Real pointers (`*StateManager` → `bigint`)
- **Strings**: Direct memory access (zero-copy for C strings)
- **Callbacks**: Function pointers via `dlsym` or Bun FFI
- **Threading**: Possible (if Zig uses threads)

### WASM (Browser, Node.js WASM)

- **Handles**: WASM memory offsets (not real pointers)
- **Strings**: Must copy across JS/WASM boundary
- **Callbacks**: `Table` with function indices
- **Threading**: Not supported (single-threaded)
- **Memory**: Linear WASM memory, must manage growth

### Current Implementation

**Synchronous only** - works in both:
- Native: Direct function calls
- WASM: Module imports/exports

**Async RPC** - requires different implementation:
- Native: Callback function pointers
- WASM: `Table` + message passing

---

## Error Handling

### Error Codes (c_api.zig)

```zig
pub const STATE_MANAGER_SUCCESS: c_int = 0;
pub const STATE_MANAGER_ERROR_INVALID_INPUT: c_int = -1;
pub const STATE_MANAGER_ERROR_OUT_OF_MEMORY: c_int = -2;
pub const STATE_MANAGER_ERROR_INVALID_SNAPSHOT: c_int = -3;
pub const STATE_MANAGER_ERROR_RPC_FAILED: c_int = -4;
pub const STATE_MANAGER_ERROR_INVALID_HEX: c_int = -5;
```

### TypeScript Error Mapping

```typescript
const result = ffi.state_manager_get_balance_sync(handle, address, buffer, 67);

if (result !== STATE_MANAGER_SUCCESS) {
  switch (result) {
    case STATE_MANAGER_ERROR_INVALID_HEX:
      throw new Error(`Invalid hex address: ${address}`);
    case STATE_MANAGER_ERROR_RPC_FAILED:
      throw new Error('RPC request failed');
    case STATE_MANAGER_ERROR_OUT_OF_MEMORY:
      throw new Error('Out of memory');
    default:
      throw new Error(`StateManager error: ${result}`);
  }
}
```

### Zig Error Handling

```zig
export fn state_manager_get_balance_sync(...) callconv(.C) c_int {
    const addr = Address.from(addr_slice) catch return STATE_MANAGER_ERROR_INVALID_HEX;
    const balance = manager.getBalance(addr) catch return STATE_MANAGER_ERROR_RPC_FAILED;
    // ...
    return STATE_MANAGER_SUCCESS;
}
```

**Pattern**: Zig catches errors, returns error codes. TypeScript checks codes, throws exceptions.

---

## Type Conversions

### Address

```typescript
// TypeScript → Zig
const addressHex = Address.toHex(address);  // → "0x742d35..."
ffi.state_manager_get_balance_sync(handle, addressHex, ...);

// Zig receives
const addr_slice = std.mem.span(address_hex);  // [*:0]const u8 → []const u8
const addr = Address.from(addr_slice) catch ...;  // → Address (20 bytes)
```

### Balance / Storage (u256)

```typescript
// Zig → TypeScript
// Zig writes: "0x00000000000000000000000000000000000000000000000000000000000003e8"
const hexString = new TextDecoder().decode(buffer.subarray(0, nullIndex));
const balance = BigInt(hexString);  // → 1000n

// TypeScript → Zig
const balanceHex = `0x${balance.toString(16)}`;  // 1000n → "0x3e8"
ffi.state_manager_set_balance(handle, addressHex, balanceHex);
```

### Code (Bytes)

```typescript
// Zig → TypeScript
const codeBuffer = new Uint8Array(codeLen);
ffi.state_manager_get_code_sync(handle, addressHex, codeBuffer, codeLen);
const hex = Hex.fromBytes(codeBuffer);  // Uint8Array → "0x6060..."

// TypeScript → Zig
const codeBytes = Hex.toBytes(code);  // "0x6060..." → Uint8Array
ffi.state_manager_set_code(handle, addressHex, codeBytes, codeBytes.length);
```

---

## Snapshot Mechanics

### Snapshot vs Checkpoint

| Feature       | Checkpoint                  | Snapshot                       |
|---------------|-----------------------------|--------------------------------|
| **Purpose**   | EVM execution rollback      | Testing (tevm_snapshot/revert) |
| **Granularity** | Stack-based (LIFO)        | Random-access by ID            |
| **ID**        | None (implicit depth)       | Explicit u64 ID                |
| **Revert**    | Pop one level               | Revert to specific ID          |

### Checkpoint (Internal)

```typescript
await manager.checkpoint();      // Push state to stack
await manager.setBalance(...);   // Modify state
manager.revert();                // Pop stack (discard changes)
// OR
manager.commit();                // Merge into parent
```

**Zig implementation**:
```zig
pub fn checkpoint(self: *StateManager) !void {
    try self.journaled_state.checkpoint();  // Pushes to all 3 caches
}

pub fn revert(self: *StateManager) void {
    self.journaled_state.revert();  // Pops from all 3 caches
}
```

### Snapshot (Testing)

```typescript
const snapId = await manager.snapshot();   // Returns snapshot ID (e.g., 0)
await manager.setBalance(...);             // Modify state
await manager.revertToSnapshot(snapId);    // Revert to snapshot 0
```

**Zig implementation**:
```zig
pub fn snapshot(self: *StateManager) !u64 {
    const snapshot_id = self.snapshot_counter;
    self.snapshot_counter += 1;

    // Store current checkpoint depth
    const depth = self.getCheckpointDepth();
    try self.snapshots.put(snapshot_id, depth);

    // Create checkpoint
    try self.journaled_state.checkpoint();

    return snapshot_id;
}

pub fn revertToSnapshot(self: *StateManager, snapshot_id: u64) !void {
    const target_depth = self.snapshots.get(snapshot_id) orelse return error.InvalidSnapshot;
    const current_depth = self.getCheckpointDepth();

    // Revert multiple times to reach target depth
    var i: usize = 0;
    while (i < (current_depth - target_depth)) : (i += 1) {
        self.journaled_state.revert();
    }

    // Remove snapshot and all newer snapshots
    // ...
}
```

---

## Testing Strategy

### Unit Tests (Zig)

```zig
test "c_api - create and destroy" {
    const handle = state_manager_create();
    try std.testing.expect(handle != null);
    state_manager_destroy(handle.?);
}

test "c_api - get/set balance" {
    const handle = state_manager_create().?;
    defer state_manager_destroy(handle);

    const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    var buffer: [67]u8 = undefined;

    // Set balance
    const result1 = state_manager_set_balance(handle, addr, "0x3e8");
    try std.testing.expectEqual(STATE_MANAGER_SUCCESS, result1);

    // Get balance
    const result2 = state_manager_get_balance_sync(handle, addr, &buffer, 67);
    try std.testing.expectEqual(STATE_MANAGER_SUCCESS, result2);

    const hex = std.mem.span(@as([*:0]u8, @ptrCast(&buffer)));
    try std.testing.expect(std.mem.endsWith(u8, hex, "3e8"));
}
```

### Integration Tests (TypeScript)

```typescript
import { describe, test, expect } from 'vitest';
import { StateManager } from './index.js';
import * as Address from '../../primitives/Address/index.js';

describe('StateManager FFI', () => {
  test('create and destroy', () => {
    const manager = new StateManager({ ffi: ffiExports });
    expect(manager).toBeDefined();
    manager.destroy();
  });

  test('get/set balance', async () => {
    const manager = new StateManager({ ffi: ffiExports });
    const addr = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    await manager.setBalance(addr, 1000n);
    const balance = await manager.getBalance(addr);

    expect(balance).toBe(1000n);
    manager.destroy();
  });

  test('snapshot and revert', async () => {
    const manager = new StateManager({ ffi: ffiExports });
    const addr = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    await manager.setBalance(addr, 1000n);
    const snapId = await manager.snapshot();

    await manager.setBalance(addr, 2000n);
    expect(await manager.getBalance(addr)).toBe(2000n);

    await manager.revertToSnapshot(snapId);
    expect(await manager.getBalance(addr)).toBe(1000n);

    manager.destroy();
  });
});
```

---

## Performance Considerations

### Cache Hit Rates

**Optimal**: 90%+ cache hit rate for fork mode
**Monitor**: Track cache hits vs RPC calls

```typescript
// Future: Add metrics
manager.getMetrics() → {
  cacheHits: 1234,
  cacheMisses: 56,
  rpcCalls: 56,
  hitRate: 0.957  // 95.7%
}
```

### Memory Usage

**StateManager**: ~1KB base + cache overhead
**Fork Cache**: `max_cache_size * (account_size + storage_slots + code_size)`
  - Default: 10,000 entries
  - Account: ~100 bytes each
  - Storage: ~50 bytes per slot
  - Code: Variable (can be large)

**Estimate**: 10MB - 100MB for typical fork usage

### RPC Latency

**Blocking calls**: Current implementation blocks Zig thread
- HTTP: ~50-200ms per request
- Impact: State access stalls until RPC returns

**Future async**: Non-blocking with callbacks
- State access returns immediately
- Callback invoked when RPC completes
- Better throughput with concurrent requests

---

## Future Work

### Async RPC Implementation

1. **Zig side**: Request ID generation, callback storage
2. **TypeScript side**: Promise tracking, vtable with async wrapper
3. **Testing**: Mock RPC client with controllable delays
4. **WASM**: Message passing via `postMessage`

### Batch RPC Calls

Fetch multiple accounts/slots in single `eth_getProof` call:
```typescript
await rpcClient.getProof(address, [slot1, slot2, slot3], blockTag);
```

### Metrics and Observability

Export cache statistics, RPC call counts, latency percentiles.

### Persistent Cache

Save fork cache to disk for faster subsequent runs:
```typescript
await manager.saveCacheToFile('fork-cache.db');
await manager.loadCacheFromFile('fork-cache.db');
```

---

## References

- **Plan**: `/Users/williamcory/.claude/plans/cheerful-stirring-liskov.md`
- **Zig Implementation**: `StateManager.zig`, `ForkBackend.zig`, `JournaledState.zig`
- **TypeScript Bindings**: `StateManager/index.ts`
- **RPC Adapter**: `StateManager/RpcClientAdapter.ts`
- **C API**: `c_api.zig`
