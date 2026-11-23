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

    // Digest length goes into the BLAKE2b parameter block; never truncate 512.
    blake2.Blake2.hashVariable(input_ptr[0..input_len], output_ptr[0..output_len]) catch return -1;

    return 0; // Success
}

test "blake2Hash: output_len 32 of empty input is RFC 7693 BLAKE2b-256" {
    var out: [32]u8 = undefined;
    try std.testing.expectEqual(@as(i32, 0), blake2Hash("".ptr, 0, &out, 32));
    var expected: [32]u8 = undefined;
    _ = try std.fmt.hexToBytes(&expected, "0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8");
    try std.testing.expectEqualSlices(u8, &expected, &out);
    try std.testing.expectEqual(@as(i32, -1), blake2Hash("".ptr, 0, &out, 0));
    try std.testing.expectEqual(@as(i32, -1), blake2Hash("".ptr, 0, &out, 65));
}
