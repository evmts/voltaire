const std = @import("std");
const testing = std.testing;
const evm = @import("evm");
const Analysis = evm.CodeAnalysis;
const OpcodeMetadata = evm.OpcodeMetadata;
const Opcode = evm.opcodes.opcode;
const Evm = evm.Evm;
const Frame = evm.Frame;
const Host = evm.Host;
const ExecutionError = evm.ExecutionError;
const MemoryDatabase = evm.MemoryDatabase;
const Address = @import("primitives").Address;

// ============================================================================
// Corner Case Tests for analysis.zig
// ============================================================================

// JUMPDEST Array Corner Cases
// ============================

test "JumpdestArray: single JUMPDEST at position 0" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x5b, // JUMPDEST at 0
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should have jumpdest at position 0
    try testing.expectEqual(@as(usize, 1), analysis.jumpdest_array.positions.len);
    try testing.expectEqual(@as(u15, 0), analysis.jumpdest_array.positions[0]);
    try testing.expect(analysis.jumpdest_array.is_valid_jumpdest(0));
    try testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(1));
}

test "JumpdestArray: consecutive JUMPDESTs" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x5b, // JUMPDEST at 0
        0x5b, // JUMPDEST at 1
        0x5b, // JUMPDEST at 2
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should have all three consecutive jumpdests
    try testing.expectEqual(@as(usize, 3), analysis.jumpdest_array.positions.len);
    try testing.expectEqual(@as(u15, 0), analysis.jumpdest_array.positions[0]);
    try testing.expectEqual(@as(u15, 1), analysis.jumpdest_array.positions[1]);
    try testing.expectEqual(@as(u15, 2), analysis.jumpdest_array.positions[2]);
}

test "JumpdestArray: JUMPDEST at max position (near 24KB limit)" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    // Create bytecode with JUMPDEST near the end
    var bytecode = try allocator.alloc(u8, 1000);
    defer allocator.free(bytecode);
    @memset(bytecode, 0x60); // Fill with PUSH1
    bytecode[998] = 0x5b; // JUMPDEST at 998
    bytecode[999] = 0x00; // STOP
    
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should find jumpdest at position 998
    try testing.expect(analysis.jumpdest_array.is_valid_jumpdest(998));
    try testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(997));
    try testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(999));
}

// PUSH Instruction Edge Cases
// ===========================

test "PUSH0 opcode (EIP-3855)" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x5f, // PUSH0
        0x5f, // PUSH0
        0x01, // ADD
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should process PUSH0 correctly
    try testing.expect(analysis.instructions.len >= 4);
}

test "PUSH with insufficient data bytes at end" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x60, 0x42, // PUSH1 0x42 (complete)
        0x61, 0x12, // PUSH2 with only 1 byte (incomplete)
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle incomplete PUSH gracefully
    try testing.expect(analysis.instructions.len > 0);
}

test "PUSH32 with partial data" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x7f, // PUSH32
        0x11, 0x22, 0x33, 0x44, // Only 4 bytes instead of 32
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle partial PUSH32 data
    try testing.expect(analysis.instructions.len > 0);
}

test "PUSH with data bytes that look like JUMPDEST" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x61, 0x5b, 0x5b, // PUSH2 0x5b5b (data contains JUMPDEST bytes)
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Data bytes 0x5b should NOT be treated as JUMPDEST
    try testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(1));
    try testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(2));
}

test "Consecutive PUSH instructions" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x60, 0x01, // PUSH1 1
        0x60, 0x02, // PUSH1 2
        0x60, 0x03, // PUSH1 3
        0x60, 0x04, // PUSH1 4
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle consecutive pushes
    try testing.expect(analysis.instructions.len >= 5);
}

// Code Boundary Cases
// ===================

test "Code at exactly MAX_CONTRACT_SIZE should fail" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    // Try to create bytecode larger than MAX_CONTRACT_SIZE (24576 bytes)
    const large_bytecode = try allocator.alloc(u8, 24577);
    defer allocator.free(large_bytecode);
    @memset(large_bytecode, 0x00); // Fill with STOP
    
    // Should return error for code too large
    const result = Analysis.from_code(allocator, large_bytecode, table);
    try testing.expectError(error.CodeTooLarge, result);
}

test "Code with only invalid opcodes" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x0c, // Invalid opcode
        0x0d, // Invalid opcode
        0x0e, // Invalid opcode
        0x0f, // Invalid opcode
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle invalid opcodes
    try testing.expect(analysis.instructions.len > 0);
}

