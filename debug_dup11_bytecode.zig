const std = @import("std");

test "Debug DUP11 bytecode execution" {
    const allocator = std.testing.allocator;
    
    // Test how the common.zig builds bytecode for 0x8a
    const common = @import("test/evm/opcodes/common.zig");
    
    // Build bytecode for DUP11 (0x8a)
    const bytecode = try common.build_bytecode(allocator, 0x8a);
    defer allocator.free(bytecode);
    
    std.debug.print("Bytecode for DUP11 (0x8a): ", .{});
    for (bytecode) |b| {
        std.debug.print("{X:0>2}", .{b});
    }
    std.debug.print("\n", .{});
    std.debug.print("Length: {} bytes\n", .{bytecode.len});
    
    // Now test the stack operations using the expected pattern:
    // DUP11 should have 11 values pushed, then DUP11, then should return value 1
    const stack_mod = @import("src/evm/stack.zig");
    const StackType = stack_mod.Stack(.{});
    
    var stack = try StackType.init(allocator);
    defer stack.deinit(allocator);
    
    // Simulate what the common.zig does for DUP11:
    // For dup_op = 0x8a, n = dup_op - 0x7f = 11
    // Push n different values (1, 2, 3, ..., 11)
    var i: u8 = 1;
    while (i <= 11) : (i += 1) {
        try stack.push(@as(u256, i));
    }
    
    std.debug.print("Stack before DUP11: ", .{});
    const slice_before = stack.get_slice();
    for (slice_before, 0..) |val, idx| {
        std.debug.print("{}:{} ", .{idx, val});
    }
    std.debug.print("\n", .{});
    
    // Execute DUP11
    try stack.dup11();
    
    std.debug.print("Stack after DUP11: ", .{});
    const slice_after = stack.get_slice();
    for (slice_after, 0..) |val, idx| {
        std.debug.print("{}:{} ", .{idx, val});
    }
    std.debug.print("\n", .{});
    
    // The top should be 1 (the 11th from original top)
    try std.testing.expectEqual(@as(u256, 1), try stack.peek());
    std.debug.print("DUP11 bytecode test passed! Top value after DUP11: {}\n", .{try stack.peek()});
}