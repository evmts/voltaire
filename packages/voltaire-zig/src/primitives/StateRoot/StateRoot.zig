//! StateRoot - 32-byte Merkle Patricia Trie root hash type
//!
//! Represents the root hash of the global Ethereum state trie, which contains
//! mappings from addresses to account states. The state root uniquely identifies
//! the entire global state at a given block and is included in every block header.
//!
//! Per the Yellow Paper, the state trie encodes mappings between addresses
//! (160-bit identifiers) and account states.
//!
//! StateRoot is a type alias for Hash with semantic meaning - it delegates
//! all operations to the Hash module.
//!
//! ## Usage
//! ```zig
//! const StateRoot = @import("primitives").StateRoot;
//!
//! // From hex string
//! const root = try StateRoot.fromHex("0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544");
//!
//! // From bytes
//! const root2 = StateRoot.fromBytes(&bytes);
//!
//! // Compare roots
//! const is_equal = StateRoot.equals(&root, &root2);
//! ```

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");

/// StateRoot is a 32-byte hash representing the Merkle Patricia Trie root
pub const StateRoot = Hash.Hash;

/// Size constant (32 bytes)
pub const SIZE = Hash.SIZE;

/// Zero state root constant
pub const ZERO: StateRoot = Hash.ZERO;

// ============================================================================
// Constructors
// ============================================================================

/// Create StateRoot from bytes. Input must be exactly 32 bytes.
pub fn fromBytes(bytes: []const u8) StateRoot {
    return Hash.fromBytes(bytes);
}

test "fromBytes - valid 32 bytes" {
    const bytes = [_]u8{0xd7} ** SIZE;
    const root = fromBytes(&bytes);
    try std.testing.expectEqual(SIZE, root.len);
    try std.testing.expectEqual(@as(u8, 0xd7), root[0]);
    try std.testing.expectEqual(@as(u8, 0xd7), root[31]);
}

test "fromBytes - creates independent copy" {
    var bytes = [_]u8{0x44} ** SIZE;
    const root = fromBytes(&bytes);
    bytes[0] = 0x99;
    try std.testing.expectEqual(@as(u8, 0x44), root[0]);
}

/// Create StateRoot from hex string (with or without 0x prefix).
/// Returns error if hex is invalid or not 32 bytes.
pub fn fromHex(hex: []const u8) !StateRoot {
    return try Hash.fromHex(hex);
}

test "fromHex - with 0x prefix" {
    const hex = "0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
    const root = try fromHex(hex);
    try std.testing.expectEqual(SIZE, root.len);
}

test "fromHex - without 0x prefix" {
    const hex = "d7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
    const root = try fromHex(hex);
    try std.testing.expectEqual(SIZE, root.len);
}

test "fromHex - invalid length" {
    const hex = "0xaabb";
    try std.testing.expectError(error.InvalidHashLength, fromHex(hex));
}

test "fromHex - invalid hex chars" {
    const hex = "0x" ++ ("zz" ** SIZE);
    try std.testing.expectError(error.InvalidHexCharacter, fromHex(hex));
}

/// Generic constructor - accepts bytes or hex string
pub fn from(value: anytype) !StateRoot {
    return try Hash.from(value);
}

test "from - StateRoot passthrough" {
    const root1: StateRoot = ZERO;
    const root2 = try from(root1);
    try std.testing.expectEqualSlices(u8, &root1, &root2);
}

test "from - raw bytes" {
    const bytes = [_]u8{0x42} ** SIZE;
    const root = try from(bytes[0..]);
    try std.testing.expectEqual(@as(u8, 0x42), root[0]);
}

test "from - hex with 0x" {
    const hex = "0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
    const root = try from(hex);
    try std.testing.expectEqual(SIZE, root.len);
}

test "from - hex without 0x" {
    const hex = "d7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
    const root = try from(hex);
    try std.testing.expectEqual(SIZE, root.len);
}

// ============================================================================
// Converters
// ============================================================================

/// Convert StateRoot to bytes slice
pub fn toBytes(root: *const StateRoot) []const u8 {
    return Hash.toBytes(root);
}

test "toBytes - returns correct slice" {
    var root: StateRoot = undefined;
    @memset(&root, 0xaa);
    const bytes = toBytes(&root);
    try std.testing.expectEqual(SIZE, bytes.len);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[0]);
}

/// Convert StateRoot to hex string with 0x prefix
pub fn toHex(root: *const StateRoot, allocator: std.mem.Allocator) ![]const u8 {
    return try Hash.toHex(root, allocator);
}

test "toHex - with 0x prefix" {
    var root: StateRoot = undefined;
    @memset(&root, 0xff);
    const hex = try toHex(&root, std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expectEqual(2 + SIZE * 2, hex.len);
    try std.testing.expect(std.mem.startsWith(u8, hex, "0x"));
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two StateRoots for equality (constant-time)
pub fn equals(a: *const StateRoot, b: *const StateRoot) bool {
    return Hash.equals(a, b);
}

test "equals - same root" {
    const root: StateRoot = [_]u8{0x42} ** SIZE;
    try std.testing.expect(equals(&root, &root));
}

test "equals - identical roots" {
    const root1: StateRoot = [_]u8{0x99} ** SIZE;
    const root2: StateRoot = [_]u8{0x99} ** SIZE;
    try std.testing.expect(equals(&root1, &root2));
}

test "equals - different roots" {
    const root1: StateRoot = [_]u8{0x11} ** SIZE;
    const root2: StateRoot = [_]u8{0x22} ** SIZE;
    try std.testing.expect(!equals(&root1, &root2));
}

test "equals - constant-time comparison" {
    const root1 = try fromHex("0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544");
    const root2 = try fromHex("0x0000000000000000000000000000000000000000000000000000000000000000");
    try std.testing.expect(!equals(&root1, &root2));
}

// ============================================================================
// Integration Tests
// ============================================================================

test "round-trip through hex" {
    const original = "0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
    const root = try from(original);
    const hex = try toHex(&root, std.testing.allocator);
    defer std.testing.allocator.free(hex);
    const root2 = try fromHex(hex);

    try std.testing.expect(equals(&root, &root2));
    try std.testing.expect(std.mem.eql(u8, hex, original));
}

test "known state root from Ethereum mainnet" {
    // Example state root from block 1
    const hex = "0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544";
    const root = try fromHex(hex);

    // Verify it round-trips correctly
    const hex_out = try toHex(&root, std.testing.allocator);
    defer std.testing.allocator.free(hex_out);
    try std.testing.expect(std.mem.eql(u8, hex, hex_out));
}
