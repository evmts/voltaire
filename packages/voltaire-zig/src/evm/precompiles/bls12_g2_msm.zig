const std = @import("std");
const crypto = @import("crypto");
const utils = @import("utils.zig");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost of one G2 multiplication (EIP-2537 `multiplication_cost`)
pub const BASE_GAS: u64 = 22500;
/// Discount multiplier (EIP-2537 `multiplier`)
pub const MULTIPLIER: u64 = utils.MSM_MULTIPLIER;
/// Length of one (point, scalar) pair
pub const PAIR_LEN: usize = 288;

/// EIP-2537 G2 MSM gas for `k` pairs: `k * 22500 * discount(k) / 1000`.
pub fn gasCost(k: usize) u64 {
    return utils.msmGas(k, BASE_GAS, &utils.G2_MSM_DISCOUNT);
}

/// 0x0E: BLS12_G2MSM - BLS12-381 G2 multi-scalar multiplication (EIP-2537)
///
/// Input: 288 * k bytes, k >= 1. Output: 256 bytes. Every point must be on
/// the curve and in the order-r subgroup.
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (input.len % 288 != 0 or input.len == 0) {
        return error.InvalidInput;
    }

    const k = input.len / PAIR_LEN;
    const gas_cost = gasCost(k);

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 256);
    errdefer allocator.free(output);
    @memset(output, 0);
    crypto.Crypto.bls12_381.g2Msm(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

test "bls12_g2_msm - empty input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{};
    const result = execute(allocator, &input, 1000000);

    try testing.expectError(error.InvalidInput, result);
}

test "bls12_g2_msm - invalid input length not multiple of 288" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 300;
    const result = execute(allocator, &input, 1000000);

    try testing.expectError(error.InvalidInput, result);
}

test "bls12_g2_msm - single pair gas cost with discount" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 288;
    const k = 1;
    const expected_gas = gasCost(k);
    try testing.expectEqual(@as(u64, 22500), expected_gas);

    // Points at infinity are valid: the call succeeds with exactly the EIP gas.
    const res = try execute(allocator, &input, expected_gas);
    defer res.deinit(allocator);
    try testing.expectEqual(expected_gas, res.gas_used);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bls12_g2_msm - two pairs discount tier" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** (288 * 2);
    const k = 2;
    const expected_gas = gasCost(k);

    try testing.expectEqual(@as(u16, 1000), utils.G2_MSM_DISCOUNT[k - 1]);
    try testing.expectEqual(@as(u64, 45000), expected_gas);

    // Points at infinity are valid: the call succeeds with exactly the EIP gas.
    const res = try execute(allocator, &input, expected_gas);
    defer res.deinit(allocator);
    try testing.expectEqual(expected_gas, res.gas_used);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bls12_g2_msm - four pairs discount tier" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** (288 * 4);
    const k = 4;
    const expected_gas = gasCost(k);

    try testing.expectEqual(@as(u16, 884), utils.G2_MSM_DISCOUNT[k - 1]);
    try testing.expectEqual(@as(u64, 79560), expected_gas);

    // Points at infinity are valid: the call succeeds with exactly the EIP gas.
    const res = try execute(allocator, &input, expected_gas);
    defer res.deinit(allocator);
    try testing.expectEqual(expected_gas, res.gas_used);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bls12_g2_msm - eight pairs discount tier" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** (288 * 8);
    const k = 8;
    const expected_gas = gasCost(k);

    try testing.expectEqual(@as(u16, 796), utils.G2_MSM_DISCOUNT[k - 1]);
    try testing.expectEqual(@as(u64, 143280), expected_gas);

    // Points at infinity are valid: the call succeeds with exactly the EIP gas.
    const res = try execute(allocator, &input, expected_gas);
    defer res.deinit(allocator);
    try testing.expectEqual(expected_gas, res.gas_used);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bls12_g2_msm - sixteen pairs discount tier" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** (288 * 16);
    const k = 16;
    const expected_gas = gasCost(k);

    try testing.expectEqual(@as(u16, 717), utils.G2_MSM_DISCOUNT[k - 1]);
    try testing.expectEqual(@as(u64, 258120), expected_gas);

    // Points at infinity are valid: the call succeeds with exactly the EIP gas.
    const res = try execute(allocator, &input, expected_gas);
    defer res.deinit(allocator);
    try testing.expectEqual(expected_gas, res.gas_used);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bls12_g2_msm - thirty-two pairs discount tier" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** (288 * 32);
    const k = 32;
    const expected_gas = gasCost(k);

    try testing.expectEqual(@as(u16, 646), utils.G2_MSM_DISCOUNT[k - 1]);
    try testing.expectEqual(@as(u64, 465120), expected_gas);

    // Points at infinity are valid: the call succeeds with exactly the EIP gas.
    const res = try execute(allocator, &input, expected_gas);
    defer res.deinit(allocator);
    try testing.expectEqual(expected_gas, res.gas_used);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bls12_g2_msm - sixty-four pairs discount tier" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** (288 * 64);
    const k = 64;
    const expected_gas = gasCost(k);

    try testing.expectEqual(@as(u16, 582), utils.G2_MSM_DISCOUNT[k - 1]);
    try testing.expectEqual(@as(u64, 838080), expected_gas);

    // Points at infinity are valid: the call succeeds with exactly the EIP gas.
    const res = try execute(allocator, &input, expected_gas);
    defer res.deinit(allocator);
    try testing.expectEqual(expected_gas, res.gas_used);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bls12_g2_msm - one hundred twenty-eight pairs discount tier" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** (288 * 128);
    const k = 128;
    const expected_gas = gasCost(k);

    try testing.expectEqual(@as(u16, 524), utils.G2_MSM_DISCOUNT[k - 1]);
    try testing.expectEqual(@as(u64, 1509120), expected_gas);

    // Points at infinity are valid: the call succeeds with exactly the EIP gas.
    const res = try execute(allocator, &input, expected_gas);
    defer res.deinit(allocator);
    try testing.expectEqual(expected_gas, res.gas_used);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bls12_g2_msm - out of gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 288;
    const k = 1;
    const gas_cost = gasCost(k);

    const result = execute(allocator, &input, gas_cost - 1);

    try testing.expectError(error.OutOfGas, result);
}

test "bls12_g2_msm - output length" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 288;
    const res = try execute(allocator, &input, 1000000);
    defer res.deinit(allocator);
    try testing.expectEqual(@as(usize, 256), res.output.len);
    for (res.output) |byte| try testing.expectEqual(@as(u8, 0), byte);
}

test "bls12_g2_msm - official EIP-2537 vectors" {
    try utils.expectVectors(execute, @embedFile("vectors/eip2537_g2_msm.txt"), 31);
}

test "bls12_g2_msm - official EIP-2537 failure vectors" {
    try utils.expectVectors(execute, @embedFile("vectors/eip2537_g2_msm_fail.txt"), 8);
}

test "bls12_g2_msm - gas constants match EIP-2537" {
    const testing = std.testing;
    try testing.expectEqual(@as(u64, 22500), BASE_GAS);
    try testing.expectEqual(@as(u64, 1000), MULTIPLIER);
    try testing.expectEqual(@as(usize, 288), PAIR_LEN);
    try testing.expectEqual(@as(u64, 0), gasCost(0));
    try testing.expectEqual(@as(u64, 129 * 22500 * 524 / 1000), gasCost(129));
}
