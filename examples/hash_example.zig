const std = @import("std");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Ethereum Hash Types and Utilities Demo ===\n\n", .{});

    // Basic hash creation
    std.debug.print("1. Basic Hash Creation:\n", .{});
    const data = "Hello, Ethereum!";
    const hash = primitives.Hash.keccak256(data);
    const hex = primitives.Hash.to_hex(hash);
    std.debug.print("   Data: {s}\n", .{data});
    std.debug.print("   Hash: {s}\n", .{hex});
    std.debug.print("   Is zero: {}\n\n", .{primitives.Hash.is_zero(hash)});

    // Hash types
    std.debug.print("2. Different Hash Types:\n", .{});
    const block_hash: primitives.Hash.BlockHash = primitives.Hash.keccak256("block_data");
    const tx_hash: primitives.Hash.TxHash = primitives.Hash.keccak256("transaction_data");
    const storage_key: primitives.Hash.StorageKey = primitives.Hash.keccak256("storage_key");

    std.debug.print("   Block Hash: {s}\n", .{primitives.Hash.to_hex(block_hash)});
    std.debug.print("   TX Hash: {s}\n", .{primitives.Hash.to_hex(tx_hash)});
    std.debug.print("   Storage Key: {s}\n\n", .{primitives.Hash.to_hex(storage_key)});

    // Function selectors
    std.debug.print("3. Function Selectors:\n", .{});
    const transfer_selector = primitives.Hash.selector_from_signature("transfer(address,uint256)");
    const approve_selector = primitives.Hash.selector_from_signature("approve(address,uint256)");

    std.debug.print("   transfer(address,uint256): 0x{x:0>2}{x:0>2}{x:0>2}{x:0>2}\n", .{ transfer_selector[0], transfer_selector[1], transfer_selector[2], transfer_selector[3] });
    std.debug.print("   approve(address,uint256): 0x{x:0>2}{x:0>2}{x:0>2}{x:0>2}\n\n", .{ approve_selector[0], approve_selector[1], approve_selector[2], approve_selector[3] });

    // Hash arithmetic
    std.debug.print("4. Hash Arithmetic:\n", .{});
    const hash1 = primitives.Hash.keccak256("first");
    const hash2 = primitives.Hash.keccak256("second");
    const xor_result = primitives.Hash.xor(hash1, hash2);
    const and_result = primitives.Hash.bit_and(hash1, hash2);

    std.debug.print("   Hash1: {s}\n", .{primitives.Hash.format_hash_short(hash1)});
    std.debug.print("   Hash2: {s}\n", .{primitives.Hash.format_hash_short(hash2)});
    std.debug.print("   XOR:   {s}\n", .{primitives.Hash.format_hash_short(xor_result)});
    std.debug.print("   AND:   {s}\n\n", .{primitives.Hash.format_hash_short(and_result)});

    // EIP-191 message hashing
    std.debug.print("5. EIP-191 Message Hashing:\n", .{});
    const message = "Sign this message";
    const eip191_hash = try primitives.Hash.eip191_hash_message(message, allocator);
    std.debug.print("   Message: {s}\n", .{message});
    std.debug.print("   EIP-191 Hash: {s}\n\n", .{primitives.Hash.to_hex(eip191_hash)});

    // Bloom filter
    std.debug.print("6. Bloom Filter:\n", .{});
    var bloom = primitives.Hash.empty_bloom();
    primitives.Hash.bloom_add_hash(&bloom, hash1);
    primitives.Hash.bloom_add_hash(&bloom, hash2);

    std.debug.print("   Added hash1 and hash2 to bloom filter\n", .{});
    std.debug.print("   Contains hash1: {}\n", .{primitives.Hash.bloom_contains_hash(bloom, hash1)});
    std.debug.print("   Contains hash2: {}\n", .{primitives.Hash.bloom_contains_hash(bloom, hash2)});
    std.debug.print("   Contains different hash: {}\n\n", .{primitives.Hash.bloom_contains_hash(bloom, hash)});

    // Merkle tree
    std.debug.print("7. Merkle Tree:\n", .{});
    const leaf1 = primitives.Hash.keccak256("leaf1");
    const leaf2 = primitives.Hash.keccak256("leaf2");
    const merkle_root = primitives.Hash.merkle_hash_pair(leaf1, leaf2);

    std.debug.print("   Leaf1: {s}\n", .{primitives.Hash.format_hash_short(leaf1)});
    std.debug.print("   Leaf2: {s}\n", .{primitives.Hash.format_hash_short(leaf2)});
    std.debug.print("   Root:  {s}\n\n", .{primitives.Hash.format_hash_short(merkle_root)});

    // Hash utilities
    std.debug.print("8. Hash Utilities:\n", .{});
    const distance = primitives.Hash.hash_distance(hash1, hash2);
    const double_hash = primitives.Hash.double_keccak256("test");
    const prefixed_hash = try primitives.Hash.hash_with_prefix("domain:", "data", allocator);

    std.debug.print("   Distance between hash1 and hash2: {}\n", .{distance});
    std.debug.print("   Double hash: {s}\n", .{primitives.Hash.format_hash_short(double_hash)});
    std.debug.print("   Prefixed hash: {s}\n\n", .{primitives.Hash.format_hash_short(prefixed_hash)});

    std.debug.print("=== Hash Demo Complete ===\n", .{});
}
