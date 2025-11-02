const std = @import("std");
const crypto = std.crypto;

/// P256 (secp256r1/prime256v1) elliptic curve operations
/// Re-exports Zig's standard library P256 implementation
pub const P256 = crypto.ecc.P256;

/// P256 curve parameters
pub const P256_P: u256 = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff;
pub const P256_N: u256 = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551;
pub const P256_B: u256 = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b;
pub const P256_GX: u256 = 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296;
pub const P256_GY: u256 = 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5;

/// Sign a message hash with a private key
/// Returns signature as r || s (64 bytes)
pub fn sign(
    allocator: std.mem.Allocator,
    hash: []const u8,
    private_key: []const u8,
) ![]u8 {
    if (hash.len != 32) return error.InvalidHashLength;
    if (private_key.len != 32) return error.InvalidPrivateKeyLength;

    const key_pair = try P256.KeyPair.fromSecretKey(.{
        .bytes = private_key[0..32].*,
        .endian = .big,
    });

    const sig = try key_pair.sign(hash, null);

    const result = try allocator.alloc(u8, 64);
    @memcpy(result[0..32], &sig.r.toBytes(.big));
    @memcpy(result[32..64], &sig.s.toBytes(.big));

    return result;
}

/// Verify an ECDSA signature
pub fn verify(
    hash: []const u8,
    r: []const u8,
    s: []const u8,
    public_key: []const u8,
) !bool {
    if (hash.len != 32) return error.InvalidHashLength;
    if (r.len != 32) return error.InvalidRLength;
    if (s.len != 32) return error.InvalidSLength;
    if (public_key.len != 64) return error.InvalidPublicKeyLength;

    const sig = P256.Signature{
        .r = P256.Fe.fromBytes(r[0..32].*, .big),
        .s = P256.Fe.fromBytes(s[0..32].*, .big),
    };

    var uncompressed = [_]u8{0x04} ++ public_key[0..64].*;
    const pub_key = try P256.fromSerializedPublicKey(&uncompressed);

    sig.verify(hash, pub_key) catch return false;
    return true;
}

/// Generate a public key from a private key
/// Returns uncompressed public key (64 bytes: x || y)
pub fn publicKeyFromPrivate(
    allocator: std.mem.Allocator,
    private_key: []const u8,
) ![]u8 {
    if (private_key.len != 32) return error.InvalidPrivateKeyLength;

    const key_pair = try P256.KeyPair.fromSecretKey(.{
        .bytes = private_key[0..32].*,
        .endian = .big,
    });

    const pub_key = key_pair.public_key.toUncompressedSec1();

    const result = try allocator.alloc(u8, 64);
    @memcpy(result, pub_key[1..65]); // Skip 0x04 prefix

    return result;
}

/// Perform ECDH key exchange
/// Returns shared secret (32 bytes)
pub fn ecdh(
    allocator: std.mem.Allocator,
    private_key: []const u8,
    public_key: []const u8,
) ![]u8 {
    if (private_key.len != 32) return error.InvalidPrivateKeyLength;
    if (public_key.len != 64) return error.InvalidPublicKeyLength;

    const secret = P256.Scalar.fromBytes(private_key[0..32].*, .big);

    var uncompressed = [_]u8{0x04} ++ public_key[0..64].*;
    const pub_key = try P256.fromSerializedPublicKey(&uncompressed);

    const shared = try pub_key.mul(secret.toBytes(.big), .big);
    const shared_bytes = shared.toUncompressedSec1();

    const result = try allocator.alloc(u8, 32);
    @memcpy(result, shared_bytes[1..33]); // x-coordinate only

    return result;
}

test "p256 basic" {
    const allocator = std.testing.allocator;

    // Test key generation
    const private_key = [_]u8{1} ** 32;
    const public_key = try publicKeyFromPrivate(allocator, &private_key);
    defer allocator.free(public_key);

    try std.testing.expect(public_key.len == 64);

    // Test signing and verification
    const hash = [_]u8{0xaa} ** 32;
    const signature = try sign(allocator, &hash, &private_key);
    defer allocator.free(signature);

    try std.testing.expect(signature.len == 64);

    const valid = try verify(&hash, signature[0..32], signature[32..64], public_key);
    try std.testing.expect(valid);

    // Test with wrong hash
    const wrong_hash = [_]u8{0xbb} ** 32;
    const invalid = try verify(&wrong_hash, signature[0..32], signature[32..64], public_key);
    try std.testing.expect(!invalid);
}

test "p256 ecdh" {
    const allocator = std.testing.allocator;

    const priv1 = [_]u8{1} ** 32;
    const priv2 = [_]u8{2} ** 32;

    const pub1 = try publicKeyFromPrivate(allocator, &priv1);
    defer allocator.free(pub1);
    const pub2 = try publicKeyFromPrivate(allocator, &priv2);
    defer allocator.free(pub2);

    const shared1 = try ecdh(allocator, &priv1, pub2);
    defer allocator.free(shared1);
    const shared2 = try ecdh(allocator, &priv2, pub1);
    defer allocator.free(shared2);

    try std.testing.expectEqualSlices(u8, shared1, shared2);
}
