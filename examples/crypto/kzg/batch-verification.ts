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

// Initialize KZG
KZG.loadTrustedSetup();

const NUM_BLOBS = 3;
const blobs: Uint8Array[] = [];
const commitments: Uint8Array[] = [];

for (let i = 0; i < NUM_BLOBS; i++) {
	const blob = KZG.generateRandomBlob();
	const commitment = KZG.blobToKzgCommitment(blob);

	blobs.push(blob);
	commitments.push(commitment);
}

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
}
const startIndividual = performance.now();

for (let i = 0; i < NUM_BLOBS; i++) {
	const valid = KZG.verifyKzgProof(commitments[i], z, yValues[i], proofs[i]);
}

const timeIndividual = performance.now() - startIndividual;
const startBatch = performance.now();

const batchValid = KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);

const timeBatch = performance.now() - startBatch;

if (timeIndividual > 0 && timeBatch > 0) {
	const speedup = timeIndividual / timeBatch;
}

// Corrupt one proof
const corruptedProofs = [...proofs];
const badProof = new Uint8Array(proofs[1]);
badProof[5] ^= 1; // Flip one bit
corruptedProofs[1] = badProof;
const batchInvalid = KZG.verifyBlobKzgProofBatch(
	blobs,
	commitments,
	corruptedProofs,
);

const MAX_BLOBS = 6;
const maxBlobs: Uint8Array[] = [];
const maxCommitments: Uint8Array[] = [];
const maxProofs: Uint8Array[] = [];
for (let i = 0; i < MAX_BLOBS; i++) {
	const blob = KZG.generateRandomBlob();
	const commitment = KZG.blobToKzgCommitment(blob);
	const { proof } = KZG.computeKzgProof(blob, z);

	maxBlobs.push(blob);
	maxCommitments.push(commitment);
	maxProofs.push(proof);
}

const startMax = performance.now();
const maxValid = KZG.verifyBlobKzgProofBatch(
	maxBlobs,
	maxCommitments,
	maxProofs,
);
const timeMax = performance.now() - startMax;

const versionedHashes = commitments.map((commitment) => {
	const hash = SHA256.hash(commitment);
	hash[0] = 0x01; // Version byte
	return hash;
});
for (let i = 0; i < versionedHashes.length; i++) {}

const BLOB_GAS_PER_BLOB = 131_072;
const VERIFICATION_GAS = 50_000; // Point evaluation precompile
const totalBlobGas = NUM_BLOBS * BLOB_GAS_PER_BLOB;
const totalVerificationGas = NUM_BLOBS * VERIFICATION_GAS;
const maxBlobGas = MAX_BLOBS * BLOB_GAS_PER_BLOB;
const maxVerificationGas = MAX_BLOBS * VERIFICATION_GAS;

// Cleanup
KZG.freeTrustedSetup();
