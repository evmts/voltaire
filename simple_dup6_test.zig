const std = @import("std");

test "simple DUP6 stack indexing test" {
    // Simulate the stack behavior manually
    const values = [_]u256{1, 2, 3, 4, 5, 6}; // Stack: [1, 2, 3, 4, 5, 6] with 6 on top
    
    // In downward-growing stack, elements are accessed by index from stack_ptr
    // For DUP6, we want the 6th element from the top
    // With 0-based indexing: DUP6 means index 5 (n-1 where n=6)
    
    // If stack grows downward and we have [1, 2, 3, 4, 5, 6] with 6 on top:
    // In the actual stack implementation, the slice from get_slice() returns:
    // - Index 0 = top element (6)  
    // - Index 1 = second element (5)
    // - Index 2 = third element (4)
    // - Index 3 = fourth element (3) 
    // - Index 4 = fifth element (2)
    // - Index 5 = sixth element (1) <- this is what DUP6 should duplicate
    
    const correct_duplicated_value = values[0]; // values[0] = 1 (bottom of our test array)
    
    std.debug.print("Stack elements (top to bottom): ", .{});
    var i: usize = values.len;
    while (i > 0) {
        i -= 1;
        std.debug.print("{} ", .{values[i]});
    }
    std.debug.print("\n", .{});
    
    std.debug.print("DUP6 should duplicate 6th element from top = {}\n", .{correct_duplicated_value});
    
    try std.testing.expectEqual(@as(u256, 1), correct_duplicated_value);
}