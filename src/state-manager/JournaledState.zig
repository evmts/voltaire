//! JournaledState - Dual-cache state orchestrator
//!
//! Wraps three StateCache instances (account, storage, contract) and coordinates
//! between normal cache and optional fork backend.
//!
//! ## Read Cascade
//! - Check normal cache first
//! - If miss and fork_backend present, fetch from remote and cache
//! - Otherwise return default value
//!
//! ## Write Flow
//! - All writes go to normal cache only
//! - Fork backend is read-only
//!
//! ## Checkpoint Operations
//! - Delegates checkpoint/revert/commit to all three caches synchronously
//! - All caches stay in sync (same checkpoint depth)
//!
//! ## Usage
//! ```zig
//! const JournaledState = @import("state-manager").JournaledState;
//!
//! var state = try JournaledState.init(allocator, fork_backend);
//! defer state.deinit();
//!
//! // Read operations cascade through fork backend
//! const account = try state.getAccount(address);
//! const value = try state.getStorage(address, slot);
//! const code = try state.getCode(address);
//!
//! // Write operations go to normal cache only
//! try state.putAccount(address, account);
//! try state.putStorage(address, slot, value);
//! try state.putCode(address, code);
//!
//! // Checkpoint operations sync across all caches
//! try state.checkpoint();
//! state.revert(); // or state.commit()
//! ```

const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;
const StateCache = @import("StateCache.zig");
const ForkBackend = @import("ForkBackend.zig");

/// Dual-cache state manager: normal cache + fork cache
pub const JournaledState = struct {
    allocator: std.mem.Allocator,

    // Normal cache (source of truth after modifications)
    account_cache: StateCache.AccountCache,
    storage_cache: StateCache.StorageCache,
    contract_cache: StateCache.ContractCache,

    // Fork backend (optional, for remote state)
    fork_backend: ?*ForkBackend.ForkBackend,

    pub fn init(
        allocator: std.mem.Allocator,
        fork_backend: ?*ForkBackend.ForkBackend,
    ) !JournaledState {
        return .{
            .allocator = allocator,
            .account_cache = try StateCache.AccountCache.init(allocator),
            .storage_cache = try StateCache.StorageCache.init(allocator),
            .contract_cache = try StateCache.ContractCache.init(allocator),
            .fork_backend = fork_backend,
        };
    }

    pub fn deinit(self: *JournaledState) void {
        self.account_cache.deinit();
        self.storage_cache.deinit();
        self.contract_cache.deinit();
    }

    /// Get account (normal cache → fork backend → default)
    pub fn getAccount(self: *JournaledState, address: Address) !StateCache.AccountState {
        // Check normal cache first
        if (self.account_cache.get(address)) |account| {
            return account;
        }

        // Check fork backend
        if (self.fork_backend) |fork| {
            const account = try fork.fetchAccount(address);
            // Cache in normal cache for future reads
            try self.account_cache.put(address, account);
            return account;
        }

        // Return empty account if no fork
        return StateCache.AccountState.init();
    }

    /// Put account (normal cache only)
    pub fn putAccount(self: *JournaledState, address: Address, account: StateCache.AccountState) !void {
        try self.account_cache.put(address, account);
    }

    /// Get storage (normal cache → fork backend → zero)
    pub fn getStorage(self: *JournaledState, address: Address, slot: u256) !u256 {
        // Check normal cache first
        if (self.storage_cache.get(address, slot)) |value| {
            return value;
        }

        // Check fork backend
        if (self.fork_backend) |fork| {
            const value = try fork.fetchStorage(address, slot);
            // Cache in normal cache
            try self.storage_cache.put(address, slot, value);
            return value;
        }

        // Return zero if not found
        return 0;
    }

    /// Put storage (normal cache only)
    pub fn putStorage(self: *JournaledState, address: Address, slot: u256, value: u256) !void {
        try self.storage_cache.put(address, slot, value);
    }

    /// Get code (normal cache → fork backend → empty)
    pub fn getCode(self: *JournaledState, address: Address) ![]const u8 {
        // Check normal cache first
        if (self.contract_cache.get(address)) |code| {
            return code;
        }

        // Check fork backend
        if (self.fork_backend) |fork| {
            const code = try fork.fetchCode(address);
            // Cache in normal cache
            try self.contract_cache.put(address, code);
            return code;
        }

        // Return empty code if not found
        return &[_]u8{};
    }

    /// Put code (normal cache only)
    pub fn putCode(self: *JournaledState, address: Address, code: []const u8) !void {
        try self.contract_cache.put(address, code);
    }

    /// Checkpoint all caches
    pub fn checkpoint(self: *JournaledState) !void {
        try self.account_cache.checkpoint();
        try self.storage_cache.checkpoint();
        try self.contract_cache.checkpoint();
    }

    /// Revert all caches
    pub fn revert(self: *JournaledState) void {
        self.account_cache.revert();
        self.storage_cache.revert();
        self.contract_cache.revert();
    }

    /// Commit all caches
    pub fn commit(self: *JournaledState) void {
        self.account_cache.commit();
        self.storage_cache.commit();
        self.contract_cache.commit();
    }

    /// Clear all caches (including fork cache)
    pub fn clearCaches(self: *JournaledState) void {
        self.account_cache.clear();
        self.storage_cache.clear();
        self.contract_cache.clear();
        if (self.fork_backend) |fork| {
            fork.clearCaches();
        }
    }
};

