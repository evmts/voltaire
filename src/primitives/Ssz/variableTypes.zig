const std = @import("std");
const basicTypes = @import("basicTypes.zig");

/// SSZ encoding for variable-length types
/// See: https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md
/// Encodes a vector (fixed-length homogeneous collection)
/// Caller owns returned memory
pub fn encodeVector(allocator: std.mem.Allocator, comptime T: type, items: []const T) ![]u8 {
    const item_size = @sizeOf(T);
    const total_size = items.len * item_size;
    const result = try allocator.alloc(u8, total_size);
    errdefer allocator.free(result);

    for (items, 0..) |item, i| {
        const offset = i * item_size;
        const item_bytes = std.mem.asBytes(&item);
        @memcpy(result[offset..][0..item_size], item_bytes);
    }

    return result;
}

/// Encodes a list (variable-length with max size)
/// List encoding: length prefix (4 bytes) + serialized items
/// Caller owns returned memory
pub fn encodeList(allocator: std.mem.Allocator, comptime T: type, items: []const T, max: usize) ![]u8 {
    if (items.len > max) return error.ExceedsMaxLength;

    const item_size = @sizeOf(T);
    const total_size = 4 + (items.len * item_size);
    const result = try allocator.alloc(u8, total_size);
    errdefer allocator.free(result);

    // Write length prefix
    const len_bytes = basicTypes.encodeUint32(@intCast(items.len));
    @memcpy(result[0..4], &len_bytes);

    // Write items
    for (items, 0..) |item, i| {
        const offset = 4 + (i * item_size);
        const item_bytes = std.mem.asBytes(&item);
        @memcpy(result[offset..][0..item_size], item_bytes);
    }

    return result;
}

/// Encodes a bitvector (fixed-length collection of bits)
/// Packs bits into bytes, LSB first within each byte
/// Caller owns returned memory
pub fn encodeBitvector(allocator: std.mem.Allocator, bits: []const bool) ![]u8 {
    const byte_count = (bits.len + 7) / 8;
    const result = try allocator.alloc(u8, byte_count);
    errdefer allocator.free(result);

    @memset(result, 0);

    for (bits, 0..) |bit, i| {
        if (bit) {
            const byte_idx = i / 8;
            const bit_idx: u3 = @intCast(i % 8);
            result[byte_idx] |= @as(u8, 1) << bit_idx;
        }
    }

    return result;
}

/// Encodes a bitlist (variable-length collection of bits with max size)
/// Adds a sentinel bit to indicate length
/// Caller owns returned memory
pub fn encodeBitlist(allocator: std.mem.Allocator, bits: []const bool, max: usize) ![]u8 {
    if (bits.len > max) return error.ExceedsMaxLength;

    // Add sentinel bit
    const total_bits = bits.len + 1;
    const byte_count = (total_bits + 7) / 8;
    const result = try allocator.alloc(u8, byte_count);
    errdefer allocator.free(result);

    @memset(result, 0);

    // Pack data bits
    for (bits, 0..) |bit, i| {
        if (bit) {
            const byte_idx = i / 8;
            const bit_idx: u3 = @intCast(i % 8);
            result[byte_idx] |= @as(u8, 1) << bit_idx;
        }
    }

    // Add sentinel bit
    const sentinel_idx = bits.len;
    const byte_idx = sentinel_idx / 8;
    const bit_idx: u3 = @intCast(sentinel_idx % 8);
    result[byte_idx] |= @as(u8, 1) << bit_idx;

    return result;
}

/// Encodes bytes (variable-length byte array)
/// Simply returns a copy of the input
/// Caller owns returned memory
pub fn encodeBytes(allocator: std.mem.Allocator, bytes: []const u8) ![]u8 {
    const result = try allocator.alloc(u8, bytes.len);
    @memcpy(result, bytes);
    return result;
}

test "encodeVector u8" {
    const allocator = std.testing.allocator;
    const items = [_]u8{ 1, 2, 3, 4 };
    const result = try encodeVector(allocator, u8, &items);
    defer allocator.free(result);

    try std.testing.expectEqual(@as(usize, 4), result.len);
    try std.testing.expectEqual(@as(u8, 1), result[0]);
    try std.testing.expectEqual(@as(u8, 2), result[1]);
    try std.testing.expectEqual(@as(u8, 3), result[2]);
    try std.testing.expectEqual(@as(u8, 4), result[3]);
}

test "encodeVector u32" {
    const allocator = std.testing.allocator;
    const items = [_]u32{ 0x01020304, 0x05060708 };
    const result = try encodeVector(allocator, u32, &items);
    defer allocator.free(result);

    try std.testing.expectEqual(@as(usize, 8), result.len);
}

test "encodeList" {
    const allocator = std.testing.allocator;
    const items = [_]u8{ 1, 2, 3 };
    const result = try encodeList(allocator, u8, &items, 10);
    defer allocator.free(result);

    try std.testing.expectEqual(@as(usize, 7), result.len); // 4 byte prefix + 3 items
    // Check length prefix (little-endian)
    try std.testing.expectEqual(@as(u8, 3), result[0]);
    try std.testing.expectEqual(@as(u8, 0), result[1]);
    try std.testing.expectEqual(@as(u8, 0), result[2]);
    try std.testing.expectEqual(@as(u8, 0), result[3]);
    // Check items
    try std.testing.expectEqual(@as(u8, 1), result[4]);
    try std.testing.expectEqual(@as(u8, 2), result[5]);
    try std.testing.expectEqual(@as(u8, 3), result[6]);
}

test "encodeList exceeds max" {
    const allocator = std.testing.allocator;
    const items = [_]u8{ 1, 2, 3, 4, 5 };
    const result = encodeList(allocator, u8, &items, 3);
    try std.testing.expectError(error.ExceedsMaxLength, result);
}

test "encodeBitvector" {
    const allocator = std.testing.allocator;
    const bits = [_]bool{ true, false, true, true, false, false, true, false };
    const result = try encodeBitvector(allocator, &bits);
    defer allocator.free(result);

    try std.testing.expectEqual(@as(usize, 1), result.len);
    // Binary: 01011101 (reversed due to LSB first)
    try std.testing.expectEqual(@as(u8, 0b01011101), result[0]);
}

test "encodeBitvector multi-byte" {
    const allocator = std.testing.allocator;
    const bits = [_]bool{ true, false, false, false, false, false, false, false, true };
    const result = try encodeBitvector(allocator, &bits);
    defer allocator.free(result);

    try std.testing.expectEqual(@as(usize, 2), result.len);
    try std.testing.expectEqual(@as(u8, 0b00000001), result[0]);
    try std.testing.expectEqual(@as(u8, 0b00000001), result[1]);
}

test "encodeBitlist" {
    const allocator = std.testing.allocator;
    const bits = [_]bool{ true, false, true };
    const result = try encodeBitlist(allocator, &bits, 10);
    defer allocator.free(result);

    try std.testing.expectEqual(@as(usize, 1), result.len);
    // Binary: 00001101 (data bits + sentinel)
    try std.testing.expectEqual(@as(u8, 0b00001101), result[0]);
}

test "encodeBytes" {
    const allocator = std.testing.allocator;
    const bytes = [_]u8{ 0xDE, 0xAD, 0xBE, 0xEF };
    const result = try encodeBytes(allocator, &bytes);
    defer allocator.free(result);

    try std.testing.expectEqual(@as(usize, 4), result.len);
    try std.testing.expectEqualSlices(u8, &bytes, result);
}
