//! ReturnData - Call return data from EVM execution
//!
//! Represents data returned from a contract call or transaction.
//! This can be successful return data or revert data.
//!
//! ## Usage
//! ```zig
//! const ReturnData = @import("primitives").ReturnData;
//!
//! // From bytes
//! const data = ReturnData.from(&bytes);
//!
//! // Check if empty
//! if (data.isEmpty()) { ... }
//!
//! // Convert to hex
//! const hex = try data.toHex(allocator);
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");
const Hash = @import("../Hash/Hash.zig");
const crypto = @import("crypto");

/// ReturnData wraps EVM return data
pub const ReturnData = struct {
    /// Raw return bytes
    bytes: []const u8,

    /// Create ReturnData from raw bytes
    pub fn from(bytes: []const u8) ReturnData {
        return ReturnData{ .bytes = bytes };
    }

    /// Create ReturnData from hex string (with or without 0x prefix)
    pub fn fromHex(allocator: std.mem.Allocator, hex: []const u8) !struct { data: ReturnData, bytes: []u8 } {
        const bytes = try Hex.fromHex(allocator, hex);
        return .{ .data = ReturnData{ .bytes = bytes }, .bytes = bytes };
    }

    /// Get length of return data
    pub fn len(self: ReturnData) usize {
        return self.bytes.len;
    }

    /// Check if return data is empty
    pub fn isEmpty(self: ReturnData) bool {
        return self.bytes.len == 0;
    }

    /// Convert to hex string with 0x prefix
    /// Caller owns returned memory
    pub fn toHex(self: ReturnData, allocator: std.mem.Allocator) ![]u8 {
        return Hex.bytesToHex(allocator, self.bytes);
    }

    /// Compute keccak256 hash of the return data
    pub fn hash(self: ReturnData) Hash.Hash {
        return Hash.keccak256(self.bytes);
    }

    /// Check equality with another ReturnData
    pub fn equals(self: ReturnData, other: ReturnData) bool {
        return std.mem.eql(u8, self.bytes, other.bytes);
    }

    /// Get raw bytes as slice
    pub fn toBytes(self: ReturnData) []const u8 {
        return self.bytes;
    }

    /// Get byte at position
    pub fn get(self: ReturnData, index: usize) ?u8 {
        if (index >= self.bytes.len) return null;
        return self.bytes[index];
    }

    /// Get slice of return data
    /// Returns null if range is invalid
    pub fn slice(self: ReturnData, start: usize, end: usize) ?[]const u8 {
        if (start > end or end > self.bytes.len) return null;
        return self.bytes[start..end];
    }

    /// Get first 4 bytes as selector (for error/function detection)
    pub fn getSelector(self: ReturnData) ?[4]u8 {
        if (self.bytes.len < 4) return null;
        var selector: [4]u8 = undefined;
        @memcpy(&selector, self.bytes[0..4]);
        return selector;
    }

    /// Check if return data starts with given selector
    pub fn hasSelector(self: ReturnData, selector: [4]u8) bool {
        if (self.bytes.len < 4) return false;
        return std.mem.eql(u8, self.bytes[0..4], &selector);
    }
};

// ============================================================================
// Tests
// ============================================================================

test "ReturnData.from - creates from bytes" {
    const bytes = [_]u8{ 0x00, 0x00, 0x00, 0x01 };
    const data = ReturnData.from(&bytes);

    try std.testing.expectEqual(@as(usize, 4), data.len());
    try std.testing.expect(!data.isEmpty());
}

test "ReturnData.from - empty bytes" {
    const bytes = [_]u8{};
    const data = ReturnData.from(&bytes);

    try std.testing.expectEqual(@as(usize, 0), data.len());
    try std.testing.expect(data.isEmpty());
}

test "ReturnData.fromHex - valid hex" {
    const result = try ReturnData.fromHex(std.testing.allocator, "0x00000001");
    defer std.testing.allocator.free(result.bytes);

    try std.testing.expectEqual(@as(usize, 4), result.data.len());
    try std.testing.expectEqual(@as(u8, 0x00), result.data.bytes[0]);
    try std.testing.expectEqual(@as(u8, 0x01), result.data.bytes[3]);
}

