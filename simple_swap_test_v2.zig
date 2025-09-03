const std = @import("std");

// Simple standalone test to verify SWAP12 behavior
test "SWAP12 verification" {
    
    // Create a simple stack using array directly
    var stack = [_]u256{0} ** 20;
    var stack_size: usize = 0;
    
    // Test case: Push values 0 through 12 (as per the common.zig logic)
    var i: u8 = 0;
    while (i <= 12) : (i += 1) {
        stack[stack_size] = @as(u256, i);
        stack_size += 1;
    }
    
    std.debug.print("Initial stack (bottom to top):\n", .{});
    for (0..stack_size) |idx| {
        std.debug.print("  stack[{}] = {}\n", .{ idx, stack[idx] });
    }
    
    // SWAP12 should swap the top element with the 12th element from top
    // Stack is arranged as: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    //                        ^                                       ^
    //                      bottom                                   top
    //
    // SWAP12 should swap element at top (index 12) with element 12 positions back (index 0)
    const top_idx = stack_size - 1;
    const swap_idx = top_idx - 12; // 12 positions back from top
    
    std.debug.print("Swapping indices {} (value {}) and {} (value {})\n", .{ 
        top_idx, stack[top_idx], 
        swap_idx, stack[swap_idx] 
    });
    
    // Perform the swap
    std.mem.swap(u256, &stack[top_idx], &stack[swap_idx]);
    
    std.debug.print("After SWAP12 (bottom to top):\n", .{});
    for (0..stack_size) |idx| {
        std.debug.print("  stack[{}] = {}\n", .{ idx, stack[idx] });
    }
    
    const result = stack[stack_size - 1]; // Top of stack
    std.debug.print("Result (top of stack): {}\n", .{result});
    
    // Expected: After SWAP12, top should be 0 (was at position 12 from top)
    try std.testing.expectEqual(@as(u256, 0), result);
}