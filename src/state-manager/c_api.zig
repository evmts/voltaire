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
    const allocator = getAllocator();
    const manager = allocator.create(StateManager) catch return null;
    const fork: *ForkBackend = @ptrCast(@alignCast(fork_backend));
    manager.* = StateManager.init(allocator, fork) catch {
        allocator.destroy(manager);
        return null;
    };
    return @ptrCast(manager);
}

/// Destroy StateManager and free resources
export fn state_manager_destroy(handle: StateManagerHandle) callconv(.c) void {
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
/// Mock vtable functions for MVP (when TypeScript vtable is null)
fn mockGetProof(ptr: *anyopaque, address: Address.Address, slots: []const u256, block_tag: []const u8) anyerror!RpcClient.EthProof {
    _ = ptr;
    _ = address;
    _ = slots;
    _ = block_tag;
    // Return empty proof (MVP: no remote state fetching)
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
    _ = address;
    _ = block_tag;
    // Return empty code (MVP: no remote code fetching)
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
    const allocator = getAllocator();
    const backend = allocator.create(ForkBackend) catch return null;

    const block_tag_slice = std.mem.span(block_tag);

    // Use mock vtable if TypeScript passed null (MVP workaround)
    const vtable_to_use = if (@intFromPtr(rpc_vtable) == 0) &mock_vtable else rpc_vtable;

    const rpc_client = RpcClient{
        .ptr = rpc_client_ptr,
        .vtable = vtable_to_use,
    };

    backend.* = ForkBackend.init(
        allocator,
        rpc_client,
        block_tag_slice,
        .{ .max_size = max_cache_size },
    ) catch {
        allocator.destroy(backend);
        return null;
    };

    return @ptrCast(backend);
}

/// Destroy ForkBackend
export fn fork_backend_destroy(handle: ForkBackendHandle) callconv(.c) void {
    const allocator = getAllocator();
    const backend: *ForkBackend = @ptrCast(@alignCast(handle));
    backend.deinit();
    allocator.destroy(backend);
}

/// Clear fork backend caches
export fn fork_backend_clear_cache(handle: ForkBackendHandle) callconv(.c) void {
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
    if (buffer_len < 67) return STATE_MANAGER_ERROR_INVALID_INPUT;

    const manager: *StateManager = @ptrCast(@alignCast(handle));
    const allocator = getAllocator();

    // Parse address
    const addr_slice = std.mem.span(address_hex);
    const addr = Address.fromHex(addr_slice) catch return STATE_MANAGER_ERROR_INVALID_HEX;

    // Get balance
    const balance = manager.getBalance(addr) catch return STATE_MANAGER_ERROR_RPC_FAILED;

    // Convert to hex
    var hex_buffer: [66]u8 = undefined; // "0x" + 64 hex digits
    const hex_str = std.fmt.bufPrint(&hex_buffer, "0x{x:0>64}", .{balance}) catch unreachable;

    @memcpy(out_buffer[0..hex_str.len], hex_str);
    out_buffer[hex_str.len] = 0; // Null terminator

    _ = allocator;
    return STATE_MANAGER_SUCCESS;
}

/// Set balance (always sync)
export fn state_manager_set_balance(
    handle: StateManagerHandle,
    address_hex: [*:0]const u8,
    balance_hex: [*:0]const u8,
) callconv(.c) c_int {
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
    if (buffer_len < 67) return STATE_MANAGER_ERROR_INVALID_INPUT;

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
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.checkpoint() catch return STATE_MANAGER_ERROR_OUT_OF_MEMORY;
    return STATE_MANAGER_SUCCESS;
}

/// Revert to last checkpoint
export fn state_manager_revert(handle: StateManagerHandle) callconv(.c) void {
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.revert();
}

/// Commit last checkpoint (merge into parent)
export fn state_manager_commit(handle: StateManagerHandle) callconv(.c) void {
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
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.revertToSnapshot(snapshot_id) catch return STATE_MANAGER_ERROR_INVALID_SNAPSHOT;
    return STATE_MANAGER_SUCCESS;
}

// ============================================================================
// Cache Management
// ============================================================================

/// Clear all caches (normal + fork)
export fn state_manager_clear_caches(handle: StateManagerHandle) callconv(.c) void {
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.clearCaches();
}

/// Clear only fork cache
export fn state_manager_clear_fork_cache(handle: StateManagerHandle) callconv(.c) void {
    const manager: *StateManager = @ptrCast(@alignCast(handle));
    manager.clearForkCache();
}
