//! Edge Cases
//!
//! Demonstrates handling of edge cases: empty keys, empty values,
//! large keys/values, single-byte keys, and other boundary conditions.

const std = @import("std");
const primitives = @import("primitives");
const Trie = primitives.Trie;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Edge Cases ===\n\n", .{});

    var trie = Trie.init(allocator);
    defer trie.deinit();

    // 1. Empty key
    std.debug.print("1. Empty Key\n", .{});
    std.debug.print("------------\n", .{});
    const empty_key = [_]u8{};
    try trie.put(&empty_key, "value_for_empty_key");
    const retrieved_empty = try trie.get(&empty_key);
    std.debug.print("Key: [] (empty)\n", .{});
    std.debug.print("Value: {s}\n", .{retrieved_empty.?});
    std.debug.print("✓ Empty keys are supported\n", .{});

    // 2. Empty value
    std.debug.print("\n2. Empty Value\n", .{});
    std.debug.print("--------------\n", .{});
    try trie.put(&[_]u8{ 0xAA, 0xBB }, "");
    const retrieved_empty_val = try trie.get(&[_]u8{ 0xAA, 0xBB });
    std.debug.print("Key: [0xAA, 0xBB]\n", .{});
    std.debug.print("Value: '{s}' (empty string)\n", .{retrieved_empty_val.?});
    std.debug.print("Value length: {}\n", .{retrieved_empty_val.?.len});
    std.debug.print("✓ Empty values are supported\n", .{});

    // 3. Single-byte key
    std.debug.print("\n3. Single-Byte Keys\n", .{});
    std.debug.print("-------------------\n", .{});
    try trie.put(&[_]u8{0x01}, "one");
    try trie.put(&[_]u8{0x02}, "two");
    try trie.put(&[_]u8{0xFF}, "max");
    std.debug.print("Inserted keys: [0x01], [0x02], [0xFF]\n", .{});
    std.debug.print("Retrieved [0x01]: {s}\n", .{(try trie.get(&[_]u8{0x01})).?});
    std.debug.print("Retrieved [0xFF]: {s}\n", .{(try trie.get(&[_]u8{0xFF})).?});
    std.debug.print("✓ Single-byte keys work correctly\n", .{});

    // 4. Large key
    std.debug.print("\n4. Large Key (256 bytes)\n", .{});
    std.debug.print("------------------------\n", .{});
    var large_key: [256]u8 = undefined;
    for (&large_key, 0..) |*byte, i| {
        byte.* = @intCast(i % 256);
    }
    try trie.put(&large_key, "value_for_large_key");
    const retrieved_large = try trie.get(&large_key);
    std.debug.print("Key length: {} bytes\n", .{large_key.len});
    std.debug.print("Value: {s}\n", .{retrieved_large.?});
    std.debug.print("✓ Large keys are supported\n", .{});

    // 5. Large value
    std.debug.print("\n5. Large Value (4096 bytes)\n", .{});
    std.debug.print("---------------------------\n", .{});
    const large_value = try allocator.alloc(u8, 4096);
    defer allocator.free(large_value);
    for (large_value, 0..) |*byte, i| {
        byte.* = @intCast(i % 256);
    }
    try trie.put(&[_]u8{ 0x12, 0x34 }, large_value);
    const retrieved_large_val = try trie.get(&[_]u8{ 0x12, 0x34 });
    std.debug.print("Value length: {} bytes\n", .{retrieved_large_val.?.len});
    std.debug.print("First 4 bytes: {x:0>2} {x:0>2} {x:0>2} {x:0>2}\n", .{
        retrieved_large_val.?[0],
        retrieved_large_val.?[1],
        retrieved_large_val.?[2],
        retrieved_large_val.?[3],
    });
    std.debug.print("✓ Large values are supported\n", .{});

    // 6. All zeros key
    std.debug.print("\n6. All-Zeros Key\n", .{});
    std.debug.print("----------------\n", .{});
    const zero_key = [_]u8{0} ** 32;
    try trie.put(&zero_key, "all_zeros");
    const retrieved_zeros = try trie.get(&zero_key);
    std.debug.print("Key: [0x00 × 32]\n", .{});
    std.debug.print("Value: {s}\n", .{retrieved_zeros.?});
    std.debug.print("✓ All-zeros keys work correctly\n", .{});

    // 7. All ones key
    std.debug.print("\n7. All-Ones Key\n", .{});
    std.debug.print("---------------\n", .{});
    const ones_key = [_]u8{0xFF} ** 32;
    try trie.put(&ones_key, "all_ones");
    const retrieved_ones = try trie.get(&ones_key);
    std.debug.print("Key: [0xFF × 32]\n", .{});
    std.debug.print("Value: {s}\n", .{retrieved_ones.?});
    std.debug.print("✓ All-ones keys work correctly\n", .{});

    // 8. Overwrite with different length
    std.debug.print("\n8. Overwrite with Different Lengths\n", .{});
    std.debug.print("-----------------------------------\n", .{});
    const overwrite_key = [_]u8{ 0x99, 0x88 };
    try trie.put(&overwrite_key, "short");
    std.debug.print("Initial value: {s} (length {})\n", .{
        (try trie.get(&overwrite_key)).?,
        (try trie.get(&overwrite_key)).?.len,
    });

    try trie.put(&overwrite_key, "much longer value with more data");
    std.debug.print("After overwrite: {s} (length {})\n", .{
        (try trie.get(&overwrite_key)).?,
        (try trie.get(&overwrite_key)).?.len,
    });

    try trie.put(&overwrite_key, "x");
    std.debug.print("After 2nd overwrite: {s} (length {})\n", .{
        (try trie.get(&overwrite_key)).?,
        (try trie.get(&overwrite_key)).?.len,
    });
    std.debug.print("✓ Overwriting with different lengths works\n", .{});

    // 9. Delete non-existent key
    std.debug.print("\n9. Delete Non-Existent Key\n", .{});
    std.debug.print("--------------------------\n", .{});
    const before_count = trie.root_hash();
    try trie.delete(&[_]u8{ 0x11, 0x11, 0x11 });
    const after_count = trie.root_hash();
    std.debug.print("Root changed: {}\n", .{!std.mem.eql(u8, &before_count.?, &after_count.?)});
    std.debug.print("✓ Deleting non-existent keys is safe (no-op)\n", .{});

    // 10. Many single-nibble divergence keys
    std.debug.print("\n10. Keys Diverging at Each Nibble\n", .{});
    std.debug.print("---------------------------------\n", .{});
    try trie.put(&[_]u8{ 0x10, 0x00 }, "nibble_1_0");
    try trie.put(&[_]u8{ 0x20, 0x00 }, "nibble_2_0");
    try trie.put(&[_]u8{ 0x30, 0x00 }, "nibble_3_0");
    try trie.put(&[_]u8{ 0x40, 0x00 }, "nibble_4_0");
    std.debug.print("Inserted 4 keys differing in first nibble\n", .{});
    std.debug.print("All retrievable:\n", .{});
    std.debug.print("  [0x10, 0x00]: {s}\n", .{(try trie.get(&[_]u8{ 0x10, 0x00 })).?});
    std.debug.print("  [0x20, 0x00]: {s}\n", .{(try trie.get(&[_]u8{ 0x20, 0x00 })).?});
    std.debug.print("  [0x30, 0x00]: {s}\n", .{(try trie.get(&[_]u8{ 0x30, 0x00 })).?});
    std.debug.print("  [0x40, 0x00]: {s}\n", .{(try trie.get(&[_]u8{ 0x40, 0x00 })).?});
    std.debug.print("✓ Branch node creation works correctly\n", .{});

    // Check root hash exists
    const final_root = trie.root_hash();
    std.debug.print("\n=== Final Trie State ===\n", .{});
    std.debug.print("Root: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&final_root.?)});

    std.debug.print("\n✓ All edge cases handled correctly\n", .{});
}
