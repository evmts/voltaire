const std = @import("std");
const testing = std.testing;
const Uint = @import("../Uint/Uint.zig").Uint;

/// GasPrice type - Legacy gas price (pre-EIP-1559)
/// Represents the gas price in wei per gas unit for legacy transactions.
/// For EIP-1559 transactions, this is replaced by baseFee + priorityFee.
///
/// Internal value stored in wei (smallest denomination).
pub const GasPrice = struct {
    const Self = @This();
    pub const U256 = Uint(256, 4);

    /// Wei per Gwei constant (1e9)
    pub const WEI_PER_GWEI: u64 = 1_000_000_000;

    /// Internal value in wei
    value: U256,

    /// Create GasPrice from u64 (wei)
    pub fn from(wei: u64) Self {
        return .{ .value = U256.from_u64(wei) };
    }

    /// Create GasPrice from U256 (wei)
    pub fn fromU256(wei: U256) Self {
        return .{ .value = wei };
    }

    /// Create GasPrice from gwei
    pub fn fromGwei(gwei: u64) Self {
        const wei_value = U256.from_u64(gwei).mul(U256.from_u64(WEI_PER_GWEI));
        return .{ .value = wei_value };
    }

    /// Create GasPrice from bytes (big-endian, 32 bytes)
    pub fn fromBytes(bytes: [32]u8) Self {
        return .{ .value = U256.from_bytes(bytes) };
    }

    /// Convert to u64 (wei)
    /// Returns error if value exceeds u64 range
    pub fn toU64(self: Self) error{Overflow}!u64 {
        return self.value.to_u64();
    }

    /// Get value in wei as U256
    pub fn toWei(self: Self) U256 {
        return self.value;
    }

    /// Convert to gwei (integer division, truncates)
    pub fn toGwei(self: Self) U256 {
        const result = self.value.div_rem(U256.from_u64(WEI_PER_GWEI));
        return result.quotient;
    }

    /// Convert to gwei as u64
    /// Returns error if result exceeds u64 range
    pub fn toGweiU64(self: Self) error{Overflow}!u64 {
        return self.toGwei().to_u64();
    }

    /// Convert to bytes (big-endian, 32 bytes)
    pub fn toBytes(self: Self) [32]u8 {
        return self.value.to_bytes();
    }

    /// Compare two GasPrice values
    /// Returns: .lt if self < other, .eq if equal, .gt if self > other
    pub fn compare(self: Self, other: Self) std.math.Order {
        return self.value.cmp(other.value);
    }

    /// Check if two GasPrice values are equal
    pub fn equals(self: Self, other: Self) bool {
        return self.value.eq(other.value);
    }

    /// Add two GasPrice values
    /// Returns null on overflow
    pub fn add(self: Self, other: Self) ?Self {
        const result = self.value.checked_add(other.value);
        if (result) |v| {
            return .{ .value = v };
        }
        return null;
    }

    /// Subtract GasPrice values
    /// Returns null on underflow (if other > self)
    pub fn sub(self: Self, other: Self) ?Self {
        const result = self.value.checked_sub(other.value);
        if (result) |v| {
            return .{ .value = v };
        }
        return null;
    }

    /// Multiply by a scalar (u64)
    /// Returns null on overflow
    pub fn mul(self: Self, scalar: u64) ?Self {
        const result = self.value.checked_mul(U256.from_u64(scalar));
        if (result) |v| {
            return .{ .value = v };
        }
        return null;
    }

    /// Check if this price is zero
    pub fn isZero(self: Self) bool {
        return self.value.is_zero();
    }

    /// Calculate total gas cost for given gas amount
    /// Returns gas_price * gas_amount, or null on overflow
    pub fn calculateCost(self: Self, gas_amount: u64) ?U256 {
        const result = self.value.checked_mul(U256.from_u64(gas_amount));
        return result;
    }
};

// ============================================================================
// Tests
// ============================================================================

test "GasPrice: from and toU64" {
    const price = GasPrice.from(20_000_000_000); // 20 gwei in wei
    try testing.expectEqual(@as(u64, 20_000_000_000), try price.toU64());
}

test "GasPrice: fromGwei" {
    const price = GasPrice.fromGwei(20);
    try testing.expectEqual(@as(u64, 20_000_000_000), try price.toU64());
}

test "GasPrice: toGwei" {
    const price = GasPrice.from(20_000_000_000);
    try testing.expectEqual(@as(u64, 20), try price.toGweiU64());
}

test "GasPrice: toGwei truncates" {
    const price = GasPrice.from(20_500_000_000); // 20.5 gwei
    try testing.expectEqual(@as(u64, 20), try price.toGweiU64());
}

