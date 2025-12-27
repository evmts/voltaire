//! ValidatorIndex - Beacon Chain Validator Registry Index
//!
//! Represents a validator's unique, immutable index in the beacon state registry.
//! Each validator is assigned this index when they are activated. The index is
//! used for validator duties, committee assignments, and rewards/penalties.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const ValidatorIndex = primitives.ValidatorIndex;
//!
//! // Create validator index
//! const idx = ValidatorIndex.from(123456);
//!
//! // Convert to number
//! const num = ValidatorIndex.toNumber(idx);
//!
//! // Increment
//! const next = ValidatorIndex.increment(idx);
//! ```

const std = @import("std");

/// ValidatorIndex type - represents a validator's index in beacon state
pub const ValidatorIndex = u32;

/// Create ValidatorIndex from u32 value
///
/// ## Parameters
/// - `value`: u32 validator index
///
/// ## Returns
/// ValidatorIndex value
///
/// ## Example
/// ```zig
/// const idx = ValidatorIndex.from(123456);
/// ```
pub fn from(value: u32) ValidatorIndex {
    return value;
}

/// Create ValidatorIndex from u64 value (with bounds check)
///
/// ## Parameters
/// - `value`: u64 validator index
///
/// ## Returns
/// ValidatorIndex value, or null if value exceeds u32 range
///
/// ## Example
/// ```zig
/// const idx = ValidatorIndex.fromU64(123456);
/// ```
pub fn fromU64(value: u64) ?ValidatorIndex {
    if (value > std.math.maxInt(u32)) return null;
    return @truncate(value);
}

/// Parse ValidatorIndex from hex string
///
/// ## Parameters
/// - `hex`: Hex string (with or without 0x prefix)
///
/// ## Returns
/// ValidatorIndex value, or null if invalid hex or out of range
///
/// ## Example
/// ```zig
/// const idx = ValidatorIndex.fromHex("0x1e240"); // 123456
/// const idx2 = ValidatorIndex.fromHex("1e240");  // 123456
/// ```
pub fn fromHex(hex: []const u8) ?ValidatorIndex {
    var start: usize = 0;
    if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) {
        start = 2;
    }
    if (start >= hex.len) return null;

    var result: u64 = 0;
    for (hex[start..]) |c| {
        const digit: u64 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return null,
        };
        result = result *% 16 +% digit;
        if (result > std.math.maxInt(u32)) return null;
    }
    return @truncate(result);
}

/// Convert ValidatorIndex to u32
///
/// ## Parameters
/// - `index`: ValidatorIndex value
///
/// ## Returns
/// u32 representation
///
/// ## Example
/// ```zig
/// const idx = ValidatorIndex.from(123456);
/// const num = ValidatorIndex.toNumber(idx);
/// ```
pub fn toNumber(index: ValidatorIndex) u32 {
    return index;
}

/// Convert ValidatorIndex to u64
///
/// ## Parameters
/// - `index`: ValidatorIndex value
///
/// ## Returns
/// u64 representation
///
/// ## Example
/// ```zig
/// const idx = ValidatorIndex.from(123456);
/// const num = ValidatorIndex.toU64(idx);
/// ```
pub fn toU64(index: ValidatorIndex) u64 {
    return index;
}

/// Check if two ValidatorIndexes are equal
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
/// const a = ValidatorIndex.from(123456);
/// const b = ValidatorIndex.from(123456);
/// const result = ValidatorIndex.equals(a, b); // true
/// ```
pub fn equals(a: ValidatorIndex, b: ValidatorIndex) bool {
    return a == b;
}

/// Compare two ValidatorIndexes
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
/// const a = ValidatorIndex.from(100);
/// const b = ValidatorIndex.from(200);
/// const result = ValidatorIndex.compare(a, b); // .lt
/// ```
pub fn compare(a: ValidatorIndex, b: ValidatorIndex) std.math.Order {
    return std.math.order(a, b);
}

