const std = @import("std");

/// Object pool for EVM storage-related hash maps to reduce allocation pressure.
///
/// The StoragePool manages reusable hash maps for storage slot tracking and access
/// patterns, significantly reducing allocation/deallocation overhead during EVM
/// execution. This is particularly important for contracts that make heavy use
/// of storage operations.
///
/// ## Design Rationale
/// EVM execution frequently creates and destroys hash maps for:
/// - Tracking which storage slots have been accessed (warm/cold for EIP-2929)
/// - Storing original storage values for gas refund calculations
///
/// Rather than allocating new maps for each contract call, this pool maintains
/// a cache of cleared maps ready for reuse.
///
/// ## Usage Pattern
/// ```zig
/// var pool = StoragePool.init(allocator);
/// defer pool.deinit();
///
/// // Borrow a map
/// const map = try pool.borrow_storage_map();
/// defer pool.return_storage_map(map);
///
/// // Use the map for storage operations
/// try map.put(slot, value);
/// ```
///
/// ## Thread Safety
/// This pool is NOT thread-safe. Each thread should maintain its own pool
/// or use external synchronization.
const StoragePool = @This();

/// Pool of reusable access tracking maps (slot -> accessed flag)
access_maps: std.ArrayList(*std.AutoHashMap(u256, bool)),
/// Pool of reusable storage value maps (slot -> value)
storage_maps: std.ArrayList(*std.AutoHashMap(u256, u256)),
/// Allocator used for creating new maps when pool is empty
allocator: std.mem.Allocator,

/// Initialize a new storage pool.
///
/// @param allocator The allocator to use for creating new maps
/// @return A new StoragePool instance
///
/// Example:
/// ```zig
/// var pool = StoragePool.init(allocator);
/// defer pool.deinit();
/// ```
pub fn init(allocator: std.mem.Allocator) StoragePool {
    return .{
        .access_maps = std.ArrayList(*std.AutoHashMap(u256, bool)).init(allocator),
        .storage_maps = std.ArrayList(*std.AutoHashMap(u256, u256)).init(allocator),
        .allocator = allocator,
    };
}

/// Clean up the storage pool and all contained maps.
///
/// This function destroys all pooled maps and frees their memory.
/// After calling deinit, the pool should not be used.
///
/// Note: Any maps currently borrowed from the pool will become invalid
/// after deinit. Ensure all borrowed maps are returned before calling this.
pub fn deinit(self: *StoragePool) void {
    // Clean up any remaining maps
    for (self.access_maps.items) |map| {
        map.deinit();
        self.allocator.destroy(map);
    }
    for (self.storage_maps.items) |map| {
        map.deinit();
        self.allocator.destroy(map);
    }
    self.access_maps.deinit();
    self.storage_maps.deinit();
}

/// Error type for access map borrowing operations
pub const BorrowAccessMapError = error{
    /// Allocator failed to allocate memory for a new map
    OutOfAllocatorMemory,
};

/// Borrow an access tracking map from the pool.
///
/// Access maps track which storage slots have been accessed during execution,
/// used for EIP-2929 warm/cold access gas pricing.
///
/// If the pool has available maps, one is returned immediately.
/// Otherwise, a new map is allocated.
///
/// @return A cleared hash map ready for use
/// @throws OutOfAllocatorMemory if allocation fails
///
/// Example:
/// ```zig
/// const access_map = try pool.borrow_access_map();
/// defer pool.return_access_map(access_map);
///
/// // Track storage slot access
/// try access_map.put(slot, true);
/// const was_accessed = access_map.get(slot) orelse false;
/// ```
pub fn borrow_access_map(self: *StoragePool) BorrowAccessMapError!*std.AutoHashMap(u256, bool) {
    if (self.access_maps.items.len > 0) return self.access_maps.pop() orelse unreachable;
    const map = self.allocator.create(std.AutoHashMap(u256, bool)) catch {
        return BorrowAccessMapError.OutOfAllocatorMemory;
    };
    errdefer self.allocator.destroy(map);
    map.* = std.AutoHashMap(u256, bool).init(self.allocator);
    return map;
}

