//! GasRefund - gas refunded after transaction
//!
//! Sources: SSTORE refunds, SELFDESTRUCT refunds (pre-London)
//! Post-London (EIP-3529): Capped at gasUsed / 5

const std = @import("std");
const testing = std.testing;

/// GasRefund type - gas units refunded after transaction
/// Wraps u64 with semantic gas refund operations
pub const GasRefund = struct {
    value: u64,

    /// EIP-3529 refund cap divisor (post-London)
    pub const REFUND_CAP_DIVISOR: u64 = 5;

    /// SSTORE refund for clearing storage (post-London)
    pub const SSTORE_CLEAR_REFUND: u64 = 4800;

    /// Create GasRefund from u64
    pub fn from(value: u64) GasRefund {
        return .{ .value = value };
    }

    /// Get the raw u64 value
    pub fn toNumber(self: GasRefund) u64 {
        return self.value;
    }

    /// Add two gas refunds
    pub fn add(self: GasRefund, other: GasRefund) GasRefund {
        return .{ .value = self.value + other.value };
    }

    /// Subtract gas refund (saturating)
    pub fn sub(self: GasRefund, other: GasRefund) GasRefund {
        return .{ .value = self.value -| other.value };
    }

    /// Check equality
    pub fn equals(self: GasRefund, other: GasRefund) bool {
        return self.value == other.value;
    }

    /// Compare two gas refunds
    /// Returns: -1 if self < other, 0 if equal, 1 if self > other
    pub fn compare(self: GasRefund, other: GasRefund) i8 {
        if (self.value < other.value) return -1;
        if (self.value > other.value) return 1;
        return 0;
    }

    /// Apply EIP-3529 refund cap (gasUsed / 5)
    /// Post-London hard fork limitation on gas refunds
    pub fn cappedRefund(self: GasRefund, gas_used: u64) GasRefund {
        const cap = gas_used / REFUND_CAP_DIVISOR;
        const capped = if (self.value > cap) cap else self.value;
        return .{ .value = capped };
    }

    /// Apply pre-London refund cap (gasUsed / 2)
    /// For hardforks before London
    pub fn cappedRefundPreLondon(self: GasRefund, gas_used: u64) GasRefund {
        const cap = gas_used / 2;
        const capped = if (self.value > cap) cap else self.value;
        return .{ .value = capped };
    }

    /// Calculate effective gas used after refund
    pub fn effectiveGasUsed(self: GasRefund, gas_used: u64) u64 {
        const capped = self.cappedRefund(gas_used);
        return gas_used -| capped.value;
    }

    /// Convert to hex string (allocates)
    pub fn toHex(self: GasRefund, allocator: std.mem.Allocator) ![]u8 {
        return std.fmt.allocPrint(allocator, "0x{x}", .{self.value});
    }

    /// Parse from hex string
    pub fn fromHex(hex: []const u8) !GasRefund {
        const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
        const value = try std.fmt.parseInt(u64, hex[start..], 16);
        return .{ .value = value };
    }
};

// Tests
test "GasRefund: from and toNumber" {
    const refund = GasRefund.from(15000);
    try testing.expectEqual(@as(u64, 15000), refund.toNumber());

    const refund2 = GasRefund.from(0);
    try testing.expectEqual(@as(u64, 0), refund2.toNumber());
}

test "GasRefund: constants" {
    try testing.expectEqual(@as(u64, 5), GasRefund.REFUND_CAP_DIVISOR);
    try testing.expectEqual(@as(u64, 4800), GasRefund.SSTORE_CLEAR_REFUND);
}

test "GasRefund: add" {
    const a = GasRefund.from(4800);
    const b = GasRefund.from(4800);
    const result = a.add(b);
    try testing.expectEqual(@as(u64, 9600), result.toNumber());
}

