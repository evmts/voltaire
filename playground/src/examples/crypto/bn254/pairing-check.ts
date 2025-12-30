/**
 * BN254 Pairing Check for zkSNARK Verification
 *
 * The pairing check verifies if:
 *   e(P1, Q1) * e(P2, Q2) * ... * e(Pn, Qn) = 1 (in GT)
 *
 * This is the core operation for zkSNARK verification. A typical
 * Groth16 verification has the form:
 *
 *   e(A, B) = e(alpha, beta) * e(L, gamma) * e(C, delta)
 *
 * Which can be rewritten as:
 *   e(A, B) * e(-alpha, beta) * e(-L, gamma) * e(-C, delta) = 1
 *
 * The pairingCheck function efficiently computes this by:
 * 1. Accumulating Miller loop results
 * 2. Performing a single final exponentiation
 * 3. Checking if result equals 1
 *
 * This is EIP-197's bn256Pairing precompile functionality.
 */

import { BN254 } from "@tevm/voltaire";

const { G1, G2, Pairing } = BN254;

console.log("=== BN254 Pairing Check ===\n");

const P = G1.generator();
const Q = G2.generator();

// Simple valid pairing check: e(P, Q) * e(-P, Q) = 1
console.log("Valid Pairing Check: e(P, Q) * e(-P, Q) = 1");
const negP = G1.negate(P);
const validPairs: Array<[typeof P, typeof Q]> = [
	[P, Q],
	[negP, Q],
];
const validCheck = Pairing.pairingCheck(validPairs);
console.log("  Result:", validCheck, "\n");

// Invalid pairing check: random pairs don't satisfy equation
console.log("Invalid Pairing Check: e(2P, 3Q) * e(5P, 7Q) != 1");
const P1 = G1.mul(P, 2n);
const Q1 = G2.mul(Q, 3n);
const P2 = G1.mul(P, 5n);
const Q2 = G2.mul(Q, 7n);
const invalidPairs: Array<[typeof P1, typeof Q1]> = [
	[P1, Q1],
	[P2, Q2],
];
const invalidCheck = Pairing.pairingCheck(invalidPairs);
console.log("  Result:", invalidCheck, "\n");

// Empty pairing check returns true (empty product = 1)
console.log("Empty Pairing Check:");
const emptyPairs: Array<[typeof P, typeof Q]> = [];
const emptyCheck = Pairing.pairingCheck(emptyPairs);
console.log("  Result:", emptyCheck, "(empty product = 1)\n");

// Construct a valid 4-pair check simulating zkSNARK structure
console.log("zkSNARK-style Pairing Check (4 pairs):");
console.log("  Verifying: e(a*P, b*Q) * e(-(a*b)*P, Q) = 1\n");

const a = 7n;
const b = 11n;
const ab = a * b;

const aP = G1.mul(P, a);
const bQ = G2.mul(Q, b);
const neg_abP = G1.negate(G1.mul(P, ab));

// e(aP, bQ) * e(-(ab)P, Q) should = 1 by bilinearity
const zkPairs: Array<[typeof P, typeof Q]> = [
	[aP, bQ],
	[neg_abP, Q],
];

console.log("  Pairs:");
console.log("    1. (7*P, 11*Q)");
console.log("    2. (-(7*11)*P, Q)");
console.log();

// Note: This specific check may or may not pass depending on implementation
// In a correct implementation with proper bilinearity, it should pass
const zkCheck = Pairing.pairingCheck(zkPairs);
console.log("  Pairing check result:", zkCheck);
console.log();

// Demonstrate the Groth16 verification pattern
console.log("Groth16 Verification Pattern:");
console.log("  Verification equation:");
console.log(
	"    e(A, B) = e(vk_alpha, vk_beta) * e(vk_ic, vk_gamma) * e(C, vk_delta)",
);
console.log();
console.log("  Rewritten for pairing check:");
console.log(
	"    e(-A, B) * e(vk_alpha, vk_beta) * e(vk_ic, vk_gamma) * e(C, vk_delta) = 1",
);
console.log();
console.log("  Where:");
console.log("    A, B, C = proof elements");
console.log("    vk_* = verification key elements");
console.log("    vk_ic = linear combination based on public inputs");
