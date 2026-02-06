//! Int64 - Signed 64-bit integer type
//!
//! A branded primitive wrapping Zig's native i64 with comprehensive
//! arithmetic, bitwise, and comparison operations. Uses two's complement
//! representation for negative values.
//!
//! ## Range
//! - Minimum: -9223372036854775808 (-2^63)
//! - Maximum: 9223372036854775807 (2^63 - 1)
//!
//! ## Usage
//! ```zig
//! const Int64 = @import("int64.zig");
//!
//! const a = Int64.from(-1000000000000);
//! const b = Int64.from(500000000000);
//! const sum = try Int64.add(a, b); // -500000000000
//! const hex = Int64.toHex(a); // "0xffffff172b5af000"
//! ```

const std = @import("std");

/// Int64 type - signed 64-bit integer
pub const Int64 = i64;

// Constants
pub const MIN: Int64 = std.math.minInt(i64); // -9223372036854775808
pub const MAX: Int64 = std.math.maxInt(i64); // 9223372036854775807
pub const ZERO: Int64 = 0;
pub const ONE: Int64 = 1;
pub const MINUS_ONE: Int64 = -1;
pub const SIZE: usize = 8; // bytes

// ============================================================================
// Constructors
// ============================================================================

/// Create Int64 from i64 value (identity)
pub fn from(value: i64) Int64 {
    return value;
}

/// Create Int64 from i8 (always fits)
pub fn fromI8(value: i8) Int64 {
    return value;
}

/// Create Int64 from i16 (always fits)
pub fn fromI16(value: i16) Int64 {
    return value;
}

/// Create Int64 from i32 (always fits)
pub fn fromI32(value: i32) Int64 {
    return value;
}

