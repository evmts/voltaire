const std = @import("std");
const crypto = @import("crypto");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BLS12-381 G2 addition
pub const GAS: u64 = 800;

/// 0x0E: BLS12_G2ADD - BLS12-381 G2 addition
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < GAS) {
        return error.OutOfGas;
    }

    if (input.len != 512) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 256);
    crypto.Crypto.bls12_381.g2Add(input, output) catch {
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

// BLS12-381 G2 generator coordinates (Fp2 elements, each 128 bytes: c0 || c1)
// G2 point format: x0 || x1 || y0 || y1 (256 bytes total)
const g2_x0 = [_]u8{
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x02, 0x4a, 0xa2, 0xb2, 0xf0, 0x8f, 0x0a, 0x91, 0x26, 0x08, 0x05, 0x27, 0x2d, 0xc5, 0x10, 0x51,
    0xc6, 0xe4, 0x7a, 0xd4, 0xfa, 0x40, 0x3b, 0x02, 0xb4, 0x51, 0x0b, 0x64, 0x7a, 0xe3, 0xd1, 0x77,
    0x0b, 0xac, 0x03, 0x26, 0xa8, 0x05, 0xbb, 0xef, 0xd4, 0x80, 0x56, 0xc8, 0xc1, 0x21, 0xbd, 0xb8,
};
const g2_x1 = [_]u8{
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x13, 0xe0, 0x2b, 0x60, 0x52, 0x71, 0x9f, 0x60, 0x7d, 0xac, 0xd3, 0xa0, 0x88, 0x27, 0x4f, 0x65,
    0x59, 0x6b, 0xd0, 0xd0, 0x99, 0x20, 0xb6, 0x1a, 0xb5, 0xda, 0x61, 0xbb, 0xdc, 0x7f, 0x50, 0x49,
    0x33, 0x4c, 0xf1, 0x12, 0x13, 0x94, 0x5d, 0x57, 0xe5, 0xac, 0x7d, 0x05, 0x5d, 0x04, 0x2b, 0x7e,
};
const g2_y0 = [_]u8{
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x0c, 0xe5, 0xd5, 0x27, 0x72, 0x7d, 0x6e, 0x11, 0x8c, 0xc9, 0xcd, 0xc6, 0xda, 0x2e, 0x35, 0x1a,
    0xad, 0xfd, 0x9b, 0xaa, 0x8c, 0xbd, 0xd3, 0xa7, 0x6d, 0x42, 0x9a, 0x69, 0x51, 0x60, 0xd1, 0x2c,
    0x92, 0x3a, 0xc9, 0xcc, 0x3b, 0xac, 0xa2, 0x89, 0xe1, 0x93, 0x54, 0x86, 0x08, 0xb8, 0x28, 0x01,
};
const g2_y1 = [_]u8{
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x06, 0x06, 0xc4, 0xa0, 0x2e, 0xa7, 0x34, 0xcc, 0x32, 0xac, 0xd2, 0xb0, 0x2b, 0xc2, 0x8b, 0x99,
    0xcb, 0x3e, 0x28, 0x7e, 0x85, 0xa7, 0x63, 0xaf, 0x26, 0x74, 0x92, 0xab, 0x57, 0x2e, 0x99, 0xab,
    0x3f, 0x37, 0x0d, 0x27, 0x5c, 0xec, 0x1d, 0xa1, 0xaa, 0xa9, 0x07, 0x5f, 0xf0, 0x5f, 0x79, 0xbe,
};

test "bls12_g2_add - gas cost validation" {
    const allocator = testing.allocator;

    // Point at infinity (256 bytes of zeros) + another point (256 bytes)
    var input: [512]u8 = [_]u8{0} ** 512;

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

test "bls12_g2_add - out of gas error" {
    const allocator = testing.allocator;
    var input: [512]u8 = [_]u8{0} ** 512;

    // Test with insufficient gas
    const result = execute(allocator, &input, GAS - 1);
    try testing.expectError(error.OutOfGas, result);
}

test "bls12_g2_add - invalid input length" {
    const allocator = testing.allocator;

    // Test with input too short
    {
        var input: [511]u8 = [_]u8{0} ** 511;
        const result = execute(allocator, &input, GAS);
        try testing.expectError(error.InvalidInput, result);
    }

    // Test with input too long
    {
        var input: [513]u8 = [_]u8{0} ** 513;
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

test "bls12_g2_add - point at infinity operations" {
    const allocator = testing.allocator;

    // O + O = O (both points at infinity)
    {
        var input: [512]u8 = [_]u8{0} ** 512;
        const result = try execute(allocator, &input, GAS);
        defer result.deinit(allocator);

        try testing.expectEqual(@as(usize, 256), result.output.len);
        // Result should be point at infinity (all zeros)
        for (result.output) |byte| {
            try testing.expectEqual(@as(u8, 0), byte);
        }
    }

    // P + O = P (second point at infinity)
    {
        var input: [512]u8 = [_]u8{0} ** 512;
        // Set first point to generator point
        @memcpy(input[0..64], &g2_x0);
        @memcpy(input[64..128], &g2_x1);
        @memcpy(input[128..192], &g2_y0);
        @memcpy(input[192..256], &g2_y1);
        // Second point remains at infinity (all zeros)

        const result = try execute(allocator, &input, GAS);
        defer result.deinit(allocator);

        try testing.expectEqual(@as(usize, 256), result.output.len);
        // Result should be the generator point
        try testing.expectEqualSlices(u8, &g2_x0, result.output[0..64]);
        try testing.expectEqualSlices(u8, &g2_x1, result.output[64..128]);
        try testing.expectEqualSlices(u8, &g2_y0, result.output[128..192]);
        try testing.expectEqualSlices(u8, &g2_y1, result.output[192..256]);
    }

    // O + P = P (first point at infinity)
    {
        var input: [512]u8 = [_]u8{0} ** 512;
        // First point at infinity (remains zeros)
        // Set second point to generator
        @memcpy(input[256..320], &g2_x0);
        @memcpy(input[320..384], &g2_x1);
        @memcpy(input[384..448], &g2_y0);
        @memcpy(input[448..512], &g2_y1);

        const result = try execute(allocator, &input, GAS);
        defer result.deinit(allocator);

        try testing.expectEqual(@as(usize, 256), result.output.len);
        // Result should be the generator point
        try testing.expectEqualSlices(u8, &g2_x0, result.output[0..64]);
        try testing.expectEqualSlices(u8, &g2_x1, result.output[64..128]);
        try testing.expectEqualSlices(u8, &g2_y0, result.output[128..192]);
        try testing.expectEqualSlices(u8, &g2_y1, result.output[192..256]);
    }
}

test "bls12_g2_add - generator point addition" {
    const allocator = testing.allocator;

    // G2 + G2 = 2*G2
    var input: [512]u8 = [_]u8{0} ** 512;
    // Both points are generator
    @memcpy(input[0..64], &g2_x0);
    @memcpy(input[64..128], &g2_x1);
    @memcpy(input[128..192], &g2_y0);
    @memcpy(input[192..256], &g2_y1);
    @memcpy(input[256..320], &g2_x0);
    @memcpy(input[320..384], &g2_x1);
    @memcpy(input[384..448], &g2_y0);
    @memcpy(input[448..512], &g2_y1);

    const result = try execute(allocator, &input, GAS);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 256), result.output.len);
    // Result should be 2*G2, not point at infinity
    var is_zero = true;
    for (result.output) |byte| {
        if (byte != 0) {
            is_zero = false;
            break;
        }
    }
    try testing.expect(!is_zero);
}

test "bls12_g2_add - point plus negative equals infinity" {
    const allocator = testing.allocator;

    // P + (-P) = O
    // Negative of G2 has same x but negated y (mod field)
    // For Fp2, negate each component
    var input: [512]u8 = [_]u8{0} ** 512;
    // Negated y coordinates (computed as q - y_i where q is field modulus)
    const g2_neg_y0 = [_]u8{
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x13, 0x1a, 0x2a, 0xd8, 0x8d, 0x82, 0x91, 0xee, 0x73, 0x36, 0x32, 0x39, 0x25, 0xd1, 0xca, 0xe5,
        0x52, 0x02, 0x64, 0x55, 0x73, 0x42, 0x2c, 0x58, 0x92, 0xbd, 0x65, 0x96, 0xae, 0x9f, 0x2e, 0xd3,
        0x6d, 0xc5, 0x36, 0x33, 0xc4, 0x53, 0x5d, 0x76, 0x1e, 0x6c, 0xab, 0x79, 0xf7, 0x47, 0xd7, 0xfe,
    };
    const g2_neg_y1 = [_]u8{
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x19, 0xf9, 0x3b, 0x5f, 0xd1, 0x58, 0xcb, 0x33, 0xcd, 0x53, 0x2d, 0x4f, 0xd4, 0x3d, 0x74, 0x66,
        0x34, 0xc1, 0xd7, 0x81, 0x7a, 0x58, 0x9c, 0x50, 0xd9, 0x8b, 0x6d, 0x54, 0xa8, 0xd1, 0x66, 0x54,
        0xc0, 0xc8, 0xf2, 0xd8, 0xa3, 0x13, 0xe2, 0x5e, 0x55, 0x56, 0xf8, 0xa0, 0x0f, 0xa0, 0x86, 0x41,
    };

    // First point: G2
    @memcpy(input[0..64], &g2_x0);
    @memcpy(input[64..128], &g2_x1);
    @memcpy(input[128..192], &g2_y0);
    @memcpy(input[192..256], &g2_y1);
    // Second point: -G2
    @memcpy(input[256..320], &g2_x0);
    @memcpy(input[320..384], &g2_x1);
    @memcpy(input[384..448], &g2_neg_y0);
    @memcpy(input[448..512], &g2_neg_y1);

    const result = try execute(allocator, &input, GAS);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 256), result.output.len);
    // Result should be point at infinity (all zeros)
    for (result.output) |byte| {
        try testing.expectEqual(@as(u8, 0), byte);
    }
}

