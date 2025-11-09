const std = @import("std");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Bitcoin Address Derivation with RIPEMD160 ===\n\n", .{});

    // 1. P2PKH Address Generation
    std.debug.print("1. P2PKH Address Generation\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    // Simulate a Bitcoin public key (65 bytes uncompressed)
    var public_key: [65]u8 = undefined;
    public_key[0] = 0x04; // Uncompressed prefix
    for (1..65) |i| {
        public_key[i] = @intCast(i % 256);
    }

    std.debug.print("Step 1: Start with public key\n", .{});
    std.debug.print("Public key (65 bytes): 0x", .{});
    for (public_key[0..20]) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("...\n", .{});

    // Step 2: SHA-256 hash of public key
    const sha256_hash = try crypto.SHA256.hash(&public_key, allocator);
    defer allocator.free(sha256_hash);

    std.debug.print("\nStep 2: SHA-256 hash of public key\n", .{});
    std.debug.print("SHA-256: 0x", .{});
    for (sha256_hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    // Step 3: RIPEMD160 hash of SHA-256 result
    const pubkey_hash = try crypto.Ripemd160.hash(sha256_hash, allocator);
    defer allocator.free(pubkey_hash);

    std.debug.print("\nStep 3: RIPEMD160 hash of SHA-256 result\n", .{});
    std.debug.print("RIPEMD160: 0x", .{});
    for (pubkey_hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\nLength: {d} bytes (Bitcoin address size)\n\n", .{pubkey_hash.len});

    std.debug.print("This 20-byte hash is the \"pubkey hash\" used in Bitcoin addresses\n", .{});
    std.debug.print("(Would be Base58Check encoded with version byte 0x00 for mainnet)\n\n", .{});

    // 2. P2SH Address Generation
    std.debug.print("2. P2SH Address Generation\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    // Simulate a redeem script (2-of-3 multisig)
    const redeem_script = [_]u8{
        0x52, // OP_2
        0x21, 0x03,
    } ++ [_]u8{0xAA} ** 32 ++ // Pubkey 1
        [_]u8{
        0x21, 0x03,
    } ++ [_]u8{0xBB} ** 32 ++ // Pubkey 2
        [_]u8{
        0x21, 0x03,
    } ++ [_]u8{0xCC} ** 32 ++ // Pubkey 3
        [_]u8{
        0x53, // OP_3
        0xAE, // OP_CHECKMULTISIG
    };

    std.debug.print("Redeem script (2-of-3 multisig):\n", .{});
    std.debug.print("Script bytes: {d}\n", .{redeem_script.len});

    // Step 1: SHA-256 of redeem script
    const script_sha256 = try crypto.SHA256.hash(&redeem_script, allocator);
    defer allocator.free(script_sha256);

    std.debug.print("\nSHA-256 of script: 0x", .{});
    for (script_sha256) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    // Step 2: RIPEMD160 of SHA-256 result
    const script_hash = try crypto.Ripemd160.hash(script_sha256, allocator);
    defer allocator.free(script_hash);

    std.debug.print("RIPEMD160 of SHA-256: 0x", .{});
    for (script_hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\nThis 20-byte hash is the P2SH address\n", .{});
    std.debug.print("(Would be Base58Check encoded with version byte 0x05 for mainnet)\n\n", .{});

    // 3. Why Bitcoin uses both algorithms
    std.debug.print("3. Why Bitcoin Uses Both SHA-256 and RIPEMD160\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    std.debug.print("Reasons for double hashing:\n", .{});
    std.debug.print("\n1. Redundancy:\n", .{});
    std.debug.print("   - If one algorithm is broken, the other provides backup\n", .{});
    std.debug.print("   - Would need to break BOTH to create address collision\n", .{});
    std.debug.print("   - Defense-in-depth security strategy\n", .{});

    std.debug.print("\n2. Compact Addresses:\n", .{});
    std.debug.print("   - RIPEMD160 produces 20 bytes vs SHA-256's 32 bytes\n", .{});
    std.debug.print("   - Reduces address size by 37.5%%\n", .{});
    std.debug.print("   - Smaller QR codes, less blockchain storage\n", .{});

    std.debug.print("\n3. Historical Context (2009):\n", .{});
    std.debug.print("   - SHA-256 was NIST standard (trusted)\n", .{});
    std.debug.print("   - RIPEMD160 was independent alternative (diversity)\n", .{});
    std.debug.print("   - Satoshi chose conservative approach\n", .{});

    std.debug.print("\n4. Security Trade-offs:\n", .{});
    std.debug.print("   - 20 bytes = 160 bits = ~80-bit collision security\n", .{});
    std.debug.print("   - Good enough for addresses (2^80 is huge)\n", .{});
    std.debug.print("   - Double hash increases preimage resistance\n\n", .{});

    // 4. Address collision probability
    std.debug.print("4. Address Collision Probability\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    std.debug.print("Total address space: 2^160\n", .{});
    std.debug.print("(That's about 1.46 x 10^48 addresses)\n", .{});
    std.debug.print("\nBirthday attack collision after ~2^80 hashes:\n", .{});
    std.debug.print("- 2^80 ~ 1.2 x 10^24 operations\n", .{});
    std.debug.print("- Would take millions of years with all computers on Earth\n", .{});
    std.debug.print("- Combined with SHA-256, effectively impossible\n\n", .{});

    // 5. Hash160 function
    std.debug.print("5. Hash160 Function (SHA256 -> RIPEMD160)\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const test_data = "test data";
    const sha_result = try crypto.SHA256.hash(test_data, allocator);
    defer allocator.free(sha_result);
    const hash160_result = try crypto.Ripemd160.hash(sha_result, allocator);
    defer allocator.free(hash160_result);

    std.debug.print("hash160() = RIPEMD160(SHA256(data))\n", .{});
    std.debug.print("Input: \"{s}\"\n", .{test_data});
    std.debug.print("Output: 0x", .{});
    for (hash160_result) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\nThis pattern is used everywhere in Bitcoin:\n", .{});
    std.debug.print("- P2PKH addresses\n", .{});
    std.debug.print("- P2SH addresses\n", .{});
    std.debug.print("- Script verification\n\n", .{});

    // 6. Multiple public keys
    std.debug.print("6. Multiple Public Keys -> Different Addresses\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    var pubkey1 = [_]u8{0x02} ** 33;
    pubkey1[0] = 0x02;
    pubkey1[1] = 0xAA;

    var pubkey2 = [_]u8{0x03} ** 33;
    pubkey2[0] = 0x03;
    pubkey2[1] = 0xBB;

    var pubkey3 = [_]u8{0x02} ** 33;
    pubkey3[0] = 0x02;
    pubkey3[1] = 0xCC;

    const sha1 = try crypto.SHA256.hash(&pubkey1, allocator);
    defer allocator.free(sha1);
    const addr1 = try crypto.Ripemd160.hash(sha1, allocator);
    defer allocator.free(addr1);

    const sha2 = try crypto.SHA256.hash(&pubkey2, allocator);
    defer allocator.free(sha2);
    const addr2 = try crypto.Ripemd160.hash(sha2, allocator);
    defer allocator.free(addr2);

    const sha3 = try crypto.SHA256.hash(&pubkey3, allocator);
    defer allocator.free(sha3);
    const addr3 = try crypto.Ripemd160.hash(sha3, allocator);
    defer allocator.free(addr3);

    std.debug.print("Three different public keys produce three different addresses:\n\n", .{});
    std.debug.print("Address 1: 0x", .{});
    for (addr1) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nAddress 2: 0x", .{});
    for (addr2) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nAddress 3: 0x", .{});
    for (addr3) |byte| std.debug.print("{x:0>2}", .{byte});

    std.debug.print("\n\nEach address is unique and deterministic\n\n", .{});

    // 7. Legacy vs modern
    std.debug.print("7. Legacy RIPEMD160 vs Modern SegWit\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    std.debug.print("Legacy addresses (P2PKH/P2SH):\n", .{});
    std.debug.print("- Use SHA-256 + RIPEMD160\n", .{});
    std.debug.print("- 20-byte hash\n", .{});
    std.debug.print("- Base58Check encoding\n", .{});
    std.debug.print("- Example: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n", .{});

    std.debug.print("\nSegWit addresses (P2WPKH/P2WSH):\n", .{});
    std.debug.print("- Use SHA-256 only (no RIPEMD160 for witness v1+)\n", .{});
    std.debug.print("- Bech32 encoding\n", .{});
    std.debug.print("- Example: bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4\n", .{});

    std.debug.print("\nTaproot addresses (P2TR):\n", .{});
    std.debug.print("- Use Schnorr signatures (different scheme)\n", .{});
    std.debug.print("- No RIPEMD160 at all\n", .{});
    std.debug.print("- Example: bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr\n", .{});

    std.debug.print("\nRIPEMD160 is maintained for legacy address compatibility\n\n", .{});

    std.debug.print("=== Complete ===\n", .{});
}
