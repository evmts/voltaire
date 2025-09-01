const std = @import("std");
const testing = std.testing;
const differential_testor = @import("differential/differential_testor.zig");

test "simple contract with valid jumps" {
    const allocator = testing.allocator;
    var testor = try differential_testor.DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Simple contract with constructor that returns runtime code
    // Constructor: 
    //   PUSH1 0x0a (runtime length)
    //   DUP1
    //   PUSH1 0x0c (runtime offset) 
    //   PUSH1 0x00
    //   CODECOPY
    //   PUSH1 0x00
    //   RETURN
    // Runtime:
    //   PUSH1 0x42
    //   PUSH1 0x00
    //   MSTORE
    //   PUSH1 0x20
    //   PUSH1 0x00
    //   RETURN
    const bytecode = [_]u8{
        // Constructor (returns runtime code)
        0x60, 0x0a,  // PUSH1 0x0a (runtime size = 10 bytes)
        0x80,        // DUP1
        0x60, 0x0c,  // PUSH1 0x0c (runtime offset = 12)
        0x60, 0x00,  // PUSH1 0x00 (dest offset in memory)
        0x39,        // CODECOPY
        0x60, 0x00,  // PUSH1 0x00 (return offset)
        0xf3,        // RETURN
        // Runtime code (starts at offset 12)
        0x60, 0x42,  // PUSH1 0x42
        0x60, 0x00,  // PUSH1 0x00
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 0x20
        0x60, 0x00,  // PUSH1 0x00
        0xf3,        // RETURN
    };
    
    try testor.test_bytecode(&bytecode);
}

test "contract with JUMPDEST and valid jumps" {
    const allocator = testing.allocator;
    var testor = try differential_testor.DifferentialTestor.init(allocator);
    defer testor.deinit();
    
    // Constructor that returns runtime code with JUMPDESTs
    const bytecode = [_]u8{
        // Constructor
        0x60, 0x10,  // PUSH1 0x10 (runtime size)
        0x80,        // DUP1
        0x60, 0x0c,  // PUSH1 0x0c (runtime offset)
        0x60, 0x00,  // PUSH1 0x00
        0x39,        // CODECOPY
        0x60, 0x00,  // PUSH1 0x00
        0xf3,        // RETURN
        // Runtime code with valid jump
        0x60, 0x06,  // PUSH1 0x06 (jump destination)
        0x56,        // JUMP
        0x00,        // STOP (should be skipped)
        0x00,        // STOP (should be skipped)
        0x5b,        // JUMPDEST (at position 6 in runtime)
        0x60, 0x01,  // PUSH1 0x01
        0x60, 0x00,  // PUSH1 0x00
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 0x20
        0x60, 0x00,  // PUSH1 0x00
        0xf3,        // RETURN
    };
    
    try testor.test_bytecode(&bytecode);
}