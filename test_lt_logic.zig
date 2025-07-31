const std = @import("std");

test "LT logic trace" {
    // Test: "LT: 5 < 10 = 1" with stack_input: [5, 10]
    // REVM pushes in reverse order: first 10, then 5
    // So stack is [10, 5] with 5 on top
    
    std.debug.print("\n--- LT Test Trace ---\n", .{});
    std.debug.print("Test input: [5, 10] (pushed in reverse)\n", .{});
    std.debug.print("Stack after pushes: [10, 5] (5 on top)\n", .{});
    
    // Our implementation:
    // b = pop() = 5
    // a = peek() = 10
    // result = (b < a) = (5 < 10) = 1
    
    const our_b = 5;
    const our_a = 10;
    const our_result = if (our_b < our_a) @as(u256, 1) else 0;
    std.debug.print("\nOur impl: b={}, a={}, (b < a) = {}\n", .{ our_b, our_a, our_result });
    
    // REVM:
    // popn_top!([op1], op2) means:
    // op1 = pop() = 5
    // op2 = peek() = 10
    // result = (op1 < op2) = (5 < 10) = 1
    
    const revm_op1 = 5;
    const revm_op2 = 10;
    const revm_result = if (revm_op1 < revm_op2) @as(u256, 1) else 0;
    std.debug.print("\nREVM: op1={}, op2={}, (op1 < op2) = {}\n", .{ revm_op1, revm_op2, revm_result });
}