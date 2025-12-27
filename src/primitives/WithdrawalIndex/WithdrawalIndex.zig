//! WithdrawalIndex - Global Withdrawal Counter (EIP-4895)
//!
//! Represents the global withdrawal counter in the beacon chain.
//! This counter increments monotonically for each withdrawal processed,
//! providing a unique identifier for every withdrawal operation.
//!
//! Introduced in EIP-4895 (Shanghai upgrade) to enable validator withdrawals.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const WithdrawalIndex = primitives.WithdrawalIndex;
//!
//! // Create withdrawal index
//! const idx = WithdrawalIndex.from(1000000);
//!
//! // Convert to number
//! const num = WithdrawalIndex.toNumber(idx);
//!
//! // Convert to bigint (u256)
//! const big = WithdrawalIndex.toBigInt(idx);
//!
//! // Increment
//! const next = WithdrawalIndex.increment(idx);
//! ```

const std = @import("std");

/// WithdrawalIndex type - represents global withdrawal counter
pub const WithdrawalIndex = u64;

/// Create WithdrawalIndex from u64 value
///
/// ## Parameters
/// - `value`: u64 withdrawal index
///
/// ## Returns
/// WithdrawalIndex value
///
/// ## Example
/// ```zig
/// const idx = WithdrawalIndex.from(1000000);
/// ```
pub fn from(value: u64) WithdrawalIndex {
    return value;
}

/// Create WithdrawalIndex from u256 value (with bounds check)
///
/// ## Parameters
/// - `value`: u256 withdrawal index
///
/// ## Returns
/// WithdrawalIndex value, or null if value exceeds u64 range
///
/// ## Example
/// ```zig
/// const idx = WithdrawalIndex.fromBigInt(1000000);
/// ```
pub fn fromBigInt(value: u256) ?WithdrawalIndex {
    if (value > std.math.maxInt(u64)) return null;
    return @truncate(value);
}

/// Parse WithdrawalIndex from hex string
///
/// ## Parameters
/// - `hex`: Hex string (with or without 0x prefix)
///
/// ## Returns
/// WithdrawalIndex value, or null if invalid hex or out of range
///
/// ## Example
/// ```zig
/// const idx = WithdrawalIndex.fromHex("0xf4240"); // 1000000
/// const idx2 = WithdrawalIndex.fromHex("f4240");  // 1000000
/// ```
pub fn fromHex(hex: []const u8) ?WithdrawalIndex {
    var start: usize = 0;
    if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) {
        start = 2;
    }
    if (start >= hex.len) return null;

    var result: u128 = 0;
    for (hex[start..]) |c| {
        const digit: u128 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return null,
        };
        result = result *% 16 +% digit;
        if (result > std.math.maxInt(u64)) return null;
    }
    return @truncate(result);
}

/// Convert WithdrawalIndex to u64
///
/// ## Parameters
/// - `index`: WithdrawalIndex value
///
/// ## Returns
/// u64 representation
///
/// ## Example
/// ```zig
/// const idx = WithdrawalIndex.from(1000000);
/// const num = WithdrawalIndex.toNumber(idx);
/// ```
pub fn toNumber(index: WithdrawalIndex) u64 {
    return index;
}

/// Convert WithdrawalIndex to u256 (for compatibility with big integers)
///
/// ## Parameters
/// - `index`: WithdrawalIndex value
///
/// ## Returns
/// u256 representation
///
/// ## Example
/// ```zig
/// const idx = WithdrawalIndex.from(1000000);
/// const big = WithdrawalIndex.toBigInt(idx);
/// ```
pub fn toBigInt(index: WithdrawalIndex) u256 {
    return index;
}

/// Check if two WithdrawalIndexes are equal
///
/// ## Parameters
/// - `a`: First index
/// - `b`: Second index
///
/// ## Returns
/// true if equal
///
/// ## Example
/// ```zig
/// const a = WithdrawalIndex.from(1000000);
/// const b = WithdrawalIndex.from(1000000);
/// const result = WithdrawalIndex.equals(a, b); // true
/// ```
pub fn equals(a: WithdrawalIndex, b: WithdrawalIndex) bool {
    return a == b;
}

/// Compare two WithdrawalIndexes
///
/// ## Parameters
/// - `a`: First index
/// - `b`: Second index
///
/// ## Returns
/// .lt if a < b, .eq if a == b, .gt if a > b
///
/// ## Example
/// ```zig
/// const a = WithdrawalIndex.from(1000);
/// const b = WithdrawalIndex.from(2000);
/// const result = WithdrawalIndex.compare(a, b); // .lt
/// ```
pub fn compare(a: WithdrawalIndex, b: WithdrawalIndex) std.math.Order {
    return std.math.order(a, b);
}

