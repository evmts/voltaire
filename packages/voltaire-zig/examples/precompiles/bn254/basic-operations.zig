const std = @import("std");
const precompiles = @import("precompiles");

/// BN254 Precompiles - Basic Operations
///
/// Three BN254 precompiles on alt_bn128 curve:
/// - 0x06: ECADD - Point addition (150 gas)
/// - 0x07: ECMUL - Scalar multiplication (6,000 gas)
/// - 0x08: ECPAIRING - Pairing check (45,000 + 34,000k gas)
pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== BN254 Precompiles - Basic Operations ===\n\n", .{});

    // G1 generator point
    const G1_X: u256 = 1;
    const G1_Y: u256 = 2;

    // Example 1: ECADD - Point Addition
    try stdout.print("1. ECADD - G1 Point Addition (0x06)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    // Add G1 + G1 = 2G
    var ecadd_input: [128]u8 = [_]u8{0} ** 128;

    // Point 1: G1
    std.mem.writeInt(u256, ecadd_input[0..32], G1_X, .big);
    std.mem.writeInt(u256, ecadd_input[32..64], G1_Y, .big);

    // Point 2: G1
    std.mem.writeInt(u256, ecadd_input[64..96], G1_X, .big);
    std.mem.writeInt(u256, ecadd_input[96..128], G1_Y, .big);

    try stdout.print("Adding G1 + G1 = 2G\n", .{});
    try stdout.print("Input: 128 bytes (2 points × 64 bytes)\n\n", .{});

    var ecadd_output: [64]u8 = undefined;
    const ecadd_gas = try precompiles.bn254Add(&ecadd_input, &ecadd_output);

    try stdout.print("✓ Success\n", .{});
    try stdout.print("Gas used: {d}\n", .{ecadd_gas});

    const result_x = std.mem.readInt(u256, ecadd_output[0..32], .big);
    const result_y = std.mem.readInt(u256, ecadd_output[32..64], .big);

    try stdout.print("Result 2G:\n", .{});
    try stdout.print("  x = {d}\n", .{result_x});
    try stdout.print("  y = {d}\n\n", .{result_y});

    // Example 2: ECMUL - Scalar Multiplication
    try stdout.print("2. ECMUL - G1 Scalar Multiplication (0x07)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    const scalar: u256 = 42;

    var ecmul_input: [96]u8 = [_]u8{0} ** 96;
    std.mem.writeInt(u256, ecmul_input[0..32], G1_X, .big);
    std.mem.writeInt(u256, ecmul_input[32..64], G1_Y, .big);
    std.mem.writeInt(u256, ecmul_input[64..96], scalar, .big);

    try stdout.print("Computing {d} × G1\n", .{scalar});
    try stdout.print("Input: 96 bytes (point + scalar)\n\n", .{});

    var ecmul_output: [64]u8 = undefined;
    const ecmul_gas = try precompiles.bn254Mul(&ecmul_input, &ecmul_output);

    try stdout.print("✓ Success\n", .{});
    try stdout.print("Gas used: {d}\n", .{ecmul_gas});

    const mul_x = std.mem.readInt(u256, ecmul_output[0..32], .big);
    const mul_y = std.mem.readInt(u256, ecmul_output[32..64], .big);

    try stdout.print("Result {d}G:\n", .{scalar});
    try stdout.print("  x = {d}\n", .{mul_x});
    try stdout.print("  y = {d}\n\n", .{mul_y});

    // Example 3: Point at infinity
    try stdout.print("3. Point at Infinity (Identity Element)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    var identity_input: [128]u8 = [_]u8{0} ** 128;
    std.mem.writeInt(u256, identity_input[0..32], G1_X, .big);
    std.mem.writeInt(u256, identity_input[32..64], G1_Y, .big);
    // Second point is (0, 0) = infinity

    try stdout.print("Adding G1 + O = G1 (identity law)\n\n", .{});

    var identity_output: [64]u8 = undefined;
    const identity_gas = try precompiles.bn254Add(&identity_input, &identity_output);

    const id_x = std.mem.readInt(u256, identity_output[0..32], .big);
    const id_y = std.mem.readInt(u256, identity_output[32..64], .big);

    try stdout.print("✓ Success\n", .{});
    try stdout.print("Gas used: {d}\n", .{identity_gas});
    try stdout.print("Result equals G1: {}\n\n", .{id_x == G1_X and id_y == G1_Y});

    // Example 4: Scalar multiplication edge cases
    try stdout.print("4. Scalar Multiplication Edge Cases\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    const test_scalars = [_]struct { value: u256, desc: []const u8 }{
        .{ .value = 0, .desc = "Zero (should return infinity)" },
        .{ .value = 1, .desc = "One (should return G1)" },
    };

    for (test_scalars) |test_case| {
        var edge_input: [96]u8 = [_]u8{0} ** 96;
        std.mem.writeInt(u256, edge_input[0..32], G1_X, .big);
        std.mem.writeInt(u256, edge_input[32..64], G1_Y, .big);
        std.mem.writeInt(u256, edge_input[64..96], test_case.value, .big);

        var edge_output: [64]u8 = undefined;
        _ = try precompiles.bn254Mul(&edge_input, &edge_output);

        const edge_x = std.mem.readInt(u256, edge_output[0..32], .big);
        const edge_y = std.mem.readInt(u256, edge_output[32..64], .big);

        const is_infinity = edge_x == 0 and edge_y == 0;
        const is_g1 = edge_x == G1_X and edge_y == G1_Y;

        const result_desc = if (is_infinity) "infinity" else if (is_g1) "G1" else "other point";

        try stdout.print("  {s}: {s}\n", .{ test_case.desc, result_desc });
    }

    try stdout.print("\n", .{});

    // Example 5: Gas cost summary
    try stdout.print("5. Gas Cost Summary\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("Post-Istanbul (EIP-1108) gas costs:\n", .{});
    try stdout.print("  ECADD (0x06):    150 gas\n", .{});
    try stdout.print("  ECMUL (0x07):  6,000 gas\n", .{});
    try stdout.print("  ECPAIRING base: 45,000 gas\n", .{});
    try stdout.print("  ECPAIRING/pair: 34,000 gas\n\n", .{});

    try stdout.print("Common operations:\n", .{});
    try stdout.print("  Point addition:       150 gas\n", .{});
    try stdout.print("  Scalar multiplication: 6,000 gas (40× more)\n", .{});
    try stdout.print("  2-pair pairing:     113,000 gas\n", .{});
    try stdout.print("  4-pair pairing:     181,000 gas (Groth16)\n\n", .{});

    try stdout.print("=== Complete ===\n\n", .{});
    try stdout.print("Key Points:\n", .{});
    try stdout.print("- ECADD: Cheapest at 150 gas\n", .{});
    try stdout.print("- ECMUL: 40× more expensive than addition\n", .{});
    try stdout.print("- Prefer addition when possible\n", .{});
    try stdout.print("- All operations enforce curve validity\n", .{});
    try stdout.print("- Critical for zkSNARK verification\n", .{});
}
