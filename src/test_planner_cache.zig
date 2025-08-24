const std = @import("std");
const testing = std.testing;

// Import the planner module
const planner_mod = @import("evm2/planner.zig");
const Planner = planner_mod.Planner;
const Opcode = @import("evm2/opcode.zig").Opcode;

// Mock handler function for testing
fn mockHandler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
    _ = frame;
    _ = plan;
    unreachable; // Test handlers don't actually execute
}

test "LRU cache: basic functionality" {
    const allocator = testing.allocator;
    
    // Create planner with cache
    var planner = try Planner(.{}).initWithCache(allocator, 2);
    defer planner.deinit();
    
    // Create handler array
    var handlers: [256]*const planner_mod.HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &mockHandler;
    }
    
    // Test bytecode
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x01, @intFromEnum(Opcode.STOP) };
    
    // First call should analyze and cache
    const plan1 = try planner.getOrAnalyze(&bytecode, handlers);
    
    // Second call should return same cached plan
    const plan2 = try planner.getOrAnalyze(&bytecode, handlers);
    
    // Should be the same plan reference
    try testing.expectEqual(@intFromPtr(plan1), @intFromPtr(plan2));
    
    // Verify cache contains the entry
    try testing.expectEqual(@as(usize, 1), planner.cache_count);
    
    // Test cache stats
    const stats = planner.getCacheStats();
    try testing.expect(stats != null);
    try testing.expectEqual(@as(usize, 2), stats.?.capacity);
    try testing.expectEqual(@as(usize, 1), stats.?.count);
}

test "LRU cache: eviction works correctly" {
    const allocator = testing.allocator;
    
    // Create planner with small cache capacity
    var planner = try Planner(.{}).initWithCache(allocator, 2);
    defer planner.deinit();
    
    // Create handler array
    var handlers: [256]*const planner_mod.HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &mockHandler;
    }
    
    // Three different bytecodes
    const bytecode1 = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x01, @intFromEnum(Opcode.STOP) };
    const bytecode2 = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x02, @intFromEnum(Opcode.STOP) };
    const bytecode3 = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x03, @intFromEnum(Opcode.STOP) };
    
    // Add first two plans (fills cache to capacity)
    const plan1 = try planner.getOrAnalyze(&bytecode1, handlers);
    const plan2 = try planner.getOrAnalyze(&bytecode2, handlers);
    try testing.expectEqual(@as(usize, 2), planner.cache_count);
    
    // Access plan1 to make it most recent
    const plan1_again = try planner.getOrAnalyze(&bytecode1, handlers);
    try testing.expectEqual(@intFromPtr(plan1), @intFromPtr(plan1_again));
    
    // Add third plan - should evict plan2 (least recently used)
    _ = try planner.getOrAnalyze(&bytecode3, handlers);
    try testing.expectEqual(@as(usize, 2), planner.cache_count);
    
    // plan1 should still be in cache
    const plan1_final = try planner.getOrAnalyze(&bytecode1, handlers);
    try testing.expectEqual(@intFromPtr(plan1), @intFromPtr(plan1_final));
    
    // plan2 should be evicted, so we should get a new instance
    const plan2_new = try planner.getOrAnalyze(&bytecode2, handlers);
    try testing.expect(@intFromPtr(plan2) != @intFromPtr(plan2_new));
}

test "LRU cache: clear functionality" {
    const allocator = testing.allocator;
    
    // Create planner with cache
    var planner = try Planner(.{}).initWithCache(allocator, 4);
    defer planner.deinit();
    
    // Create handler array
    var handlers: [256]*const planner_mod.HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &mockHandler;
    }
    
    // Add some plans to cache
    const bytecode1 = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x01, @intFromEnum(Opcode.STOP) };
    const bytecode2 = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x02, @intFromEnum(Opcode.STOP) };
    
    _ = try planner.getOrAnalyze(&bytecode1, handlers);
    _ = try planner.getOrAnalyze(&bytecode2, handlers);
    try testing.expectEqual(@as(usize, 2), planner.cache_count);
    
    // Clear cache
    planner.clearCache();
    try testing.expectEqual(@as(usize, 0), planner.cache_count);
    
    // Verify cache stats reflect cleared state
    const stats = planner.getCacheStats();
    try testing.expect(stats != null);
    try testing.expectEqual(@as(usize, 4), stats.?.capacity);
    try testing.expectEqual(@as(usize, 0), stats.?.count);
}