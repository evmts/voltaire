//! StateCache - Per-type caching with checkpoint/revert for state management
//!
//! Implements three separate caches for different state types:
//! - AccountCache: Account state (nonce, balance, codeHash, storageRoot)
//! - StorageCache: Per-address storage slot values
//! - ContractCache: Contract bytecode
//!
//! Each cache supports journaled state with checkpoint/revert/commit operations.
//!
//! ## Checkpoint Strategy
//! - checkpoint(): Pushes current state to stack (shallow copy of maps)
//! - revert(): Pops stack and restores previous state (discards changes)
//! - commit(): Pops stack but keeps current state (finalizes changes)
//!
//! ## Usage
//! ```zig
//! const StateCache = @import("state-manager").StateCache;
//!
//! var cache = try StateCache.init(allocator);
//! defer cache.deinit();
//!
//! // Make changes
//! try cache.putAccount(address, account);
//!
//! // Checkpoint before transaction
//! try cache.checkpoint();
//!
//! // More changes...
//! try cache.putAccount(address2, account2);
//!
//! // Revert on failure
//! cache.revert();  // Restores to checkpoint
//!
//! // Or commit on success
//! cache.commit();  // Finalizes changes
//! ```

const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;
const Hash = primitives.Hash;

/// Account state structure
pub const AccountState = struct {
    nonce: u64,
    balance: u256,
    code_hash: Hash.Hash,
    storage_root: Hash.Hash,

    pub fn init() AccountState {
        return .{
            .nonce = 0,
            .balance = 0,
            .code_hash = Hash.ZERO,
            .storage_root = Hash.ZERO,
        };
    }
};

/// Storage key (address + slot)
pub const StorageKey = struct {
    address: Address,
    slot: u256,

    pub fn hash(self: StorageKey) u64 {
        var hasher = std.hash.Wyhash.init(0);
        hasher.update(&self.address);
        const slot_bytes = std.mem.asBytes(&self.slot);
        hasher.update(slot_bytes);
        return hasher.final();
    }

    pub fn eql(a: StorageKey, b: StorageKey) bool {
        return std.mem.eql(u8, &a.address, &b.address) and a.slot == b.slot;
    }
};

/// Account cache with checkpointing
pub const AccountCache = struct {
    allocator: std.mem.Allocator,
    cache: std.AutoHashMap(Address, AccountState),
    checkpoints: std.ArrayList(std.AutoHashMap(Address, AccountState)),

    pub fn init(allocator: std.mem.Allocator) !AccountCache {
        return .{
            .allocator = allocator,
            .cache = std.AutoHashMap(Address, AccountState).init(allocator),
            .checkpoints = .{},
        };
    }

    pub fn deinit(self: *AccountCache) void {
        self.cache.deinit();
        for (self.checkpoints.items) |*ckpt_item| {
            ckpt_item.deinit();
        }
        self.checkpoints.deinit(self.allocator);
    }

    pub fn get(self: *AccountCache, address: Address) ?AccountState {
        return self.cache.get(address);
    }

    pub fn put(self: *AccountCache, address: Address, account: AccountState) !void {
        try self.cache.put(address, account);
    }

    pub fn has(self: *AccountCache, address: Address) bool {
        return self.cache.contains(address);
    }

    pub fn delete(self: *AccountCache, address: Address) bool {
        return self.cache.remove(address);
    }

    pub fn clear(self: *AccountCache) void {
        self.cache.clearRetainingCapacity();
    }

    pub fn checkpoint(self: *AccountCache) !void {
        // Clone current cache state
        var snapshot = std.AutoHashMap(Address, AccountState).init(self.allocator);
        var it = self.cache.iterator();
        while (it.next()) |entry| {
            try snapshot.put(entry.key_ptr.*, entry.value_ptr.*);
        }
        try self.checkpoints.append(self.allocator, snapshot);
    }

    pub fn revert(self: *AccountCache) void {
        if (self.checkpoints.items.len == 0) return;

        // Pop checkpoint and restore
        const snapshot = self.checkpoints.pop() orelse return;
        self.cache.deinit();
        self.cache = snapshot;
    }

    pub fn commit(self: *AccountCache) void {
        if (self.checkpoints.items.len == 0) return;

        // Pop checkpoint but keep current state
        var snapshot = self.checkpoints.pop() orelse return;
        snapshot.deinit();
    }

    pub fn count(self: *AccountCache) usize {
        return self.cache.count();
    }
};

