/// Bytecode utilities and validation
/// This module provides abstractions for working with EVM bytecode,
/// including jump destination analysis and bytecode traversal.
const std = @import("std");
const Opcode = @import("../Opcode/opcode.zig").Opcode;
const opcode_info = @import("../Opcode/opcode_info.zig");

pub const FusionType = enum {
    push_jump,
    push_jumpi,
    push_add,
    push_mul,
    push_sub,
    push_div,
    dup_swap,
    swap_pop,
    push_dup,
    push_swap,
};

pub const FusionPattern = struct {
    fusion_type: FusionType,
    pc: u32,
    length: u8,
};

/// Represents analyzed bytecode with pre-validated jump destinations
pub const Bytecode = struct {
    /// Raw bytecode bytes
    code: []const u8,

    /// Pre-analyzed valid JUMPDEST positions
    valid_jumpdests: std.AutoArrayHashMap(u32, void),

    /// Initialize bytecode with jump destination analysis
    pub fn init(allocator: std.mem.Allocator, code: []const u8) !Bytecode {
        var valid_jumpdests = std.AutoArrayHashMap(u32, void).init(allocator);
        errdefer valid_jumpdests.deinit();

        try analyzeJumpDests(code, &valid_jumpdests);

        return Bytecode{
            .code = code,
            .valid_jumpdests = valid_jumpdests,
        };
    }

    /// Create Bytecode from raw bytes (alias for init)
    pub fn fromUint8Array(allocator: std.mem.Allocator, bytes: []const u8) !Bytecode {
        return init(allocator, bytes);
    }

    /// Clean up resources
    pub fn deinit(self: *Bytecode) void {
        self.valid_jumpdests.deinit();
    }

    /// Check if a position is a valid JUMPDEST
    pub fn isValidJumpDest(self: *const Bytecode, pc: u32) bool {
        return self.valid_jumpdests.contains(pc);
    }

    /// Get bytecode length
    pub fn len(self: *const Bytecode) usize {
        return self.code.len;
    }

    /// Get opcode byte at position
    pub fn getOpcode(self: *const Bytecode, pc: u32) ?u8 {
        if (pc >= self.code.len) {
            return null;
        }
        return self.code[pc];
    }

    /// Get typed Opcode enum at position
    pub fn getOpcodeEnum(self: *const Bytecode, pc: u32) ?Opcode {
        const byte = self.getOpcode(pc) orelse return null;
        return @enumFromInt(byte);
    }

    /// Read immediate data for PUSH operations
    /// Returns the N bytes following the current PC (for PUSHN instructions)
    pub fn readImmediate(self: *const Bytecode, pc: u32, size: u8) ?u256 {
        const pc_usize: usize = @intCast(pc);
        const size_usize: usize = size;

        // Check if we have enough bytes: current position + 1 (opcode) + size
        if (pc_usize + 1 + size_usize > self.code.len) {
            return null;
        }

        var result: u256 = 0;
        var i: u8 = 0;
        while (i < size) : (i += 1) {
            const idx: usize = pc_usize + 1 + i;
            result = (result << 8) | self.code[idx];
        }
        return result;
    }

    /// Calculate total static gas cost for all bytecode
    /// Sums gas costs of all opcodes, treating PUSH immediates correctly
    pub fn analyzeGasTotal(self: *const Bytecode) u64 {
        var total: u64 = 0;
        var pc: u32 = 0;

        while (pc < self.code.len) {
            const op = self.code[pc];

            // Add gas cost for this opcode
            total += opcode_info.OPCODE_INFO[op].gas_cost;

            // Skip PUSH immediate data
            if (op >= 0x60 and op <= 0x7f) {
                // PUSH1 (0x60) through PUSH32 (0x7f)
                // Skip: 1 (opcode) + (op - 0x5f) (immediate bytes)
                pc += 1 + (op - 0x5f);
            } else {
                pc += 1;
            }
        }

        return total;
    }

    /// Detect fusion patterns in bytecode
    /// Caller owns returned slice, must free with allocator
    pub fn detectFusions(self: *const Bytecode, allocator: std.mem.Allocator) ![]FusionPattern {
        var fusions = std.ArrayList(FusionPattern).init(allocator);
        errdefer fusions.deinit();

        var pc: u32 = 0;
        while (pc < self.code.len) {
            const opcode = self.code[pc];

            // Check for PUSH (0x60-0x7f)
            if (opcode >= 0x60 and opcode <= 0x7f) {
                const push_size = opcode - 0x5f;
                const next_pc: u32 = pc + 1 + push_size;

                // Check for PUSH + JUMP (0x56)
                if (next_pc < self.code.len and self.code[next_pc] == 0x56) {
                    try fusions.append(FusionPattern{
                        .fusion_type = .push_jump,
                        .pc = pc,
                        .length = 1 + push_size + 1,
                    });
                    pc = next_pc + 1;
                    continue;
                }

                // Check for PUSH + JUMPI (0x57)
                if (next_pc < self.code.len and self.code[next_pc] == 0x57) {
                    try fusions.append(FusionPattern{
                        .fusion_type = .push_jumpi,
                        .pc = pc,
                        .length = 1 + push_size + 1,
                    });
                    pc = next_pc + 1;
                    continue;
                }

                // Check for PUSH + ADD (0x01)
                if (next_pc < self.code.len and self.code[next_pc] == 0x01) {
                    try fusions.append(FusionPattern{
                        .fusion_type = .push_add,
                        .pc = pc,
                        .length = 1 + push_size + 1,
                    });
                    pc = next_pc + 1;
                    continue;
                }

                // Check for PUSH + MUL (0x02)
                if (next_pc < self.code.len and self.code[next_pc] == 0x02) {
                    try fusions.append(FusionPattern{
                        .fusion_type = .push_mul,
                        .pc = pc,
                        .length = 1 + push_size + 1,
                    });
                    pc = next_pc + 1;
                    continue;
                }

                // Check for PUSH + SUB (0x03)
                if (next_pc < self.code.len and self.code[next_pc] == 0x03) {
                    try fusions.append(FusionPattern{
                        .fusion_type = .push_sub,
                        .pc = pc,
                        .length = 1 + push_size + 1,
                    });
                    pc = next_pc + 1;
                    continue;
                }

                // Check for PUSH + DIV (0x04)
                if (next_pc < self.code.len and self.code[next_pc] == 0x04) {
                    try fusions.append(FusionPattern{
                        .fusion_type = .push_div,
                        .pc = pc,
                        .length = 1 + push_size + 1,
                    });
                    pc = next_pc + 1;
                    continue;
                }

                // Check for PUSH + DUP (0x80-0x8f)
                if (next_pc < self.code.len and self.code[next_pc] >= 0x80 and self.code[next_pc] <= 0x8f) {
                    try fusions.append(FusionPattern{
                        .fusion_type = .push_dup,
                        .pc = pc,
                        .length = 1 + push_size + 1,
                    });
                    pc = next_pc + 1;
                    continue;
                }

                // Check for PUSH + SWAP (0x90-0x9f)
                if (next_pc < self.code.len and self.code[next_pc] >= 0x90 and self.code[next_pc] <= 0x9f) {
                    try fusions.append(FusionPattern{
                        .fusion_type = .push_swap,
                        .pc = pc,
                        .length = 1 + push_size + 1,
                    });
                    pc = next_pc + 1;
                    continue;
                }

                // No pattern match, skip past PUSH and its data
                pc = next_pc;
                continue;
            }

            // Check for DUP (0x80-0x8f) + SWAP (0x90-0x9f)
            if (opcode >= 0x80 and opcode <= 0x8f) {
                if (pc + 1 < self.code.len and self.code[pc + 1] >= 0x90 and self.code[pc + 1] <= 0x9f) {
                    try fusions.append(FusionPattern{
                        .fusion_type = .dup_swap,
                        .pc = pc,
                        .length = 2,
                    });
                    pc += 2;
                    continue;
                }
            }

            // Check for SWAP (0x90-0x9f) + POP (0x50)
            if (opcode >= 0x90 and opcode <= 0x9f) {
                if (pc + 1 < self.code.len and self.code[pc + 1] == 0x50) {
                    try fusions.append(FusionPattern{
                        .fusion_type = .swap_pop,
                        .pc = pc,
                        .length = 2,
                    });
                    pc += 2;
                    continue;
                }
            }

            pc += 1;
        }

        return fusions.toOwnedSlice();
    }

    /// Calculate next program counter after instruction at current_pc
    /// Returns null if at end of bytecode or invalid PC
    /// For PUSH instructions, skips over the immediate data bytes
    pub fn getNextPc(self: *const Bytecode, current_pc: u32) ?u32 {
        // Check if current_pc is beyond bytecode
        if (current_pc >= self.code.len) {
            return null;
        }

        const opcode = self.code[current_pc];

        // Calculate next_pc based on opcode type
        var next_pc: u32 = undefined;
        if (opcode >= 0x60 and opcode <= 0x7f) {
            // PUSH1 (0x60) through PUSH32 (0x7f)
            // push_size = opcode - 0x5f (e.g., PUSH1 = 1, PUSH32 = 32)
            const push_size = opcode - 0x5f;
            next_pc = current_pc + 1 + push_size;
        } else {
            // All other opcodes are single byte
            next_pc = current_pc + 1;
        }

        // Check if next_pc would be beyond bytecode
        if (next_pc >= self.code.len) {
            return null;
        }

        return next_pc;
    }

    /// Create scanner iterator
    pub fn scan(self: *const Bytecode, start_pc: u32, end_pc: u32) Scanner {
        return Scanner.init(self, start_pc, end_pc);
    }
};