/// Create Int64 from i128, checking bounds
pub fn fromI128(value: i128) error{Overflow}!Int64 {
    if (value < MIN or value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int64 from u8 (always fits)
pub fn fromU8(value: u8) Int64 {
    return value;
}

/// Create Int64 from u16 (always fits)
pub fn fromU16(value: u16) Int64 {
    return value;
}

/// Create Int64 from u32 (always fits)
pub fn fromU32(value: u32) Int64 {
    return value;
}

/// Create Int64 from u64, checking bounds
pub fn fromU64(value: u64) error{Overflow}!Int64 {
    if (value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int64 from bytes (big-endian, two's complement)
pub fn fromBytes(bytes: [8]u8) Int64 {
    const unsigned: u64 = (@as(u64, bytes[0]) << 56) |
        (@as(u64, bytes[1]) << 48) |
        (@as(u64, bytes[2]) << 40) |
        (@as(u64, bytes[3]) << 32) |
        (@as(u64, bytes[4]) << 24) |
        (@as(u64, bytes[5]) << 16) |
        (@as(u64, bytes[6]) << 8) |
        bytes[7];
    return @bitCast(unsigned);
}

/// Create Int64 from hex string
pub fn fromHex(hex: []const u8) error{ InvalidHex, Overflow }!Int64 {
    const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
    const clean = hex[start..];

    if (clean.len == 0) return 0;
    if (clean.len > 16) return error.Overflow;

    var result: u64 = 0;
    for (clean) |c| {
        const digit: u64 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return error.InvalidHex,
        };
        result = result * 16 + digit;
    }

    return @bitCast(result);
}

// ============================================================================
// Conversions
// ============================================================================

/// Convert Int64 to i64 (identity)
pub fn toNumber(value: Int64) i64 {
    return value;
}

/// Convert Int64 to i128
pub fn toI128(value: Int64) i128 {
    return value;
}

/// Convert Int64 to bytes (big-endian, two's complement)
pub fn toBytes(value: Int64) [8]u8 {
    const unsigned: u64 = @bitCast(value);
    return .{
        @truncate(unsigned >> 56),
        @truncate(unsigned >> 48),
        @truncate(unsigned >> 40),
        @truncate(unsigned >> 32),
        @truncate(unsigned >> 24),
        @truncate(unsigned >> 16),
        @truncate(unsigned >> 8),
        @truncate(unsigned),
    };
}

/// Convert Int64 to hex string with 0x prefix (two's complement)
/// Returns static buffer - caller should copy if needed
pub fn toHex(value: Int64) [18]u8 {
    const unsigned: u64 = @bitCast(value);
    const hex_chars = "0123456789abcdef";
    return .{
        '0',
        'x',
        hex_chars[(unsigned >> 60) & 0x0f],
        hex_chars[(unsigned >> 56) & 0x0f],
        hex_chars[(unsigned >> 52) & 0x0f],
        hex_chars[(unsigned >> 48) & 0x0f],
        hex_chars[(unsigned >> 44) & 0x0f],
        hex_chars[(unsigned >> 40) & 0x0f],
        hex_chars[(unsigned >> 36) & 0x0f],
        hex_chars[(unsigned >> 32) & 0x0f],
        hex_chars[(unsigned >> 28) & 0x0f],
        hex_chars[(unsigned >> 24) & 0x0f],
        hex_chars[(unsigned >> 20) & 0x0f],
        hex_chars[(unsigned >> 16) & 0x0f],
        hex_chars[(unsigned >> 12) & 0x0f],
        hex_chars[(unsigned >> 8) & 0x0f],
        hex_chars[(unsigned >> 4) & 0x0f],
        hex_chars[unsigned & 0x0f],
    };
}

// ============================================================================
// Arithmetic Operations
// ============================================================================

/// Add two Int64 values with overflow checking
pub fn add(a: Int64, b: Int64) error{Overflow}!Int64 {
    return std.math.add(i64, a, b);
}

/// Subtract two Int64 values with overflow checking
pub fn sub(a: Int64, b: Int64) error{Overflow}!Int64 {
    return std.math.sub(i64, a, b);
}

/// Multiply two Int64 values with overflow checking
pub fn mul(a: Int64, b: Int64) error{Overflow}!Int64 {
    return std.math.mul(i64, a, b);
}

/// Divide two Int64 values (truncates toward zero)
pub fn div(a: Int64, b: Int64) error{ DivisionByZero, Overflow }!Int64 {
    if (b == 0) return error.DivisionByZero;
    if (a == MIN and b == -1) return error.Overflow;
    return @divTrunc(a, b);
}

/// Modulo operation (remainder after division)
pub fn mod(a: Int64, b: Int64) error{DivisionByZero}!Int64 {
    if (b == 0) return error.DivisionByZero;
    return @rem(a, b);
}

/// Negate an Int64 value
pub fn negate(value: Int64) error{Overflow}!Int64 {
    if (value == MIN) return error.Overflow;
    return -value;
}

/// Absolute value of Int64
pub fn abs(value: Int64) error{Overflow}!Int64 {
    if (value == MIN) return error.Overflow;
    return if (value < 0) -value else value;
}

// ============================================================================
// Comparison Operations
// ============================================================================

/// Check equality of two Int64 values
pub fn equals(a: Int64, b: Int64) bool {
    return a == b;
}

/// Compare two Int64 values: returns -1, 0, or 1
pub fn compare(a: Int64, b: Int64) i2 {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/// Check if a < b
pub fn lessThan(a: Int64, b: Int64) bool {
    return a < b;
}

/// Check if a > b
pub fn greaterThan(a: Int64, b: Int64) bool {
    return a > b;
}

/// Check if value is zero
pub fn isZero(value: Int64) bool {
    return value == 0;
}

/// Check if value is negative
pub fn isNegative(value: Int64) bool {
    return value < 0;
}

/// Check if value is positive
pub fn isPositive(value: Int64) bool {
    return value > 0;
}

/// Return minimum of two values
pub fn min(a: Int64, b: Int64) Int64 {
    return @min(a, b);
}

/// Return maximum of two values
pub fn max(a: Int64, b: Int64) Int64 {
    return @max(a, b);
}

/// Return sign: -1, 0, or 1
pub fn sign(value: Int64) i2 {
    if (value < 0) return -1;
    if (value > 0) return 1;
    return 0;
}

// ============================================================================
// Bitwise Operations
// ============================================================================

/// Bitwise AND
pub fn bitwiseAnd(a: Int64, b: Int64) Int64 {
    return a & b;
}

/// Bitwise OR
pub fn bitwiseOr(a: Int64, b: Int64) Int64 {
    return a | b;
}

/// Bitwise XOR
pub fn bitwiseXor(a: Int64, b: Int64) Int64 {
    return a ^ b;
}

/// Bitwise NOT
pub fn bitwiseNot(value: Int64) Int64 {
    return ~value;
}

/// Shift left (arithmetic)
pub fn shiftLeft(value: Int64, shift: u6) Int64 {
    return value << shift;
}

/// Shift right (arithmetic, sign-extending)
pub fn shiftRight(value: Int64, shift: u6) Int64 {
    return value >> shift;
}

// ============================================================================
// Utility Functions
// ============================================================================

/// Count leading zeros (on unsigned representation)
pub fn leadingZeros(value: Int64) u7 {
    const unsigned: u64 = @bitCast(value);
    return @clz(unsigned);
}

/// Count trailing zeros
pub fn trailingZeros(value: Int64) u7 {
    const unsigned: u64 = @bitCast(value);
    return @ctz(unsigned);
}

/// Count number of set bits (population count)
pub fn popCount(value: Int64) u7 {
    const unsigned: u64 = @bitCast(value);
    return @popCount(unsigned);
}

/// Get bit length (minimum bits needed to represent value)
pub fn bitLength(value: Int64) u7 {
    const unsigned: u64 = @bitCast(value);
    return 64 - @clz(unsigned);
}

// ============================================================================
// Tests
// ============================================================================

test "Int64: constants" {
    try std.testing.expectEqual(@as(Int64, -9223372036854775808), MIN);
    try std.testing.expectEqual(@as(Int64, 9223372036854775807), MAX);
    try std.testing.expectEqual(@as(Int64, 0), ZERO);
    try std.testing.expectEqual(@as(Int64, 1), ONE);
    try std.testing.expectEqual(@as(Int64, -1), MINUS_ONE);
    try std.testing.expectEqual(@as(usize, 8), SIZE);
}

test "Int64: from" {
    try std.testing.expectEqual(@as(Int64, 1000000000000), from(1000000000000));
    try std.testing.expectEqual(@as(Int64, -1000000000000), from(-1000000000000));
    try std.testing.expectEqual(@as(Int64, 0), from(0));
    try std.testing.expectEqual(MIN, from(-9223372036854775808));
    try std.testing.expectEqual(MAX, from(9223372036854775807));
}

test "Int64: fromI8" {
    try std.testing.expectEqual(@as(Int64, 127), fromI8(127));
    try std.testing.expectEqual(@as(Int64, -128), fromI8(-128));
}

test "Int64: fromI16" {
    try std.testing.expectEqual(@as(Int64, 32767), fromI16(32767));
    try std.testing.expectEqual(@as(Int64, -32768), fromI16(-32768));
}

test "Int64: fromI32" {
    try std.testing.expectEqual(@as(Int64, 2147483647), fromI32(2147483647));
    try std.testing.expectEqual(@as(Int64, -2147483648), fromI32(-2147483648));
}

test "Int64: fromI128" {
    try std.testing.expectEqual(@as(Int64, 1000000000000), try fromI128(1000000000000));
    try std.testing.expectEqual(@as(Int64, -1000000000000), try fromI128(-1000000000000));
    try std.testing.expectError(error.Overflow, fromI128(9223372036854775808));
    try std.testing.expectError(error.Overflow, fromI128(-9223372036854775809));
}

test "Int64: fromU8" {
    try std.testing.expectEqual(@as(Int64, 0), fromU8(0));
    try std.testing.expectEqual(@as(Int64, 255), fromU8(255));
}

test "Int64: fromU32" {
    try std.testing.expectEqual(@as(Int64, 0), fromU32(0));
    try std.testing.expectEqual(@as(Int64, 4294967295), fromU32(4294967295));
}

test "Int64: fromU64" {
    try std.testing.expectEqual(@as(Int64, 0), try fromU64(0));
    try std.testing.expectEqual(MAX, try fromU64(9223372036854775807));
    try std.testing.expectError(error.Overflow, fromU64(9223372036854775808));
}

test "Int64: fromBytes" {
    try std.testing.expectEqual(@as(Int64, 0), fromBytes(.{ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 }));
    try std.testing.expectEqual(@as(Int64, 1), fromBytes(.{ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01 }));
    try std.testing.expectEqual(MAX, fromBytes(.{ 0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff }));
    try std.testing.expectEqual(MIN, fromBytes(.{ 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 }));
    try std.testing.expectEqual(@as(Int64, -1), fromBytes(.{ 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff }));
    try std.testing.expectEqual(@as(Int64, -1000000000000), fromBytes(.{ 0xff, 0xff, 0xff, 0x17, 0x2b, 0x5a, 0xf0, 0x00 }));
}

test "Int64: fromHex" {
    try std.testing.expectEqual(@as(Int64, 0), try fromHex("0x0000000000000000"));
    try std.testing.expectEqual(MAX, try fromHex("0x7fffffffffffffff"));
    try std.testing.expectEqual(MIN, try fromHex("0x8000000000000000"));
    try std.testing.expectEqual(@as(Int64, -1), try fromHex("0xffffffffffffffff"));
    try std.testing.expectEqual(@as(Int64, -1000000000000), try fromHex("0xffffff172b5af000"));
    try std.testing.expectEqual(@as(Int64, 0), try fromHex(""));
    try std.testing.expectEqual(@as(Int64, 15), try fromHex("f"));
    try std.testing.expectError(error.InvalidHex, fromHex("0xggggg"));
    try std.testing.expectError(error.Overflow, fromHex("0x10000000000000000"));
}

test "Int64: toNumber" {
    try std.testing.expectEqual(@as(i64, 1000000000000), toNumber(from(1000000000000)));
    try std.testing.expectEqual(@as(i64, -1000000000000), toNumber(from(-1000000000000)));
}

test "Int64: toI128" {
    try std.testing.expectEqual(@as(i128, 9223372036854775807), toI128(MAX));
    try std.testing.expectEqual(@as(i128, -9223372036854775808), toI128(MIN));
}

test "Int64: toBytes" {
    try std.testing.expectEqual([8]u8{ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 }, toBytes(from(0)));
    try std.testing.expectEqual([8]u8{ 0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff }, toBytes(MAX));
    try std.testing.expectEqual([8]u8{ 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 }, toBytes(MIN));
    try std.testing.expectEqual([8]u8{ 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff }, toBytes(from(-1)));
    try std.testing.expectEqual([8]u8{ 0xff, 0xff, 0xff, 0x17, 0x2b, 0x5a, 0xf0, 0x00 }, toBytes(from(-1000000000000)));
}

test "Int64: toHex" {
    try std.testing.expectEqualSlices(u8, "0x0000000000000000", &toHex(from(0)));
    try std.testing.expectEqualSlices(u8, "0x7fffffffffffffff", &toHex(MAX));
    try std.testing.expectEqualSlices(u8, "0x8000000000000000", &toHex(MIN));
    try std.testing.expectEqualSlices(u8, "0xffffffffffffffff", &toHex(from(-1)));
    try std.testing.expectEqualSlices(u8, "0xffffff172b5af000", &toHex(from(-1000000000000)));
}

test "Int64: add" {
    try std.testing.expectEqual(@as(Int64, 30000000000), try add(from(10000000000), from(20000000000)));
    try std.testing.expectEqual(@as(Int64, -10000000000), try add(from(10000000000), from(-20000000000)));
    try std.testing.expectEqual(@as(Int64, 0), try add(from(-10000000000), from(10000000000)));
    try std.testing.expectError(error.Overflow, add(MAX, from(1)));
    try std.testing.expectError(error.Overflow, add(MIN, from(-1)));
}

test "Int64: sub" {
    try std.testing.expectEqual(@as(Int64, -10000000000), try sub(from(10000000000), from(20000000000)));
    try std.testing.expectEqual(@as(Int64, 30000000000), try sub(from(10000000000), from(-20000000000)));
    try std.testing.expectError(error.Overflow, sub(MIN, from(1)));
    try std.testing.expectError(error.Overflow, sub(MAX, from(-1)));
}

test "Int64: mul" {
    try std.testing.expectEqual(@as(Int64, 2000000000000), try mul(from(40000), from(50000000)));
    try std.testing.expectEqual(@as(Int64, -2000000000000), try mul(from(40000), from(-50000000)));
    try std.testing.expectEqual(@as(Int64, 2000000000000), try mul(from(-40000), from(-50000000)));
    try std.testing.expectError(error.Overflow, mul(from(10000000000), from(10000000000)));
    try std.testing.expectError(error.Overflow, mul(MIN, from(-1)));
}

test "Int64: div" {
    try std.testing.expectEqual(@as(Int64, 5), try div(from(200), from(40)));
    try std.testing.expectEqual(@as(Int64, -5), try div(from(200), from(-40)));
    try std.testing.expectEqual(@as(Int64, 5), try div(from(-200), from(-40)));
    try std.testing.expectEqual(@as(Int64, -5), try div(from(-200), from(40)));
    try std.testing.expectEqual(@as(Int64, 2), try div(from(7), from(3)));
    try std.testing.expectEqual(@as(Int64, -2), try div(from(-7), from(3)));
    try std.testing.expectError(error.DivisionByZero, div(from(100), from(0)));
    try std.testing.expectError(error.Overflow, div(MIN, from(-1)));
}

test "Int64: mod" {
    try std.testing.expectEqual(@as(Int64, 1), try mod(from(7), from(3)));
    try std.testing.expectEqual(@as(Int64, -1), try mod(from(-7), from(3)));
    try std.testing.expectEqual(@as(Int64, 1), try mod(from(7), from(-3)));
    try std.testing.expectEqual(@as(Int64, 0), try mod(from(9), from(3)));
    try std.testing.expectError(error.DivisionByZero, mod(from(100), from(0)));
}

test "Int64: negate" {
    try std.testing.expectEqual(@as(Int64, -1000000000000), try negate(from(1000000000000)));
    try std.testing.expectEqual(@as(Int64, 1000000000000), try negate(from(-1000000000000)));
    try std.testing.expectEqual(@as(Int64, 0), try negate(from(0)));
    try std.testing.expectEqual(@as(Int64, -9223372036854775807), try negate(MAX));
    try std.testing.expectError(error.Overflow, negate(MIN));
}

test "Int64: abs" {
    try std.testing.expectEqual(@as(Int64, 1000000000000), try abs(from(1000000000000)));
    try std.testing.expectEqual(@as(Int64, 1000000000000), try abs(from(-1000000000000)));
    try std.testing.expectEqual(@as(Int64, 0), try abs(from(0)));
    try std.testing.expectEqual(@as(Int64, 9223372036854775807), try abs(from(-9223372036854775807)));
    try std.testing.expectError(error.Overflow, abs(MIN));
}

test "Int64: equals" {
    try std.testing.expect(equals(from(1000000000000), from(1000000000000)));
    try std.testing.expect(!equals(from(1000000000000), from(-1000000000000)));
    try std.testing.expect(equals(MIN, MIN));
    try std.testing.expect(equals(MAX, MAX));
}

test "Int64: compare" {
    try std.testing.expectEqual(@as(i2, 0), compare(from(1000000000000), from(1000000000000)));
    try std.testing.expectEqual(@as(i2, -1), compare(from(10000000000), from(20000000000)));
    try std.testing.expectEqual(@as(i2, 1), compare(from(20000000000), from(10000000000)));
    try std.testing.expectEqual(@as(i2, -1), compare(MIN, MAX));
    try std.testing.expectEqual(@as(i2, 1), compare(MAX, MIN));
}

test "Int64: lessThan and greaterThan" {
    try std.testing.expect(lessThan(from(10000000000), from(20000000000)));
    try std.testing.expect(!lessThan(from(20000000000), from(10000000000)));
    try std.testing.expect(!lessThan(from(10000000000), from(10000000000)));
    try std.testing.expect(greaterThan(from(20000000000), from(10000000000)));
    try std.testing.expect(!greaterThan(from(10000000000), from(20000000000)));
    try std.testing.expect(lessThan(from(-10000000000), from(10000000000)));
    try std.testing.expect(greaterThan(from(10000000000), from(-10000000000)));
}

test "Int64: isZero, isNegative, isPositive" {
    try std.testing.expect(isZero(from(0)));
    try std.testing.expect(!isZero(from(1)));
    try std.testing.expect(!isZero(from(-1)));

    try std.testing.expect(isNegative(from(-1)));
    try std.testing.expect(isNegative(MIN));
    try std.testing.expect(!isNegative(from(0)));
    try std.testing.expect(!isNegative(from(1)));

    try std.testing.expect(isPositive(from(1)));
    try std.testing.expect(isPositive(MAX));
    try std.testing.expect(!isPositive(from(0)));
    try std.testing.expect(!isPositive(from(-1)));
}

test "Int64: min and max" {
    try std.testing.expectEqual(@as(Int64, 10000000000), min(from(10000000000), from(20000000000)));
    try std.testing.expectEqual(@as(Int64, 10000000000), min(from(20000000000), from(10000000000)));
    try std.testing.expectEqual(@as(Int64, -20000000000), min(from(-10000000000), from(-20000000000)));
    try std.testing.expectEqual(@as(Int64, 20000000000), max(from(10000000000), from(20000000000)));
    try std.testing.expectEqual(@as(Int64, 20000000000), max(from(20000000000), from(10000000000)));
    try std.testing.expectEqual(@as(Int64, -10000000000), max(from(-10000000000), from(-20000000000)));
}

test "Int64: sign" {
    try std.testing.expectEqual(@as(i2, 0), sign(from(0)));
    try std.testing.expectEqual(@as(i2, 1), sign(from(1000000000000)));
    try std.testing.expectEqual(@as(i2, -1), sign(from(-1000000000000)));
    try std.testing.expectEqual(@as(i2, 1), sign(MAX));
    try std.testing.expectEqual(@as(i2, -1), sign(MIN));
}

test "Int64: bitwiseAnd" {
    try std.testing.expectEqual(@as(Int64, 0b0100), bitwiseAnd(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int64, 0), bitwiseAnd(from(0b1010), from(0b0101)));
    try std.testing.expectEqual(MIN, bitwiseAnd(from(-1), MIN));
}

test "Int64: bitwiseOr" {
    try std.testing.expectEqual(@as(Int64, 0b1110), bitwiseOr(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int64, 0b1111), bitwiseOr(from(0b1010), from(0b0101)));
}

test "Int64: bitwiseXor" {
    try std.testing.expectEqual(@as(Int64, 0b1010), bitwiseXor(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int64, 0b1111), bitwiseXor(from(0b1010), from(0b0101)));
}

test "Int64: bitwiseNot" {
    try std.testing.expectEqual(@as(Int64, -1), bitwiseNot(from(0)));
    try std.testing.expectEqual(@as(Int64, 0), bitwiseNot(from(-1)));
    try std.testing.expectEqual(@as(Int64, -1000000000001), bitwiseNot(from(1000000000000)));
}

test "Int64: shiftLeft" {
    try std.testing.expectEqual(@as(Int64, 8), shiftLeft(from(1), 3));
    try std.testing.expectEqual(@as(Int64, 40), shiftLeft(from(5), 3));
    try std.testing.expectEqual(@as(Int64, -8), shiftLeft(from(-1), 3));
}

test "Int64: shiftRight" {
    try std.testing.expectEqual(@as(Int64, 1), shiftRight(from(8), 3));
    try std.testing.expectEqual(@as(Int64, 5), shiftRight(from(40), 3));
    try std.testing.expectEqual(@as(Int64, -1), shiftRight(from(-1), 3));
    try std.testing.expectEqual(@as(Int64, -2), shiftRight(from(-8), 2));
}

test "Int64: leadingZeros" {
    try std.testing.expectEqual(@as(u7, 64), leadingZeros(from(0)));
    try std.testing.expectEqual(@as(u7, 63), leadingZeros(from(1)));
    try std.testing.expectEqual(@as(u7, 1), leadingZeros(MAX));
    try std.testing.expectEqual(@as(u7, 0), leadingZeros(from(-1)));
    try std.testing.expectEqual(@as(u7, 0), leadingZeros(MIN));
}

test "Int64: trailingZeros" {
    try std.testing.expectEqual(@as(u7, 64), trailingZeros(from(0)));
    try std.testing.expectEqual(@as(u7, 0), trailingZeros(from(1)));
    try std.testing.expectEqual(@as(u7, 3), trailingZeros(from(8)));
    try std.testing.expectEqual(@as(u7, 0), trailingZeros(from(-1)));
}

test "Int64: popCount" {
    try std.testing.expectEqual(@as(u7, 0), popCount(from(0)));
    try std.testing.expectEqual(@as(u7, 1), popCount(from(1)));
    try std.testing.expectEqual(@as(u7, 64), popCount(from(-1)));
    try std.testing.expectEqual(@as(u7, 1), popCount(MIN));
    try std.testing.expectEqual(@as(u7, 63), popCount(MAX));
}

test "Int64: bitLength" {
    try std.testing.expectEqual(@as(u7, 0), bitLength(from(0)));
    try std.testing.expectEqual(@as(u7, 1), bitLength(from(1)));
    try std.testing.expectEqual(@as(u7, 63), bitLength(MAX));
    try std.testing.expectEqual(@as(u7, 64), bitLength(from(-1)));
    try std.testing.expectEqual(@as(u7, 64), bitLength(MIN));
}

test "Int64: roundtrip bytes" {
    const values = [_]Int64{ MIN, -1000000000000, -1, 0, 1, 1000000000000, MAX };
    for (values) |v| {
        try std.testing.expectEqual(v, fromBytes(toBytes(v)));
    }
}

test "Int64: roundtrip hex" {
    const values = [_]Int64{ MIN, -1000000000000, -1, 0, 1, 1000000000000, MAX };
    for (values) |v| {
        const hex = toHex(v);
        try std.testing.expectEqual(v, try fromHex(&hex));
    }
}

test "Int64: edge cases" {
    try std.testing.expectError(error.Overflow, add(MAX, ONE));
    try std.testing.expectError(error.Overflow, sub(MIN, ONE));
    try std.testing.expectError(error.Overflow, mul(MIN, MINUS_ONE));
    try std.testing.expectError(error.Overflow, div(MIN, MINUS_ONE));
    try std.testing.expectError(error.Overflow, negate(MIN));
    try std.testing.expectError(error.Overflow, abs(MIN));
}
