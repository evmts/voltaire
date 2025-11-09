const std = @import("std");
const crypto = @import("crypto");

/// Basic BLS Signature Operations
///
/// Demonstrates BLS signature workflow concepts:
/// - Key generation pattern
/// - Signature creation process
/// - Verification using pairings
/// - Domain separation
pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== Basic BLS Signature Operations ===\n\n", .{});

    // 1. Key Generation
    try stdout.print("1. Key Generation\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("BLS key generation:\n", .{});
    try stdout.print("  1. Generate random 32-byte private key (scalar)\n", .{});
    try stdout.print("  2. Derive public key: pubkey = privkey * G2\n", .{});
    try stdout.print("\nPrivate key: Random scalar in Fr (255-bit field)\n", .{});
    try stdout.print("Public key: G2 point (96 bytes compressed, 192 uncompressed)\n\n", .{});

    // 2. Message Hashing
    try stdout.print("2. Hash-to-Curve (Message -> G1 Point)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("Convert message to G1 curve point:\n", .{});
    try stdout.print("  1. Hash message with domain separation tag (DST)\n", .{});
    try stdout.print("  2. Expand hash output to field elements\n", .{});
    try stdout.print("  3. Map field elements to G1 points (SSWU)\n", .{});
    try stdout.print("  4. Clear cofactor to ensure prime-order subgroup\n", .{});
    try stdout.print("\nRFC 9380: hash_to_curve standard\n", .{});
    try stdout.print("DST example: \"BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_\"\n\n", .{});

    // 3. Signature Generation
    try stdout.print("3. Signature Generation\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("Create signature:\n", .{});
    try stdout.print("  signature = privkey * H(message)\n", .{});
    try stdout.print("\nWhere:\n", .{});
    try stdout.print("  - H(message) is G1 point from hash-to-curve\n", .{});
    try stdout.print("  - privkey is scalar multiplication factor\n", .{});
    try stdout.print("  - Result is G1 point (48 bytes compressed)\n\n", .{});

    // 4. Signature Verification
    try stdout.print("4. Signature Verification\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("Verification equation:\n", .{});
    try stdout.print("  e(signature, G2_generator) = e(H(message), publicKey)\n", .{});
    try stdout.print("\nWhy this works:\n", .{});
    try stdout.print("  signature = privkey * H(msg)\n", .{});
    try stdout.print("  publicKey = privkey * G2\n", .{});
    try stdout.print("\n  e(privkey*H(msg), G2) = e(H(msg), privkey*G2)\n", .{});
    try stdout.print("  by bilinearity: e(H(msg), G2)^privkey = e(H(msg), G2)^privkey\n\n", .{});

    // 5. Pairing Check Format
    try stdout.print("5. Pairing Check Format\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("Rearrange verification for single check:\n", .{});
    try stdout.print("  e(sig, G2) * e(-H(msg), pubkey) = 1\n", .{});
    try stdout.print("\nPrecompile input (768 bytes total):\n", .{});
    try stdout.print("  Pair 1: signature (128) + G2_gen (256)\n", .{});
    try stdout.print("  Pair 2: -H(msg) (128) + pubkey (256)\n", .{});
    try stdout.print("\nOutput: 32 bytes (0x01 if verification passes)\n\n", .{});

    // 6. Deterministic Signatures
    try stdout.print("6. Deterministic Signatures\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("BLS signatures are deterministic:\n", .{});
    try stdout.print("  - Same message + key -> same signature\n", .{});
    try stdout.print("  - No random nonce required (unlike ECDSA)\n", .{});
    try stdout.print("  - Hash-to-curve is deterministic\n", .{});
    try stdout.print("  - Scalar multiplication is deterministic\n\n", .{});

    // 7. Domain Separation
    try stdout.print("7. Domain Separation Tags (DST)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("Ethereum uses different DSTs for each signature type:\n", .{});
    try stdout.print("\nBeacon blocks:\n", .{});
    try stdout.print("  BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_BEACON_BLOCK_\n", .{});
    try stdout.print("\nAttestations:\n", .{});
    try stdout.print("  BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_ATTESTATION_\n", .{});
    try stdout.print("\nSync committee:\n", .{});
    try stdout.print("  BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_SYNC_COMMITTEE_\n", .{});
    try stdout.print("\nPrevents signature reuse across contexts\n\n", .{});

    // 8. Security Considerations
    try stdout.print("8. Security Considerations\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("Private key security:\n", .{});
    try stdout.print("  - Must be 32 random bytes from CSPRNG\n", .{});
    try stdout.print("  - Never reuse or derive predictably\n", .{});
    try stdout.print("  - Store securely (encrypted at rest)\n", .{});
    try stdout.print("\nPoint validation:\n", .{});
    try stdout.print("  - Always validate deserialized points\n", .{});
    try stdout.print("  - Check subgroup membership (critical for G2)\n", .{});
    try stdout.print("  - BLST library handles this automatically\n\n", .{});

    // 9. Performance
    try stdout.print("9. Performance (Native BLST)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("Operation timings:\n", .{});
    try stdout.print("  - Key generation: ~80 μs\n", .{});
    try stdout.print("  - Hash-to-curve: ~100 μs\n", .{});
    try stdout.print("  - Signing: ~100 μs (scalar mul)\n", .{});
    try stdout.print("  - Verification: ~2 ms (2 pairings)\n", .{});
    try stdout.print("\nSignature size:\n", .{});
    try stdout.print("  - Compressed: 48 bytes\n", .{});
    try stdout.print("  - Uncompressed: 96 bytes\n\n", .{});

    // 10. Ethereum Validator Example
    try stdout.print("10. Ethereum Validator Workflow\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("Validator signs beacon block:\n", .{});
    try stdout.print("  1. Compute block root (32-byte hash)\n", .{});
    try stdout.print("  2. Add domain for beacon blocks\n", .{});
    try stdout.print("  3. Hash signing root to G1 curve point\n", .{});
    try stdout.print("  4. Multiply by validator private key\n", .{});
    try stdout.print("  5. Broadcast 48-byte signature\n", .{});
    try stdout.print("\nOther validators verify:\n", .{});
    try stdout.print("  1. Retrieve validator public key from state\n", .{});
    try stdout.print("  2. Compute same signing root\n", .{});
    try stdout.print("  3. Hash to G1 curve point\n", .{});
    try stdout.print("  4. Perform pairing check\n", .{});
    try stdout.print("  5. Accept block if verification passes\n\n", .{});

    try stdout.print("=== Complete ===\n", .{});
}
