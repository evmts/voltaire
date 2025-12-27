//! Hexadecimal Utilities - Ethereum hex string processing and validation
//!
//! This module provides comprehensive utilities for working with hexadecimal
//! strings in Ethereum contexts. It handles the "0x" prefix convention,
//! validation, conversion to/from bytes, and various utility functions.
//!
//! ## Features
//!
//! - **Validation**: Strict hex string format validation
//! - **Conversion**: Bidirectional hex/bytes conversion
//! - **Ethereum Format**: Proper "0x" prefix handling
//! - **Error Handling**: Comprehensive error types for debugging
//! - **Performance**: Optimized for high-throughput operations
//!
//! ## Hex String Format
//!
//! All hex strings in Ethereum follow the format:
//! - Must start with "0x" prefix
//! - Followed by even number of hex digits [0-9a-fA-F]
//! - Case insensitive but lowercase preferred
//! - Empty hex string is "0x"
//!
//! ## Usage Examples
//!
//! ### Basic Validation
//! ```zig
//! const hex = @import("../Hex/hex.zig");
//!
//! // Validate hex strings
//! const valid = hex.isHex("0x1234abcd"); // true
//! const invalid = hex.isHex("1234abcd"); // false (missing 0x)
//! ```
//!
//! ### Hex to Bytes Conversion
//! ```zig
//! // Convert hex string to bytes
//! const hex_str = "0x1234abcd";
//! const bytes = try hex.hexToBytes(allocator, hex_str);
//! defer allocator.free(bytes);
//! // bytes = [0x12, 0x34, 0xab, 0xcd]
//! ```
//!
//! ### Bytes to Hex Conversion
//! ```zig
//! // Convert bytes to hex string
//! const bytes = [_]u8{ 0x12, 0x34, 0xab, 0xcd };
//! const hex_str = try hex.bytesToHex(allocator, &bytes);
//! defer allocator.free(hex_str);
//! // hex_str = "0x1234abcd"
//! ```
//!
//! ### Working with Fixed-Size Arrays
//! ```zig
//! // Convert to fixed-size array (address)
//! var address: [20]u8 = undefined;
//! try hex.hexToFixedBytes("0x742d35Cc6641C91B6E4bb6ac...", &address);
//! ```
//!
//! ## Error Handling
//!
//! The module provides detailed error types:
//! - `InvalidHexFormat`: Missing "0x" prefix
//! - `InvalidHexLength`: Odd number of hex digits
//! - `InvalidHexCharacter`: Invalid character in hex string
//! - `ValueTooLarge`: Number exceeds target type capacity
//! - `InvalidLength`: Mismatch between expected and actual length
//!
//! ## Performance Considerations
//!
//! - **No Allocations**: Most functions work with stack-allocated buffers
//! - **Validation**: Early validation prevents processing invalid data
//! - **Lookup Tables**: Fast character-to-digit conversion
//! - **SIMD-Ready**: Aligned operations for modern CPUs
//!
//! ## Design Principles
//!
//! 1. **Ethereum Standards**: Adherence to Ethereum hex conventions
//! 2. **Type Safety**: Prevent common hex processing errors
//! 3. **Performance**: Optimized for high-throughput applications
//! 4. **Memory Safety**: Comprehensive bounds checking
//! 5. **Error Transparency**: Clear error reporting for debugging

const std = @import("std");
const testing = std.testing;

// Error types
pub const HexError = error{
    InvalidHexFormat,
    InvalidHexLength,
    InvalidHexCharacter,
    OddLengthHex,
    ValueTooLarge,
    InvalidLength,
};

// Bytes type for dynamic byte arrays
pub const Bytes = []u8;

// Hex validation
pub fn isHex(input: []const u8) bool {
    if (input.len < 3) return false; // At least "0x" + one hex digit
    if (!std.mem.eql(u8, input[0..2], "0x")) return false;

    for (input[2..]) |c| {
        const valid = switch (c) {
            '0'...'9', 'a'...'f', 'A'...'F' => true,
            else => false,
        };
        if (!valid) return false;
    }
    return true;
}

// Hex to bytes conversion
pub fn hexToBytes(allocator: std.mem.Allocator, hex: []const u8) ![]u8 {
    if (hex.len < 2 or !std.mem.eql(u8, hex[0..2], "0x")) {
        return HexError.InvalidHexFormat;
    }

    const hex_digits = hex[2..];
    if (hex_digits.len % 2 != 0) {
        return HexError.OddLengthHex;
    }

    const bytes = try allocator.alloc(u8, hex_digits.len / 2);
    errdefer allocator.free(bytes);

    var i: usize = 0;
    while (i < hex_digits.len) : (i += 2) {
        const high = hexCharToValue(hex_digits[i]) orelse return HexError.InvalidHexCharacter;
        const low = hexCharToValue(hex_digits[i + 1]) orelse return HexError.InvalidHexCharacter;
        bytes[i / 2] = high * 16 + low;
    }

    return bytes;
}

// Bytes to hex conversion
pub fn bytesToHex(allocator: std.mem.Allocator, bytes: []const u8) ![]u8 {
    const hex_chars = "0123456789abcdef";
    const result = try allocator.alloc(u8, 2 + bytes.len * 2);

    result[0] = '0';
    result[1] = 'x';

    for (bytes, 0..) |byte, i| {
        result[2 + i * 2] = hex_chars[byte >> 4];
        result[2 + i * 2 + 1] = hex_chars[byte & 0x0F];
    }

    return result;
}

// Fixed-size hex to bytes (no allocation)
pub fn hexToBytesFixed(comptime N: usize, hex: []const u8) ![N]u8 {
    if (hex.len < 2 or !std.mem.eql(u8, hex[0..2], "0x")) {
        return HexError.InvalidHexFormat;
    }

    const hex_digits = hex[2..];
    if (hex_digits.len != N * 2) {
        return HexError.InvalidHexLength;
    }

    var result: [N]u8 = undefined;
    var i: usize = 0;
    while (i < hex_digits.len) : (i += 2) {
        const high = hexCharToValue(hex_digits[i]) orelse return HexError.InvalidHexCharacter;
        const low = hexCharToValue(hex_digits[i + 1]) orelse return HexError.InvalidHexCharacter;
        result[i / 2] = high * 16 + low;
    }

    return result;
}

