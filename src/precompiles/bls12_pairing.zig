const std = @import("std");
const crypto = @import("crypto");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas costs for BLS12-381 pairing
pub const BASE_GAS: u64 = 65000;
pub const PER_PAIR_GAS: u64 = 43000;

/// 0x11: BLS12_PAIRING - BLS12-381 pairing check
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (input.len % 384 != 0) {
        return error.InvalidInput;
    }

    const k = input.len / 384;
    const gas_cost = BASE_GAS + PER_PAIR_GAS * k;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 32);
    @memset(output, 0);

    const success = crypto.Crypto.bls12_381.pairingCheck(input) catch {
        return error.InvalidPairing;
    };

    if (success) {
        output[31] = 1;
    }

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}
