//! ChainId - EIP-155 Chain Identifier
//!
//! Represents an Ethereum chain ID as specified in EIP-155 to prevent replay attacks.
//! Chain IDs are unsigned 64-bit integers that uniquely identify different Ethereum networks.
//!
//! ## Common Chain IDs
//! - Mainnet: 1
//! - Goerli: 5
//! - Sepolia: 11155111
//! - Holesky: 17000
//! - Optimism: 10
//! - Arbitrum: 42161
//! - Base: 8453
//! - Polygon: 137
//!
//! ## Usage
//! ```zig
//! const chain = ChainId.MAINNET;
//! const is_main = chain.isMainnet();
//! const equal = chain.equals(ChainId.MAINNET);
//! const num = chain.toNumber();
//! ```

const std = @import("std");

/// ChainId type - u64 representing an EIP-155 chain identifier
pub const ChainId = u64;

// Well-known chain IDs
pub const MAINNET: ChainId = 1;
pub const GOERLI: ChainId = 5;
pub const SEPOLIA: ChainId = 11155111;
pub const HOLESKY: ChainId = 17000;
pub const OPTIMISM: ChainId = 10;
pub const ARBITRUM: ChainId = 42161;
pub const BASE: ChainId = 8453;
pub const POLYGON: ChainId = 137;

/// Create ChainId from u64 value
/// No validation needed - all u64 values are valid chain IDs
pub fn from(value: u64) ChainId {
    return value;
}

/// Check if two chain IDs are equal
pub fn equals(self: ChainId, other: ChainId) bool {
    return self == other;
}

/// Check if chain ID is Ethereum mainnet
pub fn isMainnet(self: ChainId) bool {
    return self == MAINNET;
}

/// Convert ChainId to u64 number
pub fn toNumber(self: ChainId) u64 {
    return self;
}

// Tests
test "ChainId: from creates chain ID" {
    const chain = from(1);
    try std.testing.expectEqual(@as(ChainId, 1), chain);
}

test "ChainId: from accepts any u64" {
    _ = from(0);
    _ = from(1);
    _ = from(11155111);
    _ = from(std.math.maxInt(u64));
}

test "ChainId: constants are correct values" {
    try std.testing.expectEqual(@as(ChainId, 1), MAINNET);
    try std.testing.expectEqual(@as(ChainId, 5), GOERLI);
    try std.testing.expectEqual(@as(ChainId, 11155111), SEPOLIA);
    try std.testing.expectEqual(@as(ChainId, 17000), HOLESKY);
    try std.testing.expectEqual(@as(ChainId, 10), OPTIMISM);
    try std.testing.expectEqual(@as(ChainId, 42161), ARBITRUM);
    try std.testing.expectEqual(@as(ChainId, 8453), BASE);
    try std.testing.expectEqual(@as(ChainId, 137), POLYGON);
}

test "ChainId: equals returns true for same chain" {
    const chain1 = from(1);
    const chain2 = from(1);
    try std.testing.expect(equals(chain1, chain2));
}

test "ChainId: equals returns false for different chains" {
    const chain1 = from(1);
    const chain2 = from(5);
    try std.testing.expect(!equals(chain1, chain2));
}

test "ChainId: equals with constants" {
    try std.testing.expect(equals(MAINNET, from(1)));
    try std.testing.expect(equals(SEPOLIA, from(11155111)));
    try std.testing.expect(!equals(MAINNET, SEPOLIA));
}

test "ChainId: isMainnet returns true for mainnet" {
    const chain = MAINNET;
    try std.testing.expect(isMainnet(chain));
}

test "ChainId: isMainnet returns false for other chains" {
    try std.testing.expect(!isMainnet(GOERLI));
    try std.testing.expect(!isMainnet(SEPOLIA));
    try std.testing.expect(!isMainnet(from(999)));
}

test "ChainId: toNumber returns underlying value" {
    const chain = from(42161);
    try std.testing.expectEqual(@as(u64, 42161), toNumber(chain));
}

test "ChainId: toNumber works with constants" {
    try std.testing.expectEqual(@as(u64, 1), toNumber(MAINNET));
    try std.testing.expectEqual(@as(u64, 11155111), toNumber(SEPOLIA));
    try std.testing.expectEqual(@as(u64, 42161), toNumber(ARBITRUM));
}

test "ChainId: complete workflow" {
    // Create from value
    const chain = from(1);

    // Check if mainnet
    try std.testing.expect(isMainnet(chain));

    // Compare chains
    try std.testing.expect(equals(chain, MAINNET));
    try std.testing.expect(!equals(chain, SEPOLIA));

    // Convert back to number
    const num = toNumber(chain);
    try std.testing.expectEqual(@as(u64, 1), num);
}
