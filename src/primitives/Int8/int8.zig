//! Int8 - Signed 8-bit integer type
//!
//! A branded primitive wrapping Zig's native i8 with comprehensive
//! arithmetic, bitwise, and comparison operations. Uses two's complement
//! representation for negative values.
//!
//! ## Range
//! - Minimum: -128 (-2^7)
//! - Maximum: 127 (2^7 - 1)
//!
//! ## Usage
//! ```zig
//! const Int8 = @import("int8.zig");
//!
//! const a = Int8.from(-42);
//! const b = Int8.from(10);
//! const sum = try Int8.add(a, b); // -32
//! const hex = Int8.toHex(a); // "0xd6"
//! ```

const std = @import("std");

/// Int8 type - signed 8-bit integer
pub const Int8 = i8;

// Constants
pub const MIN: Int8 = std.math.minInt(i8); // -128
pub const MAX: Int8 = std.math.maxInt(i8); // 127
pub const ZERO: Int8 = 0;
pub const ONE: Int8 = 1;
pub const MINUS_ONE: Int8 = -1;
pub const SIZE: usize = 1; // bytes

// ============================================================================
// Constructors
// ============================================================================

/// Create Int8 from i8 value (identity)
pub fn from(value: i8) Int8 {
    return value;
}

/// Create Int8 from i16, checking bounds
pub fn fromI16(value: i16) error{Overflow}!Int8 {
    if (value < MIN or value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int8 from i32, checking bounds
pub fn fromI32(value: i32) error{Overflow}!Int8 {
    if (value < MIN or value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int8 from i64, checking bounds
pub fn fromI64(value: i64) error{Overflow}!Int8 {
    if (value < MIN or value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int8 from u8, checking bounds
pub fn fromU8(value: u8) error{Overflow}!Int8 {
    if (value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Create Int8 from bytes (big-endian, two's complement)
pub fn fromBytes(bytes: [1]u8) Int8 {
    return @bitCast(bytes[0]);
}

/// Create Int8 from hex string
pub fn fromHex(hex: []const u8) error{ InvalidHex, Overflow }!Int8 {
    const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
    const clean = hex[start..];

    if (clean.len == 0) return 0;
    if (clean.len > 2) return error.Overflow;

    var result: u8 = 0;
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

/// Convert Int8 to i8 (identity)
pub fn toNumber(value: Int8) i8 {
    return value;
}

/// Convert Int8 to i16
pub fn toI16(value: Int8) i16 {
    return value;
}

/// Convert Int8 to i32
pub fn toI32(value: Int8) i32 {
    return value;
}

/// Convert Int8 to i64
pub fn toI64(value: Int8) i64 {
    return value;
}

/// Convert Int8 to bytes (big-endian, two's complement)
pub fn toBytes(value: Int8) [1]u8 {
    return .{@bitCast(value)};
}

/// Convert Int8 to hex string with 0x prefix (two's complement)
/// Returns static buffer - caller should copy if needed
pub fn toHex(value: Int8) [4]u8 {
    const unsigned: u8 = @bitCast(value);
    const hex_chars = "0123456789abcdef";
    return .{
        '0',
        'x',
        hex_chars[unsigned >> 4],
        hex_chars[unsigned & 0x0f],
    };
}

// ============================================================================
// Arithmetic Operations
// ============================================================================

/// Add two Int8 values with overflow checking
pub fn add(a: Int8, b: Int8) error{Overflow}!Int8 {
    return std.math.add(i8, a, b);
}

/// Subtract two Int8 values with overflow checking
pub fn sub(a: Int8, b: Int8) error{Overflow}!Int8 {
    return std.math.sub(i8, a, b);
}

/// Multiply two Int8 values with overflow checking
pub fn mul(a: Int8, b: Int8) error{Overflow}!Int8 {
    return std.math.mul(i8, a, b);
}

/// Divide two Int8 values (truncates toward zero)
pub fn div(a: Int8, b: Int8) error{ DivisionByZero, Overflow }!Int8 {
    if (b == 0) return error.DivisionByZero;
    // Special case: MIN / -1 would overflow
    if (a == MIN and b == -1) return error.Overflow;
    return @divTrunc(a, b);
}

/// Modulo operation (remainder after division)
pub fn mod(a: Int8, b: Int8) error{DivisionByZero}!Int8 {
    if (b == 0) return error.DivisionByZero;
    return @rem(a, b);
}

/// Negate an Int8 value
pub fn negate(value: Int8) error{Overflow}!Int8 {
    if (value == MIN) return error.Overflow;
    return -value;
}

/// Absolute value of Int8
pub fn abs(value: Int8) error{Overflow}!Int8 {
    if (value == MIN) return error.Overflow;
    return if (value < 0) -value else value;
}

// ============================================================================
// Comparison Operations
// ============================================================================

/// Check equality of two Int8 values
pub fn equals(a: Int8, b: Int8) bool {
    return a == b;
}

/// Compare two Int8 values: returns -1, 0, or 1
pub fn compare(a: Int8, b: Int8) i2 {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/// Check if a < b
pub fn lessThan(a: Int8, b: Int8) bool {
    return a < b;
}

/// Check if a > b
pub fn greaterThan(a: Int8, b: Int8) bool {
    return a > b;
}

/// Check if value is zero
pub fn isZero(value: Int8) bool {
    return value == 0;
}

/// Check if value is negative
pub fn isNegative(value: Int8) bool {
    return value < 0;
}

/// Check if value is positive
pub fn isPositive(value: Int8) bool {
    return value > 0;
}

/// Return minimum of two values
pub fn min(a: Int8, b: Int8) Int8 {
    return @min(a, b);
}

/// Return maximum of two values
pub fn max(a: Int8, b: Int8) Int8 {
    return @max(a, b);
}

/// Return sign: -1, 0, or 1
pub fn sign(value: Int8) i2 {
    if (value < 0) return -1;
    if (value > 0) return 1;
    return 0;
}

// ============================================================================
// Bitwise Operations
// ============================================================================

/// Bitwise AND
pub fn bitwiseAnd(a: Int8, b: Int8) Int8 {
    return a & b;
}

/// Bitwise OR
pub fn bitwiseOr(a: Int8, b: Int8) Int8 {
    return a | b;
}

/// Bitwise XOR
pub fn bitwiseXor(a: Int8, b: Int8) Int8 {
    return a ^ b;
}

/// Bitwise NOT
pub fn bitwiseNot(value: Int8) Int8 {
    return ~value;
}

/// Shift left (arithmetic)
pub fn shiftLeft(value: Int8, shift: u3) Int8 {
    return value << shift;
}

/// Shift right (arithmetic, sign-extending)
pub fn shiftRight(value: Int8, shift: u3) Int8 {
    return value >> shift;
}

// ============================================================================
// Utility Functions
// ============================================================================

/// Count leading zeros (on unsigned representation)
pub fn leadingZeros(value: Int8) u4 {
    const unsigned: u8 = @bitCast(value);
    return @clz(unsigned);
}

/// Count trailing zeros
pub fn trailingZeros(value: Int8) u4 {
    const unsigned: u8 = @bitCast(value);
    return @ctz(unsigned);
}

/// Count number of set bits (population count)
pub fn popCount(value: Int8) u4 {
    const unsigned: u8 = @bitCast(value);
    return @popCount(unsigned);
}

/// Get bit length (minimum bits needed to represent value)
pub fn bitLength(value: Int8) u4 {
    const unsigned: u8 = @bitCast(value);
    return 8 - @clz(unsigned);
}

// ============================================================================
// Tests
// ============================================================================

test "Int8: constants" {
    try std.testing.expectEqual(@as(Int8, -128), MIN);
    try std.testing.expectEqual(@as(Int8, 127), MAX);
    try std.testing.expectEqual(@as(Int8, 0), ZERO);
    try std.testing.expectEqual(@as(Int8, 1), ONE);
    try std.testing.expectEqual(@as(Int8, -1), MINUS_ONE);
    try std.testing.expectEqual(@as(usize, 1), SIZE);
}

test "Int8: from" {
    try std.testing.expectEqual(@as(Int8, 42), from(42));
    try std.testing.expectEqual(@as(Int8, -42), from(-42));
    try std.testing.expectEqual(@as(Int8, 0), from(0));
    try std.testing.expectEqual(@as(Int8, -128), from(-128));
    try std.testing.expectEqual(@as(Int8, 127), from(127));
}

test "Int8: fromI16" {
    try std.testing.expectEqual(@as(Int8, 100), try fromI16(100));
    try std.testing.expectEqual(@as(Int8, -100), try fromI16(-100));
    try std.testing.expectError(error.Overflow, fromI16(128));
    try std.testing.expectError(error.Overflow, fromI16(-129));
}

test "Int8: fromI32" {
    try std.testing.expectEqual(@as(Int8, 50), try fromI32(50));
    try std.testing.expectEqual(@as(Int8, -50), try fromI32(-50));
    try std.testing.expectError(error.Overflow, fromI32(1000));
    try std.testing.expectError(error.Overflow, fromI32(-1000));
}

test "Int8: fromU8" {
    try std.testing.expectEqual(@as(Int8, 0), try fromU8(0));
    try std.testing.expectEqual(@as(Int8, 127), try fromU8(127));
    try std.testing.expectError(error.Overflow, fromU8(128));
    try std.testing.expectError(error.Overflow, fromU8(255));
}

test "Int8: fromBytes" {
    try std.testing.expectEqual(@as(Int8, 0), fromBytes(.{0x00}));
    try std.testing.expectEqual(@as(Int8, 127), fromBytes(.{0x7f}));
    try std.testing.expectEqual(@as(Int8, -128), fromBytes(.{0x80}));
    try std.testing.expectEqual(@as(Int8, -1), fromBytes(.{0xff}));
    try std.testing.expectEqual(@as(Int8, -42), fromBytes(.{0xd6}));
}

test "Int8: fromHex" {
    try std.testing.expectEqual(@as(Int8, 0), try fromHex("0x00"));
    try std.testing.expectEqual(@as(Int8, 127), try fromHex("0x7f"));
    try std.testing.expectEqual(@as(Int8, -128), try fromHex("0x80"));
    try std.testing.expectEqual(@as(Int8, -1), try fromHex("0xff"));
    try std.testing.expectEqual(@as(Int8, -42), try fromHex("0xd6"));
    try std.testing.expectEqual(@as(Int8, 0), try fromHex(""));
    try std.testing.expectEqual(@as(Int8, 15), try fromHex("f"));
    try std.testing.expectError(error.InvalidHex, fromHex("0xgg"));
    try std.testing.expectError(error.Overflow, fromHex("0x100"));
}

test "Int8: toNumber" {
    try std.testing.expectEqual(@as(i8, 42), toNumber(from(42)));
    try std.testing.expectEqual(@as(i8, -42), toNumber(from(-42)));
}

test "Int8: toI16" {
    try std.testing.expectEqual(@as(i16, 127), toI16(from(127)));
    try std.testing.expectEqual(@as(i16, -128), toI16(from(-128)));
}

test "Int8: toBytes" {
    try std.testing.expectEqual([1]u8{0x00}, toBytes(from(0)));
    try std.testing.expectEqual([1]u8{0x7f}, toBytes(from(127)));
    try std.testing.expectEqual([1]u8{0x80}, toBytes(from(-128)));
    try std.testing.expectEqual([1]u8{0xff}, toBytes(from(-1)));
    try std.testing.expectEqual([1]u8{0xd6}, toBytes(from(-42)));
}

test "Int8: toHex" {
    try std.testing.expectEqualSlices(u8, "0x00", &toHex(from(0)));
    try std.testing.expectEqualSlices(u8, "0x7f", &toHex(from(127)));
    try std.testing.expectEqualSlices(u8, "0x80", &toHex(from(-128)));
    try std.testing.expectEqualSlices(u8, "0xff", &toHex(from(-1)));
    try std.testing.expectEqualSlices(u8, "0xd6", &toHex(from(-42)));
}

test "Int8: add" {
    try std.testing.expectEqual(@as(Int8, 30), try add(from(10), from(20)));
    try std.testing.expectEqual(@as(Int8, -10), try add(from(10), from(-20)));
    try std.testing.expectEqual(@as(Int8, 0), try add(from(-10), from(10)));
    try std.testing.expectError(error.Overflow, add(MAX, from(1)));
    try std.testing.expectError(error.Overflow, add(MIN, from(-1)));
}

test "Int8: sub" {
    try std.testing.expectEqual(@as(Int8, -10), try sub(from(10), from(20)));
    try std.testing.expectEqual(@as(Int8, 30), try sub(from(10), from(-20)));
    try std.testing.expectError(error.Overflow, sub(MIN, from(1)));
    try std.testing.expectError(error.Overflow, sub(MAX, from(-1)));
}

test "Int8: mul" {
    try std.testing.expectEqual(@as(Int8, 20), try mul(from(4), from(5)));
    try std.testing.expectEqual(@as(Int8, -20), try mul(from(4), from(-5)));
    try std.testing.expectEqual(@as(Int8, 20), try mul(from(-4), from(-5)));
    try std.testing.expectError(error.Overflow, mul(from(100), from(2)));
    try std.testing.expectError(error.Overflow, mul(MIN, from(-1)));
}

test "Int8: div" {
    try std.testing.expectEqual(@as(Int8, 5), try div(from(20), from(4)));
    try std.testing.expectEqual(@as(Int8, -5), try div(from(20), from(-4)));
    try std.testing.expectEqual(@as(Int8, 5), try div(from(-20), from(-4)));
    try std.testing.expectEqual(@as(Int8, -5), try div(from(-20), from(4)));
    try std.testing.expectEqual(@as(Int8, 2), try div(from(7), from(3))); // truncates toward zero
    try std.testing.expectEqual(@as(Int8, -2), try div(from(-7), from(3))); // truncates toward zero
    try std.testing.expectError(error.DivisionByZero, div(from(10), from(0)));
    try std.testing.expectError(error.Overflow, div(MIN, from(-1)));
}

test "Int8: mod" {
    try std.testing.expectEqual(@as(Int8, 1), try mod(from(7), from(3)));
    try std.testing.expectEqual(@as(Int8, -1), try mod(from(-7), from(3)));
    try std.testing.expectEqual(@as(Int8, 1), try mod(from(7), from(-3)));
    try std.testing.expectEqual(@as(Int8, 0), try mod(from(9), from(3)));
    try std.testing.expectError(error.DivisionByZero, mod(from(10), from(0)));
}

test "Int8: negate" {
    try std.testing.expectEqual(@as(Int8, -42), try negate(from(42)));
    try std.testing.expectEqual(@as(Int8, 42), try negate(from(-42)));
    try std.testing.expectEqual(@as(Int8, 0), try negate(from(0)));
    try std.testing.expectEqual(@as(Int8, -127), try negate(from(127)));
    try std.testing.expectError(error.Overflow, negate(MIN));
}

test "Int8: abs" {
    try std.testing.expectEqual(@as(Int8, 42), try abs(from(42)));
    try std.testing.expectEqual(@as(Int8, 42), try abs(from(-42)));
    try std.testing.expectEqual(@as(Int8, 0), try abs(from(0)));
    try std.testing.expectEqual(@as(Int8, 127), try abs(from(-127)));
    try std.testing.expectError(error.Overflow, abs(MIN));
}

test "Int8: equals" {
    try std.testing.expect(equals(from(42), from(42)));
    try std.testing.expect(!equals(from(42), from(-42)));
    try std.testing.expect(equals(MIN, MIN));
    try std.testing.expect(equals(MAX, MAX));
}

test "Int8: compare" {
    try std.testing.expectEqual(@as(i2, 0), compare(from(42), from(42)));
    try std.testing.expectEqual(@as(i2, -1), compare(from(10), from(20)));
    try std.testing.expectEqual(@as(i2, 1), compare(from(20), from(10)));
    try std.testing.expectEqual(@as(i2, -1), compare(MIN, MAX));
    try std.testing.expectEqual(@as(i2, 1), compare(MAX, MIN));
}

test "Int8: lessThan and greaterThan" {
    try std.testing.expect(lessThan(from(10), from(20)));
    try std.testing.expect(!lessThan(from(20), from(10)));
    try std.testing.expect(!lessThan(from(10), from(10)));
    try std.testing.expect(greaterThan(from(20), from(10)));
    try std.testing.expect(!greaterThan(from(10), from(20)));
    try std.testing.expect(lessThan(from(-10), from(10)));
    try std.testing.expect(greaterThan(from(10), from(-10)));
}

test "Int8: isZero, isNegative, isPositive" {
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

test "Int8: min and max" {
    try std.testing.expectEqual(@as(Int8, 10), min(from(10), from(20)));
    try std.testing.expectEqual(@as(Int8, 10), min(from(20), from(10)));
    try std.testing.expectEqual(@as(Int8, -20), min(from(-10), from(-20)));
    try std.testing.expectEqual(@as(Int8, 20), max(from(10), from(20)));
    try std.testing.expectEqual(@as(Int8, 20), max(from(20), from(10)));
    try std.testing.expectEqual(@as(Int8, -10), max(from(-10), from(-20)));
}

test "Int8: sign" {
    try std.testing.expectEqual(@as(i2, 0), sign(from(0)));
    try std.testing.expectEqual(@as(i2, 1), sign(from(42)));
    try std.testing.expectEqual(@as(i2, -1), sign(from(-42)));
    try std.testing.expectEqual(@as(i2, 1), sign(MAX));
    try std.testing.expectEqual(@as(i2, -1), sign(MIN));
}

test "Int8: bitwiseAnd" {
    try std.testing.expectEqual(@as(Int8, 0b0100), bitwiseAnd(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int8, 0), bitwiseAnd(from(0b1010), from(0b0101)));
    try std.testing.expectEqual(@as(Int8, -128), bitwiseAnd(from(-1), from(-128)));
}

test "Int8: bitwiseOr" {
    try std.testing.expectEqual(@as(Int8, 0b1110), bitwiseOr(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int8, 0b1111), bitwiseOr(from(0b1010), from(0b0101)));
}

test "Int8: bitwiseXor" {
    try std.testing.expectEqual(@as(Int8, 0b1010), bitwiseXor(from(0b1100), from(0b0110)));
    try std.testing.expectEqual(@as(Int8, 0b1111), bitwiseXor(from(0b1010), from(0b0101)));
}

test "Int8: bitwiseNot" {
    try std.testing.expectEqual(@as(Int8, -1), bitwiseNot(from(0)));
    try std.testing.expectEqual(@as(Int8, 0), bitwiseNot(from(-1)));
    try std.testing.expectEqual(@as(Int8, -43), bitwiseNot(from(42)));
}

test "Int8: shiftLeft" {
    try std.testing.expectEqual(@as(Int8, 8), shiftLeft(from(1), 3));
    try std.testing.expectEqual(@as(Int8, 40), shiftLeft(from(5), 3));
    try std.testing.expectEqual(@as(Int8, -8), shiftLeft(from(-1), 3));
}

test "Int8: shiftRight" {
    try std.testing.expectEqual(@as(Int8, 1), shiftRight(from(8), 3));
    try std.testing.expectEqual(@as(Int8, 5), shiftRight(from(40), 3));
    try std.testing.expectEqual(@as(Int8, -1), shiftRight(from(-1), 3)); // sign-extending
    try std.testing.expectEqual(@as(Int8, -2), shiftRight(from(-8), 2)); // sign-extending
}

test "Int8: leadingZeros" {
    try std.testing.expectEqual(@as(u4, 8), leadingZeros(from(0)));
    try std.testing.expectEqual(@as(u4, 7), leadingZeros(from(1)));
    try std.testing.expectEqual(@as(u4, 1), leadingZeros(from(127)));
    try std.testing.expectEqual(@as(u4, 0), leadingZeros(from(-1)));
    try std.testing.expectEqual(@as(u4, 0), leadingZeros(from(-128)));
}

test "Int8: trailingZeros" {
    try std.testing.expectEqual(@as(u4, 8), trailingZeros(from(0)));
    try std.testing.expectEqual(@as(u4, 0), trailingZeros(from(1)));
    try std.testing.expectEqual(@as(u4, 3), trailingZeros(from(8)));
    try std.testing.expectEqual(@as(u4, 0), trailingZeros(from(-1)));
}

test "Int8: popCount" {
    try std.testing.expectEqual(@as(u4, 0), popCount(from(0)));
    try std.testing.expectEqual(@as(u4, 1), popCount(from(1)));
    try std.testing.expectEqual(@as(u4, 8), popCount(from(-1)));
    try std.testing.expectEqual(@as(u4, 1), popCount(from(-128)));
    try std.testing.expectEqual(@as(u4, 7), popCount(from(127)));
}

test "Int8: bitLength" {
    try std.testing.expectEqual(@as(u4, 0), bitLength(from(0)));
    try std.testing.expectEqual(@as(u4, 1), bitLength(from(1)));
    try std.testing.expectEqual(@as(u4, 7), bitLength(from(127)));
    try std.testing.expectEqual(@as(u4, 8), bitLength(from(-1)));
    try std.testing.expectEqual(@as(u4, 8), bitLength(from(-128)));
}

test "Int8: roundtrip bytes" {
    const values = [_]Int8{ MIN, -42, -1, 0, 1, 42, MAX };
    for (values) |v| {
        try std.testing.expectEqual(v, fromBytes(toBytes(v)));
    }
}

test "Int8: roundtrip hex" {
    const values = [_]Int8{ MIN, -42, -1, 0, 1, 42, MAX };
    for (values) |v| {
        const hex = toHex(v);
        try std.testing.expectEqual(v, try fromHex(&hex));
    }
}

test "Int8: edge cases" {
    // MAX + 1 overflows
    try std.testing.expectError(error.Overflow, add(MAX, ONE));
    // MIN - 1 overflows
    try std.testing.expectError(error.Overflow, sub(MIN, ONE));
    // MIN * -1 overflows
    try std.testing.expectError(error.Overflow, mul(MIN, MINUS_ONE));
    // MIN / -1 overflows
    try std.testing.expectError(error.Overflow, div(MIN, MINUS_ONE));
    // -MIN overflows
    try std.testing.expectError(error.Overflow, negate(MIN));
    // abs(MIN) overflows
    try std.testing.expectError(error.Overflow, abs(MIN));
}
