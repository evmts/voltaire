const std = @import("std");
const crypto = std.crypto;

/// Ed25519 digital signature algorithm
/// Re-exports Zig's standard library Ed25519 implementation
pub const Ed25519 = crypto.sign.Ed25519;

/// Ed25519 key sizes
pub const PRIVATE_KEY_SIZE = Ed25519.SecretKey.encoded_length;
pub const PUBLIC_KEY_SIZE = Ed25519.PublicKey.encoded_length;
pub const SIGNATURE_SIZE = Ed25519.Signature.encoded_length;
pub const SEED_SIZE = Ed25519.seed_length;

/// Generate keypair from seed
pub fn keypairFromSeed(seed: []const u8) !Ed25519.KeyPair {
    if (seed.len != SEED_SIZE) return error.InvalidSeedLength;
    return try Ed25519.KeyPair.create(seed[0..SEED_SIZE].*);
}

/// Sign a message
pub fn sign(
    allocator: std.mem.Allocator,
    message: []const u8,
    secret_key: []const u8,
) ![]u8 {
    if (secret_key.len != PRIVATE_KEY_SIZE) return error.InvalidSecretKeyLength;

    const key_pair = try Ed25519.KeyPair.fromSecretKey(.{ .bytes = secret_key[0..PRIVATE_KEY_SIZE].*, .key_length = .b256 });
    const sig = try key_pair.sign(message, null);

    const result = try allocator.alloc(u8, SIGNATURE_SIZE);
    @memcpy(result, &sig.toBytes());

    return result;
}

/// Verify a signature
pub fn verify(
    signature: []const u8,
    message: []const u8,
    public_key: []const u8,
) !bool {
    if (signature.len != SIGNATURE_SIZE) return error.InvalidSignatureLength;
    if (public_key.len != PUBLIC_KEY_SIZE) return error.InvalidPublicKeyLength;

    const sig = Ed25519.Signature.fromBytes(signature[0..SIGNATURE_SIZE].*);
    const pub_key = try Ed25519.PublicKey.fromBytes(public_key[0..PUBLIC_KEY_SIZE].*);

    sig.verify(message, pub_key) catch return false;
    return true;
}

/// Get public key from secret key
pub fn publicKeyFromSecret(
    allocator: std.mem.Allocator,
    secret_key: []const u8,
) ![]u8 {
    if (secret_key.len != PRIVATE_KEY_SIZE) return error.InvalidSecretKeyLength;

    const key_pair = try Ed25519.KeyPair.fromSecretKey(.{ .bytes = secret_key[0..PRIVATE_KEY_SIZE].*, .key_length = .b256 });

    const result = try allocator.alloc(u8, PUBLIC_KEY_SIZE);
    @memcpy(result, &key_pair.public_key.bytes);

    return result;
}

test "ed25519 basic" {
    const allocator = std.testing.allocator;

    // Test key generation
    const seed = [_]u8{1} ** SEED_SIZE;
    const key_pair = try keypairFromSeed(&seed);

    // Test signing
    const message = "test message";
    const signature = try sign(allocator, message, &key_pair.secret_key.bytes);
    defer allocator.free(signature);

    try std.testing.expect(signature.len == SIGNATURE_SIZE);

    // Test verification
    const valid = try verify(signature, message, &key_pair.public_key.bytes);
    try std.testing.expect(valid);

    // Test with wrong message
    const invalid = try verify(signature, "wrong message", &key_pair.public_key.bytes);
    try std.testing.expect(!invalid);
}

test "ed25519 public key derivation" {
    const allocator = std.testing.allocator;

    const seed = [_]u8{2} ** SEED_SIZE;
    const key_pair = try keypairFromSeed(&seed);

    const pub_key = try publicKeyFromSecret(allocator, &key_pair.secret_key.bytes);
    defer allocator.free(pub_key);

    try std.testing.expectEqualSlices(u8, pub_key, &key_pair.public_key.bytes);
}
