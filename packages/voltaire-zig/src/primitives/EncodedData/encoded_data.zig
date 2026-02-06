//! EncodedData - Generic ABI-encoded hex data
//!
//! EncodedData represents ABI-encoded data as a hex string.
//! Unlike CallData, it does not require a function selector.
//!
//! ## Usage
//! ```zig
//! const EncodedData = @import("primitives").EncodedData;
//!
//! // From hex string
//! const data = try EncodedData.fromHex(allocator, "0x0000...");
//!
//! // From bytes
//! const data2 = try EncodedData.fromBytes(allocator, &bytes);
//!
//! // Convert back to hex
//! const hex = try EncodedData.toHex(&data, allocator);
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");

/// EncodedData error types
pub const Error = error{
    InvalidHexFormat,
    OutOfMemory,
    InvalidHexCharacter,
};

/// EncodedData type - variable length ABI-encoded bytes
pub const EncodedData = struct {
    data: []u8,
    allocator: std.mem.Allocator,

    const Self = @This();

    /// Free the encoded data memory
    pub fn deinit(self: *Self) void {
        if (self.data.len > 0) {
            self.allocator.free(self.data);
        }
        self.data = &[_]u8{};
    }

    /// Get the underlying bytes
    pub fn bytes(self: *const Self) []const u8 {
        return self.data;
    }

    /// Get the length of the encoded data
    pub fn len(self: *const Self) usize {
        return self.data.len;
    }

    /// Check if empty
    pub fn isEmpty(self: *const Self) bool {
        return self.data.len == 0;
    }
};

// ============================================================================
// Constructors
// ============================================================================

/// Create EncodedData from raw bytes (copies the data)
pub fn fromBytes(allocator: std.mem.Allocator, bytes: []const u8) Error!EncodedData {
    if (bytes.len == 0) {
        return EncodedData{
            .data = &[_]u8{},
            .allocator = allocator,
        };
    }

    const data = allocator.alloc(u8, bytes.len) catch return Error.OutOfMemory;
    @memcpy(data, bytes);

    return EncodedData{
        .data = data,
        .allocator = allocator,
    };
}

test "fromBytes - basic" {
    const allocator = std.testing.allocator;
    const bytes = [_]u8{ 0x00, 0x00, 0x00, 0x01 };
    var data = try fromBytes(allocator, &bytes);
    defer data.deinit();

    try std.testing.expectEqual(@as(usize, 4), data.len());
    try std.testing.expectEqual(@as(u8, 0x00), data.bytes()[0]);
    try std.testing.expectEqual(@as(u8, 0x01), data.bytes()[3]);
}

test "fromBytes - empty" {
    const allocator = std.testing.allocator;
    var data = try fromBytes(allocator, &[_]u8{});
    defer data.deinit();

    try std.testing.expectEqual(@as(usize, 0), data.len());
    try std.testing.expect(data.isEmpty());
}

/// Create EncodedData from hex string (with or without 0x prefix)
pub fn fromHex(allocator: std.mem.Allocator, hex: []const u8) Error!EncodedData {
    // Handle empty hex string
    var start: usize = 0;
    if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) {
        start = 2;
    }

    if (hex.len - start == 0) {
        return EncodedData{
            .data = &[_]u8{},
            .allocator = allocator,
        };
    }

    const bytes = Hex.decode(allocator, hex) catch |err| switch (err) {
        error.InvalidHexCharacter => return Error.InvalidHexCharacter,
        error.OutOfMemory => return Error.OutOfMemory,
        else => return Error.InvalidHexFormat,
    };

    return EncodedData{
        .data = bytes,
        .allocator = allocator,
    };
}

test "fromHex - with 0x prefix" {
    const allocator = std.testing.allocator;
    var data = try fromHex(allocator, "0x00000001");
    defer data.deinit();

    try std.testing.expectEqual(@as(usize, 4), data.len());
    try std.testing.expectEqual(@as(u8, 0x01), data.bytes()[3]);
}

test "fromHex - without 0x prefix" {
    const allocator = std.testing.allocator;
    var data = try fromHex(allocator, "00000001");
    defer data.deinit();

    try std.testing.expectEqual(@as(usize, 4), data.len());
}

