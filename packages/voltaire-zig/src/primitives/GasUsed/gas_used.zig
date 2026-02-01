//! GasUsed - actual gas consumed by transaction
//!
//! Found in transaction receipts (receipt.gasUsed).
//! Range: 21000 (minimum transfer) to block gas limit (30M typical).

const std = @import("std");
const testing = std.testing;

/// GasUsed type - actual gas units consumed by a transaction
/// Wraps u64 with semantic gas usage operations
pub const GasUsed = struct {
    value: u64,

    /// Minimum gas for a simple ETH transfer
    pub const SIMPLE_TRANSFER: GasUsed = .{ .value = 21000 };

    /// Create GasUsed from u64
    pub fn from(value: u64) GasUsed {
        return .{ .value = value };
    }

    /// Get the raw u64 value
    pub fn toNumber(self: GasUsed) u64 {
        return self.value;
    }

    /// Add two gas used values
    pub fn add(self: GasUsed, other: GasUsed) GasUsed {
        return .{ .value = self.value + other.value };
    }

    /// Subtract gas used (saturating)
    pub fn sub(self: GasUsed, other: GasUsed) GasUsed {
        return .{ .value = self.value -| other.value };
    }

    /// Check equality
    pub fn equals(self: GasUsed, other: GasUsed) bool {
        return self.value == other.value;
    }

    /// Compare two gas used values
    /// Returns: -1 if self < other, 0 if equal, 1 if self > other
    pub fn compare(self: GasUsed, other: GasUsed) i8 {
        if (self.value < other.value) return -1;
        if (self.value > other.value) return 1;
        return 0;
    }

    /// Calculate transaction cost in Wei (gasUsed * gasPrice)
    pub fn calculateCost(self: GasUsed, gas_price: u64) u128 {
        return @as(u128, self.value) * @as(u128, gas_price);
    }

    /// Calculate transaction cost with u128 gas price (for large values)
    pub fn calculateCostU128(self: GasUsed, gas_price: u128) u128 {
        return @as(u128, self.value) * gas_price;
    }

    /// Convert to hex string (allocates)
    pub fn toHex(self: GasUsed, allocator: std.mem.Allocator) ![]u8 {
        return std.fmt.allocPrint(allocator, "0x{x}", .{self.value});
    }

    /// Parse from hex string
    pub fn fromHex(hex: []const u8) !GasUsed {
        const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
        const value = try std.fmt.parseInt(u64, hex[start..], 16);
        return .{ .value = value };
    }

    /// Calculate gas utilization percentage relative to gas limit
    pub fn utilizationPercent(self: GasUsed, gas_limit: u64) u8 {
        if (gas_limit == 0) return 0;
        return @intCast((self.value * 100) / gas_limit);
    }
};

// Tests
test "GasUsed: from and toNumber" {
    const used = GasUsed.from(51234);
    try testing.expectEqual(@as(u64, 51234), used.toNumber());

    const used2 = GasUsed.from(0);
    try testing.expectEqual(@as(u64, 0), used2.toNumber());
}

test "GasUsed: constants" {
    try testing.expectEqual(@as(u64, 21000), GasUsed.SIMPLE_TRANSFER.toNumber());
}

test "GasUsed: add" {
    const a = GasUsed.from(100000);
    const b = GasUsed.from(50000);
    const result = a.add(b);
    try testing.expectEqual(@as(u64, 150000), result.toNumber());
}

test "GasUsed: sub" {
    const a = GasUsed.from(100000);
    const b = GasUsed.from(30000);
    const result = a.sub(b);
    try testing.expectEqual(@as(u64, 70000), result.toNumber());

    // Saturating subtraction
    const c = GasUsed.from(10000);
    const d = GasUsed.from(50000);
    const result2 = c.sub(d);
    try testing.expectEqual(@as(u64, 0), result2.toNumber());
}

test "GasUsed: equals" {
    const a = GasUsed.from(100000);
    const b = GasUsed.from(100000);
    const c = GasUsed.from(200000);

    try testing.expect(a.equals(b));
    try testing.expect(!a.equals(c));
}

test "GasUsed: compare" {
    const a = GasUsed.from(100000);
    const b = GasUsed.from(200000);
    const c = GasUsed.from(100000);

    try testing.expectEqual(@as(i8, -1), a.compare(b));
    try testing.expectEqual(@as(i8, 1), b.compare(a));
    try testing.expectEqual(@as(i8, 0), a.compare(c));
}

test "GasUsed: calculateCost" {
    const gas_used = GasUsed.from(51234);
    const gas_price: u64 = 20_000_000_000; // 20 gwei

    const cost = gas_used.calculateCost(gas_price);
    try testing.expectEqual(@as(u128, 1024680000000000), cost);
}

test "GasUsed: calculateCostU128" {
    const gas_used = GasUsed.from(100000);
    const gas_price: u128 = 100_000_000_000; // 100 gwei

    const cost = gas_used.calculateCostU128(gas_price);
    try testing.expectEqual(@as(u128, 10_000_000_000_000_000), cost);
}

test "GasUsed: toHex and fromHex" {
    const used = GasUsed.from(0x5208); // 21000

    const hex = try used.toHex(testing.allocator);
    defer testing.allocator.free(hex);
    try testing.expectEqualStrings("0x5208", hex);

    const parsed = try GasUsed.fromHex("0x5208");
    try testing.expectEqual(@as(u64, 21000), parsed.toNumber());
}

test "GasUsed: utilizationPercent" {
    // 50% utilization
    const used = GasUsed.from(50000);
    try testing.expectEqual(@as(u8, 50), used.utilizationPercent(100000));

    // 100% utilization
    const full = GasUsed.from(100000);
    try testing.expectEqual(@as(u8, 100), full.utilizationPercent(100000));

    // Edge case: zero limit
    try testing.expectEqual(@as(u8, 0), used.utilizationPercent(0));

    // Typical mainnet block
    const block_used = GasUsed.from(15_000_000);
    try testing.expectEqual(@as(u8, 50), block_used.utilizationPercent(30_000_000));
}

test "GasUsed: typical receipt values" {
    // Simple ETH transfer
    const transfer = GasUsed.from(21000);
    try testing.expect(transfer.equals(GasUsed.SIMPLE_TRANSFER));

    // ERC20 transfer
    const erc20 = GasUsed.from(46109);
    try testing.expectEqual(@as(u64, 46109), erc20.toNumber());

    // Uniswap swap
    const swap = GasUsed.from(152847);
    try testing.expectEqual(@as(u64, 152847), swap.toNumber());

    // Calculate cost for swap at 30 gwei
    const cost = swap.calculateCost(30_000_000_000);
    try testing.expectEqual(@as(u128, 4585410000000000), cost);
}
