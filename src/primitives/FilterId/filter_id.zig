//! FilterId - Opaque filter identifier for Ethereum JSON-RPC
//!
//! Filter identifiers are returned by eth_newFilter, eth_newBlockFilter,
//! and eth_newPendingTransactionFilter. Used to track active filters on a node.
//!
//! ## Usage
//! ```zig
//! const FilterId = @import("primitives").FilterId;
//!
//! // From hex string
//! const id = try FilterId.fromHex("0x1");
//!
//! // Compare
//! if (FilterId.equals(&id1, &id2)) { ... }
//!
//! // Serialize
//! const json = try FilterId.toJson(&id, allocator);
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");

/// Maximum size for filter ID storage (256 bits = 32 bytes)
pub const MAX_SIZE = 32;

/// FilterId - variable length byte array representing a filter identifier
/// Stored as fixed array with length tracking
pub const FilterId = struct {
    data: [MAX_SIZE]u8,
    len: usize,

    pub const ZERO: FilterId = .{ .data = [_]u8{0} ** MAX_SIZE, .len = 1 };
};

// ============================================================================
// Errors
// ============================================================================

pub const FilterIdError = error{
    EmptyFilterId,
    FilterIdTooLong,
    InvalidHexCharacter,
    InvalidHexLength,
    OutOfMemory,
};

// ============================================================================
// Constructors
// ============================================================================

/// Create FilterId from raw bytes
pub fn fromBytes(bytes: []const u8) FilterIdError!FilterId {
    if (bytes.len == 0) {
        return FilterIdError.EmptyFilterId;
    }
    if (bytes.len > MAX_SIZE) {
        return FilterIdError.FilterIdTooLong;
    }

    var result = FilterId{ .data = [_]u8{0} ** MAX_SIZE, .len = bytes.len };
    @memcpy(result.data[0..bytes.len], bytes);
    return result;
}

test "fromBytes - valid bytes" {
    const bytes = [_]u8{ 0x01, 0x02, 0x03 };
    const id = try fromBytes(&bytes);
    try std.testing.expectEqual(@as(usize, 3), id.len);
    try std.testing.expectEqual(@as(u8, 0x01), id.data[0]);
}

test "fromBytes - single byte" {
    const bytes = [_]u8{0x01};
    const id = try fromBytes(&bytes);
    try std.testing.expectEqual(@as(usize, 1), id.len);
}

test "fromBytes - empty returns error" {
    const bytes: []const u8 = &[_]u8{};
    try std.testing.expectError(FilterIdError.EmptyFilterId, fromBytes(bytes));
}

test "fromBytes - too long returns error" {
    const bytes = [_]u8{0x01} ** (MAX_SIZE + 1);
    try std.testing.expectError(FilterIdError.FilterIdTooLong, fromBytes(&bytes));
}

/// Create FilterId from hex string (with or without 0x prefix)
pub fn fromHex(hex: []const u8) FilterIdError!FilterId {
    if (hex.len == 0) {
        return FilterIdError.EmptyFilterId;
    }

    // Handle 0x prefix
    const start: usize = if (hex.len >= 2 and hex[0] == '0' and hex[1] == 'x') 2 else 0;
    const hex_data = hex[start..];

    if (hex_data.len == 0) {
        return FilterIdError.EmptyFilterId;
    }

    // Each hex char pair = 1 byte, handle odd length
    const byte_len = (hex_data.len + 1) / 2;
    if (byte_len > MAX_SIZE) {
        return FilterIdError.FilterIdTooLong;
    }

    var result = FilterId{ .data = [_]u8{0} ** MAX_SIZE, .len = byte_len };

    // Decode hex
    var i: usize = 0;
    var byte_idx: usize = 0;

    // Handle odd length (single leading char)
    if (hex_data.len % 2 == 1) {
        result.data[byte_idx] = hexCharToNibble(hex_data[0]) orelse return FilterIdError.InvalidHexCharacter;
        i = 1;
        byte_idx = 1;
    }

    while (i < hex_data.len) : ({
        i += 2;
        byte_idx += 1;
    }) {
        const high = hexCharToNibble(hex_data[i]) orelse return FilterIdError.InvalidHexCharacter;
        const low = hexCharToNibble(hex_data[i + 1]) orelse return FilterIdError.InvalidHexCharacter;
        result.data[byte_idx] = (high << 4) | low;
    }

    return result;
}

