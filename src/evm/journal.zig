//! State change tracking for transaction reverts.
//!
//! The journal records all state modifications during EVM execution,
//! enabling efficient rollback to previous states on transaction failure.
//! Uses a snapshot-based approach for nested call handling.

const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const JournalConfig = @import("journal_config.zig").JournalConfig;
const journal_entry = @import("journal_entry.zig");

/// Creates a configured journal type for state tracking.
pub fn Journal(comptime config: JournalConfig) type {
    config.validate();
    
    const Entry = journal_entry.JournalEntry(config);
    
    return struct {
        const Self = @This();
        
        pub const SnapshotIdType = config.SnapshotIdType;
        pub const WordType = config.WordType;
        pub const NonceType = config.NonceType;
        pub const EntryType = Entry;
        
        entries: std.ArrayList(Entry),
        next_snapshot_id: SnapshotIdType,
        allocator: std.mem.Allocator,
        
        /// Initialize a new journal
        pub fn init(allocator: std.mem.Allocator) Self {
            var entries = std.ArrayList(Entry){};
            entries.ensureTotalCapacity(allocator, config.initial_capacity) catch {}; // Best effort
            
            return Self{
                .entries = entries,
                .next_snapshot_id = 0,
                .allocator = allocator,
            };
        }
        
        /// Deinitialize the journal
        pub fn deinit(self: *Self) void {
            self.entries.deinit(self.allocator);
        }
        
        /// Create a new snapshot and return its ID
        pub fn create_snapshot(self: *Self) SnapshotIdType {
            const id = self.next_snapshot_id;
            self.next_snapshot_id += 1;
            return id;
        }
        
        /// Revert all changes back to a specific snapshot
        pub fn revert_to_snapshot(self: *Self, snapshot_id: SnapshotIdType) void {
            var i = self.entries.items.len;
            while (i > 0) : (i -= 1) {
                if (self.entries.items[i - 1].snapshot_id < snapshot_id) {
                    break;
                }
            }
            self.entries.shrinkRetainingCapacity(i);
        }
        
        /// Record a storage change
        pub fn record_storage_change(self: *Self, snapshot_id: SnapshotIdType, address: Address, key: WordType, original_value: WordType) !void {
            try self.entries.append(self.allocator, Entry.storage_change(snapshot_id, address, key, original_value));
        }
        
        /// Record a balance change
        pub fn record_balance_change(self: *Self, snapshot_id: SnapshotIdType, address: Address, original_balance: WordType) !void {
            try self.entries.append(self.allocator, Entry.balance_change(snapshot_id, address, original_balance));
        }
        
        /// Record a nonce change
        pub fn record_nonce_change(self: *Self, snapshot_id: SnapshotIdType, address: Address, original_nonce: NonceType) !void {
            try self.entries.append(self.allocator, Entry.nonce_change(snapshot_id, address, original_nonce));
        }
        
        /// Record a code change
        pub fn record_code_change(self: *Self, snapshot_id: SnapshotIdType, address: Address, original_code_hash: [32]u8) !void {
            try self.entries.append(self.allocator, Entry.code_change(snapshot_id, address, original_code_hash));
        }
        
        /// Record account creation
        pub fn record_account_created(self: *Self, snapshot_id: SnapshotIdType, address: Address) !void {
            try self.entries.append(self.allocator, Entry.account_created(snapshot_id, address));
        }
        
        /// Record account destruction
        pub fn record_account_destroyed(self: *Self, snapshot_id: SnapshotIdType, address: Address, beneficiary: Address, balance: WordType) !void {
            try self.entries.append(self.allocator, Entry.account_destroyed(snapshot_id, address, beneficiary, balance));
        }
        
        /// Get the number of entries in the journal
        pub fn entry_count(self: *const Self) usize {
            return self.entries.items.len;
        }
        
        /// Clear all entries and reset snapshot counter
        pub fn clear(self: *Self) void {
            self.entries.clearRetainingCapacity();
            self.next_snapshot_id = 0;
        }
        
        /// Get original storage value from journal (searches backwards)
        pub fn get_original_storage(self: *const Self, address: Address, slot: WordType) ?WordType {
            var i = self.entries.items.len;
            while (i > 0) : (i -= 1) {
                const entry = self.entries.items[i - 1];
                switch (entry.data) {
                    .storage_change => |sc| {
                        if (std.mem.eql(u8, &address, &sc.address) and sc.key == slot) {
                            return sc.original_value;
                        }
                    },
                    else => continue,
                }
            }
            return null;
        }
        
        /// Get original balance from journal
        pub fn get_original_balance(self: *const Self, address: Address) ?WordType {
            var i = self.entries.items.len;
            while (i > 0) : (i -= 1) {
                const entry = self.entries.items[i - 1];
                switch (entry.data) {
                    .balance_change => |bc| {
                        if (std.mem.eql(u8, &address, &bc.address)) {
                            return bc.original_balance;
                        }
                    },
                    else => continue,
                }
            }
            return null;
        }
        
        /// Get entries for a specific snapshot
        pub fn get_snapshot_entries(self: *const Self, snapshot_id: SnapshotIdType, allocator: std.mem.Allocator) ![]Entry {
            var result = std.ArrayList(Entry).init(allocator);
            for (self.entries.items) |entry| {
                if (entry.snapshot_id == snapshot_id) {
                    try result.append(entry);
                }
            }
            return result.toOwnedSlice();
        }
    };
}

