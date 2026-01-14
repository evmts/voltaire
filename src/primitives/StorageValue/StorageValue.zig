//! StorageValue - 32-byte EVM storage slot value type
//!
//! This module provides a strongly-typed 32-byte storage value implementation
//! that represents values stored in EVM contract storage slots.
//!
//! In the EVM, each contract has 2^256 storage slots, and each slot stores
//! a 32-byte (256-bit) value. Storage is the persistent key-value store
//! used by smart contracts to maintain state between transactions.
//!
//! ## Usage
//! ```zig
//! const StorageValue = @import("primitives").StorageValue;
//!
//! // From hex string
//! const val = try StorageValue.fromHex("0x0000...0123");
//!
//! // From bytes
//! const val2 = StorageValue.fromBytes(&bytes);
//!
//! // To U256
//! const num = StorageValue.toUint256(&val);
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");

/// StorageValue size in bytes (32 bytes = 256 bits)
pub const SIZE = 32;

/// StorageValue type - 32 bytes
pub const StorageValue = [SIZE]u8;

/// Zero storage value constant
pub const ZERO: StorageValue = [_]u8{0} ** SIZE;

// ============================================================================
// Constructors
// ============================================================================

/// Create StorageValue from bytes. Input must be exactly 32 bytes.
pub fn fromBytes(bytes: []const u8) StorageValue {
    std.debug.assert(bytes.len == SIZE);
    var result: StorageValue = undefined;
    @memcpy(&result, bytes);
    return result;
}

test "fromBytes - valid 32 bytes" {
    const bytes = [_]u8{1} ** SIZE;
    const val = fromBytes(&bytes);
    try std.testing.expectEqual(SIZE, val.len);
    try std.testing.expectEqual(@as(u8, 1), val[0]);
    try std.testing.expectEqual(@as(u8, 1), val[31]);
}

test "fromBytes - creates independent copy" {
    var bytes = [_]u8{42} ** SIZE;
    const val = fromBytes(&bytes);
    bytes[0] = 99;
    try std.testing.expectEqual(@as(u8, 42), val[0]);
}

/// Create StorageValue from hex string (with or without 0x prefix).
/// Returns error if hex is invalid or not 32 bytes.
pub fn fromHex(hex: []const u8) !StorageValue {
    const bytes = try Hex.toBytes(hex, std.testing.allocator);
    defer std.testing.allocator.free(bytes);

    if (bytes.len != SIZE) {
        return error.InvalidStorageValueLength;
    }

    return fromBytes(bytes);
}

test "fromHex - with 0x prefix" {
    const hex = "0x" ++ ("00" ** (SIZE - 1)) ++ "7b";
    const val = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0x7b), val[31]);
}

test "fromHex - without 0x prefix" {
    const hex = ("00" ** (SIZE - 1)) ++ "7b";
    const val = try fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0x7b), val[31]);
}

test "fromHex - invalid length" {
    const hex = "0xaabb";
    try std.testing.expectError(error.InvalidStorageValueLength, fromHex(hex));
}

test "fromHex - invalid hex chars" {
    const hex = "0x" ++ ("zz" ** SIZE);
    try std.testing.expectError(error.InvalidHexCharacter, fromHex(hex));
}

/// Create StorageValue from u256 value (big-endian)
pub fn fromUint256(value: u256) StorageValue {
    var result: StorageValue = undefined;
    var v = value;

    // Convert to big-endian bytes
    var i: usize = SIZE;
    while (i > 0) {
        i -= 1;
        result[i] = @truncate(v & 0xff);
        v >>= 8;
    }

    return result;
}

test "fromUint256 - zero" {
    const val = fromUint256(0);
    try std.testing.expectEqualSlices(u8, &ZERO, &val);
}

test "fromUint256 - small value" {
    const val = fromUint256(123);
    try std.testing.expectEqual(@as(u8, 0), val[0]);
    try std.testing.expectEqual(@as(u8, 123), val[31]);
}

test "fromUint256 - max uint256" {
    const max: u256 = std.math.maxInt(u256);
    const val = fromUint256(max);
    for (val) |byte| {
        try std.testing.expectEqual(@as(u8, 0xff), byte);
    }
}

test "fromUint256 - large value" {
    const large: u256 = 0xdeadbeefcafebabe;
    const val = fromUint256(large);
    try std.testing.expectEqual(@as(u8, 0xde), val[SIZE - 8]);
    try std.testing.expectEqual(@as(u8, 0xad), val[SIZE - 7]);
    try std.testing.expectEqual(@as(u8, 0xbe), val[SIZE - 1]);
}

/// Generic constructor - accepts bytes or hex string
pub fn from(value: anytype) !StorageValue {
    const T = @TypeOf(value);
    if (T == StorageValue) return value;

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
        return error.InvalidStorageValueInput;
    }

    if (T == u256) {
        return fromUint256(value);
    }

    @compileError("Unsupported type for StorageValue.from: " ++ @typeName(T));
}

