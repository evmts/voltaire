// Versioned Hash Management Example
//
// Demonstrates:
// - Computing versioned hashes from commitments
// - Understanding version byte semantics
// - Hash verification workflow

const std = @import("std");
const crypto = @import("crypto");

const c_kzg = crypto.c_kzg;
const Sha256 = crypto.sha256.Sha256;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Versioned Hash Management ===\n\n", .{});

    // Initialize KZG
    const ckzg = @import("c_kzg");
    try ckzg.loadTrustedSetupFromText(ckzg.embedded_trusted_setup, 0);
    defer ckzg.freeTrustedSetup() catch {};

    // Step 1: Understanding versioned hashes
    std.debug.print("1. What is a Versioned Hash?\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Purpose:\n", .{});
    std.debug.print("  - Compact on-chain reference to blob commitment\n", .{});
    std.debug.print("  - Version byte allows future commitment schemes\n", .{});
    std.debug.print("  - SHA-256 hash provides 32-byte identifier\n", .{});
    std.debug.print("  - Included in transaction, not the full commitment\n\n", .{});

    std.debug.print("Structure (32 bytes):\n", .{});
    std.debug.print("  Byte 0:     Version byte (0x01 for EIP-4844)\n", .{});
    std.debug.print("  Bytes 1-31: SHA256(commitment)[1:32]\n\n", .{});

    std.debug.print("Version byte semantics:\n", .{});
    std.debug.print("  0x01 - SHA-256 of KZG commitment (EIP-4844)\n", .{});
    std.debug.print("  0x02+ - Reserved for future schemes\n\n", .{});

    // Step 2: Computing versioned hash
    std.debug.print("2. Computing Versioned Hash\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var blob = getRandomBlob(12345);
    const commitment = try c_kzg.blobToKZGCommitment(&blob);

    std.debug.print("Commitment (48 bytes): 0x", .{});
    for (commitment) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n\n", .{});

    var commitment_hash: [32]u8 = undefined;
    Sha256.hash(&commitment, &commitment_hash);

    std.debug.print("SHA-256(commitment): 0x", .{});
    for (commitment_hash) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n\n", .{});

    var versioned_hash: [32]u8 = undefined;
    @memcpy(&versioned_hash, &commitment_hash);
    versioned_hash[0] = 0x01;

    std.debug.print("Versioned hash: 0x", .{});
    for (versioned_hash) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n", .{});
    std.debug.print("Version byte: 0x{x:0>2}\n\n", .{versioned_hash[0]});

    // Step 3: Extracting components
    std.debug.print("3. Versioned Hash Components\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const version = versioned_hash[0];
    const hash_suffix = versioned_hash[1..];

    std.debug.print("Version: 0x{x:0>2}\n", .{version});
    std.debug.print("Hash suffix (31 bytes): 0x", .{});
    for (hash_suffix) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n\n", .{});

    std.debug.print("Interpretation:\n", .{});
    if (version == 0x01) {
        std.debug.print("  ✓ Version 0x01: SHA-256 of KZG commitment (EIP-4844)\n\n", .{});
    } else {
        std.debug.print("  ✗ Unknown version\n\n", .{});
    }

    // Step 4: Verification
    std.debug.print("4. Versioned Hash Verification\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var expected_hash: [32]u8 = undefined;
    Sha256.hash(&commitment, &expected_hash);
    expected_hash[0] = 0x01;

    const hash_matches = std.mem.eql(u8, &expected_hash, &versioned_hash);
    std.debug.print("Verification result: {s}\n\n", .{if (hash_matches) "✓ Valid" else "✗ Invalid"});

    // Step 5: Testing invalid cases
    std.debug.print("5. Testing Invalid Versioned Hashes\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Wrong version
    var wrong_version = versioned_hash;
    wrong_version[0] = 0x02;
    const test1 = wrong_version[0] == 0x01;
    std.debug.print("Test 1 - Wrong version (0x02): {s}\n", .{if (test1) "✗ Valid (BAD)" else "✓ Invalid"});
    std.debug.print("  Reason: Unsupported version\n\n", .{});

    // Wrong hash
    var wrong_hash: [32]u8 = undefined;
    wrong_hash[0] = 0x01;
    var prng = std.Random.DefaultPrng.init(99999);
    prng.random().bytes(wrong_hash[1..]);

    const test2 = std.mem.eql(u8, &wrong_hash, &versioned_hash);
    std.debug.print("Test 2 - Wrong hash: {s}\n", .{if (test2) "✗ Valid (BAD)" else "✓ Invalid"});
    std.debug.print("  Reason: Hash mismatch\n\n", .{});

    // Step 6: Multiple blobs
    std.debug.print("6. Managing Multiple Versioned Hashes\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const NUM_BLOBS = 3;
    var blobs: [NUM_BLOBS]c_kzg.Blob = undefined;
    var commitments: [NUM_BLOBS]c_kzg.KZGCommitment = undefined;
    var versioned_hashes: [NUM_BLOBS][32]u8 = undefined;

    for (0..NUM_BLOBS) |i| {
        blobs[i] = getRandomBlob(@intCast(i * 1000));
        commitments[i] = try c_kzg.blobToKZGCommitment(&blobs[i]);

        Sha256.hash(&commitments[i], &versioned_hashes[i]);
        versioned_hashes[i][0] = 0x01;
    }

    std.debug.print("Created {} versioned hashes:\n", .{NUM_BLOBS});
    for (0..NUM_BLOBS) |i| {
        std.debug.print("  Blob {}: 0x", .{i + 1});
        for (versioned_hashes[i]) |b| {
            std.debug.print("{x:0>2}", .{b});
        }
        std.debug.print("\n", .{});

        // Verify
        var expected: [32]u8 = undefined;
        Sha256.hash(&commitments[i], &expected);
        expected[0] = 0x01;
        const valid = std.mem.eql(u8, &expected, &versioned_hashes[i]);
        std.debug.print("    Verification: {s}\n", .{if (valid) "✓" else "✗"});
    }
    std.debug.print("\n", .{});

    // Step 7: Size comparison
    std.debug.print("7. Size Comparison\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const MAX_BLOBS = 6;
    std.debug.print("For {} blobs:\n", .{MAX_BLOBS});
    std.debug.print("  Commitments: {} bytes\n", .{MAX_BLOBS * 48});
    std.debug.print("  Versioned hashes: {} bytes\n", .{MAX_BLOBS * 32});
    std.debug.print("  Savings: {} bytes\n\n", .{MAX_BLOBS * (48 - 32)});

    std.debug.print("Additional benefits:\n", .{});
    std.debug.print("  - Version byte enables future upgrades\n", .{});
    std.debug.print("  - Hash provides content addressing\n", .{});
    std.debug.print("  - Smaller transaction size\n\n", .{});

    // Step 8: Production checklist
    std.debug.print("8. Production Checklist\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("When working with versioned hashes:\n", .{});
    std.debug.print("  ✓ Always verify version byte = 0x01\n", .{});
    std.debug.print("  ✓ Compute SHA-256(commitment) and compare\n", .{});
    std.debug.print("  ✓ Handle unknown versions gracefully\n", .{});
    std.debug.print("  ✓ Store commitments alongside hashes\n", .{});
    std.debug.print("  ✓ Validate hash length (32 bytes)\n", .{});
    std.debug.print("  ✓ Use constant-time comparison\n\n", .{});

    std.debug.print("=== Key Takeaways ===\n", .{});
    std.debug.print("- Versioned hash = 0x01 + SHA256(commitment)[1:32]\n", .{});
    std.debug.print("- Version byte 0x01 indicates EIP-4844 (SHA-256 of KZG)\n", .{});
    std.debug.print("- Always verify hash matches commitment\n", .{});
    std.debug.print("- 32 bytes (16 bytes smaller than commitment)\n", .{});
    std.debug.print("- Enables future protocol upgrades\n", .{});
    std.debug.print("- Critical for blob transaction validation\n", .{});

    _ = allocator;
}

fn getRandomBlob(seed: u64) c_kzg.Blob {
    var blob: c_kzg.Blob = undefined;
    var prng = std.Random.DefaultPrng.init(seed);
    const random = prng.random();
    random.bytes(&blob);
    for (0..c_kzg.FIELD_ELEMENTS_PER_BLOB) |i| {
        blob[i * c_kzg.BYTES_PER_FIELD_ELEMENT] = 0;
    }
    return blob;
}
