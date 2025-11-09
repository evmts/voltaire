// Point Evaluation Precompile Example
//
// Demonstrates EIP-4844 point evaluation precompile (0x0a):
// - Preparing input for precompile
// - Computing versioned hash
// - Verifying KZG proofs (simulates precompile)
// - Understanding precompile output

const std = @import("std");
const crypto = @import("crypto");

const c_kzg = crypto.c_kzg;
const Sha256 = crypto.sha256.Sha256;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Point Evaluation Precompile (0x0a) ===\n\n", .{});

    // Initialize KZG
    const ckzg = @import("c_kzg");
    try ckzg.loadTrustedSetupFromText(ckzg.embedded_trusted_setup, 0);
    defer ckzg.freeTrustedSetup() catch {};

    // Step 1: Create blob and commitment
    std.debug.print("1. Creating Blob and Commitment\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var blob = getRandomBlob(12345);
    const commitment = try c_kzg.blobToKZGCommitment(&blob);

    std.debug.print("Blob created: {} bytes\n", .{blob.len});
    std.debug.print("Commitment: 0x", .{});
    for (commitment) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n\n", .{});

    // Step 2: Compute versioned hash
    std.debug.print("2. Computing Versioned Hash\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var commitment_hash: [32]u8 = undefined;
    Sha256.hash(&commitment, &commitment_hash);

    var versioned_hash: [32]u8 = undefined;
    @memcpy(&versioned_hash, &commitment_hash);
    versioned_hash[0] = 0x01; // Version byte for EIP-4844

    std.debug.print("Commitment hash: 0x", .{});
    for (commitment_hash) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n", .{});

    std.debug.print("Versioned hash: 0x", .{});
    for (versioned_hash) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n", .{});
    std.debug.print("Version byte: 0x{x:0>2}\n\n", .{versioned_hash[0]});

    // Step 3: Generate proof
    std.debug.print("3. Generating KZG Proof\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var z: c_kzg.Bytes32 = undefined;
    @memset(&z, 0x42);

    const result = try c_kzg.computeKZGProof(&blob, &z);

    std.debug.print("Evaluation point z: 0x", .{});
    for (z[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});

    std.debug.print("Claimed value y: 0x", .{});
    for (result.y[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});

    std.debug.print("Proof: 0x", .{});
    for (result.proof[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n\n", .{});

    // Step 4: Prepare precompile input
    std.debug.print("4. Preparing Precompile Input (192 bytes)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var precompile_input: [192]u8 = undefined;
    @memcpy(precompile_input[0..32], &versioned_hash);
    @memcpy(precompile_input[32..64], &z);
    @memcpy(precompile_input[64..96], &result.y);
    @memcpy(precompile_input[96..144], &commitment);
    @memcpy(precompile_input[144..192], &result.proof);

    std.debug.print("Input structure:\n", .{});
    std.debug.print("  [0:32]   Versioned hash: 0x", .{});
    for (precompile_input[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});

    std.debug.print("  [32:64]  z: 0x", .{});
    for (precompile_input[32..42]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});

    std.debug.print("  [64:96]  y: 0x", .{});
    for (precompile_input[64..74]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});

    std.debug.print("  [96:144] commitment: 0x", .{});
    for (precompile_input[96..106]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});

    std.debug.print("  [144:192] proof: 0x", .{});
    for (precompile_input[144..154]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});
    std.debug.print("  Total: {} bytes\n\n", .{precompile_input.len});

    // Step 5: Verify (simulates precompile)
    std.debug.print("5. Simulating Precompile Verification\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Verify versioned hash
    var expected_hash: [32]u8 = undefined;
    Sha256.hash(&commitment, &expected_hash);
    expected_hash[0] = 0x01;
    const hash_matches = std.mem.eql(u8, &expected_hash, &versioned_hash);

    std.debug.print("Versioned hash validation: {s}\n", .{if (hash_matches) "✓ Valid" else "✗ Invalid"});

    // Verify proof
    const proof_valid = try c_kzg.verifyKZGProof(&commitment, &z, &result.y, &result.proof);
    std.debug.print("KZG proof validation: {s}\n", .{if (proof_valid) "✓ Valid" else "✗ Invalid"});

    const precompile_success = hash_matches and proof_valid;
    std.debug.print("Precompile result: {s}\n\n", .{if (precompile_success) "✓ Success" else "✗ Failure"});

    // Step 6: Output format
    std.debug.print("6. Precompile Output Format\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    if (precompile_success) {
        const FIELD_ELEMENTS_PER_BLOB = 4096;
        const BLS_MODULUS = "0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001";

        std.debug.print("Success output (64 bytes):\n", .{});
        std.debug.print("  Bytes [0:32]:  FIELD_ELEMENTS_PER_BLOB = {}\n", .{FIELD_ELEMENTS_PER_BLOB});
        std.debug.print("  Bytes [32:64]: BLS_MODULUS = {s}\n", .{BLS_MODULUS});
    } else {
        std.debug.print("Failure output: 64 zero bytes\n", .{});
    }
    std.debug.print("\n", .{});

    // Step 7: Gas cost
    std.debug.print("7. Gas Cost\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});
    std.debug.print("Fixed gas cost: 50,000 gas\n", .{});
    std.debug.print("Covers: BLS12-381 pairing + field arithmetic + SHA-256\n", .{});
    std.debug.print("Independent of blob size or proof validity\n\n", .{});

    // Step 8: Real-world usage
    std.debug.print("8. Real-World Usage\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});
    std.debug.print("Use cases:\n", .{});
    std.debug.print("  1. Optimistic Rollups: Verify fraud proof blob references\n", .{});
    std.debug.print("  2. ZK Rollups: Sample blob data for data availability\n", .{});
    std.debug.print("  3. Data Availability Sampling: Light clients verify random points\n", .{});
    std.debug.print("  4. On-chain Blob Verification: Smart contracts verify blob commitments\n\n", .{});

    std.debug.print("Transaction flow:\n", .{});
    std.debug.print("  1. L2 creates blob with rollup data\n", .{});
    std.debug.print("  2. Compute KZG commitment\n", .{});
    std.debug.print("  3. Create versioned hash (SHA256 + version byte)\n", .{});
    std.debug.print("  4. Submit Type-3 blob transaction with versioned hash\n", .{});
    std.debug.print("  5. Validators use 0x0a precompile to verify\n", .{});
    std.debug.print("  6. Blob stored for ~18 days, commitment forever\n\n", .{});

    std.debug.print("=== Key Takeaways ===\n", .{});
    std.debug.print("- Precompile 0x0a verifies KZG proofs on-chain\n", .{});
    std.debug.print("- Input: 192 bytes (versioned hash + z + y + commitment + proof)\n", .{});
    std.debug.print("- Output: 64 bytes (success) or 64 zeros (failure)\n", .{});
    std.debug.print("- Gas: Fixed 50,000 gas\n", .{});
    std.debug.print("- Critical for EIP-4844 blob transaction verification\n", .{});

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