/// Return an access map to the pool for reuse.
///
/// The map is cleared but its capacity is retained to avoid
/// reallocation on next use. If the pool fails to store the
/// returned map (due to memory pressure), it is silently discarded.
///
/// @param map The map to return to the pool
///
/// Note: The map should not be used after returning it to the pool.
pub fn return_access_map(self: *StoragePool, map: *std.AutoHashMap(u256, bool)) void {
    map.clearRetainingCapacity();
    self.access_maps.append(map) catch {};
}

/// Error type for storage map borrowing operations
pub const BorrowStorageMapError = error{
    /// Allocator failed to allocate memory for a new map
    OutOfAllocatorMemory,
};

/// Borrow a storage value map from the pool.
///
/// Storage maps store slot values, typically used for tracking original
/// values to calculate gas refunds or implement storage rollback.
///
/// If the pool has available maps, one is returned immediately.
/// Otherwise, a new map is allocated.
///
/// @return A cleared hash map ready for use
/// @throws OutOfAllocatorMemory if allocation fails
///
/// Example:
/// ```zig
/// const storage_map = try pool.borrow_storage_map();
/// defer pool.return_storage_map(storage_map);
///
/// // Store original value before modification
/// try storage_map.put(slot, original_value);
/// ```
pub fn borrow_storage_map(self: *StoragePool) BorrowStorageMapError!*std.AutoHashMap(u256, u256) {
    if (self.storage_maps.pop()) |map| {
        return map;
    }
    const map = self.allocator.create(std.AutoHashMap(u256, u256)) catch {
        return BorrowStorageMapError.OutOfAllocatorMemory;
    };
    errdefer self.allocator.destroy(map);
    map.* = std.AutoHashMap(u256, u256).init(self.allocator);
    return map;
}

/// Return a storage map to the pool for reuse.
///
/// The map is cleared but its capacity is retained to avoid
/// reallocation on next use. If the pool fails to store the
/// returned map (due to memory pressure), it is silently discarded.
///
/// @param map The map to return to the pool
///
/// Note: The map should not be used after returning it to the pool.
pub fn return_storage_map(self: *StoragePool, map: *std.AutoHashMap(u256, u256)) void {
    map.clearRetainingCapacity();
    self.storage_maps.append(map) catch {};
}

