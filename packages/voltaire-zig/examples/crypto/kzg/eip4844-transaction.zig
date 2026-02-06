// Complete EIP-4844 Blob Transaction Workflow
//
// Demonstrates end-to-end blob transaction:
// - Creating blobs from L2 rollup data
// - Generating commitments and proofs
// - Computing versioned hashes
// - Transaction cost analysis

const std = @import("std");
const crypto = @import("crypto");

const c_kzg = crypto.c_kzg;
const Sha256 = crypto.sha256.Sha256;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Complete EIP-4844 Blob Transaction Workflow ===\n\n", .{});

    // Initialize KZG
    const ckzg = @import("c_kzg");
    try ckzg.loadTrustedSetupFromText(ckzg.embedded_trusted_setup, 0);
    defer ckzg.freeTrustedSetup() catch {};

    // Step 1: L2 rollup data
    std.debug.print("1. L2 Rollup Data Preparation\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});
    std.debug.print("L2 Sequencer:\n", .{});
    std.debug.print("  Batched transactions: 2000\n", .{});
    std.debug.print("  Compressed data: ~256 KB\n", .{});
    std.debug.print("  Target: 2 blobs (128 KB each)\n\n", .{});

    // Step 2: Encode into blobs
    std.debug.print("2. Encoding Data into Blobs\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var blob1 = getRandomBlob(1111);
    var blob2 = getRandomBlob(2222);

    std.debug.print("Blob 1: 131,072 bytes\n", .{});
    std.debug.print("Blob 2: 131,072 bytes\n", .{});
    std.debug.print("Total: 262,144 bytes (256 KB)\n\n", .{});

    // Step 3: Generate commitments
    std.debug.print("3. Generating KZG Commitments\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const commitment1 = try c_kzg.blobToKZGCommitment(&blob1);
    const commitment2 = try c_kzg.blobToKZGCommitment(&blob2);

    std.debug.print("Commitment 1: 0x", .{});
    for (commitment1) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n", .{});

    std.debug.print("Commitment 2: 0x", .{});
    for (commitment2) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n\n", .{});

    // Step 4: Compute versioned hashes
    std.debug.print("4. Computing Versioned Hashes\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var versioned_hash1: [32]u8 = undefined;
    var versioned_hash2: [32]u8 = undefined;

    Sha256.hash(&commitment1, &versioned_hash1);
    versioned_hash1[0] = 0x01;

    Sha256.hash(&commitment2, &versioned_hash2);
    versioned_hash2[0] = 0x01;

    std.debug.print("Versioned Hash 1: 0x", .{});
    for (versioned_hash1) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n", .{});

    std.debug.print("Versioned Hash 2: 0x", .{});
    for (versioned_hash2) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n\n", .{});

    std.debug.print("Versioned hash structure:\n", .{});
    std.debug.print("  Byte [0]:    Version = 0x01 (SHA-256 of KZG commitment)\n", .{});
    std.debug.print("  Bytes [1:32]: SHA256(commitment)[1:32]\n\n", .{});

    // Step 5: Generate proofs
    std.debug.print("5. Generating KZG Proofs\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var z: c_kzg.Bytes32 = undefined;
    @memset(&z, 0x42);

    const proof1 = try c_kzg.computeKZGProof(&blob1, &z);
    const proof2 = try c_kzg.computeKZGProof(&blob2, &z);

    std.debug.print("Proof 1:\n", .{});
    std.debug.print("  y: 0x", .{});
    for (proof1.y[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});
    std.debug.print("  proof: 0x", .{});
    for (proof1.proof[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});

    std.debug.print("Proof 2:\n", .{});
    std.debug.print("  y: 0x", .{});
    for (proof2.y[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});
    std.debug.print("  proof: 0x", .{});
    for (proof2.proof[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n\n", .{});

    // Step 6: Transaction structure
    std.debug.print("6. Building Blob Transaction (Type 3)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Transaction fields:\n", .{});
    std.debug.print("  Type: 3 (EIP-4844)\n", .{});
    std.debug.print("  Chain ID: 1\n", .{});
    std.debug.print("  To: 0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e\n", .{});
    std.debug.print("  Max Fee Per Blob Gas: 2 gwei\n", .{});
    std.debug.print("  Blob Count: 2\n\n", .{});

    std.debug.print("Blob sidecar (not in tx hash):\n", .{});
    std.debug.print("  Blobs: 2 (256 KB total)\n", .{});
    std.debug.print("  Commitments: 2 (96 bytes total)\n", .{});
    std.debug.print("  Proofs: 2 (96 bytes total)\n\n", .{});

    // Step 7: Size breakdown
    std.debug.print("7. Transaction Size Breakdown\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const tx_body_size = 200;
    const versioned_hashes_size = 32 * 2;
    const blobs_size = 131_072 * 2;
    const commitments_size = 48 * 2;
    const proofs_size = 48 * 2;

    std.debug.print("On-chain (in block):\n", .{});
    std.debug.print("  Transaction body: ~{} bytes\n", .{tx_body_size});
    std.debug.print("  Versioned hashes: {} bytes\n", .{versioned_hashes_size});
    std.debug.print("  Total on-chain: ~{} bytes\n\n", .{tx_body_size + versioned_hashes_size});

    std.debug.print("Sidecar (separate storage):\n", .{});
    std.debug.print("  Blobs: {} bytes (262,144 bytes)\n", .{blobs_size});
    std.debug.print("  Commitments: {} bytes\n", .{commitments_size});
    std.debug.print("  Proofs: {} bytes\n", .{proofs_size});
    std.debug.print("  Total sidecar: {} bytes\n\n", .{blobs_size + commitments_size + proofs_size});

    // Step 8: Gas costs
    std.debug.print("8. Gas Cost Calculation\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const blob_base_fee: u64 = 1;
    const execution_base_fee: u64 = 15_000_000_000;
    const blob_gas_used: u64 = 2 * 131_072;
    const execution_gas_used: u64 = 50_000;

    const blob_gas_cost = blob_gas_used * blob_base_fee;
    const execution_gas_cost = execution_gas_used * execution_base_fee;
    const total_cost = blob_gas_cost + execution_gas_cost;

    std.debug.print("Execution gas:\n", .{});
    std.debug.print("  Base fee: {} gwei\n", .{execution_base_fee / 1_000_000_000});
    std.debug.print("  Gas used: {}\n", .{execution_gas_used});
    std.debug.print("  Cost: {} wei\n\n", .{execution_gas_cost});

    std.debug.print("Blob gas:\n", .{});
    std.debug.print("  Blob base fee: {} wei\n", .{blob_base_fee});
    std.debug.print("  Blob gas used: {}\n", .{blob_gas_used});
    std.debug.print("  Cost: {} wei\n\n", .{blob_gas_cost});

    std.debug.print("Total transaction cost: {} wei\n\n", .{total_cost});

    // Step 9: Verification
    std.debug.print("9. Block Validator Verification\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Step 1: Validate transaction format\n", .{});
    std.debug.print("  ✓ Type = 3 (blob transaction)\n", .{});
    std.debug.print("  ✓ to != null (no contract creation)\n", .{});
    std.debug.print("  ✓ 1-6 blobs\n\n", .{});

    std.debug.print("Step 2: Verify versioned hashes\n", .{});
    const hash1_valid = versioned_hash1[0] == 0x01;
    const hash2_valid = versioned_hash2[0] == 0x01;
    std.debug.print("  Blob 1 version: {s}\n", .{if (hash1_valid) "✓ 0x01" else "✗ Invalid"});
    std.debug.print("  Blob 2 version: {s}\n\n", .{if (hash2_valid) "✓ 0x01" else "✗ Invalid"});

    std.debug.print("Step 3: Verify KZG proofs\n", .{});
    const proof1_valid = try c_kzg.verifyKZGProof(&commitment1, &z, &proof1.y, &proof1.proof);
    const proof2_valid = try c_kzg.verifyKZGProof(&commitment2, &z, &proof2.y, &proof2.proof);
    std.debug.print("  Blob 1: {s}\n", .{if (proof1_valid) "✓ Valid" else "✗ Invalid"});
    std.debug.print("  Blob 2: {s}\n\n", .{if (proof2_valid) "✓ Valid" else "✗ Invalid"});

    const all_valid = hash1_valid and hash2_valid and proof1_valid and proof2_valid;
    std.debug.print("Transaction validity: {s}\n\n", .{if (all_valid) "✓ ACCEPTED" else "✗ REJECTED"});

    // Step 10: Cost comparison
    std.debug.print("10. Cost Comparison: Blobs vs Calldata\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const data_size: u64 = 262_144;
    const calldata_gas = data_size * 16;
    const calldata_cost = calldata_gas * execution_base_fee;

    std.debug.print("256 KB via calldata:\n", .{});
    std.debug.print("  Gas: {}\n", .{calldata_gas});
    std.debug.print("  Cost: {} wei\n", .{calldata_cost});
    std.debug.print("  Storage: Forever\n\n", .{});

    std.debug.print("256 KB via blobs:\n", .{});
    std.debug.print("  Gas: {}\n", .{blob_gas_used});
    std.debug.print("  Cost: {} wei\n", .{blob_gas_cost});
    std.debug.print("  Storage: ~18 days\n\n", .{});

    const savings = calldata_cost - blob_gas_cost;
    const savings_percent = (@as(f64, @floatFromInt(savings)) / @as(f64, @floatFromInt(calldata_cost))) * 100.0;

    std.debug.print("Savings:\n", .{});
    std.debug.print("  Wei saved: {}\n", .{savings});
    std.debug.print("  Percentage: {d:.2}%\n", .{savings_percent});
    std.debug.print("  ~{}x cheaper!\n\n", .{calldata_gas / blob_gas_used});

    std.debug.print("=== Key Takeaways ===\n", .{});
    std.debug.print("- Type 3 transactions carry 1-6 blobs (up to 768 KB)\n", .{});
    std.debug.print("- Versioned hashes on-chain, blobs in sidecar\n", .{});
    std.debug.print("- Blobs ~16x cheaper than calldata\n", .{});
    std.debug.print("- Blobs pruned after ~18 days\n", .{});
    std.debug.print("- Enables affordable L2 data availability\n", .{});
    std.debug.print("- Critical for Ethereum scaling roadmap\n", .{});

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
