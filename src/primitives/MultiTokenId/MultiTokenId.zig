//! MultiTokenId - ERC-1155 Multi-Token Identifier
//!
//! A token type ID uniquely identifies a token type within an ERC-1155 contract.
//! Unlike ERC-721, ERC-1155 supports both fungible and non-fungible tokens in one contract.
//! Token IDs are uint256 values ranging from 0 to 2^256 - 1.
//!
//! ## Design
//! - Stored as u256 (full range as per ERC-1155 spec)
//! - Provides fungibility classification based on convention
//! - IDs below FUNGIBLE_THRESHOLD (2^128) are typically fungible
//! - IDs at or above FUNGIBLE_THRESHOLD are typically non-fungible
//!
//! ## Usage
//! ```zig
//! const multi_token_id = MultiTokenId.from(42);
//! const is_fungible = multi_token_id.isValidFungible();
//! const hex = multi_token_id.toHex();
//! ```
//!
//! @see https://eips.ethereum.org/EIPS/eip-1155

const std = @import("std");

/// MultiTokenId type - u256 representing ERC-1155 token type identifier
pub const MultiTokenId = u256;

/// Maximum MultiTokenId value (2^256 - 1)
pub const MAX: MultiTokenId = std.math.maxInt(u256);

/// Minimum MultiTokenId value (0)
pub const MIN: MultiTokenId = 0;

/// Fungible token threshold (by convention)
/// Token IDs below this are often fungible (like ERC-20)
/// Token IDs at or above are often non-fungible (like ERC-721)
pub const FUNGIBLE_THRESHOLD: MultiTokenId = @as(u256, 1) << 128;

/// Create MultiTokenId from u256 value
///
/// @param value - u256 value
/// @returns MultiTokenId
pub fn from(value: u256) MultiTokenId {
    return value;
}

/// Create MultiTokenId from u64 value (common for smaller token IDs)
///
/// @param value - u64 value
/// @returns MultiTokenId
pub fn fromNumber(value: u64) MultiTokenId {
    return value;
}

