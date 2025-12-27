//! Variable-length byte array utilities
//!
//! Provides operations for working with dynamic-length byte arrays,
//! complementing the fixed-size BytesN types.

const std = @import("std");
const Hex = @import("primitives").Hex;

/// Create bytes from hex string (allocates)
pub fn fromHex(allocator: std.mem.Allocator, hex: []const u8) ![]u8 {
    return try Hex.decode(allocator, hex);
}

test "fromHex - basic" {
    const allocator = std.testing.allocator;
    const bytes = try fromHex(allocator, "0x1234");
    defer allocator.free(bytes);

    try std.testing.expectEqual(2, bytes.len);
    try std.testing.expectEqual(@as(u8, 0x12), bytes[0]);
    try std.testing.expectEqual(@as(u8, 0x34), bytes[1]);
}

test "fromHex - empty" {
    const allocator = std.testing.allocator;
    const bytes = try fromHex(allocator, "0x");
    defer allocator.free(bytes);

    try std.testing.expectEqual(0, bytes.len);
}

/// Convert bytes to hex string (allocates)
pub fn toHex(allocator: std.mem.Allocator, bytes: []const u8) ![]u8 {
    return try Hex.encode(allocator, bytes);
}

test "toHex - basic" {
    const allocator = std.testing.allocator;
    const hex = try toHex(allocator, &[_]u8{ 0x12, 0x34 });
    defer allocator.free(hex);

    try std.testing.expectEqualStrings("0x1234", hex);
}

test "toHex - empty" {
    const allocator = std.testing.allocator;
    const hex = try toHex(allocator, &[_]u8{});
    defer allocator.free(hex);

    try std.testing.expectEqualStrings("0x", hex);
}

/// Create bytes from UTF-8 string (no allocation, returns slice)
pub fn fromString(str: []const u8) []const u8 {
    return str;
}

test "fromString - basic" {
    const bytes = fromString("hello");
    try std.testing.expectEqual(5, bytes.len);
    try std.testing.expectEqualStrings("hello", bytes);
}

test "fromString - empty" {
    const bytes = fromString("");
    try std.testing.expectEqual(0, bytes.len);
}

/// Convert bytes to UTF-8 string (no allocation, returns slice)
pub fn toString(bytes: []const u8) []const u8 {
    return bytes;
}

test "toString - basic" {
    const str = toString(&[_]u8{ 'h', 'e', 'l', 'l', 'o' });
    try std.testing.expectEqualStrings("hello", str);
}

/// Concatenate multiple byte arrays (allocates)
pub fn concat(allocator: std.mem.Allocator, arrays: []const []const u8) ![]u8 {
    var total: usize = 0;
    for (arrays) |arr| {
        total += arr.len;
    }

    const result = try allocator.alloc(u8, total);
    var offset: usize = 0;
    for (arrays) |arr| {
        @memcpy(result[offset .. offset + arr.len], arr);
        offset += arr.len;
    }

    return result;
}

test "concat - basic" {
    const allocator = std.testing.allocator;
    const arrays = [_][]const u8{
        &[_]u8{ 0x01, 0x02 },
        &[_]u8{ 0x03, 0x04 },
        &[_]u8{0x05},
    };
    const result = try concat(allocator, &arrays);
    defer allocator.free(result);

    try std.testing.expectEqual(5, result.len);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x01, 0x02, 0x03, 0x04, 0x05 }, result);
}

test "concat - empty arrays" {
    const allocator = std.testing.allocator;
    const arrays = [_][]const u8{};
    const result = try concat(allocator, &arrays);
    defer allocator.free(result);

    try std.testing.expectEqual(0, result.len);
}

test "concat - with empty elements" {
    const allocator = std.testing.allocator;
    const arrays = [_][]const u8{
        &[_]u8{0x01},
        &[_]u8{},
        &[_]u8{0x02},
    };
    const result = try concat(allocator, &arrays);
    defer allocator.free(result);

    try std.testing.expectEqual(2, result.len);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x01, 0x02 }, result);
}

/// Slice bytes (no allocation)
pub fn slice(bytes: []const u8, start: usize, end: ?usize) []const u8 {
    const e = end orelse bytes.len;
    return bytes[start..e];
}

test "slice - basic" {
    const bytes = &[_]u8{ 0x01, 0x02, 0x03, 0x04 };
    const s = slice(bytes, 1, 3);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x02, 0x03 }, s);
}

