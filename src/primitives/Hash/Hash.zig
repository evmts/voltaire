//! Hash - 32-byte cryptographic hash type for Ethereum
//!
//! This module provides a strongly-typed 32-byte hash implementation
//! that is used throughout Ethereum for various purposes including
//! transaction hashes, block hashes, state roots, and keccak256 digests.
//!
//! ## Usage
//! ```zig
//! const Hash = @import("primitives").Hash;
//!
//! // From hex string
//! const hash = try Hash.fromHex("0x1234...");
//!
//! // From bytes
//! const hash2 = Hash.fromBytes(&bytes);
//!
//! // Keccak256 hashing
//! const hash3 = Hash.keccak256(&data);
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");
const crypto = @import("crypto");

/// Hash size in bytes (32 bytes = 256 bits)
pub const SIZE = 32;

/// Hash type - 32 bytes
pub const Hash = [SIZE]u8;

/// Zero hash constant
pub const ZERO: Hash = [_]u8{0} ** SIZE;

// ============================================================================
// Constructors
// ============================================================================

/// Create Hash from bytes. Input must be exactly 32 bytes.
pub fn fromBytes(bytes: []const u8) Hash {
    std.debug.assert(bytes.len == SIZE);
    var result: Hash = undefined;
    @memcpy(&result, bytes);
    return result;
}

test "fromBytes - valid 32 bytes" {
    const bytes = [_]u8{1} ** SIZE;
    const hash = fromBytes(&bytes);
    try std.testing.expectEqual(SIZE, hash.len);
    try std.testing.expectEqual(@as(u8, 1), hash[0]);
    try std.testing.expectEqual(@as(u8, 1), hash[31]);
}

test "fromBytes - creates independent copy" {
    var bytes = [_]u8{42} ** SIZE;
    const hash = fromBytes(&bytes);
    bytes[0] = 99;
    try std.testing.expectEqual(@as(u8, 42), hash[0]);
}

/// Create Hash from hex string (with or without 0x prefix).
/// Returns error if hex is invalid or not 32 bytes.
pub fn fromHex(hex: []const u8) !Hash {
    const bytes = try Hex.fromHex(std.testing.allocator, hex);
    defer std.testing.allocator.free(bytes);

    if (bytes.len != SIZE) {
        return error.InvalidHashLength;
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
    try std.testing.expectError(error.InvalidHashLength, fromHex(hex));
}

test "fromHex - invalid hex chars" {
    const hex = "0x" ++ ("zz" ** SIZE);
    try std.testing.expectError(error.InvalidHexCharacter, fromHex(hex));
}

/// Generic constructor - accepts bytes or hex string
pub fn from(value: anytype) !Hash {
    const T = @TypeOf(value);
    if (T == Hash) return value;

    if (T == []const u8 or T == []u8) {
        // Check if it's hex (starts with 0x or all hex chars)
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
        return error.InvalidHashInput;
    }

    @compileError("Unsupported type for Hash.from: " ++ @typeName(T));
}

test "from - Hash passthrough" {
    const hash1: Hash = ZERO;
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

/// Convert Hash to bytes slice
pub fn toBytes(hash: *const Hash) []const u8 {
    return hash[0..];
}

test "toBytes - returns correct slice" {
    var hash: Hash = undefined;
    @memset(&hash, 0xaa);
    const bytes = toBytes(&hash);
    try std.testing.expectEqual(SIZE, bytes.len);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[0]);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[31]);
}

/// Convert Hash to hex string with 0x prefix
pub fn toHex(hash: *const Hash, allocator: std.mem.Allocator) ![]const u8 {
    return try Hex.toHex(allocator, hash[0..]);
}

