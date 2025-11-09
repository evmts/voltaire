// Demonstrate false positive rates and parameter selection
const std = @import("std");
const primitives = @import("primitives");
const BloomFilter = primitives.bloom_filter.BloomFilter;

fn testFalsePositiveRate(allocator: std.mem.Allocator, m: usize, k: usize, num_items: usize, test_items: usize) !void {
    var filter = try BloomFilter.init(allocator, m, k);
    defer filter.deinit(allocator);

    // Add known items
    var buf: [32]u8 = undefined;
    var i: usize = 0;
    while (i < num_items) : (i += 1) {
        const item = try std.fmt.bufPrint(&buf, "item-{d}", .{i});
        filter.add(item);
    }

    // Test items that were NOT added
    var false_positives: usize = 0;
    i = num_items;
    while (i < num_items + test_items) : (i += 1) {
        const item = try std.fmt.bufPrint(&buf, "item-{d}", .{i});
        if (filter.contains(item)) {
            false_positives += 1;
        }
    }

    const fp_rate = @as(f64, @floatFromInt(false_positives)) / @as(f64, @floatFromInt(test_items));
    const m_f = @as(f64, @floatFromInt(m));
    const k_f = @as(f64, @floatFromInt(k));
    const n_f = @as(f64, @floatFromInt(num_items));
    const theoretical = std.math.pow(f64, 1.0 - @exp(-k_f * n_f / m_f), k_f);

    std.debug.print("Parameters: m={d}, k={d}, items={d}\n", .{ m, k, num_items });
    std.debug.print("  Measured FP rate: {d:.2}%\n", .{fp_rate * 100.0});
    std.debug.print("  Theoretical FP rate: {d:.2}%\n", .{theoretical * 100.0});
    std.debug.print("  Size: {d} bytes\n\n", .{filter.bits.len});
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("False Positive Rate Analysis\n\n", .{});

    // Standard Ethereum parameters
    std.debug.print("Standard Ethereum (2048 bits, 3 hash functions):\n", .{});
    try testFalsePositiveRate(allocator, 2048, 3, 10, 1000);
    try testFalsePositiveRate(allocator, 2048, 3, 50, 1000);
    try testFalsePositiveRate(allocator, 2048, 3, 100, 1000);
    try testFalsePositiveRate(allocator, 2048, 3, 200, 1000);

    // Larger filter (lower false positives)
    std.debug.print("Larger filter (4096 bits, 5 hash functions):\n", .{});
    try testFalsePositiveRate(allocator, 4096, 5, 50, 1000);
    try testFalsePositiveRate(allocator, 4096, 5, 100, 1000);

    // Smaller filter (higher false positives)
    std.debug.print("Smaller filter (512 bits, 2 hash functions):\n", .{});
    try testFalsePositiveRate(allocator, 512, 2, 20, 1000);
    try testFalsePositiveRate(allocator, 512, 2, 50, 1000);

    // Demonstrate optimal k calculation
    std.debug.print("Optimal hash function count (k) for different scenarios:\n", .{});
    const ln2 = 0.693147;
    std.debug.print("  2048 bits, 50 items: k = {d}\n", .{@as(usize, @intFromFloat(@ceil((2048.0 / 50.0) * ln2)))});
    std.debug.print("  2048 bits, 100 items: k = {d}\n", .{@as(usize, @intFromFloat(@ceil((2048.0 / 100.0) * ln2)))});
    std.debug.print("  4096 bits, 100 items: k = {d}\n", .{@as(usize, @intFromFloat(@ceil((4096.0 / 100.0) * ln2)))});
    std.debug.print("  1024 bits, 20 items: k = {d}\n", .{@as(usize, @intFromFloat(@ceil((1024.0 / 20.0) * ln2)))});
}
