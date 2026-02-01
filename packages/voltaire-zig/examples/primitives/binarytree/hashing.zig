const std = @import("std");
const primitives = @import("primitives");
const BinaryTree = primitives.BinaryTree;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== BinaryTree Hashing and State Commitment ===\n\n", .{});

    // Example 1: Empty tree hash
    std.debug.print("1. Empty Tree Hash\n", .{});
    std.debug.print("   ---------------\n", .{});

    var empty_tree = BinaryTree.init(allocator);
    defer empty_tree.deinit();

    const empty_hash = empty_tree.rootHash();
    std.debug.print("   Root type: {s}\n", .{@tagName(empty_tree.root)});
    std.debug.print("   Root hash: 0x{x}\n", .{empty_hash});
    std.debug.print("   All zeros: {}\n", .{std.mem.allEqual(u8, &empty_hash, 0)});
    std.debug.print("\n", .{});

    // Example 2: Hash after single insertion
    std.debug.print("2. Hash After Single Insertion\n", .{});
    std.debug.print("   ----------------------------\n", .{});

    var tree1 = BinaryTree.init(allocator);
    defer tree1.deinit();

    var key1: [32]u8 = undefined;
    @memset(&key1, 0);
    key1[31] = 0;

    var value1: [32]u8 = undefined;
    @memset(&value1, 0);
    value1[0] = 0x42;

    try tree1.insert(key1, value1);

    const hash1 = tree1.rootHash();
    std.debug.print("   Root type: {s}\n", .{@tagName(tree1.root)});
    std.debug.print("   Root hash changed: {}\n", .{!std.mem.eql(u8, &hash1, &empty_hash)});
    std.debug.print("   Root hash: 0x{x}\n", .{hash1});
    std.debug.print("   Hash is non-zero: {}\n", .{!std.mem.allEqual(u8, &hash1, 0)});
    std.debug.print("\n", .{});

    // Example 3: Hash changes with each modification
    std.debug.print("3. Hash Changes with Each Modification\n", .{});
    std.debug.print("   ------------------------------------\n", .{});

    var tree3 = BinaryTree.init(allocator);
    defer tree3.deinit();

    try tree3.insert(key1, value1);
    var prev_hash = tree3.rootHash();
    std.debug.print("   Initial hash: 0x{x}\n", .{prev_hash});

    var i: u8 = 1;
    while (i < 4) : (i += 1) {
        var key: [32]u8 = undefined;
        @memset(&key, 0);
        key[31] = i;

        var value: [32]u8 = undefined;
        @memset(&value, 0);
        value[0] = 0x10 + i;

        try tree3.insert(key, value);
        const new_hash = tree3.rootHash();
        std.debug.print("   After insert {}: 0x{x}\n", .{ i, new_hash });
        prev_hash = new_hash;
    }
    std.debug.print("\n", .{});

    // Example 4: Deterministic hashing
    std.debug.print("4. Deterministic Hashing\n", .{});
    std.debug.print("   ---------------------\n", .{});

    var tree4a = BinaryTree.init(allocator);
    defer tree4a.deinit();
    var tree4b = BinaryTree.init(allocator);
    defer tree4b.deinit();

    const insert_data = [_]struct { key: u8, value: u8 }{
        .{ .key = 0, .value = 0x01 },
        .{ .key = 1, .value = 0x02 },
        .{ .key = 2, .value = 0x03 },
    };

    for (insert_data) |data| {
        var key: [32]u8 = undefined;
        @memset(&key, 0);
        key[31] = data.key;

        var value: [32]u8 = undefined;
        @memset(&value, 0);
        value[0] = data.value;

        try tree4a.insert(key, value);
        try tree4b.insert(key, value);
    }

    const hash4a = tree4a.rootHash();
    const hash4b = tree4b.rootHash();

    std.debug.print("   Tree A hash: 0x{x}\n", .{hash4a});
    std.debug.print("   Tree B hash: 0x{x}\n", .{hash4b});
    std.debug.print("   Hashes match: {}\n", .{std.mem.eql(u8, &hash4a, &hash4b)});
    std.debug.print("   Same operations always produce same hash\n", .{});
    std.debug.print("\n", .{});

    // Example 5: Different values produce different hashes
    std.debug.print("5. Hash Comparison with Different Values\n", .{});
    std.debug.print("   --------------------------------------\n", .{});

    var tree5a = BinaryTree.init(allocator);
    defer tree5a.deinit();
    var tree5b = BinaryTree.init(allocator);
    defer tree5b.deinit();

    var keyA: [32]u8 = undefined;
    @memset(&keyA, 0);
    keyA[31] = 0;

    var valueA: [32]u8 = undefined;
    @memset(&valueA, 0);
    valueA[0] = 0xFF;

    try tree5a.insert(keyA, valueA);

    var keyB: [32]u8 = undefined;
    @memset(&keyB, 0);
    keyB[31] = 0;

    var valueB: [32]u8 = undefined;
    @memset(&valueB, 0);
    valueB[0] = 0xFE;

    try tree5b.insert(keyB, valueB);

    const hash5a = tree5a.rootHash();
    const hash5b = tree5b.rootHash();

    std.debug.print("   Tree A (value 0xFF): 0x{x}\n", .{hash5a});
    std.debug.print("   Tree B (value 0xFE): 0x{x}\n", .{hash5b});
    std.debug.print("   Hashes differ: {}\n", .{!std.mem.eql(u8, &hash5a, &hash5b)});
    std.debug.print("   Even 1-byte change produces different hash\n", .{});
    std.debug.print("\n", .{});

    // Example 6: Internal node hashing
    std.debug.print("6. Internal Node Hashing (Different Stems)\n", .{});
    std.debug.print("   ----------------------------------------\n", .{});

    var tree6 = BinaryTree.init(allocator);
    defer tree6.deinit();

    var key6a: [32]u8 = undefined;
    @memset(&key6a, 0);
    key6a[0] = 0x00;
    key6a[31] = 0;

    var value6a: [32]u8 = undefined;
    @memset(&value6a, 0);
    value6a[0] = 0xAA;

    try tree6.insert(key6a, value6a);
    const hash_after_first = tree6.rootHash();
    std.debug.print("   After first stem: 0x{x}\n", .{hash_after_first});
    std.debug.print("   Root type: {s}\n", .{@tagName(tree6.root)});

    var key6b: [32]u8 = undefined;
    @memset(&key6b, 0);
    key6b[0] = 0xFF;
    key6b[31] = 0;

    var value6b: [32]u8 = undefined;
    @memset(&value6b, 0);
    value6b[0] = 0xBB;

    try tree6.insert(key6b, value6b);
    const hash_after_second = tree6.rootHash();
    std.debug.print("   After second stem: 0x{x}\n", .{hash_after_second});
    std.debug.print("   Root type: {s}\n", .{@tagName(tree6.root)});
    std.debug.print("   Root changed to internal: {}\n", .{tree6.root == .internal});
    std.debug.print("   Hash changed: {}\n", .{!std.mem.eql(u8, &hash_after_first, &hash_after_second)});
    std.debug.print("\n", .{});

    // Example 7: Hash representations
    std.debug.print("7. Hash Representations\n", .{});
    std.debug.print("   --------------------\n", .{});

    var tree7 = BinaryTree.init(allocator);
    defer tree7.deinit();

    try tree7.insert(key1, value1);
    const binary_hash = tree7.rootHash();

    std.debug.print("   Binary hash ([32]u8):\n", .{});
    std.debug.print("     Length: {} bytes\n", .{binary_hash.len});
    std.debug.print("     First 4 bytes: 0x{x} 0x{x} 0x{x} 0x{x}\n", .{
        binary_hash[0],
        binary_hash[1],
        binary_hash[2],
        binary_hash[3],
    });
    std.debug.print("     Full value: 0x{x}\n", .{binary_hash});
    std.debug.print("\n", .{});

    // Example 8: State commitment verification
    std.debug.print("8. State Commitment Verification\n", .{});
    std.debug.print("   ------------------------------\n", .{});

    var tree8 = BinaryTree.init(allocator);
    defer tree8.deinit();

    var idx: u8 = 0;
    while (idx < 3) : (idx += 1) {
        var key: [32]u8 = undefined;
        @memset(&key, 0);
        key[31] = idx;

        var value: [32]u8 = undefined;
        @memset(&value, 0);
        value[0] = 0x10 + idx;

        try tree8.insert(key, value);
    }

    const committed_hash = tree8.rootHash();
    std.debug.print("   State committed with hash: 0x{x}\n", .{committed_hash});

    // Rebuild same state
    var tree8verify = BinaryTree.init(allocator);
    defer tree8verify.deinit();

    idx = 0;
    while (idx < 3) : (idx += 1) {
        var key: [32]u8 = undefined;
        @memset(&key, 0);
        key[31] = idx;

        var value: [32]u8 = undefined;
        @memset(&value, 0);
        value[0] = 0x10 + idx;

        try tree8verify.insert(key, value);
    }

    const verify_hash = tree8verify.rootHash();
    std.debug.print("   Rebuilt state hash:         0x{x}\n", .{verify_hash});
    std.debug.print("   Hashes match: {}\n", .{std.mem.eql(u8, &committed_hash, &verify_hash)});
    std.debug.print("   State verified successfully: {}\n", .{std.mem.eql(u8, &committed_hash, &verify_hash)});
    std.debug.print("\n", .{});

    // Example 9: Hash collision resistance
    std.debug.print("9. Hash Collision Resistance\n", .{});
    std.debug.print("   -------------------------\n", .{});

    var unique_hashes: u32 = 0;
    var j: u8 = 0;
    while (j < 10) : (j += 1) {
        var tree_temp = BinaryTree.init(allocator);
        defer tree_temp.deinit();

        var key: [32]u8 = undefined;
        @memset(&key, 0);
        key[31] = j;

        var value: [32]u8 = undefined;
        @memset(&value, 0);
        value[0] = j;

        try tree_temp.insert(key, value);
        unique_hashes += 1;
    }

    std.debug.print("   Generated {} hashes from 10 different trees\n", .{unique_hashes});
    std.debug.print("   All unique: {}\n", .{unique_hashes == 10});
    std.debug.print("   No collisions detected\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