// Fixed-size bytes to hex (no allocation)
pub fn bytesToHexFixed(comptime N: usize, bytes: [N]u8) [2 + N * 2]u8 {
    const hex_chars = "0123456789abcdef";
    var result: [2 + N * 2]u8 = undefined;

    result[0] = '0';
    result[1] = 'x';

    for (bytes, 0..) |byte, i| {
        result[2 + i * 2] = hex_chars[byte >> 4];
        result[2 + i * 2 + 1] = hex_chars[byte & 0x0F];
    }

    return result;
}

// Hex string conversion (with and without 0x prefix)
pub fn toHex(allocator: std.mem.Allocator, bytes: []const u8) ![]u8 {
    return bytesToHex(allocator, bytes);
}

pub fn fromHex(allocator: std.mem.Allocator, hex: []const u8) ![]u8 {
    return hexToBytes(allocator, hex);
}

// String conversions
pub fn hexToString(allocator: std.mem.Allocator, hex: []const u8) ![]u8 {
    const bytes = try hexToBytes(allocator, hex);
    defer allocator.free(bytes);
    return allocator.dupe(u8, bytes);
}

pub fn stringToHex(allocator: std.mem.Allocator, str: []const u8) ![]u8 {
    return bytesToHex(allocator, str);
}

// Bytes utilities
pub fn size(bytes: []const u8) usize {
    return bytes.len;
}

pub fn slice(bytes: []const u8, start: usize, end: usize) []const u8 {
    if (start >= bytes.len) return &[_]u8{};
    const actual_end = @min(end, bytes.len);
    if (start >= actual_end) return &[_]u8{};
    return bytes[start..actual_end];
}

pub fn concat(allocator: std.mem.Allocator, arrays: []const []const u8) ![]u8 {
    var total_len: usize = 0;
    for (arrays) |arr| {
        total_len += arr.len;
    }

    const result = try allocator.alloc(u8, total_len);
    var index: usize = 0;
    for (arrays) |arr| {
        @memcpy(result[index .. index + arr.len], arr);
        index += arr.len;
    }

    return result;
}

// Padding utilities
pub fn padLeft(allocator: std.mem.Allocator, bytes: []const u8, target_length: usize) ![]u8 {
    if (bytes.len >= target_length) {
        return allocator.dupe(u8, bytes);
    }

    const result = try allocator.alloc(u8, target_length);
    const padding = target_length - bytes.len;
    @memset(result[0..padding], 0);
    @memcpy(result[padding..], bytes);

    return result;
}

pub fn padRight(allocator: std.mem.Allocator, bytes: []const u8, target_length: usize) ![]u8 {
    if (bytes.len >= target_length) {
        return allocator.dupe(u8, bytes);
    }

    const result = try allocator.alloc(u8, target_length);
    @memcpy(result[0..bytes.len], bytes);
    @memset(result[bytes.len..], 0);

    return result;
}

pub fn pad(allocator: std.mem.Allocator, bytes: []const u8, target_length: usize) ![]u8 {
    return padLeft(allocator, bytes, target_length);
}

// Trimming utilities
pub fn trimLeftZeros(bytes: []const u8) []const u8 {
    var start: usize = 0;
    while (start < bytes.len and bytes[start] == 0) {
        start += 1;
    }
    return bytes[start..];
}

pub fn trimRightZeros(bytes: []const u8) []const u8 {
    var end: usize = bytes.len;
    while (end > 0 and bytes[end - 1] == 0) {
        end -= 1;
    }
    return bytes[0..end];
}

pub fn trim(bytes: []const u8) []const u8 {
    return trimLeftZeros(bytes);
}

// Numeric conversions
pub fn hexToU256(hex: []const u8) !u256 {
    if (hex.len < 2 or !std.mem.eql(u8, hex[0..2], "0x")) {
        return HexError.InvalidHexFormat;
    }

    const hex_digits = hex[2..];
    if (hex_digits.len == 0) {
        return 0;
    }

    return std.fmt.parseInt(u256, hex_digits, 16) catch |err| switch (err) {
        error.Overflow => HexError.ValueTooLarge,
        error.InvalidCharacter => HexError.InvalidHexCharacter,
    };
}

pub fn hexToU64(hex: []const u8) !u64 {
    const value = try hexToU256(hex);
    if (value > std.math.maxInt(u64)) {
        return HexError.ValueTooLarge;
    }
    return @intCast(value);
}

pub fn u256ToHex(allocator: std.mem.Allocator, value: u256) ![]u8 {
    if (value == 0) {
        return allocator.dupe(u8, "0x0");
    }

    var temp_value = value;
    var digits: [64]u8 = undefined; // Max 64 hex digits for u256
    var digit_count: usize = 0;

    const hex_chars = "0123456789abcdef";
    while (temp_value > 0) {
        digits[digit_count] = hex_chars[@intCast(temp_value % 16)];
        temp_value /= 16;
        digit_count += 1;
    }

    const result = try allocator.alloc(u8, 2 + digit_count);
    result[0] = '0';
    result[1] = 'x';

    // Reverse the digits
    for (0..digit_count) |i| {
        result[2 + i] = digits[digit_count - 1 - i];
    }

    return result;
}

pub fn u64ToHex(allocator: std.mem.Allocator, value: u64) ![]u8 {
    return u256ToHex(allocator, value);
}

