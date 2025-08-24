const std = @import("std");
const zbench = @import("zbench");

// Simple benchmarks for EVM frame module
// This demonstrates zbench integration and basic EVM operations

fn benchmark_stack_operations(allocator: std.mem.Allocator) void {
    _ = allocator;
    // Simulate stack operations
    var stack = [_]u256{0} ** 1024;
    var top: usize = 0;
    
    // Push operations
    stack[top] = 100;
    top += 1;
    stack[top] = 200;
    top += 1;
    
    // Add operation (pop two, push result)
    const b = stack[top - 1];
    top -= 1;
    const a = stack[top - 1];
    stack[top - 1] = a +% b;
}

fn benchmark_arithmetic_add(allocator: std.mem.Allocator) void {
    _ = allocator;
    const a: u256 = 0x123456789abcdef0;
    const b: u256 = 0xfedcba9876543210;
    _ = a +% b; // Wrapping addition like EVM
}

fn benchmark_arithmetic_mul(allocator: std.mem.Allocator) void {
    _ = allocator;
    const a: u256 = 0x123456;
    const b: u256 = 0xabcdef;
    _ = a *% b; // Wrapping multiplication like EVM
}

fn benchmark_arithmetic_div(allocator: std.mem.Allocator) void {
    _ = allocator;
    const a: u256 = 0x123456789abcdef0;
    const b: u256 = 0x100;
    _ = if (b == 0) 0 else a / b; // Division with zero check like EVM
}

fn benchmark_bitwise_and(allocator: std.mem.Allocator) void {
    _ = allocator;
    const a: u256 = 0xFFFF0000FFFF0000;
    const b: u256 = 0x0000FFFF0000FFFF;
    _ = a & b;
}

fn benchmark_bitwise_or(allocator: std.mem.Allocator) void {
    _ = allocator;
    const a: u256 = 0xFFFF0000FFFF0000;
    const b: u256 = 0x0000FFFF0000FFFF;
    _ = a | b;
}

fn benchmark_memory_copy(allocator: std.mem.Allocator) void {
    _ = allocator;
    var source = [_]u8{0xaa} ** 32;
    var dest = [_]u8{0} ** 32;
    @memcpy(&dest, &source);
}

fn benchmark_keccak256_simple(allocator: std.mem.Allocator) void {
    _ = allocator;
    const crypto = @import("crypto");
    const data = [_]u8{0x01, 0x02, 0x03, 0x04} ** 8; // 32 bytes
    _ = crypto.Hash.keccak256(&data);
}

fn benchmark_comparison_operations(allocator: std.mem.Allocator) void {
    _ = allocator;
    const a: u256 = 100;
    const b: u256 = 200;
    
    // LT operation
    _ = if (a < b) 1 else 0;
    
    // GT operation  
    _ = if (a > b) 1 else 0;
    
    // EQ operation
    _ = if (a == b) 1 else 0;
}

fn benchmark_byte_operations(allocator: std.mem.Allocator) void {
    _ = allocator;
    const value: u256 = 0x123456789abcdef0;
    const index: u8 = 2;
    
    // BYTE operation - get byte at index
    if (index < 32) {
        const shift = @as(u8, @intCast((31 - index) * 8));
        _ = @as(u8, @truncate(value >> shift));
    }
}

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var bench = zbench.Benchmark.init(allocator, .{});
    defer bench.deinit();

    try stdout.print("\\n🚀 EVM Simple Benchmarks (zbench)\\n", .{});
    try stdout.print("==================================\\n\\n", .{});

    // Core EVM operation benchmarks
    try bench.add("Stack Operations", benchmark_stack_operations, .{});
    try bench.add("Arithmetic ADD", benchmark_arithmetic_add, .{});
    try bench.add("Arithmetic MUL", benchmark_arithmetic_mul, .{});
    try bench.add("Arithmetic DIV", benchmark_arithmetic_div, .{});
    try bench.add("Bitwise AND", benchmark_bitwise_and, .{});
    try bench.add("Bitwise OR", benchmark_bitwise_or, .{});
    try bench.add("Memory Copy", benchmark_memory_copy, .{});
    try bench.add("KECCAK256", benchmark_keccak256_simple, .{});
    try bench.add("Comparison Ops", benchmark_comparison_operations, .{});
    try bench.add("Byte Operations", benchmark_byte_operations, .{});

    try stdout.print("Running zbench benchmarks...\\n\\n", .{});
    try bench.run(stdout);
    
    try stdout.print("\\n✅ EVM zbench benchmarks completed successfully!\\n", .{});
}

test "simple benchmark compilation" {
    // Test that our benchmarks compile correctly
    const allocator = std.testing.allocator;
    
    // Test arithmetic
    const a: u256 = 100;
    const b: u256 = 200;
    const result = a +% b;
    try std.testing.expectEqual(@as(u256, 300), result);
    
    // Test keccak256
    const crypto = @import("crypto");
    const data = [_]u8{0x01, 0x02, 0x03, 0x04};
    const hash = crypto.Hash.keccak256(&data);
    
    // Basic check that hash was computed (not all zeros)
    try std.testing.expect(!crypto.Hash.is_zero(hash));
    
    _ = allocator; // Suppress unused variable warning
}