/// Instruction with metadata parsed from bytecode
pub const Instruction = struct {
    /// Program counter (position of opcode)
    pc: u32,
    /// Opcode byte
    opcode: u8,
    /// Instruction size (1 for non-PUSH, 1 + push_size for PUSH)
    size: u8,
    /// Immediate value for PUSH instructions (null for non-PUSH)
    push_value: ?u256,
};

/// Iterator for scanning through bytecode instructions
pub const Scanner = struct {
    bytecode: *const Bytecode,
    pc: u32,
    end_pc: u32,

    /// Initialize scanner with start and end positions
    pub fn init(bytecode: *const Bytecode, start_pc: u32, end_pc: u32) Scanner {
        return Scanner{
            .bytecode = bytecode,
            .pc = start_pc,
            .end_pc = @min(end_pc, @as(u32, @intCast(bytecode.len()))),
        };
    }

    /// Get next instruction, advancing PC
    pub fn next(self: *Scanner) ?Instruction {
        if (self.pc >= self.end_pc) {
            return null;
        }

        const opcode = self.bytecode.getOpcode(self.pc) orelse return null;
        var size: u8 = 1;
        var push_value: ?u256 = null;

        // Check if PUSH1 (0x60) through PUSH32 (0x7f)
        if (opcode >= 0x60 and opcode <= 0x7f) {
            const push_size = opcode - 0x5f;
            size = 1 + push_size;

            // Read immediate value if available
            if (self.bytecode.readImmediate(self.pc, push_size)) |value| {
                push_value = value;
            }
        }

        const instr = Instruction{
            .pc = self.pc,
            .opcode = opcode,
            .size = size,
            .push_value = push_value,
        };

        self.pc += size;

        return instr;
    }
};

/// Analyze bytecode to identify valid JUMPDEST locations
/// This must skip over PUSH instruction immediate data to avoid
/// treating data bytes as instructions
fn analyzeJumpDests(code: []const u8, valid_jumpdests: *std.AutoArrayHashMap(u32, void)) !void {
    var pc: u32 = 0;

    while (pc < code.len) {
        const opcode = code[pc];

        // Check if this is a JUMPDEST (0x5b)
        if (opcode == 0x5b) {
            try valid_jumpdests.put(pc, {});
            pc += 1;
        } else if (opcode >= 0x60 and opcode <= 0x7f) {
            // PUSH1 (0x60) through PUSH32 (0x7f)
            // Calculate number of bytes to push: opcode - 0x5f
            // e.g., PUSH1 (0x60) = 0x60 - 0x5f = 1 byte
            //       PUSH32 (0x7f) = 0x7f - 0x5f = 32 bytes
            const push_size = opcode - 0x5f;

            // Skip the PUSH opcode itself and all its immediate data bytes
            // This prevents treating immediate data as opcodes
            pc += 1 + push_size;
        } else {
            // All other opcodes are single byte
            pc += 1;
        }
    }
}

test "analyzeJumpDests: simple JUMPDEST" {
    const code = [_]u8{ 0x5b, 0x00, 0x5b }; // JUMPDEST, STOP, JUMPDEST
    var valid_jumpdests = std.AutoArrayHashMap(u32, void).init(std.testing.allocator);
    defer valid_jumpdests.deinit();

    try analyzeJumpDests(&code, &valid_jumpdests);

    try std.testing.expect(valid_jumpdests.contains(0));
    try std.testing.expect(valid_jumpdests.contains(2));
    try std.testing.expect(!valid_jumpdests.contains(1));
}

test "analyzeJumpDests: PUSH data containing JUMPDEST opcode" {
    const code = [_]u8{
        0x60, 0x5b, // PUSH1 0x5b (pushes JUMPDEST opcode as data)
        0x5b, // JUMPDEST (actual valid jump destination)
    };
    var valid_jumpdests = std.AutoArrayHashMap(u32, void).init(std.testing.allocator);
    defer valid_jumpdests.deinit();

    try analyzeJumpDests(&code, &valid_jumpdests);

    // Only position 2 should be valid (the actual JUMPDEST)
    // Position 1 (the 0x5b in PUSH data) should NOT be valid
    try std.testing.expect(!valid_jumpdests.contains(0));
    try std.testing.expect(!valid_jumpdests.contains(1));
    try std.testing.expect(valid_jumpdests.contains(2));
}

