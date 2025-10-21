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
