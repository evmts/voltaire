//! GasEstimate - estimated gas for transaction
//!
//! Represents the result of eth_estimateGas RPC method.
//! Should add buffer (20-30%) before using as actual gas limit.

const std = @import("std");
const testing = std.testing;

/// GasEstimate type - estimated gas units for a transaction
/// Wraps u64 with semantic gas estimate operations
pub const GasEstimate = struct {
    value: u64,

    /// Create GasEstimate from u64
    pub fn from(value: u64) GasEstimate {
        return .{ .value = value };
    }

    /// Get the raw u64 value
    pub fn toNumber(self: GasEstimate) u64 {
        return self.value;
    }

    /// Add two gas estimates
    pub fn add(self: GasEstimate, other: GasEstimate) GasEstimate {
        return .{ .value = self.value + other.value };
    }

    /// Subtract gas estimate (saturating)
    pub fn sub(self: GasEstimate, other: GasEstimate) GasEstimate {
        return .{ .value = self.value -| other.value };
    }

    /// Check equality
    pub fn equals(self: GasEstimate, other: GasEstimate) bool {
        return self.value == other.value;
    }

    /// Compare two gas estimates
    /// Returns: -1 if self < other, 0 if equal, 1 if self > other
    pub fn compare(self: GasEstimate, other: GasEstimate) i8 {
        if (self.value < other.value) return -1;
        if (self.value > other.value) return 1;
        return 0;
    }

    /// Add percentage buffer to gas estimate
    /// Recommended: 20-30% to account for variability
    /// Example: withBuffer(100000, 20) returns 120000 (100000 + 20%)
    pub fn withBuffer(self: GasEstimate, percentage: u8) GasEstimate {
        const buffer = (self.value * @as(u64, percentage)) / 100;
        return .{ .value = self.value + buffer };
    }

    /// Convert to gas limit (just returns the value as-is)
    /// Use withBuffer first if you want to add safety margin
    pub fn toGasLimit(self: GasEstimate) u64 {
        return self.value;
    }

    /// Convert to hex string (allocates)
    pub fn toHex(self: GasEstimate, allocator: std.mem.Allocator) ![]u8 {
        return std.fmt.allocPrint(allocator, "0x{x}", .{self.value});
    }

    /// Parse from hex string
    pub fn fromHex(hex: []const u8) !GasEstimate {
        const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
        const value = try std.fmt.parseInt(u64, hex[start..], 16);
        return .{ .value = value };
    }
};

// Tests
test "GasEstimate: from and toNumber" {
    const estimate = GasEstimate.from(51234);
    try testing.expectEqual(@as(u64, 51234), estimate.toNumber());

    const estimate2 = GasEstimate.from(0);
    try testing.expectEqual(@as(u64, 0), estimate2.toNumber());

    const estimate3 = GasEstimate.from(std.math.maxInt(u64));
    try testing.expectEqual(std.math.maxInt(u64), estimate3.toNumber());
}

test "GasEstimate: add" {
    const a = GasEstimate.from(100000);
    const b = GasEstimate.from(50000);
    const result = a.add(b);
    try testing.expectEqual(@as(u64, 150000), result.toNumber());
}

test "GasEstimate: sub" {
    const a = GasEstimate.from(100000);
    const b = GasEstimate.from(30000);
    const result = a.sub(b);
    try testing.expectEqual(@as(u64, 70000), result.toNumber());

    // Saturating subtraction
    const c = GasEstimate.from(10000);
    const d = GasEstimate.from(50000);
    const result2 = c.sub(d);
    try testing.expectEqual(@as(u64, 0), result2.toNumber());
}

test "GasEstimate: equals" {
    const a = GasEstimate.from(100000);
    const b = GasEstimate.from(100000);
    const c = GasEstimate.from(200000);

    try testing.expect(a.equals(b));
    try testing.expect(!a.equals(c));
}

test "GasEstimate: compare" {
    const a = GasEstimate.from(100000);
    const b = GasEstimate.from(200000);
    const c = GasEstimate.from(100000);

    try testing.expectEqual(@as(i8, -1), a.compare(b));
    try testing.expectEqual(@as(i8, 1), b.compare(a));
    try testing.expectEqual(@as(i8, 0), a.compare(c));
}

test "GasEstimate: withBuffer" {
    const estimate = GasEstimate.from(100000);

    // 20% buffer
    const buffered20 = estimate.withBuffer(20);
    try testing.expectEqual(@as(u64, 120000), buffered20.toNumber());

    // 30% buffer
    const buffered30 = estimate.withBuffer(30);
    try testing.expectEqual(@as(u64, 130000), buffered30.toNumber());

    // 0% buffer (no change)
    const buffered0 = estimate.withBuffer(0);
    try testing.expectEqual(@as(u64, 100000), buffered0.toNumber());

    // 100% buffer (double)
    const buffered100 = estimate.withBuffer(100);
    try testing.expectEqual(@as(u64, 200000), buffered100.toNumber());
}

test "GasEstimate: toGasLimit" {
    const estimate = GasEstimate.from(51234);
    try testing.expectEqual(@as(u64, 51234), estimate.toGasLimit());
}

test "GasEstimate: toHex and fromHex" {
    const estimate = GasEstimate.from(0x1234);

    const hex = try estimate.toHex(testing.allocator);
    defer testing.allocator.free(hex);
    try testing.expectEqualStrings("0x1234", hex);

    const parsed = try GasEstimate.fromHex("0x1234");
    try testing.expectEqual(@as(u64, 0x1234), parsed.toNumber());

    // Without prefix
    const parsed2 = try GasEstimate.fromHex("1234");
    try testing.expectEqual(@as(u64, 0x1234), parsed2.toNumber());
}

test "GasEstimate: typical RPC values" {
    // Simple ETH transfer
    const transfer = GasEstimate.from(21000);
    try testing.expectEqual(@as(u64, 21000), transfer.toNumber());

    // ERC20 transfer estimate
    const erc20 = GasEstimate.from(65000);
    const erc20_buffered = erc20.withBuffer(20);
    try testing.expectEqual(@as(u64, 78000), erc20_buffered.toNumber());

    // Complex contract interaction
    const complex = GasEstimate.from(150000);
    const complex_buffered = complex.withBuffer(30);
    try testing.expectEqual(@as(u64, 195000), complex_buffered.toNumber());
}
