const std = @import("std");
const crypto = @import("crypto");
const bn254 = crypto.bn254;
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BN254 addition
pub const GAS: u64 = 150;

/// 0x06: BN254ADD - BN254 elliptic curve addition
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < GAS) {
        return error.OutOfGas;
    }

    // Input: 128 bytes (two points, 64 bytes each)
    var input_buf: [128]u8 = [_]u8{0} ** 128;
    @memcpy(input_buf[0..@min(input.len, 128)], input[0..@min(input.len, 128)]);

    const output = try allocator.alloc(u8, 64);

    // Perform addition using pure Zig implementation
    bn254.bn254Add(&input_buf, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}

test "bn254Add - point at infinity" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Adding point at infinity to itself
    const input = [_]u8{0} ** 128;
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqual(GAS, result.gas_used);
}

test "bn254Add - out of gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 128;
    const result = execute(allocator, &input, GAS - 1);
    try testing.expectError(error.OutOfGas, result);
}

test "bn254Add - exact gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 128;
    const result = try execute(allocator, &input, GAS);
    defer result.deinit(allocator);

    try testing.expectEqual(GAS, result.gas_used);
}

test "bn254Add - input too short" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 127;
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "bn254Add - input too long padded correctly" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 200;
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "bn254Add - zero input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{};
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "bn254Add - gas cost constant" {
    const testing = std.testing;

    try testing.expectEqual(@as(u64, 150), GAS);
}

test "bn254Add - output size validation" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 128;
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
}
