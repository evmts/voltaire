const std = @import("std");

pub const StackConfig = struct {
    const Self = @This();

    /// The maximum stack size for the evm. Defaults to 1024. Maximum supported is 4095
    stack_size: u12 = 1024,
    /// The size of a single word in the EVM - Defaults to u256. Supports any word size up to u512
    WordType: type = u256,

    /// StackIndexType: smallest integer type to index the stack
    fn StackIndexType(self: Self) type {
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
        if (@bitSizeOf(self.WordType) > 512) @compileError("WordType cannot exceed u512");
    }
};

pub fn createStack(comptime config: StackConfig) type {
    config.validate();


    const Stack = struct {
        pub const WordType = config.WordType;
        pub const IndexType = config.StackIndexType();
        pub const stack_capacity = config.stack_size;

        pub const Error = error{
            StackOverflow,
            StackUnderflow,
            AllocationError,
        };

        const Self = @This();

        next_stack_index: IndexType,
        stack: *[stack_capacity]WordType,

        pub fn init(allocator: std.mem.Allocator) Error!Self {
            const stack_memory = allocator.alloc(WordType, stack_capacity) catch return Error.AllocationError;
            errdefer allocator.free(stack_memory);
            @memset(std.mem.sliceAsBytes(stack_memory), 0);
            return Self{
                .next_stack_index = 0,
                .stack = @ptrCast(&stack_memory[0]),
            };
        }

        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            allocator.free(@as([*]WordType, @ptrCast(self.stack))[0..stack_capacity]);
        }

        pub fn push_unsafe(self: *Self, value: WordType) void {
            @branchHint(.likely);
            std.debug.assert(self.next_stack_index < stack_capacity);
            self.stack[self.next_stack_index] = value;
            self.next_stack_index += 1;
        }

        pub fn push(self: *Self, value: WordType) Error!void {
            if (self.next_stack_index >= stack_capacity) {
                @branchHint(.cold);
                return Error.StackOverflow;
            }
            self.push_unsafe(value);
        }

        pub fn pop_unsafe(self: *Self) WordType {
            @branchHint(.likely);
            std.debug.assert(self.next_stack_index != 0);
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

        pub fn set_top_unsafe(self: *Self, value: WordType) void {
            @branchHint(.likely);
            std.debug.assert(self.next_stack_index > 0);
            self.stack[self.next_stack_index - 1] = value;
        }

        pub fn set_top(self: *Self, value: WordType) Error!void {
            if (self.next_stack_index == 0) {
                @branchHint(.cold);
                return Error.StackUnderflow;
            }
            self.set_top_unsafe(value);
        }

        pub fn peek_unsafe(self: *const Self) WordType {
            @branchHint(.likely);
            std.debug.assert(self.next_stack_index > 0);
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
        pub fn dup_n(self: *Self, n: u8) Error!void {
            if (self.next_stack_index < n) {
                @branchHint(.cold);
                return Error.StackUnderflow;
            }
            const value = self.stack[self.next_stack_index - n];
            return self.push(value);
        }

        pub fn op_dup1(self: *Self) Error!void {
            return self.dup_n(1);
        }

        pub fn op_dup3(self: *Self) Error!void {
            return self.dup_n(3);
        }

        pub fn op_dup16(self: *Self) Error!void {
            return self.dup_n(16);
        }

        // Generic swap function for SWAP1-SWAP16
        pub fn swap_n(self: *Self, n: u8) Error!void {
            if (self.next_stack_index < n + 1) {
                @branchHint(.cold);
                return Error.StackUnderflow;
            }
            const top_index = self.next_stack_index - 1;
            const other_index = self.next_stack_index - n - 1;
            std.mem.swap(WordType, &self.stack[top_index], &self.stack[other_index]);
        }

        pub fn op_swap1(self: *Self) Error!void {
            return self.swap_n(1);
        }

        pub fn op_swap2(self: *Self) Error!void {
            return self.swap_n(2);
        }

        pub fn op_swap16(self: *Self) Error!void {
            return self.swap_n(16);
        }
        
        // Accessors for tracer
        pub fn size(self: *const Self) usize {
            return self.next_stack_index;
        }
        
        pub fn getSlice(self: *const Self) []const WordType {
            return self.stack[0..self.next_stack_index];
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

test "Stack set_top underflow detection (bug fix validation)" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{});

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Test the bug fix: set_top should detect underflow on empty stack
    // Before fix: `if (self.next_stack_index < 0)` was impossible for unsigned
    // After fix: `if (self.next_stack_index == 0)` correctly detects empty stack
    try std.testing.expectError(error.StackUnderflow, stack.set_top(42));

    // Verify stack remains empty after failed operation
    try std.testing.expectEqual(@as(u12, 0), stack.next_stack_index);
}

test "Stack peek underflow detection (bug fix validation)" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{});

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Test the bug fix: peek should detect underflow on empty stack
    // The fix ensures peek_unsafe assertions work correctly for unsigned types
    try std.testing.expectError(error.StackUnderflow, stack.peek());

    // Verify stack remains empty after failed operation
    try std.testing.expectEqual(@as(u12, 0), stack.next_stack_index);
}

