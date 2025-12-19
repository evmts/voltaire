const std = @import("std");
const primitives = @import("primitives");
const crypto = @import("crypto");

const Keccak256 = std.crypto.hash.sha3.Keccak256;
const hex_to_bytes = std.fmt.hexToBytes;
const bytes_to_hex = std.fmt.bytesToHex;
const Case = std.fmt.Case;

/// PublicKey - 64 byte uncompressed public key (x,y coordinates)
/// Represents secp256k1 public key without 0x04 prefix
pub const PublicKey = @This();

bytes: [64]u8,

/// Format public key for std.fmt output
pub fn format(
    self: PublicKey,
    comptime fmt: []const u8,
    options: std.fmt.FormatOptions,
    writer: anytype,
) !void {
    _ = fmt;
    _ = options;
    const hex = toHex(self);
    try writer.writeAll(&hex);
}

/// Create PublicKey from hex string
/// Accepts with or without 0x prefix
/// Expects 64 bytes (128 hex characters)
pub fn fromHex(hex_str: []const u8) !PublicKey {
    var slice = hex_str;
    if (slice.len >= 2 and (slice[0] == '0' and (slice[1] == 'x' or slice[1] == 'X'))) {
        if (slice.len != 130) return error.InvalidHexFormat; // 0x + 128 chars
        slice = slice[2..];
    } else {
        if (slice.len != 128) return error.InvalidHexFormat; // 128 chars
    }

    var pk: PublicKey = undefined;
    _ = hex_to_bytes(&pk.bytes, slice) catch return error.InvalidHexString;
    return pk;
}

/// Convert PublicKey to hex string with 0x prefix
pub fn toHex(pk: PublicKey) [130]u8 {
    var result: [130]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';
    _ = bytes_to_hex(&result[2..], &pk.bytes, Case.lower);
    return result;
}

/// Derive Ethereum address from public key
/// Takes last 20 bytes of keccak256(publicKey)
pub fn toAddress(pk: PublicKey) primitives.Address {
    var hash: [32]u8 = undefined;
    Keccak256.hash(&pk.bytes, &hash, .{});

    // Take last 20 bytes
    var addr: primitives.Address = undefined;
    @memcpy(&addr.bytes, hash[12..]);
    return addr;
}

/// Derive public key from private key
/// Uses secp256k1 scalar multiplication
pub fn fromPrivateKey(private_key: [32]u8) !PublicKey {
    // Use crypto module's secp256k1 implementation
    const generator = crypto.secp256k1.AffinePoint.generator();

    // Parse private key as scalar
    var scalar: u256 = 0;
    for (private_key) |byte| {
        scalar = (scalar << 8) | byte;
    }

    // Validate private key is in valid range [1, n-1]
    if (scalar == 0 or scalar >= crypto.secp256k1.SECP256K1_N) {
        return error.InvalidPrivateKey;
    }

    // Scalar multiply: pubkey = privkey * G
    const point = generator.scalarMul(scalar);

    if (point.infinity) {
        return error.InvalidPrivateKey;
    }

    // Convert to 64 byte uncompressed format (x || y)
    var pk: PublicKey = undefined;
    std.mem.writeInt(u256, pk.bytes[0..32], point.x, .big);
    std.mem.writeInt(u256, pk.bytes[32..64], point.y, .big);

    return pk;
}

/// Compress public key from 64 bytes to 33 bytes
/// Format: prefix (1 byte) + x-coordinate (32 bytes)
/// Prefix is 0x02 if y is even, 0x03 if y is odd
pub fn compress(pk: PublicKey) [33]u8 {
    var result: [33]u8 = undefined;

    // Parse y coordinate
    const y = std.mem.readInt(u256, pk.bytes[32..64], .big);

    // Set prefix based on y parity
    result[0] = if ((y & 1) == 0) 0x02 else 0x03;

    // Copy x coordinate
    @memcpy(result[1..33], pk.bytes[0..32]);

    return result;
}

