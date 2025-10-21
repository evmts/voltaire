const std = @import("std");
const crypto = @import("crypto");
const Blake2 = crypto.Blake2;
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost per round for Blake2f
pub const PER_ROUND_GAS: u64 = 1;

/// 0x09: BLAKE2F - Blake2b compression function
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (input.len != 213) {
        return error.InvalidInput;
    }

    const rounds = std.mem.readInt(u32, input[0..4], .big);
    const gas_cost = PER_ROUND_GAS * rounds;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 64);

    Blake2.compress(input, output) catch {
        return error.InvalidInput;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

test "blake2f - invalid input length" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 100; // Wrong length
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}
