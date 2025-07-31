const std = @import("std");

test "LT simple logic" {
    // Test case: 5 < 10 should return 1
    // Stack: [5, 10] (10 on top)
    
    // Simulating our implementation:
    const b = 10; // popped
    const a = 5;  // peeked
    
    // Our implementation: if (b < a) 1 else 0
    const our_result = if (b < a) @as(u256, 1) else 0;
    std.debug.print("\nOur LT result for {} < {}: {}\n", .{ b, a, our_result });
    
    // What we want: 5 < 10 = 1
    const expected = if (5 < 10) @as(u256, 1) else 0;
    std.debug.print("Expected result for 5 < 10: {}\n", .{ expected });
    
    // REVM's approach based on the code I saw:
    // popn_top!([op1], op2, context.interpreter);
    // *op2 = U256::from(op1 < *op2);
    // This means: pop op1 (10), keep op2 (5), result = 10 < 5 = 0
    const revm_result = if (10 < 5) @as(u256, 1) else 0;
    std.debug.print("REVM result (10 < 5): {}\n", .{ revm_result });
}