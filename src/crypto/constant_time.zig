//! Constant-Time Cryptographic Operations
//!
//! This module provides constant-time comparison and selection operations
//! to prevent timing side-channel attacks in cryptographic code.
//!
//! ## Security Rationale
//! Standard comparison operators (`==`, `!=`, `<`, `>`) can leak information
//! through timing differences because they use short-circuit evaluation.
//! When comparing secret cryptographic material (private keys, signature
//! components, intermediate points), attackers can measure response times
//! to deduce secret values bit-by-bit.
//!
//! ## Operations
//! - `constantTimeEqU256`: Constant-time equality for u256 values
//! - `constantTimeEqBytes`: Constant-time equality for byte arrays
//! - `constantTimeLteU256`: Constant-time less-than-or-equal for u256
//! - `constantTimeSelect`: Constant-time conditional select
//! - `constantTimeIsZeroU256`: Constant-time zero check for u256
//! - `constantTimeIsZeroBytes`: Constant-time zero check for byte arrays
//!
//! ## Usage
//! ```zig
//! const ct = @import("constant_time.zig");
//!
//! // Instead of: if (r == 0 or r >= SECP256K1_N) return false;
//! const r_is_zero = ct.constantTimeIsZeroU256(r);
//! const r_too_large = ct.constantTimeLteU256(SECP256K1_N, r);
//! if (r_is_zero | r_too_large != 0) return false;
//! ```
//!
//! ## References
//! - [Constant-Time Cryptography](https://www.bearssl.org/constanttime.html)
//! - [Timing Attacks on Implementations](https://www.paulkocher.com/doc/TimingAttacks.pdf)

const std = @import("std");
const builtin = @import("builtin");

/// Constant-time equality check for u256 values.
/// Returns 1 if equal, 0 if not equal.
/// Executes in constant time regardless of input values.
pub fn constantTimeEqU256(a: u256, b: u256) u8 {
    // On wasm targets, avoid potential miscompilation of wide shifts/truncations by
    // comparing big-endian byte representations in constant time.
    if (builtin.target.cpu.arch == .wasm32 or builtin.target.cpu.arch == .wasm64) {
        var abuf: [32]u8 = undefined;
        var bbuf: [32]u8 = undefined;
        std.mem.writeInt(u256, &abuf, a, .big);
        std.mem.writeInt(u256, &bbuf, b, .big);
        return @intFromBool(constantTimeEqBytes(&abuf, &bbuf));
    }

    // Default implementation for non-wasm targets using XOR-folding.
    const diff: u256 = a ^ b;
    const folded: u64 = @as(u64, @truncate(diff)) |
        @as(u64, @truncate(diff >> 64)) |
        @as(u64, @truncate(diff >> 128)) |
        @as(u64, @truncate(diff >> 192));
    const r32: u32 = @truncate(folded | (folded >> 32));
    const r16: u16 = @truncate(r32 | (r32 >> 16));
    const r8: u8 = @truncate(r16 | (r16 >> 8));
    return @intFromBool(r8 == 0);
}

/// Constant-time zero check for u256.
/// Returns 1 if zero, 0 if non-zero.
pub fn constantTimeIsZeroU256(a: u256) u8 {
    return constantTimeEqU256(a, 0);
}

/// Constant-time less-than-or-equal comparison for u256.
/// Returns 1 if a <= b, 0 if a > b.
/// Executes in constant time regardless of input values.
pub fn constantTimeLteU256(a: u256, b: u256) u8 {
    // For constant-time comparison, we check: a <= b iff (b - a) doesn't underflow
    // When a > b, (b - a) wraps around (underflows), setting high bit in intermediate
    //
    // We use the fact that for unsigned integers:
    // a <= b <=> NOT(a > b) <=> NOT((a - b - 1) has no borrow)
    //
    // Alternative approach: use widening subtraction
    // If a > b, then a - b > 0, and b - a wraps to a large positive number

    // The "borrow" occurs when a > b. In 2's complement:
    // If a > b, then diff = b - a wraps to (2^256 + b - a), which is >= 2^255 when a - b >= 1
    // Actually, we need to detect if a > b more carefully.

    // Use the following approach:
    // a <= b iff (a XOR ((a XOR b) OR (a - b) XOR a)) has high bit set when a > b
    // This is based on the "constant-time compare" trick from BearSSL

    // Simpler approach: Check if (a ^ b) high bit differs and who's larger, or if equal prefix, check subtraction
    // For safety, use multi-word approach

    // Split into high and low 128-bit parts
    const a_hi: u128 = @truncate(a >> 128);
    const a_lo: u128 = @truncate(a);
    const b_hi: u128 = @truncate(b >> 128);
    const b_lo: u128 = @truncate(b);

    // Compare high parts first
    const hi_eq = constantTimeEqU128(a_hi, b_hi);
    const hi_lt = constantTimeLtU128(a_hi, b_hi);

    // Compare low parts
    const lo_lte = constantTimeLteU128(a_lo, b_lo);

    // a <= b iff (a_hi < b_hi) OR (a_hi == b_hi AND a_lo <= b_lo)
    return hi_lt | (hi_eq & lo_lte);
}

