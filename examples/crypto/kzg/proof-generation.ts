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

console.log("=== KZG Proof Generation and Verification ===\n");

// Initialize KZG
KZG.loadTrustedSetup();

// Create a blob (represents polynomial coefficients)
const blob = KZG.generateRandomBlob();
const commitment = KZG.blobToKzgCommitment(blob);

console.log("1. Setup");
console.log("-".repeat(50));
console.log("Blob created:", blob.length, "bytes");
console.log("Commitment:", Hex.fromBytes(commitment).slice(0, 20) + "...");
console.log();

// Step 2: Generate proof at evaluation point z
console.log("2. Generating KZG Proof");
console.log("-".repeat(50));

// Create random evaluation point (32-byte field element)
const z = new Uint8Array(32);
crypto.getRandomValues(z);
z[0] = 0; // Ensure z < BLS12-381 modulus

console.log("Evaluation point z:", Hex.fromBytes(z).slice(0, 20) + "...");

// Compute proof: proves that polynomial(z) = y
const { proof, y } = KZG.computeKzgProof(blob, z);

console.log("Proof generated:");
console.log("  Proof (π):", Hex.fromBytes(proof).slice(0, 20) + "...");
console.log("  Value (y):", Hex.fromBytes(y).slice(0, 20) + "...");
console.log("  Proof size:", proof.length, "bytes");
console.log();

// Step 3: Verify proof
console.log("3. Verifying KZG Proof");
console.log("-".repeat(50));

const isValid = KZG.verifyKzgProof(commitment, z, y, proof);
console.log("Proof verification: ", isValid ? "✓ Valid" : "✗ Invalid");
console.log();

console.log("What we proved:");
console.log("  - The blob (as polynomial p) evaluates to y at point z");
console.log("  - i.e., p(z) = y");
console.log("  - Without revealing the full blob!");
console.log();

// Step 4: Test proof soundness - wrong y value
console.log("4. Testing Proof Soundness (Wrong y)");
console.log("-".repeat(50));

const wrongY = new Uint8Array(32);
crypto.getRandomValues(wrongY);
wrongY[0] = 0;

const invalidProof1 = KZG.verifyKzgProof(commitment, z, wrongY, proof);
console.log(
	"Proof with wrong y value:",
	invalidProof1 ? "✓ Valid (BAD!)" : "✗ Invalid (expected)",
);
console.log();

// Step 5: Test proof soundness - wrong commitment
console.log("5. Testing Proof Soundness (Wrong Commitment)");
console.log("-".repeat(50));

const blob2 = KZG.generateRandomBlob();
const wrongCommitment = KZG.blobToKzgCommitment(blob2);

const invalidProof2 = KZG.verifyKzgProof(wrongCommitment, z, y, proof);
console.log(
	"Proof with wrong commitment:",
	invalidProof2 ? "✓ Valid (BAD!)" : "✗ Invalid (expected)",
);
console.log();

// Step 6: Test proof soundness - corrupted proof
console.log("6. Testing Proof Soundness (Corrupted Proof)");
console.log("-".repeat(50));

const corruptedProof = new Uint8Array(proof);
corruptedProof[0] ^= 1; // Flip one bit

try {
	const invalidProof3 = KZG.verifyKzgProof(commitment, z, y, corruptedProof);
	console.log(
		"Corrupted proof:",
		invalidProof3 ? "✓ Valid (BAD!)" : "✗ Invalid (expected)",
	);
} catch (error) {
	console.log("Corrupted proof: ✗ Rejected (expected)");
}
console.log();

// Step 7: Multiple evaluation points
console.log("7. Multiple Evaluation Points");
console.log("-".repeat(50));

const evaluationPoints = [
	new Uint8Array(32).fill(0), // Zero point
	new Uint8Array(32).fill(1), // All ones
	new Uint8Array(32).fill(42), // Constant value
];

console.log("Testing blob at multiple points...");
for (let i = 0; i < evaluationPoints.length; i++) {
	const zPoint = evaluationPoints[i];
	const result = KZG.computeKzgProof(blob, zPoint);
	const valid = KZG.verifyKzgProof(commitment, zPoint, result.y, result.proof);

	console.log(`  Point ${i + 1}: ${valid ? "✓" : "✗"}`);
	console.log(`    z: ${Hex.fromBytes(zPoint).slice(0, 16)}...`);
	console.log(`    y: ${Hex.fromBytes(result.y).slice(0, 16)}...`);
}
console.log();

// Step 8: Proof determinism
console.log("8. Proof Determinism");
console.log("-".repeat(50));

const z2 = new Uint8Array(32).fill(123);
const result1 = KZG.computeKzgProof(blob, z2);
const result2 = KZG.computeKzgProof(blob, z2);

const sameProof = result1.proof.every((byte, i) => byte === result2.proof[i]);
const sameY = result1.y.every((byte, i) => byte === result2.y[i]);

console.log("Same blob + same z → same proof:", sameProof ? "✓" : "✗");
console.log("Same blob + same z → same y:", sameY ? "✓" : "✗");
console.log();

// Step 9: Understanding the math
console.log("9. Mathematical Background");
console.log("-".repeat(50));
console.log("KZG Polynomial Commitment Scheme:");
console.log("  1. Blob data → polynomial p(x) of degree 4095");
console.log("  2. Commitment C = [p(τ)]₁ where τ is secret from trusted setup");
console.log("  3. Proof π = [(p(τ) - y)/(τ - z)]₁ proves p(z) = y");
console.log("  4. Verification: pairing check ensures proof correctness");
console.log(
	"  5. Security: cannot forge proof without knowing τ (discrete log)",
);
console.log();

console.log("Why this works:");
console.log("  - Commitment binds to polynomial without revealing it");
console.log("  - Proof convinces verifier that p(z) = y");
console.log("  - Only 48 bytes regardless of polynomial size!");
console.log("  - Enables data availability sampling for L2s");
console.log();

// Cleanup
KZG.freeTrustedSetup();

console.log("=== Key Takeaways ===");
console.log("- Proof proves p(z) = y for commitment C");
console.log("- Proof is 48 bytes (BLS12-381 G1 point)");
console.log("- Cannot forge proof for wrong y or wrong commitment");
console.log("- Same inputs produce same proof (deterministic)");
console.log("- Based on pairing cryptography on BLS12-381");
