const std = @import("std");
const crypto = @import("crypto");
const SHA256 = crypto.SHA256;
const Keccak256 = crypto.Keccak256;

pub fn main() !void {
    std.debug.print("=== SHA256 vs Keccak256 Comparison ===\n\n", .{});

    // Example 1: Basic hash comparison
    std.debug.print("1. Basic Hash Comparison\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const data = "Hello, World!";
    const sha256_hash = SHA256.hash(data);
    const keccak256_hash = Keccak256.hash(data);

    std.debug.print("Input: \"Hello, World!\"\n", .{});
    std.debug.print("SHA-256:     0x{s}\n", .{std.fmt.fmtSliceHexLower(&sha256_hash)});
    std.debug.print("Keccak-256:  0x{s}\n", .{std.fmt.fmtSliceHexLower(&keccak256_hash)});
    std.debug.print("\nBoth produce 32-byte hashes, but different values!\n\n", .{});

    // Example 2: Empty string hashes
    std.debug.print("2. Empty String Hash Constants\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const empty_sha256 = SHA256.hash("");
    const empty_keccak256 = Keccak256.hash("");

    std.debug.print("Empty string:\n", .{});
    std.debug.print("SHA-256:     0x{s}\n", .{std.fmt.fmtSliceHexLower(&empty_sha256)});
    std.debug.print("Keccak-256:  0x{s}\n\n", .{std.fmt.fmtSliceHexLower(&empty_keccak256)});

    std.debug.print("These are important constants in crypto:\n", .{});
    std.debug.print("SHA-256 empty:    Used in Bitcoin, TLS\n", .{});
    std.debug.print("Keccak-256 empty: Used in Ethereum smart contracts\n\n", .{});

    // Example 3: Use case - Bitcoin vs Ethereum
    std.debug.print("3. Use Cases: Bitcoin vs Ethereum\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const block_data = "Block header data";

    // Bitcoin uses SHA-256 (double)
    const bitcoin_first = SHA256.hash(block_data);
    const bitcoin_block_hash = SHA256.hash(&bitcoin_first);

    // Ethereum uses Keccak-256
    const ethereum_block_hash = Keccak256.hash(block_data);

    std.debug.print("Block header data:\n", .{});
    std.debug.print("Bitcoin (double SHA-256):  0x{s}\n", .{std.fmt.fmtSliceHexLower(&bitcoin_block_hash)});
    std.debug.print("Ethereum (Keccak-256):     0x{s}\n\n", .{std.fmt.fmtSliceHexLower(&ethereum_block_hash)});

    std.debug.print("Bitcoin:  Double SHA-256 for blocks, transactions, Merkle trees\n", .{});
    std.debug.print("Ethereum: Keccak-256 for blocks, state, addresses, topics\n\n", .{});

    // Example 4: Function selector comparison
    std.debug.print("4. Function Selectors (EVM)\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const function_sig = "transfer(address,uint256)";

    // Ethereum uses Keccak-256 for function selectors
    const keccak_hash = Keccak256.hash(function_sig);
    const selector = keccak_hash[0..4];

    std.debug.print("Function signature: {s}\n", .{function_sig});
    std.debug.print("Keccak-256 hash: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&keccak_hash)});
    std.debug.print("Selector (first 4 bytes): 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(selector)});

    // If we used SHA-256 (WRONG for Ethereum!)
    const wrong_hash = SHA256.hash(function_sig);
    const wrong_selector = wrong_hash[0..4];

    std.debug.print("If we incorrectly used SHA-256:\n", .{});
    std.debug.print("SHA-256 hash: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&wrong_hash)});
    std.debug.print("Wrong selector: 0x{s}\n", .{std.fmt.fmtSliceHexLower(wrong_selector)});
    std.debug.print("\n⚠️  Using wrong hash function breaks Ethereum compatibility!\n\n", .{});

    // Example 5: Address derivation
    std.debug.print("5. Address Derivation Differences\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    // Simulated public key
    var public_key: [64]u8 = undefined;
    for (&public_key, 0..) |*b, i| {
        b.* = @intCast(i & 0xFF);
    }

    // Bitcoin: SHA-256 then RIPEMD-160
    std.debug.print("Bitcoin P2PKH address derivation:\n", .{});
    std.debug.print("  Step 1: SHA-256(public_key)\n", .{});
    const bitcoin_step1 = SHA256.hash(&public_key);
    std.debug.print("    Result: 0x{s}...\n", .{std.fmt.fmtSliceHexLower(bitcoin_step1[0..20])});
    std.debug.print("  Step 2: RIPEMD-160(SHA-256(public_key))\n", .{});
    std.debug.print("    Then Base58Check encoding...\n\n", .{});

    // Ethereum: Keccak-256, take last 20 bytes
    std.debug.print("Ethereum address derivation:\n", .{});
    std.debug.print("  Step 1: Keccak-256(public_key)\n", .{});
    const ethereum_step1 = Keccak256.hash(&public_key);
    std.debug.print("    Result: 0x{s}...\n", .{std.fmt.fmtSliceHexLower(ethereum_step1[0..20])});
    std.debug.print("  Step 2: Take last 20 bytes as address\n", .{});
    const ethereum_address = ethereum_step1[12..32];
    std.debug.print("    Address: 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(ethereum_address)});

    // Example 6: Security properties
    std.debug.print("6. Security Properties\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    std.debug.print("SHA-256:\n", .{});
    std.debug.print("  Standard: NIST FIPS 180-4\n", .{});
    std.debug.print("  Collision resistance: 2^128 operations\n", .{});
    std.debug.print("  Preimage resistance: 2^256 operations\n", .{});
    std.debug.print("  Hardware acceleration: SHA-NI (Intel/AMD)\n", .{});
    std.debug.print("  Status: No known practical attacks\n\n", .{});

    std.debug.print("Keccak-256:\n", .{});
    std.debug.print("  Standard: SHA-3 family (original Keccak)\n", .{});
    std.debug.print("  Collision resistance: 2^128 operations\n", .{});
    std.debug.print("  Preimage resistance: 2^256 operations\n", .{});
    std.debug.print("  Hardware acceleration: Limited\n", .{});
    std.debug.print("  Status: No known practical attacks\n\n", .{});

    // Example 7: When to use each
    std.debug.print("7. When to Use Each Algorithm\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    std.debug.print("Use SHA-256 when:\n", .{});
    std.debug.print("  ✓ Bitcoin/blockchain applications\n", .{});
    std.debug.print("  ✓ Digital signatures (RSA, ECDSA)\n", .{});
    std.debug.print("  ✓ Certificate fingerprints\n", .{});
    std.debug.print("  ✓ HMAC for message authentication\n", .{});
    std.debug.print("  ✓ Regulatory compliance required\n", .{});
    std.debug.print("  ✓ Hardware acceleration important\n\n", .{});

    std.debug.print("Use Keccak-256 when:\n", .{});
    std.debug.print("  ✓ Ethereum smart contracts\n", .{});
    std.debug.print("  ✓ EVM function selectors\n", .{});
    std.debug.print("  ✓ Ethereum address derivation\n", .{});
    std.debug.print("  ✓ Event topic hashing\n", .{});
    std.debug.print("  ✓ Solidity keccak256() compatibility\n\n", .{});

    // Example 8: Avalanche effect comparison
    std.debug.print("8. Avalanche Effect Comparison\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const input1 = [_]u8{ 1, 2, 3, 4, 5 };
    const input2 = [_]u8{ 1, 2, 3, 4, 6 }; // Last byte different

    const sha1 = SHA256.hash(&input1);
    const sha2 = SHA256.hash(&input2);
    const kec1 = Keccak256.hash(&input1);
    const kec2 = Keccak256.hash(&input2);

    // Count differing bits for SHA-256
    var sha_diff: u32 = 0;
    for (sha1, sha2) |a, b| {
        sha_diff += @popCount(a ^ b);
    }

    // Count differing bits for Keccak-256
    var kec_diff: u32 = 0;
    for (kec1, kec2) |a, b| {
        kec_diff += @popCount(a ^ b);
    }

    std.debug.print("Input 1: {any}\n", .{input1});
    std.debug.print("Input 2: {any} (last byte differs)\n\n", .{input2});

    const sha_pct = @as(f64, @floatFromInt(sha_diff)) / 2.56;
    const kec_pct = @as(f64, @floatFromInt(kec_diff)) / 2.56;

    std.debug.print("SHA-256 differing bits:     {} / 256 ({d:.1}%)\n", .{ sha_diff, sha_pct });
    std.debug.print("Keccak-256 differing bits:  {} / 256 ({d:.1}%)\n", .{ kec_diff, kec_pct });
    std.debug.print("\nBoth show strong avalanche effect (~50% bits flip)\n\n", .{});

    std.debug.print("=== Comparison Complete ===\n", .{});
}
