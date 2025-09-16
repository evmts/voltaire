//! Unified cache storage with hot/warm/cold tiers
//!
//! Provides a union-based cache hierarchy with zero overhead for hot storage.
//! Hot storage uses direct HashMap access, warm uses LRU with eviction,
//! and cold is backed by external storage (disk/network).

const std = @import("std");
const testing = std.testing;
const primitives = @import("primitives");
const Account = @import("database_interface_account.zig").Account;
const LruCache = @import("lru_cache.zig").LruCache;

// Storage key types
pub const AccountKey = struct {
    address: [20]u8,
};

pub const StorageKey = struct {
    address: [20]u8,
    slot: u256,
    
    pub fn hash(self: StorageKey) u64 {
        var hasher = std.hash.Wyhash.init(0);
        hasher.update(&self.address);
        hasher.update(std.mem.asBytes(&self.slot));
        return hasher.final();
    }
    
    pub fn eql(a: StorageKey, b: StorageKey) bool {
        return std.mem.eql(u8, &a.address, &b.address) and a.slot == b.slot;
    }
};

pub const CodeKey = struct {
    hash: [32]u8,
};

// Hash contexts
const AddressHashContext = struct {
    pub fn hash(self: @This(), k: [20]u8) u64 {
        _ = self;
        return std.hash.Wyhash.hash(0, &k);
    }
    pub fn eql(self: @This(), a: [20]u8, b: [20]u8) bool {
        _ = self;
        return std.mem.eql(u8, &a, &b);
    }
};

const StorageHashContext = struct {
    pub fn hash(self: @This(), k: StorageKey) u64 {
        _ = self;
        return k.hash();
    }
    pub fn eql(self: @This(), a: StorageKey, b: StorageKey) bool {
        _ = self;
        return a.eql(b);
    }
};

const CodeHashContext = struct {
    pub fn hash(self: @This(), k: [32]u8) u64 {
        _ = self;
        return std.hash.Wyhash.hash(0, &k);
    }
    pub fn eql(self: @This(), a: [32]u8, b: [32]u8) bool {
        _ = self;
        return std.mem.eql(u8, &a, &b);
    }
};

/// Zero-overhead hot storage with direct HashMap access
pub const HotStorage = struct {
    accounts: std.HashMap([20]u8, Account, AddressHashContext, 80),
    storage: std.HashMap(StorageKey, u256, StorageHashContext, 80),
    code: std.HashMap([32]u8, []const u8, CodeHashContext, 80),
    allocator: std.mem.Allocator,
    
    pub fn init(allocator: std.mem.Allocator) HotStorage {
        return .{
            .accounts = std.HashMap([20]u8, Account, AddressHashContext, 80).init(allocator),
            .storage = std.HashMap(StorageKey, u256, StorageHashContext, 80).init(allocator),
            .code = std.HashMap([32]u8, []const u8, CodeHashContext, 80).init(allocator),
            .allocator = allocator,
        };
    }
    
    pub fn deinit(self: *HotStorage) void {
        self.accounts.deinit();
        self.storage.deinit();
        
        // Free allocated code
        var iter = self.code.iterator();
        while (iter.next()) |entry| {
            self.allocator.free(entry.value_ptr.*);
        }
        self.code.deinit();
    }
    
    // Account operations
    pub inline fn getAccount(self: *HotStorage, address: [20]u8) ?Account {
        return self.accounts.get(address);
    }
    
    pub inline fn putAccount(self: *HotStorage, address: [20]u8, account: Account) !void {
        try self.accounts.put(address, account);
    }
    
    pub inline fn removeAccount(self: *HotStorage, address: [20]u8) ?Account {
        if (self.accounts.fetchRemove(address)) |kv| {
            return kv.value;
        }
        return null;
    }
    
    // Storage operations
    pub inline fn getStorage(self: *HotStorage, address: [20]u8, slot: u256) ?u256 {
        const key = StorageKey{ .address = address, .slot = slot };
        return self.storage.get(key);
    }
    
    pub inline fn putStorage(self: *HotStorage, address: [20]u8, slot: u256, value: u256) !void {
        const key = StorageKey{ .address = address, .slot = slot };
        try self.storage.put(key, value);
    }
    
    pub inline fn removeStorage(self: *HotStorage, address: [20]u8, slot: u256) ?u256 {
        const key = StorageKey{ .address = address, .slot = slot };
        if (self.storage.fetchRemove(key)) |kv| {
            return kv.value;
        }
        return null;
    }
    
    // Code operations
    pub inline fn getCode(self: *HotStorage, code_hash: [32]u8) ?[]const u8 {
        return self.code.get(code_hash);
    }
    
    pub inline fn putCode(self: *HotStorage, code_hash: [32]u8, code: []const u8) !void {
        // Make a copy of the code
        const code_copy = try self.allocator.dupe(u8, code);
        errdefer self.allocator.free(code_copy);
        
        // Remove old code if exists
        if (self.code.fetchRemove(code_hash)) |old| {
            self.allocator.free(old.value);
        }
        
        try self.code.put(code_hash, code_copy);
    }
    
    pub inline fn removeCode(self: *HotStorage, code_hash: [32]u8) ?[]const u8 {
        if (self.code.fetchRemove(code_hash)) |kv| {
            // Caller is responsible for freeing
            return kv.value;
        }
        return null;
    }
    
    // Utility functions
    pub fn clear(self: *HotStorage) void {
        self.accounts.clearRetainingCapacity();
        self.storage.clearRetainingCapacity();
        
        // Free all code
        var iter = self.code.iterator();
        while (iter.next()) |entry| {
            self.allocator.free(entry.value_ptr.*);
        }
        self.code.clearRetainingCapacity();
    }
    
    pub fn getStats(self: *const HotStorage) HotStorageStats {
        return .{
            .account_count = self.accounts.count(),
            .storage_count = self.storage.count(),
            .code_count = self.code.count(),
        };
    }
};