test "slice - no end" {
    const bytes = &[_]u8{ 0x01, 0x02, 0x03, 0x04 };
    const s = slice(bytes, 2, null);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x03, 0x04 }, s);
}

test "slice - empty" {
    const bytes = &[_]u8{ 0x01, 0x02 };
    const s = slice(bytes, 1, 1);
    try std.testing.expectEqual(0, s.len);
}

/// Check if two byte arrays are equal
pub fn equals(a: []const u8, b: []const u8) bool {
    if (a.len != b.len) return false;
    for (a, b) |x, y| {
        if (x != y) return false;
    }
    return true;
}

test "equals - true" {
    const a = &[_]u8{ 0x01, 0x02, 0x03 };
    const b = &[_]u8{ 0x01, 0x02, 0x03 };
    try std.testing.expect(equals(a, b));
}

test "equals - false" {
    const a = &[_]u8{ 0x01, 0x02, 0x03 };
    const b = &[_]u8{ 0x01, 0x02, 0x04 };
    try std.testing.expect(!equals(a, b));
}

test "equals - different lengths" {
    const a = &[_]u8{ 0x01, 0x02 };
    const b = &[_]u8{ 0x01, 0x02, 0x03 };
    try std.testing.expect(!equals(a, b));
}

test "equals - empty" {
    const a = &[_]u8{};
    const b = &[_]u8{};
    try std.testing.expect(equals(a, b));
}

/// Compare two byte arrays lexicographically
/// Returns: -1 if a < b, 0 if equal, 1 if a > b
pub fn compare(a: []const u8, b: []const u8) i8 {
    const min_len = @min(a.len, b.len);
    for (0..min_len) |i| {
        if (a[i] < b[i]) return -1;
        if (a[i] > b[i]) return 1;
    }
    if (a.len < b.len) return -1;
    if (a.len > b.len) return 1;
    return 0;
}

test "compare - equal" {
    const a = &[_]u8{ 0x01, 0x02, 0x03 };
    const b = &[_]u8{ 0x01, 0x02, 0x03 };
    try std.testing.expectEqual(@as(i8, 0), compare(a, b));
}

test "compare - less" {
    const a = &[_]u8{ 0x01, 0x02, 0x03 };
    const b = &[_]u8{ 0x01, 0x02, 0x04 };
    try std.testing.expectEqual(@as(i8, -1), compare(a, b));
}

test "compare - greater" {
    const a = &[_]u8{ 0x01, 0x03, 0x03 };
    const b = &[_]u8{ 0x01, 0x02, 0x03 };
    try std.testing.expectEqual(@as(i8, 1), compare(a, b));
}

test "compare - shorter less" {
    const a = &[_]u8{ 0x01, 0x02 };
    const b = &[_]u8{ 0x01, 0x02, 0x03 };
    try std.testing.expectEqual(@as(i8, -1), compare(a, b));
}

test "compare - longer greater" {
    const a = &[_]u8{ 0x01, 0x02, 0x03 };
    const b = &[_]u8{ 0x01, 0x02 };
    try std.testing.expectEqual(@as(i8, 1), compare(a, b));
}

test "compare - empty equal" {
    const a = &[_]u8{};
    const b = &[_]u8{};
    try std.testing.expectEqual(@as(i8, 0), compare(a, b));
}

/// Get size of byte array
pub fn size(bytes: []const u8) usize {
    return bytes.len;
}

test "size - basic" {
    const bytes = &[_]u8{ 0x01, 0x02, 0x03 };
    try std.testing.expectEqual(3, size(bytes));
}

test "size - empty" {
    const bytes = &[_]u8{};
    try std.testing.expectEqual(0, size(bytes));
}

/// Clone byte array (allocates)
pub fn clone(allocator: std.mem.Allocator, bytes: []const u8) ![]u8 {
    const result = try allocator.alloc(u8, bytes.len);
    @memcpy(result, bytes);
    return result;
}

test "clone - basic" {
    const allocator = std.testing.allocator;
    const original = &[_]u8{ 0x01, 0x02, 0x03 };
    const copy = try clone(allocator, original);
    defer allocator.free(copy);

    try std.testing.expectEqualSlices(u8, original, copy);
    // Verify different memory
    try std.testing.expect(original.ptr != copy.ptr);
}

