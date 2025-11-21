//! TransactionHash - Transaction identifier (32-byte hash)
//!
//! A transaction hash uniquely identifies an Ethereum transaction.
//! This is a semantic wrapper around Hash with domain-specific naming.
//!
//! ## Usage
//! ```zig
//! const TransactionHash = @import("primitives").TransactionHash;
//!
//! // From hex string
//! const tx_hash = try TransactionHash.fromHex("0x1234...");
//!
//! // From bytes
//! const tx_hash2 = TransactionHash.fromBytes(&bytes);
//!
//! // Convert to hex
//! const hex = try TransactionHash.toHex(&tx_hash, allocator);
//! ```

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");

/// TransactionHash is a 32-byte hash identifying a transaction
pub const TransactionHash = Hash.Hash;

/// Size constant (32 bytes)
pub const SIZE = Hash.SIZE;

/// Zero transaction hash constant
pub const ZERO: TransactionHash = Hash.ZERO;

// ============================================================================
// Constructors
// ============================================================================

/// Create TransactionHash from bytes. Input must be exactly 32 bytes.
pub fn fromBytes(bytes: []const u8) TransactionHash {
    return Hash.fromBytes(bytes);
}

test "fromBytes - valid 32 bytes" {
    const bytes = [_]u8{1} ** SIZE;
    const tx_hash = fromBytes(&bytes);
    try std.testing.expectEqual(SIZE, tx_hash.len);
    try std.testing.expectEqual(@as(u8, 1), tx_hash[0]);
}

test "fromBytes - creates independent copy" {
    var bytes = [_]u8{42} ** SIZE;
    const tx_hash = fromBytes(&bytes);
    bytes[0] = 99;
    try std.testing.expectEqual(@as(u8, 42), tx_hash[0]);
}

/// Create TransactionHash from hex string (with or without 0x prefix).
/// Returns error if hex is invalid or not 32 bytes.
pub fn fromHex(hex: []const u8) !TransactionHash {
    return Hash.fromHex(hex);
}

test "fromHex - with 0x prefix" {
    const hex = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const tx_hash = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0x12), tx_hash[0]);
}

test "fromHex - without 0x prefix" {
    const hex = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const tx_hash = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0x12), tx_hash[0]);
}

test "fromHex - invalid length" {
    const hex = "0x1234";
    try std.testing.expectError(error.InvalidHashLength, fromHex(hex));
}

test "fromHex - invalid hex chars" {
    const hex = "0xgg34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    try std.testing.expectError(error.InvalidHexCharacter, fromHex(hex));
}

/// Generic constructor - accepts bytes or hex string
pub fn from(value: anytype) !TransactionHash {
    return Hash.from(value);
}

test "from - TransactionHash passthrough" {
    const tx_hash1: TransactionHash = ZERO;
    const tx_hash2 = try from(tx_hash1);
    try std.testing.expectEqualSlices(u8, &tx_hash1, &tx_hash2);
}

test "from - raw bytes" {
    const bytes = [_]u8{42} ** SIZE;
    const tx_hash = try from(bytes[0..]);
    try std.testing.expectEqual(@as(u8, 42), tx_hash[0]);
}

test "from - hex with 0x" {
    const hex = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const tx_hash = try from(hex);
    try std.testing.expectEqual(@as(u8, 0x12), tx_hash[0]);
}

test "from - hex without 0x" {
    const hex = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const tx_hash = try from(hex);
    try std.testing.expectEqual(@as(u8, 0x12), tx_hash[0]);
}

// ============================================================================
// Converters
// ============================================================================

/// Convert TransactionHash to bytes slice
pub fn toBytes(tx_hash: *const TransactionHash) []const u8 {
    return Hash.toBytes(tx_hash);
}

test "toBytes - returns correct slice" {
    var tx_hash: TransactionHash = undefined;
    @memset(&tx_hash, 0xaa);
    const bytes = toBytes(&tx_hash);
    try std.testing.expectEqual(SIZE, bytes.len);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[0]);
}

/// Convert TransactionHash to hex string with 0x prefix
pub fn toHex(tx_hash: *const TransactionHash, allocator: std.mem.Allocator) ![]const u8 {
    return Hash.toHex(tx_hash, allocator);
}

