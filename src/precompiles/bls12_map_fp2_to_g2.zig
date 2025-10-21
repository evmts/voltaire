const std = @import("std");
const crypto = @import("crypto");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BLS12-381 map field element to G2
pub const GAS: u64 = 75000;

/// 0x13: BLS12_MAP_FP2_TO_G2 - BLS12-381 map field element to G2
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < GAS) {
        return error.OutOfGas;
    }

    if (input.len != 128) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 256);
    crypto.Crypto.bls12_381.mapFp2ToG2(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}
