//! Blockchain C API
//!
//! FFI exports for Blockchain and ForkBlockCache with RPC vtable support.
//! Uses simplified JSON serialization for MVP (binary serialization TBD).

const std = @import("std");
const primitives = @import("primitives");
const blockchain_mod = @import("blockchain");

const Blockchain = blockchain_mod.Blockchain;
const ForkBlockCache = blockchain_mod.ForkBlockCache;
const RpcVTable = blockchain_mod.RpcVTable;
const Block = primitives.Block;
const Hash = primitives.Hash;

// ============================================================================
// Error Codes
// ============================================================================

pub const BLOCKCHAIN_SUCCESS: c_int = 0;
pub const BLOCKCHAIN_ERROR_INVALID_INPUT: c_int = -1;
pub const BLOCKCHAIN_ERROR_OUT_OF_MEMORY: c_int = -2;
pub const BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND: c_int = -3;
pub const BLOCKCHAIN_ERROR_INVALID_PARENT: c_int = -4;
pub const BLOCKCHAIN_ERROR_RPC_FAILED: c_int = -5;
pub const BLOCKCHAIN_ERROR_NOT_IMPLEMENTED: c_int = -999;

// ============================================================================
// Opaque Handle Types
// ============================================================================

pub const BlockchainHandle = *anyopaque;

// ============================================================================
// Global Allocator
// ============================================================================

var gpa_instance: std.heap.GeneralPurposeAllocator(.{}) = undefined;
var gpa_initialized = false;

fn getAllocator() std.mem.Allocator {
    if (!gpa_initialized) {
        gpa_instance = std.heap.GeneralPurposeAllocator(.{}){};
        gpa_initialized = true;
    }
    return gpa_instance.allocator();
}

// ============================================================================
// Blockchain Lifecycle (Minimal Stubs)
// ============================================================================

/// Create Blockchain without fork cache
export fn blockchain_create() callconv(.c) ?BlockchainHandle {
    const allocator = getAllocator();
    const chain = allocator.create(Blockchain) catch return null;
    chain.* = Blockchain.init(allocator, null) catch {
        allocator.destroy(chain);
        return null;
    };
    return @ptrCast(chain);
}

/// Destroy Blockchain
export fn blockchain_destroy(handle: BlockchainHandle) callconv(.c) void {
    const allocator = getAllocator();
    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    chain.deinit();
    allocator.destroy(chain);
}

/// Get local block count
export fn blockchain_local_block_count(handle: BlockchainHandle) callconv(.c) usize {
    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    return chain.localBlockCount();
}

/// Get canonical chain length
export fn blockchain_canonical_chain_length(handle: BlockchainHandle) callconv(.c) usize {
    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    return chain.canonicalChainLength();
}

// ============================================================================
// Fork Block Cache Lifecycle
// ============================================================================

/// Opaque handle to ForkBlockCache
pub const ForkBlockCacheHandle = *anyopaque;

/// Create fork block cache with RPC vtable
/// For MVP: vtable function pointers are expected to be TypeScript callbacks
/// Returns: Opaque handle or null on failure
export fn fork_block_cache_create(
    rpc_context: usize,
    vtable_fetch_by_number: usize,
    vtable_fetch_by_hash: usize,
    fork_block_number: u64,
) callconv(.c) ?ForkBlockCacheHandle {
    _ = rpc_context;
    _ = vtable_fetch_by_number;
    _ = vtable_fetch_by_hash;
    const allocator = getAllocator();

    // MVP: Create mock RPC vtable (real impl needs TypeScript FFI callbacks)
    // For now, create a vtable that returns null (no RPC fetching)
    // Use a dummy context pointer (points to this function's stack frame)
    var dummy_ctx: u8 = 0;
    const mock_vtable = RpcVTable{
        .context = &dummy_ctx,
        .fetch_block_by_number = mockFetchBlockByNumber,
        .fetch_block_by_hash = mockFetchBlockByHash,
    };

    const cache = allocator.create(ForkBlockCache) catch return null;
    cache.* = ForkBlockCache.init(allocator, mock_vtable, fork_block_number) catch {
        allocator.destroy(cache);
        return null;
    };

    return @ptrCast(cache);
}