test "ReturnData.toHex - converts to hex string" {
    const bytes = [_]u8{ 0xab, 0xcd };
    const data = ReturnData.from(&bytes);

    const hex = try data.toHex(std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expectEqualStrings("0xabcd", hex);
}

test "ReturnData.hash - computes keccak256" {
    const bytes = [_]u8{ 0x00, 0x00, 0x00, 0x01 };
    const data = ReturnData.from(&bytes);

    const data_hash = data.hash();

    try std.testing.expectEqual(@as(usize, 32), data_hash.len);

    var all_zero = true;
    for (data_hash) |b| {
        if (b != 0) {
            all_zero = false;
            break;
        }
    }
    try std.testing.expect(!all_zero);
}

test "ReturnData.equals - same data" {
    const bytes1 = [_]u8{ 0xab, 0xcd };
    const bytes2 = [_]u8{ 0xab, 0xcd };

    const data1 = ReturnData.from(&bytes1);
    const data2 = ReturnData.from(&bytes2);

    try std.testing.expect(data1.equals(data2));
}

test "ReturnData.equals - different data" {
    const bytes1 = [_]u8{ 0xab, 0xcd };
    const bytes2 = [_]u8{ 0xab, 0xce };

    const data1 = ReturnData.from(&bytes1);
    const data2 = ReturnData.from(&bytes2);

    try std.testing.expect(!data1.equals(data2));
}

test "ReturnData.get - valid index" {
    const bytes = [_]u8{ 0xaa, 0xbb, 0xcc };
    const data = ReturnData.from(&bytes);

    try std.testing.expectEqual(@as(u8, 0xaa), data.get(0).?);
    try std.testing.expectEqual(@as(u8, 0xbb), data.get(1).?);
    try std.testing.expectEqual(@as(u8, 0xcc), data.get(2).?);
}

test "ReturnData.get - out of bounds" {
    const bytes = [_]u8{ 0xaa, 0xbb };
    const data = ReturnData.from(&bytes);

    try std.testing.expect(data.get(2) == null);
    try std.testing.expect(data.get(100) == null);
}

test "ReturnData.slice - valid range" {
    const bytes = [_]u8{ 0xaa, 0xbb, 0xcc, 0xdd };
    const data = ReturnData.from(&bytes);

    const s = data.slice(1, 3);
    try std.testing.expect(s != null);
    try std.testing.expectEqual(@as(usize, 2), s.?.len);
    try std.testing.expectEqual(@as(u8, 0xbb), s.?[0]);
    try std.testing.expectEqual(@as(u8, 0xcc), s.?[1]);
}

test "ReturnData.slice - invalid range" {
    const bytes = [_]u8{ 0xaa, 0xbb };
    const data = ReturnData.from(&bytes);

    try std.testing.expect(data.slice(1, 0) == null);
    try std.testing.expect(data.slice(0, 10) == null);
}

test "ReturnData.getSelector - valid selector" {
    const bytes = [_]u8{ 0x08, 0xc3, 0x79, 0xa0, 0x00, 0x00 };
    const data = ReturnData.from(&bytes);

    const selector = data.getSelector();
    try std.testing.expect(selector != null);
    try std.testing.expectEqual(@as(u8, 0x08), selector.?[0]);
    try std.testing.expectEqual(@as(u8, 0xc3), selector.?[1]);
    try std.testing.expectEqual(@as(u8, 0x79), selector.?[2]);
    try std.testing.expectEqual(@as(u8, 0xa0), selector.?[3]);
}

test "ReturnData.getSelector - too short" {
    const bytes = [_]u8{ 0x08, 0xc3, 0x79 };
    const data = ReturnData.from(&bytes);

    try std.testing.expect(data.getSelector() == null);
}

test "ReturnData.hasSelector - matches" {
    const bytes = [_]u8{ 0x08, 0xc3, 0x79, 0xa0, 0x00, 0x00 };
    const data = ReturnData.from(&bytes);

    try std.testing.expect(data.hasSelector([_]u8{ 0x08, 0xc3, 0x79, 0xa0 }));
}

test "ReturnData.hasSelector - no match" {
    const bytes = [_]u8{ 0x08, 0xc3, 0x79, 0xa0, 0x00, 0x00 };
    const data = ReturnData.from(&bytes);

    try std.testing.expect(!data.hasSelector([_]u8{ 0x4e, 0x48, 0x7b, 0x71 }));
}

test "ReturnData.hasSelector - too short" {
    const bytes = [_]u8{ 0x08, 0xc3 };
    const data = ReturnData.from(&bytes);

    try std.testing.expect(!data.hasSelector([_]u8{ 0x08, 0xc3, 0x79, 0xa0 }));
}
