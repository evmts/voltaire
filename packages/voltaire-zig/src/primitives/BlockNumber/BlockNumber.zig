//! Block Number - Ethereum block height/number
//!
//! Block number represents the sequential height of a block in the blockchain.
//! It's a monotonically increasing counter starting from genesis (0).
//!
//! ## Design
//! - Stored as u64 (sufficient for practical use - 18 quintillion blocks)
//! - Provides conversion to/from bigint for compatibility with U256
//! - Supports equals comparison for matching blocks
//!
//! ## Usage
//! ```zig
//! const block = BlockNumber.from(12345);
//! const next = block + 1;
//! const value = BlockNumber.toNumber(block);
//! const equal = BlockNumber.equals(block, other);
//! ```

const std = @import("std");

/// BlockNumber type - u64 representing block height
pub const BlockNumber = u64;

/// Create BlockNumber from u64 value
///
/// @param value - u64 value
/// @returns BlockNumber
pub fn from(value: u64) BlockNumber {
    return value;
}

/// Create BlockNumber from bigint value (for compatibility with U256)
///
/// @param value - u256 value
/// @returns BlockNumber (truncated to u64 if value exceeds u64 max)
pub fn fromBigInt(value: u256) BlockNumber {
    return @truncate(value);
}

/// Convert BlockNumber to bigint (u256 for compatibility)
///
/// @param block_number - BlockNumber
/// @returns u256
pub fn toBigInt(block_number: BlockNumber) u256 {
    return block_number;
}

/// Convert BlockNumber to number (u64)
///
/// @param block_number - BlockNumber
/// @returns u64
pub fn toNumber(block_number: BlockNumber) u64 {
    return block_number;
}

/// Check if two BlockNumbers are equal
///
/// @param a - First BlockNumber
/// @param b - Second BlockNumber
/// @returns true if equal
pub fn equals(a: BlockNumber, b: BlockNumber) bool {
    return a == b;
}

// Constants

/// Minimum block number (genesis)
pub const MIN: BlockNumber = 0;

/// Maximum block number (U256 max for compatibility)
pub const MAX: u256 = std.math.maxInt(u256);

/// Zero block (genesis)
pub const ZERO: BlockNumber = 0;

/// Block number one
pub const ONE: BlockNumber = 1;

// Tests

test "BlockNumber.from creates block number from u64" {
    const block = from(123456);
    try std.testing.expectEqual(@as(u64, 123456), block);
}

test "BlockNumber.from handles zero" {
    const block = from(0);
    try std.testing.expectEqual(@as(u64, 0), block);
}

test "BlockNumber.from handles max u64" {
    const block = from(std.math.maxInt(u64));
    try std.testing.expectEqual(std.math.maxInt(u64), block);
}

test "BlockNumber.fromBigInt converts u256 to block number" {
    const block = fromBigInt(123456);
    try std.testing.expectEqual(@as(u64, 123456), block);
}

test "BlockNumber.fromBigInt truncates large values" {
    const large_value: u256 = std.math.maxInt(u64) + 1;
    const block = fromBigInt(large_value);
    // Will truncate to 0 due to overflow
    try std.testing.expectEqual(@as(u64, 0), block);
}

test "BlockNumber.toBigInt converts block number to u256" {
    const block = from(123456);
    const result = toBigInt(block);
    try std.testing.expectEqual(@as(u256, 123456), result);
}

test "BlockNumber.toBigInt handles max u64" {
    const block = from(std.math.maxInt(u64));
    const result = toBigInt(block);
    try std.testing.expectEqual(@as(u256, std.math.maxInt(u64)), result);
}

test "BlockNumber.toNumber converts block number to u64" {
    const block = from(999);
    const result = toNumber(block);
    try std.testing.expectEqual(@as(u64, 999), result);
}

test "BlockNumber.toNumber is identity function" {
    const block = from(12345);
    const result = toNumber(block);
    try std.testing.expectEqual(block, result);
}

test "BlockNumber.equals returns true for equal blocks" {
    const a = from(100);
    const b = from(100);
    try std.testing.expect(equals(a, b));
}

test "BlockNumber.equals returns false for different blocks" {
    const a = from(100);
    const b = from(101);
    try std.testing.expect(!equals(a, b));
}

test "BlockNumber.equals handles zero" {
    const a = from(0);
    const b = from(0);
    try std.testing.expect(equals(a, b));
}

test "BlockNumber.equals handles max u64" {
    const a = from(std.math.maxInt(u64));
    const b = from(std.math.maxInt(u64));
    try std.testing.expect(equals(a, b));
}

test "BlockNumber constants" {
    try std.testing.expectEqual(@as(u64, 0), MIN);
    try std.testing.expectEqual(@as(u64, 0), ZERO);
    try std.testing.expectEqual(@as(u64, 1), ONE);
    try std.testing.expectEqual(std.math.maxInt(u256), MAX);
}

test "BlockNumber.from accepts ZERO constant" {
    const block = from(ZERO);
    try std.testing.expectEqual(@as(u64, 0), block);
}

test "BlockNumber.from accepts ONE constant" {
    const block = from(ONE);
    try std.testing.expectEqual(@as(u64, 1), block);
}
