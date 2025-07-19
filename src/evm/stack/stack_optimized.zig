const std = @import("std");
const ExecutionError = @import("../execution/execution_error.zig");

pub const CAPACITY = 1024;

/// Optimized EVM stack implementation with improved performance characteristics
pub const StackOptimized = struct {
    // Use a fixed-size array instead of heap allocation to avoid indirection
    storage: [CAPACITY]u256 align(32) = undefined,
    size: usize = 0,

    pub const Error = error{
        Overflow,
        Underflow,
    };

    // Inline functions for better performance
    pub inline fn append(self: *StackOptimized, value: u256) Error!void {
        if (self.size >= CAPACITY) {
            @branchHint(.cold);
            return Error.Overflow;
        }
        self.append_unsafe(value);
    }

    pub inline fn append_unsafe(self: *StackOptimized, value: u256) void {
        self.storage[self.size] = value;
        self.size += 1;
    }

    pub inline fn pop(self: *StackOptimized) Error!u256 {
        if (self.size == 0) {
            @branchHint(.cold);
            return Error.Underflow;
        }
        return self.pop_unsafe();
    }

    pub inline fn pop_unsafe(self: *StackOptimized) u256 {
        self.size -= 1;
        return self.storage[self.size];
    }

    // Optimized pop2 using single bounds check
    pub inline fn pop2_unsafe(self: *StackOptimized) struct { a: u256, b: u256 } {
        const new_size = self.size - 2;
        self.size = new_size;
        return .{
            .a = self.storage[new_size + 1],
            .b = self.storage[new_size],
        };
    }

    // Optimized pop3 using single bounds check
    pub inline fn pop3_unsafe(self: *StackOptimized) struct { a: u256, b: u256, c: u256 } {
        const new_size = self.size - 3;
        self.size = new_size;
        return .{
            .a = self.storage[new_size + 2],
            .b = self.storage[new_size + 1],
            .c = self.storage[new_size],
        };
    }

    // Optimized pop4 using single bounds check
    pub inline fn pop4_unsafe(self: *StackOptimized) struct { a: u256, b: u256, c: u256, d: u256 } {
        const new_size = self.size - 4;
        self.size = new_size;
        return .{
            .a = self.storage[new_size + 3],
            .b = self.storage[new_size + 2],
            .c = self.storage[new_size + 1],
            .d = self.storage[new_size],
        };
    }

    pub inline fn peek(self: *const StackOptimized) Error!*const u256 {
        if (self.size == 0) {
            @branchHint(.cold);
            return Error.Underflow;
        }
        return self.peek_unsafe();
    }

    pub inline fn peek_unsafe(self: *const StackOptimized) *const u256 {
        return &self.storage[self.size - 1];
    }

    pub inline fn set_top_unsafe(self: *StackOptimized, value: u256) void {
        self.storage[self.size - 1] = value;
    }

    // Optimized DUP - use pointer arithmetic
    pub inline fn dup_unsafe(self: *StackOptimized, n: usize) void {
        const value = self.storage[self.size - n];
        self.storage[self.size] = value;
        self.size += 1;
    }

    // Optimized SWAP - use temporary variable
    pub inline fn swap_unsafe(self: *StackOptimized, n: usize) void {
        const top_idx = self.size - 1;
        const swap_idx = self.size - n - 1;
        const temp = self.storage[top_idx];
        self.storage[top_idx] = self.storage[swap_idx];
        self.storage[swap_idx] = temp;
    }

    pub inline fn clear(self: *StackOptimized) void {
        self.size = 0;
    }

    // Optimized batch push for PUSH opcodes
    pub inline fn push_bytes(self: *StackOptimized, comptime n: usize, bytes: [n]u8) void {
        var value: u256 = 0;
        inline for (bytes, 0..) |byte, i| {
            value = (value << 8) | byte;
        }
        self.append_unsafe(value);
    }

    // Optimized multi-value peek for operations that need multiple stack values
    pub inline fn peek2_unsafe(self: *const StackOptimized) struct { top: *const u256, second: *const u256 } {
        return .{
            .top = &self.storage[self.size - 1],
            .second = &self.storage[self.size - 2],
        };
    }

    pub inline fn peek3_unsafe(self: *const StackOptimized) struct { top: *const u256, second: *const u256, third: *const u256 } {
        return .{
            .top = &self.storage[self.size - 1],
            .second = &self.storage[self.size - 2],
            .third = &self.storage[self.size - 3],
        };
    }
};

// Performance benchmark comparisons
test "optimized stack vs original" {
    const Stack = @import("stack.zig");
    const testing = std.testing;
    
    // Original stack
    var original = Stack{};
    var optimized = StackOptimized{};
    
    // Test basic operations
    try original.append(42);
    try optimized.append(42);
    
    try testing.expectEqual(@as(u256, 42), try original.pop());
    try testing.expectEqual(@as(u256, 42), try optimized.pop());
    
    // Test DUP
    try original.append(10);
    try original.append(20);
    try optimized.append(10);
    try optimized.append(20);
    
    original.dup_unsafe(1);
    optimized.dup_unsafe(1);
    
    try testing.expectEqual(@as(usize, 3), original.size);
    try testing.expectEqual(@as(usize, 3), optimized.size);
    
    // Test SWAP
    original.swap_unsafe(1);
    optimized.swap_unsafe(1);
    
    try testing.expectEqual(@as(u256, 10), original.pop_unsafe());
    try testing.expectEqual(@as(u256, 10), optimized.pop_unsafe());
}

test "optimized batch operations" {
    const testing = std.testing;
    var stack = StackOptimized{};
    
    // Test pop2
    try stack.append(1);
    try stack.append(2);
    const result = stack.pop2_unsafe();
    try testing.expectEqual(@as(u256, 2), result.a);
    try testing.expectEqual(@as(u256, 1), result.b);
    
    // Test pop3
    try stack.append(1);
    try stack.append(2);
    try stack.append(3);
    const result3 = stack.pop3_unsafe();
    try testing.expectEqual(@as(u256, 3), result3.a);
    try testing.expectEqual(@as(u256, 2), result3.b);
    try testing.expectEqual(@as(u256, 1), result3.c);
    
    // Test push_bytes
    stack.push_bytes(4, [_]u8{ 0xDE, 0xAD, 0xBE, 0xEF });
    try testing.expectEqual(@as(u256, 0xDEADBEEF), stack.pop_unsafe());
}

test "optimized peek operations" {
    const testing = std.testing;
    var stack = StackOptimized{};
    
    try stack.append(10);
    try stack.append(20);
    try stack.append(30);
    
    const peek2 = stack.peek2_unsafe();
    try testing.expectEqual(@as(u256, 30), peek2.top.*);
    try testing.expectEqual(@as(u256, 20), peek2.second.*);
    
    const peek3 = stack.peek3_unsafe();
    try testing.expectEqual(@as(u256, 30), peek3.top.*);
    try testing.expectEqual(@as(u256, 20), peek3.second.*);
    try testing.expectEqual(@as(u256, 10), peek3.third.*);
}