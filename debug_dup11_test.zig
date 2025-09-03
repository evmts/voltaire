const std = @import("std");

test "Debug DUP11 basic functionality" {
    const allocator = std.testing.allocator;
    
    // Test the basic DUP11 logic using the stack directly
    const stack_mod = @import("src/evm/stack.zig");
    const StackType = stack_mod.Stack(.{});
    
    var stack = try StackType.init(allocator);
    defer stack.deinit(allocator);
    
    // Push 11 different values (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)
    var i: u8 = 1;
    while (i <= 11) : (i += 1) {
        try stack.push(@as(u256, i));
    }
    
    // Check initial state - should have 11 items, with 11 on top
    try std.testing.expectEqual(@as(usize, 11), stack.size());
    try std.testing.expectEqual(@as(u256, 11), try stack.peek());
    
    // Execute DUP11 - should duplicate the 11th item from top (value 1)
    try stack.dup11();
    
    // Should have 12 items now
    try std.testing.expectEqual(@as(usize, 12), stack.size());
    
    // Top item should be 1 (duplicated from bottom)
    try std.testing.expectEqual(@as(u256, 1), try stack.peek());
    
    std.debug.print("DUP11 basic test passed!\n", .{});
}