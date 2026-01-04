const std = @import("std");

/// SSZ encoding for basic types per consensus-specs
/// See: https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md
/// Encodes a u8 value
pub fn encodeUint8(value: u8) [1]u8 {
    return .{value};
}

/// Encodes a u16 value in little-endian format
pub fn encodeUint16(value: u16) [2]u8 {
    var result: [2]u8 = undefined;
    std.mem.writeInt(u16, &result, value, .little);
    return result;
}

/// Encodes a u32 value in little-endian format
pub fn encodeUint32(value: u32) [4]u8 {
    var result: [4]u8 = undefined;
    std.mem.writeInt(u32, &result, value, .little);
    return result;
}

/// Encodes a u64 value in little-endian format
pub fn encodeUint64(value: u64) [8]u8 {
    var result: [8]u8 = undefined;
    std.mem.writeInt(u64, &result, value, .little);
    return result;
}

/// Encodes a u256 value in little-endian format
pub fn encodeUint256(value: u256) [32]u8 {
    var result: [32]u8 = undefined;
    std.mem.writeInt(u256, &result, value, .little);
    return result;
}

/// Encodes a boolean value (1 for true, 0 for false)
pub fn encodeBool(value: bool) [1]u8 {
    return .{if (value) 1 else 0};
}

/// Decodes a u8 value
pub fn decodeUint8(bytes: []const u8) !u8 {
    if (bytes.len != 1) return error.InvalidLength;
    return bytes[0];
}

/// Decodes a u16 value from little-endian format
pub fn decodeUint16(bytes: []const u8) !u16 {
    if (bytes.len != 2) return error.InvalidLength;
    return std.mem.readInt(u16, bytes[0..2], .little);
}

/// Decodes a u32 value from little-endian format
pub fn decodeUint32(bytes: []const u8) !u32 {
    if (bytes.len != 4) return error.InvalidLength;
    return std.mem.readInt(u32, bytes[0..4], .little);
}

/// Decodes a u64 value from little-endian format
pub fn decodeUint64(bytes: []const u8) !u64 {
    if (bytes.len != 8) return error.InvalidLength;
    return std.mem.readInt(u64, bytes[0..8], .little);
}

/// Decodes a u256 value from little-endian format
pub fn decodeUint256(bytes: []const u8) !u256 {
    if (bytes.len != 32) return error.InvalidLength;
    return std.mem.readInt(u256, bytes[0..32], .little);
}

/// Decodes a boolean value (must be exactly 0 or 1 per SSZ spec)
pub fn decodeBool(bytes: []const u8) !bool {
    if (bytes.len != 1) return error.InvalidLength;
    return switch (bytes[0]) {
        0 => false,
        1 => true,
        else => error.InvalidBooleanValue,
    };
}

test "encodeUint8" {
    const result = encodeUint8(42);
    try std.testing.expectEqual(@as(u8, 42), result[0]);
}

test "encodeUint16" {
    const result = encodeUint16(0x1234);
    try std.testing.expectEqual(@as(u8, 0x34), result[0]);
    try std.testing.expectEqual(@as(u8, 0x12), result[1]);
}

test "encodeUint32" {
    const result = encodeUint32(0x12345678);
    try std.testing.expectEqual(@as(u8, 0x78), result[0]);
    try std.testing.expectEqual(@as(u8, 0x56), result[1]);
    try std.testing.expectEqual(@as(u8, 0x34), result[2]);
    try std.testing.expectEqual(@as(u8, 0x12), result[3]);
}

test "encodeUint64" {
    const result = encodeUint64(0x123456789ABCDEF0);
    try std.testing.expectEqual(@as(u8, 0xF0), result[0]);
    try std.testing.expectEqual(@as(u8, 0xDE), result[1]);
}

test "encodeBool" {
    const true_result = encodeBool(true);
    const false_result = encodeBool(false);
    try std.testing.expectEqual(@as(u8, 1), true_result[0]);
    try std.testing.expectEqual(@as(u8, 0), false_result[0]);
}

test "decode roundtrip u8" {
    const original: u8 = 42;
    const encoded = encodeUint8(original);
    const decoded = try decodeUint8(&encoded);
    try std.testing.expectEqual(original, decoded);
}

test "decode roundtrip u16" {
    const original: u16 = 0x1234;
    const encoded = encodeUint16(original);
    const decoded = try decodeUint16(&encoded);
    try std.testing.expectEqual(original, decoded);
}

test "decode roundtrip u32" {
    const original: u32 = 0x12345678;
    const encoded = encodeUint32(original);
    const decoded = try decodeUint32(&encoded);
    try std.testing.expectEqual(original, decoded);
}

test "decode roundtrip u64" {
    const original: u64 = 0x123456789ABCDEF0;
    const encoded = encodeUint64(original);
    const decoded = try decodeUint64(&encoded);
    try std.testing.expectEqual(original, decoded);
}

test "decode roundtrip bool" {
    const encoded_true = encodeBool(true);
    const encoded_false = encodeBool(false);
    try std.testing.expectEqual(true, try decodeBool(&encoded_true));
    try std.testing.expectEqual(false, try decodeBool(&encoded_false));
}

test "decodeBool rejects invalid values > 1" {
    // SSZ spec: boolean must be exactly 0 or 1
    const invalid_values = [_]u8{ 2, 127, 128, 255 };
    for (invalid_values) |val| {
        const bytes = [_]u8{val};
        try std.testing.expectError(error.InvalidBooleanValue, decodeBool(&bytes));
    }
}
