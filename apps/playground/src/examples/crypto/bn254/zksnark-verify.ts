/**
 * BN254 zkSNARK Verification Pattern
 *
 * This example demonstrates the structure of Groth16 zkSNARK verification
 * using BN254 pairings. Groth16 is the most widely used zkSNARK system in
 * Ethereum (used by Zcash, Tornado Cash, zkSync, etc.).
 *
 * Verification Equation:
 *   e(A, B) = e(alpha, beta) * e(sum_i(pub_i * L_i), gamma) * e(C, delta)
 *
 * Where:
 *   - (A, B, C) are the proof elements
 *   - (alpha, beta, gamma, delta) are verification key elements
 *   - L_i are verification key points for each public input
 *   - pub_i are the public inputs to the circuit
 *
 * This is computed as a pairing check:
 *   e(-A, B) * e(alpha, beta) * e(IC, gamma) * e(C, delta) = 1
 *
 * Where IC = vk.ic[0] + sum(pub[i] * vk.ic[i+1])
 */

import { BN254 } from "@tevm/voltaire";

const { G1, G2, Pairing, Fr } = BN254;

// Simulated verification key (in real use, this comes from trusted setup)
interface VerificationKey {
	alpha: ReturnType<typeof G1.generator>;
	beta: ReturnType<typeof G2.generator>;
	gamma: ReturnType<typeof G2.generator>;
	delta: ReturnType<typeof G2.generator>;
	ic: ReturnType<typeof G1.generator>[]; // One more than number of public inputs
}

// Simulated proof (in real use, this comes from the prover)
interface Proof {
	a: ReturnType<typeof G1.generator>;
	b: ReturnType<typeof G2.generator>;
	c: ReturnType<typeof G1.generator>;
}

// Create mock verification key
// In reality, these would be specific points from the trusted setup
const g1 = G1.generator();
const g2 = G2.generator();

const vk: VerificationKey = {
	alpha: G1.mul(g1, 123n), // alpha_G1
	beta: G2.mul(g2, 456n), // beta_G2
	gamma: G2.mul(g2, 789n), // gamma_G2
	delta: G2.mul(g2, 101n), // delta_G2
	ic: [
		G1.mul(g1, 111n), // ic[0] - constant term
		G1.mul(g1, 222n), // ic[1] - for pub[0]
		G1.mul(g1, 333n), // ic[2] - for pub[1]
	],
};

// Create mock proof
const proof: Proof = {
	a: G1.mul(g1, 777n),
	b: G2.mul(g2, 888n),
	c: G1.mul(g1, 999n),
};

// Public inputs (the values the verifier knows)
const publicInputs = [
	12345n, // First public input
	67890n, // Second public input
];
let ic = vk.ic[0];
for (let i = 0; i < publicInputs.length; i++) {
	const scalar = Fr.mod(publicInputs[i]); // Reduce to scalar field
	const term = G1.mul(vk.ic[i + 1], scalar);
	ic = G1.add(ic, term);
}

const negA = G1.negate(proof.a);
const pairs: Array<[typeof g1, typeof g2]> = [
	[negA, proof.b], // e(-A, B)
	[vk.alpha, vk.beta], // e(alpha, beta)
	[ic, vk.gamma], // e(IC, gamma)
	[proof.c, vk.delta], // e(C, delta)
];
const isValid = Pairing.pairingCheck(pairs);
