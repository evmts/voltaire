//! Disassembly Example
//!
//! Demonstrates:
//! - Formatting bytecode as human-readable instructions
//! - Formatting individual instructions
//! - Creating disassembly output
//! - Analyzing bytecode with formatted output

const std = @import("std");
const primitives = @import("primitives");
const Bytecode = primitives.bytecode.Bytecode;
const Instruction = primitives.bytecode.Instruction;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdout = std.io.getStdOut().writer();

    try stdout.writeAll("\n=== Disassembly Example ===\n\n");

    // ============================================================
    // Basic Disassembly
    // ============================================================

    try stdout.writeAll("--- Basic Disassembly ---\n\n");

    const simple_hex = "0x60016002015b00";
    const simple_code = try Bytecode.fromHex(allocator, simple_hex);
    defer allocator.free(simple_code);

    try stdout.print("Bytecode: {s}\n\n", .{simple_hex});

    const disassembly = try Bytecode.formatInstructions(allocator, simple_code);
    defer {
        for (disassembly) |line| allocator.free(line);
        allocator.free(disassembly);
    }

    try stdout.writeAll("Disassembly:\n");
    for (disassembly) |line| {
        try stdout.print("  {s}\n", .{line});
    }
    try stdout.writeAll("\n");

    // ============================================================
    // Complex Bytecode Disassembly
    // ============================================================

    try stdout.writeAll("--- Complex Bytecode Disassembly ---\n\n");

    const constructor_hex = "0x608060405234801561001057600080fd5b50";
    const constructor_code = try Bytecode.fromHex(allocator, constructor_hex);
    defer allocator.free(constructor_code);

    try stdout.print("Bytecode: {s}\n\n", .{constructor_hex});

    const constructor_disasm = try Bytecode.formatInstructions(allocator, constructor_code);
    defer {
        for (constructor_disasm) |line| allocator.free(line);
        allocator.free(constructor_disasm);
    }

    try stdout.writeAll("Disassembly:\n");
    for (constructor_disasm) |line| {
        try stdout.print("  {s}\n", .{line});
    }
    try stdout.writeAll("\n");

    // ============================================================
    // Formatting Individual Instructions
    // ============================================================

    try stdout.writeAll("--- Formatting Individual Instructions ---\n\n");

    const instructions = try Bytecode.parseInstructions(allocator, simple_code);
    defer {
        for (instructions) |inst| {
            if (inst.pushData) |data| allocator.free(data);
        }
        allocator.free(instructions);
    }

    try stdout.writeAll("Individual instruction formatting:\n");
    for (instructions) |inst| {
        const formatted = try Bytecode.formatInstruction(allocator, inst);
        defer allocator.free(formatted);
        try stdout.print("  {s}\n", .{formatted});
    }
    try stdout.writeAll("\n");

    // ============================================================
    // Annotated Disassembly
    // ============================================================

    try stdout.writeAll("--- Annotated Disassembly ---\n\n");

    const annotated_hex = "0x600560565b60016002015b00";
    const annotated_code = try Bytecode.fromHex(allocator, annotated_hex);
    defer allocator.free(annotated_code);

    try stdout.print("Bytecode: {s}\n\n", .{annotated_hex});

    const analysis = try Bytecode.analyze(allocator, annotated_code);
    defer {
        for (analysis.instructions) |inst| {
            if (inst.pushData) |data| allocator.free(data);
        }
        allocator.free(analysis.instructions);
        allocator.free(analysis.jumpDestinations);
    }

    try stdout.writeAll("Annotated disassembly:\n");
    for (analysis.instructions) |inst| {
        const formatted = try Bytecode.formatInstruction(allocator, inst);
        defer allocator.free(formatted);

        try stdout.print("  {s}", .{formatted});

        // Add annotations
        var is_jumpdest = false;
        for (analysis.jumpDestinations) |pos| {
            if (pos == inst.position) {
                is_jumpdest = true;
                break;
            }
        }

        const is_terminator = Bytecode.isTerminator(inst.opcode);

        if (is_jumpdest and is_terminator) {
            try stdout.writeAll(" ; JUMP TARGET, TERMINATOR");
        } else if (is_jumpdest) {
            try stdout.writeAll(" ; JUMP TARGET");
        } else if (is_terminator) {
            try stdout.writeAll(" ; TERMINATOR");
        }

        try stdout.writeAll("\n");
    }
    try stdout.writeAll("\n");

    // ============================================================
    // Side-by-Side Comparison
    // ============================================================

    try stdout.writeAll("--- Side-by-Side Comparison ---\n\n");

    try stdout.writeAll("Pos  | Hex        | Disassembly\n");
    try stdout.writeAll("-----|------------|---------------------------\n");

    const compare_insts = try Bytecode.parseInstructions(allocator, simple_code);
    defer {
        for (compare_insts) |inst| {
            if (inst.pushData) |data| allocator.free(data);
        }
        allocator.free(compare_insts);
    }

    for (compare_insts) |inst| {
        var hex_buf: [64]u8 = undefined;
        var hex_str: []const u8 = undefined;

        if (inst.pushData) |data| {
            var fbs = std.io.fixedBufferStream(&hex_buf);
            try std.fmt.format(fbs.writer(), "0x{x:0>2} ", .{inst.opcode});
            for (data) |byte| {
                try std.fmt.format(fbs.writer(), "{x:0>2}", .{byte});
            }
            hex_str = fbs.getWritten();
        } else {
            hex_str = try std.fmt.bufPrint(&hex_buf, "0x{x:0>2}", .{inst.opcode});
        }

        const formatted = try Bytecode.formatInstruction(allocator, inst);
        defer allocator.free(formatted);

        // Extract just disassembly part (after ": ")
        var disasm: []const u8 = formatted;
        if (std.mem.indexOf(u8, formatted, ": ")) |idx| {
            disasm = formatted[idx + 2 ..];
        }

        try stdout.print("{d:4} | {s:<10} | {s}\n", .{ inst.position, hex_str, disasm });
    }
    try stdout.writeAll("\n");

    // ============================================================
    // Disassembly with PUSH Values
    // ============================================================

    try stdout.writeAll("--- Disassembly with PUSH Values ---\n\n");

    const push_hex = "0x60ff61123463abcdef01627fffffff5b00";
    const push_code = try Bytecode.fromHex(allocator, push_hex);
    defer allocator.free(push_code);

    try stdout.print("Bytecode: {s}\n\n", .{push_hex});

    const push_insts = try Bytecode.parseInstructions(allocator, push_code);
    defer {
        for (push_insts) |inst| {
            if (inst.pushData) |data| allocator.free(data);
        }
        allocator.free(push_insts);
    }

    for (push_insts) |inst| {
        const formatted = try Bytecode.formatInstruction(allocator, inst);
        defer allocator.free(formatted);

        try stdout.print("  {s}\n", .{formatted});

        if (inst.pushData) |data| {
            // Convert to value
            var value: u256 = 0;
            for (data) |byte| {
                value = (value << 8) | byte;
            }

            try stdout.print("    -> Decimal: {d}\n", .{value});
            try stdout.print("    -> Hex: 0x{x}\n", .{value});
        }
    }
    try stdout.writeAll("\n");

    // ============================================================
    // Disassembly with Jump Analysis
    // ============================================================

    try stdout.writeAll("--- Disassembly with Jump Analysis ---\n\n");

    const jump_hex = "0x6005565b60016002015b600a575b00";
    const jump_code = try Bytecode.fromHex(allocator, jump_hex);
    defer allocator.free(jump_code);

    try stdout.print("Bytecode: {s}\n\n", .{jump_hex});

    const jump_analysis = try Bytecode.analyze(allocator, jump_code);
    defer {
        for (jump_analysis.instructions) |inst| {
            if (inst.pushData) |data| allocator.free(data);
        }
        allocator.free(jump_analysis.instructions);
        allocator.free(jump_analysis.jumpDestinations);
    }

    try stdout.writeAll("Valid JUMPDEST positions: ");
    for (jump_analysis.jumpDestinations, 0..) |pos, i| {
        if (i > 0) try stdout.writeAll(", ");
        try stdout.print("{d}", .{pos});
    }
    try stdout.writeAll("\n\n");

    try stdout.writeAll("Disassembly:\n");
    for (jump_analysis.instructions) |inst| {
        var is_jumpdest = false;
        for (jump_analysis.jumpDestinations) |pos| {
            if (pos == inst.position) {
                is_jumpdest = true;
                break;
            }
        }

        const prefix = if (is_jumpdest) "→ " else "  ";

        const formatted = try Bytecode.formatInstruction(allocator, inst);
        defer allocator.free(formatted);

        try stdout.print("{s}{s}\n", .{ prefix, formatted });

        if (inst.opcode == 0x56 or inst.opcode == 0x57) {
            try stdout.writeAll("    (Jump instruction)\n");
        }
    }
    try stdout.writeAll("\n");

    // ============================================================
    // Compact Disassembly
    // ============================================================

    try stdout.writeAll("--- Compact Disassembly ---\n\n");

    const compact_hex = "0x60016002015b00";
    const compact_code = try Bytecode.fromHex(allocator, compact_hex);
    defer allocator.free(compact_code);

    const compact_insts = try Bytecode.parseInstructions(allocator, compact_code);
    defer {
        for (compact_insts) |inst| {
            if (inst.pushData) |data| allocator.free(data);
        }
        allocator.free(compact_insts);
    }

    try stdout.print("Bytecode: {s}\n", .{compact_hex});
    try stdout.writeAll("Compact: ");

    for (compact_insts, 0..) |inst, i| {
        if (i > 0) try stdout.writeAll(" ; ");

        const formatted = try Bytecode.formatInstruction(allocator, inst);
        defer allocator.free(formatted);

        // Extract just opcode part (after ": ")
        var part: []const u8 = formatted;
        if (std.mem.indexOf(u8, formatted, ": ")) |idx| {
            part = formatted[idx + 2 ..];
        }

        try stdout.writeAll(part);
    }
    try stdout.writeAll("\n\n");

    // ============================================================
    // Export Disassembly
    // ============================================================

    try stdout.writeAll("--- Export Disassembly ---\n\n");

    const export_hex = "0x60016002015b00";
    const export_code = try Bytecode.fromHex(allocator, export_hex);
    defer allocator.free(export_code);

    try stdout.writeAll("Exported disassembly:\n");
    try stdout.writeAll("; Bytecode disassembly\n");
    try stdout.print(";   Size: {d} bytes\n", .{export_code.len});
    try stdout.print(";   Hex: {s}\n", .{export_hex});
    try stdout.writeAll("\n");

    const export_disasm = try Bytecode.formatInstructions(allocator, export_code);
    defer {
        for (export_disasm) |line| allocator.free(line);
        allocator.free(export_disasm);
    }

    for (export_disasm) |line| {
        try stdout.print("{s}\n", .{line});
    }
    try stdout.writeAll("\n");

    try stdout.writeAll("=== Example Complete ===\n\n");
}
