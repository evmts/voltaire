// Basic KZG Commitment Example
//
// Demonstrates fundamental KZG operations:
// - Loading trusted setup
// - Creating a blob
// - Generating KZG commitment
// - Basic validation

const std = @import("std");
const crypto = @import("crypto");

const c_kzg = crypto.c_kzg;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Basic KZG Commitment ===\n\n", .{});

    // Step 1: Load trusted setup
    std.debug.print("1. Loading Trusted Setup\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const ckzg = @import("c_kzg");
    try ckzg.loadTrustedSetupFromText(ckzg.embedded_trusted_setup, 0);
    defer ckzg.freeTrustedSetup() catch {};

    std.debug.print("Trusted setup loaded: ✓\n\n", .{});

    // Step 2: Create a blob
    std.debug.print("2. Creating Blob\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Create empty blob
    var empty_blob: c_kzg.Blob = undefined;
    @memset(&empty_blob, 0);
    std.debug.print("Empty blob size: {} bytes (128 KB)\n", .{empty_blob.len});

    // Create random blob
    var blob = getRandomBlob(12345);
    std.debug.print("Random blob created: {} bytes\n", .{blob.len});
    std.debug.print("First 32 bytes: 0x", .{});
    for (blob[0..32]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n\n", .{});

    // Step 3: Validate blob
    std.debug.print("3. Validating Blob\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const blob_valid = blob.len == c_kzg.BYTES_PER_BLOB;
    std.debug.print("Blob validation: {s}\n\n", .{if (blob_valid) "✓ Valid" else "✗ Invalid"});

    // Step 4: Generate KZG commitment
    std.debug.print("4. Generating KZG Commitment\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const commitment = try c_kzg.blobToKZGCommitment(&blob);
    std.debug.print("Commitment size: {} bytes (48 bytes = BLS12-381 G1 point)\n", .{commitment.len});
    std.debug.print("Commitment: 0x", .{});
    for (commitment) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n\n", .{});

    // Step 5: Commitment is deterministic
    std.debug.print("5. Commitment Determinism\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const commitment2 = try c_kzg.blobToKZGCommitment(&blob);
    const are_equal = std.mem.eql(u8, &commitment, &commitment2);
    std.debug.print("Same blob produces same commitment: {s}\n\n", .{if (are_equal) "✓" else "✗"});

    // Step 6: Different blobs produce different commitments
    std.debug.print("6. Commitment Uniqueness\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var blob2 = getRandomBlob(54321);
    const commitment3 = try c_kzg.blobToKZGCommitment(&blob2);
    const are_different = !std.mem.eql(u8, &commitment, &commitment3);
    std.debug.print("Different blobs produce different commitments: {s}\n\n", .{if (are_different) "✓" else "✗"});

    // Step 7: Commitment binding
    std.debug.print("7. Understanding Commitment Binding\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});
    std.debug.print("The KZG commitment is:\n", .{});
    std.debug.print("  - Succinct: 48 bytes for 128 KB blob\n", .{});
    std.debug.print("  - Binding: Cannot change blob after commitment\n", .{});
    std.debug.print("  - Hiding: Commitment reveals nothing about blob\n", .{});
    std.debug.print("  - Verifiable: Can prove blob(z) = y at any point z\n\n", .{});

    // Step 8: Multiple blobs
    std.debug.print("8. Processing Multiple Blobs\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const num_blobs = 3;
    var blobs: [num_blobs]c_kzg.Blob = undefined;
    var commitments: [num_blobs]c_kzg.KZGCommitment = undefined;

    for (0..num_blobs) |i| {
        blobs[i] = getRandomBlob(@intCast(i * 1000));
        commitments[i] = try c_kzg.blobToKZGCommitment(&blobs[i]);
    }

    std.debug.print("Processing {} blobs...\n", .{num_blobs});
    std.debug.print("Generated {} commitments\n", .{commitments.len});

    for (commitments, 0..) |comm, i| {
        std.debug.print("  Blob {}: 0x", .{i + 1});
        for (comm[0..10]) |b| {
            std.debug.print("{x:0>2}", .{b});
        }
        std.debug.print("...\n", .{});
    }
    std.debug.print("\n", .{});

    std.debug.print("Trusted setup freed\n\n", .{});

    std.debug.print("=== Key Takeaways ===\n", .{});
    std.debug.print("- Load trusted setup before using KZG\n", .{});
    std.debug.print("- Blobs are exactly 131,072 bytes (128 KB)\n", .{});
    std.debug.print("- Commitments are 48 bytes (BLS12-381 G1 point)\n", .{});
    std.debug.print("- Same blob → same commitment (deterministic)\n", .{});
    std.debug.print("- Different blobs → different commitments (unique)\n", .{});
    std.debug.print("- Commitment is succinct and binding\n", .{});

    _ = allocator;
}

// Helper to generate random blob
fn getRandomBlob(seed: u64) c_kzg.Blob {
    var blob: c_kzg.Blob = undefined;
    var prng = std.Random.DefaultPrng.init(seed);
    const random = prng.random();

    random.bytes(&blob);

    // Ensure each field element is valid
    for (0..c_kzg.FIELD_ELEMENTS_PER_BLOB) |i| {
        blob[i * c_kzg.BYTES_PER_FIELD_ELEMENT] = 0;
    }

    return blob;
}
