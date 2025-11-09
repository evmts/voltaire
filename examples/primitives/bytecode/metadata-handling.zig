const std = @import("std");
const primitives = @import("primitives");

/// Metadata Handling Example
///
/// Demonstrates:
/// - Understanding bytecode structure
/// - Detecting potential metadata regions
/// - Comparing bytecode for equivalence
/// - Working with bytecode sections

const Bytecode = primitives.bytecode.Bytecode;

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    try stdout.print("\n=== Metadata Handling Example (Zig) ===\n\n", .{});

    // ============================================================
    // Understanding Bytecode Structure
    // ============================================================

    try stdout.print("--- Understanding Bytecode Structure ---\n\n", .{});

    try stdout.print("Deployed contract bytecode typically consists of:\n", .{});
    try stdout.print("  1. Executable instructions\n", .{});
    try stdout.print("  2. Optional metadata (Solidity compiler)\n", .{});
    try stdout.print("  3. Metadata length marker (last 2 bytes)\n", .{});
    try stdout.print("\n", .{});

    // ============================================================
    // Analyzing Bytecode Sections
    // ============================================================

    try stdout.print("--- Analyzing Bytecode Sections ---\n\n", .{});

    // Simulated bytecode with potential metadata
    // Real metadata would be CBOR-encoded, this is simplified
    const full_code = [_]u8{
        0x60, 0x80, // PUSH1 0x80
        0x60, 0x40, // PUSH1 0x40
        0x52, // MSTORE
        0x00, // STOP
        // Potential metadata section (simplified)
        0xa2, 0x64, 0x69, 0x70, 0x66, 0x73, // "ipfs" marker
        0x12, 0x34, 0x56, 0x78, // fake hash
        0x00, 0x0a, // Length marker
    };

    var bytecode = try Bytecode.init(allocator, &full_code);
    defer bytecode.deinit();

    try stdout.print("Full bytecode: {} bytes\n", .{full_code.len});
    try stdout.print("Code: 0x", .{});
    for (full_code[0..@min(20, full_code.len)]) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    if (full_code.len > 20) {
        try stdout.print("...{x:0>2}{x:0>2}", .{ full_code[full_code.len - 2], full_code[full_code.len - 1] });
    }
    try stdout.print("\n\n", .{});

    // Check last 2 bytes (potential metadata length marker)
    const last_byte = full_code[full_code.len - 1];
    const second_last = full_code[full_code.len - 2];

    try stdout.print("Last 2 bytes: 0x{x:0>2}{x:0>2}\n", .{ second_last, last_byte });

    // Metadata length markers are typically 0x00 followed by 0x20-0x40
    if (second_last == 0x00 and last_byte >= 0x20 and last_byte <= 0x40) {
        try stdout.print("Potential metadata detected (length: {})\n", .{last_byte});
    } else {
        try stdout.print("No standard metadata marker detected\n", .{});
    }

    try stdout.print("\n", .{});

    // ============================================================
    // Extracting Code Section
    // ============================================================

    try stdout.print("--- Extracting Code Section ---\n\n", .{});

    // Find executable code section (before potential metadata)
    var code_end: usize = full_code.len;

    // Simple heuristic: if last 2 bytes look like metadata marker, exclude them
    if (full_code.len >= 2) {
        const marker = full_code[full_code.len - 1];
        if (full_code[full_code.len - 2] == 0x00 and marker >= 0x20 and marker <= 0x40) {
            // Metadata length includes the length marker itself
            const meta_len: usize = marker + 2;
            if (meta_len <= full_code.len) {
                code_end = full_code.len - meta_len;
            }
        }
    }

    try stdout.print("Executable code section: {} bytes\n", .{code_end});
    try stdout.print("Code: 0x", .{});
    for (full_code[0..code_end]) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n\n", .{});

    // ============================================================
    // Comparing Bytecode
    // ============================================================

    try stdout.print("--- Comparing Bytecode ---\n\n", .{});

    // Two versions of "same" contract (different metadata)
    const version1_code = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 };
    const version2_code = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 };

    var version1 = try Bytecode.init(allocator, &version1_code);
    defer version1.deinit();

    var version2 = try Bytecode.init(allocator, &version2_code);
    defer version2.deinit();

    try stdout.print("Version 1: 0x", .{});
    for (version1_code) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n", .{});

    try stdout.print("Version 2: 0x", .{});
    for (version2_code) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n", .{});

    // Compare byte-by-byte
    const equal = std.mem.eql(u8, version1.code, version2.code);
    try stdout.print("Bytecode equal: {}\n\n", .{equal});

    // ============================================================
    // Analyzing Jump Destinations Across Versions
    // ============================================================

    try stdout.print("--- Jump Destinations Across Versions ---\n\n", .{});

    const v1_jumpdests = version1.valid_jumpdests.count();
    const v2_jumpdests = version2.valid_jumpdests.count();

    try stdout.print("Version 1 JUMPDEST count: {}\n", .{v1_jumpdests});
    try stdout.print("Version 2 JUMPDEST count: {}\n", .{v2_jumpdests});

    if (v1_jumpdests == v2_jumpdests) {
        try stdout.print("JUMPDEST counts match\n", .{});

        // Check if same positions
        var all_match = true;
        var iter1 = version1.valid_jumpdests.iterator();
        while (iter1.next()) |entry1| {
            if (!version2.valid_jumpdests.contains(entry1.key_ptr.*)) {
                all_match = false;
                break;
            }
        }

        if (all_match) {
            try stdout.print("All JUMPDEST positions match\n", .{});
        } else {
            try stdout.print("JUMPDEST positions differ\n", .{});
        }
    } else {
        try stdout.print("JUMPDEST counts differ\n", .{});
    }

    try stdout.print("\n", .{});

    // ============================================================
    // Working with Bytecode Slices
    // ============================================================

    try stdout.print("--- Working with Bytecode Slices ---\n\n", .{});

    const large_code = [_]u8{
        0x60, 0x80, // PUSH1 0x80
        0x60, 0x40, // PUSH1 0x40
        0x52, // MSTORE
        0x34, // CALLVALUE
        0x80, // DUP1
        0x15, // ISZERO
        0x60, 0x0c, // PUSH1 12
        0x57, // JUMPI
        0x60, 0x00, // PUSH1 0
        0x80, // DUP1
        0xfd, // REVERT
        0x5b, // JUMPDEST (position 12)
        0x50, // POP
        0x00, // STOP
    };

    try stdout.print("Full bytecode: {} bytes\n", .{large_code.len});

    // Analyze just first 6 bytes
    const partial_code = large_code[0..6];

    var partial = try Bytecode.init(allocator, partial_code);
    defer partial.deinit();

    try stdout.print("Partial bytecode (first 6 bytes): 0x", .{});
    for (partial_code) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n", .{});

    try stdout.print("Partial JUMPDEST count: {}\n", .{partial.valid_jumpdests.count()});

    // Full bytecode
    var full = try Bytecode.init(allocator, &large_code);
    defer full.deinit();

    try stdout.print("Full JUMPDEST count: {}\n\n", .{full.valid_jumpdests.count()});

    // ============================================================
    // Bytecode Hash Comparison
    // ============================================================

    try stdout.print("--- Bytecode Hash Comparison ---\n\n", .{});

    const Hash = primitives.hash.Hash;

    // Hash full bytecode
    const hash1 = Hash.keccak256(&version1_code);
    const hash2 = Hash.keccak256(&version2_code);

    var h1_buf: [20]u8 = undefined;
    var h2_buf: [20]u8 = undefined;

    try stdout.print("Version 1 hash: {s}\n", .{Hash.format(hash1, 8, 6, &h1_buf)});
    try stdout.print("Version 2 hash: {s}\n", .{Hash.format(hash2, 8, 6, &h2_buf)});
    try stdout.print("Hashes equal: {}\n", .{Hash.equals(hash1, hash2)});

    try stdout.print("\n", .{});

    // ============================================================
    // Practical Usage Pattern
    // ============================================================

    try stdout.print("--- Practical Usage Pattern ---\n\n", .{});

    const deployed = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 };
    const expected = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 };

    var deployed_bc = try Bytecode.init(allocator, &deployed);
    defer deployed_bc.deinit();

    var expected_bc = try Bytecode.init(allocator, &expected);
    defer expected_bc.deinit();

    // Compare bytecode content
    const matches = std.mem.eql(u8, deployed_bc.code, expected_bc.code);

    try stdout.print("Contract verification:\n", .{});
    try stdout.print("  Deployed: {} bytes\n", .{deployed.len});
    try stdout.print("  Expected: {} bytes\n", .{expected.len});
    try stdout.print("  Match: {}\n", .{matches});

    if (matches) {
        try stdout.print("  Status: VERIFIED\n", .{});
    } else {
        try stdout.print("  Status: MISMATCH\n", .{});
    }

    try stdout.print("\n=== Example Complete ===\n\n", .{});
}