test "GasRefund: sub" {
    const a = GasRefund.from(15000);
    const b = GasRefund.from(5000);
    const result = a.sub(b);
    try testing.expectEqual(@as(u64, 10000), result.toNumber());

    // Saturating subtraction
    const c = GasRefund.from(1000);
    const d = GasRefund.from(5000);
    const result2 = c.sub(d);
    try testing.expectEqual(@as(u64, 0), result2.toNumber());
}

test "GasRefund: equals" {
    const a = GasRefund.from(15000);
    const b = GasRefund.from(15000);
    const c = GasRefund.from(20000);

    try testing.expect(a.equals(b));
    try testing.expect(!a.equals(c));
}

test "GasRefund: compare" {
    const a = GasRefund.from(10000);
    const b = GasRefund.from(20000);
    const c = GasRefund.from(10000);

    try testing.expectEqual(@as(i8, -1), a.compare(b));
    try testing.expectEqual(@as(i8, 1), b.compare(a));
    try testing.expectEqual(@as(i8, 0), a.compare(c));
}

test "GasRefund: cappedRefund" {
    // EIP-3529 example from TS
    const refund = GasRefund.from(15000);
    const gas_used: u64 = 50000;

    // Cap = 50000 / 5 = 10000
    const capped = refund.cappedRefund(gas_used);
    try testing.expectEqual(@as(u64, 10000), capped.toNumber());

    // Small refund (not capped)
    const small_refund = GasRefund.from(5000);
    const small_capped = small_refund.cappedRefund(gas_used);
    try testing.expectEqual(@as(u64, 5000), small_capped.toNumber());

    // Zero gas used
    const zero_cap = refund.cappedRefund(0);
    try testing.expectEqual(@as(u64, 0), zero_cap.toNumber());
}

test "GasRefund: cappedRefundPreLondon" {
    // Pre-London cap was gasUsed / 2
    const refund = GasRefund.from(30000);
    const gas_used: u64 = 50000;

    // Cap = 50000 / 2 = 25000
    const capped = refund.cappedRefundPreLondon(gas_used);
    try testing.expectEqual(@as(u64, 25000), capped.toNumber());

    // Small refund (not capped)
    const small_refund = GasRefund.from(10000);
    const small_capped = small_refund.cappedRefundPreLondon(gas_used);
    try testing.expectEqual(@as(u64, 10000), small_capped.toNumber());
}

test "GasRefund: effectiveGasUsed" {
    const refund = GasRefund.from(15000);
    const gas_used: u64 = 50000;

    // Effective = 50000 - 10000 (capped) = 40000
    const effective = refund.effectiveGasUsed(gas_used);
    try testing.expectEqual(@as(u64, 40000), effective);

    // Small refund
    const small_refund = GasRefund.from(5000);
    const small_effective = small_refund.effectiveGasUsed(gas_used);
    try testing.expectEqual(@as(u64, 45000), small_effective);
}

test "GasRefund: toHex and fromHex" {
    const refund = GasRefund.from(0x12C0); // 4800

    const hex = try refund.toHex(testing.allocator);
    defer testing.allocator.free(hex);
    try testing.expectEqualStrings("0x12c0", hex);

    const parsed = try GasRefund.fromHex("0x12C0");
    try testing.expectEqual(@as(u64, 4800), parsed.toNumber());
}

test "GasRefund: SSTORE clear scenario" {
    // Clearing multiple storage slots
    const slots_cleared: u64 = 3;
    const total_refund = GasRefund.from(GasRefund.SSTORE_CLEAR_REFUND * slots_cleared);
    try testing.expectEqual(@as(u64, 14400), total_refund.toNumber());

    // Apply cap for 100k gas used
    // Cap = 100000 / 5 = 20000
    const capped = total_refund.cappedRefund(100000);
    try testing.expectEqual(@as(u64, 14400), capped.toNumber()); // Not capped

    // Apply cap for 50k gas used
    // Cap = 50000 / 5 = 10000
    const capped2 = total_refund.cappedRefund(50000);
    try testing.expectEqual(@as(u64, 10000), capped2.toNumber()); // Capped
}
