//! Transaction Nonce - Sequential counter for Ethereum accounts
//!
//! A nonce is a scalar value equal to the number of transactions sent from an account.
//! It prevents transaction replay attacks and enforces ordering.
//!
//! ## Design
//! - Stored as u64 (sufficient for practical use - 18 quintillion transactions)
//! - Provides conversion to/from bigint for compatibility
//! - Supports increment operation for next nonce calculation
//!
//! ## Usage
//! ```zig
//! const nonce = Nonce.from(42);
//! const next = nonce.increment();
//! const value = nonce.toNumber();
//! ```

const std = @import("std");

/// Nonce type - u64 representing transaction count
pub const Nonce = u64;

/// Create Nonce from u64 value
///
/// @param value - u64 value
/// @returns Nonce
pub fn from(value: u64) Nonce {
    return value;
}

/// Create Nonce from bigint value (for compatibility with Uint256)
///
/// @param value - u256 value
/// @returns Nonce (truncated to u64)
pub fn fromBigInt(value: u256) Nonce {
    return @intCast(value);
}

/// Convert Nonce to bigint (u256 for compatibility)
///
/// @param nonce - Nonce
/// @returns u256
pub fn toBigInt(nonce: Nonce) u256 {
    return nonce;
}

/// Convert Nonce to number (u64)
///
/// @param nonce - Nonce
/// @returns u64
pub fn toNumber(nonce: Nonce) u64 {
    return nonce;
}

/// Increment nonce by 1
///
/// @param nonce - Nonce
/// @returns New nonce incremented by 1
pub fn increment(nonce: Nonce) Nonce {
    return nonce + 1;
}

// Tests

test "Nonce.from creates nonce from u64" {
    const nonce = from(42);
    try std.testing.expectEqual(@as(u64, 42), nonce);
}

test "Nonce.from handles zero" {
    const nonce = from(0);
    try std.testing.expectEqual(@as(u64, 0), nonce);
}

test "Nonce.from handles max u64" {
    const nonce = from(std.math.maxInt(u64));
    try std.testing.expectEqual(std.math.maxInt(u64), nonce);
}

test "Nonce.fromBigInt converts u256 to nonce" {
    const nonce = fromBigInt(42);
    try std.testing.expectEqual(@as(u64, 42), nonce);
}

test "Nonce.fromBigInt truncates large values" {
    const large_value: u256 = std.math.maxInt(u64) + 1;
    const nonce = fromBigInt(large_value);
    // Will truncate to 0 due to overflow
    try std.testing.expectEqual(@as(u64, 0), nonce);
}

test "Nonce.toBigInt converts nonce to u256" {
    const nonce = from(42);
    const result = toBigInt(nonce);
    try std.testing.expectEqual(@as(u256, 42), result);
}

test "Nonce.toBigInt handles max u64" {
    const nonce = from(std.math.maxInt(u64));
    const result = toBigInt(nonce);
    try std.testing.expectEqual(@as(u256, std.math.maxInt(u64)), result);
}

test "Nonce.toNumber converts nonce to u64" {
    const nonce = from(42);
    const result = toNumber(nonce);
    try std.testing.expectEqual(@as(u64, 42), result);
}

test "Nonce.toNumber is identity function" {
    const nonce = from(12345);
    const result = toNumber(nonce);
    try std.testing.expectEqual(nonce, result);
}

test "Nonce.increment adds 1 to nonce" {
    const nonce = from(42);
    const result = increment(nonce);
    try std.testing.expectEqual(@as(u64, 43), result);
}

test "Nonce.increment handles zero" {
    const nonce = from(0);
    const result = increment(nonce);
    try std.testing.expectEqual(@as(u64, 1), result);
}

test "Nonce.increment wraps at max u64" {
    const nonce = from(std.math.maxInt(u64));
    const result = increment(nonce);
    // Wraps to 0
    try std.testing.expectEqual(@as(u64, 0), result);
}

test "Nonce.increment chain multiple times" {
    var nonce = from(0);
    nonce = increment(nonce);
    nonce = increment(nonce);
    nonce = increment(nonce);
    try std.testing.expectEqual(@as(u64, 3), nonce);
}