/// Storage cache with checkpointing (address -> slot -> value)
pub const StorageCache = struct {
    allocator: std.mem.Allocator,
    cache: std.AutoHashMap(Address, std.AutoHashMap(u256, u256)),
    checkpoints: std.ArrayList(std.AutoHashMap(Address, std.AutoHashMap(u256, u256))),

    pub fn init(allocator: std.mem.Allocator) !StorageCache {
        return .{
            .allocator = allocator,
            .cache = std.AutoHashMap(Address, std.AutoHashMap(u256, u256)).init(allocator),
            .checkpoints = std.ArrayList(std.AutoHashMap(Address, std.AutoHashMap(u256, u256))){},
        };
    }

    pub fn deinit(self: *StorageCache) void {
        var it = self.cache.valueIterator();
        while (it.next()) |slots| {
            slots.deinit();
        }
        self.cache.deinit();

        for (self.checkpoints.items) |*ckpt_item| {
            var checkpoint_it = ckpt_item.valueIterator();
            while (checkpoint_it.next()) |slots| {
                slots.deinit();
            }
            ckpt_item.deinit();
        }
        self.checkpoints.deinit(self.allocator);
    }

    pub fn get(self: *StorageCache, address: Address, slot: u256) ?u256 {
        const slots = self.cache.get(address) orelse return null;
        return slots.get(slot);
    }

    pub fn put(self: *StorageCache, address: Address, slot: u256, value: u256) !void {
        const result = try self.cache.getOrPut(address);
        if (!result.found_existing) {
            result.value_ptr.* = std.AutoHashMap(u256, u256).init(self.allocator);
        }
        try result.value_ptr.put(slot, value);
    }

    pub fn has(self: *StorageCache, address: Address, slot: u256) bool {
        const slots = self.cache.get(address) orelse return false;
        return slots.contains(slot);
    }

    pub fn delete(self: *StorageCache, address: Address, slot: u256) bool {
        var slots = self.cache.getPtr(address) orelse return false;
        return slots.remove(slot);
    }

    pub fn clear(self: *StorageCache) void {
        var it = self.cache.valueIterator();
        while (it.next()) |slots| {
            slots.deinit();
        }
        self.cache.clearRetainingCapacity();
    }

    pub fn checkpoint(self: *StorageCache) !void {
        // Clone current cache state (deep copy including nested maps)
        var snapshot = std.AutoHashMap(Address, std.AutoHashMap(u256, u256)).init(self.allocator);
        var it = self.cache.iterator();
        while (it.next()) |entry| {
            var slots_clone = std.AutoHashMap(u256, u256).init(self.allocator);
            var slots_it = entry.value_ptr.iterator();
            while (slots_it.next()) |slot_entry| {
                try slots_clone.put(slot_entry.key_ptr.*, slot_entry.value_ptr.*);
            }
            try snapshot.put(entry.key_ptr.*, slots_clone);
        }
        try self.checkpoints.append(self.allocator, snapshot);
    }

    pub fn revert(self: *StorageCache) void {
        if (self.checkpoints.items.len == 0) return;

        // Cleanup current cache
        var it = self.cache.valueIterator();
        while (it.next()) |slots| {
            slots.deinit();
        }
        self.cache.deinit();

        // Restore checkpoint
        self.cache = self.checkpoints.pop() orelse return;
    }

    pub fn commit(self: *StorageCache) void {
        if (self.checkpoints.items.len == 0) return;

        // Pop checkpoint and cleanup
        var snapshot = self.checkpoints.pop() orelse return;
        var it = snapshot.valueIterator();
        while (it.next()) |slots| {
            slots.deinit();
        }
        snapshot.deinit();
    }

    pub fn count(self: *StorageCache) usize {
        var total: usize = 0;
        var it = self.cache.valueIterator();
        while (it.next()) |slots| {
            total += slots.count();
        }
        return total;
    }
};