test "analyzeJumpDests: PUSH32 with embedded JUMPDEST bytes" {
    var code: [34]u8 = undefined;
    code[0] = 0x7f; // PUSH32
    // Fill with 32 bytes of data, including some 0x5b (JUMPDEST) bytes
    for (1..33) |i| {
        code[i] = if (i % 2 == 0) 0x5b else 0x00;
    }
    code[33] = 0x5b; // Actual JUMPDEST after PUSH32

    var valid_jumpdests = std.AutoArrayHashMap(u32, void).init(std.testing.allocator);
    defer valid_jumpdests.deinit();

    try analyzeJumpDests(&code, &valid_jumpdests);

    // Only position 33 should be valid
    try std.testing.expect(!valid_jumpdests.contains(0));
    for (1..33) |i| {
        try std.testing.expect(!valid_jumpdests.contains(@intCast(i)));
    }
    try std.testing.expect(valid_jumpdests.contains(33));
}

test "Bytecode: initialization and queries" {
    const code = [_]u8{ 0x60, 0x01, 0x5b, 0x00 }; // PUSH1 1, JUMPDEST, STOP

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(usize, 4), bytecode.len());
    try std.testing.expect(!bytecode.isValidJumpDest(0));
    try std.testing.expect(!bytecode.isValidJumpDest(1));
    try std.testing.expect(bytecode.isValidJumpDest(2));
    try std.testing.expect(!bytecode.isValidJumpDest(3));
}

test "Bytecode: readImmediate" {
    const code = [_]u8{ 0x60, 0xff, 0x61, 0x12, 0x34 }; // PUSH1 0xff, PUSH2 0x1234

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // Read PUSH1 immediate (1 byte)
    if (bytecode.readImmediate(0, 1)) |value| {
        try std.testing.expectEqual(@as(u256, 0xff), value);
    } else {
        try std.testing.expect(false); // Should not be null
    }

    // Read PUSH2 immediate (2 bytes)
    if (bytecode.readImmediate(2, 2)) |value| {
        try std.testing.expectEqual(@as(u256, 0x1234), value);
    } else {
        try std.testing.expect(false); // Should not be null
    }

    // Try to read beyond bytecode (should return null)
    try std.testing.expect(bytecode.readImmediate(3, 2) == null);
}

test "Bytecode.init: empty bytecode" {
    const code = [_]u8{};

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(usize, 0), bytecode.len());
    try std.testing.expect(!bytecode.isValidJumpDest(0));
}

test "Bytecode.init: no valid jump destinations" {
    const code = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 }; // PUSH1 1, PUSH1 2, ADD, STOP

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(usize, 6), bytecode.len());
    try std.testing.expect(!bytecode.isValidJumpDest(0));
    try std.testing.expect(!bytecode.isValidJumpDest(1));
    try std.testing.expect(!bytecode.isValidJumpDest(2));
    try std.testing.expect(!bytecode.isValidJumpDest(3));
    try std.testing.expect(!bytecode.isValidJumpDest(4));
    try std.testing.expect(!bytecode.isValidJumpDest(5));
}

test "Bytecode.init: multiple consecutive JUMPDESTs" {
    const code = [_]u8{ 0x5b, 0x5b, 0x5b, 0x00 }; // JUMPDEST, JUMPDEST, JUMPDEST, STOP

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expect(bytecode.isValidJumpDest(0));
    try std.testing.expect(bytecode.isValidJumpDest(1));
    try std.testing.expect(bytecode.isValidJumpDest(2));
    try std.testing.expect(!bytecode.isValidJumpDest(3));
}

test "Bytecode.deinit: memory cleanup" {
    const code = [_]u8{ 0x5b, 0x60, 0x01, 0x5b, 0x00 }; // JUMPDEST, PUSH1 1, JUMPDEST, STOP

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    bytecode.deinit();

    // If memory cleanup is incorrect, this would fail in debug builds
    // Testing that deinit completes without error
}

test "Bytecode.isValidJumpDest: boundary checks" {
    const code = [_]u8{ 0x5b, 0x00 }; // JUMPDEST, STOP

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expect(bytecode.isValidJumpDest(0));
    try std.testing.expect(!bytecode.isValidJumpDest(1));
    try std.testing.expect(!bytecode.isValidJumpDest(2));
    try std.testing.expect(!bytecode.isValidJumpDest(100));
    try std.testing.expect(!bytecode.isValidJumpDest(0xffffffff));
}

test "Bytecode.readImmediate: PUSH1 edge cases" {
    const code = [_]u8{ 0x60, 0x00, 0x60, 0xff }; // PUSH1 0x00, PUSH1 0xff

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // PUSH1 with zero value
    if (bytecode.readImmediate(0, 1)) |value| {
        try std.testing.expectEqual(@as(u256, 0x00), value);
    } else {
        try std.testing.expect(false);
    }

    // PUSH1 with max byte value
    if (bytecode.readImmediate(2, 1)) |value| {
        try std.testing.expectEqual(@as(u256, 0xff), value);
    } else {
        try std.testing.expect(false);
    }
}

test "Bytecode.readImmediate: PUSH32 full word" {
    var code: [33]u8 = undefined;
    code[0] = 0x7f; // PUSH32
    // Fill with max value bytes
    for (1..33) |i| {
        code[i] = 0xff;
    }

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    if (bytecode.readImmediate(0, 32)) |value| {
        try std.testing.expectEqual(@as(u256, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff), value);
    } else {
        try std.testing.expect(false);
    }
}

test "Bytecode.readImmediate: PUSH32 with zeros" {
    var code: [33]u8 = undefined;
    code[0] = 0x7f; // PUSH32
    // Fill with zeros
    for (1..33) |i| {
        code[i] = 0x00;
    }

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    if (bytecode.readImmediate(0, 32)) |value| {
        try std.testing.expectEqual(@as(u256, 0), value);
    } else {
        try std.testing.expect(false);
    }
}

test "Bytecode.readImmediate: various PUSH sizes" {
    // Test PUSH1 through PUSH8
    const code = [_]u8{
        0x60, 0x01, // PUSH1 0x01
        0x61, 0x01, 0x02, // PUSH2 0x0102
        0x62, 0x01, 0x02, 0x03, // PUSH3 0x010203
        0x63, 0x01, 0x02, 0x03, 0x04, // PUSH4 0x01020304
        0x67, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, // PUSH8 0x0102030405060708
    };

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // PUSH1
    if (bytecode.readImmediate(0, 1)) |value| {
        try std.testing.expectEqual(@as(u256, 0x01), value);
    } else {
        try std.testing.expect(false);
    }

    // PUSH2
    if (bytecode.readImmediate(2, 2)) |value| {
        try std.testing.expectEqual(@as(u256, 0x0102), value);
    } else {
        try std.testing.expect(false);
    }

    // PUSH3
    if (bytecode.readImmediate(5, 3)) |value| {
        try std.testing.expectEqual(@as(u256, 0x010203), value);
    } else {
        try std.testing.expect(false);
    }

    // PUSH4
    if (bytecode.readImmediate(9, 4)) |value| {
        try std.testing.expectEqual(@as(u256, 0x01020304), value);
    } else {
        try std.testing.expect(false);
    }

    // PUSH8
    if (bytecode.readImmediate(14, 8)) |value| {
        try std.testing.expectEqual(@as(u256, 0x0102030405060708), value);
    } else {
        try std.testing.expect(false);
    }
}

