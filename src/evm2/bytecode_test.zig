const std = @import("std");
const createBytecode = @import("bytecode.zig").createBytecode;
const Bytecode = @import("bytecode.zig").Bytecode;

test "Bytecode validation - invalid opcode" {
    // Test bytecode with invalid opcode 0xFE
    const code = [_]u8{ 0x60, 0x01, 0xFE }; // PUSH1 0x01 INVALID
    const result = Bytecode.init(&code);
    try std.testing.expectError(error.InvalidOpcode, result);
}

test "Bytecode validation - PUSH extends past end" {
    // PUSH2 but only 1 byte of data available
    const code = [_]u8{ 0x61, 0x42 }; // PUSH2 with only 1 byte
    const result = Bytecode.init(&code);
    try std.testing.expectError(error.TruncatedPush, result);
}

test "Bytecode validation - PUSH32 extends past end" {
    // PUSH32 but not enough data
    var code: [32]u8 = undefined;
    code[0] = 0x7f; // PUSH32
    for (1..32) |i| {
        code[i] = @intCast(i);
    }
    const result = Bytecode.init(&code); // Only 32 bytes, needs 33
    try std.testing.expectError(error.TruncatedPush, result);
}

test "Bytecode validation - Jump to invalid destination" {
    // PUSH1 0x10 JUMP but no JUMPDEST at 0x10
    const code = [_]u8{ 0x60, 0x10, 0x56, 0x00 }; // PUSH1 0x10 JUMP STOP
    const result = Bytecode.init(&code);
    try std.testing.expectError(error.InvalidJumpDestination, result);
}

test "Bytecode validation - Jump to valid JUMPDEST" {
    // PUSH1 0x04 JUMP JUMPDEST STOP
    const code = [_]u8{ 0x60, 0x04, 0x56, 0x00, 0x5b, 0x00 };
    const bytecode = try Bytecode.init(&code);
    try std.testing.expect(bytecode.is_jumpdest != null);
}

test "Bytecode validation - JUMPI to invalid destination" {
    // PUSH1 0x10 PUSH1 0x01 JUMPI but no JUMPDEST at 0x10
    const code = [_]u8{ 0x60, 0x10, 0x60, 0x01, 0x57 }; // PUSH1 0x10 PUSH1 0x01 JUMPI
    const result = Bytecode.init(&code);
    try std.testing.expectError(error.InvalidJumpDestination, result);
}

test "Bytecode validation - empty bytecode is valid" {
    const code = [_]u8{};
    const bytecode = try Bytecode.init(&code);
    try std.testing.expectEqual(@as(usize, 0), bytecode.len());
}

test "Bytecode validation - only STOP is valid" {
    const code = [_]u8{0x00};
    const bytecode = try Bytecode.init(&code);
    try std.testing.expectEqual(@as(usize, 1), bytecode.len());
}

test "Bytecode validation - JUMPDEST inside PUSH data is invalid jump target" {
    // PUSH1 0x03 JUMP [0x5b inside push] JUMPDEST
    const code = [_]u8{ 0x60, 0x03, 0x56, 0x62, 0x5b, 0x5b, 0x5b }; // PUSH1 0x03 JUMP PUSH3 0x5b5b5b
    const result = Bytecode.init(&code);
    try std.testing.expectError(error.InvalidJumpDestination, result);
}

test "Bytecode.getStats - basic stats" {
    // PUSH1 0x05 PUSH1 0x03 ADD STOP
    const code = [_]u8{ 0x60, 0x05, 0x60, 0x03, 0x01, 0x00 };
    const bytecode = try Bytecode.init(&code);
    
    const stats = bytecode.getStats();
    
    // Check opcode counts
    try std.testing.expectEqual(@as(u32, 2), stats.opcode_counts[@intFromEnum(@import("opcode.zig").Opcode.PUSH1)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(@import("opcode.zig").Opcode.ADD)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(@import("opcode.zig").Opcode.STOP)]);
    
    // Check push values
    try std.testing.expectEqual(@as(usize, 2), stats.push_values.len);
    try std.testing.expectEqual(@as(u256, 0x05), stats.push_values[0].value);
    try std.testing.expectEqual(@as(usize, 0), stats.push_values[0].pc);
    try std.testing.expectEqual(@as(u256, 0x03), stats.push_values[1].value);
    try std.testing.expectEqual(@as(usize, 2), stats.push_values[1].pc);
}

test "Bytecode.getStats - potential fusions" {
    // PUSH1 0x04 JUMP JUMPDEST PUSH1 0x10 ADD STOP
    const code = [_]u8{ 0x60, 0x04, 0x56, 0x00, 0x5b, 0x60, 0x10, 0x01, 0x00 };
    const bytecode = try Bytecode.init(&code);
    
    const stats = bytecode.getStats();
    
    // Check for PUSH+JUMP fusion
    try std.testing.expectEqual(@as(usize, 2), stats.potential_fusions.len);
    try std.testing.expectEqual(@as(usize, 0), stats.potential_fusions[0].pc); // PUSH1 at 0
    try std.testing.expectEqual(@import("opcode.zig").Opcode.JUMP, stats.potential_fusions[0].second_opcode);
    
    // Check for PUSH+ADD fusion
    try std.testing.expectEqual(@as(usize, 5), stats.potential_fusions[1].pc); // PUSH1 at 5
    try std.testing.expectEqual(@import("opcode.zig").Opcode.ADD, stats.potential_fusions[1].second_opcode);
}