/// Default journal type
pub const DefaultJournal = Journal(.{});

test "Journal - basic operations" {
    const testing = std.testing;
    
    var journal = DefaultJournal.init(testing.allocator);
    defer journal.deinit();
    
    try testing.expectEqual(@as(u32, 0), journal.next_snapshot_id);
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
    
    // Create snapshots
    const snapshot1 = journal.create_snapshot();
    const snapshot2 = journal.create_snapshot();
    const snapshot3 = journal.create_snapshot();
    
    try testing.expectEqual(@as(u32, 0), snapshot1);
    try testing.expectEqual(@as(u32, 1), snapshot2);
    try testing.expectEqual(@as(u32, 2), snapshot3);
    try testing.expectEqual(@as(u32, 3), journal.next_snapshot_id);
}

test "Journal - storage change recording" {
    const testing = std.testing;
    const zero_addr = [_]u8{0} ** 20;
    
    var journal = DefaultJournal.init(testing.allocator);
    defer journal.deinit();
    
    const snapshot_id = journal.create_snapshot();
    const key = 42;
    const original_value = 100;
    
    // Record storage change
    try journal.record_storage_change(snapshot_id, zero_addr, key, original_value);
    
    // Verify entry was recorded
    try testing.expectEqual(@as(usize, 1), journal.entry_count());
    const entry = journal.entries.items[0];
    try testing.expectEqual(snapshot_id, entry.snapshot_id);
    
    switch (entry.data) {
        .storage_change => |sc| {
            try testing.expectEqual(zero_addr, sc.address);
            try testing.expectEqual(key, sc.key);
            try testing.expectEqual(original_value, sc.original_value);
        },
        else => try testing.expect(false),
    }
    
    // Test get_original_storage
    const retrieved = journal.get_original_storage(zero_addr, key);
    try testing.expect(retrieved != null);
    try testing.expectEqual(original_value, retrieved.?);
    
    // Test non-existent storage
    const not_found = journal.get_original_storage(zero_addr, 999);
    try testing.expect(not_found == null);
}

test "Journal - revert to snapshot" {
    const testing = std.testing;
    const zero_addr = [_]u8{0} ** 20;
    
    var journal = DefaultJournal.init(testing.allocator);
    defer journal.deinit();
    
    const snapshot1 = journal.create_snapshot();
    const snapshot2 = journal.create_snapshot();
    const snapshot3 = journal.create_snapshot();
    
    // Add entries with different snapshot IDs
    try journal.record_storage_change(snapshot1, zero_addr, 1, 10);
    try journal.record_storage_change(snapshot1, zero_addr, 2, 20);
    try journal.record_storage_change(snapshot2, zero_addr, 3, 30);
    try journal.record_storage_change(snapshot3, zero_addr, 4, 40);
    
    try testing.expectEqual(@as(usize, 4), journal.entry_count());
    
    // Revert to snapshot2 - should remove entries with snapshot_id >= 2
    journal.revert_to_snapshot(snapshot2);
    
    try testing.expectEqual(@as(usize, 2), journal.entry_count());
    // Verify remaining entries are from snapshot1
    for (journal.entries.items) |entry| {
        try testing.expect(entry.snapshot_id < snapshot2);
    }
}

