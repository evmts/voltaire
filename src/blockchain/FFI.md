# Blockchain FFI Documentation

## Overview

The Blockchain FFI layer provides TypeScript bindings for the Zig Blockchain implementation, enabling block storage, fork cache management, and canonical chain tracking across the FFI boundary.

## Architecture

### Memory Ownership Model

- **Zig Side**: Owns Blockchain and ForkBlockCache instances
- **TypeScript Side**: Holds opaque handles (bigint pointers)
- **Block Data**: Passed via binary serialization (BlockData struct)
- **RPC Callbacks**: TypeScript → Zig vtable → TypeScript async

### Module Structure

```
src/blockchain/
├── Blockchain.zig          # Zig implementation
├── BlockStore.zig          # Local block storage
├── ForkBlockCache.zig      # Remote block fetching
├── c_api.zig               # FFI exports (THIS FILE)
├── root.zig                # Module entry
└── Blockchain/
    └── index.ts            # TypeScript bindings
```

## FFI Boundary

### 1. Opaque Handles

Zig allocates instances, TypeScript holds opaque pointers:

```typescript
// TypeScript
const handle = ffi.blockchain_create(); // Returns bigint pointer
// ... use handle ...
ffi.blockchain_destroy(handle); // Cleanup
```

```zig
// Zig
export fn blockchain_create() callconv(.C) ?BlockchainHandle {
    const chain = allocator.create(Blockchain) catch return null;
    chain.* = Blockchain.init(allocator, null) catch { ... };
    return @ptrCast(chain);
}
```

### 2. Block Serialization

Blocks are complex structures with nested data. We use a C-compatible struct (`BlockData`) for FFI transfer:

#### BlockData Structure (c_api.zig)

```zig
pub const BlockData = extern struct {
    // Fixed-size header fields
    block_hash: [32]u8,
    parent_hash: [32]u8,
    number: u64,
    timestamp: u64,
    // ... (all header fields)

    // Variable-size body fields (as RLP-encoded slices)
    transactions_rlp_ptr: [*]const u8,
    transactions_rlp_len: usize,
    ommers_rlp_ptr: [*]const u8,
    ommers_rlp_len: usize,
    withdrawals_rlp_ptr: [*]const u8,
    withdrawals_rlp_len: usize,
};
```

#### Serialization Flow

**Zig → TypeScript (Read)**:
1. Blockchain.getBlockByHash() returns Zig Block
2. serializeBlock() converts Block → BlockData
3. TypeScript receives BlockData buffer
4. deserializeBlock() converts BlockData → TS Block

**TypeScript → Zig (Write)**:
1. TS creates Block object
2. serializeBlock() converts Block → BlockData buffer
3. Zig receives BlockData via FFI
4. deserializeBlock() converts BlockData → Zig Block
5. Blockchain.putBlock() stores block

### 3. RPC Vtable (Fork Mode)

For fork mode, TypeScript provides RPC client via vtable:

```zig
// Zig vtable structure
pub const RpcVTable = struct {
    context: *anyopaque,
    fetch_block_by_number: *const fn (*anyopaque, u64) ?Block.Block,
    fetch_block_by_hash: *const fn (*anyopaque, Hash.Hash) ?Block.Block,
};
```

```typescript
// TypeScript creates vtable
const vtable = {
    fetchByNumber: createFunctionPointer((ctx, num) => {
        return rpcClient.getBlockByNumber(num);
    }),
    fetchByHash: createFunctionPointer((ctx, hash) => {
        return rpcClient.getBlockByHash(hash);
    }),
};

const cache = ffi.fork_block_cache_create(
    rpcContext,
    vtable.fetchByNumber,
    vtable.fetchByHash,
    forkBlockNumber
);
```

## API Reference

### Lifecycle

#### `blockchain_create() → BlockchainHandle | null`
Create in-memory only blockchain.

#### `blockchain_create_with_fork(forkCache) → BlockchainHandle | null`
Create blockchain with fork cache.

#### `blockchain_destroy(handle)`
Free blockchain resources.

#### `fork_block_cache_create(rpcContext, vtableFetchByNumber, vtableFetchByHash, forkBlockNumber) → ForkBlockCacheHandle | null`
Create fork cache with RPC vtable.