/// Convert ValidatorIndex to hex string
///
/// ## Parameters
/// - `index`: ValidatorIndex value
///
/// ## Returns
/// Hex string representation (e.g., "0x1e240")
///
/// ## Example
/// ```zig
/// const idx = ValidatorIndex.from(123456);
/// const hex = ValidatorIndex.toHex(idx); // "0x1e240"
/// ```
pub fn toHex(index: ValidatorIndex) [11]u8 {
    var buf: [11]u8 = undefined;
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
    var temp: [8]u8 = undefined;
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

/// Increment ValidatorIndex by 1
///
/// ## Parameters
/// - `index`: ValidatorIndex value
///
/// ## Returns
/// Next index, or null on overflow
///
/// ## Example
/// ```zig
/// const idx = ValidatorIndex.from(123456);
/// const next = ValidatorIndex.increment(idx); // 123457
/// ```
pub fn increment(index: ValidatorIndex) ?ValidatorIndex {
    return std.math.add(u32, index, 1) catch null;
}

/// Check if ValidatorIndex is zero
///
/// ## Parameters
/// - `index`: ValidatorIndex value
///
/// ## Returns
/// true if index is zero
///
/// ## Example
/// ```zig
/// const idx = ValidatorIndex.from(0);
/// const result = ValidatorIndex.isZero(idx); // true
/// ```
pub fn isZero(index: ValidatorIndex) bool {
    return index == 0;
}

// Constants

/// Minimum validator index
pub const MIN: ValidatorIndex = 0;

/// Maximum validator index
pub const MAX: ValidatorIndex = std.math.maxInt(u32);

/// Zero index (first validator)
pub const ZERO: ValidatorIndex = 0;

// ====================================
// Tests
// ====================================

test "ValidatorIndex.from creates index" {
    const idx = from(123456);
    try std.testing.expectEqual(123456, idx);
}

test "ValidatorIndex.from handles zero" {
    const idx = from(0);
    try std.testing.expectEqual(0, idx);
}

test "ValidatorIndex.from handles max u32" {
    const idx = from(std.math.maxInt(u32));
    try std.testing.expectEqual(std.math.maxInt(u32), idx);
}

test "ValidatorIndex.fromU64 converts valid u64" {
    const idx = fromU64(123456);
    try std.testing.expectEqual(123456, idx.?);
}

test "ValidatorIndex.fromU64 returns null for too large" {
    const idx = fromU64(@as(u64, std.math.maxInt(u32)) + 1);
    try std.testing.expect(idx == null);
}

test "ValidatorIndex.toNumber converts to u32" {
    const idx = from(42);
    try std.testing.expectEqual(42, toNumber(idx));
}

test "ValidatorIndex.toNumber is identity" {
    const idx = from(123);
    try std.testing.expectEqual(idx, toNumber(idx));
}

test "ValidatorIndex.toU64 converts to u64" {
    const idx = from(123456);
    try std.testing.expectEqual(@as(u64, 123456), toU64(idx));
}

test "ValidatorIndex.equals returns true for equal indexes" {
    const a = from(123456);
    const b = from(123456);
    try std.testing.expect(equals(a, b));
}

test "ValidatorIndex.equals returns false for unequal indexes" {
    const a = from(123456);
    const b = from(123457);
    try std.testing.expect(!equals(a, b));
}

test "ValidatorIndex.equals handles zero" {
    const a = from(0);
    const b = from(0);
    try std.testing.expect(equals(a, b));
}

test "ValidatorIndex.compare returns .lt for lesser" {
    const a = from(100);
    const b = from(200);
    try std.testing.expectEqual(std.math.Order.lt, compare(a, b));
}

test "ValidatorIndex.compare returns .eq for equal" {
    const a = from(123456);
    const b = from(123456);
    try std.testing.expectEqual(std.math.Order.eq, compare(a, b));
}

test "ValidatorIndex.compare returns .gt for greater" {
    const a = from(200);
    const b = from(100);
    try std.testing.expectEqual(std.math.Order.gt, compare(a, b));
}

test "ValidatorIndex.increment increments by one" {
    const idx = from(123456);
    const next = increment(idx);
    try std.testing.expectEqual(123457, next.?);
}

test "ValidatorIndex.increment handles zero" {
    const idx = from(0);
    const next = increment(idx);
    try std.testing.expectEqual(1, next.?);
}

test "ValidatorIndex.increment returns null on overflow" {
    const idx = from(std.math.maxInt(u32));
    const next = increment(idx);
    try std.testing.expect(next == null);
}

test "ValidatorIndex constants" {
    try std.testing.expectEqual(@as(u32, 0), MIN);
    try std.testing.expectEqual(@as(u32, 0), ZERO);
    try std.testing.expectEqual(std.math.maxInt(u32), MAX);
}

test "ValidatorIndex.toHex converts zero" {
    const idx = from(0);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0x0", std.mem.sliceTo(&hex, 0));
}

test "ValidatorIndex.toHex converts single digit" {
    const idx = from(10);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xa", std.mem.sliceTo(&hex, 0));
}

test "ValidatorIndex.toHex converts 255" {
    const idx = from(255);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xff", std.mem.sliceTo(&hex, 0));
}

test "ValidatorIndex.toHex converts typical validator index" {
    const idx = from(123456);
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0x1e240", std.mem.sliceTo(&hex, 0));
}

test "ValidatorIndex.toHex converts max u32" {
    const idx = from(std.math.maxInt(u32));
    const hex = toHex(idx);
    try std.testing.expectEqualStrings("0xffffffff", std.mem.sliceTo(&hex, 0));
}

test "ValidatorIndex.fromHex parses with 0x prefix" {
    const idx = fromHex("0x1e240");
    try std.testing.expectEqual(123456, idx.?);
}

test "ValidatorIndex.fromHex parses without prefix" {
    const idx = fromHex("1e240");
    try std.testing.expectEqual(123456, idx.?);
}

test "ValidatorIndex.fromHex parses zero" {
    const idx = fromHex("0x0");
    try std.testing.expectEqual(0, idx.?);
}

test "ValidatorIndex.fromHex parses uppercase" {
    const idx = fromHex("0x1E240");
    try std.testing.expectEqual(123456, idx.?);
}

test "ValidatorIndex.fromHex parses max u32" {
    const idx = fromHex("0xffffffff");
    try std.testing.expectEqual(std.math.maxInt(u32), idx.?);
}

test "ValidatorIndex.fromHex returns null for overflow" {
    const idx = fromHex("0x100000000");
    try std.testing.expect(idx == null);
}

test "ValidatorIndex.fromHex returns null for invalid char" {
    const idx = fromHex("0x1g240");
    try std.testing.expect(idx == null);
}

test "ValidatorIndex.fromHex returns null for empty" {
    const idx = fromHex("0x");
    try std.testing.expect(idx == null);
}

test "ValidatorIndex.isZero returns true for zero" {
    const idx = from(0);
    try std.testing.expect(isZero(idx));
}

test "ValidatorIndex.isZero returns false for non-zero" {
    const idx = from(123456);
    try std.testing.expect(!isZero(idx));
}

test "ValidatorIndex.isZero with ZERO constant" {
    try std.testing.expect(isZero(ZERO));
}
