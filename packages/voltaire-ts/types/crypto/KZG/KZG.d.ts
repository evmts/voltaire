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
    export { computeCells };
    export { computeCellsAndKzgProofs };
    export { verifyCellKzgProofBatch };
    export { recoverCellsAndKzgProofs };
    export { blobToKzgCommitment as Commitment };
    export { computeKzgProof as Proof };
    export { computeBlobKzgProof as BlobProof };
}
export { BlobToKzgCommitment } from "./blobToKzgCommitment.js";
export { ComputeBlobKzgProof } from "./computeBlobKzgProof.js";
export { ComputeCells } from "./computeCells.js";
export { ComputeCellsAndKzgProofs } from "./computeCellsAndKzgProofs.js";
export { ComputeKzgProof } from "./computeKzgProof.js";
export * from "./constants.js";
export * from "./errors.js";
export { RecoverCellsAndKzgProofs } from "./recoverCellsAndKzgProofs.js";
export { VerifyBlobKzgProof } from "./verifyBlobKzgProof.js";
export { VerifyBlobKzgProofBatch } from "./verifyBlobKzgProofBatch.js";
export { VerifyCellKzgProofBatch } from "./verifyCellKzgProofBatch.js";
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
/**
 * EIP-7594 PeerDAS: compute all 128 cells of the extended blob
 *
 * Throws `KzgNotSupportedError` until the WASM loader exports PeerDAS.
 * Inject a backend through the matching factory function instead.
 * @type {(blob: Uint8Array) => Uint8Array[]}
 */
export const computeCells: (blob: Uint8Array) => Uint8Array[];
/**
 * EIP-7594 PeerDAS: compute all 128 cells and their KZG proofs
 *
 * Throws `KzgNotSupportedError` until the WASM loader exports PeerDAS.
 * Inject a backend through the matching factory function instead.
 * @type {(blob: Uint8Array) => { cells: Uint8Array[], proofs: Uint8Array[] }}
 */
export const computeCellsAndKzgProofs: (blob: Uint8Array) => {
    cells: Uint8Array[];
    proofs: Uint8Array[];
};
/**
 * EIP-7594 PeerDAS: verify a batch of cell KZG proofs
 *
 * Throws `KzgNotSupportedError` until the WASM loader exports PeerDAS.
 * Inject a backend through the matching factory function instead.
 * @type {(commitments: Uint8Array[], cellIndices: number[], cells: Uint8Array[], proofs: Uint8Array[]) => boolean}
 */
export const verifyCellKzgProofBatch: (commitments: Uint8Array[], cellIndices: number[], cells: Uint8Array[], proofs: Uint8Array[]) => boolean;
/**
 * EIP-7594 PeerDAS: recover all cells and proofs from at least 64 cells
 *
 * Throws `KzgNotSupportedError` until the WASM loader exports PeerDAS.
 * Inject a backend through the matching factory function instead.
 * @type {(cellIndices: number[], cells: Uint8Array[]) => { cells: Uint8Array[], proofs: Uint8Array[] }}
 */
export const recoverCellsAndKzgProofs: (cellIndices: number[], cells: Uint8Array[]) => {
    cells: Uint8Array[];
    proofs: Uint8Array[];
};
import { loadTrustedSetup } from "./loadTrustedSetup.js";
import { freeTrustedSetup } from "./loadTrustedSetup.js";
import { isInitialized } from "./isInitialized.js";
import { validateBlob } from "./validateBlob.js";
import { createEmptyBlob } from "./createEmptyBlob.js";
import { generateRandomBlob } from "./generateRandomBlob.js";
export { createEmptyBlob, freeTrustedSetup, generateRandomBlob, isInitialized, loadTrustedSetup, validateBlob };
//# sourceMappingURL=KZG.d.ts.map