#### `fork_block_cache_destroy(handle)`
Free fork cache resources.

### Block Operations

#### `blockchain_get_block_by_hash(handle, blockHashPtr, outBlockData) → c_int`
Get block by hash. Returns error code (0 = success, -3 = not found).

**Parameters**:
- `handle`: Blockchain handle
- `blockHashPtr`: 32-byte block hash buffer
- `outBlockData`: Output buffer for BlockData struct

**Returns**: `BLOCKCHAIN_SUCCESS` or error code

#### `blockchain_get_block_by_number(handle, number, outBlockData) → c_int`
Get block by number (canonical chain only).

#### `blockchain_get_canonical_hash(handle, number, outHash) → c_int`
Get canonical hash for block number.

**Parameters**:
- `outHash`: 32-byte output buffer

#### `blockchain_get_head_block_number(handle, outNumber) → c_int`
Get current head block number.

**Parameters**:
- `outNumber`: Pointer to u64 output

#### `blockchain_put_block(handle, blockData) → c_int`
Put block in local storage (validates parent linkage).

**Parameters**:
- `blockData`: BlockData struct buffer

**Returns**: `BLOCKCHAIN_SUCCESS` or error code

#### `blockchain_set_canonical_head(handle, blockHashPtr) → c_int`
Set canonical head (makes block and ancestors canonical).

**Errors**:
- `BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND`: Block doesn't exist
- `BLOCKCHAIN_ERROR_ORPHAN_HEAD`: Block is orphan (no parent)

#### `blockchain_has_block(handle, blockHashPtr) → bool`
Check if block exists (local or fork cache).

### Statistics

#### `blockchain_local_block_count(handle) → usize`
Get total blocks in local storage.

#### `blockchain_orphan_count(handle) → usize`
Get orphan block count.

#### `blockchain_canonical_chain_length(handle) → usize`
Get canonical chain length.

#### `blockchain_is_fork_block(handle, number) → bool`
Check if block number is within fork boundary.

## Error Codes

```zig
pub const BLOCKCHAIN_SUCCESS: c_int = 0;
pub const BLOCKCHAIN_ERROR_INVALID_INPUT: c_int = -1;
pub const BLOCKCHAIN_ERROR_OUT_OF_MEMORY: c_int = -2;
pub const BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND: c_int = -3;
pub const BLOCKCHAIN_ERROR_INVALID_PARENT: c_int = -4;
pub const BLOCKCHAIN_ERROR_ORPHAN_HEAD: c_int = -5;
pub const BLOCKCHAIN_ERROR_INVALID_HASH: c_int = -6;
```

## Memory Management

### Zig Responsibilities
- Allocate/free Blockchain instances
- Allocate/free ForkBlockCache instances
- Manage block storage lifetime
- Block data is copied during putBlock (TS buffer can be freed)

### TypeScript Responsibilities
- Allocate BlockData buffers for output (1KB typical)
- Free buffers after use
- Keep handles alive until destroy() called
- RPC vtable functions must remain valid during cache lifetime

## Block Serialization Details

### Current Implementation (JSON Placeholder)

The current TypeScript implementation uses JSON serialization as a placeholder:

```typescript
private serializeBlock(block: Block): Uint8Array {
    const json = JSON.stringify(block);
    return new TextEncoder().encode(json);
}
```

### Production Implementation (Binary Struct)

Production code should use binary struct layout matching `BlockData`:

```typescript
private serializeBlock(block: Block): Uint8Array {
    const buffer = new ArrayBuffer(512); // Base size
    const view = new DataView(buffer);
    let offset = 0;

    // Write fixed-size fields
    new Uint8Array(buffer, offset, 32).set(Hex.toBytes(block.hash));
    offset += 32;
    new Uint8Array(buffer, offset, 32).set(Hex.toBytes(block.parentHash));
    offset += 32;
    // ... (continue for all fields)

    return new Uint8Array(buffer);
}
```

### Benefits of Binary Format
1. **Performance**: No JSON parsing overhead
2. **Type Safety**: Exact memory layout match
3. **Size**: Smaller serialized size
4. **Validation**: Compile-time struct validation

### RLP Body Encoding

Transaction lists, ommers, and withdrawals are RLP-encoded before FFI transfer:

