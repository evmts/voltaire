//! BundleHash - 32-byte bundle identifier for Flashbots/MEV bundles
//!
//! Unique identifier for a transaction bundle. Computed as keccak256 of the
//! bundle contents (concatenated transaction hashes). Used to track bundle
//! status through MEV relays and block builders.
//!
//! ## Usage
//! ```zig
//! const BundleHash = @import("primitives").BundleHash;
//!
//! // From hex string
//! const hash = try BundleHash.fromHex("0x1234...");
//!
//! // From bytes
//! const hash2 = BundleHash.fromBytes(&bytes);
//!
//! // Convert to hex
//! const hex = try BundleHash.toHex(&hash, allocator);
//! ```
//!
//! @see https://docs.flashbots.net/flashbots-auction/overview

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");
const crypto = @import("crypto");

/// BundleHash size in bytes (32 bytes = 256 bits)
pub const SIZE = 32;

/// BundleHash type - 32 bytes
pub const BundleHash = [SIZE]u8;

/// Zero hash constant
pub const ZERO: BundleHash = [_]u8{0} ** SIZE;

// ============================================================================
// Constructors
// ============================================================================

/// Create BundleHash from bytes. Input must be exactly 32 bytes.
pub fn fromBytes(bytes: []const u8) BundleHash {
    std.debug.assert(bytes.len == SIZE);
    var result: BundleHash = undefined;
    @memcpy(&result, bytes);
    return result;
}

test "fromBytes - valid 32 bytes" {
    const bytes = [_]u8{0xab} ** SIZE;
    const hash = fromBytes(&bytes);
    try std.testing.expectEqual(SIZE, hash.len);
    try std.testing.expectEqual(@as(u8, 0xab), hash[0]);
    try std.testing.expectEqual(@as(u8, 0xab), hash[31]);
}

test "fromBytes - creates independent copy" {
    var bytes = [_]u8{42} ** SIZE;
    const hash = fromBytes(&bytes);
    bytes[0] = 99;
    try std.testing.expectEqual(@as(u8, 42), hash[0]);
}

/// Create BundleHash from hex string (with or without 0x prefix).
/// Returns error if hex is invalid or not 32 bytes.
pub fn fromHex(hex: []const u8) !BundleHash {
    const bytes = try Hex.toBytes(hex, std.testing.allocator);
    defer std.testing.allocator.free(bytes);

    if (bytes.len != SIZE) {
        return error.InvalidBundleHashLength;
    }

    return fromBytes(bytes);
}

test "fromHex - with 0x prefix" {
    const hex = "0x" ++ ("ab" ** SIZE);
    const hash = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0xab), hash[0]);
    try std.testing.expectEqual(@as(u8, 0xab), hash[31]);
}

test "fromHex - without 0x prefix" {
    const hex = "cd" ** SIZE;
    const hash = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0xcd), hash[0]);
}

test "fromHex - invalid length" {
    const hex = "0xaabb";
    try std.testing.expectError(error.InvalidBundleHashLength, fromHex(hex));
}

test "fromHex - invalid hex chars" {
    const hex = "0x" ++ ("zz" ** SIZE);
    try std.testing.expectError(error.InvalidHexCharacter, fromHex(hex));
}

/// Create BundleHash from transaction hashes (keccak256 of concatenation)
pub fn fromTransactionHashes(tx_hashes: []const [32]u8) BundleHash {
    // Concatenate all transaction hashes and hash the result
    var hasher = crypto.Keccak256.init(.{});

    for (tx_hashes) |tx_hash| {
        hasher.update(&tx_hash);
    }

    var result: BundleHash = undefined;
    hasher.final(&result);
    return result;
}

test "fromTransactionHashes - single tx" {
    const tx_hash = [_]u8{0xaa} ** 32;
    const hashes = [_][32]u8{tx_hash};
    const bundle_hash = fromTransactionHashes(&hashes);
    try std.testing.expectEqual(SIZE, bundle_hash.len);
    // Hash should not be zero
    try std.testing.expect(!isZero(&bundle_hash));
}

