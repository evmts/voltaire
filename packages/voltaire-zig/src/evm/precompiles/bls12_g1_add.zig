const std = @import("std");
const crypto = @import("crypto");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BLS12-381 G1 addition (EIP-2537)
pub const GAS: u64 = 375;

/// 0x0B: BLS12_G1ADD - BLS12-381 G1 addition (EIP-2537)
///
/// Input: 256 bytes, two G1 points of 128 bytes each. Output: 128 bytes.
/// A non-canonical coordinate or a point off the curve is an error. EIP-2537
/// specifies no subgroup check for this operation.
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < GAS) {
        return error.OutOfGas;
    }

    if (input.len != 256) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 128);
    errdefer allocator.free(output);
    @memset(output, 0);
    crypto.Crypto.bls12_381.g1Add(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}

// ============================================================================
// Tests
// ============================================================================

const testing = std.testing;

test "bls12_g1_add - gas cost validation" {
    const allocator = testing.allocator;

    // Point at infinity (128 bytes of zeros) + another point (128 bytes)
    var input: [256]u8 = [_]u8{0} ** 256;

    // Test with exact gas
    {
        const result = try execute(allocator, &input, GAS);
        defer result.deinit(allocator);
        try testing.expectEqual(GAS, result.gas_used);
    }

    // Test with more than enough gas
    {
        const result = try execute(allocator, &input, GAS + 1000);
        defer result.deinit(allocator);
        try testing.expectEqual(GAS, result.gas_used);
    }
}

test "bls12_g1_add - out of gas error" {
    const allocator = testing.allocator;
    var input: [256]u8 = [_]u8{0} ** 256;

    // Test with insufficient gas
    const result = execute(allocator, &input, GAS - 1);
    try testing.expectError(error.OutOfGas, result);
}

test "bls12_g1_add - invalid input length" {
    const allocator = testing.allocator;

    // Test with input too short
    {
        var input: [255]u8 = [_]u8{0} ** 255;
        const result = execute(allocator, &input, GAS);
        try testing.expectError(error.InvalidInput, result);
    }

    // Test with input too long
    {
        var input: [257]u8 = [_]u8{0} ** 257;
        const result = execute(allocator, &input, GAS);
        try testing.expectError(error.InvalidInput, result);
    }

    // Test with empty input
    {
        var input: [0]u8 = [_]u8{};
        const result = execute(allocator, &input, GAS);
        try testing.expectError(error.InvalidInput, result);
    }
}