test "Journal - all entry types" {
    const testing = std.testing;
    const addr1 = [_]u8{1} ** 20;
    const addr2 = [_]u8{2} ** 20;
    const code_hash = [_]u8{0xAB} ** 32;
    
    var journal = DefaultJournal.init(testing.allocator);
    defer journal.deinit();
    
    const snapshot_id = journal.create_snapshot();
    
    // Record different types of changes
    try journal.record_storage_change(snapshot_id, addr1, 1, 100);
    try journal.record_balance_change(snapshot_id, addr1, 1000);
    try journal.record_nonce_change(snapshot_id, addr1, 5);
    try journal.record_code_change(snapshot_id, addr1, code_hash);
    try journal.record_account_created(snapshot_id, addr2);
    try journal.record_account_destroyed(snapshot_id, addr1, addr2, 500);
    
    try testing.expectEqual(@as(usize, 6), journal.entry_count());
    
    // Verify each entry type
    var storage_found = false;
    var balance_found = false;
    var nonce_found = false;
    var code_found = false;
    var created_found = false;
    var destroyed_found = false;
    
    for (journal.entries.items) |entry| {
        switch (entry.data) {
            .storage_change => storage_found = true,
            .balance_change => balance_found = true,
            .nonce_change => nonce_found = true,
            .code_change => code_found = true,
            .account_created => created_found = true,
            .account_destroyed => destroyed_found = true,
        }
    }
    
    try testing.expect(storage_found);
    try testing.expect(balance_found);
    try testing.expect(nonce_found);
    try testing.expect(code_found);
    try testing.expect(created_found);
    try testing.expect(destroyed_found);
}

test "Journal - get_snapshot_entries" {
    const testing = std.testing;
    const addr = [_]u8{0} ** 20;
    
    var journal = DefaultJournal.init(testing.allocator);
    defer journal.deinit();
    
    const snapshot1 = journal.create_snapshot();
    const snapshot2 = journal.create_snapshot();
    
    // Add entries for different snapshots
    try journal.record_storage_change(snapshot1, addr, 1, 10);
    try journal.record_storage_change(snapshot2, addr, 2, 20);
    try journal.record_storage_change(snapshot1, addr, 3, 30);
    try journal.record_storage_change(snapshot2, addr, 4, 40);
    
    // Get entries for snapshot1
    const snapshot1_entries = try journal.get_snapshot_entries(snapshot1, testing.allocator);
    defer testing.allocator.free(snapshot1_entries);
    
    try testing.expectEqual(@as(usize, 2), snapshot1_entries.len);
    for (snapshot1_entries) |entry| {
        try testing.expectEqual(snapshot1, entry.snapshot_id);
    }
    
    // Get entries for snapshot2
    const snapshot2_entries = try journal.get_snapshot_entries(snapshot2, testing.allocator);
    defer testing.allocator.free(snapshot2_entries);
    
    try testing.expectEqual(@as(usize, 2), snapshot2_entries.len);
    for (snapshot2_entries) |entry| {
        try testing.expectEqual(snapshot2, entry.snapshot_id);
    }
}

test "Journal - clear operation" {
    const testing = std.testing;
    const addr = [_]u8{0} ** 20;
    
    var journal = DefaultJournal.init(testing.allocator);
    defer journal.deinit();
    
    // Add some entries
    const snapshot1 = journal.create_snapshot();
    try journal.record_storage_change(snapshot1, addr, 1, 100);
    try journal.record_balance_change(snapshot1, addr, 1000);
    
    try testing.expectEqual(@as(usize, 2), journal.entry_count());
    try testing.expectEqual(@as(u32, 1), journal.next_snapshot_id);
    
    // Clear the journal
    journal.clear();
    
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
    try testing.expectEqual(@as(u32, 0), journal.next_snapshot_id);
    
    // Should be able to use it again
    const snapshot2 = journal.create_snapshot();
    try testing.expectEqual(@as(u32, 0), snapshot2);
}