test "from - StorageValue passthrough" {
    const val1: StorageValue = ZERO;
    const val2 = try from(val1);
    try std.testing.expectEqualSlices(u8, &val1, &val2);
}

test "from - raw bytes" {
    const bytes = [_]u8{42} ** SIZE;
    const val = try from(bytes[0..]);
    try std.testing.expectEqual(@as(u8, 42), val[0]);
}

test "from - hex with 0x" {
    const hex = "0x" ++ ("00" ** (SIZE - 1)) ++ "ef";
    const val = try from(hex);
    try std.testing.expectEqual(@as(u8, 0xef), val[31]);
}

test "from - hex without 0x" {
    const hex = ("00" ** (SIZE - 1)) ++ "12";
    const val = try from(hex);
    try std.testing.expectEqual(@as(u8, 0x12), val[31]);
}

test "from - u256 value" {
    const val = try from(@as(u256, 456));
    try std.testing.expectEqual(@as(u8, 456 & 0xff), val[31]);
}

// ============================================================================
// Converters
// ============================================================================

/// Convert StorageValue to bytes slice
pub fn toBytes(value: *const StorageValue) []const u8 {
    return value[0..];
}

test "toBytes - returns correct slice" {
    var val: StorageValue = undefined;
    @memset(&val, 0xaa);
    const bytes = toBytes(&val);
    try std.testing.expectEqual(SIZE, bytes.len);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[0]);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[31]);
}

/// Convert StorageValue to hex string with 0x prefix
pub fn toHex(value: *const StorageValue, allocator: std.mem.Allocator) ![]const u8 {
    return try Hex.toHex(allocator, value[0..]);
}