test "Code ending with incomplete PUSH" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x5b, // JUMPDEST
        0x63, // PUSH4 (expects 4 bytes but code ends)
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle incomplete PUSH at end
    try testing.expectEqual(@as(usize, 1), analysis.jumpdest_array.positions.len);
}

test "JUMPDEST as last byte" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x60, 0x01, // PUSH1 1
        0x5b, // JUMPDEST at position 2 (last byte)
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should recognize JUMPDEST at end
    try testing.expectEqual(@as(usize, 1), analysis.jumpdest_array.positions.len);
    try testing.expectEqual(@as(u15, 2), analysis.jumpdest_array.positions[0]);
}

// Instruction Stream Optimization Cases
// =====================================

test "PUSH+JUMP fusion with out-of-bounds destination" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x61, 0xFF, 0xFF, // PUSH2 0xFFFF (way out of bounds)
        0x56, // JUMP
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle out-of-bounds jump destination
    try testing.expect(analysis.instructions.len > 0);
}

test "Multiple consecutive fusions" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x60, 0x08, // PUSH1 8
        0x56, // JUMP
        0x60, 0x0C, // PUSH1 12
        0x56, // JUMP
        0x5b, // JUMPDEST at 8
        0x00, // STOP
        0x5b, // JUMPDEST at 12
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle multiple fusions
    try testing.expectEqual(@as(usize, 2), analysis.jumpdest_array.positions.len);
}

test "DUP1+PUSH0+EQ pattern optimization" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x60, 0x01, // PUSH1 1
        0x80, // DUP1
        0x5f, // PUSH0
        0x14, // EQ
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should recognize and optimize the pattern
    try testing.expect(analysis.instructions.len > 0);
}

// Block Analysis Edge Cases
// =========================

test "Block causing stack underflow" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x01, // ADD (requires 2 items, stack empty)
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Analysis should succeed (runtime will catch underflow)
    try testing.expect(analysis.instructions.len > 0);
}

test "Block with maximum stack operations" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    // Create bytecode that pushes many values
    var bytecode = std.ArrayList(u8).init(allocator);
    defer bytecode.deinit();
    
    // Push 100 values
    var i: usize = 0;
    while (i < 100) : (i += 1) {
        try bytecode.appendSlice(&[_]u8{ 0x60, 0x01 }); // PUSH1 1
    }
    try bytecode.append(0x00); // STOP
    
    var analysis = try Analysis.from_code(allocator, bytecode.items, table);
    defer analysis.deinit();
    
    // Should handle many stack operations
    try testing.expect(analysis.instructions.len > 0);
}

test "Empty block (just JUMPDEST and terminator)" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x5b, // JUMPDEST
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle empty block
    try testing.expectEqual(@as(usize, 1), analysis.jumpdest_array.positions.len);
}

test "Self-referential JUMP (infinite loop)" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x5b, // JUMPDEST at 0
        0x60, 0x00, // PUSH1 0
        0x56, // JUMP (back to 0)
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle self-referential jump
    try testing.expectEqual(@as(usize, 1), analysis.jumpdest_array.positions.len);
    try testing.expect(analysis.jumpdest_array.is_valid_jumpdest(0));
}

// Invalid/Malformed Bytecode Cases
// ================================

test "Code with JUMPDEST inside PUSH data (should be invalid)" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x62, // PUSH3
        0x5b, 0x00, 0x5b, // Data contains 0x5b (JUMPDEST opcode)
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // JUMPDEST bytes inside PUSH data should NOT be valid jump destinations
    try testing.expectEqual(@as(usize, 0), analysis.jumpdest_array.positions.len);
    try testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(1));
    try testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(3));
}

test "Mixed valid and invalid opcodes" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x60, 0x01, // PUSH1 1 (valid)
        0x0c, // Invalid opcode
        0x60, 0x02, // PUSH1 2 (valid)
        0x0d, // Invalid opcode
        0x01, // ADD (valid)
        0x00, // STOP (valid)
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle mixed valid/invalid opcodes
    try testing.expect(analysis.instructions.len > 0);
}

// Performance/Stress Cases
// ========================

test "Maximum number of JUMPDESTs" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    // Create bytecode with JUMPDEST every 2 bytes
    var bytecode = std.ArrayList(u8).init(allocator);
    defer bytecode.deinit();
    
    var i: usize = 0;
    while (i < 100) : (i += 1) {
        try bytecode.append(0x5b); // JUMPDEST
        try bytecode.append(0x50); // POP (arbitrary op)
    }
    try bytecode.append(0x00); // STOP
    
    var analysis = try Analysis.from_code(allocator, bytecode.items, table);
    defer analysis.deinit();
    
    // Should handle many JUMPDESTs
    try testing.expectEqual(@as(usize, 100), analysis.jumpdest_array.positions.len);
}

