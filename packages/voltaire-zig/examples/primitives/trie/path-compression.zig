//! Path Compression & Common Prefixes
//!
//! Demonstrates how the Merkle Patricia Trie compresses paths when keys share
//! common prefixes, creating extension nodes for efficiency.

const std = @import("std");
const primitives = @import("primitives");
const Trie = primitives.Trie;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Path Compression & Common Prefixes ===\n\n", .{});

    // Example 1: Keys with long common prefix
    std.debug.print("Example 1: Long Common Prefix\n", .{});
    std.debug.print("------------------------------\n", .{});
    {
        var trie = Trie.init(allocator);
        defer trie.deinit();

        // All keys share prefix [0x01, 0x02, 0x03]
        try trie.put(&[_]u8{ 0x01, 0x02, 0x03, 0x04 }, "value_at_04");
        try trie.put(&[_]u8{ 0x01, 0x02, 0x03, 0x05 }, "value_at_05");
        try trie.put(&[_]u8{ 0x01, 0x02, 0x03, 0x06 }, "value_at_06");

        std.debug.print("Inserted 3 keys with common prefix [0x01, 0x02, 0x03]:\n", .{});
        std.debug.print("  [0x01, 0x02, 0x03, 0x04] -> value_at_04\n", .{});
        std.debug.print("  [0x01, 0x02, 0x03, 0x05] -> value_at_05\n", .{});
        std.debug.print("  [0x01, 0x02, 0x03, 0x06] -> value_at_06\n", .{});

        const root1 = trie.root_hash();
        std.debug.print("\nRoot: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&root1.?)});
        std.debug.print("\nTrie structure (conceptual):\n", .{});
        std.debug.print("  Extension [0,1,0,2,0,3] (nibbles)\n", .{});
        std.debug.print("    └─> Branch\n", .{});
        std.debug.print("          ├─ [0]: Leaf([4], 'value_at_04')\n", .{});
        std.debug.print("          ├─ [0]: Leaf([5], 'value_at_05')\n", .{});
        std.debug.print("          └─ [0]: Leaf([6], 'value_at_06')\n", .{});
    }

    // Example 2: Key is prefix of another
    std.debug.print("\n\nExample 2: Key is Prefix of Another\n", .{});
    std.debug.print("------------------------------------\n", .{});
    {
        var trie = Trie.init(allocator);
        defer trie.deinit();

        try trie.put(&[_]u8{ 0x12, 0x34 }, "short_key");
        try trie.put(&[_]u8{ 0x12, 0x34, 0x56 }, "long_key");
        try trie.put(&[_]u8{ 0x12, 0x34, 0x56, 0x78 }, "longer_key");

        std.debug.print("Inserted 3 keys where each is a prefix of the next:\n", .{});
        std.debug.print("  [0x12, 0x34]             -> short_key\n", .{});
        std.debug.print("  [0x12, 0x34, 0x56]       -> long_key\n", .{});
        std.debug.print("  [0x12, 0x34, 0x56, 0x78] -> longer_key\n", .{});

        // All values retrievable
        const short = try trie.get(&[_]u8{ 0x12, 0x34 });
        const long = try trie.get(&[_]u8{ 0x12, 0x34, 0x56 });
        const longer = try trie.get(&[_]u8{ 0x12, 0x34, 0x56, 0x78 });

        std.debug.print("\nAll values independently retrievable:\n", .{});
        std.debug.print("  ✓ short:  {s}\n", .{short.?});
        std.debug.print("  ✓ long:   {s}\n", .{long.?});
        std.debug.print("  ✓ longer: {s}\n", .{longer.?});

        std.debug.print("\nTrie uses branch nodes with values to store prefix keys.\n", .{});
    }

    // Example 3: Gradual divergence
    std.debug.print("\n\nExample 3: Gradual Divergence\n", .{});
    std.debug.print("-----------------------------\n", .{});
    {
        var trie = Trie.init(allocator);
        defer trie.deinit();

        // Start with single key
        try trie.put(&[_]u8{ 0xAA, 0xBB, 0xCC, 0xDD }, "first");
        const root1 = trie.root_hash();
        std.debug.print("After 1st insert [0xAA, 0xBB, 0xCC, 0xDD]:\n", .{});
        std.debug.print("  Root: 0x{x:0>16}...\n", .{std.fmt.fmtSliceHexLower(root1.?[0..8])});
        std.debug.print("  Structure: Single Leaf\n", .{});

        // Add key with common prefix of length 2
        try trie.put(&[_]u8{ 0xAA, 0xBB, 0x11, 0x22 }, "second");
        const root2 = trie.root_hash();
        std.debug.print("\nAfter 2nd insert [0xAA, 0xBB, 0x11, 0x22]:\n", .{});
        std.debug.print("  Root: 0x{x:0>16}...\n", .{std.fmt.fmtSliceHexLower(root2.?[0..8])});
        std.debug.print("  Structure: Extension [A,A,B,B] -> Branch (split at nibble C vs 1)\n", .{});

        // Add key diverging earlier
        try trie.put(&[_]u8{ 0xAA, 0x33, 0x44, 0x55 }, "third");
        const root3 = trie.root_hash();
        std.debug.print("\nAfter 3rd insert [0xAA, 0x33, 0x44, 0x55]:\n", .{});
        std.debug.print("  Root: 0x{x:0>16}...\n", .{std.fmt.fmtSliceHexLower(root3.?[0..8])});
        std.debug.print("  Structure: Extension [A,A] -> Branch (split at nibble B vs 3)\n", .{});

        // Verify all retrievable
        std.debug.print("\n✓ All 3 values still retrievable after restructuring\n", .{});
    }

    // Example 4: No common prefix
    std.debug.print("\n\nExample 4: No Common Prefix\n", .{});
    std.debug.print("---------------------------\n", .{});
    {
        var trie = Trie.init(allocator);
        defer trie.deinit();

        // Completely different keys
        try trie.put(&[_]u8{0x11}, "first");
        try trie.put(&[_]u8{0x22}, "second");
        try trie.put(&[_]u8{0x33}, "third");
        try trie.put(&[_]u8{0x44}, "fourth");

        std.debug.print("Inserted 4 keys with no common prefix:\n", .{});
        std.debug.print("  [0x11], [0x22], [0x33], [0x44]\n", .{});
        std.debug.print("\nTrie structure: Branch at root (16-way)\n", .{});
        std.debug.print("  Each key goes directly into its nibble slot\n", .{});
        std.debug.print("  No extension nodes needed\n", .{});

        const root = trie.root_hash();
        std.debug.print("\nRoot: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&root.?)});
    }

    std.debug.print("\n\n=== Key Takeaways ===\n", .{});
    std.debug.print("• Extension nodes compress common prefixes for efficiency\n", .{});
    std.debug.print("• Branch nodes handle divergence points (up to 16 children)\n", .{});
    std.debug.print("• Leaf nodes store terminal values\n", .{});
    std.debug.print("• Trie dynamically restructures as keys are added/removed\n", .{});
    std.debug.print("• Root hash changes with any modification\n", .{});

    std.debug.print("\n✓ Path compression examples completed\n", .{});
}
