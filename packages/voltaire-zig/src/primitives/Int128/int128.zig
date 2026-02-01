//! Int128 - Signed 128-bit integer type
//!
//! A branded primitive wrapping Zig's native i128 with comprehensive
//! arithmetic, bitwise, and comparison operations. Uses two's complement
//! representation for negative values.
//!
//! ## Range
//! - Minimum: -170141183460469231731687303715884105728 (-2^127)
//! - Maximum: 170141183460469231731687303715884105727 (2^127 - 1)
//!
//! ## Usage
//! ```zig
//! const Int128 = @import("int128.zig");
//!
//! const a = Int128.from(-1000000000000000000000000);
//! const b = Int128.from(500000000000000000000000);
//! const sum = try Int128.add(a, b);
//! const hex = Int128.toHex(a);
//! ```

const std = @import("std");

/// Int128 type - signed 128-bit integer
pub const Int128 = i128;

// Constants
pub const MIN: Int128 = std.math.minInt(i128);
pub const MAX: Int128 = std.math.maxInt(i128);
pub const ZERO: Int128 = 0;
pub const ONE: Int128 = 1;
pub const MINUS_ONE: Int128 = -1;
pub const SIZE: usize = 16; // bytes

// ============================================================================
// Constructors
// ============================================================================

/// Create Int128 from i128 value (identity)
pub fn from(value: i128) Int128 {
    return value;
}

/// Create Int128 from i8 (always fits)
pub fn fromI8(value: i8) Int128 {
    return value;
}

/// Create Int128 from i16 (always fits)
pub fn fromI16(value: i16) Int128 {
    return value;
}

/// Create Int128 from i32 (always fits)
pub fn fromI32(value: i32) Int128 {
    return value;
}

/// Create Int128 from i64 (always fits)
pub fn fromI64(value: i64) Int128 {
    return value;
}

/// Create Int128 from u8 (always fits)
pub fn fromU8(value: u8) Int128 {
    return value;
}

/// Create Int128 from u16 (always fits)
pub fn fromU16(value: u16) Int128 {
    return value;
}

/// Create Int128 from u32 (always fits)
pub fn fromU32(value: u32) Int128 {
    return value;
}

/// Create Int128 from u64 (always fits)
pub fn fromU64(value: u64) Int128 {
    return value;
}