test "clone - empty" {
    const allocator = std.testing.allocator;
    const original = &[_]u8{};
    const copy = try clone(allocator, original);
    defer allocator.free(copy);

    try std.testing.expectEqual(0, copy.len);
}

/// Check if byte array is empty
pub fn isEmpty(bytes: []const u8) bool {
    return bytes.len == 0;
}

test "isEmpty - true" {
    const bytes = &[_]u8{};
    try std.testing.expect(isEmpty(bytes));
}

test "isEmpty - false" {
    const bytes = &[_]u8{0x01};
    try std.testing.expect(!isEmpty(bytes));
}

/// Create zero-filled byte array (allocates)
pub fn zero(allocator: std.mem.Allocator, len: usize) ![]u8 {
    const result = try allocator.alloc(u8, len);
    @memset(result, 0);
    return result;
}

test "zero - basic" {
    const allocator = std.testing.allocator;
    const bytes = try zero(allocator, 5);
    defer allocator.free(bytes);

    try std.testing.expectEqual(5, bytes.len);
    for (bytes) |b| {
        try std.testing.expectEqual(@as(u8, 0), b);
    }
}

test "zero - empty" {
    const allocator = std.testing.allocator;
    const bytes = try zero(allocator, 0);
    defer allocator.free(bytes);

    try std.testing.expectEqual(0, bytes.len);
}

/// Convert number to bytes (big-endian)
pub fn fromNumber(value: u64) []const u8 {
    if (value == 0) return &[_]u8{0};

    // Count bytes needed
    var v = value;
    var byte_count: usize = 0;
    while (v > 0) : (v >>= 8) {
        byte_count += 1;
    }

    // Use static buffer for small values
    const Static = struct {
        var buf: [8]u8 = undefined;
    };

    v = value;
    var i: usize = byte_count;
    while (i > 0) {
        i -= 1;
        Static.buf[i] = @truncate(v & 0xff);
        v >>= 8;
    }

    return Static.buf[0..byte_count];
}

test "fromNumber - basic" {
    try std.testing.expectEqualSlices(u8, &[_]u8{0}, fromNumber(0));
    try std.testing.expectEqualSlices(u8, &[_]u8{1}, fromNumber(1));
    try std.testing.expectEqualSlices(u8, &[_]u8{0xff}, fromNumber(255));
    try std.testing.expectEqualSlices(u8, &[_]u8{ 1, 0 }, fromNumber(256));
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x12, 0x34 }, fromNumber(0x1234));
}

/// Convert bytes to number (big-endian)
pub fn toNumber(bytes: []const u8) u64 {
    var result: u64 = 0;
    for (bytes) |b| {
        result = (result << 8) | b;
    }
    return result;
}

test "toNumber - basic" {
    try std.testing.expectEqual(@as(u64, 0), toNumber(&[_]u8{}));
    try std.testing.expectEqual(@as(u64, 0), toNumber(&[_]u8{0}));
    try std.testing.expectEqual(@as(u64, 1), toNumber(&[_]u8{1}));
    try std.testing.expectEqual(@as(u64, 255), toNumber(&[_]u8{0xff}));
    try std.testing.expectEqual(@as(u64, 256), toNumber(&[_]u8{ 1, 0 }));
    try std.testing.expectEqual(@as(u64, 0x1234), toNumber(&[_]u8{ 0x12, 0x34 }));
}

/// Convert u256 to bytes (big-endian, allocates)
pub fn fromBigInt(allocator: std.mem.Allocator, value: u256) ![]u8 {
    if (value == 0) {
        const result = try allocator.alloc(u8, 1);
        result[0] = 0;
        return result;
    }

    // Count bytes needed
    var v = value;
    var byte_count: usize = 0;
    while (v > 0) : (v >>= 8) {
        byte_count += 1;
    }

    const result = try allocator.alloc(u8, byte_count);
    v = value;
    var i: usize = byte_count;
    while (i > 0) {
        i -= 1;
        result[i] = @truncate(v & 0xff);
        v >>= 8;
    }

    return result;
}

test "fromBigInt - basic" {
    const allocator = std.testing.allocator;

    const b0 = try fromBigInt(allocator, 0);
    defer allocator.free(b0);
    try std.testing.expectEqualSlices(u8, &[_]u8{0}, b0);

    const b255 = try fromBigInt(allocator, 255);
    defer allocator.free(b255);
    try std.testing.expectEqualSlices(u8, &[_]u8{0xff}, b255);

    const b256 = try fromBigInt(allocator, 256);
    defer allocator.free(b256);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 1, 0 }, b256);
}

