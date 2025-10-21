const std = @import("std");
const crypto = @import("crypto");
const Ripemd160 = crypto.Ripemd160;
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas costs for RIPEMD160 precompile
pub const BASE_GAS: u64 = 600;
pub const PER_WORD_GAS: u64 = 120;

/// 0x03: RIPEMD160 - RIPEMD-160 hash function
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

    const output = try allocator.alloc(u8, 32);
    @memset(output[0..12], 0); // Left-pad with zeros

    var hash_output: [20]u8 = undefined;
    Ripemd160.hash(input, &hash_output);
    @memcpy(output[12..32], &hash_output);

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

test "ripemd160 - empty input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const result = try execute(allocator, &[_]u8{}, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 32), result.output.len);

    // First 12 bytes should be zero padding
    for (result.output[0..12]) |byte| {
        try testing.expectEqual(@as(u8, 0), byte);
    }
}
