import { BYTES_PER_COMMITMENT, BYTES_PER_PROOF } from "./constants.js";
import { KzgError, KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";

/**
 * Factory: Verify blob KZG proof (optimized for blob verification)
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean} deps.verifyBlobKzgProof - c-kzg verifyBlobKzgProof function
 * @returns {(blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean} Function that verifies blob KZG proof
 *
 * @example
 * ```typescript
 * import { VerifyBlobKzgProof } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const verifyBlobKzgProof = VerifyBlobKzgProof({ verifyBlobKzgProof: ckzg.verifyBlobKzgProof })
 * const valid = verifyBlobKzgProof(blob, commitment, proof)
 * ```
 */
export function VerifyBlobKzgProof({
	verifyBlobKzgProof: ckzgVerifyBlobKzgProof,
}) {
	return function verifyBlobKzgProof(blob, commitment, proof) {
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
			return ckzgVerifyBlobKzgProof(blob, commitment, proof);
		} catch (error) {
			throw new KzgError(
				`Failed to verify blob proof: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	};
}
