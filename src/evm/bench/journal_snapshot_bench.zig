const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const Journal = @import("../journal.zig").Journal;
const JournalConfig = @import("../journal_config.zig").JournalConfig;

// Performance-focused journal configurations for benchmarking
const FastJournal = Journal(.{
    .SnapshotIdType = u32,
    .WordType = u256,
    .NonceType = u64,
    .initial_capacity = 1024,
});

const CompactJournal = Journal(.{
    .SnapshotIdType = u16,
    .WordType = u128,
    .NonceType = u32,
    .initial_capacity = 256,
});

// Test data for benchmarks
const benchmark_addresses = [_][20]u8{
    [_]u8{0x01} ** 20,
    [_]u8{0x02} ** 20,
    [_]u8{0x03} ** 20,
    [_]u8{0x04} ** 20,
    [_]u8{0x05} ** 20,
    [_]u8{0x06} ** 20,
    [_]u8{0x07} ** 20,
    [_]u8{0x08} ** 20,
};

// CORE SNAPSHOT OPERATIONS BENCHMARKS

fn benchmark_snapshot_create(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    // Benchmark: Create 1000 snapshots
    var i: u32 = 0;
    while (i < 1000) : (i += 1) {
        _ = journal.create_snapshot();
    }
}

fn benchmark_snapshot_create_with_entries(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    // Benchmark: Create snapshots with entries (realistic scenario)
    var i: u32 = 0;
    while (i < 100) : (i += 1) {
        const snapshot = journal.create_snapshot();
        
        // Add some entries per snapshot (simulates real EVM execution)
        journal.record_storage_change(snapshot, benchmark_addresses[0], i, i * 100) catch continue;
        journal.record_balance_change(snapshot, benchmark_addresses[1], i * 1000) catch continue;
        journal.record_nonce_change(snapshot, benchmark_addresses[2], i) catch continue;
    }
}

fn benchmark_snapshot_revert_shallow(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    // Setup: Create snapshots with entries
    var snapshots = [_]u32{0} ** 10;
    var i: usize = 0;
    while (i < 10) : (i += 1) {
        snapshots[i] = journal.create_snapshot();
        journal.record_storage_change(snapshots[i], benchmark_addresses[i % benchmark_addresses.len], i, i * 10) catch continue;
    }
    
    // Benchmark: Revert to recent snapshots (minimal work)
    i = 9;
    while (i > 0) : (i -= 1) {
        journal.revert_to_snapshot(snapshots[i]);
    }
}

fn benchmark_snapshot_revert_deep(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    // Setup: Create deep snapshot chain with many entries
    var snapshots = [_]u32{0} ** 50;
    var i: usize = 0;
    while (i < 50) : (i += 1) {
        snapshots[i] = journal.create_snapshot();
        // Add multiple entries per snapshot
        var j: usize = 0;
        while (j < 10) : (j += 1) {
            journal.record_storage_change(snapshots[i], benchmark_addresses[j % benchmark_addresses.len], i * 10 + j, (i * 10 + j) * 100) catch continue;
        }
    }
    
    // Benchmark: Deep revert (removes many entries)
    journal.revert_to_snapshot(snapshots[10]); // Revert 40 snapshots worth of entries
}

// ENTRY TYPE SPECIFIC BENCHMARKS

fn benchmark_record_storage_changes(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    const snapshot = journal.create_snapshot();
    
    // Benchmark: Record 1000 storage changes
    var i: u256 = 0;
    while (i < 1000) : (i += 1) {
        journal.record_storage_change(snapshot, benchmark_addresses[i % benchmark_addresses.len], i, i * 100) catch continue;
    }
}

fn benchmark_record_mixed_entries(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    const snapshot = journal.create_snapshot();
    
    // Benchmark: Record mixed entry types (realistic EVM scenario)
    var i: u64 = 0;
    while (i < 500) : (i += 1) {
        const addr_idx = i % benchmark_addresses.len;
        switch (i % 6) {
            0 => journal.record_storage_change(snapshot, benchmark_addresses[addr_idx], i, i * 10) catch continue,
            1 => journal.record_balance_change(snapshot, benchmark_addresses[addr_idx], i * 1000) catch continue,
            2 => journal.record_nonce_change(snapshot, benchmark_addresses[addr_idx], i) catch continue,
            3 => journal.record_code_change(snapshot, benchmark_addresses[addr_idx], [_]u8{@intCast(i)} ** 32) catch continue,
            4 => journal.record_account_created(snapshot, benchmark_addresses[addr_idx]) catch continue,
            5 => journal.record_account_destroyed(snapshot, benchmark_addresses[addr_idx], benchmark_addresses[(addr_idx + 1) % benchmark_addresses.len], i * 500) catch continue,
        }
    }
}

