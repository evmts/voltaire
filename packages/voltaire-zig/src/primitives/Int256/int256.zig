//! Int256 - Signed 256-bit integer type
//!
//! A branded primitive wrapping Zig's native i256 with arithmetic, bitwise,
//! and comparison operations. Uses two's complement representation, which is
//! the encoding of Solidity `int256` and the operand format of EVM signed
//! opcodes (SDIV, SMOD, SLT, SGT, SAR, SIGNEXTEND).
//!
//! ## Range
//! - Minimum: -2^255
//! - Maximum: 2^255 - 1
//!
//! ## Arithmetic semantics
//! - `add`, `sub`, `mul`, `div`, `mod`: checked, return `error.Overflow`.
//! - `plus`, `minus`, `times`: wrapping (mod 2^256), matching the
//!   TypeScript Int256 API and EVM ADD/SUB/MUL on two's complement words.
//! - `dividedBy`, `modulo`: EVM SDIV/SMOD semantics (truncate toward zero,
//!   remainder takes the dividend's sign). `dividedBy(MIN, -1)` returns
//!   `error.Overflow`, matching the TypeScript Int256 API.
//!
//! ## Usage
//! ```zig
//! const Int256 = @import("primitives").Int256;
//!
//! const a = Int256.from(-1000);
//! const b = Int256.from(500);
//! const sum = try Int256.add(a, b);
//! const hex = Int256.toHex(a);
//! const word = Int256.toU256(a); // EVM stack word
//! ```

const std = @import("std");

/// Int256 type - signed 256-bit integer
pub const Int256 = i256;

// Constants
pub const MIN: Int256 = std.math.minInt(i256);
pub const MAX: Int256 = std.math.maxInt(i256);
pub const ZERO: Int256 = 0;
pub const ONE: Int256 = 1;
pub const MINUS_ONE: Int256 = -1;
pub const SIZE: usize = 32; // bytes
pub const BITS: u16 = 256;

// ============================================================================
// Constructors
// ============================================================================

/// Create Int256 from i256 value (identity)
pub fn from(value: i256) Int256 {
    return value;
}

/// Create Int256 from i8 (always fits)
pub fn fromI8(value: i8) Int256 {
    return value;
}

/// Create Int256 from i16 (always fits)
pub fn fromI16(value: i16) Int256 {
    return value;
}

/// Create Int256 from i32 (always fits)
pub fn fromI32(value: i32) Int256 {
    return value;
}

/// Create Int256 from i64 (always fits)
pub fn fromI64(value: i64) Int256 {
    return value;
}

/// Create Int256 from i128 (always fits)
pub fn fromI128(value: i128) Int256 {
    return value;
}

/// Create Int256 from u8 (always fits)
pub fn fromU8(value: u8) Int256 {
    return value;
}

/// Create Int256 from u16 (always fits)
pub fn fromU16(value: u16) Int256 {
    return value;
}

/// Create Int256 from u32 (always fits)
pub fn fromU32(value: u32) Int256 {
    return value;
}

/// Create Int256 from u64 (always fits)
pub fn fromU64(value: u64) Int256 {
    return value;
}

/// Create Int256 from u128 (always fits)
pub fn fromU128(value: u128) Int256 {
    return value;
}

/// Create Int256 from u256 numeric value, checking bounds
pub fn fromU256(value: u256) error{Overflow}!Int256 {
    if (value > MAX) return error.Overflow;
    return @intCast(value);
}

/// Reinterpret a 256-bit EVM word as a two's complement Int256
pub fn fromWord(word: u256) Int256 {
    return @bitCast(word);
}

/// Create Int256 from bytes (big-endian, two's complement)
pub fn fromBytes(bytes: [32]u8) Int256 {
    return @bitCast(std.mem.readInt(u256, &bytes, .big));
}

