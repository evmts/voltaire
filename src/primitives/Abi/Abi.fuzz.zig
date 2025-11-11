//! Fuzz tests for ABI encoding/decoding
//!
//! Run with: zig build test --fuzz
//! On macOS, use Docker:
//!   docker run --rm -it -v $(pwd):/workspace -w /workspace \
//!     ziglang/zig:0.15.1 zig build test --fuzz=300s

const std = @import("std");
const primitives = @import("root");
const abi = primitives.Abi;
const AbiError = abi.AbiError;
const AbiType = abi.AbiType;
const AbiValue = abi.AbiValue;
const address = primitives.Address;

// Test basic decode doesn't panic on arbitrary input
test "fuzz decodeAbiParameters arbitrary input" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Single uint256 type - simplest case
    const types = [_]AbiType{.uint256};

    // Decode should never panic, only return error or valid result
    const result = abi.decodeAbiParameters(allocator, input, &types) catch |err| {
        try std.testing.expect(
            err == AbiError.InvalidLength or
                err == AbiError.InvalidType or
                err == AbiError.InvalidData or
                err == AbiError.DataTooSmall or
                err == AbiError.ZeroData or
                err == AbiError.OutOfBounds or
                err == AbiError.InvalidAddress or
                err == AbiError.InvalidUtf8 or
                err == AbiError.UnsupportedType or
                err == AbiError.OutOfMemory or
                err == AbiError.MaxLengthExceeded or
                err == AbiError.MaxRecursionDepthExceeded or
                err == AbiError.IntegerCastOverflow,
        );
        return;
    };
    defer allocator.free(result);

    // If successful, should have one value
    try std.testing.expectEqual(@as(usize, 1), result.len);
}

// Test decode with multiple types
test "fuzz decodeAbiParameters multiple types" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 1) return;

    // Choose number of types based on first byte
    const num_types = (input[0] % 5) + 1; // 1-5 types

    var types_buf: [5]AbiType = undefined;
    var types: []AbiType = types_buf[0..num_types];

    // Assign types based on input bytes
    var i: usize = 0;
    while (i < num_types) : (i += 1) {
        const type_byte = if (i + 1 < input.len) input[i + 1] else 0;
        types[i] = switch (type_byte % 10) {
            0 => .uint8,
            1 => .uint256,
            2 => .address,
            3 => .bool,
            4 => .bytes32,
            5 => .bytes,
            6 => .string,
            7 => .@"uint256[]",
            8 => .uint64,
            else => .uint32,
        };
    }

    _ = abi.decodeAbiParameters(allocator, input, types) catch return;
}

// Test invalid lengths for fixed-size types
test "fuzz decode invalid lengths" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len == 0 or input.len == 32) return; // Skip valid cases

    // uint256 requires exactly 32 bytes per value
    const types = [_]AbiType{.uint256};

    const result = abi.decodeAbiParameters(allocator, input, &types);

    // Should fail with appropriate error for wrong length
    if (input.len < 32) {
        try std.testing.expectError(AbiError.DataTooSmall, result);
    } else {
        // Longer input might succeed if it's a multiple of 32
        _ = result catch return;
    }
}

// Test decoding addresses
test "fuzz decode address values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    const types = [_]AbiType{.address};

    const result = abi.decodeAbiParameters(allocator, input, &types) catch return;
    defer allocator.free(result);

    // If successful, verify address invariant
    try std.testing.expectEqual(@as(usize, 1), result.len);
    const addr = result[0].address;
    try std.testing.expectEqual(@as(usize, 20), addr.bytes.len);
}

// Test decoding bool values
test "fuzz decode bool values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 32) return;

    const types = [_]AbiType{.bool};

    const result = abi.decodeAbiParameters(allocator, input, &types) catch return;
    defer allocator.free(result);

    // Bool should be decoded to true or false
    try std.testing.expectEqual(@as(usize, 1), result.len);
    const bool_val = result[0].bool;
    _ = bool_val; // Just verify it's accessible
}

// Test decoding dynamic bytes
test "fuzz decode dynamic bytes" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    const types = [_]AbiType{.bytes};

    _ = abi.decodeAbiParameters(allocator, input, &types) catch return;
    // Successful decode handled by function
}

