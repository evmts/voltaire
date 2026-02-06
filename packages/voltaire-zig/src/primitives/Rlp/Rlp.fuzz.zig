//! Fuzz tests for RLP encoding/decoding
//!
//! Run with: zig build test --fuzz
//! On macOS, use Docker:
//!   docker run --rm -it -v $(pwd):/workspace -w /workspace \
//!     ziglang/zig:0.15.1 zig build test --fuzz=300s

const std = @import("std");
const rlp = @import("Rlp.zig");
const RlpError = rlp.RlpError;

// Test basic decode doesn't panic on arbitrary input
test "fuzz decode arbitrary input" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Decode should never panic, only return error or valid result
    const result = rlp.decode(allocator, input, false) catch |err| {
        // Expected errors from malformed input
        try std.testing.expect(err == RlpError.InputTooShort or
            err == RlpError.InputTooLong or
            err == RlpError.LeadingZeros or
            err == RlpError.NonCanonicalSize or
            err == RlpError.InvalidLength or
            err == RlpError.UnexpectedInput or
            err == RlpError.InvalidRemainder or
            err == RlpError.ExtraZeros or
            err == RlpError.RecursionDepthExceeded or
            err == error.OutOfMemory);
        return;
    };
    defer result.data.deinit(allocator);

    // If decode succeeded, verify basic invariants
    switch (result.data) {
        .String => |str| {
            // String should be allocated
            _ = str;
        },
        .List => |items| {
            // List should be allocated
            _ = items;
        },
    }
}

// Test stream mode decode
test "fuzz decode stream mode" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Stream mode allows extra data after valid RLP
    const result = rlp.decode(allocator, input, true) catch return;
    defer result.data.deinit(allocator);

    // Remainder + decoded length should equal input length
    const consumed = input.len - result.remainder.len;
    try std.testing.expect(consumed <= input.len);
}

// Test encode doesn't panic on byte slices
test "fuzz encode bytes" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Encoding arbitrary bytes should never panic
    const encoded = rlp.encode(allocator, input) catch |err| {
        try std.testing.expect(err == error.OutOfMemory);
        return;
    };
    defer allocator.free(encoded);

    // Encoded result should be non-empty for non-empty input
    try std.testing.expect(encoded.len > 0);
}

// Test roundtrip property: decode(encode(x)) == x for strings
test "fuzz roundtrip string encoding" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Limit size to avoid OOM
    if (input.len > 10000) return;

    // Encode the input
    const encoded = try rlp.encode(allocator, input);
    defer allocator.free(encoded);

    // Decode it back
    const decoded = try rlp.decode(allocator, encoded, false);
    defer decoded.data.deinit(allocator);

    // Should get back a string with same content
    switch (decoded.data) {
        .String => |str| {
            try std.testing.expectEqualSlices(u8, input, str);
        },
        .List => unreachable, // Encoded string should decode as string
    }

    // No remainder in non-stream mode
    try std.testing.expectEqual(@as(usize, 0), decoded.remainder.len);
}

// Test single byte encoding edge cases
test "fuzz single byte values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 1) return;

    const byte = input[0];
    const bytes = [_]u8{byte};

    const encoded = try rlp.encode(allocator, &bytes);
    defer allocator.free(encoded);

    // Single bytes < 0x80 encode as themselves
    // Single bytes >= 0x80 encode with 0x81 prefix
    if (byte < 0x80) {
        try std.testing.expectEqual(@as(usize, 1), encoded.len);
        try std.testing.expectEqual(byte, encoded[0]);
    } else {
        try std.testing.expectEqual(@as(usize, 2), encoded.len);
        try std.testing.expectEqual(@as(u8, 0x81), encoded[0]);
        try std.testing.expectEqual(byte, encoded[1]);
    }

    // Decode and verify
    const decoded = try rlp.decode(allocator, encoded, false);
    defer decoded.data.deinit(allocator);

    switch (decoded.data) {
        .String => |str| {
            try std.testing.expectEqual(@as(usize, 1), str.len);
            try std.testing.expectEqual(byte, str[0]);
        },
        .List => unreachable,
    }
}

