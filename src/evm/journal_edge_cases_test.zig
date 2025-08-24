

const std = @import("std");
const testing = std.testing;
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const Journal = @import("journal.zig").Journal;
const JournalConfig = @import("journal_config.zig").JournalConfig;


test "Journal edge cases - snapshot ID overflow protection" {
    // Test with small ID type to trigger overflow
    var journal = Journal(.{ .SnapshotIdType = u8 }).init(testing.allocator);
    defer journal.deinit();
    
    // Set to near overflow
    journal.next_snapshot_id = 254;
    
    const snapshot1 = journal.create_snapshot(); // 254
    const snapshot2 = journal.create_snapshot(); // 255
    
    try testing.expectEqual(@as(u8, 254), snapshot1);
    try testing.expectEqual(@as(u8, 255), snapshot2);
    try testing.expectEqual(@as(u8, 0), journal.next_snapshot_id); // Wrapped to 0
    
    const addr = [_]u8{0} ** 20;
    
    // Add entries with near-overflow IDs
    try journal.record_storage_change(snapshot1, addr, 1, 100);
    try journal.record_storage_change(snapshot2, addr, 2, 200);
    
    // Create new snapshot after wrap
    const wrapped_snapshot = journal.create_snapshot(); // Should be 0
    try testing.expectEqual(@as(u8, 0), wrapped_snapshot);
    try journal.record_storage_change(wrapped_snapshot, addr, 3, 300);
    
    // Revert to wrapped snapshot should remove entries with ID >= 0 (all entries)
    journal.revert_to_snapshot(0);
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
    
    // Test revert to high ID after wrap
    try journal.record_storage_change(wrapped_snapshot, addr, 4, 400);
    journal.revert_to_snapshot(255); // Should remove nothing since 255 > 0
    try testing.expectEqual(@as(usize, 1), journal.entry_count());
}

test "Journal edge cases - maximum entries with minimal types" {
    const config = JournalConfig{
        .SnapshotIdType = u8,
        .WordType = u32,
        .NonceType = u8,
        .initial_capacity = 4,
    };
    var journal = Journal(config).init(testing.allocator);
    defer journal.deinit();
    
    const addr = [_]u8{0} ** 20;
    const snapshot = journal.create_snapshot();
    
    // Add entries up to type limits
    try journal.record_storage_change(snapshot, addr, std.math.maxInt(u32), std.math.maxInt(u32));
    try journal.record_nonce_change(snapshot, addr, std.math.maxInt(u8));
    try journal.record_balance_change(snapshot, addr, std.math.maxInt(u32));
    
    try testing.expectEqual(@as(usize, 3), journal.entry_count());
    
    // Verify values are preserved correctly
    const max_storage = journal.get_original_storage(addr, std.math.maxInt(u32));
    try testing.expect(max_storage != null);
    try testing.expectEqual(std.math.maxInt(u32), max_storage.?);
    
    const max_balance = journal.get_original_balance(addr);
    try testing.expect(max_balance != null);
    try testing.expectEqual(std.math.maxInt(u32), max_balance.?);
    
    // Test revert with max snapshot ID
    journal.next_snapshot_id = std.math.maxInt(u8);
    const max_snapshot = journal.create_snapshot();
    try testing.expectEqual(std.math.maxInt(u8), max_snapshot);
    
    try journal.record_storage_change(max_snapshot, addr, 0, 0);
    
    // Revert to max should remove only the new entry
    journal.revert_to_snapshot(std.math.maxInt(u8));
    try testing.expectEqual(@as(usize, 3), journal.entry_count());
}

test "Journal edge cases - zero values and addresses" {
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    const zero_addr = [_]u8{0} ** 20;
    const zero_hash = [_]u8{0} ** 32;
    const snapshot = journal.create_snapshot();
    
    // Test all entry types with zero values
    try journal.record_storage_change(snapshot, zero_addr, 0, 0);
    try journal.record_balance_change(snapshot, zero_addr, 0);
    try journal.record_nonce_change(snapshot, zero_addr, 0);
    try journal.record_code_change(snapshot, zero_addr, zero_hash);
    try journal.record_account_created(snapshot, zero_addr);
    try journal.record_account_destroyed(snapshot, zero_addr, zero_addr, 0);
    
    try testing.expectEqual(@as(usize, 6), journal.entry_count());
    
    // Verify zero values are handled correctly
    const zero_storage = journal.get_original_storage(zero_addr, 0);
    try testing.expect(zero_storage != null);
    try testing.expectEqual(@as(u256, 0), zero_storage.?);
    
    const zero_balance = journal.get_original_balance(zero_addr);
    try testing.expect(zero_balance != null);
    try testing.expectEqual(@as(u256, 0), zero_balance.?);
    
    // Test revert with zero snapshot ID
    journal.revert_to_snapshot(0);
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
}

