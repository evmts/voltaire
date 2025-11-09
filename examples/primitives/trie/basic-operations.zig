//! Basic Trie Operations
//!
//! Demonstrates fundamental insert, get, and delete operations on a Merkle Patricia Trie.

const std = @import("std");
const primitives = @import("primitives");
const Trie = primitives.Trie;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Initialize empty trie
    var trie = Trie.init(allocator);
    defer trie.deinit();

    std.debug.print("=== Basic Trie Operations ===\n\n", .{});

    // 1. Empty trie has null root
    std.debug.print("1. Empty trie root: {?}\n", .{trie.root_hash()});

    // 2. Insert key-value pairs
    std.debug.print("\n2. Inserting three key-value pairs...\n", .{});
    try trie.put(&[_]u8{ 0x12, 0x34 }, "first_value");
    try trie.put(&[_]u8{ 0x56, 0x78 }, "second_value");
    try trie.put(&[_]u8{ 0xAB, 0xCD }, "third_value");

    // 3. Root hash changes after insertions
    const root = trie.root_hash();
    std.debug.print("   Root hash after insertions: ", .{});
    if (root) |r| {
        std.debug.print("{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&r)});
    }

    // 4. Retrieve values
    std.debug.print("\n3. Retrieving values:\n", .{});
    const val1 = try trie.get(&[_]u8{ 0x12, 0x34 });
    std.debug.print("   Key [0x12, 0x34] -> {s}\n", .{val1.?});

    const val2 = try trie.get(&[_]u8{ 0x56, 0x78 });
    std.debug.print("   Key [0x56, 0x78] -> {s}\n", .{val2.?});

    const val3 = try trie.get(&[_]u8{ 0xAB, 0xCD });
    std.debug.print("   Key [0xAB, 0xCD] -> {s}\n", .{val3.?});

    // 5. Update existing key
    std.debug.print("\n4. Updating key [0x12, 0x34]...\n", .{});
    try trie.put(&[_]u8{ 0x12, 0x34 }, "updated_value");
    const updated = try trie.get(&[_]u8{ 0x12, 0x34 });
    std.debug.print("   New value: {s}\n", .{updated.?});

    // 6. Delete a key
    std.debug.print("\n5. Deleting key [0xAB, 0xCD]...\n", .{});
    try trie.delete(&[_]u8{ 0xAB, 0xCD });
    const deleted = try trie.get(&[_]u8{ 0xAB, 0xCD });
    std.debug.print("   Value after deletion: {?s}\n", .{deleted});

    // 7. Other keys still accessible
    std.debug.print("\n6. Remaining keys still accessible:\n", .{});
    const remaining1 = try trie.get(&[_]u8{ 0x12, 0x34 });
    std.debug.print("   Key [0x12, 0x34] -> {s}\n", .{remaining1.?});
    const remaining2 = try trie.get(&[_]u8{ 0x56, 0x78 });
    std.debug.print("   Key [0x56, 0x78] -> {s}\n", .{remaining2.?});

    // 8. Query non-existent key
    std.debug.print("\n7. Querying non-existent key [0xFF, 0xFF]...\n", .{});
    const missing = try trie.get(&[_]u8{ 0xFF, 0xFF });
    std.debug.print("   Result: {?s}\n", .{missing});

    std.debug.print("\n✓ Basic operations completed successfully\n", .{});
}
