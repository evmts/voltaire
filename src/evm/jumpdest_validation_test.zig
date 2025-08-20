const std = @import("std");
const CodeAnalysis = @import("code_analysis.zig").CodeAnalysis;
const OpcodeMetadata = @import("opcode_metadata/opcode_metadata.zig");

test "JUMPDEST not valid inside PUSH data" {
    const allocator = std.testing.allocator;
    
    // Bytecode: PUSH2 0x5B00, JUMPDEST, STOP
    // The 0x5B in PUSH data should NOT be a valid jump destination
    const code = &[_]u8{
        0x61, 0x5B, 0x00,  // PUSH2 0x5B00 (0x5B is at position 1)
        0x5B,              // JUMPDEST at position 3
        0x00,              // STOP
    };
    
    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();
    
    // Position 1 should NOT be valid (it's inside PUSH data)
    try std.testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(1));
    
    // Position 3 should be valid
    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(3));
}

test "Simple jump destination validation" {
    const allocator = std.testing.allocator;
    
    // Code from failing test: 
    // 0x60 0x80 0x60 0x40 0x52 0x34 0x80 0x15 0x61 0x0 0xf
    const code = &[_]u8{
        0x60, 0x80,  // PUSH1 0x80
        0x60, 0x40,  // PUSH1 0x40  
        0x52,        // MSTORE (position 4)
        0x34,        // CALLVALUE (position 5)
        0x80,        // DUP1
        0x15,        // ISZERO
        0x61, 0x00, 0x0f,  // PUSH2 0x000f
    };
    
    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();
    
    // Position 5 should NOT be valid (it's CALLVALUE, not JUMPDEST)
    try std.testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(5));
    
    // No position should be a valid jumpdest in this code
    var valid_count: usize = 0;
    for (0..code.len) |pos| {
        if (analysis.jumpdest_array.is_valid_jumpdest(pos)) {
            valid_count += 1;
        }
    }
    try std.testing.expectEqual(@as(usize, 0), valid_count);
}

test "ERC20 constructor pattern" {
    const allocator = std.testing.allocator;
    
    // Typical Solidity constructor pattern
    const code = &[_]u8{
        0x60, 0x80,     // PUSH1 0x80
        0x60, 0x40,     // PUSH1 0x40
        0x52,           // MSTORE
        0x34,           // CALLVALUE
        0x80,           // DUP1
        0x15,           // ISZERO
        0x60, 0x0F,     // PUSH1 0x0F
        0x57,           // JUMPI
        0x60, 0x00,     // PUSH1 0x00
        0x80,           // DUP1
        0xFD,           // REVERT
        0x5B,           // JUMPDEST at position 0x0F (15)
        0x50,           // POP
        0x60, 0x00,     // PUSH1 0x00
        0x00,           // STOP
    };
    
    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();
    
    // Only position 15 (0x0F) should be valid JUMPDEST
    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(15));
    try std.testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(5));
    
    // Verify only one JUMPDEST
    var jumpdest_count: usize = 0;
    for (0..code.len) |pos| {
        if (analysis.jumpdest_array.is_valid_jumpdest(pos)) {
            jumpdest_count += 1;
        }
    }
    try std.testing.expectEqual(@as(usize, 1), jumpdest_count);
}