test "toHex - with 0x prefix" {
    var hash: Hash = undefined;
    @memset(&hash, 0xff);
    const hex = try toHex(&hash, std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expectEqual(2 + SIZE * 2, hex.len);
    try std.testing.expect(std.mem.startsWith(u8, hex, "0x"));
    try std.testing.expect(std.mem.eql(u8, hex, "0x" ++ ("ff" ** SIZE)));
}

/// Alias for toHex for string representation
pub fn toString(hash: *const Hash, allocator: std.mem.Allocator) ![]const u8 {
    return toHex(hash, allocator);
}

test "toString - same as toHex" {
    const hash: Hash = ZERO;
    const str = try toString(&hash, std.testing.allocator);
    defer std.testing.allocator.free(str);
    const hex_str = try toHex(&hash, std.testing.allocator);
    defer std.testing.allocator.free(hex_str);
    try std.testing.expect(std.mem.eql(u8, str, hex_str));
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two hashes for equality
pub fn equals(a: *const Hash, b: *const Hash) bool {
    return std.mem.eql(u8, a[0..], b[0..]);
}

test "equals - same hash" {
    const hash: Hash = [_]u8{42} ** SIZE;
    try std.testing.expect(equals(&hash, &hash));
}

test "equals - identical hashes" {
    const hash1: Hash = [_]u8{99} ** SIZE;
    const hash2: Hash = [_]u8{99} ** SIZE;
    try std.testing.expect(equals(&hash1, &hash2));
}

test "equals - different hashes" {
    const hash1: Hash = [_]u8{1} ** SIZE;
    const hash2: Hash = [_]u8{2} ** SIZE;
    try std.testing.expect(!equals(&hash1, &hash2));
}

/// Check if hash is all zeros
pub fn isZero(hash: *const Hash) bool {
    return equals(hash, &ZERO);
}

test "isZero - zero hash" {
    const hash: Hash = ZERO;
    try std.testing.expect(isZero(&hash));
}

test "isZero - non-zero hash" {
    var hash: Hash = ZERO;
    hash[0] = 1;
    try std.testing.expect(!isZero(&hash));
}

/// Assert that value is a valid hash (for runtime checks)
pub fn assert(hash: *const Hash) void {
    // Hash is always valid if it's the right type
    // This function exists for API parity
    _ = hash;
}

test "assert - always succeeds for Hash type" {
    const hash: Hash = ZERO;
    assert(&hash);
}

/// Check if a hex string is valid hash format
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

test "isValidHex - no 0x prefix but wrong length" {
    try std.testing.expect(!isValidHex("abcd"));
}

/// Type guard - check if value is a Hash
pub fn isHash(value: anytype) bool {
    const T = @TypeOf(value);
    return T == Hash or T == *const Hash or T == *Hash;
}

test "isHash - Hash type" {
    const hash: Hash = ZERO;
    try std.testing.expect(isHash(hash));
}

test "isHash - pointer types" {
    const hash: Hash = ZERO;
    try std.testing.expect(isHash(&hash));
}

test "isHash - non-Hash type" {
    const bytes = [_]u8{0} ** 16;
    try std.testing.expect(!isHash(bytes));
}

// ============================================================================
// Manipulation
// ============================================================================

/// Create a copy of the hash
pub fn clone(hash: *const Hash) Hash {
    var result: Hash = undefined;
    @memcpy(&result, hash);
    return result;
}

test "clone - creates independent copy" {
    var original: Hash = [_]u8{42} ** SIZE;
    var copy = clone(&original);
    try std.testing.expect(equals(&original, &copy));

    // Modify original
    original[0] = 99;
    try std.testing.expect(!equals(&original, &copy));
    try std.testing.expectEqual(@as(u8, 42), copy[0]);
}

/// Slice hash bytes (returns a new Hash only if slice is 32 bytes)
pub fn slice(hash: *const Hash, start: usize, end: usize) []const u8 {
    return hash[start..end];
}

test "slice - partial slice" {
    var hash: Hash = undefined;
    for (0..SIZE) |i| {
        hash[i] = @intCast(i);
    }
    const s = slice(&hash, 0, 10);
    try std.testing.expectEqual(@as(usize, 10), s.len);
    try std.testing.expectEqual(@as(u8, 0), s[0]);
    try std.testing.expectEqual(@as(u8, 9), s[9]);
}

test "slice - full slice" {
    const hash: Hash = [_]u8{77} ** SIZE;
    const s = slice(&hash, 0, SIZE);
    try std.testing.expectEqual(SIZE, s.len);
    try std.testing.expectEqualSlices(u8, &hash, s);
}

/// Format hash for display (returns hex string)
pub fn format(hash: *const Hash, allocator: std.mem.Allocator) ![]const u8 {
    return toHex(hash, allocator);
}

test "format - returns hex string" {
    const hash: Hash = ZERO;
    const formatted = try format(&hash, std.testing.allocator);
    defer std.testing.allocator.free(formatted);
    try std.testing.expect(std.mem.startsWith(u8, formatted, "0x"));
    try std.testing.expectEqual(2 + SIZE * 2, formatted.len);
}

/// Generate random hash (for testing)
pub fn random() Hash {
    var hash: Hash = undefined;
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

// ============================================================================
// Cryptographic Operations
// ============================================================================

/// Compute Keccak256 hash of data
pub fn keccak256(data: []const u8) Hash {
    var result: Hash = undefined;
    crypto.Keccak256.hash(data, &result);
    return result;
}

test "keccak256 - empty data" {
    const hash = keccak256("");
    // Known Keccak256 of empty string
    const expected_hex = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
    const expected = try fromHex(expected_hex);
    try std.testing.expect(equals(&hash, &expected));
}

test "keccak256 - known vector" {
    const hash = keccak256("abc");
    // Known Keccak256("abc")
    const expected_hex = "0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45";
    const expected = try fromHex(expected_hex);
    try std.testing.expect(equals(&hash, &expected));
}

/// Compute Keccak256 hash of string
pub fn keccak256String(str: []const u8) Hash {
    return keccak256(str);
}

test "keccak256String - same as keccak256" {
    const str = "test string";
    const hash1 = keccak256String(str);
    const hash2 = keccak256(str);
    try std.testing.expect(equals(&hash1, &hash2));
}

/// Compute Keccak256 hash of hex string
pub fn keccak256Hex(hex: []const u8) !Hash {
    const bytes = try Hex.toBytes(hex, std.testing.allocator);
    defer std.testing.allocator.free(bytes);
    return keccak256(bytes);
}

test "keccak256Hex - valid hex" {
    const hex = "0xaabbccdd";
    const hash = try keccak256Hex(hex);

    // Verify by converting hex to bytes and hashing
    const bytes = try Hex.toBytes(hex, std.testing.allocator);
    defer std.testing.allocator.free(bytes);
    const expected = keccak256(bytes);

    try std.testing.expect(equals(&hash, &expected));
}

// ============================================================================
// Advanced Operations
// ============================================================================

/// Concatenate multiple hashes and hash the result
pub fn concat(allocator: std.mem.Allocator, hashes: []const Hash) !Hash {
    // Calculate total size
    const total_size = hashes.len * SIZE;
    const buffer = try allocator.alloc(u8, total_size);
    defer allocator.free(buffer);

    // Copy all hashes into buffer
    for (hashes, 0..) |hash, i| {
        @memcpy(buffer[i * SIZE .. (i + 1) * SIZE], &hash);
    }

    // Hash the concatenation
    return keccak256(buffer);
}

test "concat - two hashes" {
    const hash1: Hash = [_]u8{0xaa} ** SIZE;
    const hash2: Hash = [_]u8{0xbb} ** SIZE;
    const hashes = [_]Hash{ hash1, hash2 };

    const result = try concat(std.testing.allocator, &hashes);

    // Verify by manually concatenating
    var buffer: [SIZE * 2]u8 = undefined;
    @memcpy(buffer[0..SIZE], &hash1);
    @memcpy(buffer[SIZE .. SIZE * 2], &hash2);
    const expected = keccak256(&buffer);

    try std.testing.expect(equals(&result, &expected));
}

test "concat - single hash" {
    const hash1: Hash = [_]u8{0xcc} ** SIZE;
    const hashes = [_]Hash{hash1};
    const result = try concat(std.testing.allocator, &hashes);
    const expected = keccak256(&hash1);
    try std.testing.expect(equals(&result, &expected));
}

test "concat - empty array returns hash of empty data" {
    const hashes: []const Hash = &[_]Hash{};
    const result = try concat(std.testing.allocator, hashes);
    const expected = keccak256("");
    try std.testing.expect(equals(&result, &expected));
}

/// Compute Merkle root of hash array
pub fn merkleRoot(allocator: std.mem.Allocator, hashes: []const Hash) !Hash {
    if (hashes.len == 0) {
        return ZERO;
    }
    if (hashes.len == 1) {
        return hashes[0];
    }

    // Create working buffer for current level
    var current = try allocator.alloc(Hash, hashes.len);
    defer allocator.free(current);
    @memcpy(current, hashes);

    var current_len = hashes.len;

    // Build tree bottom-up
    while (current_len > 1) {
        const next_len = (current_len + 1) / 2;
        var next = try allocator.alloc(Hash, next_len);
        defer allocator.free(next);

        var i: usize = 0;
        while (i < current_len) : (i += 2) {
            if (i + 1 < current_len) {
                // Pair exists
                const pair = [_]Hash{ current[i], current[i + 1] };
                next[i / 2] = try concat(allocator, &pair);
            } else {
                // Odd one out - hash with itself
                const pair = [_]Hash{ current[i], current[i] };
                next[i / 2] = try concat(allocator, &pair);
            }
        }

        // Swap buffers
        const temp = current;
        current = next;
        current_len = next_len;
        allocator.free(temp);

        // Re-allocate for next iteration if needed
        if (current_len > 1) {
            const new_current = try allocator.alloc(Hash, current_len);
            @memcpy(new_current, current[0..current_len]);
            allocator.free(current);
            current = new_current;
        }
    }

    return current[0];
}

test "merkleRoot - empty array" {
    const hashes: []const Hash = &[_]Hash{};
    const root = try merkleRoot(std.testing.allocator, hashes);
    try std.testing.expect(equals(&root, &ZERO));
}

test "merkleRoot - single hash" {
    const hash: Hash = [_]u8{0xaa} ** SIZE;
    const hashes = [_]Hash{hash};
    const root = try merkleRoot(std.testing.allocator, &hashes);
    try std.testing.expect(equals(&root, &hash));
}

test "merkleRoot - two hashes" {
    const hash1: Hash = [_]u8{0xaa} ** SIZE;
    const hash2: Hash = [_]u8{0xbb} ** SIZE;
    const hashes = [_]Hash{ hash1, hash2 };

    const root = try merkleRoot(std.testing.allocator, &hashes);

    // Root should be concat(hash1, hash2)
    const expected = try concat(std.testing.allocator, &hashes);
    try std.testing.expect(equals(&root, &expected));
}

test "merkleRoot - three hashes (odd)" {
    const hash1: Hash = [_]u8{0x11} ** SIZE;
    const hash2: Hash = [_]u8{0x22} ** SIZE;
    const hash3: Hash = [_]u8{0x33} ** SIZE;
    const hashes = [_]Hash{ hash1, hash2, hash3 };

    const root = try merkleRoot(std.testing.allocator, &hashes);

    // Manually compute expected
    // Level 1: h12 = concat(h1, h2), h33 = concat(h3, h3)
    const pair12 = [_]Hash{ hash1, hash2 };
    const h12 = try concat(std.testing.allocator, &pair12);
    const pair33 = [_]Hash{ hash3, hash3 };
    const h33 = try concat(std.testing.allocator, &pair33);

    // Level 2: root = concat(h12, h33)
    const final_pair = [_]Hash{ h12, h33 };
    const expected = try concat(std.testing.allocator, &final_pair);

    try std.testing.expect(equals(&root, &expected));
}

test "merkleRoot - four hashes (even)" {
    const hash1: Hash = [_]u8{0x11} ** SIZE;
    const hash2: Hash = [_]u8{0x22} ** SIZE;
    const hash3: Hash = [_]u8{0x33} ** SIZE;
    const hash4: Hash = [_]u8{0x44} ** SIZE;
    const hashes = [_]Hash{ hash1, hash2, hash3, hash4 };

    const root = try merkleRoot(std.testing.allocator, &hashes);

    // Manually compute
    const pair12 = [_]Hash{ hash1, hash2 };
    const h12 = try concat(std.testing.allocator, &pair12);
    const pair34 = [_]Hash{ hash3, hash4 };
    const h34 = try concat(std.testing.allocator, &pair34);
    const final_pair = [_]Hash{ h12, h34 };
    const expected = try concat(std.testing.allocator, &final_pair);

    try std.testing.expect(equals(&root, &expected));
}
