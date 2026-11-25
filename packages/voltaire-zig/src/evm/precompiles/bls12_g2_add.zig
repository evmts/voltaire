const std = @import("std");
const crypto = @import("crypto");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BLS12-381 G2 addition (EIP-2537)
pub const GAS: u64 = 600;

/// 0x0D: BLS12_G2ADD - BLS12-381 G2 addition (EIP-2537)
///
/// Input: 512 bytes, two G2 points of 256 bytes each. Output: 256 bytes.
/// A non-canonical coordinate or a point off the curve is an error. EIP-2537
/// specifies no subgroup check for this operation.
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
    errdefer allocator.free(output);
    @memset(output, 0);
    crypto.Crypto.bls12_381.g2Add(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}

test "bls12_g2_add - out of gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([512]u8, @splat(0));
    const result = execute(allocator, &input, GAS - 1);

    try testing.expectError(error.OutOfGas, result);
}

test "bls12_g2_add - invalid input length too short" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([256]u8, @splat(0));
    const result = execute(allocator, &input, 1000000);

    try testing.expectError(error.InvalidInput, result);
}

test "bls12_g2_add - invalid input length too long" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([600]u8, @splat(0));
    const result = execute(allocator, &input, 1000000);

    try testing.expectError(error.InvalidInput, result);
}

test "bls12_g2_add - gas cost" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([512]u8, @splat(0));
    const result = execute(allocator, &input, 1000000);

    if (result) |res| {
        defer res.deinit(allocator);
        try testing.expectEqual(GAS, res.gas_used);
    } else |err| {
        if (err != error.InvalidPoint) {
            return err;
        }
    }
}

test "bls12_g2_add - output length" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([512]u8, @splat(0));
    const result = execute(allocator, &input, 1000000);

    if (result) |res| {
        defer res.deinit(allocator);
        try testing.expectEqual(@as(usize, 256), res.output.len);
    } else |err| {
        if (err != error.InvalidPoint) {
            return err;
        }
    }
}

test "bls12_g2_add - official EIP-2537 vectors" {
    try @import("utils.zig").expectVectors(execute, @embedFile("vectors/eip2537_g2_add.txt"), 9);
}

test "bls12_g2_add - official EIP-2537 failure vectors" {
    try @import("utils.zig").expectVectors(execute, @embedFile("vectors/eip2537_g2_add_fail.txt"), 7);
}

test "bls12_g2_add - gas is 600 (EIP-2537)" {
    try std.testing.expectEqual(@as(u64, 600), GAS);
}
