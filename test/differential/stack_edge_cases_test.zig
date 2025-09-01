const std = @import("std");
const DifferentialTestor = @import("differential_testor.zig").DifferentialTestor;
const testing = std.testing;

test "differential: stack underflow on empty stack" {
    const allocator = testing.allocator;
    
    var testor = try DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Try operations that require stack items when stack is empty
    const bytecode = [_]u8{
        // Try POP on empty stack (should fail)
        0x50,                   // POP
        0x00,                   // STOP (might not reach here)
    };
    
    try testor.test_bytecode(&bytecode);
}

test "differential: stack underflow with arithmetic" {
    const allocator = testing.allocator;
    
    var testor = try DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Try ADD with insufficient stack items
    const bytecode = [_]u8{
        0x60, 0x01,             // PUSH1 1 (only one item on stack)
        0x01,                   // ADD (needs two items - should fail)
        0x00,                   // STOP
    };
    
    try testor.test_bytecode(&bytecode);
}

test "differential: stack underflow with DUP16" {
    const allocator = testing.allocator;
    
    var testor = try DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Try DUP16 without enough stack depth
    const bytecode = [_]u8{
        // Push only 5 items
        0x60, 0x01,             // PUSH1 1
        0x60, 0x02,             // PUSH1 2
        0x60, 0x03,             // PUSH1 3
        0x60, 0x04,             // PUSH1 4
        0x60, 0x05,             // PUSH1 5
        
        0x8f,                   // DUP16 (needs 16 items - should fail)
        0x00,                   // STOP
    };
    
    try testor.test_bytecode(&bytecode);
}

test "differential: stack underflow with SWAP16" {
    const allocator = testing.allocator;
    
    var testor = try DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Try SWAP16 without enough stack depth
    const bytecode = [_]u8{
        // Push only 10 items
        0x60, 0x01, 0x60, 0x02, 0x60, 0x03, 0x60, 0x04, 0x60, 0x05,
        0x60, 0x06, 0x60, 0x07, 0x60, 0x08, 0x60, 0x09, 0x60, 0x0a,
        
        0x9f,                   // SWAP16 (needs 17 items - should fail)
        0x00,                   // STOP
    };
    
    try testor.test_bytecode(&bytecode);
}

test "differential: complex stack manipulation patterns" {
    const allocator = testing.allocator;
    
    var testor = try DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Test complex patterns that stress stack management
    const bytecode = [_]u8{
        // Build initial stack
        0x60, 0x01, 0x60, 0x02, 0x60, 0x03, 0x60, 0x04, 0x60, 0x05,
        0x60, 0x06, 0x60, 0x07, 0x60, 0x08, 0x60, 0x09, 0x60, 0x0a,
        0x60, 0x0b, 0x60, 0x0c, 0x60, 0x0d, 0x60, 0x0e, 0x60, 0x0f,
        0x60, 0x10, 0x60, 0x11, 0x60, 0x12, 0x60, 0x13, 0x60, 0x14,
        
        // Complex manipulation sequence
        0x8f,                   // DUP16 (duplicate 16th item)
        0x9e,                   // SWAP15 (swap with 15th)
        0x88,                   // DUP9 (duplicate 9th)
        0x95,                   // SWAP6 (swap with 6th)
        0x50,                   // POP
        0x50,                   // POP
        0x82,                   // DUP3
        0x90,                   // SWAP1
        
        // More operations
        0x01,                   // ADD (combine top two)
        0x80,                   // DUP1
        0x02,                   // MUL (square the value)
        
        0x00,                   // STOP
    };
    
    try testor.test_bytecode(&bytecode);
}

test "differential: stack underflow with multiple pops" {
    const allocator = testing.allocator;
    
    var testor = try DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Push some items then POP too many
    const bytecode = [_]u8{
        0x60, 0xaa,             // PUSH1 170
        0x60, 0xbb,             // PUSH1 187
        0x60, 0xcc,             // PUSH1 204
        // Stack now has 3 items
        
        0x50,                   // POP (stack: 2 items)
        0x50,                   // POP (stack: 1 item)
        0x50,                   // POP (stack: 0 items)
        0x50,                   // POP (stack underflow - should fail)
        
        0x00,                   // STOP
    };
    
    try testor.test_bytecode(&bytecode);
}

