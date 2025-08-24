const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const Journal = @import("../journal.zig").Journal;

// Performance regression benchmark suite for snapshot management
// These benchmarks establish baseline performance metrics and detect regressions

const RegressionJournal = Journal(.{
    .SnapshotIdType = u32,
    .WordType = u256, 
    .NonceType = u64,
    .initial_capacity = 512,
});

// Test data
const test_address = [_]u8{0xAB} ** 20;

// BASELINE PERFORMANCE BENCHMARKS
// These establish expected performance baselines for regression detection

fn regression_snapshot_create_1000(allocator: std.mem.Allocator) void {
    // BASELINE: Should create 1000 snapshots in <1ms
    var journal = RegressionJournal.init(allocator);
    defer journal.deinit();
    
    var i: u32 = 0;
    while (i < 1000) : (i += 1) {
        _ = journal.create_snapshot();
    }
}

fn regression_single_entry_record_1000(allocator: std.mem.Allocator) void {
    // BASELINE: Should record 1000 storage entries in <5ms
    var journal = RegressionJournal.init(allocator);
    defer journal.deinit();
    
    const snapshot = journal.create_snapshot();
    
    var i: u256 = 0;
    while (i < 1000) : (i += 1) {
        journal.record_storage_change(snapshot, test_address, i, i * 100) catch return;
    }
}

fn regression_shallow_revert_100(allocator: std.mem.Allocator) void {
    // BASELINE: Should revert 100 recent snapshots in <1ms
    var journal = RegressionJournal.init(allocator);
    defer journal.deinit();
    
    // Setup
    var snapshots = [_]u32{0} ** 100;
    var i: usize = 0;
    while (i < 100) : (i += 1) {
        snapshots[i] = journal.create_snapshot();
        journal.record_storage_change(snapshots[i], test_address, i, i * 10) catch continue;
    }
    
    // Benchmark: Revert all snapshots
    i = 99;
    while (i > 0) : (i -= 1) {
        journal.revert_to_snapshot(snapshots[i]);
    }
}

fn regression_deep_revert_5000_entries(allocator: std.mem.Allocator) void {
    // BASELINE: Should revert 5000 entries in <10ms
    var journal = RegressionJournal.init(allocator);
    defer journal.deinit();
    
    // Setup: Create snapshots with many entries
    var snapshots = [_]u32{0} ** 50;
    var i: usize = 0;
    while (i < 50) : (i += 1) {
        snapshots[i] = journal.create_snapshot();
        // 100 entries per snapshot = 5000 total
        var j: usize = 0;
        while (j < 100) : (j += 1) {
            journal.record_storage_change(snapshots[i], test_address, i * 100 + j, (i * 100 + j) * 10) catch continue;
        }
    }
    
    // Benchmark: Deep revert (removes ~4500 entries)
    journal.revert_to_snapshot(snapshots[5]);
}

fn regression_storage_lookup_1000(allocator: std.mem.Allocator) void {
    // BASELINE: Should perform 1000 storage lookups in <2ms
    var journal = RegressionJournal.init(allocator);
    defer journal.deinit();
    
    // Setup: Add entries to search through
    const snapshot = journal.create_snapshot();
    var i: u256 = 0;
    while (i < 1000) : (i += 1) {
        journal.record_storage_change(snapshot, test_address, i, i * 100) catch continue;
    }
    
    // Benchmark: Lookup all entries (worst case: last entry added first)
    i = 0;
    while (i < 1000) : (i += 1) {
        _ = journal.get_original_storage(test_address, i);
    }
}

fn regression_balance_lookup_repeated(allocator: std.mem.Allocator) void {
    // BASELINE: Should perform 1000 balance lookups in <1ms
    var journal = RegressionJournal.init(allocator);
    defer journal.deinit();
    
    const snapshot = journal.create_snapshot();
    journal.record_balance_change(snapshot, test_address, 1000000) catch return;
    
    // Benchmark: Repeated lookups (should be fast due to linear search)
    var i: usize = 0;
    while (i < 1000) : (i += 1) {
        _ = journal.get_original_balance(test_address);
    }
}

fn regression_mixed_operations_realistic(allocator: std.mem.Allocator) void {
    // BASELINE: Realistic EVM transaction pattern should complete in <20ms
    var journal = RegressionJournal.init(allocator);
    defer journal.deinit();
    
    // Simulate realistic transaction with multiple operations
    const tx_snapshot = journal.create_snapshot();
    
    // Transaction setup
    journal.record_balance_change(tx_snapshot, test_address, 1000000) catch return;
    journal.record_nonce_change(tx_snapshot, test_address, 42) catch return;
    
    // 10 contract calls with varying complexity
    var call: usize = 0;
    while (call < 10) : (call += 1) {
        const call_snapshot = journal.create_snapshot();
        
        // Each call makes several state changes
        var changes: usize = 0;
        while (changes < 20) : (changes += 1) {
            journal.record_storage_change(call_snapshot, test_address, call * 100 + changes, (call * 100 + changes) * 10) catch continue;
        }
        
        // Some calls fail (revert)
        if (call % 3 == 2) {
            journal.revert_to_snapshot(call_snapshot);
        }
    }
    
    // Final transaction state
    journal.record_balance_change(tx_snapshot, test_address, 999000) catch return;
    
    // Query final state
    _ = journal.get_original_balance(test_address);
    _ = journal.get_original_storage(test_address, 150);
}

// MEMORY EFFICIENCY REGRESSION TESTS

