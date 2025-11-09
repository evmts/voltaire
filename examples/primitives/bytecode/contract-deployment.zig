//! Contract Deployment Analysis Example
//!
//! Demonstrates:
//! - Analyzing contract creation bytecode
//! - Analyzing deployed runtime bytecode
//! - Comparing creation vs runtime code
//! - Extracting constructor arguments
//! - Verifying deployed contracts

const std = @import("std");
const primitives = @import("primitives");
const Bytecode = primitives.bytecode.Bytecode;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdout = std.io.getStdOut().writer();

    try stdout.writeAll("\n=== Contract Deployment Analysis Example ===\n\n");

    // ============================================================
    // Understanding Contract Bytecode
    // ============================================================

    try stdout.writeAll("--- Understanding Contract Bytecode ---\n\n");
    try stdout.writeAll("Contract deployment involves two types of bytecode:\n");
    try stdout.writeAll("1. Creation bytecode: Contains constructor + runtime code\n");
    try stdout.writeAll("2. Runtime bytecode: Stored on-chain after deployment\n\n");

    // ============================================================
    // Simple Contract Example
    // ============================================================

    try stdout.writeAll("--- Simple Contract Example ---\n\n");

    const creation_hex = "0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5b610055600480360381019061005091906100c3565b610075565b005b61005f61007f565b60405161006c91906100ff565b60405180910390f35b8060008190555050565b60008054905090565b600080fd5b6000819050919050565b6100a08161008d565b81146100ab57600080fd5b50565b6000813590506100bd81610097565b92915050565b6000602082840312156100d9576100d8610088565b5b60006100e7848285016100ae565b91505092915050565b6100f98161008d565b82525050565b600060208201905061011460008301846100f0565b92915050565b";

    const runtime_hex = "0x608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5b610055600480360381019061005091906100c3565b610075565b005b61005f61007f565b60405161006c91906100ff565b60405180910390f35b8060008190555050565b60008054905090565b600080fd5b6000819050919050565b6100a08161008d565b81146100ab57600080fd5b50565b6000813590506100bd81610097565b92915050565b6000602082840312156100d9576100d8610088565b5b60006100e7848285016100ae565b91505092915050565b6100f98161008d565b82525050565b600060208201905061011460008301846100f0565b92915050565b";

    const creation_code = try Bytecode.fromHex(allocator, creation_hex);
    defer allocator.free(creation_code);

    const runtime_code = try Bytecode.fromHex(allocator, runtime_hex);
    defer allocator.free(runtime_code);

    try stdout.writeAll("Creation bytecode:\n");
    try stdout.print("  Size: {d} bytes\n", .{creation_code.len});
    try stdout.print("  Valid: {}\n", .{Bytecode.validate(creation_code)});

    var creation_hex_buf: [128]u8 = undefined;
    const creation_hex_str = try std.fmt.bufPrint(&creation_hex_buf, "{s}", .{creation_hex[0..@min(60, creation_hex.len)]});
    try stdout.print("  Hex: {s}...\n\n", .{creation_hex_str});

    try stdout.writeAll("Runtime bytecode:\n");
    try stdout.print("  Size: {d} bytes\n", .{runtime_code.len});
    try stdout.print("  Valid: {}\n", .{Bytecode.validate(runtime_code)});

    var runtime_hex_buf: [128]u8 = undefined;
    const runtime_hex_str = try std.fmt.bufPrint(&runtime_hex_buf, "{s}", .{runtime_hex[0..@min(60, runtime_hex.len)]});
    try stdout.print("  Hex: {s}...\n\n", .{runtime_hex_str});

    // ============================================================
    // Analyzing Creation Bytecode
    // ============================================================

    try stdout.writeAll("--- Analyzing Creation Bytecode ---\n\n");

    const creation_analysis = try Bytecode.analyze(allocator, creation_code);
    defer {
        for (creation_analysis.instructions) |inst| {
            if (inst.pushData) |data| allocator.free(data);
        }
        allocator.free(creation_analysis.instructions);
        allocator.free(creation_analysis.jumpDestinations);
    }

    try stdout.writeAll("Creation bytecode analysis:\n");
    try stdout.print("  Valid: {}\n", .{creation_analysis.valid});
    try stdout.print("  Instructions: {d}\n", .{creation_analysis.instructions.len});
    try stdout.print("  Jump destinations: {d}\n", .{creation_analysis.jumpDestinations.len});
    try stdout.print("  Has metadata: {}\n\n", .{Bytecode.hasMetadata(creation_code)});

    try stdout.writeAll("First 10 instructions:\n");
    const creation_disasm = try Bytecode.formatInstructions(allocator, creation_code);
    defer {
        for (creation_disasm) |line| allocator.free(line);
        allocator.free(creation_disasm);
    }

    const show_count = @min(10, creation_disasm.len);
    for (creation_disasm[0..show_count]) |line| {
        try stdout.print("  {s}\n", .{line});
    }

    if (creation_disasm.len > 10) {
        try stdout.print("  ... and {d} more\n", .{creation_disasm.len - 10});
    }
    try stdout.writeAll("\n");

    // ============================================================
    // Analyzing Runtime Bytecode
    // ============================================================

    try stdout.writeAll("--- Analyzing Runtime Bytecode ---\n\n");

    const runtime_analysis = try Bytecode.analyze(allocator, runtime_code);
    defer {
        for (runtime_analysis.instructions) |inst| {
            if (inst.pushData) |data| allocator.free(data);
        }
        allocator.free(runtime_analysis.instructions);
        allocator.free(runtime_analysis.jumpDestinations);
    }

    try stdout.writeAll("Runtime bytecode analysis:\n");
    try stdout.print("  Valid: {}\n", .{runtime_analysis.valid});
    try stdout.print("  Instructions: {d}\n", .{runtime_analysis.instructions.len});
    try stdout.print("  Jump destinations: {d}\n", .{runtime_analysis.jumpDestinations.len});
    try stdout.print("  Has metadata: {}\n\n", .{Bytecode.hasMetadata(runtime_code)});

    // ============================================================
    // Constructor with Arguments
    // ============================================================

    try stdout.writeAll("--- Constructor with Arguments ---\n\n");

    const with_args_hex = "0x608060405234801561001057600080fd5b506040516101503803806101508339818101604052810190610032919061007a565b806000819055505061009f565b600080fd5b6000819050919050565b61005781610044565b811461006257600080fd5b50565b6000815190506100748161004e565b92915050565b6000602082840312156100905761008f61003f565b5b600061009e84828501610065565b9150509190505056fe00000000000000000000000000000000000000000000000000000000000f4240";

    const with_args = try Bytecode.fromHex(allocator, with_args_hex);
    defer allocator.free(with_args);

    try stdout.writeAll("Bytecode with constructor arguments:\n");
    try stdout.print("  Total size: {d} bytes\n", .{with_args.len});

    var args_hex_buf: [128]u8 = undefined;
    const args_hex_str = try std.fmt.bufPrint(&args_hex_buf, "{s}", .{with_args_hex[0..@min(60, with_args_hex.len)]});
    try stdout.print("  Hex: {s}...\n\n", .{args_hex_str});

    // Extract constructor argument (last 32 bytes)
    if (with_args.len >= 32) {
        const arg_data = with_args[with_args.len - 32 ..];

        var arg_value: u256 = 0;
        for (arg_data) |byte| {
            arg_value = (arg_value << 8) | byte;
        }

        try stdout.writeAll("Constructor argument extraction:\n");
        try stdout.writeAll("  Raw bytes: 0x");
        for (arg_data) |byte| {
            try stdout.print("{x:0>2}", .{byte});
        }
        try stdout.writeAll("\n");
        try stdout.print("  Decoded value: {d}\n", .{arg_value});
        try stdout.print("  Decimal: {d}\n\n", .{arg_value});
    }

    // ============================================================
    // Verifying Deployed Contract
    // ============================================================

    try stdout.writeAll("--- Verifying Deployed Contract ---\n\n");

    const deployed_hex = "0x608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5ba264697066733a221220aaaa640033";
    const expected_hex = "0x608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5ba264697066733a221220bbbb640033";

    const deployed = try Bytecode.fromHex(allocator, deployed_hex);
    defer allocator.free(deployed);

    const expected = try Bytecode.fromHex(allocator, expected_hex);
    defer allocator.free(expected);

    const deployed_stripped = Bytecode.stripMetadata(deployed);
    const expected_stripped = Bytecode.stripMetadata(expected);

    const verified = Bytecode.equals(deployed_stripped, expected_stripped);

    try stdout.writeAll("Contract verification:\n");
    try stdout.print("  Verified: {}\n", .{verified});

    if (!verified and deployed_stripped.len != expected_stripped.len) {
        try stdout.print("  Reason: Size mismatch: deployed={d}, expected={d}\n", .{
            deployed_stripped.len,
            expected_stripped.len,
        });
    } else if (!verified) {
        try stdout.writeAll("  Reason: Bytecode mismatch\n");
    }
    try stdout.writeAll("\n");

    // ============================================================
    // Comparing Creation vs Runtime
    // ============================================================

    try stdout.writeAll("--- Comparing Creation vs Runtime ---\n\n");

    const creation_size = creation_code.len;
    const runtime_size = runtime_code.len;
    const size_ratio = @as(f64, @floatFromInt(creation_size)) / @as(f64, @floatFromInt(runtime_size));

    try stdout.writeAll("Creation bytecode:\n");
    try stdout.print("  Size: {d} bytes\n", .{creation_size});
    try stdout.print("  Instructions: {d}\n", .{creation_analysis.instructions.len});
    try stdout.print("  Jump destinations: {d}\n", .{creation_analysis.jumpDestinations.len});
    try stdout.print("  Has metadata: {}\n\n", .{Bytecode.hasMetadata(creation_code)});

    try stdout.writeAll("Runtime bytecode:\n");
    try stdout.print("  Size: {d} bytes\n", .{runtime_size});
    try stdout.print("  Instructions: {d}\n", .{runtime_analysis.instructions.len});
    try stdout.print("  Jump destinations: {d}\n", .{runtime_analysis.jumpDestinations.len});
    try stdout.print("  Has metadata: {}\n\n", .{Bytecode.hasMetadata(runtime_code)});

    try stdout.writeAll("Comparison:\n");
    try stdout.print("  Size ratio: {d:.2}x\n", .{size_ratio});
    try stdout.print("  Instruction difference: {d}\n\n", .{
        @as(i64, @intCast(creation_analysis.instructions.len)) - @as(i64, @intCast(runtime_analysis.instructions.len)),
    });

    // ============================================================
    // Finding Function Selectors
    // ============================================================

    try stdout.writeAll("--- Finding Function Selectors ---\n\n");

    const runtime_insts = try Bytecode.parseInstructions(allocator, runtime_code);
    defer {
        for (runtime_insts) |inst| {
            if (inst.pushData) |data| allocator.free(data);
        }
        allocator.free(runtime_insts);
    }

    var selectors = std.ArrayList([]const u8).init(allocator);
    defer {
        for (selectors.items) |selector| allocator.free(selector);
        selectors.deinit();
    }

    // Look for PUSH4 instructions (function selectors are 4 bytes)
    for (runtime_insts) |inst| {
        if (inst.opcode == 0x63 and inst.pushData != null and inst.pushData.?.len == 4) {
            var selector_buf: [10]u8 = undefined;
            const selector_str = try std.fmt.bufPrint(&selector_buf, "0x{x:0>2}{x:0>2}{x:0>2}{x:0>2}", .{
                inst.pushData.?[0],
                inst.pushData.?[1],
                inst.pushData.?[2],
                inst.pushData.?[3],
            });
            const selector_copy = try allocator.dupe(u8, selector_str);
            try selectors.append(selector_copy);
        }
    }

    try stdout.writeAll("Function selectors found in runtime code:\n");
    if (selectors.items.len > 0) {
        for (selectors.items, 0..) |selector, i| {
            try stdout.print("  {d}. {s}\n", .{ i + 1, selector });
        }
    } else {
        try stdout.writeAll("  No PUSH4 selectors found\n");
    }
    try stdout.writeAll("\n");

    // ============================================================
    // Constructor Pattern Detection
    // ============================================================

    try stdout.writeAll("--- Constructor Pattern Detection ---\n\n");

    const creation_disasm2 = try Bytecode.formatInstructions(allocator, creation_code);
    defer {
        for (creation_disasm2) |line| allocator.free(line);
        allocator.free(creation_disasm2);
    }

    var has_codecopy = false;
    var has_return = false;

    for (creation_disasm2) |line| {
        if (std.mem.indexOf(u8, line, "CODECOPY")) |_| has_codecopy = true;
        if (std.mem.indexOf(u8, line, "RETURN")) |_| has_return = true;
    }

    try stdout.writeAll("Constructor detection:\n");
    try stdout.print("  Has constructor: {}\n", .{has_codecopy and has_return});
    if (has_codecopy and has_return) {
        try stdout.writeAll("  Pattern: Standard Solidity constructor (CODECOPY + RETURN)\n");
    }
    try stdout.writeAll("\n");

    try stdout.writeAll("=== Example Complete ===\n\n");
}