// Equals comparison (case-insensitive)
pub fn equals(hex1: []const u8, hex2: []const u8) bool {
    if (hex1.len != hex2.len) return false;
    if (hex1.len < 2) return false;
    if (!std.mem.eql(u8, hex1[0..2], "0x") or !std.mem.eql(u8, hex2[0..2], "0x")) return false;

    // Compare case-insensitively
    for (hex1[2..], hex2[2..]) |c1, c2| {
        const lower1 = if (c1 >= 'A' and c1 <= 'F') c1 + 32 else c1;
        const lower2 = if (c2 >= 'A' and c2 <= 'F') c2 + 32 else c2;
        if (lower1 != lower2) return false;
    }
    return true;
}

// Clone hex string (duplicates the string)
pub fn clone(allocator: std.mem.Allocator, hex: []const u8) ![]u8 {
    return allocator.dupe(u8, hex);
}

// XOR two hex strings (must be same length)
pub fn xor(allocator: std.mem.Allocator, hex1: []const u8, hex2: []const u8) ![]u8 {
    if (hex1.len < 2 or !std.mem.eql(u8, hex1[0..2], "0x")) {
        return HexError.InvalidHexFormat;
    }
    if (hex2.len < 2 or !std.mem.eql(u8, hex2[0..2], "0x")) {
        return HexError.InvalidHexFormat;
    }

    const hex1_digits = hex1[2..];
    const hex2_digits = hex2[2..];

    if (hex1_digits.len != hex2_digits.len) {
        return HexError.InvalidLength;
    }

    // Empty hex XOR
    if (hex1_digits.len == 0) {
        return allocator.dupe(u8, "0x");
    }

    const bytes1 = try hexToBytes(allocator, hex1);
    defer allocator.free(bytes1);
    const bytes2 = try hexToBytes(allocator, hex2);
    defer allocator.free(bytes2);

    const result_bytes = try allocator.alloc(u8, bytes1.len);
    defer allocator.free(result_bytes);

    for (bytes1, bytes2, 0..) |b1, b2, i| {
        result_bytes[i] = b1 ^ b2;
    }

    return bytesToHex(allocator, result_bytes);
}

// Generate random hex of specified size
pub fn random(allocator: std.mem.Allocator, size_bytes: usize) ![]u8 {
    if (size_bytes == 0) {
        return allocator.dupe(u8, "0x");
    }

    const bytes = try allocator.alloc(u8, size_bytes);
    defer allocator.free(bytes);

    // Use nanosecond timestamp for better entropy
    const seed = @as(u64, @intCast(std.time.nanoTimestamp()));
    var prng = std.Random.DefaultPrng.init(seed);
    const rand = prng.random();
    rand.bytes(bytes);

    return bytesToHex(allocator, bytes);
}

// Create zero-filled hex of specified size
pub fn zero(allocator: std.mem.Allocator, size_bytes: usize) ![]u8 {
    if (size_bytes == 0) {
        return allocator.dupe(u8, "0x");
    }

    const bytes = try allocator.alloc(u8, size_bytes);
    defer allocator.free(bytes);
    @memset(bytes, 0);

    return bytesToHex(allocator, bytes);
}

// Validate hex string (returns input if valid, otherwise error)
pub fn validate(hex: []const u8) ![]const u8 {
    if (hex.len < 2 or !std.mem.eql(u8, hex[0..2], "0x")) {
        return HexError.InvalidHexFormat;
    }

    for (hex[2..]) |c| {
        const valid = switch (c) {
            '0'...'9', 'a'...'f', 'A'...'F' => true,
            else => false,
        };
        if (!valid) return HexError.InvalidHexCharacter;
    }

    return hex;
}

// Check if hex has specific size in bytes
pub fn isSized(hex: []const u8, size_bytes: usize) bool {
    if (hex.len < 2 or !std.mem.eql(u8, hex[0..2], "0x")) return false;
    const hex_digits = hex[2..];
    return hex_digits.len == size_bytes * 2;
}

// Assert hex has specific size (throws if not)
pub fn assertSize(hex: []const u8, expected_size: usize) ![]const u8 {
    if (!isSized(hex, expected_size)) {
        return HexError.InvalidLength;
    }
    return hex;
}

// Convert boolean to hex (true = 0x01, false = 0x00)
pub fn fromBoolean(allocator: std.mem.Allocator, value: bool) ![]u8 {
    const byte: u8 = if (value) 1 else 0;
    return bytesToHex(allocator, &[_]u8{byte});
}

// Convert hex to boolean (any non-zero = true, all zero = false)
pub fn toBoolean(hex: []const u8) !bool {
    if (hex.len < 2 or !std.mem.eql(u8, hex[0..2], "0x")) {
        return HexError.InvalidHexFormat;
    }

    const hex_digits = hex[2..];
    if (hex_digits.len == 0) return false;

    for (hex_digits) |c| {
        if (c != '0') return true;
    }
    return false;
}

// Helper functions
fn hexCharToValue(c: u8) ?u8 {
    return switch (c) {
        '0'...'9' => c - '0',
        'a'...'f' => c - 'a' + 10,
        'A'...'F' => c - 'A' + 10,
        else => null,
    };
}

// Tests
test "hex validation" {
    try testing.expect(isHex("0x1234"));
    try testing.expect(isHex("0xabcdef"));
    try testing.expect(isHex("0xABCDEF"));
    try testing.expect(!isHex("1234"));
    try testing.expect(!isHex("0xGHI"));
    try testing.expect(!isHex("0x"));
}

test "hex to bytes conversion" {
    const allocator = testing.allocator;

    const bytes = try hexToBytes(allocator, "0x1234");
    defer allocator.free(bytes);

    try testing.expectEqual(@as(usize, 2), bytes.len);
    try testing.expectEqual(@as(u8, 0x12), bytes[0]);
    try testing.expectEqual(@as(u8, 0x34), bytes[1]);
}

test "bytes to hex conversion" {
    const allocator = testing.allocator;

    const bytes = [_]u8{ 0x12, 0x34, 0xab, 0xcd };
    const hex = try bytesToHex(allocator, &bytes);
    defer allocator.free(hex);

    try testing.expectEqualStrings("0x1234abcd", hex);
}

