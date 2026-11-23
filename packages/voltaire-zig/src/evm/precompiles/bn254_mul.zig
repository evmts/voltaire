const std = @import("std");
const crypto = @import("crypto");
const bn254 = crypto.bn254;
const Hardfork = @import("primitives").Hardfork;
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BN254 multiplication from Istanbul (EIP-1108)
pub const GAS: u64 = 6000;
/// Gas cost for BN254 multiplication from Byzantium until Istanbul (EIP-196)
pub const BYZANTIUM_GAS: u64 = 40000;

/// Gas cost of BN254 multiplication at `hardfork`.
pub fn gasCost(hardfork: Hardfork) u64 {
    return if (hardfork.isAtLeast(.ISTANBUL)) GAS else BYZANTIUM_GAS;
}

/// 0x07: BN254MUL - BN254 elliptic curve scalar multiplication, at the Istanbul price.
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    return executeAtGas(allocator, input, gas_limit, GAS);
}

/// 0x07: BN254MUL priced for `hardfork` (EIP-196 before Istanbul, EIP-1108 after).
pub fn executeWithHardfork(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
    hardfork: Hardfork,
) PrecompileError!PrecompileResult {
    return executeAtGas(allocator, input, gas_limit, gasCost(hardfork));
}

fn executeAtGas(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
    gas_cost: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    // Input: 96 bytes (point 64 bytes + scalar 32 bytes)
    var input_buf: [96]u8 = [_]u8{0} ** 96;
    @memcpy(input_buf[0..@min(input.len, 96)], input[0..@min(input.len, 96)]);

    const output = try allocator.alloc(u8, 64);
    errdefer allocator.free(output);
    @memset(output, 0);

    // Perform multiplication using pure Zig implementation
    bn254.bn254Mul(&input_buf, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

test "bn254Mul - multiply by zero" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Multiply any point by zero = point at infinity
    const input = [_]u8{0} ** 96;
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqual(GAS, result.gas_used);
}

test "bn254Mul - out of gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 96;
    const result = execute(allocator, &input, GAS - 1);
    try testing.expectError(error.OutOfGas, result);
}

test "bn254Mul - exact gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 96;
    const result = try execute(allocator, &input, GAS);
    defer result.deinit(allocator);

    try testing.expectEqual(GAS, result.gas_used);
}

test "bn254Mul - input too short" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 95;
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "bn254Mul - input too long padded correctly" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 150;
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "bn254Mul - zero input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{};
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "bn254Mul - gas cost constant" {
    const testing = std.testing;

    try testing.expectEqual(@as(u64, 6000), GAS);
}

test "bn254Mul - output size validation" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 96;
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

// ============================================================================
// Official Ethereum Test Vectors from go-ethereum
// Source: https://github.com/ethereum/go-ethereum/blob/master/core/vm/testdata/precompiles/bn256ScalarMul.json
// ============================================================================

