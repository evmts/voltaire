const std = @import("std");
const evm = @import("evm");
const testing = std.testing;

test "fuzz_stack_basic_operations" {
    var stack = evm.Stack{};
    
    // Test boundary conditions
    try stack.append(100);
    try stack.append(200);
    try stack.append(300);
    
    try testing.expectEqual(@as(usize, 3), stack.size);
    try testing.expectEqual(@as(u256, 300), stack.peek_unsafe().*);
    
    const val1 = stack.pop_unsafe();
    const val2 = stack.pop_unsafe();
    const val3 = stack.pop_unsafe();
    
    try testing.expectEqual(@as(u256, 300), val1);
    try testing.expectEqual(@as(u256, 200), val2);
    try testing.expectEqual(@as(u256, 100), val3);
    try testing.expectEqual(@as(usize, 0), stack.size);
}

test "fuzz_stack_overflow" {
    var stack = evm.Stack{};
    
    // Fill stack to capacity
    var i: usize = 0;
    while (i < evm.Stack.CAPACITY) : (i += 1) {
        try stack.append(@as(u256, i));
    }
    
    // Should fail on overflow
    try testing.expectError(evm.Stack.Error.StackOverflow, stack.append(9999));
}

test "fuzz_stack_underflow" {
    var stack = evm.Stack{};
    
    // Should fail on underflow
    try testing.expectError(evm.Stack.Error.StackUnderflow, stack.pop());
}

test "fuzz_stack_dup_operations" {
    var stack = evm.Stack{};
    
    stack.append_unsafe(100);
    stack.append_unsafe(200);
    stack.append_unsafe(300);
    
    stack.dup_unsafe(1);
    try testing.expectEqual(@as(usize, 4), stack.size);
    try testing.expectEqual(@as(u256, 300), stack.peek_unsafe().*);
    
    stack.dup_unsafe(2);
    try testing.expectEqual(@as(usize, 5), stack.size);
    try testing.expectEqual(@as(u256, 300), stack.peek_unsafe().*);
}

test "fuzz_stack_swap_operations" {
    var stack = evm.Stack{};
    
    stack.append_unsafe(100);
    stack.append_unsafe(200);
    stack.append_unsafe(300);
    
    stack.swapUnsafe(1);
    
    try testing.expectEqual(@as(u256, 200), stack.data[2]);
    try testing.expectEqual(@as(u256, 300), stack.data[1]);
    try testing.expectEqual(@as(u256, 100), stack.data[0]);
}

test "fuzz_stack_multi_pop_operations" {
    var stack = evm.Stack{};
    
    stack.append_unsafe(100);
    stack.append_unsafe(200);
    stack.append_unsafe(300);
    stack.append_unsafe(400);
    stack.append_unsafe(500);
    
    const result2 = stack.pop2_unsafe();
    try testing.expectEqual(@as(u256, 400), result2.a);
    try testing.expectEqual(@as(u256, 500), result2.b);
    try testing.expectEqual(@as(usize, 3), stack.size);
    
    const result3 = stack.pop3_unsafe();
    try testing.expectEqual(@as(u256, 100), result3.a);
    try testing.expectEqual(@as(u256, 200), result3.b);
    try testing.expectEqual(@as(u256, 300), result3.c);
    try testing.expectEqual(@as(usize, 0), stack.size);
}

test "fuzz_stack_edge_values" {
    var stack = evm.Stack{};
    
    const edge_values = [_]u256{
        0,
        1,
        std.math.maxInt(u8),
        std.math.maxInt(u16),
        std.math.maxInt(u32),
        std.math.maxInt(u64),
        std.math.maxInt(u128),
        std.math.maxInt(u256),
        1 << 128,
        (1 << 255),
    };
    
    for (edge_values) |value| {
        try stack.append(value);
        const popped = try stack.pop();
        try testing.expectEqual(value, popped);
    }
}