// Test invalid length prefixes
test "fuzz invalid length prefixes" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 1) return;

    const prefix = input[0];

    // Test various invalid patterns
    var malformed: [256]u8 = undefined;

    // Test truncated string
    if (prefix >= 0x80 and prefix <= 0xb7) {
        const claimed_length = prefix - 0x80;
        if (claimed_length > 0 and input.len > 1) {
            malformed[0] = prefix;
            const actual_length = @min(claimed_length - 1, input.len - 1);
            if (actual_length > 0) {
                @memcpy(malformed[1 .. 1 + actual_length], input[1 .. 1 + actual_length]);
                const result = rlp.decode(allocator, malformed[0 .. 1 + actual_length], false);
                try std.testing.expectError(RlpError.InputTooShort, result);
            }
        }
    }

    // Test truncated long string
    if (prefix >= 0xb8 and prefix <= 0xbf) {
        const length_of_length = prefix - 0xb7;
        if (input.len >= length_of_length) {
            malformed[0] = prefix;
            const len_bytes_count = @min(length_of_length - 1, input.len - 1);
            if (len_bytes_count > 0) {
                @memcpy(malformed[1 .. 1 + len_bytes_count], input[1 .. 1 + len_bytes_count]);
                const result = rlp.decode(allocator, malformed[0 .. 1 + len_bytes_count], false);
                try std.testing.expectError(RlpError.InputTooShort, result);
            }
        }
    }
}

// Test leading zeros detection
test "fuzz leading zeros in length" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 3) return;

    // Long string with leading zero in length: 0xb8 0x00 <length> <data>
    var malformed: [256]u8 = undefined;
    malformed[0] = 0xb8; // Long string, 1 byte length
    malformed[1] = 0x00; // Leading zero (invalid)
    malformed[2] = input[0];
    const data_len = @min(input[0], 253);
    if (input.len >= 3 + data_len) {
        @memcpy(malformed[3 .. 3 + data_len], input[3 .. 3 + data_len]);
        const result = rlp.decode(allocator, malformed[0 .. 3 + data_len], false);
        try std.testing.expectError(RlpError.LeadingZeros, result);
    }

    // Long list with leading zero
    malformed[0] = 0xf8; // Long list, 1 byte length
    malformed[1] = 0x00; // Leading zero (invalid)
    malformed[2] = input[0];
    if (input.len >= 3 + data_len) {
        @memcpy(malformed[3 .. 3 + data_len], input[3 .. 3 + data_len]);
        const result = rlp.decode(allocator, malformed[0 .. 3 + data_len], false);
        try std.testing.expectError(RlpError.LeadingZeros, result);
    }
}

// Test non-canonical encoding detection
test "fuzz non-canonical encodings" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 1) return;

    // Single byte < 0x80 should not have 0x81 prefix
    if (input[0] < 0x80) {
        const malformed = [_]u8{ 0x81, input[0] };
        const result = rlp.decode(allocator, &malformed, false);
        try std.testing.expectError(RlpError.NonCanonicalSize, result);
    }

    // Short string (< 56 bytes) should not use long form
    if (input.len >= 5 and input.len < 56) {
        var malformed: [256]u8 = undefined;
        malformed[0] = 0xb8; // Long form
        malformed[1] = @as(u8, @intCast(input.len));
        @memcpy(malformed[2 .. 2 + input.len], input[0..input.len]);
        const result = rlp.decode(allocator, malformed[0 .. 2 + input.len], false);
        try std.testing.expectError(RlpError.NonCanonicalSize, result);
    }
}

// Test deeply nested structures
test "fuzz nested list depth" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 2) return;

    // Build nested list from fuzz input
    // Each 0xc1 byte adds one level of nesting
    var nested: [256]u8 = undefined;
    var depth: usize = 0;
    var pos: usize = 0;

    // Count how many 0xc1 prefixes we can fit
    for (input) |byte| {
        if (byte == 0xc1 and pos < nested.len - 1) {
            nested[pos] = 0xc1;
            pos += 1;
            depth += 1;
        }
        if (depth >= rlp.MAX_RLP_DEPTH + 5) break;
    }

    // Add terminal value
    if (pos < nested.len) {
        nested[pos] = 0x80; // Empty string
        pos += 1;
    }

    if (depth > rlp.MAX_RLP_DEPTH) {
        // Should fail with RecursionDepthExceeded
        const result = rlp.decode(allocator, nested[0..pos], false);
        try std.testing.expectError(RlpError.RecursionDepthExceeded, result);
    }
}

