//! Int16 - Signed 16-bit integer type
//!
//! A branded primitive wrapping Zig's native i16 with comprehensive
//! arithmetic, bitwise, and comparison operations. Uses two's complement
//! representation for negative values.
//!
//! ## Range
//! - Minimum: -32768 (-2^15)
//! - Maximum: 32767 (2^15 - 1)
//!
//! ## Usage
//! ```zig
//! const Int16 = @import("int16.zig");
//!
//! const a = Int16.from(-1000);
//! const b = Int16.from(500);
//! const sum = try Int16.add(a, b); // -500
//! const hex = Int16.toHex(a); // "0xfc18"
//! ```

const std = @import("std");

/// Int16 type - signed 16-bit integer
pub const Int16 = i16;

// Constants
pub const MIN: Int16 = std.math.minInt(i16); // -32768
pub const MAX: Int16 = std.math.maxInt(i16); // 32767
pub const ZERO: Int16 = 0;
pub const ONE: Int16 = 1;
pub const MINUS_ONE: Int16 = -1;
pub const SIZE: usize = 2; // bytes

// ============================================================================
// Constructors
// ============================================================================

/// Create Int16 from i16 value (identity)
pub fn from(value: i16) Int16 {
    return value;
}

/// Create Int16 from i8 (always fits)
pub fn fromI8(value: i8) Int16 {
    return value;
}