test "bls12_g2_add - invalid point not on curve" {
    const allocator = testing.allocator;

    // Create invalid point (not on curve)
    var input: [512]u8 = [_]u8{0} ** 512;
    // Set to arbitrary values that don't satisfy the curve equation
    input[63] = 1; // x0 = 1
    input[127] = 1; // x1 = 1
    input[191] = 2; // y0 = 2
    input[255] = 2; // y1 = 2
    // Second point at infinity

    const result = execute(allocator, &input, GAS);
    try testing.expectError(error.InvalidPoint, result);
}

test "bls12_g2_add - output size validation" {
    const allocator = testing.allocator;

    var input: [512]u8 = [_]u8{0} ** 512;
    const result = try execute(allocator, &input, GAS);
    defer result.deinit(allocator);

    // Output should always be 256 bytes (4 * 64 bytes for Fp2 x and y)
    try testing.expectEqual(@as(usize, 256), result.output.len);
}

test "bls12_g2_add - point doubling" {
    const allocator = testing.allocator;

    // P + P = 2P (same as generator addition test, but explicit)
    var input: [512]u8 = [_]u8{0} ** 512;
    @memcpy(input[0..64], &g2_x0);
    @memcpy(input[64..128], &g2_x1);
    @memcpy(input[128..192], &g2_y0);
    @memcpy(input[192..256], &g2_y1);
    @memcpy(input[256..320], &g2_x0);
    @memcpy(input[320..384], &g2_x1);
    @memcpy(input[384..448], &g2_y0);
    @memcpy(input[448..512], &g2_y1);

    const result = try execute(allocator, &input, GAS);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 256), result.output.len);
    // Result should not be infinity or equal to G2
    var is_zero = true;
    var is_g2 = true;
    for (result.output, 0..) |byte, i| {
        if (byte != 0) is_zero = false;
        if (i < 64 and byte != g2_x0[i]) is_g2 = false;
        if (i >= 64 and i < 128 and byte != g2_x1[i - 64]) is_g2 = false;
        if (i >= 128 and i < 192 and byte != g2_y0[i - 128]) is_g2 = false;
        if (i >= 192 and i < 256 and byte != g2_y1[i - 192]) is_g2 = false;
    }
    try testing.expect(!is_zero);
    try testing.expect(!is_g2);
}

