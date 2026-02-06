//! Ed25519 Digital Signature Algorithm
//!
//! High-speed, high-security signatures using the Edwards-curve Digital Signature Algorithm.
//! Re-exports and wraps Zig's standard library Ed25519 implementation.
//!
//! ## Overview
//! Ed25519 is a modern signature scheme designed by Daniel J. Bernstein providing:
//! - 128-bit security level
//! - Fast signing and verification
//! - Small keys and signatures (32 bytes each)
//! - Deterministic signatures (no random nonce required)
//!
//! ## Key Sizes
//! - Private key: 32 bytes (seed) or 64 bytes (expanded)
//! - Public key: 32 bytes
//! - Signature: 64 bytes
//!
//! ## Features
//! - Deterministic signing (no nonce required)
//! - Fast batch verification
//! - Constant-time operations (timing attack resistant)
//! - Collision-resistant hash (SHA-512)
//! - Cofactor clearing for security
//!
//! ## Usage
//! ```zig
//! const ed25519 = @import("ed25519");
//!
//! // Generate keypair from seed
//! const seed: [32]u8 = random_bytes();
//! const keypair = try ed25519.keypairFromSeed(&seed);
//!
//! // Sign message
//! const message = "Hello, Ed25519!";
//! const sig = try ed25519.sign(allocator, message, &keypair.secret_key.bytes);
//! defer allocator.free(sig);
//!
//! // Verify signature
//! const valid = try ed25519.verify(sig, message, &keypair.public_key.bytes);
//! ```
//!
//! ## Security Notes
//! - Uses Zig's audited std.crypto implementation
//! - Deterministic signatures (RFC 8032)
//! - Constant-time operations
//! - Cofactor cleared for security
//!
//! ## Use Cases
//! - Not used in Ethereum mainnet (uses secp256k1)
//! - Commonly used in other blockchains (Solana, Polkadot)
//! - General-purpose digital signatures
//!
//! ## References
//! - [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) - Ed25519 specification
//! - [Ed25519 Paper](https://ed25519.cr.yp.to/ed25519-20110926.pdf) - Original paper

const std = @import("std");
const crypto = std.crypto;

/// Ed25519 digital signature algorithm
/// Re-exports Zig's standard library Ed25519 implementation
pub const Ed25519 = crypto.sign.Ed25519;

/// Ed25519 key sizes
pub const PRIVATE_KEY_SIZE = Ed25519.SecretKey.encoded_length;
pub const PUBLIC_KEY_SIZE = Ed25519.PublicKey.encoded_length;
pub const SIGNATURE_SIZE = Ed25519.Signature.encoded_length;
pub const SEED_SIZE = Ed25519.KeyPair.seed_length;

/// Generate keypair from seed
pub fn keypairFromSeed(seed: []const u8) !Ed25519.KeyPair {
    if (seed.len != SEED_SIZE) return error.InvalidSeedLength;
    return try Ed25519.KeyPair.generateDeterministic(seed[0..SEED_SIZE].*);
}

/// Sign a message
pub fn sign(
    allocator: std.mem.Allocator,
    message: []const u8,
    secret_key: []const u8,
) ![]u8 {
    if (secret_key.len != PRIVATE_KEY_SIZE) return error.InvalidSecretKeyLength;

    const sk = try Ed25519.SecretKey.fromBytes(secret_key[0..PRIVATE_KEY_SIZE].*);
    const key_pair = try Ed25519.KeyPair.fromSecretKey(sk);
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

    const sk = try Ed25519.SecretKey.fromBytes(secret_key[0..PRIVATE_KEY_SIZE].*);
    const key_pair = try Ed25519.KeyPair.fromSecretKey(sk);

    const result = try allocator.alloc(u8, PUBLIC_KEY_SIZE);
    @memcpy(result, &key_pair.public_key.toBytes());

    return result;
}

test "ed25519 basic" {
    const allocator = std.testing.allocator;

    // Test key generation
    const seed = [_]u8{1} ** SEED_SIZE;
    const key_pair = try keypairFromSeed(&seed);

    // Test signing
    const message = "test message";
    const signature = try sign(allocator, message, &key_pair.secret_key.toBytes());
    defer allocator.free(signature);

    try std.testing.expect(signature.len == SIGNATURE_SIZE);

    // Test verification
    const valid = try verify(signature, message, &key_pair.public_key.toBytes());
    try std.testing.expect(valid);

    // Test with wrong message
    const invalid = try verify(signature, "wrong message", &key_pair.public_key.toBytes());
    try std.testing.expect(!invalid);
}

test "ed25519 public key derivation" {
    const allocator = std.testing.allocator;

    const seed = [_]u8{2} ** SEED_SIZE;
    const key_pair = try keypairFromSeed(&seed);

    const pub_key = try publicKeyFromSecret(allocator, &key_pair.secret_key.toBytes());
    defer allocator.free(pub_key);

    try std.testing.expectEqualSlices(u8, pub_key, &key_pair.public_key.toBytes());
}
