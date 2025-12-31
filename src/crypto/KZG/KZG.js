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

export * from "./errors.ts";
export * from "./constants.js";

// Export factory functions for dependency injection
export { BlobToKzgCommitment } from "./blobToKzgCommitment.js";
export { ComputeKzgProof } from "./computeKzgProof.js";
export { ComputeBlobKzgProof } from "./computeBlobKzgProof.js";
export { VerifyKzgProof } from "./verifyKzgProof.js";
export { VerifyBlobKzgProof } from "./verifyBlobKzgProof.js";
export { VerifyBlobKzgProofBatch } from "./verifyBlobKzgProofBatch.js";

// Import WASM wrappers
import {
	kzgBlobToCommitment,
	kzgComputeBlobProof,
	kzgComputeProof,
	kzgFreeTrustedSetup,
	kzgIsInitialized,
	kzgLoadTrustedSetup,
	kzgVerifyBlobProof,
	kzgVerifyProof,
} from "../../wasm-loader/loader.ts";

// Export utility functions
import { createEmptyBlob } from "./createEmptyBlob.js";
import { generateRandomBlob } from "./generateRandomBlob.js";
import { validateBlob } from "./validateBlob.js";

import { KzgError, KzgNotInitializedError } from "./errors.js";

/**
 * Check if KZG is initialized
 * @returns {boolean}
 */
export function isInitialized() {
	return kzgIsInitialized();
}

/**
 * Load KZG trusted setup
 */
export function loadTrustedSetup() {
	kzgLoadTrustedSetup();
}

/**
 * Free KZG trusted setup
 */
export function freeTrustedSetup() {
	kzgFreeTrustedSetup();
}

export { validateBlob, createEmptyBlob, generateRandomBlob };

/**
 * Convert blob to KZG commitment
 * @param {Uint8Array} blob - 131072-byte blob
 * @returns {Uint8Array} 48-byte commitment
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgError} If computation fails
 */
export function blobToKzgCommitment(blob) {
	if (!kzgIsInitialized()) {
		throw new KzgNotInitializedError();
	}
	validateBlob(blob);
	try {
		return kzgBlobToCommitment(blob);
	} catch (error) {
		throw new KzgError(
			`Failed to compute commitment: ${error instanceof Error ? error.message : String(error)}`,
			{
				code: "KZG_COMMITMENT_FAILED",
				context: { blobLength: blob.length },
				docsPath: "/crypto/kzg/blob-to-kzg-commitment#error-handling",
				cause: error instanceof Error ? error : undefined,
			},
		);
	}
}

/**
 * Compute KZG proof for a blob at a given point
 * @param {Uint8Array} blob - 131072-byte blob
 * @param {Uint8Array} z - 32-byte field element (evaluation point)
 * @returns {{ proof: Uint8Array, y: Uint8Array }} Proof and evaluation result
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgError} If computation fails
 */
export function computeKzgProof(blob, z) {
	if (!kzgIsInitialized()) {
		throw new KzgNotInitializedError();
	}
	validateBlob(blob);
	try {
		return kzgComputeProof(blob, z);
	} catch (error) {
		throw new KzgError(
			`Failed to compute proof: ${error instanceof Error ? error.message : String(error)}`,
			{
				code: "KZG_PROOF_FAILED",
				context: { blobLength: blob.length },
				docsPath: "/crypto/kzg/compute-kzg-proof#error-handling",
				cause: error instanceof Error ? error : undefined,
			},
		);
	}
}

/**
 * Compute KZG blob proof given commitment
 * @param {Uint8Array} blob - 131072-byte blob
 * @param {Uint8Array} commitment - 48-byte commitment
 * @returns {Uint8Array} 48-byte proof
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgError} If computation fails
 */
export function computeBlobKzgProof(blob, commitment) {
	if (!kzgIsInitialized()) {
		throw new KzgNotInitializedError();
	}
	validateBlob(blob);
	try {
		return kzgComputeBlobProof(blob, commitment);
	} catch (error) {
		throw new KzgError(
			`Failed to compute blob proof: ${error instanceof Error ? error.message : String(error)}`,
			{
				code: "KZG_BLOB_PROOF_FAILED",
				context: { blobLength: blob.length },
				docsPath: "/crypto/kzg/compute-blob-kzg-proof#error-handling",
				cause: error instanceof Error ? error : undefined,
			},
		);
	}
}

/**
 * Verify a KZG proof
 * @param {Uint8Array} commitment - 48-byte commitment
 * @param {Uint8Array} z - 32-byte field element (evaluation point)
 * @param {Uint8Array} y - 32-byte field element (claimed evaluation)
 * @param {Uint8Array} proof - 48-byte proof
 * @returns {boolean} True if proof is valid
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgError} If verification fails
 */