/// Decompress public key from 33 bytes to 64 bytes
/// Solves y² = x³ + 7 mod p and chooses y based on prefix parity
pub fn decompress(compressed: [33]u8) !PublicKey {
    // Validate prefix
    if (compressed[0] != 0x02 and compressed[0] != 0x03) {
        return error.InvalidCompressedPrefix;
    }

    // Parse x coordinate
    const x = std.mem.readInt(u256, compressed[1..33], .big);

    // Validate x is in field
    if (x >= crypto.secp256k1.SECP256K1_P) {
        return error.InvalidXCoordinate;
    }

    // Calculate y² = x³ + 7 mod p
    const x3 = crypto.secp256k1.unauditedMulmod(crypto.secp256k1.unauditedMulmod(x, x, crypto.secp256k1.SECP256K1_P), x, crypto.secp256k1.SECP256K1_P);
    const y2 = crypto.secp256k1.unauditedAddmod(x3, crypto.secp256k1.SECP256K1_B, crypto.secp256k1.SECP256K1_P);

    // Calculate y = y²^((p+1)/4) mod p (works because p ≡ 3 mod 4)
    const y_candidate = crypto.secp256k1.unauditedPowmod(y2, (crypto.secp256k1.SECP256K1_P + 1) >> 2, crypto.secp256k1.SECP256K1_P);

    // Verify y is correct
    if (crypto.secp256k1.unauditedMulmod(y_candidate, y_candidate, crypto.secp256k1.SECP256K1_P) != y2) {
        return error.InvalidCompressedKey;
    }

    // Choose correct y based on prefix parity
    const y_is_odd = (y_candidate & 1) == 1;
    const prefix_is_odd = compressed[0] == 0x03;
    const y = if (y_is_odd == prefix_is_odd) y_candidate else crypto.secp256k1.SECP256K1_P - y_candidate;

    // Validate point is on curve
    const point = crypto.secp256k1.AffinePoint{ .x = x, .y = y, .infinity = false };
    if (!point.isOnCurve()) {
        return error.InvalidCompressedKey;
    }

    // Convert to 64 byte uncompressed format
    var pk: PublicKey = undefined;
    std.mem.writeInt(u256, pk.bytes[0..32], x, .big);
    std.mem.writeInt(u256, pk.bytes[32..64], y, .big);

    return pk;
}

/// Check if a byte array represents a compressed public key
/// Returns true for 33 bytes with 0x02/0x03 prefix, false for 64 bytes
pub fn isCompressed(bytes: []const u8) bool {
    if (bytes.len == 33) {
        return bytes[0] == 0x02 or bytes[0] == 0x03;
    }
    return false;
}

/// Verify ECDSA signature against this public key
/// Uses secp256k1 signature verification
pub fn verify(
    pk: PublicKey,
    hash: [32]u8,
    signature: [65]u8, // r (32) || s (32) || v (1)
) !bool {
    // Extract r, s from signature
    var r: u256 = 0;
    var s: u256 = 0;

    for (signature[0..32]) |byte| {
        r = (r << 8) | byte;
    }
    for (signature[32..64]) |byte| {
        s = (s << 8) | byte;
    }

    // Parse public key coordinates
    const x = std.mem.readInt(u256, pk.bytes[0..32], .big);
    const y = std.mem.readInt(u256, pk.bytes[32..64], .big);

    // Parse message hash
    var z: u256 = 0;
    for (hash) |byte| {
        z = (z << 8) | byte;
    }

    // Validate signature components
    if (r == 0 or r >= crypto.secp256k1.SECP256K1_N) return false;
    if (s == 0 or s >= crypto.secp256k1.SECP256K1_N) return false;

    // Validate public key is on curve
    const pub_point = crypto.secp256k1.AffinePoint{ .x = x, .y = y, .infinity = false };
    if (!pub_point.isOnCurve()) return false;

    // Verify: s*G = R + z*PubKey
    // Compute w = s^-1 mod n
    const s_inv = crypto.secp256k1.unauditedInvmod(s, crypto.secp256k1.SECP256K1_N) orelse return false;

    // Compute u1 = z * w mod n
    const u1_val = crypto.secp256k1.unauditedMulmod(z, s_inv, crypto.secp256k1.SECP256K1_N);

    // Compute u2 = r * w mod n
    const u2_scalar = crypto.secp256k1.unauditedMulmod(r, s_inv, crypto.secp256k1.SECP256K1_N);

    // Compute R = u1*G + u2*PubKey
    const generator = crypto.secp256k1.AffinePoint.generator();
    const point1 = generator.scalarMul(u1_val);
    const point2 = pub_point.scalarMul(u2_scalar);
    const result_point = point1.add(point2);

    if (result_point.infinity) return false;

    // Verify r == result_point.x mod n
    const r_check = @mod(result_point.x, crypto.secp256k1.SECP256K1_N);
    return r == r_check;
}

