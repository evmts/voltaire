const std = @import("std");
const crypto = @import("crypto");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BLS12-381 G2 multiplication
pub const GAS: u64 = 45000;

/// 0x0F: BLS12_G2MUL - BLS12-381 G2 multiplication
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
    crypto.Crypto.bls12_381.g2Mul(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}
