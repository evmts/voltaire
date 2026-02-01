//! TransactionIndex - Transaction index within a block
//!
//! Represents the 0-based index of a transaction within a block.
//! Transactions are ordered by their position in the block, with
//! the first transaction having index 0.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const TransactionIndex = primitives.TransactionIndex;
//!
//! // Create transaction index
//! const idx = TransactionIndex.from(10);
//!
//! // From hex
//! const idx2 = try TransactionIndex.fromHex("0x5");
//!
//! // Convert to number
//! const num = TransactionIndex.toNumber(idx);
//!
//! // Increment
//! const next = TransactionIndex.increment(idx);
//! ```

const std = @import("std");

/// TransactionIndex type - represents a tx index within a block (0-based)
pub const TransactionIndex = u64;

/// Create TransactionIndex from u64 value
pub fn from(value: u64) TransactionIndex {
    return value;
}

/// Parse TransactionIndex from hex string
///
/// Accepts "0x" prefixed or bare hex strings.
/// Returns error for invalid hex or overflow.
pub fn fromHex(hex: []const u8) error{ InvalidHex, Overflow }!TransactionIndex {
    if (hex.len == 0) return error.InvalidHex;

    const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
    const digits = hex[start..];

    if (digits.len == 0) return error.InvalidHex;
    if (digits.len > 16) return error.Overflow; // u64 max is 16 hex digits

    var result: u64 = 0;
    for (digits) |c| {
        const digit: u64 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return error.InvalidHex,
        };
        result = std.math.mul(u64, result, 16) catch return error.Overflow;
        result = std.math.add(u64, result, digit) catch return error.Overflow;
    }
    return result;
}

/// Convert TransactionIndex to u64
pub fn toNumber(index: TransactionIndex) u64 {
    return index;
}

