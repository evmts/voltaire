/**
 * KZG Commitments for EIP-4844
 *
 * This module provides KZG commitment operations for Ethereum blobs.
 *
 * @example
 * ```typescript
 * import { KZG } from './KZG/index.js';
 *
 * // Initialize trusted setup (required once)
 * KZG.loadTrustedSetup();
 *
 * // Generate commitment from blob
 * const commitment = KZG.blobToKzgCommitment(blob);
 *
 * // Compute proof at evaluation point
 * const { proof, y } = KZG.computeKzgProof(blob, z);
 *
 * // Verify proof
 * const valid = KZG.verifyKzgProof(commitment, z, y, proof);
 * ```
 */

export { KZG } from "./KZG.js";
export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedBlob.js";
export * from "./BrandedKzgCommitment.js";
export * from "./BrandedKzgProof.js";
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
} from "./KZG.js";