/// Create MultiTokenId from hex string (with or without 0x prefix)
///
/// @param hex_str - hex string
/// @returns MultiTokenId or error
pub fn fromHex(hex_str: []const u8) !MultiTokenId {
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

/// Check if two multi-token IDs are equal
pub fn equals(self: MultiTokenId, other: MultiTokenId) bool {
    return self == other;
}

/// Compare two multi-token IDs
/// Returns -1 if self < other, 0 if equal, 1 if self > other
pub fn compare(self: MultiTokenId, other: MultiTokenId) i8 {
    if (self < other) return -1;
    if (self > other) return 1;
    return 0;
}

/// Convert MultiTokenId to u64 (truncates if value exceeds u64 max)
///
/// @param self - MultiTokenId
/// @returns u64
pub fn toNumber(self: MultiTokenId) u64 {
    return @truncate(self);
}

/// Convert MultiTokenId to u256
///
/// @param self - MultiTokenId
/// @returns u256
pub fn toBigInt(self: MultiTokenId) u256 {
    return self;
}

/// Convert MultiTokenId to hex string (lowercase with 0x prefix)
/// Returns a fixed 66-byte array (0x + 64 hex chars)
///
/// @param self - MultiTokenId
/// @returns [66]u8
pub fn toHex(self: MultiTokenId) [66]u8 {
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

/// Check if a token ID is in the fungible range (below FUNGIBLE_THRESHOLD)
/// This is a convention, not enforced by ERC-1155
pub fn isValidFungible(self: MultiTokenId) bool {
    return self < FUNGIBLE_THRESHOLD;
}

/// Check if a token ID is in the non-fungible range (at or above FUNGIBLE_THRESHOLD)
/// This is a convention, not enforced by ERC-1155
pub fn isValidNonFungible(self: MultiTokenId) bool {
    return self >= FUNGIBLE_THRESHOLD;
}

/// Extract the base type ID from a non-fungible token ID
/// Convention: upper 128 bits represent type, lower 128 bits represent instance
pub fn getBaseType(self: MultiTokenId) u128 {
    return @truncate(self >> 128);
}

/// Extract the instance ID from a non-fungible token ID
/// Convention: lower 128 bits represent the instance within the type
pub fn getInstanceId(self: MultiTokenId) u128 {
    return @truncate(self);
}

/// Create a non-fungible token ID from base type and instance
pub fn makeNonFungible(base_type: u128, instance: u128) MultiTokenId {
    return (@as(u256, base_type) << 128) | @as(u256, instance);
}

// ERC-1155 interface selectors
pub const ERC1155_SELECTORS = struct {
    pub const balanceOf: [4]u8 = .{ 0x00, 0xfd, 0xd5, 0x8e };
    pub const balanceOfBatch: [4]u8 = .{ 0x4e, 0x12, 0x73, 0xf4 };
    pub const safeTransferFrom: [4]u8 = .{ 0xf2, 0x42, 0x43, 0x2a };
    pub const safeBatchTransferFrom: [4]u8 = .{ 0x2e, 0xb2, 0xc2, 0xd6 };
    pub const setApprovalForAll: [4]u8 = .{ 0xa2, 0x2c, 0xb4, 0x65 };
    pub const isApprovedForAll: [4]u8 = .{ 0xe9, 0x85, 0xe9, 0xc5 };
    pub const uri: [4]u8 = .{ 0x0e, 0x89, 0x34, 0x1c };
};

// Tests

test "MultiTokenId.from creates token ID from u256" {
    const token_id = from(42);
    try std.testing.expectEqual(@as(u256, 42), token_id);
}

test "MultiTokenId.from handles zero" {
    const token_id = from(0);
    try std.testing.expectEqual(@as(u256, 0), token_id);
}

test "MultiTokenId.from handles max u256" {
    const token_id = from(MAX);
    try std.testing.expectEqual(MAX, token_id);
}

test "MultiTokenId.fromNumber creates token ID from u64" {
    const token_id = fromNumber(12345);
    try std.testing.expectEqual(@as(u256, 12345), token_id);
}

test "MultiTokenId.fromHex parses hex with 0x prefix" {
    const token_id = try fromHex("0x2a");
    try std.testing.expectEqual(@as(u256, 42), token_id);
}

test "MultiTokenId.fromHex parses hex without prefix" {
    const token_id = try fromHex("ff");
    try std.testing.expectEqual(@as(u256, 255), token_id);
}

test "MultiTokenId.fromHex returns error for invalid hex" {
    const result = fromHex("0xgg");
    try std.testing.expectError(error.InvalidHexCharacter, result);
}

test "MultiTokenId.equals returns true for same value" {
    const a = from(42);
    const b = from(42);
    try std.testing.expect(equals(a, b));
}

test "MultiTokenId.equals returns false for different values" {
    const a = from(42);
    const b = from(43);
    try std.testing.expect(!equals(a, b));
}

test "MultiTokenId.compare returns correct ordering" {
    try std.testing.expectEqual(@as(i8, -1), compare(from(1), from(2)));
    try std.testing.expectEqual(@as(i8, 0), compare(from(42), from(42)));
    try std.testing.expectEqual(@as(i8, 1), compare(from(100), from(50)));
}

test "MultiTokenId.toNumber converts to u64" {
    const token_id = from(42);
    try std.testing.expectEqual(@as(u64, 42), toNumber(token_id));
}

test "MultiTokenId.toBigInt returns u256" {
    const token_id = from(42);
    try std.testing.expectEqual(@as(u256, 42), toBigInt(token_id));
}

test "MultiTokenId.toHex converts to hex string" {
    const token_id = from(42);
    const hex = toHex(token_id);
    try std.testing.expectEqualStrings("0x000000000000000000000000000000000000000000000000000000000000002a", &hex);
}

test "MultiTokenId.isValidFungible returns true for small IDs" {
    try std.testing.expect(isValidFungible(from(0)));
    try std.testing.expect(isValidFungible(from(42)));
    try std.testing.expect(isValidFungible(from(FUNGIBLE_THRESHOLD - 1)));
}

test "MultiTokenId.isValidFungible returns false for large IDs" {
    try std.testing.expect(!isValidFungible(from(FUNGIBLE_THRESHOLD)));
    try std.testing.expect(!isValidFungible(from(FUNGIBLE_THRESHOLD + 1)));
    try std.testing.expect(!isValidFungible(from(MAX)));
}

test "MultiTokenId.isValidNonFungible returns true for large IDs" {
    try std.testing.expect(isValidNonFungible(from(FUNGIBLE_THRESHOLD)));
    try std.testing.expect(isValidNonFungible(from(FUNGIBLE_THRESHOLD + 1)));
    try std.testing.expect(isValidNonFungible(from(MAX)));
}

test "MultiTokenId.isValidNonFungible returns false for small IDs" {
    try std.testing.expect(!isValidNonFungible(from(0)));
    try std.testing.expect(!isValidNonFungible(from(42)));
    try std.testing.expect(!isValidNonFungible(from(FUNGIBLE_THRESHOLD - 1)));
}

test "MultiTokenId.getBaseType extracts upper 128 bits" {
    const nft_id = makeNonFungible(0xdeadbeef, 0x12345);
    try std.testing.expectEqual(@as(u128, 0xdeadbeef), getBaseType(nft_id));
}

test "MultiTokenId.getInstanceId extracts lower 128 bits" {
    const nft_id = makeNonFungible(0xdeadbeef, 0x12345);
    try std.testing.expectEqual(@as(u128, 0x12345), getInstanceId(nft_id));
}

test "MultiTokenId.makeNonFungible creates correct token ID" {
    const base_type: u128 = 1;
    const instance: u128 = 42;
    const nft_id = makeNonFungible(base_type, instance);

    try std.testing.expect(isValidNonFungible(nft_id));
    try std.testing.expectEqual(base_type, getBaseType(nft_id));
    try std.testing.expectEqual(instance, getInstanceId(nft_id));
}

test "MultiTokenId constants are correct" {
    try std.testing.expectEqual(@as(u256, 0), MIN);
    try std.testing.expectEqual(std.math.maxInt(u256), MAX);
    try std.testing.expectEqual(@as(u256, 1) << 128, FUNGIBLE_THRESHOLD);
}

test "MultiTokenId.ERC1155_SELECTORS are correct" {
    // balanceOf(address,uint256) = 0x00fdd58e
    try std.testing.expectEqual([4]u8{ 0x00, 0xfd, 0xd5, 0x8e }, ERC1155_SELECTORS.balanceOf);
    // uri(uint256) = 0x0e89341c
    try std.testing.expectEqual([4]u8{ 0x0e, 0x89, 0x34, 0x1c }, ERC1155_SELECTORS.uri);
}

test "MultiTokenId complete workflow" {
    // Create fungible token ID
    const fungible_id = fromNumber(100);
    try std.testing.expect(isValidFungible(fungible_id));

    // Create non-fungible token ID
    const nft_id = makeNonFungible(1, 42);
    try std.testing.expect(isValidNonFungible(nft_id));

    // Extract components
    try std.testing.expectEqual(@as(u128, 1), getBaseType(nft_id));
    try std.testing.expectEqual(@as(u128, 42), getInstanceId(nft_id));

    // Compare
    try std.testing.expect(!equals(fungible_id, nft_id));
    try std.testing.expectEqual(@as(i8, -1), compare(fungible_id, nft_id));
}