test "Bytecode.readImmediate: boundary overflow protection" {
    const code = [_]u8{ 0x60, 0x01 }; // PUSH1 0x01

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // Try to read more bytes than available
    try std.testing.expect(bytecode.readImmediate(0, 2) == null);
    try std.testing.expect(bytecode.readImmediate(1, 1) == null);
    try std.testing.expect(bytecode.readImmediate(0, 32) == null);
}

test "Bytecode.readImmediate: at end of bytecode" {
    const code = [_]u8{ 0x60, 0x01, 0x60 }; // PUSH1 0x01, PUSH1 (incomplete)

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // First PUSH1 should work
    if (bytecode.readImmediate(0, 1)) |value| {
        try std.testing.expectEqual(@as(u256, 0x01), value);
    } else {
        try std.testing.expect(false);
    }

    // Second PUSH1 is incomplete (no immediate data)
    try std.testing.expect(bytecode.readImmediate(2, 1) == null);
}

test "analyzeJumpDests: PUSH inside PUSH data should not be treated as instruction" {
    const code = [_]u8{
        0x61, 0x60, 0x5b, // PUSH2 0x605b (contains PUSH1 opcode and JUMPDEST opcode as data)
        0x5b, // JUMPDEST (actual valid jump destination)
    };
    var valid_jumpdests = std.AutoArrayHashMap(u32, void).init(std.testing.allocator);
    defer valid_jumpdests.deinit();

    try analyzeJumpDests(&code, &valid_jumpdests);

    // Only position 3 should be valid
    try std.testing.expect(!valid_jumpdests.contains(0));
    try std.testing.expect(!valid_jumpdests.contains(1));
    try std.testing.expect(!valid_jumpdests.contains(2));
    try std.testing.expect(valid_jumpdests.contains(3));
}

test "analyzeJumpDests: incomplete PUSH at end of bytecode" {
    const code = [_]u8{
        0x5b, // JUMPDEST
        0x62, 0x01, // PUSH3 with only 2 bytes (incomplete)
    };
    var valid_jumpdests = std.AutoArrayHashMap(u32, void).init(std.testing.allocator);
    defer valid_jumpdests.deinit();

    try analyzeJumpDests(&code, &valid_jumpdests);

    // Only position 0 should be valid
    try std.testing.expect(valid_jumpdests.contains(0));
    try std.testing.expect(!valid_jumpdests.contains(1));
    try std.testing.expect(!valid_jumpdests.contains(2));
}

test "analyzeJumpDests: all PUSH opcodes PUSH1-PUSH32" {
    // Create bytecode with all PUSH opcodes followed by JUMPDEST
    var code: [32 * 34 + 1]u8 = undefined;
    var offset: usize = 0;

    // PUSH1 through PUSH32
    var push_num: u8 = 1;
    while (push_num <= 32) : (push_num += 1) {
        const opcode: u8 = 0x5f + push_num; // PUSH1 = 0x60, PUSH2 = 0x61, ..., PUSH32 = 0x7f
        code[offset] = opcode;
        offset += 1;

        // Fill with dummy data
        var i: u8 = 0;
        while (i < push_num) : (i += 1) {
            code[offset] = 0xaa;
            offset += 1;
        }
    }

    // Add final JUMPDEST
    code[offset] = 0x5b;
    const final_jumpdest_pos: u32 = @intCast(offset);

    var valid_jumpdests = std.AutoArrayHashMap(u32, void).init(std.testing.allocator);
    defer valid_jumpdests.deinit();

    try analyzeJumpDests(&code, &valid_jumpdests);

    // Only the final position should be a valid JUMPDEST
    try std.testing.expect(valid_jumpdests.contains(final_jumpdest_pos));

    // Verify none of the PUSH data bytes are treated as JUMPDEST
    var pos: u32 = 0;
    while (pos < final_jumpdest_pos) : (pos += 1) {
        try std.testing.expect(!valid_jumpdests.contains(pos));
    }
}

test "Bytecode.getOpcode: boundary checks" {
    const code = [_]u8{ 0x60, 0x01, 0x5b }; // PUSH1 1, JUMPDEST

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u8, 0x60), bytecode.getOpcode(0).?);
    try std.testing.expectEqual(@as(u8, 0x01), bytecode.getOpcode(1).?);
    try std.testing.expectEqual(@as(u8, 0x5b), bytecode.getOpcode(2).?);
    try std.testing.expect(bytecode.getOpcode(3) == null);
    try std.testing.expect(bytecode.getOpcode(100) == null);
}

test "Bytecode.getOpcodeEnum: valid opcodes" {
    const code = [_]u8{ 0x60, 0x01, 0x5b, 0x00 }; // PUSH1 1, JUMPDEST, STOP

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(Opcode.PUSH1, bytecode.getOpcodeEnum(0).?);
    try std.testing.expectEqual(@as(u8, 0x01), @intFromEnum(bytecode.getOpcodeEnum(1).?));
    try std.testing.expectEqual(Opcode.JUMPDEST, bytecode.getOpcodeEnum(2).?);
    try std.testing.expectEqual(Opcode.STOP, bytecode.getOpcodeEnum(3).?);
    try std.testing.expect(bytecode.getOpcodeEnum(4) == null);
}

test "Bytecode: large bytecode performance" {
    // Create a large bytecode (10KB) with scattered JUMPDESTs
    const allocator = std.testing.allocator;
    const size = 10 * 1024;
    const code = try allocator.alloc(u8, size);
    defer allocator.free(code);

    // Fill with various opcodes including JUMPDESTs every 100 bytes
    for (0..size) |i| {
        if (i % 100 == 0) {
            code[i] = 0x5b; // JUMPDEST
        } else if (i % 50 == 0) {
            code[i] = 0x60; // PUSH1
        } else {
            code[i] = 0x00; // STOP
        }
    }

    var bytecode = try Bytecode.init(allocator, code);
    defer bytecode.deinit();

    try std.testing.expectEqual(size, bytecode.len());

    // Verify some JUMPDESTs
    try std.testing.expect(bytecode.isValidJumpDest(0));
    try std.testing.expect(bytecode.isValidJumpDest(100));
    try std.testing.expect(bytecode.isValidJumpDest(200));
    try std.testing.expect(!bytecode.isValidJumpDest(50));
    try std.testing.expect(!bytecode.isValidJumpDest(150));
}

