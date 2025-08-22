const std = @import("std");

pub const StackConfig = struct {
    const Self = @This();
    /// The maximum stack size for the evm. Defaults to 1024
    stack_size: usize = 1024,
    /// The size of a single word in the EVM - Defaults to u256
    WordType: type = u256,

    fn get_stack_index_type(self: Self) type {
        return if (self.stack_size <= std.math.maxInt(u4))
            u4
        else if (self.stack_size <= std.math.maxInt(u8))
            u8
        else if (self.stack_size <= std.math.maxInt(u12))
            u12
        else
            @compileError("StackConfig stack_size is too large! It must fit in a u12 bytes");
    }

    // Limits placed on the Stack
    fn validate(self: Self) void {
        if (self.stack_size > 4095) @compileError("stack_size cannot exceed 4095");
        if (@bitSizeOf(self.WordType) > 256) @compileError("WordType cannot exceed u256");
    }
};

pub fn createStack(comptime config: StackConfig) type {
    config.validate();

    const WordType = config.WordType;
    const StackIndexType = config.get_stack_index_type();
    const stack_size = config.stack_size;

    const Stack = struct {
        pub const stack_config = config;

        pub const Error = error{
            StackOverflow,
            StackUnderflow,
            AllocationError,
        };

        const Self = @This();

        next_stack_index: StackIndexType,
        stack: *[stack_size]WordType,

        pub fn init(allocator: std.mem.Allocator) Error!Self {
            const stack_memory = allocator.alloc(WordType, stack_size) catch {
                return Error.AllocationError;
            };
            errdefer allocator.free(stack_memory);
            @memset(std.mem.sliceAsBytes(stack_memory), 0);

            return Self{
                .next_stack_index = 0,
                .stack = @ptrCast(&stack_memory[0]),
            };
        }

        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            const stack_slice = @as([*]WordType, @ptrCast(self.stack))[0..stack_size];
            allocator.free(stack_slice);
        }

        fn push_unsafe(self: *Self, value: WordType) void {
            @branchHint(.likely);
            if (self.next_stack_index >= stack_size) unreachable;
            self.stack[self.next_stack_index] = value;
            self.next_stack_index += 1;
        }

        pub fn push(self: *Self, value: WordType) Error!void {
            if (self.next_stack_index >= stack_size) {
                @branchHint(.cold);
                return Error.StackOverflow;
            }
            self.push_unsafe(value);
        }

        fn pop_unsafe(self: *Self) WordType {
            @branchHint(.likely);
            if (self.next_stack_index == 0) unreachable;

            self.next_stack_index -= 1;
            return self.stack[self.next_stack_index];
        }

        pub fn pop(self: *Self) Error!WordType {
            if (self.next_stack_index == 0) {
                @branchHint(.cold);
                return Error.StackUnderflow;
            }

            return self.pop_unsafe();
        }

        fn set_top_unsafe(self: *Self, value: WordType) void {
            @branchHint(.likely);
            if (self.next_stack_index == 0) unreachable;

            self.stack[self.next_stack_index - 1] = value;
        }

        pub fn set_top(self: *Self, value: WordType) Error!void {
            if (self.next_stack_index == 0) {
                @branchHint(.cold);
                return Error.StackUnderflow;
            }

            self.set_top_unsafe(value);
        }

        fn peek_unsafe(self: *const Self) WordType {
            @branchHint(.likely);
            if (self.next_stack_index == 0) unreachable;

            return self.stack[self.next_stack_index - 1];
        }

        pub fn peek(self: *const Self) Error!WordType {
            if (self.next_stack_index == 0) {
                @branchHint(.cold);
                return Error.StackUnderflow;
            }

            return self.peek_unsafe();
        }

        // Generic dup function for DUP1-DUP16
        fn dup_n(self: *Self, n: u8) Error!void {
            // Check if we have enough items on stack
            if (self.next_stack_index < n) {
                return Error.StackUnderflow;
            }

            // Get the value n positions from the top
            const value = self.stack[self.next_stack_index - n];

            // Push the duplicate
            return self.push(value);
        }

        pub fn op_dup1(self: *Self) Error!void {
            return self.dup_n(1);
        }

        pub fn op_dup16(self: *Self) Error!void {
            return self.dup_n(16);
        }

        // Generic swap function for SWAP1-SWAP16
        fn swap_n(self: *Self, n: u8) Error!void {
            // Check if we have enough items on stack (need n+1 items)
            if (self.next_stack_index < n + 1) {
                return Error.StackUnderflow;
            }

            // Get indices of the two items to swap
            const top_index = self.next_stack_index - 1;
            const other_index = self.next_stack_index - n - 1;

            // Swap them
            std.mem.swap(WordType, &self.stack[top_index], &self.stack[other_index]);
        }

        pub fn op_swap1(self: *Self) Error!void {
            return self.swap_n(1);
        }

        pub fn op_swap16(self: *Self) Error!void {
            return self.swap_n(16);
        }
    };

    return Stack;
}

test "Stack push and push_unsafe" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{});

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Test push_unsafe
    stack.push_unsafe(42);
    try std.testing.expectEqual(@as(u12, 1), stack.next_stack_index);
    try std.testing.expectEqual(@as(u256, 42), stack.stack[0]);

    stack.push_unsafe(100);
    try std.testing.expectEqual(@as(u12, 2), stack.next_stack_index);
    try std.testing.expectEqual(@as(u256, 100), stack.stack[1]);

    // Test push with overflow check
    // Fill stack to near capacity
    stack.next_stack_index = 1023;
    try stack.push(200);
    try std.testing.expectEqual(@as(u256, 200), stack.stack[1023]);

    // This should error - stack is full
    try std.testing.expectError(error.StackOverflow, stack.push(300));
}

