const std = @import("std");
const crypto = std.crypto;
const testing = std.testing;
const Hash = @import("hash.zig");
const hex = @import("hex.zig");

// Import the local secp256k1 implementation
const secp256k1 = @import("secp256k1.zig");

// Use the address type from secp256k1 to avoid import issues
const Address = secp256k1.Address;

// Error types for crypto operations
pub const CryptoError = error{
    InvalidPrivateKey,
    InvalidPublicKey,
    InvalidSignature,
    InvalidRecoveryId,
    InvalidHashLength,
    InvalidLength,
    SigningFailed,
    RecoveryFailed,
    OutOfMemory,
    NotImplemented,
};

// Type definitions
pub const PrivateKey = [32]u8;
pub const PublicKey = struct {
    x: u256,
    y: u256,

    pub fn toAddress(self: PublicKey) Address {
        return publicKeyToAddress(self);
    }

    pub fn toAffinePoint(self: PublicKey) secp256k1.AffinePoint {
        return secp256k1.AffinePoint{
            .x = self.x,
            .y = self.y,
            .infinity = false,
        };
    }

    pub fn fromAffinePoint(point: secp256k1.AffinePoint) PublicKey {
        return PublicKey{
            .x = point.x,
            .y = point.y,
        };
    }

    pub fn isValid(self: PublicKey) bool {
        const point = self.toAffinePoint();
        return point.isOnCurve() and !point.infinity;
    }
};

pub const Signature = struct {
    r: u256,
    s: u256,
    v: u8, // recovery id + 27 (Ethereum convention)

    pub fn recoveryId(self: Signature) u8 {
        return self.v - 27;
    }

    pub fn yParity(self: Signature) u8 {
        return self.recoveryId();
    }

    pub fn toBytes(self: Signature) [65]u8 {
        var result: [65]u8 = undefined;
        std.mem.writeInt(u256, result[0..32], self.r, .big);
        std.mem.writeInt(u256, result[32..64], self.s, .big);
        result[64] = self.v;
        return result;
    }

    pub fn fromBytes(bytes: [65]u8) Signature {
        return Signature{
            .r = std.mem.readInt(u256, bytes[0..32], .big),
            .s = std.mem.readInt(u256, bytes[32..64], .big),
            .v = bytes[64],
        };
    }

    pub fn toHex(self: Signature) [132]u8 {
        const bytes = self.toBytes();
        return hex.bytesToHex(bytes);
    }

    pub fn fromHex(hexStr: []const u8) !Signature {
        const bytes = try hex.hexToBytesFixed(65, hexStr);
        return fromBytes(bytes);
    }

    pub fn isValid(self: Signature) bool {
        return secp256k1.validateSignature(self.r, self.s);
    }
};

// Constants
const ETHEREUM_MESSAGE_PREFIX = "\x19Ethereum Signed Message:\n";

// secp256k1 constants - re-export from precompile implementation
pub const SECP256K1_P: u256 = secp256k1.SECP256K1_P;
pub const SECP256K1_N: u256 = secp256k1.SECP256K1_N;
pub const SECP256K1_B: u256 = secp256k1.SECP256K1_B;
pub const SECP256K1_GX: u256 = secp256k1.SECP256K1_GX;
pub const SECP256K1_GY: u256 = secp256k1.SECP256K1_GY;

/// Generate a random private key
pub fn randomPrivateKey() !PrivateKey {
    var private_key: PrivateKey = undefined;
    crypto.random.bytes(&private_key);

    // Ensure the private key is valid (non-zero and less than secp256k1 order)
    const key_as_u256 = std.mem.readInt(u256, &private_key, .big);

    if (key_as_u256 == 0 or key_as_u256 >= SECP256K1_N) {
        return randomPrivateKey(); // Recursively generate until valid
    }

    return private_key;
}

/// Convert public key to Ethereum address
pub fn publicKeyToAddress(public_key: PublicKey) Address {
    var pub_key_bytes: [64]u8 = undefined;
    std.mem.writeInt(u256, pub_key_bytes[0..32], public_key.x, .big);
    std.mem.writeInt(u256, pub_key_bytes[32..64], public_key.y, .big);

    const hash = Hash.keccak256(&pub_key_bytes);

    var address: Address = undefined;
    @memcpy(&address, hash[12..32]);
    return address;
}

