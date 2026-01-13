//! StateManager - Main state manager with snapshot support
//!
//! Wraps JournaledState and provides:
//! - Convenience methods for state access (getBalance, setNonce, etc.)
//! - Snapshot tracking for testing (snapshot/revertToSnapshot)
//! - Checkpoint operations
//!
//! ## Snapshot vs Checkpoint
//! - Checkpoint: Low-level journaling (push state to stack)
//! - Snapshot: High-level testing feature (returns snapshot ID for later revert)
//!
//! ## Usage
//! ```zig
//! const StateManager = @import("state-manager").StateManager;
//!
//! var manager = try StateManager.init(allocator, fork_backend);
//! defer manager.deinit();
//!
//! // State access
//! const balance = try manager.getBalance(address);
//! try manager.setBalance(address, 1000);
//!
//! // Checkpoint operations
//! try manager.checkpoint();
//! manager.revert(); // or manager.commit()
//!
//! // Snapshot operations (for testing)
//! const snap_id = try manager.snapshot();
//! try manager.setBalance(address, 2000);
//! try manager.revertToSnapshot(snap_id); // Restores balance to previous value
//! ```

const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;
const JournaledState = @import("JournaledState.zig");
const StateCache = @import("StateCache.zig");
const ForkBackend = @import("ForkBackend.zig");

/// Main state manager with snapshot support
pub const StateManager = struct {
    allocator: std.mem.Allocator,
    journaled_state: JournaledState.JournaledState,
    snapshot_counter: u64,
    snapshots: std.AutoHashMap(u64, usize), // snapshot_id → checkpoint depth

    pub fn init(
        allocator: std.mem.Allocator,
        fork_backend: ?*ForkBackend.ForkBackend,
    ) !StateManager {
        return .{
            .allocator = allocator,
            .journaled_state = try JournaledState.JournaledState.init(allocator, fork_backend),
            .snapshot_counter = 0,
            .snapshots = std.AutoHashMap(u64, usize).init(allocator),
        };
    }

    pub fn deinit(self: *StateManager) void {
        self.journaled_state.deinit();
        self.snapshots.deinit();
    }

    // State accessors
    pub fn getBalance(self: *StateManager, address: Address) !u256 {
        const account = try self.journaled_state.getAccount(address);
        return account.balance;
    }

    pub fn getNonce(self: *StateManager, address: Address) !u64 {
        const account = try self.journaled_state.getAccount(address);
        return account.nonce;
    }

    pub fn getCode(self: *StateManager, address: Address) ![]const u8 {
        return try self.journaled_state.getCode(address);
    }

    pub fn getStorage(self: *StateManager, address: Address, slot: u256) !u256 {
        return try self.journaled_state.getStorage(address, slot);
    }

    // State mutators
    pub fn setBalance(self: *StateManager, address: Address, balance: u256) !void {
        var account = try self.journaled_state.getAccount(address);
        account.balance = balance;
        try self.journaled_state.putAccount(address, account);
    }

    pub fn setNonce(self: *StateManager, address: Address, nonce: u64) !void {
        var account = try self.journaled_state.getAccount(address);
        account.nonce = nonce;
        try self.journaled_state.putAccount(address, account);
    }

    pub fn setCode(self: *StateManager, address: Address, code: []const u8) !void {
        try self.journaled_state.putCode(address, code);
    }

    pub fn setStorage(self: *StateManager, address: Address, slot: u256, value: u256) !void {
        try self.journaled_state.putStorage(address, slot, value);
    }

    // Checkpoint operations
    pub fn checkpoint(self: *StateManager) !void {
        try self.journaled_state.checkpoint();
    }

    pub fn revert(self: *StateManager) void {
        self.journaled_state.revert();
    }

    pub fn commit(self: *StateManager) void {
        self.journaled_state.commit();
    }

    // Snapshot operations
    pub fn snapshot(self: *StateManager) !u64 {
        const snapshot_id = self.snapshot_counter;
        self.snapshot_counter += 1;

        // Store checkpoint depth BEFORE creating checkpoint
        const depth = self.getCheckpointDepth();
        try self.snapshots.put(snapshot_id, depth);

        // Create checkpoint after storing depth
        try self.journaled_state.checkpoint();

        return snapshot_id;
    }

    pub fn revertToSnapshot(self: *StateManager, snapshot_id: u64) !void {
        const target_depth = self.snapshots.get(snapshot_id) orelse return error.InvalidSnapshot;
        const current_depth = self.getCheckpointDepth();

        // Revert until we reach target depth
        var i: usize = 0;
        while (i < (current_depth - target_depth)) : (i += 1) {
            self.journaled_state.revert();
        }

        // Remove this snapshot and all newer ones
        var it = self.snapshots.iterator();
        var to_remove = std.ArrayList(u64){};
        defer to_remove.deinit(self.allocator);

        while (it.next()) |entry| {
            if (entry.key_ptr.* >= snapshot_id) {
                try to_remove.append(self.allocator, entry.key_ptr.*);
            }
        }

        for (to_remove.items) |id| {
            _ = self.snapshots.remove(id);
        }
    }

    fn getCheckpointDepth(self: *StateManager) usize {
        // Assuming all caches have same depth (they're synced)
        return self.journaled_state.account_cache.checkpoints.items.len;
    }

    // Cache management
    pub fn clearCaches(self: *StateManager) void {
        self.journaled_state.clearCaches();
    }

    pub fn clearForkCache(self: *StateManager) void {
        if (self.journaled_state.fork_backend) |fork| {
            fork.clearCaches();
        }
    }
};

