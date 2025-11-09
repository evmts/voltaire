const std = @import("std");
const primitives = @import("primitives");
const BinaryTree = primitives.BinaryTree;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== BinaryTree Basic Operations ===\n\n", .{});

    // Example 1: Create empty tree
    std.debug.print("1. Creating Empty Tree\n", .{});
    std.debug.print("   -------------------\n", .{});
    var tree = BinaryTree.init(allocator);
    defer tree.deinit();

    const root_hash = tree.rootHash();
    std.debug.print("   Root type: empty\n", .{});
    std.debug.print("   Root hash (all zeros): {}\n", .{std.mem.allEqual(u8, &root_hash, 0)});
    std.debug.print("\n", .{});

    // Example 2: Insert first value
    std.debug.print("2. Inserting First Value\n", .{});
    std.debug.print("   ----------------------\n", .{});

    var key1: [32]u8 = undefined;
    @memset(&key1, 0);
    key1[31] = 5; // Subindex 5

    var value1: [32]u8 = undefined;
    @memset(&value1, 0);
    value1[0] = 0x42;

    try tree.insert(key1, value1);
    std.debug.print("   Key subindex: {}\n", .{key1[31]});
    std.debug.print("   Value[0]: 0x{x}\n", .{value1[0]});
    std.debug.print("   Root type after insert: stem\n", .{});

    const root_hash2 = tree.rootHash();
    const changed = !std.mem.eql(u8, &root_hash, &root_hash2);
    std.debug.print("   Root hash changed: {}\n", .{changed});
    std.debug.print("\n", .{});

    // Example 3: Retrieve value
    std.debug.print("3. Retrieving Value\n", .{});
    std.debug.print("   ----------------\n", .{});

    const retrieved = tree.get(key1);
    if (retrieved) |val| {
        std.debug.print("   Retrieved value[0]: 0x{x}\n", .{val[0]});
        std.debug.print("   Match original: {}\n", .{val[0] == value1[0]});
    } else {
        std.debug.print("   Value not found\n", .{});
    }
    std.debug.print("\n", .{});

    // Example 4: Insert second value (same stem, different subindex)
    std.debug.print("4. Inserting Second Value (Same Stem)\n", .{});
    std.debug.print("   -----------------------------------\n", .{});

    var key2: [32]u8 = undefined;
    @memset(&key2, 0);
    key2[31] = 10; // Different subindex

    var value2: [32]u8 = undefined;
    @memset(&value2, 0);
    value2[0] = 0x99;

    try tree.insert(key2, value2);
    std.debug.print("   Key subindex: {}\n", .{key2[31]});
    std.debug.print("   Value[0]: 0x{x}\n", .{value2[0]});

    const is_stem = tree.root == .stem;
    std.debug.print("   Root still stem type: {}\n", .{is_stem});
    std.debug.print("\n", .{});

    // Example 5: Retrieve multiple values
    std.debug.print("5. Retrieving Multiple Values\n", .{});
    std.debug.print("   ---------------------------\n", .{});

    const val1 = tree.get(key1);
    const val2 = tree.get(key2);

    if (val1) |v| {
        std.debug.print("   Value 1 [subindex 5]: 0x{x}\n", .{v[0]});
    } else {
        std.debug.print("   Value 1 [subindex 5]: null\n", .{});
    }

    if (val2) |v| {
        std.debug.print("   Value 2 [subindex 10]: 0x{x}\n", .{v[0]});
    } else {
        std.debug.print("   Value 2 [subindex 10]: null\n", .{});
    }
    std.debug.print("\n", .{});

    // Example 6: Insert with different stem
    std.debug.print("6. Inserting Different Stem (Creates Internal Node)\n", .{});
    std.debug.print("   ------------------------------------------------\n", .{});

    var key3: [32]u8 = undefined;
    @memset(&key3, 0);
    key3[0] = 0xFF; // Different stem (first byte differs)
    key3[31] = 0;

    var value3: [32]u8 = undefined;
    @memset(&value3, 0);
    value3[0] = 0xAB;

    try tree.insert(key3, value3);
    std.debug.print("   First byte of stem: 0x{x}\n", .{key3[0]});

    const is_internal = tree.root == .internal;
    std.debug.print("   Root type changed to: {s}\n", .{if (is_internal) "internal" else "stem"});
    std.debug.print("   Tree now has branches: {}\n", .{is_internal});
    std.debug.print("\n", .{});

    // Example 7: Query non-existent value
    std.debug.print("7. Querying Non-existent Value\n", .{});
    std.debug.print("   ----------------------------\n", .{});

    var non_existent: [32]u8 = undefined;
    @memset(&non_existent, 0);
    non_existent[31] = 99;

    const not_found = tree.get(non_existent);
    std.debug.print("   Query result: {s}\n", .{if (not_found == null) "null (not found)" else "found"});
    std.debug.print("\n", .{});

    // Example 8: Update existing value
    std.debug.print("8. Updating Existing Value\n", .{});
    std.debug.print("   -----------------------\n", .{});

    var updated_value: [32]u8 = undefined;
    @memset(&updated_value, 0);
    updated_value[0] = 0xFF;

    try tree.insert(key1, updated_value);

    const updated = tree.get(key1);
    std.debug.print("   Original value[0]: 0x{x}\n", .{value1[0]});
    if (updated) |u| {
        std.debug.print("   Updated value[0]: 0x{x}\n", .{u[0]});
    } else {
        std.debug.print("   Updated value[0]: null\n", .{});
    }
    std.debug.print("\n", .{});

    // Example 9: Final state
    std.debug.print("9. Final State\n", .{});
    std.debug.print("   -----------\n", .{});

    const final_hash = tree.rootHash();
    std.debug.print("   Root type: {s}\n", .{@tagName(tree.root)});
    std.debug.print("   Root hash: 0x{x}\n", .{final_hash});
    std.debug.print("\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