test "Stack unsafe operations assertion validation (bug fix)" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{});

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Add one item to test valid operations
    try stack.push(100);

    // These should work correctly with the fixed assertions
    // Before fix: assertions like `next_stack_index >= 0` were always true
    // After fix: assertions properly validate stack state
    stack.set_top_unsafe(200);
    try std.testing.expectEqual(@as(u256, 200), stack.peek_unsafe());

    // Pop the item to test edge case
    _ = stack.pop_unsafe();
    try std.testing.expectEqual(@as(u12, 0), stack.next_stack_index);
}

test "Stack maximum configuration comprehensive test" {
    const allocator = std.testing.allocator;
    // Maximum configuration: largest stack size and word type
    const Stack = createStack(.{
        .stack_size = 4095, // Maximum supported
        .WordType = u256,   // Maximum word size
    });

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Test all operations with maximum values
    const max_value = std.math.maxInt(u256);

    // Test basic operations
    try stack.push(max_value);
    try std.testing.expectEqual(max_value, try stack.peek());
    try stack.set_top(123);
    try std.testing.expectEqual(@as(u256, 123), try stack.peek());

    // Fill stack to capacity
    var i: u16 = 1;
    while (i < 4095) : (i += 1) {
        try stack.push(@as(u256, i));
    }
    try std.testing.expectEqual(@as(u12, 4095), stack.next_stack_index);

    // Test overflow
    try std.testing.expectError(error.StackOverflow, stack.push(999));
    try std.testing.expectError(error.StackOverflow, stack.op_dup1());

    // Test operations at capacity
    _ = try stack.pop(); // Make room
    try stack.op_dup1(); // Should work now
    
    // Empty stack and test DUP16/SWAP16
    while (stack.next_stack_index > 0) {
        _ = try stack.pop();
    }
    
    // Test DUP16 and SWAP16 with exactly 16 items
    var j: u8 = 1;
    while (j <= 16) : (j += 1) {
        try stack.push(@as(u256, j));
    }
    
    try stack.op_dup16(); // Should duplicate 16th item (1)
    try std.testing.expectEqual(@as(u256, 1), try stack.peek());
    
    // Now we have 17 items, SWAP16 should work
    try stack.op_swap16(); // Swap top (1) with 17th (1 - the original bottom)
    try std.testing.expectEqual(@as(u256, 1), try stack.peek());

    // Empty the entire stack
    while (stack.next_stack_index > 0) {
        _ = try stack.pop();
    }
    try std.testing.expectEqual(@as(u12, 0), stack.next_stack_index);

    // Test underflow
    try std.testing.expectError(error.StackUnderflow, stack.pop());
    try std.testing.expectError(error.StackUnderflow, stack.peek());
    try std.testing.expectError(error.StackUnderflow, stack.set_top(123));
}