/// Create Int128 from u128, checking bounds
pub fn fromU128(value: u128) error{Overflow}!Int128 {
    if (value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int128 from bytes (big-endian, two's complement)
pub fn fromBytes(bytes: [16]u8) Int128 {
    var unsigned: u128 = 0;
    for (bytes) |b| {
        unsigned = (unsigned << 8) | b;
    }
    return @bitCast(unsigned);
}

/// Create Int128 from hex string
pub fn fromHex(hex: []const u8) error{ InvalidHex, Overflow }!Int128 {
    const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
    const clean = hex[start..];

    if (clean.len == 0) return 0;
    if (clean.len > 32) return error.Overflow;

    var result: u128 = 0;
    for (clean) |c| {
        const digit: u128 = switch (c) {
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

/// Convert Int128 to i128 (identity)
pub fn toNumber(value: Int128) i128 {
    return value;
}

/// Convert Int128 to i64 (may fail if out of range)
pub fn toI64(value: Int128) error{Overflow}!i64 {
    if (value < std.math.minInt(i64) or value > std.math.maxInt(i64)) return error.Overflow;
    return @intCast(value);
}

/// Convert Int128 to bytes (big-endian, two's complement)
pub fn toBytes(value: Int128) [16]u8 {
    const unsigned: u128 = @bitCast(value);
    var result: [16]u8 = undefined;
    inline for (0..16) |i| {
        result[i] = @truncate(unsigned >> @intCast((15 - i) * 8));
    }
    return result;
}

/// Convert Int128 to hex string with 0x prefix (two's complement)
/// Returns static buffer - caller should copy if needed
pub fn toHex(value: Int128) [34]u8 {
    const unsigned: u128 = @bitCast(value);
    const hex_chars = "0123456789abcdef";
    var result: [34]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';
    inline for (0..32) |i| {
        const shift: u7 = @intCast((31 - i) * 4);
        result[i + 2] = hex_chars[@truncate((unsigned >> shift) & 0x0f)];
    }
    return result;
}

// ============================================================================
// Arithmetic Operations
// ============================================================================

/// Add two Int128 values with overflow checking
pub fn add(a: Int128, b: Int128) error{Overflow}!Int128 {
    return std.math.add(i128, a, b);
}

/// Subtract two Int128 values with overflow checking
pub fn sub(a: Int128, b: Int128) error{Overflow}!Int128 {
    return std.math.sub(i128, a, b);
}

/// Multiply two Int128 values with overflow checking
pub fn mul(a: Int128, b: Int128) error{Overflow}!Int128 {
    return std.math.mul(i128, a, b);
}

/// Divide two Int128 values (truncates toward zero)
pub fn div(a: Int128, b: Int128) error{ DivisionByZero, Overflow }!Int128 {
    if (b == 0) return error.DivisionByZero;
    if (a == MIN and b == -1) return error.Overflow;
    return @divTrunc(a, b);
}

/// Modulo operation (remainder after division)
pub fn mod(a: Int128, b: Int128) error{DivisionByZero}!Int128 {
    if (b == 0) return error.DivisionByZero;
    return @rem(a, b);
}

/// Negate an Int128 value
pub fn negate(value: Int128) error{Overflow}!Int128 {
    if (value == MIN) return error.Overflow;
    return -value;
}

/// Absolute value of Int128
pub fn abs(value: Int128) error{Overflow}!Int128 {
    if (value == MIN) return error.Overflow;
    return if (value < 0) -value else value;
}

// ============================================================================
// Comparison Operations
// ============================================================================

/// Check equality of two Int128 values
pub fn equals(a: Int128, b: Int128) bool {
    return a == b;
}

/// Compare two Int128 values: returns -1, 0, or 1
pub fn compare(a: Int128, b: Int128) i2 {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/// Check if a < b
pub fn lessThan(a: Int128, b: Int128) bool {
    return a < b;
}

/// Check if a > b
pub fn greaterThan(a: Int128, b: Int128) bool {
    return a > b;
}

/// Check if value is zero
pub fn isZero(value: Int128) bool {
    return value == 0;
}

/// Check if value is negative
pub fn isNegative(value: Int128) bool {
    return value < 0;
}

/// Check if value is positive
pub fn isPositive(value: Int128) bool {
    return value > 0;
}

/// Return minimum of two values
pub fn min(a: Int128, b: Int128) Int128 {
    return @min(a, b);
}

/// Return maximum of two values
pub fn max(a: Int128, b: Int128) Int128 {
    return @max(a, b);
}

/// Return sign: -1, 0, or 1
pub fn sign(value: Int128) i2 {
    if (value < 0) return -1;
    if (value > 0) return 1;
    return 0;
}

// ============================================================================
// Bitwise Operations
// ============================================================================

/// Bitwise AND
pub fn bitwiseAnd(a: Int128, b: Int128) Int128 {
    return a & b;
}

/// Bitwise OR
pub fn bitwiseOr(a: Int128, b: Int128) Int128 {
    return a | b;
}

/// Bitwise XOR
pub fn bitwiseXor(a: Int128, b: Int128) Int128 {
    return a ^ b;
}

/// Bitwise NOT
pub fn bitwiseNot(value: Int128) Int128 {
    return ~value;
}

/// Shift left (arithmetic)
pub fn shiftLeft(value: Int128, shift: u7) Int128 {
    return value << shift;
}

/// Shift right (arithmetic, sign-extending)
pub fn shiftRight(value: Int128, shift: u7) Int128 {
    return value >> shift;
}

// ============================================================================
// Utility Functions
// ============================================================================

/// Count leading zeros (on unsigned representation)
pub fn leadingZeros(value: Int128) u8 {
    const unsigned: u128 = @bitCast(value);
    return @clz(unsigned);
}

/// Count trailing zeros
pub fn trailingZeros(value: Int128) u8 {
    const unsigned: u128 = @bitCast(value);
    return @ctz(unsigned);
}

/// Count number of set bits (population count)
pub fn popCount(value: Int128) u8 {
    const unsigned: u128 = @bitCast(value);
    return @popCount(unsigned);
}

/// Get bit length (minimum bits needed to represent value)
pub fn bitLength(value: Int128) u8 {
    const unsigned: u128 = @bitCast(value);
    return 128 - @clz(unsigned);
}

// ============================================================================
// Tests
// ============================================================================

test "Int128: constants" {
    try std.testing.expectEqual(MIN, std.math.minInt(i128));
    try std.testing.expectEqual(MAX, std.math.maxInt(i128));
    try std.testing.expectEqual(@as(Int128, 0), ZERO);
    try std.testing.expectEqual(@as(Int128, 1), ONE);
    try std.testing.expectEqual(@as(Int128, -1), MINUS_ONE);
    try std.testing.expectEqual(@as(usize, 16), SIZE);
}

test "Int128: from" {
    const large: i128 = 1000000000000000000000000;
    try std.testing.expectEqual(large, from(large));
    try std.testing.expectEqual(-large, from(-large));
    try std.testing.expectEqual(@as(Int128, 0), from(0));
    try std.testing.expectEqual(MIN, from(MIN));
    try std.testing.expectEqual(MAX, from(MAX));
}

test "Int128: fromI8" {
    try std.testing.expectEqual(@as(Int128, 127), fromI8(127));
    try std.testing.expectEqual(@as(Int128, -128), fromI8(-128));
}

test "Int128: fromI16" {
    try std.testing.expectEqual(@as(Int128, 32767), fromI16(32767));
    try std.testing.expectEqual(@as(Int128, -32768), fromI16(-32768));
}

test "Int128: fromI32" {
    try std.testing.expectEqual(@as(Int128, 2147483647), fromI32(2147483647));
    try std.testing.expectEqual(@as(Int128, -2147483648), fromI32(-2147483648));
}

test "Int128: fromI64" {
    try std.testing.expectEqual(@as(Int128, 9223372036854775807), fromI64(9223372036854775807));
    try std.testing.expectEqual(@as(Int128, -9223372036854775808), fromI64(-9223372036854775808));
}

test "Int128: fromU8" {
    try std.testing.expectEqual(@as(Int128, 0), fromU8(0));
    try std.testing.expectEqual(@as(Int128, 255), fromU8(255));
}

test "Int128: fromU64" {
    try std.testing.expectEqual(@as(Int128, 0), fromU64(0));
    try std.testing.expectEqual(@as(Int128, 18446744073709551615), fromU64(18446744073709551615));
}

test "Int128: fromU128" {
    try std.testing.expectEqual(@as(Int128, 0), try fromU128(0));
    try std.testing.expectEqual(MAX, try fromU128(@intCast(MAX)));
    try std.testing.expectError(error.Overflow, fromU128(@as(u128, MAX) + 1));
}

test "Int128: fromBytes" {
    try std.testing.expectEqual(@as(Int128, 0), fromBytes(.{ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 }));
    try std.testing.expectEqual(@as(Int128, 1), fromBytes(.{ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01 }));
    try std.testing.expectEqual(MAX, fromBytes(.{ 0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff }));
    try std.testing.expectEqual(MIN, fromBytes(.{ 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 }));
    try std.testing.expectEqual(@as(Int128, -1), fromBytes(.{ 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff }));
}

test "Int128: fromHex" {
    try std.testing.expectEqual(@as(Int128, 0), try fromHex("0x00000000000000000000000000000000"));
    try std.testing.expectEqual(MAX, try fromHex("0x7fffffffffffffffffffffffffffffff"));
    try std.testing.expectEqual(MIN, try fromHex("0x80000000000000000000000000000000"));
    try std.testing.expectEqual(@as(Int128, -1), try fromHex("0xffffffffffffffffffffffffffffffff"));
    try std.testing.expectEqual(@as(Int128, 0), try fromHex(""));
    try std.testing.expectEqual(@as(Int128, 15), try fromHex("f"));
    try std.testing.expectError(error.InvalidHex, fromHex("0xggggg"));
    try std.testing.expectError(error.Overflow, fromHex("0x100000000000000000000000000000000"));
}

test "Int128: toNumber" {
    const large: i128 = 1000000000000000000000000;
    try std.testing.expectEqual(large, toNumber(from(large)));
    try std.testing.expectEqual(-large, toNumber(from(-large)));
}

test "Int128: toI64" {
    try std.testing.expectEqual(@as(i64, 9223372036854775807), try toI64(from(9223372036854775807)));
    try std.testing.expectEqual(@as(i64, -9223372036854775808), try toI64(from(-9223372036854775808)));
    try std.testing.expectError(error.Overflow, toI64(from(9223372036854775808)));
    try std.testing.expectError(error.Overflow, toI64(from(-9223372036854775809)));
}

test "Int128: toBytes" {
    try std.testing.expectEqual([16]u8{ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 }, toBytes(from(0)));
    try std.testing.expectEqual([16]u8{ 0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff }, toBytes(MAX));
    try std.testing.expectEqual([16]u8{ 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 }, toBytes(MIN));
    try std.testing.expectEqual([16]u8{ 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff }, toBytes(from(-1)));
}

test "Int128: toHex" {
    try std.testing.expectEqualSlices(u8, "0x00000000000000000000000000000000", &toHex(from(0)));
    try std.testing.expectEqualSlices(u8, "0x7fffffffffffffffffffffffffffffff", &toHex(MAX));
    try std.testing.expectEqualSlices(u8, "0x80000000000000000000000000000000", &toHex(MIN));
    try std.testing.expectEqualSlices(u8, "0xffffffffffffffffffffffffffffffff", &toHex(from(-1)));
}

test "Int128: add" {
    const large: Int128 = 1000000000000000000000000;
    try std.testing.expectEqual(@as(Int128, 3000000000000000000000000), try add(large, large * 2));
    try std.testing.expectEqual(@as(Int128, -1000000000000000000000000), try add(large, large * -2));
    try std.testing.expectEqual(@as(Int128, 0), try add(-large, large));
    try std.testing.expectError(error.Overflow, add(MAX, from(1)));
    try std.testing.expectError(error.Overflow, add(MIN, from(-1)));
}

test "Int128: sub" {
    const large: Int128 = 1000000000000000000000000;
    try std.testing.expectEqual(@as(Int128, -1000000000000000000000000), try sub(large, large * 2));
    try std.testing.expectEqual(@as(Int128, 3000000000000000000000000), try sub(large, large * -2));
    try std.testing.expectError(error.Overflow, sub(MIN, from(1)));
    try std.testing.expectError(error.Overflow, sub(MAX, from(-1)));
}

test "Int128: mul" {
    try std.testing.expectEqual(@as(Int128, 200000000000), try mul(from(400000), from(500000)));
    try std.testing.expectEqual(@as(Int128, -200000000000), try mul(from(400000), from(-500000)));
    try std.testing.expectEqual(@as(Int128, 200000000000), try mul(from(-400000), from(-500000)));
    try std.testing.expectError(error.Overflow, mul(MAX, from(2)));
    try std.testing.expectError(error.Overflow, mul(MIN, from(-1)));
}

test "Int128: div" {
    try std.testing.expectEqual(@as(Int128, 5), try div(from(200), from(40)));
    try std.testing.expectEqual(@as(Int128, -5), try div(from(200), from(-40)));
    try std.testing.expectEqual(@as(Int128, 5), try div(from(-200), from(-40)));
    try std.testing.expectEqual(@as(Int128, -5), try div(from(-200), from(40)));
    try std.testing.expectEqual(@as(Int128, 2), try div(from(7), from(3)));
    try std.testing.expectEqual(@as(Int128, -2), try div(from(-7), from(3)));
    try std.testing.expectError(error.DivisionByZero, div(from(100), from(0)));
    try std.testing.expectError(error.Overflow, div(MIN, from(-1)));
}

test "Int128: mod" {
    try std.testing.expectEqual(@as(Int128, 1), try mod(from(7), from(3)));
    try std.testing.expectEqual(@as(Int128, -1), try mod(from(-7), from(3)));
    try std.testing.expectEqual(@as(Int128, 1), try mod(from(7), from(-3)));
    try std.testing.expectEqual(@as(Int128, 0), try mod(from(9), from(3)));
    try std.testing.expectError(error.DivisionByZero, mod(from(100), from(0)));
}

test "Int128: negate" {
    const large: Int128 = 1000000000000000000000000;
    try std.testing.expectEqual(-large, try negate(large));
    try std.testing.expectEqual(large, try negate(-large));
    try std.testing.expectEqual(@as(Int128, 0), try negate(from(0)));
    try std.testing.expectEqual(-MAX, try negate(MAX));
    try std.testing.expectError(error.Overflow, negate(MIN));
}

test "Int128: abs" {
    const large: Int128 = 1000000000000000000000000;
    try std.testing.expectEqual(large, try abs(large));
    try std.testing.expectEqual(large, try abs(-large));
    try std.testing.expectEqual(@as(Int128, 0), try abs(from(0)));
    try std.testing.expectEqual(MAX, try abs(from(-MAX)));
    try std.testing.expectError(error.Overflow, abs(MIN));
}

test "Int128: equals" {
    const large: Int128 = 1000000000000000000000000;
    try std.testing.expect(equals(large, large));
    try std.testing.expect(!equals(large, -large));
    try std.testing.expect(equals(MIN, MIN));
    try std.testing.expect(equals(MAX, MAX));
}

test "Int128: compare" {
    const large: Int128 = 1000000000000000000000000;
    try std.testing.expectEqual(@as(i2, 0), compare(large, large));
    try std.testing.expectEqual(@as(i2, -1), compare(from(1000), from(2000)));
    try std.testing.expectEqual(@as(i2, 1), compare(from(2000), from(1000)));
    try std.testing.expectEqual(@as(i2, -1), compare(MIN, MAX));
    try std.testing.expectEqual(@as(i2, 1), compare(MAX, MIN));
}

test "Int128: lessThan and greaterThan" {
    try std.testing.expect(lessThan(from(1000), from(2000)));
    try std.testing.expect(!lessThan(from(2000), from(1000)));
    try std.testing.expect(!lessThan(from(1000), from(1000)));
    try std.testing.expect(greaterThan(from(2000), from(1000)));
    try std.testing.expect(!greaterThan(from(1000), from(2000)));
    try std.testing.expect(lessThan(from(-1000), from(1000)));
    try std.testing.expect(greaterThan(from(1000), from(-1000)));
}

test "Int128: isZero, isNegative, isPositive" {
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

test "Int128: min and max" {
    try std.testing.expectEqual(@as(Int128, 1000), min(from(1000), from(2000)));
    try std.testing.expectEqual(@as(Int128, 1000), min(from(2000), from(1000)));
    try std.testing.expectEqual(@as(Int128, -2000), min(from(-1000), from(-2000)));
    try std.testing.expectEqual(@as(Int128, 2000), max(from(1000), from(2000)));
    try std.testing.expectEqual(@as(Int128, 2000), max(from(2000), from(1000)));
    try std.testing.expectEqual(@as(Int128, -1000), max(from(-1000), from(-2000)));
}

test "Int128: sign" {
    const large: Int128 = 1000000000000000000000000;
    try std.testing.expectEqual(@as(i2, 0), sign(from(0)));
    try std.testing.expectEqual(@as(i2, 1), sign(large));
    try std.testing.expectEqual(@as(i2, -1), sign(-large));
    try std.testing.expectEqual(@as(i2, 1), sign(MAX));
    try std.testing.expectEqual(@as(i2, -1), sign(MIN));
}

test "Int128: bitwiseAnd" {
    try std.testing.expectEqual(@as(Int128, 0b0100), bitwiseAnd(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int128, 0), bitwiseAnd(from(0b1010), from(0b0101)));
    try std.testing.expectEqual(MIN, bitwiseAnd(from(-1), MIN));
}

test "Int128: bitwiseOr" {
    try std.testing.expectEqual(@as(Int128, 0b1110), bitwiseOr(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int128, 0b1111), bitwiseOr(from(0b1010), from(0b0101)));
}

test "Int128: bitwiseXor" {
    try std.testing.expectEqual(@as(Int128, 0b1010), bitwiseXor(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int128, 0b1111), bitwiseXor(from(0b1010), from(0b0101)));
}

test "Int128: bitwiseNot" {
    try std.testing.expectEqual(@as(Int128, -1), bitwiseNot(from(0)));
    try std.testing.expectEqual(@as(Int128, 0), bitwiseNot(from(-1)));
    try std.testing.expectEqual(@as(Int128, -1001), bitwiseNot(from(1000)));
}

test "Int128: shiftLeft" {
    try std.testing.expectEqual(@as(Int128, 8), shiftLeft(from(1), 3));
    try std.testing.expectEqual(@as(Int128, 40), shiftLeft(from(5), 3));
    try std.testing.expectEqual(@as(Int128, -8), shiftLeft(from(-1), 3));
}

test "Int128: shiftRight" {
    try std.testing.expectEqual(@as(Int128, 1), shiftRight(from(8), 3));
    try std.testing.expectEqual(@as(Int128, 5), shiftRight(from(40), 3));
    try std.testing.expectEqual(@as(Int128, -1), shiftRight(from(-1), 3));
    try std.testing.expectEqual(@as(Int128, -2), shiftRight(from(-8), 2));
}

test "Int128: leadingZeros" {
    try std.testing.expectEqual(@as(u8, 128), leadingZeros(from(0)));
    try std.testing.expectEqual(@as(u8, 127), leadingZeros(from(1)));
    try std.testing.expectEqual(@as(u8, 1), leadingZeros(MAX));
    try std.testing.expectEqual(@as(u8, 0), leadingZeros(from(-1)));
    try std.testing.expectEqual(@as(u8, 0), leadingZeros(MIN));
}

test "Int128: trailingZeros" {
    try std.testing.expectEqual(@as(u8, 128), trailingZeros(from(0)));
    try std.testing.expectEqual(@as(u8, 0), trailingZeros(from(1)));
    try std.testing.expectEqual(@as(u8, 3), trailingZeros(from(8)));
    try std.testing.expectEqual(@as(u8, 0), trailingZeros(from(-1)));
}

test "Int128: popCount" {
    try std.testing.expectEqual(@as(u8, 0), popCount(from(0)));
    try std.testing.expectEqual(@as(u8, 1), popCount(from(1)));
    try std.testing.expectEqual(@as(u8, 128), popCount(from(-1)));
    try std.testing.expectEqual(@as(u8, 1), popCount(MIN));
    try std.testing.expectEqual(@as(u8, 127), popCount(MAX));
}

test "Int128: bitLength" {
    try std.testing.expectEqual(@as(u8, 0), bitLength(from(0)));
    try std.testing.expectEqual(@as(u8, 1), bitLength(from(1)));
    try std.testing.expectEqual(@as(u8, 127), bitLength(MAX));
    try std.testing.expectEqual(@as(u8, 128), bitLength(from(-1)));
    try std.testing.expectEqual(@as(u8, 128), bitLength(MIN));
}

test "Int128: roundtrip bytes" {
    const large: Int128 = 1000000000000000000000000;
    const values = [_]Int128{ MIN, -large, -1, 0, 1, large, MAX };
    for (values) |v| {
        try std.testing.expectEqual(v, fromBytes(toBytes(v)));
    }
}

test "Int128: roundtrip hex" {
    const large: Int128 = 1000000000000000000000000;
    const values = [_]Int128{ MIN, -large, -1, 0, 1, large, MAX };
    for (values) |v| {
        const hex = toHex(v);
        try std.testing.expectEqual(v, try fromHex(&hex));
    }
}

test "Int128: edge cases" {
    try std.testing.expectError(error.Overflow, add(MAX, ONE));
    try std.testing.expectError(error.Overflow, sub(MIN, ONE));
    try std.testing.expectError(error.Overflow, mul(MIN, MINUS_ONE));
    try std.testing.expectError(error.Overflow, div(MIN, MINUS_ONE));
    try std.testing.expectError(error.Overflow, negate(MIN));
    try std.testing.expectError(error.Overflow, abs(MIN));
}
