const std = @import("std");
const crypto = @import("crypto");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BLS12-381 G1 multiplication
pub const GAS: u64 = 12000;

/// 0x0C: BLS12_G1MUL - BLS12-381 G1 multiplication
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < GAS) {
        return error.OutOfGas;
    }

    if (input.len != 160) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 128);
    crypto.Crypto.bls12_381.g1Mul(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}
