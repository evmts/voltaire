//! BLS12-381 Operations Example
//!
//! This example demonstrates how to work with BLS12-381 elliptic curve operations,
//! which are used in Ethereum 2.0 consensus layer and various cryptographic protocols.
//!
//! Key Concepts:
//! - G1 and G2 curve operations (addition, scalar multiplication)
//! - Pairing checks for signature verification
//! - Hash-to-curve operations (mapFpToG1, mapFp2ToG2)
//! - Multi-scalar multiplication for aggregation
//! - Point serialization and validation

const std = @import("std");
const crypto_pkg = @import("crypto");

const bls12_381 = crypto_pkg.Crypto.bls12_381;
const hash_mod = crypto_pkg.Hash;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n" ++ "=" ** 80 ++ "\n", .{});
    std.debug.print("  BLS12-381 Elliptic Curve Operations\n", .{});
    std.debug.print("=" ** 80 ++ "\n\n", .{});

    std.debug.print("  BLS12-381 is a pairing-friendly elliptic curve used in:\n", .{});
    std.debug.print("  - Ethereum 2.0 (Beacon Chain) signatures\n", .{});
    std.debug.print("  - Signature aggregation schemes\n", .{});
    std.debug.print("  - Zero-knowledge proofs (zk-SNARKs)\n", .{});
    std.debug.print("  - Threshold cryptography\n", .{});
    std.debug.print("\n", .{});

    // Example 1: Understanding G1 and G2 Groups
    std.debug.print("1. Understanding G1 and G2 Groups\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const g1_size = bls12_381.g1_output_size();
    const g2_size = bls12_381.g2_output_size();
    const pairing_size = bls12_381.pairingOutputSize();

    std.debug.print("  G1 Group:\n", .{});
    std.debug.print("    - Points on BLS12-381 curve over base field Fp\n", .{});
    std.debug.print("    - Output size: {} bytes\n", .{g1_size});
    std.debug.print("    - Used for: Public keys, signatures\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  G2 Group:\n", .{});
    std.debug.print("    - Points on twisted curve over extension field Fp2\n", .{});
    std.debug.print("    - Output size: {} bytes\n", .{g2_size});
    std.debug.print("    - Used for: Public keys (in some schemes), signatures\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  Pairing Output:\n", .{});
    std.debug.print("    - Element in target group GT (Fp12)\n", .{});
    std.debug.print("    - Output size: {} bytes\n", .{pairing_size});
    std.debug.print("    - Used for: Signature verification\n", .{});
    std.debug.print("\n", .{});

    // Example 2: G1 Point Addition
    std.debug.print("2. G1 Point Addition\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Define two G1 points (in practice, these would be real curve points)
    // Point format: 128 bytes (64 bytes x-coordinate + 64 bytes y-coordinate)
    // For this example, we'll use the generator point G1 (identity would be all zeros)

    std.debug.print("  G1 addition combines two points: P + Q = R\n", .{});
    std.debug.print("  This is fundamental for signature aggregation.\n", .{});
    std.debug.print("\n", .{});

    // Input: two 128-byte G1 points concatenated (256 bytes total)
    var g1_add_input = try allocator.alloc(u8, 256);
    defer allocator.free(g1_add_input);

    // Initialize with example points (in practice, use real curve points)
    @memset(g1_add_input, 0);
    // Point 1: bytes 0-127 (would be a valid G1 point)
    // Point 2: bytes 128-255 (would be a valid G1 point)

    var g1_add_output = try allocator.alloc(u8, g1_size);
    defer allocator.free(g1_add_output);

    std.debug.print("  Note: This example uses placeholder data.\n", .{});
    std.debug.print("  In production, use valid G1 points from key generation.\n", .{});
    std.debug.print("\n", .{});

    // Uncomment to run actual operation (requires valid input points):
    // try bls12_381.g1_add(g1_add_input, g1_add_output);
    // std.debug.print("  G1 Addition Result: 0x{X}\n", .{g1_add_output[0..32]});

    // Example 3: G1 Scalar Multiplication
    std.debug.print("3. G1 Scalar Multiplication\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Scalar multiplication: k * P = Q\n", .{});
    std.debug.print("  Where k is a scalar and P is a G1 point.\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  This is used for:\n", .{});
    std.debug.print("  - Deriving public keys from private keys\n", .{});
    std.debug.print("  - Creating signatures\n", .{});
    std.debug.print("\n", .{});

    // Input format: 128 bytes (G1 point) + 32 bytes (scalar)
    var g1_mul_input = try allocator.alloc(u8, 160);
    defer allocator.free(g1_mul_input);

    @memset(g1_mul_input, 0);
    // Bytes 0-127: G1 point
    // Bytes 128-159: 32-byte scalar (private key)

    var g1_mul_output = try allocator.alloc(u8, g1_size);
    defer allocator.free(g1_mul_output);

    std.debug.print("  Input: G1 point (128 bytes) + scalar (32 bytes)\n", .{});
    std.debug.print("  Output: G1 point (128 bytes)\n", .{});
    std.debug.print("\n", .{});

    // Uncomment to run actual operation:
    // try bls12_381.g1_mul(g1_mul_input, g1_mul_output);

    // Example 4: G1 Multi-Scalar Multiplication
    std.debug.print("4. G1 Multi-Scalar Multiplication\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Multi-scalar multiplication (MSM):\n", .{});
    std.debug.print("    k1*P1 + k2*P2 + ... + kn*Pn\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  This is more efficient than computing individual\n", .{});
    std.debug.print("  scalar multiplications and adding the results.\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  Used for:\n", .{});
    std.debug.print("  - Signature aggregation (combine multiple signatures)\n", .{});
    std.debug.print("  - Batch verification (verify multiple signatures at once)\n", .{});
    std.debug.print("  - Threshold signatures\n", .{});
    std.debug.print("\n", .{});

    // Input format: n * (128 bytes point + 32 bytes scalar)
    const num_points = 3;
    const msm_input_size = num_points * 160; // 3 * (128 + 32)

    var g1_msm_input = try allocator.alloc(u8, msm_input_size);
    defer allocator.free(g1_msm_input);

    @memset(g1_msm_input, 0);

    var g1_msm_output = try allocator.alloc(u8, g1_size);
    defer allocator.free(g1_msm_output);

    std.debug.print("  Example: Aggregating {} signatures\n", .{num_points});
    std.debug.print("  Input size: {} bytes ({} points)\n", .{ msm_input_size, num_points });
    std.debug.print("  Output size: {} bytes (single aggregated signature)\n", .{g1_size});
    std.debug.print("\n", .{});

    // Uncomment to run actual operation:
    // try bls12_381.g1_multiexp(g1_msm_input, g1_msm_output);

    // Example 5: G2 Operations
    std.debug.print("5. G2 Operations\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  G2 operations work similarly to G1, but on the twisted curve.\n", .{});
    std.debug.print("  G2 points are larger (256 bytes vs 128 bytes for G1).\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  In BLS signatures:\n", .{});
    std.debug.print("  - Standard scheme: Public keys in G1, signatures in G2\n", .{});
    std.debug.print("  - Alternative scheme: Public keys in G2, signatures in G1\n", .{});
    std.debug.print("\n", .{});

    var g2_add_input = try allocator.alloc(u8, g2_size * 2);
    defer allocator.free(g2_add_input);
    @memset(g2_add_input, 0);

    var g2_add_output = try allocator.alloc(u8, g2_size);
    defer allocator.free(g2_add_output);

    std.debug.print("  G2 Point Addition:\n", .{});
    std.debug.print("    Input: 2 G2 points ({} bytes each)\n", .{g2_size});
    std.debug.print("    Output: 1 G2 point ({} bytes)\n", .{g2_size});
    std.debug.print("\n", .{});

    // Uncomment to run:
    // try bls12_381.g2Add(g2_add_input, g2_add_output);

    // Example 6: Pairing Check
    std.debug.print("6. Pairing Check for Signature Verification\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Pairing: e(P, Q) maps G1 x G2 -> GT\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  BLS signature verification checks:\n", .{});
    std.debug.print("    e(signature, G2_generator) == e(hash_to_G1(message), public_key)\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  This can be rewritten as a pairing check:\n", .{});
    std.debug.print("    e(signature, G2_generator) * e(hash_to_G1(message), -public_key) == 1\n", .{});
    std.debug.print("\n", .{});

    // Pairing input: pairs of (G1 point, G2 point)
    // For n pairs: n * (128 + 256) = n * 384 bytes
    const num_pairs = 2;
    const pairing_input_size = num_pairs * (128 + 256);

    var pairing_input = try allocator.alloc(u8, pairing_input_size);
    defer allocator.free(pairing_input);
    @memset(pairing_input, 0);

    var pairing_output = try allocator.alloc(u8, pairing_size);
    defer allocator.free(pairing_output);

    std.debug.print("  Pairing Check Example:\n", .{});
    std.debug.print("    Input: {} pairs of (G1, G2) points\n", .{num_pairs});
    std.debug.print("    Input size: {} bytes\n", .{pairing_input_size});
    std.debug.print("    Output: pairing result (1 if valid, 0 if invalid)\n", .{});
    std.debug.print("\n", .{});

    // Uncomment to run:
    // try bls12_381.pairing(pairing_input, pairing_output);

    // Example 7: Hash-to-Curve (mapFpToG1)
    std.debug.print("7. Hash-to-Curve: mapFpToG1\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Hash-to-curve maps arbitrary messages to curve points.\n", .{});
    std.debug.print("  This is used in BLS signatures to hash messages onto G1.\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  Process:\n", .{});
    std.debug.print("    1. Hash message to field element (Fp)\n", .{});
    std.debug.print("    2. Map field element to curve point (G1)\n", .{});
    std.debug.print("\n", .{});

    // Example: Hash a message and map to G1
    const message = "Hello, BLS12-381!";
    const message_hash = hash_mod.keccak256(message);

    std.debug.print("  Message: \"{s}\"\n", .{message});
    std.debug.print("  Message Hash: 0x{X}\n", .{message_hash});
    std.debug.print("\n", .{});

    // mapFpToG1 expects 64-byte Fp field element
    var fp_input = try allocator.alloc(u8, 64);
    defer allocator.free(fp_input);
    @memset(fp_input, 0);
    // Pad the 32-byte hash to 64 bytes (big-endian)
    @memcpy(fp_input[32..64], &message_hash);

    var g1_point_output = try allocator.alloc(u8, 128);
    defer allocator.free(g1_point_output);

    std.debug.print("  Input: 64-byte field element (Fp)\n", .{});
    std.debug.print("  Output: 128-byte G1 point\n", .{});
    std.debug.print("\n", .{});

    // Uncomment to run:
    // try bls12_381.mapFpToG1(fp_input, g1_point_output);
    // std.debug.print("  Mapped G1 Point: 0x{X}\n", .{g1_point_output[0..32]});

    // Example 8: Hash-to-Curve (mapFp2ToG2)
    std.debug.print("8. Hash-to-Curve: mapFp2ToG2\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Similar to mapFpToG1, but maps to G2 curve.\n", .{});
    std.debug.print("  Used when signatures are on G2 instead of G1.\n", .{});
    std.debug.print("\n", .{});

    // mapFp2ToG2 expects 128-byte Fp2 field element (two 64-byte Fp elements)
    var fp2_input = try allocator.alloc(u8, 128);
    defer allocator.free(fp2_input);
    @memset(fp2_input, 0);
    // Use hash for both components of Fp2
    @memcpy(fp2_input[32..64], &message_hash);
    @memcpy(fp2_input[96..128], &message_hash);

    var g2_point_output = try allocator.alloc(u8, 256);
    defer allocator.free(g2_point_output);

    std.debug.print("  Input: 128-byte field element (Fp2 = 2 x Fp)\n", .{});
    std.debug.print("  Output: 256-byte G2 point\n", .{});
    std.debug.print("\n", .{});

    // Uncomment to run:
    // try bls12_381.mapFp2ToG2(fp2_input, g2_point_output);

    // Example 9: Signature Aggregation Workflow
    std.debug.print("9. BLS Signature Aggregation Workflow\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Complete workflow for BLS signature aggregation:\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  Setup:\n", .{});
    std.debug.print("    1. Each signer has private key (scalar)\n", .{});
    std.debug.print("    2. Derive public key: PK = sk * G1_generator\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  Signing (each signer independently):\n", .{});
    std.debug.print("    1. Hash message to G1: H = hash_to_G1(message)\n", .{});
    std.debug.print("    2. Create signature: sig = sk * H\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  Aggregation:\n", .{});
    std.debug.print("    1. Combine signatures: agg_sig = sig1 + sig2 + ... + sigN\n", .{});
    std.debug.print("    2. Combine public keys: agg_pk = pk1 + pk2 + ... + pkN\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  Verification:\n", .{});
    std.debug.print("    1. Hash message: H = hash_to_G1(message)\n", .{});
    std.debug.print("    2. Check: e(agg_sig, G2_gen) == e(H, agg_pk)\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  Benefits:\n", .{});
    std.debug.print("  - Constant signature size regardless of number of signers\n", .{});
    std.debug.print("  - Single pairing check for verification\n", .{});
    std.debug.print("  - Used in Ethereum 2.0 for validator signatures\n", .{});
    std.debug.print("\n", .{});

    // Example 10: Security Considerations
    std.debug.print("10. Security Considerations\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Point Validation:\n", .{});
    std.debug.print("  - Always validate points are on the curve\n", .{});
    std.debug.print("  - Check points are in the correct subgroup\n", .{});
    std.debug.print("  - Reject point at infinity (unless expected)\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  Rogue Key Attacks:\n", .{});
    std.debug.print("  - In naive aggregation, attacker can choose malicious public key\n", .{});
    std.debug.print("  - Mitigations: Proof of possession, message augmentation\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  Side-Channel Attacks:\n", .{});
    std.debug.print("  - Use constant-time operations for secret scalars\n", .{});
    std.debug.print("  - Protect private keys in memory\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("  Serialization:\n", .{});
    std.debug.print("  - Use compressed format when possible (48 bytes G1, 96 bytes G2)\n", .{});
    std.debug.print("  - Validate deserialized points before use\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("=" ** 80 ++ "\n", .{});
    std.debug.print("  Example Complete!\n", .{});
    std.debug.print("=" ** 80 ++ "\n\n", .{});

    std.debug.print("Key Takeaways:\n", .{});
    std.debug.print("- BLS12-381 supports pairing-based cryptography\n", .{});
    std.debug.print("- G1 points are 128 bytes, G2 points are 256 bytes (uncompressed)\n", .{});
    std.debug.print("- Scalar multiplication derives public keys from private keys\n", .{});
    std.debug.print("- Multi-scalar multiplication enables efficient aggregation\n", .{});
    std.debug.print("- Pairing checks verify signatures: e(sig, G2_gen) == e(H, pk)\n", .{});
    std.debug.print("- Hash-to-curve maps messages to curve points deterministically\n", .{});
    std.debug.print("- Signature aggregation produces constant-size signatures\n", .{});
    std.debug.print("- Always validate curve points and use constant-time operations\n", .{});
    std.debug.print("- Used extensively in Ethereum 2.0 consensus layer\n\n", .{});

    std.debug.print("Note: This example uses placeholder data for demonstration.\n", .{});
    std.debug.print("In production, use proper key generation and valid curve points.\n", .{});
}