// Test decoding strings with UTF-8 validation
test "fuzz decode string values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    const types = [_]AbiType{.string};

    const result = abi.decodeAbiParameters(allocator, input, &types) catch |err| {
        // String decoding can fail on invalid UTF-8
        try std.testing.expect(
            err == AbiError.InvalidUtf8 or
                err == AbiError.DataTooSmall or
                err == AbiError.OutOfBounds or
                err == AbiError.OutOfMemory or
                err == AbiError.MaxLengthExceeded or
                err == AbiError.IntegerCastOverflow,
        );
        return;
    };
    defer allocator.free(result);

    // If successful, verify it's valid UTF-8
    try std.testing.expectEqual(@as(usize, 1), result.len);
    const str = result[0].string;
    try std.testing.expect(std.unicode.utf8ValidateSlice(str));
}

// Test decoding fixed bytes types
test "fuzz decode fixed bytes" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 1) return;

    // Select fixed bytes type based on input
    const fixed_type = switch (input[0] % 7) {
        0 => AbiType.bytes1,
        1 => AbiType.bytes2,
        2 => AbiType.bytes3,
        3 => AbiType.bytes4,
        4 => AbiType.bytes8,
        5 => AbiType.bytes16,
        else => AbiType.bytes32,
    };

    const types = [_]AbiType{fixed_type};

    const result = abi.decodeAbiParameters(allocator, input, &types) catch return;
    defer allocator.free(result);

    // If successful, verify correct type returned
    try std.testing.expectEqual(@as(usize, 1), result.len);
    try std.testing.expectEqual(fixed_type, result[0]);
}

// Test decoding arrays
test "fuzz decode uint256 array" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    const types = [_]AbiType{.@"uint256[]"};

    _ = abi.decodeAbiParameters(allocator, input, &types) catch return;
    // Successful decode handled by function
}

// Test encoding uint values doesn't panic
test "fuzz encode uint values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 32) return;

    // Extract various uint values from input
    const u8_val = input[0];
    const u16_val = std.mem.readInt(u16, input[0..2], .big);
    const u32_val = std.mem.readInt(u32, input[0..4], .big);
    const u64_val = std.mem.readInt(u64, input[0..8], .big);
    const u256_val = std.mem.readInt(u256, input[0..32], .big);

    // Test each uint type
    {
        const values = [_]AbiValue{.{ .uint8 = u8_val }};
        const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
        defer allocator.free(encoded);
        try std.testing.expectEqual(@as(usize, 32), encoded.len);
    }

    {
        const values = [_]AbiValue{.{ .uint16 = u16_val }};
        const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
        defer allocator.free(encoded);
        try std.testing.expectEqual(@as(usize, 32), encoded.len);
    }

    {
        const values = [_]AbiValue{.{ .uint32 = u32_val }};
        const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
        defer allocator.free(encoded);
        try std.testing.expectEqual(@as(usize, 32), encoded.len);
    }

    {
        const values = [_]AbiValue{.{ .uint64 = u64_val }};
        const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
        defer allocator.free(encoded);
        try std.testing.expectEqual(@as(usize, 32), encoded.len);
    }

    {
        const values = [_]AbiValue{.{ .uint256 = u256_val }};
        const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
        defer allocator.free(encoded);
        try std.testing.expectEqual(@as(usize, 32), encoded.len);
    }
}

// Test encoding addresses
test "fuzz encode address values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = try address.Address.fromBytes(input[0..20]);
    const values = [_]AbiValue{.{ .address = addr }};

    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // Address encodes to 32 bytes (padded)
    try std.testing.expectEqual(@as(usize, 32), encoded.len);

    // First 12 bytes should be zero (left padding)
    for (encoded[0..12]) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }
}

// Test encoding bool values
test "fuzz encode bool values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 1) return;

    const bool_val = input[0] & 1 == 1;
    const values = [_]AbiValue{.{ .bool = bool_val }};

    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 32), encoded.len);

    // Last byte should be 0 or 1
    const last_byte = encoded[31];
    try std.testing.expect(last_byte == 0 or last_byte == 1);
}

