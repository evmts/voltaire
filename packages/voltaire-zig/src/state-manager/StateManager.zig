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

/// A live named snapshot: its ID and the checkpoint depth recorded just
/// before its checkpoint was pushed. The snapshot's own checkpoint sits at
/// index `depth` of the checkpoint stack, so the snapshot is live only while
/// the checkpoint depth is greater than `depth`.
const Snapshot = struct {
    id: u64,
    depth: usize,
};

/// Main state manager with snapshot support
pub const StateManager = struct {
    allocator: std.mem.Allocator,
    journaled_state: JournaledState.JournaledState,
    snapshot_counter: u64,
    /// Live snapshots, oldest first. Both `id` and `depth` strictly increase
    /// toward the top, mirroring the checkpoint stack.
    snapshots: std.ArrayList(Snapshot),

    pub fn init(
        allocator: std.mem.Allocator,
        fork_backend: ?*ForkBackend.ForkBackend,
    ) !StateManager {
        return .{
            .allocator = allocator,
            .journaled_state = try JournaledState.JournaledState.init(allocator, fork_backend),
            .snapshot_counter = 0,
            .snapshots = .{},
        };
    }

    pub fn deinit(self: *StateManager) void {
        self.journaled_state.deinit();
        self.snapshots.deinit(self.allocator);
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

    /// Put a fresh account directly into the cache, bypassing fork backend reads.
    /// Use this for seeding dev accounts at init time where the local overlay
    /// should unconditionally override any remote state.
    pub fn initAccount(self: *StateManager, address: Address, balance: u256) !void {
        var account = StateCache.AccountState.init();
        account.balance = balance;
        try self.journaled_state.putAccount(address, account);
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

    /// Pop the top checkpoint and restore its state. A snapshot whose
    /// checkpoint is popped here is consumed and can no longer be reverted to.
    pub fn revert(self: *StateManager) void {
        self.journaled_state.revert();
        self.dropConsumedSnapshots();
    }

    /// Pop the top checkpoint and keep current state. A snapshot whose
    /// checkpoint is popped here is consumed and can no longer be reverted to.
    pub fn commit(self: *StateManager) void {
        self.journaled_state.commit();
        self.dropConsumedSnapshots();
    }

    // Snapshot operations

    /// Push a checkpoint and return an ID that `revertToSnapshot` accepts.
    ///
    /// Atomic: on `error.OutOfMemory` the state, the checkpoint depth, and
    /// the next snapshot ID are unchanged.
    pub fn snapshot(self: *StateManager) !u64 {
        // Reserve the bookkeeping slot first so nothing can fail after the
        // checkpoint is pushed. `JournaledState.checkpoint` is itself atomic.
        try self.snapshots.ensureUnusedCapacity(self.allocator, 1);

        const depth = self.getCheckpointDepth();
        try self.journaled_state.checkpoint();

        const snapshot_id = self.snapshot_counter;
        self.snapshots.appendAssumeCapacity(.{ .id = snapshot_id, .depth = depth });
        self.snapshot_counter += 1;

        return snapshot_id;
    }

    /// Restore the state captured by `snapshot_id`, then discard that
    /// snapshot and every newer one.
    ///
    /// Returns `error.InvalidSnapshot`, leaving state untouched, if the ID
    /// is unknown, was already reverted to, or had its checkpoint popped by
    /// a raw `revert()`/`commit()`. Allocates nothing.
    pub fn revertToSnapshot(self: *StateManager, snapshot_id: u64) !void {
        var index = self.snapshots.items.len;
        while (index > 0) {
            index -= 1;
            if (self.snapshots.items[index].id == snapshot_id) break;
        } else return error.InvalidSnapshot;

        const target_depth = self.snapshots.items[index].depth;

        // `dropConsumedSnapshots` keeps every live snapshot's checkpoint on
        // the stack; fail closed if that ever stops holding.
        if (self.getCheckpointDepth() <= target_depth) return error.InvalidSnapshot;

        // Revert until we reach target depth
        while (self.getCheckpointDepth() > target_depth) {
            self.journaled_state.revert();
        }

        // Remove this snapshot and all newer ones
        self.snapshots.shrinkRetainingCapacity(index);
    }

    /// Drop every snapshot whose checkpoint is no longer on the stack.
    fn dropConsumedSnapshots(self: *StateManager) void {
        const depth = self.getCheckpointDepth();
        var len = self.snapshots.items.len;
        while (len > 0 and self.snapshots.items[len - 1].depth >= depth) len -= 1;
        self.snapshots.shrinkRetainingCapacity(len);
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

    pub fn accountIterator(self: *StateManager) std.AutoHashMap(Address, StateCache.AccountState).Iterator {
        return self.journaled_state.account_cache.iterator();
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

test "StateManager - revertToSnapshot rejects snapshot unwound by raw revert" {
    const allocator = std.testing.allocator;
    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    try manager.setBalance(addr, 1000);

    // Outer checkpoint, then a snapshot recorded at depth 1
    try manager.checkpoint();
    const snap = try manager.snapshot();
    try manager.setBalance(addr, 2000);

    // Raw reverts unwind past the snapshot: depth 2 -> 0 < target depth 1
    manager.revert();
    manager.revert();

    try std.testing.expectError(error.InvalidSnapshot, manager.revertToSnapshot(snap));
    try std.testing.expectEqual(@as(u256, 1000), try manager.getBalance(addr));
}

test "StateManager - revertToSnapshot rejects snapshot consumed by raw commit" {
    const allocator = std.testing.allocator;
    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    try manager.setBalance(addr, 1000);

    const snap = try manager.snapshot();
    try manager.setBalance(addr, 2000);

    // Raw commit pops the snapshot's checkpoint: nothing is left to revert to
    manager.commit();

    try std.testing.expectError(error.InvalidSnapshot, manager.revertToSnapshot(snap));
    try std.testing.expectEqual(@as(u256, 2000), try manager.getBalance(addr));
    try std.testing.expectEqual(@as(usize, 0), manager.getCheckpointDepth());
}

test "StateManager - consumed snapshot stays invalid after the depth is reused" {
    const allocator = std.testing.allocator;
    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    try manager.setBalance(addr, 1000);

    const snap = try manager.snapshot();
    try manager.setBalance(addr, 2000);
    manager.commit();

    // An unrelated checkpoint now occupies the consumed snapshot's depth
    try manager.checkpoint();
    try manager.setBalance(addr, 3000);

    try std.testing.expectError(error.InvalidSnapshot, manager.revertToSnapshot(snap));
    try std.testing.expectEqual(@as(u256, 3000), try manager.getBalance(addr));
    try std.testing.expectEqual(@as(usize, 1), manager.getCheckpointDepth());

    // A snapshot consumed by a raw revert is invalid as well
    const snap2 = try manager.snapshot();
    manager.revert();
    try manager.checkpoint();
    try std.testing.expectError(error.InvalidSnapshot, manager.revertToSnapshot(snap2));
}

test "StateManager - raw commit of an inner checkpoint keeps the outer snapshot" {
    const allocator = std.testing.allocator;
    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    try manager.setBalance(addr, 1000);

    const snap = try manager.snapshot();
    try manager.checkpoint();
    try manager.setBalance(addr, 2000);
    manager.commit();

    try manager.revertToSnapshot(snap);
    try std.testing.expectEqual(@as(u256, 1000), try manager.getBalance(addr));
    try std.testing.expectEqual(@as(usize, 0), manager.getCheckpointDepth());

    // A snapshot is single-use
    try std.testing.expectError(error.InvalidSnapshot, manager.revertToSnapshot(snap));
}

test "StateManager - snapshot is atomic under OOM" {
    var failing = std.testing.FailingAllocator.init(std.testing.allocator, .{});
    const allocator = failing.allocator();

    var manager = try StateManager.init(allocator, null);
    defer manager.deinit();

    const addr = Address{ .bytes = [_]u8{0x11} ++ [_]u8{0} ** 19 };
    try manager.setBalance(addr, 1000);
    try manager.setStorage(addr, 42, 9999);
    try manager.setCode(addr, &[_]u8{ 0x60, 0x60 });

    // Fail each allocation inside snapshot() in turn until one succeeds
    var fail_index: usize = 0;
    var failures: usize = 0;
    const snap = while (true) {
        const depth = manager.getCheckpointDepth();
        const counter = manager.snapshot_counter;
        const live = manager.snapshots.items.len;
        const capacity = manager.snapshots.capacity;

        failing.fail_index = failing.alloc_index + fail_index;
        const result = manager.snapshot();
        failing.fail_index = std.math.maxInt(usize);

        const id = result catch |err| {
            try std.testing.expectEqual(error.OutOfMemory, err);
            try std.testing.expectEqual(depth, manager.getCheckpointDepth());
            try std.testing.expectEqual(depth, manager.journaled_state.storage_cache.checkpoints.items.len);
            try std.testing.expectEqual(depth, manager.journaled_state.contract_cache.checkpoints.items.len);
            try std.testing.expectEqual(counter, manager.snapshot_counter);
            try std.testing.expectEqual(live, manager.snapshots.items.len);
            try std.testing.expectEqual(@as(u256, 1000), try manager.getBalance(addr));
            try std.testing.expectEqual(@as(u256, 9999), try manager.getStorage(addr, 42));
            failures += 1;
            // The bookkeeping reservation survives a failed attempt, so the
            // next attempt makes one allocation fewer before the checkpoint:
            // the same index then targets the next checkpoint allocation.
            if (manager.snapshots.capacity == capacity) fail_index += 1;
            continue;
        };
        break id;
    };

    // At least the bookkeeping reservation and one cache clone were failed
    try std.testing.expect(failures >= 2);
    try std.testing.expectEqual(@as(u64, 0), snap);
    try std.testing.expectEqual(@as(usize, 1), manager.getCheckpointDepth());
    try std.testing.expectEqual(@as(u64, 1), manager.snapshot_counter);

    // The snapshot that finally succeeded is fully usable
    try manager.setBalance(addr, 2000);
    try manager.revertToSnapshot(snap);
    try std.testing.expectEqual(@as(u256, 1000), try manager.getBalance(addr));
    try std.testing.expectEqual(@as(usize, 0), manager.getCheckpointDepth());
}
