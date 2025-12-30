/**
 * BN254 (BN128) Pairing Curve Basics
 *
 * BN254 is a pairing-friendly elliptic curve used in Ethereum's precompiles
 * for zkSNARK verification (EIP-196, EIP-197). It provides:
 * - G1: Points on the base curve E(Fp)
 * - G2: Points on the twisted curve E'(Fp2)
 * - Pairing: Bilinear map e: G1 x G2 -> GT
 *
 * The curve equation is y^2 = x^3 + 3 over Fp where:
 * p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
 *
 * This curve is also known as alt_bn128 or bn128 in various contexts.
 */

import { BN254 } from "@tevm/voltaire";

// Access curve constants
const { G1, G2, Pairing, Fr, Fp } = BN254;

// Create the standard generator points
const g1 = G1.generator();
const g2 = G2.generator();

console.log("=== BN254 Curve Overview ===\n");

// G1 generator point (1, 2) is the standard generator
console.log("G1 Generator:");
console.log("  x:", g1.x.toString());
console.log("  y:", g1.y.toString());
console.log("  z:", g1.z.toString(), "(projective coordinate)\n");

// G2 generator is in the extension field Fp2 (complex-like: a + bu)
console.log("G2 Generator:");
console.log("  x.c0:", g2.x.c0.toString().slice(0, 40) + "...");
console.log("  x.c1:", g2.x.c1.toString().slice(0, 40) + "...");
console.log("  y.c0:", g2.y.c0.toString().slice(0, 40) + "...");
console.log("  y.c1:", g2.y.c1.toString().slice(0, 40) + "...\n");

// Verify points are on their respective curves
console.log("Point Validation:");
console.log("  G1 generator on curve:", G1.isOnCurve(g1));
console.log("  G2 generator on curve:", G2.isOnCurve(g2));
console.log("  G2 generator in subgroup:", G2.isInSubgroup(g2), "\n");

// Scalar field Fr - order of the curve
const FR_MOD =
	21888242871839275222246405745257275088548364400416034343698204186575808495617n;
console.log("Scalar Field (Fr):");
console.log("  Order:", FR_MOD.toString().slice(0, 40) + "...");
console.log("  Fr.mod(FR_MOD):", Fr.mod(FR_MOD), "(should be 0)");
console.log("  Fr.isValid(100n):", Fr.isValid(100n), "\n");

// The infinity point (identity element)
const inf1 = G1.infinity();
const inf2 = G2.infinity();
console.log("Identity Elements:");
console.log("  G1.isZero(infinity):", G1.isZero(inf1));
console.log("  G2.isZero(infinity):", G2.isZero(inf2));

// Adding identity returns the original point
const g1PlusInf = G1.add(g1, inf1);
console.log("  G1.add(g1, infinity) equals g1:", G1.equal(g1PlusInf, g1), "\n");

// Compute a simple pairing
console.log("Pairing Computation:");
const pairingResult = Pairing.pair(g1, g2);
console.log("  e(G1, G2) computed (result is in GT group)");
console.log("  Result defined:", pairingResult !== undefined);
