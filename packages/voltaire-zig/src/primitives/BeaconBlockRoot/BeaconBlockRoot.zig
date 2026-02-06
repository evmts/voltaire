//! BeaconBlockRoot - 32-byte beacon chain block root hash (EIP-4788)
//!
//! Represents a beacon chain block root hash used for accessing parent
//! beacon block roots in the EVM via the beacon block root precompile.
//!
//! ## Design
//! - Fixed 32-byte array matching Hash type
//! - Available in EVM via EIP-4788 precompile
//! - Used for light client proofs and beacon chain verification
//!
//! ## Usage
//! ```zig
//! const BeaconBlockRoot = @import("primitives").BeaconBlockRoot;
//!
//! // From hex string
//! const root = try BeaconBlockRoot.fromHex("0x1234...");
//!
//! // From bytes
//! const root2 = BeaconBlockRoot.fromBytes(&bytes);
//!
//! // Check if zero
//! const is_zero = BeaconBlockRoot.isZero(&root);
//! ```

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");

/// BeaconBlockRoot size in bytes (32 bytes = 256 bits)
pub const SIZE = 32;

/// BeaconBlockRoot type - 32 bytes
pub const BeaconBlockRoot = [SIZE]u8;

/// Zero beacon block root constant
pub const ZERO: BeaconBlockRoot = [_]u8{0} ** SIZE;

// ============================================================================
// Constructors
// ============================================================================

/// Create BeaconBlockRoot from bytes. Input must be exactly 32 bytes.
pub fn fromBytes(bytes: []const u8) BeaconBlockRoot {
    std.debug.assert(bytes.len == SIZE);
    var result: BeaconBlockRoot = undefined;
    @memcpy(&result, bytes);
    return result;
}

test "fromBytes - valid 32 bytes" {
    const bytes = [_]u8{0xab} ** SIZE;
    const root = fromBytes(&bytes);
    try std.testing.expectEqual(SIZE, root.len);
    try std.testing.expectEqual(@as(u8, 0xab), root[0]);
    try std.testing.expectEqual(@as(u8, 0xab), root[31]);
}

test "fromBytes - creates independent copy" {
    var bytes = [_]u8{42} ** SIZE;
    const root = fromBytes(&bytes);
    bytes[0] = 99;
    try std.testing.expectEqual(@as(u8, 42), root[0]);
}

/// Create BeaconBlockRoot from hex string (with or without 0x prefix).
/// Returns error if hex is invalid or not 32 bytes.
pub fn fromHex(hex: []const u8) !BeaconBlockRoot {
    return Hash.fromHex(hex);
}

test "fromHex - with 0x prefix" {
    const hex = "0x" ++ ("ab" ** SIZE);
    const root = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0xab), root[0]);
    try std.testing.expectEqual(@as(u8, 0xab), root[31]);
}

test "fromHex - without 0x prefix" {
    const hex = "cd" ** SIZE;
    const root = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0xcd), root[0]);
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
pub fn from(value: anytype) !BeaconBlockRoot {
    return Hash.from(value);
}

test "from - raw bytes" {
    const bytes = [_]u8{42} ** SIZE;
    const root = try from(bytes[0..]);
    try std.testing.expectEqual(@as(u8, 42), root[0]);
}

test "from - hex with 0x" {
    const hex = "0x" ++ ("ef" ** SIZE);
    const root = try from(hex);
    try std.testing.expectEqual(@as(u8, 0xef), root[0]);
}

// ============================================================================
// Converters
// ============================================================================

/// Convert BeaconBlockRoot to bytes slice
pub fn toBytes(root: *const BeaconBlockRoot) []const u8 {
    return root[0..];
}

test "toBytes - returns correct slice" {
    var root: BeaconBlockRoot = undefined;
    @memset(&root, 0xaa);
    const bytes = toBytes(&root);
    try std.testing.expectEqual(SIZE, bytes.len);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[0]);
}

/// Convert BeaconBlockRoot to hex string with 0x prefix
pub fn toHex(root: *const BeaconBlockRoot, allocator: std.mem.Allocator) ![]const u8 {
    return Hash.toHex(root, allocator);
}

