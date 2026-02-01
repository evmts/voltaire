const std = @import("std");
const ark = @import("bn254_arkworks.zig");

// C ABI exports for BN254 Arkworks operations (WebAssembly and FFI)
// Uses Arkworks Rust backend for production-grade performance

// ============================================================================
// Initialization
// ============================================================================

export fn bn254_ark_init() i32 {
    ark.init() catch return -1;
    return 0;
}

// ============================================================================
// EIP-196/197 Precompile Operations
// ============================================================================

export fn bn254_ark_ecmul(
    input_ptr: [*]const u8,
    input_len: usize,
    output_ptr: [*]u8,
    output_len: usize,
) i32 {
    const input = input_ptr[0..input_len];
    const output = output_ptr[0..output_len];
    ark.ecmul(input, output) catch return -1;
    return 0;
}

export fn bn254_ark_ecpairing(
    input_ptr: [*]const u8,
    input_len: usize,
    output_ptr: [*]u8,
    output_len: usize,
) i32 {
    const input = input_ptr[0..input_len];
    const output = output_ptr[0..output_len];
    ark.ecpairing(input, output) catch return -1;
    return 0;
}

export fn bn254_ark_ecmul_output_size() u32 {
    return ark.ecmulOutputSize();
}

export fn bn254_ark_ecpairing_output_size() u32 {
    return ark.ecpairingOutputSize();
}

export fn bn254_ark_validate_ecmul_input(input_ptr: [*]const u8, input_len: usize) i32 {
    const input = input_ptr[0..input_len];
    ark.validateEcmulInput(input) catch return -1;
    return 0;
}

export fn bn254_ark_validate_ecpairing_input(input_ptr: [*]const u8, input_len: usize) i32 {
    const input = input_ptr[0..input_len];
    ark.validateEcpairingInput(input) catch return -1;
    return 0;
}

// ============================================================================
// Tests
// ============================================================================

test "bn254_ark_c exports work" {
    const result = bn254_ark_init();
    try std.testing.expectEqual(@as(i32, 0), result);

    const out_size = bn254_ark_ecmul_output_size();
    try std.testing.expectEqual(@as(u32, 64), out_size);

    const pairing_size = bn254_ark_ecpairing_output_size();
    try std.testing.expectEqual(@as(u32, 32), pairing_size);
}
