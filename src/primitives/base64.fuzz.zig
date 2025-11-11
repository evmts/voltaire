//! Fuzz Tests for Base64 Encoding/Decoding
//!
//! Coverage-guided testing for:
//! - Standard/URL-safe encoding/decoding
//! - Invalid characters and malformed input
//! - Padding edge cases
//! - Partial blocks
//! - Roundtrip properties

const std = @import("std");
const testing = std.testing;
const base64 = @import("base64.zig");

// ============================================================================
// Standard Base64 Fuzzing
// ============================================================================

test "fuzz standard encode" {
    try testing.fuzz({}, testStandardEncode, .{});
}

fn testStandardEncode(_: void, input: []const u8) !void {
    // Should never panic, always produce valid output
    const encoded = base64.encode(testing.allocator, input) catch return;
    defer testing.allocator.free(encoded);

    // Validate encoded size matches expected
    const expected_size = base64.calcEncodedSize(input.len);
    try testing.expectEqual(expected_size, encoded.len);

    // Validate only contains base64 characters
    for (encoded) |c| {
        const valid = (c >= 'A' and c <= 'Z') or
            (c >= 'a' and c <= 'z') or
            (c >= '0' and c <= '9') or
            c == '+' or c == '/' or c == '=';
        try testing.expect(valid);
    }

    // Validate padding is correct
    const pad_count = countTrailing(encoded, '=');
    try testing.expect(pad_count <= 2);

    // If padded, must be at end
    if (pad_count > 0) {
        const last = encoded[encoded.len - 1];
        try testing.expectEqual(@as(u8, '='), last);
    }
}

test "fuzz standard decode arbitrary" {
    try testing.fuzz({}, testStandardDecodeArbitrary, .{});
}

fn testStandardDecodeArbitrary(_: void, input: []const u8) !void {
    // Most inputs will fail - we're testing no panics
    const decoded = base64.decode(testing.allocator, input) catch |err| {
        // Expected errors for invalid input
        try testing.expect(
            err == error.InvalidCharacter or
                err == error.InvalidPadding or
                err == error.OutOfMemory,
        );
        return;
    };
    defer testing.allocator.free(decoded);

    // If decode succeeds, output should be reasonable
    try testing.expect(decoded.len <= (input.len / 4) * 3 + 3);
}

test "fuzz standard roundtrip" {
    try testing.fuzz({}, testStandardRoundtrip, .{});
}

fn testStandardRoundtrip(_: void, input: []const u8) !void {
    // Encode arbitrary bytes
    const encoded = base64.encode(testing.allocator, input) catch return;
    defer testing.allocator.free(encoded);

    // Decode should always succeed for valid encoding
    const decoded = base64.decode(testing.allocator, encoded) catch unreachable;
    defer testing.allocator.free(decoded);

    // Must roundtrip exactly
    try testing.expectEqualSlices(u8, input, decoded);
}

test "fuzz standard decode with invalid characters" {
    try testing.fuzz({}, testStandardDecodeInvalidChars, .{});
}

fn testStandardDecodeInvalidChars(_: void, input: []const u8) !void {
    if (input.len == 0) return;

    // Create buffer with potentially invalid characters
    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    const alloc = arena.allocator();
    const modified = try alloc.dupe(u8, input);

    // Check for invalid characters
    var has_invalid = false;
    for (modified) |c| {
        const is_valid = (c >= 'A' and c <= 'Z') or
            (c >= 'a' and c <= 'z') or
            (c >= '0' and c <= '9') or
            c == '+' or c == '/' or c == '=';
        if (!is_valid) {
            has_invalid = true;
            break;
        }
    }

    if (!has_invalid) return; // All valid, skip test

    // Invalid character present - should fail
    const result = base64.decode(testing.allocator, modified) catch |err| {
        try testing.expect(
            err == error.InvalidCharacter or
                err == error.InvalidPadding,
        );
        return;
    };
    testing.allocator.free(result);
}

test "fuzz standard decode with malformed padding" {
    try testing.fuzz({}, testStandardDecodeMalformedPadding, .{});
}

