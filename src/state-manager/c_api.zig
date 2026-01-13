//! State Manager C API
//!
//! FFI exports for StateManager operations with async RPC callback support.
//! Provides create/destroy, state access, checkpoint, and snapshot operations.
//!
//! ## Memory Model
//! - Zig allocates StateManager instances (opaque pointers to TypeScript)
//! - TypeScript owns string buffers (passed as [*:0]const u8)
//! - RPC callbacks: TypeScript → Zig vtable → TypeScript callback
//! - Request IDs: TypeScript UUID strings for async continuation
//!
//! ## Async Pattern
//! 1. TS calls state_manager_get_balance(manager, request_id, address, callback)
//! 2. Zig stores callback + request_id
//! 3. Zig calls RPC client vtable (injected from TS)
//! 4. RPC completes → Zig invokes callback(request_id, result, error)
//! 5. TS resolves/rejects pending promise by request_id

const std = @import("std");
const primitives = @import("primitives");
const state_manager_mod = @import("state-manager");

const Address = primitives.Address;
const StateManager = state_manager_mod.StateManager;
const ForkBackend = state_manager_mod.ForkBackend;
const RpcClient = state_manager_mod.RpcClient;

// ============================================================================
// Error Codes
// ============================================================================

pub const STATE_MANAGER_SUCCESS: c_int = 0;
pub const STATE_MANAGER_ERROR_INVALID_INPUT: c_int = -1;
pub const STATE_MANAGER_ERROR_OUT_OF_MEMORY: c_int = -2;
pub const STATE_MANAGER_ERROR_INVALID_SNAPSHOT: c_int = -3;
pub const STATE_MANAGER_ERROR_RPC_FAILED: c_int = -4;
pub const STATE_MANAGER_ERROR_INVALID_HEX: c_int = -5;

// ============================================================================
// Opaque Handle Types
// ============================================================================

/// Opaque handle to StateManager (returned as *anyopaque to TypeScript)
pub const StateManagerHandle = *anyopaque;

/// Opaque handle to ForkBackend
pub const ForkBackendHandle = *anyopaque;

// ============================================================================
// Callback Types
// ============================================================================

/// Async result callback for state operations
/// Called when async RPC completes: callback(request_id, result_hex, error_code)
pub const StateResultCallback = *const fn (
    request_id: [*:0]const u8,
    result_hex: [*:0]const u8,
    error_code: c_int,
) callconv(.c) void;

/// Async bytes result callback (for code)
pub const CodeResultCallback = *const fn (
    request_id: [*:0]const u8,
    result_ptr: [*]const u8,
    result_len: usize,
    error_code: c_int,
) callconv(.c) void;

// ============================================================================
// Global Allocator (Thread-local for now)
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
// StateManager Lifecycle
// ============================================================================

/// Create StateManager without fork backend (in-memory only)
/// Returns opaque handle, null on failure
export fn state_manager_create() callconv(.c) ?StateManagerHandle {
    const allocator = getAllocator();
    const manager = allocator.create(StateManager) catch return null;
    manager.* = StateManager.init(allocator, null) catch {
        allocator.destroy(manager);
        return null;
    };
    return @ptrCast(manager);
}

/// Create StateManager with fork backend
/// fork_backend: Opaque handle from fork_backend_create()
export fn state_manager_create_with_fork(
    fork_backend: ForkBackendHandle,
) callconv(.c) ?StateManagerHandle {
    std.debug.print("DEBUG: state_manager_create_with_fork called\n", .{});
    std.debug.print("DEBUG: fork_backend={*}\n", .{fork_backend});

    if (@intFromPtr(fork_backend) == 0) {
        std.debug.print("ERROR: state_manager_create_with_fork: fork_backend is null\n", .{});
        return null;
    }

    std.debug.print("DEBUG: getting allocator...\n", .{});
    const allocator = getAllocator();
    std.debug.print("DEBUG: allocator obtained\n", .{});

    std.debug.print("DEBUG: allocating StateManager...\n", .{});
    const manager = allocator.create(StateManager) catch {
        std.debug.print("ERROR: allocator.create(StateManager) failed\n", .{});
        return null;
    };
    std.debug.print("DEBUG: manager allocated at {*}\n", .{manager});

    std.debug.print("DEBUG: casting fork_backend to *ForkBackend...\n", .{});
    const fork: *ForkBackend = @ptrCast(@alignCast(fork_backend));
    std.debug.print("DEBUG: fork cast successful at {*}\n", .{fork});

    std.debug.print("DEBUG: calling StateManager.init...\n", .{});
    manager.* = StateManager.init(allocator, fork) catch |err| {
        std.debug.print("ERROR: StateManager.init failed: {}\n", .{err});
        allocator.destroy(manager);
        return null;
    };
    std.debug.print("DEBUG: StateManager created successfully, handle={*}\n", .{manager});

    return @ptrCast(manager);
}

