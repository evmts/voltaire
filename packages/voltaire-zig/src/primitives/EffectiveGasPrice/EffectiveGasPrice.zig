const std = @import("std");
const testing = std.testing;
const Uint = @import("../Uint/Uint.zig").Uint;

/// EffectiveGasPrice type - EIP-1559 effective gas price
/// Represents the actual gas price paid in a transaction.
/// Calculated as: min(baseFee + priorityFee, maxFeePerGas)
///
/// Internal value stored in wei (smallest denomination).
pub const EffectiveGasPrice = struct {
    const Self = @This();
    pub const U256 = Uint(256, 4);

    /// Wei per Gwei constant (1e9)
    const WEI_PER_GWEI: u64 = 1_000_000_000;

    /// Internal value in wei
    value: U256,

    /// Create EffectiveGasPrice from u64 (wei)
    pub fn from(wei: u64) Self {
        return .{ .value = U256.from_u64(wei) };
    }

    /// Create EffectiveGasPrice from U256 (wei)
    pub fn fromU256(wei: U256) Self {
        return .{ .value = wei };
    }

    /// Create EffectiveGasPrice from gwei
    pub fn fromGwei(gwei: u64) Self {
        const wei_value = U256.from_u64(gwei).mul(U256.from_u64(WEI_PER_GWEI));
        return .{ .value = wei_value };
    }

    /// Create EffectiveGasPrice from bytes (big-endian, 32 bytes)
    pub fn fromBytes(bytes: [32]u8) Self {
        return .{ .value = U256.from_bytes(bytes) };
    }

    /// Calculate effective gas price from EIP-1559 fee parameters
    /// Formula: min(baseFee + min(maxPriorityFee, maxFee - baseFee), maxFee)
    ///
    /// Parameters:
    /// - base_fee: Base fee per gas (in wei)
    /// - max_fee: Maximum fee per gas (in wei)
    /// - max_priority_fee: Maximum priority fee per gas (in wei)
    ///
    /// Returns: EffectiveGasPrice and the miner's portion
    pub fn calculate(base_fee: U256, max_fee: U256, max_priority_fee: U256) struct { effective: Self, miner_fee: U256 } {
        // If max_fee < base_fee, tx would be rejected but return max_fee and 0 miner
        if (max_fee.cmp(base_fee) == .lt) {
            return .{
                .effective = Self{ .value = max_fee },
                .miner_fee = U256.ZERO,
            };
        }

        // max_allowed_priority = max_fee - base_fee
        const max_allowed_priority = max_fee.sub(base_fee);

        // effective_priority = min(max_priority_fee, max_allowed_priority)
        const effective_priority = if (max_priority_fee.cmp(max_allowed_priority) == .lt)
            max_priority_fee
        else
            max_allowed_priority;

        // effective_gas_price = base_fee + effective_priority
        const effective_gas_price = base_fee.add(effective_priority);

        // Safety cap at max_fee (should always be true)
        const final_price = if (effective_gas_price.cmp(max_fee) == .gt)
            max_fee
        else
            effective_gas_price;

        return .{
            .effective = Self{ .value = final_price },
            .miner_fee = effective_priority,
        };
    }

    /// Calculate effective gas price from u64 values (convenience)
    pub fn calculateFromU64(base_fee: u64, max_fee: u64, max_priority_fee: u64) struct { effective: Self, miner_fee: u64 } {
        const result = calculate(
            U256.from_u64(base_fee),
            U256.from_u64(max_fee),
            U256.from_u64(max_priority_fee),
        );
        return .{
            .effective = result.effective,
            .miner_fee = result.miner_fee.to_u64() catch 0,
        };
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

    /// Compare two EffectiveGasPrice values
    /// Returns: .lt if self < other, .eq if equal, .gt if self > other
    pub fn compare(self: Self, other: Self) std.math.Order {
        return self.value.cmp(other.value);
    }

    /// Check if two EffectiveGasPrice values are equal
    pub fn equals(self: Self, other: Self) bool {
        return self.value.eq(other.value);
    }

    /// Check if this price is zero
    pub fn isZero(self: Self) bool {
        return self.value.is_zero();
    }
};

// ============================================================================
// Tests
// ============================================================================

test "EffectiveGasPrice: from and toU64" {
    const price = EffectiveGasPrice.from(27_000_000_000); // 27 gwei in wei
    try testing.expectEqual(@as(u64, 27_000_000_000), try price.toU64());
}

test "EffectiveGasPrice: fromGwei" {
    const price = EffectiveGasPrice.fromGwei(27);
    try testing.expectEqual(@as(u64, 27_000_000_000), try price.toU64());
}

test "EffectiveGasPrice: toGwei" {
    const price = EffectiveGasPrice.from(27_000_000_000);
    try testing.expectEqual(@as(u64, 27), try price.toGweiU64());
}

test "EffectiveGasPrice: toGwei truncates" {
    const price = EffectiveGasPrice.from(27_500_000_000); // 27.5 gwei
    try testing.expectEqual(@as(u64, 27), try price.toGweiU64());
}

test "EffectiveGasPrice: toWei identity" {
    const price = EffectiveGasPrice.from(12345);
    const wei = price.toWei();
    try testing.expect(wei.eq(EffectiveGasPrice.U256.from_u64(12345)));
}

test "EffectiveGasPrice: fromBytes and toBytes roundtrip" {
    const price = EffectiveGasPrice.fromGwei(50);
    const bytes = price.toBytes();
    const restored = EffectiveGasPrice.fromBytes(bytes);
    try testing.expect(price.equals(restored));
}

test "EffectiveGasPrice: calculate with sufficient max fee" {
    // base_fee = 25 gwei, max_fee = 100 gwei, priority = 2 gwei
    // effective = 25 + 2 = 27 gwei
    const result = EffectiveGasPrice.calculateFromU64(
        25_000_000_000, // 25 gwei base
        100_000_000_000, // 100 gwei max
        2_000_000_000, // 2 gwei priority
    );
    try testing.expectEqual(@as(u64, 27_000_000_000), try result.effective.toU64());
    try testing.expectEqual(@as(u64, 2_000_000_000), result.miner_fee);
}

test "EffectiveGasPrice: calculate with limited max fee" {
    // base_fee = 25 gwei, max_fee = 27 gwei, priority = 5 gwei
    // max_allowed_priority = 27 - 25 = 2 gwei
    // effective = 25 + 2 = 27 gwei (capped)
    const result = EffectiveGasPrice.calculateFromU64(
        25_000_000_000, // 25 gwei base
        27_000_000_000, // 27 gwei max (tight)
        5_000_000_000, // 5 gwei priority (more than available)
    );
    try testing.expectEqual(@as(u64, 27_000_000_000), try result.effective.toU64());
    try testing.expectEqual(@as(u64, 2_000_000_000), result.miner_fee);
}

test "EffectiveGasPrice: calculate with max fee below base fee" {
    // Tx would be rejected, but returns max_fee with 0 miner
    const result = EffectiveGasPrice.calculateFromU64(
        30_000_000_000, // 30 gwei base
        25_000_000_000, // 25 gwei max (below base)
        2_000_000_000, // 2 gwei priority
    );
    try testing.expectEqual(@as(u64, 25_000_000_000), try result.effective.toU64());
    try testing.expectEqual(@as(u64, 0), result.miner_fee);
}

test "EffectiveGasPrice: calculate with zero priority fee" {
    const result = EffectiveGasPrice.calculateFromU64(
        25_000_000_000, // 25 gwei base
        100_000_000_000, // 100 gwei max
        0, // 0 priority
    );
    try testing.expectEqual(@as(u64, 25_000_000_000), try result.effective.toU64());
    try testing.expectEqual(@as(u64, 0), result.miner_fee);
}

test "EffectiveGasPrice: calculate with exact base fee match" {
    const result = EffectiveGasPrice.calculateFromU64(
        25_000_000_000, // 25 gwei base
        25_000_000_000, // 25 gwei max (exactly base)
        2_000_000_000, // 2 gwei priority (can't be paid)
    );
    try testing.expectEqual(@as(u64, 25_000_000_000), try result.effective.toU64());
    try testing.expectEqual(@as(u64, 0), result.miner_fee);
}

test "EffectiveGasPrice: compare less than" {
    const price1 = EffectiveGasPrice.fromGwei(25);
    const price2 = EffectiveGasPrice.fromGwei(30);
    try testing.expectEqual(std.math.Order.lt, price1.compare(price2));
}

test "EffectiveGasPrice: compare greater than" {
    const price1 = EffectiveGasPrice.fromGwei(30);
    const price2 = EffectiveGasPrice.fromGwei(25);
    try testing.expectEqual(std.math.Order.gt, price1.compare(price2));
}

test "EffectiveGasPrice: compare equal" {
    const price1 = EffectiveGasPrice.fromGwei(27);
    const price2 = EffectiveGasPrice.fromGwei(27);
    try testing.expectEqual(std.math.Order.eq, price1.compare(price2));
}

test "EffectiveGasPrice: equals" {
    const price1 = EffectiveGasPrice.fromGwei(27);
    const price2 = EffectiveGasPrice.fromGwei(27);
    const price3 = EffectiveGasPrice.fromGwei(30);
    try testing.expect(price1.equals(price2));
    try testing.expect(!price1.equals(price3));
}

test "EffectiveGasPrice: isZero" {
    const zero = EffectiveGasPrice.from(0);
    const nonzero = EffectiveGasPrice.fromGwei(1);
    try testing.expect(zero.isZero());
    try testing.expect(!nonzero.isZero());
}

test "EffectiveGasPrice: fromGwei roundtrip" {
    const gwei_values = [_]u64{ 1, 10, 25, 27, 50, 100, 200 };
    for (gwei_values) |gwei| {
        const price = EffectiveGasPrice.fromGwei(gwei);
        try testing.expectEqual(gwei, try price.toGweiU64());
    }
}

test "EffectiveGasPrice: zero value" {
    const price = EffectiveGasPrice.from(0);
    try testing.expectEqual(@as(u64, 0), try price.toU64());
    try testing.expectEqual(@as(u64, 0), try price.toGweiU64());
    try testing.expect(price.isZero());
}

test "EffectiveGasPrice: typical mainnet values" {
    // Typical scenario: 20 gwei base, 100 gwei max, 2 gwei priority
    const result = EffectiveGasPrice.calculateFromU64(
        20_000_000_000, // 20 gwei base
        100_000_000_000, // 100 gwei max
        2_000_000_000, // 2 gwei priority
    );
    // effective = 20 + 2 = 22 gwei
    try testing.expectEqual(@as(u64, 22), try result.effective.toGweiU64());
    try testing.expectEqual(@as(u64, 2_000_000_000), result.miner_fee);
}