test "Journal edge cases - duplicate entries same snapshot" {
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    const addr = [_]u8{1} ** 20;
    const snapshot = journal.create_snapshot();
    
    // Record multiple changes to same storage slot in same snapshot
    try journal.record_storage_change(snapshot, addr, 1, 100);
    try journal.record_storage_change(snapshot, addr, 1, 200); // Same slot, different original value
    try journal.record_storage_change(snapshot, addr, 1, 300); // Same slot, different original value
    
    // Record multiple balance changes
    try journal.record_balance_change(snapshot, addr, 1000);
    try journal.record_balance_change(snapshot, addr, 2000);
    
    try testing.expectEqual(@as(usize, 5), journal.entry_count());
    
    // get_original_storage should return the first recorded value (most recent search)
    const original_storage = journal.get_original_storage(addr, 1);
    try testing.expect(original_storage != null);
    try testing.expectEqual(@as(u256, 300), original_storage.?); // Last recorded value
    
    const original_balance = journal.get_original_balance(addr);
    try testing.expect(original_balance != null);
    try testing.expectEqual(@as(u256, 2000), original_balance.?); // Last recorded value
    
    // All entries should be removed on revert
    journal.revert_to_snapshot(snapshot);
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
}

test "Journal edge cases - interleaved snapshots with same addresses" {
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    const addr = [_]u8{1} ** 20;
    
    const snapshot1 = journal.create_snapshot();
    const snapshot2 = journal.create_snapshot();
    const snapshot3 = journal.create_snapshot();
    
    // Interleave entries for same address across snapshots
    try journal.record_storage_change(snapshot1, addr, 1, 100);
    try journal.record_storage_change(snapshot2, addr, 1, 200); // Same slot, different snapshot
    try journal.record_storage_change(snapshot3, addr, 1, 300); // Same slot, different snapshot
    
    try journal.record_balance_change(snapshot2, addr, 1000);
    try journal.record_balance_change(snapshot1, addr, 2000); // Different order
    try journal.record_balance_change(snapshot3, addr, 3000);
    
    try testing.expectEqual(@as(usize, 6), journal.entry_count());
    
    // Should find most recent entry (last in array)
    const storage_value = journal.get_original_storage(addr, 1);
    try testing.expect(storage_value != null);
    try testing.expectEqual(@as(u256, 3000), storage_value.?); // Last balance change recorded
    
    // Revert to snapshot2 - should remove entries with snapshot_id >= 2
    journal.revert_to_snapshot(snapshot2);
    try testing.expectEqual(@as(usize, 2), journal.entry_count());
    
    // Only snapshot1 entries should remain
    for (journal.entries.items) |entry| {
        try testing.expect(entry.snapshot_id < snapshot2);
    }
    
    // Verify correct remaining values
    const remaining_storage = journal.get_original_storage(addr, 1);
    try testing.expect(remaining_storage != null);
    try testing.expectEqual(@as(u256, 100), remaining_storage.?); // snapshot1 value
    
    const remaining_balance = journal.get_original_balance(addr);
    try testing.expect(remaining_balance != null);
    try testing.expectEqual(@as(u256, 2000), remaining_balance.?); // snapshot1 value
}