test "Stack minimum configuration comprehensive test" {
    const allocator = std.testing.allocator;
    // Minimum meaningful configuration
    const Stack = createStack(.{
        .stack_size = 16,   // Small stack for testing
        .WordType = u8,     // Smallest practical word type
    });

    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);

    // Test all operations with small values
    const max_u8 = std.math.maxInt(u8);

    // Test basic operations with u8
    try stack.push(max_u8);
    try std.testing.expectEqual(max_u8, try stack.peek());
    try stack.set_top(42);
    try std.testing.expectEqual(@as(u8, 42), try stack.peek());

    // Test DUP and SWAP
    try stack.push(100);
    try stack.op_dup1();
    try std.testing.expectEqual(@as(u8, 100), try stack.peek());
    
    try stack.push(200);
    try stack.op_swap1();
    try std.testing.expectEqual(@as(u8, 100), try stack.peek());

    // Fill small stack to capacity
    while (stack.next_stack_index < 16) {
        try stack.push(50);
    }
    try std.testing.expectEqual(@as(u8, 16), stack.next_stack_index);

    // Test overflow with small stack
    try std.testing.expectError(error.StackOverflow, stack.push(255));
    try std.testing.expectError(error.StackOverflow, stack.op_dup1());

    // Test DUP16 and SWAP16 at capacity
    _ = try stack.pop(); // Make room
    try stack.op_dup1(); // Should work
    
    // Empty and test with exactly 16 items for DUP16/SWAP16
    while (stack.next_stack_index > 0) {
        _ = try stack.pop();
    }
    
    // Push 15 items, then test DUP16
    var j: u8 = 1;
    while (j <= 15) : (j += 1) {
        try stack.push(@as(u8, j));
    }

    // DUP16 should fail - not enough items
    try std.testing.expectError(error.StackUnderflow, stack.op_dup16());
    
    // Add one more to have exactly 16
    try stack.push(16);
    
    // Now DUP16 should work but will overflow the 16-element stack
    try std.testing.expectError(error.StackOverflow, stack.op_dup16());
    
    // Test SWAP16 with 16 items - should fail, needs 17 items
    try std.testing.expectError(error.StackUnderflow, stack.op_swap16());

    // Empty the stack
    while (stack.next_stack_index > 0) {
        _ = try stack.pop();
    }

    // Test underflow on empty stack
    try std.testing.expectError(error.StackUnderflow, stack.pop());
    try std.testing.expectError(error.StackUnderflow, stack.peek());
    try std.testing.expectError(error.StackUnderflow, stack.set_top(42));
    try std.testing.expectError(error.StackUnderflow, stack.op_dup1());
    try std.testing.expectError(error.StackUnderflow, stack.op_swap1());
}

test "Stack index type boundaries" {
    const allocator = std.testing.allocator;
    
    // Test u4 boundary (stack_size = 15 uses u4, 16 uses u8)
    const Stack15 = createStack(.{ .stack_size = 15 });
    var stack15 = try Stack15.init(allocator);
    defer stack15.deinit(allocator);
    
    // Fill to capacity (15 items)
    var i: u8 = 0;
    while (i < 15) : (i += 1) {
        try stack15.push(@as(u256, i));
    }
    try std.testing.expectEqual(@as(u4, 15), stack15.next_stack_index);
    try std.testing.expectError(error.StackOverflow, stack15.push(999));
    
    // Test u8 boundary (stack_size = 255 uses u8, 256 uses u12)
    const Stack255 = createStack(.{ .stack_size = 255 });
    var stack255 = try Stack255.init(allocator);
    defer stack255.deinit(allocator);
    
    // Fill to capacity
    var j: u16 = 0;
    while (j < 255) : (j += 1) {
        try stack255.push(@as(u256, j));
    }
    try std.testing.expectEqual(@as(u8, 255), stack255.next_stack_index);
    try std.testing.expectError(error.StackOverflow, stack255.push(999));
    
    // Test u12 at boundary (stack_size = 256 uses u12)
    const Stack256 = createStack(.{ .stack_size = 256 });
    var stack256 = try Stack256.init(allocator);
    defer stack256.deinit(allocator);
    
    // Push one item to verify u12 type works
    try stack256.push(42);
    try std.testing.expectEqual(@as(u12, 1), stack256.next_stack_index);
}

test "All DUP operations DUP1-DUP16" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{ .stack_size = 32 });
    
    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);
    
    // Test each DUP operation with exactly the minimum required items
    var dup_n: u8 = 1;
    while (dup_n <= 16) : (dup_n += 1) {
        // Clear stack
        while (stack.next_stack_index > 0) {
            _ = try stack.pop();
        }
        
        // Push exactly dup_n items
        var i: u8 = 1;
        while (i <= dup_n) : (i += 1) {
            try stack.push(@as(u256, @as(u16, i) * 100));
        }
        
        // Test the specific DUP operation
        const initial_count = stack.next_stack_index;
        try stack.dup_n(dup_n);
        
        // Should have one more item now
        try std.testing.expectEqual(initial_count + 1, stack.next_stack_index);
        
        // Top item should be the dup_n'th item from before (first item pushed)
        try std.testing.expectEqual(@as(u256, 100), try stack.peek());
        
        // Test underflow: remove one item and try again
        _ = try stack.pop(); // Remove the duplicate
        _ = try stack.pop(); // Remove one original item
        try std.testing.expectError(error.StackUnderflow, stack.dup_n(dup_n));
    }
}

