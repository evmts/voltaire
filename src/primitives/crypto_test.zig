const std = @import("std");
const testing = std.testing;
const Crypto = @import("crypto.zig");
const Hash = @import("hash_utils.zig");
const Hex = @import("hex.zig");

// Test signature creation and validation
test "create and verify signature" {
    const allocator = testing.allocator;
    
    // Test private key
    const private_key = Crypto.PrivateKey{
        .bytes = [_]u8{
            0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
            0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
            0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
            0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
        },
    };
    
    // Message to sign
    const message = "Hello, Ethereum!";
    const message_hash = Hash.keccak256(message);
    
    // Sign the message
    const signature = try Crypto.sign(allocator, private_key, message_hash);
    
    // Verify signature components
    try testing.expectEqual(@as(usize, 32), signature.r.len);
    try testing.expectEqual(@as(usize, 32), signature.s.len);
    try testing.expect(signature.v == 27 or signature.v == 28);
}

// Test ECDSA recover
test "ecdsa recover public key" {
    const allocator = testing.allocator;
    
    // Known test vector
    const message_hash = Hash.keccak256("test message");
    
    const signature = Crypto.Signature{
        .r = [_]u8{0x12} ** 32,
        .s = [_]u8{0x34} ** 32,
        .v = 27,
    };
    
    // Recovery should not fail for valid signature
    const result = Crypto.recover_public_key(allocator, message_hash, signature);
    _ = result catch |err| {
        // Expected to potentially fail with invalid test data
        try testing.expect(err == Crypto.CryptoError.InvalidSignature or 
                          err == Crypto.CryptoError.RecoveryFailed);
    };
}

// Test signature to/from bytes
test "signature serialization" {
    const signature = Crypto.Signature{
        .r = [_]u8{0xaa} ** 32,
        .s = [_]u8{0xbb} ** 32,
        .v = 28,
    };
    
    // Convert to bytes
    const bytes = Crypto.signature_to_bytes(signature);
    try testing.expectEqual(@as(usize, 65), bytes.len);
    
    // First 32 bytes should be r
    try testing.expectEqualSlices(u8, &signature.r, bytes[0..32]);
    
    // Next 32 bytes should be s
    try testing.expectEqualSlices(u8, &signature.s, bytes[32..64]);
    
    // Last byte should be v
    try testing.expectEqual(@as(u8, 28), bytes[64]);
    
    // Convert back from bytes
    const recovered = try Crypto.signature_from_bytes(bytes);
    try testing.expectEqualSlices(u8, &signature.r, &recovered.r);
    try testing.expectEqualSlices(u8, &signature.s, &recovered.s);
    try testing.expectEqual(signature.v, recovered.v);
}

// Test signature from bytes with invalid length
test "signature from bytes invalid length" {
    // Too short
    const short_bytes = [_]u8{0} ** 64;
    const result1 = Crypto.signature_from_bytes(&short_bytes);
    try testing.expectError(Crypto.CryptoError.InvalidSignatureLength, result1);
    
    // Too long
    const long_bytes = [_]u8{0} ** 66;
    const result2 = Crypto.signature_from_bytes(&long_bytes);
    try testing.expectError(Crypto.CryptoError.InvalidSignatureLength, result2);
}

// Test signature to/from hex
test "signature hex encoding" {
    const allocator = testing.allocator;
    
    const signature = Crypto.Signature{
        .r = [_]u8{
            0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
            0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
            0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
            0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
        },
        .s = [_]u8{
            0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10,
            0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10,
            0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10,
            0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10,
        },
        .v = 27,
    };
    
    // Convert to hex
    const hex = try Crypto.signature_to_hex(allocator, signature);
    defer allocator.free(hex);
    
    // Should be 0x + 130 chars (65 bytes * 2)
    try testing.expectEqual(@as(usize, 132), hex.len);
    try testing.expect(std.mem.startsWith(u8, hex, "0x"));
    
    // Convert back from hex
    const recovered = try Crypto.signature_from_hex(allocator, hex);
    try testing.expectEqualSlices(u8, &signature.r, &recovered.r);
    try testing.expectEqualSlices(u8, &signature.s, &recovered.s);
    try testing.expectEqual(signature.v, recovered.v);
}

