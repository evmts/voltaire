/// ForkStateManager - HostInterface implementation that proxies state to a remote RPC on cache miss
///
/// This state manager provides a HostInterface for the Zig EVM that:
/// - Maintains local caches for balances, code, nonces, and storage slots
/// - On cache miss, fetches data from an injected remote JSON-RPC client
/// - Supports fixed fork blockNumber semantics (reads at a specific block)
/// - Allows local mutations via set* methods which override remote values
///
/// Design notes:
/// - No direct I/O is performed here; all remote calls are injected via vtable
/// - Caches use AutoHashMap with simple keys ([20]u8 for account-scoped values, StorageKey for storage)
/// - Code bytes are copied into manager-owned memory for stable lifetimes
/// - Callers must call deinit() to free allocated memory held by this manager
const std = @import("std");
const primitives = @import("primitives");
const host = @import("host.zig");

const Address = primitives.Address.Address;
const StorageKey = primitives.StorageKey;

pub const ForkStateManager = struct {
    allocator: std.mem.Allocator,

    // Fixed fork read point; if null, remote decides default (e.g., latest)
    fork_block_number: ?u64 = null,

    // Injected remote RPC client
    remote: *const RpcClient,

    // Caches
    balances: std.AutoHashMap([20]u8, u256),
    nonces: std.AutoHashMap([20]u8, u64),
    codes: std.AutoHashMap([20]u8, []u8),
    storage: std.AutoHashMap(StorageKey, u256),

    pub fn init(allocator: std.mem.Allocator, remote: *const RpcClient, fork_block_number: ?u64) !*ForkStateManager {
        var self = try allocator.create(ForkStateManager);
        self.allocator = allocator;
        self.remote = remote;
        self.fork_block_number = fork_block_number;
        self.balances = std.AutoHashMap([20]u8, u256).init(allocator);
        self.nonces = std.AutoHashMap([20]u8, u64).init(allocator);
        self.codes = std.AutoHashMap([20]u8, []u8).init(allocator);
        self.storage = std.AutoHashMap(StorageKey, u256).init(allocator);
        return self;
    }

    pub fn deinit(self: *ForkStateManager) void {
        // Free code byte slices we own
        var it = self.codes.iterator();
        while (it.next()) |entry| {
            self.allocator.free(entry.value_ptr.*);
        }
        self.codes.deinit();
        self.balances.deinit();
        self.nonces.deinit();
        self.storage.deinit();
        self.allocator.destroy(self);
    }

    /// Expose as a HostInterface for the EVM
    pub fn asHost(self: *ForkStateManager) host.HostInterface {
        return .{ .ptr = self, .vtable = &HostVTable };
    }

    // Host vtable
    const HostVTable = host.HostInterface.VTable{
        .getBalance = getBalance,
        .setBalance = setBalance,
        .getCode = getCode,
        .setCode = setCode,
        .getStorage = getStorage,
        .setStorage = setStorage,
        .getNonce = getNonce,
        .setNonce = setNonce,
    };

    fn addrKey(addr: Address) [20]u8 {
        return addr.bytes;
    }

    // VTable implementations -------------------------------------------------

    fn getBalance(ptr: *anyopaque, address: Address) u256 {
        const self: *ForkStateManager = @ptrCast(@alignCast(ptr));
        const key = addrKey(address);
        if (self.balances.get(key)) |val| return val;
        // Fetch from remote and cache
        const val = self.remote.vtable.getBalance(self.remote.ptr, address, self.fork_block_number);
        _ = self.balances.put(key, val) catch {};
        return val;
    }

    fn setBalance(ptr: *anyopaque, address: Address, balance: u256) void {
        const self: *ForkStateManager = @ptrCast(@alignCast(ptr));
        _ = self.balances.put(addrKey(address), balance) catch {};
    }

    fn getCode(ptr: *anyopaque, address: Address) []const u8 {
        const self: *ForkStateManager = @ptrCast(@alignCast(ptr));
        const key = addrKey(address);
        if (self.codes.get(key)) |bytes| return bytes;
        // Fetch from remote
        const remote_bytes = self.remote.vtable.getCode(self.remote.ptr, address, self.fork_block_number, self.allocator);
        // Take ownership by copying into manager-owned slice (defensive against remote allocator differences)
        var owned: []u8 = remote_bytes;
        // If remote did not use our allocator, copy into our memory.
        // We conservatively always dup to ensure ownership consistency.
        const dupd = self.allocator.dupe(u8, owned) catch {
            // On OOM, return empty code (safe fallback)
            return &[_]u8{};
        };
        _ = self.codes.put(key, dupd) catch {};
        return dupd;
    }

    fn setCode(ptr: *anyopaque, address: Address, code: []const u8) void {
        const self: *ForkStateManager = @ptrCast(@alignCast(ptr));
        const key = addrKey(address);
        // Free previous code if present
        if (self.codes.fetchRemove(key)) |kv| {
            self.allocator.free(kv.value);
        }
        const dupd = self.allocator.dupe(u8, code) catch {
            // If allocation fails, keep no code
            return;
        };
        _ = self.codes.put(key, dupd) catch {};
    }

    fn getStorage(ptr: *anyopaque, address: Address, slot: u256) u256 {
        const self: *ForkStateManager = @ptrCast(@alignCast(ptr));
        const key = StorageKey{ .address = address.bytes, .slot = slot };
        if (self.storage.get(key)) |val| return val;
        const val = self.remote.vtable.getStorageAt(self.remote.ptr, address, slot, self.fork_block_number);
        _ = self.storage.put(key, val) catch {};
        return val;
    }

    fn setStorage(ptr: *anyopaque, address: Address, slot: u256, value: u256) void {
        const self: *ForkStateManager = @ptrCast(@alignCast(ptr));
        const key = StorageKey{ .address = address.bytes, .slot = slot };
        _ = self.storage.put(key, value) catch {};
    }

    fn getNonce(ptr: *anyopaque, address: Address) u64 {
        const self: *ForkStateManager = @ptrCast(@alignCast(ptr));
        const key = addrKey(address);
        if (self.nonces.get(key)) |val| return val;
        const val = self.remote.vtable.getNonce(self.remote.ptr, address, self.fork_block_number);
        _ = self.nonces.put(key, val) catch {};
        return val;
    }

    fn setNonce(ptr: *anyopaque, address: Address, nonce: u64) void {
        const self: *ForkStateManager = @ptrCast(@alignCast(ptr));
        _ = self.nonces.put(addrKey(address), nonce) catch {};
    }
};

/// RpcClient - injected remote access interface for forking reads
/// All functions must be pure (no state mutation) and thread-safe if used across threads.
pub const RpcClient = struct {
    ptr: *anyopaque,
    vtable: *const VTable,

    pub const VTable = struct {
        /// eth_getBalance(address, blockTag)
        getBalance: *const fn (ptr: *anyopaque, address: Address, block_number: ?u64) u256,

        /// eth_getCode(address, blockTag). The returned slice must be allocated and valid until next call;
        /// ForkStateManager will duplicate (copy) into its own allocator for ownership.
        getCode: *const fn (
            ptr: *anyopaque,
            address: Address,
            block_number: ?u64,
            allocator: std.mem.Allocator,
        ) []u8,

        /// eth_getStorageAt(address, slot, blockTag)
        getStorageAt: *const fn (ptr: *anyopaque, address: Address, slot: u256, block_number: ?u64) u256,

        /// eth_getTransactionCount(address, blockTag)
        getNonce: *const fn (ptr: *anyopaque, address: Address, block_number: ?u64) u64,
    };
};