/// Destroy StateManager and free resources
export fn state_manager_destroy(handle: StateManagerHandle) callconv(.c) void {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_destroy: handle is null\n", .{});
        return;
    }
    const allocator = getAllocator();
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.deinit();
    allocator.destroy(manager);
}

// ============================================================================
// ForkBackend Lifecycle
// ============================================================================

/// Create ForkBackend with RPC client vtable
/// rpc_client_ptr: Opaque pointer to TypeScript RPC client wrapper
/// rpc_vtable: Pointer to RPC vtable functions
/// block_tag: "latest", "0x123...", etc.
/// max_cache_size: LRU cache limit
/// Recorded mock data (set via mock_data_load FFI)
var recorded_mock_data: ?*const RecordedMockData = null;

const RecordedMockData = struct {
    num_accounts: u32,
    num_blocks: u32,
    fork_block_number: u64,
    data_ptr: [*]const u8, // Points to serialized account/block data
    data_len: usize,
};

/// Load recorded mock data from TypeScript
export fn mock_data_load(
    num_accounts: u32,
    num_blocks: u32,
    fork_block_number: u64,
    data_ptr: [*]const u8,
    data_len: usize,
) callconv(.c) void {
    const data = getAllocator().create(RecordedMockData) catch return;
    data.* = .{
        .num_accounts = num_accounts,
        .num_blocks = num_blocks,
        .fork_block_number = fork_block_number,
        .data_ptr = data_ptr,
        .data_len = data_len,
    };
    recorded_mock_data = data;
    std.debug.print("DEBUG: Loaded mock data: {} accounts, {} blocks, fork at block {}\n", .{
        num_accounts,
        num_blocks,
        fork_block_number,
    });
}

/// Clear recorded mock data
export fn mock_data_clear() callconv(.c) void {
    if (recorded_mock_data) |data| {
        getAllocator().destroy(data);
        recorded_mock_data = null;
    }
}

