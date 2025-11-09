const std = @import("std");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Blake2 EVM Precompile (EIP-152) ===\n\n", .{});

    // 1. Zcash-style hashing (32-byte output)
    std.debug.print("1. Zcash-Style Hashing (BLAKE2b-256)\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    // Zcash uses Blake2b with 32-byte output in Equihash PoW
    const zcash_header = [_]u8{0x01} ** 140; // Zcash block header
    const zcash_hash = try crypto.Blake2.hash(&zcash_header, 32, allocator);
    defer allocator.free(zcash_hash);

    std.debug.print("Zcash header size: {d} bytes\n", .{zcash_header.len});
    std.debug.print("Blake2b-256 hash: 0x", .{});
    for (zcash_hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\nOutput length: {d} bytes (Zcash standard)\n\n", .{zcash_hash.len});

    // 2. EIP-152 precompile context
    std.debug.print("2. EIP-152 Blake2b Precompile Context\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});
    std.debug.print("Address: 0x0000000000000000000000000000000000000009\n", .{});
    std.debug.print("Purpose: Blake2b F compression function\n", .{});
    std.debug.print("Use case: ZCash transaction verification on Ethereum\n", .{});
    std.debug.print("Gas cost: Variable based on rounds parameter\n\n", .{});

    std.debug.print("Unlike full Blake2.hash(), the precompile exposes:\n", .{});
    std.debug.print("- F compression function (internal primitive)\n", .{});
    std.debug.print("- Used for verifying ZCash Equihash proofs\n", .{});
    std.debug.print("- Enables cross-chain ZCash -> Ethereum bridges\n\n", .{});

    // 3. Ethereum use cases
    std.debug.print("3. Ethereum Use Cases for Blake2\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const ethereum_data = "Ethereum transaction data";
    const blake2_hash = try crypto.Blake2.hash(ethereum_data, 32, allocator);
    defer allocator.free(blake2_hash);

    std.debug.print("Example Ethereum data hashing:\n", .{});
    std.debug.print("Input: {d} bytes\n", .{ethereum_data.len});
    std.debug.print("Blake2b-256: 0x", .{});
    for (blake2_hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\nAdvantages over Keccak-256:\n", .{});
    std.debug.print("- 3-4x faster in software\n", .{});
    std.debug.print("- Variable output length (1-64 bytes)\n", .{});
    std.debug.print("- Used in EIP-152 for ZCash interop\n\n", .{});

    // 4. Merkle tree with Blake2
    std.debug.print("4. Merkle Tree with Blake2 (Performance)\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const leaf1 = "leaf1";
    const leaf2 = "leaf2";
    const leaf3 = "leaf3";
    const leaf4 = "leaf4";

    const hash1 = try crypto.Blake2.hash(leaf1, 32, allocator);
    defer allocator.free(hash1);
    const hash2 = try crypto.Blake2.hash(leaf2, 32, allocator);
    defer allocator.free(hash2);
    const hash3 = try crypto.Blake2.hash(leaf3, 32, allocator);
    defer allocator.free(hash3);
    const hash4 = try crypto.Blake2.hash(leaf4, 32, allocator);
    defer allocator.free(hash4);

    std.debug.print("Merkle tree leaf hashing:\n", .{});
    std.debug.print("Leaf 1: 0x", .{});
    for (hash1) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nLeaf 2: 0x", .{});
    for (hash2) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nLeaf 3: 0x", .{});
    for (hash3) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nLeaf 4: 0x", .{});
    for (hash4) |byte| std.debug.print("{x:0>2}", .{byte});

    // Combine pairs and hash
    var combined1 = std.ArrayList(u8){};
    defer combined1.deinit(allocator);
    try combined1.appendSlice(allocator, hash1);
    try combined1.appendSlice(allocator, hash2);

    var combined2 = std.ArrayList(u8){};
    defer combined2.deinit(allocator);
    try combined2.appendSlice(allocator, hash3);
    try combined2.appendSlice(allocator, hash4);

    const parent1 = try crypto.Blake2.hash(combined1.items, 32, allocator);
    defer allocator.free(parent1);
    const parent2 = try crypto.Blake2.hash(combined2.items, 32, allocator);
    defer allocator.free(parent2);

    std.debug.print("\n\nParent 1: 0x", .{});
    for (parent1) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nParent 2: 0x", .{});
    for (parent2) |byte| std.debug.print("{x:0>2}", .{byte});

    // Final root
    var root_data = std.ArrayList(u8){};
    defer root_data.deinit(allocator);
    try root_data.appendSlice(allocator, parent1);
    try root_data.appendSlice(allocator, parent2);

    const merkle_root = try crypto.Blake2.hash(root_data.items, 32, allocator);
    defer allocator.free(merkle_root);

    std.debug.print("\n\nMerkle root: 0x", .{});
    for (merkle_root) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nBlake2 is ideal for Merkle trees due to speed\n\n", .{});

    // 5. IPFS content addressing
    std.debug.print("5. IPFS-Style Content Addressing\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const file_content = [_]u8{0xFF} ** 1024;
    const content_hash = try crypto.Blake2.hash(&file_content, 32, allocator);
    defer allocator.free(content_hash);

    std.debug.print("File size: {d} bytes\n", .{file_content.len});
    std.debug.print("Blake2b content hash: 0x", .{});
    for (content_hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\nIPFS uses Blake2b because:\n", .{});
    std.debug.print("- 2-3x faster than SHA-256\n", .{});
    std.debug.print("- Same security level (256-bit)\n", .{});
    std.debug.print("- Better for large file processing\n\n", .{});

    // 6. Fast checksums
    std.debug.print("6. Fast Checksums for Data Deduplication\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const chunk1 = [_]u8{0xAA} ** 4096;
    const chunk2 = [_]u8{0xBB} ** 4096;
    const chunk3 = [_]u8{0xAA} ** 4096; // Same as chunk1

    const checksum1 = try crypto.Blake2.hash(&chunk1, 16, allocator);
    defer allocator.free(checksum1);
    const checksum2 = try crypto.Blake2.hash(&chunk2, 16, allocator);
    defer allocator.free(checksum2);
    const checksum3 = try crypto.Blake2.hash(&chunk3, 16, allocator);
    defer allocator.free(checksum3);

    std.debug.print("4KB chunk checksums (16 bytes):\n", .{});
    std.debug.print("Chunk 1: 0x", .{});
    for (checksum1) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nChunk 2: 0x", .{});
    for (checksum2) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nChunk 3: 0x", .{});
    for (checksum3) |byte| std.debug.print("{x:0>2}", .{byte});

    const chunks_equal = std.mem.eql(u8, checksum1, checksum3);
    std.debug.print("\n\nChunk 1 == Chunk 3: {}\n", .{chunks_equal});
    std.debug.print("16-byte Blake2 is fast enough for real-time deduplication\n\n", .{});

    // 7. EIP-152 gas costs
    std.debug.print("7. EIP-152 Gas Cost Comparison\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    std.debug.print("Blake2 F precompile gas costs (EIP-152):\n", .{});
    std.debug.print("- Base: 0 gas\n", .{});
    std.debug.print("- Per round: Variable (configured by caller)\n", .{});
    std.debug.print("- Typical: ~12 rounds for security\n", .{});
    std.debug.print("\nCompared to Keccak-256:\n", .{});
    std.debug.print("- Keccak-256: 30 gas + 6 gas per word\n", .{});
    std.debug.print("- Blake2 F: More efficient for certain operations\n", .{});
    std.debug.print("- Enables ZCash proof verification on-chain\n\n", .{});

    std.debug.print("=== Complete ===\n", .{});
}
