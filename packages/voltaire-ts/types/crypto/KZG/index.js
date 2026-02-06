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
 * // Generate commitment from blob (constructor pattern)
 * const commitment = KZG.Commitment(blob);
 *
 * // Compute proof at evaluation point (constructor pattern)
 * const { proof, y } = KZG.Proof(blob, z);
 *
 * // Verify proof
 * const valid = KZG.verifyKzgProof(commitment, z, y, proof);
 *
 * // Legacy API (deprecated)
 * // const commitment = KZG.blobToKzgCommitment(blob);
 * // const { proof, y } = KZG.computeKzgProof(blob, z);
 * ```
 */
export * from "./BlobType.js";
export * from "./constants.js";
export * from "./errors.js";
// Export factory functions (tree-shakeable)
// Export utility functions and wrappers
export { BlobToKzgCommitment, blobToKzgCommitment, ComputeBlobKzgProof, ComputeKzgProof, computeBlobKzgProof, computeKzgProof, createEmptyBlob, freeTrustedSetup, generateRandomBlob, isInitialized, KZG, loadTrustedSetup, VerifyBlobKzgProof, VerifyBlobKzgProofBatch, VerifyKzgProof, validateBlob, verifyBlobKzgProof, verifyBlobKzgProofBatch, verifyKzgProof, } from "./KZG.js";
export * from "./KzgCommitmentType.js";
export * from "./KzgProofType.js";