export function verifyKzgProof(commitment, z, y, proof) {
	if (!kzgIsInitialized()) {
		throw new KzgNotInitializedError();
	}
	// Input type validation
	if (!(commitment instanceof Uint8Array)) {
		throw new KzgError("Invalid commitment: expected Uint8Array", {
			code: "KZG_INVALID_COMMITMENT",
			context: { type: typeof commitment },
			docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
		});
	}
	if (!(z instanceof Uint8Array)) {
		throw new KzgError("Invalid z: expected Uint8Array", {
			code: "KZG_INVALID_INPUT",
			context: { type: typeof z },
			docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
		});
	}
	if (!(y instanceof Uint8Array)) {
		throw new KzgError("Invalid y: expected Uint8Array", {
			code: "KZG_INVALID_INPUT",
			context: { type: typeof y },
			docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
		});
	}
	if (!(proof instanceof Uint8Array)) {
		throw new KzgError("Invalid proof: expected Uint8Array", {
			code: "KZG_INVALID_PROOF",
			context: { type: typeof proof },
			docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
		});
	}
	// Size validation
	if (commitment.length !== 48) {
		throw new KzgError(
			`Invalid commitment length: expected 48, got ${commitment.length}`,
			{
				code: "KZG_INVALID_COMMITMENT",
				context: { length: commitment.length },
				docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
			},
		);
	}
	if (z.length !== 32) {
		throw new KzgError(`Invalid z length: expected 32, got ${z.length}`, {
			code: "KZG_INVALID_INPUT",
			context: { length: z.length },
			docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
		});
	}
	if (y.length !== 32) {
		throw new KzgError(`Invalid y length: expected 32, got ${y.length}`, {
			code: "KZG_INVALID_INPUT",
			context: { length: y.length },
			docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
		});
	}
	if (proof.length !== 48) {
		throw new KzgError(
			`Invalid proof length: expected 48, got ${proof.length}`,
			{
				code: "KZG_INVALID_PROOF",
				context: { length: proof.length },
				docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
			},
		);
	}
	try {
		return kzgVerifyProof(commitment, z, y, proof);
	} catch {
		// Verification failures (invalid points, cryptographic failures) return false
		// This is the expected semantic behavior for a verification function
		return false;
	}
}

/**
 * Verify a KZG blob proof
 * @param {Uint8Array} blob - 131072-byte blob
 * @param {Uint8Array} commitment - 48-byte commitment
 * @param {Uint8Array} proof - 48-byte proof
 * @returns {boolean} True if proof is valid
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgError} If verification fails
 */
export function verifyBlobKzgProof(blob, commitment, proof) {
	if (!kzgIsInitialized()) {
		throw new KzgNotInitializedError();
	}
	validateBlob(blob);
	// Input type validation
	if (!(commitment instanceof Uint8Array)) {
		throw new KzgError("Invalid commitment: expected Uint8Array", {
			code: "KZG_INVALID_COMMITMENT",
			context: { type: typeof commitment },
			docsPath: "/crypto/kzg/verify-blob-kzg-proof#error-handling",
		});
	}
	if (!(proof instanceof Uint8Array)) {
		throw new KzgError("Invalid proof: expected Uint8Array", {
			code: "KZG_INVALID_PROOF",
			context: { type: typeof proof },
			docsPath: "/crypto/kzg/verify-blob-kzg-proof#error-handling",
		});
	}
	try {
		return kzgVerifyBlobProof(blob, commitment, proof);
	} catch {
		// Verification failures (invalid points, cryptographic failures) return false
		return false;
	}
}

/**
 * Verify multiple KZG blob proofs in batch
 * @param {Uint8Array[]} blobs - Array of 131072-byte blobs
 * @param {Uint8Array[]} commitments - Array of 48-byte commitments
 * @param {Uint8Array[]} proofs - Array of 48-byte proofs
 * @returns {boolean} True if all proofs are valid
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgError} If verification fails
 */
export function verifyBlobKzgProofBatch(blobs, commitments, proofs) {
	if (!kzgIsInitialized()) {
		throw new KzgNotInitializedError();
	}
	if (blobs.length !== commitments.length || blobs.length !== proofs.length) {
		throw new KzgError("Arrays must have the same length", {
			code: "KZG_BATCH_LENGTH_MISMATCH",
			context: {
				blobsLength: blobs.length,
				commitmentsLength: commitments.length,
				proofsLength: proofs.length,
			},
			docsPath: "/crypto/kzg/verify-blob-kzg-proof-batch#error-handling",
		});
	}
	// Empty batch is valid
	if (blobs.length === 0) {
		return true;
	}
	// Validate all blobs first (let blob errors bubble up)
	for (let i = 0; i < blobs.length; i++) {
		validateBlob(blobs[i]);
	}
	// Then verify proofs (return false on verification failure)
	for (let i = 0; i < blobs.length; i++) {
		try {
			if (!kzgVerifyBlobProof(blobs[i], commitments[i], proofs[i])) {
				return false;
			}
		} catch {
			// Verification failures return false
			return false;
		}
	}
	return true;
}

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

// Constructor pattern (new API)
KZG.Commitment = blobToKzgCommitment;
KZG.Proof = computeKzgProof;
KZG.BlobProof = computeBlobKzgProof;