// QUERY OPERATION BENCHMARKS

fn benchmark_get_original_storage(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    // Setup: Create entries to search through
    const snapshot = journal.create_snapshot();
    var i: u256 = 0;
    while (i < 1000) : (i += 1) {
        journal.record_storage_change(snapshot, benchmark_addresses[i % benchmark_addresses.len], i, i * 100) catch continue;
    }
    
    // Benchmark: Query original storage values
    i = 0;
    while (i < 1000) : (i += 1) {
        const addr_idx = i % benchmark_addresses.len;
        _ = journal.get_original_storage(benchmark_addresses[addr_idx], i);
    }
}

fn benchmark_get_original_balance(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    // Setup: Create balance entries
    const snapshot = journal.create_snapshot();
    for (benchmark_addresses, 0..) |addr, i| {
        journal.record_balance_change(snapshot, addr, i * 1000) catch continue;
    }
    
    // Benchmark: Query original balance values
    var i: usize = 0;
    while (i < 1000) : (i += 1) {
        const addr_idx = i % benchmark_addresses.len;
        _ = journal.get_original_balance(benchmark_addresses[addr_idx]);
    }
}

// REALISTIC EVM EXECUTION PATTERN BENCHMARKS

fn benchmark_nested_call_pattern(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    // Simulate nested EVM calls with snapshots
    var call_depth: usize = 0;
    var snapshots = [_]u32{0} ** 10;
    
    // Benchmark: 5 levels of nested calls
    while (call_depth < 5) : (call_depth += 1) {
        snapshots[call_depth] = journal.create_snapshot();
        
        // Each call level makes some state changes
        var changes: usize = 0;
        while (changes < 10) : (changes += 1) {
            journal.record_storage_change(snapshots[call_depth], benchmark_addresses[changes % benchmark_addresses.len], call_depth * 100 + changes, (call_depth * 100 + changes) * 10) catch continue;
        }
    }
    
    // Some calls succeed, others fail (realistic pattern)
    // Call at depth 4 fails
    journal.revert_to_snapshot(snapshots[4]);
    // Call at depth 2 fails  
    journal.revert_to_snapshot(snapshots[2]);
}

fn benchmark_transaction_simulation(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    // Simulate a complex transaction with multiple operations
    const tx_snapshot = journal.create_snapshot();
    
    // Initial state changes
    journal.record_balance_change(tx_snapshot, benchmark_addresses[0], 1000000) catch return;
    journal.record_nonce_change(tx_snapshot, benchmark_addresses[0], 42) catch return;
    
    // Contract call 1
    const call1_snapshot = journal.create_snapshot();
    var i: usize = 0;
    while (i < 20) : (i += 1) {
        journal.record_storage_change(call1_snapshot, benchmark_addresses[1], i, i * 100) catch continue;
    }
    
    // Contract call 2 (nested)
    const call2_snapshot = journal.create_snapshot();
    i = 0;
    while (i < 15) : (i += 1) {
        journal.record_storage_change(call2_snapshot, benchmark_addresses[2], i + 100, i * 200) catch continue;
    }
    
    // Call 2 succeeds, call 1 fails
    journal.revert_to_snapshot(call1_snapshot);
    
    // Final transaction changes
    journal.record_balance_change(tx_snapshot, benchmark_addresses[0], 999000) catch return;
}

// MEMORY USAGE AND SCALABILITY BENCHMARKS

fn benchmark_large_journal_operations(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    // Create a large journal with many snapshots and entries
    var snapshots = std.ArrayList(u32).init(allocator);
    defer snapshots.deinit();
    
    var snapshot_count: usize = 0;
    while (snapshot_count < 100) : (snapshot_count += 1) {
        const snapshot = journal.create_snapshot();
        snapshots.append(snapshot) catch continue;
        
        // Add many entries per snapshot
        var entry_count: usize = 0;
        while (entry_count < 50) : (entry_count += 1) {
            journal.record_storage_change(snapshot, benchmark_addresses[entry_count % benchmark_addresses.len], snapshot_count * 100 + entry_count, (snapshot_count * 100 + entry_count) * 10) catch continue;
        }
    }
    
    // Benchmark: Operations on large journal
    // Revert to middle snapshot (removes ~2500 entries)
    if (snapshots.items.len > 50) {
        journal.revert_to_snapshot(snapshots.items[50]);
    }
}