test "Bytecode: complex real-world-like bytecode" {
    // Simulate a more complex bytecode pattern like a simple contract
    // Position calculation:
    // 0-1: PUSH1 0x80, 2-3: PUSH1 0x40, 4: MSTORE, 5: JUMPDEST,
    // 6-7: PUSH1 0x00, 8: CALLDATALOAD, 9-10: PUSH1 0xe0, 11: SHR,
    // 12-16: PUSH4 0x12345678, 17: JUMPDEST, 18: EQ,
    // 19-21: PUSH2 0x001e, 22: JUMPI, 23: JUMPDEST, 24: STOP
    const code = [_]u8{
        // Constructor-like pattern
        0x60, 0x80, // PUSH1 0x80 (pos 0-1)
        0x60, 0x40, // PUSH1 0x40 (pos 2-3)
        0x52, // MSTORE (pos 4)
        0x5b, // JUMPDEST (pos 5)
        0x60, 0x00, // PUSH1 0x00 (pos 6-7)
        0x35, // CALLDATALOAD (pos 8)
        0x60, 0xe0, // PUSH1 0xe0 (pos 9-10)
        0x1c, // SHR (pos 11)
        0x63, 0x12, 0x34, 0x56, 0x78, // PUSH4 0x12345678 (pos 12-16)
        0x5b, // JUMPDEST (pos 17)
        0x14, // EQ (pos 18)
        0x61, 0x00, 0x1e, // PUSH2 0x001e (pos 19-21)
        0x57, // JUMPI (pos 22)
        0x5b, // JUMPDEST (pos 23)
        0x00, // STOP (pos 24)
    };

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // Verify JUMPDESTs at correct positions
    try std.testing.expect(bytecode.isValidJumpDest(5));
    try std.testing.expect(bytecode.isValidJumpDest(17));
    try std.testing.expect(bytecode.isValidJumpDest(23));

    // Verify non-JUMPDESTs
    try std.testing.expect(!bytecode.isValidJumpDest(0));
    try std.testing.expect(!bytecode.isValidJumpDest(7));
    try std.testing.expect(!bytecode.isValidJumpDest(15)); // Inside PUSH4 data
    try std.testing.expect(!bytecode.isValidJumpDest(20)); // Inside PUSH2 data

    // Test readImmediate for various PUSH operations
    if (bytecode.readImmediate(0, 1)) |value| {
        try std.testing.expectEqual(@as(u256, 0x80), value);
    } else {
        try std.testing.expect(false);
    }

    if (bytecode.readImmediate(12, 4)) |value| {
        try std.testing.expectEqual(@as(u256, 0x12345678), value);
    } else {
        try std.testing.expect(false);
    }

    if (bytecode.readImmediate(19, 2)) |value| {
        try std.testing.expectEqual(@as(u256, 0x001e), value);
    } else {
        try std.testing.expect(false);
    }
}

test "Bytecode: PUSH32 followed immediately by JUMPDEST" {
    var code: [34]u8 = undefined;
    code[0] = 0x7f; // PUSH32
    for (1..33) |i| {
        code[i] = @intCast(i);
    }
    code[33] = 0x5b; // JUMPDEST

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // Only position 33 should be JUMPDEST
    try std.testing.expect(!bytecode.isValidJumpDest(0));
    for (1..33) |i| {
        try std.testing.expect(!bytecode.isValidJumpDest(@intCast(i)));
    }
    try std.testing.expect(bytecode.isValidJumpDest(33));

    // Verify PUSH32 data can be read
    if (bytecode.readImmediate(0, 32)) |value| {
        var expected: u256 = 0;
        for (1..33) |i| {
            expected = (expected << 8) | i;
        }
        try std.testing.expectEqual(expected, value);
    } else {
        try std.testing.expect(false);
    }
}

test "Bytecode: bytecode ending with incomplete PUSH should not crash" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 0x01 (complete)
        0x61, 0x02, // PUSH2 0x02?? (incomplete, missing 1 byte)
    };

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(usize, 4), bytecode.len());

    // First PUSH1 should work
    if (bytecode.readImmediate(0, 1)) |value| {
        try std.testing.expectEqual(@as(u256, 0x01), value);
    } else {
        try std.testing.expect(false);
    }

    // Second PUSH2 is incomplete
    try std.testing.expect(bytecode.readImmediate(2, 2) == null);

    // No crashes during jump dest analysis
    try std.testing.expect(!bytecode.isValidJumpDest(0));
    try std.testing.expect(!bytecode.isValidJumpDest(2));
}

test "Bytecode.getNextPc: regular opcode (ADD)" {
    const code = [_]u8{ 0x01, 0x00 }; // ADD, STOP
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // ADD at pc 0 should jump to pc 1
    if (bytecode.getNextPc(0)) |next_pc| {
        try std.testing.expectEqual(@as(u32, 1), next_pc);
    } else {
        try std.testing.expect(false);
    }
}

test "Bytecode.getNextPc: PUSH1 instruction" {
    const code = [_]u8{ 0x60, 0xff, 0x00 }; // PUSH1 0xff, STOP
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // PUSH1 at pc 0 should jump to pc 2 (skip 1 byte immediate)
    if (bytecode.getNextPc(0)) |next_pc| {
        try std.testing.expectEqual(@as(u32, 2), next_pc);
    } else {
        try std.testing.expect(false);
    }
}

test "Bytecode.getNextPc: PUSH32 instruction" {
    var code: [34]u8 = undefined;
    code[0] = 0x7f; // PUSH32
    for (1..33) |i| {
        code[i] = @intCast(i);
    }
    code[33] = 0x00; // STOP

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // PUSH32 at pc 0 should jump to pc 33 (skip 32 bytes immediate)
    if (bytecode.getNextPc(0)) |next_pc| {
        try std.testing.expectEqual(@as(u32, 33), next_pc);
    } else {
        try std.testing.expect(false);
    }
}

test "Bytecode.getNextPc: at end of bytecode" {
    const code = [_]u8{0x00}; // STOP
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // STOP at pc 0 would jump to pc 1, but that's beyond bytecode
    try std.testing.expect(bytecode.getNextPc(0) == null);
}

test "Bytecode.getNextPc: invalid PC (beyond bytecode)" {
    const code = [_]u8{ 0x60, 0x01, 0x00 }; // PUSH1 1, STOP
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // PC beyond bytecode should return null
    try std.testing.expect(bytecode.getNextPc(10) == null);
    try std.testing.expect(bytecode.getNextPc(3) == null);
}

test "Bytecode.fromUint8Array" {
    const bytes = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01 };
    var bc = try Bytecode.fromUint8Array(std.testing.allocator, &bytes);
    defer bc.deinit();

    try std.testing.expectEqual(@as(usize, 5), bc.len());
}

test "detectFusions: PUSH1 + JUMP pattern" {
    const code = [_]u8{
        0x60, 0x05, // PUSH1 5
        0x56, // JUMP
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.push_jump, fusions[0].fusion_type);
    try std.testing.expectEqual(@as(u32, 0), fusions[0].pc);
    try std.testing.expectEqual(@as(u8, 3), fusions[0].length);
}

