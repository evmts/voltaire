//! Blockchain C API
//!
//! FFI exports for Blockchain and ForkBlockCache with async request/continue support.
//! Uses JSON serialization for block transfer.

const std = @import("std");
const primitives = @import("primitives");
const blockchain_mod = @import("blockchain");

const Blockchain = blockchain_mod.Blockchain;
const ForkBlockCache = blockchain_mod.ForkBlockCache;
const Block = primitives.Block;
const Hash = primitives.Hash;
const Hex = primitives.Hex;
const Address = primitives.Address;

// ============================================================================
// Error Codes
// ============================================================================

pub const BLOCKCHAIN_SUCCESS: c_int = 0;
pub const BLOCKCHAIN_ERROR_INVALID_INPUT: c_int = -1;
pub const BLOCKCHAIN_ERROR_OUT_OF_MEMORY: c_int = -2;
pub const BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND: c_int = -3;
pub const BLOCKCHAIN_ERROR_INVALID_PARENT: c_int = -4;
pub const BLOCKCHAIN_ERROR_ORPHAN_HEAD: c_int = -5;
pub const BLOCKCHAIN_ERROR_INVALID_HASH: c_int = -6;
pub const BLOCKCHAIN_ERROR_RPC_PENDING: c_int = -7;
pub const BLOCKCHAIN_ERROR_NO_PENDING_REQUEST: c_int = -8;
pub const BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL: c_int = -9;
pub const BLOCKCHAIN_ERROR_INVALID_REQUEST: c_int = -10;
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
// Blockchain Lifecycle
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
    if (@intFromPtr(handle) == 0) return;
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

/// Create fork block cache (async request/continue)
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
    const cache = allocator.create(ForkBlockCache) catch return null;
    cache.* = ForkBlockCache.init(allocator, fork_block_number) catch {
        allocator.destroy(cache);
        return null;
    };

    return @ptrCast(cache);
}

/// Destroy fork block cache
export fn fork_block_cache_destroy(handle: ForkBlockCacheHandle) callconv(.c) void {
    if (@intFromPtr(handle) == 0) return;
    const allocator = getAllocator();
    const cache: *ForkBlockCache = @ptrCast(@alignCast(handle));
    cache.deinit();
    allocator.destroy(cache);
}

/// Get next pending fork block request (method + params)
export fn fork_block_cache_next_request(
    handle: ForkBlockCacheHandle,
    out_request_id: *u64,
    out_method: [*]u8,
    method_buf_len: usize,
    out_method_len: *usize,
    out_params: [*]u8,
    params_buf_len: usize,
    out_params_len: *usize,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) return BLOCKCHAIN_ERROR_INVALID_INPUT;
    if (@intFromPtr(out_request_id) == 0) return BLOCKCHAIN_ERROR_INVALID_INPUT;
    if (@intFromPtr(out_method) == 0) return BLOCKCHAIN_ERROR_INVALID_INPUT;
    if (@intFromPtr(out_method_len) == 0) return BLOCKCHAIN_ERROR_INVALID_INPUT;
    if (@intFromPtr(out_params) == 0) return BLOCKCHAIN_ERROR_INVALID_INPUT;
    if (@intFromPtr(out_params_len) == 0) return BLOCKCHAIN_ERROR_INVALID_INPUT;

    const cache: *ForkBlockCache = @ptrCast(@alignCast(handle));
    const request = cache.peekNextRequest() orelse return BLOCKCHAIN_ERROR_NO_PENDING_REQUEST;

    const method = switch (request.kind) {
        .by_number => "eth_getBlockByNumber",
        .by_hash => "eth_getBlockByHash",
    };

    out_method_len.* = method.len;
    out_params_len.* = request.params_json.len;

    if (method_buf_len < method.len) return BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL;
    if (params_buf_len < request.params_json.len) return BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL;

    _ = cache.nextRequest();

    @memcpy(out_method[0..method.len], method);
    @memcpy(out_params[0..request.params_json.len], request.params_json);
    out_request_id.* = request.id;

    return BLOCKCHAIN_SUCCESS;
}

/// Continue an async fork block request with JSON response bytes.
export fn fork_block_cache_continue(
    handle: ForkBlockCacheHandle,
    request_id: u64,
    response_ptr: [*]const u8,
    response_len: usize,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) return BLOCKCHAIN_ERROR_INVALID_INPUT;
    if (@intFromPtr(response_ptr) == 0) return BLOCKCHAIN_ERROR_INVALID_INPUT;

    const cache: *ForkBlockCache = @ptrCast(@alignCast(handle));
    const response = response_ptr[0..response_len];
    cache.continueRequest(request_id, response) catch |err| {
        return switch (err) {
            error.InvalidRequest => BLOCKCHAIN_ERROR_INVALID_REQUEST,
            else => BLOCKCHAIN_ERROR_INVALID_INPUT,
        };
    };

    return BLOCKCHAIN_SUCCESS;
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
// Block Operations
// ============================================================================

