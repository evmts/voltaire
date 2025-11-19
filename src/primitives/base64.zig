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

/// Encode UTF-8 string to standard base64
///
/// Caller owns returned memory
pub fn encodeString(allocator: std.mem.Allocator, str: []const u8) ![]u8 {
    return encode(allocator, str);
}

/// Decode standard base64 to UTF-8 string
///
/// Caller owns returned memory
pub fn decodeToString(allocator: std.mem.Allocator, encoded: []const u8) ![]u8 {
    return decode(allocator, encoded);
}

/// Validate standard base64 string
///
/// Checks for valid alphabet (A-Z, a-z, 0-9, +, /, =) and proper padding
pub fn isValid(encoded: []const u8) bool {
    if (encoded.len == 0) return true;
    if (encoded.len % 4 != 0) return false;

    var padding_count: u8 = 0;
    for (encoded, 0..) |c, i| {
        if (c == '=') {
            padding_count += 1;
            // Padding can only be at end
            if (i < encoded.len - 2) return false;
        } else if (padding_count > 0) {
            // No chars after padding
            return false;
        } else {
            // Check valid base64 char
            const valid = (c >= 'A' and c <= 'Z') or
                (c >= 'a' and c <= 'z') or
                (c >= '0' and c <= '9') or
                c == '+' or c == '/';
            if (!valid) return false;
        }
    }
    return padding_count <= 2;
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

/// Encode UTF-8 string to URL-safe base64
///
/// Caller owns returned memory
pub fn encodeStringUrlSafe(allocator: std.mem.Allocator, str: []const u8) ![]u8 {
    return encodeUrlSafe(allocator, str);
}

/// Decode URL-safe base64 to UTF-8 string
///
/// Caller owns returned memory
pub fn decodeUrlSafeToString(allocator: std.mem.Allocator, encoded: []const u8) ![]u8 {
    return decodeUrlSafe(allocator, encoded);
}

/// Validate URL-safe base64 string
///
/// Checks for valid alphabet (A-Z, a-z, 0-9, -, _) and no padding
pub fn isValidUrlSafe(encoded: []const u8) bool {
    if (encoded.len == 0) return true;

    for (encoded) |c| {
        const valid = (c >= 'A' and c <= 'Z') or
            (c >= 'a' and c <= 'z') or
            (c >= '0' and c <= '9') or
            c == '-' or c == '_';
        if (!valid) return false;
    }
    return true;
}

/// Calculate encoded size for URL-safe base64
pub fn calcEncodedSizeUrlSafe(data_len: usize) usize {
    return std.base64.url_safe_no_pad.Encoder.calcSize(data_len);
}

/// Calculate maximum decoded size for URL-safe base64
pub fn calcDecodedSizeUrlSafe(encoded_len: usize) !usize {
    return std.base64.url_safe_no_pad.Decoder.calcSizeForSlice(&[_]u8{0} ** encoded_len);
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

test "encodeString" {
    const encoded = try encodeString(testing.allocator, "Hello");
    defer testing.allocator.free(encoded);
    try testing.expectEqualStrings("SGVsbG8=", encoded);

    const encoded2 = try encodeString(testing.allocator, "Hello, world!");
    defer testing.allocator.free(encoded2);
    try testing.expectEqualStrings("SGVsbG8sIHdvcmxkIQ==", encoded2);
}

test "decodeToString" {
    const decoded = try decodeToString(testing.allocator, "SGVsbG8=");
    defer testing.allocator.free(decoded);
    try testing.expectEqualStrings("Hello", decoded);

    const decoded2 = try decodeToString(testing.allocator, "SGVsbG8sIHdvcmxkIQ==");
    defer testing.allocator.free(decoded2);
    try testing.expectEqualStrings("Hello, world!", decoded2);
}

test "isValid - valid strings" {
    try testing.expect(isValid(""));
    try testing.expect(isValid("SGVsbG8="));
    try testing.expect(isValid("SGVsbG8sIHdvcmxkIQ=="));
    try testing.expect(isValid("Zm9v"));
    try testing.expect(isValid("Zm9vYg=="));
}

test "isValid - invalid strings" {
    try testing.expect(!isValid("!!!"));
    try testing.expect(!isValid("SGVsbG8")); // Missing padding
    try testing.expect(!isValid("SGVs=bG8")); // Padding in middle
    try testing.expect(!isValid("SGVsbG8====")); // Too much padding
    try testing.expect(!isValid("SGVsbG8@")); // Invalid char
}

test "encodeStringUrlSafe" {
    const encoded = try encodeStringUrlSafe(testing.allocator, "test");
    defer testing.allocator.free(encoded);

    // Should not contain + / or =
    for (encoded) |c| {
        try testing.expect(c != '+');
        try testing.expect(c != '/');
        try testing.expect(c != '=');
    }

    const decoded = try decodeUrlSafeToString(testing.allocator, encoded);
    defer testing.allocator.free(decoded);
    try testing.expectEqualStrings("test", decoded);
}

test "decodeUrlSafeToString" {
    const data = &[_]u8{ 72, 101, 108, 108, 111 }; // "Hello"
    const encoded = try encodeUrlSafe(testing.allocator, data);
    defer testing.allocator.free(encoded);

    const decoded = try decodeUrlSafeToString(testing.allocator, encoded);
    defer testing.allocator.free(decoded);
    try testing.expectEqualStrings("Hello", decoded);
}

test "isValidUrlSafe - valid strings" {
    try testing.expect(isValidUrlSafe(""));
    try testing.expect(isValidUrlSafe("SGVsbG8"));
    try testing.expect(isValidUrlSafe("YWJj"));
    try testing.expect(isValidUrlSafe("_-_-"));
}

test "isValidUrlSafe - invalid strings" {
    try testing.expect(!isValidUrlSafe("SGVsbG8=")); // Has padding
    try testing.expect(!isValidUrlSafe("+++")); // Has +
    try testing.expect(!isValidUrlSafe("///")); // Has /
    try testing.expect(!isValidUrlSafe("SGVs@bG8")); // Invalid char
}

test "calcEncodedSizeUrlSafe" {
    try testing.expectEqual(@as(usize, 0), calcEncodedSizeUrlSafe(0));
    try testing.expectEqual(@as(usize, 2), calcEncodedSizeUrlSafe(1));
    try testing.expectEqual(@as(usize, 3), calcEncodedSizeUrlSafe(2));
    try testing.expectEqual(@as(usize, 4), calcEncodedSizeUrlSafe(3));
    try testing.expectEqual(@as(usize, 6), calcEncodedSizeUrlSafe(4));
}

test "string round-trip" {
    const strings = [_][]const u8{ "", "a", "Hello", "Hello, world!" };

    for (strings) |str| {
        const encoded = try encodeString(testing.allocator, str);
        defer testing.allocator.free(encoded);

        const decoded = try decodeToString(testing.allocator, encoded);
        defer testing.allocator.free(decoded);

        try testing.expectEqualStrings(str, decoded);
    }
}

test "url-safe string round-trip" {
    const strings = [_][]const u8{ "", "test", "Hello", "🚀" };

    for (strings) |str| {
        const encoded = try encodeStringUrlSafe(testing.allocator, str);
        defer testing.allocator.free(encoded);

        const decoded = try decodeUrlSafeToString(testing.allocator, encoded);
        defer testing.allocator.free(decoded);

        try testing.expectEqualStrings(str, decoded);
    }
}