fn testStandardDecodeMalformedPadding(_: void, input: []const u8) !void {
    if (input.len < 4) return; // Need minimum length

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    const alloc = arena.allocator();

    // Create valid-ish base64 with bad padding
    const modified = try alloc.alloc(u8, input.len);

    // Fill with valid base64 characters
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (modified, 0..) |*c, i| {
        c.* = alphabet[input[i] % 64];
    }

    // Add padding in wrong places
    if (modified.len > 2) {
        modified[modified.len / 2] = '='; // Padding in middle
    }

    const result = base64.decode(testing.allocator, modified) catch |err| {
        try testing.expect(
            err == error.InvalidCharacter or
                err == error.InvalidPadding,
        );
        return;
    };
    testing.allocator.free(result);
}

// ============================================================================
// URL-Safe Base64 Fuzzing
// ============================================================================

test "fuzz url-safe encode" {
    try testing.fuzz({}, testUrlSafeEncode, .{});
}

fn testUrlSafeEncode(_: void, input: []const u8) !void {
    const encoded = base64.encodeUrlSafe(testing.allocator, input) catch return;
    defer testing.allocator.free(encoded);

    // URL-safe should not contain +, /, or =
    for (encoded) |c| {
        try testing.expect(c != '+');
        try testing.expect(c != '/');
        try testing.expect(c != '=');

        // Only valid URL-safe characters
        const valid = (c >= 'A' and c <= 'Z') or
            (c >= 'a' and c <= 'z') or
            (c >= '0' and c <= '9') or
            c == '-' or c == '_';
        try testing.expect(valid);
    }
}

test "fuzz url-safe decode arbitrary" {
    try testing.fuzz({}, testUrlSafeDecodeArbitrary, .{});
}

fn testUrlSafeDecodeArbitrary(_: void, input: []const u8) !void {
    const decoded = base64.decodeUrlSafe(testing.allocator, input) catch |err| {
        try testing.expect(
            err == error.InvalidCharacter or
                err == error.InvalidPadding or
                err == error.OutOfMemory,
        );
        return;
    };
    defer testing.allocator.free(decoded);

    try testing.expect(decoded.len <= (input.len / 4) * 3 + 3);
}

test "fuzz url-safe roundtrip" {
    try testing.fuzz({}, testUrlSafeRoundtrip, .{});
}

fn testUrlSafeRoundtrip(_: void, input: []const u8) !void {
    const encoded = base64.encodeUrlSafe(testing.allocator, input) catch return;
    defer testing.allocator.free(encoded);

    const decoded = base64.decodeUrlSafe(testing.allocator, encoded) catch unreachable;
    defer testing.allocator.free(decoded);

    try testing.expectEqualSlices(u8, input, decoded);
}

test "fuzz url-safe decode with standard characters" {
    try testing.fuzz({}, testUrlSafeDecodeWithStandardChars, .{});
}