pub const HotStorageStats = struct {
    account_count: usize,
    storage_count: usize,
    code_count: usize,
};

/// Warm storage with LRU eviction
pub const WarmStorage = struct {
    accounts: LruCache([20]u8, Account, .{ .capacity = 1024 }),
    storage: LruCache(StorageKey, u256, .{ .capacity = 4096, .HashContext = StorageHashContext }),
    code: LruCache([32]u8, []const u8, .{ .capacity = 256 }),
    backing: ?*ColdStorage,  // Optional backing for evicted items
    allocator: std.mem.Allocator,
    
    pub fn init(allocator: std.mem.Allocator, backing: ?*ColdStorage) !WarmStorage {
        return .{
            .accounts = try LruCache([20]u8, Account, .{ .capacity = 1024 }).init(allocator),
            .storage = try LruCache(StorageKey, u256, .{ .capacity = 4096, .HashContext = StorageHashContext }).init(allocator),
            .code = try LruCache([32]u8, []const u8, .{ .capacity = 256 }).init(allocator),
            .backing = backing,
            .allocator = allocator,
        };
    }
    
    pub fn deinit(self: *WarmStorage) void {
        self.accounts.deinit();
        self.storage.deinit();
        
        // Note: We don't free code here as LruCache doesn't own the memory
        // The caller who allocated the code is responsible for freeing it
        self.code.deinit();
    }
    
    pub fn getAccount(self: *WarmStorage, address: [20]u8) ?Account {
        if (self.accounts.get(address)) |account| {
            return account;
        }
        
        // Check backing if exists
        if (self.backing) |backing| {
            if (backing.getAccount(address)) |account| {
                // Promote to warm (ignore eviction for now)
                self.accounts.put(address, account) catch {};
                return account;
            }
        }
        
        return null;
    }
    
    pub fn putAccount(self: *WarmStorage, address: [20]u8, account: Account) !void {
        if (try self.accounts.put(address, account)) |evicted| {
            // Write evicted item to backing if exists
            if (self.backing) |backing| {
                try backing.putAccount(evicted.key, evicted.value);
            }
        }
    }
};

/// Cold storage placeholder (will be implemented with backends)
pub const ColdStorage = struct {
    // For now, just a simple in-memory storage
    // Will be replaced with disk/network backend
    accounts: std.HashMap([20]u8, Account, AddressHashContext, 80),
    storage: std.HashMap(StorageKey, u256, StorageHashContext, 80),
    code: std.HashMap([32]u8, []const u8, CodeHashContext, 80),
    allocator: std.mem.Allocator,
    
    pub fn init(allocator: std.mem.Allocator) ColdStorage {
        return .{
            .accounts = std.HashMap([20]u8, Account, AddressHashContext, 80).init(allocator),
            .storage = std.HashMap(StorageKey, u256, StorageHashContext, 80).init(allocator),
            .code = std.HashMap([32]u8, []const u8, CodeHashContext, 80).init(allocator),
            .allocator = allocator,
        };
    }
    
    pub fn deinit(self: *ColdStorage) void {
        self.accounts.deinit();
        self.storage.deinit();
        self.code.deinit();
    }
    
    pub fn getAccount(self: *ColdStorage, address: [20]u8) ?Account {
        return self.accounts.get(address);
    }
    
    pub fn putAccount(self: *ColdStorage, address: [20]u8, account: Account) !void {
        try self.accounts.put(address, account);
    }
};

