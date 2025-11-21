//! Bytes32 - Fixed-size 32-byte array type
//!
//! Generic 32-byte data structure used throughout Ethereum for various purposes
//! including storage values, contract data, and numeric representations.
//! While Hash is specifically for cryptographic hashes, Bytes32 is the general-purpose
//! 32-byte type that can represent any 32-byte data.
//!
//! ## Usage
//! ```zig
//! const Bytes32 = @import("primitives").Bytes32;
//!
//! // From hex string
//! const bytes = try Bytes32.fromHex("0x1234...");
//!
//! // From number/bigint
//! const bytes2 = Bytes32.fromNumber(42);
//!
//! // Convert to other types
//! const hash = Bytes32.toHash(&bytes);
//! const addr = Bytes32.toAddress(&bytes);
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");
const Hash = @import("../Hash/Hash.zig");
const Address = @import("../Address/address.zig");

/// Bytes32 size in bytes
pub const SIZE = 32;

/// Bytes32 type - 32 bytes
pub const Bytes32 = [SIZE]u8;

/// Zero constant
pub const ZERO: Bytes32 = [_]u8{0} ** SIZE;

// ============================================================================
// Constructors
// ============================================================================

/// Create Bytes32 from bytes. Input must be exactly 32 bytes.
pub fn fromBytes(bytes: []const u8) Bytes32 {
    std.debug.assert(bytes.len == SIZE);
    var result: Bytes32 = undefined;
    @memcpy(&result, bytes);
    return result;
}

test "fromBytes - valid 32 bytes" {
    const bytes = [_]u8{1} ** SIZE;
    const b32 = fromBytes(&bytes);
    try std.testing.expectEqual(SIZE, b32.len);
    try std.testing.expectEqual(@as(u8, 1), b32[0]);
    try std.testing.expectEqual(@as(u8, 1), b32[31]);
}

test "fromBytes - creates independent copy" {
    var bytes = [_]u8{42} ** SIZE;
    const b32 = fromBytes(&bytes);
    bytes[0] = 99;
    try std.testing.expectEqual(@as(u8, 42), b32[0]);
}

/// Create Bytes32 from hex string (with or without 0x prefix).
/// Returns error if hex is invalid or not 32 bytes.
pub fn fromHex(hex: []const u8) !Bytes32 {
    const bytes = try Hex.toBytes(hex, std.testing.allocator);
    defer std.testing.allocator.free(bytes);

    if (bytes.len != SIZE) {
        return error.InvalidBytes32Length;
    }

    return fromBytes(bytes);
}

test "fromHex - with 0x prefix" {
    const hex = "0x" ++ ("ab" ** SIZE);
    const b32 = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0xab), b32[0]);
    try std.testing.expectEqual(@as(u8, 0xab), b32[31]);
}

test "fromHex - without 0x prefix" {
    const hex = "cd" ** SIZE;
    const b32 = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0xcd), b32[0]);
}

test "fromHex - invalid length" {
    const hex = "0xaabb";
    try std.testing.expectError(error.InvalidBytes32Length, fromHex(hex));
}

test "fromHex - invalid hex chars" {
    const hex = "0x" ++ ("zz" ** SIZE);
    try std.testing.expectError(error.InvalidHexCharacter, fromHex(hex));
}

/// Create Bytes32 from number (big-endian, zero-padded)
pub fn fromNumber(value: u64) Bytes32 {
    var result: Bytes32 = ZERO;
    var n = value;
    var i: usize = SIZE - 1;
    while (n > 0) : (i -= 1) {
        result[i] = @intCast(n & 0xff);
        n >>= 8;
        if (i == 0) break;
    }
    return result;
}

test "fromNumber - zero" {
    const b32 = fromNumber(0);
    try std.testing.expect(isZero(&b32));
}

test "fromNumber - small number" {
    const b32 = fromNumber(42);
    try std.testing.expectEqual(@as(u8, 0), b32[0]);
    try std.testing.expectEqual(@as(u8, 42), b32[31]);
}

test "fromNumber - large number" {
    const b32 = fromNumber(0x123456789ABCDEF0);
    try std.testing.expectEqual(@as(u8, 0x12), b32[24]);
    try std.testing.expectEqual(@as(u8, 0xF0), b32[31]);
}

/// Create Bytes32 from u256 (big-endian)
pub fn fromBigint(value: u256) Bytes32 {
    var result: Bytes32 = undefined;
    var n = value;
    var i: usize = SIZE;
    while (i > 0) {
        i -= 1;
        result[i] = @intCast(n & 0xff);
        n >>= 8;
    }
    return result;
}

