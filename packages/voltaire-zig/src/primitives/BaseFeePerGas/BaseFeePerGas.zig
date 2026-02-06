const std = @import("std");
const testing = std.testing;
const Uint = @import("../Uint/Uint.zig").Uint;
const Denomination = @import("../Denomination/denomination.zig");

/// BaseFeePerGas type - EIP-1559 base fee per gas
/// Represents the minimum gas price required for transaction inclusion.
/// Base fee is burned and adjusts dynamically based on block fullness.
///
/// Internal value stored in wei (smallest denomination).
pub const BaseFeePerGas = struct {
    const Self = @This();
    pub const U256 = Uint(256, 4);

    /// Wei per Gwei constant (1e9)
    const WEI_PER_GWEI: u64 = 1_000_000_000;

    /// Internal value in wei
    value: U256,

    /// Create BaseFeePerGas from u64 (wei)
    pub fn from(wei: u64) Self {
        return .{ .value = U256.from_u64(wei) };
    }

    /// Create BaseFeePerGas from U256 (wei)
    pub fn fromU256(wei: U256) Self {
        return .{ .value = wei };
    }

    /// Create BaseFeePerGas from gwei
    pub fn fromGwei(gwei: u64) Self {
        const wei_value = U256.from_u64(gwei).mul(U256.from_u64(WEI_PER_GWEI));
        return .{ .value = wei_value };
    }

    /// Create BaseFeePerGas from bytes (big-endian, 32 bytes)
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

    /// Compare two BaseFeePerGas values
    /// Returns: .lt if self < other, .eq if equal, .gt if self > other
    pub fn compare(self: Self, other: Self) std.math.Order {
        return self.value.cmp(other.value);
    }

    /// Check if two BaseFeePerGas values are equal
    pub fn equals(self: Self, other: Self) bool {
        return self.value.eq(other.value);
    }

    /// Add two BaseFeePerGas values
    /// Returns null on overflow
    pub fn add(self: Self, other: Self) ?Self {
        const result = self.value.checked_add(other.value);
        if (result) |v| {
            return .{ .value = v };
        }
        return null;
    }

    /// Subtract BaseFeePerGas values
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

    /// Create BaseFeePerGas from wei (alias for from, explicit naming)
    pub fn fromWei(wei: u64) Self {
        return from(wei);
    }

    /// Create BaseFeePerGas from U256 wei
    pub fn fromWeiU256(wei: U256) Self {
        return fromU256(wei);
    }
};

// ============================================================================
// Tests
// ============================================================================

test "BaseFeePerGas: from and toU64" {
    const fee = BaseFeePerGas.from(25_000_000_000); // 25 gwei in wei
    try testing.expectEqual(@as(u64, 25_000_000_000), try fee.toU64());
}

test "BaseFeePerGas: fromGwei" {
    const fee = BaseFeePerGas.fromGwei(25); // 25 gwei
    try testing.expectEqual(@as(u64, 25_000_000_000), try fee.toU64());
}

test "BaseFeePerGas: toGwei" {
    const fee = BaseFeePerGas.from(25_000_000_000); // 25 gwei in wei
    try testing.expectEqual(@as(u64, 25), try fee.toGweiU64());
}

test "BaseFeePerGas: toGwei truncates" {
    const fee = BaseFeePerGas.from(25_500_000_000); // 25.5 gwei
    try testing.expectEqual(@as(u64, 25), try fee.toGweiU64());
}

test "BaseFeePerGas: toWei identity" {
    const fee = BaseFeePerGas.from(12345);
    const wei = fee.toWei();
    try testing.expect(wei.eq(BaseFeePerGas.U256.from_u64(12345)));
}

test "BaseFeePerGas: fromBytes and toBytes roundtrip" {
    const fee = BaseFeePerGas.fromGwei(100);
    const bytes = fee.toBytes();
    const restored = BaseFeePerGas.fromBytes(bytes);
    try testing.expect(fee.equals(restored));
}

test "BaseFeePerGas: compare less than" {
    const fee1 = BaseFeePerGas.fromGwei(25);
    const fee2 = BaseFeePerGas.fromGwei(30);
    try testing.expectEqual(std.math.Order.lt, fee1.compare(fee2));
}