// Test encoding dynamic bytes
test "fuzz encode dynamic bytes" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Limit size to avoid OOM
    if (input.len > 10000) return;

    const values = [_]AbiValue{.{ .bytes = input }};

    const encoded = abi.encodeAbiParameters(allocator, &values) catch |err| {
        try std.testing.expect(
            err == error.OutOfMemory or
                err == AbiError.MaxLengthExceeded,
        );
        return;
    };
    defer allocator.free(encoded);

    // Encoded size should be at least: 32 (offset) + 32 (length) + rounded up data
    const min_size = 64 + ((input.len + 31) / 32) * 32;
    try std.testing.expect(encoded.len >= min_size);
}

// Test encoding strings
test "fuzz encode string values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Limit size and validate UTF-8
    if (input.len > 10000 or !std.unicode.utf8ValidateSlice(input)) return;

    const values = [_]AbiValue{.{ .string = input }};

    const encoded = abi.encodeAbiParameters(allocator, &values) catch |err| {
        try std.testing.expect(
            err == error.OutOfMemory or
                err == AbiError.MaxLengthExceeded,
        );
        return;
    };
    defer allocator.free(encoded);

    // String encoding same as bytes
    const min_size = 64 + ((input.len + 31) / 32) * 32;
    try std.testing.expect(encoded.len >= min_size);
}

// Test encoding fixed bytes
test "fuzz encode fixed bytes" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 32) return;

    // Test bytes32
    const bytes32_val: [32]u8 = input[0..32].*;
    const values = [_]AbiValue{.{ .bytes32 = bytes32_val }};

    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 32), encoded.len);
    try std.testing.expectEqualSlices(u8, &bytes32_val, encoded);
}

// Test roundtrip: decode(encode(x)) == x for uint256
test "fuzz roundtrip uint256 encoding" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 32) return;

    const original = std.mem.readInt(u256, input[0..32], .big);
    const values = [_]AbiValue{.{ .uint256 = original }};

    // Encode
    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // Decode
    const types = [_]AbiType{.uint256};
    const decoded = try abi.decodeAbiParameters(allocator, encoded, &types);
    defer allocator.free(decoded);

    // Verify roundtrip
    try std.testing.expectEqual(@as(usize, 1), decoded.len);
    try std.testing.expectEqual(original, decoded[0].uint256);
}

// Test roundtrip for addresses
test "fuzz roundtrip address encoding" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const original_addr = try address.Address.fromBytes(input[0..20]);
    const values = [_]AbiValue{.{ .address = original_addr }};

    // Encode
    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // Decode
    const types = [_]AbiType{.address};
    const decoded = try abi.decodeAbiParameters(allocator, encoded, &types);
    defer allocator.free(decoded);

    // Verify roundtrip
    try std.testing.expectEqual(@as(usize, 1), decoded.len);
    try std.testing.expect(address.Address.equals(original_addr, decoded[0].address));
}

// Test roundtrip for bool
test "fuzz roundtrip bool encoding" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 1) return;

    const original_bool = input[0] & 1 == 1;
    const values = [_]AbiValue{.{ .bool = original_bool }};

    // Encode
    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // Decode
    const types = [_]AbiType{.bool};
    const decoded = try abi.decodeAbiParameters(allocator, encoded, &types);
    defer allocator.free(decoded);

    // Verify roundtrip
    try std.testing.expectEqual(@as(usize, 1), decoded.len);
    try std.testing.expectEqual(original_bool, decoded[0].bool);
}

// Test roundtrip for bytes32
test "fuzz roundtrip bytes32 encoding" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 32) return;

    const original: [32]u8 = input[0..32].*;
    const values = [_]AbiValue{.{ .bytes32 = original }};

    // Encode
    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // Decode
    const types = [_]AbiType{.bytes32};
    const decoded = try abi.decodeAbiParameters(allocator, encoded, &types);
    defer allocator.free(decoded);

    // Verify roundtrip
    try std.testing.expectEqual(@as(usize, 1), decoded.len);
    try std.testing.expectEqualSlices(u8, &original, &decoded[0].bytes32);
}

