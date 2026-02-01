//! PrivateKey - 32-byte secp256k1 private key primitive
//!
//! A private key is a 256-bit (32-byte) random value used for signing
//! transactions and deriving public keys/addresses in Ethereum.
//!
//! ## Security Considerations
//!
//! - Private keys must be kept secret at all times
//! - Memory should be cleared after use (use defer with std.crypto.utils.secureZero)
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
//! defer std.crypto.utils.secureZero(u8, pk);
//!
//! // Derive public key
//! const pubkey = try PrivateKey.toPublicKey(pk);
//!
//! // Derive address
//! const addr = try PrivateKey.toAddress(pk);
//! ```

const std = @import("std");
const secp256k1 = @import("root").crypto.secp256k1;
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

    var result = try allocator.alloc(u8, 32);
    errdefer allocator.free(result);

    var i: usize = 0;
    while (i < 32) : (i += 1) {
        const hex_byte = hex_input[i * 2 .. i * 2 + 2];
        result[i] = std.fmt.parseInt(u8, hex_byte, 16) catch {
            allocator.free(result);
            return PrivateKeyError.InvalidHexFormat;
        };
    }

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
    const bytes = [_]u8{0x12} ** 32;

    const pk = try fromBytes(allocator, &bytes);
    defer allocator.free(pk);

    try std.testing.expectEqual(@as(usize, 32), pk.len);
    try std.testing.expectEqual(@as(u8, 0x12), pk[0]);
}

test "PrivateKey.fromBytes - invalid length" {
    const allocator = std.testing.allocator;
    const bytes = [_]u8{0x12} ** 16; // Only 16 bytes

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
    const pk = [_]u8{ 0x12, 0x34 } ++ [_]u8{0} ** 30;

    const hex = try toHex(allocator, &pk);
    defer allocator.free(hex);

    try std.testing.expectEqualStrings("0x12340000000000000000000000000000000000000000000000000000000000000000", hex);
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

    // Convert to u256 for secp256k1 operations
    var pk_value: u256 = 0;
    for (private_key, 0..) |byte, i| {
        pk_value |= @as(u256, byte) << @intCast(8 * (31 - i));
    }

    // Generate public key point using secp256k1
    // This returns x,y coordinates on the curve
    const point = try secp256k1.generatePublicKey(pk_value);

    // Allocate 64 bytes for uncompressed public key (without 0x04 prefix)
    var pubkey = try allocator.alloc(u8, 64);

    // Convert x coordinate to bytes (big-endian)
    var i: usize = 0;
    while (i < 32) : (i += 1) {
        pubkey[i] = @intCast((point.x >> @intCast(8 * (31 - i))) & 0xFF);
    }

    // Convert y coordinate to bytes (big-endian)
    i = 0;
    while (i < 32) : (i += 1) {
        pubkey[32 + i] = @intCast((point.y >> @intCast(8 * (31 - i))) & 0xFF);
    }

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
    const crypto = @import("root").crypto;
    var hash: [32]u8 = undefined;
    crypto.Crypto.keccak256(&hash, pubkey);

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

    // Convert private key bytes to u256
    var pk_value: u256 = 0;
    for (private_key, 0..) |byte, i| {
        pk_value |= @as(u256, byte) << @intCast(8 * (31 - i));
    }

    // Convert message hash to u256
    var hash_value: u256 = 0;
    for (message_hash, 0..) |byte, i| {
        hash_value |= @as(u256, byte) << @intCast(8 * (31 - i));
    }

    // Sign using secp256k1
    const sig = try secp256k1.sign(pk_value, hash_value);

    // Allocate signature bytes (r + s + v = 32 + 32 + 1 = 65 bytes)
    var result = try allocator.alloc(u8, 65);

    // Encode r (32 bytes)
    var i: usize = 0;
    while (i < 32) : (i += 1) {
        result[i] = @intCast((sig.r >> @intCast(8 * (31 - i))) & 0xFF);
    }

    // Encode s (32 bytes)
    i = 0;
    while (i < 32) : (i += 1) {
        result[32 + i] = @intCast((sig.s >> @intCast(8 * (31 - i))) & 0xFF);
    }

    // Encode v (1 byte)
    result[64] = sig.v;

    return result;
}

test "PrivateKey.sign - valid signature" {
    const allocator = std.testing.allocator;

    const pk_hex = "0x4c0883a69102937d6231471b5dbb1018683788d1fc101a4e4b2e6ca7e1b37b1f";
    const pk = try fromHex(allocator, pk_hex);
    defer allocator.free(pk);

    const hash = [_]u8{0xAB} ** 32;

    const sig = try sign(allocator, pk, &hash);
    defer allocator.free(sig);

    try std.testing.expectEqual(@as(usize, 65), sig.len);
}
