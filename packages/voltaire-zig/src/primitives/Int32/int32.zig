//! Int32 - Signed 32-bit integer type
//!
//! A branded primitive wrapping Zig's native i32 with comprehensive
//! arithmetic, bitwise, and comparison operations. Uses two's complement
//! representation for negative values.
//!
//! ## Range
//! - Minimum: -2147483648 (-2^31)
//! - Maximum: 2147483647 (2^31 - 1)
//!
//! ## Usage
//! ```zig
//! const Int32 = @import("int32.zig");
//!
//! const a = Int32.from(-100000);
//! const b = Int32.from(50000);
//! const sum = try Int32.add(a, b); // -50000
//! const hex = Int32.toHex(a); // "0xfffe7960"
//! ```

const std = @import("std");

/// Int32 type - signed 32-bit integer
pub const Int32 = i32;

// Constants
pub const MIN: Int32 = std.math.minInt(i32); // -2147483648
pub const MAX: Int32 = std.math.maxInt(i32); // 2147483647
pub const ZERO: Int32 = 0;
pub const ONE: Int32 = 1;
pub const MINUS_ONE: Int32 = -1;
pub const SIZE: usize = 4; // bytes

// ============================================================================
// Constructors
// ============================================================================

/// Create Int32 from i32 value (identity)
pub fn from(value: i32) Int32 {
    return value;
}

/// Create Int32 from i8 (always fits)
pub fn fromI8(value: i8) Int32 {
    return value;
}

/// Create Int32 from i16 (always fits)
pub fn fromI16(value: i16) Int32 {
    return value;
}