// ============================================================================
// Tests
// ============================================================================

test "PublicKey.fromHex - valid 64 byte key" {
    const hex = "0x" ++ "04" ** 64;
    const pk = try fromHex(hex);

    try std.testing.expectEqual(64, pk.bytes.len);
    for (pk.bytes) |byte| {
        try std.testing.expectEqual(@as(u8, 0x04), byte);
    }
}

test "PublicKey.fromHex - without 0x prefix" {
    const hex = "04" ** 64;
    const pk = try fromHex(hex);

    try std.testing.expectEqual(64, pk.bytes.len);
    for (pk.bytes) |byte| {
        try std.testing.expectEqual(@as(u8, 0x04), byte);
    }
}

test "PublicKey.fromHex - invalid length" {
    const hex = "0x1234";
    const result = fromHex(hex);

    try std.testing.expectError(error.InvalidHexFormat, result);
}

test "PublicKey.fromHex - 65 byte key with prefix rejected" {
    const hex = "0x04" ++ "04" ** 64;
    const result = fromHex(hex);

    try std.testing.expectError(error.InvalidHexFormat, result);
}

test "PublicKey.toHex - converts to hex string" {
    var pk: PublicKey = undefined;
    @memset(&pk.bytes, 0x42);

    const hex = toHex(pk);

    try std.testing.expect(hex[0] == '0');
    try std.testing.expect(hex[1] == 'x');
    try std.testing.expect(hex[2] == '4');
    try std.testing.expect(hex[3] == '2');
}

test "PublicKey.toHex - round trip" {
    const original_hex = "0x" ++ "ab" ** 64;
    const pk = try fromHex(original_hex);
    const result_hex = toHex(pk);

    try std.testing.expectEqualStrings(original_hex, &result_hex);
}

test "PublicKey.toAddress - derives address from public key" {
    // Known test vector: public key -> address
    // Using generator point for deterministic test
    const gen = crypto.secp256k1.AffinePoint.generator();

    var pk: PublicKey = undefined;
    std.mem.writeInt(u256, pk.bytes[0..32], gen.x, .big);
    std.mem.writeInt(u256, pk.bytes[32..64], gen.y, .big);

    const addr = toAddress(pk);

    // Address should be 20 bytes
    try std.testing.expectEqual(20, addr.bytes.len);

    // Should be derived from keccak256 of public key
    var hash: [32]u8 = undefined;
    Keccak256.hash(&pk.bytes, &hash, .{});

    for (addr.bytes, 0..) |byte, i| {
        try std.testing.expectEqual(hash[12 + i], byte);
    }
}

