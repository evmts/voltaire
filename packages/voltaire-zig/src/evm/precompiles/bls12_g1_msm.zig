const std = @import("std");
const crypto = @import("crypto");
const utils = @import("utils.zig");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost of one G1 multiplication (EIP-2537 `multiplication_cost`)
pub const BASE_GAS: u64 = 12000;
/// Discount multiplier (EIP-2537 `multiplier`)
pub const MULTIPLIER: u64 = utils.MSM_MULTIPLIER;
/// Length of one (point, scalar) pair
pub const PAIR_LEN: usize = 160;

/// EIP-2537 G1 MSM gas for `k` pairs: `k * 12000 * discount(k) / 1000`.
pub fn gasCost(k: usize) u64 {
    return utils.msmGas(k, BASE_GAS, &utils.G1_MSM_DISCOUNT);
}

/// 0x0C: BLS12_G1MSM - BLS12-381 G1 multi-scalar multiplication (EIP-2537)
///
/// Input: 160 * k bytes, k >= 1. Output: 128 bytes. Every point must be on
/// the curve and in the order-r subgroup.
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (input.len % 160 != 0 or input.len == 0) {
        return error.InvalidInput;
    }

    const k = input.len / PAIR_LEN;
    const gas_cost = gasCost(k);

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 128);
    errdefer allocator.free(output);
    @memset(output, 0);
    crypto.Crypto.bls12_381.g1Msm(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

// ============================================================================
// Tests
// ============================================================================

const testing = std.testing;

test "bls12_g1_msm - gas cost with one pair" {
    const allocator = testing.allocator;

    // One point-scalar pair
    var input: [160]u8 = @as([160]u8, @splat(0));
    const k: usize = 1;
    const expected_gas = gasCost(k);

    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqual(@as(usize, 128), result.output.len);
}

test "bls12_g1_msm - gas cost with two pairs" {
    const allocator = testing.allocator;

    // Two point-scalar pairs
    var input: [320]u8 = @as([320]u8, @splat(0));
    const k: usize = 2;
    const expected_gas = gasCost(k);

    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqual(@as(usize, 128), result.output.len);
}

test "bls12_g1_msm - gas cost with four pairs" {
    const allocator = testing.allocator;

    // Four point-scalar pairs
    var input: [640]u8 = @as([640]u8, @splat(0));
    const k: usize = 4;
    const expected_gas = gasCost(k);

    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqual(@as(usize, 128), result.output.len);
}

test "bls12_g1_msm - gas cost with eight pairs" {
    const allocator = testing.allocator;

    // Eight point-scalar pairs
    var input: [1280]u8 = @as([1280]u8, @splat(0));
    const k: usize = 8;
    const expected_gas = gasCost(k);

    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqual(@as(usize, 128), result.output.len);
}

test "bls12_g1_msm - gas cost with sixteen pairs" {
    const allocator = testing.allocator;

    // Sixteen point-scalar pairs
    var input: [2560]u8 = @as([2560]u8, @splat(0));
    const k: usize = 16;
    const expected_gas = gasCost(k);

    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqual(@as(usize, 128), result.output.len);
}

test "bls12_g1_msm - gas cost with thirty-two pairs" {
    const allocator = testing.allocator;

    // Thirty-two point-scalar pairs
    var input: [5120]u8 = @as([5120]u8, @splat(0));
    const k: usize = 32;
    const expected_gas = gasCost(k);

    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqual(@as(usize, 128), result.output.len);
}

test "bls12_g1_msm - gas cost with sixty-four pairs" {
    const allocator = testing.allocator;

    // Sixty-four point-scalar pairs
    var input: [10240]u8 = @as([10240]u8, @splat(0));
    const k: usize = 64;
    const expected_gas = gasCost(k);

    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqual(@as(usize, 128), result.output.len);
}

test "bls12_g1_msm - gas cost with one hundred twenty-eight pairs" {
    const allocator = testing.allocator;

    // One hundred twenty-eight point-scalar pairs
    var input: [20480]u8 = @as([20480]u8, @splat(0));
    const k: usize = 128;
    const expected_gas = gasCost(k);

    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqual(@as(usize, 128), result.output.len);
}

test "bls12_g1_msm - discount calculation validation" {
    // EIP-2537 G1 discount table, one entry per k
    try testing.expectEqual(@as(u16, 1000), utils.G1_MSM_DISCOUNT[1 - 1]);
    try testing.expectEqual(@as(u16, 949), utils.G1_MSM_DISCOUNT[2 - 1]);
    try testing.expectEqual(@as(u16, 848), utils.G1_MSM_DISCOUNT[3 - 1]);
    try testing.expectEqual(@as(u16, 797), utils.G1_MSM_DISCOUNT[4 - 1]);
    try testing.expectEqual(@as(u16, 728), utils.G1_MSM_DISCOUNT[8 - 1]);
    try testing.expectEqual(@as(u16, 677), utils.G1_MSM_DISCOUNT[16 - 1]);
    try testing.expectEqual(@as(u16, 627), utils.G1_MSM_DISCOUNT[32 - 1]);
    try testing.expectEqual(@as(u16, 576), utils.G1_MSM_DISCOUNT[64 - 1]);
    try testing.expectEqual(@as(u16, 519), utils.G1_MSM_DISCOUNT[128 - 1]);

    // Gas of the official EIP-2537 vectors
    try testing.expectEqual(@as(u64, 0), gasCost(0));
    try testing.expectEqual(@as(u64, 12000), gasCost(1));
    try testing.expectEqual(@as(u64, 22776), gasCost(2));
    try testing.expectEqual(@as(u64, 30528), gasCost(3));
    try testing.expectEqual(@as(u64, 38256), gasCost(4));
    try testing.expectEqual(@as(u64, 69888), gasCost(8));
    try testing.expectEqual(@as(u64, 129984), gasCost(16));
    try testing.expectEqual(@as(u64, 240768), gasCost(32));
    try testing.expectEqual(@as(u64, 442368), gasCost(64));
    try testing.expectEqual(@as(u64, 797184), gasCost(128));

    // k > 128 uses max_discount = 519
    try testing.expectEqual(@as(u64, 803412), gasCost(129));
    try testing.expectEqual(@as(u64, 256 * 12000 * 519 / 1000), gasCost(256));
}

test "bls12_g1_msm - out of gas error" {
    const allocator = testing.allocator;

    var input: [160]u8 = @as([160]u8, @splat(0));
    const k: usize = 1;
    const required_gas = gasCost(k);

    const result = execute(allocator, &input, required_gas - 1);
    try testing.expectError(error.OutOfGas, result);
}

test "bls12_g1_msm - empty input error" {
    const allocator = testing.allocator;

    var input: [0]u8 = [_]u8{};
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "bls12_g1_msm - invalid input length not multiple of 160" {
    const allocator = testing.allocator;

    // Test with various invalid lengths
    {
        var input: [159]u8 = @as([159]u8, @splat(0));
        const result = execute(allocator, &input, 1000000);
        try testing.expectError(error.InvalidInput, result);
    }

    {
        var input: [161]u8 = @as([161]u8, @splat(0));
        const result = execute(allocator, &input, 1000000);
        try testing.expectError(error.InvalidInput, result);
    }

    {
        var input: [320 + 80]u8 = @as([400]u8, @splat(0));
        const result = execute(allocator, &input, 1000000);
        try testing.expectError(error.InvalidInput, result);
    }
}

test "bls12_g1_msm - single point times scalar" {
    const allocator = testing.allocator;

    // BLS12-381 G1 generator point
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

    var input: [160]u8 = @as([160]u8, @splat(0));
    @memcpy(input[0..64], &g1_x);
    @memcpy(input[64..128], &g1_y);
    input[159] = 5; // scalar = 5

    const k: usize = 1;
    const expected_gas = gasCost(k);

    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 128), result.output.len);
    // Result should be 5*G (not point at infinity, not equal to G)
    var is_zero = true;
    var is_g = true;
    for (result.output, 0..) |byte, i| {
        if (byte != 0) is_zero = false;
        if (i < 64 and byte != g1_x[i]) is_g = false;
        if (i >= 64 and i < 128 and byte != g1_y[i - 64]) is_g = false;
    }
    try testing.expect(!is_zero);
    try testing.expect(!is_g);
}