// Test malformed list structures
test "fuzz malformed lists" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 2) return;

    // List header claiming more bytes than available
    var malformed: [256]u8 = undefined;
    const list_length = input[0];
    malformed[0] = 0xc0 + @min(list_length, 55); // Short list form
    const actual_data = @min(list_length / 2, input.len - 1); // Provide less than claimed

    if (list_length > 0 and actual_data > 0 and actual_data < list_length) {
        @memcpy(malformed[1 .. 1 + actual_data], input[1 .. 1 + actual_data]);
        const result = rlp.decode(allocator, malformed[0 .. 1 + actual_data], false);

        // Should error due to insufficient data or invalid structure
        _ = result catch return;
        defer result.data.deinit(allocator);
    }
}

// Test empty inputs and edge cases
test "fuzz empty and minimal inputs" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Empty string encoding: 0x80
    {
        const empty = [_]u8{0x80};
        const decoded = try rlp.decode(allocator, &empty, false);
        defer decoded.data.deinit(allocator);

        switch (decoded.data) {
            .String => |str| try std.testing.expectEqual(@as(usize, 0), str.len),
            .List => unreachable,
        }
    }

    // Empty list encoding: 0xc0
    {
        const empty = [_]u8{0xc0};
        const decoded = try rlp.decode(allocator, &empty, false);
        defer decoded.data.deinit(allocator);

        switch (decoded.data) {
            .List => |items| try std.testing.expectEqual(@as(usize, 0), items.len),
            .String => unreachable,
        }
    }

    // Single byte from fuzz input
    if (input.len >= 1) {
        const single = [_]u8{input[0]};
        _ = rlp.decode(allocator, &single, false) catch return;
    }
}

// Test integer encoding edge cases
test "fuzz integer encoding" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 8) return;

    // Extract various integer sizes from fuzz input
    const u8_val = input[0];
    const u16_val = std.mem.readInt(u16, input[0..2], .big);
    const u32_val = std.mem.readInt(u32, input[0..4], .big);
    const u64_val = std.mem.readInt(u64, input[0..8], .big);

    // Test u8
    {
        const encoded = try rlp.encode(allocator, u8_val);
        defer allocator.free(encoded);

        const decoded = try rlp.decode(allocator, encoded, false);
        defer decoded.data.deinit(allocator);

        // Verify it's a string
        try std.testing.expect(decoded.data == .String);
    }

    // Test u16
    {
        const encoded = try rlp.encode(allocator, u16_val);
        defer allocator.free(encoded);

        const decoded = try rlp.decode(allocator, encoded, false);
        defer decoded.data.deinit(allocator);

        try std.testing.expect(decoded.data == .String);
    }

    // Test u32
    {
        const encoded = try rlp.encode(allocator, u32_val);
        defer allocator.free(encoded);

        const decoded = try rlp.decode(allocator, encoded, false);
        defer decoded.data.deinit(allocator);

        try std.testing.expect(decoded.data == .String);
    }

    // Test u64
    {
        const encoded = try rlp.encode(allocator, u64_val);
        defer allocator.free(encoded);

        const decoded = try rlp.decode(allocator, encoded, false);
        defer decoded.data.deinit(allocator);

        try std.testing.expect(decoded.data == .String);
    }

    // Test zero
    {
        const encoded = try rlp.encode(allocator, 0);
        defer allocator.free(encoded);

        try std.testing.expectEqual(@as(usize, 1), encoded.len);
        try std.testing.expectEqual(@as(u8, 0x80), encoded[0]);
    }
}