/// Create Int16 from i32, checking bounds
pub fn fromI32(value: i32) error{Overflow}!Int16 {
    if (value < MIN or value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int16 from i64, checking bounds
pub fn fromI64(value: i64) error{Overflow}!Int16 {
    if (value < MIN or value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int16 from u8 (always fits)
pub fn fromU8(value: u8) Int16 {
    return value;
}

/// Create Int16 from u16, checking bounds
pub fn fromU16(value: u16) error{Overflow}!Int16 {
    if (value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int16 from bytes (big-endian, two's complement)
pub fn fromBytes(bytes: [2]u8) Int16 {
    const unsigned: u16 = (@as(u16, bytes[0]) << 8) | bytes[1];
    return @bitCast(unsigned);
}

/// Create Int16 from hex string
pub fn fromHex(hex: []const u8) error{ InvalidHex, Overflow }!Int16 {
    const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
    const clean = hex[start..];

    if (clean.len == 0) return 0;
    if (clean.len > 4) return error.Overflow;

    var result: u16 = 0;
    for (clean) |c| {
        const digit = switch (c) {
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

/// Convert Int16 to i16 (identity)
pub fn toNumber(value: Int16) i16 {
    return value;
}

/// Convert Int16 to i32
pub fn toI32(value: Int16) i32 {
    return value;
}

/// Convert Int16 to i64
pub fn toI64(value: Int16) i64 {
    return value;
}

/// Convert Int16 to bytes (big-endian, two's complement)
pub fn toBytes(value: Int16) [2]u8 {
    const unsigned: u16 = @bitCast(value);
    return .{
        @truncate(unsigned >> 8),
        @truncate(unsigned),
    };
}

/// Convert Int16 to hex string with 0x prefix (two's complement)
/// Returns static buffer - caller should copy if needed
pub fn toHex(value: Int16) [6]u8 {
    const unsigned: u16 = @bitCast(value);
    const hex_chars = "0123456789abcdef";
    return .{
        '0',
        'x',
        hex_chars[(unsigned >> 12) & 0x0f],
        hex_chars[(unsigned >> 8) & 0x0f],
        hex_chars[(unsigned >> 4) & 0x0f],
        hex_chars[unsigned & 0x0f],
    };
}

// ============================================================================
// Arithmetic Operations
// ============================================================================

/// Add two Int16 values with overflow checking
pub fn add(a: Int16, b: Int16) error{Overflow}!Int16 {
    return std.math.add(i16, a, b);
}

/// Subtract two Int16 values with overflow checking
pub fn sub(a: Int16, b: Int16) error{Overflow}!Int16 {
    return std.math.sub(i16, a, b);
}

/// Multiply two Int16 values with overflow checking
pub fn mul(a: Int16, b: Int16) error{Overflow}!Int16 {
    return std.math.mul(i16, a, b);
}

/// Divide two Int16 values (truncates toward zero)
pub fn div(a: Int16, b: Int16) error{ DivisionByZero, Overflow }!Int16 {
    if (b == 0) return error.DivisionByZero;
    if (a == MIN and b == -1) return error.Overflow;
    return @divTrunc(a, b);
}

/// Modulo operation (remainder after division)
pub fn mod(a: Int16, b: Int16) error{DivisionByZero}!Int16 {
    if (b == 0) return error.DivisionByZero;
    return @rem(a, b);
}

/// Negate an Int16 value
pub fn negate(value: Int16) error{Overflow}!Int16 {
    if (value == MIN) return error.Overflow;
    return -value;
}

/// Absolute value of Int16
pub fn abs(value: Int16) error{Overflow}!Int16 {
    if (value == MIN) return error.Overflow;
    return if (value < 0) -value else value;
}

// ============================================================================
// Comparison Operations
// ============================================================================

/// Check equality of two Int16 values
pub fn equals(a: Int16, b: Int16) bool {
    return a == b;
}

/// Compare two Int16 values: returns -1, 0, or 1
pub fn compare(a: Int16, b: Int16) i2 {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/// Check if a < b
pub fn lessThan(a: Int16, b: Int16) bool {
    return a < b;
}

/// Check if a > b
pub fn greaterThan(a: Int16, b: Int16) bool {
    return a > b;
}

/// Check if value is zero
pub fn isZero(value: Int16) bool {
    return value == 0;
}

/// Check if value is negative
pub fn isNegative(value: Int16) bool {
    return value < 0;
}

/// Check if value is positive
pub fn isPositive(value: Int16) bool {
    return value > 0;
}

/// Return minimum of two values
pub fn min(a: Int16, b: Int16) Int16 {
    return @min(a, b);
}

/// Return maximum of two values
pub fn max(a: Int16, b: Int16) Int16 {
    return @max(a, b);
}

/// Return sign: -1, 0, or 1
pub fn sign(value: Int16) i2 {
    if (value < 0) return -1;
    if (value > 0) return 1;
    return 0;
}

// ============================================================================
// Bitwise Operations
// ============================================================================

/// Bitwise AND
pub fn bitwiseAnd(a: Int16, b: Int16) Int16 {
    return a & b;
}

/// Bitwise OR
pub fn bitwiseOr(a: Int16, b: Int16) Int16 {
    return a | b;
}

/// Bitwise XOR
pub fn bitwiseXor(a: Int16, b: Int16) Int16 {
    return a ^ b;
}

/// Bitwise NOT
pub fn bitwiseNot(value: Int16) Int16 {
    return ~value;
}

/// Shift left (arithmetic)
pub fn shiftLeft(value: Int16, shift: u4) Int16 {
    return value << shift;
}

/// Shift right (arithmetic, sign-extending)
pub fn shiftRight(value: Int16, shift: u4) Int16 {
    return value >> shift;
}

// ============================================================================
// Utility Functions
// ============================================================================

/// Count leading zeros (on unsigned representation)
pub fn leadingZeros(value: Int16) u5 {
    const unsigned: u16 = @bitCast(value);
    return @clz(unsigned);
}

/// Count trailing zeros
pub fn trailingZeros(value: Int16) u5 {
    const unsigned: u16 = @bitCast(value);
    return @ctz(unsigned);
}

/// Count number of set bits (population count)
pub fn popCount(value: Int16) u5 {
    const unsigned: u16 = @bitCast(value);
    return @popCount(unsigned);
}

/// Get bit length (minimum bits needed to represent value)
pub fn bitLength(value: Int16) u5 {
    const unsigned: u16 = @bitCast(value);
    return 16 - @clz(unsigned);
}

// ============================================================================
// Tests
// ============================================================================

test "Int16: constants" {
    try std.testing.expectEqual(@as(Int16, -32768), MIN);
    try std.testing.expectEqual(@as(Int16, 32767), MAX);
    try std.testing.expectEqual(@as(Int16, 0), ZERO);
    try std.testing.expectEqual(@as(Int16, 1), ONE);
    try std.testing.expectEqual(@as(Int16, -1), MINUS_ONE);
    try std.testing.expectEqual(@as(usize, 2), SIZE);
}

test "Int16: from" {
    try std.testing.expectEqual(@as(Int16, 1000), from(1000));
    try std.testing.expectEqual(@as(Int16, -1000), from(-1000));
    try std.testing.expectEqual(@as(Int16, 0), from(0));
    try std.testing.expectEqual(@as(Int16, -32768), from(-32768));
    try std.testing.expectEqual(@as(Int16, 32767), from(32767));
}

test "Int16: fromI8" {
    try std.testing.expectEqual(@as(Int16, 127), fromI8(127));
    try std.testing.expectEqual(@as(Int16, -128), fromI8(-128));
}

test "Int16: fromI32" {
    try std.testing.expectEqual(@as(Int16, 1000), try fromI32(1000));
    try std.testing.expectEqual(@as(Int16, -1000), try fromI32(-1000));
    try std.testing.expectError(error.Overflow, fromI32(32768));
    try std.testing.expectError(error.Overflow, fromI32(-32769));
}

test "Int16: fromU8" {
    try std.testing.expectEqual(@as(Int16, 0), fromU8(0));
    try std.testing.expectEqual(@as(Int16, 255), fromU8(255));
}

test "Int16: fromU16" {
    try std.testing.expectEqual(@as(Int16, 0), try fromU16(0));
    try std.testing.expectEqual(@as(Int16, 32767), try fromU16(32767));
    try std.testing.expectError(error.Overflow, fromU16(32768));
}

test "Int16: fromBytes" {
    try std.testing.expectEqual(@as(Int16, 0), fromBytes(.{ 0x00, 0x00 }));
    try std.testing.expectEqual(@as(Int16, 1), fromBytes(.{ 0x00, 0x01 }));
    try std.testing.expectEqual(@as(Int16, 256), fromBytes(.{ 0x01, 0x00 }));
    try std.testing.expectEqual(@as(Int16, 32767), fromBytes(.{ 0x7f, 0xff }));
    try std.testing.expectEqual(@as(Int16, -32768), fromBytes(.{ 0x80, 0x00 }));
    try std.testing.expectEqual(@as(Int16, -1), fromBytes(.{ 0xff, 0xff }));
    try std.testing.expectEqual(@as(Int16, -1000), fromBytes(.{ 0xfc, 0x18 }));
}

test "Int16: fromHex" {
    try std.testing.expectEqual(@as(Int16, 0), try fromHex("0x0000"));
    try std.testing.expectEqual(@as(Int16, 32767), try fromHex("0x7fff"));
    try std.testing.expectEqual(@as(Int16, -32768), try fromHex("0x8000"));
    try std.testing.expectEqual(@as(Int16, -1), try fromHex("0xffff"));
    try std.testing.expectEqual(@as(Int16, -1000), try fromHex("0xfc18"));
    try std.testing.expectEqual(@as(Int16, 0), try fromHex(""));
    try std.testing.expectEqual(@as(Int16, 15), try fromHex("f"));
    try std.testing.expectError(error.InvalidHex, fromHex("0xgggg"));
    try std.testing.expectError(error.Overflow, fromHex("0x10000"));
}

test "Int16: toNumber" {
    try std.testing.expectEqual(@as(i16, 1000), toNumber(from(1000)));
    try std.testing.expectEqual(@as(i16, -1000), toNumber(from(-1000)));
}

test "Int16: toI32" {
    try std.testing.expectEqual(@as(i32, 32767), toI32(from(32767)));
    try std.testing.expectEqual(@as(i32, -32768), toI32(from(-32768)));
}

test "Int16: toBytes" {
    try std.testing.expectEqual([2]u8{ 0x00, 0x00 }, toBytes(from(0)));
    try std.testing.expectEqual([2]u8{ 0x7f, 0xff }, toBytes(from(32767)));
    try std.testing.expectEqual([2]u8{ 0x80, 0x00 }, toBytes(from(-32768)));
    try std.testing.expectEqual([2]u8{ 0xff, 0xff }, toBytes(from(-1)));
    try std.testing.expectEqual([2]u8{ 0xfc, 0x18 }, toBytes(from(-1000)));
}

test "Int16: toHex" {
    try std.testing.expectEqualSlices(u8, "0x0000", &toHex(from(0)));
    try std.testing.expectEqualSlices(u8, "0x7fff", &toHex(from(32767)));
    try std.testing.expectEqualSlices(u8, "0x8000", &toHex(from(-32768)));
    try std.testing.expectEqualSlices(u8, "0xffff", &toHex(from(-1)));
    try std.testing.expectEqualSlices(u8, "0xfc18", &toHex(from(-1000)));
}

test "Int16: add" {
    try std.testing.expectEqual(@as(Int16, 300), try add(from(100), from(200)));
    try std.testing.expectEqual(@as(Int16, -100), try add(from(100), from(-200)));
    try std.testing.expectEqual(@as(Int16, 0), try add(from(-100), from(100)));
    try std.testing.expectError(error.Overflow, add(MAX, from(1)));
    try std.testing.expectError(error.Overflow, add(MIN, from(-1)));
}

test "Int16: sub" {
    try std.testing.expectEqual(@as(Int16, -100), try sub(from(100), from(200)));
    try std.testing.expectEqual(@as(Int16, 300), try sub(from(100), from(-200)));
    try std.testing.expectError(error.Overflow, sub(MIN, from(1)));
    try std.testing.expectError(error.Overflow, sub(MAX, from(-1)));
}

test "Int16: mul" {
    try std.testing.expectEqual(@as(Int16, 2000), try mul(from(40), from(50)));
    try std.testing.expectEqual(@as(Int16, -2000), try mul(from(40), from(-50)));
    try std.testing.expectEqual(@as(Int16, 2000), try mul(from(-40), from(-50)));
    try std.testing.expectError(error.Overflow, mul(from(1000), from(100)));
    try std.testing.expectError(error.Overflow, mul(MIN, from(-1)));
}

test "Int16: div" {
    try std.testing.expectEqual(@as(Int16, 5), try div(from(200), from(40)));
    try std.testing.expectEqual(@as(Int16, -5), try div(from(200), from(-40)));
    try std.testing.expectEqual(@as(Int16, 5), try div(from(-200), from(-40)));
    try std.testing.expectEqual(@as(Int16, -5), try div(from(-200), from(40)));
    try std.testing.expectEqual(@as(Int16, 2), try div(from(7), from(3)));
    try std.testing.expectEqual(@as(Int16, -2), try div(from(-7), from(3)));
    try std.testing.expectError(error.DivisionByZero, div(from(100), from(0)));
    try std.testing.expectError(error.Overflow, div(MIN, from(-1)));
}

test "Int16: mod" {
    try std.testing.expectEqual(@as(Int16, 1), try mod(from(7), from(3)));
    try std.testing.expectEqual(@as(Int16, -1), try mod(from(-7), from(3)));
    try std.testing.expectEqual(@as(Int16, 1), try mod(from(7), from(-3)));
    try std.testing.expectEqual(@as(Int16, 0), try mod(from(9), from(3)));
    try std.testing.expectError(error.DivisionByZero, mod(from(100), from(0)));
}

test "Int16: negate" {
    try std.testing.expectEqual(@as(Int16, -1000), try negate(from(1000)));
    try std.testing.expectEqual(@as(Int16, 1000), try negate(from(-1000)));
    try std.testing.expectEqual(@as(Int16, 0), try negate(from(0)));
    try std.testing.expectEqual(@as(Int16, -32767), try negate(from(32767)));
    try std.testing.expectError(error.Overflow, negate(MIN));
}

test "Int16: abs" {
    try std.testing.expectEqual(@as(Int16, 1000), try abs(from(1000)));
    try std.testing.expectEqual(@as(Int16, 1000), try abs(from(-1000)));
    try std.testing.expectEqual(@as(Int16, 0), try abs(from(0)));
    try std.testing.expectEqual(@as(Int16, 32767), try abs(from(-32767)));
    try std.testing.expectError(error.Overflow, abs(MIN));
}

test "Int16: equals" {
    try std.testing.expect(equals(from(1000), from(1000)));
    try std.testing.expect(!equals(from(1000), from(-1000)));
    try std.testing.expect(equals(MIN, MIN));
    try std.testing.expect(equals(MAX, MAX));
}

test "Int16: compare" {
    try std.testing.expectEqual(@as(i2, 0), compare(from(1000), from(1000)));
    try std.testing.expectEqual(@as(i2, -1), compare(from(100), from(200)));
    try std.testing.expectEqual(@as(i2, 1), compare(from(200), from(100)));
    try std.testing.expectEqual(@as(i2, -1), compare(MIN, MAX));
    try std.testing.expectEqual(@as(i2, 1), compare(MAX, MIN));
}

test "Int16: lessThan and greaterThan" {
    try std.testing.expect(lessThan(from(100), from(200)));
    try std.testing.expect(!lessThan(from(200), from(100)));
    try std.testing.expect(!lessThan(from(100), from(100)));
    try std.testing.expect(greaterThan(from(200), from(100)));
    try std.testing.expect(!greaterThan(from(100), from(200)));
    try std.testing.expect(lessThan(from(-100), from(100)));
    try std.testing.expect(greaterThan(from(100), from(-100)));
}

test "Int16: isZero, isNegative, isPositive" {
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

test "Int16: min and max" {
    try std.testing.expectEqual(@as(Int16, 100), min(from(100), from(200)));
    try std.testing.expectEqual(@as(Int16, 100), min(from(200), from(100)));
    try std.testing.expectEqual(@as(Int16, -200), min(from(-100), from(-200)));
    try std.testing.expectEqual(@as(Int16, 200), max(from(100), from(200)));
    try std.testing.expectEqual(@as(Int16, 200), max(from(200), from(100)));
    try std.testing.expectEqual(@as(Int16, -100), max(from(-100), from(-200)));
}

test "Int16: sign" {
    try std.testing.expectEqual(@as(i2, 0), sign(from(0)));
    try std.testing.expectEqual(@as(i2, 1), sign(from(1000)));
    try std.testing.expectEqual(@as(i2, -1), sign(from(-1000)));
    try std.testing.expectEqual(@as(i2, 1), sign(MAX));
    try std.testing.expectEqual(@as(i2, -1), sign(MIN));
}

test "Int16: bitwiseAnd" {
    try std.testing.expectEqual(@as(Int16, 0b0100), bitwiseAnd(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int16, 0), bitwiseAnd(from(0b1010), from(0b0101)));
    try std.testing.expectEqual(@as(Int16, -32768), bitwiseAnd(from(-1), from(-32768)));
}

test "Int16: bitwiseOr" {
    try std.testing.expectEqual(@as(Int16, 0b1110), bitwiseOr(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int16, 0b1111), bitwiseOr(from(0b1010), from(0b0101)));
}

test "Int16: bitwiseXor" {
    try std.testing.expectEqual(@as(Int16, 0b1010), bitwiseXor(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int16, 0b1111), bitwiseXor(from(0b1010), from(0b0101)));
}

test "Int16: bitwiseNot" {
    try std.testing.expectEqual(@as(Int16, -1), bitwiseNot(from(0)));
    try std.testing.expectEqual(@as(Int16, 0), bitwiseNot(from(-1)));
    try std.testing.expectEqual(@as(Int16, -1001), bitwiseNot(from(1000)));
}

test "Int16: shiftLeft" {
    try std.testing.expectEqual(@as(Int16, 8), shiftLeft(from(1), 3));
    try std.testing.expectEqual(@as(Int16, 40), shiftLeft(from(5), 3));
    try std.testing.expectEqual(@as(Int16, -8), shiftLeft(from(-1), 3));
}

test "Int16: shiftRight" {
    try std.testing.expectEqual(@as(Int16, 1), shiftRight(from(8), 3));
    try std.testing.expectEqual(@as(Int16, 5), shiftRight(from(40), 3));
    try std.testing.expectEqual(@as(Int16, -1), shiftRight(from(-1), 3));
    try std.testing.expectEqual(@as(Int16, -2), shiftRight(from(-8), 2));
}

test "Int16: leadingZeros" {
    try std.testing.expectEqual(@as(u5, 16), leadingZeros(from(0)));
    try std.testing.expectEqual(@as(u5, 15), leadingZeros(from(1)));
    try std.testing.expectEqual(@as(u5, 1), leadingZeros(from(32767)));
    try std.testing.expectEqual(@as(u5, 0), leadingZeros(from(-1)));
    try std.testing.expectEqual(@as(u5, 0), leadingZeros(from(-32768)));
}

test "Int16: trailingZeros" {
    try std.testing.expectEqual(@as(u5, 16), trailingZeros(from(0)));
    try std.testing.expectEqual(@as(u5, 0), trailingZeros(from(1)));
    try std.testing.expectEqual(@as(u5, 3), trailingZeros(from(8)));
    try std.testing.expectEqual(@as(u5, 0), trailingZeros(from(-1)));
}

test "Int16: popCount" {
    try std.testing.expectEqual(@as(u5, 0), popCount(from(0)));
    try std.testing.expectEqual(@as(u5, 1), popCount(from(1)));
    try std.testing.expectEqual(@as(u5, 16), popCount(from(-1)));
    try std.testing.expectEqual(@as(u5, 1), popCount(from(-32768)));
    try std.testing.expectEqual(@as(u5, 15), popCount(from(32767)));
}

test "Int16: bitLength" {
    try std.testing.expectEqual(@as(u5, 0), bitLength(from(0)));
    try std.testing.expectEqual(@as(u5, 1), bitLength(from(1)));
    try std.testing.expectEqual(@as(u5, 15), bitLength(from(32767)));
    try std.testing.expectEqual(@as(u5, 16), bitLength(from(-1)));
    try std.testing.expectEqual(@as(u5, 16), bitLength(from(-32768)));
}

test "Int16: roundtrip bytes" {
    const values = [_]Int16{ MIN, -1000, -1, 0, 1, 1000, MAX };
    for (values) |v| {
        try std.testing.expectEqual(v, fromBytes(toBytes(v)));
    }
}

test "Int16: roundtrip hex" {
    const values = [_]Int16{ MIN, -1000, -1, 0, 1, 1000, MAX };
    for (values) |v| {
        const hex = toHex(v);
        try std.testing.expectEqual(v, try fromHex(&hex));
    }
}

test "Int16: edge cases" {
    try std.testing.expectError(error.Overflow, add(MAX, ONE));
    try std.testing.expectError(error.Overflow, sub(MIN, ONE));
    try std.testing.expectError(error.Overflow, mul(MIN, MINUS_ONE));
    try std.testing.expectError(error.Overflow, div(MIN, MINUS_ONE));
    try std.testing.expectError(error.Overflow, negate(MIN));
    try std.testing.expectError(error.Overflow, abs(MIN));
}
