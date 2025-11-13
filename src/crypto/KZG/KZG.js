// @ts-nocheck
export * from "./errors.ts";
export * from "./constants.js";

// Export factory functions
export { BlobToKzgCommitment } from "./blobToKzgCommitment.js";
export { ComputeKzgProof } from "./computeKzgProof.js";
export { VerifyKzgProof } from "./verifyKzgProof.js";
export { VerifyBlobKzgProof } from "./verifyBlobKzgProof.js";
export { VerifyBlobKzgProofBatch } from "./verifyBlobKzgProofBatch.js";

// Export utility functions (no factory needed)
import { createEmptyBlob } from "./createEmptyBlob.js";
import { freeTrustedSetup } from "./freeTrustedSetup.js";
import { generateRandomBlob } from "./generateRandomBlob.js";
import { isInitialized } from "./isInitialized.js";
import { loadTrustedSetup } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";

export {
	loadTrustedSetup,
	freeTrustedSetup,
	isInitialized,
	validateBlob,
	createEmptyBlob,
	generateRandomBlob,
};

// Export backward-compatible wrappers with auto-injected c-kzg
import * as ckzg from "c-kzg";
import { BlobToKzgCommitment as BlobToKzgCommitmentFactory } from "./blobToKzgCommitment.js";
import { ComputeKzgProof as ComputeKzgProofFactory } from "./computeKzgProof.js";
import { VerifyBlobKzgProof as VerifyBlobKzgProofFactory } from "./verifyBlobKzgProof.js";
import { VerifyBlobKzgProofBatch as VerifyBlobKzgProofBatchFactory } from "./verifyBlobKzgProofBatch.js";
import { VerifyKzgProof as VerifyKzgProofFactory } from "./verifyKzgProof.js";

/**
 * Convert blob to KZG commitment (with auto-injected c-kzg)
 *
 * For tree-shakeable version without auto-injected c-kzg, use `BlobToKzgCommitment({ blobToKzgCommitment })` factory
 */
export const blobToKzgCommitment = BlobToKzgCommitmentFactory({
	blobToKzgCommitment: ckzg.blobToKzgCommitment,
});

/**
 * Compute KZG proof for blob at evaluation point (with auto-injected c-kzg)
 *
 * For tree-shakeable version without auto-injected c-kzg, use `ComputeKzgProof({ computeKzgProof })` factory
 */
export const computeKzgProof = ComputeKzgProofFactory({
	computeKzgProof: ckzg.computeKzgProof,
});

/**
 * Verify KZG proof (with auto-injected c-kzg)
 *
 * For tree-shakeable version without auto-injected c-kzg, use `VerifyKzgProof({ verifyKzgProof })` factory
 */
export const verifyKzgProof = VerifyKzgProofFactory({
	verifyKzgProof: ckzg.verifyKzgProof,
});

/**
 * Verify blob KZG proof (with auto-injected c-kzg)
 *
 * For tree-shakeable version without auto-injected c-kzg, use `VerifyBlobKzgProof({ verifyBlobKzgProof })` factory
 */
export const verifyBlobKzgProof = VerifyBlobKzgProofFactory({
	verifyBlobKzgProof: ckzg.verifyBlobKzgProof,
});

/**
 * Verify batch of blob KZG proofs (with auto-injected c-kzg)
 *
 * For tree-shakeable version without auto-injected c-kzg, use `VerifyBlobKzgProofBatch({ verifyBlobKzgProofBatch })` factory
 */
export const verifyBlobKzgProofBatch = VerifyBlobKzgProofBatchFactory({
	verifyBlobKzgProofBatch: ckzg.verifyBlobKzgProofBatch,
});

/**
 * KZG Commitments for EIP-4844
 *
 * Factory function for KZG operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {Error} Always throws - use static methods instead
 * @example
 * ```javascript
 * import { KZG } from './crypto/KZG/index.js';
 * // Initialize trusted setup
 * KZG.loadTrustedSetup();
 * // Generate commitment
 * const commitment = KZG.blobToKzgCommitment(blob);
 * ```
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
