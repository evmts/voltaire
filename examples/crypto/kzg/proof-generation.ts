/**
 * KZG Proof Generation and Verification Example
 *
 * Demonstrates:
 * - Generating KZG proofs for polynomial evaluation
 * - Verifying proofs with commitments
 * - Testing with different evaluation points
 * - Understanding proof soundness
 */

import { KZG } from "../../../src/crypto/KZG/KZG.js";
import * as Hex from "../../../src/primitives/Hex/index.js";

// Initialize KZG
KZG.loadTrustedSetup();

// Create a blob (represents polynomial coefficients)
const blob = KZG.generateRandomBlob();
const commitment = KZG.blobToKzgCommitment(blob);

// Create random evaluation point (32-byte field element)
const z = new Uint8Array(32);
crypto.getRandomValues(z);
z[0] = 0; // Ensure z < BLS12-381 modulus

// Compute proof: proves that polynomial(z) = y
const { proof, y } = KZG.computeKzgProof(blob, z);

const isValid = KZG.verifyKzgProof(commitment, z, y, proof);

const wrongY = new Uint8Array(32);
crypto.getRandomValues(wrongY);
wrongY[0] = 0;

const invalidProof1 = KZG.verifyKzgProof(commitment, z, wrongY, proof);

const blob2 = KZG.generateRandomBlob();
const wrongCommitment = KZG.blobToKzgCommitment(blob2);

const invalidProof2 = KZG.verifyKzgProof(wrongCommitment, z, y, proof);

const corruptedProof = new Uint8Array(proof);
corruptedProof[0] ^= 1; // Flip one bit

try {
	const invalidProof3 = KZG.verifyKzgProof(commitment, z, y, corruptedProof);
} catch (error) {}

const evaluationPoints = [
	new Uint8Array(32).fill(0), // Zero point
	new Uint8Array(32).fill(1), // All ones
	new Uint8Array(32).fill(42), // Constant value
];
for (let i = 0; i < evaluationPoints.length; i++) {
	const zPoint = evaluationPoints[i];
	const result = KZG.computeKzgProof(blob, zPoint);
	const valid = KZG.verifyKzgProof(commitment, zPoint, result.y, result.proof);
}

const z2 = new Uint8Array(32).fill(123);
const result1 = KZG.computeKzgProof(blob, z2);
const result2 = KZG.computeKzgProof(blob, z2);

const sameProof = result1.proof.every((byte, i) => byte === result2.proof[i]);
const sameY = result1.y.every((byte, i) => byte === result2.y[i]);

// Cleanup
KZG.freeTrustedSetup();
