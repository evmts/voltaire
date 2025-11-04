import * as ckzg from "c-kzg";
import { BYTES_PER_COMMITMENT } from "./constants.js";
import { KzgError, KzgNotInitializedError } from "./errors.ts";
import { getInitialized } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";

/**
 * Convert blob to KZG commitment
 *
 * Computes polynomial commitment to blob data using KZG scheme.
 *
 * @param {Uint8Array} blob - Blob data (131072 bytes)
 * @returns {Uint8Array} KZG commitment (48 bytes)
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgInvalidBlobError} If blob is invalid
 * @throws {KzgError} If commitment computation fails
 *
 * @example
 * ```typescript
 * const blob = new Uint8Array(131072);
 * const commitment = blobToKzgCommitment(blob);
 * ```
 */
export function blobToKzgCommitment(blob) {
	if (!getInitialized()) {
		throw new KzgNotInitializedError();
	}
	validateBlob(blob);
	try {
		return ckzg.blobToKzgCommitment(blob);
	} catch (error) {
		throw new KzgError(
			`Failed to compute commitment: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
