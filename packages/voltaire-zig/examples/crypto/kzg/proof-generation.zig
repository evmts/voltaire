// KZG Proof Generation and Verification Example
//
// Demonstrates:
// - Generating KZG proofs for polynomial evaluation
// - Verifying proofs with commitments
// - Testing with different evaluation points
// - Understanding proof soundness

const std = @import("std");
const crypto = @import("crypto");

const c_kzg = crypto.c_kzg;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== KZG Proof Generation and Verification ===\n\n", .{});

    // Initialize KZG
    const ckzg = @import("c_kzg");
    try ckzg.loadTrustedSetupFromText(ckzg.embedded_trusted_setup, 0);
    defer ckzg.freeTrustedSetup() catch {};

    // Create blob and commitment
    var blob = getRandomBlob(42);
    const commitment = try c_kzg.blobToKZGCommitment(&blob);

    std.debug.print("1. Setup\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});
    std.debug.print("Blob created: {} bytes\n", .{blob.len});
    std.debug.print("Commitment: 0x", .{});
    for (commitment[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n\n", .{});

    // Step 2: Generate proof
    std.debug.print("2. Generating KZG Proof\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var z: c_kzg.Bytes32 = undefined;
    @memset(&z, 0x42);

    std.debug.print("Evaluation point z: 0x", .{});
    for (z[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});

    const result = try c_kzg.computeKZGProof(&blob, &z);

    std.debug.print("Proof generated:\n", .{});
    std.debug.print("  Proof (π): 0x", .{});
    for (result.proof[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});
    std.debug.print("  Value (y): 0x", .{});
    for (result.y[0..10]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("...\n", .{});
    std.debug.print("  Proof size: {} bytes\n\n", .{result.proof.len});

    // Step 3: Verify proof
    std.debug.print("3. Verifying KZG Proof\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const is_valid = try c_kzg.verifyKZGProof(&commitment, &z, &result.y, &result.proof);
    std.debug.print("Proof verification: {s}\n\n", .{if (is_valid) "✓ Valid" else "✗ Invalid"});

    std.debug.print("What we proved:\n", .{});
    std.debug.print("  - The blob (as polynomial p) evaluates to y at point z\n", .{});
    std.debug.print("  - i.e., p(z) = y\n", .{});
    std.debug.print("  - Without revealing the full blob!\n\n", .{});

    // Step 4: Wrong y value
    std.debug.print("4. Testing Proof Soundness (Wrong y)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var wrong_y: c_kzg.Bytes32 = undefined;
    @memset(&wrong_y, 0xFF);

    const invalid_proof1 = c_kzg.verifyKZGProof(&commitment, &z, &wrong_y, &result.proof) catch false;
    std.debug.print("Proof with wrong y value: {s}\n\n", .{if (invalid_proof1) "✓ Valid (BAD!)" else "✗ Invalid (expected)"});

    // Step 5: Wrong commitment
    std.debug.print("5. Testing Proof Soundness (Wrong Commitment)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var blob2 = getRandomBlob(999);
    const wrong_commitment = try c_kzg.blobToKZGCommitment(&blob2);

    const invalid_proof2 = c_kzg.verifyKZGProof(&wrong_commitment, &z, &result.y, &result.proof) catch false;
    std.debug.print("Proof with wrong commitment: {s}\n\n", .{if (invalid_proof2) "✓ Valid (BAD!)" else "✗ Invalid (expected)"});

    // Step 6: Corrupted proof
    std.debug.print("6. Testing Proof Soundness (Corrupted Proof)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var corrupted_proof = result.proof;
    corrupted_proof[0] ^= 1;

    const invalid_proof3 = c_kzg.verifyKZGProof(&commitment, &z, &result.y, &corrupted_proof) catch false;
    std.debug.print("Corrupted proof: {s}\n\n", .{if (invalid_proof3) "✓ Valid (BAD!)" else "✗ Invalid (expected)"});

    // Step 7: Multiple evaluation points
    std.debug.print("7. Multiple Evaluation Points\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const evaluation_points = [_]u8{ 0x00, 0x11, 0x22 };

    std.debug.print("Testing blob at multiple points...\n", .{});
    for (evaluation_points, 0..) |point_byte, i| {
        var z_point: c_kzg.Bytes32 = undefined;
        @memset(&z_point, point_byte);

        const point_result = try c_kzg.computeKZGProof(&blob, &z_point);
        const valid = try c_kzg.verifyKZGProof(&commitment, &z_point, &point_result.y, &point_result.proof);

        std.debug.print("  Point {}: {s}\n", .{ i + 1, if (valid) "✓" else "✗" });
    }
    std.debug.print("\n", .{});

    // Step 8: Proof determinism
    std.debug.print("8. Proof Determinism\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var z2: c_kzg.Bytes32 = undefined;
    @memset(&z2, 123);

    const result1 = try c_kzg.computeKZGProof(&blob, &z2);
    const result2 = try c_kzg.computeKZGProof(&blob, &z2);

    const same_proof = std.mem.eql(u8, &result1.proof, &result2.proof);
    const same_y = std.mem.eql(u8, &result1.y, &result2.y);

    std.debug.print("Same blob + same z → same proof: {s}\n", .{if (same_proof) "✓" else "✗"});
    std.debug.print("Same blob + same z → same y: {s}\n\n", .{if (same_y) "✓" else "✗"});

    // Step 9: Mathematical background
    std.debug.print("9. Mathematical Background\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});
    std.debug.print("KZG Polynomial Commitment Scheme:\n", .{});
    std.debug.print("  1. Blob data → polynomial p(x) of degree 4095\n", .{});
    std.debug.print("  2. Commitment C = [p(τ)]₁ where τ is secret from trusted setup\n", .{});
    std.debug.print("  3. Proof π = [(p(τ) - y)/(τ - z)]₁ proves p(z) = y\n", .{});
    std.debug.print("  4. Verification: pairing check ensures proof correctness\n", .{});
    std.debug.print("  5. Security: cannot forge proof without knowing τ (discrete log)\n\n", .{});

    std.debug.print("Why this works:\n", .{});
    std.debug.print("  - Commitment binds to polynomial without revealing it\n", .{});
    std.debug.print("  - Proof convinces verifier that p(z) = y\n", .{});
    std.debug.print("  - Only 48 bytes regardless of polynomial size!\n", .{});
    std.debug.print("  - Enables data availability sampling for L2s\n\n", .{});

    std.debug.print("=== Key Takeaways ===\n", .{});
    std.debug.print("- Proof proves p(z) = y for commitment C\n", .{});
    std.debug.print("- Proof is 48 bytes (BLS12-381 G1 point)\n", .{});
    std.debug.print("- Cannot forge proof for wrong y or wrong commitment\n", .{});
    std.debug.print("- Same inputs produce same proof (deterministic)\n", .{});
    std.debug.print("- Based on pairing cryptography on BLS12-381\n", .{});

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
