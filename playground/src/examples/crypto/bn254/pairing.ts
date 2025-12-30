/**
 * BN254 Bilinear Pairing
 *
 * The pairing e: G1 x G2 -> GT is a bilinear map with these properties:
 *
 * 1. Bilinearity:
 *    e(aP, bQ) = e(P, Q)^(ab)
 *    e(P + R, Q) = e(P, Q) * e(R, Q)
 *    e(P, Q + S) = e(P, Q) * e(P, S)
 *
 * 2. Non-degeneracy:
 *    If P != 0 and Q != 0, then e(P, Q) != 1
 *
 * 3. Computability:
 *    The pairing can be efficiently computed using Miller's algorithm
 *    followed by the final exponentiation.
 *
 * GT is a multiplicative group in Fp12 (12th degree extension field).
 * The pairing result is an element in this group.
 *
 * BN254's optimal ate pairing is used in Ethereum's bn256Add, bn256ScalarMul,
 * and bn256Pairing precompiles (EIP-196, EIP-197).
 */

import { BN254 } from "@tevm/voltaire";

const { G1, G2, Pairing } = BN254;

console.log("=== BN254 Bilinear Pairing ===\n");

// Get generator points
const P = G1.generator();
const Q = G2.generator();

// Basic pairing computation
console.log("Basic Pairing e(G1, G2):");
const e_PQ = Pairing.pair(P, Q);
console.log("  Pairing computed successfully");
console.log("  Result is in GT (Fp12 subgroup)");
console.log("  Result value defined:", e_PQ.value !== undefined, "\n");

// Pairing with infinity returns 1 (identity in GT)
console.log("Pairing with Infinity:");
const inf1 = G1.infinity();
const inf2 = G2.infinity();

const e_infQ = Pairing.pair(inf1, Q);
console.log("  e(Infinity, Q) = 1:", e_infQ.value === 1n);

const e_Pinf = Pairing.pair(P, inf2);
console.log("  e(P, Infinity) = 1:", e_Pinf.value === 1n);

const e_infinf = Pairing.pair(inf1, inf2);
console.log("  e(Infinity, Infinity) = 1:", e_infinf.value === 1n, "\n");

// Demonstrate bilinearity concept (scalar multiplication)
console.log("Bilinearity Property Demonstration:");
console.log("  For scalars a, b: e(aP, bQ) should equal e(P, Q)^(ab)\n");

// Compute e(2P, 3Q) and e(P, 6Q) - should be related
const a = 2n,
	b = 3n;
const aP = G1.mul(P, a);
const bQ = G2.mul(Q, b);
const abQ = G2.mul(Q, a * b);

console.log("  Computing e(2P, 3Q)...");
const e_aP_bQ = Pairing.pair(aP, bQ);
console.log("  Result computed");

console.log("  Computing e(P, 6Q)...");
const e_P_abQ = Pairing.pair(P, abQ);
console.log("  Result computed\n");

// Multi-pairing: compute product of multiple pairings
console.log("Multi-Pairing (Product of Pairings):");
const P1 = G1.mul(P, 5n);
const Q1 = G2.mul(Q, 7n);
const P2 = G1.mul(P, 11n);
const Q2 = G2.mul(Q, 13n);

const pairs: Array<[typeof P1, typeof Q1]> = [
	[P1, Q1],
	[P2, Q2],
];

const multiResult = Pairing.multiPairing(pairs);
console.log("  e(5P, 7Q) * e(11P, 13Q) computed");
console.log("  Result defined:", multiResult !== undefined, "\n");

// Practical note about pairing efficiency
console.log("Performance Notes:");
console.log("  - Miller loop is the expensive part");
console.log("  - Final exponentiation can be batched");
console.log("  - multiPairing shares final exponentiation");
console.log("  - Ethereum charges ~80,000 gas for single pairing");
console.log("  - Additional pairs cost ~40,000 gas each");
