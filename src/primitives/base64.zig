//! Base64 Encoding/Decoding
//!
//! Standard and URL-safe base64 encoding using Zig's std.base64.
//! Provides both standard alphabet (RFC 4648) and URL-safe variants.

const std = @import("std");
const testing = std.testing;

// ============================================================================
// Standard Base64 Encoding
// ============================================================================

/// Encode bytes to standard base64
///
/// Uses standard alphabet (A-Z, a-z, 0-9, +, /) with padding (=)
/// Caller owns returned memory
pub fn encode(allocator: std.mem.Allocator, data: []const u8) ![]u8 {
    const encoder = std.base64.standard.Encoder;
    const encoded_len = encoder.calcSize(data.len);
    const encoded = try allocator.alloc(u8, encoded_len);
    const result = encoder.encode(encoded, data);
    return encoded[0..result.len];
}

/// Decode standard base64 to bytes
///
/// Caller owns returned memory
pub fn decode(allocator: std.mem.Allocator, encoded: []const u8) ![]u8 {
    const decoder = std.base64.standard.Decoder;
    const max_decoded_len = try decoder.calcSizeForSlice(encoded);
    const decoded = try allocator.alloc(u8, max_decoded_len);
    try decoder.decode(decoded, encoded);
    return decoded;
}

/// Calculate encoded size for given data length
pub fn calcEncodedSize(data_len: usize) usize {
    return std.base64.standard.Encoder.calcSize(data_len);
}

/// Calculate maximum decoded size for given encoded length
pub fn calcDecodedSize(encoded_len: usize) !usize {
    return std.base64.standard.Decoder.calcSizeForSlice(&[_]u8{0} ** encoded_len);
}

// ============================================================================
// URL-Safe Base64 Encoding
// ============================================================================

/// Encode bytes to URL-safe base64
///
/// Uses URL-safe alphabet (A-Z, a-z, 0-9, -, _) without padding
/// Caller owns returned memory
pub fn encodeUrlSafe(allocator: std.mem.Allocator, data: []const u8) ![]u8 {
    const encoder = std.base64.url_safe_no_pad.Encoder;
    const encoded_len = encoder.calcSize(data.len);
    const encoded = try allocator.alloc(u8, encoded_len);
    const result = encoder.encode(encoded, data);
    return encoded[0..result.len];
}

/// Decode URL-safe base64 to bytes
///
/// Caller owns returned memory
pub fn decodeUrlSafe(allocator: std.mem.Allocator, encoded: []const u8) ![]u8 {
    const decoder = std.base64.url_safe_no_pad.Decoder;
    const max_decoded_len = try decoder.calcSizeForSlice(encoded);
    const decoded = try allocator.alloc(u8, max_decoded_len);
    try decoder.decode(decoded, encoded);
    return decoded;
}

// ============================================================================
// Tests
// ============================================================================

test "standard encode" {
    const data = "Hello";
    const encoded = try encode(testing.allocator, data);
    defer testing.allocator.free(encoded);
    try testing.expectEqualStrings("SGVsbG8=", encoded);
}

test "standard decode" {
    const encoded = "SGVsbG8=";
    const decoded = try decode(testing.allocator, encoded);
    defer testing.allocator.free(decoded);
    try testing.expectEqualStrings("Hello", decoded);
}

test "standard round-trip" {
    const data = "The quick brown fox jumps over the lazy dog";
    const encoded = try encode(testing.allocator, data);
    defer testing.allocator.free(encoded);

    const decoded = try decode(testing.allocator, encoded);
    defer testing.allocator.free(decoded);

    try testing.expectEqualStrings(data, decoded);
}

test "url-safe encode" {
    const data = &[_]u8{ 0xFF, 0xFE, 0xFD };
    const encoded = try encodeUrlSafe(testing.allocator, data);
    defer testing.allocator.free(encoded);

    // Should not contain + or / or =
    for (encoded) |c| {
        try testing.expect(c != '+');
        try testing.expect(c != '/');
        try testing.expect(c != '=');
    }
}

test "url-safe round-trip" {
    const data = &[_]u8{ 1, 2, 3, 4, 5, 0xFF, 0xFE };
    const encoded = try encodeUrlSafe(testing.allocator, data);
    defer testing.allocator.free(encoded);

    const decoded = try decodeUrlSafe(testing.allocator, encoded);
    defer testing.allocator.free(decoded);

    try testing.expectEqualSlices(u8, data, decoded);
}

test "empty input" {
    const empty = "";
    const encoded = try encode(testing.allocator, empty);
    defer testing.allocator.free(encoded);
    try testing.expectEqualStrings("", encoded);

    const decoded = try decode(testing.allocator, "");
    defer testing.allocator.free(decoded);
    try testing.expectEqualStrings("", decoded);
}

test "RFC 4648 test vectors" {
    const vectors = [_]struct { input: []const u8, output: []const u8 }{
        .{ .input = "", .output = "" },
        .{ .input = "f", .output = "Zg==" },
        .{ .input = "fo", .output = "Zm8=" },
        .{ .input = "foo", .output = "Zm9v" },
        .{ .input = "foob", .output = "Zm9vYg==" },
        .{ .input = "fooba", .output = "Zm9vYmE=" },
        .{ .input = "foobar", .output = "Zm9vYmFy" },
    };

    for (vectors) |v| {
        const encoded = try encode(testing.allocator, v.input);
        defer testing.allocator.free(encoded);
        try testing.expectEqualStrings(v.output, encoded);

        const decoded = try decode(testing.allocator, v.output);
        defer testing.allocator.free(decoded);
        try testing.expectEqualStrings(v.input, decoded);
    }
}

test "calcEncodedSize" {
    try testing.expectEqual(@as(usize, 0), calcEncodedSize(0));
    try testing.expectEqual(@as(usize, 4), calcEncodedSize(1));
    try testing.expectEqual(@as(usize, 4), calcEncodedSize(2));
    try testing.expectEqual(@as(usize, 4), calcEncodedSize(3));
    try testing.expectEqual(@as(usize, 8), calcEncodedSize(4));
    try testing.expectEqual(@as(usize, 8), calcEncodedSize(5));
}