/// Constant-time less-than comparison for u256.
/// Returns 1 if a < b, 0 if a >= b.
pub fn constantTimeLtU256(a: u256, b: u256) u8 {
    // a < b iff NOT(b <= a)
    return 1 - constantTimeLteU256(b, a);
}

/// Constant-time greater-than-or-equal comparison for u256.
/// Returns 1 if a >= b, 0 if a < b.
pub fn constantTimeGteU256(a: u256, b: u256) u8 {
    return constantTimeLteU256(b, a);
}

/// Constant-time equality check for u128 values.
fn constantTimeEqU128(a: u128, b: u128) u8 {
    const diff: u128 = a ^ b;
    const folded: u64 = @truncate(diff | (diff >> 64));
    const r32: u32 = @truncate(folded | (folded >> 32));
    const r16: u16 = @truncate(r32 | (r32 >> 16));
    const r8: u8 = @truncate(r16 | (r16 >> 8));
    return @intFromBool(r8 == 0);
}

/// Constant-time less-than comparison for u128.
fn constantTimeLtU128(a: u128, b: u128) u8 {
    // Split into 64-bit parts
    const a_hi: u64 = @truncate(a >> 64);
    const a_lo: u64 = @truncate(a);
    const b_hi: u64 = @truncate(b >> 64);
    const b_lo: u64 = @truncate(b);

    const hi_eq = constantTimeEqU64(a_hi, b_hi);
    const hi_lt = constantTimeLtU64(a_hi, b_hi);
    const lo_lt = constantTimeLtU64(a_lo, b_lo);

    return hi_lt | (hi_eq & lo_lt);
}

/// Constant-time less-than-or-equal for u128.
fn constantTimeLteU128(a: u128, b: u128) u8 {
    const a_hi: u64 = @truncate(a >> 64);
    const a_lo: u64 = @truncate(a);
    const b_hi: u64 = @truncate(b >> 64);
    const b_lo: u64 = @truncate(b);

    const hi_eq = constantTimeEqU64(a_hi, b_hi);
    const hi_lt = constantTimeLtU64(a_hi, b_hi);
    const lo_lte = constantTimeLteU64(a_lo, b_lo);

    return hi_lt | (hi_eq & lo_lte);
}

/// Constant-time equality for u64.
fn constantTimeEqU64(a: u64, b: u64) u8 {
    const diff: u64 = a ^ b;
    const r32: u32 = @truncate(diff | (diff >> 32));
    const r16: u16 = @truncate(r32 | (r32 >> 16));
    const r8: u8 = @truncate(r16 | (r16 >> 8));
    return @intFromBool(r8 == 0);
}

/// Constant-time less-than for u64.
/// Uses the standard constant-time comparison technique.
fn constantTimeLtU64(a: u64, b: u64) u8 {
    // The key insight: for 64-bit unsigned integers, a < b iff
    // the high bit of (a - b) XOR ((a XOR b) AND ((a - b) XOR a)) is set when a < b
    // This is from Hacker's Delight / BearSSL constant-time comparisons

    const x = a -% b;
    // When a < b, subtraction wraps, and we detect via high bit analysis
    const y = a ^ b;
    const z = x ^ a;
    const q = y & z;
    const r = x ^ q;
    // High bit of r is set when a < b
    return @truncate(r >> 63);
}

