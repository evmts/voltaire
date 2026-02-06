const std = @import("std");
const testing = std.testing;
const Uint = @import("../Uint/Uint.zig").Uint;

/// MaxPriorityFeePerGas type - EIP-1559 maximum priority fee (tip)
/// Represents the maximum tip user is willing to pay to miner/validator.
/// Incentivizes transaction inclusion in blocks.
///
/// Internal value stored in wei (smallest denomination).
pub const MaxPriorityFeePerGas = struct {
    const Self = @This();
    pub const U256 = Uint(256, 4);

    /// Wei per Gwei constant (1e9)
    const WEI_PER_GWEI: u64 = 1_000_000_000;

    /// Internal value in wei
    value: U256,

    /// Create MaxPriorityFeePerGas from u64 (wei)
    pub fn from(wei: u64) Self {
        return .{ .value = U256.from_u64(wei) };
    }

    /// Create MaxPriorityFeePerGas from U256 (wei)
    pub fn fromU256(wei: U256) Self {
        return .{ .value = wei };
    }

    /// Create MaxPriorityFeePerGas from gwei
    pub fn fromGwei(gwei: u64) Self {
        const wei_value = U256.from_u64(gwei).mul(U256.from_u64(WEI_PER_GWEI));
        return .{ .value = wei_value };
    }

    /// Create MaxPriorityFeePerGas from bytes (big-endian, 32 bytes)
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

    /// Compare two MaxPriorityFeePerGas values
    /// Returns: .lt if self < other, .eq if equal, .gt if self > other
    pub fn compare(self: Self, other: Self) std.math.Order {
        return self.value.cmp(other.value);
    }

    /// Check if two MaxPriorityFeePerGas values are equal
    pub fn equals(self: Self, other: Self) bool {
        return self.value.eq(other.value);
    }

    /// Add two MaxPriorityFeePerGas values
    /// Returns null on overflow
    pub fn add(self: Self, other: Self) ?Self {
        const result = self.value.checked_add(other.value);
        if (result) |v| {
            return .{ .value = v };
        }
        return null;
    }

    /// Subtract MaxPriorityFeePerGas values
    /// Returns null on underflow (if other > self)
    pub fn sub(self: Self, other: Self) ?Self {
        const result = self.value.checked_sub(other.value);
        if (result) |v| {
            return .{ .value = v };
        }
        return null;
    }

    /// Check if this fee is zero
    pub fn isZero(self: Self) bool {
        return self.value.is_zero();
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

    /// Divide by a scalar (u64)
    /// Returns null on division by zero
    pub fn div(self: Self, divisor: u64) ?Self {
        if (divisor == 0) return null;
        const result = self.value.div_rem(U256.from_u64(divisor));
        return .{ .value = result.quotient };
    }

    /// Create MaxPriorityFeePerGas from wei (alias for from, explicit naming)
    pub fn fromWei(wei: u64) Self {
        return from(wei);
    }

    /// Create MaxPriorityFeePerGas from U256 wei
    pub fn fromWeiU256(wei: U256) Self {
        return fromU256(wei);
    }
};

// ============================================================================
// Tests
// ============================================================================

test "MaxPriorityFeePerGas: from and toU64" {
    const fee = MaxPriorityFeePerGas.from(2_000_000_000); // 2 gwei in wei
    try testing.expectEqual(@as(u64, 2_000_000_000), try fee.toU64());
}

test "MaxPriorityFeePerGas: fromGwei" {
    const fee = MaxPriorityFeePerGas.fromGwei(2);
    try testing.expectEqual(@as(u64, 2_000_000_000), try fee.toU64());
}

test "MaxPriorityFeePerGas: toGwei" {
    const fee = MaxPriorityFeePerGas.from(2_000_000_000);
    try testing.expectEqual(@as(u64, 2), try fee.toGweiU64());
}

test "MaxPriorityFeePerGas: toGwei truncates" {
    const fee = MaxPriorityFeePerGas.from(2_500_000_000); // 2.5 gwei
    try testing.expectEqual(@as(u64, 2), try fee.toGweiU64());
}

test "MaxPriorityFeePerGas: toWei identity" {
    const fee = MaxPriorityFeePerGas.from(99999);
    const wei = fee.toWei();
    try testing.expect(wei.eq(MaxPriorityFeePerGas.U256.from_u64(99999)));
}

test "MaxPriorityFeePerGas: fromBytes and toBytes roundtrip" {
    const fee = MaxPriorityFeePerGas.fromGwei(5);
    const bytes = fee.toBytes();
    const restored = MaxPriorityFeePerGas.fromBytes(bytes);
    try testing.expect(fee.equals(restored));
}

test "MaxPriorityFeePerGas: compare less than" {
    const fee1 = MaxPriorityFeePerGas.fromGwei(1);
    const fee2 = MaxPriorityFeePerGas.fromGwei(2);
    try testing.expectEqual(std.math.Order.lt, fee1.compare(fee2));
}

test "MaxPriorityFeePerGas: compare greater than" {
    const fee1 = MaxPriorityFeePerGas.fromGwei(5);
    const fee2 = MaxPriorityFeePerGas.fromGwei(2);
    try testing.expectEqual(std.math.Order.gt, fee1.compare(fee2));
}

test "MaxPriorityFeePerGas: compare equal" {
    const fee1 = MaxPriorityFeePerGas.fromGwei(2);
    const fee2 = MaxPriorityFeePerGas.fromGwei(2);
    try testing.expectEqual(std.math.Order.eq, fee1.compare(fee2));
}

test "MaxPriorityFeePerGas: equals" {
    const fee1 = MaxPriorityFeePerGas.fromGwei(2);
    const fee2 = MaxPriorityFeePerGas.fromGwei(2);
    const fee3 = MaxPriorityFeePerGas.fromGwei(5);
    try testing.expect(fee1.equals(fee2));
    try testing.expect(!fee1.equals(fee3));
}

test "MaxPriorityFeePerGas: add" {
    const fee1 = MaxPriorityFeePerGas.fromGwei(2);
    const fee2 = MaxPriorityFeePerGas.fromGwei(3);
    const sum = fee1.add(fee2).?;
    try testing.expectEqual(@as(u64, 5), try sum.toGweiU64());
}

test "MaxPriorityFeePerGas: sub" {
    const fee1 = MaxPriorityFeePerGas.fromGwei(5);
    const fee2 = MaxPriorityFeePerGas.fromGwei(2);
    const diff = fee1.sub(fee2).?;
    try testing.expectEqual(@as(u64, 3), try diff.toGweiU64());
}

test "MaxPriorityFeePerGas: sub underflow returns null" {
    const fee1 = MaxPriorityFeePerGas.fromGwei(2);
    const fee2 = MaxPriorityFeePerGas.fromGwei(5);
    try testing.expect(fee1.sub(fee2) == null);
}

test "MaxPriorityFeePerGas: isZero" {
    const zero = MaxPriorityFeePerGas.from(0);
    const nonzero = MaxPriorityFeePerGas.fromGwei(1);
    try testing.expect(zero.isZero());
    try testing.expect(!nonzero.isZero());
}

test "MaxPriorityFeePerGas: fromGwei roundtrip" {
    const gwei_values = [_]u64{ 1, 2, 5, 10, 20, 50, 100 };
    for (gwei_values) |gwei| {
        const fee = MaxPriorityFeePerGas.fromGwei(gwei);
        try testing.expectEqual(gwei, try fee.toGweiU64());
    }
}

test "MaxPriorityFeePerGas: zero value" {
    const fee = MaxPriorityFeePerGas.from(0);
    try testing.expectEqual(@as(u64, 0), try fee.toU64());
    try testing.expectEqual(@as(u64, 0), try fee.toGweiU64());
    try testing.expect(fee.isZero());
}

test "MaxPriorityFeePerGas: small tip values" {
    // Priority fees are typically small (1-5 gwei)
    const fee = MaxPriorityFeePerGas.fromGwei(1);
    try testing.expectEqual(@as(u64, 1_000_000_000), try fee.toU64());
}

test "MaxPriorityFeePerGas: mul" {
    const fee = MaxPriorityFeePerGas.fromGwei(2);
    const tripled = fee.mul(3).?;
    try testing.expectEqual(@as(u64, 6), try tripled.toGweiU64());
}

test "MaxPriorityFeePerGas: mul by zero" {
    const fee = MaxPriorityFeePerGas.fromGwei(5);
    const zeroed = fee.mul(0).?;
    try testing.expect(zeroed.isZero());
}

test "MaxPriorityFeePerGas: div" {
    const fee = MaxPriorityFeePerGas.fromGwei(10);
    const halved = fee.div(2).?;
    try testing.expectEqual(@as(u64, 5), try halved.toGweiU64());
}

test "MaxPriorityFeePerGas: div truncates" {
    const fee = MaxPriorityFeePerGas.fromGwei(5);
    const result = fee.div(2).?;
    try testing.expectEqual(@as(u64, 2), try result.toGweiU64());
}

test "MaxPriorityFeePerGas: div by zero returns null" {
    const fee = MaxPriorityFeePerGas.fromGwei(2);
    try testing.expect(fee.div(0) == null);
}

test "MaxPriorityFeePerGas: fromWei" {
    const fee = MaxPriorityFeePerGas.fromWei(2_000_000_000);
    try testing.expectEqual(@as(u64, 2), try fee.toGweiU64());
}