test "All SWAP operations SWAP1-SWAP16" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{ .stack_size = 32 });
    
    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);
    
    // Test each SWAP operation with exactly the minimum required items
    var swap_n: u8 = 1;
    while (swap_n <= 16) : (swap_n += 1) {
        // Clear stack
        while (stack.next_stack_index > 0) {
            _ = try stack.pop();
        }
        
        // Push exactly swap_n + 1 items (SWAP needs n+1 items)
        var i: u8 = 1;
        while (i <= swap_n + 1) : (i += 1) {
            try stack.push(@as(u256, @as(u16, i) * 100));
        }
        
        // Record the values before swap
        const top_value = try stack.peek();
        const target_index = stack.next_stack_index - swap_n - 1;
        const target_value = stack.stack[target_index];
        
        // Test the specific SWAP operation
        const initial_count = stack.next_stack_index;
        try stack.swap_n(swap_n);
        
        // Stack size should be unchanged
        try std.testing.expectEqual(initial_count, stack.next_stack_index);
        
        // Top should now have the target value
        try std.testing.expectEqual(target_value, try stack.peek());
        
        // Target position should have the original top value
        try std.testing.expectEqual(top_value, stack.stack[target_index]);
        
        // Test underflow: remove one item and try again
        _ = try stack.pop();
        try std.testing.expectError(error.StackUnderflow, stack.swap_n(swap_n));
    }
}

test "Mock allocator and allocation failure" {
    // Create a failing allocator that always returns OutOfMemory
    const FailingAllocator = struct {
        fn alloc(self: *anyopaque, len: usize, ptr_align: std.mem.Alignment, ret_addr: usize) ?[*]u8 {
            _ = self;
            _ = len;
            _ = ptr_align;
            _ = ret_addr;
            return null; // Always fail
        }
        
        fn resize(self: *anyopaque, buf: []u8, buf_align: std.mem.Alignment, new_len: usize, ret_addr: usize) bool {
            _ = self;
            _ = buf;
            _ = buf_align;
            _ = new_len;
            _ = ret_addr;
            return false;
        }
        
        fn free(self: *anyopaque, buf: []u8, buf_align: std.mem.Alignment, ret_addr: usize) void {
            _ = self;
            _ = buf;
            _ = buf_align;
            _ = ret_addr;
        }
        
        fn remap(self: *anyopaque, buf: []u8, buf_align: std.mem.Alignment, new_len: usize, ret_addr: usize) ?[*]u8 {
            _ = self;
            _ = buf;
            _ = buf_align;
            _ = new_len;
            _ = ret_addr;
            return null;
        }
    };
    
    var failing_allocator_state: u8 = 0;
    const failing_allocator = std.mem.Allocator{
        .ptr = &failing_allocator_state,
        .vtable = &.{
            .alloc = FailingAllocator.alloc,
            .resize = FailingAllocator.resize,
            .free = FailingAllocator.free,
            .remap = FailingAllocator.remap,
        },
    };
    
    const Stack = createStack(.{});
    
    // Test that init fails with AllocationError when allocator fails
    try std.testing.expectError(error.AllocationError, Stack.init(failing_allocator));
}

test "Complex operation sequences at boundaries" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{ .stack_size = 8 }); // Small stack for boundary testing
    
    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);
    
    // Complex sequence: Push → DUP → SWAP → Pop at boundaries
    
    // Fill to near capacity
    try stack.push(100);
    try stack.push(200);
    try stack.push(300);
    try stack.push(400);
    try stack.push(500);
    try stack.push(600);
    try stack.push(700); // 7 items
    
    // DUP1 should work (brings to 8, at capacity)
    try stack.op_dup1();
    try std.testing.expectEqual(@as(u4, 8), stack.next_stack_index);
    try std.testing.expectEqual(@as(u256, 700), try stack.peek());
    
    // Any push should fail now
    try std.testing.expectError(error.StackOverflow, stack.push(999));
    try std.testing.expectError(error.StackOverflow, stack.op_dup1());
    
    // SWAP should work (doesn't change count)
    try stack.op_swap1();
    try std.testing.expectEqual(@as(u4, 8), stack.next_stack_index);
    try std.testing.expectEqual(@as(u256, 700), try stack.peek()); // Original second item
    
    // Pop and continue sequence
    const val1 = try stack.pop(); // 700 (the original duplicate)
    try std.testing.expectEqual(@as(u256, 700), val1);
    
    const val2 = try stack.pop(); // 700 (the original top)
    try std.testing.expectEqual(@as(u256, 700), val2);
    
    // Now we have 6 items, test complex DUP/SWAP
    try stack.op_dup3(); // Duplicate 3rd from top (should be 400)
    try std.testing.expectEqual(@as(u256, 400), try stack.peek());
    
    try stack.op_swap2(); // Swap with 2nd item
    const second_item = stack.stack[stack.next_stack_index - 2];
    try std.testing.expectEqual(@as(u256, 600), second_item);
    
    // Continue until empty
    while (stack.next_stack_index > 0) {
        _ = try stack.pop();
    }
    
    // Test underflow after complex sequence
    try std.testing.expectError(error.StackUnderflow, stack.pop());
    try std.testing.expectError(error.StackUnderflow, stack.op_dup1());
    try std.testing.expectError(error.StackUnderflow, stack.op_swap1());
}