test "detectFusions: PUSH2 + JUMPI pattern" {
    const code = [_]u8{
        0x61, 0x00, 0x10, // PUSH2 0x0010
        0x57, // JUMPI
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.push_jumpi, fusions[0].fusion_type);
    try std.testing.expectEqual(@as(u32, 0), fusions[0].pc);
    try std.testing.expectEqual(@as(u8, 4), fusions[0].length);
}

test "detectFusions: PUSH1 + ADD pattern" {
    const code = [_]u8{
        0x60, 0x02, // PUSH1 2
        0x01, // ADD
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.push_add, fusions[0].fusion_type);
    try std.testing.expectEqual(@as(u32, 0), fusions[0].pc);
    try std.testing.expectEqual(@as(u8, 3), fusions[0].length);
}

test "detectFusions: PUSH1 + MUL pattern" {
    const code = [_]u8{
        0x60, 0x03, // PUSH1 3
        0x02, // MUL
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.push_mul, fusions[0].fusion_type);
}

test "detectFusions: PUSH1 + SUB pattern" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 1
        0x03, // SUB
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.push_sub, fusions[0].fusion_type);
}

test "detectFusions: PUSH1 + DIV pattern" {
    const code = [_]u8{
        0x60, 0x08, // PUSH1 8
        0x04, // DIV
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.push_div, fusions[0].fusion_type);
}

test "detectFusions: PUSH1 + DUP1 pattern" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 1
        0x80, // DUP1
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.push_dup, fusions[0].fusion_type);
}

test "detectFusions: PUSH1 + SWAP1 pattern" {
    const code = [_]u8{
        0x60, 0x02, // PUSH1 2
        0x90, // SWAP1
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.push_swap, fusions[0].fusion_type);
}

test "detectFusions: DUP1 + SWAP1 pattern" {
    const code = [_]u8{
        0x80, // DUP1
        0x90, // SWAP1
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.dup_swap, fusions[0].fusion_type);
    try std.testing.expectEqual(@as(u32, 0), fusions[0].pc);
    try std.testing.expectEqual(@as(u8, 2), fusions[0].length);
}

test "detectFusions: SWAP1 + POP pattern" {
    const code = [_]u8{
        0x90, // SWAP1
        0x50, // POP
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.swap_pop, fusions[0].fusion_type);
    try std.testing.expectEqual(@as(u32, 0), fusions[0].pc);
    try std.testing.expectEqual(@as(u8, 2), fusions[0].length);
}

test "detectFusions: multiple fusions in sequence" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 1 (pc 0-1)
        0x01, // ADD (pc 2)
        0x60, 0x02, // PUSH1 2 (pc 3-4)
        0x03, // SUB (pc 5)
        0x90, // SWAP1 (pc 6)
        0x50, // POP (pc 7)
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 3), fusions.len);

    // First fusion: PUSH1 + ADD at pc 0
    try std.testing.expectEqual(FusionType.push_add, fusions[0].fusion_type);
    try std.testing.expectEqual(@as(u32, 0), fusions[0].pc);

    // Second fusion: PUSH1 + SUB at pc 3
    try std.testing.expectEqual(FusionType.push_sub, fusions[1].fusion_type);
    try std.testing.expectEqual(@as(u32, 3), fusions[1].pc);

    // Third fusion: SWAP1 + POP at pc 6
    try std.testing.expectEqual(FusionType.swap_pop, fusions[2].fusion_type);
    try std.testing.expectEqual(@as(u32, 6), fusions[2].pc);
}

test "detectFusions: no fusions" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 1
        0x60, 0x02, // PUSH1 2
        0x00, // STOP
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 0), fusions.len);
}

test "detectFusions: truncated PUSH at end (no fusion)" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 1
        0x01, // ADD
        0x61, // PUSH2 (incomplete, no operand)
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    // Only the PUSH1 + ADD should be detected
    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.push_add, fusions[0].fusion_type);
}

test "detectFusions: PUSH32 + JUMP pattern" {
    var code: [35]u8 = undefined;
    code[0] = 0x7f; // PUSH32
    for (1..33) |i| {
        code[i] = @intCast(i);
    }
    code[33] = 0x56; // JUMP

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 1), fusions.len);
    try std.testing.expectEqual(FusionType.push_jump, fusions[0].fusion_type);
    try std.testing.expectEqual(@as(u32, 0), fusions[0].pc);
    try std.testing.expectEqual(@as(u8, 34), fusions[0].length);
}

test "detectFusions: PUSH with different DUP variants" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 1
        0x81, // DUP2
        0x60, 0x02, // PUSH1 2
        0x8f, // DUP16
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 2), fusions.len);
    try std.testing.expectEqual(FusionType.push_dup, fusions[0].fusion_type);
    try std.testing.expectEqual(FusionType.push_dup, fusions[1].fusion_type);
}

test "detectFusions: PUSH with different SWAP variants" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 1
        0x91, // SWAP2
        0x60, 0x02, // PUSH1 2
        0x9f, // SWAP16
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 2), fusions.len);
    try std.testing.expectEqual(FusionType.push_swap, fusions[0].fusion_type);
    try std.testing.expectEqual(FusionType.push_swap, fusions[1].fusion_type);
}

test "detectFusions: DUP with different SWAP variants" {
    const code = [_]u8{
        0x82, // DUP3
        0x91, // SWAP2
        0x81, // DUP2
        0x9f, // SWAP16
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 2), fusions.len);
    try std.testing.expectEqual(FusionType.dup_swap, fusions[0].fusion_type);
    try std.testing.expectEqual(FusionType.dup_swap, fusions[1].fusion_type);
}

test "detectFusions: SWAP with different POP variants is only at pc+1" {
    const code = [_]u8{
        0x90, // SWAP1
        0x50, // POP
        0x91, // SWAP2
        0x50, // POP
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 2), fusions.len);
    try std.testing.expectEqual(FusionType.swap_pop, fusions[0].fusion_type);
    try std.testing.expectEqual(@as(u32, 0), fusions[0].pc);
    try std.testing.expectEqual(FusionType.swap_pop, fusions[1].fusion_type);
    try std.testing.expectEqual(@as(u32, 2), fusions[1].pc);
}

test "detectFusions: empty bytecode" {
    const code = [_]u8{};
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 0), fusions.len);
}

test "detectFusions: single byte bytecode (no fusion)" {
    const code = [_]u8{0x60}; // PUSH1 (incomplete)
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 0), fusions.len);
}