const MAX_BLOCK_JSON: usize = 4096;

fn formatBlockJson(allocator: std.mem.Allocator, block: Block.Block) ![]u8 {
    const hash_hex = try Hex.toHex(allocator, block.hash[0..]);
    defer allocator.free(hash_hex);

    const parent_hex = try Hex.toHex(allocator, block.header.parent_hash[0..]);
    defer allocator.free(parent_hex);

    const ommers_hex = try Hex.toHex(allocator, block.header.ommers_hash[0..]);
    defer allocator.free(ommers_hex);

    const beneficiary_hex = Address.toHex(block.header.beneficiary);

    const state_root_hex = try Hex.toHex(allocator, block.header.state_root[0..]);
    defer allocator.free(state_root_hex);

    const tx_root_hex = try Hex.toHex(allocator, block.header.transactions_root[0..]);
    defer allocator.free(tx_root_hex);

    const receipts_root_hex = try Hex.toHex(allocator, block.header.receipts_root[0..]);
    defer allocator.free(receipts_root_hex);

    const logs_bloom_hex = try Hex.toHex(allocator, block.header.logs_bloom[0..]);
    defer allocator.free(logs_bloom_hex);

    const mix_hash_hex = try Hex.toHex(allocator, block.header.mix_hash[0..]);
    defer allocator.free(mix_hash_hex);

    const nonce_hex = try Hex.toHex(allocator, block.header.nonce[0..]);
    defer allocator.free(nonce_hex);

    var extra_data_hex: []const u8 = "0x";
    var extra_allocated = false;
    if (block.header.extra_data.len != 0) {
        extra_data_hex = try Hex.toHex(allocator, block.header.extra_data);
        extra_allocated = true;
    }
    defer if (extra_allocated) allocator.free(extra_data_hex);

    var difficulty_buf: [66]u8 = undefined;
    const difficulty_hex = std.fmt.bufPrint(&difficulty_buf, "0x{x}", .{block.header.difficulty}) catch unreachable;

    var number_buf: [18]u8 = undefined;
    const number_hex = std.fmt.bufPrint(&number_buf, "0x{x}", .{block.header.number}) catch unreachable;

    var gas_limit_buf: [18]u8 = undefined;
    const gas_limit_hex = std.fmt.bufPrint(&gas_limit_buf, "0x{x}", .{block.header.gas_limit}) catch unreachable;

    var gas_used_buf: [18]u8 = undefined;
    const gas_used_hex = std.fmt.bufPrint(&gas_used_buf, "0x{x}", .{block.header.gas_used}) catch unreachable;

    var timestamp_buf: [18]u8 = undefined;
    const timestamp_hex = std.fmt.bufPrint(&timestamp_buf, "0x{x}", .{block.header.timestamp}) catch unreachable;

    var size_buf: [18]u8 = undefined;
    const size_hex = std.fmt.bufPrint(&size_buf, "0x{x}", .{block.size}) catch unreachable;

    var base_fee_json: []const u8 = "null";
    var base_fee_allocated = false;
    if (block.header.base_fee_per_gas) |fee| {
        var base_fee_buf: [66]u8 = undefined;
        const base_fee_hex = std.fmt.bufPrint(&base_fee_buf, "0x{x}", .{fee}) catch unreachable;
        base_fee_json = try std.fmt.allocPrint(allocator, "\"{s}\"", .{base_fee_hex});
        base_fee_allocated = true;
    }
    defer if (base_fee_allocated) allocator.free(base_fee_json);

    var total_diff_json: []const u8 = "null";
    var total_diff_allocated = false;
    if (block.total_difficulty) |td| {
        var total_diff_buf: [66]u8 = undefined;
        const total_diff_hex = std.fmt.bufPrint(&total_diff_buf, "0x{x}", .{td}) catch unreachable;
        total_diff_json = try std.fmt.allocPrint(allocator, "\"{s}\"", .{total_diff_hex});
        total_diff_allocated = true;
    }
    defer if (total_diff_allocated) allocator.free(total_diff_json);

    return std.fmt.allocPrint(allocator,
        \\{{"hash":"{s}","parentHash":"{s}","ommersHash":"{s}","beneficiary":"{s}","stateRoot":"{s}","transactionsRoot":"{s}","receiptsRoot":"{s}","logsBloom":"{s}","difficulty":"{s}","number":"{s}","gasLimit":"{s}","gasUsed":"{s}","timestamp":"{s}","extraData":"{s}","mixHash":"{s}","nonce":"{s}","baseFeePerGas":{s},"withdrawalsRoot":null,"blobGasUsed":null,"excessBlobGas":null,"parentBeaconBlockRoot":null,"transactions":"0x","ommers":"0x","withdrawals":"0x","size":"{s}","totalDifficulty":{s}}}
    , .{
        hash_hex,
        parent_hex,
        ommers_hex,
        beneficiary_hex[0..],
        state_root_hex,
        tx_root_hex,
        receipts_root_hex,
        logs_bloom_hex,
        difficulty_hex,
        number_hex,
        gas_limit_hex,
        gas_used_hex,
        timestamp_hex,
        extra_data_hex,
        mix_hash_hex,
        nonce_hex,
        base_fee_json,
        size_hex,
        total_diff_json,
    });
}