fn hexCharToNibble(c: u8) ?u8 {
    return switch (c) {
        '0'...'9' => c - '0',
        'a'...'f' => c - 'a' + 10,
        'A'...'F' => c - 'A' + 10,
        else => null,
    };
}

test "fromHex - with 0x prefix" {
    const id = try fromHex("0x1");
    try std.testing.expectEqual(@as(usize, 1), id.len);
    try std.testing.expectEqual(@as(u8, 0x01), id.data[0]);
}

test "fromHex - without 0x prefix" {
    const id = try fromHex("abcd");
    try std.testing.expectEqual(@as(usize, 2), id.len);
    try std.testing.expectEqual(@as(u8, 0xab), id.data[0]);
    try std.testing.expectEqual(@as(u8, 0xcd), id.data[1]);
}

test "fromHex - odd length" {
    const id = try fromHex("0x123");
    try std.testing.expectEqual(@as(usize, 2), id.len);
    try std.testing.expectEqual(@as(u8, 0x01), id.data[0]);
    try std.testing.expectEqual(@as(u8, 0x23), id.data[1]);
}

test "fromHex - empty returns error" {
    try std.testing.expectError(FilterIdError.EmptyFilterId, fromHex(""));
}

test "fromHex - only prefix returns error" {
    try std.testing.expectError(FilterIdError.EmptyFilterId, fromHex("0x"));
}

test "fromHex - invalid chars returns error" {
    try std.testing.expectError(FilterIdError.InvalidHexCharacter, fromHex("0xzz"));
}

/// Create FilterId from u64
pub fn fromU64(value: u64) FilterId {
    var result = FilterId{ .data = [_]u8{0} ** MAX_SIZE, .len = 0 };

    // Skip leading zeros
    const bytes = std.mem.toBytes(std.mem.nativeToBig(u64, value));
    var start: usize = 0;
    while (start < 7 and bytes[start] == 0) : (start += 1) {}

    result.len = 8 - start;
    if (result.len == 0) result.len = 1; // At least one byte for zero
    @memcpy(result.data[0..result.len], bytes[start..]);

    return result;
}

test "fromU64 - small value" {
    const id = fromU64(1);
    try std.testing.expectEqual(@as(usize, 1), id.len);
    try std.testing.expectEqual(@as(u8, 0x01), id.data[0]);
}

test "fromU64 - larger value" {
    const id = fromU64(256);
    try std.testing.expectEqual(@as(usize, 2), id.len);
    try std.testing.expectEqual(@as(u8, 0x01), id.data[0]);
    try std.testing.expectEqual(@as(u8, 0x00), id.data[1]);
}

test "fromU64 - zero" {
    const id = fromU64(0);
    try std.testing.expectEqual(@as(usize, 1), id.len);
    try std.testing.expectEqual(@as(u8, 0x00), id.data[0]);
}

/// Generic from function
pub fn from(value: anytype) FilterIdError!FilterId {
    const T = @TypeOf(value);
    if (T == FilterId) return value;
    if (T == *const FilterId or T == *FilterId) return value.*;
    if (T == u64) return fromU64(value);
    if (T == []const u8 or T == []u8) {
        // Check if it's hex
        if (value.len >= 2 and value[0] == '0' and value[1] == 'x') {
            return fromHex(value);
        }
        return fromBytes(value);
    }
    @compileError("Unsupported type for FilterId.from: " ++ @typeName(T));
}

test "from - FilterId passthrough" {
    const id1 = fromU64(42);
    const id2 = try from(id1);
    try std.testing.expect(equals(&id1, &id2));
}

test "from - u64" {
    const id = try from(@as(u64, 123));
    try std.testing.expectEqual(@as(usize, 1), id.len);
}

test "from - hex string" {
    const id = try from("0xabcd");
    try std.testing.expectEqual(@as(usize, 2), id.len);
}

// ============================================================================
// Converters
// ============================================================================

/// Convert FilterId to bytes slice
pub fn toBytes(id: *const FilterId) []const u8 {
    return id.data[0..id.len];
}