/// Create EIP-191 prefixed hash for a message
pub fn hashMessage(message: []const u8) Hash.Hash {
    var hasher = crypto.hash.sha3.Keccak256.init(.{});
    hasher.update(ETHEREUM_MESSAGE_PREFIX);

    // Add message length
    var length_buf: [32]u8 = undefined;
    const length_str = std.fmt.bufPrint(&length_buf, "{d}", .{message.len}) catch unreachable;
    hasher.update(length_str);

    hasher.update(message);

    var hash: Hash.Hash = undefined;
    hasher.final(&hash);
    return hash;
}

/// Validate signature parameters (basic validation)
pub fn isValidSignature(signature: Signature) bool {
    return secp256k1.validateSignature(signature.r, signature.s);
}

/// Derive public key from private key
pub fn getPublicKey(private_key: PrivateKey) !PublicKey {
    const private_key_u256 = std.mem.readInt(u256, &private_key, .big);

    // Validate private key
    if (private_key_u256 == 0 or private_key_u256 >= SECP256K1_N) {
        return CryptoError.InvalidPrivateKey;
    }

    // Multiply generator point by private key
    const generator = secp256k1.AffinePoint.generator();
    const public_key_point = generator.scalarMul(private_key_u256);

    if (public_key_point.infinity) {
        return CryptoError.InvalidPrivateKey;
    }

    return PublicKey{
        .x = public_key_point.x,
        .y = public_key_point.y,
    };
}

/// Sign a hash with a private key using ECDSA
pub fn signHash(hash: Hash.Hash, private_key: PrivateKey) !Signature {
    const private_key_u256 = std.mem.readInt(u256, &private_key, .big);

    // Validate private key
    if (private_key_u256 == 0 or private_key_u256 >= SECP256K1_N) {
        return CryptoError.InvalidPrivateKey;
    }

    // Get message hash as u256
    const message_u256 = std.mem.readInt(u256, &hash, .big);

    // Generate deterministic k using RFC 6979 (simplified)
    // For now, we'll use a simpler approach with random k
    // TODO: Implement proper RFC 6979 for deterministic signatures
    var k: u256 = 0;
    var r: u256 = 0;
    var s: u256 = 0;
    var recovery_id: u8 = 0;

    // Try random k values until we get a valid signature
    var attempts: u32 = 0;
    while (attempts < 1000) : (attempts += 1) {
        // Generate random k
        var k_bytes: [32]u8 = undefined;
        crypto.random.bytes(&k_bytes);
        k = std.mem.readInt(u256, &k_bytes, .big);

        // Ensure k is valid
        if (k == 0 or k >= SECP256K1_N) continue;

        // Calculate r = (k * G).x mod n
        const generator = secp256k1.AffinePoint.generator();
        const point_r = generator.scalarMul(k);
        if (point_r.infinity) continue;

        r = point_r.x % SECP256K1_N;
        if (r == 0) continue;

        // Calculate s = k^-1 * (hash + r * private_key) mod n
        const k_inv = secp256k1.invmod(k, SECP256K1_N) orelse continue;
        const r_d = secp256k1.mulmod(r, private_key_u256, SECP256K1_N);
        const hash_plus_rd = secp256k1.addmod(message_u256, r_d, SECP256K1_N);
        s = secp256k1.mulmod(k_inv, hash_plus_rd, SECP256K1_N);

        if (s == 0) continue;

        // Ensure s is in lower half to prevent malleability
        const half_n = SECP256K1_N >> 1;
        if (s > half_n) {
            s = SECP256K1_N - s;
        }

        // Calculate recovery ID
        recovery_id = if ((point_r.y & 1) == 1) @as(u8, 1) else @as(u8, 0);

        // Verify signature by recovering public key
        const recovered_address = secp256k1.recoverAddress(&hash, recovery_id, r, s) catch continue;
        const expected_public_key = getPublicKey(private_key) catch continue;
        const expected_address = expected_public_key.toAddress();

        if (std.mem.eql(u8, &recovered_address, &expected_address)) {
            break;
        }
    }

    if (attempts >= 1000) {
        return CryptoError.SigningFailed;
    }

    return Signature{
        .r = r,
        .s = s,
        .v = recovery_id + 27,
    };
}

