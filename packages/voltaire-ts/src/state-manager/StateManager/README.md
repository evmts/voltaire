# StateManager TypeScript FFI Bindings

TypeScript bindings for Zig StateManager implementation with fork backend support.

## Overview

This package provides a TypeScript wrapper around the Zig StateManager implementation, enabling:
- Fork-capable state management (read from remote chains)
- Checkpoint/revert journaling for transaction execution
- Snapshot/revert for testing (tevm_snapshot/tevm_revert)
- Dual-cache strategy (local modifications + remote state)

## Architecture

```
StateManager (TS)
    ├─ FFI Bindings (index.ts)
    ├─ RpcClientAdapter (RpcClientAdapter.ts)
    └─ Native/WASM Loader
         │
         ▼
    c_api.zig (FFI exports)
         │
         ▼
    StateManager.zig (Zig implementation)
         ├─ JournaledState.zig
         ├─ ForkBackend.zig
         └─ StateCache.zig
```

## Files

1. **index.ts** (~400 lines)
   - `StateManager` class wrapping Zig FFI exports
   - Async methods for state operations
   - Snapshot/checkpoint management
   - Error handling and type conversions

2. **RpcClientAdapter.ts** (~150 lines)
   - Adapts EIP-1193 `Provider` to `RpcClient` interface
   - Wraps `HttpProvider`/`WebSocketProvider`
   - Typed wrappers for `eth_getProof`, `eth_getCode`
   - Retry logic and timeout handling

3. **c_api.zig** (~450 lines)
   - C calling convention FFI exports
   - Opaque handle management
   - String/buffer conversions
   - Error code definitions

4. **FFI-BOUNDARY.md** (documentation)
   - Memory ownership rules
   - Async RPC pattern design
   - Type conversion specifications
   - Testing strategy

## Usage

### Basic (In-Memory)

```typescript
import { StateManager } from './state-manager/StateManager/index.js';
import * as Address from './primitives/Address/index.js';

// Create in-memory state manager
const manager = new StateManager({ ffi: ffiExports });

const address = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

// Set state
await manager.setBalance(address, 1000n);
await manager.setNonce(address, 5n);
await manager.setStorage(address, '0x0', '0x123');

// Read state
const balance = await manager.getBalance(address);  // 1000n
const nonce = await manager.getNonce(address);      // 5n
const storage = await manager.getStorage(address, '0x0');  // "0x123"

// Cleanup
manager.destroy();
```

### Fork Mode

```typescript
import { StateManager } from './state-manager/StateManager/index.js';
import { RpcClientAdapter } from './state-manager/StateManager/RpcClientAdapter.js';
import { HttpProvider } from './provider/HttpProvider.js';

// Create HTTP provider
const httpProvider = new HttpProvider({
  url: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'
});

// Create RPC client adapter
const rpcClient = new RpcClientAdapter({ provider: httpProvider });

// Create state manager with fork backend
const manager = new StateManager({
  rpcClient,
  forkBlockTag: '0x112a880',  // Block 18000000
  maxCacheSize: 10000,
  ffi: ffiExports
});

// Read from fork (fetches from remote if not cached)
const usdcAddress = Address.from('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
const balance = await manager.getBalance(usdcAddress);
const code = await manager.getCode(usdcAddress);

// Local modifications (don't affect remote)
await manager.setBalance(usdcAddress, balance + 1000000n);

manager.destroy();
```

### Checkpoints

```typescript
const manager = new StateManager({ ffi: ffiExports });
const address = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

// Initial state
await manager.setBalance(address, 1000n);

// Create checkpoint
await manager.checkpoint();

// Modify state
await manager.setBalance(address, 2000n);
console.log(await manager.getBalance(address));  // 2000n

// Revert to checkpoint
manager.revert();
console.log(await manager.getBalance(address));  // 1000n (reverted)

// OR commit checkpoint
await manager.checkpoint();
await manager.setBalance(address, 3000n);
manager.commit();  // Merges into parent
console.log(await manager.getBalance(address));  // 3000n (committed)

manager.destroy();
```

### Snapshots (for testing)

```typescript
const manager = new StateManager({ ffi: ffiExports });
const address = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

// Setup initial state
await manager.setBalance(address, 1000n);

// Create snapshot
const snapId = await manager.snapshot();
console.log('Snapshot ID:', snapId);  // 0n

// Modify state
await manager.setBalance(address, 2000n);
await manager.setNonce(address, 10n);

// Create another snapshot
const snapId2 = await manager.snapshot();  // 1n

// Modify again
await manager.setBalance(address, 3000n);

// Revert to first snapshot
await manager.revertToSnapshot(snapId);
console.log(await manager.getBalance(address));  // 1000n
console.log(await manager.getNonce(address));    // 0n

// snapId2 is no longer valid (cleared when reverted past)
try {
  await manager.revertToSnapshot(snapId2);
} catch (err) {
  console.log('Invalid snapshot:', err.message);
}

manager.destroy();
```

## API Reference

### StateManager Class

#### Constructor

```typescript
new StateManager(options: StateManagerOptions)
```

