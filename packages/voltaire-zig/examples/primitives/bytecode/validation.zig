//! Bytecode Validation Example
//!
//! Demonstrates:
//! - Validating bytecode structure
//! - Detecting incomplete PUSH instructions
//! - Safe parsing patterns
//! - Validation edge cases

const std = @import("std");
const primitives = @import("primitives");
const Bytecode = primitives.bytecode.Bytecode;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdout = std.io.getStdOut().writer();

    try stdout.writeAll("\n=== Bytecode Validation Example ===\n\n");

    // ============================================================
    // Basic Validation
    // ============================================================

    try stdout.writeAll("--- Basic Validation ---\n\n");

    const valid_hex = "0x60016002015b00";
    const valid_code = try Bytecode.fromHex(allocator, valid_hex);
    defer allocator.free(valid_code);

    try stdout.print("Valid code: {s}\n", .{valid_hex});
    try stdout.print("  Validation: {}\n\n", .{Bytecode.validate(valid_code)});

    const invalid_push1_hex = "0x60";
    const invalid_push1 = try Bytecode.fromHex(allocator, invalid_push1_hex);
    defer allocator.free(invalid_push1);

    try stdout.print("Incomplete PUSH1: {s}\n", .{invalid_push1_hex});
    try stdout.print("  Validation: {}\n\n", .{Bytecode.validate(invalid_push1)});

    const invalid_push2_hex = "0x6101";
    const invalid_push2 = try Bytecode.fromHex(allocator, invalid_push2_hex);
    defer allocator.free(invalid_push2);

    try stdout.print("Incomplete PUSH2: {s}\n", .{invalid_push2_hex});
    try stdout.print("  Validation: {}\n\n", .{Bytecode.validate(invalid_push2)});

    // ============================================================
    // PUSH Instruction Validation
    // ============================================================

    try stdout.writeAll("--- PUSH Instruction Validation ---\n\n");

    const PushTest = struct {
        opcode: u8,
        size: usize,
        name: []const u8,
    };

    const push_tests = [_]PushTest{
        .{ .opcode = 0x60, .size = 1, .name = "PUSH1" },
        .{ .opcode = 0x61, .size = 2, .name = "PUSH2" },
        .{ .opcode = 0x6f, .size = 16, .name = "PUSH16" },
        .{ .opcode = 0x7f, .size = 32, .name = "PUSH32" },
    };

    for (push_tests) |test_case| {
        // Valid - complete PUSH
        var valid_bytes = try allocator.alloc(u8, 1 + test_case.size);
        defer allocator.free(valid_bytes);

        valid_bytes[0] = test_case.opcode;
        for (valid_bytes[1..]) |*byte| {
            byte.* = 0xff;
        }

        try stdout.print("{s} valid ({d} bytes): {}\n", .{
            test_case.name,
            test_case.size,
            Bytecode.validate(valid_bytes),
        });

        // Invalid - incomplete PUSH
        var invalid_bytes = try allocator.alloc(u8, test_case.size);
        defer allocator.free(invalid_bytes);

        invalid_bytes[0] = test_case.opcode;
        for (invalid_bytes[1..]) |*byte| {
            byte.* = 0xff;
        }

        try stdout.print("{s} incomplete ({d} bytes): {}\n\n", .{
            test_case.name,
            test_case.size - 1,
            Bytecode.validate(invalid_bytes),
        });
    }

    // ============================================================
    // Truncated Bytecode Detection
    // ============================================================

    try stdout.writeAll("--- Truncated Bytecode Detection ---\n\n");

    const TruncatedTest = struct {
        name: []const u8,
        hex: []const u8,
        expected_valid: bool,
    };

    const truncated_tests = [_]TruncatedTest{
        .{ .name = "Ends with PUSH1 opcode", .hex = "0x6001600260", .expected_valid = false },
        .{ .name = "Ends with PUSH2 opcode + 1 byte", .hex = "0x60016101ff", .expected_valid = false },
        .{ .name = "Complete bytecode", .hex = "0x600161ffff00", .expected_valid = true },
        .{ .name = "Ends with PUSH32 + partial data", .hex = "0x7fffffffffffffffffffff", .expected_valid = false },
    };

    for (truncated_tests) |test_case| {
        const code = try Bytecode.fromHex(allocator, test_case.hex);
        defer allocator.free(code);

        const valid = Bytecode.validate(code);
        const status: []const u8 = if (valid) "✓" else "✗";

        try stdout.print("{s}:\n", .{test_case.name});
        try stdout.print("  Hex: {s}\n", .{test_case.hex});
        try stdout.print("  Expected: {}\n", .{test_case.expected_valid});
        try stdout.print("  Actual: {} {s}\n\n", .{ valid, status });
    }

    // ============================================================
    // Safe Parsing Pattern
    // ============================================================

    try stdout.writeAll("--- Safe Parsing Pattern ---\n\n");

    const TestCase = struct {
        hex: []const u8,
        should_pass: bool,
    };

    const test_cases = [_]TestCase{
        .{ .hex = "0x60016002015b00", .should_pass = true },
        .{ .hex = "0x60", .should_pass = false },
        .{ .hex = "0x6101", .should_pass = false },
    };

    for (test_cases) |test_case| {
        const code = Bytecode.fromHex(allocator, test_case.hex) catch {
            try stdout.print("✗ Failed to parse: {s}\n\n", .{test_case.hex});
            continue;
        };
        defer allocator.free(code);

        if (Bytecode.validate(code)) {
            const hex = try Bytecode.toHex(allocator, code);
            defer allocator.free(hex);
            try stdout.print("✓ Parsed: {s}\n\n", .{hex});
        } else {
            const expected: []const u8 = if (test_case.should_pass) "unexpected" else "expected";
            try stdout.print("✗ Failed ({s}): {s}\n", .{ expected, test_case.hex });
            try stdout.writeAll("  Error: Invalid bytecode structure\n\n");
        }
    }

    // ============================================================
    // Validation Before Analysis
    // ============================================================

    try stdout.writeAll("--- Validation Before Analysis ---\n\n");

    const valid_analysis_hex = "0x60016002015b00";
    const valid_analysis = try Bytecode.fromHex(allocator, valid_analysis_hex);
    defer allocator.free(valid_analysis);

    if (Bytecode.validate(valid_analysis)) {
        const analysis = try Bytecode.analyze(allocator, valid_analysis);
        defer {
            for (analysis.instructions) |inst| {
                if (inst.pushData) |data| allocator.free(data);
            }
            allocator.free(analysis.instructions);
            allocator.free(analysis.jumpDestinations);
        }

        try stdout.writeAll("✓ Valid bytecode analyzed successfully\n");
        try stdout.print("  Instructions: {d}\n", .{analysis.instructions.len});
        try stdout.print("  Jump destinations: {d}\n\n", .{analysis.jumpDestinations.len});
    }

    const invalid_analysis_hex = "0x60";
    const invalid_analysis = try Bytecode.fromHex(allocator, invalid_analysis_hex);
    defer allocator.free(invalid_analysis);

    if (!Bytecode.validate(invalid_analysis)) {
        try stdout.writeAll("✓ Invalid bytecode rejected\n");
        try stdout.writeAll("  Error: Cannot analyze invalid bytecode\n\n");
    }

    // ============================================================
    // Edge Cases
    // ============================================================

    try stdout.writeAll("--- Edge Cases ---\n\n");

    const EdgeCase = struct {
        name: []const u8,
        hex: []const u8,
        expected_valid: bool,
    };

    const edge_cases = [_]EdgeCase{
        .{ .name = "Empty bytecode", .hex = "0x", .expected_valid = true },
        .{ .name = "Single STOP opcode", .hex = "0x00", .expected_valid = true },
        .{ .name = "Only non-PUSH opcodes", .hex = "0x010203045b00", .expected_valid = true },
        .{ .name = "PUSH32 with all data", .hex = "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00", .expected_valid = true },
        .{ .name = "PUSH32 missing 1 byte", .hex = "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", .expected_valid = false },
        .{ .name = "Multiple incomplete PUSH", .hex = "0x60016161", .expected_valid = false },
    };

    for (edge_cases) |test_case| {
        const code = try Bytecode.fromHex(allocator, test_case.hex);
        defer allocator.free(code);

        const valid = Bytecode.validate(code);
        const match = valid == test_case.expected_valid;
        const status: []const u8 = if (match) "✓" else "✗";

        try stdout.print("{s}: {s}\n", .{ test_case.name, status });
        try stdout.print("  Size: {d} bytes\n", .{code.len});
        try stdout.print("  Expected: {}\n", .{test_case.expected_valid});
        try stdout.print("  Actual: {}\n\n", .{valid});
    }

    // ============================================================
    // Validation vs Analysis
    // ============================================================

    try stdout.writeAll("--- Validation vs Analysis ---\n\n");
    try stdout.writeAll("Note: validate() checks structure, not semantics\n\n");

    const SemanticTest = struct {
        name: []const u8,
        hex: []const u8,
        note: []const u8,
    };

    const semantic_tests = [_]SemanticTest{
        .{ .name = "Stack underflow (ADD with empty stack)", .hex = "0x01", .note = "Valid structure but would fail at runtime" },
        .{ .name = "Dead code after RETURN", .hex = "0xf360016002", .note = "Valid structure but unreachable code" },
        .{ .name = "Undefined opcode", .hex = "0xef00", .note = "0xef not defined but structurally valid" },
        .{ .name = "Invalid jump target", .hex = "0x6000560000", .note = "Jump to non-JUMPDEST" },
    };

    for (semantic_tests) |test_case| {
        const code = try Bytecode.fromHex(allocator, test_case.hex);
        defer allocator.free(code);

        const valid = Bytecode.validate(code);
        const analysis = try Bytecode.analyze(allocator, code);
        defer {
            for (analysis.instructions) |inst| {
                if (inst.pushData) |data| allocator.free(data);
            }
            allocator.free(analysis.instructions);
            allocator.free(analysis.jumpDestinations);
        }

        try stdout.print("{s}:\n", .{test_case.name});
        try stdout.print("  Hex: {s}\n", .{test_case.hex});
        try stdout.print("  Structure valid: {}\n", .{valid});
        try stdout.print("  Analysis valid: {}\n", .{analysis.valid});
        try stdout.print("  Note: {s}\n\n", .{test_case.note});
    }

    // ============================================================
    // Batch Validation
    // ============================================================

    try stdout.writeAll("--- Batch Validation ---\n\n");

    const bytecodes = [_][]const u8{
        "0x60016002015b00",
        "0x608060405234801561001057600080fd5b50",
        "0x60",
        "0x6101",
        "0x",
        "0x00",
    };

    var valid_count: usize = 0;
    var invalid_count: usize = 0;

    try stdout.writeAll("Validating bytecode batch:\n");

    for (bytecodes) |hex| {
        const code = try Bytecode.fromHex(allocator, hex);
        defer allocator.free(code);

        const valid = Bytecode.validate(code);

        if (valid) {
            valid_count += 1;
            const display = if (hex.len > 20) hex[0..20] else hex;
            const suffix: []const u8 = if (hex.len > 20) "..." else "";
            try stdout.print("  ✓ {s}{s}\n", .{ display, suffix });
        } else {
            invalid_count += 1;
            try stdout.print("  ✗ {s} (invalid)\n", .{hex});
        }
    }

    try stdout.print("\nResults: {d} valid, {d} invalid\n\n", .{ valid_count, invalid_count });

    try stdout.writeAll("=== Example Complete ===\n\n");
}
