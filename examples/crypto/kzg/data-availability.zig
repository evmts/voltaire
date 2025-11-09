// Data Availability Sampling Example
//
// Demonstrates:
// - L2 rollup data availability workflow
// - Random point sampling and verification
// - Light client data availability checks
// - Understanding DA guarantees

const std = @import("std");
const crypto = @import("crypto");

const c_kzg = crypto.c_kzg;
const Sha256 = crypto.sha256.Sha256;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Data Availability Sampling ===\n\n", .{});

    // Initialize KZG
    const ckzg = @import("c_kzg");
    try ckzg.loadTrustedSetupFromText(ckzg.embedded_trusted_setup, 0);
    defer ckzg.freeTrustedSetup() catch {};

    // Step 1: L2 sequencer posts data
    std.debug.print("1. L2 Sequencer: Publishing Rollup Data\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("L2 Batch:\n", .{});
    std.debug.print("  Batch number: 12345\n", .{});
    std.debug.print("  Transactions: 1500\n", .{});
    std.debug.print("  Compressed size: 131072 bytes\n", .{});
    std.debug.print("  State root: 0x1234...5678\n\n", .{});

    var blob = getRandomBlob(12345);
    const commitment = try c_kzg.blobToKZGCommitment(&blob);

    var versioned_hash: [32]u8 = undefined;
    Sha256.hash(&commitment, &versioned_hash);
    versioned_hash[0] = 0x01;

    std.debug.print("Publishing to L1:\n", .{});
    std.debug.print("  Blob size: {} bytes\n", .{blob.len});
    std.debug.print("  Commitment: 0x", .{});
    for (commitment[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});
    std.debug.print("  Versioned hash: 0x", .{});
    for (versioned_hash) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n", .{});
    std.debug.print("  Status: ✓ Submitted to L1\n\n", .{});

    // Step 2: Full nodes verify
    std.debug.print("2. Full Nodes: Download and Verify\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Full node workflow:\n", .{});
    std.debug.print("  1. Download blob from consensus layer\n", .{});
    std.debug.print("  2. Compute KZG commitment from blob\n", .{});
    std.debug.print("  3. Verify commitment matches versioned hash\n", .{});
    std.debug.print("  4. Store blob for 18-day availability window\n\n", .{});

    const recomputed_commitment = try c_kzg.blobToKZGCommitment(&blob);
    const commitment_matches = std.mem.eql(u8, &recomputed_commitment, &commitment);

    std.debug.print("Full node verification:\n", .{});
    std.debug.print("  Downloaded blob: ✓\n", .{});
    std.debug.print("  Recomputed commitment: ✓\n", .{});
    std.debug.print("  Commitment matches: {s}\n", .{if (commitment_matches) "✓ Yes" else "✗ No"});
    std.debug.print("  Data available: ✓\n\n", .{});

    // Step 3: Light client sampling
    std.debug.print("3. Light Client: Data Availability Sampling\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Light client strategy:\n", .{});
    std.debug.print("  - Cannot download full 128 KB blob\n", .{});
    std.debug.print("  - Samples random points via KZG proofs\n", .{});
    std.debug.print("  - Verifies each sample against commitment\n", .{});
    std.debug.print("  - Statistical confidence in data availability\n\n", .{});

    const NUM_SAMPLES = 5;
    var sample_points: [NUM_SAMPLES]c_kzg.Bytes32 = undefined;

    std.debug.print("Generating {} random sample points...\n\n", .{NUM_SAMPLES});
    var prng = std.Random.DefaultPrng.init(99999);
    const random = prng.random();

    for (0..NUM_SAMPLES) |i| {
        random.bytes(&sample_points[i]);
        sample_points[i][0] = 0;
    }

    // Step 4: Request proofs
    std.debug.print("4. Requesting Proofs from Full Node\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Light client requests proofs for sample points:\n", .{});

    var proofs: [NUM_SAMPLES]struct { z: c_kzg.Bytes32, y: c_kzg.Bytes32, proof: c_kzg.KZGProof } = undefined;

    for (0..NUM_SAMPLES) |i| {
        const z = sample_points[i];
        const result = try c_kzg.computeKZGProof(&blob, &z);

        proofs[i] = .{ .z = z, .y = result.y, .proof = result.proof };

        std.debug.print("  Sample {}:\n", .{i + 1});
        std.debug.print("    z: 0x", .{});
        for (z[0..8]) |b| {
            std.debug.print("{x:0>2}", .{b});
        }
        std.debug.print("...\n", .{});
        std.debug.print("    y: 0x", .{});
        for (result.y[0..8]) |b| {
            std.debug.print("{x:0>2}", .{b});
        }
        std.debug.print("...\n", .{});
        std.debug.print("    proof size: {} bytes\n", .{result.proof.len});
    }
    std.debug.print("\n", .{});

    const data_transferred = 48 + NUM_SAMPLES * (32 + 48 + 32);
    std.debug.print("Data transferred to light client:\n", .{});
    std.debug.print("  Commitment: 48 bytes\n", .{});
    std.debug.print("  Proofs: {} bytes (z + proof)\n", .{NUM_SAMPLES * (32 + 48)});
    std.debug.print("  Y values: {} bytes\n", .{NUM_SAMPLES * 32});
    std.debug.print("  Total: {} bytes\n", .{data_transferred});
    std.debug.print("  vs Full blob: {} bytes\n", .{blob.len});

    const savings_percent = (1.0 - (@as(f64, @floatFromInt(data_transferred)) / @as(f64, @floatFromInt(blob.len)))) * 100.0;
    std.debug.print("  Savings: {d:.1}%\n\n", .{savings_percent});

    // Step 5: Verify samples
    std.debug.print("5. Light Client: Verifying Samples\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var all_valid = true;
    std.debug.print("Verifying each sample proof:\n", .{});

    for (0..NUM_SAMPLES) |i| {
        const valid = try c_kzg.verifyKZGProof(&commitment, &proofs[i].z, &proofs[i].y, &proofs[i].proof);
        std.debug.print("  Sample {}: {s}\n", .{ i + 1, if (valid) "✓" else "✗" });

        if (!valid) {
            all_valid = false;
        }
    }
    std.debug.print("\n", .{});

    std.debug.print("All samples valid: {s}\n", .{if (all_valid) "✓ Yes" else "✗ No"});
    std.debug.print("Data availability confidence: {s}\n\n", .{if (all_valid) "High" else "Low"});

    // Step 6: DA guarantees
    std.debug.print("6. Data Availability Guarantees\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("What KZG proves:\n", .{});
    std.debug.print("  ✓ Data exists (blob was published)\n", .{});
    std.debug.print("  ✓ Commitment binds to specific data\n", .{});
    std.debug.print("  ✓ Cannot change data after commitment\n", .{});
    std.debug.print("  ✓ Samples prove polynomial evaluation\n\n", .{});

    std.debug.print("What KZG does NOT prove:\n", .{});
    std.debug.print("  ✗ Data correctness (state transition validity)\n", .{});
    std.debug.print("  ✗ Transaction ordering\n", .{});
    std.debug.print("  ✗ Smart contract execution\n", .{});
    std.debug.print("  → These require fraud/validity proofs\n\n", .{});

    // Step 7: Sampling statistics
    std.debug.print("7. Sampling Statistics\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const confidence_levels = [_]u32{ 1, 5, 10, 20, 50 };

    std.debug.print("Data availability confidence by sample count:\n", .{});
    for (confidence_levels) |n| {
        const confidence = 1.0 - std.math.pow(f64, 0.5, @as(f64, @floatFromInt(n)));
        std.debug.print("  {} samples: {d:.2}%\n", .{ n, confidence * 100.0 });
    }
    std.debug.print("\n", .{});

    std.debug.print("Trade-off:\n", .{});
    std.debug.print("  More samples → Higher confidence\n", .{});
    std.debug.print("  More samples → More bandwidth for light client\n", .{});
    std.debug.print("  Typical: 5-10 samples for light clients\n\n", .{});

    // Step 8: Production recommendations
    std.debug.print("8. Production Recommendations\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("For L2 operators:\n", .{});
    std.debug.print("  ✓ Publish blobs with every batch\n", .{});
    std.debug.print("  ✓ Store blobs locally (don't rely on 18-day window)\n", .{});
    std.debug.print("  ✓ Provide DA proof endpoints for light clients\n", .{});
    std.debug.print("  ✓ Monitor blob inclusion and availability\n\n", .{});

    std.debug.print("For light clients:\n", .{});
    std.debug.print("  ✓ Sample 5-10 random points per blob\n", .{});
    std.debug.print("  ✓ Request proofs from multiple full nodes\n", .{});
    std.debug.print("  ✓ Verify all samples before trusting DA\n", .{});
    std.debug.print("  ✓ Fall back to L1 data if samples fail\n\n", .{});

    std.debug.print("=== Key Takeaways ===\n", .{});
    std.debug.print("- KZG enables efficient data availability sampling\n", .{});
    std.debug.print("- Light clients verify DA without downloading full blob\n", .{});
    std.debug.print("- Sample 5-10 random points for statistical confidence\n", .{});
    std.debug.print("- DA proves existence, not correctness\n", .{});
    std.debug.print("- Critical for L2 scaling and decentralization\n", .{});
    std.debug.print("- Enables Proto-Danksharding vision\n", .{});

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