fn regression_memory_usage_10k_snapshots(allocator: std.mem.Allocator) void {
    // BASELINE: 10k snapshots should not cause excessive memory usage
    var journal = RegressionJournal.init(allocator);
    defer journal.deinit();
    
    var i: u32 = 0;
    while (i < 10000) : (i += 1) {
        _ = journal.create_snapshot();
        
        // Add minimal entry to each snapshot
        if (i % 100 == 0) { // Only every 100th snapshot gets an entry
            journal.record_storage_change(i, test_address, i, i * 10) catch continue;
        }
    }
}

fn regression_capacity_growth_pattern(allocator: std.mem.Allocator) void {
    // BASELINE: Journal should grow capacity efficiently without excessive allocations
    var journal = RegressionJournal.init(allocator);
    defer journal.deinit();
    
    const snapshot = journal.create_snapshot();
    
    // Add entries that will cause capacity growth
    var i: u256 = 0;
    while (i < 2000) : (i += 1) {
        journal.record_storage_change(snapshot, test_address, i, i * 100) catch continue;
    }
    
    // Verify journal can handle the load
    _ = journal.get_original_storage(test_address, 1999);
}

// CONSISTENCY CHECKS (Performance should remain constant regardless of state)

fn regression_consistent_revert_performance(allocator: std.mem.Allocator) void {
    // BASELINE: Revert performance should be O(entries_removed), not O(total_entries)
    var journal = RegressionJournal.init(allocator);
    defer journal.deinit();
    
    // Create background noise (many snapshots with entries)
    var background_snapshots = [_]u32{0} ** 100;
    var i: usize = 0;
    while (i < 100) : (i += 1) {
        background_snapshots[i] = journal.create_snapshot();
        var j: usize = 0;
        while (j < 10) : (j += 1) {
            journal.record_storage_change(background_snapshots[i], test_address, i * 10 + j, (i * 10 + j) * 100) catch continue;
        }
    }
    
    // Target snapshots to revert (recent ones)
    var target_snapshots = [_]u32{0} ** 10;
    i = 0;
    while (i < 10) : (i += 1) {
        target_snapshots[i] = journal.create_snapshot();
        journal.record_storage_change(target_snapshots[i], test_address, 2000 + i, (2000 + i) * 10) catch continue;
    }
    
    // Benchmark: Revert recent snapshots (should be fast despite background entries)
    journal.revert_to_snapshot(target_snapshots[5]);
}

fn regression_lookup_performance_consistency(allocator: std.mem.Allocator) void {
    // BASELINE: Lookup performance should be O(depth), not affected by total journal size
    var journal = RegressionJournal.init(allocator);
    defer journal.deinit();
    
    // Create many entries that won't be looked up
    const noise_snapshot = journal.create_snapshot();
    var i: u256 = 0;
    while (i < 1000) : (i += 1) {
        journal.record_storage_change(noise_snapshot, test_address, i + 10000, i * 1000) catch continue;
    }
    
    // Create target entry
    const target_snapshot = journal.create_snapshot();
    journal.record_storage_change(target_snapshot, test_address, 9999, 123456) catch return;
    
    // Benchmark: Lookup should be fast (linear search stops at first match)
    i = 0;
    while (i < 100) : (i += 1) {
        const result = journal.get_original_storage(test_address, 9999);
        if (result != 123456) break; // Verify correctness
    }
}

// ZBENCH REGISTRATION

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();
    
    try stdout.print("\n=== EVM Journal Performance Regression Tests ===\n");
    try stdout.print("These benchmarks establish performance baselines and detect regressions.\n\n");
    
    // Core operation baselines
    try bench.add("REGRESSION: Snapshot Creation (1000)", regression_snapshot_create_1000, .{});
    try bench.add("REGRESSION: Entry Recording (1000)", regression_single_entry_record_1000, .{});
    try bench.add("REGRESSION: Shallow Revert (100)", regression_shallow_revert_100, .{});
    try bench.add("REGRESSION: Deep Revert (5000 entries)", regression_deep_revert_5000_entries, .{});
    try bench.add("REGRESSION: Storage Lookup (1000)", regression_storage_lookup_1000, .{});
    try bench.add("REGRESSION: Balance Lookup (1000)", regression_balance_lookup_repeated, .{});
    
    // Realistic scenario baseline
    try bench.add("REGRESSION: Realistic Transaction Pattern", regression_mixed_operations_realistic, .{});
    
    // Memory efficiency baselines
    try bench.add("REGRESSION: Memory Usage (10k snapshots)", regression_memory_usage_10k_snapshots, .{});
    try bench.add("REGRESSION: Capacity Growth Pattern", regression_capacity_growth_pattern, .{});
    
    // Performance consistency
    try bench.add("REGRESSION: Consistent Revert Performance", regression_consistent_revert_performance, .{});
    try bench.add("REGRESSION: Lookup Performance Consistency", regression_lookup_performance_consistency, .{});
    
    try bench.run(stdout);
    
    try stdout.print("\n=== Performance Baseline Guidelines ===\n");
    try stdout.print("- Snapshot creation: Should handle 1000+ ops/ms\n");
    try stdout.print("- Entry recording: Should handle 200+ ops/ms\n");
    try stdout.print("- Shallow reverts: Should handle 100+ ops/ms\n");
    try stdout.print("- Deep reverts: Should handle 500+ entries/ms\n");
    try stdout.print("- Storage lookups: Should handle 500+ ops/ms\n");
    try stdout.print("- Balance lookups: Should handle 1000+ ops/ms\n");
    try stdout.print("- Mixed operations: Complete realistic tx in <20ms\n");
    try stdout.print("\nAny significant deviation from these baselines indicates a performance regression.\n");
}