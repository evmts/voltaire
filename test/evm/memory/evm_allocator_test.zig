const std = @import("std");
const evm = @import("evm");
const EvmMemoryAllocator = evm.memory.EvmMemoryAllocator;

test "EvmMemoryAllocator concurrent allocations" {
    const allocator = std.testing.allocator;
    
    var evm_allocator = try EvmMemoryAllocator.init(allocator);
    defer evm_allocator.deinit();
    
    const evm_alloc = evm_allocator.allocator();
    
    // Simulate multiple allocations like in EVM execution
    var allocations = std.ArrayList([]u8).init(allocator);
    defer allocations.deinit();
    
    // Allocate various sizes
    const sizes = [_]usize{ 32, 64, 128, 256, 512, 1024, 2048, 4096 };
    for (sizes) |size| {
        const mem = try evm_alloc.alloc(u8, size);
        try allocations.append(mem);
        
        // Write pattern to verify integrity
        for (mem, 0..) |*byte, i| {
            byte.* = @as(u8, @truncate(i % 256));
        }
    }
    
    // Verify all allocations are intact
    for (allocations.items, sizes[0..allocations.items.len]) |mem, expected_size| {
        try std.testing.expectEqual(expected_size, mem.len);
        
        // Verify pattern
        for (mem, 0..) |byte, i| {
            try std.testing.expectEqual(@as(u8, @truncate(i % 256)), byte);
        }
    }
}

test "EvmMemoryAllocator stress test with large allocations" {
    const allocator = std.testing.allocator;
    
    var evm_allocator = try EvmMemoryAllocator.init(allocator);
    defer evm_allocator.deinit();
    
    // Test large allocation that triggers multiple doublings
    const large_size = 1024 * 1024; // 1MB
    try evm_allocator.grow(large_size);
    
    try std.testing.expect(evm_allocator.capacity >= large_size);
    try std.testing.expectEqual(large_size, evm_allocator.allocated_size);
    
    // Verify memory is accessible
    const memory = evm_allocator.getMemory();
    memory[0] = 0xAA;
    memory[large_size - 1] = 0xBB;
    
    try std.testing.expectEqual(@as(u8, 0xAA), memory[0]);
    try std.testing.expectEqual(@as(u8, 0xBB), memory[large_size - 1]);
}

test "EvmMemoryAllocator alignment requirements" {
    const allocator = std.testing.allocator;
    
    var evm_allocator = try EvmMemoryAllocator.init(allocator);
    defer evm_allocator.deinit();
    
    const evm_alloc = evm_allocator.allocator();
    
    // Test various alignment requirements
    const alignments = [_]usize{ 1, 2, 4, 8, 16, 32, 64, 128 };
    
    for (alignments) |alignment| {
        const mem = try evm_alloc.alignedAlloc(u8, alignment, 100);
        const addr = @intFromPtr(mem.ptr);
        try std.testing.expectEqual(@as(usize, 0), addr % alignment);
    }
}

test "EvmMemoryAllocator memory reuse after reset" {
    const allocator = std.testing.allocator;
    
    var evm_allocator = try EvmMemoryAllocator.init(allocator);
    defer evm_allocator.deinit();
    
    const evm_alloc = evm_allocator.allocator();
    
    // First contract execution
    {
        const mem1 = try evm_alloc.alloc(u8, 1000);
        @memset(mem1, 0x11);
        
        const mem2 = try evm_alloc.alloc(u8, 2000);
        @memset(mem2, 0x22);
        
        try std.testing.expect(evm_allocator.allocated_size >= 3000);
    }
    
    // Reset for new contract
    evm_allocator.reset();
    
    // Second contract execution
    {
        const mem1 = try evm_alloc.alloc(u8, 500);
        // Verify memory was cleared
        for (mem1) |byte| {
            try std.testing.expectEqual(@as(u8, 0), byte);
        }
        
        @memset(mem1, 0x33);
        
        const mem2 = try evm_alloc.alloc(u8, 1500);
        for (mem2) |byte| {
            try std.testing.expectEqual(@as(u8, 0), byte);
        }
    }
}