test "fromBigint - zero" {
    const b32 = fromBigint(0);
    try std.testing.expect(isZero(&b32));
}

test "fromBigint - max u256" {
    const max = std.math.maxInt(u256);
    const b32 = fromBigint(max);
    try std.testing.expectEqual(@as(u8, 0xff), b32[0]);
    try std.testing.expectEqual(@as(u8, 0xff), b32[31]);
}

test "fromBigint - mid value" {
    const b32 = fromBigint(0x1234567890ABCDEF);
    try std.testing.expectEqual(@as(u8, 0x12), b32[24]);
    try std.testing.expectEqual(@as(u8, 0xEF), b32[31]);
}

/// Generic constructor - accepts bytes or hex string
pub fn from(value: anytype) !Bytes32 {
    const T = @TypeOf(value);
    if (T == Bytes32) return value;

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
        return error.InvalidBytes32Input;
    }

    @compileError("Unsupported type for Bytes32.from: " ++ @typeName(T));
}

test "from - Bytes32 passthrough" {
    const b1: Bytes32 = ZERO;
    const b2 = try from(b1);
    try std.testing.expectEqualSlices(u8, &b1, &b2);
}

test "from - raw bytes" {
    const bytes = [_]u8{42} ** SIZE;
    const b32 = try from(bytes[0..]);
    try std.testing.expectEqual(@as(u8, 42), b32[0]);
}

test "from - hex with 0x" {
    const hex = "0x" ++ ("ef" ** SIZE);
    const b32 = try from(hex);
    try std.testing.expectEqual(@as(u8, 0xef), b32[0]);
}

test "from - hex without 0x" {
    const hex = "12" ** SIZE;
    const b32 = try from(hex);
    try std.testing.expectEqual(@as(u8, 0x12), b32[0]);
}

/// Create zero Bytes32
pub fn zero() Bytes32 {
    return ZERO;
}

test "zero - returns all zeros" {
    const b32 = zero();
    try std.testing.expect(isZero(&b32));
}

// ============================================================================
// Converters
// ============================================================================

/// Convert Bytes32 to bytes slice
pub fn toBytes(b32: *const Bytes32) []const u8 {
    return b32[0..];
}

test "toBytes - returns correct slice" {
    var b32: Bytes32 = undefined;
    @memset(&b32, 0xaa);
    const bytes = toBytes(&b32);
    try std.testing.expectEqual(SIZE, bytes.len);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[0]);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[31]);
}

/// Convert Bytes32 to Uint8Array (for FFI compatibility)
pub fn toUint8Array(b32: *const Bytes32) []const u8 {
    return b32[0..];
}

test "toUint8Array - same as toBytes" {
    var b32: Bytes32 = undefined;
    @memset(&b32, 0xbb);
    const arr = toUint8Array(&b32);
    try std.testing.expectEqual(SIZE, arr.len);
    try std.testing.expectEqual(@as(u8, 0xbb), arr[0]);
}

/// Convert Bytes32 to hex string with 0x prefix
pub fn toHex(b32: *const Bytes32, allocator: std.mem.Allocator) ![]const u8 {
    return try Hex.fromBytes(b32[0..], allocator);
}