test "bls12_g1_add - point at infinity operations" {
    const allocator = testing.allocator;

    // O + O = O (both points at infinity)
    {
        var input: [256]u8 = [_]u8{0} ** 256;
        const result = try execute(allocator, &input, GAS);
        defer result.deinit(allocator);

        try testing.expectEqual(@as(usize, 128), result.output.len);
        // Result should be point at infinity (all zeros)
        for (result.output) |byte| {
            try testing.expectEqual(@as(u8, 0), byte);
        }
    }

    // P + O = P (second point at infinity)
    {
        var input: [256]u8 = [_]u8{0} ** 256;
        // Set first point to generator point (x-coordinate least significant byte = 1)
        // BLS12-381 G1 generator x-coordinate (big-endian, 48 bytes padded to 64)
        // x = 0x17f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb
        const g1_x = [_]u8{
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x17, 0xf1, 0xd3, 0xa7, 0x31, 0x97, 0xd7, 0x94, 0x26, 0x95, 0x63, 0x8c, 0x4f, 0xa9, 0xac, 0x0f,
            0xc3, 0x68, 0x8c, 0x4f, 0x97, 0x74, 0xb9, 0x05, 0xa1, 0x4e, 0x3a, 0x3f, 0x17, 0x1b, 0xac, 0x58,
            0x6c, 0x55, 0xe8, 0x3f, 0xf9, 0x7a, 0x1a, 0xef, 0xfb, 0x3a, 0xf0, 0x0a, 0xdb, 0x22, 0xc6, 0xbb,
        };
        // y = 0x08b3f481e3aaa0f1a09e30ed741d8ae4fcf5e095d5d00af600db18cb2c04b3edd03cc744a2888ae40caa232946c5e7e1
        const g1_y = [_]u8{
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x08, 0xb3, 0xf4, 0x81, 0xe3, 0xaa, 0xa0, 0xf1, 0xa0, 0x9e, 0x30, 0xed, 0x74, 0x1d, 0x8a, 0xe4,
            0xfc, 0xf5, 0xe0, 0x95, 0xd5, 0xd0, 0x0a, 0xf6, 0x00, 0xdb, 0x18, 0xcb, 0x2c, 0x04, 0xb3, 0xed,
            0xd0, 0x3c, 0xc7, 0x44, 0xa2, 0x88, 0x8a, 0xe4, 0x0c, 0xaa, 0x23, 0x29, 0x46, 0xc5, 0xe7, 0xe1,
        };

        @memcpy(input[0..64], &g1_x);
        @memcpy(input[64..128], &g1_y);
        // Second point remains at infinity (all zeros)

        const result = try execute(allocator, &input, GAS);
        defer result.deinit(allocator);

        try testing.expectEqual(@as(usize, 128), result.output.len);
        // Result should be the generator point
        try testing.expectEqualSlices(u8, &g1_x, result.output[0..64]);
        try testing.expectEqualSlices(u8, &g1_y, result.output[64..128]);
    }

    // O + P = P (first point at infinity)
    {
        var input: [256]u8 = [_]u8{0} ** 256;
        const g1_x = [_]u8{
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x17, 0xf1, 0xd3, 0xa7, 0x31, 0x97, 0xd7, 0x94, 0x26, 0x95, 0x63, 0x8c, 0x4f, 0xa9, 0xac, 0x0f,
            0xc3, 0x68, 0x8c, 0x4f, 0x97, 0x74, 0xb9, 0x05, 0xa1, 0x4e, 0x3a, 0x3f, 0x17, 0x1b, 0xac, 0x58,
            0x6c, 0x55, 0xe8, 0x3f, 0xf9, 0x7a, 0x1a, 0xef, 0xfb, 0x3a, 0xf0, 0x0a, 0xdb, 0x22, 0xc6, 0xbb,
        };
        const g1_y = [_]u8{
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x08, 0xb3, 0xf4, 0x81, 0xe3, 0xaa, 0xa0, 0xf1, 0xa0, 0x9e, 0x30, 0xed, 0x74, 0x1d, 0x8a, 0xe4,
            0xfc, 0xf5, 0xe0, 0x95, 0xd5, 0xd0, 0x0a, 0xf6, 0x00, 0xdb, 0x18, 0xcb, 0x2c, 0x04, 0xb3, 0xed,
            0xd0, 0x3c, 0xc7, 0x44, 0xa2, 0x88, 0x8a, 0xe4, 0x0c, 0xaa, 0x23, 0x29, 0x46, 0xc5, 0xe7, 0xe1,
        };

        // First point at infinity (remains zeros)
        // Set second point to generator
        @memcpy(input[128..192], &g1_x);
        @memcpy(input[192..256], &g1_y);

        const result = try execute(allocator, &input, GAS);
        defer result.deinit(allocator);

        try testing.expectEqual(@as(usize, 128), result.output.len);
        // Result should be the generator point
        try testing.expectEqualSlices(u8, &g1_x, result.output[0..64]);
        try testing.expectEqualSlices(u8, &g1_y, result.output[64..128]);
    }
}

