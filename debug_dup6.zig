const std = @import("std");
const evm = @import("src/evm/root.zig");

test "debug DUP6 behavior" {
    const allocator = std.testing.allocator;
    
    // Create a simple stack to test
    const StackType = evm.Stack(.{});
    var stack = try StackType.init(allocator);
    defer stack.deinit(allocator);
    
    // Push values 1, 2, 3, 4, 5, 6 (in that order)
    // So stack will be [1, 2, 3, 4, 5, 6] with 6 on top
    try stack.push(1);
    try stack.push(2);
    try stack.push(3);
    try stack.push(4);
    try stack.push(5);
    try stack.push(6);
    
    std.debug.print("\nBefore DUP6:\n");
    const before = stack.get_slice();
    for (before, 0..) |val, i| {
        std.debug.print("  stack[{}] = {}\n", .{i, val});
    }
    
    // Execute DUP6 - should duplicate 6th element from top (which is 1)
    try stack.dup6();
    
    std.debug.print("\nAfter DUP6:\n");
    const after = stack.get_slice();
    for (after, 0..) |val, i| {
        std.debug.print("  stack[{}] = {}\n", .{i, val});
    }
    
    // Check that top element is 1 (duplicated 6th element)
    try std.testing.expectEqual(@as(u256, 1), try stack.peek());
    
    std.debug.print("\nTest passed: DUP6 correctly duplicated 6th element (1) to top\n");
}