test "fromHex - empty" {
    const allocator = std.testing.allocator;
    var data = try fromHex(allocator, "0x");
    defer data.deinit();

    try std.testing.expect(data.isEmpty());
}

test "fromHex - invalid hex" {
    const allocator = std.testing.allocator;
    try std.testing.expectError(Error.InvalidHexCharacter, fromHex(allocator, "0xzzzz"));
}

// ============================================================================
// Converters
// ============================================================================

/// Convert EncodedData to hex string with 0x prefix
pub fn toHex(data: *const EncodedData, allocator: std.mem.Allocator) ![]u8 {
    if (data.data.len == 0) {
        const result = try allocator.alloc(u8, 2);
        result[0] = '0';
        result[1] = 'x';
        return result;
    }
    return try Hex.encode(allocator, data.data);
}

test "toHex - basic" {
    const allocator = std.testing.allocator;
    var data = try fromHex(allocator, "0x00000001");
    defer data.deinit();

    const hex = try toHex(&data, allocator);
    defer allocator.free(hex);

    try std.testing.expectEqualStrings("0x00000001", hex);
}

test "toHex - empty" {
    const allocator = std.testing.allocator;
    var data = try fromHex(allocator, "0x");
    defer data.deinit();

    const hex = try toHex(&data, allocator);
    defer allocator.free(hex);

    try std.testing.expectEqualStrings("0x", hex);
}

/// Get raw bytes (alias for bytes())
pub fn toBytes(data: *const EncodedData) []const u8 {
    return data.data;
}

test "toBytes - returns slice" {
    const allocator = std.testing.allocator;
    var data = try fromHex(allocator, "0x12345678");
    defer data.deinit();

    const bytes = toBytes(&data);
    try std.testing.expectEqual(@as(usize, 4), bytes.len);
}

// ============================================================================
// Equality
// ============================================================================

/// Check if two EncodedData instances are equal (case-insensitive for hex comparison)
pub fn equals(a: *const EncodedData, b: *const EncodedData) bool {
    if (a.data.len != b.data.len) {
        return false;
    }

    return std.mem.eql(u8, a.data, b.data);
}

test "equals - identical" {
    const allocator = std.testing.allocator;
    var data1 = try fromHex(allocator, "0x00000001");
    defer data1.deinit();
    var data2 = try fromHex(allocator, "0x00000001");
    defer data2.deinit();

    try std.testing.expect(equals(&data1, &data2));
}

test "equals - different" {
    const allocator = std.testing.allocator;
    var data1 = try fromHex(allocator, "0x00000001");
    defer data1.deinit();
    var data2 = try fromHex(allocator, "0x00000002");
    defer data2.deinit();

    try std.testing.expect(!equals(&data1, &data2));
}

test "equals - different lengths" {
    const allocator = std.testing.allocator;
    var data1 = try fromHex(allocator, "0x00000001");
    defer data1.deinit();
    var data2 = try fromHex(allocator, "0x0000000001");
    defer data2.deinit();

    try std.testing.expect(!equals(&data1, &data2));
}

test "equals - empty" {
    const allocator = std.testing.allocator;
    var data1 = try fromHex(allocator, "0x");
    defer data1.deinit();
    var data2 = try fromHex(allocator, "0x");
    defer data2.deinit();

    try std.testing.expect(equals(&data1, &data2));
}

// ============================================================================
// Validation
// ============================================================================

/// Check if a hex string is valid encoded data format
pub fn isValidHex(hex: []const u8) bool {
    var start: usize = 0;
    if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) {
        start = 2;
    }

    const hex_len = hex.len - start;

    // Empty is valid
    if (hex_len == 0) {
        return true;
    }

    // Must have even number of hex chars
    if (hex_len % 2 != 0) {
        return false;
    }

    // Check all chars are hex
    for (hex[start..]) |c| {
        if (!std.ascii.isHex(c)) {
            return false;
        }
    }

    return true;
}

test "isValidHex - valid with 0x" {
    try std.testing.expect(isValidHex("0x12345678"));
}

test "isValidHex - valid without 0x" {
    try std.testing.expect(isValidHex("12345678"));
}