test "bls12_g1_add - generator point addition" {
    const allocator = testing.allocator;

    // G + G = 2G
    var input: [256]u8 = [_]u8{0} ** 256;
    const g1_x = [_]u8{
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x17, 0xf1, 0xd3, 0xa7, 0x31, 0x97, 0xd7, 0x94, 0x26, 0x95, 0x63, 0x8c, 0x4f, 0xa9, 0xac, 0x0f,
        0xc3, 0x68, 0x8c, 0x4f, 0x97, 0x74, 0xb9, 0x05, 0xa1, 0x4e, 0x3a, 0x3f, 0x17, 0x1b, 0xac, 0x58,
        0x6c, 0x55, 0xe8, 0x3f, 0xf9, 0x7a, 0x1a, 0xef, 0xfb, 0x3a, 0xf0, 0x0a, 0xdb, 0x22, 0xc6, 0xbb,
    };
    const g1_y = [_]u8{
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x08, 0xb3, 0xf4, 0x81, 0xe3, 0xaa, 0xa0, 0xf1, 0xa0, 0x9e, 0x30, 0xed, 0x74, 0x1d, 0x8a, 0xe4,
        0xfc, 0xf5, 0xe0, 0x95, 0xd5, 0xd0, 0x0a, 0xf6, 0x00, 0xdb, 0x18, 0xcb, 0x2c, 0x04, 0xb3, 0xed,
        0xd0, 0x3c, 0xc7, 0x44, 0xa2, 0x88, 0x8a, 0xe4, 0x0c, 0xaa, 0x23, 0x29, 0x46, 0xc5, 0xe7, 0xe1,
    };

    // Both points are generator
    @memcpy(input[0..64], &g1_x);
    @memcpy(input[64..128], &g1_y);
    @memcpy(input[128..192], &g1_x);
    @memcpy(input[192..256], &g1_y);

    const result = try execute(allocator, &input, GAS);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 128), result.output.len);
    // Result should be 2*G, not point at infinity
    var is_zero = true;
    for (result.output) |byte| {
        if (byte != 0) {
            is_zero = false;
            break;
        }
    }
    try testing.expect(!is_zero);
}

test "bls12_g1_add - point plus negative equals infinity" {
    const allocator = testing.allocator;

    // P + (-P) = O
    var input: [256]u8 = [_]u8{0} ** 256;
    const g1_x = [_]u8{
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x17, 0xf1, 0xd3, 0xa7, 0x31, 0x97, 0xd7, 0x94, 0x26, 0x95, 0x63, 0x8c, 0x4f, 0xa9, 0xac, 0x0f,
        0xc3, 0x68, 0x8c, 0x4f, 0x97, 0x74, 0xb9, 0x05, 0xa1, 0x4e, 0x3a, 0x3f, 0x17, 0x1b, 0xac, 0x58,
        0x6c, 0x55, 0xe8, 0x3f, 0xf9, 0x7a, 0x1a, 0xef, 0xfb, 0x3a, 0xf0, 0x0a, 0xdb, 0x22, 0xc6, 0xbb,
    };
    const g1_y = [_]u8{
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x08, 0xb3, 0xf4, 0x81, 0xe3, 0xaa, 0xa0, 0xf1, 0xa0, 0x9e, 0x30, 0xed, 0x74, 0x1d, 0x8a, 0xe4,
        0xfc, 0xf5, 0xe0, 0x95, 0xd5, 0xd0, 0x0a, 0xf6, 0x00, 0xdb, 0x18, 0xcb, 0x2c, 0x04, 0xb3, 0xed,
        0xd0, 0x3c, 0xc7, 0x44, 0xa2, 0x88, 0x8a, 0xe4, 0x0c, 0xaa, 0x23, 0x29, 0x46, 0xc5, 0xe7, 0xe1,
    };
    // Negative of G has the same x and y' = p - y, where p is the field modulus
    // 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab
    const g1_neg_y = [_]u8{
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x11, 0x4d, 0x1d, 0x68, 0x55, 0xd5, 0x45, 0xa8, 0xaa, 0x7d, 0x76, 0xc8, 0xcf, 0x2e, 0x21, 0xf2,
        0x67, 0x81, 0x6a, 0xef, 0x1d, 0xb5, 0x07, 0xc9, 0x66, 0x55, 0xb9, 0xd5, 0xca, 0xac, 0x42, 0x36,
        0x4e, 0x6f, 0x38, 0xba, 0x0e, 0xcb, 0x75, 0x1b, 0xad, 0x54, 0xdc, 0xd6, 0xb9, 0x39, 0xc2, 0xca,
    };

    // First point: G
    @memcpy(input[0..64], &g1_x);
    @memcpy(input[64..128], &g1_y);
    // Second point: -G
    @memcpy(input[128..192], &g1_x);
    @memcpy(input[192..256], &g1_neg_y);

    const result = try execute(allocator, &input, GAS);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 128), result.output.len);
    // Result should be point at infinity (all zeros)
    for (result.output) |byte| {
        try testing.expectEqual(@as(u8, 0), byte);
    }
}

