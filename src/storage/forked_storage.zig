//! Forked storage implementation with RPC backend
//! 
//! Provides a storage backend that fetches state from a remote blockchain via RPC.
//! Uses a multi-tier cache system to minimize RPC calls and improve performance.

const std = @import("std");
const primitives = @import("primitives");
const Account = @import("database_interface_account.zig").Account;
const RpcClient = @import("rpc_client.zig").RpcClient;
const cache_storage = @import("cache_storage.zig");
const HotStorage = cache_storage.HotStorage;
const WarmStorage = cache_storage.WarmStorage;
const StorageKey = cache_storage.StorageKey;

/// Forked storage that fetches state from remote RPC
pub const ForkedStorage = struct {
    /// L1 Cache - Hot storage for frequently accessed items
    hot: HotStorage,
    /// L2 Cache - Warm storage with LRU eviction
    warm: *WarmStorage,
    /// L3 Cache - Original fork values (never evicted)
    fork_cache: HotStorage,
    /// RPC client for fetching remote state
    rpc: RpcClient,
    /// Fork block number
    fork_block: u64,
    /// Allocator
    allocator: std.mem.Allocator,
    /// Stats
    stats: Stats,
    
    const Self = @This();
    
    pub const Stats = struct {
        cache_hits: u64 = 0,
        cache_misses: u64 = 0,
        rpc_calls: u64 = 0,
    };
    
    pub fn init(allocator: std.mem.Allocator, rpc_endpoint: []const u8, fork_block: ?u64) !Self {
        const hot = HotStorage.init(allocator);
        const fork_cache = HotStorage.init(allocator);
        
        const warm = try allocator.create(WarmStorage);
        warm.* = try WarmStorage.init(allocator, null);
        
        const rpc = try RpcClient.init(allocator, rpc_endpoint, fork_block);
        
        return .{
            .hot = hot,
            .warm = warm,
            .fork_cache = fork_cache,
            .rpc = rpc,
            .fork_block = fork_block orelse std.math.maxInt(u64),
            .allocator = allocator,
            .stats = .{},
        };
    }
    
    pub fn deinit(self: *Self) void {
        self.hot.deinit();
        self.warm.deinit();
        self.allocator.destroy(self.warm);
        self.fork_cache.deinit();
        self.rpc.deinit();
    }
    
    // Account operations
    
    pub fn get_account(self: *Self, address: [20]u8) !?Account {
        // Check L1 hot cache
        if (self.hot.getAccount(address)) |account| {
            self.stats.cache_hits += 1;
            return account;
        }
        
        // Check L2 warm cache
        if (self.warm.getAccount(address)) |account| {
            self.stats.cache_hits += 1;
            // Promote to hot cache
            try self.hot.putAccount(address, account);
            return account;
        }
        
        // Check L3 fork cache (original values)
        if (self.fork_cache.getAccount(address)) |account| {
            self.stats.cache_hits += 1;
            // Promote to hot cache
            try self.hot.putAccount(address, account);
            return account;
        }
        
        // Cache miss - fetch from RPC
        self.stats.cache_misses += 1;
        self.stats.rpc_calls += 1;
        
        const proof = try self.rpc.getProof(address, &.{});
        const code = if (!std.mem.eql(u8, &proof.codeHash, &([_]u8{0} ** 32)))
            try self.rpc.getCode(address)
        else
            &[_]u8{};
        
        // Store code if present
        var code_hash = proof.codeHash;
        if (code.len > 0) {
            const code_copy = try self.allocator.dupe(u8, code);
            try self.hot.putCode(code_hash, code_copy);
            try self.fork_cache.putCode(code_hash, code_copy);
        }
        
        const account = Account{
            .balance = proof.balance,
            .nonce = proof.nonce,
            .code_hash = code_hash,
            .storage_root = proof.storageHash,
        };
        
        // Store in all caches
        try self.hot.putAccount(address, account);
        try self.warm.putAccount(address, account);
        try self.fork_cache.putAccount(address, account);
        
        return account;
    }
    
    pub fn set_account(self: *Self, address: [20]u8, account: Account) !void {
        // Only update hot cache for writes (not fork cache)
        try self.hot.putAccount(address, account);
    }
    
    pub fn delete_account(self: *Self, address: [20]u8) !void {
        _ = self.hot.removeAccount(address);
    }
    
    pub fn account_exists(self: *Self, address: [20]u8) bool {
        const account = self.get_account(address) catch return false;
        return account != null;
    }
    
    pub fn get_balance(self: *Self, address: [20]u8) !u256 {
        const account = (try self.get_account(address)) orelse return 0;
        return account.balance;
    }
    
    // Storage operations
    
    pub fn get_storage(self: *Self, address: [20]u8, slot: u256) !u256 {
        const key = StorageKey{ .address = address, .slot = slot };
        
        // Check L1 hot cache
        if (self.hot.getStorage(address, slot)) |value| {
            self.stats.cache_hits += 1;
            return value;
        }
        
        // Check L2 warm cache
        if (self.warm.storage.get(key)) |value| {
            self.stats.cache_hits += 1;
            // Promote to hot cache
            try self.hot.putStorage(address, slot, value);
            return value;
        }
        
        // Check L3 fork cache
        if (self.fork_cache.getStorage(address, slot)) |value| {
            self.stats.cache_hits += 1;
            // Promote to hot cache
            try self.hot.putStorage(address, slot, value);
            return value;
        }
        
        // Cache miss - fetch from RPC
        self.stats.cache_misses += 1;
        self.stats.rpc_calls += 1;
        
        const value = try self.rpc.getStorageAt(address, slot);
        
        // Store in all caches
        try self.hot.putStorage(address, slot, value);
        _ = try self.warm.storage.put(key, value);
        try self.fork_cache.putStorage(address, slot, value);
        
        return value;
    }
    
    pub fn set_storage(self: *Self, address: [20]u8, slot: u256, value: u256) !void {
        // Only update hot cache for writes (not fork cache)
        try self.hot.putStorage(address, slot, value);
    }
    
    // Transient storage (not persisted to fork)
    
    pub fn get_transient_storage(self: *Self, address: [20]u8, slot: u256) !u256 {
        _ = self;
        _ = address;
        _ = slot;
        return 0; // Transient storage starts at 0
    }
    
    pub fn set_transient_storage(self: *Self, address: [20]u8, slot: u256, value: u256) !void {
        _ = self;
        _ = address;
        _ = slot;
        _ = value;
        // TODO: Implement transient storage if needed
    }
    
    // Code operations
    
    pub fn get_code(self: *Self, code_hash: [32]u8) ![]const u8 {
        // Check hot cache
        if (self.hot.getCode(code_hash)) |code| {
            self.stats.cache_hits += 1;
            return code;
        }
        
        // Check fork cache
        if (self.fork_cache.getCode(code_hash)) |code| {
            self.stats.cache_hits += 1;
            // Promote to hot cache
            const code_copy = try self.allocator.dupe(u8, code);
            try self.hot.putCode(code_hash, code_copy);
            return code;
        }
        
        // Code should have been fetched with account
        return error.CodeNotFound;
    }
    
    pub fn get_code_by_address(self: *Self, address: [20]u8) ![]const u8 {
        const account = (try self.get_account(address)) orelse return &.{};
        if (std.mem.eql(u8, &account.code_hash, &([_]u8{0} ** 32))) {
            return &.{};
        }
        return self.get_code(account.code_hash);
    }
    
    pub fn set_code(self: *Self, code: []const u8) ![32]u8 {
        var hash: [32]u8 = undefined;
        std.crypto.hash.sha3.Keccak256.hash(code, &hash, .{});
        
        const code_copy = try self.allocator.dupe(u8, code);
        try self.hot.putCode(hash, code_copy);
        
        return hash;
    }
    
    // State root operations (not meaningful for forked storage)
    
    pub fn get_state_root(self: *Self) ![32]u8 {
        _ = self;
        // Return a deterministic state root for forked mode
        return [_]u8{0xFF} ** 32;
    }
    
    pub fn commit_changes(self: *Self) ![32]u8 {
        return self.get_state_root();
    }
    
    // Snapshot operations
    
    pub fn create_snapshot(self: *Self) !u64 {
        _ = self;
        // TODO: Implement snapshot support
        return 0;
    }
    
    pub fn revert_to_snapshot(self: *Self, snapshot_id: u64) !void {
        _ = self;
        _ = snapshot_id;
        // TODO: Implement snapshot support
    }
    
    pub fn commit_snapshot(self: *Self, snapshot_id: u64) !void {
        _ = self;
        _ = snapshot_id;
        // TODO: Implement snapshot support
    }
    
    // Batch operations
    
    pub fn begin_batch(self: *Self) !void {
        _ = self;
    }
    
    pub fn commit_batch(self: *Self) !void {
        _ = self;
    }
    
    pub fn rollback_batch(self: *Self) !void {
        _ = self;
    }
    
    // Statistics
    
    pub fn getStats(self: *const Self) Stats {
        return self.stats;
    }
    
    pub fn resetStats(self: *Self) void {
        self.stats = .{};
    }
};