//! In-memory implementation of the database interface.
//!
//! Provides a complete state storage solution for testing and development.
//! Supports snapshots for transaction rollback and batch operations for
//! atomic updates. Not suitable for production due to memory constraints.

const std = @import("std");
const DatabaseInterface = @import("database_interface.zig").DatabaseInterface;
const Account = @import("database_interface.zig").Account;
const crypto = @import("crypto");

/// In-memory database with snapshot and batch operation support.
pub const MemoryDatabase = struct {
    allocator: std.mem.Allocator,
    accounts: std.hash_map.HashMap([20]u8, Account, AccountContext, 80),
    storage: std.hash_map.HashMap(StorageKey, u256, StorageKeyContext, 80),
    transient_storage: std.hash_map.HashMap(StorageKey, u256, StorageKeyContext, 80),
    codes: std.hash_map.HashMap([32]u8, []u8, CodeHashContext, 80),
    snapshots: std.ArrayList(Snapshot),
    next_snapshot_id: u64,
    batch_in_progress: bool,
    batch_changes: ?BatchChanges,

    const Self = @This();

    const StorageKey = struct {
        address: [20]u8,
        key: u256,
    };

    const Snapshot = struct {
        id: u64,
        accounts: std.hash_map.HashMap([20]u8, Account, AccountContext, 80),
        storage: std.hash_map.HashMap(StorageKey, u256, StorageKeyContext, 80),
    };

    const BatchChanges = struct {
        accounts: std.hash_map.HashMap([20]u8, ?Account, AccountContext, 80),
        storage: std.hash_map.HashMap(StorageKey, u256, StorageKeyContext, 80),
    };

    const AccountContext = struct {
        pub fn hash(self: @This(), key: [20]u8) u64 {
            _ = self;
            return std.hash.Wyhash.hash(0, &key);
        }
        pub fn eql(self: @This(), a: [20]u8, b: [20]u8) bool {
            _ = self;
            return std.mem.eql(u8, &a, &b);
        }
    };

    const StorageKeyContext = struct {
        pub fn hash(self: @This(), key: StorageKey) u64 {
            _ = self;
            var hasher = std.hash.Wyhash.init(0);
            hasher.update(&key.address);
            hasher.update(std.mem.asBytes(&key.key));
            return hasher.final();
        }
        pub fn eql(self: @This(), a: StorageKey, b: StorageKey) bool {
            _ = self;
            return std.mem.eql(u8, &a.address, &b.address) and a.key == b.key;
        }
    };

    const CodeHashContext = struct {
        pub fn hash(self: @This(), key: [32]u8) u64 {
            _ = self;
            return std.hash.Wyhash.hash(0, &key);
        }
        pub fn eql(self: @This(), a: [32]u8, b: [32]u8) bool {
            _ = self;
            return std.mem.eql(u8, &a, &b);
        }
    };

    /// Initialize a new in-memory database.
    pub fn init(allocator: std.mem.Allocator) Self {
        return Self{
            .allocator = allocator,
            .accounts = std.hash_map.HashMap([20]u8, Account, AccountContext, 80).init(allocator),
            .storage = std.hash_map.HashMap(StorageKey, u256, StorageKeyContext, 80).init(allocator),
            .transient_storage = std.hash_map.HashMap(StorageKey, u256, StorageKeyContext, 80).init(allocator),
            .codes = std.hash_map.HashMap([32]u8, []u8, CodeHashContext, 80).init(allocator),
            .snapshots = std.ArrayList(Snapshot).init(allocator),
            .next_snapshot_id = 0,
            .batch_in_progress = false,
            .batch_changes = null,
        };
    }

    pub fn deinit(self: *Self) void {
        self.accounts.deinit();
        self.storage.deinit();
        self.transient_storage.deinit();
        
        // Free all stored code
        var code_iter = self.codes.iterator();
        while (code_iter.next()) |entry| {
            self.allocator.free(entry.value_ptr.*);
        }
        self.codes.deinit();
        
        // Free all snapshots
        for (self.snapshots.items) |*snapshot| {
            snapshot.accounts.deinit();
            snapshot.storage.deinit();
        }
        self.snapshots.deinit();
        
        // Free batch changes if any
        if (self.batch_changes) |*batch| {
            batch.accounts.deinit();
            batch.storage.deinit();
        }
    }

    /// Convert to the generic database interface.
    pub fn to_database_interface(self: *Self) DatabaseInterface {
        return DatabaseInterface.init(self);
    }

    // Account operations

    pub fn get_account(self: *Self, address: [20]u8) DatabaseInterface.Error!?Account {
        if (self.batch_in_progress) {
            if (self.batch_changes) |*batch| {
                if (batch.accounts.get(address)) |maybe_account| {
                    return maybe_account;
                }
            }
        }
        return self.accounts.get(address);
    }

    pub fn set_account(self: *Self, address: [20]u8, account: Account) DatabaseInterface.Error!void {
        if (self.batch_in_progress) {
            if (self.batch_changes) |*batch| {
                try batch.accounts.put(address, account);
                return;
            }
        }
        try self.accounts.put(address, account);
    }

    pub fn delete_account(self: *Self, address: [20]u8) DatabaseInterface.Error!void {
        if (self.batch_in_progress) {
            if (self.batch_changes) |*batch| {
                try batch.accounts.put(address, null);
                return;
            }
        }
        _ = self.accounts.remove(address);
    }

    pub fn account_exists(self: *Self, address: [20]u8) bool {
        if (self.batch_in_progress) {
            if (self.batch_changes) |*batch| {
                if (batch.accounts.get(address)) |maybe_account| {
                    return maybe_account != null;
                }
            }
        }
        return self.accounts.contains(address);
    }

    pub fn get_balance(self: *Self, address: [20]u8) DatabaseInterface.Error!u256 {
        const account = try self.get_account(address);
        return if (account) |acc| acc.balance else 0;
    }

    // Storage operations

    pub fn get_storage(self: *Self, address: [20]u8, key: u256) DatabaseInterface.Error!u256 {
        const storage_key = StorageKey{ .address = address, .key = key };
        if (self.batch_in_progress) {
            if (self.batch_changes) |*batch| {
                if (batch.storage.get(storage_key)) |value| {
                    return value;
                }
            }
        }
        return self.storage.get(storage_key) orelse 0;
    }

    pub fn set_storage(self: *Self, address: [20]u8, key: u256, value: u256) DatabaseInterface.Error!void {
        const storage_key = StorageKey{ .address = address, .key = key };
        if (self.batch_in_progress) {
            if (self.batch_changes) |*batch| {
                try batch.storage.put(storage_key, value);
                return;
            }
        }
        if (value == 0) {
            _ = self.storage.remove(storage_key);
        } else {
            try self.storage.put(storage_key, value);
        }
    }

    pub fn get_transient_storage(self: *Self, address: [20]u8, key: u256) DatabaseInterface.Error!u256 {
        const storage_key = StorageKey{ .address = address, .key = key };
        return self.transient_storage.get(storage_key) orelse 0;
    }

    pub fn set_transient_storage(self: *Self, address: [20]u8, key: u256, value: u256) DatabaseInterface.Error!void {
        const storage_key = StorageKey{ .address = address, .key = key };
        if (value == 0) {
            _ = self.transient_storage.remove(storage_key);
        } else {
            try self.transient_storage.put(storage_key, value);
        }
    }

    // Code operations

    pub fn get_code(self: *Self, code_hash: [32]u8) DatabaseInterface.Error![]const u8 {
        return self.codes.get(code_hash) orelse return DatabaseInterface.Error.CodeNotFound;
    }

    pub fn get_code_by_address(self: *Self, address: [20]u8) DatabaseInterface.Error![]const u8 {
        const account = try self.get_account(address);
        if (account) |acc| {
            if (std.mem.eql(u8, &acc.code_hash, &[_]u8{0} ** 32)) {
                return &[_]u8{};
            }
            return self.get_code(acc.code_hash);
        }
        return &[_]u8{};
    }

    pub fn set_code(self: *Self, code: []const u8) DatabaseInterface.Error![32]u8 {
        // Calculate keccak256 hash of the code
        var hash: [32]u8 = undefined;
        std.crypto.hash.sha3.Keccak256.hash(code, &hash, .{});
        
        // Store the code
        const code_copy = try self.allocator.dupe(u8, code);
        errdefer self.allocator.free(code_copy);
        
        try self.codes.put(hash, code_copy);
        
        return hash;
    }

    // State root operations (simplified for in-memory)

    pub fn get_state_root(self: *Self) DatabaseInterface.Error![32]u8 {
        _ = self;
        // For in-memory database, return a dummy root
        return [_]u8{0} ** 32;
    }

    pub fn commit_changes(self: *Self) DatabaseInterface.Error![32]u8 {
        // Clear transient storage
        self.transient_storage.clearAndFree();
        
        // Return dummy root
        return [_]u8{0} ** 32;
    }

    // Snapshot operations

    pub fn create_snapshot(self: *Self) DatabaseInterface.Error!u64 {
        const snapshot_id = self.next_snapshot_id;
        self.next_snapshot_id += 1;
        
        // Clone current state
        var snapshot_accounts = std.hash_map.HashMap([20]u8, Account, AccountContext, 80).init(self.allocator);
        errdefer snapshot_accounts.deinit();
        
        var accounts_iter = self.accounts.iterator();
        while (accounts_iter.next()) |entry| {
            try snapshot_accounts.put(entry.key_ptr.*, entry.value_ptr.*);
        }
        
        var snapshot_storage = std.hash_map.HashMap(StorageKey, u256, StorageKeyContext, 80).init(self.allocator);
        errdefer snapshot_storage.deinit();
        
        var storage_iter = self.storage.iterator();
        while (storage_iter.next()) |entry| {
            try snapshot_storage.put(entry.key_ptr.*, entry.value_ptr.*);
        }
        
        try self.snapshots.append(Snapshot{
            .id = snapshot_id,
            .accounts = snapshot_accounts,
            .storage = snapshot_storage,
        });
        
        return snapshot_id;
    }

    pub fn revert_to_snapshot(self: *Self, snapshot_id: u64) DatabaseInterface.Error!void {
        // Find the snapshot
        var snapshot_index: ?usize = null;
        for (self.snapshots.items, 0..) |snapshot, i| {
            if (snapshot.id == snapshot_id) {
                snapshot_index = i;
                break;
            }
        }
        
        const index = snapshot_index orelse return DatabaseInterface.Error.SnapshotNotFound;
        
        // Revert to the snapshot state
        const snapshot = self.snapshots.items[index];
        
        // Clear current state
        self.accounts.clearAndFree();
        self.storage.clearAndFree();
        
        // Copy snapshot state
        var accounts_iter = snapshot.accounts.iterator();
        while (accounts_iter.next()) |entry| {
            try self.accounts.put(entry.key_ptr.*, entry.value_ptr.*);
        }
        
        var storage_iter = snapshot.storage.iterator();
        while (storage_iter.next()) |entry| {
            try self.storage.put(entry.key_ptr.*, entry.value_ptr.*);
        }
        
        // Remove this and all later snapshots
        while (self.snapshots.items.len > index) {
            if (self.snapshots.items.len > 0) {
                var removed = self.snapshots.items[self.snapshots.items.len - 1];
                _ = self.snapshots.pop();
                removed.accounts.deinit();
                removed.storage.deinit();
            }
        }
    }

    pub fn commit_snapshot(self: *Self, snapshot_id: u64) DatabaseInterface.Error!void {
        // Find and remove the snapshot
        var snapshot_index: ?usize = null;
        for (self.snapshots.items, 0..) |snapshot, i| {
            if (snapshot.id == snapshot_id) {
                snapshot_index = i;
                break;
            }
        }
        
        const index = snapshot_index orelse return DatabaseInterface.Error.SnapshotNotFound;
        
        var removed = self.snapshots.orderedRemove(index);
        removed.accounts.deinit();
        removed.storage.deinit();
    }

    // Batch operations

    pub fn begin_batch(self: *Self) DatabaseInterface.Error!void {
        if (self.batch_in_progress) return DatabaseInterface.Error.NoBatchInProgress;
        
        self.batch_in_progress = true;
        self.batch_changes = BatchChanges{
            .accounts = std.hash_map.HashMap([20]u8, ?Account, AccountContext, 80).init(self.allocator),
            .storage = std.hash_map.HashMap(StorageKey, u256, StorageKeyContext, 80).init(self.allocator),
        };
    }

    pub fn commit_batch(self: *Self) DatabaseInterface.Error!void {
        if (!self.batch_in_progress) return DatabaseInterface.Error.NoBatchInProgress;
        
        if (self.batch_changes) |*batch| {
            // Apply account changes
            var accounts_iter = batch.accounts.iterator();
            while (accounts_iter.next()) |entry| {
                if (entry.value_ptr.*) |account| {
                    try self.accounts.put(entry.key_ptr.*, account);
                } else {
                    _ = self.accounts.remove(entry.key_ptr.*);
                }
            }
            
            // Apply storage changes
            var storage_iter = batch.storage.iterator();
            while (storage_iter.next()) |entry| {
                if (entry.value_ptr.* == 0) {
                    _ = self.storage.remove(entry.key_ptr.*);
                } else {
                    try self.storage.put(entry.key_ptr.*, entry.value_ptr.*);
                }
            }
            
            batch.accounts.deinit();
            batch.storage.deinit();
        }
        
        self.batch_in_progress = false;
        self.batch_changes = null;
    }

    pub fn rollback_batch(self: *Self) DatabaseInterface.Error!void {
        if (!self.batch_in_progress) return DatabaseInterface.Error.NoBatchInProgress;
        
        if (self.batch_changes) |*batch| {
            batch.accounts.deinit();
            batch.storage.deinit();
        }
        
        self.batch_in_progress = false;
        self.batch_changes = null;
    }
};