```typescript
const transactionsRlp = encodeRlp(block.transactions);
const ommersRlp = encodeRlp(block.ommers);
const withdrawalsRlp = encodeRlp(block.withdrawals);
```

This avoids complex nested struct serialization across FFI.

## Fork Mode Flow

### Setup
1. TypeScript creates RPC client adapter
2. TypeScript creates fork cache with vtable
3. TypeScript creates blockchain with fork cache

### Block Fetch (Fork Cache Hit)
1. TS: `blockchain.getBlockByNumber(12345n)`
2. Zig: Check local storage → miss
3. Zig: Check fork cache → call vtable.fetch_block_by_number
4. TS: RPC vtable → fetch from remote (or cache)
5. TS: Return Block
6. Zig: Cache block → return BlockData
7. TS: Deserialize → return Block

### Block Fetch (Local Hit)
1. TS: `blockchain.getBlockByNumber(12345n)`
2. Zig: Check local storage → hit
3. Zig: Return BlockData immediately
4. TS: Deserialize → return Block

## Usage Examples

### In-Memory Mode

```typescript
const blockchain = new Blockchain({
    ffi: ffiExports
});

const genesis = createGenesisBlock(1);
await blockchain.putBlock(genesis);
await blockchain.setCanonicalHead(genesis.hash);

const block = await blockchain.getBlockByNumber(0n);
console.log(block?.number); // 0n

blockchain.destroy();
```

### Fork Mode

```typescript
const blockchain = new Blockchain({
    rpcClient: new RpcClientAdapter(httpProvider),
    forkBlockNumber: 1000000n,
    ffi: ffiExports
});

// Fetch from remote (block 500 ≤ fork point)
const remoteBlock = await blockchain.getBlockByNumber(500n);

// Put local block (block 1000001 > fork point)
const newBlock = createBlock(1000001n);
await blockchain.putBlock(newBlock);
await blockchain.setCanonicalHead(newBlock.hash);

blockchain.destroy();
```

## Known Limitations

### Current Implementation
1. **JSON Serialization**: Placeholder (slow, not production-ready)
2. **RPC Vtable**: Function pointer creation not implemented
3. **Memory Leaks**: BlockData buffers may leak without proper cleanup
4. **No Streaming**: Large blocks must fit in single buffer

### Future Improvements
1. Implement binary struct serialization (matching BlockData exactly)
2. Add FFI function pointer helpers for vtable creation
3. Implement automatic buffer management (arena allocator)
4. Add streaming support for large blocks (>1MB)
5. Add block validation at FFI boundary
6. Add metrics/tracing for FFI calls

## Testing

### Unit Tests

Run Zig tests:
```bash
zig build test
```

Run TypeScript tests:
```bash
pnpm test src/blockchain/
```

### Integration Tests

Test FFI boundary with real blocks:
```typescript
test("FFI: round-trip block serialization", async () => {
    const blockchain = new Blockchain({ ffi });
    const block = createTestBlock();

    await blockchain.putBlock(block);
    const retrieved = await blockchain.getBlockByHash(block.hash);

    expect(retrieved).toEqual(block);
});
```

## Debugging

### Enable Zig Debug Logs

```zig
// In c_api.zig
const std = @import("std");
const log = std.log.scoped(.blockchain_ffi);

export fn blockchain_get_block_by_hash(...) {
    log.debug("get_block_by_hash: hash={x}", .{block_hash});
    // ...
}
```

### TypeScript FFI Tracing

```typescript
const originalGetBlock = ffi.blockchain_get_block_by_hash;
ffi.blockchain_get_block_by_hash = (...args) => {
    console.log("FFI: blockchain_get_block_by_hash", args);
    const result = originalGetBlock(...args);
    console.log("FFI result:", result);
    return result;
};
```

## Contributing

When modifying FFI boundary:
1. Update both c_api.zig and index.ts
2. Update this documentation
3. Add tests for new functionality
4. Run `zig build && zig build test`
5. Check for memory leaks with valgrind (if available)

## References

- State Manager FFI: `/src/state-manager/c_api.zig`
- Blockchain Implementation: `/src/blockchain/Blockchain.zig`
- Block Structure: `/src/primitives/Block/Block.zig`
- RLP Encoding: `/src/primitives/Rlp/Rlp.zig`
