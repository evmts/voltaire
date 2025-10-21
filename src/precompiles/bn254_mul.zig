const std = @import("std");
const crypto = @import("crypto");
const bn254 = crypto.bn254;
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BN254 multiplication
pub const GAS: u64 = 6000;

/// 0x07: BN254MUL - BN254 elliptic curve scalar multiplication
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < GAS) {
        return error.OutOfGas;
    }

    // Input: 96 bytes (point 64 bytes + scalar 32 bytes)
    var input_buf: [96]u8 = [_]u8{0} ** 96;
    @memcpy(input_buf[0..@min(input.len, 96)], input[0..@min(input.len, 96)]);

    const output = try allocator.alloc(u8, 64);

    // Perform multiplication using pure Zig implementation
    bn254.bn254Mul(&input_buf, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}

test "bn254Mul - multiply by zero" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Multiply any point by zero = point at infinity
    const input = [_]u8{0} ** 96;
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqual(GAS, result.gas_used);
}