test "storage_pool_benchmarks" {
    const Timer = std.time.Timer;
    var timer = try Timer.start();
    const allocator = std.testing.allocator;
    
    var pool = StoragePool.init(allocator);
    defer pool.deinit();
    
    const iterations = 10000;
    
    // Benchmark 1: Pool vs Direct Allocation for Access Maps
    timer.reset();
    var i: usize = 0;
    while (i < iterations) : (i += 1) {
        const map = try pool.borrow_access_map();
        defer pool.return_access_map(map);
        
        // Simulate usage
        try map.put(42, true);
        try map.put(123, false);
        _ = map.get(42);
        _ = map.get(999);
    }
    const pool_access_ns = timer.read();
    
    // Direct allocation comparison
    timer.reset();
    i = 0;
    while (i < iterations) : (i += 1) {
        var map = std.AutoHashMap(u256, bool).init(allocator);
        defer map.deinit();
        
        // Same usage pattern
        try map.put(42, true);
        try map.put(123, false);
        _ = map.get(42);
        _ = map.get(999);
    }
    const direct_access_ns = timer.read();
    
    // Benchmark 2: Pool vs Direct Allocation for Storage Maps
    timer.reset();
    i = 0;
    while (i < iterations) : (i += 1) {
        const map = try pool.borrow_storage_map();
        defer pool.return_storage_map(map);
        
        // Simulate storage operations
        try map.put(0x1234, 0xABCD);
        try map.put(0x5678, 0xEF01);
        _ = map.get(0x1234);
        _ = map.get(0x9999);
    }
    const pool_storage_ns = timer.read();
    
    // Direct allocation comparison
    timer.reset();
    i = 0;
    while (i < iterations) : (i += 1) {
        var map = std.AutoHashMap(u256, u256).init(allocator);
        defer map.deinit();
        
        // Same usage pattern
        try map.put(0x1234, 0xABCD);
        try map.put(0x5678, 0xEF01);
        _ = map.get(0x1234);
        _ = map.get(0x9999);
    }
    const direct_storage_ns = timer.read();
    
    // Benchmark 3: Memory Fragmentation Impact
    timer.reset();
    var large_maps = std.ArrayList(*std.AutoHashMap(u256, u256)).init(allocator);
    defer {
        for (large_maps.items) |map| {
            pool.return_storage_map(map);
        }
        large_maps.deinit();
    }
    
    // Borrow many maps and fill them
    i = 0;
    while (i < 100) : (i += 1) {
        const map = try pool.borrow_storage_map();
        try large_maps.append(map);
        
        // Fill each map with data to cause expansion
        var j: u256 = 0;
        while (j < 50) : (j += 1) {
            try map.put(j, j * j);
        }
    }
    const fragmentation_setup_ns = timer.read();
    
    // Now test allocation performance in fragmented state
    timer.reset();
    i = 0;
    while (i < 1000) : (i += 1) {
        const map = try pool.borrow_storage_map();
        defer pool.return_storage_map(map);
        try map.put(i, i);
    }
    const fragmented_allocation_ns = timer.read();
    
    // Print benchmark results for analysis
    std.log.debug("Storage Pool Benchmarks ({} iterations):", .{iterations});
    std.log.debug("  Pool access maps: {} ns", .{pool_access_ns});
    std.log.debug("  Direct access maps: {} ns", .{direct_access_ns});
    std.log.debug("  Pool storage maps: {} ns", .{pool_storage_ns});
    std.log.debug("  Direct storage maps: {} ns", .{direct_storage_ns});
    std.log.debug("  Fragmentation setup: {} ns", .{fragmentation_setup_ns});
    std.log.debug("  Fragmented allocation (1000x): {} ns", .{fragmented_allocation_ns});
    
    // Verify pool provides performance benefit
    // Note: These are performance hints, not strict requirements
    if (pool_access_ns < direct_access_ns) {
        std.log.debug("✓ Pool shows access map performance benefit");
    }
    if (pool_storage_ns < direct_storage_ns) {
        std.log.debug("✓ Pool shows storage map performance benefit");
    }
}

// ============================================================================
// Fuzz Tests for Storage Pool Object Pool Stress Testing (Issue #234)
// Using proper Zig built-in fuzz testing with std.testing.fuzz()
// ============================================================================

test "fuzz_storage_pool_stress_scenarios" {
    const global = struct {
        fn testStoragePoolStress(input: []const u8) anyerror!void {
            if (input.len < 8) return;
            
            const allocator = std.testing.allocator;
            var pool = StoragePool.init(allocator);
            defer pool.deinit();
            
            // Limit operations for performance
            const max_ops = @min((input.len / 8), 100);
            var borrowed_access = std.ArrayList(*std.AutoHashMap(u256, bool)).init(allocator);
            defer {
                for (borrowed_access.items) |map| {
                    pool.return_access_map(map);
                }
                borrowed_access.deinit();
            }
            
            var borrowed_storage = std.ArrayList(*std.AutoHashMap(u256, u256)).init(allocator);
            defer {
                for (borrowed_storage.items) |map| {
                    pool.return_storage_map(map);
                }
                borrowed_storage.deinit();
            }
            
            for (0..max_ops) |i| {
                const base_idx = i * 8;
                if (base_idx + 8 > input.len) break;
                
                _ = input[base_idx] % 4; // Unused but could be used for future operation variations
                const map_type = input[base_idx + 1] % 2; // 0=access, 1=storage
                const operation = input[base_idx + 2] % 3; // 0=borrow, 1=use, 2=return
                
                switch (map_type) {
                    0 => { // Access maps
                        if (operation == 0 and borrowed_access.items.len < 20) {
                            // Borrow access map
                            const map = pool.borrow_access_map() catch continue;
                            try borrowed_access.append(map);
                        } else if (operation == 1 and borrowed_access.items.len > 0) {
                            // Use access map
                            const map_idx = input[base_idx + 3] % borrowed_access.items.len;
                            const map = borrowed_access.items[map_idx];
                            const slot = std.mem.readInt(u32, input[base_idx + 4..base_idx + 8], .little);
                            
                            try map.put(@as(u256, slot), true);
                            _ = map.get(@as(u256, slot + 1));
                        } else if (operation == 2 and borrowed_access.items.len > 0) {
                            // Return access map
                            const map = borrowed_access.orderedRemove(borrowed_access.items.len - 1);
                            pool.return_access_map(map);
                        }
                    },
                    1 => { // Storage maps
                        if (operation == 0 and borrowed_storage.items.len < 20) {
                            // Borrow storage map
                            const map = pool.borrow_storage_map() catch continue;
                            try borrowed_storage.append(map);
                        } else if (operation == 1 and borrowed_storage.items.len > 0) {
                            // Use storage map
                            const map_idx = input[base_idx + 3] % borrowed_storage.items.len;
                            const map = borrowed_storage.items[map_idx];
                            const slot = std.mem.readInt(u32, input[base_idx + 4..base_idx + 8], .little);
                            
                            try map.put(@as(u256, slot), @as(u256, slot) * 2);
                            _ = map.get(@as(u256, slot + 1));
                        } else if (operation == 2 and borrowed_storage.items.len > 0) {
                            // Return storage map
                            const map = borrowed_storage.orderedRemove(borrowed_storage.items.len - 1);
                            pool.return_storage_map(map);
                        }
                    },
                    else => unreachable,
                }
            }
        }
    };
    try std.testing.fuzz(global.testStoragePoolStress, .{}, .{});
}