// Test roundtrip for dynamic bytes
test "fuzz roundtrip bytes encoding" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len > 1000) return; // Limit size

    const values = [_]AbiValue{.{ .bytes = input }};

    // Encode
    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // Decode
    const types = [_]AbiType{.bytes};
    const decoded = try abi.decodeAbiParameters(allocator, encoded, &types);
    defer allocator.free(decoded);

    // Verify roundtrip
    try std.testing.expectEqual(@as(usize, 1), decoded.len);
    try std.testing.expectEqualSlices(u8, input, decoded[0].bytes);
}

// Test roundtrip for strings
test "fuzz roundtrip string encoding" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len > 1000 or !std.unicode.utf8ValidateSlice(input)) return;

    const values = [_]AbiValue{.{ .string = input }};

    // Encode
    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // Decode
    const types = [_]AbiType{.string};
    const decoded = try abi.decodeAbiParameters(allocator, encoded, &types);
    defer allocator.free(decoded);

    // Verify roundtrip
    try std.testing.expectEqual(@as(usize, 1), decoded.len);
    try std.testing.expectEqualSlices(u8, input, decoded[0].string);
}

// Test multiple parameters encoding
test "fuzz encode multiple parameters" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return; // 32 + 20 minimum

    const u256_val = std.mem.readInt(u256, input[0..32], .big);
    const addr = try address.Address.fromBytes(input[32..52]);

    const values = [_]AbiValue{
        .{ .uint256 = u256_val },
        .{ .address = addr },
    };

    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // Should be 64 bytes (two 32-byte words)
    try std.testing.expectEqual(@as(usize, 64), encoded.len);
}

// Test function data encoding
test "fuzz encodeFunctionData" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 36) return; // 4-byte selector + 32 bytes data

    const selector: [4]u8 = input[0..4].*;
    const u256_val = std.mem.readInt(u256, input[4..36], .big);

    const params = [_]AbiValue{.{ .uint256 = u256_val }};

    const encoded = try abi.encodeFunctionData(allocator, selector, &params);
    defer allocator.free(encoded);

    // Should be selector + encoded params
    try std.testing.expectEqual(@as(usize, 36), encoded.len);
    try std.testing.expectEqualSlices(u8, &selector, encoded[0..4]);
}

// Test function data decoding
test "fuzz decodeFunctionData" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    const types = [_]AbiType{.uint256};

    const result = abi.decodeFunctionData(allocator, input, &types) catch |err| {
        try std.testing.expect(
            err == AbiError.InvalidLength or
                err == AbiError.InvalidSelector or
                err == AbiError.DataTooSmall or
                err == AbiError.OutOfBounds or
                err == AbiError.OutOfMemory or
                err == AbiError.MaxLengthExceeded or
                err == AbiError.IntegerCastOverflow,
        );
        return;
    };
    defer allocator.free(result.parameters);

    // If successful, should have selector and params
    try std.testing.expectEqual(@as(usize, 1), result.parameters.len);
}

// Test selector computation
test "fuzz computeSelector" {
    const input = std.testing.fuzzInput(.{});

    if (input.len == 0) return;

    // computeSelector should never panic
    const selector = abi.computeSelector(input);

    // Selector is always 4 bytes
    try std.testing.expectEqual(@as(usize, 4), selector.len);
}

// Test encodePacked
test "fuzz encodePacked" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 32) return;

    const u256_val = std.mem.readInt(u256, input[0..32], .big);
    const values = [_]AbiValue{.{ .uint256 = u256_val }};

    const encoded = abi.encodePacked(allocator, &values) catch |err| {
        try std.testing.expect(
            err == error.OutOfMemory or
                err == AbiError.MaxLengthExceeded or
                err == AbiError.UnsupportedType,
        );
        return;
    };
    defer allocator.free(encoded);

    // Packed encoding should be compact (32 bytes for uint256)
    try std.testing.expectEqual(@as(usize, 32), encoded.len);
}