**Options**:
- `ffi: StateManagerFFIExports` - FFI library exports (required)
- `rpcClient?: RpcClient` - RPC client for fork mode (optional)
- `forkBlockTag?: string` - Block tag for fork (default: "latest")
- `maxCacheSize?: number` - LRU cache size (default: 10000)

#### Methods

**State Operations**:
- `async getBalance(address: Address): Promise<bigint>`
- `async setBalance(address: Address, balance: bigint): Promise<void>`
- `async getNonce(address: Address): Promise<bigint>`
- `async setNonce(address: Address, nonce: bigint): Promise<void>`
- `async getStorage(address: Address, slot: Hex): Promise<Hex>`
- `async setStorage(address: Address, slot: Hex, value: Hex): Promise<void>`
- `async getCode(address: Address): Promise<Hex>`
- `async setCode(address: Address, code: Hex): Promise<void>`

**Checkpoint Operations**:
- `async checkpoint(): Promise<void>` - Create checkpoint (LIFO stack)
- `revert(): void` - Revert to last checkpoint
- `commit(): void` - Commit last checkpoint

**Snapshot Operations**:
- `async snapshot(): Promise<bigint>` - Create snapshot, returns ID
- `async revertToSnapshot(snapshotId: bigint): Promise<void>` - Revert to snapshot

**Cache Management**:
- `clearCaches(): void` - Clear all caches
- `clearForkCache(): void` - Clear only fork cache

**Lifecycle**:
- `destroy(): void` - Free resources (MUST call when done)

### RpcClientAdapter Class

#### Constructor

```typescript
new RpcClientAdapter(options: RpcClientAdapterOptions)
```

**Options**:
- `provider: Provider` - EIP-1193 provider (required)
- `timeout?: number` - Request timeout in ms (default: 30000)
- `retries?: number` - Retry attempts (default: 3)

#### Methods

- `async getProof(address: Address, slots: Hex[], blockTag: string): Promise<EthProof>`
- `async getCode(address: Address, blockTag: string): Promise<Hex>`
- `async getBlockByNumber(blockTag: string, full?: boolean): Promise<unknown>`
- `async getBlockByHash(blockHash: Hex, full?: boolean): Promise<unknown>`
- `async getBlockNumber(): Promise<Hex>`

## Error Handling

```typescript
try {
  const balance = await manager.getBalance(address);
} catch (err) {
  if (err.message.includes('Invalid hex')) {
    // Handle invalid address format
  } else if (err.message.includes('RPC request failed')) {
    // Handle RPC failure (network error, etc.)
  } else if (err.message.includes('Invalid snapshot')) {
    // Handle invalid snapshot ID
  } else {
    // Other errors
  }
}
```

**Error Codes** (from c_api.zig):
- `STATE_MANAGER_SUCCESS = 0` - Success
- `STATE_MANAGER_ERROR_INVALID_INPUT = -1` - Invalid input parameter
- `STATE_MANAGER_ERROR_OUT_OF_MEMORY = -2` - Out of memory
- `STATE_MANAGER_ERROR_INVALID_SNAPSHOT = -3` - Invalid snapshot ID
- `STATE_MANAGER_ERROR_RPC_FAILED = -4` - RPC request failed
- `STATE_MANAGER_ERROR_INVALID_HEX = -5` - Invalid hex string

## Memory Management

**Handles**: TypeScript manages handles (bigint pointers), Zig manages pointed-to memory.

```typescript
const manager = new StateManager({ ffi: ffiExports });
// manager.handle is a bigint (opaque pointer to Zig StateManager)

// Use manager...

manager.destroy();  // MUST call to free Zig memory
// After destroy(), manager is invalid
```

**Best Practice**: Use try/finally:

```typescript
const manager = new StateManager({ ffi: ffiExports });
try {
  // Use manager
  await manager.setBalance(address, 1000n);
} finally {
  manager.destroy();
}
```

## Testing

See `StateManager.test.ts` for comprehensive test examples.

## Performance

**Cache Hit Rates**: Target 90%+ for fork mode
**Memory Usage**: ~10-100MB depending on cache size and code size
**RPC Latency**: 50-200ms per cache miss (blocks currently)

## Limitations (Current)

1. **Synchronous RPC**: Fork backend blocks on RPC calls (no async yet)
2. **No WASM**: FFI bindings are Native-only (Node.js/Bun)
3. **No Batch RPC**: One account/slot per request
4. **No Persistent Cache**: Cache cleared on restart

## Future Work

1. **Async RPC**: Non-blocking callback pattern
2. **WASM Support**: Browser-compatible bindings
3. **Batch RPC**: Fetch multiple accounts/slots in one request
4. **Persistent Cache**: Save/load cache to disk
5. **Metrics**: Export cache statistics and RPC metrics

## See Also

- [FFI-BOUNDARY.md](./FFI-BOUNDARY.md) - Detailed FFI documentation
- [StateManager.zig](../StateManager.zig) - Zig implementation
- [c_api.zig](../c_api.zig) - FFI exports
- [RPC vtable pattern](../ForkBackend.zig) - RPC client abstraction
