/**
 * KZG Commitments for EIP-4844
 *
 * Available in both native FFI and WASM environments.
 *
 * @see https://voltaire.tevm.sh/crypto/kzg
 * @since 0.0.0
 * @throws {Error} Always throws - use static methods instead
 */
export function KZG(): void;
export namespace KZG {
    export { loadTrustedSetup };
    export { freeTrustedSetup };
    export { isInitialized };
    export { validateBlob };
    export { createEmptyBlob };
    export { generateRandomBlob };
    export { blobToKzgCommitment };
    export { computeKzgProof };
    export { computeBlobKzgProof };
    export { verifyKzgProof };
    export { verifyBlobKzgProof };
    export { verifyBlobKzgProofBatch };
    export { blobToKzgCommitment as Commitment };
    export { computeKzgProof as Proof };
    export { computeBlobKzgProof as BlobProof };
}
export { BlobToKzgCommitment } from "./blobToKzgCommitment.js";
export { ComputeBlobKzgProof } from "./computeBlobKzgProof.js";
export { ComputeKzgProof } from "./computeKzgProof.js";
export * from "./constants.js";
export * from "./errors.js";
export { VerifyBlobKzgProof } from "./verifyBlobKzgProof.js";
export { VerifyBlobKzgProofBatch } from "./verifyBlobKzgProofBatch.js";
export { VerifyKzgProof } from "./verifyKzgProof.js";
/**
 * Instantiate factory functions with WASM bindings
 * These are the concrete implementations using compiled WASM
 */
/**
 * Convert blob to KZG commitment
 * @type {(blob: Uint8Array) => Uint8Array}
 */
export const blobToKzgCommitment: (blob: Uint8Array) => Uint8Array;
/**
 * Compute KZG proof for a blob at a given point
 * @type {(blob: Uint8Array, z: Uint8Array) => { proof: Uint8Array, y: Uint8Array }}
 */
export const computeKzgProof: (blob: Uint8Array, z: Uint8Array) => {
    proof: Uint8Array;
    y: Uint8Array;
};
/**
 * Compute KZG blob proof given commitment
 * @type {(blob: Uint8Array, commitment: Uint8Array) => Uint8Array}
 */
export const computeBlobKzgProof: (blob: Uint8Array, commitment: Uint8Array) => Uint8Array;
/**
 * Verify a KZG proof
 * @type {(commitment: Uint8Array, z: Uint8Array, y: Uint8Array, proof: Uint8Array) => boolean}
 */
export const verifyKzgProof: (commitment: Uint8Array, z: Uint8Array, y: Uint8Array, proof: Uint8Array) => boolean;
/**
 * Verify a KZG blob proof
 * @type {(blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean}
 */
export const verifyBlobKzgProof: (blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean;
/**
 * Verify multiple KZG blob proofs in batch
 * @type {(blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean}
 */
export const verifyBlobKzgProofBatch: (blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean;
import { loadTrustedSetup } from "./loadTrustedSetup.js";
import { freeTrustedSetup } from "./loadTrustedSetup.js";
import { isInitialized } from "./isInitialized.js";
import { validateBlob } from "./validateBlob.js";
import { createEmptyBlob } from "./createEmptyBlob.js";
import { generateRandomBlob } from "./generateRandomBlob.js";
export { validateBlob, createEmptyBlob, generateRandomBlob, loadTrustedSetup, freeTrustedSetup, isInitialized };
//# sourceMappingURL=KZG.d.ts.map