/// Constant-time less-than-or-equal for u64.
fn constantTimeLteU64(a: u64, b: u64) u8 {
    // a <= b iff NOT(b < a)
    return 1 - constantTimeLtU64(b, a);
}

/// Constant-time conditional select for u256.
/// Returns if_one if condition == 1, else if_zero.
/// condition MUST be 0 or 1.
pub fn constantTimeSelectU256(condition: u8, if_one: u256, if_zero: u256) u256 {
    // Create mask: 0 if condition is 0, all 1s if condition is 1
    const mask: u256 = @as(u256, 0) -% @as(u256, condition);
    return (if_one & mask) | (if_zero & ~mask);
}

/// Constant-time equality check for byte arrays.
/// Returns true if equal, false if not equal.
/// Executes in constant time regardless of where arrays differ.
pub fn constantTimeEqBytes(a: []const u8, b: []const u8) bool {
    if (a.len != b.len) return false;

    var diff: u8 = 0;
    for (a, b) |byte_a, byte_b| {
        diff |= byte_a ^ byte_b;
    }

    return diff == 0;
}

/// Constant-time zero check for byte arrays.
/// Returns true if all bytes are zero, false otherwise.
/// Executes in constant time regardless of content.
pub fn constantTimeIsZeroBytes(bytes: []const u8) bool {
    var acc: u8 = 0;
    for (bytes) |byte| {
        acc |= byte;
    }
    return acc == 0;
}

// ============================================================================
// Conditional Operations
// ============================================================================

/// Constant-time conditional swap for u256.
/// Swaps a and b if condition == 1, does nothing if condition == 0.
/// condition MUST be 0 or 1.
pub fn constantTimeSwapU256(condition: u8, a: *u256, b: *u256) void {
    const mask: u256 = @as(u256, 0) -% @as(u256, condition);
    const diff = (a.* ^ b.*) & mask;
    a.* ^= diff;
    b.* ^= diff;
}

/// Constant-time conditional addition for u256.
/// Returns a + b if condition == 1, else a.
/// condition MUST be 0 or 1.
/// Note: Uses wrapping addition. Caller must ensure no overflow if needed.
pub fn constantTimeAddU256(condition: u8, a: u256, b: u256) u256 {
    const masked_b = b & (@as(u256, 0) -% @as(u256, condition));
    return a +% masked_b;
}

/// Constant-time conditional subtraction for u256.
/// Returns a - b if condition == 1, else a.
/// condition MUST be 0 or 1.
/// Note: Uses wrapping subtraction.
pub fn constantTimeSubU256(condition: u8, a: u256, b: u256) u256 {
    const masked_b = b & (@as(u256, 0) -% @as(u256, condition));
    return a -% masked_b;
}

/// Constant-time greater-than comparison for u256.
/// Returns 1 if a > b, 0 if a <= b.
pub fn constantTimeGtU256(a: u256, b: u256) u8 {
    return constantTimeLtU256(b, a);
}

/// Constant-time is-nonzero check for u256.
/// Returns 1 if value is not 0, 0 otherwise.
pub fn constantTimeIsNonzeroU256(value: u256) u8 {
    return 1 - constantTimeIsZeroU256(value);
}

// ============================================================================
// Byte Array Operations
// ============================================================================

/// Constant-time conditional swap for byte arrays.
/// Swaps contents of a and b if condition == 1.
pub fn constantTimeSwapBytes(comptime N: usize, condition: u8, a: *[N]u8, b: *[N]u8) void {
    const mask: u8 = 0 -% condition;
    for (a, b) |*byte_a, *byte_b| {
        const diff = (byte_a.* ^ byte_b.*) & mask;
        byte_a.* ^= diff;
        byte_b.* ^= diff;
    }
}

/// Constant-time conditional copy for byte arrays.
/// Copies src to dst if condition == 1, does nothing if condition == 0.
pub fn constantTimeCopyBytes(comptime N: usize, condition: u8, dst: *[N]u8, src: *const [N]u8) void {
    const mask: u8 = 0 -% condition;
    for (dst, src) |*d, s| {
        d.* = (d.* & ~mask) | (s & mask);
    }
}

/// Secure memory zeroing that cannot be optimized away.
/// Uses a memory fence to prevent compiler optimizations.
pub fn secureZero(comptime N: usize, buf: *[N]u8) void {
    @memset(buf, 0);
    std.atomic.fence(.seq_cst);
}

