/// Simple demo to run revm comparison benchmarks
const std = @import("std");
const revm_comparison_benchmark = @import("revm_comparison_benchmark.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    std.debug.print("\n=== Simple Revm Comparison Demo ===\n", .{});
    try revm_comparison_benchmark.runRevmComparisonBenchmarks(allocator);
    std.debug.print("\n=== Demo Complete ===\n", .{});
}