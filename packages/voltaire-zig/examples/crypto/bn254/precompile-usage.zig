const std = @import("std");
const crypto = @import("crypto");

const G1 = crypto.bn254.G1;
const G2 = crypto.bn254.G2;
const Fr = crypto.bn254.Fr;
const FpMont = crypto.bn254.FpMont;
const Fp2Mont = crypto.bn254.Fp2Mont;
const pairing = crypto.bn254.pairing.pairing;

/// BN254 EVM Precompile Usage
///
/// Demonstrates how to use Ethereum's BN254 precompiled contracts:
/// - 0x06: ECADD - G1 point addition
/// - 0x07: ECMUL - G1 scalar multiplication
/// - 0x08: ECPAIRING - Pairing check
///
/// These precompiles make zkSNARK verification gas-efficient on Ethereum.
/// Activated in Byzantium (EIP-196/197), optimized in Istanbul (EIP-1108).
pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== BN254 EVM Precompile Usage ===\n\n", .{});

    // Initialize generator
    const g1_gen = G1{
        .x = FpMont.init(1),
        .y = FpMont.init(2),
        .z = FpMont.init(1),
    };

    const g2_gen = G2{
        .x = Fp2Mont.initFromInt(
            0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed,
            0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2,
        ),
        .y = Fp2Mont.initFromInt(
            0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa,
            0x090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b,
        ),
        .z = Fp2Mont.initFromInt(1, 0),
    };

    // 1. ECADD - G1 Point Addition (0x06)
    try stdout.print("1. ECADD Precompile (0x06)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const s5 = Fr.init(5);
    const s7 = Fr.init(7);
    const p1 = try g1_gen.mul(&s5);
    const p2 = try g1_gen.mul(&s7);

    // Precompile input: 128 bytes (64 for each point)
    try stdout.print("Input size: 128 bytes\n", .{});
    try stdout.print("Format: [x1, y1, x2, y2] (32 bytes each)\n", .{});

    // Simulate precompile operation
    const result_point = p1.add(&p2);

    try stdout.print("Output size: 64 bytes\n", .{});
    try stdout.print("Gas cost: 150 gas (after EIP-1108)\n\n", .{});

    // Verify result
    const s12 = Fr.init(12);
    const expected_result = try g1_gen.mul(&s12); // 5 + 7 = 12
    const is_correct = result_point.equal(&expected_result);
    try stdout.print("Result verification: {s}\n\n", .{if (is_correct) "PASS" else "FAIL"});

    // 2. ECMUL - G1 Scalar Multiplication (0x07)
    try stdout.print("2. ECMUL Precompile (0x07)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const s3 = Fr.init(3);
    const base_point = try g1_gen.mul(&s3);
    const scalar = Fr.init(17);

    // Precompile input: 96 bytes (64 for point, 32 for scalar)
    try stdout.print("Input size: 96 bytes\n", .{});
    try stdout.print("Format: [x, y, scalar] (32 bytes each)\n", .{});

    // Simulate precompile operation
    const mul_result = try base_point.mul(&scalar);

    try stdout.print("Output size: 64 bytes\n", .{});
    try stdout.print("Gas cost: 6,000 gas (after EIP-1108)\n\n", .{});

    // Verify: (3 × G1) × 17 = 51 × G1
    const s51 = Fr.init(51);
    const expected_mul = try g1_gen.mul(&s51);
    const mul_correct = mul_result.equal(&expected_mul);
    try stdout.print("Result verification: {s}\n\n", .{if (mul_correct) "PASS" else "FAIL"});

    // 3. ECPAIRING - Pairing Check (0x08)
    try stdout.print("3. ECPAIRING Precompile (0x08)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // Pairing check: e(P1, Q1) × e(P2, Q2) = 1
    const s11 = Fr.init(11);
    const s13 = Fr.init(13);
    const s143 = Fr.init(143); // 11 * 13

    const P1 = try g1_gen.mul(&s11);
    const Q1 = g2_gen.mul(&s13);
    const P2 = try g1_gen.mul(&s143);
    const Q2 = g2_gen;

    // Precompile input: 192 bytes per pair (64 for G1, 128 for G2)
    const num_pairs = 2;

    try stdout.print("Input size: {d} bytes ({d} pairs)\n", .{ 192 * num_pairs, num_pairs });
    try stdout.print("Format: [G1_1, G2_1, G1_2, G2_2, ...]\n", .{});

    // Convert to affine for pairing
    const P1_affine = try P1.toAffine();
    const Q1_affine = Q1.toAffine();
    const P2_affine = try P2.toAffine();
    const Q2_affine = Q2.toAffine();

    // Compute pairings
    const pair1 = try pairing(&P1_affine, &Q1_affine);
    const pair2 = try pairing(&P2_affine, &Q2_affine);

    // Check if product equals identity
    const pairing_result = pair1.equal(&pair2);

    try stdout.print("Result: {s}\n", .{if (pairing_result) "VALID (1)" else "INVALID (0)"});

    const base_gas = 45000;
    const per_pair_gas = 34000;
    const total_gas = base_gas + (num_pairs * per_pair_gas);

    try stdout.print("Gas cost: {d} + ({d} × {d}) = {d} gas\n\n", .{ base_gas, num_pairs, per_pair_gas, total_gas });

    // 4. Groth16 Verification Pattern
    try stdout.print("4. Groth16 Verification Pattern\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    try stdout.print("Groth16 pairing structure:\n", .{});
    try stdout.print("- e(A, B): Proof commitment\n", .{});
    try stdout.print("- e(-α, β): Verification key\n", .{});
    try stdout.print("- e(-L, γ): Public inputs\n", .{});
    try stdout.print("- e(-C, δ): Additional proof element\n\n", .{});

    const groth16_gas = base_gas + (4 * per_pair_gas); // 4 pairings
    try stdout.print("Gas for Groth16 verification: {d} gas\n", .{groth16_gas});
    try stdout.print("Makes privacy protocols economically viable!\n\n", .{});

    // 5. Point Format Details
    try stdout.print("5. Point Serialization Format\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    try stdout.print("G1 Point (64 bytes):\n", .{});
    try stdout.print("  Bytes 0-31:  x-coordinate (Fp element, big-endian)\n", .{});
    try stdout.print("  Bytes 32-63: y-coordinate (Fp element, big-endian)\n", .{});
    try stdout.print("  Infinity: (0, 0)\n\n", .{});

    try stdout.print("G2 Point (128 bytes):\n", .{});
    try stdout.print("  Bytes 0-31:   x.c0 (Fp element)\n", .{});
    try stdout.print("  Bytes 32-63:  x.c1 (Fp element)\n", .{});
    try stdout.print("  Bytes 64-95:  y.c0 (Fp element)\n", .{});
    try stdout.print("  Bytes 96-127: y.c1 (Fp element)\n", .{});
    try stdout.print("  Where x = x.c0 + x.c1·i, y = y.c0 + y.c1·i\n\n", .{});

    // 6. Gas Cost Comparison
    try stdout.print("6. Gas Cost Summary (EIP-1108)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    try stdout.print("Before Istanbul (EIP-196/197):\n", .{});
    try stdout.print("  ECADD:    500 gas\n", .{});
    try stdout.print("  ECMUL:    40,000 gas\n", .{});
    try stdout.print("  ECPAIRING base: 100,000 gas\n", .{});
    try stdout.print("  ECPAIRING per pair: 80,000 gas\n\n", .{});

    try stdout.print("After Istanbul (EIP-1108):\n", .{});
    try stdout.print("  ECADD:    150 gas (97%% reduction)\n", .{});
    try stdout.print("  ECMUL:    6,000 gas (85%% reduction)\n", .{});
    try stdout.print("  ECPAIRING base: 45,000 gas (55%% reduction)\n", .{});
    try stdout.print("  ECPAIRING per pair: 34,000 gas (58%% reduction)\n\n", .{});

    try stdout.print("Impact: Groth16 verification went from ~820k to ~182k gas\n\n", .{});

    // 7. Edge Cases
    try stdout.print("7. Edge Cases\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // Infinity point
    const infinity = G1{
        .x = FpMont.init(0),
        .y = FpMont.init(0),
        .z = FpMont.init(0),
    };

    try stdout.print("Infinity point operations:\n", .{});
    try stdout.print("  Is infinity: {}\n", .{infinity.isInfinity()});

    // Adding infinity
    const p_plus_infinity = p1.add(&infinity);
    const identity_holds = p1.equal(&p_plus_infinity);
    try stdout.print("  P + infinity = P: {}\n", .{identity_holds});

    // Multiplying by zero
    const s0 = Fr.init(0);
    const zero_mul = try g1_gen.mul(&s0);
    const is_infinity = zero_mul.isInfinity();
    try stdout.print("  G1 × 0 = infinity: {}\n\n", .{is_infinity});

    try stdout.print("=== Complete ===\n", .{});
    try stdout.print("\nKey Points:\n", .{});
    try stdout.print("- Precompiles make zkSNARKs affordable (~182k gas)\n", .{});
    try stdout.print("- ECADD/ECMUL operate on G1 only (Fp base field)\n", .{});
    try stdout.print("- ECPAIRING handles G1×G2 pairs (outputs 0 or 1)\n", .{});
    try stdout.print("- EIP-1108 reduced costs by 80-97%% in Istanbul\n", .{});
    try stdout.print("- Critical for Tornado Cash, zkSync, Aztec, etc.\n", .{});
}