test "Journal edge cases - memory allocation failure simulation" {
    var failing_allocator = testing.FailingAllocator.init(testing.allocator, .{ .fail_index = 5 });
    var journal = Journal(.{}).init(failing_allocator.allocator());
    defer journal.deinit();
    
    const addr = [_]u8{0} ** 20;
    const snapshot = journal.create_snapshot();
    
    // Add entries until allocation fails
    var i: usize = 0;
    while (i < 10) : (i += 1) {
        const result = journal.record_storage_change(snapshot, addr, i, i * 100);
        if (result != error.OutOfMemory) {
            try result;
        } else {
            // Allocation failed - this is expected
            break;
        }
    }
    
    // Should have succeeded for some entries before failure
    const entry_count = journal.entry_count();
    try testing.expect(entry_count > 0);
    try testing.expect(entry_count < 10);
    
    // Entries that were added should be retrievable
    var j: usize = 0;
    while (j < entry_count) : (j += 1) {
        const stored = journal.get_original_storage(addr, j);
        if (stored != null) {
            try testing.expectEqual(@as(u256, j * 100), stored.?);
        }
    }
    
    // Revert should work even after allocation failure
    journal.revert_to_snapshot(snapshot);
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
}

test "Journal edge cases - very large address space" {
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    const snapshot = journal.create_snapshot();
    
    // Create addresses with different patterns
    var addr1 = [_]u8{0} ** 20;
    var addr2 = [_]u8{0xFF} ** 20;
    var addr3 = [_]u8{0} ** 20;
    
    // Set specific patterns
    addr1[0] = 0x01;
    addr1[19] = 0x01;
    
    addr3[10] = 0xAB;
    
    // Test storage with large keys
    const large_key1 = std.math.maxInt(u256);
    const large_key2 = std.math.maxInt(u256) - 1;
    
    try journal.record_storage_change(snapshot, addr1, large_key1, 100);
    try journal.record_storage_change(snapshot, addr2, large_key2, 200);
    try journal.record_storage_change(snapshot, addr3, 0, 300);
    
    // Test retrieval
    const val1 = journal.get_original_storage(addr1, large_key1);
    try testing.expect(val1 != null);
    try testing.expectEqual(@as(u256, 100), val1.?);
    
    const val2 = journal.get_original_storage(addr2, large_key2);
    try testing.expect(val2 != null);
    try testing.expectEqual(@as(u256, 200), val2.?);
    
    const val3 = journal.get_original_storage(addr3, 0);
    try testing.expect(val3 != null);
    try testing.expectEqual(@as(u256, 300), val3.?);
    
    // Test non-existent combinations
    const nonexistent1 = journal.get_original_storage(addr1, large_key2); // Wrong key
    try testing.expect(nonexistent1 == null);
    
    const nonexistent2 = journal.get_original_storage(addr2, large_key1); // Wrong address
    try testing.expect(nonexistent2 == null);
}

test "Journal edge cases - snapshot bounds edge cases" {
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    const addr = [_]u8{0} ** 20;
    
    // Test revert to snapshot before any snapshots created
    journal.revert_to_snapshot(999);
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
    
    // Create snapshot and add entries
    const snapshot1 = journal.create_snapshot(); // Should be 0
    try journal.record_storage_change(snapshot1, addr, 1, 100);
    
    const snapshot2 = journal.create_snapshot(); // Should be 1
    try journal.record_storage_change(snapshot2, addr, 2, 200);
    
    // Test exact boundary conditions
    journal.revert_to_snapshot(snapshot2); // Should remove entries with snapshot_id >= 1
    try testing.expectEqual(@as(usize, 1), journal.entry_count());
    
    journal.revert_to_snapshot(snapshot1); // Should remove entries with snapshot_id >= 0
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
    
    // Add entries again
    try journal.record_storage_change(snapshot1, addr, 3, 300);
    try journal.record_storage_change(snapshot2, addr, 4, 400);
    
    // Test revert to non-boundary values
    journal.revert_to_snapshot(0); // Should remove all entries (>= 0)
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
}

test "Journal edge cases - rapid snapshot creation and destruction" {
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    const addr = [_]u8{0} ** 20;
    
    // Create and immediately revert many snapshots
    var round: usize = 0;
    while (round < 100) : (round += 1) {
        const snapshot = journal.create_snapshot();
        try journal.record_storage_change(snapshot, addr, round, round * 10);
        
        // Revert every other snapshot immediately
        if (round % 2 == 1) {
            journal.revert_to_snapshot(snapshot);
        }
    }
    
    // Should have entries only for even rounds
    const expected_count = 50; // Half of 100 rounds
    try testing.expectEqual(expected_count, journal.entry_count());
    
    // Verify only even-round entries exist
    var even_round: usize = 0;
    while (even_round < 100) : (even_round += 2) {
        const stored = journal.get_original_storage(addr, even_round);
        try testing.expect(stored != null);
        try testing.expectEqual(@as(u256, even_round * 10), stored.?);
    }
    
    // Verify odd-round entries don't exist
    var odd_round: usize = 1;
    while (odd_round < 100) : (odd_round += 2) {
        const stored = journal.get_original_storage(addr, odd_round);
        try testing.expect(stored == null);
    }
    
    // Final bulk revert
    journal.revert_to_snapshot(0);
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
}

