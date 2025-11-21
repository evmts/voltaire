//! BlockHash - 32-byte block identifier
//!
//! BlockHash is a type alias for Hash, providing semantic clarity when
//! dealing with block identifiers in the Ethereum protocol. All Hash
//! operations are available on BlockHash values.
//!
//! ## Usage
//! ```zig
//! const BlockHash = @import("primitives").BlockHash;
//!
//! // From hex string
//! const hash = try BlockHash.fromHex("0x1234...");
//!
//! // From bytes
//! const hash2 = BlockHash.fromBytes(&bytes);
//!
//! // All Hash operations work
//! const is_zero = BlockHash.isZero(&hash);
//! ```

const Hash = @import("../Hash/Hash.zig");

/// BlockHash is a type alias for Hash (32-byte block identifier)
pub const BlockHash = Hash.Hash;

/// Block hash size in bytes (32 bytes = 256 bits)
pub const SIZE = Hash.SIZE;

/// Zero block hash constant
pub const ZERO: BlockHash = Hash.ZERO;

// ============================================================================
// Constructors
// ============================================================================

/// Create BlockHash from bytes. Input must be exactly 32 bytes.
pub fn fromBytes(bytes: []const u8) BlockHash {
    return Hash.fromBytes(bytes);
}

/// Create BlockHash from hex string (with or without 0x prefix).
/// Returns error if hex is invalid or not 32 bytes.
pub fn fromHex(hex: []const u8) !BlockHash {
    return Hash.fromHex(hex);
}

/// Generic constructor - accepts bytes or hex string
pub fn from(value: anytype) !BlockHash {
    return Hash.from(value);
}

// ============================================================================
// Converters
// ============================================================================

/// Convert BlockHash to bytes slice
pub fn toBytes(hash: *const BlockHash) []const u8 {
    return Hash.toBytes(hash);
}

/// Convert BlockHash to hex string with 0x prefix
pub fn toHex(hash: *const BlockHash, allocator: @import("std").mem.Allocator) ![]const u8 {
    return Hash.toHex(hash, allocator);
}

/// Alias for toHex for string representation
pub fn toString(hash: *const BlockHash, allocator: @import("std").mem.Allocator) ![]const u8 {
    return Hash.toString(hash, allocator);
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two block hashes for equality
pub fn equals(a: *const BlockHash, b: *const BlockHash) bool {
    return Hash.equals(a, b);
}

/// Check if block hash is all zeros
pub fn isZero(hash: *const BlockHash) bool {
    return Hash.isZero(hash);
}

/// Assert that value is a valid block hash (for runtime checks)
pub fn assert(hash: *const BlockHash) void {
    Hash.assert(hash);
}

/// Check if a hex string is valid block hash format
pub fn isValidHex(hex: []const u8) bool {
    return Hash.isValidHex(hex);
}

/// Type guard - check if value is a BlockHash
pub fn isBlockHash(value: anytype) bool {
    return Hash.isHash(value);
}

// ============================================================================
// Manipulation
// ============================================================================

/// Create a copy of the block hash
pub fn clone(hash: *const BlockHash) BlockHash {
    return Hash.clone(hash);
}

/// Slice block hash bytes
pub fn slice(hash: *const BlockHash, start: usize, end: usize) []const u8 {
    return Hash.slice(hash, start, end);
}

/// Format block hash for display (returns hex string)
pub fn format(hash: *const BlockHash, allocator: @import("std").mem.Allocator) ![]const u8 {
    return Hash.format(hash, allocator);
}

/// Generate random block hash (for testing)
pub fn random() BlockHash {
    return Hash.random();
}

// ============================================================================
// Tests
// ============================================================================

const std = @import("std");

test "BlockHash is Hash alias" {
    const bh: BlockHash = ZERO;
    const h: Hash.Hash = ZERO;
    try std.testing.expect(equals(&bh, &h));
}

test "fromBytes - valid 32 bytes" {
    const bytes = [_]u8{1} ** SIZE;
    const hash = fromBytes(&bytes);
    try std.testing.expectEqual(SIZE, hash.len);
    try std.testing.expectEqual(@as(u8, 1), hash[0]);
    try std.testing.expectEqual(@as(u8, 1), hash[31]);
}

test "fromHex - with 0x prefix" {
    const hex = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const hash = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0xab), hash[0]);
    try std.testing.expectEqual(@as(u8, 0xcd), hash[1]);
    try std.testing.expectEqual(@as(u8, 0xef), hash[2]);
}

test "fromHex - without 0x prefix" {
    const hex = "cd" ** SIZE;
    const hash = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0xcd), hash[0]);
}

test "fromHex - invalid length" {
    const hex = "0xaabb";
    try std.testing.expectError(error.InvalidHashLength, fromHex(hex));
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

test "toHex - converts to hex string" {
    const testBytes = [_]u8{
        0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90,
        0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90,
        0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90,
        0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90,
    };
    const hash = fromBytes(&testBytes);
    const hex = try toHex(&hash, std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expect(std.mem.startsWith(u8, hex, "0x"));
    try std.testing.expectEqual(2 + SIZE * 2, hex.len);
    // Verify first few bytes
    try std.testing.expect(std.mem.startsWith(u8, hex, "0xabcdef12"));
}

test "equals - same hash" {
    const hash: BlockHash = [_]u8{42} ** SIZE;
    try std.testing.expect(equals(&hash, &hash));
}

test "equals - identical hashes" {
    const hash1: BlockHash = [_]u8{99} ** SIZE;
    const hash2: BlockHash = [_]u8{99} ** SIZE;
    try std.testing.expect(equals(&hash1, &hash2));
}

test "equals - different hashes" {
    const hash1: BlockHash = [_]u8{1} ** SIZE;
    const hash2: BlockHash = [_]u8{2} ** SIZE;
    try std.testing.expect(!equals(&hash1, &hash2));
}

test "isZero - zero hash" {
    const hash: BlockHash = ZERO;
    try std.testing.expect(isZero(&hash));
}

test "isZero - non-zero hash" {
    var hash: BlockHash = ZERO;
    hash[0] = 1;
    try std.testing.expect(!isZero(&hash));
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

test "clone - creates independent copy" {
    var original: BlockHash = [_]u8{42} ** SIZE;
    var copy = clone(&original);
    try std.testing.expect(equals(&original, &copy));

    // Modify original
    original[0] = 99;
    try std.testing.expect(!equals(&original, &copy));
    try std.testing.expectEqual(@as(u8, 42), copy[0]);
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
