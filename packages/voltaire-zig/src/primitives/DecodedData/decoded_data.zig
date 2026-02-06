//! DecodedData - Generic decoded structure from ABI-encoded data
//!
//! Represents decoded values with their corresponding ABI types.
//! Useful for working with ABI-encoded data in a type-safe manner.
//!
//! ## Usage
//! ```zig
//! const DecodedData = @import("primitives").DecodedData;
//!
//! // Create decoded data from values and types
//! var values = [_]DecodedValue{
//!     .{ .uint256 = 1000 },
//!     .{ .address = addr },
//! };
//! var types = [_][]const u8{ "uint256", "address" };
//! var decoded = DecodedData.from(&values, &types);
//! ```

const std = @import("std");

/// Supported ABI value types for decoded data
pub const DecodedValue = union(enum) {
    uint8: u8,
    uint16: u16,
    uint32: u32,
    uint64: u64,
    uint128: u128,
    uint256: u256,
    int8: i8,
    int16: i16,
    int32: i32,
    int64: i64,
    int128: i128,
    int256: i256,
    boolean: bool,
    address: [20]u8,
    bytes32: [32]u8,
    bytes: []const u8,
    string: []const u8,

    /// Get the value as u256 (for numeric types)
    pub fn asU256(self: DecodedValue) ?u256 {
        return switch (self) {
            .uint8 => |v| @intCast(v),
            .uint16 => |v| @intCast(v),
            .uint32 => |v| @intCast(v),
            .uint64 => |v| @intCast(v),
            .uint128 => |v| @intCast(v),
            .uint256 => |v| v,
            else => null,
        };
    }

    /// Get the value as i256 (for signed numeric types)
    pub fn asI256(self: DecodedValue) ?i256 {
        return switch (self) {
            .int8 => |v| @intCast(v),
            .int16 => |v| @intCast(v),
            .int32 => |v| @intCast(v),
            .int64 => |v| @intCast(v),
            .int128 => |v| @intCast(v),
            .int256 => |v| v,
            else => null,
        };
    }

    /// Get the value as boolean
    pub fn asBool(self: DecodedValue) ?bool {
        return switch (self) {
            .boolean => |v| v,
            else => null,
        };
    }

    /// Get the value as address
    pub fn asAddress(self: DecodedValue) ?[20]u8 {
        return switch (self) {
            .address => |v| v,
            else => null,
        };
    }

    /// Get the value as bytes32
    pub fn asBytes32(self: DecodedValue) ?[32]u8 {
        return switch (self) {
            .bytes32 => |v| v,
            else => null,
        };
    }

    /// Get the value as dynamic bytes
    pub fn asBytes(self: DecodedValue) ?[]const u8 {
        return switch (self) {
            .bytes => |v| v,
            .string => |v| v,
            else => null,
        };
    }

    /// Get the value as string
    pub fn asString(self: DecodedValue) ?[]const u8 {
        return switch (self) {
            .string => |v| v,
            else => null,
        };
    }
};

/// DecodedData type - decoded values with their ABI types
pub const DecodedData = struct {
    values: []const DecodedValue,
    types: []const []const u8,

    const Self = @This();

    /// Get the number of decoded values
    pub fn len(self: *const Self) usize {
        return self.values.len;
    }

    /// Check if empty
    pub fn isEmpty(self: *const Self) bool {
        return self.values.len == 0;
    }

    /// Get a value at index
    pub fn get(self: *const Self, index: usize) ?DecodedValue {
        if (index >= self.values.len) {
            return null;
        }
        return self.values[index];
    }

    /// Get the type at index
    pub fn getType(self: *const Self, index: usize) ?[]const u8 {
        if (index >= self.types.len) {
            return null;
        }
        return self.types[index];
    }
};

// ============================================================================
// Constructors
// ============================================================================

/// Create DecodedData from values and types
pub fn from(values: []const DecodedValue, types: []const []const u8) DecodedData {
    return DecodedData{
        .values = values,
        .types = types,
    };
}

test "from - basic" {
    const values = [_]DecodedValue{
        .{ .uint256 = 1000 },
        .{ .boolean = true },
    };
    const types = [_][]const u8{ "uint256", "bool" };

    const decoded = from(&values, &types);

    try std.testing.expectEqual(@as(usize, 2), decoded.len());
    try std.testing.expectEqual(@as(?u256, 1000), decoded.get(0).?.asU256());
    try std.testing.expectEqual(@as(?bool, true), decoded.get(1).?.asBool());
}

test "from - empty" {
    const values = [_]DecodedValue{};
    const types = [_][]const u8{};

    const decoded = from(&values, &types);

    try std.testing.expect(decoded.isEmpty());
}

/// Create empty DecodedData
pub fn empty() DecodedData {
    return DecodedData{
        .values = &[_]DecodedValue{},
        .types = &[_][]const u8{},
    };
}

test "empty - creates empty decoded data" {
    const decoded = empty();
    try std.testing.expect(decoded.isEmpty());
    try std.testing.expectEqual(@as(usize, 0), decoded.len());
}

// ============================================================================
// Accessors
// ============================================================================

/// Get a uint256 value at index
pub fn getUint256(data: *const DecodedData, index: usize) ?u256 {
    const value = data.get(index) orelse return null;
    return value.asU256();
}

