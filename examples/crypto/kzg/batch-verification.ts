/**
 * Batch KZG Proof Verification Example
 *
 * Demonstrates:
 * - Verifying multiple blob-proof pairs efficiently
 * - Batch verification for EIP-4844 transactions
 * - Performance benefits of batching
 * - Handling mixed valid/invalid proofs
 */

import { KZG } from "../../../src/crypto/KZG/KZG.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";

console.log("=== Batch KZG Proof Verification ===\n");

// Initialize KZG
KZG.loadTrustedSetup();

// Step 1: Create multiple blobs (simulating blob transaction with 3 blobs)
console.log("1. Creating Multiple Blobs");
console.log("-".repeat(50));

const NUM_BLOBS = 3;
const blobs: Uint8Array[] = [];
const commitments: Uint8Array[] = [];

for (let i = 0; i < NUM_BLOBS; i++) {
	const blob = KZG.generateRandomBlob();
	const commitment = KZG.blobToKzgCommitment(blob);

	blobs.push(blob);
	commitments.push(commitment);

	console.log(`Blob ${i + 1}:`);
	console.log("  Commitment:", Hex.fromBytes(commitment).slice(0, 20) + "...");
}
console.log();

// Step 2: Generate proofs for all blobs
console.log("2. Generating Proofs for All Blobs");
console.log("-".repeat(50));

// Use same evaluation point for all blobs (as in EIP-4844)
const z = new Uint8Array(32);
crypto.getRandomValues(z);
z[0] = 0;

const proofs: Uint8Array[] = [];
const yValues: Uint8Array[] = [];

for (let i = 0; i < NUM_BLOBS; i++) {
	const { proof, y } = KZG.computeKzgProof(blobs[i], z);
	proofs.push(proof);
	yValues.push(y);

	console.log(`Blob ${i + 1} proof:`);
	console.log("  y:", Hex.fromBytes(y).slice(0, 20) + "...");
	console.log("  proof:", Hex.fromBytes(proof).slice(0, 20) + "...");
}
console.log();

// Step 3: Individual verification
console.log("3. Individual Verification (Baseline)");
console.log("-".repeat(50));

console.log("Verifying each blob-proof pair separately...");
const startIndividual = performance.now();

for (let i = 0; i < NUM_BLOBS; i++) {
	const valid = KZG.verifyKzgProof(commitments[i], z, yValues[i], proofs[i]);
	console.log(`  Blob ${i + 1}: ${valid ? "✓" : "✗"}`);
}

const timeIndividual = performance.now() - startIndividual;
console.log(`Time: ${timeIndividual.toFixed(2)}ms`);
console.log();

// Step 4: Batch verification using verifyBlobKzgProofBatch
console.log("4. Batch Verification (Optimized)");
console.log("-".repeat(50));

console.log("Verifying all blobs in batch...");
const startBatch = performance.now();

const batchValid = KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);

const timeBatch = performance.now() - startBatch;
console.log(
	`Batch verification: ${batchValid ? "✓ All valid" : "✗ Some invalid"}`,
);
console.log(`Time: ${timeBatch.toFixed(2)}ms`);
console.log();

if (timeIndividual > 0 && timeBatch > 0) {
	const speedup = timeIndividual / timeBatch;
	console.log(`Speedup: ${speedup.toFixed(2)}x faster`);
	console.log();
}

// Step 5: Testing with invalid proof
console.log("5. Testing Batch with Invalid Proof");
console.log("-".repeat(50));

// Corrupt one proof
const corruptedProofs = [...proofs];
const badProof = new Uint8Array(proofs[1]);
badProof[5] ^= 1; // Flip one bit
corruptedProofs[1] = badProof;

console.log("Corrupting proof for blob 2...");
const batchInvalid = KZG.verifyBlobKzgProofBatch(
	blobs,
	commitments,
	corruptedProofs,
);

console.log(
	`Batch with corrupted proof: ${batchInvalid ? "✓ Valid (BAD!)" : "✗ Invalid (expected)"}`,
);
console.log("Note: Batch verification fails if ANY proof is invalid");
console.log();

// Step 6: Maximum blob transaction (6 blobs)
console.log("6. Maximum Blob Transaction (6 Blobs)");
console.log("-".repeat(50));

const MAX_BLOBS = 6;
const maxBlobs: Uint8Array[] = [];
const maxCommitments: Uint8Array[] = [];
const maxProofs: Uint8Array[] = [];