test "Journal - minimal configuration" {
    const testing = std.testing;
    const MinimalJournal = Journal(.{
        .SnapshotIdType = u8,
        .WordType = u64,
        .NonceType = u16,
        .initial_capacity = 8,
    });
    
    var journal = MinimalJournal.init(testing.allocator);
    defer journal.deinit();
    
    const addr = [_]u8{0} ** 20;
    
    // Test with minimal types
    const snapshot: u8 = journal.create_snapshot();
    try journal.record_storage_change(snapshot, addr, std.math.maxInt(u64), 0);
    try journal.record_nonce_change(snapshot, addr, std.math.maxInt(u16));
    
    try testing.expectEqual(@as(usize, 2), journal.entry_count());
    
    // Test snapshot ID overflow protection
    journal.next_snapshot_id = 255;
    const last_snapshot = journal.create_snapshot();
    try testing.expectEqual(@as(u8, 255), last_snapshot);
    // Next create_snapshot would overflow - in real usage this should be checked
}

test "Journal - get_original_balance" {
    const testing = std.testing;
    const addr1 = [_]u8{1} ** 20;
    const addr2 = [_]u8{2} ** 20;
    
    var journal = DefaultJournal.init(testing.allocator);
    defer journal.deinit();
    
    const snapshot = journal.create_snapshot();
    
    // Record balance changes
    try journal.record_balance_change(snapshot, addr1, 1000);
    try journal.record_balance_change(snapshot, addr2, 2000);
    
    // Test retrieval
    const balance1 = journal.get_original_balance(addr1);
    try testing.expect(balance1 != null);
    try testing.expectEqual(@as(u256, 1000), balance1.?);
    
    const balance2 = journal.get_original_balance(addr2);
    try testing.expect(balance2 != null);
    try testing.expectEqual(@as(u256, 2000), balance2.?);
    
    // Test non-existent address
    const addr3 = [_]u8{3} ** 20;
    const balance3 = journal.get_original_balance(addr3);
    try testing.expect(balance3 == null);
}

test "Journal - memory efficiency" {
    const testing = std.testing;
    
    // Test that capacity pre-allocation works
    var journal = DefaultJournal.init(testing.allocator);
    defer journal.deinit();
    
    const initial_capacity = journal.entries.capacity;
    try testing.expect(initial_capacity >= 128); // Default initial_capacity
    
    // Add entries up to initial capacity
    const addr = [_]u8{0} ** 20;
    const snapshot = journal.create_snapshot();
    
    var i: usize = 0;
    while (i < initial_capacity) : (i += 1) {
        try journal.record_storage_change(snapshot, addr, i, i * 10);
    }
    
    // Should not have reallocated yet
    try testing.expectEqual(initial_capacity, journal.entries.capacity);
}

test "Journal - complex revert scenario" {
    const testing = std.testing;
    const addr = [_]u8{0} ** 20;
    
    var journal = DefaultJournal.init(testing.allocator);
    defer journal.deinit();
    
    // Create nested snapshots simulating nested calls
    const snapshot1 = journal.create_snapshot(); // Outer call
    try journal.record_storage_change(snapshot1, addr, 1, 100);
    
    const snapshot2 = journal.create_snapshot(); // Inner call 1
    try journal.record_storage_change(snapshot2, addr, 2, 200);
    try journal.record_balance_change(snapshot2, addr, 1000);
    
    const snapshot3 = journal.create_snapshot(); // Inner call 2
    try journal.record_storage_change(snapshot3, addr, 3, 300);
    try journal.record_nonce_change(snapshot3, addr, 5);
    
    try testing.expectEqual(@as(usize, 5), journal.entry_count());
    
    // Revert inner call 2
    journal.revert_to_snapshot(snapshot3);
    try testing.expectEqual(@as(usize, 3), journal.entry_count());
    
    // Check that snapshot1 and snapshot2 entries remain
    const storage1 = journal.get_original_storage(addr, 1);
    try testing.expect(storage1 != null);
    try testing.expectEqual(@as(u256, 100), storage1.?);
    
    const storage2 = journal.get_original_storage(addr, 2);
    try testing.expect(storage2 != null);
    try testing.expectEqual(@as(u256, 200), storage2.?);
    
    // Snapshot3 entries should be gone
    const storage3 = journal.get_original_storage(addr, 3);
    try testing.expect(storage3 == null);
}