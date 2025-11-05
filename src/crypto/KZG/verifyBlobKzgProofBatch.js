import * as ckzg from "c-kzg";
import { KzgError, KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";

/**
 * Verify multiple blob KZG proofs (batch verification)
 *
 * More efficient than verifying proofs individually.
 *
 * @param {Uint8Array[]} blobs - Array of blobs
 * @param {Uint8Array[]} commitments - Array of commitments
 * @param {Uint8Array[]} proofs - Array of proofs
 * @returns {boolean} true if all proofs are valid, false otherwise
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgError} If arrays have different lengths or verification fails
 *
 * @example
 * ```typescript
 * const valid = verifyBlobKzgProofBatch(blobs, commitments, proofs);
 * ```
 */
export function verifyBlobKzgProofBatch(blobs, commitments, proofs) {
	if (!getInitialized()) {
		throw new KzgNotInitializedError();
	}
	if (blobs.length !== commitments.length || blobs.length !== proofs.length) {
		throw new KzgError(
			"Blobs, commitments, and proofs arrays must have same length",
		);
	}
	for (const blob of blobs) {
		validateBlob(blob);
	}
	try {
		return ckzg.verifyBlobKzgProofBatch(blobs, commitments, proofs);
	} catch (error) {
		throw new KzgError(
			`Failed to verify batch: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