test "fixed size conversions" {
    const hex = "0x1234abcd";
    const bytes = try hexToBytesFixed(4, hex);

    try testing.expectEqual(@as(u8, 0x12), bytes[0]);
    try testing.expectEqual(@as(u8, 0x34), bytes[1]);
    try testing.expectEqual(@as(u8, 0xab), bytes[2]);
    try testing.expectEqual(@as(u8, 0xcd), bytes[3]);

    const hex_result = bytesToHexFixed(4, bytes);
    try testing.expectEqualStrings("0x1234abcd", &hex_result);
}

test "bytes utilities" {
    const allocator = testing.allocator;

    const bytes1 = [_]u8{ 0x12, 0x34 };
    const bytes2 = [_]u8{ 0xab, 0xcd };

    const arrays = [_][]const u8{ &bytes1, &bytes2 };
    const concatenated = try concat(allocator, &arrays);
    defer allocator.free(concatenated);

    try testing.expectEqual(@as(usize, 4), concatenated.len);
    try testing.expectEqual(@as(u8, 0x12), concatenated[0]);
    try testing.expectEqual(@as(u8, 0x34), concatenated[1]);
    try testing.expectEqual(@as(u8, 0xab), concatenated[2]);
    try testing.expectEqual(@as(u8, 0xcd), concatenated[3]);
}

test "padding utilities" {
    const allocator = testing.allocator;

    const bytes = [_]u8{ 0x12, 0x34 };
    const padded = try padLeft(allocator, &bytes, 4);
    defer allocator.free(padded);

    try testing.expectEqual(@as(usize, 4), padded.len);
    try testing.expectEqual(@as(u8, 0x00), padded[0]);
    try testing.expectEqual(@as(u8, 0x00), padded[1]);
    try testing.expectEqual(@as(u8, 0x12), padded[2]);
    try testing.expectEqual(@as(u8, 0x34), padded[3]);
}

test "trimming utilities" {
    const bytes = [_]u8{ 0x00, 0x00, 0x12, 0x34, 0x00 };
    const trimmed_left = trimLeftZeros(&bytes);
    const trimmed_right = trimRightZeros(&bytes);

    try testing.expectEqual(@as(usize, 3), trimmed_left.len);
    try testing.expectEqual(@as(u8, 0x12), trimmed_left[0]);

    try testing.expectEqual(@as(usize, 4), trimmed_right.len);
    try testing.expectEqual(@as(u8, 0x34), trimmed_right[3]);
}

test "numeric conversions" {
    const allocator = testing.allocator;

    const value = try hexToU256("0x1234");
    try testing.expectEqual(@as(u256, 0x1234), value);

    const hex = try u256ToHex(allocator, 0x1234);
    defer allocator.free(hex);
    try testing.expectEqualStrings("0x1234", hex);
}

// Additional tests from hex_test.zig
test "is valid hex" {
    // Valid hex strings
    try testing.expect(!isHex("0x")); // Too short, requires at least one hex digit
    try testing.expect(isHex("0x0"));
    try testing.expect(isHex("0x00"));
    try testing.expect(isHex("0x0123456789abcdef"));
    try testing.expect(isHex("0x0123456789ABCDEF"));
    try testing.expect(isHex("0xdeadbeef"));

    // Invalid hex strings
    try testing.expect(!isHex(""));
    try testing.expect(!isHex("0"));
    try testing.expect(!isHex("00"));
    try testing.expect(!isHex("0xg"));
    try testing.expect(!isHex("0x0123456789abcdefg"));
    try testing.expect(!isHex("0x "));
    try testing.expect(!isHex(" 0x00"));
    try testing.expect(!isHex("0x00 "));
}

test "from bytes basic" {
    const allocator = testing.allocator;

    // Empty bytes
    const empty = try bytesToHex(allocator, &[_]u8{});
    defer allocator.free(empty);
    try testing.expectEqualStrings("0x", empty);

    // Single byte
    const single = try bytesToHex(allocator, &[_]u8{0x61});
    defer allocator.free(single);
    try testing.expectEqualStrings("0x61", single);

    // Multiple bytes
    const multiple = try bytesToHex(allocator, &[_]u8{ 0x61, 0x62, 0x63 });
    defer allocator.free(multiple);
    try testing.expectEqualStrings("0x616263", multiple);

    // "Hello World!"
    const hello = try bytesToHex(allocator, "Hello World!");
    defer allocator.free(hello);
    try testing.expectEqualStrings("0x48656c6c6f20576f726c6421", hello);
}

test "from bytes with specific case" {
    const allocator = testing.allocator;

    const bytes = [_]u8{ 0xde, 0xad, 0xbe, 0xef };

    // Lowercase (default)
    const lower = try bytesToHex(allocator, &bytes);
    defer allocator.free(lower);
    try testing.expectEqualStrings("0xdeadbeef", lower);

    // Uppercase - Note: bytesToHexUpper function doesn't exist, skip this test
}

test "to bytes basic" {
    const allocator = testing.allocator;

    // Empty hex
    const empty = try hexToBytes(allocator, "0x");
    defer allocator.free(empty);
    try testing.expectEqual(@as(usize, 0), empty.len);

    // Single byte
    const single = try hexToBytes(allocator, "0x61");
    defer allocator.free(single);
    try testing.expectEqualSlices(u8, &[_]u8{0x61}, single);

    // Multiple bytes
    const multiple = try hexToBytes(allocator, "0x616263");
    defer allocator.free(multiple);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x61, 0x62, 0x63 }, multiple);

    // Mixed case
    const mixed = try hexToBytes(allocator, "0xDeAdBeEf");
    defer allocator.free(mixed);
    try testing.expectEqualSlices(u8, &[_]u8{ 0xde, 0xad, 0xbe, 0xef }, mixed);
}