/// Get block by number (canonical chain)
export fn blockchain_get_block_by_number(
    handle: BlockchainHandle,
    number: u64,
    out_block: [*]u8,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        return BLOCKCHAIN_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(out_block) == 0) {
        return BLOCKCHAIN_ERROR_INVALID_INPUT;
    }

    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    const block = chain.getBlockByNumber(number) catch |err| {
        if (err == error.RpcPending) return BLOCKCHAIN_ERROR_RPC_PENDING;
        return BLOCKCHAIN_ERROR_INVALID_INPUT;
    } orelse return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;

    const allocator = getAllocator();
    const json = formatBlockJson(allocator, block) catch return BLOCKCHAIN_ERROR_OUT_OF_MEMORY;
    defer allocator.free(json);

    if (json.len >= MAX_BLOCK_JSON) return BLOCKCHAIN_ERROR_OUT_OF_MEMORY;
    @memcpy(out_block[0..json.len], json);
    out_block[json.len] = 0;

    return BLOCKCHAIN_SUCCESS;
}

/// Get block by hash
export fn blockchain_get_block_by_hash(
    handle: BlockchainHandle,
    block_hash_ptr: [*]const u8,
    out_block: [*]u8,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        return BLOCKCHAIN_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(block_hash_ptr) == 0) {
        return BLOCKCHAIN_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(out_block) == 0) {
        return BLOCKCHAIN_ERROR_INVALID_INPUT;
    }

    var hash: Hash.Hash = undefined;
    @memcpy(hash[0..], block_hash_ptr[0..Hash.SIZE]);

    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    const block = chain.getBlockByHash(hash) catch |err| {
        if (err == error.RpcPending) return BLOCKCHAIN_ERROR_RPC_PENDING;
        return BLOCKCHAIN_ERROR_INVALID_INPUT;
    } orelse return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;

    const allocator = getAllocator();
    const json = formatBlockJson(allocator, block) catch return BLOCKCHAIN_ERROR_OUT_OF_MEMORY;
    defer allocator.free(json);

    if (json.len >= MAX_BLOCK_JSON) return BLOCKCHAIN_ERROR_OUT_OF_MEMORY;
    @memcpy(out_block[0..json.len], json);
    out_block[json.len] = 0;

    return BLOCKCHAIN_SUCCESS;
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

/// Has block
export fn blockchain_has_block(
    handle: BlockchainHandle,
    block_hash_ptr: [*]const u8,
) callconv(.c) bool {
    if (@intFromPtr(handle) == 0) return false;
    if (@intFromPtr(block_hash_ptr) == 0) return false;

    var hash: Hash.Hash = undefined;
    @memcpy(hash[0..], block_hash_ptr[0..Hash.SIZE]);

    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    return chain.hasBlock(hash);
}

/// Get canonical hash
export fn blockchain_get_canonical_hash(
    handle: BlockchainHandle,
    number: u64,
    out_hash: [*]u8,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        return BLOCKCHAIN_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(out_hash) == 0) {
        return BLOCKCHAIN_ERROR_INVALID_INPUT;
    }

    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    const hash = chain.getCanonicalHash(number) orelse return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;

    @memcpy(out_hash[0..Hash.SIZE], hash[0..]);
    return BLOCKCHAIN_SUCCESS;
}

/// Get head block number
export fn blockchain_get_head_block_number(
    handle: BlockchainHandle,
    out_number: *u64,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        return BLOCKCHAIN_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(out_number) == 0) {
        return BLOCKCHAIN_ERROR_INVALID_INPUT;
    }

    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    const head_number = chain.getHeadBlockNumber() orelse return BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND;
    out_number.* = head_number;
    return BLOCKCHAIN_SUCCESS;
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
