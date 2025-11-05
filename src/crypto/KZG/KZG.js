// @ts-nocheck
export * from "./errors.ts";
export * from "./constants.js";

import { blobToKzgCommitment } from "./blobToKzgCommitment.js";
import { computeKzgProof } from "./computeKzgProof.js";
import { createEmptyBlob } from "./createEmptyBlob.js";
import { freeTrustedSetup } from "./freeTrustedSetup.js";
import { generateRandomBlob } from "./generateRandomBlob.js";
import { isInitialized } from "./isInitialized.js";
import { loadTrustedSetup } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";
import { verifyBlobKzgProof } from "./verifyBlobKzgProof.js";
import { verifyBlobKzgProofBatch } from "./verifyBlobKzgProofBatch.js";
import { verifyKzgProof } from "./verifyKzgProof.js";

// Export individual functions
export {
	loadTrustedSetup,
	freeTrustedSetup,
	isInitialized,
	validateBlob,
	createEmptyBlob,
	generateRandomBlob,
	blobToKzgCommitment,
	computeKzgProof,
	verifyKzgProof,
	verifyBlobKzgProof,
	verifyBlobKzgProofBatch,
};

/**
 * KZG Commitments for EIP-4844
 *
 * Factory function for KZG operations
 */
export function KZG() {
	throw new Error(
		"KZG is not a constructor. Use KZG.loadTrustedSetup() and other static methods.",
	);
}

// Attach static methods
KZG.loadTrustedSetup = loadTrustedSetup;
KZG.freeTrustedSetup = freeTrustedSetup;
KZG.isInitialized = isInitialized;
KZG.validateBlob = validateBlob;
KZG.createEmptyBlob = createEmptyBlob;
KZG.generateRandomBlob = generateRandomBlob;
KZG.blobToKzgCommitment = blobToKzgCommitment;
KZG.computeKzgProof = computeKzgProof;
KZG.verifyKzgProof = verifyKzgProof;
KZG.verifyBlobKzgProof = verifyBlobKzgProof;
KZG.verifyBlobKzgProofBatch = verifyBlobKzgProofBatch;
