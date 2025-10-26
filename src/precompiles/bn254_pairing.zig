const std = @import("std");
const crypto = @import("crypto");
const bn254 = crypto.bn254;
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas costs for BN254 pairing
pub const BASE_GAS: u64 = 45000;
pub const PER_POINT_GAS: u64 = 34000;

/// 0x08: BN254PAIRING - BN254 elliptic curve pairing check
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    // Input must be multiple of 192 bytes (each pair is 192 bytes)
    if (input.len % 192 != 0) {
        return error.InvalidInput;
    }

    const num_pairs = input.len / 192;
    const gas_cost = BASE_GAS + PER_POINT_GAS * num_pairs;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 32);
    @memset(output, 0);

    // Perform pairing check using pure Zig implementation
    const success = bn254.bn254Pairing(input) catch {
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

test "bn254Pairing - empty input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Empty input = pairing of zero points = success
    const input = [_]u8{};
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 32), result.output.len);
    try testing.expectEqual(@as(u8, 1), result.output[31]);
}

test "bn254Pairing - invalid input not multiple of 192" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 191;
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "bn254Pairing - single pair gas cost" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 192;
    const expected_gas = BASE_GAS + PER_POINT_GAS * 1;

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
}

test "bn254Pairing - two pairs gas cost" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 384;
    const expected_gas = BASE_GAS + PER_POINT_GAS * 2;

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
}

test "bn254Pairing - out of gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 192;
    const required_gas = BASE_GAS + PER_POINT_GAS * 1;

    const result = execute(allocator, &input, required_gas - 1);
    try testing.expectError(error.OutOfGas, result);
}

test "bn254Pairing - exact gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 192;
    const required_gas = BASE_GAS + PER_POINT_GAS * 1;

    const result = try execute(allocator, &input, required_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(required_gas, result.gas_used);
}

test "bn254Pairing - gas constants" {
    const testing = std.testing;

    try testing.expectEqual(@as(u64, 45000), BASE_GAS);
    try testing.expectEqual(@as(u64, 34000), PER_POINT_GAS);
}

test "bn254Pairing - output size" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 192;
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 32), result.output.len);
}

test "bn254Pairing - empty input gas cost" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{};
    const expected_gas = BASE_GAS + PER_POINT_GAS * 0;

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
}
