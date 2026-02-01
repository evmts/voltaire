// KZG Trusted Setup Management Example
//
// Demonstrates:
// - Loading and initializing trusted setup
// - Understanding trusted setup structure
// - Setup lifecycle management
// - Security considerations

const std = @import("std");
const crypto = @import("crypto");

const c_kzg = crypto.c_kzg;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== KZG Trusted Setup Management ===\n\n", .{});

    // Step 1: Understanding trusted setup
    std.debug.print("1. What is the Trusted Setup?\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("KZG requires a \"Powers of Tau\" ceremony:\n", .{});
    std.debug.print("  - Secret value τ (tau) from multi-party computation\n", .{});
    std.debug.print("  - Precomputed: [1]₁, [τ]₁, [τ²]₁, ..., [τ⁴⁰⁹⁵]₁ in G1\n", .{});
    std.debug.print("  - Precomputed: [1]₂, [τ]₂, [τ²]₂, ..., [τ⁶⁵]₂ in G2\n", .{});
    std.debug.print("  - τ destroyed after ceremony\n\n", .{});

    std.debug.print("Ethereum KZG Ceremony (2023):\n", .{});
    std.debug.print("  - 140,000+ participants worldwide\n", .{});
    std.debug.print("  - Safe if ANY ONE participant was honest\n", .{});
    std.debug.print("  - Publicly verifiable transcript\n", .{});
    std.debug.print("  - Largest trusted setup ever conducted\n\n", .{});

    // Step 2: Loading trusted setup
    std.debug.print("2. Loading Trusted Setup\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Loading embedded trusted setup...\n", .{});
    const ckzg = @import("c_kzg");
    try ckzg.loadTrustedSetupFromText(ckzg.embedded_trusted_setup, 0);
    std.debug.print("After load: ✓ Initialized\n\n", .{});

    // Step 3: Using KZG operations
    std.debug.print("3. Using KZG After Setup\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var blob = getRandomBlob(12345);
    std.debug.print("Generated blob: {} bytes\n", .{blob.len});

    const commitment = try c_kzg.blobToKZGCommitment(&blob);
    std.debug.print("Generated commitment: {} bytes\n", .{commitment.len});
    std.debug.print("Setup is working: ✓\n\n", .{});

    // Step 4: Trusted setup structure
    std.debug.print("4. Trusted Setup Structure\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("G1 points (for commitments):\n", .{});
    std.debug.print("  Count: 4096 points\n", .{});
    std.debug.print("  Size: 48 bytes each\n", .{});
    std.debug.print("  Total: ~196 KB\n", .{});
    std.debug.print("  Purpose: Compute commitments C = [p(τ)]₁\n\n", .{});

    std.debug.print("G2 points (for verification):\n", .{});
    std.debug.print("  Count: 65 points\n", .{});
    std.debug.print("  Size: 96 bytes each\n", .{});
    std.debug.print("  Total: ~6 KB\n", .{});
    std.debug.print("  Purpose: Pairing-based verification\n\n", .{});

    std.debug.print("Total setup size: ~202 KB\n", .{});
    std.debug.print("Embedded in library for convenience\n\n", .{});

    // Step 5: Security properties
    std.debug.print("5. Security Properties\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Trust assumptions:\n", .{});
    std.debug.print("  ✓ At least 1 of 140,000+ participants honest\n", .{});
    std.debug.print("  ✓ Participant destroyed their secret contribution\n", .{});
    std.debug.print("  ✓ Setup is publicly verifiable\n", .{});
    std.debug.print("  ✓ Cannot reconstruct τ without ALL secrets\n\n", .{});

    std.debug.print("Attack scenarios:\n", .{});
    std.debug.print("  ✗ Forge commitments: Requires knowing τ (impossible)\n", .{});
    std.debug.print("  ✗ Fake proofs: Requires solving discrete log (hard)\n", .{});
    std.debug.print("  ✗ Collude all participants: 140,000+ (unrealistic)\n\n", .{});

    std.debug.print("Why it works:\n", .{});
    std.debug.print("  - Discrete log problem in BLS12-381 (~128-bit security)\n", .{});
    std.debug.print("  - Multi-party computation prevents single point of failure\n", .{});
    std.debug.print("  - Public verification ensures ceremony integrity\n\n", .{});

    // Step 6: Performance
    std.debug.print("6. Performance Considerations\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Load once, reuse:\n", .{});
    std.debug.print("  - Setup loaded once per process\n", .{});
    std.debug.print("  - Subsequent operations use cached setup\n", .{});
    std.debug.print("  - No need to reload for each blob\n\n", .{});

    // Step 7: Cleanup
    std.debug.print("7. Cleanup and Lifecycle\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Freeing trusted setup...\n", .{});
    try ckzg.freeTrustedSetup();
    std.debug.print("After free: ✓ Freed\n\n", .{});

    std.debug.print("Attempting operations after free:\n", .{});
    const result = c_kzg.blobToKZGCommitment(&blob);
    if (result) |_| {
        std.debug.print("  Result: ✗ Should have failed\n", .{});
    } else |err| {
        std.debug.print("  Result: ✓ Error (expected)\n", .{});
        std.debug.print("  Error: {}\n\n", .{err});
    }

    // Reload
    std.debug.print("Reloading for continued use...\n", .{});
    try ckzg.loadTrustedSetupFromText(ckzg.embedded_trusted_setup, 0);
    std.debug.print("Reloaded: ✓\n\n", .{});

    // Step 8: Constants
    std.debug.print("8. Setup-Related Constants\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Blob parameters:\n", .{});
    std.debug.print("  FIELD_ELEMENTS_PER_BLOB: {}\n", .{c_kzg.FIELD_ELEMENTS_PER_BLOB});
    std.debug.print("  BYTES_PER_BLOB: {}\n", .{c_kzg.BYTES_PER_BLOB});
    std.debug.print("  Polynomial degree: {}\n\n", .{c_kzg.FIELD_ELEMENTS_PER_BLOB - 1});

    std.debug.print("Why 4096 elements?\n", .{});
    std.debug.print("  - FFT-friendly (2¹²)\n", .{});
    std.debug.print("  - Matches trusted setup G1 points\n", .{});
    std.debug.print("  - Enables efficient polynomial operations\n", .{});
    std.debug.print("  - Standard for data availability sampling\n\n", .{});

    // Cleanup
    try ckzg.freeTrustedSetup();

    std.debug.print("=== Key Takeaways ===\n", .{});
    std.debug.print("- Load trusted setup once at startup\n", .{});
    std.debug.print("- Embedded setup from Ethereum KZG Ceremony 2023\n", .{});
    std.debug.print("- 140,000+ participants ensure security\n", .{});
    std.debug.print("- Setup is ~202 KB, used for all operations\n", .{});
    std.debug.print("- Free when done to release resources\n", .{});
    std.debug.print("- Safe if ANY participant was honest\n", .{});

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