/// Convert WithdrawalIndex to hex string
///
/// ## Parameters
/// - `index`: WithdrawalIndex value
///
/// ## Returns
/// Hex string representation (e.g., "0xf4240")
///
/// ## Example
/// ```zig
/// const idx = WithdrawalIndex.from(1000000);
/// const hex = WithdrawalIndex.toHex(idx); // "0xf4240"
/// ```
pub fn toHex(index: WithdrawalIndex) [19]u8 {
    var buf: [19]u8 = undefined;
    const hex_chars = "0123456789abcdef";
    buf[0] = '0';
    buf[1] = 'x';

    // Handle zero case
    var val = index;
    if (val == 0) {
        buf[2] = '0';
        buf[3] = 0;
        return buf;
    }

    // Convert to hex nibbles (reversed)
    var len: usize = 0;
    var temp: [16]u8 = undefined;
    while (val > 0) {
        temp[len] = hex_chars[val & 0xf];
        val >>= 4;
        len += 1;
    }

    // Reverse into buf
    for (0..len) |i| {
        buf[2 + i] = temp[len - 1 - i];
    }
    buf[2 + len] = 0;
    return buf;
}

/// Increment WithdrawalIndex by 1
///
/// ## Parameters
/// - `index`: WithdrawalIndex value
///
/// ## Returns
/// Next index, or null on overflow
///
/// ## Example
/// ```zig
/// const idx = WithdrawalIndex.from(1000000);
/// const next = WithdrawalIndex.increment(idx); // 1000001
/// ```
pub fn increment(index: WithdrawalIndex) ?WithdrawalIndex {
    return std.math.add(u64, index, 1) catch null;
}

/// Check if WithdrawalIndex is zero
///
/// ## Parameters
/// - `index`: WithdrawalIndex value
///
/// ## Returns
/// true if index is zero
///
/// ## Example
/// ```zig
/// const idx = WithdrawalIndex.from(0);
/// const result = WithdrawalIndex.isZero(idx); // true
/// ```
pub fn isZero(index: WithdrawalIndex) bool {
    return index == 0;
}

// Constants

/// Minimum withdrawal index
pub const MIN: WithdrawalIndex = 0;

/// Maximum withdrawal index
pub const MAX: WithdrawalIndex = std.math.maxInt(u64);

/// Zero index (first withdrawal)
pub const ZERO: WithdrawalIndex = 0;

// ====================================
// Tests
// ====================================

test "WithdrawalIndex.from creates index" {
    const idx = from(1000000);
    try std.testing.expectEqual(1000000, idx);
}

test "WithdrawalIndex.from handles zero" {
    const idx = from(0);
    try std.testing.expectEqual(0, idx);
}

test "WithdrawalIndex.from handles max u64" {
    const idx = from(std.math.maxInt(u64));
    try std.testing.expectEqual(std.math.maxInt(u64), idx);
}

test "WithdrawalIndex.fromBigInt converts valid u256" {
    const idx = fromBigInt(1000000);
    try std.testing.expectEqual(1000000, idx.?);
}

test "WithdrawalIndex.fromBigInt returns null for too large" {
    const idx = fromBigInt(@as(u256, std.math.maxInt(u64)) + 1);
    try std.testing.expect(idx == null);
}

test "WithdrawalIndex.toNumber converts to u64" {
    const idx = from(42);
    try std.testing.expectEqual(42, toNumber(idx));
}

test "WithdrawalIndex.toNumber is identity" {
    const idx = from(123456);
    try std.testing.expectEqual(idx, toNumber(idx));
}

test "WithdrawalIndex.toBigInt converts to u256" {
    const idx = from(1000000);
    try std.testing.expectEqual(@as(u256, 1000000), toBigInt(idx));
}

test "WithdrawalIndex.toBigInt handles max u64" {
    const idx = from(std.math.maxInt(u64));
    try std.testing.expectEqual(@as(u256, std.math.maxInt(u64)), toBigInt(idx));
}

test "WithdrawalIndex.equals returns true for equal indexes" {
    const a = from(1000000);
    const b = from(1000000);
    try std.testing.expect(equals(a, b));
}

test "WithdrawalIndex.equals returns false for unequal indexes" {
    const a = from(1000000);
    const b = from(1000001);
    try std.testing.expect(!equals(a, b));
}