/// Mock vtable functions - now read from recorded data
fn mockGetProof(ptr: *anyopaque, address: Address.Address, slots: []const u256, block_tag: []const u8) anyerror!RpcClient.EthProof {
    _ = ptr;
    _ = block_tag;

    std.debug.print("DEBUG: mockGetProof called for address bytes[0..4]={{ {}, {}, {}, {} }}\n", .{
        address.bytes[0],
        address.bytes[1],
        address.bytes[2],
        address.bytes[3],
    });

    if (recorded_mock_data) |data| {
        std.debug.print("DEBUG: recorded_mock_data exists, num_accounts={}\n", .{data.num_accounts});
        // Parse recorded data to find matching account
        var offset: usize = 0;
        const buffer = data.data_ptr[0..data.data_len];

        var i: u32 = 0;
        while (i < data.num_accounts) : (i += 1) {
            // Read address (20 bytes)
            const addr_bytes = buffer[offset .. offset + 20];
            std.debug.print("DEBUG: Account {}: addr_bytes[0..4]={{ {}, {}, {}, {} }}\n", .{
                i,
                addr_bytes[0],
                addr_bytes[1],
                addr_bytes[2],
                addr_bytes[3],
            });
            offset += 20;

            // Check if matches requested address
            const matches = std.mem.eql(u8, &address.bytes, addr_bytes);
            std.debug.print("DEBUG: matches={}\n", .{matches});

            // Read balance (32 bytes, big-endian u256)
            const balance_bytes = buffer[offset .. offset + 32];
            var balance: u256 = 0;
            for (balance_bytes) |byte| {
                balance = (balance << 8) | byte;
            }
            offset += 32;

            // Read nonce (8 bytes, little-endian u64)
            const nonce = std.mem.readInt(u64, buffer[offset..][0..8], .little);
            offset += 8;

            // Skip code
            const code_len = std.mem.readInt(u32, buffer[offset..][0..4], .little);
            offset += 4 + code_len;

            // Read storage
            const storage_count = std.mem.readInt(u32, buffer[offset..][0..4], .little);
            offset += 4;

            if (matches) {
                // Build storage proof for requested slots
                const allocator = getAllocator();

                // If slots requested, find matching storage entries
                if (slots.len > 0 and storage_count > 0) {
                    const requested_slot = slots[0];

                    // Search through storage entries
                    var j: u32 = 0;
                    const storage_start_offset = offset;
                    while (j < storage_count) : (j += 1) {
                        const entry_offset = storage_start_offset + j * 64;
                        // Read slot (32 bytes, big-endian u256)
                        const slot_bytes = buffer[entry_offset .. entry_offset + 32];
                        var slot: u256 = 0;
                        for (slot_bytes) |byte| {
                            slot = (slot << 8) | byte;
                        }

                        // Read value (32 bytes, big-endian u256)
                        const value_bytes = buffer[entry_offset + 32 .. entry_offset + 64];
                        var value: u256 = 0;
                        for (value_bytes) |byte| {
                            value = (value << 8) | byte;
                        }

                        if (slot == requested_slot) {
                            // Found matching slot - create storage proof
                            const proof_array = allocator.alloc(RpcClient.EthProof.StorageProof, 1) catch return RpcClient.EthProof{
                                .nonce = nonce,
                                .balance = balance,
                                .code_hash = [_]u8{0} ** 32,
                                .storage_root = [_]u8{0} ** 32,
                                .storage_proof = &.{},
                            };
                            proof_array[0] = .{
                                .key = slot,
                                .value = value,
                                .proof = &.{},
                            };

                            return RpcClient.EthProof{
                                .nonce = nonce,
                                .balance = balance,
                                .code_hash = [_]u8{0} ** 32,
                                .storage_root = [_]u8{0} ** 32,
                                .storage_proof = proof_array,
                            };
                        }
                    }
                }

                // No matching storage slot found or no slots requested
                return RpcClient.EthProof{
                    .nonce = nonce,
                    .balance = balance,
                    .code_hash = [_]u8{0} ** 32,
                    .storage_root = [_]u8{0} ** 32,
                    .storage_proof = &.{},
                };
            }

            // Skip storage for non-matching account
            offset += storage_count * 64;
        }
    }

    // Not found - return empty account
    return RpcClient.EthProof{
        .nonce = 0,
        .balance = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
        .storage_proof = &.{},
    };
}

fn mockGetCode(ptr: *anyopaque, address: Address.Address, block_tag: []const u8) anyerror![]const u8 {
    _ = ptr;
    _ = block_tag;

    if (recorded_mock_data) |data| {
        var offset: usize = 0;
        const buffer = data.data_ptr[0..data.data_len];

        var i: u32 = 0;
        while (i < data.num_accounts) : (i += 1) {
            // Read address
            const addr_bytes = buffer[offset .. offset + 20];
            offset += 20;
            const matches = std.mem.eql(u8, &address.bytes, addr_bytes);

            // Skip balance and nonce
            offset += 32 + 8;

            // Read code
            const code_len = std.mem.readInt(u32, buffer[offset..][0..4], .little);
            offset += 4;
            const code_bytes = buffer[offset .. offset + code_len];
            const code_start = offset;
            offset += code_len;

            // Skip storage
            const storage_count = std.mem.readInt(u32, buffer[offset..][0..4], .little);
            offset += 4 + storage_count * 64;

            if (matches) {
                // Parse hex string to bytes
                if (code_len >= 2 and code_bytes[0] == '0' and code_bytes[1] == 'x') {
                    const hex_part = code_bytes[2..];
                    const allocator = getAllocator();
                    const result = allocator.alloc(u8, hex_part.len / 2) catch return &.{};
                    var j: usize = 0;
                    while (j < result.len) : (j += 1) {
                        const high = std.fmt.charToDigit(hex_part[j * 2], 16) catch 0;
                        const low = std.fmt.charToDigit(hex_part[j * 2 + 1], 16) catch 0;
                        result[j] = (high << 4) | low;
                    }
                    return result;
                }
                return buffer[code_start..][0..code_len];
            }
        }
    }

    return &.{};
}

