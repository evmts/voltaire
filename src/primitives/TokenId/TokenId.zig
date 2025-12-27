//! TokenId - ERC-721 NFT Token Identifier
//!
//! A token ID uniquely identifies an NFT within an ERC-721 contract.
//! Token IDs are uint256 values ranging from 0 to 2^256 - 1.
//!
//! ## Design
//! - Stored as u256 (full range as per ERC-721 spec)
//! - Provides conversion to/from hex, number for compatibility
//! - Supports comparison and equality operations
//!
//! ## Usage
//! ```zig
//! const token_id = TokenId.from(42);
//! const hex = token_id.toHex();
//! const equal = token_id.equals(TokenId.from(42));
//! ```
//!
//! @see https://eips.ethereum.org/EIPS/eip-721

const std = @import("std");

/// TokenId type - u256 representing ERC-721 token identifier
pub const TokenId = u256;

/// Maximum TokenId value (2^256 - 1)
pub const MAX: TokenId = std.math.maxInt(u256);

/// Minimum TokenId value (0)
pub const MIN: TokenId = 0;

/// Create TokenId from u256 value
///
/// @param value - u256 value
/// @returns TokenId
pub fn from(value: u256) TokenId {
    return value;
}

/// Create TokenId from u64 value (common for smaller token IDs)
///
/// @param value - u64 value
/// @returns TokenId
pub fn fromNumber(value: u64) TokenId {
    return value;
}

/// Create TokenId from hex string (with or without 0x prefix)
///
/// @param hex_str - hex string
/// @returns TokenId or error
pub fn fromHex(hex_str: []const u8) !TokenId {
    var slice = hex_str;
    if (slice.len >= 2 and slice[0] == '0' and (slice[1] == 'x' or slice[1] == 'X')) {
        slice = slice[2..];
    }

    if (slice.len == 0) return 0;
    if (slice.len > 64) return error.ValueTooLarge;

    var result: u256 = 0;
    for (slice) |c| {
        const digit: u8 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return error.InvalidHexCharacter,
        };
        result = result * 16 + digit;
    }
    return result;
}

/// Check if two token IDs are equal
pub fn equals(self: TokenId, other: TokenId) bool {
    return self == other;
}

/// Compare two token IDs
/// Returns -1 if self < other, 0 if equal, 1 if self > other
pub fn compare(self: TokenId, other: TokenId) i8 {
    if (self < other) return -1;
    if (self > other) return 1;
    return 0;
}

/// Convert TokenId to u64 (truncates if value exceeds u64 max)
///
/// @param self - TokenId
/// @returns u64
pub fn toNumber(self: TokenId) u64 {
    return @truncate(self);
}

/// Convert TokenId to u256
///
/// @param self - TokenId
/// @returns u256
pub fn toBigInt(self: TokenId) u256 {
    return self;
}

/// Convert TokenId to hex string (lowercase with 0x prefix)
/// Returns a fixed 66-byte array (0x + 64 hex chars)
///
/// @param self - TokenId
/// @returns [66]u8
pub fn toHex(self: TokenId) [66]u8 {
    const hex_chars = "0123456789abcdef";
    var result: [66]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';

    var value = self;
    var i: usize = 65;
    while (i >= 2) : (i -= 1) {
        result[i] = hex_chars[@as(usize, @truncate(value & 0xf))];
        value >>= 4;
    }
    return result;
}

/// Convert TokenId to minimal hex string (without leading zeros)
/// Allocates memory for result
pub fn toHexMinimal(allocator: std.mem.Allocator, self: TokenId) ![]u8 {
    if (self == 0) {
        const result = try allocator.alloc(u8, 3);
        result[0] = '0';
        result[1] = 'x';
        result[2] = '0';
        return result;
    }

    // Count significant hex digits
    var temp = self;
    var digits: usize = 0;
    while (temp > 0) : (temp >>= 4) {
        digits += 1;
    }

    const result = try allocator.alloc(u8, 2 + digits);
    result[0] = '0';
    result[1] = 'x';

    const hex_chars = "0123456789abcdef";
    temp = self;
    var i: usize = 2 + digits - 1;
    while (i >= 2) : (i -= 1) {
        result[i] = hex_chars[@as(usize, @truncate(temp & 0xf))];
        temp >>= 4;
        if (i == 2) break;
    }

    return result;
}

/// Check if a token ID value is valid (always true for u256, but useful for interface consistency)
pub fn isValid(value: u256) bool {
    _ = value;
    return true;
}

// ERC-721 interface selectors
pub const ERC721_SELECTORS = struct {
    pub const balanceOf: [4]u8 = .{ 0x70, 0xa0, 0x82, 0x31 };
    pub const ownerOf: [4]u8 = .{ 0x63, 0x52, 0x21, 0x1e };
    pub const transferFrom: [4]u8 = .{ 0x23, 0xb8, 0x72, 0xdd };
    pub const safeTransferFrom: [4]u8 = .{ 0x42, 0x84, 0x2e, 0x0e };
    pub const approve: [4]u8 = .{ 0x09, 0x5e, 0xa7, 0xb3 };
    pub const setApprovalForAll: [4]u8 = .{ 0xa2, 0x2c, 0xb4, 0x65 };
    pub const getApproved: [4]u8 = .{ 0x08, 0x18, 0x12, 0xfc };
    pub const isApprovedForAll: [4]u8 = .{ 0xe9, 0x85, 0xe9, 0xc5 };
};

