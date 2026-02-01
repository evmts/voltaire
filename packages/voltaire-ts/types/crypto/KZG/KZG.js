// @ts-nocheck
/**
 * KZG Commitments for EIP-4844
 *
 * The KZG implementation uses the c-kzg-4844 C library compiled to WASM.
 * Available in both native and WASM environments.
 *
 * @module
 * @see https://eips.ethereum.org/EIPS/eip-4844
 */
// Export factory functions for dependency injection
export { BlobToKzgCommitment } from "./blobToKzgCommitment.js";
export { ComputeBlobKzgProof } from "./computeBlobKzgProof.js";
export { ComputeKzgProof } from "./computeKzgProof.js";
export * from "./constants.js";
export * from "./errors.js";
export { VerifyBlobKzgProof } from "./verifyBlobKzgProof.js";
export { VerifyBlobKzgProofBatch } from "./verifyBlobKzgProofBatch.js";
export { VerifyKzgProof } from "./verifyKzgProof.js";
// Import WASM bindings
import { kzgBlobToCommitment, kzgComputeBlobProof, kzgComputeProof, kzgVerifyBlobProof, kzgVerifyProof, } from "../../wasm-loader/loader.js";
// Import factory functions
import { BlobToKzgCommitment } from "./blobToKzgCommitment.js";
import { ComputeBlobKzgProof } from "./computeBlobKzgProof.js";
import { ComputeKzgProof } from "./computeKzgProof.js";
// Import utility functions
import { createEmptyBlob } from "./createEmptyBlob.js";
import { generateRandomBlob } from "./generateRandomBlob.js";
import { isInitialized } from "./isInitialized.js";
// Import setup functions
import { freeTrustedSetup, loadTrustedSetup } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";
import { VerifyBlobKzgProof } from "./verifyBlobKzgProof.js";
import { VerifyBlobKzgProofBatch } from "./verifyBlobKzgProofBatch.js";
import { VerifyKzgProof } from "./verifyKzgProof.js";
// Re-export utilities
export { validateBlob, createEmptyBlob, generateRandomBlob };
export { loadTrustedSetup, freeTrustedSetup, isInitialized };
/**
 * Instantiate factory functions with WASM bindings
 * These are the concrete implementations using compiled WASM
 */
/**
 * Convert blob to KZG commitment
 * @type {(blob: Uint8Array) => Uint8Array}
 */
export const blobToKzgCommitment = BlobToKzgCommitment({
    blobToKzgCommitment: kzgBlobToCommitment,
});
/**
 * Compute KZG proof for a blob at a given point
 * @type {(blob: Uint8Array, z: Uint8Array) => { proof: Uint8Array, y: Uint8Array }}
 */
export const computeKzgProof = ComputeKzgProof({
    computeKzgProof: kzgComputeProof,
});
/**
 * Compute KZG blob proof given commitment
 * @type {(blob: Uint8Array, commitment: Uint8Array) => Uint8Array}
 */
export const computeBlobKzgProof = ComputeBlobKzgProof({
    computeBlobKzgProof: kzgComputeBlobProof,
});
/**
 * Verify a KZG proof
 * @type {(commitment: Uint8Array, z: Uint8Array, y: Uint8Array, proof: Uint8Array) => boolean}
 */
export const verifyKzgProof = VerifyKzgProof({
    verifyKzgProof: kzgVerifyProof,
});
/**
 * Verify a KZG blob proof
 * @type {(blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean}
 */
export const verifyBlobKzgProof = VerifyBlobKzgProof({
    verifyBlobKzgProof: kzgVerifyBlobProof,
});
/**
 * Verify multiple KZG blob proofs in batch
 * @type {(blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean}
 */
export const verifyBlobKzgProofBatch = VerifyBlobKzgProofBatch({
    verifyBlobKzgProofBatch: (blobs, commitments, proofs) => {
        // Batch verify by checking each proof
        for (let i = 0; i < blobs.length; i++) {
            if (!kzgVerifyBlobProof(blobs[i], commitments[i], proofs[i])) {
                return false;
            }
        }
        return true;
    },
});
/**
 * KZG Commitments for EIP-4844
 *
 * Available in both native FFI and WASM environments.
 *
 * @see https://voltaire.tevm.sh/crypto/kzg
 * @since 0.0.0
 * @throws {Error} Always throws - use static methods instead
 */
export function KZG() {
    throw new Error("KZG is not a constructor. Use KZG.loadTrustedSetup() and other static methods.");
}
// Attach static methods
KZG.loadTrustedSetup = loadTrustedSetup;
KZG.freeTrustedSetup = freeTrustedSetup;
KZG.isInitialized = isInitialized;
KZG.validateBlob = validateBlob;
KZG.createEmptyBlob = createEmptyBlob;
KZG.generateRandomBlob = generateRandomBlob;
// KZG operations
KZG.blobToKzgCommitment = blobToKzgCommitment;
KZG.computeKzgProof = computeKzgProof;
KZG.computeBlobKzgProof = computeBlobKzgProof;
KZG.verifyKzgProof = verifyKzgProof;
KZG.verifyBlobKzgProof = verifyBlobKzgProof;
KZG.verifyBlobKzgProofBatch = verifyBlobKzgProofBatch;
// Constructor pattern (new API)
KZG.Commitment = blobToKzgCommitment;
KZG.Proof = computeKzgProof;
KZG.BlobProof = computeBlobKzgProof;