test "toHex - with 0x prefix" {
    var b32: Bytes32 = undefined;
    @memset(&b32, 0xff);
    const hex = try toHex(&b32, std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expectEqual(2 + SIZE * 2, hex.len);
    try std.testing.expect(std.mem.startsWith(u8, hex, "0x"));
    try std.testing.expect(std.mem.eql(u8, hex, "0x" ++ ("ff" ** SIZE)));
}

/// Convert Bytes32 to bigint (big-endian)
pub fn toBigint(b32: *const Bytes32) u256 {
    var result: u256 = 0;
    for (b32) |byte| {
        result = (result << 8) | byte;
    }
    return result;
}

test "toBigint - zero" {
    const b32 = ZERO;
    try std.testing.expectEqual(@as(u256, 0), toBigint(&b32));
}

test "toBigint - small value" {
    var b32 = ZERO;
    b32[31] = 42;
    try std.testing.expectEqual(@as(u256, 42), toBigint(&b32));
}

test "toBigint - roundtrip" {
    const value: u256 = 0x123456789ABCDEF0;
    const b32 = fromBigint(value);
    try std.testing.expectEqual(value, toBigint(&b32));
}

test "toBigint - max u256" {
    const max = std.math.maxInt(u256);
    const b32 = fromBigint(max);
    try std.testing.expectEqual(max, toBigint(&b32));
}

/// Convert Bytes32 to Hash (semantic conversion)
pub fn toHash(b32: *const Bytes32) Hash.Hash {
    return Hash.fromBytes(b32[0..]);
}

test "toHash - conversion" {
    var b32: Bytes32 = undefined;
    @memset(&b32, 0xcc);
    const hash = toHash(&b32);
    try std.testing.expectEqual(@as(u8, 0xcc), hash[0]);
    try std.testing.expectEqual(@as(u8, 0xcc), hash[31]);
}

/// Convert Bytes32 to Address (last 20 bytes)
pub fn toAddress(b32: *const Bytes32) Address.Address {
    return Address.fromBytes(b32[SIZE - Address.SIZE ..]);
}

test "toAddress - extracts last 20 bytes" {
    var b32: Bytes32 = ZERO;
    // Set last 20 bytes to 0xff
    for (SIZE - Address.SIZE..SIZE) |i| {
        b32[i] = 0xff;
    }
    const addr = toAddress(&b32);
    try std.testing.expectEqual(@as(u8, 0), b32[0]); // First bytes still zero
    try std.testing.expectEqual(@as(u8, 0xff), addr[0]); // Address is last 20
    try std.testing.expectEqual(@as(u8, 0xff), addr[19]);
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two Bytes32 for equality
pub fn equals(a: *const Bytes32, b: *const Bytes32) bool {
    return std.mem.eql(u8, a[0..], b[0..]);
}

test "equals - same" {
    const b32: Bytes32 = [_]u8{42} ** SIZE;
    try std.testing.expect(equals(&b32, &b32));
}

test "equals - identical" {
    const b1: Bytes32 = [_]u8{99} ** SIZE;
    const b2: Bytes32 = [_]u8{99} ** SIZE;
    try std.testing.expect(equals(&b1, &b2));
}

test "equals - different" {
    const b1: Bytes32 = [_]u8{1} ** SIZE;
    const b2: Bytes32 = [_]u8{2} ** SIZE;
    try std.testing.expect(!equals(&b1, &b2));
}

/// Compare two Bytes32 lexicographically
/// Returns: -1 if a < b, 0 if equal, 1 if a > b
pub fn compare(a: *const Bytes32, b: *const Bytes32) i8 {
    for (0..SIZE) |i| {
        if (a[i] < b[i]) return -1;
        if (a[i] > b[i]) return 1;
    }
    return 0;
}

test "compare - equal" {
    const b1: Bytes32 = [_]u8{42} ** SIZE;
    const b2: Bytes32 = [_]u8{42} ** SIZE;
    try std.testing.expectEqual(@as(i8, 0), compare(&b1, &b2));
}

test "compare - less" {
    var b1: Bytes32 = [_]u8{42} ** SIZE;
    var b2: Bytes32 = [_]u8{42} ** SIZE;
    b1[0] = 1;
    b2[0] = 2;
    try std.testing.expectEqual(@as(i8, -1), compare(&b1, &b2));
}

test "compare - greater" {
    var b1: Bytes32 = [_]u8{42} ** SIZE;
    var b2: Bytes32 = [_]u8{42} ** SIZE;
    b1[0] = 3;
    b2[0] = 2;
    try std.testing.expectEqual(@as(i8, 1), compare(&b1, &b2));
}

/// Check if Bytes32 is all zeros
pub fn isZero(b32: *const Bytes32) bool {
    return equals(b32, &ZERO);
}

test "isZero - zero" {
    const b32: Bytes32 = ZERO;
    try std.testing.expect(isZero(&b32));
}

test "isZero - non-zero" {
    var b32: Bytes32 = ZERO;
    b32[31] = 1;
    try std.testing.expect(!isZero(&b32));
}

// ============================================================================
// Manipulation
// ============================================================================

/// Get size (always 32)
pub fn size(_: *const Bytes32) usize {
    return SIZE;
}

test "size - always 32" {
    const b32: Bytes32 = ZERO;
    try std.testing.expectEqual(@as(usize, 32), size(&b32));
}

/// Create a copy of the Bytes32
pub fn clone(b32: *const Bytes32) Bytes32 {
    var result: Bytes32 = undefined;
    @memcpy(&result, b32);
    return result;
}

test "clone - creates independent copy" {
    var original: Bytes32 = [_]u8{42} ** SIZE;
    var copy = clone(&original);
    try std.testing.expect(equals(&original, &copy));

    // Modify original
    original[0] = 99;
    try std.testing.expect(!equals(&original, &copy));
    try std.testing.expectEqual(@as(u8, 42), copy[0]);
}