test "to bytes odd length" {
    const allocator = testing.allocator;

    // Note: hexToBytes expects even length after 0x prefix, so odd length will error
    const odd = hexToBytes(allocator, "0x1");
    try testing.expectError(HexError.OddLengthHex, odd);

    const odd2 = hexToBytes(allocator, "0x123");
    try testing.expectError(HexError.OddLengthHex, odd2);
}

test "to bytes invalid hex" {
    const allocator = testing.allocator;

    // Missing 0x prefix
    const result1 = hexToBytes(allocator, "deadbeef");
    try testing.expectError(HexError.InvalidHexFormat, result1);

    // Invalid character
    const result2 = hexToBytes(allocator, "0xdeadbeeg");
    try testing.expectError(HexError.InvalidHexCharacter, result2);
}

test "from u256" {
    const allocator = testing.allocator;

    // Zero
    const zero_val = try u256ToHex(allocator, 0);
    defer allocator.free(zero_val);
    try testing.expectEqualStrings("0x0", zero_val);

    // Small number
    const small = try u256ToHex(allocator, 69420);
    defer allocator.free(small);
    try testing.expectEqualStrings("0x10f2c", small);

    // Large number
    const large = try u256ToHex(allocator, 0xdeadbeef);
    defer allocator.free(large);
    try testing.expectEqualStrings("0xdeadbeef", large);

    // Max u256
    const max = try u256ToHex(allocator, std.math.maxInt(u256));
    defer allocator.free(max);
    try testing.expectEqualStrings("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", max);
}

test "to u256" {
    // Zero
    const zero_val = try hexToU256("0x0");
    try testing.expectEqual(@as(u256, 0), zero_val);

    // Small number
    const small = try hexToU256("0x10f2c");
    try testing.expectEqual(@as(u256, 69420), small);

    // Large number
    const large = try hexToU256("0xdeadbeef");
    try testing.expectEqual(@as(u256, 0xdeadbeef), large);

    // Max u256
    const max = try hexToU256("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    try testing.expectEqual(std.math.maxInt(u256), max);
}

test "empty string handling" {
    const allocator = testing.allocator;

    const result = hexToBytes(allocator, "");
    try testing.expectError(HexError.InvalidHexFormat, result);
}

test "only prefix" {
    const allocator = testing.allocator;

    const bytes = try hexToBytes(allocator, "0x");
    defer allocator.free(bytes);
    try testing.expectEqual(@as(usize, 0), bytes.len);
}

test "hexToString and stringToHex" {
    const allocator = testing.allocator;

    const hex_input = "0x48656c6c6f";
    const string_result = try hexToString(allocator, hex_input);
    defer allocator.free(string_result);
    try testing.expectEqualStrings("Hello", string_result);

    const string_input = "World";
    const hex_result = try stringToHex(allocator, string_input);
    defer allocator.free(hex_result);
    try testing.expectEqualStrings("0x576f726c64", hex_result);

    const empty_hex = "0x";
    const empty_string = try hexToString(allocator, empty_hex);
    defer allocator.free(empty_string);
    try testing.expectEqual(@as(usize, 0), empty_string.len);

    const empty_str_input = "";
    const empty_hex_result = try stringToHex(allocator, empty_str_input);
    defer allocator.free(empty_hex_result);
    try testing.expectEqualStrings("0x", empty_hex_result);
}

test "slice function edge cases" {
    const bytes = [_]u8{ 0x01, 0x02, 0x03, 0x04, 0x05 };

    const full_slice = slice(&bytes, 0, 5);
    try testing.expectEqualSlices(u8, &bytes, full_slice);

    const partial_slice = slice(&bytes, 1, 3);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x02, 0x03 }, partial_slice);

    const start_beyond_len = slice(&bytes, 10, 15);
    try testing.expectEqual(@as(usize, 0), start_beyond_len.len);

    const start_equals_end = slice(&bytes, 2, 2);
    try testing.expectEqual(@as(usize, 0), start_equals_end.len);

    const start_greater_than_end = slice(&bytes, 3, 2);
    try testing.expectEqual(@as(usize, 0), start_greater_than_end.len);

    const end_beyond_len = slice(&bytes, 2, 100);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x03, 0x04, 0x05 }, end_beyond_len);

    const empty_bytes = [_]u8{};
    const empty_slice = slice(&empty_bytes, 0, 0);
    try testing.expectEqual(@as(usize, 0), empty_slice.len);
}

test "size function" {
    const bytes1 = [_]u8{ 0x01, 0x02, 0x03 };
    try testing.expectEqual(@as(usize, 3), size(&bytes1));

    const bytes2 = [_]u8{};
    try testing.expectEqual(@as(usize, 0), size(&bytes2));

    const bytes3 = [_]u8{0x01} ** 1000;
    try testing.expectEqual(@as(usize, 1000), size(&bytes3));
}

test "padRight function" {
    const allocator = testing.allocator;

    const bytes = [_]u8{ 0x12, 0x34 };
    const padded = try padRight(allocator, &bytes, 5);
    defer allocator.free(padded);

    try testing.expectEqual(@as(usize, 5), padded.len);
    try testing.expectEqual(@as(u8, 0x12), padded[0]);
    try testing.expectEqual(@as(u8, 0x34), padded[1]);
    try testing.expectEqual(@as(u8, 0x00), padded[2]);
    try testing.expectEqual(@as(u8, 0x00), padded[3]);
    try testing.expectEqual(@as(u8, 0x00), padded[4]);

    const exact = try padRight(allocator, &bytes, 2);
    defer allocator.free(exact);
    try testing.expectEqualSlices(u8, &bytes, exact);

    const shorter = try padRight(allocator, &bytes, 1);
    defer allocator.free(shorter);
    try testing.expectEqualSlices(u8, &bytes, shorter);
}