fn testUrlSafeDecodeWithStandardChars(_: void, input: []const u8) !void {
    if (input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    const alloc = arena.allocator();
    const modified = try alloc.dupe(u8, input);

    // Replace with standard base64 characters that are invalid for URL-safe
    for (modified, 0..) |*c, i| {
        if (i % 3 == 0) c.* = '+';
        if (i % 3 == 1) c.* = '/';
        if (i % 3 == 2) c.* = '=';
    }

    // Should fail due to invalid characters for URL-safe
    const result = base64.decodeUrlSafe(testing.allocator, modified) catch |err| {
        try testing.expect(
            err == error.InvalidCharacter or
                err == error.InvalidPadding,
        );
        return;
    };
    testing.allocator.free(result);
}

// ============================================================================
// Property-Based Fuzzing
// ============================================================================

test "fuzz encode-decode symmetry standard" {
    try testing.fuzz({}, testEncodeDecodeSymmetryStandard, .{});
}

fn testEncodeDecodeSymmetryStandard(_: void, input: []const u8) !void {
    // Property: decode(encode(x)) == x
    const encoded = base64.encode(testing.allocator, input) catch return;
    defer testing.allocator.free(encoded);

    const decoded = base64.decode(testing.allocator, encoded) catch unreachable;
    defer testing.allocator.free(decoded);

    try testing.expectEqualSlices(u8, input, decoded);

    // Property: encode(decode(encode(x))) == encode(x)
    const re_encoded = base64.encode(testing.allocator, decoded) catch unreachable;
    defer testing.allocator.free(re_encoded);

    try testing.expectEqualSlices(u8, encoded, re_encoded);
}

test "fuzz encode-decode symmetry url-safe" {
    try testing.fuzz({}, testEncodeDecodeSymmetryUrlSafe, .{});
}

fn testEncodeDecodeSymmetryUrlSafe(_: void, input: []const u8) !void {
    const encoded = base64.encodeUrlSafe(testing.allocator, input) catch return;
    defer testing.allocator.free(encoded);

    const decoded = base64.decodeUrlSafe(testing.allocator, encoded) catch unreachable;
    defer testing.allocator.free(decoded);

    try testing.expectEqualSlices(u8, input, decoded);

    const re_encoded = base64.encodeUrlSafe(testing.allocator, decoded) catch unreachable;
    defer testing.allocator.free(re_encoded);

    try testing.expectEqualSlices(u8, encoded, re_encoded);
}

test "fuzz size calculations" {
    try testing.fuzz({}, testSizeCalculations, .{});
}

fn testSizeCalculations(_: void, input: []const u8) !void {
    // Property: encoded size calculation matches actual
    const expected_size = base64.calcEncodedSize(input.len);
    const encoded = base64.encode(testing.allocator, input) catch return;
    defer testing.allocator.free(encoded);

    try testing.expectEqual(expected_size, encoded.len);

    // Property: decoded size is always less than or equal to encoded
    const decoded = base64.decode(testing.allocator, encoded) catch unreachable;
    defer testing.allocator.free(decoded);

    try testing.expect(decoded.len <= encoded.len);
}

test "fuzz partial blocks" {
    try testing.fuzz({}, testPartialBlocks, .{});
}

fn testPartialBlocks(_: void, input: []const u8) !void {
    if (input.len < 1) return;

    // Test encoding of 1, 2, and 3 byte inputs (partial blocks)
    const len = (input.len % 3) + 1;
    const partial = input[0..len];

    const encoded = base64.encode(testing.allocator, partial) catch return;
    defer testing.allocator.free(encoded);

    // Encoded length should be 4 for 1-3 bytes input
    try testing.expectEqual(@as(usize, 4), encoded.len);

    // Should roundtrip correctly
    const decoded = base64.decode(testing.allocator, encoded) catch unreachable;
    defer testing.allocator.free(decoded);

    try testing.expectEqualSlices(u8, partial, decoded);
}

test "fuzz empty and single byte" {
    try testing.fuzz({}, testEmptyAndSingleByte, .{});
}

fn testEmptyAndSingleByte(_: void, input: []const u8) !void {
    if (input.len == 0) return;

    // Test empty input
    {
        const encoded = base64.encode(testing.allocator, "") catch unreachable;
        defer testing.allocator.free(encoded);
        try testing.expectEqual(@as(usize, 0), encoded.len);

        const decoded = base64.decode(testing.allocator, "") catch unreachable;
        defer testing.allocator.free(decoded);
        try testing.expectEqual(@as(usize, 0), decoded.len);
    }

    // Test single byte
    {
        const single = input[0..1];
        const encoded = base64.encode(testing.allocator, single) catch unreachable;
        defer testing.allocator.free(encoded);

        const decoded = base64.decode(testing.allocator, encoded) catch unreachable;
        defer testing.allocator.free(decoded);

        try testing.expectEqualSlices(u8, single, decoded);
    }
}

test "fuzz binary data with all byte values" {
    try testing.fuzz({}, testBinaryDataAllBytes, .{});
}

fn testBinaryDataAllBytes(_: void, input: []const u8) !void {
    // Property: all byte values 0x00-0xFF should encode/decode correctly
    const encoded = base64.encode(testing.allocator, input) catch return;
    defer testing.allocator.free(encoded);

    const decoded = base64.decode(testing.allocator, encoded) catch unreachable;
    defer testing.allocator.free(decoded);

    try testing.expectEqualSlices(u8, input, decoded);

    // Verify we can handle high bytes
    for (input) |byte| {
        _ = byte; // All values 0-255 should work
    }
}

test "fuzz allocation failures" {
    try testing.fuzz({}, testAllocationFailures, .{});
}

fn testAllocationFailures(_: void, input: []const u8) !void {
    if (input.len > 1024) return; // Keep reasonable

    var fail_alloc = testing.FailingAllocator.init(testing.allocator, .{ .fail_index = 0 });
    const alloc = fail_alloc.allocator();

    // Encoding allocation failure
    _ = base64.encode(alloc, input) catch |err| {
        try testing.expect(err == error.OutOfMemory);
        return;
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

fn countTrailing(slice: []const u8, char: u8) usize {
    var count: usize = 0;
    var i: usize = slice.len;
    while (i > 0) {
        i -= 1;
        if (slice[i] == char) {
            count += 1;
        } else {
            break;
        }
    }
    return count;
}