/// Sign a message with EIP-191 prefix
pub fn signMessage(message: []const u8, private_key: PrivateKey) !Signature {
    const message_hash = hashMessage(message);
    return signHash(message_hash, private_key);
}

/// Recover address from signature and hash
pub fn recoverAddress(hash: Hash.Hash, signature: Signature) !Address {
    if (!signature.isValid()) {
        return CryptoError.InvalidSignature;
    }

    const recovery_id = signature.recoveryId();
    if (recovery_id > 1) {
        return CryptoError.InvalidRecoveryId;
    }

    return secp256k1.recoverAddress(&hash, recovery_id, signature.r, signature.s);
}

/// Recover address from message and signature
pub fn recoverMessageAddress(message: []const u8, signature: Signature) !Address {
    const message_hash = hashMessage(message);
    return recoverAddress(message_hash, signature);
}

/// Verify a signature against a hash and address
pub fn verifySignature(hash: Hash.Hash, signature: Signature, address: Address) !bool {
    const recovered_address = recoverAddress(hash, signature) catch return false;
    return std.mem.eql(u8, &recovered_address, &address);
}

/// Verify a message signature against an address
pub fn verifyMessage(message: []const u8, signature: Signature, address: Address) !bool {
    const recovered_address = recoverMessageAddress(message, signature) catch return false;
    return std.mem.eql(u8, &recovered_address, &address);
}

// ============================================================================
// Tests
// ============================================================================

test "private key generation" {
    const private_key = try randomPrivateKey();

    // Verify it's not all zeros
    var is_zero = true;
    for (private_key) |byte| {
        if (byte != 0) {
            is_zero = false;
            break;
        }
    }
    try testing.expect(!is_zero);

    // Verify it's a valid private key
    const key_as_u256 = std.mem.readInt(u256, &private_key, .big);
    try testing.expect(key_as_u256 > 0);
    try testing.expect(key_as_u256 < SECP256K1_N);
}

test "public key derivation" {
    const private_key = try randomPrivateKey();
    const public_key = try getPublicKey(private_key);

    // Verify public key is valid
    try testing.expect(public_key.isValid());

    // Verify public key is not at infinity
    try testing.expect(public_key.x != 0 or public_key.y != 0);
}

test "address derivation" {
    const private_key = try randomPrivateKey();
    const public_key = try getPublicKey(private_key);
    const address = public_key.toAddress();

    // Verify address is not zero
    const zero_address = [_]u8{0} ** 20;
    try testing.expect(!std.mem.eql(u8, &address, &zero_address));
}

test "message hashing" {
    const message = "Hello, Ethereum!";
    const hash1 = hashMessage(message);
    const hash2 = hashMessage(message);

    // Verify deterministic hashing
    try testing.expect(std.mem.eql(u8, &hash1, &hash2));

    // Verify different messages produce different hashes
    const different_message = "Hello, World!";
    const hash3 = hashMessage(different_message);
    try testing.expect(!std.mem.eql(u8, &hash1, &hash3));
}

test "signature creation and verification" {
    const private_key = try randomPrivateKey();
    const message = "Test message for signing";

    // Sign the message
    const signature = try signMessage(message, private_key);

    // Verify signature is valid
    try testing.expect(signature.isValid());

    // Recover address from signature
    const recovered_address = try recoverMessageAddress(message, signature);

    // Verify recovered address matches expected
    const public_key = try getPublicKey(private_key);
    const expected_address = public_key.toAddress();
    try testing.expect(std.mem.eql(u8, &recovered_address, &expected_address));

    // Verify signature verification
    try testing.expect(try verifyMessage(message, signature, expected_address));
}