test "BaseFeePerGas: compare greater than" {
    const fee1 = BaseFeePerGas.fromGwei(30);
    const fee2 = BaseFeePerGas.fromGwei(25);
    try testing.expectEqual(std.math.Order.gt, fee1.compare(fee2));
}

test "BaseFeePerGas: compare equal" {
    const fee1 = BaseFeePerGas.fromGwei(25);
    const fee2 = BaseFeePerGas.fromGwei(25);
    try testing.expectEqual(std.math.Order.eq, fee1.compare(fee2));
}

test "BaseFeePerGas: equals" {
    const fee1 = BaseFeePerGas.fromGwei(25);
    const fee2 = BaseFeePerGas.fromGwei(25);
    const fee3 = BaseFeePerGas.fromGwei(30);
    try testing.expect(fee1.equals(fee2));
    try testing.expect(!fee1.equals(fee3));
}

test "BaseFeePerGas: add" {
    const fee1 = BaseFeePerGas.fromGwei(25);
    const fee2 = BaseFeePerGas.fromGwei(10);
    const sum = fee1.add(fee2).?;
    try testing.expectEqual(@as(u64, 35), try sum.toGweiU64());
}

test "BaseFeePerGas: sub" {
    const fee1 = BaseFeePerGas.fromGwei(25);
    const fee2 = BaseFeePerGas.fromGwei(10);
    const diff = fee1.sub(fee2).?;
    try testing.expectEqual(@as(u64, 15), try diff.toGweiU64());
}

test "BaseFeePerGas: sub underflow returns null" {
    const fee1 = BaseFeePerGas.fromGwei(10);
    const fee2 = BaseFeePerGas.fromGwei(25);
    try testing.expect(fee1.sub(fee2) == null);
}

test "BaseFeePerGas: isZero" {
    const zero = BaseFeePerGas.from(0);
    const nonzero = BaseFeePerGas.fromGwei(1);
    try testing.expect(zero.isZero());
    try testing.expect(!nonzero.isZero());
}

test "BaseFeePerGas: fromGwei roundtrip" {
    const gwei_values = [_]u64{ 1, 10, 25, 50, 100, 200, 1000 };
    for (gwei_values) |gwei| {
        const fee = BaseFeePerGas.fromGwei(gwei);
        try testing.expectEqual(gwei, try fee.toGweiU64());
    }
}

test "BaseFeePerGas: zero value" {
    const fee = BaseFeePerGas.from(0);
    try testing.expectEqual(@as(u64, 0), try fee.toU64());
    try testing.expectEqual(@as(u64, 0), try fee.toGweiU64());
    try testing.expect(fee.isZero());
}

test "BaseFeePerGas: large value in gwei" {
    const fee = BaseFeePerGas.fromGwei(1_000_000); // 1M gwei
    try testing.expectEqual(@as(u64, 1_000_000_000_000_000), try fee.toU64());
    try testing.expectEqual(@as(u64, 1_000_000), try fee.toGweiU64());
}

test "BaseFeePerGas: mul" {
    const fee = BaseFeePerGas.fromGwei(25);
    const doubled = fee.mul(2).?;
    try testing.expectEqual(@as(u64, 50), try doubled.toGweiU64());
}

test "BaseFeePerGas: mul by zero" {
    const fee = BaseFeePerGas.fromGwei(25);
    const zeroed = fee.mul(0).?;
    try testing.expect(zeroed.isZero());
}

test "BaseFeePerGas: div" {
    const fee = BaseFeePerGas.fromGwei(100);
    const halved = fee.div(2).?;
    try testing.expectEqual(@as(u64, 50), try halved.toGweiU64());
}

test "BaseFeePerGas: div truncates" {
    const fee = BaseFeePerGas.fromGwei(25);
    const result = fee.div(2).?;
    try testing.expectEqual(@as(u64, 12), try result.toGweiU64());
}

test "BaseFeePerGas: div by zero returns null" {
    const fee = BaseFeePerGas.fromGwei(25);
    try testing.expect(fee.div(0) == null);
}

test "BaseFeePerGas: fromWei" {
    const fee = BaseFeePerGas.fromWei(25_000_000_000);
    try testing.expectEqual(@as(u64, 25), try fee.toGweiU64());
}
