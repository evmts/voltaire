const std = @import("std");
const primitives = @import("primitives");

/// Bytecode Analysis Example
///
/// Demonstrates:
/// - Traversing bytecode instruction by instruction
/// - Identifying PUSH instructions and extracting values
/// - Counting different instruction types
/// - Finding jump destinations
/// - Analyzing bytecode structure

const Bytecode = primitives.bytecode.Bytecode;
const Opcode = primitives.opcode.Opcode;

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    try stdout.print("\n=== Bytecode Analysis Example (Zig) ===\n\n", .{});

    // ============================================================
    // Instruction-by-Instruction Analysis
    // ============================================================

    try stdout.print("--- Instruction-by-Instruction Analysis ---\n\n", .{});

    // Complex bytecode: constructor prefix
    const code = [_]u8{
        0x60, 0x80, // PUSH1 0x80
        0x60, 0x40, // PUSH1 0x40
        0x52, // MSTORE
        0x34, // CALLVALUE
        0x80, // DUP1
        0x15, // ISZERO
        0x61, 0x00, 0x10, // PUSH2 0x0010
        0x57, // JUMPI
        0x60, 0x00, // PUSH1 0x00
        0x80, // DUP1
        0xfd, // REVERT
        0x5b, // JUMPDEST
        0x50, // POP
    };

    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();

    try stdout.print("Bytecode (hex): 0x", .{});
    for (code) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n\n", .{});

    try stdout.print("Instruction breakdown:\n", .{});

    var pc: u32 = 0;
    var inst_count: usize = 0;

    while (pc < bytecode.len()) {
        if (bytecode.getOpcodeEnum(pc)) |opcode| {
            try stdout.print("  [{:>2}] ", .{pc});

            const opcode_byte = @intFromEnum(opcode);

            // Check if PUSH instruction
            if (opcode_byte >= 0x60 and opcode_byte <= 0x7f) {
                const push_size: u8 = opcode_byte - 0x5f;
                try stdout.print("{} ", .{opcode});

                if (bytecode.readImmediate(pc, push_size)) |value| {
                    try stdout.print("0x{x}", .{value});
                } else {
                    try stdout.print("(invalid)");
                }

                pc += 1 + push_size;
            } else {
                try stdout.print("{}", .{opcode});
                pc += 1;
            }

            try stdout.print("\n", .{});
            inst_count += 1;
        } else {
            break;
        }
    }

    try stdout.print("\nTotal instructions: {}\n\n", .{inst_count});

    // ============================================================
    // Counting Instruction Types
    // ============================================================

    try stdout.print("--- Counting Instruction Types ---\n\n", .{});

    var push_count: usize = 0;
    var jumpdest_count: usize = 0;
    var terminator_count: usize = 0;
    var other_count: usize = 0;

    pc = 0;
    while (pc < bytecode.len()) {
        if (bytecode.getOpcode(pc)) |opcode_byte| {
            const opcode: Opcode = @enumFromInt(opcode_byte);

            if (opcode_byte >= 0x60 and opcode_byte <= 0x7f) {
                // PUSH instruction
                push_count += 1;
                const push_size = opcode_byte - 0x5f;
                pc += 1 + push_size;
            } else if (opcode == .JUMPDEST) {
                jumpdest_count += 1;
                pc += 1;
            } else if (opcode == .STOP or opcode == .RETURN or opcode == .REVERT or opcode == .INVALID) {
                terminator_count += 1;
                pc += 1;
            } else {
                other_count += 1;
                pc += 1;
            }
        } else {
            break;
        }
    }

    try stdout.print("Instruction type counts:\n", .{});
    try stdout.print("  PUSH instructions: {}\n", .{push_count});
    try stdout.print("  JUMPDEST: {}\n", .{jumpdest_count});
    try stdout.print("  Terminators (STOP/RETURN/REVERT/INVALID): {}\n", .{terminator_count});
    try stdout.print("  Other: {}\n", .{other_count});
    try stdout.print("  Total: {}\n\n", .{push_count + jumpdest_count + terminator_count + other_count});

    // ============================================================
    // Extracting PUSH Values
    // ============================================================

    try stdout.print("--- Extracting PUSH Values ---\n\n", .{});

    const push_code = [_]u8{
        0x60, 0xff, // PUSH1 0xff
        0x61, 0x12, 0x34, // PUSH2 0x1234
        0x63, 0xab, 0xcd, 0xef, 0x01, // PUSH4 0xabcdef01
    };

    var push_bytecode = try Bytecode.init(allocator, &push_code);
    defer push_bytecode.deinit();

    try stdout.print("Code: 0x", .{});
    for (push_code) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n\n", .{});

    try stdout.print("PUSH values:\n", .{});

    pc = 0;
    var push_num: usize = 1;
    while (pc < push_bytecode.len()) {
        if (push_bytecode.getOpcode(pc)) |opcode_byte| {
            if (opcode_byte >= 0x60 and opcode_byte <= 0x7f) {
                const push_size = opcode_byte - 0x5f;

                if (push_bytecode.readImmediate(pc, push_size)) |value| {
                    try stdout.print("  PUSH{} at position {}: 0x{x} ({})\n", .{ push_size, pc, value, value });
                    push_num += 1;
                }

                pc += 1 + push_size;
            } else {
                pc += 1;
            }
        } else {
            break;
        }
    }

    try stdout.print("\n", .{});

    // ============================================================
    // Jump Destination Analysis
    // ============================================================

    try stdout.print("--- Jump Destination Analysis ---\n\n", .{});

    // Code with multiple JUMPDESTs
    const jump_code = [_]u8{
        0x60, 0x05, // PUSH1 5
        0x56, // JUMP
        0x00, // STOP (unreachable)
        0x5b, // JUMPDEST (position 5)
        0x60, 0x0a, // PUSH1 10
        0x57, // JUMPI
        0x00, // STOP
        0x5b, // JUMPDEST (position 10)
        0x00, // STOP
    };

    var jump_bytecode = try Bytecode.init(allocator, &jump_code);
    defer jump_bytecode.deinit();

    try stdout.print("Code: 0x", .{});
    for (jump_code) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n\n", .{});

    try stdout.print("Valid JUMPDEST positions:\n", .{});
    var valid_count: usize = 0;
    for (0..jump_bytecode.len()) |i| {
        const pos: u32 = @intCast(i);
        if (jump_bytecode.isValidJumpDest(pos)) {
            try stdout.print("  Position {}\n", .{pos});
            valid_count += 1;
        }
    }
    try stdout.print("Total: {}\n\n", .{valid_count});

    // ============================================================
    // Identifying Terminators
    // ============================================================

    try stdout.print("--- Identifying Terminators ---\n\n", .{});

    const term_code = [_]u8{
        0x60, 0x01, // PUSH1 1
        0x60, 0x02, // PUSH1 2
        0x01, // ADD
        0x00, // STOP (terminator)
        0x60, 0xff, // Unreachable PUSH1
        0xf3, // Unreachable RETURN
    };

    var term_bytecode = try Bytecode.init(allocator, &term_code);
    defer term_bytecode.deinit();

    try stdout.print("Code: 0x", .{});
    for (term_code) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n\n", .{});

    try stdout.print("Terminators found:\n", .{});

    pc = 0;
    while (pc < term_bytecode.len()) {
        if (term_bytecode.getOpcodeEnum(pc)) |opcode| {
            const opcode_byte = @intFromEnum(opcode);

            if (opcode == .STOP or opcode == .RETURN or opcode == .REVERT or opcode == .INVALID) {
                try stdout.print("  Position {}: {}\n", .{ pc, opcode });
            }

            // Skip PUSH data
            if (opcode_byte >= 0x60 and opcode_byte <= 0x7f) {
                const push_size = opcode_byte - 0x5f;
                pc += 1 + push_size;
            } else {
                pc += 1;
            }
        } else {
            break;
        }
    }

    // ============================================================
    // Bytecode Statistics
    // ============================================================

    try stdout.print("\n--- Bytecode Statistics ---\n\n", .{});

    const stats_code = [_]u8{
        0x60, 0x80, // PUSH1 0x80
        0x60, 0x40, // PUSH1 0x40
        0x52, // MSTORE
        0x5b, // JUMPDEST
        0x60, 0x00, // PUSH1 0x00
        0x80, // DUP1
        0xfd, // REVERT
    };

    var stats_bytecode = try Bytecode.init(allocator, &stats_code);
    defer stats_bytecode.deinit();

    // Count instruction types
    var stats_push: usize = 0;
    var stats_jumpdest: usize = 0;
    var stats_terminator: usize = 0;
    var stats_other: usize = 0;
    var stats_total: usize = 0;

    pc = 0;
    while (pc < stats_bytecode.len()) {
        if (stats_bytecode.getOpcode(pc)) |opcode_byte| {
            const opcode: Opcode = @enumFromInt(opcode_byte);
            stats_total += 1;

            if (opcode_byte >= 0x60 and opcode_byte <= 0x7f) {
                stats_push += 1;
                pc += 1 + (opcode_byte - 0x5f);
            } else if (opcode == .JUMPDEST) {
                stats_jumpdest += 1;
                pc += 1;
            } else if (opcode == .STOP or opcode == .RETURN or opcode == .REVERT or opcode == .INVALID) {
                stats_terminator += 1;
                pc += 1;
            } else {
                stats_other += 1;
                pc += 1;
            }
        } else {
            break;
        }
    }

    try stdout.print("Bytecode size: {} bytes\n", .{stats_bytecode.len()});
    try stdout.print("Total instructions: {}\n", .{stats_total});
    try stdout.print("  PUSH: {} ({d:.1}%)\n", .{ stats_push, @as(f64, @floatFromInt(stats_push)) / @as(f64, @floatFromInt(stats_total)) * 100.0 });
    try stdout.print("  JUMPDEST: {} ({d:.1}%)\n", .{ stats_jumpdest, @as(f64, @floatFromInt(stats_jumpdest)) / @as(f64, @floatFromInt(stats_total)) * 100.0 });
    try stdout.print("  Terminators: {} ({d:.1}%)\n", .{ stats_terminator, @as(f64, @floatFromInt(stats_terminator)) / @as(f64, @floatFromInt(stats_total)) * 100.0 });
    try stdout.print("  Other: {} ({d:.1}%)\n", .{ stats_other, @as(f64, @floatFromInt(stats_other)) / @as(f64, @floatFromInt(stats_total)) * 100.0 });
    try stdout.print("Valid JUMPDEST count: {}\n", .{stats_bytecode.valid_jumpdests.count()});

    try stdout.print("\n=== Example Complete ===\n\n", .{});
}