test "signature roundtrip" {
    const private_key = try randomPrivateKey();
    const message = "Roundtrip test message";

    // Sign message
    const signature = try signMessage(message, private_key);

    // Verify signature components
    try testing.expect(signature.r > 0);
    try testing.expect(signature.s > 0);
    try testing.expect(signature.v == 27 or signature.v == 28);

    // Verify signature serialization
    const signature_bytes = signature.toBytes();
    const signature_restored = Signature.fromBytes(signature_bytes);
    try testing.expect(signature_restored.r == signature.r);
    try testing.expect(signature_restored.s == signature.s);
    try testing.expect(signature_restored.v == signature.v);

    // Verify message verification
    const expected_address = (try getPublicKey(private_key)).toAddress();
    try testing.expect(try verifyMessage(message, signature, expected_address));
}

test "invalid signature rejection" {
    const private_key = try randomPrivateKey();
    const message = "Test message";
    const signature = try signMessage(message, private_key);
    const expected_address = (try getPublicKey(private_key)).toAddress();

    // Verify correct signature works
    try testing.expect(try verifyMessage(message, signature, expected_address));

    // Test with modified message
    const wrong_message = "Wrong message";
    try testing.expect(!try verifyMessage(wrong_message, signature, expected_address));

    // Test with wrong address
    const wrong_address = [_]u8{0xFF} ** 20;
    try testing.expect(!try verifyMessage(message, signature, wrong_address));

    // Test with invalid signature
    var invalid_signature = signature;
    invalid_signature.r = 0; // Invalid r
    try testing.expect(!invalid_signature.isValid());
}

// Tests from crypto_test.zig

test "create and verify signature" {
    // Test private key
    const private_key = PrivateKey{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };
    
    // Message to sign
    const message = "Hello, Ethereum!";
    const message_hash = Hash.keccak256(message);
    
    // Sign the message
    const signature = try signHash(message_hash, private_key);
    
    // Verify signature components
    try testing.expectEqual(@as(usize, 32), @sizeOf(@TypeOf(signature.r)));
    try testing.expectEqual(@as(usize, 32), @sizeOf(@TypeOf(signature.s)));
    try testing.expect(signature.v == 27 or signature.v == 28);
}

test "ecdsa recover public key" {
    // Known test vector
    const message_hash = Hash.keccak256("test message");
    
    const signature = Signature{
        .r = 0x1234567890123456789012345678901234567890123456789012345678901234,
        .s = 0x3456789012345678901234567890123456789012345678901234567890123456,
        .v = 27,
    };
    
    // Recovery should not fail for valid signature
    const result = recoverAddress(message_hash, signature);
    _ = result catch |err| {
        // Expected to potentially fail with invalid test data
        try testing.expect(err == CryptoError.InvalidSignature or 
                          err == CryptoError.RecoveryFailed);
    };
}

test "signature serialization" {
    const signature = Signature{
        .r = 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,
        .s = 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb,
        .v = 28,
    };
    
    // Convert to bytes
    const bytes = signature.toBytes();
    try testing.expectEqual(@as(usize, 65), bytes.len);
    
    // First 32 bytes should be r
    var expected_r: [32]u8 = undefined;
    std.mem.writeInt(u256, &expected_r, signature.r, .big);
    try testing.expectEqualSlices(u8, &expected_r, bytes[0..32]);
    
    // Next 32 bytes should be s
    var expected_s: [32]u8 = undefined;
    std.mem.writeInt(u256, &expected_s, signature.s, .big);
    try testing.expectEqualSlices(u8, &expected_s, bytes[32..64]);
    
    // Last byte should be v
    try testing.expectEqual(@as(u8, 28), bytes[64]);
    
    // Convert back from bytes
    const recovered = Signature.fromBytes(bytes);
    try testing.expectEqual(signature.r, recovered.r);
    try testing.expectEqual(signature.s, recovered.s);
    try testing.expectEqual(signature.v, recovered.v);
}