/// Contract code cache with checkpointing
pub const ContractCache = struct {
    allocator: std.mem.Allocator,
    cache: std.AutoHashMap(Address, []const u8),
    checkpoints: std.ArrayList(std.AutoHashMap(Address, []const u8)),

    pub fn init(allocator: std.mem.Allocator) !ContractCache {
        return .{
            .allocator = allocator,
            .cache = std.AutoHashMap(Address, []const u8).init(allocator),
            .checkpoints = std.ArrayList(std.AutoHashMap(Address, []const u8)){},
        };
    }

    pub fn deinit(self: *ContractCache) void {
        // Free code buffers
        var it = self.cache.valueIterator();
        while (it.next()) |code| {
            self.allocator.free(code.*);
        }
        self.cache.deinit();

        // Free checkpoint buffers
        for (self.checkpoints.items) |*ckpt_item| {
            var checkpoint_it = ckpt_item.valueIterator();
            while (checkpoint_it.next()) |code| {
                self.allocator.free(code.*);
            }
            ckpt_item.deinit();
        }
        self.checkpoints.deinit(self.allocator);
    }

    pub fn get(self: *ContractCache, address: Address) ?[]const u8 {
        return self.cache.get(address);
    }

    pub fn put(self: *ContractCache, address: Address, code: []const u8) !void {
        // Make owned copy
        const code_copy = try self.allocator.dupe(u8, code);
        errdefer self.allocator.free(code_copy);

        // Free old code if exists
        if (self.cache.get(address)) |old_code| {
            self.allocator.free(old_code);
        }

        try self.cache.put(address, code_copy);
    }

    pub fn has(self: *ContractCache, address: Address) bool {
        return self.cache.contains(address);
    }

    pub fn delete(self: *ContractCache, address: Address) bool {
        if (self.cache.fetchRemove(address)) |entry| {
            self.allocator.free(entry.value);
            return true;
        }
        return false;
    }

    pub fn clear(self: *ContractCache) void {
        var it = self.cache.valueIterator();
        while (it.next()) |code| {
            self.allocator.free(code.*);
        }
        self.cache.clearRetainingCapacity();
    }

    pub fn checkpoint(self: *ContractCache) !void {
        // Clone current cache state (with owned copies of code)
        var snapshot = std.AutoHashMap(Address, []const u8).init(self.allocator);
        var it = self.cache.iterator();
        while (it.next()) |entry| {
            const code_copy = try self.allocator.dupe(u8, entry.value_ptr.*);
            try snapshot.put(entry.key_ptr.*, code_copy);
        }
        try self.checkpoints.append(self.allocator, snapshot);
    }

    pub fn revert(self: *ContractCache) void {
        if (self.checkpoints.items.len == 0) return;

        // Cleanup current cache
        var it = self.cache.valueIterator();
        while (it.next()) |code| {
            self.allocator.free(code.*);
        }
        self.cache.deinit();

        // Restore checkpoint
        self.cache = self.checkpoints.pop() orelse return;
    }

    pub fn commit(self: *ContractCache) void {
        if (self.checkpoints.items.len == 0) return;

        // Pop checkpoint and cleanup
        var snapshot = self.checkpoints.pop() orelse return;
        var it = snapshot.valueIterator();
        while (it.next()) |code| {
            self.allocator.free(code.*);
        }
        snapshot.deinit();
    }

    pub fn count(self: *ContractCache) usize {
        return self.cache.count();
    }
};

// Tests
test "AccountCache - basic operations" {
    const allocator = std.testing.allocator;
    var cache = try AccountCache.init(allocator);
    defer cache.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    const account = AccountState{
        .nonce = 5,
        .balance = 1000,
        .code_hash = Hash.ZERO,
        .storage_root = Hash.ZERO,
    };

    try cache.put(addr, account);
    try std.testing.expect(cache.has(addr));

    const retrieved = cache.get(addr).?;
    try std.testing.expectEqual(@as(u64, 5), retrieved.nonce);
    try std.testing.expectEqual(@as(u256, 1000), retrieved.balance);
}