test "isValidHex - empty with 0x" {
    try std.testing.expect(isValidHex("0x"));
}

test "isValidHex - empty" {
    try std.testing.expect(isValidHex(""));
}

test "isValidHex - odd length" {
    try std.testing.expect(!isValidHex("0x123"));
}

test "isValidHex - invalid chars" {
    try std.testing.expect(!isValidHex("0xzzzz"));
}

// ============================================================================
// Cloning
// ============================================================================

/// Clone encoded data (creates new allocation)
pub fn clone(allocator: std.mem.Allocator, data: *const EncodedData) Error!EncodedData {
    return fromBytes(allocator, data.data);
}

test "clone - creates independent copy" {
    const allocator = std.testing.allocator;
    var original = try fromHex(allocator, "0x12345678");
    defer original.deinit();

    var copy = try clone(allocator, &original);
    defer copy.deinit();

    try std.testing.expect(equals(&original, &copy));
    try std.testing.expect(original.data.ptr != copy.data.ptr);
}

test "clone - empty" {
    const allocator = std.testing.allocator;
    var original = try fromHex(allocator, "0x");
    defer original.deinit();

    var copy = try clone(allocator, &original);
    defer copy.deinit();

    try std.testing.expect(equals(&original, &copy));
}

// ============================================================================
// Slicing
// ============================================================================

/// Get a slice of the encoded data
pub fn slice(data: *const EncodedData, start: usize, end: ?usize) []const u8 {
    const e = end orelse data.data.len;
    if (start >= data.data.len or e > data.data.len or start > e) {
        return &[_]u8{};
    }
    return data.data[start..e];
}

test "slice - basic" {
    const allocator = std.testing.allocator;
    var data = try fromHex(allocator, "0x12345678");
    defer data.deinit();

    const s = slice(&data, 1, 3);
    try std.testing.expectEqual(@as(usize, 2), s.len);
    try std.testing.expectEqual(@as(u8, 0x34), s[0]);
    try std.testing.expectEqual(@as(u8, 0x56), s[1]);
}

test "slice - to end" {
    const allocator = std.testing.allocator;
    var data = try fromHex(allocator, "0x12345678");
    defer data.deinit();

    const s = slice(&data, 2, null);
    try std.testing.expectEqual(@as(usize, 2), s.len);
}

test "slice - out of bounds" {
    const allocator = std.testing.allocator;
    var data = try fromHex(allocator, "0x12345678");
    defer data.deinit();

    const s = slice(&data, 10, 20);
    try std.testing.expectEqual(@as(usize, 0), s.len);
}

// ============================================================================
// Concatenation
// ============================================================================

/// Concatenate two EncodedData instances
pub fn concat(allocator: std.mem.Allocator, a: *const EncodedData, b: *const EncodedData) Error!EncodedData {
    const total_len = a.data.len + b.data.len;
    if (total_len == 0) {
        return EncodedData{
            .data = &[_]u8{},
            .allocator = allocator,
        };
    }

    const data = allocator.alloc(u8, total_len) catch return Error.OutOfMemory;
    @memcpy(data[0..a.data.len], a.data);
    @memcpy(data[a.data.len..], b.data);

    return EncodedData{
        .data = data,
        .allocator = allocator,
    };
}

test "concat - basic" {
    const allocator = std.testing.allocator;
    var data1 = try fromHex(allocator, "0x1234");
    defer data1.deinit();
    var data2 = try fromHex(allocator, "0x5678");
    defer data2.deinit();

    var result = try concat(allocator, &data1, &data2);
    defer result.deinit();

    try std.testing.expectEqual(@as(usize, 4), result.len());

    const hex = try toHex(&result, allocator);
    defer allocator.free(hex);
    try std.testing.expectEqualStrings("0x12345678", hex);
}

test "concat - with empty" {
    const allocator = std.testing.allocator;
    var data1 = try fromHex(allocator, "0x1234");
    defer data1.deinit();
    var data2 = try fromHex(allocator, "0x");
    defer data2.deinit();

    var result = try concat(allocator, &data1, &data2);
    defer result.deinit();

    try std.testing.expectEqual(@as(usize, 2), result.len());
}