test "toHex - with 0x prefix" {
    var val: StorageValue = undefined;
    @memset(&val, 0xff);
    const hex = try toHex(&val, std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expectEqual(2 + SIZE * 2, hex.len);
    try std.testing.expect(std.mem.startsWith(u8, hex, "0x"));
    try std.testing.expect(std.mem.eql(u8, hex, "0x" ++ ("ff" ** SIZE)));
}

test "toHex - zero value" {
    const val: StorageValue = ZERO;
    const hex = try toHex(&val, std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expect(std.mem.eql(u8, hex, "0x" ++ ("00" ** SIZE)));
}

/// Convert StorageValue to u256 (big-endian interpretation)
pub fn toUint256(value: *const StorageValue) u256 {
    var result: u256 = 0;
    for (value) |byte| {
        result = (result << 8) | @as(u256, byte);
    }
    return result;
}

test "toUint256 - zero" {
    const val: StorageValue = ZERO;
    const num = toUint256(&val);
    try std.testing.expectEqual(@as(u256, 0), num);
}

test "toUint256 - small value" {
    const val = fromUint256(123);
    const num = toUint256(&val);
    try std.testing.expectEqual(@as(u256, 123), num);
}

test "toUint256 - max uint256" {
    const max: u256 = std.math.maxInt(u256);
    const val = fromUint256(max);
    const num = toUint256(&val);
    try std.testing.expectEqual(max, num);
}

test "toUint256 - round trip" {
    const original: u256 = 0xdeadbeefcafebabe;
    const val = fromUint256(original);
    const num = toUint256(&val);
    try std.testing.expectEqual(original, num);
}

/// Alias for toHex for string representation
pub fn toString(value: *const StorageValue, allocator: std.mem.Allocator) ![]const u8 {
    return toHex(value, allocator);
}

test "toString - same as toHex" {
    const val: StorageValue = ZERO;
    const str = try toString(&val, std.testing.allocator);
    defer std.testing.allocator.free(str);
    const hex_str = try toHex(&val, std.testing.allocator);
    defer std.testing.allocator.free(hex_str);
    try std.testing.expect(std.mem.eql(u8, str, hex_str));
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two storage values for equality (constant-time)
pub fn equals(a: *const StorageValue, b: *const StorageValue) bool {
    var result: u8 = 0;
    for (a, b) |x, y| {
        result |= x ^ y;
    }
    return result == 0;
}

test "equals - same value" {
    const val: StorageValue = [_]u8{42} ** SIZE;
    try std.testing.expect(equals(&val, &val));
}

test "equals - identical values" {
    const val1: StorageValue = [_]u8{99} ** SIZE;
    const val2: StorageValue = [_]u8{99} ** SIZE;
    try std.testing.expect(equals(&val1, &val2));
}

test "equals - different values" {
    const val1: StorageValue = [_]u8{1} ** SIZE;
    const val2: StorageValue = [_]u8{2} ** SIZE;
    try std.testing.expect(!equals(&val1, &val2));
}

test "equals - constant time" {
    const val1 = fromUint256(0);
    const val2 = fromUint256(std.math.maxInt(u256));
    try std.testing.expect(!equals(&val1, &val2));
}

/// Check if storage value is all zeros
pub fn isZero(value: *const StorageValue) bool {
    return equals(value, &ZERO);
}

test "isZero - zero value" {
    const val: StorageValue = ZERO;
    try std.testing.expect(isZero(&val));
}

test "isZero - non-zero value" {
    var val: StorageValue = ZERO;
    val[31] = 1;
    try std.testing.expect(!isZero(&val));
}

/// Assert that value is a valid storage value (for runtime checks)
pub fn assert(value: *const StorageValue) void {
    // StorageValue is always valid if it's the right type
    // This function exists for API parity
    _ = value;
}

test "assert - always succeeds for StorageValue type" {
    const val: StorageValue = ZERO;
    assert(&val);
}

/// Check if a hex string is valid storage value format
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
    const hex = "0x" ++ ("00" ** SIZE);
    try std.testing.expect(isValidHex(hex));
}

test "isValidHex - valid without 0x" {
    const hex = "00" ** SIZE;
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

/// Type guard - check if value is a StorageValue
pub fn isStorageValue(value: anytype) bool {
    const T = @TypeOf(value);
    return T == StorageValue or T == *const StorageValue or T == *StorageValue;
}

test "isStorageValue - StorageValue type" {
    const val: StorageValue = ZERO;
    try std.testing.expect(isStorageValue(val));
}

test "isStorageValue - pointer types" {
    const val: StorageValue = ZERO;
    try std.testing.expect(isStorageValue(&val));
}

test "isStorageValue - non-StorageValue type" {
    const bytes = [_]u8{0} ** 16;
    try std.testing.expect(!isStorageValue(bytes));
}

// ============================================================================
// Manipulation
// ============================================================================

/// Create a copy of the storage value
pub fn clone(value: *const StorageValue) StorageValue {
    var result: StorageValue = undefined;
    @memcpy(&result, value);
    return result;
}

test "clone - creates independent copy" {
    var original: StorageValue = [_]u8{42} ** SIZE;
    var copy = clone(&original);
    try std.testing.expect(equals(&original, &copy));

    // Modify original
    original[0] = 99;
    try std.testing.expect(!equals(&original, &copy));
    try std.testing.expectEqual(@as(u8, 42), copy[0]);
}

/// Slice storage value bytes
pub fn slice(value: *const StorageValue, start: usize, end: usize) []const u8 {
    return value[start..end];
}

test "slice - partial slice" {
    var val: StorageValue = undefined;
    for (0..SIZE) |i| {
        val[i] = @intCast(i);
    }
    const s = slice(&val, 0, 10);
    try std.testing.expectEqual(@as(usize, 10), s.len);
    try std.testing.expectEqual(@as(u8, 0), s[0]);
    try std.testing.expectEqual(@as(u8, 9), s[9]);
}

test "slice - full slice" {
    const val: StorageValue = [_]u8{77} ** SIZE;
    const s = slice(&val, 0, SIZE);
    try std.testing.expectEqual(SIZE, s.len);
    try std.testing.expectEqualSlices(u8, &val, s);
}

/// Format storage value for display (returns hex string)
pub fn format(value: *const StorageValue, allocator: std.mem.Allocator) ![]const u8 {
    return toHex(value, allocator);
}

test "format - returns hex string" {
    const val: StorageValue = ZERO;
    const formatted = try format(&val, std.testing.allocator);
    defer std.testing.allocator.free(formatted);
    try std.testing.expect(std.mem.startsWith(u8, formatted, "0x"));
    try std.testing.expectEqual(2 + SIZE * 2, formatted.len);
}

/// Generate random storage value (for testing)
pub fn random() StorageValue {
    var val: StorageValue = undefined;
    std.crypto.random.bytes(&val);
    return val;
}

test "random - generates different values" {
    const val1 = random();
    const val2 = random();
    // Astronomically unlikely to be equal
    try std.testing.expect(!equals(&val1, &val2));
}

test "random - correct size" {
    const val = random();
    try std.testing.expectEqual(SIZE, val.len);
}

// ============================================================================
// Integration Tests
// ============================================================================

test "round trip - bigint" {
    const original: u256 = 0xdeadbeef;
    const val = fromUint256(original);
    const num = toUint256(&val);
    try std.testing.expectEqual(original, num);
}

test "round trip - hex" {
    const original = "0x" ++ ("00" ** (SIZE - 1)) ++ "23";
    const val = try fromHex(original);
    const hex = try toHex(&val, std.testing.allocator);
    defer std.testing.allocator.free(hex);
    try std.testing.expect(std.mem.eql(u8, hex, original));
}

test "integration - from various inputs" {
    // From u256
    const val1 = try from(@as(u256, 123));
    try std.testing.expectEqual(@as(u256, 123), toUint256(&val1));

    // From hex
    const val2 = try from("0x" ++ ("00" ** (SIZE - 1)) ++ "7b");
    try std.testing.expect(equals(&val1, &val2));

    // From bytes
    const bytes = val1;
    const val3 = try from(bytes[0..]);
    try std.testing.expect(equals(&val1, &val3));
}