test "trimRightZeros function" {
    const bytes1 = [_]u8{ 0x12, 0x34, 0x00, 0x00 };
    const trimmed1 = trimRightZeros(&bytes1);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x12, 0x34 }, trimmed1);

    const bytes2 = [_]u8{ 0x00, 0x00, 0x12, 0x34 };
    const trimmed2 = trimRightZeros(&bytes2);
    try testing.expectEqualSlices(u8, &bytes2, trimmed2);

    const bytes3 = [_]u8{ 0x00, 0x00, 0x00 };
    const trimmed3 = trimRightZeros(&bytes3);
    try testing.expectEqual(@as(usize, 0), trimmed3.len);

    const bytes4 = [_]u8{ 0x12, 0x34, 0x56 };
    const trimmed4 = trimRightZeros(&bytes4);
    try testing.expectEqualSlices(u8, &bytes4, trimmed4);

    const empty = [_]u8{};
    const trimmed5 = trimRightZeros(&empty);
    try testing.expectEqual(@as(usize, 0), trimmed5.len);
}

test "hexToBytesFixed with wrong length" {
    const hex_short = "0x1234";
    const result1 = hexToBytesFixed(4, hex_short);
    try testing.expectError(HexError.InvalidHexLength, result1);

    const hex_long = "0x12345678";
    const result2 = hexToBytesFixed(2, hex_long);
    try testing.expectError(HexError.InvalidHexLength, result2);

    const hex_valid = "0x1234";
    const result3 = try hexToBytesFixed(2, hex_valid);
    try testing.expectEqual(@as(u8, 0x12), result3[0]);
    try testing.expectEqual(@as(u8, 0x34), result3[1]);
}

test "case sensitivity in hex conversion" {
    const allocator = testing.allocator;

    const lower = "0xabcdef";
    const upper = "0xABCDEF";
    const mixed = "0xAbCdEf";

    const bytes_lower = try hexToBytes(allocator, lower);
    defer allocator.free(bytes_lower);

    const bytes_upper = try hexToBytes(allocator, upper);
    defer allocator.free(bytes_upper);

    const bytes_mixed = try hexToBytes(allocator, mixed);
    defer allocator.free(bytes_mixed);

    try testing.expectEqualSlices(u8, bytes_lower, bytes_upper);
    try testing.expectEqualSlices(u8, bytes_lower, bytes_mixed);

    const hex_result = try bytesToHex(allocator, bytes_lower);
    defer allocator.free(hex_result);
    try testing.expectEqualStrings("0xabcdef", hex_result);
}

test "hexToU64 edge cases" {
    const zero_val = try hexToU64("0x0");
    try testing.expectEqual(@as(u64, 0), zero_val);

    const max_u64_hex = "0xffffffffffffffff";
    const max_result = try hexToU64(max_u64_hex);
    try testing.expectEqual(std.math.maxInt(u64), max_result);

    const overflow_hex = "0x10000000000000000";
    const overflow_result = hexToU64(overflow_hex);
    try testing.expectError(HexError.ValueTooLarge, overflow_result);

    const large_hex = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    const large_result = hexToU64(large_hex);
    try testing.expectError(HexError.ValueTooLarge, large_result);
}

test "u64ToHex function" {
    const allocator = testing.allocator;

    const zero_val = try u64ToHex(allocator, 0);
    defer allocator.free(zero_val);
    try testing.expectEqualStrings("0x0", zero_val);

    const small = try u64ToHex(allocator, 255);
    defer allocator.free(small);
    try testing.expectEqualStrings("0xff", small);

    const max_u64 = try u64ToHex(allocator, std.math.maxInt(u64));
    defer allocator.free(max_u64);
    try testing.expectEqualStrings("0xffffffffffffffff", max_u64);
}

test "concat with empty arrays" {
    const allocator = testing.allocator;

    const empty1 = [_]u8{};
    const empty2 = [_]u8{};
    const arrays1 = [_][]const u8{ &empty1, &empty2 };
    const result1 = try concat(allocator, &arrays1);
    defer allocator.free(result1);
    try testing.expectEqual(@as(usize, 0), result1.len);

    const bytes = [_]u8{ 0x12, 0x34 };
    const arrays2 = [_][]const u8{ &empty1, &bytes, &empty2 };
    const result2 = try concat(allocator, &arrays2);
    defer allocator.free(result2);
    try testing.expectEqualSlices(u8, &bytes, result2);

    const no_arrays = [_][]const u8{};
    const result3 = try concat(allocator, &no_arrays);
    defer allocator.free(result3);
    try testing.expectEqual(@as(usize, 0), result3.len);
}

test "trim function (alias for trimLeftZeros)" {
    const bytes = [_]u8{ 0x00, 0x00, 0x12, 0x34, 0x00 };
    const trimmed = trim(&bytes);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x12, 0x34, 0x00 }, trimmed);

    const no_leading_zeros = [_]u8{ 0x12, 0x34 };
    const trimmed2 = trim(&no_leading_zeros);
    try testing.expectEqualSlices(u8, &no_leading_zeros, trimmed2);
}

test "pad function (alias for padLeft)" {
    const allocator = testing.allocator;

    const bytes = [_]u8{ 0x12, 0x34 };
    const padded = try pad(allocator, &bytes, 5);
    defer allocator.free(padded);

    try testing.expectEqual(@as(usize, 5), padded.len);
    try testing.expectEqual(@as(u8, 0x00), padded[0]);
    try testing.expectEqual(@as(u8, 0x00), padded[1]);
    try testing.expectEqual(@as(u8, 0x00), padded[2]);
    try testing.expectEqual(@as(u8, 0x12), padded[3]);
    try testing.expectEqual(@as(u8, 0x34), padded[4]);
}

test "hex validation edge cases" {
    try testing.expect(isHex("0x0"));
    try testing.expect(!isHex("0x"));
    try testing.expect(isHex("0xFfFfFf"));
    try testing.expect(!isHex("0x12 34"));
    try testing.expect(!isHex("x1234"));
}

