const std = @import("std");
const crypto = @import("crypto");
const SHA256 = crypto.SHA256_Accel.SHA256_Accel(1);
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas costs for SHA256 precompile
pub const BASE_GAS: u64 = 60;
pub const PER_WORD_GAS: u64 = 12;

/// 0x02: SHA256 - SHA-256 hash function
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
    var hash_output: [32]u8 = undefined;
    SHA256.hash(input, &hash_output);
    @memcpy(output, &hash_output);

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

test "sha256 - empty input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const result = try execute(allocator, &[_]u8{}, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 32), result.output.len);

    // SHA256 of empty string
    const expected = [_]u8{
        0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14,
        0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24,
        0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
        0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55,
    };
    try testing.expectEqualSlices(u8, &expected, result.output);
}
