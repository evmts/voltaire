const std = @import("std");
const crypto = @import("crypto");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for BLS12-381 map field element to G1
pub const GAS: u64 = 5500;

/// 0x12: BLS12_MAP_FP_TO_G1 - BLS12-381 map field element to G1
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < GAS) {
        return error.OutOfGas;
    }

    if (input.len != 64) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 128);
    crypto.Crypto.bls12_381.mapFpToG1(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}
