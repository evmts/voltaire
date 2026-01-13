//! ForkBackend - RPC client for fetching remote state with configurable LRU caching
//!
//! Provides fork-capable state fetching from remote Ethereum chains with:
//! - Transport abstraction (HTTP/WebSocket/IPC) via vtable
//! - Configurable LRU caching with eviction policies
//! - Methods: fetchAccount, fetchStorage, fetchCode
//!
//! ## Usage
//! ```zig
//! const ForkBackend = @import("state-manager").ForkBackend;
//!
//! var backend = try ForkBackend.init(allocator, rpc_client, "latest", .{
//!     .max_size = 10000,
//!     .eviction_policy = .lru,
//! });
//! defer backend.deinit();
//!
//! const account = try backend.fetchAccount(address);
//! const storage = try backend.fetchStorage(address, slot);
//! const code = try backend.fetchCode(address);
//! ```

const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;
const Hash = primitives.Hash;
const StateCache = @import("StateCache.zig");

/// Cache configuration
pub const CacheConfig = struct {
    max_size: usize = 10000,
    eviction_policy: EvictionPolicy = .lru,

    pub const EvictionPolicy = enum {
        lru, // Least Recently Used (default)
        fifo, // First In First Out
        none, // No eviction (unbounded)
    };
};

/// Transport configuration union
pub const Transport = union(enum) {
    http: HttpConfig,
    websocket: WebSocketConfig,
    ipc: IpcConfig,

    pub const HttpConfig = struct {
        url: []const u8,
        timeout_ms: u64 = 30000,
    };

    pub const WebSocketConfig = struct {
        url: []const u8,
        timeout_ms: u64 = 30000,
    };

    pub const IpcConfig = struct {
        path: []const u8,
    };
};

/// RPC client vtable for transport abstraction
pub const RpcClient = struct {
    ptr: *anyopaque,
    vtable: *const VTable,

    pub const VTable = struct {
        getProof: *const fn (
            ptr: *anyopaque,
            address: Address.Address,
            slots: []const u256,
            block_tag: []const u8,
        ) anyerror!EthProof,
        getCode: *const fn (
            ptr: *anyopaque,
            address: Address.Address,
            block_tag: []const u8,
        ) anyerror![]const u8,
    };

    pub const EthProof = struct {
        nonce: u64,
        balance: u256,
        code_hash: Hash.Hash,
        storage_root: Hash.Hash,
        storage_proof: []StorageProof,

        pub const StorageProof = struct {
            key: u256,
            value: u256,
            proof: [][]const u8,
        };
    };

    pub fn getProof(
        self: RpcClient,
        address: Address.Address,
        slots: []const u256,
        block_tag: []const u8,
    ) !EthProof {
        return self.vtable.getProof(self.ptr, address, slots, block_tag);
    }

    pub fn getCode(
        self: RpcClient,
        address: Address.Address,
        block_tag: []const u8,
    ) ![]const u8 {
        return self.vtable.getCode(self.ptr, address, block_tag);
    }
};

/// LRU cache entry with access tracking
fn LruCache(comptime K: type, comptime V: type) type {
    return struct {
        const Self = @This();

        cache: std.AutoHashMap(K, V),
        access_order: std.ArrayList(K),

        pub fn init(allocator: std.mem.Allocator) Self {
            return .{
                .cache = std.AutoHashMap(K, V).init(allocator),
                .access_order = .{},
            };
        }

        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            self.cache.deinit();
            self.access_order.deinit(allocator);
        }

        pub fn get(self: *Self, key: K) ?V {
            return self.cache.get(key);
        }

        pub fn put(self: *Self, allocator: std.mem.Allocator, key: K, value: V) !void {
            try self.cache.put(key, value);
            try self.access_order.append(allocator, key);
        }

        pub fn remove(self: *Self, key: K) bool {
            return self.cache.remove(key);
        }

        pub fn count(self: *Self) usize {
            return self.cache.count();
        }

        pub fn clearRetainingCapacity(self: *Self) void {
            self.cache.clearRetainingCapacity();
            self.access_order.clearRetainingCapacity();
        }
    };
}