test "toHex - with 0x prefix" {
    const bytes = [_]u8{
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
    };
    const tx_hash = fromBytes(&bytes);
    const hex = try toHex(&tx_hash, std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expect(std.mem.startsWith(u8, hex, "0x"));
    try std.testing.expectEqual(66, hex.len); // 0x + 64 hex chars
    try std.testing.expect(std.mem.eql(u8, hex, "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"));
}

/// Alias for toHex for string representation
pub fn toString(tx_hash: *const TransactionHash, allocator: std.mem.Allocator) ![]const u8 {
    return toHex(tx_hash, allocator);
}

test "toString - same as toHex" {
    const tx_hash: TransactionHash = ZERO;
    const str = try toString(&tx_hash, std.testing.allocator);
    defer std.testing.allocator.free(str);
    const hex_str = try toHex(&tx_hash, std.testing.allocator);
    defer std.testing.allocator.free(hex_str);
    try std.testing.expect(std.mem.eql(u8, str, hex_str));
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two transaction hashes for equality
pub fn equals(a: *const TransactionHash, b: *const TransactionHash) bool {
    return Hash.equals(a, b);
}

test "equals - same hash" {
    const tx_hash: TransactionHash = [_]u8{42} ** SIZE;
    try std.testing.expect(equals(&tx_hash, &tx_hash));
}

test "equals - identical hashes" {
    const tx_hash1: TransactionHash = [_]u8{99} ** SIZE;
    const tx_hash2: TransactionHash = [_]u8{99} ** SIZE;
    try std.testing.expect(equals(&tx_hash1, &tx_hash2));
}

test "equals - different hashes" {
    const tx_hash1: TransactionHash = [_]u8{1} ** SIZE;
    const tx_hash2: TransactionHash = [_]u8{2} ** SIZE;
    try std.testing.expect(!equals(&tx_hash1, &tx_hash2));
}

/// Check if transaction hash is all zeros
pub fn isZero(tx_hash: *const TransactionHash) bool {
    return Hash.isZero(tx_hash);
}

test "isZero - zero hash" {
    const tx_hash: TransactionHash = ZERO;
    try std.testing.expect(isZero(&tx_hash));
}

test "isZero - non-zero hash" {
    var tx_hash: TransactionHash = ZERO;
    tx_hash[0] = 1;
    try std.testing.expect(!isZero(&tx_hash));
}

/// Assert that value is a valid transaction hash (for runtime checks)
pub fn assert(tx_hash: *const TransactionHash) void {
    Hash.assert(tx_hash);
}

test "assert - always succeeds for TransactionHash type" {
    const tx_hash: TransactionHash = ZERO;
    assert(&tx_hash);
}

/// Check if a hex string is valid transaction hash format
pub fn isValidHex(hex: []const u8) bool {
    return Hash.isValidHex(hex);
}

test "isValidHex - valid with 0x" {
    const hex = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    try std.testing.expect(isValidHex(hex));
}

test "isValidHex - valid without 0x" {
    const hex = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    try std.testing.expect(isValidHex(hex));
}

test "isValidHex - invalid length" {
    try std.testing.expect(!isValidHex("0x1234"));
}

test "isValidHex - invalid chars" {
    const hex = "0xgg34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    try std.testing.expect(!isValidHex(hex));
}

/// Type guard - check if value is a TransactionHash
pub fn isTransactionHash(value: anytype) bool {
    return Hash.isHash(value);
}

test "isTransactionHash - TransactionHash type" {
    const tx_hash: TransactionHash = ZERO;
    try std.testing.expect(isTransactionHash(tx_hash));
}

test "isTransactionHash - pointer types" {
    const tx_hash: TransactionHash = ZERO;
    try std.testing.expect(isTransactionHash(&tx_hash));
}

test "isTransactionHash - non-TransactionHash type" {
    const bytes = [_]u8{0} ** 16;
    try std.testing.expect(!isTransactionHash(bytes));
}

// ============================================================================
// Manipulation
// ============================================================================

/// Create a copy of the transaction hash
pub fn clone(tx_hash: *const TransactionHash) TransactionHash {
    return Hash.clone(tx_hash);
}

test "clone - creates independent copy" {
    var original: TransactionHash = [_]u8{42} ** SIZE;
    var copy = clone(&original);
    try std.testing.expect(equals(&original, &copy));

    original[0] = 99;
    try std.testing.expect(!equals(&original, &copy));
    try std.testing.expectEqual(@as(u8, 42), copy[0]);
}

/// Slice transaction hash bytes
pub fn slice(tx_hash: *const TransactionHash, start: usize, end: usize) []const u8 {
    return Hash.slice(tx_hash, start, end);
}

test "slice - partial slice" {
    var tx_hash: TransactionHash = undefined;
    for (0..SIZE) |i| {
        tx_hash[i] = @intCast(i);
    }
    const s = slice(&tx_hash, 0, 10);
    try std.testing.expectEqual(@as(usize, 10), s.len);
    try std.testing.expectEqual(@as(u8, 0), s[0]);
}

/// Format transaction hash for display (returns hex string)
pub fn format(tx_hash: *const TransactionHash, allocator: std.mem.Allocator) ![]const u8 {
    return toHex(tx_hash, allocator);
}

test "format - returns hex string" {
    const tx_hash: TransactionHash = ZERO;
    const formatted = try format(&tx_hash, std.testing.allocator);
    defer std.testing.allocator.free(formatted);
    try std.testing.expect(std.mem.startsWith(u8, formatted, "0x"));
}

/// Generate random transaction hash (for testing)
pub fn random() TransactionHash {
    return Hash.random();
}

test "random - generates different hashes" {
    const tx_hash1 = random();
    const tx_hash2 = random();
    try std.testing.expect(!equals(&tx_hash1, &tx_hash2));
}

test "random - correct size" {
    const tx_hash = random();
    try std.testing.expectEqual(SIZE, tx_hash.len);
}
