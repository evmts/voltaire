const std = @import("std");
const crypto = std.crypto;
const testing = std.testing;
const Hash = @import("hash_utils.zig");
const Hex = @import("hex.zig");

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

    pub fn to_address(self: PublicKey) Address {
        return public_key_to_address(self);
    }

    pub fn to_affine_point(self: PublicKey) secp256k1.AffinePoint {
        return secp256k1.AffinePoint{
            .x = self.x,
            .y = self.y,
            .infinity = false,
        };
    }

    pub fn from_affine_point(point: secp256k1.AffinePoint) PublicKey {
        return PublicKey{
            .x = point.x,
            .y = point.y,
        };
    }

    pub fn is_valid(self: PublicKey) bool {
        const point = self.to_affine_point();
        return point.isOnCurve() and !point.infinity;
    }
};

pub const Signature = struct {
    r: u256,
    s: u256,
    v: u8, // recovery id + 27 (Ethereum convention)

    pub fn recovery_id(self: Signature) u8 {
        return self.v - 27;
    }

    pub fn y_parity(self: Signature) u8 {
        return self.recovery_id();
    }

    pub fn to_bytes(self: Signature) [65]u8 {
        var result: [65]u8 = undefined;
        std.mem.writeInt(u256, result[0..32], self.r, .big);
        std.mem.writeInt(u256, result[32..64], self.s, .big);
        result[64] = self.v;
        return result;
    }

    pub fn from_bytes(bytes: [65]u8) Signature {
        return Signature{
            .r = std.mem.readInt(u256, bytes[0..32], .big),
            .s = std.mem.readInt(u256, bytes[32..64], .big),
            .v = bytes[64],
        };
    }

    pub fn to_hex(self: Signature) [132]u8 {
        const bytes = self.to_bytes();
        return Hex.bytes_to_hex(bytes);
    }

    pub fn from_hex(hex: []const u8) !Signature {
        const bytes = try Hex.hex_to_bytes_fixed(65, hex);
        return from_bytes(bytes);
    }

    pub fn is_valid(self: Signature) bool {
        return secp256k1.validate_signature(self.r, self.s);
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
pub fn random_private_key() !PrivateKey {
    var private_key: PrivateKey = undefined;
    crypto.random.bytes(&private_key);

    // Ensure the private key is valid (non-zero and less than secp256k1 order)
    const key_as_u256 = std.mem.readInt(u256, &private_key, .big);

    if (key_as_u256 == 0 or key_as_u256 >= SECP256K1_N) {
        return random_private_key(); // Recursively generate until valid
    }

    return private_key;
}

/// Convert public key to Ethereum address
pub fn public_key_to_address(public_key: PublicKey) Address {
    var pub_key_bytes: [64]u8 = undefined;
    std.mem.writeInt(u256, pub_key_bytes[0..32], public_key.x, .big);
    std.mem.writeInt(u256, pub_key_bytes[32..64], public_key.y, .big);

    const hash = Hash.keccak256(&pub_key_bytes);

    var address: Address = undefined;
    @memcpy(&address, hash[12..32]);
    return address;
}

/// Create EIP-191 prefixed hash for a message
pub fn hash_message(message: []const u8) Hash.Hash {
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
pub fn is_valid_signature(signature: Signature) bool {
    return secp256k1.validate_signature(signature.r, signature.s);
}

/// Derive public key from private key
pub fn get_public_key(private_key: PrivateKey) !PublicKey {
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
pub fn sign_hash(hash: Hash.Hash, private_key: PrivateKey) !Signature {
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
        const recovered_address = secp256k1.recover_address(&hash, recovery_id, r, s) catch continue;
        const expected_public_key = get_public_key(private_key) catch continue;
        const expected_address = expected_public_key.to_address();

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
pub fn sign_message(message: []const u8, private_key: PrivateKey) !Signature {
    const message_hash = hash_message(message);
    return sign_hash(message_hash, private_key);
}

/// Recover address from signature and hash
pub fn recover_address(hash: Hash.Hash, signature: Signature) !Address {
    if (!signature.is_valid()) {
        return CryptoError.InvalidSignature;
    }

    const recovery_id = signature.recovery_id();
    if (recovery_id > 1) {
        return CryptoError.InvalidRecoveryId;
    }

    return secp256k1.recover_address(&hash, recovery_id, signature.r, signature.s);
}

/// Recover address from message and signature
pub fn recover_message_address(message: []const u8, signature: Signature) !Address {
    const message_hash = hash_message(message);
    return recover_address(message_hash, signature);
}

/// Verify a signature against a hash and address
pub fn verify_signature(hash: Hash.Hash, signature: Signature, address: Address) !bool {
    const recovered_address = recover_address(hash, signature) catch return false;
    return std.mem.eql(u8, &recovered_address, &address);
}

/// Verify a message signature against an address
pub fn verify_message(message: []const u8, signature: Signature, address: Address) !bool {
    const recovered_address = recover_message_address(message, signature) catch return false;
    return std.mem.eql(u8, &recovered_address, &address);
}

// ============================================================================
// Tests
// ============================================================================

test "private key generation" {
    const private_key = try random_private_key();

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
    const private_key = try random_private_key();
    const public_key = try get_public_key(private_key);

    // Verify public key is valid
    try testing.expect(public_key.is_valid());

    // Verify public key is not at infinity
    try testing.expect(public_key.x != 0 or public_key.y != 0);
}

test "address derivation" {
    const private_key = try random_private_key();
    const public_key = try get_public_key(private_key);
    const address = public_key.to_address();

    // Verify address is not zero
    const zero_address = [_]u8{0} ** 20;
    try testing.expect(!std.mem.eql(u8, &address, &zero_address));
}

test "message hashing" {
    const message = "Hello, Ethereum!";
    const hash1 = hash_message(message);
    const hash2 = hash_message(message);

    // Verify deterministic hashing
    try testing.expect(std.mem.eql(u8, &hash1, &hash2));

    // Verify different messages produce different hashes
    const different_message = "Hello, World!";
    const hash3 = hash_message(different_message);
    try testing.expect(!std.mem.eql(u8, &hash1, &hash3));
}

test "signature creation and verification" {
    const private_key = try random_private_key();
    const message = "Test message for signing";

    // Sign the message
    const signature = try sign_message(message, private_key);

    // Verify signature is valid
    try testing.expect(signature.is_valid());

    // Recover address from signature
    const recovered_address = try recover_message_address(message, signature);

    // Verify recovered address matches expected
    const public_key = try get_public_key(private_key);
    const expected_address = public_key.to_address();
    try testing.expect(std.mem.eql(u8, &recovered_address, &expected_address));

    // Verify signature verification
    try testing.expect(try verify_message(message, signature, expected_address));
}

test "signature roundtrip" {
    const private_key = try random_private_key();
    const message = "Roundtrip test message";

    // Sign message
    const signature = try sign_message(message, private_key);

    // Verify signature components
    try testing.expect(signature.r > 0);
    try testing.expect(signature.s > 0);
    try testing.expect(signature.v == 27 or signature.v == 28);

    // Verify signature serialization
    const signature_bytes = signature.to_bytes();
    const signature_restored = Signature.from_bytes(signature_bytes);
    try testing.expect(signature_restored.r == signature.r);
    try testing.expect(signature_restored.s == signature.s);
    try testing.expect(signature_restored.v == signature.v);

    // Verify message verification
    const expected_address = (try get_public_key(private_key)).to_address();
    try testing.expect(try verify_message(message, signature, expected_address));
}

test "invalid signature rejection" {
    const private_key = try random_private_key();
    const message = "Test message";
    const signature = try sign_message(message, private_key);
    const expected_address = (try get_public_key(private_key)).to_address();

    // Verify correct signature works
    try testing.expect(try verify_message(message, signature, expected_address));

    // Test with modified message
    const wrong_message = "Wrong message";
    try testing.expect(!try verify_message(wrong_message, signature, expected_address));

    // Test with wrong address
    const wrong_address = [_]u8{0xFF} ** 20;
    try testing.expect(!try verify_message(message, signature, wrong_address));

    // Test with invalid signature
    var invalid_signature = signature;
    invalid_signature.r = 0; // Invalid r
    try testing.expect(!invalid_signature.is_valid());
}
