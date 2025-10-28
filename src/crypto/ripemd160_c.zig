const std = @import("std");
const ripemd160 = @import("ripemd160.zig");

/// Error codes for C ABI
const RIPEMD160_SUCCESS: c_int = 0;
const RIPEMD160_ERROR: c_int = -1;

/// Compute RIPEMD160 hash (C ABI for WASM)
/// @param input_ptr - Pointer to input data
/// @param input_len - Length of input data
/// @param output_ptr - Pointer to 20-byte output buffer
/// @return RIPEMD160_SUCCESS on success, RIPEMD160_ERROR on failure
export fn ripemd160Hash(
    input_ptr: [*]const u8,
    input_len: usize,
    output_ptr: *[20]u8,
) c_int {
    const input = input_ptr[0..input_len];
    ripemd160.Ripemd160.hash(input, output_ptr);
    return RIPEMD160_SUCCESS;
}