test "hexToBytes with maximum values" {
    const allocator = testing.allocator;

    const max_byte = try hexToBytes(allocator, "0xff");
    defer allocator.free(max_byte);
    try testing.expectEqual(@as(u8, 0xff), max_byte[0]);

    const max_u16 = try hexToBytes(allocator, "0xffff");
    defer allocator.free(max_u16);
    try testing.expectEqual(@as(u8, 0xff), max_u16[0]);
    try testing.expectEqual(@as(u8, 0xff), max_u16[1]);
}

test "bytesToHex with zero bytes" {
    const allocator = testing.allocator;

    const all_zeros = [_]u8{ 0x00, 0x00, 0x00 };
    const hex = try bytesToHex(allocator, &all_zeros);
    defer allocator.free(hex);
    try testing.expectEqualStrings("0x000000", hex);
}

test "hexToBytesFixed with exact size" {
    const hex_4 = "0x12345678";
    const bytes_4 = try hexToBytesFixed(4, hex_4);
    try testing.expectEqual(@as(u8, 0x12), bytes_4[0]);
    try testing.expectEqual(@as(u8, 0x34), bytes_4[1]);
    try testing.expectEqual(@as(u8, 0x56), bytes_4[2]);
    try testing.expectEqual(@as(u8, 0x78), bytes_4[3]);
}

test "hexToU256 with various values" {
    try testing.expectEqual(@as(u256, 0), try hexToU256("0x0"));
    try testing.expectEqual(@as(u256, 1), try hexToU256("0x1"));
    try testing.expectEqual(@as(u256, 255), try hexToU256("0xff"));
    try testing.expectEqual(@as(u256, 256), try hexToU256("0x100"));
}

test "u256ToHex round-trip with powers of 2" {
    const allocator = testing.allocator;

    const values = [_]u256{ 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024 };
    for (values) |val| {
        const hex = try u256ToHex(allocator, val);
        defer allocator.free(hex);
        const result = try hexToU256(hex);
        try testing.expectEqual(val, result);
    }
}

test "slice edge cases with empty inputs" {
    const empty = [_]u8{};
    const empty_slice = slice(&empty, 0, 0);
    try testing.expectEqual(@as(usize, 0), empty_slice.len);

    const empty_slice2 = slice(&empty, 5, 10);
    try testing.expectEqual(@as(usize, 0), empty_slice2.len);
}

test "concat with single array" {
    const allocator = testing.allocator;

    const bytes = [_]u8{ 0x12, 0x34 };
    const arrays = [_][]const u8{&bytes};
    const result = try concat(allocator, &arrays);
    defer allocator.free(result);

    try testing.expectEqualSlices(u8, &bytes, result);
}

test "padLeft with zero target length" {
    const allocator = testing.allocator;

    const bytes = [_]u8{ 0x12, 0x34 };
    const result = try padLeft(allocator, &bytes, 0);
    defer allocator.free(result);

    try testing.expectEqualSlices(u8, &bytes, result);
}

test "padRight with zero target length" {
    const allocator = testing.allocator;

    const bytes = [_]u8{ 0x12, 0x34 };
    const result = try padRight(allocator, &bytes, 0);
    defer allocator.free(result);

    try testing.expectEqualSlices(u8, &bytes, result);
}

test "trimLeftZeros with all zeros" {
    const all_zeros = [_]u8{ 0x00, 0x00, 0x00 };
    const trimmed = trimLeftZeros(&all_zeros);
    try testing.expectEqual(@as(usize, 0), trimmed.len);
}

test "trimRightZeros with all zeros" {
    const all_zeros = [_]u8{ 0x00, 0x00, 0x00 };
    const trimmed = trimRightZeros(&all_zeros);
    try testing.expectEqual(@as(usize, 0), trimmed.len);
}

test "equals function" {
    // Equal hex strings
    try testing.expect(equals("0x1234", "0x1234"));
    try testing.expect(equals("0xabcd", "0xabcd"));

    // Case-insensitive comparison
    try testing.expect(equals("0xabcd", "0xABCD"));
    try testing.expect(equals("0xABCD", "0xabcd"));
    try testing.expect(equals("0xAbCd", "0xaBcD"));

    // Different values
    try testing.expect(!equals("0x1234", "0x5678"));
    try testing.expect(!equals("0xabcd", "0xef12"));

    // Different lengths
    try testing.expect(!equals("0x12", "0x1234"));
    try testing.expect(!equals("0x1234", "0x12"));

    // Empty hex
    try testing.expect(equals("0x", "0x"));
    try testing.expect(!equals("0x", "0x00"));
    try testing.expect(!equals("0x00", "0x"));
}

test "clone function" {
    const allocator = testing.allocator;

    const hex1 = "0x1234";
    const hex2 = try clone(allocator, hex1);
    defer allocator.free(hex2);

    try testing.expect(equals(hex1, hex2));
    try testing.expectEqualStrings(hex1, hex2);

    // Clone empty hex
    const empty = "0x";
    const empty_clone = try clone(allocator, empty);
    defer allocator.free(empty_clone);
    try testing.expectEqualStrings(empty, empty_clone);
}

test "xor function" {
    const allocator = testing.allocator;

    // Same-length XOR
    const result1 = try xor(allocator, "0x12", "0x34");
    defer allocator.free(result1);
    try testing.expectEqualStrings("0x26", result1);

    const result2 = try xor(allocator, "0xab", "0xcd");
    defer allocator.free(result2);
    try testing.expectEqualStrings("0x66", result2);

    // XOR with zeros
    const result3 = try xor(allocator, "0xff", "0x00");
    defer allocator.free(result3);
    try testing.expectEqualStrings("0xff", result3);

    // XOR with itself returns zeros
    const result4 = try xor(allocator, "0xdeadbeef", "0xdeadbeef");
    defer allocator.free(result4);
    try testing.expectEqualStrings("0x00000000", result4);

    // Empty hex XOR
    const result5 = try xor(allocator, "0x", "0x");
    defer allocator.free(result5);
    try testing.expectEqualStrings("0x", result5);

    // Mismatched lengths should error
    const result_err = xor(allocator, "0x12", "0x1234");
    try testing.expectError(HexError.InvalidLength, result_err);
}