test "MemoryDatabase basic operations" {
    const allocator = std.testing.allocator;
    
    var db = MemoryDatabase.init(allocator);
    defer db.deinit();
    
    const db_interface = db.to_database_interface();
    
    // Test account operations
    const address = [_]u8{1} ** 20;
    const account = Account{
        .balance = 1000,
        .nonce = 5,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    
    try db_interface.set_account(address, account);
    
    const retrieved = try db_interface.get_account(address);
    try std.testing.expect(retrieved != null);
    try std.testing.expectEqual(account.balance, retrieved.?.balance);
    try std.testing.expectEqual(account.nonce, retrieved.?.nonce);
    
    // Test storage operations
    const key: u256 = 42;
    const value: u256 = 123456;
    
    try db_interface.set_storage(address, key, value);
    const stored_value = try db_interface.get_storage(address, key);
    try std.testing.expectEqual(value, stored_value);
}

test "MemoryDatabase snapshot operations" {
    const allocator = std.testing.allocator;
    
    var db = MemoryDatabase.init(allocator);
    defer db.deinit();
    
    const db_interface = db.to_database_interface();
    
    // Set initial state
    const address = [_]u8{1} ** 20;
    const account1 = Account{
        .balance = 1000,
        .nonce = 1,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    
    try db_interface.set_account(address, account1);
    
    // Create snapshot
    const snapshot_id = try db_interface.create_snapshot();
    
    // Modify state
    const account2 = Account{
        .balance = 2000,
        .nonce = 2,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    
    try db_interface.set_account(address, account2);
    
    // Verify modified state
    const modified = try db_interface.get_account(address);
    try std.testing.expectEqual(@as(u256, 2000), modified.?.balance);
    
    // Revert to snapshot
    try db_interface.revert_to_snapshot(snapshot_id);
    
    // Verify reverted state
    const reverted = try db_interface.get_account(address);
    try std.testing.expectEqual(@as(u256, 1000), reverted.?.balance);
}