/// Union-based cache storage
pub const CacheStorage = union(enum) {
    hot: HotStorage,
    warm: WarmStorage,
    cold: ColdStorage,
    
    const Self = @This();
    
    pub inline fn getAccount(self: *Self, address: [20]u8) ?Account {
        return switch (self.*) {
            .hot => |*s| s.getAccount(address),
            .warm => |*s| s.getAccount(address),
            .cold => |*s| s.getAccount(address),
        };
    }
    
    pub inline fn putAccount(self: *Self, address: [20]u8, account: Account) !void {
        return switch (self.*) {
            .hot => |*s| s.putAccount(address, account),
            .warm => |*s| s.putAccount(address, account),
            .cold => |*s| s.putAccount(address, account),
        };
    }
    
    pub inline fn getStorage(self: *Self, address: [20]u8, slot: u256) ?u256 {
        return switch (self.*) {
            .hot => |*s| s.getStorage(address, slot),
            .warm => |*s| blk: {
                const key = StorageKey{ .address = address, .slot = slot };
                break :blk s.storage.get(key);
            },
            .cold => |*s| blk: {
                const key = StorageKey{ .address = address, .slot = slot };
                break :blk s.storage.get(key);
            },
        };
    }
    
    pub inline fn putStorage(self: *Self, address: [20]u8, slot: u256, value: u256) !void {
        return switch (self.*) {
            .hot => |*s| s.putStorage(address, slot, value),
            .warm => |*s| blk: {
                const key = StorageKey{ .address = address, .slot = slot };
                _ = try s.storage.put(key, value);
                break :blk;
            },
            .cold => |*s| blk: {
                const key = StorageKey{ .address = address, .slot = slot };
                try s.storage.put(key, value);
                break :blk;
            },
        };
    }
};

// =============================================================================
// Tests
// =============================================================================

test "HotStorage - basic operations" {
    var storage = HotStorage.init(testing.allocator);
    defer storage.deinit();
    
    const addr = [_]u8{0x12} ** 20;
    const account = Account{
        .balance = 1000,
        .nonce = 5,
        .code_hash = [_]u8{0xAB} ** 32,
        .storage_root = [_]u8{0xCD} ** 32,
    };
    
    // Test account operations
    try testing.expect(storage.getAccount(addr) == null);
    try storage.putAccount(addr, account);
    
    const retrieved = storage.getAccount(addr).?;
    try testing.expectEqual(account.balance, retrieved.balance);
    try testing.expectEqual(account.nonce, retrieved.nonce);
    
    // Test removal
    const removed = storage.removeAccount(addr).?;
    try testing.expectEqual(account.balance, removed.balance);
    try testing.expect(storage.getAccount(addr) == null);
}

test "HotStorage - storage operations" {
    var storage = HotStorage.init(testing.allocator);
    defer storage.deinit();
    
    const addr = [_]u8{0x34} ** 20;
    const slot: u256 = 0x123456789;
    const value: u256 = 0xFEDCBA987;
    
    // Test storage operations
    try testing.expect(storage.getStorage(addr, slot) == null);
    try storage.putStorage(addr, slot, value);
    try testing.expectEqual(value, storage.getStorage(addr, slot).?);
    
    // Test removal
    const removed = storage.removeStorage(addr, slot).?;
    try testing.expectEqual(value, removed);
    try testing.expect(storage.getStorage(addr, slot) == null);
}

test "HotStorage - code operations" {
    var storage = HotStorage.init(testing.allocator);
    defer storage.deinit();
    
    const code_hash = [_]u8{0x56} ** 32;
    const code = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };
    
    // Test code operations
    try testing.expect(storage.getCode(code_hash) == null);
    try storage.putCode(code_hash, &code);
    
    const retrieved = storage.getCode(code_hash).?;
    try testing.expectEqualSlices(u8, &code, retrieved);
    
    // Test removal
    const removed = storage.removeCode(code_hash).?;
    defer storage.allocator.free(removed);
    try testing.expectEqualSlices(u8, &code, removed);
    try testing.expect(storage.getCode(code_hash) == null);
}