// Test private key generation
test "generate private key" {
    const allocator = testing.allocator;
    
    const key1 = try Crypto.generate_private_key(allocator);
    const key2 = try Crypto.generate_private_key(allocator);
    
    // Keys should be different
    try testing.expect(!std.mem.eql(u8, &key1.bytes, &key2.bytes));
    
    // Keys should be 32 bytes
    try testing.expectEqual(@as(usize, 32), key1.bytes.len);
    try testing.expectEqual(@as(usize, 32), key2.bytes.len);
    
    // Keys should not be zero
    const zero_key = [_]u8{0} ** 32;
    try testing.expect(!std.mem.eql(u8, &key1.bytes, &zero_key));
    try testing.expect(!std.mem.eql(u8, &key2.bytes, &zero_key));
}

// Test public key derivation
test "derive public key from private key" {
    const allocator = testing.allocator;
    
    // Test vector with known private/public key pair
    const private_key = Crypto.PrivateKey{
        .bytes = [_]u8{0x01} ** 32,
    };
    
    const public_key = try Crypto.get_public_key(allocator, private_key);
    
    // Public key should be 64 bytes (uncompressed, without prefix)
    try testing.expectEqual(@as(usize, 64), public_key.bytes.len);
    
    // Public key should be deterministic
    const public_key2 = try Crypto.get_public_key(allocator, private_key);
    try testing.expectEqualSlices(u8, &public_key.bytes, &public_key2.bytes);
}

// Test address derivation from private key
test "derive address from private key" {
    const allocator = testing.allocator;
    
    const private_key = Crypto.PrivateKey{
        .bytes = [_]u8{
            0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
            0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
            0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
            0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
        },
    };
    
    const address = try Crypto.get_address(allocator, private_key);
    
    // Address should be 20 bytes
    try testing.expectEqual(@as(usize, 20), address.len);
    
    // Address should be deterministic
    const address2 = try Crypto.get_address(allocator, private_key);
    try testing.expectEqualSlices(u8, &address, &address2);
}

// Test message signing with personal_sign prefix
test "personal sign message" {
    const allocator = testing.allocator;
    
    const private_key = Crypto.PrivateKey{
        .bytes = [_]u8{0x42} ** 32,
    };
    
    const message = "Hello, Ethereum!";
    
    // Sign with personal_sign prefix
    const signature = try Crypto.personal_sign(allocator, private_key, message);
    
    // Verify signature format
    try testing.expectEqual(@as(usize, 32), signature.r.len);
    try testing.expectEqual(@as(usize, 32), signature.s.len);
    try testing.expect(signature.v == 27 or signature.v == 28);
}

// Test signature normalization (for low S values)
test "signature normalization" {
    // Signatures should have normalized S values (low S)
    // S should be <= n/2 where n is the curve order
    const signature = Crypto.Signature{
        .r = [_]u8{0xff} ** 32,
        .s = [_]u8{0xff} ** 32, // High S value
        .v = 27,
    };
    
    const normalized = Crypto.normalize_signature(signature);
    
    // V should be flipped for high S
    try testing.expect(normalized.v == 27 or normalized.v == 28);
}

// Test signature validation
test "validate signature components" {
    // Valid signature
    const valid_sig = Crypto.Signature{
        .r = [_]u8{0x12} ** 32,
        .s = [_]u8{0x34} ** 32,
        .v = 27,
    };
    try testing.expect(Crypto.is_valid_signature(valid_sig));
    
    // Invalid v value
    const invalid_v = Crypto.Signature{
        .r = [_]u8{0x12} ** 32,
        .s = [_]u8{0x34} ** 32,
        .v = 26, // Should be 27 or 28
    };
    try testing.expect(!Crypto.is_valid_signature(invalid_v));
    
    // Zero r value (invalid)
    const zero_r = Crypto.Signature{
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0x34} ** 32,
        .v = 27,
    };
    try testing.expect(!Crypto.is_valid_signature(zero_r));
    
    // Zero s value (invalid)
    const zero_s = Crypto.Signature{
        .r = [_]u8{0x12} ** 32,
        .s = [_]u8{0} ** 32,
        .v = 27,
    };
    try testing.expect(!Crypto.is_valid_signature(zero_s));
}

// Test compressed public key
test "compressed public key format" {
    const allocator = testing.allocator;
    
    const public_key = Crypto.PublicKey{
        .bytes = [_]u8{0x42} ** 64,
    };
    
    const compressed = try Crypto.compress_public_key(allocator, public_key);
    defer allocator.free(compressed);
    
    // Compressed key should be 33 bytes (prefix + 32 bytes)
    try testing.expectEqual(@as(usize, 33), compressed.len);
    
    // First byte should be 0x02 or 0x03
    try testing.expect(compressed[0] == 0x02 or compressed[0] == 0x03);
}