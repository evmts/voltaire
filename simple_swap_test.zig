const std = @import("std");

// Simple standalone test to verify SWAP12 behavior
test "SWAP12 verification" {
    const allocator = std.testing.allocator;
    
    // Create a simple stack implementation for testing
    const TestStack = struct {
        items: std.ArrayList(u256),
        allocator: std.mem.Allocator,
        
        const Self = @This();
        
        pub fn init(alloc: std.mem.Allocator) Self {
            return Self{
                .items = std.ArrayList(u256).init(alloc),
                .allocator = alloc,
            };
        }
        
        pub fn deinit(self: *Self) void {
            self.items.deinit();
        }
        
        pub fn push(self: *Self, value: u256) !void {
            try self.items.append(self.allocator, value);
        }
        
        pub fn pop(self: *Self) u256 {
            return self.items.pop();
        }
        
        pub fn peek(self: *Self) u256 {
            return self.items.items[self.items.items.len - 1];
        }
        
        pub fn len(self: *Self) usize {
            return self.items.items.len;
        }
        
        // SWAP operation: swap top with n-th element (1-indexed from top)
        pub fn swap_n(self: *Self, n: u8) !void {
            const size = self.items.items.len;
            if (size < n + 1) return error.StackUnderflow;
            
            const top_idx = size - 1;
            const swap_idx = size - 1 - n;
            
            std.mem.swap(u256, &self.items.items[top_idx], &self.items.items[swap_idx]);
        }
        
        pub fn print(self: *Self) void {
            std.debug.print("Stack (top to bottom): ");
            var i = self.items.items.len;
            while (i > 0) : (i -= 1) {
                std.debug.print("{} ", .{self.items.items[i - 1]});
            }
            std.debug.print("\n");
        }
    };
    
    var stack = TestStack.init(allocator);
    defer stack.deinit();
    
    // Test case: Push values 0 through 12 (as per the common.zig logic)
    // Stack will be (bottom to top): 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
    var i: u8 = 0;
    while (i <= 12) : (i += 1) {
        try stack.push(@as(u256, i));
    }
    
    std.debug.print("Initial stack: ");
    stack.print();
    
    // SWAP12 should swap the top element (12) with the 12th element from top
    // The 12th element from top is at index 0 (value 0)
    try stack.swap_n(12);
    
    std.debug.print("After SWAP12: ");
    stack.print();
    
    const result = stack.peek();
    std.debug.print("Result (top of stack): {}\n", .{result});
    
    // Expected: After SWAP12, top should be 0 (was at position 12 from top)
    try std.testing.expectEqual(@as(u256, 0), result);
}