test "fromTransactionHashes - multiple txs" {
    const tx1 = [_]u8{0xaa} ** 32;
    const tx2 = [_]u8{0xbb} ** 32;
    const hashes = [_][32]u8{ tx1, tx2 };
    const bundle_hash = fromTransactionHashes(&hashes);
    try std.testing.expect(!isZero(&bundle_hash));
}

test "fromTransactionHashes - deterministic" {
    const tx1 = [_]u8{0xaa} ** 32;
    const tx2 = [_]u8{0xbb} ** 32;
    const hashes = [_][32]u8{ tx1, tx2 };
    const hash1 = fromTransactionHashes(&hashes);
    const hash2 = fromTransactionHashes(&hashes);
    try std.testing.expect(equals(&hash1, &hash2));
}

test "fromTransactionHashes - order matters" {
    const tx1 = [_]u8{0xaa} ** 32;
    const tx2 = [_]u8{0xbb} ** 32;
    const hashes1 = [_][32]u8{ tx1, tx2 };
    const hashes2 = [_][32]u8{ tx2, tx1 };
    const hash1 = fromTransactionHashes(&hashes1);
    const hash2 = fromTransactionHashes(&hashes2);
    try std.testing.expect(!equals(&hash1, &hash2));
}

/// Generic constructor - accepts bytes or hex string
pub fn from(value: anytype) !BundleHash {
    const T = @TypeOf(value);
    if (T == BundleHash) return value;

    if (T == []const u8 or T == []u8) {
        // Check if it's hex (starts with 0x)
        if (value.len > 2 and value[0] == '0' and value[1] == 'x') {
            return fromHex(value);
        }
        // Check if it's exactly 32 bytes (raw)
        if (value.len == SIZE) {
            return fromBytes(value);
        }
        // Try as hex without 0x
        if (value.len == SIZE * 2) {
            return fromHex(value);
        }
        return error.InvalidBundleHashInput;
    }

    @compileError("Unsupported type for BundleHash.from: " ++ @typeName(T));
}

test "from - BundleHash passthrough" {
    const hash1: BundleHash = ZERO;
    const hash2 = try from(hash1);
    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "from - raw bytes" {
    const bytes = [_]u8{42} ** SIZE;
    const hash = try from(bytes[0..]);
    try std.testing.expectEqual(@as(u8, 42), hash[0]);
}

test "from - hex with 0x" {
    const hex = "0x" ++ ("ef" ** SIZE);
    const hash = try from(hex);
    try std.testing.expectEqual(@as(u8, 0xef), hash[0]);
}

test "from - hex without 0x" {
    const hex = "12" ** SIZE;
    const hash = try from(hex);
    try std.testing.expectEqual(@as(u8, 0x12), hash[0]);
}

// ============================================================================
// Converters
// ============================================================================

/// Convert BundleHash to bytes slice
pub fn toBytes(hash: *const BundleHash) []const u8 {
    return hash[0..];
}

test "toBytes - returns correct slice" {
    var hash: BundleHash = undefined;
    @memset(&hash, 0xaa);
    const bytes = toBytes(&hash);
    try std.testing.expectEqual(SIZE, bytes.len);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[0]);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[31]);
}

/// Convert BundleHash to hex string with 0x prefix
pub fn toHex(hash: *const BundleHash, allocator: std.mem.Allocator) ![]const u8 {
    return try Hex.toHex(allocator, hash[0..]);
}