test "bn254Mul - geth chfast1" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input_hex = "2bd3e6d0f3b142924f5ca7b49ce5b9d54c4703d7ae5648e61d02268b1a0a9fb721611ce0a6af85915e2f1d70300909ce2e49dfad4a4619c8390cae66cefdb20400000000000000000000000000000000000000000000000011138ce750fa15c2";
    const expected_hex = "070a8d6a982153cae4be29d434e8faef8a47b274a053f5a4ee2a6c9c13c31e5c031b8ce914eba3a9ffb989f9cdd5b0f01943074bf4f0f315690ec3cec6981afc";

    var input: [96]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth chfast2" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input_hex = "070a8d6a982153cae4be29d434e8faef8a47b274a053f5a4ee2a6c9c13c31e5c031b8ce914eba3a9ffb989f9cdd5b0f01943074bf4f0f315690ec3cec6981afc30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd46";
    const expected_hex = "025a6f4181d2b4ea8b724290ffb40156eb0adb514c688556eb79cdea0752c2bb2eff3f31dea215f1eb86023a133a996eb6300b44da664d64251d05381bb8a02e";

    var input: [96]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth chfast3" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input_hex = "025a6f4181d2b4ea8b724290ffb40156eb0adb514c688556eb79cdea0752c2bb2eff3f31dea215f1eb86023a133a996eb6300b44da664d64251d05381bb8a02e183227397098d014dc2822db40c0ac2ecbc0b548b438e5469e10460b6c3e7ea3";
    const expected_hex = "14789d0d4a730b354403b5fac948113739e276c23e0258d8596ee72f9cd9d3230af18a63153e0ec25ff9f2951dd3fa90ed0197bfef6e2a1a62b5095b9d2b4a27";

    var input: [96]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth cdetrio1 empty input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{};
    const expected = [_]u8{0} ** 64;

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth cdetrio2 zero scalar" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input_hex = "039730ea8dff1254c0fee9c0ea777d29a9c710b7e616683f194f18c43b43b869073a5ffcc6fc7a28c30723d6e58ce577356982d65b833a5a5c15bf9024b43d980000000000000000000000000000000000000000000000000000000000000000";
    const expected_hex = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    var input: [96]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth cdetrio3 scalar 1" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input_hex = "039730ea8dff1254c0fee9c0ea777d29a9c710b7e616683f194f18c43b43b869073a5ffcc6fc7a28c30723d6e58ce577356982d65b833a5a5c15bf9024b43d980000000000000000000000000000000000000000000000000000000000000001";
    const expected_hex = "039730ea8dff1254c0fee9c0ea777d29a9c710b7e616683f194f18c43b43b869073a5ffcc6fc7a28c30723d6e58ce577356982d65b833a5a5c15bf9024b43d98";

    var input: [96]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth cdetrio4 scalar 2" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Expected value is 2 * P for the on-curve input point P.
    // Checked against an independent affine-coordinate reference implementation.

    const input_hex = "039730ea8dff1254c0fee9c0ea777d29a9c710b7e616683f194f18c43b43b869073a5ffcc6fc7a28c30723d6e58ce577356982d65b833a5a5c15bf9024b43d980000000000000000000000000000000000000000000000000000000000000002";
    const expected_hex = "2dbc7ba68f840c758c76373cd37b2cd78d6b02bee047cf401e8db90d73ce56f7062800987ee0dae9f9f36e1f050eb2621cbb4aa7c50b1c168ecc319370889de2";

    var input: [96]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth cdetrio5 invalid point not on curve" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // (1, 1) does not satisfy y^2 = x^3 + 3.

    const input_hex = "000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001";

    var input: [96]u8 = undefined;
    _ = try std.fmt.hexToBytes(&input, input_hex);

    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidPoint, result);
}

test "bn254Mul - geth cdetrio6 generator multiply by group order" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // n * G is the point at infinity for the BN254 group order
    // n = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001.

    const input_hex = "0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000230644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001";
    const expected_hex = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    var input: [96]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth cdetrio7 large scalar" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // (2^256 - 1) * G: the scalar is reduced modulo the group order.
    // Checked against an independent affine-coordinate reference implementation.

    const input_hex = "00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    const expected_hex = "2f588cffe99db877a4434b598ab28f81e0522910ea52b45f0adaa772b2d5d35212f42fa8fd34fb1b33d8c6a718b6590198389b26fc9d8808d971f8b009777a97";

    var input: [96]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth cdetrio8 large x coordinate multiplication" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input_hex = "17c139df0efee0f766bc0204762b774362e4ded88953a39ce849a8a7fa163fa901e0559bacb160664764a357af8a9fe70baa9258e0b959273ffc5718c6d4cc7c00000000000000000000000000000000000000000000000000000000000000";

    var input: [95]u8 = undefined;
    _ = try std.fmt.hexToBytes(&input, input_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "bn254Mul - geth cdetrio9 multiply by field order" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // p * G for the field modulus p, which is larger than the group order n: p * G = (p - n) * G.
    // Checked against an independent affine-coordinate reference implementation.

    const input_hex = "0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000230644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47";
    const expected_hex = "113aeccecdaf57cd8c0aace591774949dcdaf892555fa86726fa7e679b89c067246493eeceb7867dda07bb342fd7b460b44635e9f8db1f922a7541a9e93e63ce";

    var input: [96]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth cdetrio10 invalid coordinate at field modulus" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input_hex = "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47000000000000000000000000000000000000000000000000000000000000000030644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47";

    var input: [96]u8 = undefined;
    _ = try std.fmt.hexToBytes(&input, input_hex);

    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidPoint, result);
}

test "bn254Mul - geth cdetrio11 invalid coordinate exceeds field modulus" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input_hex = "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd48000000000000000000000000000000000000000000000000000000000000000030644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47";

    var input: [96]u8 = undefined;
    _ = try std.fmt.hexToBytes(&input, input_hex);

    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidPoint, result);
}