fn benchmark_frequent_snapshot_cycling(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    // Simulate frequent snapshot create/revert cycles
    var cycle: usize = 0;
    while (cycle < 200) : (cycle += 1) {
        const snapshot = journal.create_snapshot();
        
        // Add a few entries
        journal.record_storage_change(snapshot, benchmark_addresses[cycle % benchmark_addresses.len], cycle, cycle * 10) catch continue;
        journal.record_balance_change(snapshot, benchmark_addresses[(cycle + 1) % benchmark_addresses.len], cycle * 100) catch continue;
        
        // Revert every other snapshot (simulate failed calls)
        if (cycle % 2 == 1) {
            journal.revert_to_snapshot(snapshot);
        }
    }
}

// CONFIGURATION COMPARISON BENCHMARKS

fn benchmark_compact_journal_operations(allocator: std.mem.Allocator) void {
    var journal = CompactJournal.init(allocator);
    defer journal.deinit();
    
    // Test compact configuration performance
    const snapshot = journal.create_snapshot();
    
    var i: u32 = 0;
    while (i < 500) : (i += 1) {
        // Use smaller types (u128 instead of u256)
        journal.record_storage_change(snapshot, benchmark_addresses[i % benchmark_addresses.len], i, i * 10) catch continue;
        journal.record_balance_change(snapshot, benchmark_addresses[(i + 1) % benchmark_addresses.len], i * 100) catch continue;
    }
    
    // Query operations
    i = 0;
    while (i < 500) : (i += 1) {
        _ = journal.get_original_storage(benchmark_addresses[i % benchmark_addresses.len], i);
    }
}

// PERFORMANCE REGRESSION BENCHMARKS

fn benchmark_snapshot_memory_overhead(allocator: std.mem.Allocator) void {
    var journal = FastJournal.init(allocator);
    defer journal.deinit();
    
    // Measure memory efficiency by creating many snapshots
    var snapshots = [_]u32{0} ** 1000;
    
    // Create snapshots without entries (minimal memory per snapshot)
    var i: usize = 0;
    while (i < 1000) : (i += 1) {
        snapshots[i] = journal.create_snapshot();
    }
    
    // Add one entry to each (measure entry overhead)
    i = 0;
    while (i < 1000) : (i += 1) {
        journal.record_storage_change(snapshots[i], benchmark_addresses[i % benchmark_addresses.len], i, i * 10) catch continue;
    }
}

// ZBENCH REGISTRATION

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();
    
    // Core snapshot operations
    try bench.add("Snapshot Creation", benchmark_snapshot_create, .{});
    try bench.add("Snapshot Creation with Entries", benchmark_snapshot_create_with_entries, .{});
    try bench.add("Shallow Snapshot Revert", benchmark_snapshot_revert_shallow, .{});
    try bench.add("Deep Snapshot Revert", benchmark_snapshot_revert_deep, .{});
    
    // Entry operations
    try bench.add("Record Storage Changes", benchmark_record_storage_changes, .{});
    try bench.add("Record Mixed Entry Types", benchmark_record_mixed_entries, .{});
    
    // Query operations  
    try bench.add("Get Original Storage", benchmark_get_original_storage, .{});
    try bench.add("Get Original Balance", benchmark_get_original_balance, .{});
    
    // Realistic patterns
    try bench.add("Nested Call Pattern", benchmark_nested_call_pattern, .{});
    try bench.add("Transaction Simulation", benchmark_transaction_simulation, .{});
    
    // Scalability
    try bench.add("Large Journal Operations", benchmark_large_journal_operations, .{});
    try bench.add("Frequent Snapshot Cycling", benchmark_frequent_snapshot_cycling, .{});
    
    // Configuration comparison
    try bench.add("Compact Journal Operations", benchmark_compact_journal_operations, .{});
    
    // Performance regression
    try bench.add("Snapshot Memory Overhead", benchmark_snapshot_memory_overhead, .{});
    
    try stdout.print("\n=== EVM Journal Snapshot Management Benchmarks ===\n\n");
    try bench.run(stdout);
}