test "toHex - with 0x prefix" {
    var hash: BundleHash = undefined;
    @memset(&hash, 0xff);
    const hex = try toHex(&hash, std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expectEqual(2 + SIZE * 2, hex.len);
    try std.testing.expect(std.mem.startsWith(u8, hex, "0x"));
    try std.testing.expect(std.mem.eql(u8, hex, "0x" ++ ("ff" ** SIZE)));
}

/// Alias for toHex
pub fn toString(hash: *const BundleHash, allocator: std.mem.Allocator) ![]const u8 {
    return toHex(hash, allocator);
}

test "toString - same as toHex" {
    const hash: BundleHash = ZERO;
    const str = try toString(&hash, std.testing.allocator);
    defer std.testing.allocator.free(str);
    const hex_str = try toHex(&hash, std.testing.allocator);
    defer std.testing.allocator.free(hex_str);
    try std.testing.expect(std.mem.eql(u8, str, hex_str));
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two bundle hashes for equality
pub fn equals(a: *const BundleHash, b: *const BundleHash) bool {
    return std.mem.eql(u8, a[0..], b[0..]);
}

test "equals - same hash" {
    const hash: BundleHash = [_]u8{42} ** SIZE;
    try std.testing.expect(equals(&hash, &hash));
}

test "equals - identical hashes" {
    const hash1: BundleHash = [_]u8{99} ** SIZE;
    const hash2: BundleHash = [_]u8{99} ** SIZE;
    try std.testing.expect(equals(&hash1, &hash2));
}

test "equals - different hashes" {
    const hash1: BundleHash = [_]u8{1} ** SIZE;
    const hash2: BundleHash = [_]u8{2} ** SIZE;
    try std.testing.expect(!equals(&hash1, &hash2));
}

/// Check if hash is all zeros
pub fn isZero(hash: *const BundleHash) bool {
    return equals(hash, &ZERO);
}

test "isZero - zero hash" {
    const hash: BundleHash = ZERO;
    try std.testing.expect(isZero(&hash));
}

test "isZero - non-zero hash" {
    var hash: BundleHash = ZERO;
    hash[0] = 1;
    try std.testing.expect(!isZero(&hash));
}

/// Check if a hex string is valid bundle hash format
pub fn isValidHex(hex: []const u8) bool {
    // Must be 64 or 66 chars (with/without 0x)
    if (hex.len != SIZE * 2 and hex.len != SIZE * 2 + 2) {
        return false;
    }

    var start: usize = 0;
    if (hex.len == SIZE * 2 + 2) {
        if (hex[0] != '0' or hex[1] != 'x') return false;
        start = 2;
    }

    // Check all chars are hex
    for (hex[start..]) |c| {
        if (!std.ascii.isHex(c)) return false;
    }

    return true;
}

test "isValidHex - valid with 0x" {
    const hex = "0x" ++ ("ab" ** SIZE);
    try std.testing.expect(isValidHex(hex));
}

test "isValidHex - valid without 0x" {
    const hex = "cd" ** SIZE;
    try std.testing.expect(isValidHex(hex));
}

test "isValidHex - invalid length" {
    try std.testing.expect(!isValidHex("0xaabb"));
}

test "isValidHex - invalid chars" {
    const hex = "0x" ++ ("zz" ** SIZE);
    try std.testing.expect(!isValidHex(hex));
}

// ============================================================================
// Manipulation
// ============================================================================

/// Create a copy of the hash
pub fn clone(hash: *const BundleHash) BundleHash {
    var result: BundleHash = undefined;
    @memcpy(&result, hash);
    return result;
}

test "clone - creates independent copy" {
    var original: BundleHash = [_]u8{42} ** SIZE;
    var copy = clone(&original);
    try std.testing.expect(equals(&original, &copy));

    // Modify original
    original[0] = 99;
    try std.testing.expect(!equals(&original, &copy));
    try std.testing.expectEqual(@as(u8, 42), copy[0]);
}

/// Slice hash bytes
pub fn slice(hash: *const BundleHash, start: usize, end: usize) []const u8 {
    return hash[start..end];
}

test "slice - partial slice" {
    var hash: BundleHash = undefined;
    for (0..SIZE) |i| {
        hash[i] = @intCast(i);
    }
    const s = slice(&hash, 0, 10);
    try std.testing.expectEqual(@as(usize, 10), s.len);
    try std.testing.expectEqual(@as(u8, 0), s[0]);
    try std.testing.expectEqual(@as(u8, 9), s[9]);
}

/// Generate random bundle hash (for testing)
pub fn random() BundleHash {
    var hash: BundleHash = undefined;
    std.crypto.random.bytes(&hash);
    return hash;
}

test "random - generates different hashes" {
    const hash1 = random();
    const hash2 = random();
    // Astronomically unlikely to be equal
    try std.testing.expect(!equals(&hash1, &hash2));
}

test "random - correct size" {
    const hash = random();
    try std.testing.expectEqual(SIZE, hash.len);
}
