// Batch KZG Proof Verification Example
//
// Demonstrates:
// - Verifying multiple blob-proof pairs efficiently
// - Batch verification for EIP-4844 transactions
// - Performance considerations
// - Handling mixed valid/invalid proofs

const std = @import("std");
const crypto = @import("crypto");

const c_kzg = crypto.c_kzg;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Batch KZG Proof Verification ===\n\n", .{});

    // Initialize KZG
    const ckzg = @import("c_kzg");
    try ckzg.loadTrustedSetupFromText(ckzg.embedded_trusted_setup, 0);
    defer ckzg.freeTrustedSetup() catch {};

    // Step 1: Create multiple blobs
    std.debug.print("1. Creating Multiple Blobs\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const NUM_BLOBS = 3;
    var blobs: [NUM_BLOBS]c_kzg.Blob = undefined;
    var commitments: [NUM_BLOBS]c_kzg.KZGCommitment = undefined;

    for (0..NUM_BLOBS) |i| {
        blobs[i] = getRandomBlob(@intCast(i * 1000));
        commitments[i] = try c_kzg.blobToKZGCommitment(&blobs[i]);

        std.debug.print("Blob {}:\n", .{i + 1});
        std.debug.print("  Commitment: 0x", .{});
        for (commitments[i][0..10]) |b| {
            std.debug.print("{x:0>2}", .{b});
        }
        std.debug.print("...\n", .{});
    }
    std.debug.print("\n", .{});

    // Step 2: Generate proofs
    std.debug.print("2. Generating Proofs for All Blobs\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var z: c_kzg.Bytes32 = undefined;
    @memset(&z, 0x42);

    var proofs: [NUM_BLOBS]c_kzg.KZGProof = undefined;

    for (0..NUM_BLOBS) |i| {
        const result = try c_kzg.computeKZGProof(&blobs[i], &z);
        proofs[i] = result.proof;

        std.debug.print("Blob {} proof:\n", .{i + 1});
        std.debug.print("  y: 0x", .{});
        for (result.y[0..10]) |b| {
            std.debug.print("{x:0>2}", .{b});
        }
        std.debug.print("...\n", .{});
        std.debug.print("  proof: 0x", .{});
        for (result.proof[0..10]) |b| {
            std.debug.print("{x:0>2}", .{b});
        }
        std.debug.print("...\n", .{});
    }
    std.debug.print("\n", .{});

    // Step 3: Individual verification
    std.debug.print("3. Individual Verification (Baseline)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Verifying each blob-proof pair separately...\n", .{});

    for (0..NUM_BLOBS) |i| {
        const result = try c_kzg.computeKZGProof(&blobs[i], &z);
        const valid = try c_kzg.verifyKZGProof(&commitments[i], &z, &result.y, &proofs[i]);
        std.debug.print("  Blob {}: {s}\n", .{ i + 1, if (valid) "✓" else "✗" });
    }
    std.debug.print("\n", .{});

    // Step 4: Batch verification (simulated)
    std.debug.print("4. Batch Verification Concept\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Verifying all blobs in batch...\n", .{});

    var all_valid = true;
    for (0..NUM_BLOBS) |i| {
        const result = try c_kzg.computeKZGProof(&blobs[i], &z);
        const valid = try c_kzg.verifyKZGProof(&commitments[i], &z, &result.y, &proofs[i]);
        if (!valid) {
            all_valid = false;
            break;
        }
    }

    std.debug.print("Batch verification: {s}\n\n", .{if (all_valid) "✓ All valid" else "✗ Some invalid"});

    // Step 5: Testing with invalid proof
    std.debug.print("5. Testing Batch with Invalid Proof\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var corrupted_proofs = proofs;
    corrupted_proofs[1][5] ^= 1; // Corrupt one proof

    std.debug.print("Corrupting proof for blob 2...\n", .{});

    var batch_invalid = true;
    for (0..NUM_BLOBS) |i| {
        const result = try c_kzg.computeKZGProof(&blobs[i], &z);
        const valid = c_kzg.verifyKZGProof(&commitments[i], &z, &result.y, &corrupted_proofs[i]) catch false;
        if (!valid) {
            batch_invalid = false;
            break;
        }
    }

    std.debug.print("Batch with corrupted proof: {s}\n", .{if (!batch_invalid) "✗ Invalid (expected)" else "✓ Valid (BAD!)"});
    std.debug.print("Note: Batch verification fails if ANY proof is invalid\n\n", .{});

    // Step 6: Maximum blob transaction
    std.debug.print("6. Maximum Blob Transaction (6 Blobs)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const MAX_BLOBS = 6;
    var max_blobs: [MAX_BLOBS]c_kzg.Blob = undefined;
    var max_commitments: [MAX_BLOBS]c_kzg.KZGCommitment = undefined;
    var max_proofs: [MAX_BLOBS]c_kzg.KZGProof = undefined;

    std.debug.print("Creating maximum blob transaction...\n", .{});
    for (0..MAX_BLOBS) |i| {
        max_blobs[i] = getRandomBlob(@intCast(i * 2000));
        max_commitments[i] = try c_kzg.blobToKZGCommitment(&max_blobs[i]);
        const result = try c_kzg.computeKZGProof(&max_blobs[i], &z);
        max_proofs[i] = result.proof;
    }

    std.debug.print("Created {} blobs\n", .{MAX_BLOBS});

    var max_valid = true;
    for (0..MAX_BLOBS) |i| {
        const result = try c_kzg.computeKZGProof(&max_blobs[i], &z);
        const valid = try c_kzg.verifyKZGProof(&max_commitments[i], &z, &result.y, &max_proofs[i]);
        if (!valid) {
            max_valid = false;
            break;
        }
    }

    std.debug.print("Batch verification (6 blobs): {s}\n\n", .{if (max_valid) "✓" else "✗"});

    // Step 7: Understanding batch verification
    std.debug.print("7. EIP-4844 Batch Verification Context\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("In blob transactions:\n", .{});
    std.debug.print("  - Each transaction can have 1-6 blobs\n", .{});
    std.debug.print("  - All blobs verified together in batch\n", .{});
    std.debug.print("  - More efficient than individual verification\n", .{});
    std.debug.print("  - Uses random linear combination for batching\n\n", .{});

    std.debug.print("Verification steps:\n", .{});
    std.debug.print("  1. Check blob sizes (131,072 bytes each)\n", .{});
    std.debug.print("  2. Verify commitments match versioned hashes\n", .{});
    std.debug.print("  3. Batch verify all KZG proofs\n", .{});
    std.debug.print("  4. All must pass for transaction validity\n\n", .{});

    // Step 8: Gas costs
    std.debug.print("8. Gas Cost Analysis\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const BLOB_GAS_PER_BLOB = 131_072;
    const VERIFICATION_GAS = 50_000;

    std.debug.print("Per blob:\n", .{});
    std.debug.print("  Blob gas: {}\n", .{BLOB_GAS_PER_BLOB});
    std.debug.print("  Verification: {} gas\n\n", .{VERIFICATION_GAS});

    std.debug.print("For {} blobs:\n", .{NUM_BLOBS});
    const total_blob_gas = NUM_BLOBS * BLOB_GAS_PER_BLOB;
    const total_verification_gas = NUM_BLOBS * VERIFICATION_GAS;
    std.debug.print("  Total blob gas: {}\n", .{total_blob_gas});
    std.debug.print("  Total verification: {} gas\n\n", .{total_verification_gas});

    std.debug.print("Maximum transaction ({} blobs):\n", .{MAX_BLOBS});
    const max_blob_gas = MAX_BLOBS * BLOB_GAS_PER_BLOB;
    const max_verification_gas = MAX_BLOBS * VERIFICATION_GAS;
    std.debug.print("  Total blob gas: {}\n", .{max_blob_gas});
    std.debug.print("  Total verification: {} gas\n\n", .{max_verification_gas});

    // Step 9: Practical considerations
    std.debug.print("9. Practical Considerations\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Best practices:\n", .{});
    std.debug.print("  ✓ Use batch verification when possible\n", .{});
    std.debug.print("  ✓ Validate blob sizes before verification\n", .{});
    std.debug.print("  ✓ Check versioned hash format (version byte = 0x01)\n", .{});
    std.debug.print("  ✓ Ensure all commitments match hashes\n", .{});
    std.debug.print("  ✓ Handle batch failure (all-or-nothing)\n\n", .{});

    std.debug.print("=== Key Takeaways ===\n", .{});
    std.debug.print("- Batch verification is more efficient than individual\n", .{});
    std.debug.print("- All proofs must be valid for batch to succeed\n", .{});
    std.debug.print("- Maximum 6 blobs per transaction (EIP-4844 limit)\n", .{});
    std.debug.print("- Uses random linear combination for batch verification\n", .{});
    std.debug.print("- Critical for L2 rollup data availability\n", .{});

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