test "differential: stack state after failed operation" {
    const allocator = testing.allocator;
    
    var testor = try DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Test stack state consistency after operations that might fail
    const bytecode = [_]u8{
        0x60, 0x10,             // PUSH1 16
        0x60, 0x20,             // PUSH1 32
        0x60, 0x30,             // PUSH1 48
        // Stack: [48, 32, 16] (top to bottom)
        
        // Try operation that might fail
        0x8f,                   // DUP16 (should fail - not enough items)
        
        // If we reach here, check if stack is still intact
        0x01,                   // ADD (48 + 32 = 80)
        0x60, 0x00,             // PUSH1 0
        0x52,                   // MSTORE (store result)
        
        0x00,                   // STOP
    };
    
    try testor.test_bytecode(&bytecode);
}

test "differential: maximum depth DUP and SWAP combinations" {
    const allocator = testing.allocator;
    
    var testor = try DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Push exactly 16 items to test maximum DUP/SWAP depth
    const bytecode = [_]u8{
        // Push 16 distinct values
        0x60, 0x01, 0x60, 0x02, 0x60, 0x03, 0x60, 0x04,
        0x60, 0x05, 0x60, 0x06, 0x60, 0x07, 0x60, 0x08,
        0x60, 0x09, 0x60, 0x0a, 0x60, 0x0b, 0x60, 0x0c,
        0x60, 0x0d, 0x60, 0x0e, 0x60, 0x0f, 0x60, 0x10,
        
        // Test maximum depth operations
        0x8f,                   // DUP16 (duplicate 16th item - should work)
        0x9f,                   // SWAP16 (swap with 16th item - should work)
        
        // Test operations that would go beyond
        0x50,                   // POP (remove one item)
        0x8f,                   // DUP16 (now should fail - only 16 items total)
        
        0x00,                   // STOP
    };
    
    try testor.test_bytecode(&bytecode);
}

test "differential: interleaved PUSH POP patterns" {
    const allocator = testing.allocator;
    
    var testor = try DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Test patterns that alternate between growing and shrinking stack
    const bytecode = [_]u8{
        // Pattern: push 3, pop 2, push 4, pop 3, etc.
        0x60, 0x01, 0x60, 0x02, 0x60, 0x03,  // PUSH 3 items
        0x50, 0x50,                          // POP 2 items
        
        0x60, 0x04, 0x60, 0x05, 0x60, 0x06, 0x60, 0x07,  // PUSH 4 items
        0x50, 0x50, 0x50,                    // POP 3 items
        
        0x60, 0x08, 0x60, 0x09, 0x60, 0x0a, 0x60, 0x0b, 0x60, 0x0c,  // PUSH 5 items
        0x50, 0x50, 0x50, 0x50,              // POP 4 items
        
        // Verify final stack state
        0x80,                   // DUP1 
        0x60, 0x00,             // PUSH1 0
        0x52,                   // MSTORE
        
        0x00,                   // STOP
    };
    
    try testor.test_bytecode(&bytecode);
}

test "differential: stack exhaustion with arithmetic operations" {
    const allocator = testing.allocator;
    
    var testor = try DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Test arithmetic operations that consume stack items
    const bytecode = [_]u8{
        // Build small stack
        0x60, 0x10, 0x60, 0x20, 0x60, 0x30, 0x60, 0x40, 0x60, 0x50,
        
        // Consume pairs with arithmetic
        0x01,                   // ADD (consumes 2, produces 1)
        0x02,                   // MUL (consumes 2, produces 1)  
        0x03,                   // SUB (consumes 2, produces 1)
        
        // Stack should have: result and 0x10
        0x04,                   // DIV (consumes last 2, produces 1)
        
        // Now only 1 item on stack
        0x01,                   // ADD (needs 2 items - should fail)
        
        0x00,                   // STOP
    };
    
    try testor.test_bytecode(&bytecode);
}