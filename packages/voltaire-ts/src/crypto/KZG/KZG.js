// @ts-nocheck
/**
 * KZG Commitments for EIP-4844
 *
 * The EIP-4844 functions use the c-kzg-4844 C library compiled to WASM.
 * Available in both native and WASM environments.
 *
 * EIP-7594 PeerDAS (`computeCells`, `computeCellsAndKzgProofs`,
 * `verifyCellKzgProofBatch`, `recoverCellsAndKzgProofs`) has no built-in
 * TypeScript backend yet: the WASM loader does not export the C PeerDAS
 * functions. The default exports below throw `KzgNotSupportedError` until it
 * does. To use PeerDAS from TypeScript today, inject a backend (for example
 * the `c-kzg` native package) through the factory functions
 * `ComputeCells`, `ComputeCellsAndKzgProofs`, `VerifyCellKzgProofBatch`, and
 * `RecoverCellsAndKzgProofs`. The Zig API (`peerdas.zig`) calls c-kzg-4844
 * directly and needs no injection.
 *
 * @module
 * @see https://eips.ethereum.org/EIPS/eip-4844
 * @see https://eips.ethereum.org/EIPS/eip-7594
 */

// Export factory functions for dependency injection
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

// Import WASM bindings
import {
	kzgBlobToCommitment,
	kzgComputeBlobProof,
	kzgComputeProof,
	kzgVerifyBlobProof,
	kzgVerifyProof,
} from "../../wasm-loader/loader.js";

// Import factory functions
import { BlobToKzgCommitment } from "./blobToKzgCommitment.js";
import { ComputeBlobKzgProof } from "./computeBlobKzgProof.js";
import { ComputeCells } from "./computeCells.js";
import { ComputeCellsAndKzgProofs } from "./computeCellsAndKzgProofs.js";
import { ComputeKzgProof } from "./computeKzgProof.js";
// Import utility functions
import { createEmptyBlob } from "./createEmptyBlob.js";
import { generateRandomBlob } from "./generateRandomBlob.js";
import { isInitialized } from "./isInitialized.js";

// Import setup functions
import { freeTrustedSetup, loadTrustedSetup } from "./loadTrustedSetup.js";
import { wasmPeerDas } from "./peerDasBackend.js";
import { RecoverCellsAndKzgProofs } from "./recoverCellsAndKzgProofs.js";
import { validateBlob } from "./validateBlob.js";
import { VerifyBlobKzgProof } from "./verifyBlobKzgProof.js";
import { VerifyBlobKzgProofBatch } from "./verifyBlobKzgProofBatch.js";
import { VerifyCellKzgProofBatch } from "./verifyCellKzgProofBatch.js";
import { VerifyKzgProof } from "./verifyKzgProof.js";

// Re-export utilities
export {
	createEmptyBlob,
	freeTrustedSetup,
	generateRandomBlob,
	isInitialized,
	loadTrustedSetup,
	validateBlob,
};

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
 * EIP-7594 PeerDAS: compute all 128 cells of the extended blob
 *
 * Throws `KzgNotSupportedError` until the WASM loader exports PeerDAS.
 * Inject a backend through the matching factory function instead.
 * @type {(blob: Uint8Array) => Uint8Array[]}
 */
export const computeCells = ComputeCells({
	computeCells: wasmPeerDas("kzgComputeCells"),
});

/**
 * EIP-7594 PeerDAS: compute all 128 cells and their KZG proofs
 *
 * Throws `KzgNotSupportedError` until the WASM loader exports PeerDAS.
 * Inject a backend through the matching factory function instead.
 * @type {(blob: Uint8Array) => { cells: Uint8Array[], proofs: Uint8Array[] }}
 */
export const computeCellsAndKzgProofs = ComputeCellsAndKzgProofs({
	computeCellsAndKzgProofs: wasmPeerDas("kzgComputeCellsAndKzgProofs"),
});

/**
 * EIP-7594 PeerDAS: verify a batch of cell KZG proofs
 *
 * Throws `KzgNotSupportedError` until the WASM loader exports PeerDAS.
 * Inject a backend through the matching factory function instead.
 * @type {(commitments: Uint8Array[], cellIndices: number[], cells: Uint8Array[], proofs: Uint8Array[]) => boolean}
 */
export const verifyCellKzgProofBatch = VerifyCellKzgProofBatch({
	verifyCellKzgProofBatch: wasmPeerDas("kzgVerifyCellKzgProofBatch"),
});

/**
 * EIP-7594 PeerDAS: recover all cells and proofs from at least 64 cells
 *
 * Throws `KzgNotSupportedError` until the WASM loader exports PeerDAS.
 * Inject a backend through the matching factory function instead.
 * @type {(cellIndices: number[], cells: Uint8Array[]) => { cells: Uint8Array[], proofs: Uint8Array[] }}
 */
export const recoverCellsAndKzgProofs = RecoverCellsAndKzgProofs({
	recoverCellsAndKzgProofs: wasmPeerDas("kzgRecoverCellsAndKzgProofs"),
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

// KZG operations
KZG.blobToKzgCommitment = blobToKzgCommitment;
KZG.computeKzgProof = computeKzgProof;
KZG.computeBlobKzgProof = computeBlobKzgProof;
KZG.verifyKzgProof = verifyKzgProof;
KZG.verifyBlobKzgProof = verifyBlobKzgProof;
KZG.verifyBlobKzgProofBatch = verifyBlobKzgProofBatch;

// EIP-7594 PeerDAS operations
KZG.computeCells = computeCells;
KZG.computeCellsAndKzgProofs = computeCellsAndKzgProofs;
KZG.verifyCellKzgProofBatch = verifyCellKzgProofBatch;
KZG.recoverCellsAndKzgProofs = recoverCellsAndKzgProofs;

// Constructor pattern (new API)
KZG.Commitment = blobToKzgCommitment;
KZG.Proof = computeKzgProof;
KZG.BlobProof = computeBlobKzgProof;