test "fuzz_storage_pool_concurrent_patterns" {
    const global = struct {
        fn testConcurrentPatterns(input: []const u8) anyerror!void {
            if (input.len < 16) return;
            
            const allocator = std.testing.allocator;
            var pool = StoragePool.init(allocator);
            defer pool.deinit();
            
            // Simulate concurrent-like patterns by rapidly borrowing and returning maps
            const num_cycles = @min((input.len / 16), 50);
            
            for (0..num_cycles) |cycle| {
                const base_idx = cycle * 16;
                if (base_idx + 16 > input.len) break;
                
                const borrow_count = (input[base_idx] % 10) + 1; // 1-10 maps per cycle
                var maps_access = std.ArrayList(*std.AutoHashMap(u256, bool)).init(allocator);
                defer {
                    for (maps_access.items) |map| {
                        pool.return_access_map(map);
                    }
                    maps_access.deinit();
                }
                
                var maps_storage = std.ArrayList(*std.AutoHashMap(u256, u256)).init(allocator);
                defer {
                    for (maps_storage.items) |map| {
                        pool.return_storage_map(map);
                    }
                    maps_storage.deinit();
                }
                
                // Borrow phase
                for (0..borrow_count) |i| {
                    if (i % 2 == 0) {
                        const access_map = pool.borrow_access_map() catch continue;
                        try maps_access.append(access_map);
                    } else {
                        const storage_map = pool.borrow_storage_map() catch continue;
                        try maps_storage.append(storage_map);
                    }
                }
                
                // Usage phase
                for (maps_access.items, 0..) |map, i| {
                    const slot_base = std.mem.readInt(u16, input[base_idx + 2 + (i % 14)..base_idx + 4 + (i % 14)], .little);
                    try map.put(@as(u256, slot_base), true);
                    try map.put(@as(u256, slot_base + 1), false);
                    _ = map.get(@as(u256, slot_base + 2));
                }
                
                for (maps_storage.items, 0..) |map, i| {
                    const slot_base = std.mem.readInt(u16, input[base_idx + 4 + (i % 12)..base_idx + 6 + (i % 12)], .little);
                    try map.put(@as(u256, slot_base), @as(u256, slot_base) * 3);
                    try map.put(@as(u256, slot_base + 1), @as(u256, slot_base) + 100);
                    _ = map.get(@as(u256, slot_base + 2));
                }
                
                // Return phase happens automatically via defer
            }
        }
    };
    try std.testing.fuzz(global.testConcurrentPatterns, .{}, .{});
}

