const std = @import("std");
const primitives = @import("primitives");

/// Basic Bytecode Usage Example
///
/// Demonstrates:
/// - Creating and initializing bytecode
/// - Jump destination analysis
/// - Checking valid JUMPDEST positions
/// - Reading opcodes and immediate values
const Bytecode = primitives.bytecode.Bytecode;
const Opcode = primitives.opcode.Opcode;

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    try stdout.print("\n=== Basic Bytecode Usage (Zig) ===\n\n", .{});

    // ============================================================
    // Creating Bytecode
    // ============================================================

    try stdout.print("--- Creating Bytecode ---\n\n", .{});

    // Simple bytecode: PUSH1 0x01, PUSH1 0x02, ADD, JUMPDEST, STOP
    const code_bytes = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x5b, 0x00 };

    var bytecode = try Bytecode.init(allocator, &code_bytes);
    defer bytecode.deinit();

    try stdout.print("Bytecode created with {} bytes\n", .{bytecode.len()});
    try stdout.print("Code: 0x", .{});
    for (bytecode.code) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n\n", .{});

    // ============================================================
    // Jump Destination Analysis
    // ============================================================

    try stdout.print("--- Jump Destination Analysis ---\n\n", .{});

    // Bytecode: PUSH1 0x5b, JUMPDEST, PUSH1 0x00, JUMPDEST
    const jump_code = [_]u8{ 0x60, 0x5b, 0x5b, 0x60, 0x00, 0x5b };

    var jump_bytecode = try Bytecode.init(allocator, &jump_code);
    defer jump_bytecode.deinit();

    try stdout.print("Code: 0x", .{});
    for (jump_code) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n", .{});

    try stdout.print("Valid JUMPDEST positions:\n", .{});
    for (0..jump_bytecode.len()) |i| {
        const pc: u32 = @intCast(i);
        if (jump_bytecode.isValidJumpDest(pc)) {
            try stdout.print("  Position {}: JUMPDEST\n", .{pc});
        }
    }

    try stdout.print("\nPosition 0: {s} (PUSH1 opcode)\n", .{if (jump_bytecode.isValidJumpDest(0)) "valid" else "not valid"});
    try stdout.print("Position 1: {s} (0x5b is PUSH1 data)\n", .{if (jump_bytecode.isValidJumpDest(1)) "valid" else "not valid"});
    try stdout.print("Position 2: {s} (actual JUMPDEST)\n", .{if (jump_bytecode.isValidJumpDest(2)) "valid" else "not valid"});
    try stdout.print("Position 5: {s} (actual JUMPDEST)\n\n", .{if (jump_bytecode.isValidJumpDest(5)) "valid" else "not valid"});

    // ============================================================
    // Reading Opcodes
    // ============================================================

    try stdout.print("--- Reading Opcodes ---\n\n", .{});

    try stdout.print("Opcodes in bytecode:\n", .{});
    for (0..bytecode.len()) |i| {
        const pc: u32 = @intCast(i);
        if (bytecode.getOpcode(pc)) |opcode| {
            const opcode_enum: Opcode = @enumFromInt(opcode);
            try stdout.print("  Position {}: 0x{x:0>2} ({})\n", .{ pc, opcode, opcode_enum });
        }
    }
    try stdout.print("\n", .{});

    // ============================================================
    // Reading PUSH Immediate Values
    // ============================================================

    try stdout.print("--- Reading PUSH Immediate Values ---\n\n", .{});

    // PUSH1 0x01 at position 0
    if (bytecode.readImmediate(0, 1)) |value| {
        try stdout.print("PUSH1 at position 0: 0x{x}\n", .{value});
    }

    // PUSH1 0x02 at position 2
    if (bytecode.readImmediate(2, 1)) |value| {
        try stdout.print("PUSH1 at position 2: 0x{x}\n", .{value});
    }

    // ============================================================
    // PUSH32 Example
    // ============================================================

    try stdout.print("\n--- PUSH32 Example ---\n\n", .{});

    // PUSH32 with 32 bytes of data
    var push32_code: [33]u8 = undefined;
    push32_code[0] = 0x7f; // PUSH32 opcode
    for (0..32) |i| {
        push32_code[i + 1] = @intCast((i + 1) % 256);
    }

    var push32_bytecode = try Bytecode.init(allocator, &push32_code);
    defer push32_bytecode.deinit();

    if (push32_bytecode.readImmediate(0, 32)) |value| {
        try stdout.print("PUSH32 value: 0x{x}\n", .{value});
    }

    try stdout.print("\n", .{});

    // ============================================================
    // Complex Bytecode with Multiple PUSH Instructions
    // ============================================================

    try stdout.print("--- Complex Bytecode ---\n\n", .{});

    // PUSH1 0x80, PUSH1 0x40, MSTORE (0x52), STOP
    const complex_code = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52, 0x00 };

    var complex_bytecode = try Bytecode.init(allocator, &complex_code);
    defer complex_bytecode.deinit();

    try stdout.print("Complex code: 0x", .{});
    for (complex_code) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n", .{});

    try stdout.print("Instructions:\n", .{});

    var pc: u32 = 0;
    while (pc < complex_bytecode.len()) {
        if (complex_bytecode.getOpcodeEnum(pc)) |opcode| {
            try stdout.print("  {}: {}\n", .{ pc, opcode });

            // Skip PUSH data
            if (@intFromEnum(opcode) >= 0x60 and @intFromEnum(opcode) <= 0x7f) {
                const push_size = @intFromEnum(opcode) - 0x5f;
                pc += 1 + push_size;
            } else {
                pc += 1;
            }
        } else {
            break;
        }
    }

    // ============================================================
    // Validation Example
    // ============================================================

    try stdout.print("\n--- Validation Example ---\n\n", .{});

    // Valid bytecode
    const valid_code = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01 };
    var valid_bytecode = try Bytecode.init(allocator, &valid_code);
    defer valid_bytecode.deinit();

    try stdout.print("Valid bytecode initialized successfully\n", .{});

    // Invalid bytecode would fail at init if we tried to parse beyond bounds
    // The Bytecode.init handles this by only analyzing what's present

    // ============================================================
    // Working with JUMPDEST
    // ============================================================

    try stdout.print("\n--- Working with JUMPDEST ---\n\n", .{});

    // Create bytecode with multiple JUMPDESTs
    const jumpdest_code = [_]u8{
        0x5b, // JUMPDEST at 0
        0x60, 0x05, // PUSH1 5
        0x56, // JUMP
        0x5b, // JUMPDEST at 5
        0x00, // STOP
    };

    var jumpdest_bytecode = try Bytecode.init(allocator, &jumpdest_code);
    defer jumpdest_bytecode.deinit();

    try stdout.print("Code with JUMPDESTs: 0x", .{});
    for (jumpdest_code) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n", .{});

    try stdout.print("Valid jump destinations:\n", .{});
    var count: usize = 0;
    for (0..jumpdest_bytecode.len()) |i| {
        const pos: u32 = @intCast(i);
        if (jumpdest_bytecode.isValidJumpDest(pos)) {
            try stdout.print("  Position {}\n", .{pos});
            count += 1;
        }
    }
    try stdout.print("Total valid JUMPDEST positions: {}\n", .{count});

    try stdout.print("\n=== Example Complete ===\n\n", .{});
}