/// Convert bytes to u256 (big-endian)
pub fn toBigInt(bytes: []const u8) u256 {
    var result: u256 = 0;
    for (bytes) |b| {
        result = (result << 8) | b;
    }
    return result;
}

test "toBigInt - basic" {
    try std.testing.expectEqual(@as(u256, 0), toBigInt(&[_]u8{}));
    try std.testing.expectEqual(@as(u256, 0), toBigInt(&[_]u8{0}));
    try std.testing.expectEqual(@as(u256, 255), toBigInt(&[_]u8{0xff}));
    try std.testing.expectEqual(@as(u256, 256), toBigInt(&[_]u8{ 1, 0 }));
}

/// Generate random bytes (allocates)
pub fn random(allocator: std.mem.Allocator, len: usize) ![]u8 {
    const result = try allocator.alloc(u8, len);
    std.crypto.random.bytes(result);
    return result;
}

test "random - basic" {
    const allocator = std.testing.allocator;
    const r = try random(allocator, 32);
    defer allocator.free(r);

    try std.testing.expectEqual(32, r.len);
}

/// Pad bytes on the left with zeros (allocates)
pub fn padLeft(allocator: std.mem.Allocator, bytes: []const u8, target_len: usize) ![]u8 {
    if (bytes.len > target_len) return error.BytesExceedTargetLength;
    if (bytes.len == target_len) {
        return try clone(allocator, bytes);
    }

    const result = try allocator.alloc(u8, target_len);
    @memset(result[0 .. target_len - bytes.len], 0);
    @memcpy(result[target_len - bytes.len ..], bytes);
    return result;
}

test "padLeft - basic" {
    const allocator = std.testing.allocator;

    const padded = try padLeft(allocator, &[_]u8{ 0x12, 0x34 }, 4);
    defer allocator.free(padded);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0, 0, 0x12, 0x34 }, padded);
}

test "padLeft - exceeds" {
    const allocator = std.testing.allocator;
    try std.testing.expectError(error.BytesExceedTargetLength, padLeft(allocator, &[_]u8{ 1, 2, 3, 4 }, 2));
}

/// Pad bytes on the right with zeros (allocates)
pub fn padRight(allocator: std.mem.Allocator, bytes: []const u8, target_len: usize) ![]u8 {
    if (bytes.len > target_len) return error.BytesExceedTargetLength;
    if (bytes.len == target_len) {
        return try clone(allocator, bytes);
    }

    const result = try allocator.alloc(u8, target_len);
    @memcpy(result[0..bytes.len], bytes);
    @memset(result[bytes.len..], 0);
    return result;
}

test "padRight - basic" {
    const allocator = std.testing.allocator;

    const padded = try padRight(allocator, &[_]u8{ 0x12, 0x34 }, 4);
    defer allocator.free(padded);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x12, 0x34, 0, 0 }, padded);
}

/// Trim leading zeros (no allocation, returns slice)
pub fn trimLeft(bytes: []const u8) []const u8 {
    var start: usize = 0;
    while (start < bytes.len and bytes[start] == 0) {
        start += 1;
    }
    return bytes[start..];
}

test "trimLeft - basic" {
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x12, 0x34 }, trimLeft(&[_]u8{ 0, 0, 0x12, 0x34 }));
    try std.testing.expectEqualSlices(u8, &[_]u8{}, trimLeft(&[_]u8{ 0, 0, 0 }));
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x12, 0, 0x34 }, trimLeft(&[_]u8{ 0, 0x12, 0, 0x34 }));
}

/// Trim trailing zeros (no allocation, returns slice)
pub fn trimRight(bytes: []const u8) []const u8 {
    var end: usize = bytes.len;
    while (end > 0 and bytes[end - 1] == 0) {
        end -= 1;
    }
    return bytes[0..end];
}

test "trimRight - basic" {
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x12, 0x34 }, trimRight(&[_]u8{ 0x12, 0x34, 0, 0 }));
    try std.testing.expectEqualSlices(u8, &[_]u8{}, trimRight(&[_]u8{ 0, 0, 0 }));
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x12, 0, 0x34 }, trimRight(&[_]u8{ 0x12, 0, 0x34, 0 }));
}