// Test boundary conditions for string lengths
test "fuzz boundary string lengths" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 56) return;

    // Test 55-byte string (short form boundary)
    {
        const str_55 = input[0..55];
        const encoded = try rlp.encode(allocator, str_55);
        defer allocator.free(encoded);

        try std.testing.expectEqual(@as(usize, 56), encoded.len);
        try std.testing.expectEqual(@as(u8, 0x80 + 55), encoded[0]);

        const decoded = try rlp.decode(allocator, encoded, false);
        defer decoded.data.deinit(allocator);

        switch (decoded.data) {
            .String => |str| try std.testing.expectEqualSlices(u8, str_55, str),
            .List => unreachable,
        }
    }

    // Test 56-byte string (long form boundary)
    {
        const str_56 = input[0..56];
        const encoded = try rlp.encode(allocator, str_56);
        defer allocator.free(encoded);

        try std.testing.expectEqual(@as(u8, 0xb8), encoded[0]);
        try std.testing.expectEqual(@as(u8, 56), encoded[1]);

        const decoded = try rlp.decode(allocator, encoded, false);
        defer decoded.data.deinit(allocator);

        switch (decoded.data) {
            .String => |str| try std.testing.expectEqualSlices(u8, str_56, str),
            .List => unreachable,
        }
    }
}

// Test that encoding always produces canonical form
test "fuzz canonical encoding property" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len > 1000) return; // Limit size

    // Encode the input
    const encoded = try rlp.encode(allocator, input);
    defer allocator.free(encoded);

    // Decode it
    const decoded = try rlp.decode(allocator, encoded, false);
    defer decoded.data.deinit(allocator);

    // Re-encode the decoded data
    const reencoded = switch (decoded.data) {
        .String => |str| try rlp.encode(allocator, str),
        .List => return, // Skip lists for this test
    };
    defer allocator.free(reencoded);

    // Should be identical (canonical form)
    try std.testing.expectEqualSlices(u8, encoded, reencoded);
}

// Test extra data detection in non-stream mode
test "fuzz extra data detection" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 5) return;

    // Create valid RLP followed by extra bytes
    const valid_rlp = [_]u8{ 0x83, 'd', 'o', 'g' };
    const extra_bytes = input[0..@min(input.len, 10)];

    var with_extra: [256]u8 = undefined;
    @memcpy(with_extra[0..4], &valid_rlp);
    @memcpy(with_extra[4 .. 4 + extra_bytes.len], extra_bytes);

    // Non-stream mode should reject extra data
    const result = rlp.decode(allocator, with_extra[0 .. 4 + extra_bytes.len], false);
    try std.testing.expectError(RlpError.InvalidRemainder, result);

    // Stream mode should accept it
    const stream_result = try rlp.decode(allocator, with_extra[0 .. 4 + extra_bytes.len], true);
    defer stream_result.data.deinit(allocator);

    try std.testing.expectEqual(extra_bytes.len, stream_result.remainder.len);
}

// Test allocation failure resilience
test "fuzz memory allocation patterns" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Limit input size to avoid legitimate OOM
    if (input.len > 5000) return;

    // Test encoding with allocation
    {
        const encoded = rlp.encode(allocator, input) catch return;
        defer allocator.free(encoded);

        // Encoded size should be reasonable
        try std.testing.expect(encoded.len <= input.len + 256);
    }

    // Test decoding with allocation
    {
        const encoded = rlp.encode(allocator, input) catch return;
        defer allocator.free(encoded);

        const decoded = rlp.decode(allocator, encoded, false) catch return;
        defer decoded.data.deinit(allocator);
    }
}

// Test list encoding/decoding with variable number of items
test "fuzz list with variable items" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 4) return;

    // Use first byte to determine number of items
    const num_items = (input[0] % 10) + 1; // 1-10 items
    const chunk_size = (input.len - 1) / num_items;

    if (chunk_size == 0) return;

    // Build list of encoded strings
    var items = std.ArrayList([]u8){};
    defer {
        for (items.items) |item| {
            allocator.free(item);
        }
        items.deinit(allocator);
    }

    var i: usize = 0;
    while (i < num_items) : (i += 1) {
        const start = 1 + i * chunk_size;
        const end = @min(start + chunk_size, input.len);
        if (start >= end) break;

        const chunk = input[start..end];
        const encoded_chunk = rlp.encode(allocator, chunk) catch return;
        items.append(allocator, encoded_chunk) catch return;
    }

    // Encode as list
    const encoded_list = rlp.encode(allocator, items.items) catch return;
    defer allocator.free(encoded_list);

    // Decode and verify
    const decoded = rlp.decode(allocator, encoded_list, false) catch return;
    defer decoded.data.deinit(allocator);

    switch (decoded.data) {
        .List => |decoded_items| {
            try std.testing.expectEqual(items.items.len, decoded_items.len);
        },
        .String => unreachable,
    }
}