test "signature hex encoding" {
    const signature = Signature{
        .r = 0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0,
        .s = 0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210,
        .v = 27,
    };
    
    // Convert to hex
    const hexStr = signature.toHex();
    
    // Should be 0x + 130 chars (65 bytes * 2)
    try testing.expectEqual(@as(usize, 132), hexStr.len);
    try testing.expect(std.mem.startsWith(u8, &hexStr, "0x"));
    
    // Convert back from hex
    const recovered = try Signature.fromHex(&hex);
    try testing.expectEqual(signature.r, recovered.r);
    try testing.expectEqual(signature.s, recovered.s);
    try testing.expectEqual(signature.v, recovered.v);
}

test "generate private key" {
    const key1 = try randomPrivateKey();
    const key2 = try randomPrivateKey();
    
    // Keys should be different
    try testing.expect(!std.mem.eql(u8, &key1, &key2));
    
    // Keys should be 32 bytes
    try testing.expectEqual(@as(usize, 32), key1.len);
    try testing.expectEqual(@as(usize, 32), key2.len);
    
    // Keys should not be zero
    const zero_key = [_]u8{0} ** 32;
    try testing.expect(!std.mem.eql(u8, &key1, &zero_key));
    try testing.expect(!std.mem.eql(u8, &key2, &zero_key));
}

test "derive public key from private key" {
    // Test vector with known private/public key pair
    const private_key = PrivateKey{0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                                   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                                   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                                   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
    
    const public_key = try getPublicKey(private_key);
    
    // Public key should be valid
    try testing.expect(public_key.isValid());
    
    // Public key should be deterministic
    const public_key2 = try getPublicKey(private_key);
    try testing.expectEqual(public_key.x, public_key2.x);
    try testing.expectEqual(public_key.y, public_key2.y);
}

test "derive address from private key" {
    const private_key = PrivateKey{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };
    
    const public_key = try getPublicKey(private_key);
    const address = publicKeyToAddress(public_key);
    
    // Address should be 20 bytes
    try testing.expectEqual(@as(usize, 20), address.len);
    
    // Address should be deterministic
    const address2 = publicKeyToAddress(public_key);
    try testing.expectEqualSlices(u8, &address, &address2);
}

test "personal sign message" {
    const private_key = PrivateKey{0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                                   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                                   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                                   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
    
    const message = "Hello, Ethereum!";
    
    // Sign with personal_sign prefix
    const signature = try signMessage(message, private_key);
    
    // Verify signature format
    try testing.expectEqual(@as(usize, 32), @sizeOf(@TypeOf(signature.r)));
    try testing.expectEqual(@as(usize, 32), @sizeOf(@TypeOf(signature.s)));
    try testing.expect(signature.v == 27 or signature.v == 28);
}

test "signature normalization" {
    // Signatures should have normalized S values (low S)
    // S should be <= n/2 where n is the curve order
    const signature = Signature{
        .r = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
        .s = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff, // High S value
        .v = 27,
    };
    
    // This signature would be invalid due to high S
    try testing.expect(!signature.isValid());
}

test "validate signature components" {
    // Valid signature
    const valid_sig = Signature{
        .r = 0x1234567890123456789012345678901234567890123456789012345678901234,
        .s = 0x3456789012345678901234567890123456789012345678901234567890123456,
        .v = 27,
    };
    try testing.expect(isValidSignature(valid_sig));
    
    // Invalid v value
    const invalid_v = Signature{
        .r = 0x1234567890123456789012345678901234567890123456789012345678901234,
        .s = 0x3456789012345678901234567890123456789012345678901234567890123456,
        .v = 26, // Should be 27 or 28
    };
    try testing.expect(!isValidSignature(invalid_v));
    
    // Zero r value (invalid)
    const zero_r = Signature{
        .r = 0,
        .s = 0x3456789012345678901234567890123456789012345678901234567890123456,
        .v = 27,
    };
    try testing.expect(!isValidSignature(zero_r));
    
    // Zero s value (invalid)
    const zero_s = Signature{
        .r = 0x1234567890123456789012345678901234567890123456789012345678901234,
        .s = 0,
        .v = 27,
    };
    try testing.expect(!isValidSignature(zero_s));
}