test "EvmMemoryAllocator with different parent allocators" {
    // Test with page allocator
    {
        var evm_allocator = try EvmMemoryAllocator.init(std.heap.page_allocator);
        defer evm_allocator.deinit();
        
        const evm_alloc = evm_allocator.allocator();
        const mem = try evm_alloc.alloc(u8, 1024);
        try std.testing.expectEqual(@as(usize, 1024), mem.len);
    }
    
    // Test with GeneralPurposeAllocator
    {
        var gpa = std.heap.GeneralPurposeAllocator(.{}){};
        defer _ = gpa.deinit();
        
        var evm_allocator = try EvmMemoryAllocator.init(gpa.allocator());
        defer evm_allocator.deinit();
        
        const evm_alloc = evm_allocator.allocator();
        const mem = try evm_alloc.alloc(u8, 2048);
        try std.testing.expectEqual(@as(usize, 2048), mem.len);
    }
}

test "EvmMemoryAllocator growth boundary conditions" {
    const allocator = std.testing.allocator;
    
    var evm_allocator = try EvmMemoryAllocator.init(allocator);
    defer evm_allocator.deinit();
    
    const initial_capacity = evm_allocator.capacity;
    
    // Test exact capacity allocation (no growth needed)
    try evm_allocator.grow(initial_capacity);
    try std.testing.expectEqual(initial_capacity, evm_allocator.capacity);
    
    // Test one byte over capacity (triggers growth)
    try evm_allocator.grow(initial_capacity + 1);
    try std.testing.expect(evm_allocator.capacity > initial_capacity);
    
    // With doubling strategy, should be double
    try std.testing.expectEqual(initial_capacity * 2, evm_allocator.capacity);
}

test "EvmMemoryAllocator data preservation during growth" {
    const allocator = std.testing.allocator;
    
    var evm_allocator = try EvmMemoryAllocator.init(allocator);
    defer evm_allocator.deinit();
    
    // Write pattern to initial memory
    const pattern_size = 1024;
    try evm_allocator.grow(pattern_size);
    
    const memory = evm_allocator.getMemory();
    for (memory, 0..) |*byte, i| {
        byte.* = @as(u8, @truncate(i % 251)); // Prime number for better pattern
    }
    
    // Force multiple growths
    const growth_sizes = [_]usize{ 2048, 8192, 32768, 131072 };
    for (growth_sizes) |new_size| {
        try evm_allocator.grow(new_size);
        
        // Verify original pattern is preserved
        const grown_memory = evm_allocator.getMemory();
        for (grown_memory[0..pattern_size], 0..) |byte, i| {
            try std.testing.expectEqual(@as(u8, @truncate(i % 251)), byte);
        }
    }
}

test "EvmMemoryAllocator as drop-in replacement" {
    const allocator = std.testing.allocator;
    
    var evm_allocator = try EvmMemoryAllocator.init(allocator);
    defer evm_allocator.deinit();
    
    const evm_alloc = evm_allocator.allocator();
    
    // Test common allocation patterns
    var list = std.ArrayList(u32).init(evm_alloc);
    defer list.deinit();
    
    try list.append(42);
    try list.append(123);
    try list.append(456);
    
    try std.testing.expectEqual(@as(u32, 42), list.items[0]);
    try std.testing.expectEqual(@as(u32, 123), list.items[1]);
    try std.testing.expectEqual(@as(u32, 456), list.items[2]);
    
    // Test with HashMap
    var map = std.HashMap(u32, []const u8, std.hash_map.AutoContext(u32), 80).init(evm_alloc);
    defer map.deinit();
    
    try map.put(1, "one");
    try map.put(2, "two");
    try map.put(3, "three");
    
    try std.testing.expectEqualStrings("one", map.get(1).?);
    try std.testing.expectEqualStrings("two", map.get(2).?);
    try std.testing.expectEqualStrings("three", map.get(3).?);
}