// Tests
test "JournaledState - basic operations without fork" {
    const allocator = std.testing.allocator;
    var state = try JournaledState.init(allocator, null);
    defer state.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    const account = StateCache.AccountState{
        .nonce = 5,
        .balance = 1000,
        .code_hash = primitives.Hash.ZERO,
        .storage_root = primitives.Hash.ZERO,
    };

    // Put and get account
    try state.putAccount(addr, account);
    const retrieved = try state.getAccount(addr);
    try std.testing.expectEqual(@as(u64, 5), retrieved.nonce);
    try std.testing.expectEqual(@as(u256, 1000), retrieved.balance);

    // Put and get storage
    try state.putStorage(addr, 42, 9999);
    const value = try state.getStorage(addr, 42);
    try std.testing.expectEqual(@as(u256, 9999), value);

    // Put and get code
    const code = [_]u8{ 0x60, 0x60, 0x60, 0x40 };
    try state.putCode(addr, &code);
    const retrieved_code = try state.getCode(addr);
    try std.testing.expectEqualSlices(u8, &code, retrieved_code);
}

test "JournaledState - checkpoint and revert" {
    const allocator = std.testing.allocator;
    var state = try JournaledState.init(allocator, null);
    defer state.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    const account1 = StateCache.AccountState{
        .nonce = 5,
        .balance = 1000,
        .code_hash = primitives.Hash.ZERO,
        .storage_root = primitives.Hash.ZERO,
    };

    // Initial state
    try state.putAccount(addr, account1);
    try state.putStorage(addr, 42, 100);

    // Checkpoint
    try state.checkpoint();

    // Modify after checkpoint
    const account2 = StateCache.AccountState{
        .nonce = 10,
        .balance = 2000,
        .code_hash = primitives.Hash.ZERO,
        .storage_root = primitives.Hash.ZERO,
    };
    try state.putAccount(addr, account2);
    try state.putStorage(addr, 42, 200);

    // Verify modified state
    const modified_account = try state.getAccount(addr);
    try std.testing.expectEqual(@as(u64, 10), modified_account.nonce);
    const modified_value = try state.getStorage(addr, 42);
    try std.testing.expectEqual(@as(u256, 200), modified_value);

    // Revert
    state.revert();

    // Verify reverted state
    const reverted_account = try state.getAccount(addr);
    try std.testing.expectEqual(@as(u64, 5), reverted_account.nonce);
    try std.testing.expectEqual(@as(u256, 1000), reverted_account.balance);
    const reverted_value = try state.getStorage(addr, 42);
    try std.testing.expectEqual(@as(u256, 100), reverted_value);
}

test "JournaledState - checkpoint and commit" {
    const allocator = std.testing.allocator;
    var state = try JournaledState.init(allocator, null);
    defer state.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    const account1 = StateCache.AccountState{
        .nonce = 5,
        .balance = 1000,
        .code_hash = primitives.Hash.ZERO,
        .storage_root = primitives.Hash.ZERO,
    };

    // Initial state
    try state.putAccount(addr, account1);
    try state.checkpoint();

    // Modify
    const account2 = StateCache.AccountState{
        .nonce = 10,
        .balance = 2000,
        .code_hash = primitives.Hash.ZERO,
        .storage_root = primitives.Hash.ZERO,
    };
    try state.putAccount(addr, account2);

    // Commit
    state.commit();

    // Changes should persist
    const committed_account = try state.getAccount(addr);
    try std.testing.expectEqual(@as(u64, 10), committed_account.nonce);
    try std.testing.expectEqual(@as(u256, 2000), committed_account.balance);
}

test "JournaledState - default values without fork" {
    const allocator = std.testing.allocator;
    var state = try JournaledState.init(allocator, null);
    defer state.deinit();

    const addr = Address{ .bytes = [_]u8{0x99} ++ [_]u8{0} ** 19 };

    // Should return default values for non-existent data
    const account = try state.getAccount(addr);
    try std.testing.expectEqual(@as(u64, 0), account.nonce);
    try std.testing.expectEqual(@as(u256, 0), account.balance);

    const value = try state.getStorage(addr, 42);
    try std.testing.expectEqual(@as(u256, 0), value);

    const code = try state.getCode(addr);
    try std.testing.expectEqual(@as(usize, 0), code.len);
}

test "JournaledState - nested checkpoints" {
    const allocator = std.testing.allocator;
    var state = try JournaledState.init(allocator, null);
    defer state.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };

    // Level 0
    try state.putStorage(addr, 1, 100);

    // Level 1
    try state.checkpoint();
    try state.putStorage(addr, 1, 200);

    // Level 2
    try state.checkpoint();
    try state.putStorage(addr, 1, 300);

    // Verify level 2
    var value = try state.getStorage(addr, 1);
    try std.testing.expectEqual(@as(u256, 300), value);

    // Revert to level 1
    state.revert();
    value = try state.getStorage(addr, 1);
    try std.testing.expectEqual(@as(u256, 200), value);

    // Revert to level 0
    state.revert();
    value = try state.getStorage(addr, 1);
    try std.testing.expectEqual(@as(u256, 100), value);
}
