//! ForkBackend - fork-capable state fetching with async request/continue support
//!
//! Provides fork-capable state fetching from remote Ethereum chains with:
//! - Async request queue for WASM-friendly RPC bridging
//! - Configurable LRU caching with eviction policies
//! - Methods: fetchAccount, fetchStorage, fetchCode
//!
//! ## Usage
//! ```zig
//! const ForkBackend = @import("state-manager").ForkBackend;
//!
//! var backend = try ForkBackend.init(allocator, "latest", .{
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
const Hex = primitives.Hex;
const StateCache = @import("StateCache.zig");
const json = std.json;

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

/// Async RPC request kind
const RequestKind = enum {
    account_proof,
    storage_proof,
    code,
};

/// Pending request key for de-duplication
const PendingKey = struct {
    kind: RequestKind,
    address: Address.Address,
    slot: u256,
};

/// Pending request payload
pub const PendingRequest = struct {
    id: u64,
    kind: RequestKind,
    address: Address.Address,
    slot: u256,
    params_json: []u8,
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
    block_tag: []const u8,
    config: CacheConfig,

    // Caches
    account_cache: LruCache(Address.Address, StateCache.AccountState),
    storage_cache: std.AutoHashMap(Address.Address, std.AutoHashMap(u256, u256)),
    storage_access_order: std.ArrayList(struct { address: Address.Address, slot: u256 }),
    code_cache: std.AutoHashMap(Address.Address, []const u8),
    code_access_order: std.ArrayList(Address.Address),

    // Async RPC request management
    pending_queue: std.ArrayList(u64),
    pending_by_id: std.AutoHashMap(u64, PendingRequest),
    pending_keys: std.AutoHashMap(PendingKey, u64),
    next_request_id: u64,

    pub fn init(
        allocator: std.mem.Allocator,
        block_tag: []const u8,
        config: CacheConfig,
    ) !ForkBackend {
        return .{
            .allocator = allocator,
            .block_tag = try allocator.dupe(u8, block_tag),
            .config = config,
            .account_cache = LruCache(Address.Address, StateCache.AccountState).init(allocator),
            .storage_cache = std.AutoHashMap(Address.Address, std.AutoHashMap(u256, u256)).init(allocator),
            .storage_access_order = .{},
            .code_cache = std.AutoHashMap(Address.Address, []const u8).init(allocator),
            .code_access_order = .{},
            .pending_queue = .{},
            .pending_by_id = std.AutoHashMap(u64, PendingRequest).init(allocator),
            .pending_keys = std.AutoHashMap(PendingKey, u64).init(allocator),
            .next_request_id = 1,
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

        var pending_it = self.pending_by_id.valueIterator();
        while (pending_it.next()) |req| {
            self.allocator.free(req.params_json);
        }
        self.pending_by_id.deinit();
        self.pending_queue.deinit(self.allocator);
        self.pending_keys.deinit();
    }

    /// Fetch account from remote, cache result
    pub fn fetchAccount(self: *ForkBackend, address: Address.Address) !StateCache.AccountState {
        // Check cache first
        if (self.account_cache.get(address)) |cached| {
            try self.updateAccountAccessOrder(address);
            return cached;
        }

        // Queue async request and signal pending
        try self.queueRequest(.account_proof, address, 0);
        return error.RpcPending;
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

        // Queue async request and signal pending
        try self.queueRequest(.storage_proof, address, slot);
        return error.RpcPending;
    }

    /// Fetch contract code from remote, cache result
    pub fn fetchCode(self: *ForkBackend, address: Address.Address) ![]const u8 {
        // Check cache first
        if (self.code_cache.get(address)) |cached| {
            try self.updateCodeAccessOrder(address);
            return cached;
        }

        // Queue async request and signal pending
        try self.queueRequest(.code, address, 0);
        return error.RpcPending;
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

    // =====================================================================
    // Async RPC Request Queue
    // =====================================================================

    pub fn peekNextRequest(self: *ForkBackend) ?PendingRequest {
        if (self.pending_queue.items.len == 0) return null;
        const request_id = self.pending_queue.items[0];
        return self.pending_by_id.get(request_id);
    }

    pub fn nextRequest(self: *ForkBackend) ?PendingRequest {
        if (self.pending_queue.items.len == 0) return null;
        const request_id = self.pending_queue.items[0];
        _ = self.pending_queue.orderedRemove(0);
        return self.pending_by_id.get(request_id);
    }

    pub fn continueRequest(self: *ForkBackend, request_id: u64, response: []const u8) !void {
        const request = self.pending_by_id.get(request_id) orelse return error.InvalidRequest;
        defer {
            _ = self.pending_by_id.remove(request_id);
            _ = self.pending_keys.remove(PendingKey{
                .kind = request.kind,
                .address = request.address,
                .slot = request.slot,
            });
            self.allocator.free(request.params_json);
        }

        switch (request.kind) {
            .code => try self.handleCodeResponse(request.address, response),
            .account_proof, .storage_proof => try self.handleProofResponse(request, response),
        }
    }

    fn queueRequest(self: *ForkBackend, kind: RequestKind, address: Address.Address, slot: u256) !void {
        const key = PendingKey{
            .kind = kind,
            .address = address,
            .slot = slot,
        };
        if (self.pending_keys.contains(key)) return;

        const params_json = try self.buildParamsJson(kind, address, slot);
        const request_id = self.next_request_id;
        self.next_request_id += 1;

        try self.pending_by_id.put(request_id, .{
            .id = request_id,
            .kind = kind,
            .address = address,
            .slot = slot,
            .params_json = params_json,
        });
        try self.pending_queue.append(self.allocator, request_id);
        try self.pending_keys.put(key, request_id);
    }

    fn buildParamsJson(
        self: *ForkBackend,
        kind: RequestKind,
        address: Address.Address,
        slot: u256,
    ) ![]u8 {
        const addr_hex = Address.toHex(address);
        switch (kind) {
            .account_proof => {
                return std.fmt.allocPrint(self.allocator, "[\"{s}\",[],\"{s}\"]", .{
                    addr_hex[0..],
                    self.block_tag,
                });
            },
            .storage_proof => {
                var slot_buf: [66]u8 = undefined;
                const slot_hex = std.fmt.bufPrint(&slot_buf, "0x{x:0>64}", .{slot}) catch unreachable;
                return std.fmt.allocPrint(self.allocator, "[\"{s}\",[\"{s}\"],\"{s}\"]", .{
                    addr_hex[0..],
                    slot_hex,
                    self.block_tag,
                });
            },
            .code => {
                return std.fmt.allocPrint(self.allocator, "[\"{s}\",\"{s}\"]", .{
                    addr_hex[0..],
                    self.block_tag,
                });
            },
        }
    }

    fn handleCodeResponse(self: *ForkBackend, address: Address.Address, response: []const u8) !void {
        const parsed = try json.parseFromSlice(json.Value, self.allocator, response, .{});
        defer parsed.deinit();

        if (parsed.value != .string) return error.InvalidResponse;
        const code_hex = parsed.value.string;
        const code_bytes = Hex.hexToBytes(self.allocator, code_hex) catch return error.InvalidResponse;

        if (self.config.eviction_policy == .lru and self.code_cache.count() >= self.config.max_size) {
            try self.evictOldestCode();
        }

        if (self.code_cache.get(address)) |existing| {
            self.allocator.free(existing);
        }
        try self.code_cache.put(address, code_bytes);
        try self.updateCodeAccessOrder(address);
    }

    fn handleProofResponse(self: *ForkBackend, request: PendingRequest, response: []const u8) !void {
        const parsed = try json.parseFromSlice(json.Value, self.allocator, response, .{});
        defer parsed.deinit();

        if (parsed.value != .object) return error.InvalidResponse;
        const obj = parsed.value.object;

        const nonce_val = obj.get("nonce") orelse return error.InvalidResponse;
        const balance_val = obj.get("balance") orelse return error.InvalidResponse;

        const nonce = parseHexU64(nonce_val.string) catch return error.InvalidResponse;
        const balance = parseHexU256(balance_val.string) catch return error.InvalidResponse;

        const code_hash = if (obj.get("codeHash")) |ch|
            parseHexFixed(32, ch.string) catch Hash.ZERO
        else
            Hash.ZERO;
        const storage_root = if (obj.get("storageHash")) |sr|
            parseHexFixed(32, sr.string) catch Hash.ZERO
        else if (obj.get("storageRoot")) |sr_alt|
            parseHexFixed(32, sr_alt.string) catch Hash.ZERO
        else
            Hash.ZERO;

        const account = StateCache.AccountState{
            .nonce = nonce,
            .balance = balance,
            .code_hash = code_hash,
            .storage_root = storage_root,
        };
        try self.putAccountState(request.address, account);

        if (request.kind == .storage_proof) {
            if (obj.get("storageProof")) |proof_val| {
                if (proof_val == .array) {
                    for (proof_val.array.items) |entry| {
                        if (entry != .object) continue;
                        const entry_obj = entry.object;
                        const key_val = entry_obj.get("key") orelse continue;
                        const value_val = entry_obj.get("value") orelse continue;
                        const slot = parseHexU256(key_val.string) catch continue;
                        const value = parseHexU256(value_val.string) catch continue;
                        try self.putStorageValue(request.address, slot, value);
                    }
                }
            }
        }
    }

    fn putAccountState(self: *ForkBackend, address: Address.Address, account: StateCache.AccountState) !void {
        if (self.config.eviction_policy == .lru and self.account_cache.count() >= self.config.max_size) {
            try self.evictOldestAccount();
        }
        try self.account_cache.put(self.allocator, address, account);
        try self.updateAccountAccessOrder(address);
    }

    fn putStorageValue(self: *ForkBackend, address: Address.Address, slot: u256, value: u256) !void {
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

        const result = try self.storage_cache.getOrPut(address);
        if (!result.found_existing) {
            result.value_ptr.* = std.AutoHashMap(u256, u256).init(self.allocator);
        }
        try result.value_ptr.put(slot, value);
        try self.updateStorageAccessOrder(address, slot);
    }

    fn parseHexU64(hex: []const u8) !u64 {
        if (hex.len == 0) return 0;
        const stripped = if (std.mem.startsWith(u8, hex, "0x")) hex[2..] else hex;
        if (stripped.len == 0) return 0;
        return std.fmt.parseInt(u64, stripped, 16);
    }

    fn parseHexU256(hex: []const u8) !u256 {
        if (hex.len == 0) return 0;
        const stripped = if (std.mem.startsWith(u8, hex, "0x")) hex[2..] else hex;
        if (stripped.len == 0) return 0;
        var result: u256 = 0;
        for (stripped) |c| {
            const digit: u256 = switch (c) {
                '0'...'9' => c - '0',
                'a'...'f' => c - 'a' + 10,
                'A'...'F' => c - 'A' + 10,
                else => return error.InvalidHex,
            };
            result = result * 16 + digit;
        }
        return result;
    }

    fn parseHexFixed(comptime N: usize, hex: []const u8) ![N]u8 {
        if (!std.mem.startsWith(u8, hex, "0x")) return error.InvalidHex;
        return Hex.hexToBytesFixed(N, hex);
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