test "AccountCache - checkpoint and revert" {
    const allocator = std.testing.allocator;
    var cache = try AccountCache.init(allocator);
    defer cache.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    const account1 = AccountState{ .nonce = 5, .balance = 1000, .code_hash = Hash.ZERO, .storage_root = Hash.ZERO };

    try cache.put(addr, account1);
    try cache.checkpoint();

    // Modify after checkpoint
    const account2 = AccountState{ .nonce = 10, .balance = 2000, .code_hash = Hash.ZERO, .storage_root = Hash.ZERO };
    try cache.put(addr, account2);

    const modified = cache.get(addr).?;
    try std.testing.expectEqual(@as(u64, 10), modified.nonce);

    // Revert
    cache.revert();

    const reverted = cache.get(addr).?;
    try std.testing.expectEqual(@as(u64, 5), reverted.nonce);
    try std.testing.expectEqual(@as(u256, 1000), reverted.balance);
}

test "AccountCache - checkpoint and commit" {
    const allocator = std.testing.allocator;
    var cache = try AccountCache.init(allocator);
    defer cache.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    const account1 = AccountState{ .nonce = 5, .balance = 1000, .code_hash = Hash.ZERO, .storage_root = Hash.ZERO };

    try cache.put(addr, account1);
    try cache.checkpoint();

    // Modify
    const account2 = AccountState{ .nonce = 10, .balance = 2000, .code_hash = Hash.ZERO, .storage_root = Hash.ZERO };
    try cache.put(addr, account2);

    // Commit
    cache.commit();

    // Changes should persist
    const committed = cache.get(addr).?;
    try std.testing.expectEqual(@as(u64, 10), committed.nonce);
    try std.testing.expectEqual(@as(u256, 2000), committed.balance);
}

test "StorageCache - basic operations" {
    const allocator = std.testing.allocator;
    var cache = try StorageCache.init(allocator);
    defer cache.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    const slot: u256 = 42;
    const value: u256 = 9999;

    try cache.put(addr, slot, value);
    try std.testing.expect(cache.has(addr, slot));

    const retrieved = cache.get(addr, slot).?;
    try std.testing.expectEqual(value, retrieved);
}

test "StorageCache - checkpoint and revert" {
    const allocator = std.testing.allocator;
    var cache = try StorageCache.init(allocator);
    defer cache.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    const slot: u256 = 42;

    try cache.put(addr, slot, 100);
    try cache.checkpoint();

    // Modify
    try cache.put(addr, slot, 200);
    try std.testing.expectEqual(@as(u256, 200), cache.get(addr, slot).?);

    // Revert
    cache.revert();
    try std.testing.expectEqual(@as(u256, 100), cache.get(addr, slot).?);
}

test "ContractCache - basic operations" {
    const allocator = std.testing.allocator;
    var cache = try ContractCache.init(allocator);
    defer cache.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    const code = [_]u8{ 0x60, 0x60, 0x60, 0x40 };

    try cache.put(addr, &code);
    try std.testing.expect(cache.has(addr));

    const retrieved = cache.get(addr).?;
    try std.testing.expectEqualSlices(u8, &code, retrieved);
}

test "ContractCache - checkpoint and revert" {
    const allocator = std.testing.allocator;
    var cache = try ContractCache.init(allocator);
    defer cache.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    const code1 = [_]u8{ 0x60, 0x60 };
    const code2 = [_]u8{ 0x60, 0x60, 0x60, 0x40 };

    try cache.put(addr, &code1);
    try cache.checkpoint();

    // Modify
    try cache.put(addr, &code2);
    try std.testing.expectEqualSlices(u8, &code2, cache.get(addr).?);

    // Revert
    cache.revert();
    try std.testing.expectEqualSlices(u8, &code1, cache.get(addr).?);
}
