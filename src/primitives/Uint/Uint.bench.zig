const std = @import("std");
const zbench = @import("zbench");
const Uint = @import("../../primitives.zig").Uint;

// Type definitions
const U64 = Uint(64, 1);
const U256 = Uint(256, 4);
const U512 = Uint(512, 8);

// Test values
const small_a = U256.from_u64(100);
const small_b = U256.from_u64(50);
const medium_a = U256.from_int(1 << 64);
const medium_b = U256.from_int(1 << 63);
const large_a = U256.from_int(1 << 128);
const large_b = U256.from_int(1 << 127);

// U64 test values
const u64_a = U64.from_u64(0xFFFFFFFF);
const u64_b = U64.from_u64(0xAAAAAAAA);

// U512 test values
const u512_a = U512.from_u64(0xFFFFFFFFFFFFFFFF);
const u512_b = U512.from_u64(0xAAAAAAAAAAAAAAAA);

// ============================================================================
// Core Arithmetic Operations
// ============================================================================

fn benchAddSmall(_: std.mem.Allocator) void {
    const result = small_a.add(small_b);
    _ = result;
}

fn benchAddMedium(_: std.mem.Allocator) void {
    const result = medium_a.add(medium_b);
    _ = result;
}

fn benchAddLarge(_: std.mem.Allocator) void {
    const result = large_a.add(large_b);
    _ = result;
}

fn benchSubSmall(_: std.mem.Allocator) void {
    const result = small_a.sub(small_b);
    _ = result;
}

fn benchSubMedium(_: std.mem.Allocator) void {
    const result = medium_a.sub(medium_b);
    _ = result;
}

fn benchSubLarge(_: std.mem.Allocator) void {
    const result = large_a.sub(large_b);
    _ = result;
}

fn benchMulSmall(_: std.mem.Allocator) void {
    const result = small_a.mul(small_b);
    _ = result;
}

fn benchMulMedium(_: std.mem.Allocator) void {
    const result = medium_a.mul(medium_b);
    _ = result;
}

fn benchMulLarge(_: std.mem.Allocator) void {
    const result = large_a.mul(large_b);
    _ = result;
}

fn benchDivSmall(_: std.mem.Allocator) void {
    const result = small_a.div_rem(small_b);
    _ = result;
}

fn benchDivMedium(_: std.mem.Allocator) void {
    const result = medium_a.div_rem(medium_b);
    _ = result;
}

fn benchDivLarge(_: std.mem.Allocator) void {
    const result = large_a.div_rem(large_b);
    _ = result;
}

fn benchModSmall(_: std.mem.Allocator) void {
    const result = small_a.div_rem(small_b);
    _ = result.remainder;
}

fn benchPowSmall(_: std.mem.Allocator) void {
    const result = U256.from_u64(2).pow(8);
    _ = result;
}

fn benchPowMedium(_: std.mem.Allocator) void {
    const result = U256.from_u64(10).pow(20);
    _ = result;
}

fn benchGcdSmall(_: std.mem.Allocator) void {
    const result = U256.from_u64(48).gcd(U256.from_u64(18));
    _ = result;
}

fn benchGcdMedium(_: std.mem.Allocator) void {
    const result = small_a.gcd(medium_a);
    _ = result;
}

fn benchSqrt(_: std.mem.Allocator) void {
    const result = medium_a.sqrt();
    _ = result;
}

// ============================================================================
// Modular Arithmetic
// ============================================================================

fn benchAddMod(_: std.mem.Allocator) void {
    const result = small_a.add_mod(small_b, medium_a);
    _ = result;
}

fn benchMulMod(_: std.mem.Allocator) void {
    const result = small_a.mul_mod(small_b, medium_a);
    _ = result;
}

fn benchPowMod(_: std.mem.Allocator) void {
    const base = U256.from_u64(2);
    const exp = U256.from_u64(256);
    const modulus = U256.from_u64(997);
    const result = base.pow_mod(exp, modulus);
    _ = result;
}

fn benchReduceMod(_: std.mem.Allocator) void {
    const result = large_a.reduce_mod(medium_a);
    _ = result;
}

// ============================================================================
// Bit Manipulation
// ============================================================================

fn benchRotateLeft(_: std.mem.Allocator) void {
    const result = small_a.rotate_left(8);
    _ = result;
}

fn benchRotateRight(_: std.mem.Allocator) void {
    const result = small_a.rotate_right(8);
    _ = result;
}

fn benchReverseBits(_: std.mem.Allocator) void {
    const result = small_a.reverse_bits();
    _ = result;
}

