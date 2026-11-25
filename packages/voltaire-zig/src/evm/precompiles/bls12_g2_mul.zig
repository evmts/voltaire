const std = @import("std");
const crypto = @import("crypto");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BLS12-381 G2 multiplication (EIP-2537 `multiplication_cost`)
pub const GAS: u64 = 22500;

/// BLS12-381 G2 scalar multiplication: the single-pair case of BLS12_G2MSM.
///
/// The final EIP-2537 has no separate G2MUL precompile, so this function is
/// not dispatched at any address. It is a library helper with the gas of a
/// one-pair MSM.
///
/// Input: 288 bytes, a G2 point (256 bytes) and a scalar (32 bytes).
/// Output: 256 bytes. The point must be in the order-r subgroup.
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < GAS) {
        return error.OutOfGas;
    }

    if (input.len != 288) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 256);
    errdefer allocator.free(output);
    @memset(output, 0);
    crypto.Crypto.bls12_381.g2Mul(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}

test "bls12_g2_mul - out of gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([288]u8, @splat(0));
    const result = execute(allocator, &input, GAS - 1);

    try testing.expectError(error.OutOfGas, result);
}

test "bls12_g2_mul - invalid input length too short" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([256]u8, @splat(0));
    const result = execute(allocator, &input, 1000000);

    try testing.expectError(error.InvalidInput, result);
}

test "bls12_g2_mul - invalid input length too long" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([320]u8, @splat(0));
    const result = execute(allocator, &input, 1000000);

    try testing.expectError(error.InvalidInput, result);
}

test "bls12_g2_mul - gas cost" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([288]u8, @splat(0));
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

test "bls12_g2_mul - output length" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([288]u8, @splat(0));
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

test "bls12_g2_mul - scalar zero" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([288]u8, @splat(0));
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

test "bls12_g2_mul - scalar one" {
    const testing = std.testing;
    const allocator = testing.allocator;

    var input = @as([288]u8, @splat(0));
    input[287] = 1;
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

test "bls12_g2_mul - official EIP-2537 vectors" {
    try @import("utils.zig").expectVectors(execute, @embedFile("vectors/eip2537_g2_mul.txt"), 11);
}

test "bls12_g2_mul - official EIP-2537 failure vectors" {
    try @import("utils.zig").expectVectors(execute, @embedFile("vectors/eip2537_g2_mul_fail.txt"), 8);
}