/// Create Int256 from hex string (two's complement, optional 0x prefix)
pub fn fromHex(hex: []const u8) error{ InvalidHex, Overflow }!Int256 {
    const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
    const clean = hex[start..];

    if (clean.len == 0) return 0;
    if (clean.len > 64) return error.Overflow;

    var result: u256 = 0;
    for (clean) |c| {
        const digit: u256 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return error.InvalidHex,
        };
        result = (result << 4) | digit;
    }

    return @bitCast(result);
}

// ============================================================================
// Conversions
// ============================================================================

/// Convert Int256 to i256 (identity)
pub fn toNumber(value: Int256) i256 {
    return value;
}

/// Convert Int256 to i64 (fails if out of range)
pub fn toI64(value: Int256) error{Overflow}!i64 {
    return std.math.cast(i64, value) orelse error.Overflow;
}

/// Convert Int256 to i128 (fails if out of range)
pub fn toI128(value: Int256) error{Overflow}!i128 {
    return std.math.cast(i128, value) orelse error.Overflow;
}

/// Reinterpret Int256 as a 256-bit EVM word (two's complement)
pub fn toWord(value: Int256) u256 {
    return @bitCast(value);
}

/// Convert Int256 to bytes (big-endian, two's complement)
pub fn toBytes(value: Int256) [32]u8 {
    var result: [32]u8 = undefined;
    std.mem.writeInt(u256, &result, @bitCast(value), .big);
    return result;
}

/// Convert Int256 to hex string with 0x prefix (two's complement, 64 digits)
pub fn toHex(value: Int256) [66]u8 {
    const unsigned: u256 = @bitCast(value);
    const hex_chars = "0123456789abcdef";
    var result: [66]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';
    inline for (0..64) |i| {
        const shift: u8 = @intCast((63 - i) * 4);
        result[i + 2] = hex_chars[@as(u4, @truncate(unsigned >> shift))];
    }
    return result;
}

// ============================================================================
// Arithmetic Operations (checked)
// ============================================================================

/// Add two Int256 values with overflow checking
pub fn add(a: Int256, b: Int256) error{Overflow}!Int256 {
    return std.math.add(i256, a, b);
}

/// Subtract two Int256 values with overflow checking
pub fn sub(a: Int256, b: Int256) error{Overflow}!Int256 {
    return std.math.sub(i256, a, b);
}

/// Multiply two Int256 values with overflow checking
pub fn mul(a: Int256, b: Int256) error{Overflow}!Int256 {
    return std.math.mul(i256, a, b);
}

/// Divide two Int256 values (truncates toward zero)
pub fn div(a: Int256, b: Int256) error{ DivisionByZero, Overflow }!Int256 {
    if (b == 0) return error.DivisionByZero;
    if (a == MIN and b == -1) return error.Overflow;
    return @divTrunc(a, b);
}

/// Remainder after truncating division (sign follows dividend)
pub fn mod(a: Int256, b: Int256) error{DivisionByZero}!Int256 {
    if (b == 0) return error.DivisionByZero;
    // @rem(MIN, -1) is 0 mathematically but traps in Zig; handle explicitly.
    if (b == -1) return 0;
    return @rem(a, b);
}

/// Negate an Int256 value
pub fn negate(value: Int256) error{Overflow}!Int256 {
    if (value == MIN) return error.Overflow;
    return -value;
}

/// Absolute value of Int256
pub fn abs(value: Int256) error{Overflow}!Int256 {
    if (value == MIN) return error.Overflow;
    return if (value < 0) -value else value;
}

// ============================================================================
// Arithmetic Operations (TypeScript Int256 API names)
// ============================================================================

/// Wrapping addition (mod 2^256)
pub fn plus(a: Int256, b: Int256) Int256 {
    return a +% b;
}

/// Wrapping subtraction (mod 2^256)
pub fn minus(a: Int256, b: Int256) Int256 {
    return a -% b;
}

/// Wrapping multiplication (mod 2^256)
pub fn times(a: Int256, b: Int256) Int256 {
    return a *% b;
}