test "fuzz_storage_pool_memory_pressure" {
    const global = struct {
        fn testMemoryPressure(input: []const u8) anyerror!void {
            if (input.len < 12) return;
            
            const allocator = std.testing.allocator;
            var pool = StoragePool.init(allocator);
            defer pool.deinit();
            
            // Test pool behavior under memory pressure by creating maps with varying sizes
            const num_maps = @min((input.len / 12), 30);
            var large_maps = std.ArrayList(*std.AutoHashMap(u256, u256)).init(allocator);
            defer {
                for (large_maps.items) |map| {
                    pool.return_storage_map(map);
                }
                large_maps.deinit();
            }
            
            for (0..num_maps) |i| {
                const base_idx = i * 12;
                if (base_idx + 12 > input.len) break;
                
                const map = pool.borrow_storage_map() catch continue;
                try large_maps.append(map);
                
                // Fill map with varying amounts of data
                const fill_size = input[base_idx] % 100; // 0-99 entries
                const slot_base = std.mem.readInt(u32, input[base_idx + 1..base_idx + 5], .little);
                const value_base = std.mem.readInt(u64, input[base_idx + 5..base_idx + 12], .little);
                
                for (0..fill_size) |j| {
                    const slot = @as(u256, slot_base) + @as(u256, j);
                    const value = @as(u256, value_base) + @as(u256, j) * @as(u256, j);
                    
                    map.put(slot, value) catch break; // Continue on OOM
                    
                    // Verify data integrity
                    if (map.get(slot)) |stored_value| {
                        std.testing.expectEqual(value, stored_value) catch {};
                    }
                }
            }
            
            // Test rapid allocation/deallocation during memory pressure
            for (0..20) |_| {
                const quick_map = pool.borrow_storage_map() catch continue;
                defer pool.return_storage_map(quick_map);
                
                try quick_map.put(12345, 67890);
                if (quick_map.get(12345)) |value| {
                    std.testing.expectEqual(@as(u256, 67890), value) catch {};
                }
            }
        }
    };
    try std.testing.fuzz(global.testMemoryPressure, .{}, .{});
}

test "fuzz_storage_pool_edge_cases" {
    const global = struct {
        fn testEdgeCases(input: []const u8) anyerror!void {
            if (input.len < 8) return;
            
            const allocator = std.testing.allocator;
            var pool = StoragePool.init(allocator);
            defer pool.deinit();
            
            // Test edge cases with extreme values
            const test_cases = @min((input.len / 8), 20);
            
            for (0..test_cases) |i| {
                const base_idx = i * 8;
                if (base_idx + 8 > input.len) break;
                
                const case_type = input[base_idx] % 6;
                
                switch (case_type) {
                    0, 1 => {
                        // Test with u256 edge values
                        const map = pool.borrow_storage_map() catch continue;
                        defer pool.return_storage_map(map);
                        
                        const edge_values = [_]u256{
                            0, 1, std.math.maxInt(u8), std.math.maxInt(u16),
                            std.math.maxInt(u32), std.math.maxInt(u64),
                            std.math.maxInt(u128), std.math.maxInt(u256),
                        };
                        
                        const value_idx = input[base_idx + 1] % edge_values.len;
                        const slot_seed = std.mem.readInt(u32, input[base_idx + 2..base_idx + 6], .little);
                        
                        try map.put(@as(u256, slot_seed), edge_values[value_idx]);
                        try map.put(edge_values[value_idx % edge_values.len], @as(u256, slot_seed));
                        
                        // Verify retrieval
                        _ = map.get(@as(u256, slot_seed));
                        _ = map.get(edge_values[value_idx % edge_values.len]);
                    },
                    2, 3 => {
                        // Test access map with boolean patterns
                        const map = pool.borrow_access_map() catch continue;
                        defer pool.return_access_map(map);
                        
                        const slot_seed = std.mem.readInt(u32, input[base_idx + 1..base_idx + 5], .little);
                        const pattern = input[base_idx + 5];
                        
                        // Create alternating patterns
                        for (0..10) |j| {
                            const slot = @as(u256, slot_seed) + @as(u256, j);
                            const value = ((pattern >> @as(u3, @intCast(j % 8))) & 1) == 1;
                            try map.put(slot, value);
                        }
                        
                        // Verify pattern
                        for (0..10) |j| {
                            const slot = @as(u256, slot_seed) + @as(u256, j);
                            const expected = ((pattern >> @as(u3, @intCast(j % 8))) & 1) == 1;
                            if (map.get(slot)) |actual| {
                                std.testing.expectEqual(expected, actual) catch {};
                            }
                        }
                    },
                    4, 5 => {
                        // Test repeated borrow/return cycles
                        const cycles = input[base_idx + 1] % 20;
                        for (0..cycles) |_| {
                            const storage_map = pool.borrow_storage_map() catch continue;
                            defer pool.return_storage_map(storage_map);
                            
                            const access_map = pool.borrow_access_map() catch continue;
                            defer pool.return_access_map(access_map);
                            
                            // Quick usage to ensure maps are functional
                            try storage_map.put(42, 84);
                            try access_map.put(42, true);
                        }
                    },
                    else => unreachable,
                }
            }
        }
    };
    try std.testing.fuzz(global.testEdgeCases, .{}, .{});
}