/// Convert TransactionIndex to hex string
///
/// Returns a null-terminated buffer with "0x" prefix.
/// Use std.mem.sliceTo(&hex, 0) to get slice.
pub fn toHex(index: TransactionIndex) [19]u8 {
    var buf: [19]u8 = undefined; // "0x" + max 16 digits + null
    const hex_chars = "0123456789abcdef";
    buf[0] = '0';
    buf[1] = 'x';

    var val = index;
    if (val == 0) {
        buf[2] = '0';
        buf[3] = 0;
        return buf;
    }

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

/// Check if two TransactionIndexes are equal
pub fn equals(a: TransactionIndex, b: TransactionIndex) bool {
    return a == b;
}

/// Compare two TransactionIndexes
pub fn compare(a: TransactionIndex, b: TransactionIndex) std.math.Order {
    return std.math.order(a, b);
}

/// Increment TransactionIndex by 1
///
/// Returns null on overflow.
pub fn increment(index: TransactionIndex) ?TransactionIndex {
    return std.math.add(u64, index, 1) catch null;
}

/// Check if TransactionIndex is zero
pub fn isZero(index: TransactionIndex) bool {
    return index == 0;
}

// Constants

/// Minimum transaction index
pub const MIN: TransactionIndex = 0;

/// Maximum transaction index
pub const MAX: TransactionIndex = std.math.maxInt(u64);

/// Zero index (first transaction in block)
pub const ZERO: TransactionIndex = 0;

// ====================================
// Tests
// ====================================

test "from creates index" {
    const idx = from(10);
    try std.testing.expectEqual(10, idx);
}

test "from handles zero" {
    const idx = from(0);
    try std.testing.expectEqual(0, idx);
}

test "from handles max u64" {
    const idx = from(std.math.maxInt(u64));
    try std.testing.expectEqual(std.math.maxInt(u64), idx);
}

test "fromHex parses prefixed hex" {
    const idx = try fromHex("0x10");
    try std.testing.expectEqual(16, idx);
}

test "fromHex parses bare hex" {
    const idx = try fromHex("ff");
    try std.testing.expectEqual(255, idx);
}

test "fromHex parses uppercase" {
    const idx = try fromHex("0xABCD");
    try std.testing.expectEqual(0xabcd, idx);
}

test "fromHex parses zero" {
    const idx = try fromHex("0x0");
    try std.testing.expectEqual(0, idx);
}

test "fromHex parses large value" {
    const idx = try fromHex("0xdeadbeefcafe");
    try std.testing.expectEqual(0xdeadbeefcafe, idx);
}

test "fromHex rejects empty" {
    try std.testing.expectError(error.InvalidHex, fromHex(""));
}

test "fromHex rejects empty after prefix" {
    try std.testing.expectError(error.InvalidHex, fromHex("0x"));
}

test "fromHex rejects invalid char" {
    try std.testing.expectError(error.InvalidHex, fromHex("0xgg"));
}

test "fromHex rejects overflow" {
    try std.testing.expectError(error.Overflow, fromHex("0x10000000000000000")); // > u64 max
}

test "toNumber converts to u64" {
    const idx = from(42);
    try std.testing.expectEqual(42, toNumber(idx));
}

test "toNumber is identity" {
    const idx = from(123);
    try std.testing.expectEqual(idx, toNumber(idx));
}

test "toHex converts zero" {
    const idx = from(0);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0x0", std.mem.sliceTo(&hex, 0));
}

test "toHex converts single digit" {
    const idx = from(10);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xa", std.mem.sliceTo(&hex, 0));
}

test "toHex converts 255" {
    const idx = from(255);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xff", std.mem.sliceTo(&hex, 0));
}

test "toHex converts large value" {
    const idx = from(0xcafebabe);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xcafebabe", std.mem.sliceTo(&hex, 0));
}

test "toHex converts max u64" {
    const idx = from(std.math.maxInt(u64));
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xffffffffffffffff", std.mem.sliceTo(&hex, 0));
}

test "equals returns true for equal indexes" {
    const a = from(10);
    const b = from(10);
    try std.testing.expect(equals(a, b));
}

test "equals returns false for unequal indexes" {
    const a = from(10);
    const b = from(11);
    try std.testing.expect(!equals(a, b));
}

test "equals handles zero" {
    const a = from(0);
    const b = from(0);
    try std.testing.expect(equals(a, b));
}

test "compare returns .lt for lesser" {
    const a = from(5);
    const b = from(10);
    try std.testing.expectEqual(std.math.Order.lt, compare(a, b));
}

test "compare returns .eq for equal" {
    const a = from(10);
    const b = from(10);
    try std.testing.expectEqual(std.math.Order.eq, compare(a, b));
}

test "compare returns .gt for greater" {
    const a = from(15);
    const b = from(10);
    try std.testing.expectEqual(std.math.Order.gt, compare(a, b));
}

test "increment increments by one" {
    const idx = from(10);
    const next = increment(idx);
    try std.testing.expectEqual(11, next.?);
}

test "increment handles zero" {
    const idx = from(0);
    const next = increment(idx);
    try std.testing.expectEqual(1, next.?);
}

test "increment returns null on overflow" {
    const idx = from(std.math.maxInt(u64));
    const next = increment(idx);
    try std.testing.expect(next == null);
}

test "isZero returns true for zero" {
    try std.testing.expect(isZero(from(0)));
}

test "isZero returns false for non-zero" {
    try std.testing.expect(!isZero(from(1)));
    try std.testing.expect(!isZero(from(100)));
}

test "constants" {
    try std.testing.expectEqual(@as(u64, 0), MIN);
    try std.testing.expectEqual(@as(u64, 0), ZERO);
    try std.testing.expectEqual(std.math.maxInt(u64), MAX);
}

test "fromHex roundtrip with toHex" {
    const original = from(0x123456789abc);
    const hex = toHex(original);
    const parsed = try fromHex(std.mem.sliceTo(&hex, 0));
    try std.testing.expectEqual(original, parsed);
}