test "Stack pop and pop_unsafe" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{});

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Setup stack with some values
    stack.stack[0] = 10;
    stack.stack[1] = 20;
    stack.stack[2] = 30;
    stack.next_stack_index = 3; // Points to next empty slot

    // Test pop_unsafe
    const val1 = stack.pop_unsafe();
    try std.testing.expectEqual(@as(u256, 30), val1);
    try std.testing.expectEqual(@as(u12, 2), stack.next_stack_index);

    const val2 = stack.pop_unsafe();
    try std.testing.expectEqual(@as(u256, 20), val2);
    try std.testing.expectEqual(@as(u12, 1), stack.next_stack_index);

    // Test pop with underflow check
    const val3 = try stack.pop();
    try std.testing.expectEqual(@as(u256, 10), val3);

    // This should error - stack is empty
    try std.testing.expectError(error.StackUnderflow, stack.pop());
}

test "Stack set_top and set_top_unsafe" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{});

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Setup stack with some values
    stack.stack[0] = 10;
    stack.stack[1] = 20;
    stack.stack[2] = 30;
    stack.next_stack_index = 3; // Points to next empty slot after 30

    // Test set_top_unsafe - should modify the top value (30 -> 99)
    stack.set_top_unsafe(99);
    try std.testing.expectEqual(@as(u256, 99), stack.stack[2]);
    try std.testing.expectEqual(@as(u12, 3), stack.next_stack_index); // Index unchanged

    // Test set_top with error check on empty stack
    stack.next_stack_index = 0; // Empty stack
    try std.testing.expectError(error.StackUnderflow, stack.set_top(42));

    // Test set_top on non-empty stack
    stack.next_stack_index = 2; // Stack has 2 items
    try stack.set_top(55);
    try std.testing.expectEqual(@as(u256, 55), stack.stack[1]);
}

test "Stack peek and peek_unsafe" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{});

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Setup stack with values
    stack.stack[0] = 100;
    stack.stack[1] = 200;
    stack.stack[2] = 300;
    stack.next_stack_index = 3; // Points to next empty slot

    // Test peek_unsafe - should return top value without modifying index
    const top_unsafe = stack.peek_unsafe();
    try std.testing.expectEqual(@as(u256, 300), top_unsafe);
    try std.testing.expectEqual(@as(u12, 3), stack.next_stack_index);

    // Test peek on non-empty stack
    const top = try stack.peek();
    try std.testing.expectEqual(@as(u256, 300), top);
    try std.testing.expectEqual(@as(u12, 3), stack.next_stack_index);

    // Test peek on empty stack
    stack.next_stack_index = 0;
    try std.testing.expectError(error.StackUnderflow, stack.peek());
}

test "Stack op_dup1 duplicates top stack item" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{});

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Setup stack with value
    try stack.push(42);
    try std.testing.expectEqual(@as(u12, 1), stack.next_stack_index);

    // Execute op_dup1 - should duplicate top item
    try stack.op_dup1();
    try std.testing.expectEqual(@as(u12, 2), stack.next_stack_index);
    try std.testing.expectEqual(@as(u256, 42), stack.stack[0]); // Original
    try std.testing.expectEqual(@as(u256, 42), stack.stack[1]); // Duplicate
}

test "Stack op_dup16 duplicates 16th stack item" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{});

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Setup stack with 16 values
    var i: u8 = 1;
    while (i <= 16) : (i += 1) {
        try stack.push(i);
    }
    try std.testing.expectEqual(@as(u12, 16), stack.next_stack_index);

    // Execute op_dup16 - should duplicate 16th item from top (which is value 1)
    try stack.op_dup16();
    try std.testing.expectEqual(@as(u12, 17), stack.next_stack_index);
    try std.testing.expectEqual(@as(u256, 1), stack.stack[0]); // 16th from top (value 1)
    try std.testing.expectEqual(@as(u256, 1), stack.stack[16]); // Duplicate on top
}

test "Stack op_swap1 swaps top two stack items" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{});

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Setup stack with two values
    try stack.push(10);
    try stack.push(20);
    try std.testing.expectEqual(@as(u12, 2), stack.next_stack_index);

    // Execute op_swap1 - should swap top two items
    try stack.op_swap1();
    try std.testing.expectEqual(@as(u12, 2), stack.next_stack_index); // Index unchanged
    try std.testing.expectEqual(@as(u256, 20), stack.stack[0]); // Was 10, now 20
    try std.testing.expectEqual(@as(u256, 10), stack.stack[1]); // Was 20, now 10
}

test "Stack op_swap16 swaps top with 17th stack item" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{});

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Setup stack with 17 values
    var i: u8 = 1;
    while (i <= 17) : (i += 1) {
        try stack.push(i);
    }
    try std.testing.expectEqual(@as(u12, 17), stack.next_stack_index);

    // Execute op_swap16 - should swap top item (17) with 17th from top (1)
    try stack.op_swap16();
    try std.testing.expectEqual(@as(u12, 17), stack.next_stack_index); // Index unchanged
    try std.testing.expectEqual(@as(u256, 17), stack.stack[0]); // Was 1, now 17
    try std.testing.expectEqual(@as(u256, 1), stack.stack[16]); // Was 17, now 1
}