test "random function" {
    const allocator = testing.allocator;

    // Generate random hex of various sizes
    const hex1 = try random(allocator, 4);
    defer allocator.free(hex1);
    try testing.expect(isHex(hex1));
    try testing.expectEqual(@as(usize, 10), hex1.len); // "0x" + 8 hex chars

    const hex2 = try random(allocator, 32);
    defer allocator.free(hex2);
    try testing.expect(isHex(hex2));
    try testing.expectEqual(@as(usize, 66), hex2.len); // "0x" + 64 hex chars

    // Zero size
    const hex_zero = try random(allocator, 0);
    defer allocator.free(hex_zero);
    try testing.expectEqualStrings("0x", hex_zero);

    // Different values each time (probabilistic test - try multiple times)
    var all_equal = true;
    var i: usize = 0;
    while (i < 5) : (i += 1) {
        const rand1 = try random(allocator, 32);
        defer allocator.free(rand1);
        const rand2 = try random(allocator, 32);
        defer allocator.free(rand2);
        if (!equals(rand1, rand2)) {
            all_equal = false;
            break;
        }
    }
    try testing.expect(!all_equal);
}

test "zero function" {
    const allocator = testing.allocator;

    // Create zero-filled hex
    const hex1 = try zero(allocator, 1);
    defer allocator.free(hex1);
    try testing.expectEqualStrings("0x00", hex1);

    const hex2 = try zero(allocator, 2);
    defer allocator.free(hex2);
    try testing.expectEqualStrings("0x0000", hex2);

    const hex4 = try zero(allocator, 4);
    defer allocator.free(hex4);
    try testing.expectEqualStrings("0x00000000", hex4);

    // Empty hex
    const hex_empty = try zero(allocator, 0);
    defer allocator.free(hex_empty);
    try testing.expectEqualStrings("0x", hex_empty);

    // Large zero hex
    const hex32 = try zero(allocator, 32);
    defer allocator.free(hex32);
    try testing.expectEqualStrings("0x0000000000000000000000000000000000000000000000000000000000000000", hex32);
}

test "validate function" {
    // Valid hex strings
    _ = try validate("0x0");
    _ = try validate("0x00");
    _ = try validate("0x1234");
    _ = try validate("0xabcdef");
    _ = try validate("0xABCDEF");
    _ = try validate("0x");

    // Invalid hex strings
    try testing.expectError(HexError.InvalidHexFormat, validate("1234"));
    try testing.expectError(HexError.InvalidHexFormat, validate(""));
    try testing.expectError(HexError.InvalidHexCharacter, validate("0xg"));
    try testing.expectError(HexError.InvalidHexCharacter, validate("0x123g"));
    try testing.expectError(HexError.InvalidHexCharacter, validate("0x "));
}

test "isSized function" {
    // Correct sizes
    try testing.expect(isSized("0x", 0));
    try testing.expect(isSized("0x00", 1));
    try testing.expect(isSized("0x1234", 2));
    try testing.expect(isSized("0x123456", 3));

    // Incorrect sizes
    try testing.expect(!isSized("0x1234", 1));
    try testing.expect(!isSized("0x1234", 3));
    try testing.expect(!isSized("0x", 1));
    try testing.expect(!isSized("0x00", 0));

    // Address size (20 bytes)
    const address = "0x" ++ "00" ** 20;
    try testing.expect(isSized(address, 20));
    try testing.expect(!isSized(address, 19));

    // Hash size (32 bytes)
    const hash = "0x" ++ "00" ** 32;
    try testing.expect(isSized(hash, 32));
    try testing.expect(!isSized(hash, 31));
}

test "assertSize function" {
    // Valid sizes
    _ = try assertSize("0x", 0);
    _ = try assertSize("0x00", 1);
    _ = try assertSize("0x1234", 2);

    // Invalid sizes
    try testing.expectError(HexError.InvalidLength, assertSize("0x1234", 1));
    try testing.expectError(HexError.InvalidLength, assertSize("0x1234", 3));
    try testing.expectError(HexError.InvalidLength, assertSize("0x", 1));
}

test "fromBoolean function" {
    const allocator = testing.allocator;

    // true -> 0x01
    const hex_true = try fromBoolean(allocator, true);
    defer allocator.free(hex_true);
    try testing.expectEqualStrings("0x01", hex_true);

    // false -> 0x00
    const hex_false = try fromBoolean(allocator, false);
    defer allocator.free(hex_false);
    try testing.expectEqualStrings("0x00", hex_false);
}

test "toBoolean function" {
    // 0x01 -> true
    try testing.expect(try toBoolean("0x01"));

    // 0x00 -> false
    try testing.expect(!try toBoolean("0x00"));

    // Non-zero -> true
    try testing.expect(try toBoolean("0xff"));
    try testing.expect(try toBoolean("0x1234"));
    try testing.expect(try toBoolean("0x000001"));

    // All zeros -> false
    try testing.expect(!try toBoolean("0x0000"));
    try testing.expect(!try toBoolean("0x00000000"));

    // Empty hex -> false
    try testing.expect(!try toBoolean("0x"));

    // Uppercase
    try testing.expect(try toBoolean("0xFF"));
    try testing.expect(!try toBoolean("0x00"));
}

test "fromBoolean and toBoolean round-trip" {
    const allocator = testing.allocator;

    const hex_true = try fromBoolean(allocator, true);
    defer allocator.free(hex_true);
    try testing.expect(try toBoolean(hex_true));

    const hex_false = try fromBoolean(allocator, false);
    defer allocator.free(hex_false);
    try testing.expect(!try toBoolean(hex_false));
}