fn benchSwapBytes(_: std.mem.Allocator) void {
    const result = small_a.swap_bytes();
    _ = result;
}

fn benchBitLen(_: std.mem.Allocator) void {
    const result = small_a.bit_len();
    _ = result;
}

fn benchLeadingZeros(_: std.mem.Allocator) void {
    const result = small_a.leading_zeros();
    _ = result;
}

fn benchTrailingZeros(_: std.mem.Allocator) void {
    const result = small_a.trailing_zeros();
    _ = result;
}

fn benchPopCount(_: std.mem.Allocator) void {
    const result = small_a.pop_count();
    _ = result;
}

// ============================================================================
// Different Sizes (U64)
// ============================================================================

fn benchAddU64(_: std.mem.Allocator) void {
    const result = u64_a.add(u64_b);
    _ = result;
}

fn benchMulU64(_: std.mem.Allocator) void {
    const result = u64_a.mul(u64_b);
    _ = result;
}

fn benchDivU64(_: std.mem.Allocator) void {
    const result = u64_a.div_rem(u64_b);
    _ = result;
}

// ============================================================================
// Different Sizes (U512)
// ============================================================================

fn benchAddU512(_: std.mem.Allocator) void {
    const result = u512_a.add(u512_b);
    _ = result;
}

fn benchMulU512(_: std.mem.Allocator) void {
    const result = u512_a.mul(u512_b);
    _ = result;
}

fn benchDivU512(_: std.mem.Allocator) void {
    const result = u512_a.div_rem(u512_b);
    _ = result;
}

// ============================================================================
// Main
// ============================================================================

pub fn main() !void {
    var buf: [8192]u8 = undefined;
    var stdout_file = std.fs.File.stdout();
    var writer_instance = stdout_file.writer(&buf);
    var writer = &writer_instance.interface;
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    // Core arithmetic
    try bench.add("U256 add (small)", benchAddSmall, .{});
    try bench.add("U256 add (medium)", benchAddMedium, .{});
    try bench.add("U256 add (large)", benchAddLarge, .{});
    try bench.add("U256 sub (small)", benchSubSmall, .{});
    try bench.add("U256 sub (medium)", benchSubMedium, .{});
    try bench.add("U256 sub (large)", benchSubLarge, .{});
    try bench.add("U256 mul (small)", benchMulSmall, .{});
    try bench.add("U256 mul (medium)", benchMulMedium, .{});
    try bench.add("U256 mul (large)", benchMulLarge, .{});
    try bench.add("U256 div (small)", benchDivSmall, .{});
    try bench.add("U256 div (medium)", benchDivMedium, .{});
    try bench.add("U256 div (large)", benchDivLarge, .{});
    try bench.add("U256 mod (small)", benchModSmall, .{});
    try bench.add("U256 pow (2^8)", benchPowSmall, .{});
    try bench.add("U256 pow (10^20)", benchPowMedium, .{});
    try bench.add("U256 gcd (small)", benchGcdSmall, .{});
    try bench.add("U256 gcd (medium)", benchGcdMedium, .{});
    try bench.add("U256 sqrt", benchSqrt, .{});

    // Modular arithmetic
    try bench.add("U256 add_mod", benchAddMod, .{});
    try bench.add("U256 mul_mod", benchMulMod, .{});
    try bench.add("U256 pow_mod", benchPowMod, .{});
    try bench.add("U256 reduce_mod", benchReduceMod, .{});

    // Bit manipulation
    try bench.add("U256 rotate_left", benchRotateLeft, .{});
    try bench.add("U256 rotate_right", benchRotateRight, .{});
    try bench.add("U256 reverse_bits", benchReverseBits, .{});
    try bench.add("U256 swap_bytes", benchSwapBytes, .{});
    try bench.add("U256 bit_len", benchBitLen, .{});
    try bench.add("U256 leading_zeros", benchLeadingZeros, .{});
    try bench.add("U256 trailing_zeros", benchTrailingZeros, .{});
    try bench.add("U256 pop_count", benchPopCount, .{});

    // Different sizes
    try bench.add("U64 add", benchAddU64, .{});
    try bench.add("U64 mul", benchMulU64, .{});
    try bench.add("U64 div", benchDivU64, .{});
    try bench.add("U512 add", benchAddU512, .{});
    try bench.add("U512 mul", benchMulU512, .{});
    try bench.add("U512 div", benchDivU512, .{});

    try writer.writeAll("\n");
    try bench.run(writer);
}
