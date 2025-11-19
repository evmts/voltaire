const std = @import("std");
const testing = std.testing;
const Uint = @import("../Uint/Uint.zig").Uint;

/// Gas limit type - maximum gas units for a transaction
/// Wraps Uint(256, 4) with semantic gas limit operations
pub const GasLimit = struct {
    value: Uint(256, 4),

    /// Common gas limit constants
    pub const SIMPLE_TRANSFER: GasLimit = .{ .value = Uint(256, 4).from_u64(21000) };
    pub const ERC20_TRANSFER: GasLimit = .{ .value = Uint(256, 4).from_u64(65000) };
    pub const DEFAULT_LIMIT: GasLimit = .{ .value = Uint(256, 4).from_u64(30000000) };

    /// Create GasLimit from u64
    pub fn from_u64(value: u64) GasLimit {
        return .{ .value = Uint(256, 4).from_u64(value) };
    }

    /// Convert GasLimit to u64
    /// Returns error if value exceeds u64 range
    pub fn to_u64(self: GasLimit) error{Overflow}!u64 {
        return self.value.to_u64();
    }

    /// Convert GasLimit to bytes (big-endian)
    pub fn to_bytes(self: GasLimit) [32]u8 {
        return self.value.to_bytes();
    }

    /// Create GasLimit from bytes (big-endian)
    pub fn from_bytes(bytes: [32]u8) GasLimit {
        return .{ .value = Uint(256, 4).from_bytes(bytes) };
    }
};

/// Gas price type - gas price in wei per gas unit
/// Wraps Uint(256, 4) with semantic gas price operations
pub const GasPrice = struct {
    value: Uint(256, 4),

    const GWEI: u64 = 1_000_000_000;

    /// Create GasPrice from u64 (wei)
    pub fn from_u64(value: u64) GasPrice {
        return .{ .value = Uint(256, 4).from_u64(value) };
    }

    /// Create GasPrice from gwei
    pub fn from_gwei(gwei: u64) GasPrice {
        const wei_value = Uint(256, 4).from_u64(gwei).mul(Uint(256, 4).from_u64(GWEI));
        return .{ .value = wei_value };
    }

    /// Convert GasPrice to u64 (wei)
    /// Returns error if value exceeds u64 range
    pub fn to_u64(self: GasPrice) error{Overflow}!u64 {
        return self.value.to_u64();
    }

    /// Convert GasPrice to gwei
    /// Returns error if value exceeds u64 range after division
    pub fn to_gwei(self: GasPrice) error{Overflow}!u64 {
        const gwei_value = self.value.div(Uint(256, 4).from_u64(GWEI)).quotient;
        return gwei_value.to_u64();
    }

    /// Convert GasPrice to bytes (big-endian)
    pub fn to_bytes(self: GasPrice) [32]u8 {
        return self.value.to_bytes();
    }

    /// Create GasPrice from bytes (big-endian)
    pub fn from_bytes(bytes: [32]u8) GasPrice {
        return .{ .value = Uint(256, 4).from_bytes(bytes) };
    }
};

// Tests
test "GasLimit: constants" {
    try testing.expectEqual(21000, try GasLimit.SIMPLE_TRANSFER.to_u64());
    try testing.expectEqual(65000, try GasLimit.ERC20_TRANSFER.to_u64());
    try testing.expectEqual(30000000, try GasLimit.DEFAULT_LIMIT.to_u64());
}

test "GasLimit: from_u64 and to_u64" {
    const limit = GasLimit.from_u64(21000);
    try testing.expectEqual(21000, try limit.to_u64());

    const limit2 = GasLimit.from_u64(100000);
    try testing.expectEqual(100000, try limit2.to_u64());
}

test "GasLimit: to_bytes and from_bytes" {
    const limit = GasLimit.from_u64(21000);
    const bytes = limit.to_bytes();
    const restored = GasLimit.from_bytes(bytes);
    try testing.expectEqual(21000, try restored.to_u64());
}

test "GasPrice: from_u64 and to_u64" {
    const price = GasPrice.from_u64(20_000_000_000);
    try testing.expectEqual(20_000_000_000, try price.to_u64());
}

test "GasPrice: from_gwei" {
    const price = GasPrice.from_gwei(20); // 20 gwei
    try testing.expectEqual(20_000_000_000, try price.to_u64());

    const price2 = GasPrice.from_gwei(100); // 100 gwei
    try testing.expectEqual(100_000_000_000, try price2.to_u64());
}

test "GasPrice: to_gwei" {
    const price = GasPrice.from_u64(20_000_000_000); // 20 gwei in wei
    try testing.expectEqual(20, try price.to_gwei());

    const price2 = GasPrice.from_u64(100_000_000_000); // 100 gwei in wei
    try testing.expectEqual(100, try price2.to_gwei());
}

test "GasPrice: to_bytes and from_bytes" {
    const price = GasPrice.from_gwei(20);
    const bytes = price.to_bytes();
    const restored = GasPrice.from_bytes(bytes);
    try testing.expectEqual(20, try restored.to_gwei());
}

test "GasPrice: from_gwei roundtrip" {
    const gwei_values = [_]u64{ 1, 10, 20, 50, 100, 200, 1000 };
    for (gwei_values) |gwei| {
        const price = GasPrice.from_gwei(gwei);
        try testing.expectEqual(gwei, try price.to_gwei());
    }
}