test "detectFusions: PUSH near end of bytecode" {
    const code = [_]u8{
        0x00, // STOP
        0x60, // PUSH1 (incomplete, at end)
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    // No fusion should be detected as PUSH is incomplete
    try std.testing.expectEqual(@as(usize, 0), fusions.len);
}

test "detectFusions: complex real-world sequence" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 1 (pc 0-1)
        0x01, // ADD (pc 2)
        0x60, 0x02, // PUSH1 2 (pc 3-4)
        0x56, // JUMP (pc 5)
        0x5b, // JUMPDEST (pc 6)
        0x60, 0x03, // PUSH1 3 (pc 7-8)
        0x04, // DIV (pc 9)
        0x80, // DUP1 (pc 10)
        0x90, // SWAP1 (pc 11)
        0x50, // POP (pc 12)
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 4), fusions.len);

    // PUSH1 + ADD
    try std.testing.expectEqual(FusionType.push_add, fusions[0].fusion_type);
    try std.testing.expectEqual(@as(u32, 0), fusions[0].pc);

    // PUSH1 + JUMP
    try std.testing.expectEqual(FusionType.push_jump, fusions[1].fusion_type);
    try std.testing.expectEqual(@as(u32, 3), fusions[1].pc);

    // PUSH1 + DIV
    try std.testing.expectEqual(FusionType.push_div, fusions[2].fusion_type);
    try std.testing.expectEqual(@as(u32, 7), fusions[2].pc);

    // SWAP1 + POP
    try std.testing.expectEqual(FusionType.swap_pop, fusions[3].fusion_type);
    try std.testing.expectEqual(@as(u32, 11), fusions[3].pc);
}

test "detectFusions: all PUSH sizes with same operation" {
    var code: [7 + 6 + 5 + 4]u8 = undefined;
    var offset: usize = 0;

    // PUSH1 + ADD
    code[offset] = 0x60;
    offset += 1;
    code[offset] = 0x01;
    offset += 1;
    code[offset] = 0x01;
    offset += 1;

    // PUSH2 + ADD
    code[offset] = 0x61;
    offset += 1;
    code[offset] = 0x01;
    offset += 1;
    code[offset] = 0x02;
    offset += 1;
    code[offset] = 0x01;
    offset += 1;

    // PUSH3 + ADD
    code[offset] = 0x62;
    offset += 1;
    code[offset] = 0x01;
    offset += 1;
    code[offset] = 0x02;
    offset += 1;
    code[offset] = 0x03;
    offset += 1;
    code[offset] = 0x01;
    offset += 1;

    // PUSH4 + ADD
    code[offset] = 0x63;
    offset += 1;
    code[offset] = 0x01;
    offset += 1;
    code[offset] = 0x02;
    offset += 1;
    code[offset] = 0x03;
    offset += 1;
    code[offset] = 0x04;
    offset += 1;
    code[offset] = 0x01;
    offset += 1;

    var bytecode = try Bytecode.init(std.testing.allocator, code[0..offset]);
    defer bytecode.deinit();

    const fusions = try bytecode.detectFusions(std.testing.allocator);
    defer std.testing.allocator.free(fusions);

    try std.testing.expectEqual(@as(usize, 4), fusions.len);
    for (fusions) |fusion| {
        try std.testing.expectEqual(FusionType.push_add, fusion.fusion_type);
    }
}

test "Scanner: basic iteration with PUSH1, ADD, STOP" {
    const code = [_]u8{
        0x60, 0x05, // PUSH1 0x05
        0x01, // ADD
        0x00, // STOP
    };

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    var scanner = bytecode.scan(0, @intCast(code.len));

    // First instruction: PUSH1 0x05
    const instr1 = scanner.next().?;
    try std.testing.expectEqual(@as(u32, 0), instr1.pc);
    try std.testing.expectEqual(@as(u8, 0x60), instr1.opcode);
    try std.testing.expectEqual(@as(u8, 2), instr1.size);
    try std.testing.expectEqual(@as(u256, 0x05), instr1.push_value.?);

    // Second instruction: ADD
    const instr2 = scanner.next().?;
    try std.testing.expectEqual(@as(u32, 2), instr2.pc);
    try std.testing.expectEqual(@as(u8, 0x01), instr2.opcode);
    try std.testing.expectEqual(@as(u8, 1), instr2.size);
    try std.testing.expect(instr2.push_value == null);

    // Third instruction: STOP
    const instr3 = scanner.next().?;
    try std.testing.expectEqual(@as(u32, 3), instr3.pc);
    try std.testing.expectEqual(@as(u8, 0x00), instr3.opcode);
    try std.testing.expectEqual(@as(u8, 1), instr3.size);
    try std.testing.expect(instr3.push_value == null);

    // End of iteration
    try std.testing.expect(scanner.next() == null);
}

test "Scanner: PUSH2, PUSH4, PUSH32 with values" {
    const code = [_]u8{
        0x61, 0x12, 0x34, // PUSH2 0x1234
        0x63, 0xaa, 0xbb, 0xcc, 0xdd, // PUSH4 0xaabbccdd
    };

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    var scanner = bytecode.scan(0, @intCast(code.len));

    // First: PUSH2
    const instr1 = scanner.next().?;
    try std.testing.expectEqual(@as(u32, 0), instr1.pc);
    try std.testing.expectEqual(@as(u8, 0x61), instr1.opcode);
    try std.testing.expectEqual(@as(u8, 3), instr1.size);
    try std.testing.expectEqual(@as(u256, 0x1234), instr1.push_value.?);

    // Second: PUSH4
    const instr2 = scanner.next().?;
    try std.testing.expectEqual(@as(u32, 3), instr2.pc);
    try std.testing.expectEqual(@as(u8, 0x63), instr2.opcode);
    try std.testing.expectEqual(@as(u8, 5), instr2.size);
    try std.testing.expectEqual(@as(u256, 0xaabbccdd), instr2.push_value.?);
}

test "Scanner: range limiting with start_pc and end_pc" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 0x01 (pos 0-1)
        0x01, // ADD (pos 2)
        0x60, 0x02, // PUSH1 0x02 (pos 3-4)
        0x00, // STOP (pos 5)
    };

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // Scan from pos 2 to 5 (should get ADD and PUSH1)
    var scanner = bytecode.scan(2, 5);

    const instr1 = scanner.next().?;
    try std.testing.expectEqual(@as(u32, 2), instr1.pc);
    try std.testing.expectEqual(@as(u8, 0x01), instr1.opcode);

    const instr2 = scanner.next().?;
    try std.testing.expectEqual(@as(u32, 3), instr2.pc);
    try std.testing.expectEqual(@as(u8, 0x60), instr2.opcode);

    // STOP at pos 5 should not be included (end_pc=5 is exclusive)
    try std.testing.expect(scanner.next() == null);
}

test "Scanner: empty iteration" {
    const code = [_]u8{ 0x60, 0x01, 0x00 };

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // Scan empty range
    var scanner = bytecode.scan(0, 0);
    try std.testing.expect(scanner.next() == null);
}

test "Scanner: end_pc clamping" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 0x01 (pos 0-1)
        0x00, // STOP (pos 2)
    };

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    // Request end_pc beyond bytecode length
    var scanner = bytecode.scan(0, 1000);

    const instr1 = scanner.next().?;
    try std.testing.expectEqual(@as(u32, 0), instr1.pc);

    const instr2 = scanner.next().?;
    try std.testing.expectEqual(@as(u32, 2), instr2.pc);

    // Should stop at actual bytecode end
    try std.testing.expect(scanner.next() == null);
}

