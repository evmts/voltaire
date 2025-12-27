const std = @import("std");
const testing = std.testing;
const Uint = @import("../Uint/Uint.zig").Uint;

/// MaxFeePerGas type - EIP-1559 maximum fee per gas
/// Represents the maximum total gas price user is willing to pay.
/// Must be >= baseFeePerGas + maxPriorityFeePerGas for inclusion.
///
/// Internal value stored in wei (smallest denomination).
pub const MaxFeePerGas = struct {
    const Self = @This();
    pub const U256 = Uint(256, 4);

    /// Wei per Gwei constant (1e9)
    const WEI_PER_GWEI: u64 = 1_000_000_000;

    /// Internal value in wei
    value: U256,

    /// Create MaxFeePerGas from u64 (wei)
    pub fn from(wei: u64) Self {
        return .{ .value = U256.from_u64(wei) };
    }

    /// Create MaxFeePerGas from U256 (wei)
    pub fn fromU256(wei: U256) Self {
        return .{ .value = wei };
    }

    /// Create MaxFeePerGas from gwei
    pub fn fromGwei(gwei: u64) Self {
        const wei_value = U256.from_u64(gwei).mul(U256.from_u64(WEI_PER_GWEI));
        return .{ .value = wei_value };
    }

    /// Create MaxFeePerGas from bytes (big-endian, 32 bytes)
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

    /// Compare two MaxFeePerGas values
    /// Returns: .lt if self < other, .eq if equal, .gt if self > other
    pub fn compare(self: Self, other: Self) std.math.Order {
        return self.value.cmp(other.value);
    }

    /// Check if two MaxFeePerGas values are equal
    pub fn equals(self: Self, other: Self) bool {
        return self.value.eq(other.value);
    }

    /// Add two MaxFeePerGas values
    /// Returns null on overflow
    pub fn add(self: Self, other: Self) ?Self {
        const result = self.value.checked_add(other.value);
        if (result) |v| {
            return .{ .value = v };
        }
        return null;
    }

    /// Subtract MaxFeePerGas values
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

    /// Check if this max fee can cover the base fee
    pub fn coversBaseFee(self: Self, base_fee_wei: U256) bool {
        return self.value.cmp(base_fee_wei) != .lt;
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

    /// Create MaxFeePerGas from wei (alias for from, explicit naming)
    pub fn fromWei(wei: u64) Self {
        return from(wei);
    }

    /// Create MaxFeePerGas from U256 wei
    pub fn fromWeiU256(wei: U256) Self {
        return fromU256(wei);
    }
};

// ============================================================================
// Tests
// ============================================================================

test "MaxFeePerGas: from and toU64" {
    const fee = MaxFeePerGas.from(100_000_000_000); // 100 gwei in wei
    try testing.expectEqual(@as(u64, 100_000_000_000), try fee.toU64());
}

test "MaxFeePerGas: fromGwei" {
    const fee = MaxFeePerGas.fromGwei(100);
    try testing.expectEqual(@as(u64, 100_000_000_000), try fee.toU64());
}

test "MaxFeePerGas: toGwei" {
    const fee = MaxFeePerGas.from(100_000_000_000);
    try testing.expectEqual(@as(u64, 100), try fee.toGweiU64());
}

test "MaxFeePerGas: toGwei truncates" {
    const fee = MaxFeePerGas.from(100_500_000_000); // 100.5 gwei
    try testing.expectEqual(@as(u64, 100), try fee.toGweiU64());
}

test "MaxFeePerGas: toWei identity" {
    const fee = MaxFeePerGas.from(54321);
    const wei = fee.toWei();
    try testing.expect(wei.eq(MaxFeePerGas.U256.from_u64(54321)));
}

test "MaxFeePerGas: fromBytes and toBytes roundtrip" {
    const fee = MaxFeePerGas.fromGwei(200);
    const bytes = fee.toBytes();
    const restored = MaxFeePerGas.fromBytes(bytes);
    try testing.expect(fee.equals(restored));
}

test "MaxFeePerGas: compare less than" {
    const fee1 = MaxFeePerGas.fromGwei(50);
    const fee2 = MaxFeePerGas.fromGwei(100);
    try testing.expectEqual(std.math.Order.lt, fee1.compare(fee2));
}

test "MaxFeePerGas: compare greater than" {
    const fee1 = MaxFeePerGas.fromGwei(100);
    const fee2 = MaxFeePerGas.fromGwei(50);
    try testing.expectEqual(std.math.Order.gt, fee1.compare(fee2));
}

test "MaxFeePerGas: compare equal" {
    const fee1 = MaxFeePerGas.fromGwei(100);
    const fee2 = MaxFeePerGas.fromGwei(100);
    try testing.expectEqual(std.math.Order.eq, fee1.compare(fee2));
}

test "MaxFeePerGas: equals" {
    const fee1 = MaxFeePerGas.fromGwei(100);
    const fee2 = MaxFeePerGas.fromGwei(100);
    const fee3 = MaxFeePerGas.fromGwei(200);
    try testing.expect(fee1.equals(fee2));
    try testing.expect(!fee1.equals(fee3));
}

test "MaxFeePerGas: add" {
    const fee1 = MaxFeePerGas.fromGwei(100);
    const fee2 = MaxFeePerGas.fromGwei(50);
    const sum = fee1.add(fee2).?;
    try testing.expectEqual(@as(u64, 150), try sum.toGweiU64());
}

test "MaxFeePerGas: sub" {
    const fee1 = MaxFeePerGas.fromGwei(100);
    const fee2 = MaxFeePerGas.fromGwei(40);
    const diff = fee1.sub(fee2).?;
    try testing.expectEqual(@as(u64, 60), try diff.toGweiU64());
}

test "MaxFeePerGas: sub underflow returns null" {
    const fee1 = MaxFeePerGas.fromGwei(40);
    const fee2 = MaxFeePerGas.fromGwei(100);
    try testing.expect(fee1.sub(fee2) == null);
}

test "MaxFeePerGas: isZero" {
    const zero = MaxFeePerGas.from(0);
    const nonzero = MaxFeePerGas.fromGwei(1);
    try testing.expect(zero.isZero());
    try testing.expect(!nonzero.isZero());
}

test "MaxFeePerGas: coversBaseFee true" {
    const maxFee = MaxFeePerGas.fromGwei(100);
    const baseFee = MaxFeePerGas.U256.from_u64(50_000_000_000); // 50 gwei
    try testing.expect(maxFee.coversBaseFee(baseFee));
}

test "MaxFeePerGas: coversBaseFee false" {
    const maxFee = MaxFeePerGas.fromGwei(40);
    const baseFee = MaxFeePerGas.U256.from_u64(50_000_000_000); // 50 gwei
    try testing.expect(!maxFee.coversBaseFee(baseFee));
}

test "MaxFeePerGas: coversBaseFee equal" {
    const maxFee = MaxFeePerGas.fromGwei(50);
    const baseFee = MaxFeePerGas.U256.from_u64(50_000_000_000); // 50 gwei
    try testing.expect(maxFee.coversBaseFee(baseFee));
}

test "MaxFeePerGas: fromGwei roundtrip" {
    const gwei_values = [_]u64{ 1, 10, 50, 100, 200, 500, 1000 };
    for (gwei_values) |gwei| {
        const fee = MaxFeePerGas.fromGwei(gwei);
        try testing.expectEqual(gwei, try fee.toGweiU64());
    }
}

test "MaxFeePerGas: zero value" {
    const fee = MaxFeePerGas.from(0);
    try testing.expectEqual(@as(u64, 0), try fee.toU64());
    try testing.expectEqual(@as(u64, 0), try fee.toGweiU64());
    try testing.expect(fee.isZero());
}

test "MaxFeePerGas: large value in gwei" {
    const fee = MaxFeePerGas.fromGwei(10_000_000); // 10M gwei
    try testing.expectEqual(@as(u64, 10_000_000_000_000_000), try fee.toU64());
    try testing.expectEqual(@as(u64, 10_000_000), try fee.toGweiU64());
}

test "MaxFeePerGas: mul" {
    const fee = MaxFeePerGas.fromGwei(100);
    const doubled = fee.mul(2).?;
    try testing.expectEqual(@as(u64, 200), try doubled.toGweiU64());
}

test "MaxFeePerGas: mul by zero" {
    const fee = MaxFeePerGas.fromGwei(100);
    const zeroed = fee.mul(0).?;
    try testing.expect(zeroed.isZero());
}

test "MaxFeePerGas: div" {
    const fee = MaxFeePerGas.fromGwei(200);
    const halved = fee.div(2).?;
    try testing.expectEqual(@as(u64, 100), try halved.toGweiU64());
}

test "MaxFeePerGas: div truncates" {
    const fee = MaxFeePerGas.fromGwei(150);
    const result = fee.div(4).?;
    try testing.expectEqual(@as(u64, 37), try result.toGweiU64());
}

test "MaxFeePerGas: div by zero returns null" {
    const fee = MaxFeePerGas.fromGwei(100);
    try testing.expect(fee.div(0) == null);
}

test "MaxFeePerGas: fromWei" {
    const fee = MaxFeePerGas.fromWei(100_000_000_000);
    try testing.expectEqual(@as(u64, 100), try fee.toGweiU64());
}