test "getUint256 - valid" {
    const values = [_]DecodedValue{
        .{ .uint256 = 12345 },
    };
    const types = [_][]const u8{"uint256"};
    const decoded = from(&values, &types);

    try std.testing.expectEqual(@as(?u256, 12345), getUint256(&decoded, 0));
}

test "getUint256 - invalid type" {
    const values = [_]DecodedValue{
        .{ .boolean = true },
    };
    const types = [_][]const u8{"bool"};
    const decoded = from(&values, &types);

    try std.testing.expectEqual(@as(?u256, null), getUint256(&decoded, 0));
}

test "getUint256 - out of bounds" {
    const decoded = empty();
    try std.testing.expectEqual(@as(?u256, null), getUint256(&decoded, 0));
}

/// Get a boolean value at index
pub fn getBool(data: *const DecodedData, index: usize) ?bool {
    const value = data.get(index) orelse return null;
    return value.asBool();
}

test "getBool - valid" {
    const values = [_]DecodedValue{
        .{ .boolean = true },
    };
    const types = [_][]const u8{"bool"};
    const decoded = from(&values, &types);

    try std.testing.expectEqual(@as(?bool, true), getBool(&decoded, 0));
}

/// Get an address value at index
pub fn getAddress(data: *const DecodedData, index: usize) ?[20]u8 {
    const value = data.get(index) orelse return null;
    return value.asAddress();
}

test "getAddress - valid" {
    var addr: [20]u8 = undefined;
    @memset(&addr, 0xaa);

    const values = [_]DecodedValue{
        .{ .address = addr },
    };
    const types = [_][]const u8{"address"};
    const decoded = from(&values, &types);

    const result = getAddress(&decoded, 0);
    try std.testing.expect(result != null);
    try std.testing.expectEqualSlices(u8, &addr, &result.?);
}

/// Get a bytes32 value at index
pub fn getBytes32(data: *const DecodedData, index: usize) ?[32]u8 {
    const value = data.get(index) orelse return null;
    return value.asBytes32();
}

test "getBytes32 - valid" {
    var hash: [32]u8 = undefined;
    @memset(&hash, 0xbb);

    const values = [_]DecodedValue{
        .{ .bytes32 = hash },
    };
    const types = [_][]const u8{"bytes32"};
    const decoded = from(&values, &types);

    const result = getBytes32(&decoded, 0);
    try std.testing.expect(result != null);
    try std.testing.expectEqualSlices(u8, &hash, &result.?);
}

/// Get a string value at index
pub fn getString(data: *const DecodedData, index: usize) ?[]const u8 {
    const value = data.get(index) orelse return null;
    return value.asString();
}

test "getString - valid" {
    const values = [_]DecodedValue{
        .{ .string = "hello" },
    };
    const types = [_][]const u8{"string"};
    const decoded = from(&values, &types);

    try std.testing.expectEqualStrings("hello", getString(&decoded, 0).?);
}

/// Get dynamic bytes at index
pub fn getBytes(data: *const DecodedData, index: usize) ?[]const u8 {
    const value = data.get(index) orelse return null;
    return value.asBytes();
}

test "getBytes - valid" {
    const bytes = [_]u8{ 0x01, 0x02, 0x03 };
    const values = [_]DecodedValue{
        .{ .bytes = &bytes },
    };
    const types = [_][]const u8{"bytes"};
    const decoded = from(&values, &types);

    try std.testing.expectEqualSlices(u8, &bytes, getBytes(&decoded, 0).?);
}

// ============================================================================
// Validation
// ============================================================================

/// Check if values and types arrays have the same length
pub fn isValid(data: *const DecodedData) bool {
    return data.values.len == data.types.len;
}

test "isValid - valid" {
    const values = [_]DecodedValue{
        .{ .uint256 = 1000 },
    };
    const types = [_][]const u8{"uint256"};
    const decoded = from(&values, &types);

    try std.testing.expect(isValid(&decoded));
}

test "isValid - empty is valid" {
    const decoded = empty();
    try std.testing.expect(isValid(&decoded));
}

// ============================================================================
// Equality
// ============================================================================

/// Check if two DecodedData instances have the same types (structural equality)
pub fn equalTypes(a: *const DecodedData, b: *const DecodedData) bool {
    if (a.types.len != b.types.len) {
        return false;
    }

    for (a.types, b.types) |ta, tb| {
        if (!std.mem.eql(u8, ta, tb)) {
            return false;
        }
    }

    return true;
}

test "equalTypes - same" {
    const values1 = [_]DecodedValue{.{ .uint256 = 100 }};
    const types1 = [_][]const u8{"uint256"};
    const decoded1 = from(&values1, &types1);

    const values2 = [_]DecodedValue{.{ .uint256 = 200 }};
    const types2 = [_][]const u8{"uint256"};
    const decoded2 = from(&values2, &types2);

    try std.testing.expect(equalTypes(&decoded1, &decoded2));
}

test "equalTypes - different" {
    const values1 = [_]DecodedValue{.{ .uint256 = 100 }};
    const types1 = [_][]const u8{"uint256"};
    const decoded1 = from(&values1, &types1);

    const values2 = [_]DecodedValue{.{ .boolean = true }};
    const types2 = [_][]const u8{"bool"};
    const decoded2 = from(&values2, &types2);

    try std.testing.expect(!equalTypes(&decoded1, &decoded2));
}