// Tests
test "StateManager - basic state operations" {
    const allocator = std.testing.allocator;
    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };

    // Set and get balance
    try manager.setBalance(addr, 1000);
    const balance = try manager.getBalance(addr);
    try std.testing.expectEqual(@as(u256, 1000), balance);

    // Set and get nonce
    try manager.setNonce(addr, 5);
    const nonce = try manager.getNonce(addr);
    try std.testing.expectEqual(@as(u64, 5), nonce);

    // Set and get storage
    try manager.setStorage(addr, 42, 9999);
    const value = try manager.getStorage(addr, 42);
    try std.testing.expectEqual(@as(u256, 9999), value);

    // Set and get code
    const code = [_]u8{ 0x60, 0x60, 0x60, 0x40 };
    try manager.setCode(addr, &code);
    const retrieved_code = try manager.getCode(addr);
    try std.testing.expectEqualSlices(u8, &code, retrieved_code);
}

test "StateManager - checkpoint operations" {
    const allocator = std.testing.allocator;
    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };

    // Initial state
    try manager.setBalance(addr, 1000);
    try manager.checkpoint();

    // Modify
    try manager.setBalance(addr, 2000);
    var balance = try manager.getBalance(addr);
    try std.testing.expectEqual(@as(u256, 2000), balance);

    // Revert
    manager.revert();
    balance = try manager.getBalance(addr);
    try std.testing.expectEqual(@as(u256, 1000), balance);
}

test "StateManager - checkpoint commit" {
    const allocator = std.testing.allocator;
    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };

    // Initial state
    try manager.setBalance(addr, 1000);
    try manager.checkpoint();

    // Modify
    try manager.setBalance(addr, 2000);

    // Commit
    manager.commit();

    // Changes should persist
    const balance = try manager.getBalance(addr);
    try std.testing.expectEqual(@as(u256, 2000), balance);
}

test "StateManager - snapshot and revert" {
    const allocator = std.testing.allocator;
    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };

    // Initial state
    try manager.setBalance(addr, 1000);

    // Take snapshot
    const snap_id = try manager.snapshot();

    // Modify
    try manager.setBalance(addr, 2000);
    var balance = try manager.getBalance(addr);
    try std.testing.expectEqual(@as(u256, 2000), balance);

    // Revert to snapshot
    try manager.revertToSnapshot(snap_id);
    balance = try manager.getBalance(addr);
    try std.testing.expectEqual(@as(u256, 1000), balance);
}

test "StateManager - multiple snapshots" {
    const allocator = std.testing.allocator;
    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };

    // Level 0
    try manager.setBalance(addr, 1000);

    // Snapshot 1
    const snap1 = try manager.snapshot();
    try manager.setBalance(addr, 2000);

    // Snapshot 2
    const snap2 = try manager.snapshot();
    try manager.setBalance(addr, 3000);

    // Verify current state
    var balance = try manager.getBalance(addr);
    try std.testing.expectEqual(@as(u256, 3000), balance);

    // Revert to snapshot 2
    try manager.revertToSnapshot(snap2);
    balance = try manager.getBalance(addr);
    try std.testing.expectEqual(@as(u256, 2000), balance);

    // Revert to snapshot 1
    try manager.revertToSnapshot(snap1);
    balance = try manager.getBalance(addr);
    try std.testing.expectEqual(@as(u256, 1000), balance);
}

test "StateManager - invalid snapshot" {
    const allocator = std.testing.allocator;
    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    // Try to revert to non-existent snapshot
    const result = manager.revertToSnapshot(999);
    try std.testing.expectError(error.InvalidSnapshot, result);
}

test "StateManager - snapshot clears newer snapshots" {
    const allocator = std.testing.allocator;
    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };

    try manager.setBalance(addr, 1000);

    const snap1 = try manager.snapshot();
    try manager.setBalance(addr, 2000);

    const snap2 = try manager.snapshot();
    try manager.setBalance(addr, 3000);

    // Revert to snap1 should clear snap2
    try manager.revertToSnapshot(snap1);

    // snap2 should no longer be valid
    const result = manager.revertToSnapshot(snap2);
    try std.testing.expectError(error.InvalidSnapshot, result);
}
