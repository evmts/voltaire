//! Root Hash Determinism
//!
//! Demonstrates that the Merkle Patricia Trie produces deterministic root hashes:
//! the same data always produces the same root, regardless of insertion order.

const std = @import("std");
const primitives = @import("primitives");
const Trie = primitives.Trie;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Root Hash Determinism ===\n\n", .{});

    // Prepare test data
    const test_data = [_]struct { key: []const u8, value: []const u8 }{
        .{ .key = &[_]u8{ 0x12, 0x34 }, .value = "first" },
        .{ .key = &[_]u8{ 0x56, 0x78 }, .value = "second" },
        .{ .key = &[_]u8{ 0xAB, 0xCD }, .value = "third" },
        .{ .key = &[_]u8{ 0xEF, 0x01 }, .value = "fourth" },
        .{ .key = &[_]u8{ 0x23, 0x45 }, .value = "fifth" },
    };

    // Trie 1: Insert in original order
    std.debug.print("Trie 1: Insertion order [0, 1, 2, 3, 4]\n", .{});
    var trie1 = Trie.init(allocator);
    defer trie1.deinit();
    for (test_data) |entry| {
        try trie1.put(entry.key, entry.value);
    }
    const root1 = trie1.root_hash();
    std.debug.print("  Root: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&root1.?)});

    // Trie 2: Insert in reverse order
    std.debug.print("\nTrie 2: Insertion order [4, 3, 2, 1, 0]\n", .{});
    var trie2 = Trie.init(allocator);
    defer trie2.deinit();
    var i: usize = test_data.len;
    while (i > 0) : (i -= 1) {
        const entry = test_data[i - 1];
        try trie2.put(entry.key, entry.value);
    }
    const root2 = trie2.root_hash();
    std.debug.print("  Root: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&root2.?)});

    // Trie 3: Insert in random order
    std.debug.print("\nTrie 3: Insertion order [2, 0, 4, 1, 3]\n", .{});
    var trie3 = Trie.init(allocator);
    defer trie3.deinit();
    const random_order = [_]usize{ 2, 0, 4, 1, 3 };
    for (random_order) |idx| {
        const entry = test_data[idx];
        try trie3.put(entry.key, entry.value);
    }
    const root3 = trie3.root_hash();
    std.debug.print("  Root: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&root3.?)});

    // Compare roots
    std.debug.print("\n=== Comparison ===\n", .{});
    const roots_equal_1_2 = std.mem.eql(u8, &root1.?, &root2.?);
    const roots_equal_2_3 = std.mem.eql(u8, &root2.?, &root3.?);
    const roots_equal_1_3 = std.mem.eql(u8, &root1.?, &root3.?);

    std.debug.print("Trie 1 == Trie 2: {}\n", .{roots_equal_1_2});
    std.debug.print("Trie 2 == Trie 3: {}\n", .{roots_equal_2_3});
    std.debug.print("Trie 1 == Trie 3: {}\n", .{roots_equal_1_3});

    if (roots_equal_1_2 and roots_equal_2_3 and roots_equal_1_3) {
        std.debug.print("\n✓ All root hashes are identical!\n", .{});
    } else {
        std.debug.print("\n✗ Root hashes differ (unexpected!)\n", .{});
        return error.NonDeterministicRoot;
    }

    // Demonstrate root changes with data
    std.debug.print("\n=== Root Sensitivity ===\n", .{});
    var trie4 = Trie.init(allocator);
    defer trie4.deinit();

    // Insert same data except one value
    for (test_data) |entry| {
        if (std.mem.eql(u8, entry.key, &[_]u8{ 0x56, 0x78 })) {
            try trie4.put(entry.key, "DIFFERENT"); // Changed value
        } else {
            try trie4.put(entry.key, entry.value);
        }
    }
    const root4 = trie4.root_hash();
    std.debug.print("Changed one value from 'second' to 'DIFFERENT'\n", .{});
    std.debug.print("New root: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&root4.?)});

    const roots_different = !std.mem.eql(u8, &root1.?, &root4.?);
    std.debug.print("Root changed: {}\n", .{roots_different});

    if (roots_different) {
        std.debug.print("✓ Root hash is sensitive to data changes\n", .{});
    }

    // Demonstrate delete and reinsert
    std.debug.print("\n=== Delete and Reinsert ===\n", .{});
    var trie5 = Trie.init(allocator);
    defer trie5.deinit();

    // Insert all data
    for (test_data) |entry| {
        try trie5.put(entry.key, entry.value);
    }
    const before_delete = trie5.root_hash();

    // Delete one entry
    try trie5.delete(&[_]u8{ 0xAB, 0xCD });
    const after_delete = trie5.root_hash();
    std.debug.print("After deleting [0xAB, 0xCD]:\n", .{});
    std.debug.print("  Root: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&after_delete.?)});

    // Reinsert same entry
    try trie5.put(&[_]u8{ 0xAB, 0xCD }, "third");
    const after_reinsert = trie5.root_hash();
    std.debug.print("\nAfter reinserting [0xAB, 0xCD] -> 'third':\n", .{});
    std.debug.print("  Root: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&after_reinsert.?)});

    const reinsert_matches = std.mem.eql(u8, &before_delete.?, &after_reinsert.?);
    std.debug.print("\nRoot matches original: {}\n", .{reinsert_matches});

    if (reinsert_matches) {
        std.debug.print("✓ Delete + reinsert restores original root\n", .{});
    }

    std.debug.print("\n=== Summary ===\n", .{});
    std.debug.print("• Same data -> same root hash (deterministic)\n", .{});
    std.debug.print("• Insertion order doesn't matter\n", .{});
    std.debug.print("• Any data change -> different root hash\n", .{});
    std.debug.print("• Root hash cryptographically commits to all data\n", .{});

    std.debug.print("\n✓ Determinism verified\n", .{});
}