/// Secure memory zeroing for slices.
pub fn secureZeroSlice(buf: []u8) void {
    @memset(buf, 0);
    std.atomic.fence(.seq_cst);
}

// ============================================================================
// Boolean Logic Helpers
// ============================================================================

/// Constant-time AND for condition bytes (0 or 1).
/// Returns 1 if both a and b are 1, 0 otherwise.
pub fn constantTimeAnd(a: u8, b: u8) u8 {
    return a & b;
}

/// Constant-time OR for condition bytes (0 or 1).
/// Returns 1 if either a or b is 1, 0 otherwise.
pub fn constantTimeOr(a: u8, b: u8) u8 {
    return a | b;
}

/// Constant-time NOT for condition byte (0 or 1).
/// Returns 1 if a is 0, 0 if a is 1.
pub fn constantTimeNot(a: u8) u8 {
    return 1 -% a;
}

/// Constant-time XOR for condition bytes (0 or 1).
/// Returns 1 if exactly one of a or b is 1, 0 otherwise.
pub fn constantTimeXor(a: u8, b: u8) u8 {
    return a ^ b;
}

// ============================================================================
// Tests
// ============================================================================

test "constantTimeEqU256: equal values" {
    const a: u256 = 0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0;
    try std.testing.expectEqual(@as(u8, 1), constantTimeEqU256(a, a));
}

test "constantTimeEqU256: different values" {
    const a: u256 = 0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0;
    const b: u256 = 0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef1;
    try std.testing.expectEqual(@as(u8, 0), constantTimeEqU256(a, b));
}

test "constantTimeEqU256: zero values" {
    try std.testing.expectEqual(@as(u8, 1), constantTimeEqU256(0, 0));
}

test "constantTimeEqU256: max values" {
    const max: u256 = std.math.maxInt(u256);
    try std.testing.expectEqual(@as(u8, 1), constantTimeEqU256(max, max));
    try std.testing.expectEqual(@as(u8, 0), constantTimeEqU256(max, max - 1));
}

test "constantTimeIsZeroU256: zero" {
    try std.testing.expectEqual(@as(u8, 1), constantTimeIsZeroU256(0));
}

test "constantTimeIsZeroU256: non-zero" {
    try std.testing.expectEqual(@as(u8, 0), constantTimeIsZeroU256(1));
    try std.testing.expectEqual(@as(u8, 0), constantTimeIsZeroU256(std.math.maxInt(u256)));
}

test "constantTimeLteU256: basic comparisons" {
    try std.testing.expectEqual(@as(u8, 1), constantTimeLteU256(0, 1));
    try std.testing.expectEqual(@as(u8, 1), constantTimeLteU256(1, 1));
    try std.testing.expectEqual(@as(u8, 0), constantTimeLteU256(2, 1));
}

test "constantTimeLteU256: large values" {
    const a: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140;
    const b: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
    try std.testing.expectEqual(@as(u8, 1), constantTimeLteU256(a, b)); // a < b
    try std.testing.expectEqual(@as(u8, 1), constantTimeLteU256(b, b)); // b == b
    try std.testing.expectEqual(@as(u8, 0), constantTimeLteU256(b, a)); // b > a
}

test "constantTimeLtU256: basic comparisons" {
    try std.testing.expectEqual(@as(u8, 1), constantTimeLtU256(0, 1));
    try std.testing.expectEqual(@as(u8, 0), constantTimeLtU256(1, 1));
    try std.testing.expectEqual(@as(u8, 0), constantTimeLtU256(2, 1));
}

test "constantTimeGteU256: basic comparisons" {
    try std.testing.expectEqual(@as(u8, 0), constantTimeGteU256(0, 1));
    try std.testing.expectEqual(@as(u8, 1), constantTimeGteU256(1, 1));
    try std.testing.expectEqual(@as(u8, 1), constantTimeGteU256(2, 1));
}

test "constantTimeSelectU256: select first" {
    const a: u256 = 100;
    const b: u256 = 200;
    try std.testing.expectEqual(a, constantTimeSelectU256(1, a, b));
}

test "constantTimeSelectU256: select second" {
    const a: u256 = 100;
    const b: u256 = 200;
    try std.testing.expectEqual(b, constantTimeSelectU256(0, a, b));
}