test "Deeply nested conditional jumps" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        // First condition
        0x60, 0x01, // PUSH1 1
        0x60, 0x08, // PUSH1 8
        0x57, // JUMPI
        0x00, // STOP
        // Second condition (nested)
        0x5b, // JUMPDEST at 8
        0x60, 0x01, // PUSH1 1
        0x60, 0x10, // PUSH1 16
        0x57, // JUMPI
        0x00, // STOP
        // Third condition (nested)
        0x5b, // JUMPDEST at 16
        0x60, 0x01, // PUSH1 1
        0x60, 0x18, // PUSH1 24
        0x57, // JUMPI
        0x00, // STOP
        // Final destination
        0x5b, // JUMPDEST at 24
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle nested jumps
    try testing.expectEqual(@as(usize, 3), analysis.jumpdest_array.positions.len);
}

// Special Pattern Cases
// =====================

test "KECCAK256 with immediate size" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0x20, // KECCAK256
        0x00, // STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should optimize KECCAK with immediate size
    try testing.expect(analysis.instructions.len > 0);
}

test "Code with all zeros (STOP opcodes)" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{ 0x00, 0x00, 0x00, 0x00, 0x00 };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should handle all STOPs
    try testing.expect(analysis.instructions.len > 0);
    try testing.expectEqual(@as(usize, 0), analysis.jumpdest_array.positions.len);
}

test "Alternating JUMPDEST and STOP" {
    const allocator = testing.allocator;
    const table = &OpcodeMetadata.DEFAULT;
    
    const bytecode = &[_]u8{
        0x5b, 0x00, // JUMPDEST, STOP
        0x5b, 0x00, // JUMPDEST, STOP
        0x5b, 0x00, // JUMPDEST, STOP
    };
    var analysis = try Analysis.from_code(allocator, bytecode, table);
    defer analysis.deinit();
    
    // Should find all JUMPDESTs at even positions
    try testing.expectEqual(@as(usize, 3), analysis.jumpdest_array.positions.len);
    try testing.expectEqual(@as(u15, 0), analysis.jumpdest_array.positions[0]);
    try testing.expectEqual(@as(u15, 2), analysis.jumpdest_array.positions[1]);
    try testing.expectEqual(@as(u15, 4), analysis.jumpdest_array.positions[2]);
}

// E2E Tests with Corner Cases
// ===========================

test "E2E: Jump to JUMPDEST at position 0" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    var vm = try Evm.init(allocator, memory_db.to_database_interface(), null, null, null, 0, false, null);
    defer vm.deinit();
    
    const bytecode = &[_]u8{
        0x5b, // JUMPDEST at 0
        0x60, 0x42, // PUSH1 0x42
        0x60, 0x00, // PUSH1 0
        0x52, // MSTORE
        0x60, 0x00, // PUSH1 0 (jump to start)
        0x56, // JUMP
    };
    
    const contract_addr = Address.from_u256(0x1000);
    try vm.state.set_code(contract_addr, bytecode);
    
    const params = evm.CallParams{
        .call = .{
            .caller = Address.ZERO,
            .to = contract_addr,
            .value = 0,
            .input = &[_]u8{},
            .gas = 1000, // Limited gas to prevent infinite loop
        },
    };
    
    const result = try vm.call(params);
    defer if (result.output) |output| 
    
    // Should run out of gas due to infinite loop
    try testing.expect(!result.success);
}

test "E2E: Contract with maximum stack pushes" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    var vm = try Evm.init(allocator, memory_db.to_database_interface(), null, null, null, 0, false, null);
    defer vm.deinit();
    
    // Create bytecode that pushes 1025 values (exceeds 1024 limit)
    var bytecode = std.ArrayList(u8).init(allocator);
    defer bytecode.deinit();
    
    var i: usize = 0;
    while (i < 1025) : (i += 1) {
        try bytecode.appendSlice(&[_]u8{ 0x60, 0x01 }); // PUSH1 1
    }
    try bytecode.append(0x00); // STOP
    
    const contract_addr = Address.from_u256(0x1000);
    try vm.state.set_code(contract_addr, bytecode.items);
    
    const params = evm.CallParams{
        .call = .{
            .caller = Address.ZERO,
            .to = contract_addr,
            .value = 0,
            .input = &[_]u8{},
            .gas = 10000000,
        },
    };
    
    const result = try vm.call(params);
    defer if (result.output) |output| 
    
    // Should fail with stack overflow
    try testing.expect(!result.success);
}