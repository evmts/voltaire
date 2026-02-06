const std = @import("std");
const precompiles = @import("precompiles");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== SHA256 Bitcoin Integration ===\n\n", .{});

    // Example 1: Bitcoin Double SHA-256 (block hashing)
    std.debug.print("=== Example 1: Double SHA-256 (Bitcoin Block Hash) ===\n", .{});

    // Simulate a Bitcoin block header (80 bytes)
    var block_header: [80]u8 = undefined;
    // Version (4 bytes)
    @memcpy(block_header[0..4], &[_]u8{ 0x01, 0x00, 0x00, 0x00 });
    // Previous block hash (32 bytes) - simplified
    @memset(block_header[4..36], 0xaa);
    // Merkle root (32 bytes) - simplified
    @memset(block_header[36..68], 0xbb);
    // Timestamp (4 bytes)
    @memcpy(block_header[68..72], &[_]u8{ 0x4e, 0x61, 0xbc, 0x00 });
    // Bits (4 bytes)
    @memcpy(block_header[72..76], &[_]u8{ 0xff, 0xff, 0x00, 0x1d });
    // Nonce (4 bytes)
    @memcpy(block_header[76..80], &[_]u8{ 0x01, 0x23, 0x45, 0x67 });

    std.debug.print("Block header size: {} bytes\n", .{block_header.len});

    // First SHA-256
    const words1 = (block_header.len + 31) / 32;
    const gas1: u64 = 60 + 12 * words1;
    std.debug.print("First SHA-256 gas: {}\n", .{gas1});

    const first_hash = try precompiles.sha256.execute(allocator, &block_header, gas1);
    defer first_hash.deinit(allocator);

    std.debug.print("First hash: 0x{s}\n", .{std.fmt.fmtSliceHexLower(first_hash.output)});

    // Second SHA-256 (Bitcoin uses double SHA-256)
    const words2 = (first_hash.output.len + 31) / 32;
    const gas2: u64 = 60 + 12 * words2;
    std.debug.print("Second SHA-256 gas: {}\n", .{gas2});

    const block_hash = try precompiles.sha256.execute(allocator, first_hash.output, gas2);
    defer block_hash.deinit(allocator);

    std.debug.print("Block hash (double SHA-256): 0x{s}\n", .{std.fmt.fmtSliceHexLower(block_hash.output)});
    std.debug.print("Total gas: {}\n", .{first_hash.gas_used + block_hash.gas_used});

    // Example 2: Bitcoin P2PKH Address Generation (Part 1: SHA-256)
    std.debug.print("\n=== Example 2: Bitcoin Address Generation (SHA-256 step) ===\n", .{});

    // Simulate a Bitcoin public key (33 bytes compressed format)
    var public_key: [33]u8 = undefined;
    public_key[0] = 0x02; // Compressed public key prefix
    crypto.getRandomValues(public_key[1..]);

    std.debug.print("Public key (compressed): 0x{s}\n", .{std.fmt.fmtSliceHexLower(&public_key)});

    // Step 1: SHA-256 of public key
    const pk_words = (public_key.len + 31) / 32;
    const pk_gas: u64 = 60 + 12 * pk_words;

    const sha256_hash = try precompiles.sha256.execute(allocator, &public_key, pk_gas);
    defer sha256_hash.deinit(allocator);

    std.debug.print("SHA-256(pubkey): 0x{s}\n", .{std.fmt.fmtSliceHexLower(sha256_hash.output)});
    std.debug.print("Next step: RIPEMD-160(SHA-256(pubkey)) - see RIPEMD160 examples\n", .{});
    std.debug.print("Gas used: {}\n", .{sha256_hash.gas_used});

    // Example 3: Merkle Tree for Bitcoin SPV
    std.debug.print("\n=== Example 3: Bitcoin Merkle Tree Construction ===\n", .{});

    // Simulate transaction hashes (Bitcoin uses double SHA-256 for each)
    const tx1 = [_]u8{0x11} ** 32;
    const tx2 = [_]u8{0x22} ** 32;
    const tx3 = [_]u8{0x33} ** 32;
    const tx4 = [_]u8{0x44} ** 32;

    std.debug.print("Building Merkle tree for 4 transactions...\n", .{});

    // Combine tx1 and tx2, then double SHA-256
    var pair1: [64]u8 = undefined;
    @memcpy(pair1[0..32], &tx1);
    @memcpy(pair1[32..64], &tx2);

    const hash1_first = try precompiles.sha256.execute(allocator, &pair1, 60 + 12 * 2);
    defer hash1_first.deinit(allocator);

    const hash1_second = try precompiles.sha256.execute(allocator, hash1_first.output, 60 + 12);
    defer hash1_second.deinit(allocator);

    std.debug.print("Node 1 (tx1+tx2): 0x{s}...\n", .{std.fmt.fmtSliceHexLower(hash1_second.output[0..8])});

    // Combine tx3 and tx4, then double SHA-256
    var pair2: [64]u8 = undefined;
    @memcpy(pair2[0..32], &tx3);
    @memcpy(pair2[32..64], &tx4);

    const hash2_first = try precompiles.sha256.execute(allocator, &pair2, 60 + 12 * 2);
    defer hash2_first.deinit(allocator);

    const hash2_second = try precompiles.sha256.execute(allocator, hash2_first.output, 60 + 12);
    defer hash2_second.deinit(allocator);

    std.debug.print("Node 2 (tx3+tx4): 0x{s}...\n", .{std.fmt.fmtSliceHexLower(hash2_second.output[0..8])});

    // Combine nodes to get merkle root
    var root: [64]u8 = undefined;
    @memcpy(root[0..32], hash1_second.output);
    @memcpy(root[32..64], hash2_second.output);

    const root_first = try precompiles.sha256.execute(allocator, &root, 60 + 12 * 2);
    defer root_first.deinit(allocator);

    const merkle_root = try precompiles.sha256.execute(allocator, root_first.output, 60 + 12);
    defer merkle_root.deinit(allocator);

    std.debug.print("Merkle root: 0x{s}\n", .{std.fmt.fmtSliceHexLower(merkle_root.output)});

    // Calculate total gas for merkle tree
    const total_merkle_gas = hash1_first.gas_used + hash1_second.gas_used +
        hash2_first.gas_used + hash2_second.gas_used +
        root_first.gas_used + merkle_root.gas_used;
    std.debug.print("Total gas for 4-tx merkle tree: {}\n", .{total_merkle_gas});

    // Example 4: Gas comparison with Keccak256
    std.debug.print("\n=== Example 4: SHA-256 vs Keccak256 Gas Costs ===\n", .{});
    std.debug.print("Operation: Hash 1000 bytes\n", .{});

    const sha256_words = (1000 + 31) / 32;
    const sha256_gas: u64 = 60 + 12 * sha256_words;
    const keccak256_gas: u64 = 30 + 6 * sha256_words; // Keccak256 formula

    std.debug.print("SHA-256 gas: {}\n", .{sha256_gas});
    std.debug.print("Keccak256 gas: {} (would be)\n", .{keccak256_gas});
    std.debug.print("Difference: {} gas more expensive\n", .{sha256_gas - keccak256_gas});
    std.debug.print("\nRecommendation: Use Keccak256 for Ethereum-native hashing\n", .{});
    std.debug.print("Use SHA-256 when interoperating with Bitcoin or other SHA-256 systems\n", .{});

    std.debug.print("\n=== Summary ===\n", .{});
    std.debug.print("Bitcoin block hash: 2 SHA-256 calls (~144 gas for 80-byte header)\n", .{});
    std.debug.print("Bitcoin address: SHA-256 + RIPEMD-160 (~792 gas)\n", .{});
    std.debug.print("4-tx Merkle tree: 6 double SHA-256 calls (~864 gas)\n", .{});
    std.debug.print("SPV proof verification: Proportional to tree depth\n", .{});
}
