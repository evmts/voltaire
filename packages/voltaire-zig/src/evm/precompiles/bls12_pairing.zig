const std = @import("std");
const crypto = @import("crypto");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas costs for BLS12-381 pairing (EIP-2537: `32600 * k + 37700`)
pub const BASE_GAS: u64 = 37700;
pub const PER_PAIR_GAS: u64 = 32600;

/// 0x0F: BLS12_PAIRING_CHECK - BLS12-381 pairing check (EIP-2537)
///
/// Input: 384 * k bytes, k >= 1. Output: 32 bytes, 1 when the pairing
/// product is one and 0 otherwise. Empty input, a non-canonical coordinate,
/// a point off its curve, or a point outside the order-r subgroup is an error.
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (input.len == 0 or input.len % 384 != 0) {
        return error.InvalidInput;
    }

    const k: u64 = input.len / 384;
    const gas_cost = BASE_GAS + PER_PAIR_GAS * k;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 32);
    errdefer allocator.free(output);
    @memset(output, 0);

    const success = crypto.Crypto.bls12_381.pairingCheck(input) catch {
        return error.InvalidPairing;
    };

    if (success) {
        output[31] = 1;
    }

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

// ============================================================================
// Tests
// ============================================================================

test "bls12_pairing - out of gas" {
    // One (infinity, infinity) pair requires BASE_GAS + PER_PAIR_GAS
    const input = @as([384]u8, @splat(0));
    const result = execute(std.testing.allocator, &input, BASE_GAS + PER_PAIR_GAS - 1);
    try std.testing.expectError(error.OutOfGas, result);
}

test "bls12_pairing - zero pairs is an error" {
    // EIP-2537: variable-length operations must fail on empty input.
    const input = [_]u8{};
    try std.testing.expectError(error.InvalidInput, execute(std.testing.allocator, &input, BASE_GAS));
    try std.testing.expectError(error.InvalidInput, execute(std.testing.allocator, &input, std.math.maxInt(u64)));
}

