const std = @import("std");
const crypto = @import("crypto");
const msmDiscount = @import("utils.zig").msmDiscount;
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas costs for BLS12-381 G1 MSM
pub const BASE_GAS: u64 = 12000;
pub const MULTIPLIER: u64 = 50;

/// 0x0D: BLS12_G1MSM - BLS12-381 G1 multi-scalar multiplication
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (input.len % 160 != 0 or input.len == 0) {
        return error.InvalidInput;
    }

    const k = input.len / 160;
    const discount = msmDiscount(k);
    const gas_cost = (BASE_GAS * k * discount) / 1000;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 128);
    crypto.Crypto.bls12_381.g1Msm(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}