test "constantTimeEqBytes: equal arrays" {
    const a = [_]u8{ 1, 2, 3, 4, 5 };
    const b = [_]u8{ 1, 2, 3, 4, 5 };
    try std.testing.expect(constantTimeEqBytes(&a, &b));
}

test "constantTimeEqBytes: different arrays" {
    const a = [_]u8{ 1, 2, 3, 4, 5 };
    const b = [_]u8{ 1, 2, 3, 4, 6 };
    try std.testing.expect(!constantTimeEqBytes(&a, &b));
}

test "constantTimeEqBytes: different lengths" {
    const a = [_]u8{ 1, 2, 3 };
    const b = [_]u8{ 1, 2, 3, 4 };
    try std.testing.expect(!constantTimeEqBytes(&a, &b));
}

test "constantTimeIsZeroBytes: all zeros" {
    const a = [_]u8{ 0, 0, 0, 0 };
    try std.testing.expect(constantTimeIsZeroBytes(&a));
}

test "constantTimeIsZeroBytes: has non-zero" {
    const a = [_]u8{ 0, 0, 1, 0 };
    try std.testing.expect(!constantTimeIsZeroBytes(&a));
}

test "constantTimeIsZeroBytes: empty array" {
    const a = [_]u8{};
    try std.testing.expect(constantTimeIsZeroBytes(&a));
}

test "secp256k1 N boundary test" {
    // Test with actual secp256k1 curve order
    const SECP256K1_N: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

    // Valid r must be < N
    const valid_r: u256 = SECP256K1_N - 1;
    const invalid_r: u256 = SECP256K1_N;

    // valid_r < N should be true
    try std.testing.expectEqual(@as(u8, 1), constantTimeLtU256(valid_r, SECP256K1_N));

    // invalid_r < N should be false (they're equal)
    try std.testing.expectEqual(@as(u8, 0), constantTimeLtU256(invalid_r, SECP256K1_N));

    // invalid_r >= N should be true
    try std.testing.expectEqual(@as(u8, 1), constantTimeGteU256(invalid_r, SECP256K1_N));
}

test "constantTimeSwapU256: swap when condition is 1" {
    var a: u256 = 100;
    var b: u256 = 200;

    constantTimeSwapU256(1, &a, &b);
    try std.testing.expectEqual(@as(u256, 200), a);
    try std.testing.expectEqual(@as(u256, 100), b);
}

test "constantTimeSwapU256: no swap when condition is 0" {
    var a: u256 = 100;
    var b: u256 = 200;

    constantTimeSwapU256(0, &a, &b);
    try std.testing.expectEqual(@as(u256, 100), a);
    try std.testing.expectEqual(@as(u256, 200), b);
}

test "constantTimeAddU256: add when condition is 1" {
    try std.testing.expectEqual(@as(u256, 15), constantTimeAddU256(1, 10, 5));
}

test "constantTimeAddU256: no add when condition is 0" {
    try std.testing.expectEqual(@as(u256, 10), constantTimeAddU256(0, 10, 5));
}

test "constantTimeSubU256: sub when condition is 1" {
    try std.testing.expectEqual(@as(u256, 5), constantTimeSubU256(1, 10, 5));
}

test "constantTimeSubU256: no sub when condition is 0" {
    try std.testing.expectEqual(@as(u256, 10), constantTimeSubU256(0, 10, 5));
}

test "constantTimeGtU256: basic comparisons" {
    try std.testing.expectEqual(@as(u8, 0), constantTimeGtU256(0, 1));
    try std.testing.expectEqual(@as(u8, 0), constantTimeGtU256(1, 1));
    try std.testing.expectEqual(@as(u8, 1), constantTimeGtU256(2, 1));
}

test "constantTimeIsNonzeroU256: basic" {
    try std.testing.expectEqual(@as(u8, 0), constantTimeIsNonzeroU256(0));
    try std.testing.expectEqual(@as(u8, 1), constantTimeIsNonzeroU256(1));
    try std.testing.expectEqual(@as(u8, 1), constantTimeIsNonzeroU256(std.math.maxInt(u256)));
}

test "constantTimeSwapBytes: swap when condition is 1" {
    var a = [4]u8{ 1, 2, 3, 4 };
    var b = [4]u8{ 5, 6, 7, 8 };

    constantTimeSwapBytes(4, 1, &a, &b);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 5, 6, 7, 8 }, &a);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 1, 2, 3, 4 }, &b);
}

