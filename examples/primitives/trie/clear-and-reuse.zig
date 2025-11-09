//! Clear and Reuse
//!
//! Demonstrates the clear() operation for resetting a trie to empty state
//! and reusing the same trie instance for multiple computations.

const std = @import("std");
const primitives = @import("primitives");
const Trie = primitives.Trie;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Clear and Reuse Trie ===\n\n", .{});

    // Create single trie instance
    var trie = Trie.init(allocator);
    defer trie.deinit();

    // First use: Block 1 transactions
    std.debug.print("=== Block 1 Transaction Trie ===\n", .{});
    try trie.put(&[_]u8{0}, "tx0_block1");
    try trie.put(&[_]u8{1}, "tx1_block1");
    try trie.put(&[_]u8{2}, "tx2_block1");

    const block1_root = trie.root_hash();
    std.debug.print("Block 1 transactions: 3\n", .{});
    std.debug.print("Root: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&block1_root.?)});

    // Clear for next use
    std.debug.print("\nClearing trie...\n", .{});
    trie.clear();

    const after_clear = trie.root_hash();
    std.debug.print("Root after clear: {?}\n", .{after_clear});

    // Verify old data is gone
    const old_data = try trie.get(&[_]u8{0});
    std.debug.print("Old data accessible: {}\n", .{old_data != null});

    // Second use: Block 2 transactions
    std.debug.print("\n=== Block 2 Transaction Trie ===\n", .{});
    try trie.put(&[_]u8{0}, "tx0_block2");
    try trie.put(&[_]u8{1}, "tx1_block2");
    try trie.put(&[_]u8{2}, "tx2_block2");
    try trie.put(&[_]u8{3}, "tx3_block2");
    try trie.put(&[_]u8{4}, "tx4_block2");

    const block2_root = trie.root_hash();
    std.debug.print("Block 2 transactions: 5\n", .{});
    std.debug.print("Root: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&block2_root.?)});

    // Roots should be different
    const roots_different = !std.mem.eql(u8, &block1_root.?, &block2_root.?);
    std.debug.print("\nBlock 1 root != Block 2 root: {}\n", .{roots_different});

    // Clear and reuse again
    std.debug.print("\nClearing trie again...\n", .{});
    trie.clear();

    // Third use: Block 3 transactions (same as block 1)
    std.debug.print("\n=== Block 3 Transaction Trie (same data as Block 1) ===\n", .{});
    try trie.put(&[_]u8{0}, "tx0_block1");
    try trie.put(&[_]u8{1}, "tx1_block1");
    try trie.put(&[_]u8{2}, "tx2_block1");

    const block3_root = trie.root_hash();
    std.debug.print("Block 3 transactions: 3\n", .{});
    std.debug.print("Root: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&block3_root.?)});

    // Block 3 root should match Block 1 root (same data)
    const roots_match = std.mem.eql(u8, &block1_root.?, &block3_root.?);
    std.debug.print("\nBlock 1 root == Block 3 root: {}\n", .{roots_match});

    if (roots_match) {
        std.debug.print("✓ Same data produces same root after clear/reuse\n", .{});
    }

    // Demonstrate batch processing use case
    std.debug.print("\n=== Batch Processing Pattern ===\n", .{});
    std.debug.print("Processing multiple batches with same trie instance:\n\n", .{});

    trie.clear();

    const batches = [_][]const struct { key: []const u8, value: []const u8 }{
        &[_]struct { key: []const u8, value: []const u8 }{
            .{ .key = &[_]u8{0x11}, .value = "batch1_item1" },
            .{ .key = &[_]u8{0x22}, .value = "batch1_item2" },
        },
        &[_]struct { key: []const u8, value: []const u8 }{
            .{ .key = &[_]u8{0x33}, .value = "batch2_item1" },
            .{ .key = &[_]u8{0x44}, .value = "batch2_item2" },
            .{ .key = &[_]u8{0x55}, .value = "batch2_item3" },
        },
        &[_]struct { key: []const u8, value: []const u8 }{
            .{ .key = &[_]u8{0x66}, .value = "batch3_item1" },
        },
    };

    for (batches, 0..) |batch, batch_idx| {
        // Process batch
        for (batch) |entry| {
            try trie.put(entry.key, entry.value);
        }

        // Extract result
        const batch_root = trie.root_hash();
        std.debug.print("Batch {}: {} items\n", .{ batch_idx + 1, batch.len });
        std.debug.print("  Root: 0x{x:0>32}...\n", .{std.fmt.fmtSliceHexLower(batch_root.?[0..16])});

        // Clear for next batch
        if (batch_idx < batches.len - 1) {
            trie.clear();
        }
    }

    std.debug.print("\n=== Benefits of Clear & Reuse ===\n", .{});
    std.debug.print("• Memory efficiency: Reuse same allocations\n", .{});
    std.debug.print("• No setup overhead: Already initialized\n", .{});
    std.debug.print("• Clean state: No data from previous use\n", .{});
    std.debug.print("• Useful for: batch processing, per-block tries, testing\n", .{});

    std.debug.print("\n✓ Clear and reuse pattern demonstrated\n", .{});
}