test "bls12_g1_msm - multiple points all at infinity" {
    const allocator = testing.allocator;

    // Four point-scalar pairs, all points at infinity
    var input: [640]u8 = @as([640]u8, @splat(0));
    const k: usize = 4;
    const expected_gas = gasCost(k);

    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 128), result.output.len);
    // MSM of points at infinity = point at infinity
    for (result.output) |byte| {
        try testing.expectEqual(@as(u8, 0), byte);
    }
}

test "bls12_g1_msm - multiple points with zero scalars" {
    const allocator = testing.allocator;

    // BLS12-381 G1 generator point
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

    // Two point-scalar pairs, both with generator but zero scalars
    var input: [320]u8 = @as([320]u8, @splat(0));
    @memcpy(input[0..64], &g1_x);
    @memcpy(input[64..128], &g1_y);
    // First scalar remains 0
    @memcpy(input[160..224], &g1_x);
    @memcpy(input[224..288], &g1_y);
    // Second scalar remains 0

    const k: usize = 2;
    const expected_gas = gasCost(k);

    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 128), result.output.len);
    // G*0 + G*0 = O
    for (result.output) |byte| {
        try testing.expectEqual(@as(u8, 0), byte);
    }
}

test "bls12_g1_msm - invalid point not on curve" {
    const allocator = testing.allocator;

    var input: [160]u8 = @as([160]u8, @splat(0));
    // Set to arbitrary values that don't satisfy the curve equation
    input[63] = 1; // x = 1
    input[127] = 2; // y = 2
    input[159] = 5; // scalar = 5

    const k: usize = 1;
    const expected_gas = gasCost(k);

    const result = execute(allocator, &input, expected_gas);
    try testing.expectError(error.InvalidPoint, result);
}