// Test malformed padding in encoded data
test "fuzz decode with invalid padding" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 32) return;

    // Address decoding expects left-padding with zeros
    // Test with potentially non-zero padding
    const types = [_]AbiType{.address};

    _ = abi.decodeAbiParameters(allocator, input, &types) catch return;
    // May succeed or fail depending on padding
}

// Test oversized data
test "fuzz decode oversized data" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Create oversized data if input allows
    if (input.len > 1000) {
        const types = [_]AbiType{.bytes};
        _ = abi.decodeAbiParameters(allocator, input, &types) catch return;
    }
}

// Test nested dynamic types (arrays)
test "fuzz encode uint256 array" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 64) return;

    // Create small array from input
    const val1 = std.mem.readInt(u256, input[0..32], .big);
    const val2 = std.mem.readInt(u256, input[32..64], .big);

    const array = [_]u256{ val1, val2 };
    const values = [_]AbiValue{.{ .@"uint256[]" = &array }};

    const encoded = abi.encodeAbiParameters(allocator, &values) catch |err| {
        try std.testing.expect(
            err == error.OutOfMemory or
                err == AbiError.MaxLengthExceeded,
        );
        return;
    };
    defer allocator.free(encoded);

    // Verify minimum size: offset (32) + length (32) + 2 elements (64)
    try std.testing.expect(encoded.len >= 128);
}

// Test empty array encoding
test "fuzz encode empty array" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    _ = input; // Unused but required for fuzz

    const empty: []const u256 = &[_]u256{};
    const values = [_]AbiValue{.{ .@"uint256[]" = empty }};

    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // Empty array: offset (32) + length (32) = 64 bytes
    try std.testing.expectEqual(@as(usize, 64), encoded.len);
}

// Test large array to trigger allocation limits
test "fuzz encode large array allocation" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 4) return;

    // Use input to determine array size
    const size = std.mem.readInt(u32, input[0..4], .big);

    // Cap at reasonable size to avoid timeout
    if (size > 1000) return;

    // Allocate array
    const array = allocator.alloc(u256, size) catch return;
    defer allocator.free(array);

    // Fill with data from input
    for (array, 0..) |*val, i| {
        const offset = (i * 32) % input.len;
        if (offset + 32 <= input.len) {
            val.* = std.mem.readInt(u256, input[offset..][0..32], .big);
        } else {
            val.* = 0;
        }
    }

    const values = [_]AbiValue{.{ .@"uint256[]" = array }};

    _ = abi.encodeAbiParameters(allocator, &values) catch return;
}

// Test mixed static and dynamic types
test "fuzz encode mixed types" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return;

    const u256_val = std.mem.readInt(u256, input[0..32], .big);
    const addr = try address.Address.fromBytes(input[32..52]);
    const bytes_data = if (input.len > 52) input[52..@min(input.len, 200)] else &[_]u8{};

    const values = [_]AbiValue{
        .{ .uint256 = u256_val },
        .{ .address = addr },
        .{ .bytes = bytes_data },
    };

    const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
    defer allocator.free(encoded);

    // Verify minimum size (64 + dynamic offset + length + data)
    try std.testing.expect(encoded.len >= 96);
}

// Test integer overflow in size calculations
test "fuzz integer overflow in decoding" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 64) return;

    // Try to construct data with very large length field
    var malformed: [128]u8 = undefined;
    @memcpy(malformed[0..64], input[0..64]);

    // Set large length in offset position (might trigger overflow)
    std.mem.writeInt(u256, malformed[0..32], 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF, .big);

    const types = [_]AbiType{.bytes};

    _ = abi.decodeAbiParameters(allocator, &malformed, &types) catch return;
}

// Test zero-length edge cases
test "fuzz decode zero length data" {
    const allocator = std.testing.allocator;

    const empty: []const u8 = &[_]u8{};
    const types = [_]AbiType{.uint256};

    const result = abi.decodeAbiParameters(allocator, empty, &types);

    // Should fail on zero-length data
    try std.testing.expectError(AbiError.ZeroData, result);
}

// Test malformed dynamic data offsets
test "fuzz malformed dynamic offsets" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 64) return;

    // Dynamic type with potentially invalid offset
    const types = [_]AbiType{.bytes};

    _ = abi.decodeAbiParameters(allocator, input, &types) catch return;
    // May fail with OutOfBounds or other errors
}