test "bls12_g2_add - commutativity P+Q = Q+P" {
    const allocator = testing.allocator;

    // Create 2*G2 for second point
    var input_double: [512]u8 = [_]u8{0} ** 512;
    @memcpy(input_double[0..64], &g2_x0);
    @memcpy(input_double[64..128], &g2_x1);
    @memcpy(input_double[128..192], &g2_y0);
    @memcpy(input_double[192..256], &g2_y1);
    @memcpy(input_double[256..320], &g2_x0);
    @memcpy(input_double[320..384], &g2_x1);
    @memcpy(input_double[384..448], &g2_y0);
    @memcpy(input_double[448..512], &g2_y1);
    const double_result = try execute(allocator, &input_double, GAS);
    defer double_result.deinit(allocator);

    // P + Q
    var input_pq: [512]u8 = [_]u8{0} ** 512;
    @memcpy(input_pq[0..64], &g2_x0);
    @memcpy(input_pq[64..128], &g2_x1);
    @memcpy(input_pq[128..192], &g2_y0);
    @memcpy(input_pq[192..256], &g2_y1);
    @memcpy(input_pq[256..512], double_result.output);
    const result_pq = try execute(allocator, &input_pq, GAS);
    defer result_pq.deinit(allocator);

    // Q + P
    var input_qp: [512]u8 = [_]u8{0} ** 512;
    @memcpy(input_qp[0..256], double_result.output);
    @memcpy(input_qp[256..320], &g2_x0);
    @memcpy(input_qp[320..384], &g2_x1);
    @memcpy(input_qp[384..448], &g2_y0);
    @memcpy(input_qp[448..512], &g2_y1);
    const result_qp = try execute(allocator, &input_qp, GAS);
    defer result_qp.deinit(allocator);

    // P + Q should equal Q + P
    try testing.expectEqualSlices(u8, result_pq.output, result_qp.output);
}