test "Zero values and boundary values" {
    const allocator = std.testing.allocator;
    
    // Test with different word types
    const StackU8 = createStack(.{ .WordType = u8 });
    const StackU16 = createStack(.{ .WordType = u16 });
    const StackU32 = createStack(.{ .WordType = u32 });
    const StackU64 = createStack(.{ .WordType = u64 });
    const StackU128 = createStack(.{ .WordType = u128 });
    
    var stack_u8 = try StackU8.init(allocator);
    defer stack_u8.deinit(allocator);
    
    var stack_u16 = try StackU16.init(allocator);
    defer stack_u16.deinit(allocator);
    
    var stack_u32 = try StackU32.init(allocator);
    defer stack_u32.deinit(allocator);
    
    var stack_u64 = try StackU64.init(allocator);
    defer stack_u64.deinit(allocator);
    
    var stack_u128 = try StackU128.init(allocator);
    defer stack_u128.deinit(allocator);
    
    // Test zero values (distinct from empty)
    try stack_u8.push(0);
    try std.testing.expectEqual(@as(u8, 0), try stack_u8.peek());
    try std.testing.expectEqual(@as(u12, 1), stack_u8.next_stack_index); // Not empty!
    
    // Test maximum values for each type
    try stack_u8.set_top(std.math.maxInt(u8));
    try std.testing.expectEqual(std.math.maxInt(u8), try stack_u8.peek());
    
    try stack_u16.push(std.math.maxInt(u16));
    try std.testing.expectEqual(std.math.maxInt(u16), try stack_u16.peek());
    
    try stack_u32.push(std.math.maxInt(u32));
    try std.testing.expectEqual(std.math.maxInt(u32), try stack_u32.peek());
    
    try stack_u64.push(std.math.maxInt(u64));
    try std.testing.expectEqual(std.math.maxInt(u64), try stack_u64.peek());
    
    try stack_u128.push(std.math.maxInt(u128));
    try std.testing.expectEqual(std.math.maxInt(u128), try stack_u128.peek());
    
    // Test minimal stack size (1 element)
    const StackMin = createStack(.{ .stack_size = 1 });
    var stack_min = try StackMin.init(allocator);
    defer stack_min.deinit(allocator);
    
    try stack_min.push(42);
    try std.testing.expectEqual(@as(u4, 1), stack_min.next_stack_index);
    try std.testing.expectError(error.StackOverflow, stack_min.push(99));
    try std.testing.expectError(error.StackOverflow, stack_min.op_dup1());
    try std.testing.expectError(error.StackUnderflow, stack_min.op_swap1()); // Needs 2 items
}

test "Unsafe operations at exact boundaries" {
    const allocator = std.testing.allocator;
    const Stack = createStack(.{ .stack_size = 4 });
    
    var stack = try Stack.init(allocator);
    defer stack.deinit(allocator);
    
    // Test push_unsafe at exact capacity
    stack.push_unsafe(1);
    stack.push_unsafe(2);
    stack.push_unsafe(3);
    stack.push_unsafe(4);
    try std.testing.expectEqual(@as(u4, 4), stack.next_stack_index);
    
    // Test peek_unsafe and set_top_unsafe at capacity
    try std.testing.expectEqual(@as(u256, 4), stack.peek_unsafe());
    stack.set_top_unsafe(99);
    try std.testing.expectEqual(@as(u256, 99), stack.peek_unsafe());
    
    // Test pop_unsafe down to empty
    _ = stack.pop_unsafe(); // 99
    _ = stack.pop_unsafe(); // 3  
    _ = stack.pop_unsafe(); // 2
    _ = stack.pop_unsafe(); // 1
    try std.testing.expectEqual(@as(u4, 0), stack.next_stack_index);
    
    // Test boundary with single item
    stack.push_unsafe(42);
    try std.testing.expectEqual(@as(u256, 42), stack.peek_unsafe());
    stack.set_top_unsafe(100);
    try std.testing.expectEqual(@as(u256, 100), stack.peek_unsafe());
    _ = stack.pop_unsafe();
    try std.testing.expectEqual(@as(u4, 0), stack.next_stack_index);
}
