const std = @import("std");

/// SHA256 cryptographic hash function
/// Produces a 256-bit (32-byte) digest
pub const SHA256 = struct {
    pub const OUTPUT_SIZE: usize = 32;
    
    /// Compute SHA256 hash of input data
    pub fn hash(input: []const u8, output: []u8) void {
        std.debug.assert(output.len >= OUTPUT_SIZE);
        
        var hasher = std.crypto.hash.sha2.Sha256.init(.{});
        hasher.update(input);
        hasher.final(output[0..OUTPUT_SIZE]);
    }
    
    /// Compute SHA256 hash and return as fixed-size array
    pub fn hash_fixed(input: []const u8) [OUTPUT_SIZE]u8 {
        var result: [OUTPUT_SIZE]u8 = undefined;
        hash(input, &result);
        return result;
    }
};

test "SHA256 hash computation" {
    const test_input = "hello world";
    var output: [SHA256.OUTPUT_SIZE]u8 = undefined;
    
    SHA256.hash(test_input, &output);
    
    // Known SHA256 hash of "hello world"
    const expected = [_]u8{
        0xb9, 0x4d, 0x27, 0xb9, 0x93, 0x4d, 0x3e, 0x08,
        0xa5, 0x2e, 0x52, 0xd7, 0xda, 0x7d, 0xab, 0xfa,
        0xc4, 0x84, 0xef, 0xe3, 0x7a, 0x53, 0x80, 0xee,
        0x90, 0x88, 0xf7, 0xac, 0xe2, 0xef, 0xcd, 0xe9,
    };
    
    try std.testing.expectEqualSlices(u8, &expected, &output);
}

test "SHA256 hash_fixed function" {
    const test_input = "hello world";
    const result = SHA256.hash_fixed(test_input);
    
    const expected = [_]u8{
        0xb9, 0x4d, 0x27, 0xb9, 0x93, 0x4d, 0x3e, 0x08,
        0xa5, 0x2e, 0x52, 0xd7, 0xda, 0x7d, 0xab, 0xfa,
        0xc4, 0x84, 0xef, 0xe3, 0x7a, 0x53, 0x80, 0xee,
        0x90, 0x88, 0xf7, 0xac, 0xe2, 0xef, 0xcd, 0xe9,
    };
    
    try std.testing.expectEqual(expected, result);
}