/// Signed division, EVM SDIV semantics (truncate toward zero)
pub fn dividedBy(a: Int256, b: Int256) error{ DivisionByZero, Overflow }!Int256 {
    return div(a, b);
}

/// Signed remainder, EVM SMOD semantics (sign follows dividend)
pub fn modulo(a: Int256, b: Int256) error{DivisionByZero}!Int256 {
    return mod(a, b);
}

// ============================================================================
// Comparison Operations
// ============================================================================

/// Check equality of two Int256 values
pub fn equals(a: Int256, b: Int256) bool {
    return a == b;
}

/// Compare two Int256 values: returns -1, 0, or 1
pub fn compare(a: Int256, b: Int256) i2 {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/// Check if a < b (signed, EVM SLT)
pub fn lessThan(a: Int256, b: Int256) bool {
    return a < b;
}

/// Check if a > b (signed, EVM SGT)
pub fn greaterThan(a: Int256, b: Int256) bool {
    return a > b;
}

/// Check if value is zero
pub fn isZero(value: Int256) bool {
    return value == 0;
}

/// Check if value is negative
pub fn isNegative(value: Int256) bool {
    return value < 0;
}

/// Check if value is positive
pub fn isPositive(value: Int256) bool {
    return value > 0;
}

/// Return minimum of two values
pub fn min(a: Int256, b: Int256) Int256 {
    return @min(a, b);
}

/// Return maximum of two values
pub fn max(a: Int256, b: Int256) Int256 {
    return @max(a, b);
}

/// Return sign: -1, 0, or 1
pub fn sign(value: Int256) i2 {
    if (value < 0) return -1;
    if (value > 0) return 1;
    return 0;
}

// ============================================================================
// Bitwise Operations
// ============================================================================

/// Bitwise AND
pub fn bitwiseAnd(a: Int256, b: Int256) Int256 {
    return a & b;
}

/// Bitwise OR
pub fn bitwiseOr(a: Int256, b: Int256) Int256 {
    return a | b;
}

/// Bitwise XOR
pub fn bitwiseXor(a: Int256, b: Int256) Int256 {
    return a ^ b;
}

/// Bitwise NOT
pub fn bitwiseNot(value: Int256) Int256 {
    return ~value;
}

/// Shift left; bits shifted past 256 are discarded. Shifts >= 256 return 0.
pub fn shiftLeft(value: Int256, shift: u16) Int256 {
    if (shift >= BITS) return 0;
    const unsigned: u256 = @bitCast(value);
    return @bitCast(unsigned << @intCast(shift));
}

/// Arithmetic shift right (sign-extending, EVM SAR).
/// Shifts >= 256 return -1 for negative values and 0 otherwise.
pub fn shiftRight(value: Int256, shift: u16) Int256 {
    if (shift >= BITS) return if (value < 0) -1 else 0;
    return value >> @intCast(shift);
}

// ============================================================================
// Utility Functions
// ============================================================================

/// Count leading zeros (on unsigned representation)
pub fn leadingZeros(value: Int256) u16 {
    const unsigned: u256 = @bitCast(value);
    return @clz(unsigned);
}

/// Count trailing zeros
pub fn trailingZeros(value: Int256) u16 {
    const unsigned: u256 = @bitCast(value);
    return @ctz(unsigned);
}

/// Count number of set bits (population count)
pub fn popCount(value: Int256) u16 {
    const unsigned: u256 = @bitCast(value);
    return @popCount(unsigned);
}

/// Get bit length of the unsigned two's complement representation
pub fn bitLength(value: Int256) u16 {
    const unsigned: u256 = @bitCast(value);
    return BITS - @clz(unsigned);
}

// ============================================================================
// Tests
// ============================================================================

const testing = std.testing;

test "Int256: constants" {
    try testing.expectEqual(MIN, std.math.minInt(i256));
    try testing.expectEqual(MAX, std.math.maxInt(i256));
    try testing.expectEqual(@as(Int256, 0), ZERO);
    try testing.expectEqual(@as(Int256, 1), ONE);
    try testing.expectEqual(@as(Int256, -1), MINUS_ONE);
    try testing.expectEqual(@as(usize, 32), SIZE);
    try testing.expectEqual(@as(u16, 256), BITS);
    // MAX = 2^255 - 1
    try testing.expectEqual(@as(u256, 1) << 255, @as(u256, @intCast(MAX)) + 1);
}

fn hexToBytes(comptime hex: []const u8) [32]u8 {
    var out: [32]u8 = undefined;
    _ = std.fmt.hexToBytes(&out, hex) catch unreachable;
    return out;
}

test "Int256: widening constructors" {
    try testing.expectEqual(@as(Int256, -128), fromI8(-128));
    try testing.expectEqual(@as(Int256, -32768), fromI16(-32768));
    try testing.expectEqual(@as(Int256, -2147483648), fromI32(-2147483648));
    try testing.expectEqual(@as(Int256, std.math.minInt(i64)), fromI64(std.math.minInt(i64)));
    try testing.expectEqual(@as(Int256, std.math.minInt(i128)), fromI128(std.math.minInt(i128)));
    try testing.expectEqual(@as(Int256, 255), fromU8(255));
    try testing.expectEqual(@as(Int256, 65535), fromU16(65535));
    try testing.expectEqual(@as(Int256, 4294967295), fromU32(4294967295));
    try testing.expectEqual(@as(Int256, std.math.maxInt(u64)), fromU64(std.math.maxInt(u64)));
    try testing.expectEqual(@as(Int256, std.math.maxInt(u128)), fromU128(std.math.maxInt(u128)));
}

test "Int256: fromU256" {
    try testing.expectEqual(@as(Int256, 0), try fromU256(0));
    try testing.expectEqual(MAX, try fromU256(@intCast(MAX)));
    try testing.expectError(error.Overflow, fromU256(@as(u256, @intCast(MAX)) + 1));
    try testing.expectError(error.Overflow, fromU256(std.math.maxInt(u256)));
}

test "Int256: fromWord and toWord (two's complement)" {
    try testing.expectEqual(@as(Int256, -1), fromWord(std.math.maxInt(u256)));
    try testing.expectEqual(MIN, fromWord(@as(u256, 1) << 255));
    try testing.expectEqual(MAX, fromWord((@as(u256, 1) << 255) - 1));
    try testing.expectEqual(@as(u256, std.math.maxInt(u256)), toWord(-1));
    try testing.expectEqual(@as(u256, 1) << 255, toWord(MIN));
    try testing.expectEqual(@as(u256, 42), toWord(42));
}

test "Int256: fromBytes" {
    try testing.expectEqual(@as(Int256, 0), fromBytes(@as([32]u8, @splat(0))));
    try testing.expectEqual(@as(Int256, 1), fromBytes(hexToBytes("0000000000000000000000000000000000000000000000000000000000000001")));
    try testing.expectEqual(MAX, fromBytes(hexToBytes("7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")));
    try testing.expectEqual(MIN, fromBytes(hexToBytes("8000000000000000000000000000000000000000000000000000000000000000")));
    try testing.expectEqual(@as(Int256, -1), fromBytes(@as([32]u8, @splat(0xff))));
    try testing.expectEqual(@as(Int256, -2), fromBytes(hexToBytes("fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe")));
}

test "Int256: fromHex" {
    try testing.expectEqual(@as(Int256, 0), try fromHex("0x0000000000000000000000000000000000000000000000000000000000000000"));
    try testing.expectEqual(MAX, try fromHex("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
    try testing.expectEqual(MIN, try fromHex("0x8000000000000000000000000000000000000000000000000000000000000000"));
    try testing.expectEqual(@as(Int256, -1), try fromHex("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
    try testing.expectEqual(@as(Int256, -1), try fromHex("0XFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));
    try testing.expectEqual(@as(Int256, 0), try fromHex(""));
    try testing.expectEqual(@as(Int256, 0), try fromHex("0x"));
    try testing.expectEqual(@as(Int256, 15), try fromHex("f"));
    try testing.expectEqual(@as(Int256, 0xdeadbeef), try fromHex("0xDeadBeef"));
    try testing.expectError(error.InvalidHex, fromHex("0xggggg"));
    try testing.expectError(error.Overflow, fromHex("0x10000000000000000000000000000000000000000000000000000000000000000"));
}

test "Int256: toI64 and toI128" {
    try testing.expectEqual(@as(i64, std.math.maxInt(i64)), try toI64(std.math.maxInt(i64)));
    try testing.expectEqual(@as(i64, std.math.minInt(i64)), try toI64(std.math.minInt(i64)));
    try testing.expectError(error.Overflow, toI64(@as(Int256, std.math.maxInt(i64)) + 1));
    try testing.expectError(error.Overflow, toI64(@as(Int256, std.math.minInt(i64)) - 1));
    try testing.expectEqual(@as(i128, std.math.minInt(i128)), try toI128(std.math.minInt(i128)));
    try testing.expectError(error.Overflow, toI128(@as(Int256, std.math.maxInt(i128)) + 1));
    try testing.expectError(error.Overflow, toI128(MIN));
    try testing.expectEqual(@as(i256, -7), toNumber(from(-7)));
}

test "Int256: toBytes" {
    try testing.expectEqual(@as([32]u8, @splat(0)), toBytes(0));
    try testing.expectEqual(hexToBytes("7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), toBytes(MAX));
    try testing.expectEqual(hexToBytes("8000000000000000000000000000000000000000000000000000000000000000"), toBytes(MIN));
    try testing.expectEqual(@as([32]u8, @splat(0xff)), toBytes(-1));
    try testing.expectEqual(hexToBytes("0000000000000000000000000000000000000000000000000000000000000100"), toBytes(256));
}

test "Int256: toHex" {
    try testing.expectEqualStrings("0x0000000000000000000000000000000000000000000000000000000000000000", &toHex(0));
    try testing.expectEqualStrings("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", &toHex(MAX));
    try testing.expectEqualStrings("0x8000000000000000000000000000000000000000000000000000000000000000", &toHex(MIN));
    try testing.expectEqualStrings("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", &toHex(-1));
    try testing.expectEqualStrings("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9c", &toHex(-100));
}

test "Int256: add" {
    try testing.expectEqual(@as(Int256, 3), try add(1, 2));
    try testing.expectEqual(@as(Int256, -1), try add(1, -2));
    try testing.expectEqual(@as(Int256, -1), try add(MIN, MAX));
    try testing.expectError(error.Overflow, add(MAX, 1));
    try testing.expectError(error.Overflow, add(MIN, -1));
}

test "Int256: sub" {
    try testing.expectEqual(@as(Int256, -1), try sub(1, 2));
    try testing.expectEqual(@as(Int256, 3), try sub(1, -2));
    try testing.expectError(error.Overflow, sub(MIN, 1));
    try testing.expectError(error.Overflow, sub(MAX, -1));
    try testing.expectError(error.Overflow, sub(0, MIN));
}

test "Int256: mul" {
    try testing.expectEqual(@as(Int256, 200000000000), try mul(400000, 500000));
    try testing.expectEqual(@as(Int256, -200000000000), try mul(400000, -500000));
    try testing.expectEqual(@as(Int256, 200000000000), try mul(-400000, -500000));
    try testing.expectEqual(MIN, try mul(@as(Int256, 1) << 254, -2));
    try testing.expectError(error.Overflow, mul(MAX, 2));
    try testing.expectError(error.Overflow, mul(MIN, -1));
    try testing.expectError(error.Overflow, mul(@as(Int256, 1) << 254, 2));
}

test "Int256: div (truncates toward zero)" {
    try testing.expectEqual(@as(Int256, 5), try div(200, 40));
    try testing.expectEqual(@as(Int256, -5), try div(200, -40));
    try testing.expectEqual(@as(Int256, 5), try div(-200, -40));
    try testing.expectEqual(@as(Int256, 2), try div(7, 3));
    try testing.expectEqual(@as(Int256, -2), try div(-7, 3));
    try testing.expectEqual(@as(Int256, -2), try div(7, -3));
    try testing.expectEqual(MIN, try div(MIN, 1));
    try testing.expectError(error.DivisionByZero, div(100, 0));
    try testing.expectError(error.Overflow, div(MIN, -1));
}

test "Int256: mod (sign follows dividend)" {
    try testing.expectEqual(@as(Int256, 1), try mod(7, 3));
    try testing.expectEqual(@as(Int256, -1), try mod(-7, 3));
    try testing.expectEqual(@as(Int256, 1), try mod(7, -3));
    try testing.expectEqual(@as(Int256, -1), try mod(-7, -3));
    try testing.expectEqual(@as(Int256, 0), try mod(9, 3));
    try testing.expectEqual(@as(Int256, 0), try mod(MIN, -1));
    try testing.expectEqual(@as(Int256, -1), try mod(MIN, MAX));
    try testing.expectError(error.DivisionByZero, mod(100, 0));
}

test "Int256: negate and abs" {
    try testing.expectEqual(@as(Int256, -5), try negate(5));
    try testing.expectEqual(@as(Int256, 5), try negate(-5));
    try testing.expectEqual(@as(Int256, 0), try negate(0));
    try testing.expectEqual(-MAX, try negate(MAX));
    try testing.expectError(error.Overflow, negate(MIN));
    try testing.expectEqual(@as(Int256, 5), try abs(-5));
    try testing.expectEqual(@as(Int256, 5), try abs(5));
    try testing.expectEqual(MAX, try abs(-MAX));
    try testing.expectError(error.Overflow, abs(MIN));
}

test "Int256: plus, minus, times wrap mod 2^256" {
    try testing.expectEqual(@as(Int256, 3), plus(1, 2));
    try testing.expectEqual(MIN, plus(MAX, 1));
    try testing.expectEqual(MAX, plus(MIN, -1));
    try testing.expectEqual(@as(Int256, -1), minus(1, 2));
    try testing.expectEqual(MAX, minus(MIN, 1));
    try testing.expectEqual(MIN, minus(MAX, -1));
    try testing.expectEqual(@as(Int256, -6), times(2, -3));
    try testing.expectEqual(@as(Int256, -2), times(MAX, 2));
    try testing.expectEqual(MIN, times(MIN, -1));
}

test "Int256: dividedBy and modulo (EVM SDIV/SMOD)" {
    try testing.expectEqual(@as(Int256, -2), try dividedBy(-7, 3));
    try testing.expectError(error.DivisionByZero, dividedBy(1, 0));
    try testing.expectError(error.Overflow, dividedBy(MIN, -1));
    try testing.expectEqual(@as(Int256, -1), try modulo(-7, 3));
    try testing.expectEqual(@as(Int256, 0), try modulo(MIN, -1));
    try testing.expectError(error.DivisionByZero, modulo(1, 0));
}

test "Int256: comparisons are signed" {
    try testing.expect(equals(MIN, MIN));
    try testing.expect(!equals(1, -1));
    try testing.expectEqual(@as(i2, 0), compare(5, 5));
    try testing.expectEqual(@as(i2, -1), compare(MIN, MAX));
    try testing.expectEqual(@as(i2, 1), compare(MAX, MIN));
    // -1 is 0xff..ff as a word, but must compare less than 0 (EVM SLT)
    try testing.expect(lessThan(-1, 0));
    try testing.expect(lessThan(MIN, 0));
    try testing.expect(!lessThan(0, -1));
    try testing.expect(greaterThan(0, -1));
    try testing.expect(greaterThan(MAX, MIN));
    try testing.expect(!greaterThan(5, 5));
}

test "Int256: isZero, isNegative, isPositive, sign" {
    try testing.expect(isZero(0));
    try testing.expect(!isZero(-1));
    try testing.expect(isNegative(MIN));
    try testing.expect(!isNegative(0));
    try testing.expect(isPositive(MAX));
    try testing.expect(!isPositive(0));
    try testing.expectEqual(@as(i2, 0), sign(0));
    try testing.expectEqual(@as(i2, 1), sign(MAX));
    try testing.expectEqual(@as(i2, -1), sign(MIN));
}

test "Int256: min and max" {
    try testing.expectEqual(@as(Int256, -2000), min(-1000, -2000));
    try testing.expectEqual(MIN, min(MIN, MAX));
    try testing.expectEqual(@as(Int256, -1000), max(-1000, -2000));
    try testing.expectEqual(MAX, max(MIN, MAX));
}

test "Int256: bitwise" {
    try testing.expectEqual(@as(Int256, 0b0100), bitwiseAnd(0b1100, 0b0110));
    try testing.expectEqual(MIN, bitwiseAnd(-1, MIN));
    try testing.expectEqual(@as(Int256, 0b1110), bitwiseOr(0b1100, 0b0110));
    try testing.expectEqual(@as(Int256, 0b1010), bitwiseXor(0b1100, 0b0110));
    try testing.expectEqual(@as(Int256, -1), bitwiseNot(0));
    try testing.expectEqual(MIN, bitwiseNot(MAX));
}

test "Int256: shiftLeft" {
    try testing.expectEqual(@as(Int256, 8), shiftLeft(1, 3));
    try testing.expectEqual(@as(Int256, -8), shiftLeft(-1, 3));
    try testing.expectEqual(MIN, shiftLeft(1, 255));
    try testing.expectEqual(@as(Int256, -2), shiftLeft(MAX, 1));
    try testing.expectEqual(@as(Int256, 0), shiftLeft(-1, 256));
    try testing.expectEqual(@as(Int256, 0), shiftLeft(1, 1000));
}

test "Int256: shiftRight (EVM SAR)" {
    try testing.expectEqual(@as(Int256, 1), shiftRight(8, 3));
    try testing.expectEqual(@as(Int256, -1), shiftRight(-1, 3));
    try testing.expectEqual(@as(Int256, -2), shiftRight(-8, 2));
    try testing.expectEqual(@as(Int256, -1), shiftRight(MIN, 255));
    try testing.expectEqual(@as(Int256, 0), shiftRight(MAX, 255));
    try testing.expectEqual(@as(Int256, -1), shiftRight(MIN, 256));
    try testing.expectEqual(@as(Int256, 0), shiftRight(MAX, 256));
    try testing.expectEqual(@as(Int256, -1), shiftRight(-5, 1000));
}

test "Int256: bit counting" {
    try testing.expectEqual(@as(u16, 256), leadingZeros(0));
    try testing.expectEqual(@as(u16, 255), leadingZeros(1));
    try testing.expectEqual(@as(u16, 1), leadingZeros(MAX));
    try testing.expectEqual(@as(u16, 0), leadingZeros(-1));
    try testing.expectEqual(@as(u16, 256), trailingZeros(0));
    try testing.expectEqual(@as(u16, 255), trailingZeros(MIN));
    try testing.expectEqual(@as(u16, 256), popCount(-1));
    try testing.expectEqual(@as(u16, 255), popCount(MAX));
    try testing.expectEqual(@as(u16, 0), bitLength(0));
    try testing.expectEqual(@as(u16, 255), bitLength(MAX));
    try testing.expectEqual(@as(u16, 256), bitLength(-1));
}

test "Int256: roundtrip bytes, hex, word" {
    const values = [_]Int256{ MIN, MIN + 1, -(@as(Int256, 1) << 200), -1, 0, 1, @as(Int256, 1) << 200, MAX - 1, MAX };
    for (values) |v| {
        try testing.expectEqual(v, fromBytes(toBytes(v)));
        const hex = toHex(v);
        try testing.expectEqual(v, try fromHex(&hex));
        try testing.expectEqual(v, fromWord(toWord(v)));
    }
}
