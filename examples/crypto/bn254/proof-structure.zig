const std = @import("std");
const crypto = @import("crypto");

const G1 = crypto.bn254.G1;
const G2 = crypto.bn254.G2;
const Fr = crypto.bn254.Fr;
const FpMont = crypto.bn254.FpMont;
const Fp2Mont = crypto.bn254.Fp2Mont;
const pairing = crypto.bn254.pairing.pairing;

/// zkSNARK Proof Structure
///
/// Demonstrates zkSNARK proof formats and verification patterns:
/// - Groth16 proof structure
/// - Verification key components
/// - Public input encoding
/// - Proof validation workflow
pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== zkSNARK Proof Structure ===\n\n", .{});

    // Initialize generators
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

    // 1. Groth16 Proof Structure
    try stdout.print("1. Groth16 Proof Structure\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // A Groth16 proof consists of exactly 3 group elements
    const Groth16Proof = struct {
        A: G1, // G1 point (64 bytes)
        B: G2, // G2 point (128 bytes)
        C: G1, // G1 point (64 bytes)
    };

    // Example proof (simplified)
    const proof = Groth16Proof{
        .A = try g1_gen.mul(&Fr.init(12345)),
        .B = g2_gen.mul(&Fr.init(67890)),
        .C = try g1_gen.mul(&Fr.init(11111)),
    };

    try stdout.print("Groth16 proof components:\n", .{});
    try stdout.print("  A (G1): 64 bytes - Main commitment\n", .{});
    try stdout.print("  B (G2): 128 bytes - Auxiliary commitment\n", .{});
    try stdout.print("  C (G1): 64 bytes - Proof element\n", .{});
    try stdout.print("  Total: 256 bytes (constant size!)\n\n", .{});

    // 2. Verification Key Structure
    try stdout.print("2. Verification Key Structure\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const Groth16VerificationKey = struct {
        alpha: G1,
        beta: G2,
        gamma: G2,
        delta: G2,
        IC: [3]G1, // Length = num_public_inputs + 1
    };

    // Example verification key (from trusted setup)
    const vk = Groth16VerificationKey{
        .alpha = try g1_gen.mul(&Fr.init(12345)),
        .beta = g2_gen.mul(&Fr.init(67890)),
        .gamma = g2_gen.mul(&Fr.init(11111)),
        .delta = g2_gen.mul(&Fr.init(22222)),
        .IC = [_]G1{
            try g1_gen.mul(&Fr.init(1000)), // IC[0] - constant term
            try g1_gen.mul(&Fr.init(2000)), // IC[1] - for public input 1
            try g1_gen.mul(&Fr.init(3000)), // IC[2] - for public input 2
        },
    };

    try stdout.print("Verification key components:\n", .{});
    try stdout.print("  α (G1): 64 bytes\n", .{});
    try stdout.print("  β (G2): 128 bytes\n", .{});
    try stdout.print("  γ (G2): 128 bytes\n", .{});
    try stdout.print("  δ (G2): 128 bytes\n", .{});
    try stdout.print("  IC[] (G1 array): {d} elements × 64 bytes = {d} bytes\n", .{ vk.IC.len, vk.IC.len * 64 });

    const vk_size = 64 + 128 + 128 + 128 + (vk.IC.len * 64);
    try stdout.print("  Total VK size: {d} bytes\n\n", .{vk_size});

    // 3. Public Inputs
    try stdout.print("3. Public Inputs Encoding\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // Public inputs are field elements (scalars)
    const public_inputs = [_]Fr{
        Fr.init(42),
        Fr.init(99),
    };

    try stdout.print("Public inputs:\n", .{});
    for (public_inputs, 0..) |input, i| {
        _ = input;
        try stdout.print("  x[{d}] = {d}\n", .{ i, if (i == 0) 42 else 99 });
    }

    // Compute L = IC[0] + Σ(public_input[i] × IC[i])
    var L = vk.IC[0];
    for (public_inputs, 0..) |input, i| {
        const term = try vk.IC[i + 1].mul(&input);
        L = L.add(&term);
    }

    try stdout.print("\nComputed L = IC[0] + x[0]×IC[1] + x[1]×IC[2]\n", .{});
    try stdout.print("L encodes all public inputs into a single G1 point\n\n", .{});

    // 4. Verification Equation
    try stdout.print("4. Verification Equation\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    try stdout.print("Groth16 verification checks:\n", .{});
    try stdout.print("  e(A, B) = e(α, β) × e(L, γ) × e(C, δ)\n\n", .{});

    try stdout.print("Performing verification...\n", .{});

    // Convert to affine for pairing
    const proof_A_affine = try proof.A.toAffine();
    const proof_B_affine = proof.B.toAffine();
    const proof_C_affine = try proof.C.toAffine();
    const vk_alpha_affine = try vk.alpha.toAffine();
    const vk_beta_affine = vk.beta.toAffine();
    const vk_gamma_affine = vk.gamma.toAffine();
    const vk_delta_affine = vk.delta.toAffine();
    const L_affine = try L.toAffine();

    // Compute pairings
    const pair_AB = try pairing(&proof_A_affine, &proof_B_affine);
    const pair_alpha_beta = try pairing(&vk_alpha_affine, &vk_beta_affine);
    const pair_L_gamma = try pairing(&L_affine, &vk_gamma_affine);
    const pair_C_delta = try pairing(&proof_C_affine, &vk_delta_affine);

    // Check equation
    const rhs = pair_alpha_beta.mul(&pair_L_gamma).mul(&pair_C_delta);
    const is_valid = pair_AB.equal(&rhs);

    try stdout.print("Verification result: {s}\n\n", .{if (is_valid) "VALID ✓" else "INVALID ✗"});

    // 5. Tornado Cash Pattern
    try stdout.print("5. Tornado Cash Privacy Pattern\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    try stdout.print("Tornado Cash deposit/withdrawal:\n", .{});
    try stdout.print("\nDeposit phase:\n", .{});
    try stdout.print("  1. User generates secret and nullifier\n", .{});
    try stdout.print("  2. Computes commitment = hash(secret, nullifier)\n", .{});
    try stdout.print("  3. Deposits ETH and stores commitment in Merkle tree\n\n", .{});

    try stdout.print("Withdrawal phase (zkSNARK proof):\n", .{});
    try stdout.print("  Public inputs:\n", .{});
    try stdout.print("    - Merkle root (proves deposit exists)\n", .{});
    try stdout.print("    - Nullifier hash (prevents double-spend)\n", .{});
    try stdout.print("    - Recipient address\n", .{});
    try stdout.print("    - Relayer address\n", .{});
    try stdout.print("    - Fee amount\n", .{});
    try stdout.print("\n  Private witness:\n", .{});
    try stdout.print("    - Secret\n", .{});
    try stdout.print("    - Nullifier\n", .{});
    try stdout.print("    - Merkle path proof\n\n", .{});

    try stdout.print("Circuit proves: \"I know a secret in the tree\"\n", .{});
    try stdout.print("without revealing WHICH deposit is being withdrawn\n\n", .{});

    // 6. zkSync L2 Rollup Pattern
    try stdout.print("6. zkSync L2 Rollup Pattern\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    try stdout.print("zkSync batch proof:\n", .{});
    try stdout.print("  Public inputs:\n", .{});
    try stdout.print("    - Old state root\n", .{});
    try stdout.print("    - New state root\n", .{});
    try stdout.print("    - Batch number\n", .{});
    try stdout.print("    - Transactions commitment\n\n", .{});

    try stdout.print("  Private witness:\n", .{});
    try stdout.print("    - All transaction details\n", .{});
    try stdout.print("    - State transition proofs\n", .{});
    try stdout.print("    - Merkle proofs for accounts\n\n", .{});

    try stdout.print("Circuit proves: \"These transactions are valid\"\n", .{});
    try stdout.print("and correctly transition old state → new state\n\n", .{});

    try stdout.print("Benefits:\n", .{});
    try stdout.print("  - Thousands of txs verified in one proof\n", .{});
    try stdout.print("  - ~182k gas regardless of batch size\n", .{});
    try stdout.print("  - Achieves massive scalability\n\n", .{});

    // 7. Proof Generation Workflow
    try stdout.print("7. Proof Generation Workflow\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    try stdout.print("Prover steps:\n", .{});
    try stdout.print("  1. Compile circuit (Circom/R1CS)\n", .{});
    try stdout.print("  2. Run trusted setup (generates VK + proving key)\n", .{});
    try stdout.print("  3. Compute witness from inputs\n", .{});
    try stdout.print("  4. Generate proof (uses proving key)\n", .{});
    try stdout.print("  5. Serialize proof (256 bytes)\n", .{});
    try stdout.print("  6. Submit to contract\n\n", .{});

    try stdout.print("Verifier steps (on-chain):\n", .{});
    try stdout.print("  1. Deserialize proof (A, B, C)\n", .{});
    try stdout.print("  2. Compute L from public inputs\n", .{});
    try stdout.print("  3. Call ECPAIRING precompile\n", .{});
    try stdout.print("  4. Check result = 1\n", .{});
    try stdout.print("  5. Execute transaction if valid\n\n", .{});

    // 8. Gas Analysis
    try stdout.print("8. Gas Cost Analysis\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const ecpairing_base = 45000;
    const ecpairing_per_pair = 34000;
    const num_pairs = 4;

    const pairing_gas = ecpairing_base + (num_pairs * ecpairing_per_pair);
    const deserialization_gas = 5000;
    const input_encoding_gas = 3000;
    const total_gas = pairing_gas + deserialization_gas + input_encoding_gas;

    try stdout.print("Gas breakdown:\n", .{});
    try stdout.print("  ECPAIRING: {d} + ({d} × {d}) = {d}\n", .{ ecpairing_base, num_pairs, ecpairing_per_pair, pairing_gas });
    try stdout.print("  Deserialization: ~{d}\n", .{deserialization_gas});
    try stdout.print("  Input encoding: ~{d}\n", .{input_encoding_gas});
    try stdout.print("  Total: ~{d} gas\n\n", .{total_gas});

    try stdout.print("Cost comparison:\n", .{});
    try stdout.print("  Groth16 verification: ~190k gas\n", .{});
    try stdout.print("  Simple transfer: 21k gas\n", .{});
    try stdout.print("  Privacy achieved at ~9x base cost\n\n", .{});

    try stdout.print("=== Complete ===\n", .{});
    try stdout.print("\nKey Takeaways:\n", .{});
    try stdout.print("- Groth16: 3 group elements (A, B, C)\n", .{});
    try stdout.print("- Constant 256-byte proof size\n", .{});
    try stdout.print("- Verification key from trusted setup\n", .{});
    try stdout.print("- Public inputs encoded as L = Σ(x[i] × IC[i])\n", .{});
    try stdout.print("- Powers Tornado Cash, zkSync, Aztec\n", .{});
    try stdout.print("- ~182k gas makes privacy practical on Ethereum\n", .{});
}