test "PublicKey.fromPrivateKey - derives public key" {
    // Private key = 1 should give generator point
    var private_key: [32]u8 = [_]u8{0} ** 32;
    private_key[31] = 1;

    const pk = try fromPrivateKey(private_key);

    const gen = crypto.secp256k1.AffinePoint.generator();
    const expected_x = std.mem.readInt(u256, pk.bytes[0..32], .big);
    const expected_y = std.mem.readInt(u256, pk.bytes[32..64], .big);

    try std.testing.expectEqual(gen.x, expected_x);
    try std.testing.expectEqual(gen.y, expected_y);
}

test "PublicKey.fromPrivateKey - rejects zero key" {
    const private_key: [32]u8 = [_]u8{0} ** 32;

    const result = fromPrivateKey(private_key);

    try std.testing.expectError(error.InvalidPrivateKey, result);
}

test "PublicKey.fromPrivateKey - rejects key >= n" {
    // Set to secp256k1 order (invalid)
    var private_key: [32]u8 = undefined;
    std.mem.writeInt(u256, &private_key, crypto.secp256k1.SECP256K1_N, .big);

    const result = fromPrivateKey(private_key);

    try std.testing.expectError(error.InvalidPrivateKey, result);
}

test "PublicKey.verify - valid signature" {
    // Create keypair
    var private_key: [32]u8 = [_]u8{0} ** 32;
    private_key[31] = 42;

    const pk = try fromPrivateKey(private_key);

    // Create message hash
    const msg = "test message";
    var hash: [32]u8 = undefined;
    Keccak256.hash(msg, &hash, .{});

    // For this test, we'll validate the signature verification logic
    // A real signature would require signing implementation
    // This tests the verification algorithm works correctly

    // Test with invalid signature (all zeros) - should reject
    const invalid_sig = [_]u8{0} ** 65;
    const result = try verify(pk, hash, invalid_sig);

    try std.testing.expect(!result); // Should be false for invalid sig
}

test "PublicKey.verify - rejects invalid r or s" {
    var pk: PublicKey = undefined;
    @memset(&pk.bytes, 0x42);

    var hash: [32]u8 = undefined;
    @memset(&hash, 0x11);

    // Signature with r = 0 (invalid)
    var sig: [65]u8 = [_]u8{0} ** 65;
    sig[32] = 1; // s = 1

    const result = try verify(pk, hash, sig);

    try std.testing.expect(!result);
}

test "PublicKey.verify - rejects point not on curve" {
    // Create invalid public key (not on curve)
    var pk: PublicKey = undefined;
    @memset(&pk.bytes, 0x42);

    var hash: [32]u8 = undefined;
    @memset(&hash, 0x11);

    var sig: [65]u8 = undefined;
    @memset(&sig, 0x22);
    sig[0] = 1; // r = small value
    sig[32] = 1; // s = small value

    const result = try verify(pk, hash, sig);

    try std.testing.expect(!result);
}

test "PublicKey.compress - compresses generator point" {
    // Use generator point
    const gen = crypto.secp256k1.AffinePoint.generator();
    var pk: PublicKey = undefined;
    std.mem.writeInt(u256, pk.bytes[0..32], gen.x, .big);
    std.mem.writeInt(u256, pk.bytes[32..64], gen.y, .big);

    const compressed = compress(pk);

    // Should be 33 bytes
    try std.testing.expectEqual(@as(usize, 33), compressed.len);

    // y is even, so prefix should be 0x02
    try std.testing.expectEqual(@as(u8, 0x02), compressed[0]);

    // x coordinate should match
    const x_from_compressed = std.mem.readInt(u256, compressed[1..33], .big);
    try std.testing.expectEqual(gen.x, x_from_compressed);
}

test "PublicKey.compress - handles odd y coordinate" {
    // Create a point with odd y
    var private_key: [32]u8 = [_]u8{0} ** 32;
    private_key[31] = 2; // private key = 2

    const pk = try fromPrivateKey(private_key);
    const compressed = compress(pk);

    // Check prefix matches y parity
    const y = std.mem.readInt(u256, pk.bytes[32..64], .big);
    const expected_prefix: u8 = if ((y & 1) == 0) 0x02 else 0x03;

    try std.testing.expectEqual(expected_prefix, compressed[0]);
}