/// Create Int32 from i64, checking bounds
pub fn fromI64(value: i64) error{Overflow}!Int32 {
    if (value < MIN or value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int32 from u8 (always fits)
pub fn fromU8(value: u8) Int32 {
    return value;
}

/// Create Int32 from u16 (always fits)
pub fn fromU16(value: u16) Int32 {
    return value;
}

/// Create Int32 from u32, checking bounds
pub fn fromU32(value: u32) error{Overflow}!Int32 {
    if (value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int32 from bytes (big-endian, two's complement)
pub fn fromBytes(bytes: [4]u8) Int32 {
    const unsigned: u32 = (@as(u32, bytes[0]) << 24) |
        (@as(u32, bytes[1]) << 16) |
        (@as(u32, bytes[2]) << 8) |
        bytes[3];
    return @bitCast(unsigned);
}

/// Create Int32 from hex string
pub fn fromHex(hex: []const u8) error{ InvalidHex, Overflow }!Int32 {
    const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
    const clean = hex[start..];

    if (clean.len == 0) return 0;
    if (clean.len > 8) return error.Overflow;

    var result: u32 = 0;
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

/// Convert Int32 to i32 (identity)
pub fn toNumber(value: Int32) i32 {
    return value;
}

/// Convert Int32 to i64
pub fn toI64(value: Int32) i64 {
    return value;
}

/// Convert Int32 to bytes (big-endian, two's complement)
pub fn toBytes(value: Int32) [4]u8 {
    const unsigned: u32 = @bitCast(value);
    return .{
        @truncate(unsigned >> 24),
        @truncate(unsigned >> 16),
        @truncate(unsigned >> 8),
        @truncate(unsigned),
    };
}

/// Convert Int32 to hex string with 0x prefix (two's complement)
/// Returns static buffer - caller should copy if needed
pub fn toHex(value: Int32) [10]u8 {
    const unsigned: u32 = @bitCast(value);
    const hex_chars = "0123456789abcdef";
    return .{
        '0',
        'x',
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

/// Add two Int32 values with overflow checking
pub fn add(a: Int32, b: Int32) error{Overflow}!Int32 {
    return std.math.add(i32, a, b);
}

/// Subtract two Int32 values with overflow checking
pub fn sub(a: Int32, b: Int32) error{Overflow}!Int32 {
    return std.math.sub(i32, a, b);
}

/// Multiply two Int32 values with overflow checking
pub fn mul(a: Int32, b: Int32) error{Overflow}!Int32 {
    return std.math.mul(i32, a, b);
}

/// Divide two Int32 values (truncates toward zero)
pub fn div(a: Int32, b: Int32) error{ DivisionByZero, Overflow }!Int32 {
    if (b == 0) return error.DivisionByZero;
    if (a == MIN and b == -1) return error.Overflow;
    return @divTrunc(a, b);
}

/// Modulo operation (remainder after division)
pub fn mod(a: Int32, b: Int32) error{DivisionByZero}!Int32 {
    if (b == 0) return error.DivisionByZero;
    return @rem(a, b);
}

/// Negate an Int32 value
pub fn negate(value: Int32) error{Overflow}!Int32 {
    if (value == MIN) return error.Overflow;
    return -value;
}

/// Absolute value of Int32
pub fn abs(value: Int32) error{Overflow}!Int32 {
    if (value == MIN) return error.Overflow;
    return if (value < 0) -value else value;
}

// ============================================================================
// Comparison Operations
// ============================================================================

/// Check equality of two Int32 values
pub fn equals(a: Int32, b: Int32) bool {
    return a == b;
}

/// Compare two Int32 values: returns -1, 0, or 1
pub fn compare(a: Int32, b: Int32) i2 {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/// Check if a < b
pub fn lessThan(a: Int32, b: Int32) bool {
    return a < b;
}

/// Check if a > b
pub fn greaterThan(a: Int32, b: Int32) bool {
    return a > b;
}

/// Check if value is zero
pub fn isZero(value: Int32) bool {
    return value == 0;
}

/// Check if value is negative
pub fn isNegative(value: Int32) bool {
    return value < 0;
}

/// Check if value is positive
pub fn isPositive(value: Int32) bool {
    return value > 0;
}

/// Return minimum of two values
pub fn min(a: Int32, b: Int32) Int32 {
    return @min(a, b);
}

/// Return maximum of two values
pub fn max(a: Int32, b: Int32) Int32 {
    return @max(a, b);
}

/// Return sign: -1, 0, or 1
pub fn sign(value: Int32) i2 {
    if (value < 0) return -1;
    if (value > 0) return 1;
    return 0;
}

// ============================================================================
// Bitwise Operations
// ============================================================================

/// Bitwise AND
pub fn bitwiseAnd(a: Int32, b: Int32) Int32 {
    return a & b;
}

/// Bitwise OR
pub fn bitwiseOr(a: Int32, b: Int32) Int32 {
    return a | b;
}

/// Bitwise XOR
pub fn bitwiseXor(a: Int32, b: Int32) Int32 {
    return a ^ b;
}

/// Bitwise NOT
pub fn bitwiseNot(value: Int32) Int32 {
    return ~value;
}

/// Shift left (arithmetic)
pub fn shiftLeft(value: Int32, shift: u5) Int32 {
    return value << shift;
}

/// Shift right (arithmetic, sign-extending)
pub fn shiftRight(value: Int32, shift: u5) Int32 {
    return value >> shift;
}

// ============================================================================
// Utility Functions
// ============================================================================

/// Count leading zeros (on unsigned representation)
pub fn leadingZeros(value: Int32) u6 {
    const unsigned: u32 = @bitCast(value);
    return @clz(unsigned);
}

/// Count trailing zeros
pub fn trailingZeros(value: Int32) u6 {
    const unsigned: u32 = @bitCast(value);
    return @ctz(unsigned);
}

/// Count number of set bits (population count)
pub fn popCount(value: Int32) u6 {
    const unsigned: u32 = @bitCast(value);
    return @popCount(unsigned);
}

/// Get bit length (minimum bits needed to represent value)
pub fn bitLength(value: Int32) u6 {
    const unsigned: u32 = @bitCast(value);
    return 32 - @clz(unsigned);
}

// ============================================================================
// Tests
// ============================================================================

test "Int32: constants" {
    try std.testing.expectEqual(@as(Int32, -2147483648), MIN);
    try std.testing.expectEqual(@as(Int32, 2147483647), MAX);
    try std.testing.expectEqual(@as(Int32, 0), ZERO);
    try std.testing.expectEqual(@as(Int32, 1), ONE);
    try std.testing.expectEqual(@as(Int32, -1), MINUS_ONE);
    try std.testing.expectEqual(@as(usize, 4), SIZE);
}

test "Int32: from" {
    try std.testing.expectEqual(@as(Int32, 100000), from(100000));
    try std.testing.expectEqual(@as(Int32, -100000), from(-100000));
    try std.testing.expectEqual(@as(Int32, 0), from(0));
    try std.testing.expectEqual(@as(Int32, -2147483648), from(-2147483648));
    try std.testing.expectEqual(@as(Int32, 2147483647), from(2147483647));
}

test "Int32: fromI8" {
    try std.testing.expectEqual(@as(Int32, 127), fromI8(127));
    try std.testing.expectEqual(@as(Int32, -128), fromI8(-128));
}

test "Int32: fromI16" {
    try std.testing.expectEqual(@as(Int32, 32767), fromI16(32767));
    try std.testing.expectEqual(@as(Int32, -32768), fromI16(-32768));
}

test "Int32: fromI64" {
    try std.testing.expectEqual(@as(Int32, 100000), try fromI64(100000));
    try std.testing.expectEqual(@as(Int32, -100000), try fromI64(-100000));
    try std.testing.expectError(error.Overflow, fromI64(2147483648));
    try std.testing.expectError(error.Overflow, fromI64(-2147483649));
}

test "Int32: fromU8" {
    try std.testing.expectEqual(@as(Int32, 0), fromU8(0));
    try std.testing.expectEqual(@as(Int32, 255), fromU8(255));
}

test "Int32: fromU16" {
    try std.testing.expectEqual(@as(Int32, 0), fromU16(0));
    try std.testing.expectEqual(@as(Int32, 65535), fromU16(65535));
}

test "Int32: fromU32" {
    try std.testing.expectEqual(@as(Int32, 0), try fromU32(0));
    try std.testing.expectEqual(@as(Int32, 2147483647), try fromU32(2147483647));
    try std.testing.expectError(error.Overflow, fromU32(2147483648));
}

test "Int32: fromBytes" {
    try std.testing.expectEqual(@as(Int32, 0), fromBytes(.{ 0x00, 0x00, 0x00, 0x00 }));
    try std.testing.expectEqual(@as(Int32, 1), fromBytes(.{ 0x00, 0x00, 0x00, 0x01 }));
    try std.testing.expectEqual(@as(Int32, 256), fromBytes(.{ 0x00, 0x00, 0x01, 0x00 }));
    try std.testing.expectEqual(@as(Int32, 2147483647), fromBytes(.{ 0x7f, 0xff, 0xff, 0xff }));
    try std.testing.expectEqual(@as(Int32, -2147483648), fromBytes(.{ 0x80, 0x00, 0x00, 0x00 }));
    try std.testing.expectEqual(@as(Int32, -1), fromBytes(.{ 0xff, 0xff, 0xff, 0xff }));
    try std.testing.expectEqual(@as(Int32, -100000), fromBytes(.{ 0xff, 0xfe, 0x79, 0x60 }));
}

test "Int32: fromHex" {
    try std.testing.expectEqual(@as(Int32, 0), try fromHex("0x00000000"));
    try std.testing.expectEqual(@as(Int32, 2147483647), try fromHex("0x7fffffff"));
    try std.testing.expectEqual(@as(Int32, -2147483648), try fromHex("0x80000000"));
    try std.testing.expectEqual(@as(Int32, -1), try fromHex("0xffffffff"));
    try std.testing.expectEqual(@as(Int32, -100000), try fromHex("0xfffe7960"));
    try std.testing.expectEqual(@as(Int32, 0), try fromHex(""));
    try std.testing.expectEqual(@as(Int32, 15), try fromHex("f"));
    try std.testing.expectError(error.InvalidHex, fromHex("0xggggg"));
    try std.testing.expectError(error.Overflow, fromHex("0x100000000"));
}

test "Int32: toNumber" {
    try std.testing.expectEqual(@as(i32, 100000), toNumber(from(100000)));
    try std.testing.expectEqual(@as(i32, -100000), toNumber(from(-100000)));
}

test "Int32: toI64" {
    try std.testing.expectEqual(@as(i64, 2147483647), toI64(from(2147483647)));
    try std.testing.expectEqual(@as(i64, -2147483648), toI64(from(-2147483648)));
}

test "Int32: toBytes" {
    try std.testing.expectEqual([4]u8{ 0x00, 0x00, 0x00, 0x00 }, toBytes(from(0)));
    try std.testing.expectEqual([4]u8{ 0x7f, 0xff, 0xff, 0xff }, toBytes(from(2147483647)));
    try std.testing.expectEqual([4]u8{ 0x80, 0x00, 0x00, 0x00 }, toBytes(from(-2147483648)));
    try std.testing.expectEqual([4]u8{ 0xff, 0xff, 0xff, 0xff }, toBytes(from(-1)));
    try std.testing.expectEqual([4]u8{ 0xff, 0xfe, 0x79, 0x60 }, toBytes(from(-100000)));
}

test "Int32: toHex" {
    try std.testing.expectEqualSlices(u8, "0x00000000", &toHex(from(0)));
    try std.testing.expectEqualSlices(u8, "0x7fffffff", &toHex(from(2147483647)));
    try std.testing.expectEqualSlices(u8, "0x80000000", &toHex(from(-2147483648)));
    try std.testing.expectEqualSlices(u8, "0xffffffff", &toHex(from(-1)));
    try std.testing.expectEqualSlices(u8, "0xfffe7960", &toHex(from(-100000)));
}

test "Int32: add" {
    try std.testing.expectEqual(@as(Int32, 30000), try add(from(10000), from(20000)));
    try std.testing.expectEqual(@as(Int32, -10000), try add(from(10000), from(-20000)));
    try std.testing.expectEqual(@as(Int32, 0), try add(from(-10000), from(10000)));
    try std.testing.expectError(error.Overflow, add(MAX, from(1)));
    try std.testing.expectError(error.Overflow, add(MIN, from(-1)));
}

test "Int32: sub" {
    try std.testing.expectEqual(@as(Int32, -10000), try sub(from(10000), from(20000)));
    try std.testing.expectEqual(@as(Int32, 30000), try sub(from(10000), from(-20000)));
    try std.testing.expectError(error.Overflow, sub(MIN, from(1)));
    try std.testing.expectError(error.Overflow, sub(MAX, from(-1)));
}

test "Int32: mul" {
    try std.testing.expectEqual(@as(Int32, 200000), try mul(from(400), from(500)));
    try std.testing.expectEqual(@as(Int32, -200000), try mul(from(400), from(-500)));
    try std.testing.expectEqual(@as(Int32, 200000), try mul(from(-400), from(-500)));
    try std.testing.expectError(error.Overflow, mul(from(100000), from(100000)));
    try std.testing.expectError(error.Overflow, mul(MIN, from(-1)));
}

test "Int32: div" {
    try std.testing.expectEqual(@as(Int32, 5), try div(from(200), from(40)));
    try std.testing.expectEqual(@as(Int32, -5), try div(from(200), from(-40)));
    try std.testing.expectEqual(@as(Int32, 5), try div(from(-200), from(-40)));
    try std.testing.expectEqual(@as(Int32, -5), try div(from(-200), from(40)));
    try std.testing.expectEqual(@as(Int32, 2), try div(from(7), from(3)));
    try std.testing.expectEqual(@as(Int32, -2), try div(from(-7), from(3)));
    try std.testing.expectError(error.DivisionByZero, div(from(100), from(0)));
    try std.testing.expectError(error.Overflow, div(MIN, from(-1)));
}

test "Int32: mod" {
    try std.testing.expectEqual(@as(Int32, 1), try mod(from(7), from(3)));
    try std.testing.expectEqual(@as(Int32, -1), try mod(from(-7), from(3)));
    try std.testing.expectEqual(@as(Int32, 1), try mod(from(7), from(-3)));
    try std.testing.expectEqual(@as(Int32, 0), try mod(from(9), from(3)));
    try std.testing.expectError(error.DivisionByZero, mod(from(100), from(0)));
}

test "Int32: negate" {
    try std.testing.expectEqual(@as(Int32, -100000), try negate(from(100000)));
    try std.testing.expectEqual(@as(Int32, 100000), try negate(from(-100000)));
    try std.testing.expectEqual(@as(Int32, 0), try negate(from(0)));
    try std.testing.expectEqual(@as(Int32, -2147483647), try negate(from(2147483647)));
    try std.testing.expectError(error.Overflow, negate(MIN));
}

test "Int32: abs" {
    try std.testing.expectEqual(@as(Int32, 100000), try abs(from(100000)));
    try std.testing.expectEqual(@as(Int32, 100000), try abs(from(-100000)));
    try std.testing.expectEqual(@as(Int32, 0), try abs(from(0)));
    try std.testing.expectEqual(@as(Int32, 2147483647), try abs(from(-2147483647)));
    try std.testing.expectError(error.Overflow, abs(MIN));
}

test "Int32: equals" {
    try std.testing.expect(equals(from(100000), from(100000)));
    try std.testing.expect(!equals(from(100000), from(-100000)));
    try std.testing.expect(equals(MIN, MIN));
    try std.testing.expect(equals(MAX, MAX));
}

test "Int32: compare" {
    try std.testing.expectEqual(@as(i2, 0), compare(from(100000), from(100000)));
    try std.testing.expectEqual(@as(i2, -1), compare(from(10000), from(20000)));
    try std.testing.expectEqual(@as(i2, 1), compare(from(20000), from(10000)));
    try std.testing.expectEqual(@as(i2, -1), compare(MIN, MAX));
    try std.testing.expectEqual(@as(i2, 1), compare(MAX, MIN));
}

test "Int32: lessThan and greaterThan" {
    try std.testing.expect(lessThan(from(10000), from(20000)));
    try std.testing.expect(!lessThan(from(20000), from(10000)));
    try std.testing.expect(!lessThan(from(10000), from(10000)));
    try std.testing.expect(greaterThan(from(20000), from(10000)));
    try std.testing.expect(!greaterThan(from(10000), from(20000)));
    try std.testing.expect(lessThan(from(-10000), from(10000)));
    try std.testing.expect(greaterThan(from(10000), from(-10000)));
}

test "Int32: isZero, isNegative, isPositive" {
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

test "Int32: min and max" {
    try std.testing.expectEqual(@as(Int32, 10000), min(from(10000), from(20000)));
    try std.testing.expectEqual(@as(Int32, 10000), min(from(20000), from(10000)));
    try std.testing.expectEqual(@as(Int32, -20000), min(from(-10000), from(-20000)));
    try std.testing.expectEqual(@as(Int32, 20000), max(from(10000), from(20000)));
    try std.testing.expectEqual(@as(Int32, 20000), max(from(20000), from(10000)));
    try std.testing.expectEqual(@as(Int32, -10000), max(from(-10000), from(-20000)));
}

test "Int32: sign" {
    try std.testing.expectEqual(@as(i2, 0), sign(from(0)));
    try std.testing.expectEqual(@as(i2, 1), sign(from(100000)));
    try std.testing.expectEqual(@as(i2, -1), sign(from(-100000)));
    try std.testing.expectEqual(@as(i2, 1), sign(MAX));
    try std.testing.expectEqual(@as(i2, -1), sign(MIN));
}

test "Int32: bitwiseAnd" {
    try std.testing.expectEqual(@as(Int32, 0b0100), bitwiseAnd(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int32, 0), bitwiseAnd(from(0b1010), from(0b0101)));
    try std.testing.expectEqual(@as(Int32, -2147483648), bitwiseAnd(from(-1), from(-2147483648)));
}

test "Int32: bitwiseOr" {
    try std.testing.expectEqual(@as(Int32, 0b1110), bitwiseOr(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int32, 0b1111), bitwiseOr(from(0b1010), from(0b0101)));
}

test "Int32: bitwiseXor" {
    try std.testing.expectEqual(@as(Int32, 0b1010), bitwiseXor(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int32, 0b1111), bitwiseXor(from(0b1010), from(0b0101)));
}

test "Int32: bitwiseNot" {
    try std.testing.expectEqual(@as(Int32, -1), bitwiseNot(from(0)));
    try std.testing.expectEqual(@as(Int32, 0), bitwiseNot(from(-1)));
    try std.testing.expectEqual(@as(Int32, -100001), bitwiseNot(from(100000)));
}

test "Int32: shiftLeft" {
    try std.testing.expectEqual(@as(Int32, 8), shiftLeft(from(1), 3));
    try std.testing.expectEqual(@as(Int32, 40), shiftLeft(from(5), 3));
    try std.testing.expectEqual(@as(Int32, -8), shiftLeft(from(-1), 3));
}

test "Int32: shiftRight" {
    try std.testing.expectEqual(@as(Int32, 1), shiftRight(from(8), 3));
    try std.testing.expectEqual(@as(Int32, 5), shiftRight(from(40), 3));
    try std.testing.expectEqual(@as(Int32, -1), shiftRight(from(-1), 3));
    try std.testing.expectEqual(@as(Int32, -2), shiftRight(from(-8), 2));
}

test "Int32: leadingZeros" {
    try std.testing.expectEqual(@as(u6, 32), leadingZeros(from(0)));
    try std.testing.expectEqual(@as(u6, 31), leadingZeros(from(1)));
    try std.testing.expectEqual(@as(u6, 1), leadingZeros(from(2147483647)));
    try std.testing.expectEqual(@as(u6, 0), leadingZeros(from(-1)));
    try std.testing.expectEqual(@as(u6, 0), leadingZeros(from(-2147483648)));
}

test "Int32: trailingZeros" {
    try std.testing.expectEqual(@as(u6, 32), trailingZeros(from(0)));
    try std.testing.expectEqual(@as(u6, 0), trailingZeros(from(1)));
    try std.testing.expectEqual(@as(u6, 3), trailingZeros(from(8)));
    try std.testing.expectEqual(@as(u6, 0), trailingZeros(from(-1)));
}

test "Int32: popCount" {
    try std.testing.expectEqual(@as(u6, 0), popCount(from(0)));
    try std.testing.expectEqual(@as(u6, 1), popCount(from(1)));
    try std.testing.expectEqual(@as(u6, 32), popCount(from(-1)));
    try std.testing.expectEqual(@as(u6, 1), popCount(from(-2147483648)));
    try std.testing.expectEqual(@as(u6, 31), popCount(from(2147483647)));
}

test "Int32: bitLength" {
    try std.testing.expectEqual(@as(u6, 0), bitLength(from(0)));
    try std.testing.expectEqual(@as(u6, 1), bitLength(from(1)));
    try std.testing.expectEqual(@as(u6, 31), bitLength(from(2147483647)));
    try std.testing.expectEqual(@as(u6, 32), bitLength(from(-1)));
    try std.testing.expectEqual(@as(u6, 32), bitLength(from(-2147483648)));
}

test "Int32: roundtrip bytes" {
    const values = [_]Int32{ MIN, -100000, -1, 0, 1, 100000, MAX };
    for (values) |v| {
        try std.testing.expectEqual(v, fromBytes(toBytes(v)));
    }
}

test "Int32: roundtrip hex" {
    const values = [_]Int32{ MIN, -100000, -1, 0, 1, 100000, MAX };
    for (values) |v| {
        const hex = toHex(v);
        try std.testing.expectEqual(v, try fromHex(&hex));
    }
}

test "Int32: edge cases" {
    try std.testing.expectError(error.Overflow, add(MAX, ONE));
    try std.testing.expectError(error.Overflow, sub(MIN, ONE));
    try std.testing.expectError(error.Overflow, mul(MIN, MINUS_ONE));
    try std.testing.expectError(error.Overflow, div(MIN, MINUS_ONE));
    try std.testing.expectError(error.Overflow, negate(MIN));
    try std.testing.expectError(error.Overflow, abs(MIN));
}
