//! PrivateKey - 32-byte secp256k1 private key primitive
//!
//! A private key is a 256-bit (32-byte) random value used for signing
//! transactions and deriving public keys/addresses in Ethereum.
//!
//! ## Security Considerations
//!
//! - Private keys must be kept secret at all times
//! - Memory should be cleared after use (use defer with std.crypto.secureZero)
//! - Validate keys are in valid secp256k1 range (1 to n-1)
//! - Never log or expose private keys
//!
//! ## Usage
//!
//! ```zig
//! const primitives = @import("primitives");
//! const PrivateKey = primitives.PrivateKey;
//!
//! // Create from hex string
//! const pk = try PrivateKey.fromHex(allocator, "0x1234...");
//! defer allocator.free(pk);
//! defer std.crypto.secureZero(u8, pk);
//!
//! // Derive public key
//! const pubkey = try PrivateKey.toPublicKey(pk);
//!
//! // Derive address
//! const addr = try PrivateKey.toAddress(pk);
//! ```

const std = @import("std");
const Crypto = @import("crypto").Crypto;
const Address = @import("../Address/address.zig");
const Hex = @import("../Hex/Hex.zig");

/// Private key is a 32-byte value
pub const PrivateKey = [32]u8;

/// Error types for private key operations
pub const PrivateKeyError = error{
    InvalidLength,
    InvalidHexFormat,
    InvalidPrivateKey,
    OutOfRange,
};

/// Create PrivateKey from hex string
///
/// Allocates and returns a new 32-byte private key.
/// Caller owns memory and should securely zero after use.
///
/// @param allocator - Memory allocator
/// @param hex_str - Hex string (with or without 0x prefix, must be 64 hex chars)
/// @returns 32-byte private key
/// @throws InvalidHexFormat if hex string is malformed
/// @throws InvalidLength if not exactly 32 bytes
pub fn fromHex(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const hex_input = if (std.mem.startsWith(u8, hex_str, "0x"))
        hex_str[2..]
    else
        hex_str;

    if (hex_input.len != 64) {
        return PrivateKeyError.InvalidLength;
    }

    const result = try allocator.alloc(u8, 32);
    errdefer allocator.free(result);

    _ = std.fmt.hexToBytes(result, hex_input) catch return PrivateKeyError.InvalidHexFormat;

    return result;
}

test "PrivateKey.fromHex - valid key" {
    const allocator = std.testing.allocator;
    const hex = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    const pk = try fromHex(allocator, hex);
    defer allocator.free(pk);

    try std.testing.expectEqual(@as(usize, 32), pk.len);
    try std.testing.expectEqual(@as(u8, 0x12), pk[0]);
    try std.testing.expectEqual(@as(u8, 0xef), pk[31]);
}

test "PrivateKey.fromHex - without 0x prefix" {
    const allocator = std.testing.allocator;
    const hex = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    const pk = try fromHex(allocator, hex);
    defer allocator.free(pk);

    try std.testing.expectEqual(@as(usize, 32), pk.len);
    try std.testing.expectEqual(@as(u8, 0x12), pk[0]);
}

test "PrivateKey.fromHex - invalid length" {
    const allocator = std.testing.allocator;
    const hex = "0x1234";

    const result = fromHex(allocator, hex);
    try std.testing.expectError(PrivateKeyError.InvalidLength, result);
}

test "PrivateKey.fromHex - invalid hex chars" {
    const allocator = std.testing.allocator;
    const hex = "0xGGGG567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    const result = fromHex(allocator, hex);
    try std.testing.expectError(PrivateKeyError.InvalidHexFormat, result);
}

/// Create PrivateKey from raw bytes
///
/// Copies the input bytes into allocated memory.
/// Caller owns memory and should securely zero after use.
///
/// @param allocator - Memory allocator
/// @param bytes - Raw bytes (must be exactly 32 bytes)
/// @returns 32-byte private key
/// @throws InvalidLength if not exactly 32 bytes
pub fn fromBytes(allocator: std.mem.Allocator, bytes: []const u8) ![]u8 {
    if (bytes.len != 32) {
        return PrivateKeyError.InvalidLength;
    }

    const result = try allocator.alloc(u8, 32);
    @memcpy(result, bytes);
    return result;
}

test "PrivateKey.fromBytes - valid bytes" {
    const allocator = std.testing.allocator;
    const bytes = @as([32]u8, @splat(0x12));

    const pk = try fromBytes(allocator, &bytes);
    defer allocator.free(pk);

    try std.testing.expectEqual(@as(usize, 32), pk.len);
    try std.testing.expectEqual(@as(u8, 0x12), pk[0]);
}

test "PrivateKey.fromBytes - invalid length" {
    const allocator = std.testing.allocator;
    const bytes = @as([16]u8, @splat(0x12)); // Only 16 bytes

    const result = fromBytes(allocator, &bytes);
    try std.testing.expectError(PrivateKeyError.InvalidLength, result);
}

/// Convert PrivateKey to hex string
///
/// Allocates and returns hex string with 0x prefix.
/// Caller owns memory.
///
/// @param allocator - Memory allocator
/// @param private_key - 32-byte private key
/// @returns Hex string (0x + 64 hex chars)
/// @throws InvalidLength if not exactly 32 bytes
pub fn toHex(allocator: std.mem.Allocator, private_key: []const u8) ![]u8 {
    if (private_key.len != 32) {
        return PrivateKeyError.InvalidLength;
    }

    var result = try allocator.alloc(u8, 66); // "0x" + 64 hex chars
    result[0] = '0';
    result[1] = 'x';

    const hex_chars = "0123456789abcdef";
    var i: usize = 0;
    while (i < 32) : (i += 1) {
        const byte = private_key[i];
        result[2 + i * 2] = hex_chars[byte >> 4];
        result[2 + i * 2 + 1] = hex_chars[byte & 0x0F];
    }

    return result;
}