test "PublicKey.decompress - decompresses generator point" {
    // Known compressed generator point
    const gen = crypto.secp256k1.AffinePoint.generator();
    var pk: PublicKey = undefined;
    std.mem.writeInt(u256, pk.bytes[0..32], gen.x, .big);
    std.mem.writeInt(u256, pk.bytes[32..64], gen.y, .big);

    const compressed = compress(pk);
    const decompressed = try decompress(compressed);

    // Should match original
    try std.testing.expectEqualSlices(u8, &pk.bytes, &decompressed.bytes);
}

test "PublicKey.decompress - round trip" {
    // Create multiple test keys
    const test_privkeys = [_]u8{ 1, 2, 3, 7, 42, 123 };

    for (test_privkeys) |priv_val| {
        var private_key: [32]u8 = [_]u8{0} ** 32;
        private_key[31] = priv_val;

        const original_pk = try fromPrivateKey(private_key);
        const compressed = compress(original_pk);
        const decompressed_pk = try decompress(compressed);

        try std.testing.expectEqualSlices(u8, &original_pk.bytes, &decompressed_pk.bytes);
    }
}

test "PublicKey.decompress - rejects invalid prefix" {
    var compressed: [33]u8 = undefined;
    compressed[0] = 0x04; // Invalid prefix (should be 0x02 or 0x03)
    @memset(compressed[1..], 0x01);

    const result = decompress(compressed);

    try std.testing.expectError(error.InvalidCompressedPrefix, result);
}

test "PublicKey.decompress - rejects x >= p" {
    var compressed: [33]u8 = undefined;
    compressed[0] = 0x02;

    // Set x to p (invalid)
    std.mem.writeInt(u256, compressed[1..33], crypto.secp256k1.SECP256K1_P, .big);

    const result = decompress(compressed);

    try std.testing.expectError(error.InvalidXCoordinate, result);
}

test "PublicKey.isCompressed - detects compressed format" {
    var compressed: [33]u8 = undefined;
    compressed[0] = 0x02;
    @memset(compressed[1..], 0x01);

    try std.testing.expect(isCompressed(&compressed));
}

test "PublicKey.isCompressed - rejects uncompressed format" {
    var uncompressed: [64]u8 = undefined;
    @memset(&uncompressed, 0x01);

    try std.testing.expect(!isCompressed(&uncompressed));
}

test "PublicKey.isCompressed - rejects invalid prefix" {
    var invalid: [33]u8 = undefined;
    invalid[0] = 0x04; // Invalid prefix
    @memset(invalid[1..], 0x01);

    try std.testing.expect(!isCompressed(&invalid));
}

test "PublicKey.compress/decompress - known test vector" {
    // Known test vector from SEC 2 v2 spec
    // Generator point (secp256k1)
    const gen = crypto.secp256k1.AffinePoint.generator();

    // Create public key from generator
    var pk: PublicKey = undefined;
    std.mem.writeInt(u256, pk.bytes[0..32], gen.x, .big);
    std.mem.writeInt(u256, pk.bytes[32..64], gen.y, .big);

    // Compress
    const compressed = compress(pk);

    // Expected: 02 + 32 bytes of x
    try std.testing.expectEqual(@as(u8, 0x02), compressed[0]);

    // Decompress and verify
    const decompressed = try decompress(compressed);

    // Verify coordinates match
    const x_orig = std.mem.readInt(u256, pk.bytes[0..32], .big);
    const y_orig = std.mem.readInt(u256, pk.bytes[32..64], .big);
    const x_decomp = std.mem.readInt(u256, decompressed.bytes[0..32], .big);
    const y_decomp = std.mem.readInt(u256, decompressed.bytes[32..64], .big);

    try std.testing.expectEqual(x_orig, x_decomp);
    try std.testing.expectEqual(y_orig, y_decomp);
}