test "bn254Mul - geth cdetrio12 partial input zero padded" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Only the point G = (1, 2) is supplied. EIP-196 right-pads the missing
    // scalar with zeros, and 0 * G is the point at infinity.

    const input_hex = "00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002";
    const expected_hex = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    var input: [64]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth cdetrio13 truncated valid point" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Only the point G = (1, 2) is supplied. EIP-196 right-pads the missing
    // scalar with zeros, and 0 * G is the point at infinity.

    const input_hex = "00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002";
    const expected_hex = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    var input: [64]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth cdetrio14 scalar between group and field order" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // (p - 1) * G, a scalar between the group order n and the field modulus p.
    // Checked against an independent affine-coordinate reference implementation.

    const input_hex = "0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000230644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd46";
    const expected_hex = "0ccbec17235f5b9cc5e42f3df6364a76ecdd0101ddda8fc5dc0ba0b59c0e562829c5588f6a70fe3f355665f3a1813dde5f24053278d75af5cfa62eea8f3e599a";

    var input: [96]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - geth cdetrio15 explicit zero scalar from geth" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input_hex = "039730ea8dff1254c0fee9c0ea777d29a9c710b7e616683f194f18c43b43b869073a5ffcc6fc7a28c30723d6e58ce577356982d65b833a5a5c15bf9024b43d980000000000000000000000000000000000000000000000000000000000000000";
    const expected_hex = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    var input: [96]u8 = undefined;
    var expected: [64]u8 = undefined;

    _ = try std.fmt.hexToBytes(&input, input_hex);
    _ = try std.fmt.hexToBytes(&expected, expected_hex);

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "bn254Mul - official EIP-196 vectors (go-ethereum bn256ScalarMul.json)" {
    try @import("utils.zig").expectVectors(execute, @embedFile("vectors/eip196_mul.txt"), 19);
}

test "bn254Mul - non-canonical coordinates that alias valid points are rejected" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Each case reduces modulo p to a valid input: (p + 1, 2) and (1, p + 2)
    // alias the generator (1, 2), and (p, 0) and (0, p) alias infinity.
    const cases = [_][]const u8{
        "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd48" ++ "0000000000000000000000000000000000000000000000000000000000000002",
        "0000000000000000000000000000000000000000000000000000000000000001" ++ "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd49",
        "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47" ++ "0000000000000000000000000000000000000000000000000000000000000000",
        "0000000000000000000000000000000000000000000000000000000000000000" ++ "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47",
    };
    for (cases) |case| {
        var input: [96]u8 = [_]u8{0} ** 96;
        _ = try std.fmt.hexToBytes(&input, case);
        input[95] = 1;
        try testing.expectError(error.InvalidPoint, execute(allocator, &input, 1_000_000));
    }

    // The scalar is not a field element: any 256-bit value is accepted.
    var input: [96]u8 = [_]u8{0xff} ** 96;
    @memset(input[0..64], 0);
    input[31] = 1;
    input[63] = 2;
    const result = try execute(allocator, &input, GAS);
    defer result.deinit(allocator);
    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "bn254Mul - Byzantium and Istanbul pricing" {
    const testing = std.testing;
    const allocator = testing.allocator;

    try testing.expectEqual(@as(u64, 40000), gasCost(.BYZANTIUM));
    try testing.expectEqual(@as(u64, 40000), gasCost(.PETERSBURG));
    try testing.expectEqual(@as(u64, 6000), gasCost(.ISTANBUL));
    try testing.expectEqual(@as(u64, 6000), gasCost(.PRAGUE));

    const input = [_]u8{0} ** 96;

    try testing.expectError(error.OutOfGas, executeWithHardfork(allocator, &input, 39999, .BYZANTIUM));
    const byzantium = try executeWithHardfork(allocator, &input, 40000, .BYZANTIUM);
    defer byzantium.deinit(allocator);
    try testing.expectEqual(@as(u64, 40000), byzantium.gas_used);

    try testing.expectError(error.OutOfGas, executeWithHardfork(allocator, &input, 5999, .ISTANBUL));
    const istanbul = try executeWithHardfork(allocator, &input, 6000, .ISTANBUL);
    defer istanbul.deinit(allocator);
    try testing.expectEqual(@as(u64, 6000), istanbul.gas_used);
}
