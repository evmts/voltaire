// @ts-nocheck
/**
 * KZG Commitments for EIP-4844
 *
 * **IMPORTANT: KZG is only available via native FFI, not WASM or pure JavaScript.**
 *
 * The KZG implementation uses the c-kzg-4844 C library compiled via Zig.
 * It requires native bindings and cannot run in browser environments.
 *
 * For browser/WASM environments, use a different KZG implementation or
 * perform KZG operations server-side.
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

// Export utility functions
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

/**
 * Error thrown when KZG operations are attempted without native bindings.
 */
class KZGNotAvailableError extends Error {
	constructor(operation) {
		super(
			`KZG.${operation}() requires native bindings. KZG is not available in WASM or pure JavaScript environments. Use native FFI or perform KZG operations server-side.`,
		);
		this.name = "KZGNotAvailableError";
	}
}

/**
 * Placeholder that throws - native implementation required
 * @param {Uint8Array} _blob
 * @returns {Uint8Array}
 * @throws {KZGNotAvailableError}
 */
export function blobToKzgCommitment(_blob) {
	throw new KZGNotAvailableError("blobToKzgCommitment");
}

/**
 * Placeholder that throws - native implementation required
 * @param {Uint8Array} _blob
 * @param {Uint8Array} _z
 * @returns {{ proof: Uint8Array, y: Uint8Array }}
 * @throws {KZGNotAvailableError}
 */
export function computeKzgProof(_blob, _z) {
	throw new KZGNotAvailableError("computeKzgProof");
}

/**
 * Placeholder that throws - native implementation required
 * @param {Uint8Array} _blob
 * @param {Uint8Array} _commitment
 * @returns {Uint8Array}
 * @throws {KZGNotAvailableError}
 */
export function computeBlobKzgProof(_blob, _commitment) {
	throw new KZGNotAvailableError("computeBlobKzgProof");
}

/**
 * Placeholder that throws - native implementation required
 * @param {Uint8Array} _commitment
 * @param {Uint8Array} _z
 * @param {Uint8Array} _y
 * @param {Uint8Array} _proof
 * @returns {boolean}
 * @throws {KZGNotAvailableError}
 */
export function verifyKzgProof(_commitment, _z, _y, _proof) {
	throw new KZGNotAvailableError("verifyKzgProof");
}

/**
 * Placeholder that throws - native implementation required
 * @param {Uint8Array} _blob
 * @param {Uint8Array} _commitment
 * @param {Uint8Array} _proof
 * @returns {boolean}
 * @throws {KZGNotAvailableError}
 */
export function verifyBlobKzgProof(_blob, _commitment, _proof) {
	throw new KZGNotAvailableError("verifyBlobKzgProof");
}

/**
 * Placeholder that throws - native implementation required
 * @param {Uint8Array[]} _blobs
 * @param {Uint8Array[]} _commitments
 * @param {Uint8Array[]} _proofs
 * @returns {boolean}
 * @throws {KZGNotAvailableError}
 */
export function verifyBlobKzgProofBatch(_blobs, _commitments, _proofs) {
	throw new KZGNotAvailableError("verifyBlobKzgProofBatch");
}

/**
 * KZG Commitments for EIP-4844
 *
 * **Native-only**: KZG operations require native FFI bindings.
 * Not available in WASM or pure JavaScript environments.
 *
 * @see https://voltaire.tevm.sh/crypto/kzg
 * @since 0.0.0
 * @throws {Error} Always throws - use static methods instead
 * @example
 * ```javascript
 * import { KZG } from './crypto/KZG/index.js';
 *
 * // Note: Requires native bindings - will throw in browser/WASM
 * KZG.loadTrustedSetup();
 * const commitment = KZG.blobToKzgCommitment(blob);
 * ```
 */
export function KZG() {
	throw new Error(
		"KZG is not a constructor. Use KZG.loadTrustedSetup() and other static methods. " +
			"Note: KZG requires native bindings and is not available in WASM/browser.",
	);
}

// Attach static methods
KZG.loadTrustedSetup = loadTrustedSetup;
KZG.freeTrustedSetup = freeTrustedSetup;
KZG.isInitialized = isInitialized;
KZG.validateBlob = validateBlob;
KZG.createEmptyBlob = createEmptyBlob;
KZG.generateRandomBlob = generateRandomBlob;

// KZG operations - throw until native bindings loaded
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