test "toBytes - returns correct slice" {
    const id = try fromHex("0xaabb");
    const bytes = toBytes(&id);
    try std.testing.expectEqual(@as(usize, 2), bytes.len);
    try std.testing.expectEqual(@as(u8, 0xaa), bytes[0]);
    try std.testing.expectEqual(@as(u8, 0xbb), bytes[1]);
}

/// Convert FilterId to hex string with 0x prefix
pub fn toHex(id: *const FilterId, allocator: std.mem.Allocator) ![]const u8 {
    const bytes = toBytes(id);
    return try Hex.toHex(allocator, bytes);
}

test "toHex - with prefix" {
    const id = try fromHex("0xabcd");
    const hex = try toHex(&id, std.testing.allocator);
    defer std.testing.allocator.free(hex);
    try std.testing.expect(std.mem.eql(u8, hex, "0xabcd"));
}

/// Convert FilterId to string (alias for toHex)
pub fn toString(id: *const FilterId, allocator: std.mem.Allocator) ![]const u8 {
    return toHex(id, allocator);
}

test "toString - same as toHex" {
    const id = try fromHex("0x123");
    const str = try toString(&id, std.testing.allocator);
    defer std.testing.allocator.free(str);
    const hex = try toHex(&id, std.testing.allocator);
    defer std.testing.allocator.free(hex);
    try std.testing.expect(std.mem.eql(u8, str, hex));
}

/// Serialize to JSON string (quoted hex)
pub fn toJson(id: *const FilterId, allocator: std.mem.Allocator) ![]const u8 {
    const hex = try toHex(id, allocator);
    defer allocator.free(hex);

    const json = try allocator.alloc(u8, hex.len + 2);
    json[0] = '"';
    @memcpy(json[1 .. hex.len + 1], hex);
    json[hex.len + 1] = '"';
    return json;
}

test "toJson - quoted hex" {
    const id = try fromHex("0x1");
    const json = try toJson(&id, std.testing.allocator);
    defer std.testing.allocator.free(json);
    try std.testing.expect(std.mem.eql(u8, json, "\"0x01\""));
}

// ============================================================================
// Comparison
// ============================================================================

/// Compare two FilterIds for equality
pub fn equals(a: *const FilterId, b: *const FilterId) bool {
    if (a.len != b.len) return false;
    return std.mem.eql(u8, a.data[0..a.len], b.data[0..b.len]);
}

test "equals - same ids" {
    const id1 = try fromHex("0x1");
    const id2 = try fromHex("0x1");
    try std.testing.expect(equals(&id1, &id2));
}

test "equals - different ids" {
    const id1 = try fromHex("0x1");
    const id2 = try fromHex("0x2");
    try std.testing.expect(!equals(&id1, &id2));
}

test "equals - different lengths" {
    const id1 = try fromHex("0x1");
    const id2 = try fromHex("0x100");
    try std.testing.expect(!equals(&id1, &id2));
}

/// Check if filter ID is zero
pub fn isZero(id: *const FilterId) bool {
    for (id.data[0..id.len]) |b| {
        if (b != 0) return false;
    }
    return true;
}

test "isZero - zero id" {
    const id = fromU64(0);
    try std.testing.expect(isZero(&id));
}

test "isZero - non-zero id" {
    const id = fromU64(1);
    try std.testing.expect(!isZero(&id));
}

// ============================================================================
// Utilities
// ============================================================================

/// Clone a FilterId
pub fn clone(id: *const FilterId) FilterId {
    return id.*;
}

test "clone - creates copy" {
    const id1 = try fromHex("0xabcd");
    const id2 = clone(&id1);
    try std.testing.expect(equals(&id1, &id2));
}

/// Type guard - check if value is a FilterId
pub fn isFilterId(value: anytype) bool {
    const T = @TypeOf(value);
    return T == FilterId or T == *const FilterId or T == *FilterId;
}

test "isFilterId - FilterId type" {
    const id = fromU64(1);
    try std.testing.expect(isFilterId(id));
}

test "isFilterId - pointer type" {
    const id = fromU64(1);
    try std.testing.expect(isFilterId(&id));
}
