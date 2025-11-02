const std = @import("std");
const crypto = std.crypto;

/// X25519 Elliptic Curve Diffie-Hellman key exchange
/// Re-exports Zig's standard library X25519 implementation
pub const X25519 = crypto.dh.X25519;

/// X25519 key sizes
pub const SECRET_KEY_SIZE = X25519.secret_length;
pub const PUBLIC_KEY_SIZE = X25519.public_length;
pub const SHARED_SECRET_SIZE = X25519.shared_length;

/// Generate public key from secret key
pub fn publicKeyFromSecret(
    allocator: std.mem.Allocator,
    secret_key: []const u8,
) ![]u8 {
    if (secret_key.len != SECRET_KEY_SIZE) return error.InvalidSecretKeyLength;

    const public_key = try X25519.recoverPublicKey(secret_key[0..SECRET_KEY_SIZE].*);

    const result = try allocator.alloc(u8, PUBLIC_KEY_SIZE);
    @memcpy(result, &public_key);

    return result;
}

/// Perform X25519 key exchange
pub fn scalarmult(
    allocator: std.mem.Allocator,
    secret_key: []const u8,
    public_key: []const u8,
) ![]u8 {
    if (secret_key.len != SECRET_KEY_SIZE) return error.InvalidSecretKeyLength;
    if (public_key.len != PUBLIC_KEY_SIZE) return error.InvalidPublicKeyLength;

    const shared_secret = try X25519.scalarmult(
        secret_key[0..SECRET_KEY_SIZE].*,
        public_key[0..PUBLIC_KEY_SIZE].*,
    );

    const result = try allocator.alloc(u8, SHARED_SECRET_SIZE);
    @memcpy(result, &shared_secret);

    return result;
}

/// Generate keypair from seed (secret key)
pub fn keypairFromSeed(seed: []const u8) !struct { secret_key: [SECRET_KEY_SIZE]u8, public_key: [PUBLIC_KEY_SIZE]u8 } {
    if (seed.len != SECRET_KEY_SIZE) return error.InvalidSeedLength;

    const secret_key = seed[0..SECRET_KEY_SIZE].*;
    const public_key = try X25519.recoverPublicKey(secret_key);

    return .{
        .secret_key = secret_key,
        .public_key = public_key,
    };
}

test "x25519 basic" {
    const allocator = std.testing.allocator;

    // Test key generation
    const secret = [_]u8{1} ** SECRET_KEY_SIZE;
    const public_key = try publicKeyFromSecret(allocator, &secret);
    defer allocator.free(public_key);

    try std.testing.expect(public_key.len == PUBLIC_KEY_SIZE);
}

test "x25519 key exchange" {
    const allocator = std.testing.allocator;

    // Generate two keypairs
    const secret1 = [_]u8{1} ** SECRET_KEY_SIZE;
    const secret2 = [_]u8{2} ** SECRET_KEY_SIZE;

    const public1 = try publicKeyFromSecret(allocator, &secret1);
    defer allocator.free(public1);
    const public2 = try publicKeyFromSecret(allocator, &secret2);
    defer allocator.free(public2);

    // Perform key exchange from both sides
    const shared1 = try scalarmult(allocator, &secret1, public2);
    defer allocator.free(shared1);
    const shared2 = try scalarmult(allocator, &secret2, public1);
    defer allocator.free(shared2);

    // Both should produce the same shared secret
    try std.testing.expectEqualSlices(u8, shared1, shared2);
}

test "x25519 keypair from seed" {
    const seed = [_]u8{3} ** SECRET_KEY_SIZE;
    const keypair = try keypairFromSeed(&seed);

    try std.testing.expectEqualSlices(u8, &keypair.secret_key, &seed);
    try std.testing.expect(keypair.public_key.len == PUBLIC_KEY_SIZE);
}