test "Bytecode.getStats - jumpdests and jumps" {
    // PUSH1 0x08 JUMP PUSH1 0x00 PUSH1 0x00 REVERT JUMPDEST PUSH1 0x0C JUMP JUMPDEST STOP
    const code = [_]u8{ 
        0x60, 0x08, 0x56,       // PUSH1 0x08 JUMP
        0x60, 0x00, 0x60, 0x00, 0xfd, // PUSH1 0x00 PUSH1 0x00 REVERT
        0x5b,                   // JUMPDEST at PC 8
        0x60, 0x0C, 0x56,       // PUSH1 0x0C JUMP
        0x5b,                   // JUMPDEST at PC 12
        0x00                    // STOP
    };
    const bytecode = try Bytecode.init(&code);
    
    const stats = bytecode.getStats();
    
    // Check jumpdests
    try std.testing.expectEqual(@as(usize, 2), stats.jumpdests.len);
    try std.testing.expectEqual(@as(usize, 8), stats.jumpdests[0]);
    try std.testing.expectEqual(@as(usize, 12), stats.jumpdests[1]);
    
    // Check jumps
    try std.testing.expectEqual(@as(usize, 2), stats.jumps.len);
    try std.testing.expectEqual(@as(usize, 2), stats.jumps[0].pc); // JUMP at PC 2
    try std.testing.expectEqual(@as(u256, 0x08), stats.jumps[0].target);
    try std.testing.expectEqual(@as(usize, 10), stats.jumps[1].pc); // JUMP at PC 10
    try std.testing.expectEqual(@as(u256, 0x0C), stats.jumps[1].target);
    
    // Check backwards jumps (none in this example)
    try std.testing.expectEqual(@as(usize, 0), stats.backwards_jumps);
}

test "Bytecode.getStats - backwards jumps (loops)" {
    // JUMPDEST PUSH1 0x01 PUSH1 0x00 JUMP (infinite loop)
    const code = [_]u8{ 
        0x5b,             // JUMPDEST at PC 0
        0x60, 0x01,       // PUSH1 0x01
        0x60, 0x00,       // PUSH1 0x00
        0x56              // JUMP (back to 0)
    };
    const bytecode = try Bytecode.init(&code);
    
    const stats = bytecode.getStats();
    
    // Check backwards jumps
    try std.testing.expectEqual(@as(usize, 1), stats.backwards_jumps);
    try std.testing.expectEqual(@as(usize, 1), stats.jumps.len);
    try std.testing.expectEqual(@as(u256, 0x00), stats.jumps[0].target);
    try std.testing.expectEqual(@as(usize, 5), stats.jumps[0].pc);
}

test "Bytecode.getStats - create code detection" {
    // Bytecode that starts with constructor pattern (returns runtime code)
    // PUSH1 0x10 PUSH1 0x20 PUSH1 0x00 CODECOPY PUSH1 0x10 PUSH1 0x00 RETURN
    const code = [_]u8{ 
        0x60, 0x10,       // PUSH1 0x10 (size)
        0x60, 0x20,       // PUSH1 0x20 (offset in code)
        0x60, 0x00,       // PUSH1 0x00 (dest in memory)
        0x39,             // CODECOPY
        0x60, 0x10,       // PUSH1 0x10 (size)
        0x60, 0x00,       // PUSH1 0x00 (offset in memory)
        0xf3              // RETURN
    };
    const bytecode = try Bytecode.init(&code);
    
    const stats = bytecode.getStats();
    
    // Check if identified as create code
    try std.testing.expect(stats.is_create_code);
}

test "Bytecode.getStats - runtime code detection" {
    // Normal runtime code (no CODECOPY + RETURN pattern)
    const code = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 }; // PUSH1 1 PUSH1 2 ADD STOP
    const bytecode = try Bytecode.init(&code);
    
    const stats = bytecode.getStats();
    
    // Should not be identified as create code
    try std.testing.expect(!stats.is_create_code);
}

test "Bytecode.getStats - all opcode types counted" {
    // Use various opcodes
    const code = [_]u8{ 
        0x60, 0x01,   // PUSH1 1
        0x80,         // DUP1
        0x01,         // ADD
        0x60, 0x20,   // PUSH1 32
        0x52,         // MSTORE
        0x60, 0x20,   // PUSH1 32
        0x51,         // MLOAD
        0x00          // STOP
    };
    const bytecode = try Bytecode.init(&code);
    
    const stats = bytecode.getStats();
    
    // Verify counts
    try std.testing.expectEqual(@as(u32, 3), stats.opcode_counts[@intFromEnum(@import("opcode.zig").Opcode.PUSH1)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(@import("opcode.zig").Opcode.DUP1)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(@import("opcode.zig").Opcode.ADD)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(@import("opcode.zig").Opcode.MSTORE)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(@import("opcode.zig").Opcode.MLOAD)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(@import("opcode.zig").Opcode.STOP)]);
}