test "HotStorage - clear and stats" {
    var storage = HotStorage.init(testing.allocator);
    defer storage.deinit();
    
    // Add some data
    const addr = [_]u8{0x78} ** 20;
    const account = Account.zero();
    try storage.putAccount(addr, account);
    try storage.putStorage(addr, 1, 100);
    
    const code_hash = [_]u8{0x9A} ** 32;
    const code = [_]u8{0x60};
    try storage.putCode(code_hash, &code);
    
    // Check stats
    var stats = storage.getStats();
    try testing.expectEqual(@as(usize, 1), stats.account_count);
    try testing.expectEqual(@as(usize, 1), stats.storage_count);
    try testing.expectEqual(@as(usize, 1), stats.code_count);
    
    // Clear
    storage.clear();
    
    stats = storage.getStats();
    try testing.expectEqual(@as(usize, 0), stats.account_count);
    try testing.expectEqual(@as(usize, 0), stats.storage_count);
    try testing.expectEqual(@as(usize, 0), stats.code_count);
}

test "CacheStorage - union operations" {
    var hot = HotStorage.init(testing.allocator);
    defer hot.deinit();
    
    var cache = CacheStorage{ .hot = hot };
    
    const addr = [_]u8{0xBC} ** 20;
    const account = Account{
        .balance = 2000,
        .nonce = 10,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    
    // Test through union
    try testing.expect(cache.getAccount(addr) == null);
    try cache.putAccount(addr, account);
    
    const retrieved = cache.getAccount(addr).?;
    try testing.expectEqual(account.balance, retrieved.balance);
    
    // Test storage through union
    const slot: u256 = 42;
    const value: u256 = 999;
    
    try testing.expect(cache.getStorage(addr, slot) == null);
    try cache.putStorage(addr, slot, value);
    try testing.expectEqual(value, cache.getStorage(addr, slot).?);
}

test "HotStorage - multiple accounts and storage" {
    var storage = HotStorage.init(testing.allocator);
    defer storage.deinit();
    
    // Add multiple accounts
    for (0..10) |i| {
        var addr = [_]u8{0} ** 20;
        addr[19] = @intCast(i);
        
        const account = Account{
            .balance = i * 100,
            .nonce = i,
            .code_hash = [_]u8{0} ** 32,
            .storage_root = [_]u8{0} ** 32,
        };
        
        try storage.putAccount(addr, account);
        
        // Add storage for each account
        for (0..5) |j| {
            try storage.putStorage(addr, j, i * 10 + j);
        }
    }
    
    // Verify all data
    for (0..10) |i| {
        var addr = [_]u8{0} ** 20;
        addr[19] = @intCast(i);
        
        const account = storage.getAccount(addr).?;
        try testing.expectEqual(i * 100, account.balance);
        
        for (0..5) |j| {
            const value = storage.getStorage(addr, j).?;
            try testing.expectEqual(i * 10 + j, value);
        }
    }
    
    const stats = storage.getStats();
    try testing.expectEqual(@as(usize, 10), stats.account_count);
    try testing.expectEqual(@as(usize, 50), stats.storage_count);
}

test "WarmStorage - basic operations with LRU" {
    var warm = try WarmStorage.init(testing.allocator, null);
    defer warm.deinit();
    
    // Test basic account operations
    const addr = [_]u8{0xDE} ** 20;
    const account = Account{
        .balance = 3000,
        .nonce = 15,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    
    try testing.expect(warm.getAccount(addr) == null);
    try warm.putAccount(addr, account);
    
    const retrieved = warm.getAccount(addr).?;
    try testing.expectEqual(account.balance, retrieved.balance);
    
    // Verify LRU behavior by checking cache stats
    const stats = warm.accounts.getStats();
    try testing.expectEqual(@as(u64, 1), stats.hits);  // One hit from the get
    try testing.expectEqual(@as(usize, 1), stats.size);
}

test "StorageKey - hash and equality" {
    const key1 = StorageKey{
        .address = [_]u8{0x01} ** 20,
        .slot = 42,
    };
    
    const key2 = StorageKey{
        .address = [_]u8{0x01} ** 20,
        .slot = 42,
    };
    
    const key3 = StorageKey{
        .address = [_]u8{0x02} ** 20,
        .slot = 42,
    };
    
    // Same keys should be equal and have same hash
    try testing.expect(key1.eql(key2));
    try testing.expectEqual(key1.hash(), key2.hash());
    
    // Different keys should not be equal
    try testing.expect(!key1.eql(key3));
    try testing.expect(key1.hash() != key3.hash());
}