test "bls12_g1_add - invalid point not on curve" {
    const allocator = testing.allocator;

    // Create invalid point (not on curve)
    var input: [256]u8 = [_]u8{0} ** 256;
    // Set to arbitrary values that don't satisfy the curve equation
    input[63] = 1; // x = 1
    input[127] = 2; // y = 2
    // Second point at infinity

    const result = execute(allocator, &input, GAS);
    try testing.expectError(error.InvalidPoint, result);
}

test "bls12_g1_add - output size validation" {
    const allocator = testing.allocator;

    var input: [256]u8 = [_]u8{0} ** 256;
    const result = try execute(allocator, &input, GAS);
    defer result.deinit(allocator);

    // Output should always be 128 bytes (64 bytes x + 64 bytes y)
    try testing.expectEqual(@as(usize, 128), result.output.len);
}

test "bls12_g1_add - official EIP-2537 vectors" {
    try @import("utils.zig").expectVectors(execute, @embedFile("vectors/eip2537_g1_add.txt"), 9);
}

test "bls12_g1_add - official EIP-2537 failure vectors" {
    try @import("utils.zig").expectVectors(execute, @embedFile("vectors/eip2537_g1_add_fail.txt"), 7);
}

test "bls12_g1_add - gas is 375 (EIP-2537)" {
    try testing.expectEqual(@as(u64, 375), GAS);
}

test "bls12_g1_add - non-canonical coordinates are errors" {
    const allocator = testing.allocator;

    // x = p (the field modulus) is not a field element.
    const p = [_]u8{0} ** 16 ++ [_]u8{
        0x1a, 0x01, 0x11, 0xea, 0x39, 0x7f, 0xe6, 0x9a, 0x4b, 0x1b, 0xa7, 0xb6, 0x43, 0x4b, 0xac, 0xd7,
        0x64, 0x77, 0x4b, 0x84, 0xf3, 0x85, 0x12, 0xbf, 0x67, 0x30, 0xd2, 0xa0, 0xf6, 0xb0, 0xf6, 0x24,
        0x1e, 0xab, 0xff, 0xfe, 0xb1, 0x53, 0xff, 0xff, 0xb9, 0xfe, 0xff, 0xff, 0xff, 0xff, 0xaa, 0xab,
    };
    var input: [256]u8 = [_]u8{0} ** 256;
    @memcpy(input[0..64], &p);
    try testing.expectError(error.InvalidPoint, execute(allocator, &input, GAS));

    // A non-zero byte in the 16-byte padding of an otherwise valid encoding.
    input = [_]u8{0} ** 256;
    input[0] = 1;
    try testing.expectError(error.InvalidPoint, execute(allocator, &input, GAS));
    input = [_]u8{0} ** 256;
    input[128 + 64 + 15] = 1;
    try testing.expectError(error.InvalidPoint, execute(allocator, &input, GAS));
}