// Tests

test "TokenId.from creates token ID from u256" {
    const token_id = from(42);
    try std.testing.expectEqual(@as(u256, 42), token_id);
}

test "TokenId.from handles zero" {
    const token_id = from(0);
    try std.testing.expectEqual(@as(u256, 0), token_id);
}

test "TokenId.from handles max u256" {
    const token_id = from(MAX);
    try std.testing.expectEqual(MAX, token_id);
}

test "TokenId.fromNumber creates token ID from u64" {
    const token_id = fromNumber(12345);
    try std.testing.expectEqual(@as(u256, 12345), token_id);
}

test "TokenId.fromHex parses hex with 0x prefix" {
    const token_id = try fromHex("0x2a");
    try std.testing.expectEqual(@as(u256, 42), token_id);
}

test "TokenId.fromHex parses hex without prefix" {
    const token_id = try fromHex("ff");
    try std.testing.expectEqual(@as(u256, 255), token_id);
}

test "TokenId.fromHex parses large hex" {
    const token_id = try fromHex("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    try std.testing.expectEqual(MAX, token_id);
}

test "TokenId.fromHex returns error for invalid hex" {
    const result = fromHex("0xgg");
    try std.testing.expectError(error.InvalidHexCharacter, result);
}

test "TokenId.fromHex handles empty after prefix" {
    const token_id = try fromHex("0x");
    try std.testing.expectEqual(@as(u256, 0), token_id);
}

test "TokenId.equals returns true for same value" {
    const a = from(42);
    const b = from(42);
    try std.testing.expect(equals(a, b));
}

test "TokenId.equals returns false for different values" {
    const a = from(42);
    const b = from(43);
    try std.testing.expect(!equals(a, b));
}

test "TokenId.compare returns correct ordering" {
    try std.testing.expectEqual(@as(i8, -1), compare(from(1), from(2)));
    try std.testing.expectEqual(@as(i8, 0), compare(from(42), from(42)));
    try std.testing.expectEqual(@as(i8, 1), compare(from(100), from(50)));
}

test "TokenId.toNumber converts to u64" {
    const token_id = from(42);
    try std.testing.expectEqual(@as(u64, 42), toNumber(token_id));
}

test "TokenId.toNumber truncates large values" {
    const large_value: u256 = std.math.maxInt(u64) + 1;
    const token_id = from(large_value);
    try std.testing.expectEqual(@as(u64, 0), toNumber(token_id));
}

test "TokenId.toBigInt returns u256" {
    const token_id = from(42);
    try std.testing.expectEqual(@as(u256, 42), toBigInt(token_id));
}

test "TokenId.toHex converts to hex string" {
    const token_id = from(42);
    const hex = toHex(token_id);
    // 42 = 0x2a, padded to 64 chars
    try std.testing.expectEqualStrings("0x000000000000000000000000000000000000000000000000000000000000002a", &hex);
}

test "TokenId.toHex converts zero" {
    const token_id = from(0);
    const hex = toHex(token_id);
    try std.testing.expectEqualStrings("0x0000000000000000000000000000000000000000000000000000000000000000", &hex);
}

test "TokenId.toHex converts max" {
    const token_id = from(MAX);
    const hex = toHex(token_id);
    try std.testing.expectEqualStrings("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", &hex);
}

test "TokenId.toHexMinimal returns minimal hex" {
    const allocator = std.testing.allocator;

    const result = try toHexMinimal(allocator, from(42));
    defer allocator.free(result);
    try std.testing.expectEqualStrings("0x2a", result);
}

test "TokenId.toHexMinimal handles zero" {
    const allocator = std.testing.allocator;

    const result = try toHexMinimal(allocator, from(0));
    defer allocator.free(result);
    try std.testing.expectEqualStrings("0x0", result);
}

test "TokenId.toHexMinimal handles large value" {
    const allocator = std.testing.allocator;

    const result = try toHexMinimal(allocator, from(0xdeadbeef));
    defer allocator.free(result);
    try std.testing.expectEqualStrings("0xdeadbeef", result);
}

test "TokenId.isValid always returns true" {
    try std.testing.expect(isValid(0));
    try std.testing.expect(isValid(42));
    try std.testing.expect(isValid(MAX));
}

test "TokenId constants are correct" {
    try std.testing.expectEqual(@as(u256, 0), MIN);
    try std.testing.expectEqual(std.math.maxInt(u256), MAX);
}

test "TokenId.ERC721_SELECTORS are correct" {
    // balanceOf(address) = 0x70a08231
    try std.testing.expectEqual([4]u8{ 0x70, 0xa0, 0x82, 0x31 }, ERC721_SELECTORS.balanceOf);
    // ownerOf(uint256) = 0x6352211e
    try std.testing.expectEqual([4]u8{ 0x63, 0x52, 0x21, 0x1e }, ERC721_SELECTORS.ownerOf);
}

test "TokenId complete workflow" {
    // Create from value
    const token_id = fromNumber(12345);

    // Convert to hex
    const hex = toHex(token_id);
    try std.testing.expect(hex[hex.len - 1] == '9'); // last digit of 12345 = 0x3039

    // Compare with another
    const other = from(12345);
    try std.testing.expect(equals(token_id, other));
    try std.testing.expectEqual(@as(i8, 0), compare(token_id, other));

    // Convert back to number
    const num = toNumber(token_id);
    try std.testing.expectEqual(@as(u64, 12345), num);
}
