const std = @import("std");
const primitives = @import("src/primitives/root.zig");
const crypto = @import("src/crypto/root.zig");
const precompiles = @import("src/evm/precompiles.zig");

test "SHA256 precompile works" {
    const allocator = std.testing.allocator;
    const input = "Hello, World!";
    const result = try precompiles.execute_sha256(allocator, input, 1000);
    defer allocator.free(result.output);
    
    try std.testing.expect(result.success);
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    
    // Verify the hash is correct
    var expected: [32]u8 = undefined;
    std.crypto.hash.sha2.Sha256.hash(input, &expected, .{});
    try std.testing.expectEqualSlices(u8, &expected, result.output);
}

test "IDENTITY precompile works" {
    const allocator = std.testing.allocator;
    const input = "Test data for identity precompile";
    const result = try precompiles.execute_identity(allocator, input, 1000);
    defer allocator.free(result.output);
    
    try std.testing.expect(result.success);
    try std.testing.expectEqualSlices(u8, input, result.output);
}

test "ECRECOVER precompile works with valid signature" {
    const allocator = std.testing.allocator;
    
    // Create a valid signature test case
    var input: [128]u8 = [_]u8{0} ** 128;
    
    // Set v = 27 (recovery id 0)
    input[63] = 27;
    
    // Set r and s to some non-zero values (not a real signature, but should not crash)
    input[95] = 1; // r = 1
    input[127] = 1; // s = 1
    
    const result = try precompiles.execute_ecrecover(allocator, &input, 5000);
    defer allocator.free(result.output);
    
    try std.testing.expect(result.success);
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

test "RIPEMD160 precompile works" {
    const allocator = std.testing.allocator;
    const input = "Test data";
    const result = try precompiles.execute_ripemd160(allocator, input, 1000);
    defer allocator.free(result.output);
    
    try std.testing.expect(result.success);
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

test "MODEXP precompile works" {
    const allocator = std.testing.allocator;
    
    // 3^4 mod 5 = 81 mod 5 = 1
    var input: [128]u8 = [_]u8{0} ** 128;
    
    // base_len = 1 (32 bytes, big-endian)
    input[31] = 1;
    // exp_len = 1 (32 bytes, big-endian)  
    input[63] = 1;
    // mod_len = 1 (32 bytes, big-endian)
    input[95] = 1;
    // base = 3
    input[96] = 3;
    // exp = 4  
    input[97] = 4;
    // mod = 5
    input[98] = 5;
    
    const result = try precompiles.execute_modexp(allocator, input[0..99], 1000);
    defer allocator.free(result.output);
    
    try std.testing.expect(result.success);
    try std.testing.expectEqual(@as(usize, 1), result.output.len);
    try std.testing.expectEqual(@as(u8, 1), result.output[0]);
}

test "BLAKE2F precompile works" {
    const allocator = std.testing.allocator;
    
    // Valid BLAKE2F input: rounds(4) + h(64) + m(128) + t(16) + f(1) = 213 bytes
    var input: [213]u8 = [_]u8{0} ** 213;
    
    // Set rounds to 1 (big-endian)
    input[3] = 1;
    
    // Set final block indicator to 0 (not final)
    input[212] = 0;
    
    const result = try precompiles.execute_blake2f(allocator, &input, 1000);
    defer allocator.free(result.output);
    
    try std.testing.expect(result.success);
    try std.testing.expectEqual(@as(usize, 64), result.output.len);
}

test "BN254 ECADD precompile works" {
    const allocator = std.testing.allocator;
    
    // Two points at infinity should result in infinity
    var input: [128]u8 = [_]u8{0} ** 128;
    
    const result = try precompiles.execute_ecadd(allocator, &input, 1000);
    defer allocator.free(result.output);
    
    try std.testing.expect(result.success);
    try std.testing.expectEqual(@as(usize, 64), result.output.len);
    
    // Result should be all zeros (point at infinity)
    for (result.output) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }
}

test "BN254 ECMUL precompile works" {
    const allocator = std.testing.allocator;
    
    // Point at infinity * scalar should result in infinity
    var input: [96]u8 = [_]u8{0} ** 96;
    
    const result = try precompiles.execute_ecmul(allocator, &input, 10000);
    defer allocator.free(result.output);
    
    try std.testing.expect(result.success);
    try std.testing.expectEqual(@as(usize, 64), result.output.len);
    
    // Result should be all zeros (point at infinity)
    for (result.output) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }
}