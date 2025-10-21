const std = @import("std");
const crypto = @import("crypto");
const c_kzg = crypto.c_kzg;
const kzg_setup = crypto.kzg_setup;
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas cost for point evaluation
pub const GAS: u64 = 50000;

/// 0x0A: POINT_EVALUATION - KZG point evaluation (EIP-4844)
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < GAS) {
        return error.OutOfGas;
    }

    // Input format (192 bytes):
    // - versioned_hash (32 bytes)
    // - z (32 bytes) - evaluation point
    // - y (32 bytes) - claimed evaluation
    // - commitment (48 bytes) - KZG commitment
    // - proof (48 bytes) - KZG proof
    if (input.len != 192) {
        return error.InvalidInput;
    }

    const versioned_hash = input[0..32];
    const z = input[32..64];
    const y = input[64..96];
    const commitment = input[96..144];
    const proof = input[144..192];

    // Verify versioned hash matches commitment
    var computed_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(commitment, &computed_hash);
    computed_hash[0] = 0x01; // Version byte for EIP-4844

    // Check if versioned hash matches
    for (versioned_hash, computed_hash) |a, b| {
        if (a != b) {
            return error.InvalidInput;
        }
    }

    // Verify KZG proof
    const commitment_ptr: *const c_kzg.KZGCommitment = @ptrCast(@alignCast(commitment));
    const z_ptr: *const c_kzg.Bytes32 = @ptrCast(@alignCast(z));
    const y_ptr: *const c_kzg.Bytes32 = @ptrCast(@alignCast(y));
    const proof_ptr: *const c_kzg.KZGProof = @ptrCast(@alignCast(proof));

    const valid = kzg_setup.verifyKZGProofThreadSafe(
        commitment_ptr,
        z_ptr,
        y_ptr,
        proof_ptr,
    ) catch {
        return error.InvalidInput;
    };

    const output = try allocator.alloc(u8, 64);
    @memset(output, 0);

    if (valid) {
        // Return the precompile return value: FIELD_ELEMENTS_PER_BLOB, BLS_MODULUS
        // FIELD_ELEMENTS_PER_BLOB = 4096
        output[30] = 0x10;
        output[31] = 0x00;

        // BLS_MODULUS (last 32 bytes) = 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001
        const bls_modulus = [_]u8{
            0x73, 0xed, 0xa7, 0x53, 0x29, 0x9d, 0x7d, 0x48,
            0x33, 0x39, 0xd8, 0x08, 0x09, 0xa1, 0xd8, 0x05,
            0x53, 0xbd, 0xa4, 0x02, 0xff, 0xfe, 0x5b, 0xfe,
            0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x01,
        };
        @memcpy(output[32..64], &bls_modulus);
    }

    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}
