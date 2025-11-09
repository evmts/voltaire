const std = @import("std");
const primitives = @import("primitives");
const BinaryTree = primitives.BinaryTree;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    _ = allocator;

    std.debug.print("\n=== BinaryTree Key Utilities ===\n\n", .{});

    // Example 1: Address to key conversion
    std.debug.print("1. Address to Key Conversion\n", .{});
    std.debug.print("   --------------------------\n", .{});

    var address: [20]u8 = undefined;
    @memset(&address, 0);
    address[0] = 0xf3;
    address[1] = 0x9f;
    address[2] = 0xd6;
    address[19] = 0x66;

    std.debug.print("   Original address (20 bytes):\n", .{});
    std.debug.print("     First bytes: 0x{x}{x}{x}\n", .{ address[0], address[1], address[2] });
    std.debug.print("     Last byte: 0x{x}\n", .{address[19]});

    const key = BinaryTree.addressToKey(address);
    std.debug.print("   Converted key (32 bytes):\n", .{});
    std.debug.print("     Length: {}\n", .{key.len});

    var all_zeros = true;
    for (key[0..12]) |b| {
        if (b != 0) all_zeros = false;
    }
    std.debug.print("     First 12 bytes (padding): all zeros: {}\n", .{all_zeros});
    std.debug.print("     Byte[12] (first address byte): 0x{x}\n", .{key[12]});
    std.debug.print("     Byte[13] (second address byte): 0x{x}\n", .{key[13]});
    std.debug.print("     Byte[31] (last address byte): 0x{x}\n", .{key[31]});
    std.debug.print("\n", .{});

    // Example 2: Key splitting
    std.debug.print("2. Splitting Key into Stem and Subindex\n", .{});
    std.debug.print("   -------------------------------------\n", .{});

    var test_key: [32]u8 = undefined;
    @memset(&test_key, 0xAA);
    test_key[31] = 0x42; // Subindex

    const split = BinaryTree.splitKey(test_key);
    std.debug.print("   Full key[0]: 0x{x}\n", .{test_key[0]});
    std.debug.print("   Full key[30]: 0x{x}\n", .{test_key[30]});
    std.debug.print("   Full key[31]: 0x{x}\n", .{test_key[31]});
    std.debug.print("   Stem length: {} bytes\n", .{split.stem.len});
    std.debug.print("   Stem[0]: 0x{x}\n", .{split.stem[0]});
    std.debug.print("   Stem[30]: 0x{x}\n", .{split.stem[30]});
    std.debug.print("   Subindex: {} (0x{x})\n", .{ split.idx, split.idx });
    std.debug.print("\n", .{});

    // Example 3: Stem bit extraction
    std.debug.print("3. Extracting Stem Bits (Tree Traversal)\n", .{});
    std.debug.print("   -------------------------------------\n", .{});

    var stem_example: BinaryTree.Stem = undefined;
    @memset(&stem_example, 0);
    stem_example[0] = 0b10101010; // Binary: 1-0-1-0-1-0-1-0

    std.debug.print("   Stem byte[0]: 0b{b:0>8}\n", .{stem_example[0]});
    std.debug.print("   Bit positions (left to right):\n", .{});

    var pos: usize = 0;
    while (pos < 8) : (pos += 1) {
        const bit = BinaryTree.getStemBit(stem_example, pos);
        const direction = if (bit == 0) "left" else "right";
        std.debug.print("     Position {}: {} (go {s})\n", .{ pos, bit, direction });
    }
    std.debug.print("\n", .{});

    // Example 4: Tree path visualization
    std.debug.print("4. Visualizing Tree Path\n", .{});
    std.debug.print("   ---------------------\n", .{});

    var path_stem: BinaryTree.Stem = undefined;
    @memset(&path_stem, 0);
    path_stem[0] = 0b11000000; // First two bits: 1, 1

    std.debug.print("   Stem byte[0]: 0b{b:0>8}\n", .{path_stem[0]});
    std.debug.print("   Tree path (first 5 levels):\n", .{});
    std.debug.print("     Path: Root ", .{});

    var depth: usize = 0;
    while (depth < 5) : (depth += 1) {
        const bit = BinaryTree.getStemBit(path_stem, depth);
        const dir = if (bit == 0) "L" else "R";
        std.debug.print("→ {s} ", .{dir});
    }
    std.debug.print("\n", .{});
    std.debug.print("     (L = left, R = right)\n", .{});
    std.debug.print("\n", .{});

    // Example 5: Different stems for different accounts
    std.debug.print("5. Different Stems for Different Accounts\n", .{});
    std.debug.print("   ---------------------------------------\n", .{});

    var addr1: [20]u8 = undefined;
    @memset(&addr1, 0);
    addr1[0] = 0x00; // First bit of stem will be 0

    var addr2: [20]u8 = undefined;
    @memset(&addr2, 0);
    addr2[0] = 0x80; // First bit of stem will be 1

    const key1 = BinaryTree.addressToKey(addr1);
    const key2 = BinaryTree.addressToKey(addr2);

    const split1 = BinaryTree.splitKey(key1);
    const split2 = BinaryTree.splitKey(key2);

    const bit1_0 = BinaryTree.getStemBit(split1.stem, 0);
    const bit2_0 = BinaryTree.getStemBit(split2.stem, 0);

    std.debug.print("   Account 1:\n", .{});
    std.debug.print("     Address[0]: 0x{x}\n", .{addr1[0]});
    std.debug.print("     Stem bit 0: {} (goes {s})\n", .{ bit1_0, if (bit1_0 == 0) "left)" else "right)" });

    std.debug.print("   Account 2:\n", .{});
    std.debug.print("     Address[0]: 0x{x}\n", .{addr2[0]});
    std.debug.print("     Stem bit 0: {} (goes {s})\n", .{ bit2_0, if (bit2_0 == 0) "left)" else "right)" });

    std.debug.print("   Stems differ at bit 0: {}\n", .{bit1_0 != bit2_0});
    std.debug.print("   Tree will branch at root level\n", .{});
    std.debug.print("\n", .{});

    // Example 6: Subindex usage
    std.debug.print("6. Subindex Usage for Account Data\n", .{});
    std.debug.print("   --------------------------------\n", .{});

    const base_key = BinaryTree.addressToKey(address);

    std.debug.print("   Base key for address\n", .{});
    std.debug.print("   Different subindices for different data:\n", .{});

    const subindex_map = [_]struct { idx: u8, desc: []const u8 }{
        .{ .idx = 0, .desc = "Account basic data (version, nonce, balance, code size)" },
        .{ .idx = 1, .desc = "Storage slot 0" },
        .{ .idx = 2, .desc = "Storage slot 1" },
        .{ .idx = 128, .desc = "Storage slot 127" },
        .{ .idx = 255, .desc = "Storage slot 254" },
    };

    for (subindex_map) |mapping| {
        var key_for_idx = base_key;
        key_for_idx[31] = mapping.idx;
        std.debug.print("     Subindex {d:3}: {s}\n", .{ mapping.idx, mapping.desc });
    }
    std.debug.print("\n", .{});

    // Example 7: Complete key breakdown
    std.debug.print("7. Complete Key Structure Breakdown\n", .{});
    std.debug.print("   ---------------------------------\n", .{});

    var example_key: [32]u8 = undefined;
    @memset(&example_key, 0);
    example_key[12] = 0xAB; // Address start
    example_key[13] = 0xCD;
    example_key[31] = 5; // Subindex

    std.debug.print("   32-byte key structure:\n", .{});
    std.debug.print("   ┌─────────────────────────────────────────┬────┐\n", .{});
    std.debug.print("   │          31-byte Stem                   │ Idx│\n", .{});
    std.debug.print("   │  (tree navigation path)                 │    │\n", .{});
    std.debug.print("   └─────────────────────────────────────────┴────┘\n", .{});
    std.debug.print("   Bytes[0-11]:  Padding (0x00) for address keys\n", .{});
    std.debug.print("   Bytes[12-30]: Address bytes (20 bytes total)\n", .{});
    std.debug.print("   Byte[31]:     Subindex (0-255)\n", .{});
    std.debug.print("\n", .{});
    std.debug.print("   Example key:\n", .{});
    std.debug.print("     Byte[12]: 0x{x}\n", .{example_key[12]});
    std.debug.print("     Byte[13]: 0x{x}\n", .{example_key[13]});
    std.debug.print("     Byte[31]: {} (subindex)\n", .{example_key[31]});

    const ex_split = BinaryTree.splitKey(example_key);
    std.debug.print("   Split result:\n", .{});
    std.debug.print("     Stem length: {} bytes\n", .{ex_split.stem.len});
    std.debug.print("     Subindex: {}\n", .{ex_split.idx});
    std.debug.print("\n", .{});

    // Example 8: Bit-level tree navigation
    std.debug.print("8. Bit-Level Tree Navigation\n", .{});
    std.debug.print("   --------------------------\n", .{});

    var nav_stem: BinaryTree.Stem = undefined;
    @memset(&nav_stem, 0);
    nav_stem[0] = 0b10110100;

    std.debug.print("   Stem byte[0]: 0b{b:0>8}\n", .{nav_stem[0]});
    std.debug.print("   Navigation through tree:\n", .{});
    std.debug.print("\n", .{});
    std.debug.print("          Root\n", .{});

    var nav_depth: usize = 0;
    while (nav_depth < 4) : (nav_depth += 1) {
        const bit = BinaryTree.getStemBit(nav_stem, nav_depth);
        const direction = if (bit == 0) "left" else "right";
        const arrow = if (bit == 0) "/" else "\\";

        var i: usize = 0;
        while (i <= nav_depth + 1) : (i += 1) {
            std.debug.print("  ", .{});
        }
        std.debug.print("          {s} (bit {} = {}, go {s})\n", .{ arrow, nav_depth, bit, direction });
    }
    std.debug.print("\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
