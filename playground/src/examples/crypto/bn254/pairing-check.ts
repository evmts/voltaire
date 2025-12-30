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

const P = G1.generator();
const Q = G2.generator();
const negP = G1.negate(P);
const validPairs: Array<[typeof P, typeof Q]> = [
	[P, Q],
	[negP, Q],
];
const validCheck = Pairing.pairingCheck(validPairs);
const P1 = G1.mul(P, 2n);
const Q1 = G2.mul(Q, 3n);
const P2 = G1.mul(P, 5n);
const Q2 = G2.mul(Q, 7n);
const invalidPairs: Array<[typeof P1, typeof Q1]> = [
	[P1, Q1],
	[P2, Q2],
];
const invalidCheck = Pairing.pairingCheck(invalidPairs);
const emptyPairs: Array<[typeof P, typeof Q]> = [];
const emptyCheck = Pairing.pairingCheck(emptyPairs);

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

// Note: This specific check may or may not pass depending on implementation
// In a correct implementation with proper bilinearity, it should pass
const zkCheck = Pairing.pairingCheck(zkPairs);