test "constantTimeSwapBytes: no swap when condition is 0" {
    var a = [4]u8{ 1, 2, 3, 4 };
    var b = [4]u8{ 5, 6, 7, 8 };

    constantTimeSwapBytes(4, 0, &a, &b);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 1, 2, 3, 4 }, &a);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 5, 6, 7, 8 }, &b);
}

test "constantTimeCopyBytes: copy when condition is 1" {
    var dst = [4]u8{ 1, 2, 3, 4 };
    const src = [4]u8{ 5, 6, 7, 8 };

    constantTimeCopyBytes(4, 1, &dst, &src);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 5, 6, 7, 8 }, &dst);
}

test "constantTimeCopyBytes: no copy when condition is 0" {
    var dst = [4]u8{ 1, 2, 3, 4 };
    const src = [4]u8{ 5, 6, 7, 8 };

    constantTimeCopyBytes(4, 0, &dst, &src);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 1, 2, 3, 4 }, &dst);
}

test "secureZero: zeros buffer" {
    var buf = [4]u8{ 1, 2, 3, 4 };
    secureZero(4, &buf);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0, 0, 0, 0 }, &buf);
}

test "secureZeroSlice: zeros slice" {
    var buf = [_]u8{ 1, 2, 3, 4, 5, 6, 7, 8 };
    secureZeroSlice(&buf);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0, 0, 0, 0, 0, 0, 0, 0 }, &buf);
}

test "boolean logic: and" {
    try std.testing.expectEqual(@as(u8, 0), constantTimeAnd(0, 0));
    try std.testing.expectEqual(@as(u8, 0), constantTimeAnd(0, 1));
    try std.testing.expectEqual(@as(u8, 0), constantTimeAnd(1, 0));
    try std.testing.expectEqual(@as(u8, 1), constantTimeAnd(1, 1));
}

test "boolean logic: or" {
    try std.testing.expectEqual(@as(u8, 0), constantTimeOr(0, 0));
    try std.testing.expectEqual(@as(u8, 1), constantTimeOr(0, 1));
    try std.testing.expectEqual(@as(u8, 1), constantTimeOr(1, 0));
    try std.testing.expectEqual(@as(u8, 1), constantTimeOr(1, 1));
}

test "boolean logic: not" {
    try std.testing.expectEqual(@as(u8, 1), constantTimeNot(0));
    try std.testing.expectEqual(@as(u8, 0), constantTimeNot(1));
}

test "boolean logic: xor" {
    try std.testing.expectEqual(@as(u8, 0), constantTimeXor(0, 0));
    try std.testing.expectEqual(@as(u8, 1), constantTimeXor(0, 1));
    try std.testing.expectEqual(@as(u8, 1), constantTimeXor(1, 0));
    try std.testing.expectEqual(@as(u8, 0), constantTimeXor(1, 1));
}

test "secp256k1 validation pattern" {
    // Demonstrates how to use constant-time operations for secp256k1 validation
    const SECP256K1_N: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

    // Valid scalar (1 <= r < N)
    const valid_r: u256 = 12345;
    const r_is_zero = constantTimeIsZeroU256(valid_r);
    const r_ge_n = constantTimeGteU256(valid_r, SECP256K1_N);
    const r_invalid = constantTimeOr(r_is_zero, r_ge_n);
    try std.testing.expectEqual(@as(u8, 0), r_invalid);

    // Invalid scalar (r == 0)
    const zero_r: u256 = 0;
    const zero_is_zero = constantTimeIsZeroU256(zero_r);
    const zero_ge_n = constantTimeGteU256(zero_r, SECP256K1_N);
    const zero_invalid = constantTimeOr(zero_is_zero, zero_ge_n);
    try std.testing.expectEqual(@as(u8, 1), zero_invalid);

    // Invalid scalar (r >= N)
    const big_r: u256 = SECP256K1_N;
    const big_is_zero = constantTimeIsZeroU256(big_r);
    const big_ge_n = constantTimeGteU256(big_r, SECP256K1_N);
    const big_invalid = constantTimeOr(big_is_zero, big_ge_n);
    try std.testing.expectEqual(@as(u8, 1), big_invalid);
}