test "GasPrice: toWei identity" {
    const price = GasPrice.from(98765);
    const wei = price.toWei();
    try testing.expect(wei.eq(GasPrice.U256.from_u64(98765)));
}

test "GasPrice: fromBytes and toBytes roundtrip" {
    const price = GasPrice.fromGwei(50);
    const bytes = price.toBytes();
    const restored = GasPrice.fromBytes(bytes);
    try testing.expect(price.equals(restored));
}

test "GasPrice: compare less than" {
    const price1 = GasPrice.fromGwei(10);
    const price2 = GasPrice.fromGwei(20);
    try testing.expectEqual(std.math.Order.lt, price1.compare(price2));
}

test "GasPrice: compare greater than" {
    const price1 = GasPrice.fromGwei(30);
    const price2 = GasPrice.fromGwei(20);
    try testing.expectEqual(std.math.Order.gt, price1.compare(price2));
}

test "GasPrice: compare equal" {
    const price1 = GasPrice.fromGwei(20);
    const price2 = GasPrice.fromGwei(20);
    try testing.expectEqual(std.math.Order.eq, price1.compare(price2));
}

test "GasPrice: equals" {
    const price1 = GasPrice.fromGwei(20);
    const price2 = GasPrice.fromGwei(20);
    const price3 = GasPrice.fromGwei(30);
    try testing.expect(price1.equals(price2));
    try testing.expect(!price1.equals(price3));
}

test "GasPrice: add" {
    const price1 = GasPrice.fromGwei(20);
    const price2 = GasPrice.fromGwei(10);
    const sum = price1.add(price2).?;
    try testing.expectEqual(@as(u64, 30), try sum.toGweiU64());
}

test "GasPrice: sub" {
    const price1 = GasPrice.fromGwei(20);
    const price2 = GasPrice.fromGwei(5);
    const diff = price1.sub(price2).?;
    try testing.expectEqual(@as(u64, 15), try diff.toGweiU64());
}

test "GasPrice: sub underflow returns null" {
    const price1 = GasPrice.fromGwei(5);
    const price2 = GasPrice.fromGwei(20);
    try testing.expect(price1.sub(price2) == null);
}

test "GasPrice: mul" {
    const price = GasPrice.fromGwei(10);
    const doubled = price.mul(2).?;
    try testing.expectEqual(@as(u64, 20), try doubled.toGweiU64());
}

test "GasPrice: isZero" {
    const zero = GasPrice.from(0);
    const nonzero = GasPrice.fromGwei(1);
    try testing.expect(zero.isZero());
    try testing.expect(!nonzero.isZero());
}

test "GasPrice: calculateCost" {
    const price = GasPrice.fromGwei(20); // 20 gwei
    const gas_amount: u64 = 21000; // standard transfer
    const cost = price.calculateCost(gas_amount).?;
    // 20 gwei * 21000 = 420000 gwei = 420000 * 1e9 wei
    try testing.expect(cost.eq(GasPrice.U256.from_u64(420_000_000_000_000)));
}

test "GasPrice: fromGwei roundtrip" {
    const gwei_values = [_]u64{ 1, 10, 20, 50, 100, 200, 500 };
    for (gwei_values) |gwei| {
        const price = GasPrice.fromGwei(gwei);
        try testing.expectEqual(gwei, try price.toGweiU64());
    }
}

test "GasPrice: zero value" {
    const price = GasPrice.from(0);
    try testing.expectEqual(@as(u64, 0), try price.toU64());
    try testing.expectEqual(@as(u64, 0), try price.toGweiU64());
    try testing.expect(price.isZero());
}

test "GasPrice: large value in gwei" {
    const price = GasPrice.fromGwei(1_000_000); // 1M gwei
    try testing.expectEqual(@as(u64, 1_000_000_000_000_000), try price.toU64());
    try testing.expectEqual(@as(u64, 1_000_000), try price.toGweiU64());
}

test "GasPrice: typical legacy tx cost" {
    // Legacy transaction: 21000 gas at 100 gwei
    const price = GasPrice.fromGwei(100);
    const cost = price.calculateCost(21000).?;
    // 100 * 1e9 * 21000 = 2.1e15 wei = 0.0021 ETH
    const cost_u64 = cost.to_u64() catch 0;
    try testing.expectEqual(@as(u64, 2_100_000_000_000_000), cost_u64);
}

test "GasPrice: contract deployment cost" {
    // Typical contract deployment: 500000 gas at 50 gwei
    const price = GasPrice.fromGwei(50);
    const cost = price.calculateCost(500_000).?;
    // 50 * 1e9 * 500000 = 2.5e16 wei
    const cost_u64 = cost.to_u64() catch 0;
    try testing.expectEqual(@as(u64, 25_000_000_000_000_000), cost_u64);
}
