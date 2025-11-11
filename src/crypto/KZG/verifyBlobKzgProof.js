import * as ckzg from "c-kzg";
import { BYTES_PER_COMMITMENT, BYTES_PER_PROOF } from "./constants.js";
import { KzgError, KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";

/**
 * Verify blob KZG proof (optimized for blob verification)
 *
 * Efficient verification that commitment matches blob.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} blob - Blob data (131072 bytes)
 * @param {Uint8Array} commitment - KZG commitment (48 bytes)
 * @param {Uint8Array} proof - KZG proof (48 bytes)
 * @returns {boolean} true if proof is valid, false otherwise
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgInvalidBlobError} If blob is invalid
 * @throws {KzgError} If verification fails
 * @example
 * ```javascript
 * import { verifyBlobKzgProof } from './crypto/KZG/index.js';
 * const valid = verifyBlobKzgProof(blob, commitment, proof);
 * ```
 */
export function verifyBlobKzgProof(blob, commitment, proof) {
	if (!getInitialized()) {
		throw new KzgNotInitializedError();
	}
	validateBlob(blob);
	if (
		!(commitment instanceof Uint8Array) ||
		commitment.length !== BYTES_PER_COMMITMENT
	) {
		throw new KzgError(
			`Commitment must be ${BYTES_PER_COMMITMENT} bytes, got ${commitment instanceof Uint8Array ? commitment.length : "not Uint8Array"}`,
		);
	}
	if (!(proof instanceof Uint8Array) || proof.length !== BYTES_PER_PROOF) {
		throw new KzgError(
			`Proof must be ${BYTES_PER_PROOF} bytes, got ${proof instanceof Uint8Array ? proof.length : "not Uint8Array"}`,
		);
	}
	try {
		return ckzg.verifyBlobKzgProof(blob, commitment, proof);
	} catch (error) {
		throw new KzgError(
			`Failed to verify blob proof: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