test "bls12_pairing - single pair exact gas" {
    // Single pair: G1 point (128 bytes) + G2 point (256 bytes) = 384 bytes
    // All zeros represents points at infinity
    const input = @as([384]u8, @splat(0));
    const expected_gas = BASE_GAS + PER_PAIR_GAS;
    const result = try execute(std.testing.allocator, &input, expected_gas);
    defer std.testing.allocator.free(result.output);

    try std.testing.expectEqual(expected_gas, result.gas_used);
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

test "bls12_pairing - single pair insufficient gas" {
    const input = @as([384]u8, @splat(0));
    const expected_gas = BASE_GAS + PER_PAIR_GAS;
    const result = execute(std.testing.allocator, &input, expected_gas - 1);
    try std.testing.expectError(error.OutOfGas, result);
}

test "bls12_pairing - two pairs exact gas" {
    // Two pairs: 2 * 384 = 768 bytes
    const input = @as([768]u8, @splat(0));
    const expected_gas = BASE_GAS + 2 * PER_PAIR_GAS;
    const result = try execute(std.testing.allocator, &input, expected_gas);
    defer std.testing.allocator.free(result.output);

    try std.testing.expectEqual(expected_gas, result.gas_used);
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

test "bls12_pairing - three pairs" {
    // Three pairs: 3 * 384 = 1152 bytes
    const input = @as([1152]u8, @splat(0));
    const expected_gas = BASE_GAS + 3 * PER_PAIR_GAS;
    const result = try execute(std.testing.allocator, &input, expected_gas);
    defer std.testing.allocator.free(result.output);

    try std.testing.expectEqual(expected_gas, result.gas_used);
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

test "bls12_pairing - invalid input length not multiple of 384" {
    // 383 bytes - not a multiple of 384
    const input = @as([383]u8, @splat(0));
    const result = execute(std.testing.allocator, &input, 1000000);
    try std.testing.expectError(error.InvalidInput, result);
}

test "bls12_pairing - invalid input length 1" {
    const input = [_]u8{0};
    const result = execute(std.testing.allocator, &input, 1000000);
    try std.testing.expectError(error.InvalidInput, result);
}

test "bls12_pairing - invalid input length 385" {
    const input = @as([385]u8, @splat(0));
    const result = execute(std.testing.allocator, &input, 1000000);
    try std.testing.expectError(error.InvalidInput, result);
}

test "bls12_pairing - gas cost constants validation" {
    // Verify gas cost constants match EIP-2537 specification
    try std.testing.expectEqual(@as(u64, 37700), BASE_GAS);
    try std.testing.expectEqual(@as(u64, 32600), PER_PAIR_GAS);
}

test "bls12_pairing - gas cost calculation" {
    // Test gas cost formula: BASE_GAS + k * PER_PAIR_GAS
    // where k is the number of pairs

    // 0 pairs
    try std.testing.expectEqual(@as(u64, 37700), BASE_GAS + 0 * PER_PAIR_GAS);

    // 1 pair
    try std.testing.expectEqual(@as(u64, 70300), BASE_GAS + 1 * PER_PAIR_GAS);

    // 2 pairs
    try std.testing.expectEqual(@as(u64, 102900), BASE_GAS + 2 * PER_PAIR_GAS);

    // 5 pairs
    try std.testing.expectEqual(@as(u64, 200700), BASE_GAS + 5 * PER_PAIR_GAS);
}

test "bls12_pairing - output format" {
    // Output should be 32 bytes with result in last byte
    const input = @as([384]u8, @splat(0));
    const result = try execute(std.testing.allocator, &input, BASE_GAS + PER_PAIR_GAS);
    defer std.testing.allocator.free(result.output);

    try std.testing.expectEqual(@as(usize, 32), result.output.len);

    // First 31 bytes should be zero
    for (result.output[0..31]) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }

    // e(infinity, infinity) = 1, so the check passes
    try std.testing.expectEqual(@as(u8, 1), result.output[31]);
}

test "bls12_pairing - large number of pairs gas calculation" {
    // Test with 10 pairs
    const k: u64 = 10;
    const input = @as([384 * k]u8, @splat(0));
    const expected_gas = BASE_GAS + k * PER_PAIR_GAS;

    const result = try execute(std.testing.allocator, &input, expected_gas);
    defer std.testing.allocator.free(result.output);

    try std.testing.expectEqual(expected_gas, result.gas_used);
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

test "bls12_pairing - bilinearity property structure" {
    // Test that we can create inputs for bilinearity testing
    // e(aP, Q) should equal e(P, aQ)
    // This test verifies input structure, actual bilinearity tested when implemented

    // Single pair for e(P, Q)
    var pair1: [384]u8 = undefined;
    @memset(&pair1, 0);
    // G1 point P at pair1[0..128]
    // G2 point Q at pair1[128..384]

    const result1 = try execute(std.testing.allocator, &pair1, BASE_GAS + PER_PAIR_GAS);
    defer std.testing.allocator.free(result1.output);

    try std.testing.expectEqual(@as(usize, 32), result1.output.len);
}

test "bls12_pairing - output size consistency" {
    // Verify output is always 32 bytes for every valid (non-empty) input size
    const test_sizes = [_]usize{ 384, 768, 1152 };

    for (test_sizes) |size| {
        const input = try std.testing.allocator.alloc(u8, size);
        defer std.testing.allocator.free(input);
        @memset(input, 0);

        const k = size / 384;
        const gas = BASE_GAS + k * PER_PAIR_GAS;

        const result = try execute(std.testing.allocator, input, gas);
        defer std.testing.allocator.free(result.output);

        try std.testing.expectEqual(@as(usize, 32), result.output.len);
    }
}

test "bls12_pairing - official EIP-2537 vectors" {
    try @import("utils.zig").expectVectors(execute, @embedFile("vectors/eip2537_pairing.txt"), 15);
}

test "bls12_pairing - official EIP-2537 failure vectors" {
    try @import("utils.zig").expectVectors(execute, @embedFile("vectors/eip2537_pairing_fail.txt"), 25);
}
