const std = @import("std");
const blake2 = @import("blake2.zig");

/// C ABI export for BLAKE2b hashing (variable output length)
/// WARNING: UNAUDITED - Custom cryptographic implementation that has NOT been audited!
/// Use at your own risk in production systems.
///
/// @param input_ptr - Pointer to input data
/// @param input_len - Length of input data in bytes
/// @param output_ptr - Pointer to output buffer
/// @param output_len - Desired output length in bytes (1-64)
/// @return 0 on success, negative error code on failure
export fn blake2Hash(input_ptr: [*]const u8, input_len: usize, output_ptr: [*]u8, output_len: usize) i32 {
    // Validate output length (BLAKE2b supports 1-64 bytes)
    if (output_len < 1 or output_len > 64) {
        return -1; // Invalid output length
    }

    // Get input slice
    const input = input_ptr[0..input_len];

    // BLAKE2b supports variable output (1-64 bytes)
    // We use a comptime switch to select the right output size
    // For runtime variable lengths, we compute at max size and truncate
    var full_output: [64]u8 = undefined;

    // Use BLAKE2b-512 (64 bytes max) and hash the input
    var hasher = std.crypto.hash.blake2.Blake2b512.init(.{});
    hasher.update(input);
    hasher.final(&full_output);

    // Copy requested output length
    const output = output_ptr[0..output_len];
    @memcpy(output, full_output[0..output_len]);

    return 0; // Success
}