test "bls12_g1_msm - output size validation" {
    const allocator = testing.allocator;

    // Test with various numbers of pairs
    {
        var input: [160]u8 = @as([160]u8, @splat(0));
        const result = try execute(allocator, &input, 1000000);
        defer result.deinit(allocator);
        try testing.expectEqual(@as(usize, 128), result.output.len);
    }

    {
        var input: [640]u8 = @as([640]u8, @splat(0));
        const result = try execute(allocator, &input, 1000000);
        defer result.deinit(allocator);
        try testing.expectEqual(@as(usize, 128), result.output.len);
    }

    {
        var input: [2560]u8 = @as([2560]u8, @splat(0));
        const result = try execute(allocator, &input, 1000000);
        defer result.deinit(allocator);
        try testing.expectEqual(@as(usize, 128), result.output.len);
    }
}

test "bls12_g1_msm - gas discount effect" {
    // Verify that gas cost per pair decreases with more pairs
    const gas_1 = gasCost(1);
    const gas_2 = gasCost(2);
    const gas_4 = gasCost(4);
    const gas_8 = gasCost(8);

    // Gas per pair should decrease as k increases
    const gas_per_pair_1 = gas_1 / 1;
    const gas_per_pair_2 = gas_2 / 2;
    const gas_per_pair_4 = gas_4 / 4;
    const gas_per_pair_8 = gas_8 / 8;

    try testing.expect(gas_per_pair_1 > gas_per_pair_2);
    try testing.expect(gas_per_pair_2 > gas_per_pair_4);
    try testing.expect(gas_per_pair_4 > gas_per_pair_8);
}

test "bls12_g1_msm - official EIP-2537 vectors" {
    try utils.expectVectors(execute, @embedFile("vectors/eip2537_g1_msm.txt"), 30);
}

test "bls12_g1_msm - official EIP-2537 failure vectors" {
    try utils.expectVectors(execute, @embedFile("vectors/eip2537_g1_msm_fail.txt"), 8);
}