console.log("Creating maximum blob transaction...");
for (let i = 0; i < MAX_BLOBS; i++) {
	const blob = KZG.generateRandomBlob();
	const commitment = KZG.blobToKzgCommitment(blob);
	const { proof } = KZG.computeKzgProof(blob, z);

	maxBlobs.push(blob);
	maxCommitments.push(commitment);
	maxProofs.push(proof);
}

console.log(`Created ${MAX_BLOBS} blobs`);

const startMax = performance.now();
const maxValid = KZG.verifyBlobKzgProofBatch(
	maxBlobs,
	maxCommitments,
	maxProofs,
);
const timeMax = performance.now() - startMax;

console.log(`Batch verification (6 blobs): ${maxValid ? "✓" : "✗"}`);
console.log(`Time: ${timeMax.toFixed(2)}ms`);
console.log();

// Step 7: Understanding EIP-4844 batch verification
console.log("7. EIP-4844 Batch Verification Context");
console.log("-".repeat(50));

console.log("In blob transactions:");
console.log("  - Each transaction can have 1-6 blobs");
console.log("  - All blobs verified together in batch");
console.log("  - More efficient than individual verification");
console.log("  - Uses random linear combination for batching");
console.log();

console.log("Verification steps:");
console.log("  1. Check blob sizes (131,072 bytes each)");
console.log("  2. Verify commitments match versioned hashes");
console.log("  3. Batch verify all KZG proofs");
console.log("  4. All must pass for transaction validity");
console.log();

// Step 8: Compute versioned hashes
console.log("8. Computing Versioned Hashes for Transaction");
console.log("-".repeat(50));

const versionedHashes = commitments.map((commitment) => {
	const hash = SHA256.hash(commitment);
	hash[0] = 0x01; // Version byte
	return hash;
});

console.log("Versioned hashes (for transaction):");
for (let i = 0; i < versionedHashes.length; i++) {
	console.log(`  Blob ${i + 1}: ${Hex.fromBytes(versionedHashes[i])}`);
}
console.log();

// Step 9: Gas costs
console.log("9. Gas Cost Analysis");
console.log("-".repeat(50));

const BLOB_GAS_PER_BLOB = 131_072;
const VERIFICATION_GAS = 50_000; // Point evaluation precompile

console.log("Per blob:");
console.log(`  Blob gas: ${BLOB_GAS_PER_BLOB}`);
console.log(`  Verification: ${VERIFICATION_GAS} gas`);
console.log();

console.log(`For ${NUM_BLOBS} blobs:`);
const totalBlobGas = NUM_BLOBS * BLOB_GAS_PER_BLOB;
const totalVerificationGas = NUM_BLOBS * VERIFICATION_GAS;
console.log(`  Total blob gas: ${totalBlobGas}`);
console.log(`  Total verification: ${totalVerificationGas} gas`);
console.log();

console.log(`Maximum transaction (${MAX_BLOBS} blobs):`);
const maxBlobGas = MAX_BLOBS * BLOB_GAS_PER_BLOB;
const maxVerificationGas = MAX_BLOBS * VERIFICATION_GAS;
console.log(`  Total blob gas: ${maxBlobGas}`);
console.log(`  Total verification: ${maxVerificationGas} gas`);
console.log();

// Step 10: Practical considerations
console.log("10. Practical Considerations");
console.log("-".repeat(50));

console.log("Best practices:");
console.log("  ✓ Use batch verification when possible");
console.log("  ✓ Validate blob sizes before verification");
console.log("  ✓ Check versioned hash format (version byte = 0x01)");
console.log("  ✓ Ensure all commitments match hashes");
console.log("  ✓ Handle batch failure (all-or-nothing)");
console.log();

console.log("Performance tips:");
console.log("  - Batch verification scales better than individual");
console.log("  - Preload trusted setup once, reuse for all verifications");
console.log("  - Consider caching commitments for known blobs");
console.log();

// Cleanup
KZG.freeTrustedSetup();

console.log("=== Key Takeaways ===");
console.log("- Batch verification is more efficient than individual");
console.log("- All proofs must be valid for batch to succeed");
console.log("- Maximum 6 blobs per transaction (EIP-4844 limit)");
console.log("- Uses random linear combination for batch verification");
console.log("- Critical for L2 rollup data availability");
