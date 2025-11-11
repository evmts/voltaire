import * as ckzg from "c-kzg";
import { KzgError, KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";

/**
 * Convert blob to KZG commitment
 *
 * Computes polynomial commitment to blob data using KZG scheme.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} blob - Blob data (131072 bytes)
 * @returns {Uint8Array} KZG commitment (48 bytes)
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgInvalidBlobError} If blob is invalid
 * @throws {KzgError} If commitment computation fails
 * @example
 * ```javascript
 * import { blobToKzgCommitment } from './crypto/KZG/index.js';
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