const mock_vtable = RpcClient.VTable{
    .getProof = mockGetProof,
    .getCode = mockGetCode,
};

export fn fork_backend_create(
    rpc_client_ptr: *anyopaque,
    rpc_vtable: *const RpcClient.VTable,
    block_tag: [*:0]const u8,
    max_cache_size: usize,
) callconv(.c) ?ForkBackendHandle {
    std.debug.print("DEBUG: fork_backend_create called\n", .{});
    std.debug.print("DEBUG: rpc_client_ptr={*} rpc_vtable={*} max_cache_size={}\n", .{ rpc_client_ptr, rpc_vtable, max_cache_size });

    const rpc_ptr_int = @intFromPtr(rpc_client_ptr);
    const vtable_ptr_int = @intFromPtr(rpc_vtable);
    std.debug.print("DEBUG: rpc_ptr_int={} (type={s}) vtable_ptr_int={} (type={s})\n", .{
        rpc_ptr_int,
        @typeName(@TypeOf(rpc_ptr_int)),
        vtable_ptr_int,
        @typeName(@TypeOf(vtable_ptr_int)),
    });

    // MVP: Allow null pointers, will use mock vtable
    // if (rpc_ptr_int == 0) {
    //     std.debug.print("ERROR: fork_backend_create: rpc_client_ptr is null\n", .{});
    //     return null;
    // }
    if (@intFromPtr(block_tag) == 0) {
        std.debug.print("ERROR: fork_backend_create: block_tag is null\n", .{});
        return null;
    }

    std.debug.print("DEBUG: getting allocator...\n", .{});
    const allocator = getAllocator();
    std.debug.print("DEBUG: allocator obtained\n", .{});

    std.debug.print("DEBUG: allocating ForkBackend...\n", .{});
    const backend = allocator.create(ForkBackend) catch {
        std.debug.print("ERROR: allocator.create(ForkBackend) failed\n", .{});
        return null;
    };
    std.debug.print("DEBUG: backend allocated at {*}\n", .{backend});

    const block_tag_slice = std.mem.span(block_tag);
    std.debug.print("DEBUG: block_tag={s}\n", .{block_tag_slice});

    // MVP: Always use mock vtable (TypeScript vtable not implemented yet)
    const vtable_to_use = &mock_vtable;
    std.debug.print("DEBUG: Using mock vtable at {*}\n", .{vtable_to_use});

    const rpc_client = RpcClient{
        .ptr = rpc_client_ptr,
        .vtable = vtable_to_use,
    };
    std.debug.print("DEBUG: rpc_client initialized\n", .{});

    std.debug.print("DEBUG: calling ForkBackend.init...\n", .{});
    backend.* = ForkBackend.init(
        allocator,
        rpc_client,
        block_tag_slice,
        .{ .max_size = max_cache_size },
    ) catch |err| {
        std.debug.print("ERROR: ForkBackend.init failed: {}\n", .{err});
        allocator.destroy(backend);
        return null;
    };
    std.debug.print("DEBUG: ForkBackend created successfully\n", .{});

    return @ptrCast(backend);
}

/// Destroy ForkBackend
export fn fork_backend_destroy(handle: ForkBackendHandle) callconv(.c) void {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: fork_backend_destroy: handle is null\n", .{});
        return;
    }
    const allocator = getAllocator();
    const backend: *ForkBackend = @ptrCast(@alignCast(handle));
    backend.deinit();
    allocator.destroy(backend);
}

/// Clear fork backend caches
export fn fork_backend_clear_cache(handle: ForkBackendHandle) callconv(.c) void {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: fork_backend_clear_cache: handle is null\n", .{});
        return;
    }
    const backend: *ForkBackend = @ptrCast(@alignCast(handle));
    backend.clearCaches();
}

// ============================================================================
// Synchronous State Operations (In-Memory)
// ============================================================================