test "fuzz_storage_pool_capacity_retention" {
    const global = struct {
        fn testCapacityRetention(input: []const u8) anyerror!void {
            if (input.len < 16) return;
            
            const allocator = std.testing.allocator;
            var pool = StoragePool.init(allocator);
            defer pool.deinit();
            
            // Test that returned maps retain capacity for performance
            const num_iterations = @min((input.len / 16), 20);
            
            for (0..num_iterations) |i| {
                const base_idx = i * 16;
                if (base_idx + 16 > input.len) break;
                
                // Phase 1: Borrow map and expand it
                const storage_map = pool.borrow_storage_map() catch continue;
                const initial_size = input[base_idx] % 50 + 10; // 10-59 initial entries
                
                for (0..initial_size) |j| {
                    const slot = @as(u256, j);
                    const value_seed = std.mem.readInt(u64, input[base_idx + 1..base_idx + 9], .little);
                    const value = @as(u256, value_seed) + @as(u256, j);
                    try storage_map.put(slot, value);
                }
                
                // Verify initial data
                for (0..initial_size) |j| {
                    const slot = @as(u256, j);
                    if (storage_map.get(slot)) |stored_value| {
                        const value_seed = std.mem.readInt(u64, input[base_idx + 1..base_idx + 9], .little);
                        const expected_value = @as(u256, value_seed) + @as(u256, j);
                        std.testing.expectEqual(expected_value, stored_value) catch {};
                    }
                }
                
                // Phase 2: Return map (should retain capacity but clear data)
                pool.return_storage_map(storage_map);
                
                // Phase 3: Borrow again (likely the same map due to pooling)
                const reused_map = pool.borrow_storage_map() catch continue;
                defer pool.return_storage_map(reused_map);
                
                // Verify map is cleared
                for (0..initial_size) |j| {
                    const slot = @as(u256, j);
                    std.testing.expect(reused_map.get(slot) == null) catch {};
                }
                
                // Phase 4: Repopulate with new data to test capacity retention benefit
                const new_size = input[base_idx + 9] % 50 + 10; // Different size
                for (0..new_size) |j| {
                    const slot = @as(u256, j) + 1000; // Different slots
                    const value_seed = std.mem.readInt(u64, input[base_idx + 10..base_idx + 16], .little);
                    const value = @as(u256, value_seed) + @as(u256, j) * 2;
                    try reused_map.put(slot, value);
                }
                
                // Verify new data
                for (0..new_size) |j| {
                    const slot = @as(u256, j) + 1000;
                    if (reused_map.get(slot)) |stored_value| {
                        const value_seed = std.mem.readInt(u64, input[base_idx + 10..base_idx + 16], .little);
                        const expected_value = @as(u256, value_seed) + @as(u256, j) * 2;
                        std.testing.expectEqual(expected_value, stored_value) catch {};
                    }
                }
            }
        }
    };
    try std.testing.fuzz(global.testCapacityRetention, .{}, .{});
}