/// Mock RPC fetch functions (MVP - real impl needs FFI callbacks)
fn mockFetchBlockByNumber(ctx: *anyopaque, number: u64) ?Block.Block {
    _ = ctx;
    _ = number;
    return null; // MVP: No remote fetching yet
}

fn mockFetchBlockByHash(ctx: *anyopaque, hash: Hash.Hash) ?Block.Block {
    _ = ctx;
    _ = hash;
    return null; // MVP: No remote fetching yet
}

/// Destroy fork block cache
export fn fork_block_cache_destroy(handle: ForkBlockCacheHandle) callconv(.c) void {
    const allocator = getAllocator();
    const cache: *ForkBlockCache = @ptrCast(@alignCast(handle));
    cache.deinit();
    allocator.destroy(cache);
}

// ============================================================================
// Blockchain with Fork
// ============================================================================

/// Create Blockchain with fork cache
export fn blockchain_create_with_fork(
    fork_cache: ForkBlockCacheHandle,
) callconv(.c) ?BlockchainHandle {
    const allocator = getAllocator();
    const chain = allocator.create(Blockchain) catch return null;
    const cache: *ForkBlockCache = @ptrCast(@alignCast(fork_cache));

    chain.* = Blockchain.init(allocator, cache) catch {
        allocator.destroy(chain);
        return null;
    };
    return @ptrCast(chain);
}

// ============================================================================
// Block Operations (Stubs for MVP)
// ============================================================================

/// Get block by number (stub - returns not implemented)
export fn blockchain_get_block_by_number(
    handle: BlockchainHandle,
    number: u64,
    out_block: [*]u8,
) callconv(.c) c_int {
    _ = handle;
    _ = number;
    _ = out_block;
    return BLOCKCHAIN_ERROR_NOT_IMPLEMENTED;
}

/// Get block by hash (stub - returns not implemented)
export fn blockchain_get_block_by_hash(
    handle: BlockchainHandle,
    block_hash_ptr: [*]const u8,
    out_block: [*]u8,
) callconv(.c) c_int {
    _ = handle;
    _ = block_hash_ptr;
    _ = out_block;
    return BLOCKCHAIN_ERROR_NOT_IMPLEMENTED;
}

/// Put block (stub - returns not implemented)
export fn blockchain_put_block(
    handle: BlockchainHandle,
    block_data: [*]const u8,
) callconv(.c) c_int {
    _ = handle;
    _ = block_data;
    return BLOCKCHAIN_ERROR_NOT_IMPLEMENTED;
}

/// Set canonical head (stub - returns not implemented)
export fn blockchain_set_canonical_head(
    handle: BlockchainHandle,
    block_hash_ptr: [*]const u8,
) callconv(.c) c_int {
    _ = handle;
    _ = block_hash_ptr;
    return BLOCKCHAIN_ERROR_NOT_IMPLEMENTED;
}

/// Has block (stub - returns false)
export fn blockchain_has_block(
    handle: BlockchainHandle,
    block_hash_ptr: [*]const u8,
) callconv(.c) bool {
    _ = handle;
    _ = block_hash_ptr;
    return false;
}

/// Get canonical hash (stub - returns not found)
export fn blockchain_get_canonical_hash(
    handle: BlockchainHandle,
    number: u64,
    out_hash: [*]u8,
) callconv(.c) c_int {
    _ = handle;
    _ = number;
    _ = out_hash;
    return BLOCKCHAIN_ERROR_NOT_IMPLEMENTED;
}

/// Get head block number (stub - returns not found)
export fn blockchain_get_head_block_number(
    handle: BlockchainHandle,
    out_number: *u64,
) callconv(.c) c_int {
    _ = handle;
    _ = out_number;
    return BLOCKCHAIN_ERROR_NOT_IMPLEMENTED;
}

/// Orphan count
export fn blockchain_orphan_count(handle: BlockchainHandle) callconv(.c) usize {
    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    return chain.orphanCount();
}

/// Is fork block
export fn blockchain_is_fork_block(
    handle: BlockchainHandle,
    number: u64,
) callconv(.c) bool {
    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    return chain.isForkBlock(number);
}
