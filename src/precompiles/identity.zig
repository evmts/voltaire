const std = @import("std");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas costs for IDENTITY precompile
pub const BASE_GAS: u64 = 15;
pub const PER_WORD_GAS: u64 = 3;

/// 0x04: IDENTITY - Identity function (returns input)
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    const num_words = (input.len + 31) / 32;
    const gas_cost = BASE_GAS + PER_WORD_GAS * num_words;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.dupe(u8, input);

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

test "identity - returns input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{ 1, 2, 3, 4, 5 };
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqualSlices(u8, &input, result.output);
}

test "identity - gas calculation" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 64; // 2 words
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    const expected_gas = BASE_GAS + PER_WORD_GAS * 2;
    try testing.expectEqual(expected_gas, result.gas_used);
}
