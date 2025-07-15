// Hex and bytes utilities for Ethereum
// Provides comprehensive hex/bytes conversion, validation, and manipulation functions

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
pub fn is_hex(input: []const u8) bool {
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
pub fn hex_to_bytes(allocator: std.mem.Allocator, hex: []const u8) ![]u8 {
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
        const high = hex_char_to_value(hex_digits[i]) orelse return HexError.InvalidHexCharacter;
        const low = hex_char_to_value(hex_digits[i + 1]) orelse return HexError.InvalidHexCharacter;
        bytes[i / 2] = high * 16 + low;
    }

    return bytes;
}

// Bytes to hex conversion
pub fn bytes_to_hex(allocator: std.mem.Allocator, bytes: []const u8) ![]u8 {
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
pub fn hex_to_bytes_fixed(comptime N: usize, hex: []const u8) ![N]u8 {
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
        const high = hex_char_to_value(hex_digits[i]) orelse return HexError.InvalidHexCharacter;
        const low = hex_char_to_value(hex_digits[i + 1]) orelse return HexError.InvalidHexCharacter;
        result[i / 2] = high * 16 + low;
    }

    return result;
}

// Fixed-size bytes to hex (no allocation)
pub fn bytes_to_hex_fixed(comptime N: usize, bytes: [N]u8) [2 + N * 2]u8 {
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
pub fn to_hex(allocator: std.mem.Allocator, bytes: []const u8) ![]u8 {
    return bytes_to_hex(allocator, bytes);
}

pub fn from_hex(allocator: std.mem.Allocator, hex: []const u8) ![]u8 {
    return hex_to_bytes(allocator, hex);
}

// String conversions
pub fn hex_to_string(allocator: std.mem.Allocator, hex: []const u8) ![]u8 {
    const bytes = try hex_to_bytes(allocator, hex);
    defer allocator.free(bytes);
    return allocator.dupe(u8, bytes);
}

pub fn string_to_hex(allocator: std.mem.Allocator, str: []const u8) ![]u8 {
    return bytes_to_hex(allocator, str);
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
pub fn pad_left(allocator: std.mem.Allocator, bytes: []const u8, target_length: usize) ![]u8 {
    if (bytes.len >= target_length) {
        return allocator.dupe(u8, bytes);
    }

    const result = try allocator.alloc(u8, target_length);
    const padding = target_length - bytes.len;
    @memset(result[0..padding], 0);
    @memcpy(result[padding..], bytes);

    return result;
}

pub fn pad_right(allocator: std.mem.Allocator, bytes: []const u8, target_length: usize) ![]u8 {
    if (bytes.len >= target_length) {
        return allocator.dupe(u8, bytes);
    }

    const result = try allocator.alloc(u8, target_length);
    @memcpy(result[0..bytes.len], bytes);
    @memset(result[bytes.len..], 0);

    return result;
}

pub fn pad(allocator: std.mem.Allocator, bytes: []const u8, target_length: usize) ![]u8 {
    return pad_left(allocator, bytes, target_length);
}

// Trimming utilities
pub fn trim_left_zeros(bytes: []const u8) []const u8 {
    var start: usize = 0;
    while (start < bytes.len and bytes[start] == 0) {
        start += 1;
    }
    return bytes[start..];
}

pub fn trim_right_zeros(bytes: []const u8) []const u8 {
    var end: usize = bytes.len;
    while (end > 0 and bytes[end - 1] == 0) {
        end -= 1;
    }
    return bytes[0..end];
}

pub fn trim(bytes: []const u8) []const u8 {
    return trim_left_zeros(bytes);
}

// Numeric conversions
pub fn hex_to_u256(hex: []const u8) !u256 {
    if (hex.len < 2 or !std.mem.eql(u8, hex[0..2], "0x")) {
        return HexError.InvalidHexFormat;
    }

    const hex_digits = hex[2..];
    if (hex_digits.len == 0) {
        return 0;
    }

    var result: u256 = 0;
    for (hex_digits) |c| {
        const digit = hex_char_to_value(c) orelse return HexError.InvalidHexCharacter;
        result = result * 16 + digit;
    }

    return result;
}

pub fn hex_to_u64(hex: []const u8) !u64 {
    const value = try hex_to_u256(hex);
    if (value > std.math.maxInt(u64)) {
        return HexError.ValueTooLarge;
    }
    return @intCast(value);
}

pub fn u256_to_hex(allocator: std.mem.Allocator, value: u256) ![]u8 {
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

pub fn u64_to_hex(allocator: std.mem.Allocator, value: u64) ![]u8 {
    return u256_to_hex(allocator, value);
}

// Helper functions
fn hex_char_to_value(c: u8) ?u8 {
    return switch (c) {
        '0'...'9' => c - '0',
        'a'...'f' => c - 'a' + 10,
        'A'...'F' => c - 'A' + 10,
        else => null,
    };
}

// Tests
test "hex validation" {
    try testing.expect(is_hex("0x1234"));
    try testing.expect(is_hex("0xabcdef"));
    try testing.expect(is_hex("0xABCDEF"));
    try testing.expect(!is_hex("1234"));
    try testing.expect(!is_hex("0xGHI"));
    try testing.expect(!is_hex("0x"));
}

test "hex to bytes conversion" {
    const allocator = testing.allocator;

    const bytes = try hex_to_bytes(allocator, "0x1234");
    defer allocator.free(bytes);

    try testing.expectEqual(@as(usize, 2), bytes.len);
    try testing.expectEqual(@as(u8, 0x12), bytes[0]);
    try testing.expectEqual(@as(u8, 0x34), bytes[1]);
}

test "bytes to hex conversion" {
    const allocator = testing.allocator;

    const bytes = [_]u8{ 0x12, 0x34, 0xab, 0xcd };
    const hex = try bytes_to_hex(allocator, &bytes);
    defer allocator.free(hex);

    try testing.expectEqualStrings("0x1234abcd", hex);
}

test "fixed size conversions" {
    const hex = "0x1234abcd";
    const bytes = try hex_to_bytes_fixed(4, hex);

    try testing.expectEqual(@as(u8, 0x12), bytes[0]);
    try testing.expectEqual(@as(u8, 0x34), bytes[1]);
    try testing.expectEqual(@as(u8, 0xab), bytes[2]);
    try testing.expectEqual(@as(u8, 0xcd), bytes[3]);

    const hex_result = bytes_to_hex_fixed(4, bytes);
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
    const padded = try pad_left(allocator, &bytes, 4);
    defer allocator.free(padded);

    try testing.expectEqual(@as(usize, 4), padded.len);
    try testing.expectEqual(@as(u8, 0x00), padded[0]);
    try testing.expectEqual(@as(u8, 0x00), padded[1]);
    try testing.expectEqual(@as(u8, 0x12), padded[2]);
    try testing.expectEqual(@as(u8, 0x34), padded[3]);
}

test "trimming utilities" {
    const bytes = [_]u8{ 0x00, 0x00, 0x12, 0x34, 0x00 };
    const trimmed_left = trim_left_zeros(&bytes);
    const trimmed_right = trim_right_zeros(&bytes);

    try testing.expectEqual(@as(usize, 3), trimmed_left.len);
    try testing.expectEqual(@as(u8, 0x12), trimmed_left[0]);

    try testing.expectEqual(@as(usize, 4), trimmed_right.len);
    try testing.expectEqual(@as(u8, 0x34), trimmed_right[3]);
}

test "numeric conversions" {
    const allocator = testing.allocator;

    const value = try hex_to_u256("0x1234");
    try testing.expectEqual(@as(u256, 0x1234), value);

    const hex = try u256_to_hex(allocator, 0x1234);
    defer allocator.free(hex);
    try testing.expectEqualStrings("0x1234", hex);
}