test "WithdrawalIndex.equals handles zero" {
    const a = from(0);
    const b = from(0);
    try std.testing.expect(equals(a, b));
}

test "WithdrawalIndex.compare returns .lt for lesser" {
    const a = from(1000);
    const b = from(2000);
    try std.testing.expectEqual(std.math.Order.lt, compare(a, b));
}

test "WithdrawalIndex.compare returns .eq for equal" {
    const a = from(1000000);
    const b = from(1000000);
    try std.testing.expectEqual(std.math.Order.eq, compare(a, b));
}

test "WithdrawalIndex.compare returns .gt for greater" {
    const a = from(2000);
    const b = from(1000);
    try std.testing.expectEqual(std.math.Order.gt, compare(a, b));
}

test "WithdrawalIndex.increment increments by one" {
    const idx = from(1000000);
    const next = increment(idx);
    try std.testing.expectEqual(1000001, next.?);
}

test "WithdrawalIndex.increment handles zero" {
    const idx = from(0);
    const next = increment(idx);
    try std.testing.expectEqual(1, next.?);
}

test "WithdrawalIndex.increment returns null on overflow" {
    const idx = from(std.math.maxInt(u64));
    const next = increment(idx);
    try std.testing.expect(next == null);
}

test "WithdrawalIndex constants" {
    try std.testing.expectEqual(@as(u64, 0), MIN);
    try std.testing.expectEqual(@as(u64, 0), ZERO);
    try std.testing.expectEqual(std.math.maxInt(u64), MAX);
}

test "WithdrawalIndex.toHex converts zero" {
    const idx = from(0);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0x0", std.mem.sliceTo(&hex, 0));
}

test "WithdrawalIndex.toHex converts single digit" {
    const idx = from(10);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xa", std.mem.sliceTo(&hex, 0));
}

test "WithdrawalIndex.toHex converts 255" {
    const idx = from(255);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xff", std.mem.sliceTo(&hex, 0));
}

test "WithdrawalIndex.toHex converts typical withdrawal index" {
    const idx = from(1000000);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xf4240", std.mem.sliceTo(&hex, 0));
}

test "WithdrawalIndex.toHex converts large u64" {
    const idx = from(0xcafebabe12345678);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xcafebabe12345678", std.mem.sliceTo(&hex, 0));
}

test "WithdrawalIndex.toHex converts max u64" {
    const idx = from(std.math.maxInt(u64));
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xffffffffffffffff", std.mem.sliceTo(&hex, 0));
}

test "WithdrawalIndex.fromHex parses with 0x prefix" {
    const idx = fromHex("0xf4240");
    try std.testing.expectEqual(1000000, idx.?);
}

test "WithdrawalIndex.fromHex parses without prefix" {
    const idx = fromHex("f4240");
    try std.testing.expectEqual(1000000, idx.?);
}

test "WithdrawalIndex.fromHex parses zero" {
    const idx = fromHex("0x0");
    try std.testing.expectEqual(0, idx.?);
}

test "WithdrawalIndex.fromHex parses uppercase" {
    const idx = fromHex("0xF4240");
    try std.testing.expectEqual(1000000, idx.?);
}

test "WithdrawalIndex.fromHex parses max u64" {
    const idx = fromHex("0xffffffffffffffff");
    try std.testing.expectEqual(std.math.maxInt(u64), idx.?);
}

test "WithdrawalIndex.fromHex parses large value" {
    const idx = fromHex("0xcafebabe12345678");
    try std.testing.expectEqual(0xcafebabe12345678, idx.?);
}

test "WithdrawalIndex.fromHex returns null for overflow" {
    const idx = fromHex("0x10000000000000000");
    try std.testing.expect(idx == null);
}

test "WithdrawalIndex.fromHex returns null for invalid char" {
    const idx = fromHex("0xf424g");
    try std.testing.expect(idx == null);
}

test "WithdrawalIndex.fromHex returns null for empty" {
    const idx = fromHex("0x");
    try std.testing.expect(idx == null);
}

test "WithdrawalIndex.isZero returns true for zero" {
    const idx = from(0);
    try std.testing.expect(isZero(idx));
}

test "WithdrawalIndex.isZero returns false for non-zero" {
    const idx = from(1000000);
    try std.testing.expect(!isZero(idx));
}

test "WithdrawalIndex.isZero with ZERO constant" {
    try std.testing.expect(isZero(ZERO));
}