test "Journal edge cases - get_snapshot_entries edge cases" {
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    const addr = [_]u8{0} ** 20;
    
    // Test with non-existent snapshot ID
    const nonexistent_entries = try journal.get_snapshot_entries(999, testing.allocator);
    defer testing.allocator.free(nonexistent_entries);
    try testing.expectEqual(@as(usize, 0), nonexistent_entries.len);
    
    const snapshot1 = journal.create_snapshot();
    const snapshot2 = journal.create_snapshot();
    
    // Add entries to both snapshots
    try journal.record_storage_change(snapshot1, addr, 1, 100);
    try journal.record_balance_change(snapshot1, addr, 1000);
    try journal.record_storage_change(snapshot2, addr, 2, 200);
    
    // Test empty snapshot
    const empty_snapshot = journal.create_snapshot();
    const empty_entries = try journal.get_snapshot_entries(empty_snapshot, testing.allocator);
    defer testing.allocator.free(empty_entries);
    try testing.expectEqual(@as(usize, 0), empty_entries.len);
    
    // Test populated snapshots
    const snapshot1_entries = try journal.get_snapshot_entries(snapshot1, testing.allocator);
    defer testing.allocator.free(snapshot1_entries);
    try testing.expectEqual(@as(usize, 2), snapshot1_entries.len);
    
    const snapshot2_entries = try journal.get_snapshot_entries(snapshot2, testing.allocator);
    defer testing.allocator.free(snapshot2_entries);
    try testing.expectEqual(@as(usize, 1), snapshot2_entries.len);
    
    // Verify entry contents
    for (snapshot1_entries) |entry| {
        try testing.expectEqual(snapshot1, entry.snapshot_id);
    }
    
    for (snapshot2_entries) |entry| {
        try testing.expectEqual(snapshot2, entry.snapshot_id);
    }
    
    // Test after revert
    journal.revert_to_snapshot(snapshot2);
    
    // snapshot2 and higher should now be empty
    const reverted_entries = try journal.get_snapshot_entries(snapshot2, testing.allocator);
    defer testing.allocator.free(reverted_entries);
    try testing.expectEqual(@as(usize, 0), reverted_entries.len);
    
    // snapshot1 should still have entries
    const remaining_entries = try journal.get_snapshot_entries(snapshot1, testing.allocator);
    defer testing.allocator.free(remaining_entries);
    try testing.expectEqual(@as(usize, 2), remaining_entries.len);
}

test "Journal edge cases - capacity management under stress" {
    var journal = Journal(.{ .initial_capacity = 1 }).init(testing.allocator);
    defer journal.deinit();
    
    const addr = [_]u8{0} ** 20;
    
    // Force multiple reallocations
    var snapshot_count: u32 = 0;
    var total_entries: usize = 0;
    
    while (snapshot_count < 10) : (snapshot_count += 1) {
        const snapshot = journal.create_snapshot();
        
        // Add exponentially increasing entries per snapshot
        const entries_this_round = @as(usize, 1) << @intCast(snapshot_count % 6); // Up to 32 entries
        var entry_in_round: usize = 0;
        while (entry_in_round < entries_this_round) : (entry_in_round += 1) {
            try journal.record_storage_change(snapshot, addr, total_entries, total_entries * 10);
            total_entries += 1;
        }
        
        // Periodically revert to manage memory
        if (snapshot_count % 3 == 2) {
            journal.revert_to_snapshot(snapshot);
            total_entries -= entries_this_round;
        }
    }
    
    // Verify final state
    try testing.expect(journal.entry_count() > 0);
    try testing.expect(journal.entry_count() < total_entries); // Some were reverted
    
    // Verify capacity grew appropriately
    try testing.expect(journal.entries.capacity >= journal.entry_count());
    
    // Final cleanup should work
    journal.clear();
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
    try testing.expectEqual(@as(u32, 0), journal.next_snapshot_id);
}