/// Get balance (sync version - returns 0 if needs async fetch)
/// Returns hex string in out_buffer (must be at least 67 bytes: "0x" + 64 hex digits + null)
export fn state_manager_get_balance_sync(
    handle: StateManagerHandle,
    address_hex: [*:0]const u8,
    out_buffer: [*]u8,
    buffer_len: usize,
) callconv(.c) c_int {
    std.debug.print("DEBUG: get_balance_sync called\n", .{});
    std.debug.print("DEBUG: handle={*} buffer_len={}\n", .{ handle, buffer_len });

    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_get_balance_sync: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(address_hex) == 0) {
        std.debug.print("ERROR: state_manager_get_balance_sync: address_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(out_buffer) == 0) {
        std.debug.print("ERROR: state_manager_get_balance_sync: out_buffer is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (buffer_len < 67) {
        std.debug.print("ERROR: state_manager_get_balance_sync: buffer_len ({d}) < 67\n", .{buffer_len});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }

    std.debug.print("DEBUG: casting handle to StateManager...\n", .{});
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    std.debug.print("DEBUG: manager cast successful at {*}\n", .{manager});

    const allocator = getAllocator();

    // Parse address
    const addr_slice = std.mem.span(address_hex);
    std.debug.print("DEBUG: address_hex={s}\n", .{addr_slice});

    std.debug.print("DEBUG: parsing address from hex...\n", .{});
    const addr = Address.fromHex(addr_slice) catch |err| {
        std.debug.print("ERROR: Address.fromHex failed: {}\n", .{err});
        return STATE_MANAGER_ERROR_INVALID_HEX;
    };
    std.debug.print("DEBUG: address parsed successfully\n", .{});

    // Get balance
    std.debug.print("DEBUG: calling manager.getBalance...\n", .{});
    const balance = manager.getBalance(addr) catch |err| {
        std.debug.print("ERROR: manager.getBalance failed: {}\n", .{err});
        return STATE_MANAGER_ERROR_RPC_FAILED;
    };
    std.debug.print("DEBUG: balance retrieved: {}\n", .{balance});

    // Convert to hex
    var hex_buffer: [66]u8 = undefined; // "0x" + 64 hex digits
    const hex_str = std.fmt.bufPrint(&hex_buffer, "0x{x:0>64}", .{balance}) catch unreachable;
    std.debug.print("DEBUG: hex_str={s}\n", .{hex_str});

    @memcpy(out_buffer[0..hex_str.len], hex_str);
    out_buffer[hex_str.len] = 0; // Null terminator
    std.debug.print("DEBUG: get_balance_sync completed successfully\n", .{});

    _ = allocator;
    return STATE_MANAGER_SUCCESS;
}

/// Set balance (always sync)
export fn state_manager_set_balance(
    handle: StateManagerHandle,
    address_hex: [*:0]const u8,
    balance_hex: [*:0]const u8,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_set_balance: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(address_hex) == 0) {
        std.debug.print("ERROR: state_manager_set_balance: address_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(balance_hex) == 0) {
        std.debug.print("ERROR: state_manager_set_balance: balance_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }

    const manager: *StateManager = @ptrCast(@alignCast(handle));

    // Parse address
    const addr_slice = std.mem.span(address_hex);
    const addr = Address.fromHex(addr_slice) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Parse balance
    const balance_slice = std.mem.span(balance_hex);
    const balance = std.fmt.parseInt(u256, balance_slice, 0) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Set balance
    manager.setBalance(addr, balance) catch return STATE_MANAGER_ERROR_OUT_OF_MEMORY;

    return STATE_MANAGER_SUCCESS;
}

/// Get nonce (sync version)
export fn state_manager_get_nonce_sync(
    handle: StateManagerHandle,
    address_hex: [*:0]const u8,
    out_nonce: *u64,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_get_nonce_sync: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(address_hex) == 0) {
        std.debug.print("ERROR: state_manager_get_nonce_sync: address_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(out_nonce) == 0) {
        std.debug.print("ERROR: state_manager_get_nonce_sync: out_nonce is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }

    const manager: *StateManager = @ptrCast(@alignCast(handle));

    // Parse address
    const addr_slice = std.mem.span(address_hex);
    const addr = Address.fromHex(addr_slice) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Get nonce
    const nonce = manager.getNonce(addr) catch return STATE_MANAGER_ERROR_RPC_FAILED;
    out_nonce.* = nonce;

    return STATE_MANAGER_SUCCESS;
}

/// Set nonce (always sync)
export fn state_manager_set_nonce(
    handle: StateManagerHandle,
    address_hex: [*:0]const u8,
    nonce: u64,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_set_nonce: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(address_hex) == 0) {
        std.debug.print("ERROR: state_manager_set_nonce: address_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }

    const manager: *StateManager = @ptrCast(@alignCast(handle));

    // Parse address
    const addr_slice = std.mem.span(address_hex);
    const addr = Address.fromHex(addr_slice) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Set nonce
    manager.setNonce(addr, nonce) catch return STATE_MANAGER_ERROR_OUT_OF_MEMORY;

    return STATE_MANAGER_SUCCESS;
}

/// Get storage slot (sync version)
export fn state_manager_get_storage_sync(
    handle: StateManagerHandle,
    address_hex: [*:0]const u8,
    slot_hex: [*:0]const u8,
    out_buffer: [*]u8,
    buffer_len: usize,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_get_storage_sync: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(address_hex) == 0) {
        std.debug.print("ERROR: state_manager_get_storage_sync: address_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(slot_hex) == 0) {
        std.debug.print("ERROR: state_manager_get_storage_sync: slot_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(out_buffer) == 0) {
        std.debug.print("ERROR: state_manager_get_storage_sync: out_buffer is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (buffer_len < 67) {
        std.debug.print("ERROR: state_manager_get_storage_sync: buffer_len ({d}) < 67\n", .{buffer_len});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }

    const manager: *StateManager = @ptrCast(@alignCast(handle));

    // Parse address
    const addr_slice = std.mem.span(address_hex);
    const addr = Address.fromHex(addr_slice) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Parse slot
    const slot_slice = std.mem.span(slot_hex);
    const slot = std.fmt.parseInt(u256, slot_slice, 0) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Get storage
    const value = manager.getStorage(addr, slot) catch return STATE_MANAGER_ERROR_RPC_FAILED;

    // Convert to hex
    var hex_buffer: [66]u8 = undefined;
    const hex_str = std.fmt.bufPrint(&hex_buffer, "0x{x:0>64}", .{value}) catch unreachable;

    @memcpy(out_buffer[0..hex_str.len], hex_str);
    out_buffer[hex_str.len] = 0;

    return STATE_MANAGER_SUCCESS;
}

/// Set storage slot (always sync)
export fn state_manager_set_storage(
    handle: StateManagerHandle,
    address_hex: [*:0]const u8,
    slot_hex: [*:0]const u8,
    value_hex: [*:0]const u8,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_set_storage: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(address_hex) == 0) {
        std.debug.print("ERROR: state_manager_set_storage: address_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(slot_hex) == 0) {
        std.debug.print("ERROR: state_manager_set_storage: slot_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(value_hex) == 0) {
        std.debug.print("ERROR: state_manager_set_storage: value_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }

    const manager: *StateManager = @ptrCast(@alignCast(handle));

    // Parse address
    const addr_slice = std.mem.span(address_hex);
    const addr = Address.fromHex(addr_slice) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Parse slot
    const slot_slice = std.mem.span(slot_hex);
    const slot = std.fmt.parseInt(u256, slot_slice, 0) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Parse value
    const value_slice = std.mem.span(value_hex);
    const value = std.fmt.parseInt(u256, value_slice, 0) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Set storage
    manager.setStorage(addr, slot, value) catch return STATE_MANAGER_ERROR_OUT_OF_MEMORY;

    return STATE_MANAGER_SUCCESS;
}

/// Get code length (sync, returns 0 if not cached)
export fn state_manager_get_code_len_sync(
    handle: StateManagerHandle,
    address_hex: [*:0]const u8,
    out_len: *usize,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_get_code_len_sync: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(address_hex) == 0) {
        std.debug.print("ERROR: state_manager_get_code_len_sync: address_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(out_len) == 0) {
        std.debug.print("ERROR: state_manager_get_code_len_sync: out_len is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }

    const manager: *StateManager = @ptrCast(@alignCast(handle));

    // Parse address
    const addr_slice = std.mem.span(address_hex);
    const addr = Address.fromHex(addr_slice) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Get code
    const code = manager.getCode(addr) catch {
        out_len.* = 0;
        return STATE_MANAGER_ERROR_RPC_FAILED;
    };
    out_len.* = code.len;

    return STATE_MANAGER_SUCCESS;
}

/// Get code bytes (sync, caller must allocate buffer)
export fn state_manager_get_code_sync(
    handle: StateManagerHandle,
    address_hex: [*:0]const u8,
    out_buffer: [*]u8,
    buffer_len: usize,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_get_code_sync: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(address_hex) == 0) {
        std.debug.print("ERROR: state_manager_get_code_sync: address_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(out_buffer) == 0) {
        std.debug.print("ERROR: state_manager_get_code_sync: out_buffer is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }

    const manager: *StateManager = @ptrCast(@alignCast(handle));

    // Parse address
    const addr_slice = std.mem.span(address_hex);
    const addr = Address.fromHex(addr_slice) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Get code
    const code = manager.getCode(addr) catch return STATE_MANAGER_ERROR_RPC_FAILED;

    if (code.len > buffer_len) return STATE_MANAGER_ERROR_INVALID_INPUT;

    @memcpy(out_buffer[0..code.len], code);

    return STATE_MANAGER_SUCCESS;
}

/// Set code (always sync)
export fn state_manager_set_code(
    handle: StateManagerHandle,
    address_hex: [*:0]const u8,
    code_ptr: [*]const u8,
    code_len: usize,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_set_code: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(address_hex) == 0) {
        std.debug.print("ERROR: state_manager_set_code: address_hex is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(code_ptr) == 0) {
        std.debug.print("ERROR: state_manager_set_code: code_ptr is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }

    const manager: *StateManager = @ptrCast(@alignCast(handle));

    // Parse address
    const addr_slice = std.mem.span(address_hex);
    const addr = Address.fromHex(addr_slice) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Set code
    const code = code_ptr[0..code_len];
    manager.setCode(addr, code) catch return STATE_MANAGER_ERROR_OUT_OF_MEMORY;

    return STATE_MANAGER_SUCCESS;
}

// ============================================================================
// Checkpoint Operations
// ============================================================================

/// Create checkpoint (for revert/commit)
export fn state_manager_checkpoint(handle: StateManagerHandle) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_checkpoint: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.checkpoint() catch return STATE_MANAGER_ERROR_OUT_OF_MEMORY;
    return STATE_MANAGER_SUCCESS;
}

/// Revert to last checkpoint
export fn state_manager_revert(handle: StateManagerHandle) callconv(.c) void {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_revert: handle is null\n", .{});
        return;
    }
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.revert();
}

/// Commit last checkpoint (merge into parent)
export fn state_manager_commit(handle: StateManagerHandle) callconv(.c) void {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_commit: handle is null\n", .{});
        return;
    }
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.commit();
}

// ============================================================================
// Snapshot Operations (for tevm_snapshot/tevm_revert)
// ============================================================================

/// Create snapshot, returns snapshot ID (or 0 on failure)
export fn state_manager_snapshot(
    handle: StateManagerHandle,
    out_snapshot_id: *u64,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_snapshot: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    if (@intFromPtr(out_snapshot_id) == 0) {
        std.debug.print("ERROR: state_manager_snapshot: out_snapshot_id is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    const snapshot_id = manager.snapshot() catch return STATE_MANAGER_ERROR_OUT_OF_MEMORY;
    out_snapshot_id.* = snapshot_id;
    return STATE_MANAGER_SUCCESS;
}

/// Revert to snapshot ID
export fn state_manager_revert_to_snapshot(
    handle: StateManagerHandle,
    snapshot_id: u64,
) callconv(.c) c_int {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_revert_to_snapshot: handle is null\n", .{});
        return STATE_MANAGER_ERROR_INVALID_INPUT;
    }
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.revertToSnapshot(snapshot_id) catch return STATE_MANAGER_ERROR_INVALID_SNAPSHOT;
    return STATE_MANAGER_SUCCESS;
}

// ============================================================================
// Cache Management
// ============================================================================

/// Clear all caches (normal + fork)
export fn state_manager_clear_caches(handle: StateManagerHandle) callconv(.c) void {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_clear_caches: handle is null\n", .{});
        return;
    }
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.clearCaches();
}

/// Clear only fork cache
export fn state_manager_clear_fork_cache(handle: StateManagerHandle) callconv(.c) void {
    if (@intFromPtr(handle) == 0) {
        std.debug.print("ERROR: state_manager_clear_fork_cache: handle is null\n", .{});
        return;
    }
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.clearForkCache();
}