/// Fork backend with configurable LRU caching
pub const ForkBackend = struct {
    allocator: std.mem.Allocator,
    rpc_client: RpcClient,
    block_tag: []const u8,
    config: CacheConfig,

    // Caches
    account_cache: LruCache(Address.Address, StateCache.AccountState),
    storage_cache: std.AutoHashMap(Address.Address, std.AutoHashMap(u256, u256)),
    storage_access_order: std.ArrayList(struct { address: Address.Address, slot: u256 }),
    code_cache: std.AutoHashMap(Address.Address, []const u8),
    code_access_order: std.ArrayList(Address.Address),

    pub fn init(
        allocator: std.mem.Allocator,
        rpc_client: RpcClient,
        block_tag: []const u8,
        config: CacheConfig,
    ) !ForkBackend {
        return .{
            .allocator = allocator,
            .rpc_client = rpc_client,
            .block_tag = try allocator.dupe(u8, block_tag),
            .config = config,
            .account_cache = LruCache(Address.Address, StateCache.AccountState).init(allocator),
            .storage_cache = std.AutoHashMap(Address.Address, std.AutoHashMap(u256, u256)).init(allocator),
            .storage_access_order = .{},
            .code_cache = std.AutoHashMap(Address.Address, []const u8).init(allocator),
            .code_access_order = .{},
        };
    }

    pub fn deinit(self: *ForkBackend) void {
        self.allocator.free(self.block_tag);
        self.account_cache.deinit(self.allocator);

        // Cleanup storage cache nested maps
        var storage_it = self.storage_cache.valueIterator();
        while (storage_it.next()) |slots| {
            slots.deinit();
        }
        self.storage_cache.deinit();
        self.storage_access_order.deinit(self.allocator);

        // Cleanup code cache buffers
        var code_it = self.code_cache.valueIterator();
        while (code_it.next()) |code| {
            self.allocator.free(code.*);
        }
        self.code_cache.deinit();
        self.code_access_order.deinit(self.allocator);
    }

    /// Fetch account from remote, cache result
    pub fn fetchAccount(self: *ForkBackend, address: Address.Address) !StateCache.AccountState {
        std.debug.print("DEBUG: ForkBackend.fetchAccount called\n", .{});
        std.debug.print("DEBUG: self={*}\n", .{self});
        std.debug.print("DEBUG: address bytes[0..4]={any}\n", .{address.bytes[0..4]});

        // Check cache first
        std.debug.print("DEBUG: checking cache...\n", .{});
        if (self.account_cache.get(address)) |cached| {
            std.debug.print("DEBUG: found in cache\n", .{});
            try self.updateAccountAccessOrder(address);
            return cached;
        }

        std.debug.print("DEBUG: not in cache, calling RPC...\n", .{});
        std.debug.print("DEBUG: rpc_client.ptr={*}\n", .{self.rpc_client.ptr});
        std.debug.print("DEBUG: rpc_client.vtable={*}\n", .{self.rpc_client.vtable});
        std.debug.print("DEBUG: rpc_client.vtable.getProof={*}\n", .{self.rpc_client.vtable.getProof});
        std.debug.print("DEBUG: block_tag={s}\n", .{self.block_tag});

        // Fetch from RPC
        const slots: []const u256 = &[_]u256{}; // Empty for account-only proof
        std.debug.print("DEBUG: about to call rpc_client.getProof...\n", .{});
        const proof = try self.rpc_client.getProof(address, slots, self.block_tag);
        std.debug.print("DEBUG: RPC call completed\n", .{});

        const account = StateCache.AccountState{
            .nonce = proof.nonce,
            .balance = proof.balance,
            .code_hash = proof.code_hash,
            .storage_root = proof.storage_root,
        };

        // Evict if at capacity (LRU only)
        if (self.config.eviction_policy == .lru and self.account_cache.count() >= self.config.max_size) {
            try self.evictOldestAccount();
        }

        // Cache and return
        try self.account_cache.put(self.allocator, address, account);
        std.debug.print("DEBUG: returning account\n", .{});
        return account;
    }

    /// Fetch storage slot from remote, cache result
    pub fn fetchStorage(self: *ForkBackend, address: Address.Address, slot: u256) !u256 {
        // Check cache first
        if (self.storage_cache.get(address)) |slots| {
            if (slots.get(slot)) |value| {
                try self.updateStorageAccessOrder(address, slot);
                return value;
            }
        }

        // Fetch from RPC
        const slots_array = [_]u256{slot};
        const proof = try self.rpc_client.getProof(address, &slots_array, self.block_tag);

        const value = if (proof.storage_proof.len > 0)
            proof.storage_proof[0].value
        else
            0;

        // Evict if at capacity (LRU only)
        if (self.config.eviction_policy == .lru) {
            var total_slots: usize = 0;
            var it = self.storage_cache.valueIterator();
            while (it.next()) |slots| {
                total_slots += slots.count();
            }
            if (total_slots >= self.config.max_size) {
                try self.evictOldestStorage();
            }
        }

        // Cache and return
        const result = try self.storage_cache.getOrPut(address);
        if (!result.found_existing) {
            result.value_ptr.* = std.AutoHashMap(u256, u256).init(self.allocator);
        }
        try result.value_ptr.put(slot, value);
        try self.storage_access_order.append(self.allocator, .{ .address = address, .slot = slot });

        return value;
    }

    /// Fetch contract code from remote, cache result
    pub fn fetchCode(self: *ForkBackend, address: Address.Address) ![]const u8 {
        // Check cache first
        if (self.code_cache.get(address)) |cached| {
            try self.updateCodeAccessOrder(address);
            return cached;
        }

        // Fetch from RPC
        const code = try self.rpc_client.getCode(address, self.block_tag);

        // Evict if at capacity (LRU only)
        if (self.config.eviction_policy == .lru and self.code_cache.count() >= self.config.max_size) {
            try self.evictOldestCode();
        }

        // Make owned copy and cache
        const code_copy = try self.allocator.dupe(u8, code);
        try self.code_cache.put(address, code_copy);
        try self.code_access_order.append(self.allocator, address);

        return code_copy;
    }

    /// Clear all caches
    pub fn clearCaches(self: *ForkBackend) void {
        self.account_cache.clearRetainingCapacity();

        var storage_it = self.storage_cache.valueIterator();
        while (storage_it.next()) |slots| {
            slots.deinit();
        }
        self.storage_cache.clearRetainingCapacity();
        self.storage_access_order.clearRetainingCapacity();

        var code_it = self.code_cache.valueIterator();
        while (code_it.next()) |code| {
            self.allocator.free(code.*);
        }
        self.code_cache.clearRetainingCapacity();
        self.code_access_order.clearRetainingCapacity();
    }

    // Access order tracking (for LRU)
    fn updateAccountAccessOrder(self: *ForkBackend, address: Address.Address) !void {
        // Remove old entry
        var i: usize = 0;
        while (i < self.account_cache.access_order.items.len) : (i += 1) {
            if (std.mem.eql(u8, &self.account_cache.access_order.items[i].bytes, &address.bytes)) {
                _ = self.account_cache.access_order.orderedRemove(i);
                break;
            }
        }
        // Append to end (most recent)
        try self.account_cache.access_order.append(self.allocator, address);
    }

    fn updateStorageAccessOrder(self: *ForkBackend, address: Address.Address, slot: u256) !void {
        // Remove old entry
        var i: usize = 0;
        while (i < self.storage_access_order.items.len) : (i += 1) {
            const entry = self.storage_access_order.items[i];
            if (std.mem.eql(u8, &entry.address.bytes, &address.bytes) and entry.slot == slot) {
                _ = self.storage_access_order.orderedRemove(i);
                break;
            }
        }
        // Append to end (most recent)
        try self.storage_access_order.append(self.allocator, .{ .address = address, .slot = slot });
    }

    fn updateCodeAccessOrder(self: *ForkBackend, address: Address.Address) !void {
        // Remove old entry
        var i: usize = 0;
        while (i < self.code_access_order.items.len) : (i += 1) {
            if (std.mem.eql(u8, &self.code_access_order.items[i].bytes, &address.bytes)) {
                _ = self.code_access_order.orderedRemove(i);
                break;
            }
        }
        // Append to end (most recent)
        try self.code_access_order.append(self.allocator, address);
    }

    // Eviction (LRU)
    fn evictOldestAccount(self: *ForkBackend) !void {
        if (self.account_cache.access_order.items.len == 0) return;
        const oldest = self.account_cache.access_order.orderedRemove(0);
        _ = self.account_cache.remove(oldest);
    }

    fn evictOldestStorage(self: *ForkBackend) !void {
        if (self.storage_access_order.items.len == 0) return;
        const oldest = self.storage_access_order.orderedRemove(0);
        if (self.storage_cache.getPtr(oldest.address)) |slots| {
            _ = slots.remove(oldest.slot);
        }
    }

    fn evictOldestCode(self: *ForkBackend) !void {
        if (self.code_access_order.items.len == 0) return;
        const oldest = self.code_access_order.orderedRemove(0);
        if (self.code_cache.fetchRemove(oldest)) |entry| {
            self.allocator.free(entry.value);
        }
    }
};

// Tests
test "ForkBackend - cache configuration" {
    const config_default = CacheConfig{};
    try std.testing.expectEqual(@as(usize, 10000), config_default.max_size);
    try std.testing.expectEqual(CacheConfig.EvictionPolicy.lru, config_default.eviction_policy);

    const config_custom = CacheConfig{ .max_size = 5000, .eviction_policy = .none };
    try std.testing.expectEqual(@as(usize, 5000), config_custom.max_size);
    try std.testing.expectEqual(CacheConfig.EvictionPolicy.none, config_custom.eviction_policy);
}

test "ForkBackend - transport union" {
    const http_transport = Transport{ .http = .{ .url = "https://eth-mainnet.example.com" } };
    try std.testing.expect(http_transport == .http);

    const ws_transport = Transport{ .websocket = .{ .url = "wss://eth-mainnet.example.com" } };
    try std.testing.expect(ws_transport == .websocket);

    const ipc_transport = Transport{ .ipc = .{ .path = "/tmp/geth.ipc" } };
    try std.testing.expect(ipc_transport == .ipc);
}