// Test determinism: same input produces same output
test "fuzz encoding determinism" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 32) return;

    const u256_val = std.mem.readInt(u256, input[0..32], .big);
    const values = [_]AbiValue{.{ .uint256 = u256_val }};

    // Encode twice
    const encoded1 = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded1);

    const encoded2 = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded2);

    // Should be identical
    try std.testing.expectEqualSlices(u8, encoded1, encoded2);
}

// Test bytes32 array encoding
test "fuzz encode bytes32 array" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 64) return;

    const val1: [32]u8 = input[0..32].*;
    const val2: [32]u8 = input[32..64].*;

    const array = [_][32]u8{ val1, val2 };
    const values = [_]AbiValue{.{ .@"bytes32[]" = &array }};

    const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
    defer allocator.free(encoded);

    // Verify minimum size
    try std.testing.expect(encoded.len >= 128);
}

// Test address array encoding
test "fuzz encode address array" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 40) return;

    const addr1 = try address.Address.fromBytes(input[0..20]);
    const addr2 = try address.Address.fromBytes(input[20..40]);

    const array = [_]address.Address{ addr1, addr2 };
    const values = [_]AbiValue{.{ .@"address[]" = &array }};

    const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
    defer allocator.free(encoded);

    // Verify minimum size: offset + length + 2 addresses
    try std.testing.expect(encoded.len >= 128);
}

// Test all integer types
test "fuzz encode all integer types" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 32) return;

    // Test signed integers
    const i8_val: i8 = @bitCast(input[0]);
    const i16_val = std.mem.readInt(i16, input[0..2], .big);
    const i32_val = std.mem.readInt(i32, input[0..4], .big);
    const i64_val = std.mem.readInt(i64, input[0..8], .big);

    {
        const values = [_]AbiValue{.{ .int8 = i8_val }};
        const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
        defer allocator.free(encoded);
        try std.testing.expectEqual(@as(usize, 32), encoded.len);
    }

    {
        const values = [_]AbiValue{.{ .int16 = i16_val }};
        const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
        defer allocator.free(encoded);
        try std.testing.expectEqual(@as(usize, 32), encoded.len);
    }

    {
        const values = [_]AbiValue{.{ .int32 = i32_val }};
        const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
        defer allocator.free(encoded);
        try std.testing.expectEqual(@as(usize, 32), encoded.len);
    }

    {
        const values = [_]AbiValue{.{ .int64 = i64_val }};
        const encoded = abi.encodeAbiParameters(allocator, &values) catch return;
        defer allocator.free(encoded);
        try std.testing.expectEqual(@as(usize, 32), encoded.len);
    }
}

// Test boundary values for integers
test "fuzz integer boundary values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    _ = input; // Unused but required

    // Test max/min values
    {
        const values = [_]AbiValue{.{ .uint8 = std.math.maxInt(u8) }};
        const encoded = try abi.encodeAbiParameters(allocator, &values);
        defer allocator.free(encoded);

        const types = [_]AbiType{.uint8};
        const decoded = try abi.decodeAbiParameters(allocator, encoded, &types);
        defer allocator.free(decoded);

        try std.testing.expectEqual(std.math.maxInt(u8), decoded[0].uint8);
    }

    {
        const values = [_]AbiValue{.{ .uint256 = std.math.maxInt(u256) }};
        const encoded = try abi.encodeAbiParameters(allocator, &values);
        defer allocator.free(encoded);

        const types = [_]AbiType{.uint256};
        const decoded = try abi.decodeAbiParameters(allocator, encoded, &types);
        defer allocator.free(decoded);

        try std.testing.expectEqual(std.math.maxInt(u256), decoded[0].uint256);
    }
}

// Test data alignment and padding
test "fuzz verify 32-byte alignment" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len > 1000) return;

    const values = [_]AbiValue{.{ .bytes = input }};

    const encoded = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // All ABI encoding should be 32-byte aligned
    try std.testing.expectEqual(@as(usize, 0), encoded.len % 32);
}

// Run fuzz tests with: zig build test --fuzz