test "PrivateKey.toHex - valid conversion" {
    const allocator = std.testing.allocator;
    const pk = [_]u8{ 0x12, 0x34 } ++ @as([30]u8, @splat(0));

    const hex = try toHex(allocator, &pk);
    defer allocator.free(hex);

    try std.testing.expectEqualStrings("0x1234" ++ @as(*const [(30) * 2]u8, @ptrCast(&@as([30][2]u8, @splat("00".*)))), hex);
}

test "PrivateKey.toHex - roundtrip" {
    const allocator = std.testing.allocator;
    const original_hex = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    const pk = try fromHex(allocator, original_hex);
    defer allocator.free(pk);

    const result_hex = try toHex(allocator, pk);
    defer allocator.free(result_hex);

    try std.testing.expectEqualStrings(original_hex, result_hex);
}

/// Derive public key from private key
///
/// Uses secp256k1 curve to compute the uncompressed public key (64 bytes).
/// Returns public key without the 0x04 prefix.
/// Caller owns memory.
///
/// @param allocator - Memory allocator
/// @param private_key - 32-byte private key
/// @returns 64-byte uncompressed public key
/// @throws InvalidLength if private key is not 32 bytes
pub fn toPublicKey(allocator: std.mem.Allocator, private_key: []const u8) ![]u8 {
    if (private_key.len != 32) {
        return PrivateKeyError.InvalidLength;
    }

    // Derive public key point (validates key is in [1, n-1])
    const point = try Crypto.unaudited_getPublicKey(private_key[0..32].*);

    // 64-byte uncompressed public key (x || y, big-endian, without 0x04 prefix)
    const pubkey = try allocator.alloc(u8, 64);
    std.mem.writeInt(u256, pubkey[0..32], point.x, .big);
    std.mem.writeInt(u256, pubkey[32..64], point.y, .big);

    return pubkey;
}

test "PrivateKey.toPublicKey - valid derivation" {
    const allocator = std.testing.allocator;

    // Use a known test vector
    const pk_hex = "0x4c0883a69102937d6231471b5dbb1018683788d1fc101a4e4b2e6ca7e1b37b1f";
    const pk = try fromHex(allocator, pk_hex);
    defer allocator.free(pk);

    const pubkey = try toPublicKey(allocator, pk);
    defer allocator.free(pubkey);

    try std.testing.expectEqual(@as(usize, 64), pubkey.len);
}

/// Derive Ethereum address from private key
///
/// Derives public key, then takes keccak256 hash and extracts last 20 bytes.
/// Caller owns memory.
///
/// @param allocator - Memory allocator
/// @param private_key - 32-byte private key
/// @returns 20-byte Ethereum address
/// @throws InvalidLength if private key is not 32 bytes
pub fn toAddress(allocator: std.mem.Allocator, private_key: []const u8) ![]u8 {
    if (private_key.len != 32) {
        return PrivateKeyError.InvalidLength;
    }

    // Derive public key
    const pubkey = try toPublicKey(allocator, private_key);
    defer allocator.free(pubkey);

    // Hash the public key with keccak256
    var hash: [32]u8 = undefined;
    std.crypto.hash.sha3.Keccak256.hash(pubkey, &hash, .{});

    // Take last 20 bytes as address
    const addr = try allocator.alloc(u8, 20);
    @memcpy(addr, hash[12..]);

    return addr;
}

test "PrivateKey.toAddress - valid derivation" {
    const allocator = std.testing.allocator;

    // Use a known test vector
    const pk_hex = "0x4c0883a69102937d6231471b5dbb1018683788d1fc101a4e4b2e6ca7e1b37b1f";
    const pk = try fromHex(allocator, pk_hex);
    defer allocator.free(pk);

    const addr = try toAddress(allocator, pk);
    defer allocator.free(addr);

    try std.testing.expectEqual(@as(usize, 20), addr.len);
}

/// Sign a message hash with private key
///
/// Creates ECDSA signature using secp256k1.
/// Caller owns memory.
///
/// @param allocator - Memory allocator
/// @param private_key - 32-byte private key
/// @param message_hash - 32-byte hash to sign
/// @returns Signature bytes
/// @throws InvalidLength if inputs are not 32 bytes
pub fn sign(allocator: std.mem.Allocator, private_key: []const u8, message_hash: []const u8) ![]u8 {
    if (private_key.len != 32) {
        return PrivateKeyError.InvalidLength;
    }
    if (message_hash.len != 32) {
        return PrivateKeyError.InvalidLength;
    }

    // Sign using secp256k1 ECDSA (RFC 6979 deterministic nonce)
    const sig = try Crypto.unaudited_signHash(message_hash[0..32].*, private_key[0..32].*);

    // Signature bytes: r (32) || s (32) || v (1)
    const result = try allocator.alloc(u8, 65);
    result[0..65].* = sig.toBytes();

    return result;
}

test "PrivateKey.sign - valid signature" {
    const allocator = std.testing.allocator;

    const pk_hex = "0x4c0883a69102937d6231471b5dbb1018683788d1fc101a4e4b2e6ca7e1b37b1f";
    const pk = try fromHex(allocator, pk_hex);
    defer allocator.free(pk);

    const hash = @as([32]u8, @splat(0xAB));

    const sig = try sign(allocator, pk, &hash);
    defer allocator.free(sig);

    try std.testing.expectEqual(@as(usize, 65), sig.len);
}