test "Scanner: PUSH with zero value" {
    const code = [_]u8{
        0x60, 0x00, // PUSH1 0x00
        0x61, 0x00, 0x00, // PUSH2 0x0000
    };

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    var scanner = bytecode.scan(0, @intCast(code.len));

    const instr1 = scanner.next().?;
    try std.testing.expectEqual(@as(u256, 0), instr1.push_value.?);

    const instr2 = scanner.next().?;
    try std.testing.expectEqual(@as(u256, 0), instr2.push_value.?);
}

test "Scanner: PUSH32 with max value" {
    var code: [33]u8 = undefined;
    code[0] = 0x7f; // PUSH32
    for (1..33) |i| {
        code[i] = 0xff;
    }

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    var scanner = bytecode.scan(0, @intCast(code.len));

    const instr = scanner.next().?;
    try std.testing.expectEqual(@as(u8, 0x7f), instr.opcode);
    try std.testing.expectEqual(@as(u8, 33), instr.size);
    try std.testing.expectEqual(@as(u256, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff), instr.push_value.?);
}

test "Scanner: non-PUSH opcodes have null push_value" {
    const code = [_]u8{
        0x01, // ADD
        0x02, // MUL
        0x03, // SUB
        0x5b, // JUMPDEST
    };

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    var scanner = bytecode.scan(0, @intCast(code.len));

    var i: usize = 0;
    while (scanner.next()) |instr| : (i += 1) {
        try std.testing.expect(instr.push_value == null);
        try std.testing.expectEqual(@as(u8, 1), instr.size);
    }
    try std.testing.expectEqual(@as(usize, 4), i);
}

test "Scanner: complex bytecode traversal" {
    const code = [_]u8{
        0x60, 0x80, // PUSH1 0x80 (pos 0-1)
        0x60, 0x40, // PUSH1 0x40 (pos 2-3)
        0x52, // MSTORE (pos 4)
        0x5b, // JUMPDEST (pos 5)
        0x60, 0x00, // PUSH1 0x00 (pos 6-7)
        0x35, // CALLDATALOAD (pos 8)
        0x60, 0xe0, // PUSH1 0xe0 (pos 9-10)
        0x1c, // SHR (pos 11)
    };

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    var scanner = bytecode.scan(0, @intCast(code.len));
    var pc_array: [10]u32 = undefined;
    var idx: usize = 0;

    while (scanner.next()) |instr| : (idx += 1) {
        pc_array[idx] = instr.pc;
    }

    try std.testing.expectEqual(@as(usize, 8), idx);
    try std.testing.expectEqual(@as(u32, 0), pc_array[0]);
    try std.testing.expectEqual(@as(u32, 2), pc_array[1]);
    try std.testing.expectEqual(@as(u32, 4), pc_array[2]);
    try std.testing.expectEqual(@as(u32, 5), pc_array[3]);
    try std.testing.expectEqual(@as(u32, 6), pc_array[4]);
    try std.testing.expectEqual(@as(u32, 8), pc_array[5]);
    try std.testing.expectEqual(@as(u32, 9), pc_array[6]);
    try std.testing.expectEqual(@as(u32, 11), pc_array[7]);
}

test "analyzeGasTotal: empty bytecode" {
    const code = [_]u8{};
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u64, 0), bytecode.analyzeGasTotal());
}

test "analyzeGasTotal: single STOP opcode" {
    const code = [_]u8{0x00}; // STOP = 0 gas
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u64, 0), bytecode.analyzeGasTotal());
}

test "analyzeGasTotal: simple arithmetic ADD + SUB" {
    const code = [_]u8{
        0x01, // ADD (3 gas)
        0x03, // SUB (3 gas)
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u64, 6), bytecode.analyzeGasTotal());
}

test "analyzeGasTotal: PUSH1 opcodes cost 3 gas each" {
    const code = [_]u8{
        0x60, 0x01, // PUSH1 0x01 (3 gas)
        0x60, 0x02, // PUSH1 0x02 (3 gas)
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u64, 6), bytecode.analyzeGasTotal());
}

test "analyzeGasTotal: PUSH1 with ADD" {
    const code = [_]u8{
        0x60, 0x05, // PUSH1 0x05 (3 gas)
        0x60, 0x03, // PUSH1 0x03 (3 gas)
        0x01, // ADD (3 gas)
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u64, 9), bytecode.analyzeGasTotal());
}

test "analyzeGasTotal: PUSH2 skips immediate data correctly" {
    const code = [_]u8{
        0x61, 0x12, 0x34, // PUSH2 0x1234 (3 gas, skips 2 bytes)
        0x00, // STOP (0 gas)
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u64, 3), bytecode.analyzeGasTotal());
}

test "analyzeGasTotal: all PUSH sizes cost 3 gas each" {
    var code: [32 * 34]u8 = undefined;
    var offset: usize = 0;

    var i: u8 = 1;
    while (i <= 32) : (i += 1) {
        const opcode: u8 = 0x5f + i;
        code[offset] = opcode;
        offset += 1;

        var j: u8 = 0;
        while (j < i) : (j += 1) {
            code[offset] = 0xaa;
            offset += 1;
        }
    }

    var bytecode = try Bytecode.init(std.testing.allocator, code[0..offset]);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u64, 96), bytecode.analyzeGasTotal());
}

test "analyzeGasTotal: PUSH32 with data containing opcode bytes" {
    var code: [34]u8 = undefined;
    code[0] = 0x7f; // PUSH32
    for (1..33) |i| {
        code[i] = 0x01;
    }
    code[33] = 0x00; // STOP

    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u64, 3), bytecode.analyzeGasTotal());
}

test "analyzeGasTotal: MUL with higher gas cost" {
    const code = [_]u8{
        0x60, 0x02, // PUSH1 0x02 (3 gas)
        0x60, 0x03, // PUSH1 0x03 (3 gas)
        0x02, // MUL (5 gas)
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u64, 11), bytecode.analyzeGasTotal());
}

test "analyzeGasTotal: complex bytecode with multiple PUSH sizes" {
    const code = [_]u8{
        0x60, 0x80, // PUSH1 0x80 (3 gas)
        0x60, 0x40, // PUSH1 0x40 (3 gas)
        0x52, // MSTORE (3 gas)
        0x5b, // JUMPDEST (1 gas)
        0x61, 0x12, 0x34, // PUSH2 0x1234 (3 gas)
        0x00, // STOP (0 gas)
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u64, 13), bytecode.analyzeGasTotal());
}

test "analyzeGasTotal: JUMPDEST cost 1 gas each" {
    const code = [_]u8{
        0x5b, // JUMPDEST (1 gas)
        0x5b, // JUMPDEST (1 gas)
        0x5b, // JUMPDEST (1 gas)
    };
    var bytecode = try Bytecode.init(std.testing.allocator, &code);
    defer bytecode.deinit();

    try std.testing.expectEqual(@as(u64, 3), bytecode.analyzeGasTotal());
}