test "toHex - with 0x prefix" {
    var root: BeaconBlockRoot = undefined;
    @memset(&root, 0xff);
    const hex = try toHex(&root, std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expectEqual(2 + SIZE * 2, hex.len);
    try std.testing.expect(std.mem.startsWith(u8, hex, "0x"));
    try std.testing.expect(std.mem.eql(u8, hex, "0x" ++ ("ff" ** SIZE)));
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two beacon block roots for equality
pub fn equals(a: *const BeaconBlockRoot, b: *const BeaconBlockRoot) bool {
    return std.mem.eql(u8, a[0..], b[0..]);
}

test "equals - same root" {
    const root: BeaconBlockRoot = [_]u8{42} ** SIZE;
    try std.testing.expect(equals(&root, &root));
}

test "equals - identical roots" {
    const root1: BeaconBlockRoot = [_]u8{99} ** SIZE;
    const root2: BeaconBlockRoot = [_]u8{99} ** SIZE;
    try std.testing.expect(equals(&root1, &root2));
}

test "equals - different roots" {
    const root1: BeaconBlockRoot = [_]u8{1} ** SIZE;
    const root2: BeaconBlockRoot = [_]u8{2} ** SIZE;
    try std.testing.expect(!equals(&root1, &root2));
}

/// Check if beacon block root is all zeros
pub fn isZero(root: *const BeaconBlockRoot) bool {
    return equals(root, &ZERO);
}

test "isZero - zero root" {
    const root: BeaconBlockRoot = ZERO;
    try std.testing.expect(isZero(&root));
}

test "isZero - non-zero root" {
    var root: BeaconBlockRoot = ZERO;
    root[0] = 1;
    try std.testing.expect(!isZero(&root));
}

/// Check if a hex string is valid beacon block root format
pub fn isValidHex(hex: []const u8) bool {
    return Hash.isValidHex(hex);
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

// ============================================================================
// Manipulation
// ============================================================================

/// Create a copy of the beacon block root
pub fn clone(root: *const BeaconBlockRoot) BeaconBlockRoot {
    var result: BeaconBlockRoot = undefined;
    @memcpy(&result, root);
    return result;
}

test "clone - creates independent copy" {
    var original: BeaconBlockRoot = [_]u8{42} ** SIZE;
    var copy = clone(&original);
    try std.testing.expect(equals(&original, &copy));

    // Modify original
    original[0] = 99;
    try std.testing.expect(!equals(&original, &copy));
    try std.testing.expectEqual(@as(u8, 42), copy[0]);
}

/// Generate random beacon block root (for testing)
pub fn random() BeaconBlockRoot {
    var root: BeaconBlockRoot = undefined;
    std.crypto.random.bytes(&root);
    return root;
}

test "random - generates different roots" {
    const root1 = random();
    const root2 = random();
    // Astronomically unlikely to be equal
    try std.testing.expect(!equals(&root1, &root2));
}

test "random - correct size" {
    const root = random();
    try std.testing.expectEqual(SIZE, root.len);
}

/// Format beacon block root for display (returns hex string)
pub fn format(root: *const BeaconBlockRoot, allocator: std.mem.Allocator) ![]const u8 {
    return toHex(root, allocator);
}

test "format - returns hex string" {
    const root: BeaconBlockRoot = ZERO;
    const formatted = try format(&root, std.testing.allocator);
    defer std.testing.allocator.free(formatted);
    try std.testing.expect(std.mem.startsWith(u8, formatted, "0x"));
    try std.testing.expectEqual(2 + SIZE * 2, formatted.len);
}

// ============================================================================
// Type Interoperability
// ============================================================================

/// Type guard - check if value is a BeaconBlockRoot
pub fn isBeaconBlockRoot(value: anytype) bool {
    const T = @TypeOf(value);
    return T == BeaconBlockRoot or T == *const BeaconBlockRoot or T == *BeaconBlockRoot;
}

test "isBeaconBlockRoot - BeaconBlockRoot type" {
    const root: BeaconBlockRoot = ZERO;
    try std.testing.expect(isBeaconBlockRoot(root));
}

test "isBeaconBlockRoot - pointer types" {
    const root: BeaconBlockRoot = ZERO;
    try std.testing.expect(isBeaconBlockRoot(&root));
}

/// Convert to Hash type (same underlying type)
pub fn toHash(root: *const BeaconBlockRoot) Hash.Hash {
    return root.*;
}

test "toHash - converts to Hash" {
    const root: BeaconBlockRoot = [_]u8{0xab} ** SIZE;
    const hash = toHash(&root);
    try std.testing.expectEqualSlices(u8, &root, &hash);
}

/// Create from Hash type (same underlying type)
pub fn fromHash(hash: *const Hash.Hash) BeaconBlockRoot {
    return hash.*;
}

test "fromHash - creates from Hash" {
    const hash: Hash.Hash = [_]u8{0xcd} ** SIZE;
    const root = fromHash(&hash);
    try std.testing.expectEqualSlices(u8, &hash, &root);
}
