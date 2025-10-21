const std = @import("std");
const crypto = @import("crypto");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BLS12-381 G1 addition
pub const GAS: u64 = 500;

/// 0x0B: BLS12_G1ADD - BLS12-381 G1 addition
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < GAS) {
        return error.OutOfGas;
    }

    if (input.len != 256) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 128);
    crypto.Crypto.bls12_381.g1Add(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}
