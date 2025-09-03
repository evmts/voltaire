const std = @import("std");
const evm = @import("src/root.zig").evm;

test "SWAP12 debug test" {
    const allocator = std.testing.allocator;
    
    // Create a stack configuration similar to the EVM's frame config
    const TestConfig = struct {
        stack_size: usize = 1024,
        WordType: type = u256,
    };
    
    const TestStack = evm.Stack(TestConfig{ .stack_size = 1024, .WordType = u256 });
    var stack = try TestStack.init(allocator);
    defer stack.deinit(allocator);
    
    // Simulate the test case from common.zig for SWAP12 (0x9b)
    // For SWAP12: n = 0x9b - 0x8f = 12
    // Push n+1 (13) values: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
    var i: u8 = 0;
    while (i <= 12) : (i += 1) {
        try stack.push(@as(u256, i));
        std.debug.print("Pushed: {}, Stack size: {}\n", .{i, stack.len()});
    }
    
    std.debug.print("Before SWAP12:\n");
    for (0..stack.len()) |idx| {
        std.debug.print("  stack[{}] = {}\n", .{idx, stack.peek_n(idx)});
    }
    
    // Execute SWAP12
    try stack.swap_n(12);
    
    std.debug.print("After SWAP12:\n");
    for (0..stack.len()) |idx| {
        std.debug.print("  stack[{}] = {}\n", .{idx, stack.peek_n(idx)});
    }
    
    const result = stack.pop();
    std.debug.print("Final result (top of stack): {}\n", .{result});
}